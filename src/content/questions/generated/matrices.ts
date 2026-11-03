import * as Q from '../../../lib/math/rational'
import { matrix, text } from '../blocks'
import { buildQuestion } from '../engine/assemble'
import { num } from '../engine/format'
import type { Rng } from '../engine/prng'
import type { Draft, DraftDistractor, Family } from '../engine/types'
import type { Block, Question } from '../types'
import { cell, flip, type Ints, linearForm, paren, randomGrid, times, toStrings, wrong } from './shared'

/**
 * Generated questions for the matrix chapter: reading a matrix (M1), basic types (M2), equality and linear
 * combinations (M4), transpose (M6) and conjugate / Hermitian (M10). Turkish text lives here; the engine lays
 * out the options and `../engine/verify-matrices.ts` re-checks every item independently.
 */

const R = (n: number, d = 1) => Q.rational(n, d)
const rational = (errorType: string, value: Q.Rational, feedback: string): DraftDistractor => ({
  value: num(value.num, value.den),
  errorType,
  feedback,
})
const distinct = (values: readonly number[]): boolean => new Set(values).size === values.length

// ------------------------------------------------------------------ shared by m1-entries and m1-rule

interface EntryPair {
  readonly p: number
  readonly q: number
  readonly r: number
  readonly s: number
  readonly op: '+' | '-'
}

function pickPair(rng: Rng): EntryPair | null {
  const p = rng.int(1, 3)
  const q = rng.int(1, 3)
  const r = rng.int(1, 3)
  const s = rng.int(1, 3)
  if (p === q || r === s || (p === r && q === s) || (p === s && q === r)) return null
  return { p, q, r, s, op: rng.chance(0.5) ? '+' : '-' }
}

const calc = (op: '+' | '-', x: number, y: number): number => (op === '+' ? x + y : x - y)
const flipOp = (op: '+' | '-'): '+' | '-' => (op === '+' ? '-' : '+')
const entryTex = (i: number, j: number) => `a_{${i}${j}}`

/** The four mistakes of reading `a_ij` and combining two entries. */
function swapDraft(
  stem: readonly Block[],
  pair: EntryPair,
  at: (i: number, j: number) => number,
  explainEntry: (i: number, j: number, value: number) => string,
): Draft | null {
  const { p, q, r, s, op } = pair
  const [v1, v2, t1, t2] = [at(p, q), at(r, s), at(q, p), at(s, r)] as [number, number, number, number]
  if (t1 === v1 || t2 === v2 || v2 === 0) return null
  const truth = calc(op, v1, v2)
  const values = [truth, calc(op, t1, t2), calc(op, t1, v2), calc(op, v1, t2), calc(flipOp(op), v1, v2)]
  if (!distinct(values)) return null
  const read = (i: number, j: number) => `$${entryTex(i, j)}$ ${i}. satır ${j}. sütundaki elemandır`
  const explanation = `${explainEntry(p, q, v1)} ${explainEntry(r, s, v2)} Sonuç: $${v1} ${op} ${paren(v2)} = ${truth}$.`
  const distractors: DraftDistractor[] = [
    wrong(
      'swapped-indices',
      calc(op, t1, t2),
      `$a_{ij}$’de önce satır, sonra sütun gelir. İki elemanı da ters okumuşsun: ${read(p, q)}, ${read(r, s)}.`,
    ),
    wrong(
      'swapped-first',
      calc(op, t1, v2),
      `İlk elemanı ters okumuşsun: ${read(p, q)} ($a_{ij}$: önce satır $i$, sonra sütun $j$).`,
    ),
    wrong(
      'swapped-second',
      calc(op, v1, t2),
      `İkinci elemanı ters okumuşsun: ${read(r, s)} ($a_{ij}$: önce satır $i$, sonra sütun $j$).`,
    ),
    wrong(
      'op-flipped',
      calc(flipOp(op), v1, v2),
      `Elemanları doğru okudun ($${v1}$ ve $${v2}$) ama işlemi ters yapmışsın: istenen $${entryTex(p, q)} ${op} ${entryTex(r, s)}$.`,
    ),
  ]
  return { stem, correct: num(truth), distractors, explanation }
}

// ------------------------------------------------------------------ m1-entries

export const m1Entries: Family = {
  id: 'm1-entries',
  node: 'M1',
  generate(rng: Rng): Draft | null {
    const pair = pickPair(rng)
    if (!pair) return null
    const grid = randomGrid(rng, 3, 3, -5, 9)
    const at = (i: number, j: number) => cell(grid, i - 1, j - 1)
    const stem = [
      text('Aşağıdaki $A = [a_{ij}]$ matrisi için'),
      matrix(toStrings(grid), 'A ='),
      text(`$${entryTex(pair.p, pair.q)} ${pair.op} ${entryTex(pair.r, pair.s)}$ değeri kaçtır?`),
    ]
    return swapDraft(
      stem,
      pair,
      at,
      (i, j, v) => `$${entryTex(i, j)}$: ${i}. satır, ${j}. sütun, yani $${v}$.`,
    )
  },
}

// ------------------------------------------------------------------ m1-rule

