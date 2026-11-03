import * as Q from '../../../lib/math/rational'
import type { Question } from '../types'
import type { OptionValue } from './types'
import { expand, leibniz } from './verify-math'
import { evalGrid } from './verify-parse'
import {
  type Analysis,
  at,
  blockRows,
  int,
  integerGrid,
  n,
  numeric,
  rankByMinors,
  sizeLimits,
  stemOf,
} from './verify-shared'

/**
 * Verifier for row operations (R1) and rank (R3), and the linear-in-k analysis that parametric systems
 * (S2) share. Truths come from search and from minors, never from the generators' construction.
 */

type Models = Record<string, OptionValue[]>

// ------------------------------------------------------------------ r1-ops-entry

type RowOp =
  | { readonly kind: 'swap'; readonly a: number; readonly b: number }
  | { readonly kind: 'add'; readonly a: number; readonly b: number; readonly c: number }
  | { readonly kind: 'scale'; readonly a: number; readonly c: number }

function parseOp(source: string): RowOp {
  const swap = /^R_(\d) \\leftrightarrow R_(\d)$/.exec(source)
  if (swap) return { kind: 'swap', a: Number(swap[1]) - 1, b: Number(swap[2]) - 1 }
  const add = /^R_(\d) \\to R_\1 ([+-]) (\d*)R_(\d)$/.exec(source)
  if (add)
    return {
      kind: 'add',
      a: Number(add[1]) - 1,
      b: Number(add[4]) - 1,
      c: (add[2] === '-' ? -1 : 1) * (add[3] === '' ? 1 : Number(add[3])),
    }
  const scale = /^R_(\d) \\to (-?\d*)R_\1$/.exec(source)
  if (scale) {
    const factor = scale[2] === '-' ? -1 : scale[2] === '' ? 1 : Number(scale[2])
    return { kind: 'scale', a: Number(scale[1]) - 1, c: factor }
  }
  throw new Error(`cannot read the row operation "${source}"`)
}

/** Runs the operations; `frozen`, when given, is where every added row is read from. */
function run(
  start: readonly (readonly number[])[],
  ops: readonly RowOp[],
  frozen?: readonly (readonly number[])[],
) {
  const rows = start.map((r) => [...r])
  for (const op of ops) {
    if (op.kind === 'swap') {
      const held = rows[op.a] ?? []
      rows[op.a] = rows[op.b] ?? []
      rows[op.b] = held
    } else if (op.kind === 'scale') {
      rows[op.a] = (rows[op.a] ?? []).map((v) => v * op.c)
    } else {
      const source = (frozen ?? rows)[op.b] ?? []
      rows[op.a] = (rows[op.a] ?? []).map((v, j) => v + op.c * (source[j] ?? 0))
    }
  }
  return rows
}

function analyseOps(q: Question): Analysis {
  const start = integerGrid(blockRows(q, 0))
  const text = stemOf(q)
  const ops = [...text.matchAll(/\$(R_\d[^$]*)\$/g)].map((m) => parseOp(m[1] as string))
  const ask = /(\d)\. satır (\d)\. sütunundaki eleman kaçtır/.exec(text)
  if (ops.length < 2 || !ask) throw new Error('cannot read the operations or the asked entry')
  const [i, j] = [Number(ask[1]) - 1, Number(ask[2]) - 1]
  const entry = (m: readonly (readonly number[])[], r = i, c = j) => at(m, r, c)
  const final = run(start, ops)
  const firstAdd = ops.findIndex((o) => o.kind === 'add')
  const flipped = ops.map((o, t) => (t === firstAdd && o.kind === 'add' ? { ...o, c: -o.c } : o))
  const models: Models = {
    'reversed-order': [numeric(entry(run(start, [...ops].reverse())))],
    'sign-flipped-multiplier': [numeric(entry(run(start, flipped)))],
    'stale-row-used': [numeric(entry(run(start, ops, start)))],
    'entry-transposed': [numeric(entry(final, j, i))],
    'swap-skipped': ops.some((o) => o.kind === 'swap')
      ? [
          numeric(
            entry(
              run(
                start,
                ops.filter((o) => o.kind !== 'swap'),
              ),
            ),
          ),
        ]
      : [],
  }
  const limits = [
    ...(firstAdd < 0 ? ['no row addition among the operations'] : []),
    ...(ops.length > 3 ? ['more than three operations'] : []),
    ...sizeLimits(int(entry(final))),
    ...(Math.abs(entry(final)) > 30 ? ['result is large for mental work'] : []),
  ]
  return { truth: numeric(entry(final)), models, limits }
}

// ------------------------------------------------------------------ r3-rank-prop

