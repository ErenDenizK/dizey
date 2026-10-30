import type { Matrix } from '../../lib/math/matrix'
import * as M from '../../lib/math/matrix'
import type { Rational } from '../../lib/math/rational'
import * as Q from '../../lib/math/rational'
import type { Block, OptionKey, Question } from './types'
import { optionKeys } from './types'

/** Helpers for the recompute tests of question files. Test-only; not imported by the app. */

export function itemFrom(bank: readonly Question[], id: string): Question {
  const found = bank.find((q) => q.id === id)
  if (!found) throw new Error(`Missing ${id}`)
  return found
}

export const r = (n: number, d = 1) => Q.rational(n, d)

export function num(text: string): Rational {
  const value = Q.parse(text)
  if (!value) throw new Error(`Not a number: ${text}`)
  return value
}

export function mat(rows: readonly (readonly (number | string)[])[]): Matrix {
  return M.fromNumbers(rows.map((row) => row.map((v) => (typeof v === 'string' ? num(v) : v))))
}

export const column = (values: readonly (number | Rational)[]) =>
  M.fromNumbers(values.map((v) => [typeof v === 'number' ? r(v) : v]))

export function blocksOf(q: Question, key?: OptionKey): readonly Block[] {
  if (key === undefined) return q.stem
  const found = q.options.find((o) => o.key === key)
  if (!found) throw new Error(`No option ${key}`)
  return found.content
}

export function matrices(blocks: readonly Block[]): Matrix[] {
  return blocks.flatMap((b) => (b.kind === 'matrix' ? [mat(b.rows)] : []))
}

export function textOf(q: Question, key: OptionKey): string {
  const first = blocksOf(q, key)[0]
  if (first?.kind !== 'text') throw new Error(`Option ${key} is not text`)
  return first.text
}

/**
 * Parses "2x - y + (k+2)z = 1" style equations into coefficient rows over `variables`.
 * `params` substitutes symbols like k or m inside parenthesised coefficients.
 */
export function parseEquation(
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

export function parseSystem(
  blocks: readonly Block[],
  variables: readonly string[] = ['x', 'y', 'z'],
  params: Readonly<Record<string, Rational>> = {},
): { a: Matrix; b: Matrix } {
  const found = blocks.find((b) => b.kind === 'system')
  if (found?.kind !== 'system') throw new Error('No system block')
  const parsed = found.equations.map((e) => parseEquation(e, variables, params))
  return { a: parsed.map((p) => p.row), b: parsed.map((p) => [p.rhs]) }
}

export function passing(test: (key: OptionKey) => boolean): OptionKey[] {
  return optionKeys.filter(test)
}

export function inv(m: Matrix): Matrix {
  const result = M.inverse(m)
  if (!result) throw new Error('Singular matrix')
  return result
}

/** Solution of a square system with a unique solution, else null. */
export function solve(a: Matrix, b: Matrix): Matrix | null {
  const inverse = M.inverse(a)
  return inverse ? M.multiply(inverse, b) : null
}

export function replaceColumn(a: Matrix, j: number, values: Matrix): Matrix {
  return a.map((row, i) => row.map((v, c) => (c === j ? M.at(values, i, 0) : v)))
}

/** A linear relation pa + qb + rc = s parsed from option text such as "$-5a + b + 7c = 28$". */
export function relation(text: string): Rational[] {
  const { row, rhs } = parseEquation(text.replaceAll('$', ''), ['a', 'b', 'c'])
  return [...row, rhs]
}

export const proportional = (u: readonly Rational[], v: readonly Rational[]) =>
  u.every((ui, i) => u.every((uj, j) => Q.equals(Q.mul(ui, v[j] ?? Q.ZERO), Q.mul(uj, v[i] ?? Q.ZERO))))

export const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v) => b.includes(v))

export const nullity = (a: Matrix) => M.columnCount(a) - M.rank(a)
export const isZero = (m: Matrix) => m.every((row) => row.every(Q.isZero))
