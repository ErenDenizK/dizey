import * as M from '../../../lib/math/matrix'
import * as Q from '../../../lib/math/rational'
import { num } from '../engine/format'
import type { Rng } from '../engine/prng'
import type { DraftDistractor } from '../engine/types'

/** Helpers shared by the generator files. Generators build items; `engine/verify-*.ts` re-checks them. */

export type Ints = number[][]

export const cell = (grid: readonly (readonly number[])[], i: number, j: number): number => grid[i]?.[j] ?? 0

/** `-3` -> `(-3)`: a negative number inside an expression. */
export const paren = (n: number): string => (n < 0 ? `(${n})` : `${n}`)

/** A wrong option whose value is an integer. */
export const wrong = (errorType: string, value: number, feedback: string): DraftDistractor => ({
  value: num(value),
  errorType,
  feedback,
})

/** A wrong option whose value is a fraction of integers (null when it is not a whole number). */
export const wrongRational = (
  errorType: string,
  top: number,
  bottom: number,
  feedback: string,
): DraftDistractor | null =>
  bottom === 0
    ? null
    : { value: num(Q.rational(top, bottom).num, Q.rational(top, bottom).den), errorType, feedback }

export const exact = (top: number, bottom: number): number | null =>
  bottom !== 0 && top % bottom === 0 ? top / bottom : null

/** `[[2,'x'],[-1,'y']], 3` -> `2x-y+3`. */
export function linearForm(terms: readonly (readonly [number, string])[], constant = 0): string {
  let out = ''
  for (const [coef, symbol] of terms) {
    if (coef === 0) continue
    const body = Math.abs(coef) === 1 ? symbol : `${Math.abs(coef)}${symbol}`
    out += coef < 0 ? `-${body}` : out === '' ? body : `+${body}`
  }
  if (constant !== 0 || out === '') out += constant < 0 || out === '' ? `${constant}` : `+${constant}`
  return out
}

export const toStrings = (grid: readonly (readonly number[])[]): string[][] => grid.map((r) => r.map(String))

export const times = (a: readonly (readonly number[])[], b: readonly (readonly number[])[]): Ints =>
  a.map((row) => (b[0] ?? []).map((_, j) => row.reduce((sum, v, k) => sum + v * cell(b, k, j), 0)))

export const flip = (a: readonly (readonly number[])[]): Ints =>
  (a[0] ?? []).map((_, j) => a.map((r) => r[j] ?? 0))

export const randomGrid = (rng: Rng, rows: number, cols: number, lo: number, hi: number): Ints =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => rng.int(lo, hi)))

export const detOf = (grid: readonly (readonly number[])[]): number =>
  Number(M.determinant(M.fromNumbers(grid)).num)

export const rankOf = (grid: readonly (readonly number[])[]): number => M.rank(M.fromNumbers(grid))

/** A rational number as `a/b` is never shown; whole numbers only. */
export const whole = (value: Q.Rational): number | null => (value.den === 1n ? Number(value.num) : null)

/**
 * A 3x3 integer matrix of rank exactly 2 whose third row is a combination of the first two, then one entry
 * is replaced by `k + offset` so that the determinant is linear in k and vanishes at one integer k0.
 * Used by the rank and the parametric-system families.
 */
export interface SingularInK {
  readonly rows: string[][]
  readonly base: Ints
  /** Where k sits (0-based) and the offset written next to it. */
  readonly at: readonly [number, number]
  readonly offset: number
  readonly k0: number
  /** The third base row is alpha * row 1 + beta * row 2. */
  readonly alpha: number
  readonly beta: number
}

