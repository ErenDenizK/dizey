import { describe, expect, it } from 'vitest'
import type { Matrix } from '../../lib/math/matrix'
import * as M from '../../lib/math/matrix'
import type { Rational } from '../../lib/math/rational'
import * as Q from '../../lib/math/rational'
import type { Block, OptionKey, Question } from './types'
import { optionKeys } from './types'
import { vize1Summer2024 } from './vize1-2024-summer'

// Recomputes every answer with the math core: for each item, exactly the keyed option must pass.

function item(n: number): Question {
  const id = `v1-2024s-${String(n).padStart(2, '0')}`
  const found = vize1Summer2024.find((q) => q.id === id)
  if (!found) throw new Error(`Missing ${id}`)
  return found
}

function num(text: string): Rational {
  const plain = text
    .replaceAll('$', '')
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2')
    .trim()
  const value = Q.parse(plain)
  if (!value) throw new Error(`Not a number: ${text}`)
  return value
}

function mat(rows: readonly (readonly (number | string)[])[]): Matrix {
  return M.fromNumbers(rows.map((row) => row.map((v) => (typeof v === 'string' ? num(v) : v))))
}

function matrixIn(blocks: readonly Block[], index = 0): Matrix {
  const found = blocks.filter((b) => b.kind === 'matrix')[index]
  if (!found) throw new Error('No matrix block')
  return mat(found.rows)
}

function option(q: Question, key: OptionKey): readonly Block[] {
  const found = q.options.find((o) => o.key === key)
  if (!found) throw new Error(`No option ${key}`)
  return found.content
}

function optionText(q: Question, key: OptionKey): string {
  const first = option(q, key)[0]
  if (first?.kind !== 'text') throw new Error(`Option ${key} is not text`)
  return first.text
}

function passing(test: (key: OptionKey) => boolean): OptionKey[] {
  return optionKeys.filter(test)
}

const r = (n: number, d = 1) => Q.rational(n, d)
const minus = (a: Matrix, b: Matrix) => M.add(a, M.scale(r(-1), b))
const isAntisymmetric = (x: Matrix) => M.equals(M.transpose(x), M.scale(r(-1), x))
const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v) => b.includes(v))

function inv(m: Matrix): Matrix {
  const result = M.inverse(m)
  if (!result) throw new Error('Singular matrix')
  return result
}