interface Rule {
  readonly tex: string
  readonly value: (i: number, j: number) => number
  readonly sub: (i: number, j: number) => string
}

/** Rules that are not symmetric in i and j, so that swapping the indices changes the value. */
const RULES: readonly Rule[] = [
  { tex: '2i - j', value: (i, j) => 2 * i - j, sub: (i, j) => `2 \\cdot ${i} - ${j}` },
  { tex: 'i - 2j', value: (i, j) => i - 2 * j, sub: (i, j) => `${i} - 2 \\cdot ${j}` },
  { tex: 'i + 2j', value: (i, j) => i + 2 * j, sub: (i, j) => `${i} + 2 \\cdot ${j}` },
  { tex: '2i + j', value: (i, j) => 2 * i + j, sub: (i, j) => `2 \\cdot ${i} + ${j}` },
  { tex: 'i^2 - j', value: (i, j) => i * i - j, sub: (i, j) => `${i}^2 - ${j}` },
  { tex: 'j^2 - i', value: (i, j) => j * j - i, sub: (i, j) => `${j}^2 - ${i}` },
  { tex: '3i - 2j', value: (i, j) => 3 * i - 2 * j, sub: (i, j) => `3 \\cdot ${i} - 2 \\cdot ${j}` },
  { tex: 'i^2 + j', value: (i, j) => i * i + j, sub: (i, j) => `${i}^2 + ${j}` },
]

export const m1Rule: Family = {
  id: 'm1-rule',
  node: 'M1',
  generate(rng: Rng): Draft | null {
    const pair = pickPair(rng)
    if (!pair) return null
    const rule = rng.pick(RULES)
    const stem = [
      text(
        `$A = [a_{ij}]_{3 \\times 3}$ matrisinde $a_{ij} = ${rule.tex}$ olduğuna göre $${entryTex(pair.p, pair.q)} ${pair.op} ${entryTex(pair.r, pair.s)}$ kaçtır?`,
      ),
    ]
    return swapDraft(
      stem,
      pair,
      rule.value,
      (i, j, v) => `$${entryTex(i, j)} = ${rule.sub(i, j)} = ${v}$ ($i = ${i}$, $j = ${j}$).`,
    )
  },
}

// ------------------------------------------------------------------ m1-count

type Relation = '<' | '>' | '\\le' | '\\ge'
const holds = (rel: Relation, i: number, j: number): boolean =>
  rel === '<' ? i < j : rel === '>' ? i > j : rel === '\\le' ? i <= j : i >= j
const countOf = (rel: Relation, rows: number, cols: number): number => {
  let total = 0
  for (let i = 1; i <= rows; i++) for (let j = 1; j <= cols; j++) if (holds(rel, i, j)) total++
  return total
}
const strict = (rel: Relation): Relation =>
  ({ '<': '\\le', '\\le': '<', '>': '\\ge', '\\ge': '>' })[rel] as Relation
const opposite = (rel: Relation): Relation =>
  ({ '<': '>', '>': '<', '\\le': '\\ge', '\\ge': '\\le' })[rel] as Relation

export const m1Count: Family = {
  id: 'm1-count',
  node: 'M1',
  generate(rng: Rng): Draft | null {
    const rows = rng.int(2, 5)
    const cols = rng.int(2, 5)
    if (rows === cols) return null
    const rel = rng.pick<Relation>(['<', '>', '\\le', '\\ge'])
    const value = rng.pick([1, 2, 3])
    const count = countOf(rel, rows, cols)
    const truth = value * count
    const swapped = value * countOf(rel, cols, rows)
    const flipped = value * countOf(strict(rel), rows, cols)
    const other = value * countOf(opposite(rel), rows, cols)
    const all = value * rows * cols
    const diagonal = value * Math.min(rows, cols)
    const both = value * (rows * cols - Math.min(rows, cols))
    const wrongCounts = [swapped, flipped, other, all, diagonal, both, ...(value > 1 ? [count] : [])].filter(
      (v) => v !== truth,
    )
    if (new Set(wrongCounts).size < 4 || truth === 0) return null
    const stem = [
      text(
        `$A = [a_{ij}]_{${rows} \\times ${cols}}$ matrisinde $i ${rel} j$ olan elemanlar $${value}$, diğer elemanlar $0$’dır. $A$ matrisinin tüm elemanlarının toplamı kaçtır?`,
      ),
    ]
    const perRow = Array.from(
      { length: rows },
      (_, i) => Array.from({ length: cols }, (_, j) => j + 1).filter((j) => holds(rel, i + 1, j)).length,
    )
    const explanation = `$${rows} \\times ${cols}$ tipinde: ${rows} satır, ${cols} sütun. $i ${rel} j$ olan elemanları satır satır say: ${perRow.map((c, i) => `${i + 1}. satırda ${c}`).join(', ')}. ${count} eleman${value > 1 ? `, her biri ${value}` : ''}: toplam $${truth}$.`
    const distractors: DraftDistractor[] = [
      wrong(
        'size-swapped',
        swapped,
        `$m \\times n$ tipinde $m$ satır, $n$ sütundur: burada ${rows} satır ve ${cols} sütun var. Satır ve sütun sayısını ters almışsın.`,
      ),
      wrong(
        'strictness-flipped',
        flipped,
        'Köşegeni yanlış ele almışsın: $i < j$ ve $i > j$ köşegenin ($i = j$) dışında kalır, $\\le$ ve $\\ge$ ise köşegeni de içerir.',
      ),
      wrong(
        'opposite-triangle',
        other,
        `Yanlış üçgeni saymışsın: $i ${rel} j$ koşulunu sağlayan elemanlar sayılacak, karşıt üçgen değil.`,
      ),
      wrong(
        'all-entries-counted',
        all,
        `Bütün elemanları saymışsın ($${rows} \\cdot ${cols}$ eleman). Yalnız $i ${rel} j$ olanlar $${value}$, diğerleri $0$.`,
      ),
      wrong(
        'diagonal-only',
        diagonal,
        `Yalnız köşegeni saymışsın ($${Math.min(rows, cols)}$ eleman). $i ${rel} j$ koşulunu sağlayan bütün elemanlar sayılmalı.`,
      ),
      wrong(
        'both-triangles',
        both,
        `İki üçgeni birden saymışsın: köşegen dışındaki ${rows * cols - Math.min(rows, cols)} eleman. Yalnız $i ${rel} j$ koşulunu sağlayanlar sayılmalı.`,
      ),
      ...(value > 1
        ? [
            wrong(
              'value-ignored',
              count,
              `Koşulu sağlayan ${count} elemanı saymışsın ama her biri $${value}$ değerinde; toplam $${count} \\cdot ${value}$ olur.`,
            ),
          ]
        : []),
    ]
    return { stem, correct: num(truth), distractors, explanation }
  },
}

