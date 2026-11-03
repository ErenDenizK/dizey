import * as Q from '../../../lib/math/rational'
import type { Question } from '../types'
import type { OptionValue } from './types'
import { evalLinear, parseLinear } from './verify-parse'
import {
  type Analysis,
  at,
  blockRows,
  evalRule,
  int,
  integerGrid,
  multiplied,
  n,
  numeric,
  sizeLimits,
  stemOf,
  transposed,
} from './verify-shared'

/**
 * Verifier for the matrix-chapter families (M1, M2, M4, M6, M10). Everything is read back from the displayed
 * stem; unknowns are found by search over a range of integers, never by the generators' algebra.
 */

type Models = Record<string, OptionValue[]>

// ------------------------------------------------------------------ m1: reading a_ij

function swapAnalysis(text: string, entry: (i: number, j: number) => number): Analysis {
  const m = /\$a_\{(\d)(\d)\} ([+-]) a_\{(\d)(\d)\}\$/.exec(text)
  if (!m) throw new Error('cannot read the a_ij expression')
  const [p, q, r, s] = [m[1], m[2], m[4], m[5]].map(Number) as [number, number, number, number]
  const plus = m[3] === '+'
  const combine = (x: number, y: number, add = plus) => (add ? x + y : x - y)
  const [v1, v2, t1, t2] = [entry(p, q), entry(r, s), entry(q, p), entry(s, r)] as [
    number,
    number,
    number,
    number,
  ]
  const models: Models = {
    'swapped-indices': [numeric(combine(t1, t2))],
    'swapped-first': [numeric(combine(t1, v2))],
    'swapped-second': [numeric(combine(v1, t2))],
    'op-flipped': [numeric(combine(v1, v2, !plus))],
  }
  const limits =
    p === q || r === s ? ['an entry sits on the diagonal, so swapping i and j changes nothing'] : []
  return { truth: numeric(combine(v1, v2)), models, limits }
}

function analyseEntries(q: Question): Analysis {
  const grid = integerGrid(blockRows(q, 0))
  if (grid.length !== 3 || grid.some((row) => row.length !== 3)) throw new Error('needs a 3x3 matrix')
  return swapAnalysis(stemOf(q), (i, j) => at(grid, i - 1, j - 1))
}

function analyseRule(q: Question): Analysis {
  const text = stemOf(q)
  const rule = /a_\{ij\} = (.+?)\$ olduğuna/.exec(text)?.[1]
  if (!rule || !/\]_\{3 \\times 3\}/.test(text)) throw new Error('cannot read the rule or the 3x3 size')
  return swapAnalysis(text, (i, j) => evalRule(rule, i, j))
}

function analyseCount(q: Question): Analysis {
  const text = stemOf(q)
  const size = /\]_\{(\d) \\times (\d)\}/.exec(text)
  const relation = /\$i (<|>|\\le|\\ge) j\$ olan elemanlar \$(\d)\$/.exec(text)
  if (!size || !relation) throw new Error('cannot read the size, the relation or the value')
  const [rows, cols] = [Number(size[1]), Number(size[2])]
  const rel = relation[1] as string
  const value = Number(relation[2])
  const holds = (r: string, i: number, j: number) =>
    r === '<' ? i < j : r === '>' ? i > j : r === '\\le' ? i <= j : i >= j
  const count = (r: string, m: number, k: number) => {
    let total = 0
    for (let i = 1; i <= m; i++) for (let j = 1; j <= k; j++) if (holds(r, i, j)) total++
    return total
  }
  const strictness: Record<string, string> = { '<': '\\le', '\\le': '<', '>': '\\ge', '\\ge': '>' }
  const reverse: Record<string, string> = { '<': '>', '>': '<', '\\le': '\\ge', '\\ge': '\\le' }
  const honest = count(rel, rows, cols)
  const models: Models = {
    'size-swapped': [numeric(value * count(rel, cols, rows))],
    'strictness-flipped': [numeric(value * count(strictness[rel] as string, rows, cols))],
    'opposite-triangle': [numeric(value * count(reverse[rel] as string, rows, cols))],
    'all-entries-counted': [numeric(value * rows * cols)],
    'diagonal-only': [numeric(value * Math.min(rows, cols))],
    'both-triangles': [numeric(value * (rows * cols - Math.min(rows, cols)))],
    'value-ignored': [numeric(honest)],
  }
  return {
    truth: numeric(value * honest),
    models,
    limits: rows === cols ? ['a square matrix hides the m x n mistake'] : [],
  }
}

