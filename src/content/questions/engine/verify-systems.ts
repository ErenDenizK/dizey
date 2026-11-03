import * as Q from '../../../lib/math/rational'
import type { Question } from '../types'
import type { OptionValue } from './types'
import { evalGrid } from './verify-parse'
import { analyseLinearK } from './verify-rows'
import {
  type Analysis,
  at,
  blockRows,
  int,
  integerGrid,
  numeric,
  rankByMinors,
  sizeLimits,
  stemOf,
} from './verify-shared'

/**
 * Verifier for parametric systems (S2). Ranks come from minors, k from a search, and the right-hand side
 * is read back from the displayed column.
 */

type Models = Record<string, OptionValue[]>

const rationalGrid = (grid: readonly (readonly number[])[]) => grid.map((row) => row.map(int))

function analyseKSystem(q: Question): Analysis {
  const rows = blockRows(q, 0)
  const b = integerGrid(blockRows(q, 1))
  if (
    rows.length !== 3 ||
    rows.some((r) => r.length !== 3) ||
    b.length !== 3 ||
    b.some((r) => r.length !== 1)
  )
    throw new Error('needs a 3x3 matrix and a 3x1 column')
  const text = stemOf(q)
  const infinite = /sonsuz çözümü olması/.test(text)
  if (!infinite && !/çözümü olmaması/.test(text)) throw new Error('cannot read which outcome is asked')
  const { k0, models } = analyseLinearK(rows)
  const coefficients = evalGrid(rows, { k: k0 })
  const augmented = coefficients.map((row, i) => [...row, int(at(b, i, 0))])
  const [rA, rB] = [rankByMinors(coefficients), rankByMinors(augmented)]
  if (rA !== 2) throw new Error(`r_A is ${rA} at the root`)
  if (infinite && rB !== 2) throw new Error(`asked for infinitely many solutions but r_B is ${rB}`)
  if (!infinite && rB !== 3) throw new Error(`asked for no solution but r_B is ${rB}`)
  return { truth: numeric(k0), models, limits: sizeLimits(int(k0)) }
}

function analyseBParam(q: Question): Analysis {
  const a = integerGrid(blockRows(q, 0))
  const bRows = blockRows(q, 1)
  if (a.length !== 3 || a.some((r) => r.length !== 3) || bRows.length !== 3)
    throw new Error('needs a 3x3 matrix and a 3x1 column')
  if (!/sonsuz çözümü olması/.test(stemOf(q)))
    throw new Error('only the infinitely many solutions form is supported')
  const t = bRows.findIndex((r) => r[0] === 'k')
  if (t < 0 || bRows.filter((r) => r[0] === 'k').length !== 1) throw new Error('k must appear once in b')
  if (rankByMinors(rationalGrid(a)) !== 2) throw new Error('A must have rank 2')
  const [u, v] = [0, 1, 2].filter((r) => r !== t) as [number, number]
  if (rankByMinors(rationalGrid([a[u] ?? [], a[v] ?? []])) !== 2)
    throw new Error('the other two rows must be independent')

  const found: [number, number][] = []
  for (let alpha = -4; alpha <= 4; alpha++)
    for (let beta = -4; beta <= 4; beta++)
      if ((a[t] ?? []).every((x, j) => x === alpha * at(a, u, j) + beta * at(a, v, j)))
        found.push([alpha, beta])
  if (found.length !== 1) throw new Error(`${found.length} ways to write the dependent row`)
  const [alpha, beta] = found[0] as [number, number]
  const bu = Number(bRows[u]?.[0])
  const bv = Number(bRows[v]?.[0])
  if (!Number.isInteger(bu) || !Number.isInteger(bv)) throw new Error('b entries must be integers')

  // k by search: the augmented matrix keeps rank 2 for exactly one integer k.
  const consistent = Array.from({ length: 161 }, (_, i) => i - 80).filter((k) => {
    const column = [0, 1, 2].map((r) => (r === t ? k : Number(bRows[r]?.[0])))
    return rankByMinors(a.map((row, i) => [...row, column[i] as number].map(int))) === 2
  })
  if (consistent.length !== 1) throw new Error(`${consistent.length} integers k keep the system consistent`)
  const k0 = consistent[0] as number
  if (k0 !== alpha * bu + beta * bv) throw new Error('the row relation does not give k')
  const models: Models = {
    'coefficients-ignored': [numeric(bu + bv)],
    'coefficients-swapped': [numeric(beta * bu + alpha * bv)],
    'second-sign-slip': [numeric(alpha * bu - beta * bv)],
    negated: [numeric(-k0)],
    'second-term-dropped': [numeric(alpha * bu)],
  }
  const limits = [...sizeLimits(Q.rational(k0)), ...(Math.abs(k0) > 12 ? ['k above 12'] : [])]
  return { truth: numeric(k0), models, limits }
}

export const SYSTEM_ANALYSERS: Readonly<Record<string, (q: Question) => Analysis>> = {
  's2-k-system': analyseKSystem,
  's2-b-param': analyseBParam,
}
