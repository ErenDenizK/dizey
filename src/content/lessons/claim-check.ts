import { expect } from 'vitest'
import type { ComplexMatrix } from '../../lib/math/complex'
import * as C from '../../lib/math/complex'
import type { Matrix } from '../../lib/math/matrix'
import * as M from '../../lib/math/matrix'
import type { Rational } from '../../lib/math/rational'
import * as Q from '../../lib/math/rational'
import { evaluate, evaluateMatrix } from './expression'
import type {
  Beat,
  Claim,
  ComplexDerived,
  ComplexProperty,
  Derived,
  Lesson,
  MatrixBlock,
  Property,
  RowOp,
} from './types'

// Claim checking shared by the lesson tests and the summary tests: every claimed number is recomputed with
// the math core (src/lib/math). Test-only; the app never imports this file.

export function parse(text: string): Rational {
  const value = Q.parse(text)
  if (!value) throw new Error(`Not a number: ${text}`)
  return value
}

/** Evaluates an entry such as "3", "-4/3", "k", "-k", "2k", "k+1" with the given parameters. */
export function entry(text: string, params: Readonly<Record<string, Rational>>): Rational {
  const direct = Q.parse(text)
  if (direct) return direct
  let total = Q.ZERO
  const terms = text.replaceAll(' ', '').match(/[+-]?[^+-]+/g) ?? []
  for (const term of terms) {
    const match = /^([+-]?)(\d*(?:\/\d+)?)([a-z]?)$/.exec(term)
    if (!match) throw new Error(`Cannot evaluate "${text}"`)
    const [, sign, coefficient, symbol] = match
    let value = coefficient ? parse(coefficient) : Q.ONE
    if (symbol) {
      const p = params[symbol]
      if (!p) throw new Error(`No value for ${symbol} in "${text}"`)
      value = Q.mul(value, p)
    }
    total = Q.add(total, sign === '-' ? Q.neg(value) : value)
  }
  return total
}

export function numeric(block: MatrixBlock, params: Readonly<Record<string, Rational>> = {}): Matrix {
  return M.fromNumbers(block.rows.map((row) => row.map((v) => entry(v, params))))
}

export function matrixOf(lesson: Lesson, name: string): MatrixBlock {
  const found = lesson.matrices[name]
  if (!found) throw new Error(`${lesson.id}: no matrix ${name}`)
  return found
}

export function sarrusSums(a: Matrix): [Rational, Rational] {
  const e = (i: number, j: number) => M.at(a, i, j % 3)
  let plus = Q.ZERO
  let minus = Q.ZERO
  for (let s = 0; s < 3; s++) {
    plus = Q.add(plus, Q.mul(Q.mul(e(0, s), e(1, s + 1)), e(2, s + 2)))
    minus = Q.add(minus, Q.mul(Q.mul(e(0, s + 2), e(1, s + 1)), e(2, s)))
  }
  return [plus, minus]
}

export function cofactorMatrix(a: Matrix): Matrix {
  return a.map((row, i) =>
    row.map((_, j) => {
      const sub = M.fromNumbers(a.filter((_, r) => r !== i).map((r) => r.filter((_, c) => c !== j)))
      const minor = M.determinant(sub)
      return (i + j) % 2 === 0 ? minor : Q.neg(minor)
    }),
  )
}

export function derive(a: Matrix, of: Derived): Matrix {
  const adjugate = M.transpose(cofactorMatrix(a))
  if (of === 'cofactors') return cofactorMatrix(a)
  if (of === 'adjugate') return adjugate
  return M.scale(Q.div(Q.ONE, M.determinant(a)), adjugate)
}

export const formatMatrix = (a: Matrix) => a.map((row) => row.map(Q.format))
export const formatRows = (rows: readonly (readonly string[])[]) =>
  rows.map((row) => row.map((v) => Q.format(parse(v))))

/** Lesson matrices by name (those with numeric entries), plus `where` aliases. */
export function scope(lesson: Lesson, where: Readonly<Record<string, string>> = {}): Record<string, Matrix> {
  const out: Record<string, Matrix> = {}
  for (const [name, block] of Object.entries(lesson.matrices)) {
    if (block.rows.every((row) => row.every((v) => Q.parse(v)))) out[name] = numeric(block)
  }
  for (const [alias, name] of Object.entries(where)) out[alias] = numeric(matrixOf(lesson, name))
  return out
}

export function valueMatrix(
  source: string,
  matrices: Readonly<Record<string, Matrix>>,
  scalars: Readonly<Record<string, Rational>> = {},
): Matrix {
  const value = evaluate(source, matrices, scalars)
  if (!('matrix' in value)) throw new Error(`"${source}" is a scalar`)
  return value.matrix
}