// ------------------------------------------------------------------ m2: matrix types

type Op = '+' | '-' | '\\cdot'
const combineXY = (op: Op, x: number, y: number) => (op === '+' ? x + y : op === '-' ? x - y : x * y)
const OTHER_OP: Record<Op, Op> = { '+': '\\cdot', '-': '+', '\\cdot': '+' }

function readOp(text: string): Op {
  const op = /\$x (\+|-|\\cdot) y\$ kaçtır/.exec(text)?.[1]
  if (!op) throw new Error('cannot read the asked expression in x and y')
  return op as Op
}

function analyseTypes(q: Question): Analysis {
  const rows = blockRows(q, 0)
  const text = stemOf(q)
  const type = /üst üçgen/.test(text)
    ? 'upper'
    : /alt üçgen/.test(text)
      ? 'lower'
      : /birim matris/.test(text)
        ? 'identity'
        : /skaler matris/.test(text)
          ? 'scalar'
          : /köşegen matris/.test(text)
            ? 'diagonal'
            : null
  if (!type) throw new Error('cannot read the matrix type')
  const op = readOp(text)
  const found: [number, number][] = []
  for (let x = -15; x <= 15; x++)
    for (let y = -15; y <= 15; y++) {
      const g = rows.map((row) => row.map((e) => evalLinear(e, { x, y })))
      let ok = true
      for (const [i, row] of g.entries()) {
        for (const [j, v] of row.entries()) {
          if (i === j) {
            if (type === 'identity' && v !== 1) ok = false
            if (type === 'scalar' && v !== at(g, 0, 0)) ok = false
          } else {
            const mustVanish = type === 'upper' ? i > j : type === 'lower' ? i < j : true
            if (mustVanish && v !== 0) ok = false
          }
        }
      }
      if (ok) found.push([x, y])
    }
  if (found.length !== 1) throw new Error(`${found.length} pairs (x, y) make the matrix ${type}`)
  const [x, y] = found[0] as [number, number]
  const models: Models = {
    'x-sign-slip': [numeric(combineXY(op, -x, y))],
    'y-sign-slip': [numeric(combineXY(op, x, -y))],
    'operation-swapped': [numeric(combineXY(OTHER_OP[op], x, y))],
    'only-x': [numeric(x)],
    'only-y': [numeric(y)],
  }
  const limits = [...(Math.abs(x) > 9 || Math.abs(y) > 9 ? ['x or y exceeds 9'] : [])]
  return { truth: numeric(combineXY(op, x, y)), models, limits }
}

// ------------------------------------------------------------------ m4: alpha A + beta B = C

