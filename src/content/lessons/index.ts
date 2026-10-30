import { d1Determinant } from './d1-determinant'
import type { Lesson } from './types'

export type { Beat, Claim, Lesson, Step } from './types'

/** Lessons in exam-weight order. Ids are stable once merged. */
export const lessons: readonly Lesson[] = [d1Determinant]
