import type { Rational } from '../../../lib/math/rational'
import * as Q from '../../../lib/math/rational'
import type { Block, Question } from '../types'
import type { OptionValue } from './types'

/** Readers for what a student sees. The verifier works from these, never from generator internals. */

export const stemTexts = (q: Question): string[] => q.stem.flatMap((b) => (b.kind === 'text' ? [b.text] : []))

export const matrixBlocks = (blocks: readonly Block[]) =>
  blocks.flatMap((b) => (b.kind === 'matrix' ? [b] : []))

/** `-e+b` -> { e: -1n, b: 1n }; the constant term sits under ''. Handles `2k`, `k-1`, `-3`, `2a+3g`. */
export function parseLinear(entry: string): Record<string, number> {
  const out: Record<string, number> = {}
  let used = ''
  for (const m of entry.matchAll(/([+-]?)(\d*)([a-z]?)/g)) {
    const [whole, sign, digits, symbol] = m
    if (!whole) continue
    if (digits === '' && symbol === '') continue
    used += whole
    const value = (digits === '' ? 1 : Number(digits)) * (sign === '-' ? -1 : 1)
    out[symbol ?? ''] = (out[symbol ?? ''] ?? 0) + value
  }
  if (used !== entry) throw new Error(`Cannot read entry "${entry}"`)
  return out
}

export function evalLinear(entry: string, env: Readonly<Record<string, number>>): number {
  let total = 0
  for (const [symbol, coef] of Object.entries(parseLinear(entry))) {
    if (symbol === '') total += coef
    else {
      const v = env[symbol]
      if (v === undefined) throw new Error(`No value for ${symbol} in "${entry}"`)
      total += coef * v
    }
  }
  return total
}

export function evalGrid(
  rows: readonly (readonly string[])[],
  env: Readonly<Record<string, number>>,
): Rational[][] {
  return rows.map((row) => row.map((entry) => Q.rational(evalLinear(entry, env))))
}

const NUMBER = /^(-?)(?:(\d+)|\\frac\{(\d+)\}\{(\d+)\})$/

export function parseNumber(tex: string): Rational | null {
  const m = NUMBER.exec(tex.trim())
  if (!m) return null
  const sign = m[1] === '-' ? -1n : 1n
  if (m[2] !== undefined) return Q.rational(sign * BigInt(m[2]))
  return Q.rational(sign * BigInt(m[3] ?? '0'), BigInt(m[4] ?? '1'))
}

/** Reads an option: `$5$`, `$-\frac{1}{3}$`, `$k = 2$`, `$k = 2$ ya da $k = -3$`. */
export function parseOptionValue(content: readonly Block[]): OptionValue | null {
  const only = content[0]
  if (content.length !== 1 || only?.kind !== 'text') return null
  const plain = /^\$([^$]*)\$$/.exec(only.text)
  if (plain?.[1] !== undefined && !plain[1].startsWith('k =')) {
    const value = parseNumber(plain[1])
    return value ? { kind: 'num', value } : null
  }
  const roots: Rational[] = []
  for (const part of only.text.split(' ya da ')) {
    const m = /^\$k = ([^$]*)\$$/.exec(part)
    const value = m?.[1] === undefined ? null : parseNumber(m[1])
    if (!value) return null
    roots.push(value)
  }
  return { kind: 'set', roots: [...roots].sort((a, b) => Number(a.num * b.den - b.num * a.den)) }
}

export function parseInteger(text: string, pattern: RegExp): number | null {
  const m = pattern.exec(text)
  return m?.[1] === undefined ? null : Number(m[1])
}

export type Form = 'plain' | 'T' | 'inv' | 'sq'
export interface ScalarFactor {
  readonly base: 'A' | 'B'
  readonly form: Form
}

/** Reads `3A^TB^{-1}A^2` (the part between the bars): a leading scalar and a product of factors. */
export function parseScalarExpression(inner: string): { k: number; factors: ScalarFactor[] } | null {
  const head = /^(-?\d+)?(.*)$/.exec(inner)
  const body = head?.[2] ?? ''
  const factors: ScalarFactor[] = []
  let rebuilt = ''
  for (const m of body.matchAll(/([AB])(\^T|\^\{-1\}|\^2)?/g)) {
    const suffix = m[2]
    factors.push({
      base: m[1] as 'A' | 'B',
      form: suffix === '^T' ? 'T' : suffix === '^{-1}' ? 'inv' : suffix === '^2' ? 'sq' : 'plain',
    })
    rebuilt += m[0]
  }
  if (rebuilt !== body || factors.length === 0) return null
  return { k: head?.[1] === undefined ? 1 : Number(head[1]), factors }
}

export interface AdjFactor {
  readonly of: 'A' | 'Ek'
  readonly inverse: boolean
}

/** Reads `3\,\text{Ek}(A)`, `A^{-1}\text{Ek}(A)`, `\text{Ek}(A)^{-1}`, `A\,\text{Ek}(A)`. */
export function parseAdjugateExpression(inner: string): { k: number; factors: AdjFactor[] } | null {
  const cleaned = inner.replaceAll('\\,', '')
  const head = /^(-?\d+)?(.*)$/.exec(cleaned)
  const body = head?.[2] ?? ''
  const factors: AdjFactor[] = []
  let rebuilt = ''
  for (const m of body.matchAll(/\\text\{Ek\}\(A\)(\^\{-1\})?|A(\^\{-1\})?/g)) {
    const isEk = m[0].startsWith('\\text')
    factors.push({ of: isEk ? 'Ek' : 'A', inverse: (isEk ? m[1] : m[2]) !== undefined })
    rebuilt += m[0]
  }
  if (rebuilt !== body || factors.length === 0) return null
  return { k: head?.[1] === undefined ? 1 : Number(head[1]), factors }
}

/** The determinant expression of a stem: the `$|...|$` that is not `$|A| = x$`. */
export function stemExpression(q: Question): string | null {
  for (const t of stemTexts(q)) {
    const m = /\$\|([^$]*)\|\$/.exec(t)
    if (m?.[1] !== undefined) return m[1]
  }
  return null
}
