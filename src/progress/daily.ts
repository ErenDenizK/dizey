import type { Question } from '../content/questions'

/** Local calendar day as "YYYY-MM-DD" (the day Eren sees, not UTC). */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** FNV-1a: a small stable hash, so the same day always lands on the same index. */
function hash(text: string): number {
  let value = 0x811c9dc5
  for (let at = 0; at < text.length; at += 1) {
    value ^= text.charCodeAt(at)
    value = Math.imul(value, 0x01000193) >>> 0
  }
  return value
}

/**
 * The question of the day: one per calendar day, the same all day. It comes from nodes of lessons already
 * done; with none done yet it comes from the first chapter's nodes; if the bank has nothing there either,
 * from the whole bank. Null only when the bank is empty.
 */
export function pickDaily(
  bank: readonly Question[],
  doneNodes: ReadonlySet<string>,
  firstChapterNodes: ReadonlySet<string>,
  date: Date,
): Question | null {
  const within = (nodes: ReadonlySet<string>) => bank.filter((question) => nodes.has(question.node))
  let pool = within(doneNodes)
  if (!pool.length) pool = within(firstChapterNodes)
  if (!pool.length) pool = [...bank]
  if (!pool.length) return null
  // Sorted by id so a reordered bank does not reshuffle the days.
  pool.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return pool[hash(dayKey(date)) % pool.length] ?? null
}

/** What was answered on one day. */
export type DailyAnswer = { day: string; questionId: string; given: string; correct: boolean }

export const DAILY_VERSION = 1

/** Reads the stored answer; anything unreadable, old or from another day reads as "not answered today". */
export function parseDaily(raw: string | null): DailyAnswer | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const v = value as Record<string, unknown>
    if (v.v !== DAILY_VERSION) return null
    if (typeof v.day !== 'string' || typeof v.questionId !== 'string') return null
    if (typeof v.given !== 'string' || typeof v.correct !== 'boolean') return null
    return { day: v.day, questionId: v.questionId, given: v.given, correct: v.correct }
  } catch {
    return null
  }
}

export function serializeDaily(answer: DailyAnswer): string {
  return JSON.stringify({ v: DAILY_VERSION, ...answer })
}

/** The answer if it was given on `today`, else null. */
export function answeredOn(answer: DailyAnswer | null, today: Date): DailyAnswer | null {
  return answer && answer.day === dayKey(today) ? answer : null
}
