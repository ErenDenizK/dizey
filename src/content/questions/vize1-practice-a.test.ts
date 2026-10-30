import { describe, expect, it } from 'vitest'
import type { Matrix } from '../../lib/math/matrix'
import * as M from '../../lib/math/matrix'
import type { Rational } from '../../lib/math/rational'
import * as Q from '../../lib/math/rational'
import type { Block, OptionKey, Question } from './types'
import { optionKeys } from './types'
import { vize1PracticeA } from './vize1-practice-a'

// Recomputes every answer with the math core: for each item, exactly the keyed option must pass.
// Systems are parsed from the displayed equations, so a transcription slip fails the test.

function item(id: string): Question {
  const found = vize1PracticeA.find((q) => q.id === id)
  if (!found) throw new Error(`Missing ${id}`)
  return found
}

const r = (n: number, d = 1) => Q.rational(n, d)

function num(text: string): Rational {
  const value = Q.parse(text)
  if (!value) throw new Error(`Not a number: ${text}`)
  return value
}

function mat(rows: readonly (readonly (number | string)[])[]): Matrix {
  return M.fromNumbers(rows.map((row) => row.map((v) => (typeof v === 'string' ? num(v) : v))))
}

const column = (values: readonly (number | Rational)[]) =>
  M.fromNumbers(values.map((v) => [typeof v === 'number' ? r(v) : v]))

function blocksOf(q: Question, key?: OptionKey): readonly Block[] {
  if (key === undefined) return q.stem
  const found = q.options.find((o) => o.key === key)
  if (!found) throw new Error(`No option ${key}`)
  return found.content
}

function matrices(blocks: readonly Block[]): Matrix[] {
  return blocks.flatMap((b) => (b.kind === 'matrix' ? [mat(b.rows)] : []))
}

function textOf(q: Question, key: OptionKey): string {
  const first = blocksOf(q, key)[0]
  if (first?.kind !== 'text') throw new Error(`Option ${key} is not text`)
  return first.text
}

/**
 * Parses "2x - y + (k+2)z = 1" style equations into coefficient rows over `variables`.
 * `params` substitutes symbols like k or m inside parenthesised coefficients.
 */
function parseEquation(
  equation: string,
  variables: readonly string[],
  params: Readonly<Record<string, Rational>> = {},
): { row: Rational[]; rhs: Rational } {
  const [left, right] = equation.replaceAll(' ', '').split('=')
  if (left === undefined || right === undefined) throw new Error(equation)
  const row = variables.map(() => Q.ZERO)
  const evaluate = (expr: string): Rational => {
    // Sums of terms like 1, -m, 2k, k: enough for the coefficients in this bank.
    let total = Q.ZERO
    for (const [, sign, digits, symbol] of expr.matchAll(/([+-]?)(\d*)([a-z]?)/g)) {
      if (digits === '' && symbol === '') continue
      let value = digits === '' ? Q.ONE : num(digits ?? '1')
      if (symbol) {
        const p = params[symbol]
        if (!p) throw new Error(`No value for ${symbol} in ${equation}`)
        value = Q.mul(value, p)
      }
      total = Q.add(total, sign === '-' ? Q.neg(value) : value)
    }
    return total
  }
  const term = /([+-]?)(\([^)]*\)|\d+|[a-z](?=[a-z]))?([a-z])/g
  for (const [, sign, coefficient, variable] of left.matchAll(term)) {
    const index = variables.indexOf(variable ?? '')
    if (index === -1) throw new Error(`Unknown variable ${variable} in ${equation}`)
    let value = coefficient === undefined ? Q.ONE : evaluate(coefficient.replace(/^\(|\)$/g, ''))
    if (sign === '-') value = Q.neg(value)
    row[index] = Q.add(row[index] ?? Q.ZERO, value)
  }
  return { row, rhs: evaluate(right) }
}

function parseSystem(
  blocks: readonly Block[],
  variables: readonly string[] = ['x', 'y', 'z'],
  params: Readonly<Record<string, Rational>> = {},
): { a: Matrix; b: Matrix } {
  const found = blocks.find((b) => b.kind === 'system')
  if (found?.kind !== 'system') throw new Error('No system block')
  const parsed = found.equations.map((e) => parseEquation(e, variables, params))
  return { a: parsed.map((p) => p.row), b: parsed.map((p) => [p.rhs]) }
}

function passing(test: (key: OptionKey) => boolean): OptionKey[] {
  return optionKeys.filter(test)
}

function inv(m: Matrix): Matrix {
  const result = M.inverse(m)
  if (!result) throw new Error('Singular matrix')
  return result
}

/** Solution of a square system with a unique solution, else null. */
function solve(a: Matrix, b: Matrix): Matrix | null {
  const inverse = M.inverse(a)
  return inverse ? M.multiply(inverse, b) : null
}

function replaceColumn(a: Matrix, j: number, values: Matrix): Matrix {
  return a.map((row, i) => row.map((v, c) => (c === j ? M.at(values, i, 0) : v)))
}

/** A linear relation pa + qb + rc = s parsed from option text such as "$-5a + b + 7c = 28$". */
function relation(text: string): Rational[] {
  const { row, rhs } = parseEquation(text.replaceAll('$', ''), ['a', 'b', 'c'])
  return [...row, rhs]
}

const proportional = (u: readonly Rational[], v: readonly Rational[]) =>
  u.every((ui, i) => u.every((uj, j) => Q.equals(Q.mul(ui, v[j] ?? Q.ZERO), Q.mul(uj, v[i] ?? Q.ZERO))))

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v) => b.includes(v))

const nullity = (a: Matrix) => M.columnCount(a) - M.rank(a)
const isZero = (m: Matrix) => m.every((row) => row.every(Q.isZero))

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
