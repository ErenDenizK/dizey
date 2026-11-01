import type { OptionKey, Question } from '../content/questions'
import type { ChapterSetId } from './chapter-test'

/**
 * A timed exam rehearsal in the real Vize 1 format: multiple choice, five options, answers and the
 * key hidden until the end. Pure data; the UI stores it so leaving the app never loses an attempt.
 */
export type ExamSet = { id: 'summer-2024' | 'mixed'; size: number }

export type ExamSession = {
  format: 1
  /** A rehearsal, or a chapter test (`chapter:<chapterId>`, untimed). */
  set: ExamSet['id'] | ChapterSetId
  questionIds: string[]
  answers: Record<string, OptionKey | null>
  flagged: string[]
  current: number
  startedAt: number
  durationMs: number
  finishedAt: number | null
}

export type ExamResult = {
  correct: number
  wrong: number
  blank: number
  total: number
  /** Percentage of correct answers, rounded. */
  percent: number
}

/** The 2024 paper had 18 items; the open-answer papers of 2019 ran 80 minutes. Same pace per item. */
export const MINUTES_PER_ITEM = 80 / 18

export function durationFor(count: number): number {
  return Math.round(count * MINUTES_PER_ITEM) * 60_000
}

/** Deterministic shuffle (mulberry32) so a seed reproduces a paper in tests. */
export function shuffled<T>(items: readonly T[], seed: number): T[] {
  let a = seed >>> 0
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j] as T, copy[i] as T]
  }
  return copy
}

export function examSets(bank: readonly Question[]): ExamSet[] {
  const summer = bank.filter((question) => question.source.exam === '2024-summer-midterm').length
  return [
    { id: 'summer-2024', size: summer },
    { id: 'mixed', size: Math.min(18, bank.length) },
  ]
}

/** The 2024 paper keeps its printed order; a mixed paper draws across the bank. */
export function createSession(
  bank: readonly Question[],
  set: ExamSet['id'],
  now: number,
  seed: number,
): ExamSession {
  const pool =
    set === 'summer-2024'
      ? bank.filter((question) => question.source.exam === '2024-summer-midterm')
      : shuffled(bank, seed).slice(0, 18)
  const questionIds = pool.map((question) => question.id)
  return {
    format: 1,
    set,
    questionIds,
    answers: Object.fromEntries(questionIds.map((id) => [id, null])),
    flagged: [],
    current: 0,
    startedAt: now,
    durationMs: durationFor(questionIds.length),
    finishedAt: null,
  }
}

/** Choosing the chosen option again clears it: leaving an item blank is a real exam strategy. */
export function choose(session: ExamSession, id: string, key: OptionKey): ExamSession {
  const next = session.answers[id] === key ? null : key
  return { ...session, answers: { ...session.answers, [id]: next } }
}

export function toggleFlag(session: ExamSession, id: string): ExamSession {
  const flagged = session.flagged.includes(id)
    ? session.flagged.filter((f) => f !== id)
    : [...session.flagged, id]
  return { ...session, flagged }
}

export function goTo(session: ExamSession, index: number): ExamSession {
  const current = Math.max(0, Math.min(session.questionIds.length - 1, index))
  return { ...session, current }
}

export function remainingMs(session: ExamSession, now: number): number {
  const end = session.finishedAt ?? now
  return Math.max(0, session.durationMs - (end - session.startedAt))
}

export function finish(session: ExamSession, now: number): ExamSession {
  if (session.finishedAt !== null) return session
  return { ...session, finishedAt: Math.min(now, session.startedAt + session.durationMs) }
}

export function score(session: ExamSession, bank: readonly Question[]): ExamResult {
  const byId = new Map(bank.map((question) => [question.id, question]))
  let correct = 0
  let wrong = 0
  let blank = 0
  for (const id of session.questionIds) {
    const chosen = session.answers[id] ?? null
    if (chosen === null) blank++
    else if (byId.get(id)?.answer === chosen) correct++
    else wrong++
  }
  const total = session.questionIds.length
  return { correct, wrong, blank, total, percent: total ? Math.round((correct / total) * 100) : 0 }
}

/** Reads a stored session; anything malformed or from another bank version is dropped. */
export function parseSession(raw: string | null, bank: readonly Question[]): ExamSession | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<ExamSession>
    if (value.format !== 1 || !Array.isArray(value.questionIds) || typeof value.startedAt !== 'number')
      return null
    const known = new Set(bank.map((question) => question.id))
    if (!value.questionIds.every((id) => typeof id === 'string' && known.has(id))) return null
    return value as ExamSession
  } catch {
    return null
  }
}

export type QuestionStatus = 'correct' | 'wrong' | 'blank'

export function statusOf(session: ExamSession, question: Question): QuestionStatus {
  const chosen = session.answers[question.id] ?? null
  if (chosen === null) return 'blank'
  return chosen === question.answer ? 'correct' : 'wrong'
}

/** Where the attempt stands: what the question map and the finish summary show. */
export function tally(session: ExamSession): { answered: number; blank: number; flagged: number } {
  const answered = session.questionIds.filter((id) => session.answers[id]).length
  const flagged = session.questionIds.filter((id) => session.flagged.includes(id)).length
  return { answered, blank: session.questionIds.length - answered, flagged }
}

/**
 * The topics a finished attempt sends the learner back to: every node with a wrong or blank item,
 * most missed first, ties in paper order. A rehearsal is only worth its review.
 */
export function topicsToReview(
  session: ExamSession,
  bank: readonly Question[],
): { node: Question['node']; missed: number; total: number }[] {
  const byId = new Map(bank.map((question) => [question.id, question]))
  const topics = new Map<Question['node'], { node: Question['node']; missed: number; total: number }>()
  for (const id of session.questionIds) {
    const question = byId.get(id)
    if (!question) continue
    const topic = topics.get(question.node) ?? { node: question.node, missed: 0, total: 0 }
    topic.total++
    if (statusOf(session, question) !== 'correct') topic.missed++
    topics.set(question.node, topic)
  }
  return [...topics.values()].filter((topic) => topic.missed > 0).sort((a, b) => b.missed - a.missed)
}

/** Columns of the result seal: whole rows where the count allows, never wider than six cells. */
export function sealColumnsFor(count: number): number {
  if (count <= 6) return Math.max(count, 1)
  for (const cols of [6, 5, 4]) if (count % cols === 0) return cols
  return 6
}

/** Best score per set, for the Sınav cards. */
export function bestBySet(history: readonly { set: ExamSession['set']; percent: number }[]) {
  const best: Partial<Record<string, number>> = {}
  for (const entry of history) best[entry.set] = Math.max(best[entry.set] ?? 0, entry.percent)
  return best
}
