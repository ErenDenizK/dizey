import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import * as C from './complex'
import * as Q from './rational'

const rationalArb = fc
  .tuple(fc.bigInt({ min: -100n, max: 100n }), fc.bigInt({ min: 1n, max: 100n }))
  .map(([n, d]) => Q.rational(n, d))
const complexArb = fc.tuple(rationalArb, rationalArb).map(([re, im]) => C.complex(re, im))
const nonZeroArb = complexArb.filter((z) => !C.isZero(z))

const parse = (text: string): C.Complex => {
  const value = C.parse(text)
  if (value === null) throw new Error(`unparsable ${text}`)
  return value
}

describe('complex', () => {
  it('parses every written form', () => {
    expect(C.format(parse('3'))).toBe('3')
    expect(C.format(parse('-2/4'))).toBe('-1/2')
    expect(C.format(parse('i'))).toBe('i')
    expect(C.format(parse('-i'))).toBe('-i')
    expect(C.format(parse('4i'))).toBe('4i')
    expect(C.format(parse('-4i'))).toBe('-4i')
    expect(C.format(parse(' 2 - 3i '))).toBe('2-3i')
    expect(C.format(parse('-1+1/2i'))).toBe('-1+1/2i')
    expect(C.format(parse('0+0i'))).toBe('0')
    expect(C.format(parse('5+i'))).toBe('5+i')
  })

  it('rejects anything else', () => {
    for (const text of ['', '2+', 'i2', '2i3', '1.5', 'j', '2--i', '1/0']) expect(C.parse(text)).toBeNull()
  })

  it('round-trips through format', () => {
    fc.assert(fc.property(complexArb, (z) => C.equals(parse(C.format(z)), z)))
  })

  it('has i² = -1', () => {
    expect(C.equals(C.mul(C.I, C.I), C.neg(C.ONE))).toBe(true)
  })

  it('is a field', () => {
    fc.assert(
      fc.property(complexArb, complexArb, complexArb, (a, b, c) => {
        expect(C.equals(C.mul(a, C.add(b, c)), C.add(C.mul(a, b), C.mul(a, c)))).toBe(true)
        expect(C.equals(C.mul(a, b), C.mul(b, a))).toBe(true)
        expect(C.equals(C.sub(C.add(a, b), b), a)).toBe(true)
      }),
    )
    fc.assert(fc.property(complexArb, nonZeroArb, (a, b) => C.equals(C.mul(C.div(a, b), b), a)))
    expect(() => C.div(C.ONE, C.ZERO)).toThrow(RangeError)
  })

  it('conjugates', () => {
    fc.assert(
      fc.property(complexArb, complexArb, (a, b) => {
        expect(C.equals(C.conj(C.mul(a, b)), C.mul(C.conj(a), C.conj(b)))).toBe(true)
        expect(C.isReal(C.mul(a, C.conj(a)))).toBe(true)
      }),
    )
  })
})

describe('complex matrix', () => {
  const A = C.matrixFromStrings([
    ['1', '2-i'],
    ['3i', '4'],
  ])
  const H = C.matrixFromStrings([
    ['2', '1+i'],
    ['1-i', '-3'],
  ])
  const S = C.matrixFromStrings([
    ['i', '2+i'],
    ['-2+i', '0'],
  ])

  it('builds the conjugate transpose', () => {
    const expected = C.matrixFromStrings([
      ['1', '-3i'],
      ['2+i', '4'],
    ])
    expect(C.matrixEquals(C.conjugateTranspose(A), expected)).toBe(true)
  })

  it('recognises Hermitian and skew-Hermitian matrices', () => {
    expect(C.isHermitian(H)).toBe(true)
    expect(C.isSkewHermitian(H)).toBe(false)
    expect(C.isSkewHermitian(S)).toBe(true)
    expect(C.isHermitian(A)).toBe(false)
  })

  it('reverses the order in (AB)* = B*A*', () => {
    const left = C.conjugateTranspose(C.matrixMultiply(A, H))
    const right = C.matrixMultiply(C.conjugateTranspose(H), C.conjugateTranspose(A))
    expect(C.matrixEquals(left, right)).toBe(true)
  })

  it('computes trace and determinant', () => {
    expect(C.format(C.trace(A))).toBe('5')
    // 1·4 - (2-i)(3i) = 4 - (6i + 3) = 1 - 6i
    expect(C.format(C.determinant(A))).toBe('1-6i')
    // A Hermitian matrix has a real determinant: -6 - 2 = -8
    expect(C.format(C.determinant(H))).toBe('-8')
  })

  it('rejects unreadable or ragged input', () => {
    expect(() => C.matrixFromStrings([['x']])).toThrow(RangeError)
    expect(() => C.matrixFromStrings([['1', '2'], ['3']])).toThrow(RangeError)
  })
})
