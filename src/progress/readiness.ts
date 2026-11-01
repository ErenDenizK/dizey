import type { Lesson } from '../content/lessons/types'
import type { LessonRecord } from '../lesson/progress'
import { firstTryScore } from '../lesson/progress'
import { stateOf } from '../lesson/state'

/** How a lesson's cell is coloured on the readiness map. */
export type Readiness = 'none' | 'ok' | 'mid' | 'bad' | 'done'

/** First-try share at or above which a lesson reads as solid, and below which it reads as weak. */
export const SOLID = 0.75
export const WEAK = 0.5

/**
 * Colour of one lesson: by the share of its questions answered right on the first try, counting only
 * the questions met so far. Not started is empty; a finished lesson without questions has no signal.
 */
export function readinessOf(lesson: Lesson, record: LessonRecord | undefined): Readiness {
  if (!record) return 'none'
  const answered = Object.keys(record.answers).length
  if (answered === 0) return stateOf(record) === 'done' ? 'done' : 'none'
  const { correct } = firstTryScore(lesson, record)
  const share = correct / answered
  if (share >= SOLID) return 'ok'
  if (share < WEAK) return 'bad'
  return 'mid'
}

export type Mood = 'neutral' | 'happy' | 'proud'

/** Neutral with nothing finished, happy with some lessons done, proud once any chapter is whole. */
export function moodOf(lessonsDone: number, chaptersDone: number): Mood {
  if (chaptersDone > 0) return 'proud'
  return lessonsDone > 0 ? 'happy' : 'neutral'
}

/** The duo reacts when more is done than the last time Sen was seen. */
export const hasNewProgress = (done: number, seen: number | null): boolean => done > (seen ?? 0)

export function parseSeen(raw: string | null): number | null {
  const value = Number(raw)
  return raw !== null && Number.isInteger(value) && value >= 0 ? value : null
}
