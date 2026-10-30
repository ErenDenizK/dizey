import type { Rational } from './rational'
import * as Q from './rational'

/** Exact complex number with rational real and imaginary parts. */
export interface Complex {
  readonly re: Rational
  readonly im: Rational
}

export function complex(re: Rational, im: Rational = Q.ZERO): Complex {
  return { re, im }
}

export const ZERO = complex(Q.ZERO)
export const ONE = complex(Q.ONE)
export const I = complex(Q.ZERO, Q.ONE)

export function add(a: Complex, b: Complex): Complex {
  return complex(Q.add(a.re, b.re), Q.add(a.im, b.im))
}

export function sub(a: Complex, b: Complex): Complex {
  return complex(Q.sub(a.re, b.re), Q.sub(a.im, b.im))
}

export function mul(a: Complex, b: Complex): Complex {
  return complex(Q.sub(Q.mul(a.re, b.re), Q.mul(a.im, b.im)), Q.add(Q.mul(a.re, b.im), Q.mul(a.im, b.re)))
}

export function div(a: Complex, b: Complex): Complex {
  const norm = Q.add(Q.mul(b.re, b.re), Q.mul(b.im, b.im))
  if (Q.isZero(norm)) throw new RangeError('Division by zero')
  const top = mul(a, conj(b))
  return complex(Q.div(top.re, norm), Q.div(top.im, norm))
}

export function neg(a: Complex): Complex {
  return complex(Q.neg(a.re), Q.neg(a.im))
}

export function conj(a: Complex): Complex {
  return complex(a.re, Q.neg(a.im))
}

export function isZero(a: Complex): boolean {
  return Q.isZero(a.re) && Q.isZero(a.im)
}

export function isReal(a: Complex): boolean {
  return Q.isZero(a.im)
}

export function equals(a: Complex, b: Complex): boolean {
  return Q.equals(a.re, b.re) && Q.equals(a.im, b.im)
}

/** Plain text form: "3", "-i", "2-3i", "1/2+1/3i" (the coefficient of i comes first). */
export function format(a: Complex): string {
  if (Q.isZero(a.im)) return Q.format(a.re)
  const coefficient = Q.equals(a.im, Q.ONE) ? '' : Q.equals(a.im, Q.neg(Q.ONE)) ? '-' : Q.format(a.im)
  const imaginary = `${coefficient}i`
  if (Q.isZero(a.re)) return imaginary
  return `${Q.format(a.re)}${imaginary.startsWith('-') ? '' : '+'}${imaginary}`
}

/** Parses "3", "-2/3", "i", "-i", "4i", "2-3i", "-1+1/2i". Returns null for anything else. */
export function parse(text: string): Complex | null {
  const compact = text.replace(/\s+/g, '')
  const match = /^(?:(-?\d+(?:\/\d+)?)(?=$|[+-]))?(?:([+-]?)(\d+(?:\/\d+)?)?i)?$/.exec(compact)
  if (!match || compact === '') return null
  const [, realText, sign, coefficientText] = match
  const hasImaginary = compact.endsWith('i')
  const re = realText === undefined ? Q.ZERO : Q.parse(realText)
  if (re === null) return null
  if (!hasImaginary) return complex(re)
  const magnitude = coefficientText === undefined ? Q.ONE : Q.parse(coefficientText)
  if (magnitude === null) return null
  return complex(re, sign === '-' ? Q.neg(magnitude) : magnitude)
}

/** Immutable matrix of exact complex numbers, stored row by row. */
export type ComplexMatrix = readonly (readonly Complex[])[]

/** Builds a matrix from entries such as "2-3i"; throws on an unreadable entry or ragged rows. */
export function matrixFromStrings(rows: readonly (readonly string[])[]): ComplexMatrix {
  const width = rows[0]?.length ?? 0
  if (rows.length === 0 || width === 0) throw new RangeError('Matrix needs at least one entry')
  return rows.map((row) => {
    if (row.length !== width) throw new RangeError('Matrix rows must have equal length')
    return row.map((cell) => {
      const value = parse(cell)
      if (value === null) throw new RangeError(`Not a complex number: ${cell}`)
      return value
    })
  })
}

function entry(m: ComplexMatrix, i: number, j: number): Complex {
  const value = m[i]?.[j]
  if (value === undefined) throw new RangeError(`No entry at (${i}, ${j})`)
  return value
}

function columns(m: ComplexMatrix): number {
  return m[0]?.length ?? 0
}

function assertSameShape(a: ComplexMatrix, b: ComplexMatrix): void {
  if (a.length !== b.length || columns(a) !== columns(b)) throw new RangeError('Matrix shapes differ')
}

export function identityMatrix(n: number): ComplexMatrix {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO)))
}

export function matrixEquals(a: ComplexMatrix, b: ComplexMatrix): boolean {
  return (
    a.length === b.length &&
    columns(a) === columns(b) &&
    a.every((row, i) => row.every((v, j) => equals(v, entry(b, i, j))))
  )
}

export function matrixAdd(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  assertSameShape(a, b)
  return a.map((row, i) => row.map((v, j) => add(v, entry(b, i, j))))
}

export function matrixSub(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  assertSameShape(a, b)
  return a.map((row, i) => row.map((v, j) => sub(v, entry(b, i, j))))
}

export function matrixScale(k: Complex, m: ComplexMatrix): ComplexMatrix {
  return m.map((row) => row.map((v) => mul(k, v)))
}

export function matrixMultiply(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  if (columns(a) !== b.length) throw new RangeError('Inner dimensions do not match')
  return a.map((_, i) =>
    Array.from({ length: columns(b) }, (_, j) => {
      let sum = ZERO
      for (let k = 0; k < b.length; k++) sum = add(sum, mul(entry(a, i, k), entry(b, k, j)))
      return sum
    }),
  )
}

export function transpose(m: ComplexMatrix): ComplexMatrix {
  return Array.from({ length: columns(m) }, (_, j) => m.map((_, i) => entry(m, i, j)))
}

/** Entrywise conjugate, written Ā. */
export function conjugate(m: ComplexMatrix): ComplexMatrix {
  return m.map((row) => row.map(conj))
}

/** Conjugate transpose A* = (Ā)ᵀ. */
export function conjugateTranspose(m: ComplexMatrix): ComplexMatrix {
  return transpose(conjugate(m))
}

/** Hermitian: A* = A. */
export function isHermitian(m: ComplexMatrix): boolean {
  return matrixEquals(conjugateTranspose(m), m)
}

/** Skew-Hermitian: A* = -A. */
export function isSkewHermitian(m: ComplexMatrix): boolean {
  return matrixEquals(conjugateTranspose(m), matrixScale(neg(ONE), m))
}

export function trace(m: ComplexMatrix): Complex {
  if (m.length !== columns(m)) throw new RangeError('Matrix is not square')
  return m.reduce((sum, _, i) => add(sum, entry(m, i, i)), ZERO)
}

/** Determinant by cofactor expansion along the first row; lesson matrices are at most 4×4. */
export function determinant(m: ComplexMatrix): Complex {
  const n = m.length
  if (n !== columns(m)) throw new RangeError('Matrix is not square')
  if (n === 1) return entry(m, 0, 0)
  let sum = ZERO
  for (let j = 0; j < n; j++) {
    const minor = m.slice(1).map((row) => row.filter((_, c) => c !== j))
    const term = mul(entry(m, 0, j), determinant(minor))
    sum = j % 2 === 0 ? add(sum, term) : sub(sum, term)
  }
  return sum
}