// ------------------------------------------------------------------ m2-types

type MatrixType = 'diagonal' | 'scalar' | 'identity' | 'upper' | 'lower'
const TYPE_WORD: Record<MatrixType, string> = {
  diagonal: 'köşegen',
  scalar: 'skaler',
  identity: 'birim',
  upper: 'üst üçgen',
  lower: 'alt üçgen',
}
const TYPE_RULE: Record<MatrixType, string> = {
  diagonal: 'Köşegen matriste köşegen dışındaki her eleman $0$ olur.',
  scalar: 'Skaler matriste köşegen dışı elemanlar $0$, köşegen elemanları birbirine eşittir.',
  identity: 'Birim matriste köşegen elemanları $1$, diğer elemanlar $0$ olur.',
  upper: 'Üst üçgen matriste köşegenin altındaki her eleman $0$ olur.',
  lower: 'Alt üçgen matriste köşegenin üstündeki her eleman $0$ olur.',
}

type Expression = '+' | '-' | '\\cdot'
const express = (op: Expression, x: number, y: number): number =>
  op === '+' ? x + y : op === '-' ? x - y : x * y
const otherOp = (op: Expression): Expression => (op === '+' ? '\\cdot' : '+')
const opText = (op: Expression, x: number, y: number) => `${paren(x)} ${op} ${paren(y)}`

/** Two named mistakes that only change how x and y are combined, shared by the unknowns families. */
function combineMistakes(op: Expression, x: number, y: number): DraftDistractor[] {
  const wanted = `$x ${op} y$`
  return [
    wrong(
      'x-sign-slip',
      express(op, -x, y),
      `Doğru değerler $x = ${x}$ ve $y = ${y}$. İstenen ${wanted} için $x$’in işaretini ters almışsın.`,
    ),
    wrong(
      'y-sign-slip',
      express(op, x, -y),
      `Doğru değerler $x = ${x}$ ve $y = ${y}$. İstenen ${wanted} için $y$’nin işaretini ters almışsın.`,
    ),
    wrong(
      'operation-swapped',
      express(otherOp(op), x, y),
      `Doğru değerler $x = ${x}$ ve $y = ${y}$ ama istenen ${wanted}: işlemi karıştırmışsın.`,
    ),
    wrong('only-x', x, `$x = ${x}$ bulunur ama soru ${wanted} istiyor, yalnız $x$ değil.`),
    wrong('only-y', y, `$y = ${y}$ bulunur ama soru ${wanted} istiyor, yalnız $y$ değil.`),
  ]
}

const satisfies = (type: MatrixType, grid: readonly (readonly number[])[]): boolean => {
  const n = grid.length
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const v = cell(grid, i, j)
      if (i === j) {
        if (type === 'identity' && v !== 1) return false
        if (type === 'scalar' && v !== cell(grid, 0, 0)) return false
      } else if (type === 'upper' ? i > j && v !== 0 : type === 'lower' ? i < j && v !== 0 : v !== 0) {
        return false
      }
    }
  return true
}

