import type { Matrix } from '../../../lib/math/matrix'
import type { Rational } from '../../../lib/math/rational'
import * as Q from '../../../lib/math/rational'

/**
 * Exact math for the verifier, deliberately written without `lib/math/matrix.determinant` (which is
 * elimination, as the generators use): permutation expansion, cofactor expansion, adjugate by cofactors.
 */

export type Grid = readonly (readonly Rational[])[]

export function permutations(n: number): number[][] {
  if (n === 0) return [[]]
  return permutations(n - 1).flatMap((p) =>
    Array.from({ length: n }, (_, at) => [...p.slice(0, at), n - 1, ...p.slice(at)]),
  )
}

function inversions(p: readonly number[]): number {
  let count = 0
  for (let i = 0; i < p.length; i++)
    for (let j = i + 1; j < p.length; j++) if ((p[i] ?? 0) > (p[j] ?? 0)) count++
  return count
}

const cell = (m: Grid, i: number, j: number): Rational => m[i]?.[j] ?? Q.ZERO

/** Leibniz formula: sum over permutations of sign times product. */
export function leibniz(m: Grid, signed = true): Rational {
  const n = m.length
  let total = Q.ZERO
  for (const p of permutations(n)) {
    let term = signed && inversions(p) % 2 === 1 ? Q.rational(-1) : Q.ONE
    p.forEach((col, row) => {
      term = Q.mul(term, cell(m, row, col))
    })
    total = Q.add(total, term)
  }
  return total
}

/** Same sum with every term positive: what a student gets by adding instead of subtracting. */
export const permanent = (m: Grid): Rational => leibniz(m, false)

export function minorMatrix(m: Grid, row: number, col: number): Rational[][] {
  return m.filter((_, i) => i !== row).map((r) => r.filter((_, j) => j !== col))
}

export type Line = { readonly kind: 'row' | 'col'; readonly index: number }

/** The line with the most zeros; ties go to rows before columns, then the lower index. */
export function bestLine(m: Grid): Line {
  const n = m.length
  let best: Line = { kind: 'row', index: 0 }
  let bestZeros = -1
  for (const kind of ['row', 'col'] as const) {
    for (let index = 0; index < n; index++) {
      let zeros = 0
      for (let t = 0; t < n; t++)
        if (Q.isZero(kind === 'row' ? cell(m, index, t) : cell(m, t, index))) zeros++
      if (zeros > bestZeros) {
        best = { kind, index }
        bestZeros = zeros
      }
    }
  }
  return best
}

/**
 * Laplace expansion along `line`. `checkerboard` false drops the (-1)^(i+j) signs; `minorOf` lets a mistaken
 * model compute the minors differently.
 */
export function expand(
  m: Grid,
  line: Line,
  checkerboard = true,
  minorOf: (sub: Grid) => Rational = (sub) =>
    sub.length === 1 ? cell(sub, 0, 0) : expand(sub, bestLine(sub)),
): Rational {
  let total = Q.ZERO
  for (let t = 0; t < m.length; t++) {
    const i = line.kind === 'row' ? line.index : t
    const j = line.kind === 'row' ? t : line.index
    const entry = cell(m, i, j)
    if (Q.isZero(entry)) continue
    const sign = checkerboard && (i + j) % 2 === 1 ? Q.rational(-1) : Q.ONE
    total = Q.add(total, Q.mul(Q.mul(sign, entry), minorOf(minorMatrix(m, i, j))))
  }
  return total
}

/** Adjugate (Ek) by cofactors: transpose of the cofactor matrix. */
export function adjugate(m: Grid): Matrix {
  const n = m.length
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const c = leibniz(minorMatrix(m, j, i))
      return (i + j) % 2 === 1 ? Q.neg(c) : c
    }),
  )
}

/** A non-diagonal integer matrix with determinant `det`: unit-lower times diag(det, 1, ...) times unit-upper. */
export function matrixWithDet(n: number, det: number, salt: number): Matrix {
  const pick = (i: number, j: number) => ((i * 3 + j * 5 + salt * 7) % 5) - 2
  const lower = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? Q.ONE : i > j ? Q.rational(pick(i, j)) : Q.ZERO)),
  )
  const upper = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? Q.ONE : i < j ? Q.rational(pick(j, i) || 1) : Q.ZERO)),
  )
  const diagonal = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? Q.rational(i === 0 ? det : 1) : Q.ZERO)),
  )
  const times = (a: Grid, b: Grid) =>
    a.map(
      (_, i) =>
        b[0]?.map((_, j) => a[i]?.reduce((s, v, k) => Q.add(s, Q.mul(v, cell(b, k, j))), Q.ZERO) ?? Q.ZERO) ??
        [],
    )
  return times(times(lower, diagonal), upper)
}
