import type { Lesson } from '../content/lessons/types'
import type { LessonRecord } from './progress'

/** The three states the app can earn today (shell spec: no review states until reviews exist). */
export type LessonState = 'new' | 'current' | 'done'

export function stateOf(record: LessonRecord | undefined): LessonState {
  if (record?.doneAt) return 'done'
  return record?.at ? 'current' : 'new'
}

/** Today's one action: the lesson in progress, else the first not finished, in study order. */
export function upNext(
  lessons: readonly Lesson[],
  records: Readonly<Record<string, LessonRecord>>,
  count: number,
): { main: Lesson | null; after: Lesson[] } {
  const current = lessons.find((lesson) => stateOf(records[lesson.id]) === 'current')
  const open = lessons.filter((lesson) => stateOf(records[lesson.id]) !== 'done' && lesson !== current)
  const main = current ?? open[0] ?? null
  return { main, after: open.filter((lesson) => lesson !== main).slice(0, count) }
}