export const m2Types: Family = {
  id: 'm2-types',
  node: 'M2',
  generate(rng: Rng): Draft | null {
    const type = rng.pick<MatrixType>([
      'diagonal',
      'scalar',
      'identity',
      'upper',
      'lower',
      'diagonal',
      'scalar',
    ])
    const size = type === 'upper' || type === 'lower' ? 3 : rng.pick([2, 3])
    const values = { x: rng.pick([-3, -2, -1, 1, 2, 3, 4]), y: rng.pick([-3, -2, -1, 1, 2, 3, 4]) }
    const op = rng.pick<Expression>(['+', '-', '\\cdot'])
    const common = type === 'identity' ? 1 : rng.int(1, 5)
    const zeroAt = (i: number, j: number) =>
      i !== j && (type === 'upper' ? i > j : type === 'lower' ? i < j : true)
    const targetAt = (i: number, j: number): number | null =>
      i === j ? (type === 'scalar' || type === 'identity' ? common : null) : zeroAt(i, j) ? 0 : null

    const slots: [number, number][] = []
    for (let i = 0; i < size; i++)
      for (let j = 0; j < size; j++) if (targetAt(i, j) !== null) slots.push([i, j])
    const order = rng.shuffle(slots)
    const formFor = (target: number, vars: readonly ('x' | 'y')[]): string | null => {
      const coefs = vars.map(() => rng.pick([1, 1, 2, -1]))
      const total = vars.reduce((sum, v, t) => sum + (coefs[t] ?? 0) * values[v], 0)
      const offset = target - total
      if (Math.abs(offset) > 9) return null
      return linearForm(
        vars.map((v, t) => [coefs[t] ?? 0, v] as const),
        offset,
      )
    }
    const rows: string[][] = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => String(targetAt(i, j) ?? rng.int(-4, 9))),
    )
    const equations: string[] = []
    for (const [slot, [i, j]] of order.entries()) {
      const target = targetAt(i, j) as number
      const vars: ('x' | 'y')[] =
        slot === 0 ? ['x'] : slot === 1 ? ['y'] : rng.chance(0.12) ? [rng.pick(['x', 'y'])] : []
      if (vars.length === 0) continue
      const form = formFor(target, vars)
      if (form === null || form.length > 6) return null
      ;(rows[i] as string[])[j] = form
      equations.push(`${form} = ${target}`)
    }
    if (equations.length < 2) return null

    // Exactly one (x, y) must make the displayed matrix of this type.
    let solutions = 0
    for (let x = -12; x <= 12; x++)
      for (let y = -12; y <= 12; y++) {
        const grid = rows.map((row) => row.map((e) => evalForm(e, x, y)))
        if (satisfies(type, grid)) solutions++
      }
    if (solutions !== 1) return null

    const truth = express(op, values.x, values.y)
    const opLabel = op === '\\cdot' ? '\\cdot' : op
    const stem = [
      text('$x$ ve $y$ gerçel sayılar olmak üzere'),
      matrix(rows, 'A ='),
      text(`$A$ matrisi bir ${TYPE_WORD[type]} matris ise $x ${opLabel} y$ kaçtır?`),
    ]
    const explanation = `${TYPE_RULE[type]} Koşullar: ${equations.map((e) => `$${e}$`).join(', ')}. Buradan $x = ${values.x}$, $y = ${values.y}$; $x ${opLabel} y = ${opText(op, values.x, values.y)} = ${truth}$.`
    return {
      stem,
      correct: num(truth),
      distractors: combineMistakes(op, values.x, values.y),
      explanation,
    }
  },
}

/** Value of a displayed entry such as `2x-y+3` at a given (x, y); used only to check uniqueness. */
function evalForm(entry: string, x: number, y: number): number {
  let total = 0
  for (const m of entry.matchAll(/([+-]?)(\d*)([xy]?)/g)) {
    if (!m[0]) continue
    const sign = m[1] === '-' ? -1 : 1
    const digits = m[2] === '' ? 1 : Number(m[2])
    const symbol = m[3]
    total += sign * digits * (symbol === 'x' ? x : symbol === 'y' ? y : 1)
  }
  return total
}

// ------------------------------------------------------------------ m4-combo

const sgn = (n: number) => (n < 0 ? -1 : 1)
const coefText = (n: number) => (Math.abs(n) === 1 ? '' : String(Math.abs(n)))

