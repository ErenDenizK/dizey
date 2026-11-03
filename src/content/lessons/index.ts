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
import { m10ConjugateHermitian } from './m10-conjugate-hermitian'
import { m11RegularSingular } from './m11-regular-singular'
import { r1RowOperations } from './r1-row-operations'
import { r2EchelonForms } from './r2-echelon-forms'
import { r3Rank } from './r3-rank'
import { r4Inverse } from './r4-inverse'
import { s1LinearSystems } from './s1-linear-systems'
import { s2ParametricSystems } from './s2-parametric-systems'
import { s3HomogeneousSystems } from './s3-homogeneous-systems'
import { s4Cramer } from './s4-cramer'
import type { Lesson } from './types'
import { x1BigConnection } from './x1-big-connection'
import { x2ExamTactics } from './x2-exam-tactics'

export type { Beat, Claim, Lesson, Step } from './types'

/**
 * Lessons in study order: each lesson only builds on lessons before it (topic map prerequisites).
 * They were written in exam-weight order (docs/research/past-exam-analysis.md). Ids are stable once merged.
 */
export const lessons: readonly Lesson[] = [
  m1ReadingAMatrix,
  m2MatrixTypes,
  m4MatrixArithmetic,
  m5MatrixProduct,
  m3Trace,
  m6Transpose,
  m7SymmetricAntisymmetric,
  m8PowerClasses,
  m9Orthogonal,
  m10ConjugateHermitian,
  r1RowOperations,
  r2EchelonForms,
  r3Rank,
  d1Determinant,
  d2CofactorExpansion,
  d3DeterminantProperties,
  d4AdjugateInverse,
  m11RegularSingular,
  r4Inverse,
  s1LinearSystems,
  s2ParametricSystems,
  s3HomogeneousSystems,
  s4Cramer,
  x1BigConnection,
  x2ExamTactics,
]