function analyseProportional(q: Question): Analysis {
  const rows = blockRows(q, 0)
  const spots: [number, number][] = []
  for (const [r, row] of rows.entries()) {
    for (const [c, e] of row.entries()) {
      if (e === 'k') spots.push([r, c])
    }
  }
  if (spots.length !== 1) throw new Error('k must appear exactly once')
  const [t, c] = spots[0] as [number, number]
  const withK = (k: number) => evalGrid(rows, { k })
  const works = Array.from({ length: 81 }, (_, i) => i - 40).filter((k) => rankByMinors(withK(k)) === 1)
  if (works.length !== 1) throw new Error(`${works.length} integers k give rank 1`)
  const k = works[0] as number
  const full = withK(k).map((row) => row.map((v) => Number(v.num)))

  let u = -1
  let c0 = -1
  for (let r = 0; r < full.length && u < 0; r++) {
    if (r === t) continue
    for (let col = 0; col < 3; col++)
      if (col !== c && at(full, r, col) !== 0 && at(full, t, col) !== 0) {
        u = r
        c0 = col
        break
      }
  }
  if (u < 0) throw new Error('no reference column')
  const lambda = Q.rational(at(full, t, c0), at(full, u, c0))
  const above = at(full, u, c)
  const models: Models = {
    'copied-from-row': [numeric(above)],
    'additive-pattern': [numeric(above + (at(full, t, c0) - at(full, u, c0)))],
    'ratio-inverted': Q.isZero(lambda) ? [] : [n(Q.div(int(above), lambda))],
    'ratio-added': [n(Q.add(int(above), lambda))],
    negated: lambda.num < 0n ? [numeric(-k)] : [],
  }
  const limits = [
    ...(rows.length > 3 ? ['too many rows'] : []),
    ...(full.some((row) => row.some((v) => Math.abs(v) > 9)) ? ['an entry exceeds one digit'] : []),
  ]
  return { truth: numeric(k), models, limits }
}

// ------------------------------------------------------------------ linear in k (shared with s2)

export interface LinearK {
  readonly k0: number
  readonly offset: number
  readonly models: Models
}

/** For a 3x3 matrix whose determinant is linear in k: the one root and the value of each named slip. */
export function analyseLinearK(rows: readonly (readonly string[])[]): LinearK {
  const det = (k: number) => leibniz(evalGrid(rows, { k }))
  const roots = Array.from({ length: 121 }, (_, i) => i - 60).filter((k) => Q.isZero(det(k)))
  if (roots.length !== 1) throw new Error(`${roots.length} integer k make the matrix singular`)
  const k0 = roots[0] as number
  const coefficient = Q.sub(det(1), det(0))
  const constant = det(0)
  if (Q.isZero(coefficient)) throw new Error('determinant does not depend on k')
  const probe = Q.add(Q.mul(coefficient, int(7)), constant)
  if (!Q.equals(det(7), probe)) throw new Error('determinant is not linear in k')
  if (!Q.equals(Q.div(Q.neg(constant), coefficient), int(k0))) throw new Error('root does not match')
  if (rankByMinors(evalGrid(rows, { k: k0 })) !== 2) throw new Error('rank at the root is not 2')

  const firstRow = (k: number) => expand(evalGrid(rows, { k }), { kind: 'row', index: 0 }, false)
  const [g0, g1] = [firstRow(0), firstRow(1)]
  const offsetEntry = rows.flat().find((e) => /k/.test(e)) ?? 'k'
  const offsetMatch = /^k([+-]\d+)?$/.exec(offsetEntry)
  const offset = Number(offsetMatch?.[1] ?? 0)
  const models: Models = {
    'negated-root': [numeric(-k0)],
    'coefficient-as-root': [n(coefficient)],
    'constant-as-root': [n(constant)],
    'checkerboard-ignored': Q.equals(g0, g1) ? [] : [n(Q.div(Q.neg(g0), Q.sub(g1, g0)))],
    'offset-ignored': offset === 0 ? [] : [numeric(k0 + offset)],
  }
  return { k0, offset, models }
}

function analyseRankK(q: Question): Analysis {
  const rows = blockRows(q, 0)
  if (rows.length !== 3 || rows.some((row) => row.length !== 3)) throw new Error('needs a 3x3 matrix')
  if (!/\\text\{rank\}\(A\) = 2/.test(stemOf(q))) throw new Error('the stem must ask for rank 2')
  const { k0, models } = analyseLinearK(rows)
  return { truth: numeric(k0), models, limits: sizeLimits(int(k0)) }
}

export const ROW_ANALYSERS: Readonly<Record<string, (q: Question) => Analysis>> = {
  'r1-ops-entry': analyseOps,
  'r3-rank-prop': analyseProportional,
  'r3-rank-k': analyseRankK,
}
