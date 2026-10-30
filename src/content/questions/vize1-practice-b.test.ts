import { describe, expect, it } from 'vitest'
import type { Matrix } from '../../lib/math/matrix'
import * as M from '../../lib/math/matrix'
import * as Q from '../../lib/math/rational'
import {
  blocksOf,
  itemFrom,
  mat,
  matrices,
  nullity,
  parseSystem,
  passing,
  r,
  replaceColumn,
  sameSet,
  textOf,
} from './testing'
import type { OptionKey } from './types'
import { vize1PracticeB } from './vize1-practice-b'

// Recomputes every answer with the math core: for each item, exactly the keyed option must pass.

const item = (id: string) => itemFrom(vize1PracticeB, id)

const statementClaims: Record<OptionKey, string[]> = {
  a: ['I'],
  b: ['II'],
  c: ['III'],
  d: ['I', 'III'],
  e: ['II', 'III'],
}

function power(m: Matrix, n: number): Matrix {
  let result = M.identity(M.rowCount(m))
  let base = m
  for (let e = n; e > 0; e = Math.floor(e / 2)) {
    if (e % 2 === 1) result = M.multiply(result, base)
    base = M.multiply(base, base)
  }
  return result
}

/** Echelon form: each leading entry is 1 and lies right of the one above; zero rows at the bottom. */
function isEchelon(m: Matrix): boolean {
  let lastLead = -1
  for (const row of m) {
    const lead = row.findIndex((v) => !Q.isZero(v))
    if (lead === -1) continue
    const leading = row[lead]
    if (lead <= lastLead || !leading || !Q.equals(leading, Q.ONE)) return false
    lastLead = lead
  }
  return true
}