describe('2024 summer midterm, recomputed', () => {
  it('01: (Aᵀ − 4I)⁻¹', () => {
    const q = item(1)
    const target = inv(minus(M.transpose(matrixIn(q.stem)), M.scale(r(4), M.identity(2))))
    expect(passing((k) => M.equals(matrixIn(option(q, k)), target))).toEqual([q.answer])
  })

  it('02: determinant after row and column operations is 2|A|', () => {
    const q = item(2)
    for (const [a, b, c, d, e, f, g, h, i] of [
      [1, 2, 3, 0, 1, 4, 5, 6, 0],
      [2, -1, 3, 1, 4, -2, 0, 5, 1],
    ] as const) {
      const original = M.determinant(
        mat([
          [a, b, c],
          [d, e, f],
          [g, h, i],
        ]),
      )
      const changed = M.determinant(
        mat([
          [2 * b, 2 * a, 2 * c],
          [-e + b, -d + a, -f + c],
          [h, g, i],
        ]),
      )
      expect(Q.equals(Q.div(changed, original), r(2))).toBe(true)
    }
    expect(passing((k) => Q.equals(num(optionText(q, k)), r(2 * -5)))).toEqual([q.answer])
  })

  it('03: |3AᵀBA⁻¹B⁻¹A| = 9|A| with |A| = 4', () => {
    const q = item(3)
    const realCubeRoots = [...Array(21).keys()].map((x) => x - 10).filter((x) => x ** 3 === 8 ** 2)
    expect(realCubeRoots).toEqual([4])
    const a = mat([
      [2, 1],
      [2, 3],
    ])
    const b = mat([
      [3, 1],
      [1, 3],
    ])
    const product = [M.transpose(a), b, inv(a), inv(b), a].reduce(M.multiply)
    const value = M.determinant(M.scale(r(3), product))
    expect(passing((k) => Q.equals(num(optionText(q, k)), value))).toEqual([q.answer])
  })

  it('04: İz(A + Aᵀ) = 2 İz A', () => {
    const q = item(4)
    const a = mat([
      [1, 2, 0],
      [5, 3, -1],
      [4, 0, 2],
    ])
    const trace = (m: Matrix) => m.reduce((s, _row, i) => Q.add(s, M.at(m, i, i)), Q.ZERO)
    const value = trace(M.add(a, M.transpose(a)))
    const t = trace(a)
    const candidates: Record<OptionKey, Rational | null> = {
      a: Q.ZERO,
      b: t,
      c: Q.mul(r(2), t),
      d: Q.mul(r(3), t),
      e: null,
    }
    expect(passing((k) => candidates[k] !== null && Q.equals(candidates[k], value))).toEqual([q.answer])
  })

  it('07: idempotent, square, not necessarily invertible', () => {
    const q = item(7)
    const zero = mat([
      [0, 0],
      [0, 0],
    ])
    const projection = mat([
      [1, 0],
      [0, 0],
    ])
    for (const p of [zero, projection]) {
      expect(M.equals(M.multiply(p, p), p)).toBe(true)
      expect(M.inverse(p)).toBeNull()
    }
    expect(() => M.multiply(mat([[1, 2, 3]]), mat([[1, 2, 3]]))).toThrow()
    const truths = ['I', 'III']
    const claims: Record<OptionKey, string[]> = {
      a: ['I', 'II'],
      b: ['I', 'III'],
      c: ['II', 'III'],
      d: ['I'],
      e: ['II'],
    }
    expect(passing((k) => sameSet(claims[k], truths))).toEqual([q.answer])
  })

  it('08: infinitely many solutions only for k = -3', () => {
    const q = item(8)
    const system = (k: Rational) =>
      M.classifySystem(
        M.fromNumbers([
          [r(2), r(-1), Q.add(k, r(2))],
          [k, r(-1), r(3)],
          [r(-6), r(3), r(3)],
        ]),
        mat([[1], [0], [-3]]),
      )
    expect(system(r(2))).toBe('none')
    expect(passing((k) => system(num(optionText(q, k))) === 'infinite')).toEqual([q.answer])
  })

  it('09: determinant is 8xyzt', () => {
    const q = item(9)
    const [x, y, z, t] = [2, 3, 5, 7]
    const value = M.determinant(
      mat([
        [x, x, x, x],
        [y, y, y, -y],
        [z, z, -z, -z],
        [t, -t, -t, -t],
      ]),
    )
    const coefficient = (text: string) => {
      const match = /^\$(\d*)(xyzt)?\$$/.exec(text)
      if (!match) throw new Error(text)
      return match[2] ? Number(match[1] || '1') * x * y * z * t : Number(match[1])
    }
    expect(passing((k) => Q.equals(r(coefficient(optionText(q, k))), value))).toEqual([q.answer])
  })

  it('10: only AB + B is not antisymmetric', () => {
    const q = item(10)
    const a = mat([
      [0, 1, 2],
      [-1, 0, 3],
      [-2, -3, 0],
    ])
    const b = M.add(M.multiply(a, a), M.identity(3))
    expect(isAntisymmetric(a)).toBe(true)
    expect(M.equals(M.transpose(b), b)).toBe(true)
    expect(M.equals(M.multiply(a, b), M.multiply(b, a))).toBe(true)
    const ab = M.multiply(a, b)
    const ba = M.multiply(b, a)
    const expressions: Record<OptionKey, Matrix> = {
      a: M.add(ab, a),
      b: M.add(M.scale(r(-1), ab), a),
      c: M.add(ba, M.transpose(a)),
      d: M.add(ab, b),
      e: M.add(M.scale(r(-1), ab), M.transpose(a)),
    }
    expect(passing((k) => !isAntisymmetric(expressions[k]))).toEqual([q.answer])
  })

  it('11: singular exactly for k = ±4', () => {
    const q = item(11)
    const singular = (k: number) =>
      Q.isZero(
        M.determinant(
          mat([
            [k, 0, 2],
            [8, 0, k],
            [4, 1, 3],
          ]),
        ),
      )
    const claims: Record<OptionKey, (k: number) => boolean> = {
      a: (k) => k !== 4 && k !== -4,
      b: (k) => k !== 4,
      c: () => true,
      d: (k) => k === 4 || k === -4,
      e: (k) => k !== -4,
    }
    const range = [...Array(41).keys()].map((k) => k - 20)
    expect(passing((key) => range.every((k) => claims[key](k) === singular(k)))).toEqual([q.answer])
  })

  it('12: b13 of B = A⁻¹(AB)', () => {
    const q = item(12)
    const b = M.multiply(inv(matrixIn(q.stem, 0)), matrixIn(q.stem, 1))
    expect(passing((k) => Q.equals(num(optionText(q, k)), M.at(b, 0, 2)))).toEqual([q.answer])
  })

  it('13: corrected data is consistent and A⁻¹ = (5I − 2A²)/3', () => {
    const q = item(13)
    const square = matrixIn(q.stem)
    const a = mat([
      [0, '3/2'],
      [1, -1],
    ])
    expect(M.equals(M.multiply(a, a), square)).toBe(true)
    const identity = M.identity(2)
    const cube = M.multiply(square, a)
    const zero = M.add(M.add(M.scale(r(2), cube), M.scale(r(-5), a)), M.scale(r(3), identity))
    expect(M.equals(zero, M.scale(Q.ZERO, identity))).toBe(true)
    const fromIdentity = M.scale(r(1, 3), minus(M.scale(r(5), identity), M.scale(r(2), square)))
    expect(M.equals(fromIdentity, inv(a))).toBe(true)
    expect(passing((k) => M.equals(matrixIn(option(q, k)), fromIdentity))).toEqual([q.answer])
  })

  it('15: Ek(A) = |A| A⁻¹', () => {
    const q = item(15)
    const a = matrixIn(q.stem)
    const adjugate = M.scale(M.determinant(a), inv(a))
    expect(M.equals(M.multiply(a, adjugate), M.scale(M.determinant(a), M.identity(3)))).toBe(true)
    expect(passing((k) => M.equals(matrixIn(option(q, k)), adjugate))).toEqual([q.answer])
  })

  it('16: II and III always hold, corrected I fails', () => {
    const q = item(16)
    const rotation = mat([
      ['3/5', '-4/5'],
      ['4/5', '3/5'],
    ])
    const reflection = mat([
      [1, 0],
      [0, -1],
    ])
    const orthogonal = [M.identity(2), rotation, reflection, M.multiply(rotation, reflection)]
    for (const m of orthogonal) expect(M.equals(M.multiply(M.transpose(m), m), M.identity(2))).toBe(true)
    const d = M.determinant
    let iAlways = true
    for (const a of orthogonal) {
      for (const b of orthogonal) {
        if (!Q.equals(d(M.multiply(a, M.transpose(b))), Q.ONE)) iAlways = false
        expect(Q.equals(d(M.add(M.transpose(a), b)), d(M.add(a, M.transpose(b))))).toBe(true)
        expect(Q.equals(d(M.add(M.transpose(a), M.transpose(b))), d(M.transpose(M.add(a, b))))).toBe(true)
      }
    }
    expect(iAlways).toBe(false)
    const truths = ['II', 'III']
    const claims: Record<OptionKey, string[]> = {
      a: ['I'],
      b: ['II'],
      c: ['II', 'III'],
      d: ['I', 'III'],
      e: ['III'],
    }
    expect(passing((k) => sameSet(claims[k], truths))).toEqual([q.answer])
  })

  it('17: x = -2, y = 6, unique', () => {
    const q = item(17)
    const [x, y] = [-2, 6]
    const product = M.multiply(
      mat([
        [1, x, 3],
        [2, -1, 1],
      ]),
      mat([[2], [4], [y]]),
    )
    expect(M.equals(product, matrixIn(q.stem, 2))).toBe(true)
    // Linear in x and y: 4x + 3y = 10 and y = 6.
    expect(
      M.classifySystem(
        mat([
          [4, 3],
          [0, 1],
        ]),
        mat([[10], [6]]),
      ),
    ).toBe('unique')
    expect(passing((k) => Q.equals(num(optionText(q, k)), r(x + y)))).toEqual([q.answer])
  })

  it('18: one-parameter family through (-2, 1, 0)', () => {
    const q = item(18)
    const a = mat([
      [1, 2, 3],
      [1, 2, 1],
    ])
    const nullity = 3 - M.rank(a)
    const solves = (v: number[]) => M.equals(M.multiply(a, mat(v.map((c) => [c]))), mat([[0], [0]]))
    const claims: Record<OptionKey, boolean> = {
      a: nullity === 0,
      b: nullity === 1 && solves([3, 2, 1]),
      c: nullity === 1 && solves([-2, 1, 0]),
      d: nullity === 1 && solves([2, 3, 1]),
      e: M.classifySystem(a, mat([[0], [0]])) === 'none',
    }
    expect(passing((k) => claims[k])).toEqual([q.answer])
  })

  it('covers every item in the file', () => {
    expect(vize1Summer2024.map((q) => q.id)).toEqual(
      [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18].map(
        (n) => `v1-2024s-${String(n).padStart(2, '0')}`,
      ),
    )
  })
})
