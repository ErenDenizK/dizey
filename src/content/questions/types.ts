/**
 * Multiple-choice questions for exam practice. English keys, Turkish text.
 * Text may hold short inline TeX between `$...$`; matrices are structured data so the shell can
 * render them with its own component. Matrix entries are plain strings ("-1", "4/3", "2b", "-e+b").
 */

/** Node IDs of docs/curriculum/vize1-topic-map.md. */
export type NodeId =
  | 'M1'
  | 'M2'
  | 'M3'
  | 'M4'
  | 'M5'
  | 'M6'
  | 'M7'
  | 'M8'
  | 'M9'
  | 'M10'
  | 'M11'
  | 'R1'
  | 'R2'
  | 'R3'
  | 'R4'
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'S1'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'X1'

export type OptionKey = 'a' | 'b' | 'c' | 'd' | 'e'

export const optionKeys: readonly OptionKey[] = ['a', 'b', 'c', 'd', 'e']

export type Block =
  | { readonly kind: 'text'; readonly text: string }
  | {
      readonly kind: 'matrix'
      /** "brackets" for a matrix, "bars" for a determinant. */
      readonly delimiter: 'brackets' | 'bars'
      readonly rows: readonly (readonly string[])[]
      /** For an augmented matrix [A | b]: the column index where the bar goes. */
      readonly augmentedAt?: number
      /** Text placed before the matrix, such as "A =". */
      readonly label?: string
    }
  | { readonly kind: 'system'; readonly equations: readonly string[] }

export interface Option {
  readonly key: OptionKey
  readonly content: readonly Block[]
  /** For distractors: the mistake that leads here, as a short English slug (e.g. "k-instead-of-k-power-n"). */
  readonly errorType?: string
  /** For distractors: Turkish feedback naming that mistake. */
  readonly feedback?: string
}

export interface QuestionSource {
  /** Where the item comes from, e.g. "2024-summer-midterm". */
  readonly exam: string
  readonly item: number
  /** Second printed version of the same item ("muadil"). */
  readonly variant?: 2
  /** What we changed from the original and why, in English. Absent when used as printed. */
  readonly correction?: string
}

export interface Question {
  /** Stable forever once merged: attempt records key on it. */
  readonly id: string
  readonly node: NodeId
  /** Further nodes the item touches. */
  readonly alsoNodes?: readonly NodeId[]
  readonly source: QuestionSource
  readonly stem: readonly Block[]
  readonly options: readonly [Option, Option, Option, Option, Option]
  readonly answer: OptionKey
  /** Turkish worked solution, shortest exam-time route first. */
  readonly explanation: string
}
