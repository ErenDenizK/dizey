import type { Block } from './types'

/** Small builders that keep question files readable. */

type Rows = readonly (readonly string[])[]

export const text = (value: string): Block => ({ kind: 'text', text: value })

export const matrix = (rows: Rows, label?: string): Block =>
  label === undefined
    ? { kind: 'matrix', delimiter: 'brackets', rows }
    : { kind: 'matrix', delimiter: 'brackets', rows, label }

export const det = (rows: Rows, label?: string): Block =>
  label === undefined
    ? { kind: 'matrix', delimiter: 'bars', rows }
    : { kind: 'matrix', delimiter: 'bars', rows, label }

/** Augmented matrix [A | b] with the bar before the last column. */
export const augmented = (rows: Rows): Block => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  augmentedAt: (rows[0]?.length ?? 1) - 1,
})

export const system = (...equations: string[]): Block => ({ kind: 'system', equations })
