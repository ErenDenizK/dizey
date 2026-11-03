import type { Claim, MatrixBlock } from '../lessons/types'

/**
 * Night-before-the-exam summaries: one page per lesson and one formula sheet. English keys, Turkish text.
 * Text fields hold inline TeX between `$...$` and the lesson highlight markup `{ok}…{/ok}`. Every number a
 * summary's example states is a claim the tests recompute with src/lib/math (summaries.test.ts), and every
 * formula marked with a `law` is checked on concrete matrices.
 */

/** A tiny worked example: matrices to draw, one line to read off them, and the claims behind every number. */
export interface SummaryExample {
  readonly matrices: Readonly<Record<string, MatrixBlock>>
  /** Matrix names drawn, in order. */
  readonly show: readonly string[]
  readonly line: string
  readonly claims: readonly Claim[]
}

export interface Summary {
  /** One line: what the lesson is about. */
  readonly gist: string
  /** The definitions, formulas and rules to remember, one per line. */
  readonly points: readonly string[]
  /** The classic exam trap. */
  readonly trap: string
  readonly example?: SummaryExample
}

/** An identity the tests check on concrete matrices (formulas.test.ts keeps the table). */
export type LawId =
  | 'sum-transpose'
  | 'scalar-transpose'
  | 'product-transpose'
  | 'trace-product'
  | 'trace-transpose'
  | 'idempotent-power'
  | 'involutory-inverse'
  | 'orthogonal-inverse'
  | 'orthogonal-det'
  | 'conjugate-product'
  | 'swap-det'
  | 'scale-det'
  | 'add-det'
  | 'rank-transpose'
  | 'rank-bound'
  | 'triangular-det'
  | 'laplace'
  | 'product-det'
  | 'transpose-det'
  | 'scalar-det'
  | 'inverse-det'
  | 'adjugate-identity'
  | 'adjugate-det'
  | 'inverse-formula'
  | 'inverse-2x2'
  | 'inverse-product'
  | 'inverse-transpose'
  | 'inverse-scalar'
  | 'gauss-jordan-inverse'
  | 'inverse-solution'
  | 'cramer'
  | 'free-variables'
  | 'homogeneous-wide'
  | 'big-connection'

/** One line of the formula sheet: the formula, a short Turkish reading of it, and the check behind it. */
export interface Formula {
  readonly tex: string
  readonly note?: string
  readonly law?: LawId
}

export interface FormulaGroup {
  readonly id: string
  readonly title: string
  readonly formulas: readonly Formula[]
}
