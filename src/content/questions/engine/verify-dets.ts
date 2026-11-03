import * as Q from '../../../lib/math/rational'
import type { Question } from '../types'
import { rootSet } from './format'
import type { OptionValue } from './types'
import { leibniz, permanent } from './verify-math'
import { evalGrid } from './verify-parse'
import { type Analysis, abs, at, blockRows, int, integerGrid, numeric, sizeLimits } from './verify-shared'

/** Verifier for the first determinant node (D1): Sarrus on 3x3 and the 2x2 formula with k. */

type Models = Record<string, OptionValue[]>

function analyseSarrus(q: Question): Analysis {
  const grid = integerGrid(blockRows(q, 0))
  if (grid.length !== 3 || grid.some((row) => row.length !== 3)) throw new Error('needs a 3x3 determinant')
  const a = (i: number, j: number) => at(grid, i - 1, j - 1)
  const down = a(1, 1) * a(2, 2) * a(3, 3) + a(1, 2) * a(2, 3) * a(3, 1) + a(1, 3) * a(2, 1) * a(3, 2)
  const up = a(1, 3) * a(2, 2) * a(3, 1) + a(1, 1) * a(2, 3) * a(3, 2) + a(1, 2) * a(2, 1) * a(3, 3)
  const truth = leibniz(grid.map((row) => row.map(int)))
  if (!Q.equals(truth, int(down - up))) throw new Error('Sarrus and Leibniz disagree')
  const models: Models = {
    'anti-diagonals-ignored': [numeric(down)],
    'sign-flipped': [numeric(up - down)],
    'diagonals-added': [numeric(down + up)],
    'main-diagonal-only': [numeric(a(1, 1) * a(2, 2) * a(3, 3))],
    'main-diagonals-ignored': [numeric(-up)],
  }
  const limits = [...sizeLimits(truth), ...(abs(truth).num > 100n ? ['determinant above 100'] : [])]
  return { truth: { kind: 'num', value: truth }, models, limits }
}

function analyseTwoParam(q: Question): Analysis {
  const rows = blockRows(q, 0)
  if (rows.length !== 2 || rows.some((row) => row.length !== 2)) throw new Error('needs a 2x2 determinant')
  const range = Array.from({ length: 61 }, (_, i) => i - 30)
  const rootsOf = (value: (k: number) => Q.Rational) => range.filter((k) => Q.isZero(value(k)))
  const roots = rootsOf((k) => leibniz(evalGrid(rows, { k })))
  if (roots.length !== 2) throw new Error(`${roots.length} integer roots instead of 2`)
  const [p, r] = roots as [number, number]
  const plusRoots = rootsOf((k) => permanent(evalGrid(rows, { k })))
  const rs = (values: readonly number[]) => rootSet(values.map(int))
  const models: Models = {
    'negated-roots': [rs([-p, -r])],
    'only-smaller-root': [rs([p])],
    'only-larger-root': [rs([r])],
    'sign-slip-on-smaller-root': [rs([-p, r])],
    'cross-terms-added': plusRoots.length === 2 ? [rs(plusRoots)] : [],
  }
  const limits = [...(Math.abs(p) > 9 || Math.abs(r) > 9 ? ['a root exceeds 9'] : [])]
  return { truth: rs([p, r]), models, limits }
}

export const DET_ANALYSERS: Readonly<Record<string, (q: Question) => Analysis>> = {
  'd1-sarrus': analyseSarrus,
  'd1-two-param': analyseTwoParam,
}
