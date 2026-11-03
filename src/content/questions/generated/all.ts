import type { Family } from '../engine/types'
import type { Question } from '../types'
import { determinantFamilies, determinantQuestions } from './determinant'
import { determinantBasicFamilies, determinantBasicQuestions } from './determinant-basics'
import { matrixFamilies, matrixQuestions } from './matrices'
import { rowOperationFamilies, rowOperationQuestions } from './row-operations'
import { systemFamilies, systemQuestions } from './systems'

/** Every generated family and every committed generated item, in bank order. */
export const generatedFamilies: readonly Family[] = [
  ...determinantFamilies,
  ...matrixFamilies,
  ...rowOperationFamilies,
  ...determinantBasicFamilies,
  ...systemFamilies,
]

export const generatedQuestions: readonly Question[] = [
  ...determinantQuestions,
  ...matrixQuestions,
  ...rowOperationQuestions,
  ...determinantBasicQuestions,
  ...systemQuestions,
]
