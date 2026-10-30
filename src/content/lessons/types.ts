import type { Block, NodeId, Option } from '../questions/types'

/**
 * Lessons: step-by-step reveal scripts. English keys, Turkish text. Data only: no durations or easing
 * (timing belongs to the motion tokens). Every number a step states is listed in `claims`, and
 * the lesson tests recompute each claim with src/lib/math.
 *
 * Text fields may hold inline TeX between `$...$` and highlight markup:
 * `{row}…{/row}` (row colour), `{col}…{/col}` (column colour), `{ok}…{/ok}` (result colour).
 */

export type MatrixBlock = Extract<Block, { kind: 'matrix' }>

/** Cell address in a named matrix: `'*'` selects a whole row or column. Indices are 0-based. */
export type CellRef = readonly [matrix: string, row: number | '*', column: number | '*']

export type Tone = 'row' | 'col' | 'ok'

export interface Mark {
  readonly cell: CellRef
  readonly tone: Tone
}

export interface Frame {
  /** Clear earlier marks before applying this frame's marks. */
  readonly clear?: boolean
  readonly marks?: readonly Mark[]
  /** Short working line shown beside the stage. */
  readonly note?: string
}

/** One elementary row operation, rows 0-based, factors as exact rationals ("-1/4"). Shown as R₂ → R₂ − 3R₁. */
export type RowOp =
  | { readonly kind: 'swap'; readonly a: number; readonly b: number }
  | { readonly kind: 'scale'; readonly row: number; readonly factor: string }
  | {
      readonly kind: 'addMultiple'
      readonly target: number
      readonly source: number
      readonly factor: string
    }

export type Beat =
  /** 2×2 rule: main diagonal product, other diagonal product, difference into `result`. */
  | { readonly kind: 'det2'; readonly matrix: string }
  /** Sarrus: copy the first two columns, light the three plus and three minus diagonals, combine. */
  | { readonly kind: 'sarrus'; readonly matrix: string }
  /** Unit square (or cube) carried by the matrix; the area of the image is |det|. */
  | { readonly kind: 'area'; readonly matrix: string }
  /** Strike out row `row` and column `col` (0-based) and lift the remaining submatrix: the minor M_ij. */
  | { readonly kind: 'minor'; readonly matrix: string; readonly row: number; readonly col: number }
  /** Cofactor expansion along one row or column. */
  | {
      readonly kind: 'expand'
      readonly matrix: string
      readonly along: 'row' | 'col'
      readonly index: number
    }
  /**
   * Row operations applied one at a time to `matrix` (an augmented matrix keeps its bar); the stage
   * ends on the lesson matrix `result`, which the tests check is exactly what the operations produce.
   */
  | {
      readonly kind: 'rowOps'
      readonly matrix: string
      readonly ops: readonly RowOp[]
      readonly result: string
    }
  /** Highlight frames played in order. */
  | { readonly kind: 'frames'; readonly frames: readonly Frame[] }
  /** A chain of equalities written one line at a time. */
  | { readonly kind: 'equation'; readonly lines: readonly string[] }
  | { readonly kind: 'sequence'; readonly beats: readonly Beat[] }

/** What is on the stage: matrix names from `Lesson.matrices`, `=`, and `result` (the answer slot). */
export interface Scene {
  readonly items: readonly string[]
  /** Text shown in the result slot before it is computed, e.g. "?" or "0". */
  readonly result?: string
}

export type Derived = 'cofactors' | 'adjugate' | 'inverse'

/** Matrix classes; `index` is the exact nilpotency index or period (left out: any index or period). */
export type Property =
  | 'symmetric'
  | 'antisymmetric'
  | 'idempotent'
  | 'involutory'
  | 'orthogonal'
  | 'nilpotent'
  | 'periodic'

/**
 * Matrix expressions are written as the lesson prints them: "A^T", "AB - BA", "1/2(M + M^T)", "A^{-1}",
 * "A^2 - 3A + 2I". Names refer to lesson matrices; `where` maps a printed name to a lesson matrix, so a
 * letter-only statement can be checked on a hidden numeric instance (e.g. { A: 'xA' }).
 */
type Where = { readonly where?: Readonly<Record<string, string>> }

/**
 * Mark a claim with `answer: true` when its value is what the step's exercise asks for; a step with a
 * single numeric claim needs no mark.
 */
