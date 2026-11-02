import type { HistoryEntry } from '../exam/store'
import type { LessonRecord } from '../lesson/progress'
import { stateOf } from '../lesson/state'
import { activityDays } from './activity'
import type { ExamOutcomes } from './mistakes'

export type ProfileStats = {
  /** Lessons finished. */
  lessons: number
  /** Questions answered: first tries in lessons plus the answered ones of finished tests. */
  answered: number
  /** First tries in lessons that were right. */
  firstTry: number
  /** Distinct study days. */
  days: number
  /** Mistakes fixed in lessons. */
  fixed: number
}

type Sources = {
  records: Readonly<Record<string, LessonRecord>>
  history: readonly HistoryEntry[]
  outcomes: ExamOutcomes
  chapters: Readonly<Record<string, { at: number }>>
  recorded: readonly string[]
}

const count = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0

/** Everything Sen's matrix shows. Each figure only grows with study: nothing here can fall. */
export function profileStats({ records, history, outcomes, chapters, recorded }: Sources): ProfileStats {
  let lessons = 0
  let answered = 0
  let firstTry = 0
  let fixed = 0
  for (const record of Object.values(records)) {
    if (stateOf(record) === 'done') lessons += 1
    const answers = Object.values(record.answers ?? {})
    answered += answers.length
    firstTry += answers.filter((answer) => answer.correct).length
    fixed += Object.keys(record.cleared ?? {}).length
  }
  for (const entry of history) answered += count(entry.correct) + count(entry.wrong)
  const days = activityDays({ recorded, records, history, outcomes, chapters }).size
  return { lessons, answered, firstTry, days, fixed }
}

/** Chapters whose lessons are all done, in whatever order. */
export function chaptersDone(
  records: Readonly<Record<string, LessonRecord>>,
  chapters: readonly { lessons: readonly { id: string }[] }[],
): number {
  return chapters.filter(
    (chapter) =>
      chapter.lessons.length > 0 && chapter.lessons.every((l) => stateOf(records[l.id]) === 'done'),
  ).length
}
