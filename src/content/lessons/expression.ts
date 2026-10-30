import type { Matrix } from '../../lib/math/matrix'
import * as M from '../../lib/math/matrix'
import type { Rational } from '../../lib/math/rational'
import * as Q from '../../lib/math/rational'

/**
 * Test helper: evaluates matrix expressions written the way lessons print them, such as
 * "A^T", "AB - BA", "1/2(M + M^T)", "A^2 - 3A + 2I", "(AB)^{-1}", "\frac{1}{2}A".
 *
 * Names are an optional lowercase prefix, one capital letter and optional digits ("A", "xA", "B2"), so
 * "AB" is the product of A and B. "I" is the identity of whatever size the expression needs. A number
 * is a scalar; juxtaposition multiplies. A scalar unknown is written in braces, "(A + I)^3 - I - {k}A", and
 * takes its value from `scalars`.
 */

/** A value is a matrix or c·I, which stands for a scalar until its size is known. */
type Value = { readonly matrix: Matrix } | { readonly scalar: Rational }

type Token =
  | { readonly kind: 'number'; readonly value: Rational }
  | { readonly kind: 'name'; readonly name: string }
  | { readonly kind: 'variable'; readonly name: string }
  | { readonly kind: 'op'; readonly op: '+' | '-' | '(' | ')' }
  | { readonly kind: 'power'; readonly power: number | 'T' }

function tokenize(source: string): Token[] {
  const text = source
    .replaceAll('$', '')
    .replaceAll('\\cdot', '')
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2')
    .replaceAll(' ', '')
  const tokens: Token[] = []
  let i = 0
  while (i < text.length) {
    const rest = text.slice(i)
    const power = /^\^(?:\{(-?\d+|T)\}|(\d|T))/.exec(rest)
    const number = /^\d+(?:\/\d+)?/.exec(rest)
    const name = /^[a-z]*[A-Z]\d*/.exec(rest)
    const variable = /^\{([a-z])\}/.exec(rest)
    if (variable) {
      tokens.push({ kind: 'variable', name: variable[1] ?? '' })
      i += variable[0].length
    } else if (power) {
      if (power[2] && /^\d/.test(rest.slice(power[0].length)))
        throw new Error(`Write ^{${power[2]}…} in "${source}"`)
      const raw = power[1] ?? power[2] ?? ''
      tokens.push({ kind: 'power', power: raw === 'T' ? 'T' : Number(raw) })
      i += power[0].length
    } else if (number) {
      const value = Q.parse(number[0])
      if (!value) throw new Error(`Bad number in "${source}"`)
      tokens.push({ kind: 'number', value })
      i += number[0].length
    } else if (name) {
      tokens.push({ kind: 'name', name: name[0] })
      i += name[0].length
    } else if ('+-()'.includes(text[i] ?? '')) {
      tokens.push({ kind: 'op', op: text[i] as '+' | '-' | '(' | ')' })
      i += 1
    } else {
      throw new Error(`Cannot read "${rest}" in "${source}"`)
    }
  }
  return tokens
}

function asMatrix(v: Value, size: number): Matrix {
  return 'matrix' in v ? v.matrix : M.scale(v.scalar, M.identity(size))
}

function sum(a: Value, b: Value): Value {
  if ('scalar' in a && 'scalar' in b) return { scalar: Q.add(a.scalar, b.scalar) }
  const size = 'matrix' in a ? M.rowCount(a.matrix) : M.rowCount((b as { matrix: Matrix }).matrix)
  return { matrix: M.add(asMatrix(a, size), asMatrix(b, size)) }
}

function product(a: Value, b: Value): Value {
  if ('scalar' in a)
    return 'scalar' in b ? { scalar: Q.mul(a.scalar, b.scalar) } : { matrix: M.scale(a.scalar, b.matrix) }
  if ('scalar' in b) return { matrix: M.scale(b.scalar, a.matrix) }
  return { matrix: M.multiply(a.matrix, b.matrix) }
}

function negate(a: Value): Value {
  return product({ scalar: Q.neg(Q.ONE) }, a)
}

function raise(a: Value, power: number | 'T'): Value {
  if (power === 'T') return 'matrix' in a ? { matrix: M.transpose(a.matrix) } : a
  let base = a
  if (power < 0) {
    if ('scalar' in a) base = { scalar: Q.div(Q.ONE, a.scalar) }
    else {
      const inverse = M.inverse(a.matrix)
      if (!inverse) throw new Error('Singular matrix raised to a negative power')
      base = { matrix: inverse }
    }
  }
  let result: Value = { scalar: Q.ONE }
  for (let k = 0; k < Math.abs(power); k++) result = product(result, base)
  return result
}

export function evaluate(
  source: string,
  matrices: Readonly<Record<string, Matrix>>,
  scalars: Readonly<Record<string, Rational>> = {},
): Value {
  const tokens = tokenize(source)
  let pos = 0
  const peek = () => tokens[pos]

  function expression(): Value {
    let value = term()
    for (let t = peek(); t?.kind === 'op' && (t.op === '+' || t.op === '-'); t = peek()) {
      pos += 1
      const right = term()
      value = sum(value, t.op === '-' ? negate(right) : right)
    }
    return value
  }

  function term(): Value {
    let negative = false
    for (let t = peek(); t?.kind === 'op' && (t.op === '-' || t.op === '+'); t = peek()) {
      if (t.op === '-') negative = !negative
      pos += 1
    }
    let value = factor()
    for (let t = peek(); t && (t.kind !== 'op' || t.op === '('); t = peek()) value = product(value, factor())
    return negative ? negate(value) : value
  }

  function factor(): Value {
    const t = tokens[pos++]
    let value: Value
    if (!t) throw new Error(`Unexpected end of "${source}"`)
    if (t.kind === 'number') value = { scalar: t.value }
    else if (t.kind === 'variable') {
      const found = scalars[t.name]
      if (!found) throw new Error(`No value for {${t.name}} in "${source}"`)
      value = { scalar: found }
    } else if (t.kind === 'name') {
      if (t.name === 'I') value = { scalar: Q.ONE }
      else {
        const found = matrices[t.name]
        if (!found) throw new Error(`Unknown matrix ${t.name} in "${source}"`)
        value = { matrix: found }
      }
    } else if (t.kind === 'op' && t.op === '(') {
      value = expression()
      const close = tokens[pos++]
      if (close?.kind !== 'op' || close.op !== ')') throw new Error(`Missing ) in "${source}"`)
    } else throw new Error(`Unexpected token in "${source}"`)
    for (let p = peek(); p?.kind === 'power'; p = peek()) {
      pos += 1
      value = raise(value, p.power)
    }
    return value
  }

  const value = expression()
  if (pos !== tokens.length) throw new Error(`Trailing input in "${source}"`)
  return value
}

/** Evaluates to a matrix; a bare scalar becomes c·I of the given size. */
export function evaluateMatrix(
  source: string,
  matrices: Readonly<Record<string, Matrix>>,
  size: number,
): Matrix {
  return asMatrix(evaluate(source, matrices), size)
}