export type Claim =
  /** det of a lesson matrix, after substituting `at` (e.g. { k: '4' }). Values are exact rationals. */
  | {
      readonly kind: 'det'
      readonly matrix: string
      readonly equals: string
      readonly at?: Readonly<Record<string, string>>
      readonly answer?: true
    }
  /** Minor M_ij or cofactor C_ij; `row` and `col` are 1-based as in the lecturer's notation. */
  | {
      readonly kind: 'minor' | 'cofactor'
      readonly matrix: string
      readonly row: number
      readonly col: number
      readonly equals: string
      readonly answer?: true
    }
  /** det(scalar · F1 F2 … Fn) where each factor is a lesson matrix, optionally transposed or raised to a power (−1 = inverse). */
  | {
      readonly kind: 'detProduct'
      readonly scalar?: string
      readonly factors: readonly {
        readonly matrix: string
        readonly transpose?: true
        readonly power?: number
      }[]
      readonly equals: string
      readonly answer?: true
    }
  /** The cofactor matrix [C_ij], Ek(A) = [C_ij]ᵀ or A⁻¹ of a lesson matrix, in full. */
  | {
      readonly kind: 'derived'
      readonly of: Derived
      readonly matrix: string
      readonly equals: readonly (readonly string[])[]
      readonly answer?: true
    }
  /** One entry (1-based) of a derived matrix. */
  | {
      readonly kind: 'derivedEntry'
      readonly of: Derived
      readonly matrix: string
      readonly row: number
      readonly col: number
      readonly equals: string
      readonly answer?: true
    }
  /** det of a derived matrix, e.g. |Ek(A)|. */
  | {
      readonly kind: 'derivedDet'
      readonly of: Derived
      readonly matrix: string
      readonly equals: string
      readonly answer?: true
    }
  /** A matrix expression, in full. */
  | ({
      readonly kind: 'expr'
      readonly expr: string
      readonly equals: readonly (readonly string[])[]
      readonly answer?: true
    } & Where)
  /** One entry (1-based) of a matrix expression. */
  | ({
      readonly kind: 'exprEntry'
      readonly expr: string
      readonly row: number
      readonly col: number
      readonly equals: string
      readonly answer?: true
    } & Where)
  /** The expression is (or, with `holds: false`, is not) in the class. */
  | ({
      readonly kind: 'property'
      readonly expr: string
      readonly is: Property
      readonly index?: number
      readonly holds?: false
    } & Where)
  /**
   * Choice steps: exactly the answer option is in the class (or, with `holds: false`, exactly the answer
   * is not). Options are matrix blocks or expressions such as "$AB + A$".
   */
  | ({
      readonly kind: 'optionProperty'
      readonly is: Property
      readonly index?: number
      readonly holds?: false
    } & Where)
  /** Choice steps: exactly the answer option (an expression such as "$\\frac{1}{3}(5I - 2A^2)$") equals `expr`. */
  | ({ readonly kind: 'optionExpr'; readonly expr: string } & Where)
  /** The scalar unknown `{variable}` makes the expression the zero matrix exactly at `equals`. */
  | ({
      readonly kind: 'solve'
      readonly expr: string
      readonly variable: string
      readonly equals: string
      readonly answer?: true
    } & Where)
  /** The values of `variable` for which det is 0, exactly (checked on a dense rational grid). */
  | {
      readonly kind: 'detRoots'
      readonly matrix: string
      readonly variable: string
      readonly roots: readonly string[]
    }
  /** Sums of the plus and minus diagonals in Sarrus' rule. */
  | { readonly kind: 'sarrus'; readonly matrix: string; readonly plus: string; readonly minus: string }

interface StepBase {
  /** Stable forever once merged: resume points and answer records key on it. */
  readonly id: string
  readonly eyebrow: string
  readonly title: string
  readonly body?: string
  readonly scene?: Scene
  readonly claims?: readonly Claim[]
}

export interface ExplainStep extends StepBase {
  readonly kind: 'explain'
  readonly beat?: Beat
}

export interface ChoiceStep extends StepBase {
  readonly kind: 'choice'
  /** Skill tag for the error log and spaced review (decision 0003). */
  readonly skill: string
  readonly options: readonly Option[]
  readonly answer: Option['key']
  /** Played after the answer, whichever option was picked. */
  readonly reveal?: Beat
  /** Shown with the reveal: the short worked solution. */
  readonly solution: string
}

export interface KeypadStep extends StepBase {
  readonly kind: 'keypad'
  readonly skill: string
  /** Exact rational as text: "11", "-4/3". */
  readonly answer: string
  readonly feedbackWrong: string
  readonly reveal?: Beat
  readonly solution: string
}

export interface SummaryStep extends StepBase {
  readonly kind: 'summary'
  readonly points: readonly string[]
}

export type Step = ExplainStep | ChoiceStep | KeypadStep | SummaryStep

export interface Lesson {
  /** Stable forever once merged. */
  readonly id: string
  readonly node: NodeId
  readonly title: string
  readonly matrices: Readonly<Record<string, MatrixBlock>>
  readonly steps: readonly Step[]
}