export const m4Combo: Family = {
  id: 'm4-combo',
  node: 'M4',
  generate(rng: Rng): Draft | null {
    const alpha = rng.pick([1, 1, 2, 3])
    const beta = rng.pick([-3, -2, -1, 1, 2, 3])
    const cols = rng.pick([2, 2, 3])
    const a = randomGrid(rng, 2, cols, -3, 4)
    const b = randomGrid(rng, 2, cols, -3, 4)
    const c = a.map((row, i) => row.map((v, j) => alpha * v + beta * cell(b, i, j)))
    if (c.some((row) => row.some((v) => Math.abs(v) > 9))) return null

    const two = rng.chance(0.35)
    const inA = rng.chance(0.5)
    const spots = [
      { grid: inA ? 'A' : 'B', i: rng.int(0, 1), j: rng.int(0, cols - 1), letter: 'x' },
      ...(two ? [{ grid: inA ? 'B' : 'A', i: rng.int(0, 1), j: rng.int(0, cols - 1), letter: 'y' }] : []),
    ] as { grid: 'A' | 'B'; i: number; j: number; letter: 'x' | 'y' }[]
    const valueUnder = (s: { grid: 'A' | 'B'; i: number; j: number }) =>
      cell(s.grid === 'A' ? a : b, s.i, s.j)
    if (spots.some((s) => valueUnder(s) === 0)) return null
    const shownA = toStrings(a)
    const shownB = toStrings(b)
    for (const s of spots) ((s.grid === 'A' ? shownA : shownB)[s.i] as string[])[s.j] = s.letter
    if (
      two &&
      (spots[0] as { i: number; j: number }).i === (spots[1] as { i: number; j: number }).i &&
      (spots[0] as { j: number }).j === (spots[1] as { j: number }).j
    )
      return null
    const isUnknown = (g: 'A' | 'B', i: number, j: number) =>
      spots.some((s) => s.grid === g && s.i === i && s.j === j)

    /** One unknown, solved honestly or with a named slip. */
    const solve = (s: (typeof spots)[number], variant: string): Q.Rational | null => {
      const row = s.i
      const col = s.j
      const mine = s.grid === 'A' ? alpha : beta
      const theirs = s.grid === 'A' ? beta : alpha
      const otherGrid = s.grid === 'A' ? b : a
      const otherName = s.grid === 'A' ? 'B' : 'A'
      let [i, j] = [row, col]
      if (variant === 'position-transposed') {
        ;[i, j] = [col, row]
        if (i > 1 || j >= cols || isUnknown(otherName as 'A' | 'B', i, j) || isUnknown(s.grid, i, j))
          return null
      }
      const cValue = cell(c, i, j)
      const other = cell(otherGrid, i, j)
      if (variant === 'other-sign-flipped') return Q.rational(cValue + theirs * other, mine)
      if (variant === 'divide-forgotten') return mine === 1 ? null : R(cValue - theirs * other)
      if (variant === 'scalars-ignored') {
        if (Math.abs(alpha) === 1 && Math.abs(beta) === 1 && alpha === 1) return null
        return Q.rational(cValue - sgn(theirs) * other, s.grid === 'A' ? 1 : sgn(beta))
      }
      return Q.rational(cValue - theirs * other, mine)
    }
    const combine = (variant: string): Q.Rational | null => {
      const parts = spots.map((s) => solve(s, variant))
      if (parts.some((p) => p === null)) return null
      return parts.reduce<Q.Rational>((sum, p) => Q.add(sum, p as Q.Rational), Q.ZERO)
    }
    const truth = combine('truth') as Q.Rational
    if (!spots.every((s) => Q.equals(solve(s, 'truth') as Q.Rational, R(valueUnder(s))))) return null

    const lead = `${coefText(alpha)}A ${beta < 0 ? '-' : '+'} ${coefText(beta)}B = C`
    const wanted = two ? 'x + y' : 'x'
    const stem = [
      matrix(shownA, 'A ='),
      matrix(shownB, 'B ='),
      matrix(toStrings(c), 'C ='),
      text(`$${lead}$ olduğuna göre $${wanted}$ kaçtır?`),
    ]
    const slips: [string, string][] = [
      [
        'other-sign-flipped',
        'Eşitliği $x$’e taşırken diğer matrisin terimini yanlış işaretle geçirmişsin: çarpanıyla birlikte işaretini de koru.',
      ],
      ['divide-forgotten', 'Bilinmeyenin önündeki skaleri bölmeyi unutmuşsun: $kx = m$ ise $x = m / k$.'],
      [
        'scalars-ignored',
        `Skalerleri yok saymışsın: soru $${lead}$, yani her matris kendi skaleriyle çarpılır.`,
      ],
      [
        'position-transposed',
        'Elemanları yanlış yerden almışsın: eşitlikte aynı satır ve sütundaki elemanlar eşleşir ($a_{ij}$ ile $b_{ij}$ ve $c_{ij}$).',
      ],
    ]
    const distractors = slips.flatMap(([errorType, feedback]) => {
      const value = combine(errorType)
      return value ? [rational(errorType, value, feedback)] : []
    })
    const lines = spots.map((s) => {
      const at = `${s.i + 1}. satır ${s.j + 1}. sütun`
      const mine = s.grid === 'A' ? alpha : beta
      const theirs = s.grid === 'A' ? beta : alpha
      const otherGrid = s.grid === 'A' ? b : a
      const left = `${mine === 1 ? '' : `${paren(mine)}\\cdot `}${s.letter} + ${paren(theirs)}\\cdot ${paren(cell(otherGrid, s.i, s.j))} = ${cell(c, s.i, s.j)}`
      return `${at}: $${left}$, $${s.letter} = ${valueUnder(s)}$`
    })
    const explanation = `Matrisler eşit olduğundan karşılıklı elemanlar eşittir; bilinmeyenin bulunduğu yere bak. ${lines.join('; ')}.${two ? ` $x + y = ${Q.format(truth)}$.` : ''}`
    return { stem, correct: num(truth.num, truth.den), distractors, explanation }
  },
}

// ------------------------------------------------------------------ m6-transpose

interface Factor {
  readonly base: 'A' | 'B'
  readonly t: boolean
}
const factorTex = (f: Factor) => `${f.base}${f.t ? '^T' : ''}`