export function power(a: Matrix, k: number): Matrix {
  let out = M.identity(M.rowCount(a))
  for (let i = 0; i < k; i++) out = M.multiply(out, a)
  return out
}

/** Zero rows last, each leading entry right of the one above; reduced: leading 1s alone in their columns. */
export function echelon(a: Matrix, reduced: boolean): boolean {
  let lastLead = -1
  let seenZero = false
  for (const [i, row] of a.entries()) {
    const lead = row.findIndex((v) => !Q.isZero(v))
    if (lead === -1) {
      seenZero = true
      continue
    }
    if (seenZero || lead <= lastLead) return false
    lastLead = lead
    if (reduced) {
      if (!Q.equals(M.at(a, i, lead), Q.ONE)) return false
      if (a.some((_, r) => r !== i && !Q.isZero(M.at(a, r, lead)))) return false
    }
  }
  return true
}

export function hasProperty(a: Matrix, is: Property, index?: number): boolean {
  const n = M.rowCount(a)
  if (is === 'rowEchelon' || is === 'reducedRowEchelon') return echelon(a, is === 'reducedRowEchelon')
  if (M.columnCount(a) !== n) return false
  const zero = M.scale(Q.ZERO, a)
  switch (is) {
    case 'symmetric':
      return M.equals(M.transpose(a), a)
    case 'antisymmetric':
      return M.equals(M.transpose(a), M.scale(Q.neg(Q.ONE), a))
    case 'idempotent':
      return M.equals(M.multiply(a, a), a)
    case 'involutory':
      return M.equals(M.multiply(a, a), M.identity(n))
    case 'orthogonal':
      return M.equals(M.multiply(M.transpose(a), a), M.identity(n))
    case 'nilpotent':
      // An n×n nilpotent matrix has index at most n.
      return index
        ? M.equals(power(a, index), zero) && !M.equals(power(a, index - 1), zero)
        : M.equals(power(a, n), zero)
    case 'singular':
      return Q.isZero(M.determinant(a))
    case 'diagonal':
      return a.every((row, i) => row.every((v, j) => i === j || Q.isZero(v)))
    case 'scalar':
      return hasProperty(a, 'diagonal') && a.every((_, i) => Q.equals(M.at(a, i, i), M.at(a, 0, 0)))
    case 'identity':
      return M.equals(a, M.identity(n))
    case 'upperTriangular':
      return a.every((row, i) => row.every((v, j) => j >= i || Q.isZero(v)))
    case 'lowerTriangular':
      return a.every((row, i) => row.every((v, j) => j <= i || Q.isZero(v)))
    case 'periodic': {
      const limit = index ?? 24
      for (let k = 1; k < limit; k++) if (M.equals(power(a, k + 1), a)) return index === undefined
      return M.equals(power(a, limit + 1), a)
    }
  }
}

export function rowOp(op: RowOp): M.RowOperation {
  if (op.kind === 'swap') return op
  return { ...op, factor: parse(op.factor) }
}

export function checkBeat(lesson: Lesson, beat: Beat): void {
  if (beat.kind === 'sequence') for (const b of beat.beats) checkBeat(lesson, b)
  if (beat.kind === 'transpose') {
    // Every entry `into` shows is the transpose's; the rows the beat writes start as "?".
    const t = M.transpose(numeric(matrixOf(lesson, beat.matrix)))
    const into = matrixOf(lesson, beat.into)
    expect(into.rows.length, `${beat.into} rows`).toBe(t.length)
    into.rows.forEach((row, i) => {
      row.forEach((value, j) => {
        if (value !== '?')
          expect(Q.format(parse(value)), `${beat.into}[${i}][${j}]`).toBe(Q.format(M.at(t, i, j)))
      })
    })
    const written = beat.rows ?? t[0]?.map((_, r) => r) ?? []
    for (const r of written) for (const row of into.rows) expect(row[r], `${beat.into} column ${r}`).toBe('?')
    return
  }
  if (beat.kind === 'combine') {
    // Every entry the stage shows (or the beat writes) is the scaled sum; "?" marks one still unknown.
    let sum: Matrix | null = null
    for (const term of beat.terms) {
      const scaled = M.scale(parse(term.scale ?? '1'), numeric(matrixOf(lesson, term.matrix)))
      sum = sum ? M.add(sum, scaled) : scaled
    }
    if (!sum || !beat.into) return
    const into = matrixOf(lesson, beat.into)
    into.rows.forEach((row, i) => {
      row.forEach((value, j) => {
        if (value !== '?')
          expect(Q.format(parse(value)), `${beat.into}[${i}][${j}]`).toBe(Q.format(M.at(sum as Matrix, i, j)))
      })
    })
    for (const [i, j] of beat.cells) expect(into.rows[i]?.[j], `${beat.into} cell ${i},${j}`).toBe('?')
    return
  }
  if (beat.kind === 'product') {
    // Every entry the stage shows (or the beat writes) is left · right; "?" marks one still unknown.
    const product = M.multiply(numeric(matrixOf(lesson, beat.left)), numeric(matrixOf(lesson, beat.right)))
    for (const [i, j] of beat.cells) {
      expect(i, 'cell row').toBeLessThan(product.length)
      expect(j, 'cell column').toBeLessThan(product[0]?.length ?? 0)
    }
    if (!beat.into) return
    const into = matrixOf(lesson, beat.into)
    expect(into.rows.length, `${beat.into} rows`).toBe(product.length)
    into.rows.forEach((row, i) => {
      expect(row.length, `${beat.into} columns`).toBe(product[0]?.length)
      row.forEach((value, j) => {
        if (value !== '?')
          expect(Q.format(parse(value)), `${beat.into}[${i}][${j}]`).toBe(Q.format(M.at(product, i, j)))
      })
    })
    for (const [i, j] of beat.cells) expect(into.rows[i]?.[j], `${beat.into} cell ${i},${j}`).toBe('?')
    return
  }
  if (beat.kind !== 'rowOps') return
  let a = numeric(matrixOf(lesson, beat.matrix))
  for (const op of beat.ops) a = M.applyRowOperation(a, rowOp(op))
  expect(formatMatrix(a), `${beat.matrix} → ${beat.result}`).toEqual(
    formatMatrix(numeric(matrixOf(lesson, beat.result))),
  )
}

