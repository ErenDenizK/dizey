import type { HistoryEntry } from '../exam/store'
import type { LessonRecord } from '../lesson/progress'
import { dayKey } from './daily'
import type { ExamOutcomes } from './mistakes'

export const ACTIVITY_VERSION = 1
/** Recorded days kept (about three years): Sen counts them, so they must not fall away. */
export const ACTIVITY_KEEP = 1100

/** Reads the recorded activity days; anything unreadable or old reads as none. */
export function parseActivity(raw: string | null): string[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return []
    const v = value as Record<string, unknown>
    if (v.v !== ACTIVITY_VERSION || !Array.isArray(v.days)) return []
    return v.days.filter((day): day is string => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day))
  } catch {
    return []
  }
}

export function serializeActivity(days: readonly string[]): string {
  return JSON.stringify({ v: ACTIVITY_VERSION, days: [...days].sort().slice(-ACTIVITY_KEEP) })
}

/** `days` with `date` added (same array when it is already there). */
export function withDay(days: readonly string[], date: Date): readonly string[] {
  const key = dayKey(date)
  return days.includes(key) ? days : [...days, key].sort().slice(-ACTIVITY_KEEP)
}

type Sources = {
  recorded: readonly string[]
  records: Readonly<Record<string, LessonRecord>>
  history: readonly Pick<HistoryEntry, 'finishedAt'>[]
  outcomes: ExamOutcomes
  chapters: Readonly<Record<string, { at: number }>>
}

/**
 * Every day with study activity: the days recorded from now on, plus what older records already hold
 * timestamps for (finished lessons, cleared mistakes, finished tests, graded answers).
 */
export function activityDays({ recorded, records, history, outcomes, chapters }: Sources): Set<string> {
  const days = new Set<string>(recorded)
  const add = (at: unknown) => {
    if (typeof at === 'number' && Number.isFinite(at) && at > 0) days.add(dayKey(new Date(at)))
  }
  for (const record of Object.values(records)) {
    add(record.doneAt)
    for (const at of Object.values(record.cleared ?? {})) add(at)
  }
  for (const entry of history) add(entry.finishedAt)
  for (const outcome of Object.values(outcomes)) add(outcome.at)
  for (const chapter of Object.values(chapters)) add(chapter.at)
  return days
}