describe('practice bank B, recomputed', () => {
  it('v1-pb-04: the determinant equals (a⁴ − b⁴)/(a − b)', () => {
    const q = item('v1-pb-04')
    const pairs = [
      [2, 1],
      [3, -1],
      [5, 2],
    ] as const
    const value = (a: number, b: number) =>
      M.determinant(
        mat([
          [a + b, a * b, 0],
          [1, a + b, a * b],
          [0, 1, a + b],
        ]),
      )
    const exponent = (key: OptionKey) => Number(/a\^(\d)/.exec(textOf(q, key))?.[1])
    expect(
      passing((k) =>
        pairs.every(([a, b]) => Q.equals(value(a, b), r((a ** exponent(k) - b ** exponent(k)) / (a - b)))),
      ),
    ).toEqual([q.answer])
  })

  for (const [id, unknownColumn] of [
    ['v1-pb-06', 1],
    ['v1-pb-06t', 2],
  ] as const) {
    it(`${id}: Cramer value and form, all option values distinct`, () => {
      const q = item(id)
      const { a, b } = parseSystem(q.stem)
      const delta = M.determinant(a)
      expect(Q.equals(delta, r(-12))).toBe(true)
      const optionValue = (k: OptionKey) => {
        const [shown] = matrices(blocksOf(q, k))
        if (!shown) throw new Error('No determinant')
        return Q.mul(r(-1, 12), M.determinant(shown))
      }
      const target = Q.div(M.determinant(replaceColumn(a, unknownColumn, b)), delta)
      expect(passing((k) => Q.equals(optionValue(k), target))).toEqual([q.answer])
      const values = ['a', 'b', 'c', 'd', 'e'].map((k) => Q.format(optionValue(k as OptionKey)))
      expect(new Set(values).size).toBe(5)
      const [keyed] = matrices(blocksOf(q, q.answer))
      expect(keyed && M.equals(keyed, replaceColumn(a, unknownColumn, b))).toBe(true)
    })
  }

  for (const id of ['v1-pb-01', 'v1-pb-01t']) {
    it(`${id}: PᵀQⁿP = Aⁿ for orthogonal P`, () => {
      const q = item(id)
      const shownA = q.stem.find((b) => b.kind === 'matrix' && b.label === 'A =')
      if (shownA?.kind !== 'matrix') throw new Error('No A')
      const a = mat(shownA.rows)
      // The identity holds for every orthogonal P; check it with a rational one at a small power.
      const p = mat([
        ['3/5', '4/5'],
        ['-4/5', '3/5'],
      ])
      expect(M.equals(M.multiply(M.transpose(p), p), M.identity(2))).toBe(true)
      const qm = M.multiply(M.multiply(p, a), M.transpose(p))
      expect(M.equals(M.multiply(M.multiply(M.transpose(p), power(qm, 7)), p), power(a, 7))).toBe(true)
      const target = power(a, 2005)
      expect(passing((k) => M.equals(matrices(blocksOf(q, k))[0] ?? M.identity(1), target))).toEqual([
        q.answer,
      ])
    })
  }

  for (const [id, diagonal, sets] of [
    [
      'v1-pb-02',
      (x: number) => x - 1 + (x * x - 2) + (x - 3) + (x * x - 6),
      { a: [2], b: [-1, 2], c: [-2, 3], d: [-1], e: [-3, 2] },
    ],
    [
      'v1-pb-02t',
      (x: number) => -x - 4 + (x * x - 5) + (-x - 13) + (x * x - 18),
      { a: [-4, 5], b: [-3, 4], c: [-5, 4], d: [-3, 5], e: [-5] },
    ],
  ] as const) {
    it(`${id}: roots of the trace`, () => {
      const q = item(id)
      const stem = q.stem.find((b) => b.kind === 'matrix')
      if (stem?.kind !== 'matrix') throw new Error('No matrix')
      // The diagonal shown must be the one the test sums.
      const shownDiagonal = stem.rows.map((row, i) => row[i])
      expect(shownDiagonal.join(' ')).toBe(id === 'v1-pb-02' ? 'x-1 x²-2 x-3 x²-6' : '-x-4 x²-5 -x-13 x²-18')
      const roots = [...Array(41).keys()].map((x) => x - 20).filter((x) => diagonal(x) === 0)
      expect(passing((k) => sameSet(sets[k].map(String), roots.map(String)))).toEqual([q.answer])
      for (const [k, set] of Object.entries(sets)) {
        expect(textOf(q, k as OptionKey).replaceAll(' ', '')).toBe(`$\\{${set.join(',')}\\}$`)
      }
    })
  }

  for (const id of ['v1-pb-03', 'v1-pb-03t']) {
    it(`${id}: statements on RREF, rank and an echelon form`, () => {
      const q = item(id)
      const [a, claimedRref, claimedEchelon] = matrices(q.stem)
      if (!a || !claimedRref || !claimedEchelon) throw new Error('Missing matrices')
      const rankText = q.stem.find((b) => b.kind === 'text' && b.text.startsWith('II.'))
      const claimedRank = Number(rankText?.kind === 'text' ? /= (\d)/.exec(rankText.text)?.[1] : Number.NaN)
      const rref = M.rref(a).result
      const truths = [
        M.equals(rref, claimedRref) ? 'I' : '',
        M.rank(a) === claimedRank ? 'II' : '',
        isEchelon(claimedEchelon) && M.equals(M.rref(claimedEchelon).result, rref) ? 'III' : '',
      ].filter(Boolean)
      expect(passing((k) => sameSet(statementClaims[k], truths))).toEqual([q.answer])
    })
  }

  for (const id of ['v1-pb-05', 'v1-pb-05t']) {
    it(`${id}: inconsistent system`, () => {
      const q = item(id)
      const { a, b } = parseSystem(q.stem, ['x', 'y', 'z', 't'])
      const kind = M.classifySystem(a, b)
      const free = nullity(a)
      const claims: Record<OptionKey, boolean> = {
        a: kind === 'unique',
        b: kind === 'infinite' && free === 1,
        c: kind === 'infinite' && free === 2,
        d: kind === 'infinite' && free === 3,
        e: kind === 'none',
      }
      expect(passing((k) => claims[k])).toEqual([q.answer])
    })
  }

  for (const [id, candidates] of [
    ['v1-pb-07', { a: [1, 4, 1], b: [4, -1, 1], c: [1, -4, -1], d: [1, -1, -4] }],
    ['v1-pb-07t', { a: [1, -1, 4], b: [4, -1, 1], c: [1, -4, -1], d: [1, -1, -4] }],
  ] as const) {
    it(`${id}: the unique solution`, () => {
      const q = item(id)
      const { a, b } = parseSystem(q.stem)
      const kind = M.classifySystem(a, b)
      const solves = (v: readonly number[]) => M.equals(M.multiply(a, mat(v.map((c) => [c]))), b)
      const claims: Record<OptionKey, boolean> = {
        a: solves(candidates.a),
        b: solves(candidates.b),
        c: solves(candidates.c),
        d: solves(candidates.d),
        e: kind === 'none',
      }
      expect(kind).toBe('unique')
      expect(passing((k) => claims[k])).toEqual([q.answer])
      for (const [k, v] of Object.entries(candidates)) {
        expect(textOf(q, k as OptionKey)).toContain(`$(${v.join(', ')})$`)
      }
    })
  }

  it('covers every item in the file', () => {
    expect(vize1PracticeB.map((q) => q.id).sort()).toEqual(
      [
        'v1-pb-01',
        'v1-pb-01t',
        'v1-pb-02',
        'v1-pb-02t',
        'v1-pb-03',
        'v1-pb-03t',
        'v1-pb-04',
        'v1-pb-05',
        'v1-pb-05t',
        'v1-pb-06',
        'v1-pb-06t',
        'v1-pb-07',
        'v1-pb-07t',
      ].sort(),
    )
  })
})