export const m6Transpose: Family = {
  id: 'm6-transpose',
  node: 'M6',
  alsoNodes: ['M5'],
  generate(rng: Rng): Draft | null {
    const n = rng.pick([2, 2, 2, 3])
    const a = randomGrid(rng, n, n, -3, 4)
    const b = randomGrid(rng, n, n, -3, 4)
    const first: 'A' | 'B' = rng.chance(0.5) ? 'A' : 'B'
    const f1: Factor = { base: first, t: rng.chance(0.5) }
    const f2: Factor = { base: first === 'A' ? 'B' : 'A', t: rng.chance(0.5) }
    if (!f1.t && !f2.t) return null
    const i = rng.int(1, n)
    const j = rng.int(1, n)
    if (i === j) return null
    const base = (f: Factor): Ints => (f.base === 'A' ? a : b)
    const shown = (f: Factor): Ints => (f.t ? flip(base(f)) : base(f))
    const product = times(shown(f1), shown(f2))
    const entry = (m: Ints) => cell(m, i - 1, j - 1)
    const truth = entry(flip(product))
    const wrongValues = {
      'transpose-forgotten': entry(product),
      'order-kept': entry(times(flip(shown(f1)), flip(shown(f2)))),
      'order-reversed-no-transpose': entry(times(shown(f2), shown(f1))),
      'inner-transpose-ignored': entry(flip(times(base(f1), base(f2)))),
    }
    if (!distinct([truth, ...Object.values(wrongValues)])) return null

    const expression = `(${factorTex(f1)} ${factorTex(f2)})^T`
    const stem = [
      matrix(toStrings(a), 'A ='),
      matrix(toStrings(b), 'B ='),
      text(`$${expression}$ matrisinin ${i}. satır ${j}. sütunundaki eleman kaçtır?`),
    ]
    const left = shown(f1)[j - 1] ?? []
    const right = shown(f2).map((row) => row[i - 1] ?? 0)
    const dot = left.map((v, k) => `${paren(v)} \\cdot ${paren(right[k] ?? 0)}`).join(' + ')
    const explanation = `$(XY)^T$’nin $(${i}, ${j})$ elemanı, $XY$’nin $(${j}, ${i})$ elemanıdır. $X = ${factorTex(f1)}$’in ${j}. satırı ile $Y = ${factorTex(f2)}$’nin ${i}. sütununu çarp: $${dot} = ${truth}$. (Tersini almak: $(XY)^T = Y^T X^T$.)`
    const distractors: DraftDistractor[] = [
      wrong(
        'transpose-forgotten',
        wrongValues['transpose-forgotten'],
        `Dıştaki transpozu unutmuşsun: $(XY)^T$’nin $(${i}, ${j})$ elemanı $XY$’nin $(${j}, ${i})$ elemanıdır, $(${i}, ${j})$ değil.`,
      ),
      wrong(
        'order-kept',
        wrongValues['order-kept'],
        '$(XY)^T = X^T Y^T$ değildir: transpoz alınca çarpımın sırası tersine döner, $(XY)^T = Y^T X^T$.',
      ),
      wrong(
        'order-reversed-no-transpose',
        wrongValues['order-reversed-no-transpose'],
        'Sırayı ters çevirmişsin ama çarpanların kendi transpozlarını almamışsın: $(XY)^T = Y^T X^T$.',
      ),
      wrong(
        'inner-transpose-ignored',
        wrongValues['inner-transpose-ignored'],
        'Parantez içindeki $T$’leri yok saymışsın: $A^T$, $A$’nın satırlarını sütun yapar, bu da çarpımı değiştirir.',
      ),
    ]
    return { stem, correct: num(truth), distractors, explanation }
  },
}

// ------------------------------------------------------------------ m10-hermitian

interface Cx {
  readonly re: string
  readonly im: string
}

const negateTerm = (s: string): string => (s === '0' ? '0' : s.startsWith('-') ? s.slice(1) : `-${s}`)

/** `x`, `3`, `-2y` as the two parts of an entry; the imaginary unit is added here. */
function composeEntry({ re, im }: Cx): string {
  if (im === '0') return re
  const token = im === '1' ? 'i' : im === '-1' ? '-i' : `${im}i`
  if (re === '0') return token
  return `${re}${token.startsWith('-') ? '' : '+'}${token}`
}

interface PairState {
  b: Cx
  c: Cx
  /** Numeric value of each part; for a variable part, the coefficient times the unknown. */
  nums: { bRe: number; bIm: number; cRe: number; cIm: number }
}

type Side = 'b' | 'c'

