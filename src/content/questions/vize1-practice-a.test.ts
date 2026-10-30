import { describe, expect, it } from 'vitest'
import * as M from '../../lib/math/matrix'
import type { Rational } from '../../lib/math/rational'
import * as Q from '../../lib/math/rational'
import {
  blocksOf,
  column,
  inv,
  isZero,
  itemFrom,
  mat,
  matrices,
  nullity,
  num,
  parseSystem,
  passing,
  proportional,
  r,
  relation,
  replaceColumn,
  sameSet,
  solve,
  textOf,
} from './testing'
import type { OptionKey } from './types'
import { vize1PracticeA } from './vize1-practice-a'

// Recomputes every answer with the math core: for each item, exactly the keyed option must pass.
// Systems are parsed from the displayed equations, so a transcription slip fails the test.

const item = (id: string) => itemFrom(vize1PracticeA, id)

describe('practice bank A, recomputed', () => {
  for (const [id, column0, target] of [
    ['v1-pa-09', 1, r(2)],
    ['v1-pa-09t', 0, r(1)],
  ] as const) {
    it(`${id}: Cramer relation for one unknown`, () => {
      const q = item(id)
      const { a } = parseSystem(q.stem, ['x', 'y', 'z'], { a: Q.ZERO, b: Q.ZERO, c: Q.ZERO })
      const delta = M.determinant(a)
      // Δ_j is linear in (a, b, c): its coefficients are the determinants with unit columns.
      const coefficients = [0, 1, 2].map((i) =>
        M.determinant(replaceColumn(a, column0, column([0, 1, 2].map((k) => (k === i ? 1 : 0))))),
      )
      const expected = [...coefficients, Q.mul(target, delta)]
      expect(passing((k) => proportional(relation(textOf(q, k)), expected))).toEqual([q.answer])
    })
  }

  it('v1-pa-10: statements on the m-system', () => {
    const q = item('v1-pa-10')
    const at = (m: number) => parseSystem(q.stem, ['x', 'y', 'z'], { m: r(m) })
    const delta = (m: number) => M.determinant(at(m).a)
    const xAt = (m: number) => {
      const { a, b } = at(m)
      return Q.div(M.determinant(replaceColumn(a, 0, b)), M.determinant(a))
    }
    const truths = [
      Q.isZero(delta(1)) && Q.isZero(delta(-1)) ? 'I' : '',
      Q.equals(delta(2), r(-6)) && Q.equals(xAt(2), r(1, 3)) ? 'II' : '',
      Q.equals(xAt(3), r(16)) ? 'III' : '',
    ].filter(Boolean)
    const claims: Record<OptionKey, string[]> = {
      a: ['I'],
      b: ['II'],
      c: ['III'],
      d: ['II', 'III'],
      e: ['I', 'II'],
    }
    expect(passing((k) => sameSet(claims[k], truths))).toEqual([q.answer])
  })

  it('v1-pa-10t: statements on the k-system', () => {
    const q = item('v1-pa-10t')
    const at = (k: Rational) => parseSystem(q.stem, ['x', 'y', 'z'], { k })
    const delta = (k: Rational) => M.determinant(at(k).a)
    const ratio = (k: Rational, j: number) => {
      const { a, b } = at(k)
      return Q.div(M.determinant(replaceColumn(a, j, b)), M.determinant(a))
    }
    const truths = [
      Q.isZero(delta(r(2))) && Q.isZero(delta(r(-1, 2))) ? 'I' : '',
      Q.equals(delta(r(1)), r(3)) && Q.equals(ratio(r(1), 1), r(2)) ? 'II' : '',
      Q.equals(ratio(r(-2), 0), r(5)) ? 'III' : '',
    ].filter(Boolean)
    const claims: Record<OptionKey, string[]> = {
      a: ['I'],
      b: ['II'],
      c: ['III'],
      d: ['I', 'II'],
      e: ['II', 'III'],
    }
    expect(passing((k) => sameSet(claims[k], truths))).toEqual([q.answer])
  })

  it('v1-pa-03: only the trivial solution exactly when k ≠ -3, -4', () => {
    const q = item('v1-pa-03')
    const trivialOnly = (k: number) =>
      !Q.isZero(M.determinant(parseSystem(q.stem, ['x', 'y', 'z'], { k: r(k) }).a))
    const claims: Record<OptionKey, (k: number) => boolean> = {
      a: (k) => k === -3 || k === 4,
      b: (k) => k === 3 || k === -4,
      c: (k) => k === -3 || k === -4,
      d: (k) => k !== -3 && k !== 4,
      e: (k) => k !== -3 && k !== -4,
    }
    const range = [...Array(41).keys()].map((k) => k - 20)
    expect(passing((key) => range.every((k) => claims[key](k) === trivialOnly(k)))).toEqual([q.answer])
  })

  for (const [id, root] of [
    ['v1-pa-05', 2],
    ['v1-pa-05t', 6],
  ] as const) {
    it(`${id}: infinitely many solutions exactly at k = ${root}`, () => {
      const q = item(id)
      const stem = q.stem.find((b) => b.kind === 'matrix')
      if (stem?.kind !== 'matrix') throw new Error('No matrix')
      const infinite = (k: number) => {
        const rows = stem.rows.map((row) => row.map((v) => (v === 'k' ? String(k) : v)))
        const full = mat(rows)
        const a = full.map((row) => row.slice(0, 3))
        const b = full.map((row) => row.slice(3))
        expect(isZero(b)).toBe(true)
        return M.classifySystem(a, b) === 'infinite'
      }
      const claims: Record<OptionKey, (k: number) => boolean> = {
        a: (k) => k === -root,
        b: (k) => k === root,
        c: (k) => k !== -root,
        d: (k) => k !== root,
        e: (k) => k !== root && k !== -root,
      }
      if (id === 'v1-pa-05t') {
        ;[claims.a, claims.b] = [claims.b, claims.a]
      }
      const range = [...Array(41).keys()].map((k) => k - 20)
      expect(passing((key) => range.every((k) => claims[key](k) === infinite(k)))).toEqual([q.answer])
    })
  }

  for (const id of ['v1-pa-08', 'v1-pa-08t']) {
    it(`${id}: A⁻¹ and B of the system`, () => {
      const q = item(id)
      const { a, b } = parseSystem(q.stem)
      expect(
        passing((k) => {
          const [shownInverse, shownB] = matrices(blocksOf(q, k))
          return !!shownInverse && !!shownB && M.equals(shownInverse, inv(a)) && M.equals(shownB, b)
        }),
      ).toEqual([q.answer])
    })
  }

  for (const id of ['v1-pa-07', 'v1-pa-07t']) {
    it(`${id}: the system AX = B rebuilt from A⁻¹ and A⁻¹B`, () => {
      const q = item(id)
      const [inverseA, solution] = matrices(q.stem)
      if (!inverseA || !solution) throw new Error('Missing data')
      // Any option with the same solution set as AX = B counts, so equivalent rewrites are caught.
      expect(
        passing((k) => {
          const { a, b } = parseSystem(blocksOf(q, k))
          const x = solve(a, b)
          return x !== null && M.equals(x, solution)
        }),
      ).toEqual([q.answer])
      const a = inv(inverseA)
      const { a: keyedA, b: keyedB } = parseSystem(blocksOf(q, q.answer))
      expect(M.equals(keyedA, a) && M.equals(keyedB, M.multiply(a, solution))).toBe(true)
    })
  }

  it('v1-pa-02: never a unique solution', () => {
    const q = item('v1-pa-02')
    const kind = (k: number) => {
      const { a, b } = parseSystem(q.stem, ['x', 'y', 'z'], { k: r(k) })
      return M.classifySystem(a, b)
    }
    const range = [...Array(41).keys()].map((k) => k - 20)
    const uniqueFor = range.filter((k) => kind(k) === 'unique')
    const claims: Record<OptionKey, (k: number) => boolean> = {
      a: (k) => k === 2 || k === -2,
      b: (k) => k === 2,
      c: (k) => k !== 2 && k !== -2,
      d: (k) => k !== -4,
      e: () => false,
    }
    expect(passing((key) => range.every((k) => claims[key](k) === uniqueFor.includes(k)))).toEqual([q.answer])
  })

  for (const [id, vectors] of [
    [
      'v1-pa-04',
      {
        a: [r(1, 6), r(1, 6), r(1, 6), r(1)],
        b: [r(2), r(3), r(4), r(1)],
        c: [r(-1, 6), r(-1, 6), r(-1, 3), r(1)],
        d: [r(-1, 5), r(-1, 5), r(-1, 5), r(1)],
        e: [r(1, 6), r(1, 3), r(1, 6), r(1)],
      },
    ],
    [
      'v1-pa-04t',
      {
        a: [r(-5), r(-5), r(1), r(7)],
        b: [r(-5), r(1), r(1), r(1)],
        c: [r(1), r(-5), r(0), r(1)],
        d: [r(-1, 5), r(-1, 5), r(1, 5), r(-1)],
        e: [r(-3), r(1), r(1, 3), r(1)],
      },
    ],
  ] as const) {
    it(`${id}: one-parameter solution family`, () => {
      const q = item(id)
      const { a } = parseSystem(q.stem, ['x', 'y', 'z', 't'])
      expect(nullity(a)).toBe(1)
      expect(passing((k) => isZero(M.multiply(a, column(vectors[k]))))).toEqual([q.answer])
    })
  }

  for (const [id, special] of [
    ['v1-pa-06', { t: 1, k: 3 }],
    ['v1-pa-06t', { t: 2, k: 6 }],
  ] as const) {
    it(`${id}: free-variable counts in t and k`, () => {
      const q = item(id)
      const free = (t: number, k: number) =>
        nullity(parseSystem(q.stem, ['x', 'y', 'z'], { t: r(t), k: r(k) }).a)
      const others = [-3, 0, 4, 7]
      const tValues = (eq: boolean) => (eq ? [special.t] : others.filter((v) => v !== special.t))
      const kValues = (eq: boolean) => (eq ? [special.k] : others.filter((v) => v !== special.k))
      const holds = (tEq: boolean, kEq: boolean, count: number) =>
        tValues(tEq).every((t) => kValues(kEq).every((k) => free(t, k) === count))
      const statements = {
        oneAtSpecial: holds(true, true, 1),
        twoTNotSpecial: holds(false, true, 2),
        twoAtSpecial: holds(true, true, 2),
        twoKNotSpecial: holds(true, false, 2),
        uniqueOtherwise: holds(false, false, 0),
      }
      const claims: Record<OptionKey, boolean> =
        id === 'v1-pa-06'
          ? {
              a: statements.oneAtSpecial,
              b: statements.twoTNotSpecial,
              c: statements.twoAtSpecial,
              d: statements.twoKNotSpecial,
              e: statements.uniqueOtherwise,
            }
          : {
              a: statements.twoAtSpecial,
              b: statements.twoTNotSpecial,
              c: statements.oneAtSpecial,
              d: statements.twoKNotSpecial,
              e: statements.uniqueOtherwise,
            }
      expect(passing((k) => claims[k])).toEqual([q.answer])
    })
  }

  it('v1-pa-01t: the data fits an orthogonal matrix and b² + x² + y² = 1', () => {
    const q = item('v1-pa-01t')
    const filled = mat([
      ['1/3', '2/3', '-2/3'],
      ['2/3', '1/3', '2/3'],
      ['2/3', '-2/3', '-1/3'],
    ])
    expect(M.equals(M.multiply(M.transpose(filled), filled), M.identity(3))).toBe(true)
    const stem = q.stem.find((b) => b.kind === 'matrix')
    if (stem?.kind !== 'matrix') throw new Error('No matrix')
    stem.rows.forEach((row, i) => {
      row.forEach((v, j) => {
        if (/^-?\d/.test(v)) expect(Q.equals(num(v), M.at(filled, i, j))).toBe(true)
      })
    })
    const sum = [0, 1, 2].reduce((s, i) => Q.add(s, Q.mul(M.at(filled, i, 2), M.at(filled, i, 2))), Q.ZERO)
    const value = (text: string) => num(text.replaceAll('$', '').replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2'))
    expect(passing((k) => Q.equals(value(textOf(q, k)), sum))).toEqual([q.answer])
  })

  it('covers every item in the file', () => {
    expect(vize1PracticeA.map((q) => q.id).sort()).toEqual(
      [
        'v1-pa-01t',
        'v1-pa-02',
        'v1-pa-03',
        'v1-pa-04',
        'v1-pa-04t',
        'v1-pa-05',
        'v1-pa-05t',
        'v1-pa-06',
        'v1-pa-06t',
        'v1-pa-07',
        'v1-pa-07t',
        'v1-pa-08',
        'v1-pa-08t',
        'v1-pa-09',
        'v1-pa-09t',
        'v1-pa-10',
        'v1-pa-10t',
      ].sort(),
    )
  })
})
