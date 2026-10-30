import type { Rational } from './rational'
import * as Q from './rational'

/** Immutable matrix of exact rationals, stored row by row. */
export type Matrix = readonly (readonly Rational[])[]

export function fromNumbers(rows: readonly (readonly (number | bigint | Rational)[])[]): Matrix {
  if (rows.length === 0) throw new RangeError('Matrix needs at least one row')
  const width = rows[0]?.length ?? 0
  if (width === 0) throw new RangeError('Matrix needs at least one column')
  return rows.map((row) => {
    if (row.length !== width) throw new RangeError('Matrix rows must have equal length')
    return row.map((v) => (typeof v === 'object' ? v : Q.rational(v)))
  })
}

export function rowCount(m: Matrix): number {
  return m.length
}

export function columnCount(m: Matrix): number {
  return m[0]?.length ?? 0
}

export function at(m: Matrix, i: number, j: number): Rational {
  const value = m[i]?.[j]
  if (value === undefined) throw new RangeError(`No entry at (${i}, ${j})`)
  return value
}

export function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? Q.ONE : Q.ZERO)))
}

export function equals(a: Matrix, b: Matrix): boolean {
  return (
    rowCount(a) === rowCount(b) &&
    columnCount(a) === columnCount(b) &&
    a.every((row, i) => row.every((v, j) => Q.equals(v, at(b, i, j))))
  )
}

export function transpose(m: Matrix): Matrix {
  return Array.from({ length: columnCount(m) }, (_, j) => m.map((_, i) => at(m, i, j)))
}

export function add(a: Matrix, b: Matrix): Matrix {
  assertSameShape(a, b)
  return a.map((row, i) => row.map((v, j) => Q.add(v, at(b, i, j))))
}

export function scale(k: Rational, m: Matrix): Matrix {
  return m.map((row) => row.map((v) => Q.mul(k, v)))
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  if (columnCount(a) !== rowCount(b)) throw new RangeError('Inner dimensions do not match')
  return a.map((_, i) =>
    Array.from({ length: columnCount(b) }, (_, j) => {
      let sum = Q.ZERO
      for (let k = 0; k < columnCount(a); k++) sum = Q.add(sum, Q.mul(at(a, i, k), at(b, k, j)))
      return sum
    }),
  )
}

/** Elementary row operations, the vocabulary of Gaussian elimination lessons. */
export type RowOperation =
  | { readonly kind: 'swap'; readonly a: number; readonly b: number }
  | { readonly kind: 'scale'; readonly row: number; readonly factor: Rational }
  | {
      readonly kind: 'addMultiple'
      readonly target: number
      readonly source: number
      readonly factor: Rational
    }

export function applyRowOperation(m: Matrix, op: RowOperation): Matrix {
  switch (op.kind) {
    case 'swap':
      return m.map((row, i) => (i === op.a ? rowAt(m, op.b) : i === op.b ? rowAt(m, op.a) : row))
    case 'scale':
      if (Q.isZero(op.factor)) throw new RangeError('Scaling a row by zero is not an elementary operation')
      return m.map((row, i) => (i === op.row ? row.map((v) => Q.mul(op.factor, v)) : row))
    case 'addMultiple':
      if (op.target === op.source) throw new RangeError('Source and target rows must differ')
      return m.map((row, i) =>
        i === op.target ? row.map((v, j) => Q.add(v, Q.mul(op.factor, at(m, op.source, j)))) : row,
      )
  }
}

export interface EliminationStep {
  readonly operation: RowOperation
  readonly result: Matrix
}

export interface Elimination {
  readonly result: Matrix
  readonly steps: readonly EliminationStep[]
  readonly pivotColumns: readonly number[]
}

/**
 * Gauss-Jordan elimination to reduced row echelon form, recording every row operation,
 * so lessons can replay the exact steps. Only the first `columnLimit` columns are used
 * for pivots (for an augmented matrix [A | b], pass the column count of A).
 */
