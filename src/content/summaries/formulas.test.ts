import { describe, expect, it } from 'vitest'
import * as C from '../../lib/math/complex'
import type { Matrix } from '../../lib/math/matrix'
import * as M from '../../lib/math/matrix'
import * as Q from '../../lib/math/rational'
import { formulaGroups } from './formulas'
import type { LawId } from './types'

// Every law on the formula sheet is an identity; each one is recomputed here on concrete matrices.

const mat = (rows: readonly (readonly (number | string)[])[]): Matrix =>
  M.fromNumbers(
    rows.map((row) =>
      row.map((v) => {
        const parsed = Q.parse(String(v))
        if (!parsed) throw new Error(`Not a number: ${v}`)
        return parsed
      }),
    ),
  )

const same = (a: Matrix, b: Matrix, what = '') => {
  const show = (m: Matrix) => m.map((row) => row.map(Q.format))
  expect(show(a), what).toEqual(show(b))
}
const num = (a: Q.Rational) => Q.format(a)
const k = (n: number) => Q.rational(n)

const A = mat([
  [1, 2, 0],
  [-1, 1, 2],
  [3, 0, 1],
])
const B = mat([
  [2, 1, -1],
  [0, 3, 1],
  [1, -2, 2],
])
const A2 = mat([
  [3, 1],
  [4, 2],
])
const A23 = mat([
  [1, 2, 3],
  [4, 5, 6],
])
const B34 = mat([
  [1, 0, 2, 1],
  [0, 1, -1, 3],
  [2, 1, 0, 1],
])

const trace = (a: Matrix) => a.reduce((sum, row, i) => Q.add(sum, row[i] ?? Q.ZERO), Q.ZERO)
const power = (a: Matrix, p: number) => {
  let out = M.identity(M.rowCount(a))
  for (let i = 0; i < p; i++) out = M.multiply(out, a)
  return out
}
const minor = (a: Matrix, i: number, j: number) =>
  M.determinant(M.fromNumbers(a.filter((_, r) => r !== i).map((r) => r.filter((_, c) => c !== j))))
const cofactor = (a: Matrix, i: number, j: number) =>
  (i + j) % 2 === 0 ? minor(a, i, j) : Q.neg(minor(a, i, j))
const cofactors = (a: Matrix) => a.map((row, i) => row.map((_, j) => cofactor(a, i, j)))
const adjugate = (a: Matrix) => M.transpose(cofactors(a))
const inv = (a: Matrix) => {
  const out = M.inverse(a)
  if (!out) throw new Error('singular')
  return out
}

