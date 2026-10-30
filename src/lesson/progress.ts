import type { Lesson, Step } from '../content/lessons/types'
import { equals, parse } from '../lib/math/rational'

/** One lesson's stored progress. Keys are step ids, never indices, so edited lessons keep it. */
export type LessonRecord = {
  /** Step to resume at; null when the lesson was finished or never opened. */
  at: string | null
  doneAt: number | null
  /** First answer per question step: what was given and whether it was right. */
  answers: Record<string, { given: string; correct: boolean }>
  /** Steps whose wrong first try was later fixed by a right first try on another visit (mistake log). */
  cleared?: Record<string, number>
}

export const emptyRecord: LessonRecord = { at: null, doneAt: null, answers: {} }

export function resumeIndex(lesson: Lesson, record: LessonRecord): number {
  if (!record.at) return 0
  const index = lesson.steps.findIndex((step) => step.id === record.at)
  return Math.max(index, 0)
}

export function isQuestion(step: Step): step is Extract<Step, { kind: 'choice' | 'keypad' }> {
  return step.kind === 'choice' || step.kind === 'keypad'
}

/** Keypad answers compare as exact rationals: "-8/6" equals "-4/3". */
export function checkKeypad(answer: string, given: string): boolean {
  const expected = parse(answer)
  const value = parse(given.replace('−', '-'))
  return Boolean(expected && value && equals(expected, value))
}

/** Only the first try counts for the record (decision 0003: honest scores). */
export function recordAnswer(
  record: LessonRecord,
  stepId: string,
  given: string,
  correct: boolean,
): LessonRecord {
  if (record.answers[stepId]) return record
  return { ...record, answers: { ...record.answers, [stepId]: { given, correct } } }
}

/**
 * Records a try. The first try of all is kept for the score; a right answer on the first try of a later
 * visit clears an earlier mistake from the log.
 */
export function recordTry(
  record: LessonRecord,
  stepId: string,
  given: string,
  correct: boolean,
  firstThisVisit: boolean,
  now: number,
): LessonRecord {
  const earlier = record.answers[stepId]
  if (!earlier) return recordAnswer(record, stepId, given, correct)
  if (!earlier.correct && correct && firstThisVisit && !record.cleared?.[stepId]) {
    return { ...record, cleared: { ...record.cleared, [stepId]: now } }
  }
  return record
}

export function firstTryScore(lesson: Lesson, record: LessonRecord): { correct: number; total: number } {
  const questions = lesson.steps.filter(isQuestion)
  return {
    correct: questions.filter((step) => record.answers[step.id]?.correct).length,
    total: questions.length,
  }
}