export const solutionLabels = { unique: 'Tek çözüm', infinite: 'Sonsuz çözüm', none: 'Çözüm yok' } as const

export function paramsOf(at: Readonly<Record<string, string>> = {}): Record<string, Rational> {
  return Object.fromEntries(Object.entries(at).map(([k, v]) => [k, parse(v)]))
}

/** Splits an augmented lesson matrix into A and b at its bar (default: before the last column). */
export function system(block: MatrixBlock, params: Readonly<Record<string, Rational>>): [Matrix, Matrix] {
  const full = numeric(block, params)
  const bar = block.augmentedAt ?? M.columnCount(full) - 1
  return [full.map((row) => row.slice(0, bar)), full.map((row) => row.slice(bar))]
}

export const complexOf = (block: MatrixBlock): ComplexMatrix => C.matrixFromStrings(block.rows)
export const formatComplex = (rows: readonly (readonly string[])[]) =>
  C.matrixFromStrings(rows).map((row) => row.map(C.format))

export function deriveComplex(a: ComplexMatrix, of: ComplexDerived): ComplexMatrix {
  return of === 'conjugate' ? C.conjugate(a) : C.conjugateTranspose(a)
}

export function hasComplexProperty(a: ComplexMatrix, is: ComplexProperty): boolean {
  return is === 'hermitian' ? C.isHermitian(a) : C.isSkewHermitian(a)
}

