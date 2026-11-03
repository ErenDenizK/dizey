import * as M from '../../../lib/math/matrix'
import type { Rational } from '../../../lib/math/rational'
import * as Q from '../../../lib/math/rational'
import { optionKeys, type Question } from '../types'
import { rootSet, sameValue, valueKey } from './format'
import { genericFit } from './phone-fit'
import type { OptionValue } from './types'
import { DET_ANALYSERS } from './verify-dets'
import { adjugate, bestLine, expand, leibniz, matrixWithDet, permanent } from './verify-math'
import { MATRIX_ANALYSERS } from './verify-matrices'
import {
  evalGrid,
  evalLinear,
  matrixBlocks,
  parseAdjugateExpression,
  parseInteger,
  parseOptionValue,
  parseScalarExpression,
  stemExpression,
} from './verify-parse'
import { ROW_ANALYSERS } from './verify-rows'
import { type Analysis, abs, int, n, sizeLimits, stemOf } from './verify-shared'
import { SYSTEM_ANALYSERS } from './verify-systems'

/**
 * The independent verifier. It shares no code with the generators: it reads what a student sees (matrix
 * entries, the TeX expression, the option texts), recomputes the truth by other methods (Leibniz, cofactors,
 * concrete matrices that are multiplied, inverted and adjugated), and recomputes the value of every named
 * mistake on the displayed data. Per family it returns the truth, the value(s) each errorType slug may have,
 * and the family's phone-fit limits.
 */

function power(base: Rational, exponent: number): Rational {
  let result = Q.ONE
  for (let i = 0; i < Math.abs(exponent); i++) result = Q.mul(result, base)
  return exponent < 0 ? Q.div(Q.ONE, result) : result
}

function orderOf(text: string): number {
  const size = parseInteger(text, /(\d) \\times \1/)
  if (size === null) throw new Error('stem does not name the order n x n')
  return size
}

// ---------------------------------------------------------------- d3-scalar

function analyseScalar(q: Question): Analysis {
  const text = stemOf(q)
  const order = orderOf(text)
  const expression = stemExpression(q)
  const parsed = expression === null ? null : parseScalarExpression(expression)
  if (!parsed) throw new Error('cannot read the determinant expression')
  const given = { A: parseInteger(text, /\|A\| = (-?\d+)/), B: parseInteger(text, /\|B\| = (-?\d+)/) }
  const givenB = given.B
  if (given.A === null && givenB !== null && /A\^3 = B\^2/.test(text)) {
    const root = Array.from({ length: 99 }, (_, i) => i + 1).find((a) => a ** 3 === givenB ** 2)
    if (root === undefined) throw new Error('A^3 = B^2 has no integer |A|')
    given.A = root
  }
  const value = (base: 'A' | 'B'): number => {
    const v = given[base]
    if (v === null) throw new Error(`|${base}| is not given`)
    return v
  }
  const bases = {
    A: given.A === null ? null : matrixWithDet(order, given.A, 1),
    B: given.B === null ? null : matrixWithDet(order, given.B, 2),
  }
  for (const base of ['A', 'B'] as const) {
    const built = bases[base]
    if (built && !Q.equals(leibniz(built), int(given[base] as number))) {
      throw new Error(`built ${base} has a different determinant`)
    }
  }
  let product: M.Matrix = M.identity(order)
  for (const f of parsed.factors) {
    const base = bases[f.base]
    if (!base) throw new Error(`|${f.base}| is not given`)
    const inverse = M.inverse(base)
    const next =
      f.form === 'T'
        ? M.transpose(base)
        : f.form === 'sq'
          ? M.multiply(base, base)
          : f.form === 'inv'
            ? inverse
            : base
    if (!next) throw new Error('singular factor')
    product = M.multiply(product, next)
  }
  const truth = leibniz(M.scale(int(parsed.k), product))

  type Slip = (f: { base: 'A' | 'B'; form: string }, v: Rational) => Rational
  const honest: Slip = (f, v) => (f.form === 'inv' ? Q.div(Q.ONE, v) : f.form === 'sq' ? Q.mul(v, v) : v)
  const run = (scalar: Rational, slip: Slip = honest): OptionValue => {
    let total = scalar
    for (const f of parsed.factors) total = Q.mul(total, slip(f, int(value(f.base))))
    return n(total)
  }
  const k = int(parsed.k)
  const kPower = power(k, order)
  const models = {
    'k-instead-of-k-power-n': [run(k)],
    'dropped-scalar': [run(Q.ONE)],
    'inverse-taken-as-same': [run(kPower, (f, v) => (f.form === 'inv' ? v : honest(f, v)))],
    'transpose-as-inverse': [run(kPower, (f, v) => (f.form === 'T' ? Q.div(Q.ONE, v) : honest(f, v)))],
    'square-as-doubled': [run(kPower, (f, v) => (f.form === 'sq' ? Q.mul(int(2), v) : honest(f, v)))],
    'k-squared-always': [run(power(k, 2))],
    'sign-of-k-lost': [run(abs(kPower))],
  }
  const limits = sizeLimits(truth)
  if (parsed.factors.length > 4) limits.push(`${parsed.factors.length} factors`)
  if (abs(kPower).num > 256n) limits.push(`k^n = ${Q.format(kPower)} exceeds 256`)
  for (const base of ['A', 'B'] as const) {
    if (given[base] !== null && Math.abs(given[base] as number) > 10) limits.push(`|${base}| is large`)
  }
  return { truth: n(truth), models, limits }
}

