import type { Rational } from '../../../lib/math/rational'
import * as Q from '../../../lib/math/rational'
import { text } from '../blocks'
import type { Block } from '../types'
import type { OptionValue } from './types'

/** TeX for a number: `5`, `-5`, `\frac{p}{q}`, `-\frac{p}{q}`. */
export function texNumber(value: Rational): string {
  if (value.den === 1n) return value.num.toString()
  const sign = value.num < 0n ? '-' : ''
  const num = value.num < 0n ? -value.num : value.num
  return `${sign}\\frac{${num}}{${value.den}}`
}

export const num = (value: bigint | number, den: bigint | number = 1): OptionValue => ({
  kind: 'num',
  value: Q.rational(value, den),
})

export const rootSet = (roots: readonly Rational[]): OptionValue => ({
  kind: 'set',
  roots: [...roots].sort((a, b) => Number(a.num * b.den - b.num * a.den)),
})

/** Canonical string, used to compare options and to detect collisions. */
export function valueKey(value: OptionValue): string {
  return value.kind === 'num' ? `n:${Q.format(value.value)}` : `s:${value.roots.map(Q.format).join(',')}`
}

export function sameValue(a: OptionValue, b: OptionValue): boolean {
  return valueKey(a) === valueKey(b)
}

/** How an option is shown: `$-\frac{1}{3}$` or `$k = 2$ ya da $k = -3$`. */
export function renderValue(value: OptionValue): Block {
  if (value.kind === 'num') return text(`$${texNumber(value.value)}$`)
  return text(value.roots.map((r) => `$k = ${texNumber(r)}$`).join(' ya da '))
}