export function rref(m: Matrix, columnLimit: number = columnCount(m)): Elimination {
  let current = m
  const steps: EliminationStep[] = []
  const pivotColumns: number[] = []
  const record = (operation: RowOperation) => {
    current = applyRowOperation(current, operation)
    steps.push({ operation, result: current })
  }

  let pivotRow = 0
  for (let col = 0; col < columnLimit && pivotRow < rowCount(m); col++) {
    let found = -1
    for (let r = pivotRow; r < rowCount(m); r++) {
      if (!Q.isZero(at(current, r, col))) {
        found = r
        break
      }
    }
    if (found === -1) continue
    if (found !== pivotRow) record({ kind: 'swap', a: pivotRow, b: found })
    const pivot = at(current, pivotRow, col)
    if (!Q.equals(pivot, Q.ONE)) record({ kind: 'scale', row: pivotRow, factor: Q.div(Q.ONE, pivot) })
    for (let r = 0; r < rowCount(m); r++) {
      const entry = at(current, r, col)
      if (r !== pivotRow && !Q.isZero(entry)) {
        record({ kind: 'addMultiple', target: r, source: pivotRow, factor: Q.neg(entry) })
      }
    }
    pivotColumns.push(col)
    pivotRow++
  }
  return { result: current, steps, pivotColumns }
}

export function rank(m: Matrix): number {
  return rref(m).pivotColumns.length
}

/** Determinant by fraction-exact elimination. */
export function determinant(m: Matrix): Rational {
  assertSquare(m)
  let current = m
  let det = Q.ONE
  const n = rowCount(m)
  for (let col = 0; col < n; col++) {
    let found = -1
    for (let r = col; r < n; r++) {
      if (!Q.isZero(at(current, r, col))) {
        found = r
        break
      }
    }
    if (found === -1) return Q.ZERO
    if (found !== col) {
      current = applyRowOperation(current, { kind: 'swap', a: col, b: found })
      det = Q.neg(det)
    }
    const pivot = at(current, col, col)
    det = Q.mul(det, pivot)
    for (let r = col + 1; r < n; r++) {
      const entry = at(current, r, col)
      if (!Q.isZero(entry)) {
        current = applyRowOperation(current, {
          kind: 'addMultiple',
          target: r,
          source: col,
          factor: Q.neg(Q.div(entry, pivot)),
        })
      }
    }
  }
  return det
}

/** Inverse via [A | I] -> [I | A^-1]; null when A is singular. */
export function inverse(m: Matrix): Matrix | null {
  assertSquare(m)
  const n = rowCount(m)
  const augmented = augment(m, identity(n))
  const { result, pivotColumns } = rref(augmented, n)
  if (pivotColumns.length < n) return null
  return result.map((row) => row.slice(n))
}

export function augment(a: Matrix, b: Matrix): Matrix {
  if (rowCount(a) !== rowCount(b)) throw new RangeError('Row counts differ')
  return a.map((row, i) => [...row, ...rowAt(b, i)])
}

export type SolutionKind = 'unique' | 'infinite' | 'none'

/** Classifies the system A x = b from the augmented matrix [A | b]. */
export function classifySystem(a: Matrix, b: Matrix): SolutionKind {
  const n = columnCount(a)
  const { result, pivotColumns } = rref(augment(a, b), n)
  const inconsistent = result.some(
    (row) => row.slice(0, n).every(Q.isZero) && row.slice(n).some((v) => !Q.isZero(v)),
  )
  if (inconsistent) return 'none'
  return pivotColumns.length === n ? 'unique' : 'infinite'
}

function rowAt(m: Matrix, i: number): readonly Rational[] {
  const row = m[i]
  if (row === undefined) throw new RangeError(`No row ${i}`)
  return row
}

function assertSquare(m: Matrix): void {
  if (rowCount(m) !== columnCount(m)) throw new RangeError('Matrix must be square')
}

function assertSameShape(a: Matrix, b: Matrix): void {
  if (rowCount(a) !== rowCount(b) || columnCount(a) !== columnCount(b)) {
    throw new RangeError('Matrices must have the same shape')
  }
}
