/**
 * Exact rational numbers on bigint. Every number Dizey shows or checks comes from here,
 * so there is no floating point anywhere in math content.
 * Values are always normalised: gcd(num, den) = 1 and den > 0.
 */
export interface Rational {
  readonly num: bigint
  readonly den: bigint
}

function abs(n: bigint): bigint {
  return n < 0n ? -n : n
}

function gcd(a: bigint, b: bigint): bigint {
  let x = abs(a)
  let y = abs(b)
  while (y !== 0n) {
    ;[x, y] = [y, x % y]
  }
  return x
}

export function rational(num: bigint | number, den: bigint | number = 1n): Rational {
  let n = BigInt(num)
  let d = BigInt(den)
  if (d === 0n) throw new RangeError('Rational with zero denominator')
  if (d < 0n) {
    n = -n
    d = -d
  }
  const g = gcd(n, d)
  return g > 1n ? { num: n / g, den: d / g } : { num: n, den: d }
}

export const ZERO = rational(0)
export const ONE = rational(1)

export function add(a: Rational, b: Rational): Rational {
  return rational(a.num * b.den + b.num * a.den, a.den * b.den)
}

export function sub(a: Rational, b: Rational): Rational {
  return rational(a.num * b.den - b.num * a.den, a.den * b.den)
}

export function mul(a: Rational, b: Rational): Rational {
  return rational(a.num * b.num, a.den * b.den)
}

export function div(a: Rational, b: Rational): Rational {
  if (b.num === 0n) throw new RangeError('Division by zero')
  return rational(a.num * b.den, a.den * b.num)
}

export function neg(a: Rational): Rational {
  return { num: -a.num, den: a.den }
}

export function isZero(a: Rational): boolean {
  return a.num === 0n
}

export function equals(a: Rational, b: Rational): boolean {
  return a.num === b.num && a.den === b.den
}

/** Plain text form: "3", "-1/2". Display formatting (minus sign, fraction layout) belongs to the UI. */
export function format(a: Rational): string {
  return a.den === 1n ? a.num.toString() : `${a.num}/${a.den}`
}

/** Parses "3", "-4", "2/3", "-5/10". Returns null for anything else, including a zero denominator. */
export function parse(text: string): Rational | null {
  const match = /^\s*(-?\d+)\s*(?:\/\s*(\d+)\s*)?$/.exec(text)
  if (!match?.[1]) return null
  const den = match[2] === undefined ? 1n : BigInt(match[2])
  if (den === 0n) return null
  return rational(BigInt(match[1]), den)
}
