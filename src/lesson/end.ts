import type { Lesson } from '../content/lessons/types'
import type { Chapter } from '../content/path'
import { isQuestion, type LessonRecord } from './progress'

/** A question's cell in the lesson-end seal: right on the first try, missed, or never tried (answer shown). */
export type Result = 'right' | 'miss' | 'unknown'

/** One result per question, in lesson order, from the first try on record (decision 0003). */
export function endResults(lesson: Lesson, record: LessonRecord): Result[] {
  return lesson.steps.filter(isQuestion).map((step) => {
    const answer = record.answers[step.id]
    if (!answer) return 'unknown'
    return answer.correct ? 'right' : 'miss'
  })
}

/** The lesson after this one along the path, or null at the end of the path. */
export function nextLesson(
  lesson: Lesson,
  chapters: readonly Chapter[],
  all: readonly Lesson[],
): Lesson | null {
  const order = chapters.flatMap((chapter) => chapter.lessons)
  const path = order.length ? order : all
  const at = path.indexOf(lesson)
  return at >= 0 ? (path[at + 1] ?? null) : null
}

/** Seal columns: one row up to four cells, then rows of three, or four when that fills the last row better. */
export function sealColumns(count: number): number {
  if (count <= 4) return Math.max(count, 1)
  const gap = (cols: number) => (cols - (count % cols)) % cols
  return gap(4) < gap(3) ? 4 : 3
}
