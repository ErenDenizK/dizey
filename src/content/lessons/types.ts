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

export type Beat =
  /** 2×2 rule: main diagonal product, other diagonal product, difference into `result`. */
  | { readonly kind: 'det2'; readonly matrix: string }
  /** Sarrus: copy the first two columns, light the three plus and three minus diagonals, combine. */
  | { readonly kind: 'sarrus'; readonly matrix: string }
  /** Unit square (or cube) carried by the matrix; the area of the image is |det|. */
  | { readonly kind: 'area'; readonly matrix: string }
  /** Cofactor expansion along one row or column. */
  | {
      readonly kind: 'expand'
      readonly matrix: string
      readonly along: 'row' | 'col'
      readonly index: number
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

export type Claim =
  /** det of a lesson matrix, after substituting `at` (e.g. { k: '4' }). Values are exact rationals. */
  | {
      readonly kind: 'det'
      readonly matrix: string
      readonly equals: string
      readonly at?: Readonly<Record<string, string>>
    }
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
