import type { Rational } from '../../../lib/math/rational'
import * as Q from '../../../lib/math/rational'
import type { Question } from '../types'
import type { OptionValue } from './types'
import { matrixBlocks, stemTexts } from './verify-parse'

/** What the verifier concludes about one generated question: the truth, each mistake's value, phone limits. */
export interface Analysis {
  readonly truth: OptionValue
  readonly models: Readonly<Record<string, readonly OptionValue[]>>
  readonly limits: readonly string[]
}

export const n = (value: Rational): OptionValue => ({ kind: 'num', value })
export const int = (value: number): Rational => Q.rational(value)
export const abs = (v: Rational): Rational => (v.num < 0n ? Q.neg(v) : v)
export const numeric = (value: number): OptionValue => n(int(value))

export function sizeLimits(truth: Rational, extra: readonly string[] = []): string[] {
  const out = [...extra]
  if (abs(truth).num > 200n) out.push(`|answer| ${Q.format(truth)} exceeds 200`)
  if (truth.den > 64n) out.push(`answer ${Q.format(truth)} has a large denominator`)
  return out
}

export const stemOf = (q: Question) => stemTexts(q).join(' ')

/** Matrix block `index` of the stem as plain strings. */
export function blockRows(q: Question, index: number): readonly (readonly string[])[] {
  const block = matrixBlocks(q.stem)[index]
  if (!block) throw new Error(`stem has no matrix number ${index + 1}`)
  return block.rows
}

/** Integers of a purely numeric matrix block. */
export function integerGrid(rows: readonly (readonly string[])[]): number[][] {
  return rows.map((row) =>
    row.map((entry) => {
      if (!/^-?\d+$/.test(entry)) throw new Error(`entry "${entry}" is not an integer`)
      return Number(entry)
    }),
  )
}

export const at = (grid: readonly (readonly number[])[], i: number, j: number): number => grid[i]?.[j] ?? 0

export const transposed = (grid: readonly (readonly number[])[]): number[][] =>
  (grid[0] ?? []).map((_, j) => grid.map((row) => row[j] ?? 0))

export const multiplied = (
  a: readonly (readonly number[])[],
  b: readonly (readonly number[])[],
): number[][] =>
  a.map((row) => (b[0] ?? []).map((_, j) => row.reduce((sum, v, k) => sum + v * at(b, k, j), 0)))

/** The integer value of a rule such as `2i - j`, `i^2 + j`, `3i - 2j`: a tiny reader for the m1-rule stems. */
export function evalRule(source: string, i: number, j: number): number {
  const compact = source.replace(/\s+/g, '')
  const tokens = compact.match(/\\cdot|\d+|[ij]|[+\-^]/g) ?? []
  if (tokens.join('') !== compact) throw new Error(`cannot read the rule "${source}"`)
  let pos = 0
  const isFactor = (t: string | undefined) => t !== undefined && /^(\d+|[ij])$/.test(t)
  const atom = (): number => {
    const t = tokens[pos++]
    let value: number
    if (t === 'i') value = i
    else if (t === 'j') value = j
    else if (t !== undefined && /^\d+$/.test(t)) value = Number(t)
    else throw new Error(`unexpected "${t}" in "${source}"`)
    if (tokens[pos] === '^') {
      pos++
      value **= Number(tokens[pos++])
    }
    return value
  }
  const term = (): number => {
    let value = atom()
    while (tokens[pos] === '\\cdot' || isFactor(tokens[pos])) {
      if (tokens[pos] === '\\cdot') pos++
      value *= atom()
    }
    return value
  }
  let sign = 1
  if (tokens[pos] === '-') {
    pos++
    sign = -1
  }
  let total = sign * term()
  while (pos < tokens.length) {
    const op = tokens[pos++]
    const t = term()
    total = op === '+' ? total + t : total - t
  }
  return total
}

/** Rank by the largest nonzero minor, written without elimination. */
export function rankByMinors(grid: readonly (readonly Rational[])[]): number {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const subsets = (count: number, size: number): number[][] =>
    size === 0
      ? [[]]
      : Array.from({ length: count }, (_, first) => first).flatMap((first) =>
          subsets(count - first - 1, size - 1).map((rest) => [first, ...rest.map((r) => r + first + 1)]),
        )
  for (let size = Math.min(rows, cols); size >= 1; size--) {
    for (const r of subsets(rows, size))
      for (const c of subsets(cols, size)) {
        const sub = r.map((i) => c.map((j) => grid[i]?.[j] ?? Q.ZERO))
        if (!Q.isZero(determinantByExpansion(sub))) return size
      }
  }
  return 0
}

function determinantByExpansion(m: readonly (readonly Rational[])[]): Rational {
  if (m.length === 1) return m[0]?.[0] ?? Q.ZERO
  let total = Q.ZERO
  for (let j = 0; j < m.length; j++) {
    const entry = m[0]?.[j] ?? Q.ZERO
    if (Q.isZero(entry)) continue
    const minor = m.slice(1).map((row) => row.filter((_, c) => c !== j))
    const term = Q.mul(entry, determinantByExpansion(minor))
    total = j % 2 === 0 ? Q.add(total, term) : Q.sub(total, term)
  }
  return total
}
