import { d1Determinant } from './d1-determinant'
import { d2CofactorExpansion } from './d2-cofactor-expansion'
import { d3DeterminantProperties } from './d3-determinant-properties'
import { d4AdjugateInverse } from './d4-adjugate-inverse'
import { m7SymmetricAntisymmetric } from './m7-symmetric-antisymmetric'
import type { Lesson } from './types'

export type { Beat, Claim, Lesson, Step } from './types'

/** Lessons in exam-weight order. Ids are stable once merged. */
export const lessons: readonly Lesson[] = [
  d1Determinant,
  d2CofactorExpansion,
  d3DeterminantProperties,
  d4AdjugateInverse,
  m7SymmetricAntisymmetric,
]