export function checkClaim(lesson: Lesson, claim: Claim): void {
  if (claim.kind === 'expr') {
    const rows = formatRows(claim.equals)
    expect(
      formatMatrix(evaluateMatrix(claim.expr, scope(lesson, claim.where), rows.length)),
      claim.expr,
    ).toEqual(rows)
    return
  }
  if (claim.kind === 'exprEntry') {
    const a = valueMatrix(claim.expr, scope(lesson, claim.where))
    expect(Q.format(M.at(a, claim.row - 1, claim.col - 1)), claim.expr).toBe(Q.format(parse(claim.equals)))
    return
  }
  if (claim.kind === 'property') {
    const a = valueMatrix(claim.expr, scope(lesson, claim.where))
    expect(hasProperty(a, claim.is, claim.index), `${claim.expr} ${claim.is}`).toBe(claim.holds ?? true)
    return
  }
  if (claim.kind === 'optionProperty' || claim.kind === 'optionExpr' || claim.kind === 'optionSystem') return
  if (claim.kind === 'optionComplexProperty') return
  if (claim.kind === 'complexDerived') {
    const a = deriveComplex(complexOf(matrixOf(lesson, claim.matrix)), claim.of)
    expect(
      a.map((row) => row.map(C.format)),
      `${claim.of} ${claim.matrix}`,
    ).toEqual(formatComplex(claim.equals))
    return
  }
  if (claim.kind === 'complexProperty') {
    const a = complexOf(matrixOf(lesson, claim.matrix))
    expect(hasComplexProperty(a, claim.is), `${claim.matrix} ${claim.is}`).toBe(claim.holds ?? true)
    return
  }
  if (claim.kind === 'complexDet') {
    const a = complexOf(matrixOf(lesson, claim.matrix))
    const expected = C.parse(claim.equals)
    if (!expected) throw new Error(`Not a complex number: ${claim.equals}`)
    expect(C.format(C.determinant(a)), `det ${claim.matrix}`).toBe(C.format(expected))
    return
  }
  if (claim.kind === 'trace') {
    const a = valueMatrix(claim.expr, scope(lesson, claim.where))
    let total = Q.ZERO
    for (let i = 0; i < M.rowCount(a); i++) total = Q.add(total, M.at(a, i, i))
    expect(Q.format(total), `tr(${claim.expr})`).toBe(Q.format(parse(claim.equals)))
    return
  }
  if (claim.kind === 'solve') {
    const matrices = scope(lesson, claim.where)
    const isZeroAt = (value: Rational) => {
      const a = valueMatrix(claim.expr, matrices, { [claim.variable]: value })
      return M.equals(a, M.scale(Q.ZERO, a))
    }
    const at = parse(claim.equals)
    expect(isZeroAt(at), claim.expr).toBe(true)
    for (const shift of [-2, -1, 1, 2]) expect(isZeroAt(Q.add(at, Q.rational(shift))), claim.expr).toBe(false)
    return
  }
  if (claim.kind === 'detProduct') {
    let product: Matrix | null = null
    for (const factor of claim.factors) {
      let f = numeric(matrixOf(lesson, factor.matrix))
      if (factor.transpose) f = M.transpose(f)
      const power = factor.power ?? 1
      let base = f
      if (power < 0) {
        const inverse = M.inverse(f)
        if (!inverse) throw new Error(`${lesson.id}: ${factor.matrix} is singular`)
        base = inverse
      }
      let raised = M.identity(M.rowCount(f))
      for (let i = 0; i < Math.abs(power); i++) raised = M.multiply(raised, base)
      product = product ? M.multiply(product, raised) : raised
    }
    if (!product) throw new Error('Empty product')
    const scaled = M.scale(parse(claim.scalar ?? '1'), product)
    expect(Q.format(M.determinant(scaled))).toBe(Q.format(parse(claim.equals)))
    return
  }
  const block = matrixOf(lesson, claim.matrix)
  switch (claim.kind) {
    case 'rank': {
      const a = numeric(block, paramsOf(claim.at))
      const cut = claim.columns === undefined ? a : a.map((row) => row.slice(0, claim.columns))
      expect(String(M.rank(cut)), `rank ${claim.matrix}`).toBe(claim.equals)
      return
    }
    case 'system': {
      const [a, b] = system(block, paramsOf(claim.at))
      expect(M.classifySystem(a, b), `${claim.matrix} ${JSON.stringify(claim.at ?? {})}`).toBe(claim.is)
      return
    }
    case 'det': {
      const params = paramsOf(claim.at)
      expect(Q.format(M.determinant(numeric(block, params)))).toBe(Q.format(parse(claim.equals)))
      return
    }
    case 'derived':
      expect(formatMatrix(derive(numeric(block), claim.of))).toEqual(formatRows(claim.equals))
      return
    case 'derivedEntry':
      expect(Q.format(M.at(derive(numeric(block), claim.of), claim.row - 1, claim.col - 1))).toBe(
        Q.format(parse(claim.equals)),
      )
      return
    case 'derivedDet':
      expect(Q.format(M.determinant(derive(numeric(block), claim.of)))).toBe(Q.format(parse(claim.equals)))
      return
    case 'minor':
    case 'cofactor': {
      const a = numeric(block)
      const sub = M.fromNumbers(
        a.filter((_, i) => i !== claim.row - 1).map((row) => row.filter((_, j) => j !== claim.col - 1)),
      )
      const minor = M.determinant(sub)
      const value = claim.kind === 'minor' || (claim.row + claim.col) % 2 === 0 ? minor : Q.neg(minor)
      expect(Q.format(value)).toBe(Q.format(parse(claim.equals)))
      return
    }
    case 'sarrus': {
      const [plus, minus] = sarrusSums(numeric(block))
      expect([Q.format(plus), Q.format(minus)]).toEqual([claim.plus, claim.minus])
      return
    }
    case 'detRoots': {
      const zeros = new Set<string>()
      let nonZero = false
      for (let den = 1; den <= 6; den++) {
        for (let num = -60; num <= 60; num++) {
          const value = Q.rational(num, den)
          const det = M.determinant(numeric(block, { [claim.variable]: value }))
          if (Q.isZero(det)) zeros.add(Q.format(value))
          else nonZero = true
        }
      }
      expect(nonZero).toBe(true)
      expect([...zeros].sort()).toEqual(claim.roots.map((r) => Q.format(parse(r))).sort())
      return
    }
  }
}
