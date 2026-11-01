import { useSyncExternalStore } from 'react'
import { questions } from '../content/questions'
import { appStorage } from '../lib/storage/app-storage'
import type { ExamOutcomes } from '../progress/mistakes'
import { chapterIdOf, isChapterSet } from './chapter-test'
import { type ExamResult, type ExamSession, finish, parseSession, score } from './session'

const CURRENT = 'dizey.exam.current'
const HISTORY = 'dizey.exam.history'
const OUTCOMES = 'dizey.exam.outcomes'
const CHAPTERS = 'dizey.exam.chapters'

export type HistoryEntry = ExamResult & { set: ExamSession['set']; finishedAt: number; usedMs: number }

/** The latest finished test of each chapter. Kept apart from the rehearsal history, which stays rehearsals. */
export type ChapterResults = Record<string, { correct: number; total: number; at: number }>

type Snapshot = {
  session: ExamSession | null
  history: HistoryEntry[]
  outcomes: ExamOutcomes
  chapters: ChapterResults
}

function readChapters(): ChapterResults {
  try {
    const value: unknown = JSON.parse(appStorage.getItem(CHAPTERS) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as ChapterResults) : {}
  } catch {
    return {}
  }
}

function readOutcomes(): ExamOutcomes {
  try {
    const value: unknown = JSON.parse(appStorage.getItem(OUTCOMES) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as ExamOutcomes) : {}
  } catch {
    return {}
  }
}

/** Latest graded answer per question; a blank leaves the earlier outcome alone. */
export function mergeOutcomes(outcomes: ExamOutcomes, session: ExamSession, at: number): ExamOutcomes {
  const next = { ...outcomes }
  const byId = new Map(questions.map((question) => [question.id, question]))
  for (const id of session.questionIds) {
    const given = session.answers[id] ?? null
    const question = byId.get(id)
    if (!question || given === null) continue
    next[id] = { correct: given === question.answer, given, at }
  }
  return next
}

function readHistory(): HistoryEntry[] {
  try {
    const value: unknown = JSON.parse(appStorage.getItem(HISTORY) ?? '[]')
    return Array.isArray(value) ? (value as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function read(): Snapshot {
  return {
    session: parseSession(appStorage.getItem(CURRENT), questions),
    history: readHistory(),
    outcomes: readOutcomes(),
    chapters: readChapters(),
  }
}

let snapshot = read()
const listeners = new Set<() => void>()

// Another tab saved: take its state, so this tab never writes a stale copy back.
for (const key of [CURRENT, HISTORY, OUTCOMES, CHAPTERS])
  appStorage.watch(key, () => {
    snapshot = read()
    for (const listener of listeners) listener()
  })

function commit(
  session: ExamSession | null,
  history = snapshot.history,
  outcomes = snapshot.outcomes,
  chapters = snapshot.chapters,
) {
  if (session) appStorage.setItem(CURRENT, JSON.stringify(session))
  else appStorage.removeItem(CURRENT)
  appStorage.setItem(HISTORY, JSON.stringify(history))
  if (outcomes !== snapshot.outcomes) appStorage.setItem(OUTCOMES, JSON.stringify(outcomes))
  if (chapters !== snapshot.chapters) appStorage.setItem(CHAPTERS, JSON.stringify(chapters))
  snapshot = { session, history, outcomes, chapters }
  for (const listener of listeners) listener()
}

export function useExam(): Snapshot {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => snapshot,
  )
}

export function saveSession(session: ExamSession) {
  commit(session)
}

/** Ends the attempt, records it in the history and keeps it for review. */
export function endSession(now: number) {
  const session = snapshot.session
  if (!session || session.finishedAt !== null) return
  const done = finish(session, now)
  const at = done.finishedAt ?? now
  const outcomes = mergeOutcomes(snapshot.outcomes, done, at)
  if (isChapterSet(done.set)) {
    // A chapter test is not a rehearsal: it leaves the history alone and only marks its chapter's cell.
    const { correct, total } = score(done, questions)
    const chapters = { ...snapshot.chapters, [chapterIdOf(done.set)]: { correct, total, at } }
    commit(done, snapshot.history, outcomes, chapters)
    return
  }
  const entry: HistoryEntry = {
    ...score(done, questions),
    set: done.set,
    finishedAt: done.finishedAt ?? now,
    usedMs: (done.finishedAt ?? now) - done.startedAt,
  }
  commit(done, [entry, ...snapshot.history].slice(0, 20), outcomes)
}

export function discardSession() {
  commit(null)
}
