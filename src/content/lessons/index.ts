import { d1Determinant } from './d1-determinant'
import { d2CofactorExpansion } from './d2-cofactor-expansion'
import { d3DeterminantProperties } from './d3-determinant-properties'
import { d4AdjugateInverse } from './d4-adjugate-inverse'
import { m1ReadingAMatrix } from './m1-reading-a-matrix'
import { m2MatrixTypes } from './m2-matrix-types'
import { m3Trace } from './m3-trace'
import { m4MatrixArithmetic } from './m4-matrix-arithmetic'
import { m5MatrixProduct } from './m5-matrix-product'
import { m6Transpose } from './m6-transpose'
import { m7SymmetricAntisymmetric } from './m7-symmetric-antisymmetric'
import { m8PowerClasses } from './m8-power-classes'
import { m9Orthogonal } from './m9-orthogonal'
import { r4Inverse } from './r4-inverse'
import { s1LinearSystems } from './s1-linear-systems'
import { s2ParametricSystems } from './s2-parametric-systems'
import { s3HomogeneousSystems } from './s3-homogeneous-systems'
import type { Lesson } from './types'

export type { Beat, Claim, Lesson, Step } from './types'

/** Lessons in exam-weight order. Ids are stable once merged. */
export const lessons: readonly Lesson[] = [
  d1Determinant,
  d2CofactorExpansion,
  d3DeterminantProperties,
  d4AdjugateInverse,
  m7SymmetricAntisymmetric,
  m8PowerClasses,
  m9Orthogonal,
  r4Inverse,
  m4MatrixArithmetic,
  m5MatrixProduct,
  s1LinearSystems,
  s2ParametricSystems,
  m3Trace,
  s3HomogeneousSystems,
  m1ReadingAMatrix,
  m2MatrixTypes,
  m6Transpose,
]