// ---------------------------------------------------------------- d4-adjugate

function analyseAdjugate(q: Question): Analysis {
  const text = stemOf(q)
  const order = orderOf(text)
  const alpha = parseInteger(text, /\|A\| = (-?\d+)/)
  const expression = stemExpression(q)
  const parsed = expression === null ? null : parseAdjugateExpression(expression)
  if (alpha === null || !parsed) throw new Error('cannot read |A| or the expression')
  const a = matrixWithDet(order, alpha, 3)
  if (!Q.equals(leibniz(a), int(alpha))) throw new Error('built A has a different determinant')
  const ek = adjugate(a)
  const scaled = M.scale(int(alpha), M.identity(order))
  if (!M.equals(M.multiply(a, ek), scaled)) throw new Error('adjugate check A * Ek(A) = |A| I failed')
  let product: M.Matrix = M.identity(order)
  for (const f of parsed.factors) {
    const base = f.of === 'A' ? a : ek
    const next = f.inverse ? M.inverse(base) : base
    if (!next) throw new Error('singular factor')
    product = M.multiply(product, next)
  }
  const truth = leibniz(M.scale(int(parsed.k), product))

  const k = int(parsed.k)
  const kPower = power(k, order)
  const alphaQ = int(alpha)
  const exponent = (adjugateExponent: number) =>
    parsed.factors.reduce((sum, f) => sum + (f.inverse ? -1 : 1) * (f.of === 'A' ? 1 : adjugateExponent), 0)
  const full = exponent(order - 1)
  const models = {
    'adjugate-det-is-det-power-n': [n(Q.mul(kPower, power(alphaQ, exponent(order))))],
    'adjugate-det-is-det': [n(Q.mul(kPower, power(alphaQ, exponent(1))))],
    'adjugate-det-power-n-minus-2': [n(Q.mul(kPower, power(alphaQ, exponent(order - 2))))],
    'adjugate-as-inverse': [n(Q.mul(kPower, power(alphaQ, exponent(-1))))],
    'reciprocal-slip': [n(Q.mul(kPower, power(alphaQ, -full)))],
    'k-instead-of-k-power-n': [n(Q.mul(k, power(alphaQ, full)))],
    'dropped-scalar': [n(power(alphaQ, full))],
  }
  const limits = sizeLimits(truth)
  if (parsed.factors.length > 2) limits.push('more than two factors')
  if (Math.abs(alpha) > 9) limits.push('|A| is large')
  if (abs(kPower).num > 256n) limits.push('k^n exceeds 256')
  return { truth: n(truth), models, limits }
}

// ---------------------------------------------------------------- d2-numeric