export function singularInK(rng: Rng): SingularInK | null {
  for (let tries = 0; tries < 60; tries++) {
    const r1 = Array.from({ length: 3 }, () => rng.int(-3, 4))
    const r2 = Array.from({ length: 3 }, () => rng.int(-3, 4))
    const alpha = rng.pick([1, 1, 2, -1])
    const beta = rng.pick([1, 1, -1, 2, 0])
    const r3 = r1.map((v, j) => alpha * v + beta * (r2[j] ?? 0))
    const base = [r1, r2, r3]
    if (base.some((row) => row.some((v) => Math.abs(v) > 9)) || rankOf(base) !== 2) continue
    const i = rng.int(0, 2)
    const j = rng.int(0, 2)
    const minor = base.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j))
    if (detOf(minor) === 0) continue
    const offset = rng.pick([0, 0, 0, 1, -1, 2])
    const k0 = cell(base, i, j) - offset
    if (k0 === 0) continue
    const rows = toStrings(base)
    ;(rows[i] as string[])[j] = linearForm([[1, 'k']], offset)
    return { rows, base, at: [i, j], offset, k0, alpha, beta }
  }
  return null
}

/** The matrix with k replaced by a number; entries are integers, `k`, `-k`, `k+1` or `k-2`. */
export function gridAtK(rows: readonly (readonly string[])[], k: number): Ints {
  return rows.map((row) =>
    row.map((entry) => {
      const m = /^(-?)k([+-]\d+)?$/.exec(entry)
      return m ? (m[1] === '-' ? -k : k) + Number(m[2] ?? 0) : Number(entry)
    }),
  )
}

const signedConstant = (n: number): string => `${n < 0 ? '-' : '+'} ${Math.abs(n)}`

/** The wrong k values a student reaches from a determinant that is linear in k: shared by rank and system items. */
export function linearKMistakes(
  rows: readonly (readonly string[])[],
  k0: number,
  offset: number,
): DraftDistractor[] {
  const f = (k: number) => detOf(gridAtK(rows, k))
  const coefficient = f(1) - f(0)
  const constant = f(0)
  const plusRow = (k: number) => {
    const grid = gridAtK(rows, k)
    return (grid[0] ?? []).reduce((sum, v, j) => {
      const minor = grid.slice(1).map((row) => row.filter((_, c) => c !== j))
      return sum + v * detOf(minor)
    }, 0)
  }
  const [g0, g1] = [plusRow(0), plusRow(1)]
  const lead = coefficient === 1 ? '' : coefficient === -1 ? '-' : String(coefficient)
  const equation = `$|A| = ${lead}k ${signedConstant(constant)} = 0$`
  const out: (DraftDistractor | null)[] = [
    wrong(
      'negated-root',
      -k0,
      `${equation} denkleminden $${lead}k = ${-constant}$, yani $k = ${k0}$ çıkar; işareti kaçırmışsın.`,
    ),
    wrong(
      'coefficient-as-root',
      coefficient,
      `$${coefficient}$, $k$’nın katsayısı. ${equation} denklemini $k$ için çözmen gerekir.`,
    ),
    wrong(
      'constant-as-root',
      constant,
      `$${constant}$, $|A|$’nın sabit terimi. ${equation} denklemini $k$ için çözmen gerekir.`,
    ),
    g1 === g0 || exact(-g0, g1 - g0) === null
      ? null
      : wrongRational(
          'checkerboard-ignored',
          -g0,
          g1 - g0,
          'Kofaktör işaretlerini ($+\\ -\\ +$) uygulamadan açmışsın; determinant yanlış çıkınca $k$ da yanlış çıkar.',
        ),
    offset === 0
      ? null
      : wrong(
          'offset-ignored',
          k0 + offset,
          `Bu elemanın $k ${signedConstant(offset)}$ olduğunu hesaba katmamışsın: $k ${signedConstant(offset)} = ${k0 + offset}$ ise $k = ${k0}$.`,
        ),
  ]
  return out.filter((d): d is DraftDistractor => d !== null)
}

/** `R_1 + 2R_2`, `-R_1 + R_2`, `2R_1`: a combination of two rows, for explanations. */
export function combination(alpha: number, first: number, beta: number, second: number): string {
  const term = (coef: number, row: number) => `${Math.abs(coef) === 1 ? '' : Math.abs(coef)}R_${row}`
  if (beta === 0) return `${alpha < 0 ? '-' : ''}${term(alpha, first)}`
  return `${alpha < 0 ? '-' : ''}${term(alpha, first)} ${beta < 0 ? '-' : '+'} ${term(beta, second)}`
}
