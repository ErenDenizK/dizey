import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import * as Q from './rational'

const rationalArb = fc
  .tuple(fc.bigInt({ min: -1000n, max: 1000n }), fc.bigInt({ min: 1n, max: 1000n }))
  .map(([n, d]) => Q.rational(n, d))
const nonZeroArb = rationalArb.filter((r) => !Q.isZero(r))

describe('rational', () => {
  it('normalises sign and common factors', () => {
    expect(Q.rational(4, -6)).toEqual({ num: -2n, den: 3n })
    expect(Q.rational(0, 5)).toEqual({ num: 0n, den: 1n })
  })

  it('rejects a zero denominator', () => {
    expect(() => Q.rational(1, 0)).toThrow(RangeError)
    expect(() => Q.div(Q.ONE, Q.ZERO)).toThrow(RangeError)
  })

  it('parses and prints', () => {
    expect(Q.parse(' -5/10 ')).toEqual(Q.rational(-1, 2))
    expect(Q.parse('7')).toEqual(Q.rational(7))
    expect(Q.parse('1/0')).toBeNull()
    expect(Q.parse('0.5')).toBeNull()
    expect(Q.format(Q.rational(-3, 6))).toBe('-1/2')
  })

  it('is a field', () => {
    fc.assert(
      fc.property(rationalArb, rationalArb, rationalArb, (a, b, c) => {
        expect(Q.add(a, b)).toEqual(Q.add(b, a))
        expect(Q.mul(a, Q.add(b, c))).toEqual(Q.add(Q.mul(a, b), Q.mul(a, c)))
        expect(Q.sub(Q.add(a, b), b)).toEqual(a)
      }),
    )
    fc.assert(
      fc.property(rationalArb, nonZeroArb, (a, b) => {
        expect(Q.mul(Q.div(a, b), b)).toEqual(a)
      }),
    )
  })

  it('round-trips through text', () => {
    fc.assert(
      fc.property(rationalArb, (a) => {
        expect(Q.parse(Q.format(a))).toEqual(a)
      }),
    )
  })
})