function analyseNumeric(q: Question): Analysis {
  const block = matrixBlocks(q.stem)[0]
  if (!block) throw new Error('no matrix in the stem')
  const grid = block.rows.map((row) =>
    row.map((entry) => {
      const v = Q.parse(entry)
      if (!v) throw new Error(`entry "${entry}" is not a number`)
      return v
    }),
  )
  const size = grid.length
  const truth = leibniz(grid)
  if (!Q.equals(truth, M.determinant(grid))) throw new Error('Leibniz and elimination disagree')
  const line = bestLine(grid)
  if (!Q.equals(truth, expand(grid, line))) throw new Error('cofactor expansion disagrees with Leibniz')
  const diagonal = grid.reduce((p, row, i) => Q.mul(p, row[i] ?? Q.ZERO), Q.ONE)
  const models: Record<string, OptionValue[]> = {
    'checkerboard-ignored': [n(expand(grid, line, false))],
    'minor-terms-added': [n(expand(grid, line, true, permanent))],
    'diagonal-product': [n(diagonal)],
    'sign-flipped': [n(Q.neg(truth))],
  }
  if (size === 3) models['all-terms-added'] = [n(permanent(grid))]
  const limits = sizeLimits(truth)
  for (let t = 0; t < size; t++) {
    const i = line.kind === 'row' ? line.index : t
    const j = line.kind === 'row' ? t : line.index
    const minor = grid.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j))
    if (abs(leibniz(minor)).num > 200n) limits.push('a minor exceeds 200')
  }
  return { truth: n(truth), models, limits }
}

// ---------------------------------------------------------------- d3-row-ops

type Numbers = number[][]
const ENVS: Record<string, number>[] = [
  { a: 3, b: -2, c: 5, d: 7, e: -4, f: 1, g: -6, h: 2, i: 9 },
  { a: -5, b: 4, c: 2, d: -3, e: 8, f: -7, g: 1, h: 6, i: -2 },
]
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']

interface Decomposition {
  readonly c1: number
  readonly m: number
  readonly combined: boolean
  readonly s: number
  readonly swapped: boolean
  readonly transposed: boolean
}

function applyDecomposition(
  a: Numbers,
  ops: {
    combine: { i: number; j: number; c1: number; m: number } | null
    scale: { r: number; s: number } | null
    swap: { rows: boolean; x: number; y: number } | null
    transposed: boolean
  },
): Numbers {
  let cur = a.map((row) => [...row])
  if (ops.combine) {
    const { i, j, c1, m } = ops.combine
    cur[i] = (cur[i] ?? []).map((v, col) => c1 * v + m * (cur[j]?.[col] ?? 0))
  }
  if (ops.scale) cur[ops.scale.r] = (cur[ops.scale.r] ?? []).map((v) => v * (ops.scale?.s ?? 1))
  if (ops.swap) {
    const { rows, x, y } = ops.swap
    if (rows) [cur[x], cur[y]] = [cur[y] as number[], cur[x] as number[]]
    else
      cur = cur.map((row) =>
        row.map((v, col) => (col === x ? (row[y] as number) : col === y ? (row[x] as number) : v)),
      )
  }
  if (ops.transposed) cur = (cur[0] ?? []).map((_, c) => cur.map((row) => row[c] as number))
  return cur
}

