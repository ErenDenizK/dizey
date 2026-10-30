import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import * as M from './matrix'
import * as Q from './rational'

const entry = fc.integer({ min: -6, max: 6 })
const squareArb = (n: number) =>
  fc.array(fc.array(entry, { minLength: n, maxLength: n }), { minLength: n, maxLength: n })
const sizedSquares = fc.integer({ min: 1, max: 4 }).chain((n) => fc.tuple(squareArb(n), squareArb(n)))
const anyMatrix = fc
  .tuple(fc.integer({ min: 1, max: 4 }), fc.integer({ min: 1, max: 5 }))
  .chain(([r, c]) =>
    fc.array(fc.array(entry, { minLength: c, maxLength: c }), { minLength: r, maxLength: r }),
  )

describe('matrix', () => {
  it('computes a known determinant and inverse', () => {
    const a = M.fromNumbers([
      [2, 1],
      [7, 4],
    ])
    expect(M.determinant(a)).toEqual(Q.ONE)
    expect(M.inverse(a)).toEqual(
      M.fromNumbers([
        [4, -1],
        [-7, 2],
      ]),
    )
  })

  it('returns null for a singular inverse', () => {
    expect(
      M.inverse(
        M.fromNumbers([
          [1, 2],
          [2, 4],
        ]),
      ),
    ).toBeNull()
  })

  it('records the row operations of elimination', () => {
    const { steps, result } = M.rref(
      M.fromNumbers([
        [0, 2],
        [1, 1],
      ]),
    )
    expect(steps[0]?.operation).toEqual({ kind: 'swap', a: 0, b: 1 })
    expect(M.equals(result, M.identity(2))).toBe(true)
    expect(steps.at(-1)?.result).toBe(result)
  })

  it('classifies systems', () => {
    const a = M.fromNumbers([
      [1, 1],
      [2, 2],
    ])
    expect(M.classifySystem(a, M.fromNumbers([[2], [4]]))).toBe('infinite')
    expect(M.classifySystem(a, M.fromNumbers([[2], [5]]))).toBe('none')
    expect(M.classifySystem(M.identity(2), M.fromNumbers([[3], [4]]))).toBe('unique')
  })

  it('det(AB) = det(A) det(B) and det(A^T) = det(A)', () => {
    fc.assert(
      fc.property(sizedSquares, ([a, b]) => {
        const A = M.fromNumbers(a)
        const B = M.fromNumbers(b)
        expect(M.determinant(M.multiply(A, B))).toEqual(Q.mul(M.determinant(A), M.determinant(B)))
        expect(M.determinant(M.transpose(A))).toEqual(M.determinant(A))
      }),
    )
  })

  it('A times its inverse is the identity, and an inverse exists exactly when det is not zero', () => {
    fc.assert(
      fc.property(sizedSquares, ([a]) => {
        const A = M.fromNumbers(a)
        const inv = M.inverse(A)
        expect(inv === null).toBe(Q.isZero(M.determinant(A)))
        if (inv) expect(M.equals(M.multiply(A, inv), M.identity(a.length))).toBe(true)
      }),
    )
  })

  it('replaying the recorded steps reproduces the RREF, and RREF is idempotent', () => {
    fc.assert(
      fc.property(anyMatrix, (rows) => {
        const A = M.fromNumbers(rows)
        const { steps, result } = M.rref(A)
        const replayed = steps.reduce((m, s) => M.applyRowOperation(m, s.operation), A)
        expect(M.equals(replayed, result)).toBe(true)
        expect(M.equals(M.rref(result).result, result)).toBe(true)
        expect(M.rank(A)).toBe(M.rank(M.transpose(A)))
      }),
    )
  })
})