function analyseCombo(q: Question): Analysis {
  const text = stemOf(q)
  const m = /\$(\d*)A ([+-]) (\d*)B = C\$/.exec(text)
  if (!m) throw new Error('cannot read the combination')
  const alpha = m[1] === '' ? 1 : Number(m[1])
  const beta = (m[2] === '-' ? -1 : 1) * (m[3] === '' ? 1 : Number(m[3]))
  const wanted = /olduğuna göre \$(x \+ y|x)\$ kaçtır/.exec(text)?.[1]
  if (!wanted) throw new Error('cannot read the asked unknowns')
  const [shownA, shownB, shownC] = [blockRows(q, 0), blockRows(q, 1), blockRows(q, 2)]
  const c = integerGrid(shownC)
  const unknowns: { grid: 'A' | 'B'; i: number; j: number; letter: string }[] = []
  for (const [name, rows] of [
    ['A', shownA],
    ['B', shownB],
  ] as const)
    for (const [i, row] of rows.entries()) {
      for (const [j, e] of row.entries()) {
        if (/^[xy]$/.test(e)) unknowns.push({ grid: name, i, j, letter: e })
      }
    }
  if (unknowns.length !== wanted.split('+').length)
    throw new Error('unknown count differs from the asked sum')
  const letters = unknowns.map((u) => u.letter).sort()
  if (new Set(letters).size !== letters.length) throw new Error('an unknown letter repeats')

  const range = Array.from({ length: 61 }, (_, i) => i - 30)
  const holds = (env: Record<string, number>) =>
    shownA.every((row, i) =>
      row.every(
        (e, j) => alpha * evalLinear(e, env) + beta * evalLinear(shownB[i]?.[j] ?? '0', env) === at(c, i, j),
      ),
    )
  const solutions: Record<string, number>[] = []
  for (const x of range)
    for (const y of unknowns.length === 2 ? range : [0]) {
      const env = { x, y }
      if (holds(env)) solutions.push(env)
    }
  if (solutions.length !== 1) throw new Error(`${solutions.length} solutions of the matrix equation`)
  const env = solutions[0] as Record<string, number>
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
  const truth = sum(unknowns.map((u) => env[u.letter] as number))

  const numericAt = (rows: readonly (readonly string[])[], i: number, j: number): number | null => {
    const e = rows[i]?.[j]
    return e !== undefined && /^-?\d+$/.test(e) ? Number(e) : null
  }
  const value = (variant: string): Q.Rational | null => {
    let total = Q.ZERO
    for (const u of unknowns) {
      const mineIsA = u.grid === 'A'
      const mine = mineIsA ? alpha : beta
      const theirs = mineIsA ? beta : alpha
      const otherRows = mineIsA ? shownB : shownA
      const [i, j] = variant === 'position-transposed' ? [u.j, u.i] : [u.i, u.j]
      if (i > 1 || j >= (shownC[0]?.length ?? 0)) return null
      const other = numericAt(otherRows, i, j)
      const own = numericAt(mineIsA ? shownA : shownB, i, j)
      const cValue = at(c, i, j)
      if (other === null || (variant === 'position-transposed' && own === null)) return null
      let part: Q.Rational
      if (variant === 'other-sign-flipped') part = Q.rational(cValue + theirs * other, mine)
      else if (variant === 'divide-forgotten') {
        if (mine === 1) return null
        part = int(cValue - theirs * other)
      } else if (variant === 'scalars-ignored') {
        if (alpha === 1 && Math.abs(beta) === 1) return null
        const sign = theirs < 0 ? -1 : 1
        part = mineIsA ? int(cValue - sign * other) : Q.rational(cValue - other, beta < 0 ? -1 : 1)
      } else part = Q.rational(cValue - theirs * other, mine)
      total = Q.add(total, part)
    }
    return total
  }
  const honest = value('truth')
  if (!honest || !Q.equals(honest, int(truth)))
    throw new Error('the displayed entries do not give the unknowns')
  const models: Models = {}
  for (const slug of ['other-sign-flipped', 'divide-forgotten', 'scalars-ignored', 'position-transposed']) {
    const v = value(slug)
    models[slug] = v ? [n(v)] : []
  }
  return { truth: numeric(truth), models, limits: sizeLimits(int(truth)) }
}

// ------------------------------------------------------------------ m6: entry of (XY)^T

function analyseTranspose(q: Question): Analysis {
  const text = stemOf(q)
  const m = /\$\(([AB])(\^T)? ([AB])(\^T)?\)\^T\$ matrisinin (\d)\. satır (\d)\. sütunundaki/.exec(text)
  if (!m) throw new Error('cannot read the transpose expression')
  const a = integerGrid(blockRows(q, 0))
  const b = integerGrid(blockRows(q, 1))
  const pick = (name: string | undefined) => (name === 'A' ? a : b)
  const [base1, base2] = [pick(m[1]), pick(m[3])]
  const [t1, t2] = [m[2] !== undefined, m[4] !== undefined]
  const [i, j] = [Number(m[5]) - 1, Number(m[6]) - 1]
  if (m[1] === m[3]) throw new Error('both factors are the same matrix')
  const size = a.length
  if (b.length !== size || a.some((row) => row.length !== size) || b.some((row) => row.length !== size))
    throw new Error('A and B must be square of one size')
  const shown1 = t1 ? transposed(base1) : base1
  const shown2 = t2 ? transposed(base2) : base2
  const product = multiplied(shown1, shown2)
  const truth = at(transposed(product), i, j)
  // Independent check of the truth: (XY)^T = Y^T X^T.
  const byRule = at(multiplied(transposed(shown2), transposed(shown1)), i, j)
  if (byRule !== truth) throw new Error('(XY)^T and Y^T X^T disagree')
  const models: Models = {
    'transpose-forgotten': [numeric(at(product, i, j))],
    'order-kept': [numeric(at(multiplied(transposed(shown1), transposed(shown2)), i, j))],
    'order-reversed-no-transpose': [numeric(at(multiplied(shown2, shown1), i, j))],
    'inner-transpose-ignored': [numeric(at(transposed(multiplied(base1, base2)), i, j))],
  }
  const limits = [
    ...(i === j ? ['the entry is on the diagonal'] : []),
    ...(!t1 && !t2 ? ['no inner transpose'] : []),
  ]
  return { truth: numeric(truth), models, limits: [...limits, ...sizeLimits(int(truth))] }
}