function analyseRowOps(q: Question): Analysis {
  const [base, shown] = matrixBlocks(q.stem)
  if (!base || !shown) throw new Error('row-ops stem needs two determinants')
  if (base.rows.flat().join('') !== LETTERS.join('')) throw new Error('first determinant is not a..i')
  const d = parseInteger(stemOf(q), /= (-?\d+)\$ olduğuna/)
  if (d === null) throw new Error('|A| is not given')

  // Truth: the ratio of the two determinants, for two assignments of the letters (Leibniz on both).
  const ratios = ENVS.map((env) => {
    const before = leibniz(evalGrid(base.rows, env))
    if (Q.isZero(before)) throw new Error('assignment makes |A| zero')
    return Q.div(leibniz(evalGrid(shown.rows, env)), before)
  })
  const factor = ratios[0] as Rational
  if (!ratios.every((r) => Q.equals(r, factor)) || factor.den !== 1n)
    throw new Error('shown determinant is not a multiple of |A|')
  const f = Number(factor.num)

  // Which operations produced it? Search the small operation space and keep what reproduces the entries.
  const originals = ENVS.map((env) => evalGrid(base.rows, env).map((row) => row.map((v) => Number(v.num))))
  const targets = ENVS.map((env) => shown.rows.map((row) => row.map((e) => evalLinear(e, env))))
  const same = (x: Numbers, y: Numbers) => x.every((row, i) => row.every((v, j) => v === y[i]?.[j]))
  const matches: Decomposition[] = []
  const pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
  ] as const
  const combines = [
    null,
    ...[0, 1, 2].flatMap((i) =>
      [0, 1, 2]
        .filter((j) => j !== i)
        .flatMap((j) => [1, -1].flatMap((c1) => [1, -1, 2, -2].map((m) => ({ i, j, c1, m })))),
    ),
  ]
  const scales = [null, ...[0, 1, 2].flatMap((r) => [2, 3, -2, -3].map((s) => ({ r, s })))]
  const swaps = [null, ...[true, false].flatMap((rows) => pairs.map(([x, y]) => ({ rows, x, y })))]
  for (const combine of combines)
    for (const scale of scales)
      for (const swap of swaps)
        for (const transposed of [false, true]) {
          const ops = { combine, scale, swap, transposed }
          const ok = originals.every((o, e) => same(applyDecomposition(o, ops), targets[e] as Numbers))
          if (ok)
            matches.push({
              c1: combine?.c1 ?? 1,
              m: combine?.m ?? 0,
              combined: combine !== null,
              s: scale?.s ?? 1,
              swapped: swap !== null,
              transposed,
            })
        }
  if (matches.length === 0) throw new Error('shown determinant is not explained by the known operations')
  if (!matches.every((x) => x.c1 * x.s * (x.swapped ? -1 : 1) === f))
    throw new Error('decompositions disagree with the determinant ratio')

  const models: Record<string, OptionValue[]> = {
    'factor-only': [n(int(f))],
    'forgot-swap-sign': [],
    'applied-addition-factor': [],
    'forgot-scale-factor': [],
    'lost-negated-row-sign': [],
    'transpose-flips-sign': [],
    'divided-by-scale': [],
  }
  for (const x of matches) {
    const swapSign = x.swapped ? -1 : 1
    if (x.swapped) models['forgot-swap-sign']?.push(n(int(d * x.c1 * x.s)))
    if (x.combined && Math.abs(x.m) >= 2) models['applied-addition-factor']?.push(n(int(d * f * x.m)))
    if (Math.abs(x.s) >= 2) {
      models['forgot-scale-factor']?.push(n(int(d * x.c1 * swapSign)))
      models['divided-by-scale']?.push(n(Q.rational(d * x.c1 * swapSign, x.s)))
    }
    if (x.c1 === -1) models['lost-negated-row-sign']?.push(n(int(d * x.s * swapSign)))
    if (x.transposed) models['transpose-flips-sign']?.push(n(int(-d * f)))
  }
  return { truth: n(int(d * f)), models, limits: sizeLimits(int(d * f)) }
}

// ---------------------------------------------------------------- d3-singular-param

function analyseSingular(q: Question): Analysis {
  const block = matrixBlocks(q.stem)[0]
  if (block?.rows.length !== 3) throw new Error('needs a 3x3 matrix in k')
  const at = (kValue: number) => leibniz(evalGrid(block.rows, { k: kValue }))
  const coefficients = (valueAt: (kValue: number) => Rational) => {
    const [f0, f1, f2, f3] = [0, 1, 2, 3].map(valueAt) as [Rational, Rational, Rational, Rational]
    const d1 = Q.sub(f1, f0)
    const d2 = Q.add(Q.sub(f2, Q.mul(int(2), f1)), f0)
    const d3 = Q.sub(Q.add(Q.sub(f3, Q.mul(int(3), f2)), Q.mul(int(3), f1)), f0)
    const half = Q.rational(1, 2)
    return {
      c3: Q.div(d3, int(6)),
      c2: Q.mul(Q.sub(d2, d3), half),
      c1: Q.add(Q.sub(d1, Q.mul(d2, half)), Q.div(d3, int(3))),
      c0: f0,
    }
  }
  const evaluate = (c: ReturnType<typeof coefficients>, x: number): Rational =>
    Q.add(Q.add(Q.mul(c.c2, int(x * x)), Q.mul(c.c1, int(x))), c.c0)
  const integerRoots = (c: ReturnType<typeof coefficients>): Rational[] | null => {
    if (!Q.isZero(c.c3) || Q.isZero(c.c2)) return null
    const roots = Array.from({ length: 61 }, (_, i) => i - 30).filter((x) => Q.isZero(evaluate(c, x)))
    if (roots.length !== 2) return null
    const [r1, r2] = roots as [number, number]
    const exact =
      Q.equals(c.c1, Q.neg(Q.mul(c.c2, int(r1 + r2)))) && Q.equals(c.c0, Q.mul(c.c2, int(r1 * r2)))
    return exact ? roots.map(int) : null
  }
  const real = coefficients(at)
  const found = integerRoots(real)
  if (!found) throw new Error('determinant is not a quadratic with two distinct integer roots')
  for (const r of found)
    if (!Q.isZero(at(Number(r.num)))) throw new Error('a root does not make the matrix singular')
  const [p, qq] = found as [Rational, Rational]

  // Checkerboard ignored: first-row expansion with every sign plus.
  const plusRow = (kValue: number) => {
    const grid = evalGrid(block.rows, { k: kValue })
    return expand(grid, { kind: 'row', index: 0 }, false)
  }
  const plusRoots = integerRoots(coefficients(plusRow))
  const models: Record<string, OptionValue[]> = {
    'negated-roots': [rootSet([Q.neg(p), Q.neg(qq)])],
    'only-smaller-root': [rootSet([p])],
    'only-larger-root': [rootSet([qq])],
    'sign-slip-on-smaller-root': [rootSet([Q.neg(p), qq])],
    'checkerboard-ignored': plusRoots ? [rootSet(plusRoots)] : [],
  }
  const limits = found.some((r) => abs(r).num > 9n) ? ['a root exceeds 9'] : []
  return { truth: rootSet(found), models, limits }
}