export const m10Hermitian: Family = {
  id: 'm10-hermitian',
  node: 'M10',
  generate(rng: Rng): Draft | null {
    const herm = rng.chance(0.5)
    const size = 2
    const pairs: [number, number][] =
      size === 2
        ? [[0, 1]]
        : [
            [0, 1],
            [0, 2],
            [1, 2],
          ]
    const x = rng.pick([-3, -2, -1, 1, 2, 3, 4])
    const y = rng.pick([-3, -2, -1, 1, 2, 3, 4])
    const op = rng.pick<Expression>(['+', '-', '\\cdot'])
    // sign of the relation c = sign * b for the real and the imaginary part: Hermitian (+, -), skew (-, +).
    const sign = (kind: 're' | 'im', definition: 'herm' | 'skew' | 'sym' | 'anti') =>
      definition === 'herm'
        ? kind === 're'
          ? 1
          : -1
        : definition === 'skew'
          ? kind === 're'
            ? -1
            : 1
          : definition === 'sym'
            ? 1
            : -1
    const truth = herm ? 'herm' : 'skew'

    const slots = pairs.flatMap((_, p) => (['re', 'im'] as const).map((kind) => ({ p, kind })))
    const [sx, sy] = rng.shuffle(slots)
    if (!sx || !sy) return null
    const state: PairState[] = pairs.map(() => ({
      b: { re: '0', im: '0' },
      c: { re: '0', im: '0' },
      nums: { bRe: rng.int(-4, 4), bIm: rng.int(-4, 4), cRe: 0, cIm: 0 },
    }))
    const info: { letter: 'x' | 'y'; p: number; kind: 're' | 'im'; side: Side; coef: number }[] = []
    for (const [slot, letter, value] of [
      [sx, 'x', x],
      [sy, 'y', y],
    ] as const) {
      const st = state[slot.p] as PairState
      const side: Side = rng.chance(0.5) ? 'b' : 'c'
      const coef = rng.pick([1, 1, -1, 2])
      const s = sign(slot.kind, truth)
      const varValue = coef * value
      const key = (sd: Side) =>
        sd === 'b' ? (slot.kind === 're' ? 'bRe' : 'bIm') : slot.kind === 're' ? 'cRe' : 'cIm'
      if (side === 'b') st.nums[key('b')] = varValue
      else st.nums[key('c')] = varValue
      // The partner part follows from the definition (c = s * b, so b = s * c).
      if (side === 'b') st.nums[key('c')] = s * varValue
      else st.nums[key('b')] = s * varValue
      info.push({ letter, p: slot.p, kind: slot.kind, side, coef })
    }
    // Non-variable slots follow from b.
    const isVar = (p: number, kind: 're' | 'im') => info.some((v) => v.p === p && v.kind === kind)
    for (const [p, st] of state.entries()) {
      if (!isVar(p, 're')) st.nums.cRe = sign('re', truth) * st.nums.bRe
      if (!isVar(p, 'im')) st.nums.cIm = sign('im', truth) * st.nums.bIm
    }
    const part = (p: number, side: Side, kind: 're' | 'im'): string => {
      const v = info.find((i) => i.p === p && i.kind === kind && i.side === side)
      const st = state[p] as PairState
      const value = st.nums[side === 'b' ? (kind === 're' ? 'bRe' : 'bIm') : kind === 're' ? 'cRe' : 'cIm']
      return v ? linearForm([[v.coef, v.letter]]) : String(value)
    }
    const entries: string[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => '0'))
    for (const [p, [i, j]] of pairs.entries()) {
      ;(entries[i] as string[])[j] = composeEntry({ re: part(p, 'b', 're'), im: part(p, 'b', 'im') })
      ;(entries[j] as string[])[i] = composeEntry({ re: part(p, 'c', 're'), im: part(p, 'c', 'im') })
    }
    for (let d = 0; d < size; d++) {
      ;(entries[d] as string[])[d] = herm
        ? String(rng.int(-2, 6))
        : rng.pick(['0', 'i', '2i', '-i', '3i', '-2i'])
    }
    if (entries.some((row) => row.some((e) => e.length > 6))) return null

    /** Value of one unknown if the pair relation were the given definition. */
    const solveAs = (letter: 'x' | 'y', definition: 'herm' | 'skew' | 'sym' | 'anti'): Q.Rational | null => {
      const v = info.find((i) => i.letter === letter) as (typeof info)[number]
      const numeric = v.side === 'b' ? numberFor(v, 'c') : numberFor(v, 'b')
      return Q.rational(sign(v.kind, definition) * numeric, v.coef)
    }
    const numberFor = (v: (typeof info)[number], side: Side): number => {
      const st = state[v.p] as PairState
      return st.nums[side === 'b' ? (v.kind === 're' ? 'bRe' : 'bIm') : v.kind === 're' ? 'cRe' : 'cIm']
    }
    const combined = (definition: 'herm' | 'skew' | 'sym' | 'anti'): Q.Rational | null => {
      const [vx, vy] = [solveAs('x', definition), solveAs('y', definition)]
      if (!vx || !vy || vx.den !== 1n || vy.den !== 1n) return null
      if (op === '+') return Q.add(vx, vy)
      if (op === '-') return Q.sub(vx, vy)
      return Q.mul(vx, vy)
    }
    if (
      !Q.equals(solveAs('x', truth) as Q.Rational, R(x)) ||
      !Q.equals(solveAs('y', truth) as Q.Rational, R(y))
    )
      return null

    // The displayed matrix must have exactly one real (x, y) of this kind.
    const parts = (entry: string, vx: number, vy: number): [number, number] => {
      const env = { x: vx, y: vy } as Record<string, number>
      const value = (s: string): number => {
        if (s === '' || s === '+') return 1
        if (s === '-') return -1
        const m = /^(-?)(\d*)([xy]?)$/.exec(s)
        if (!m) throw new Error(`bad part ${s}`)
        return (m[1] === '-' ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2])) * (m[3] ? (env[m[3]] as number) : 1)
      }
      if (!entry.endsWith('i')) return [value(entry), 0]
      const body = entry.slice(0, -1)
      const at = Math.max(body.lastIndexOf('+'), body.lastIndexOf('-'))
      return at > 0 ? [value(body.slice(0, at)), value(body.slice(at).replace(/^\+/, ''))] : [0, value(body)]
    }
    let solutions = 0
    for (let vx = -12; vx <= 12; vx++)
      for (let vy = -12; vy <= 12; vy++) {
        const g = entries.map((row) => row.map((e) => parts(e, vx, vy)))
        const ok = g.every((row, i) =>
          row.every(([re, im], j) => {
            const [re2, im2] = (g[j] as [number, number][])[i] as [number, number]
            return herm ? re === re2 && im === -im2 : re === -re2 && im === im2
          }),
        )
        if (ok) solutions++
      }
    if (solutions !== 1) return null

    const word = herm ? 'Hermitian ($A^* = A$)' : 'ters Hermitian ($A^* = -A$)'
    const opLabel = op === '\\cdot' ? '\\cdot' : op
    const stem = [
      text('$x, y \\in \\mathbb{R}$ olmak üzere'),
      matrix(entries, 'A ='),
      text(`$A$ matrisi ${word} ise $x ${opLabel} y$ kaçtır?`),
    ]
    const relation = herm ? 'a_{ji} = \\overline{a_{ij}}' : 'a_{ji} = -\\overline{a_{ij}}'
    const eqs = [...new Set(info.map((v) => v.p))].map((p) => {
      const [i, j] = pairs[p] as [number, number]
      const cShown = entries[j]?.[i] ?? ''
      const conj = composeEntry({ re: part(p, 'b', 're'), im: negateTerm(part(p, 'b', 'im')) })
      return `$a_{${j + 1}${i + 1}} = ${herm ? '' : '-'}\\overline{a_{${i + 1}${j + 1}}}$: $${cShown} = ${herm ? conj : `-(${conj})`}$`
    })
    const explanation = `${herm ? 'Hermitian' : 'Ters Hermitian'} matriste $${relation}$ ve köşegen ${herm ? 'gerçel' : 'saf sanal ($0$ dahil)'} olur. Eşleniği al, gerçel ve sanal kısımları ayrı ayrı eşitle: ${eqs.join('; ')}. Buradan $x = ${x}$, $y = ${y}$; $x ${opLabel} y = ${opText(op, x, y)} = ${express(op, x, y)}$.`
    const slipDefinitions: [string, 'herm' | 'skew' | 'sym' | 'anti', string][] = [
      [
        'treated-as-symmetric',
        'sym',
        'Eşleniği almayı unutmuşsun ($a_{ji} = a_{ij}$ yazmışsın): Hermitian için sanal kısmın işareti değişir; bu simetrik matrisin koşuludur.',
      ],
      [
        'treated-as-antisymmetric',
        'anti',
        'Eşlenik yerine yalnız işaret değiştirmişsin ($a_{ji} = -a_{ij}$): bu anti simetrik koşuludur. Eşlenikte yalnız sanal kısmın işareti değişir.',
      ],
      [
        'other-definition',
        herm ? 'skew' : 'herm',
        herm
          ? 'Hermitian ile ters Hermitian’ı karıştırmışsın: Hermitian’da $A^* = A$ (gerçel kısımlar eşit, sanal kısımlar zıt).'
          : 'Ters Hermitian ile Hermitian’ı karıştırmışsın: ters Hermitian’da $A^* = -A$ (gerçel kısımlar zıt, sanal kısımlar eşit).',
      ],
    ]
    const distractors: DraftDistractor[] = [
      ...combineMistakes(op, x, y).slice(0, 3),
      ...slipDefinitions.flatMap(([errorType, definition, feedback]) => {
        const value = combined(definition)
        return value ? [rational(errorType, value, feedback)] : []
      }),
    ]
    return {
      stem,
      correct: num(express(op, x, y)),
      distractors,
      explanation,
    }
  },
}

// ------------------------------------------------------------------ the bank

export const matrixFamilies: readonly Family[] = [
  m1Entries,
  m1Rule,
  m1Count,
  m2Types,
  m4Combo,
  m6Transpose,
  m10Hermitian,
]

/** One seed per committed item; ids and seeds never change once merged (see lock.json). */
export const matrixSeeds: Readonly<Record<string, readonly number[]>> = {
  'm1-entries': [1, 2, 3, 4],
  'm1-rule': [1, 2, 3, 4],
  'm1-count': [1, 2, 3, 4],
  'm2-types': [1, 2, 3, 4],
  'm4-combo': [1, 2, 3, 4],
  'm6-transpose': [1, 2, 3, 4],
  'm10-hermitian': [1, 2, 3, 4],
}

export const matrixQuestions: readonly Question[] = matrixFamilies.flatMap((family) =>
  (matrixSeeds[family.id] ?? []).map((seed, i) =>
    buildQuestion(family, seed, { id: `v1-gen-${family.id}-${String(i + 1).padStart(2, '0')}`, item: i + 1 }),
  ),
)
