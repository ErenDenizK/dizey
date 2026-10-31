import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { chapterOf } from '../content/path'
import type { SoundEvent } from '../sound/score'

/**
 * The sound a finished lesson earns: finishing a chapter of the path outranks reaching half of all lessons, which
 * outranks a plain lesson end. A lesson finished again only closes with the lesson end.
 */
export function rewardFor(
  lesson: Lesson,
  doneBefore: readonly Lesson[],
  all: readonly Lesson[] = lessons,
): SoundEvent {
  if (doneBefore.includes(lesson)) return 'lessonEnd'
  const done = new Set([...doneBefore, lesson])
  const chapter = chapterOf(lesson)
  if (chapter?.lessons.every((other) => done.has(other))) return 'milestone'
  const half = Math.ceil(all.length / 2)
  if (doneBefore.length < half && done.size >= half) return 'halfway'
  return 'lessonEnd'
}