// ---------------------------------------------------------------- driver

const ANALYSERS: Readonly<Record<string, (q: Question) => Analysis>> = {
  ...MATRIX_ANALYSERS,
  ...ROW_ANALYSERS,
  ...DET_ANALYSERS,
  ...SYSTEM_ANALYSERS,
  'd3-scalar': analyseScalar,
  'd3-row-ops': analyseRowOps,
  'd2-numeric': analyseNumeric,
  'd4-adjugate': analyseAdjugate,
  'd3-singular-param': analyseSingular,
}

export const familyOf = (id: string): string | null => {
  const m = /^v1-gen-([a-z0-9-]+)-(?:\d{2}|s\d+)$/.exec(id)
  return m?.[1] !== undefined && m[1] in ANALYSERS ? m[1] : null
}

function analyse(q: Question): Analysis {
  const family = familyOf(q.id)
  const analyser = family === null ? undefined : ANALYSERS[family]
  if (!analyser) throw new Error(`no verifier for ${q.id}`)
  return analyser(q)
}

/** Everything wrong with a generated question's math; empty means every claim was recomputed and held. */
export function verifyQuestion(q: Question): string[] {
  let analysis: Analysis
  try {
    analysis = analyse(q)
  } catch (error) {
    return [`${q.id}: ${(error as Error).message}`]
  }
  const problems: string[] = []
  const values = new Map<string, OptionValue>()
  for (const o of q.options) {
    const v = parseOptionValue(o.content)
    if (!v) problems.push(`option ${o.key} cannot be read`)
    else values.set(o.key, v)
  }
  const keys = [...values.values()].map(valueKey)
  if (new Set(keys).size !== keys.length) problems.push('two options show the same value')
  const equalTruth = optionKeys.filter((k) => {
    const v = values.get(k)
    return v !== undefined && sameValue(v, analysis.truth)
  })
  if (equalTruth.length !== 1) problems.push(`${equalTruth.length} options equal the recomputed answer`)
  else if (equalTruth[0] !== q.answer) problems.push(`answer is ${q.answer} but ${equalTruth[0]} is correct`)
  const slugs = q.options.flatMap((o) => (o.errorType ? [o.errorType] : []))
  if (new Set(slugs).size !== slugs.length) problems.push('an errorType is used twice')
  for (const o of q.options) {
    if (o.key === q.answer) continue
    const v = values.get(o.key)
    const allowed = o.errorType === undefined ? undefined : analysis.models[o.errorType]
    if (!o.errorType || !allowed) problems.push(`option ${o.key}: no model for errorType "${o.errorType}"`)
    else if (v && !allowed.some((a) => sameValue(a, v))) {
      problems.push(
        `option ${o.key}: "${o.errorType}" gives ${allowed.map(valueKey).join(' | ') || 'nothing'} on this data, not ${valueKey(v)}`,
      )
    }
  }
  return problems
}

/** Phone-fit problems: the generic rules plus the family's own limits. Empty means it fits. */
export function phoneFitProblems(q: Question): string[] {
  try {
    const shownRoots = q.options.flatMap((o) => {
      const v = parseOptionValue(o.content)
      return v?.kind === 'set' ? v.roots : []
    })
    const roots = shownRoots.some((r) => abs(r).num > 9n) ? ['an option shows a k value above 9'] : []
    return [...genericFit(q), ...analyse(q).limits, ...roots]
  } catch (error) {
    return [`${q.id}: ${(error as Error).message}`]
  }
}