// ------------------------------------------------------------------ m10: Hermitian and skew-Hermitian

interface Lin {
  readonly [symbol: string]: number
}
interface CxForm {
  readonly re: Lin
  readonly im: Lin
}

/** `x+3i` -> re x, im 3; `2-yi` -> re 2, im -y; `-i` -> im -1; `3` -> re 3. */
function parseComplexEntry(entry: string): CxForm {
  if (!entry.endsWith('i')) return { re: parseLinear(entry), im: {} }
  const body = entry.slice(0, -1)
  const cut = Math.max(body.lastIndexOf('+'), body.lastIndexOf('-'))
  const reText = cut > 0 ? body.slice(0, cut) : ''
  const imText = cut > 0 ? body.slice(cut) : body
  const im = imText === '' || imText === '+' ? '1' : imText === '-' ? '-1' : imText
  return { re: reText === '' ? {} : parseLinear(reText), im: parseLinear(im) }
}

const evalLin = (lin: Lin, env: Readonly<Record<string, number>>): number =>
  Object.entries(lin).reduce(
    (sum, [symbol, coef]) => sum + coef * (symbol === '' ? 1 : (env[symbol] ?? 0)),
    0,
  )

type Definition = 'herm' | 'skew' | 'sym' | 'anti'
const SIGNS: Record<Definition, { re: number; im: number }> = {
  herm: { re: 1, im: -1 },
  skew: { re: -1, im: 1 },
  sym: { re: 1, im: 1 },
  anti: { re: -1, im: -1 },
}

function analyseHermitian(q: Question): Analysis {
  const text = stemOf(q)
  const rows = blockRows(q, 0)
  const op = readOp(text)
  const skew = /ters Hermitian/.test(text)
  const forms = rows.map((row) => row.map(parseComplexEntry))
  const size = forms.length
  const hasLetter = (f: CxForm | undefined, part: 're' | 'im') =>
    f !== undefined && Object.keys(f[part]).some((s) => s !== '')

  const solve = (definition: Definition, everySlot: boolean): [number, number][] => {
    const found: [number, number][] = []
    for (let x = -30; x <= 30; x++)
      for (let y = -30; y <= 30; y++) {
        const env = { x, y }
        let ok = true
        for (let i = 0; i < size && ok; i++)
          for (let j = i; j < size && ok; j++)
            for (const part of ['re', 'im'] as const) {
              const b = forms[i]?.[j]
              const c = forms[j]?.[i]
              if (!b || !c) continue
              if (!everySlot && (i === j || !(hasLetter(b, part) || hasLetter(c, part)))) continue
              if (evalLin(c[part], env) !== SIGNS[definition][part] * evalLin(b[part], env)) ok = false
            }
        if (ok) found.push([x, y])
      }
    return found
  }
  const trueDefinition: Definition = skew ? 'skew' : 'herm'
  const truthSolutions = solve(trueDefinition, true)
  if (truthSolutions.length !== 1)
    throw new Error(`${truthSolutions.length} real pairs (x, y) fit the definition`)
  const [x, y] = truthSolutions[0] as [number, number]
  const valueUnder = (definition: Definition): OptionValue[] => {
    const found = solve(definition, false)
    const only = found.length === 1 ? found[0] : undefined
    return only ? [numeric(combineXY(op, only[0], only[1]))] : []
  }
  const models: Models = {
    'x-sign-slip': [numeric(combineXY(op, -x, y))],
    'y-sign-slip': [numeric(combineXY(op, x, -y))],
    'operation-swapped': [numeric(combineXY(OTHER_OP[op], x, y))],
    'treated-as-symmetric': valueUnder('sym'),
    'treated-as-antisymmetric': valueUnder('anti'),
    'other-definition': valueUnder(skew ? 'herm' : 'skew'),
  }
  return { truth: numeric(combineXY(op, x, y)), models, limits: sizeLimits(int(combineXY(op, x, y))) }
}

export const MATRIX_ANALYSERS: Readonly<Record<string, (q: Question) => Analysis>> = {
  'm1-entries': analyseEntries,
  'm1-rule': analyseRule,
  'm1-count': analyseCount,
  'm2-types': analyseTypes,
  'm4-combo': analyseCombo,
  'm6-transpose': analyseTranspose,
  'm10-hermitian': analyseHermitian,
}