const laws: Record<LawId, () => void> = {
  'sum-transpose': () => same(M.transpose(M.add(A, B)), M.add(M.transpose(A), M.transpose(B))),
  'scalar-transpose': () => same(M.transpose(M.scale(k(3), A)), M.scale(k(3), M.transpose(A))),
  'product-transpose': () => {
    same(M.transpose(M.multiply(A, B)), M.multiply(M.transpose(B), M.transpose(A)))
    // The wrong order really differs, and so does a non-square pair.
    expect(M.equals(M.transpose(M.multiply(A, B)), M.multiply(M.transpose(A), M.transpose(B)))).toBe(false)
    // A rectangular pair: (XY)^T = Y^T X^T although X^T Y^T is not even defined.
    const X = A23
    const Y = mat([
      [1, 0],
      [2, 1],
      [0, 3],
    ])
    same(M.transpose(M.multiply(X, Y)), M.multiply(M.transpose(Y), M.transpose(X)))
  },
  'trace-product': () => {
    expect(num(trace(M.multiply(A, B)))).toBe(num(trace(M.multiply(B, A))))
    expect(num(trace(M.multiply(A, B)))).not.toBe(num(Q.mul(trace(A), trace(B))))
    // A rectangular pair: tr(XY) = tr(YX) although XY and YX differ in size.
    expect(num(trace(M.multiply(A23, M.transpose(A23))))).toBe(num(trace(M.multiply(M.transpose(A23), A23))))
  },
  'trace-transpose': () => {
    expect(num(trace(M.transpose(A)))).toBe(num(trace(A)))
    expect(num(trace(M.scale(k(5), A)))).toBe(num(Q.mul(k(5), trace(A))))
    expect(num(trace(M.add(A, M.scale(k(-1), B))))).toBe(num(Q.sub(trace(A), trace(B))))
    expect(num(trace(M.identity(4)))).toBe('4')
  },
  'idempotent-power': () => {
    const P = mat([
      [2, -2],
      [1, -1],
    ])
    same(M.multiply(P, P), P)
    for (let n = 1; n <= 6; n++) {
      const expected = M.add(M.identity(2), M.scale(Q.sub(k(2 ** n), k(1)), P))
      same(power(M.add(P, M.identity(2)), n), expected, `n = ${n}`)
    }
  },
  'involutory-inverse': () => {
    const R = mat([
      [3, -4],
      [2, -3],
    ])
    same(M.multiply(R, R), M.identity(2))
    same(inv(R), R)
  },
  'orthogonal-inverse': () => {
    const Qm = mat([
      ['3/5', '-4/5'],
      ['4/5', '3/5'],
    ])
    same(M.multiply(M.transpose(Qm), Qm), M.identity(2))
    same(inv(Qm), M.transpose(Qm))
  },
  'orthogonal-det': () => {
    const rotation = mat([
      ['3/5', '-4/5'],
      ['4/5', '3/5'],
    ])
    const reflection = mat([
      ['3/5', '4/5'],
      ['4/5', '-3/5'],
    ])
    for (const q of [rotation, reflection]) same(M.multiply(M.transpose(q), q), M.identity(2))
    expect(num(M.determinant(rotation))).toBe('1')
    expect(num(M.determinant(reflection))).toBe('-1')
  },
  'conjugate-product': () => {
    const X = C.matrixFromStrings([
      ['1+2i', '3'],
      ['-i', '2-i'],
    ])
    const Y = C.matrixFromStrings([
      ['2', 'i'],
      ['1-i', '4'],
    ])
    const left = C.conjugateTranspose(C.matrixMultiply(X, Y))
    const right = C.matrixMultiply(C.conjugateTranspose(Y), C.conjugateTranspose(X))
    expect(C.matrixEquals(left, right)).toBe(true)
    const wrong = C.matrixMultiply(C.conjugateTranspose(X), C.conjugateTranspose(Y))
    expect(C.matrixEquals(left, wrong)).toBe(false)
    // Hermitian and skew-Hermitian as the sheet states them.
    const H = C.matrixFromStrings([
      ['2', 'i'],
      ['-i', '3'],
    ])
    expect(C.matrixEquals(C.conjugateTranspose(H), H)).toBe(true)
    const S = C.matrixFromStrings([
      ['0', 'i'],
      ['i', '0'],
    ])
    expect(C.matrixEquals(C.conjugateTranspose(S), C.matrixScale(C.neg(C.ONE), S))).toBe(true)
  },
  'swap-det': () => {
    const swapped = M.applyRowOperation(A, { kind: 'swap', a: 0, b: 2 })
    expect(num(M.determinant(swapped))).toBe(num(Q.neg(M.determinant(A))))
  },
  'scale-det': () => {
    const scaled = M.applyRowOperation(A, { kind: 'scale', row: 1, factor: k(4) })
    expect(num(M.determinant(scaled))).toBe(num(Q.mul(k(4), M.determinant(A))))
  },
  'add-det': () => {
    const added = M.applyRowOperation(A, { kind: 'addMultiple', target: 2, source: 0, factor: k(-7) })
    expect(num(M.determinant(added))).toBe(num(M.determinant(A)))
  },
  'rank-bound': () => {
    expect(M.rank(A23)).toBeLessThanOrEqual(2)
    expect(M.rank(B34)).toBeLessThanOrEqual(3)
    expect(M.rank(M.transpose(B34))).toBeLessThanOrEqual(3)
    expect(
      M.rank(
        mat([
          [1, 2, 3, 4, 5],
          [2, 4, 6, 8, 10],
          [0, 1, 0, 1, 0],
        ]),
      ),
    ).toBe(2)
  },
  'rank-transpose': () => {
    for (const a of [
      A,
      A23,
      B34,
      mat([
        [1, 2, 3],
        [2, 4, 6],
        [0, 1, 1],
      ]),
    ]) {
      expect(M.rank(M.transpose(a))).toBe(M.rank(a))
    }
    // rank n iff |A| != 0 on a square matrix
    expect(M.rank(A) === 3).toBe(!Q.isZero(M.determinant(A)))
    const singular = mat([
      [1, 2, 3],
      [2, 4, 6],
      [0, 1, 1],
    ])
    expect(M.rank(singular) === 3).toBe(!Q.isZero(M.determinant(singular)))
  },
  'triangular-det': () => {
    const U = mat([
      [2, 1, 4, 7],
      [0, 3, -2, 1],
      [0, 0, 5, 9],
      [0, 0, 0, -1],
    ])
    expect(num(M.determinant(U))).toBe('-30')
    const L = mat([
      [2, 0, 0],
      [5, 3, 0],
      [-1, 4, 5],
    ])
    expect(num(M.determinant(L))).toBe('30')
  },
  laplace: () => {
    const sum = (indices: number[], term: (t: number) => Q.Rational) =>
      indices.reduce((total, t) => Q.add(total, term(t)), Q.ZERO)
    const D = M.determinant(A)
    for (const i of [0, 1, 2])
      expect(num(sum([0, 1, 2], (j) => Q.mul(M.at(A, i, j), cofactor(A, i, j))))).toBe(num(D))
    for (const j of [0, 1, 2])
      expect(num(sum([0, 1, 2], (i) => Q.mul(M.at(A, i, j), cofactor(A, i, j))))).toBe(num(D))
  },
  'scalar-det': () => {
    expect(num(M.determinant(M.scale(k(3), A2)))).toBe(num(Q.mul(k(9), M.determinant(A2))))
    expect(num(M.determinant(M.scale(k(2), A)))).toBe(num(Q.mul(k(8), M.determinant(A))))
    expect(num(M.determinant(M.scale(k(-2), A)))).toBe(num(Q.mul(k(-8), M.determinant(A))))
  },
  'transpose-det': () => expect(num(M.determinant(M.transpose(A)))).toBe(num(M.determinant(A))),
  'product-det': () => {
    expect(num(M.determinant(M.multiply(A, B)))).toBe(num(Q.mul(M.determinant(A), M.determinant(B))))
    expect(num(M.determinant(M.add(A, B)))).not.toBe(num(Q.add(M.determinant(A), M.determinant(B))))
  },
  'inverse-det': () => expect(num(M.determinant(inv(A)))).toBe(num(Q.div(Q.ONE, M.determinant(A)))),
  'adjugate-identity': () => {
    const scalar = M.scale(M.determinant(A), M.identity(3))
    same(M.multiply(A, adjugate(A)), scalar)
    same(M.multiply(adjugate(A), A), scalar)
    // Ek(A) is the transpose of the cofactor matrix: entry (1, 2) is C_21.
    expect(num(M.at(adjugate(A), 0, 1))).toBe(num(cofactor(A, 1, 0)))
  },
  'adjugate-det': () => {
    expect(num(M.determinant(adjugate(A)))).toBe(num(power1(M.determinant(A), 2)))
    expect(num(M.determinant(adjugate(A2)))).toBe(num(M.determinant(A2)))
  },
  'inverse-formula': () => {
    same(inv(A), M.scale(Q.div(Q.ONE, M.determinant(A)), adjugate(A)))
    expect(num(M.at(inv(A), 0, 1))).toBe(num(Q.div(cofactor(A, 1, 0), M.determinant(A))))
  },
  'inverse-2x2': () => {
    const [a, b, c, d] = [3, 1, 4, 2]
    const formula = M.scale(
      Q.div(Q.ONE, k(a * d - b * c)),
      mat([
        [d, -b],
        [-c, a],
      ]),
    )
    same(
      inv(
        mat([
          [a, b],
          [c, d],
        ]),
      ),
      formula,
    )
  },
  'gauss-jordan-inverse': () => {
    for (const a of [A, A2, B]) {
      const { result, pivotColumns } = M.rref(M.augment(a, M.identity(M.rowCount(a))), M.columnCount(a))
      expect(pivotColumns.length).toBe(M.rowCount(a))
      same(
        result.map((r) => r.slice(0, M.columnCount(a))),
        M.identity(M.rowCount(a)),
      )
      same(
        result.map((r) => r.slice(M.columnCount(a))),
        inv(a),
      )
    }
    // A zero row on the left means no inverse.
    const singular = mat([
      [1, 2],
      [2, 4],
    ])
    const { result } = M.rref(M.augment(singular, M.identity(2)), 2)
    expect(result.some((row) => row.slice(0, 2).every(Q.isZero))).toBe(true)
    expect(M.inverse(singular)).toBeNull()
  },
  'inverse-product': () => {
    same(inv(M.multiply(A, B)), M.multiply(inv(B), inv(A)))
    expect(M.equals(inv(M.multiply(A, B)), M.multiply(inv(A), inv(B)))).toBe(false)
  },
  'inverse-transpose': () => same(inv(M.transpose(A)), M.transpose(inv(A))),
  'inverse-scalar': () => same(inv(M.scale(k(4), A)), M.scale(Q.div(Q.ONE, k(4)), inv(A))),
  'inverse-solution': () => {
    const b = mat([[3], [-1], [2]])
    const x = M.multiply(inv(A), b)
    same(M.multiply(A, x), b)
  },
  cramer: () => {
    const b = mat([[3], [-1], [2]])
    const x = M.multiply(inv(A), b)
    for (let i = 0; i < 3; i++) {
      const Ai = A.map((row, r) => row.map((v, c) => (c === i ? M.at(b, r, 0) : v)))
      expect(num(Q.div(M.determinant(Ai), M.determinant(A)))).toBe(num(M.at(x, i, 0)))
    }
  },
  'free-variables': () => {
    // [A | b] with r_A = r_B = 2 < 3: one free variable.
    const a = mat([
      [1, 1, 2],
      [0, 2, 7],
      [3, 3, 6],
    ])
    const b = mat([[1], [4], [3]])
    expect(M.rank(a)).toBe(2)
    expect(M.rank(M.augment(a, b))).toBe(2)
    expect(M.classifySystem(a, b)).toBe('infinite')
    expect(M.columnCount(a) - M.rank(a)).toBe(1)
    // r_A < r_B: no solution; r_A = r_B = n: unique.
    expect(M.classifySystem(a, mat([[1], [4], [4]]))).toBe('none')
    expect(M.classifySystem(A, mat([[3], [-1], [2]]))).toBe('unique')
  },
  'homogeneous-wide': () => {
    const wide = mat([
      [1, 2, 0, 3],
      [2, 4, 1, 1],
    ])
    expect(M.classifySystem(wide, mat([[0], [0]]))).toBe('infinite')
    // x = 0 is always a solution of Ax = 0, so a homogeneous system is never inconsistent.
    for (const a of [
      A,
      wide,
      mat([
        [1, 2],
        [2, 4],
      ]),
    ]) {
      expect(M.classifySystem(a, mat(a.map(() => [0]))) === 'none').toBe(false)
    }
  },
}

const power1 = (a: Q.Rational, p: number) => {
  let out = Q.ONE
  for (let i = 0; i < p; i++) out = Q.mul(out, a)
  return out
}

describe('formula sheet laws', () => {
  it('uses every law and every law it names exists', () => {
    const used = new Set(
      formulaGroups.flatMap((group) => group.formulas.flatMap((f) => (f.law ? [f.law] : []))),
    )
    expect([...used].sort()).toEqual(Object.keys(laws).sort())
  })

  for (const [id, check] of Object.entries(laws)) {
    it(`holds: ${id}`, check)
  }
})
