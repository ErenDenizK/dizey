import type { Beat, Lesson, Mark, MatrixBlock, RowOp } from '../content/lessons/types'
import {
  applyRowOperation,
  determinant,
  fromNumbers,
  type Matrix,
  type RowOperation,
} from '../lib/math/matrix'
import { add, format, mul, neg, ONE, parse, type Rational, sub } from '../lib/math/rational'

/**
 * A beat compiles into a timeline: an ordered list of stage states, each one a moment the learner can
 * read. The player shows them one after another; finishing a beat jumps to the last. Pure data, so
 * every frame is testable without a browser.
 */
export type StageState = {
  marks: Mark[]
  /** Working lines under the stage, newest last. */
  notes: string[]
  /** Text in the result slot; null keeps the scene's own placeholder. */
  result: string | null
  /** Matrix whose unit-square image is drawn (area beats). */
  area: string | null
  /** Minor beat: the struck row and column, then the lifted submatrix. */
  minor: { matrix: string; row: number; col: number; lifted: boolean } | null
  /** Row-operation beat: the entries currently shown for a matrix, replacing its own. */
  working: { matrix: string; rows: string[][] } | null
  /**
   * Cells whose values the newest working line uses, in the order its numbers appear: the stage flies
   * each value from its cell into the line. Empty on frames that add no such line.
   */
  sources: readonly SourceCell[]
  /** Sarrus: the matrix whose first two columns are copied to its right, so every diagonal is straight. */
  extended: string | null
}

/** A cell on the stage; `copy` is the Sarrus copy of the first two columns. */
export type SourceCell = {
  readonly matrix: string
  readonly row: number
  readonly col: number
  readonly copy?: true
}

/** Name the stage uses for the Sarrus copy of a matrix's first two columns. */
export const copyName = (name: string) => `${name}+`

export const emptyStage: StageState = {
  marks: [],
  notes: [],
  result: null,
  area: null,
  minor: null,
  working: null,
  sources: [],
  extended: null,
}

/** TeX coefficient in front of a row: "", "-", "2", "\tfrac{1}{4}", "-\tfrac{1}{4}". */
function coefficient(value: Rational): string {
  const sign = value.num < 0n ? '-' : ''
  const size = value.num < 0n ? neg(value) : value
  if (size.num === 1n && size.den === 1n) return sign
  if (size.den === 1n) return `${sign}${size.num}`
  return `${sign}\\tfrac{${size.num}}{${size.den}}`
}

/** The operation as the lecturer writes it, in TeX: R_3 \to R_3 - R_1. */
export function rowOpLabel(op: RowOp): string {
  switch (op.kind) {
    case 'swap':
      return `R_{${op.a + 1}} \\leftrightarrow R_{${op.b + 1}}`
    case 'scale':
      return `R_{${op.row + 1}} \\to ${coefficient(parse(op.factor) ?? ONE)}R_{${op.row + 1}}`
    case 'addMultiple': {
      const factor = parse(op.factor) ?? ONE
      const sign = factor.num < 0n ? '-' : '+'
      return `R_{${op.target + 1}} \\to R_{${op.target + 1}} ${sign} ${coefficient(factor.num < 0n ? neg(factor) : factor)}R_{${op.source + 1}}`
    }
  }
}

function toOperation(op: RowOp): RowOperation {
  if (op.kind === 'swap') return op
  const factor = parse(op.factor)
  if (!factor) throw new Error(`Bad factor ${op.factor}`)
  return { ...op, factor }
}

/** The submatrix left after deleting one row and one column. */
export function minorBlock(block: MatrixBlock, row: number, col: number): MatrixBlock {
  return {
    kind: 'matrix',
    delimiter: 'bars',
    rows: block.rows.filter((_, r) => r !== row).map((cells) => cells.filter((_, c) => c !== col)),
  }
}

/** Display form of an exact value: real minus sign. */
export function show(value: Rational): string {
  return format(value).replace('-', '−')
}

/** Parenthesised when negative, for products like 2 · (−3). */
function factor(entry: string): string {
  const value = parse(entry)
  if (!value) return entry
  return value.num < 0n ? `(${show(value)})` : show(value)
}

function numeric(block: MatrixBlock): Rational[][] | null {
  const rows = block.rows.map((row) => row.map((entry) => parse(entry)))
  if (rows.some((row) => row.some((entry) => entry === null))) return null
  return rows as Rational[][]
}

function cell(values: Rational[][], r: number, c: number): Rational {
  const value = values[r]?.[c]
  if (!value) throw new Error(`No entry at ${r},${c}`)
  return value
}

function detOf(block: MatrixBlock): Rational | null {
  const values = numeric(block)
  return values ? determinant(fromNumbers(values)) : null
}

function at(block: MatrixBlock, r: number, c: number): string {
  return block.rows[r]?.[c] ?? '?'
}

function lookup(lesson: Lesson, name: string): MatrixBlock {
  const block = lesson.matrices[name]
  if (!block) throw new Error(`Unknown matrix ${name} in ${lesson.id}`)
  return block
}

type Builder = { frames: StageState[]; push(change: (state: StageState) => StageState): void }

function builder(start: StageState): Builder {
  const frames: StageState[] = []
  let current = start
  return {
    frames,
    push(change) {
      // Flights belong to the frame that writes their line.
      current = change({ ...current, sources: [] })
      frames.push(current)
    },
  }
}

const withMarks = (state: StageState, marks: Mark[], clear = false): StageState => ({
  ...state,
  marks: clear ? marks : [...state.marks, ...marks],
})

function det2(lesson: Lesson, name: string, b: Builder) {
  const m = lookup(lesson, name)
  const values = numeric(m)
  const main = values ? mul(cell(values, 0, 0), cell(values, 1, 1)) : null
  const other = values ? mul(cell(values, 0, 1), cell(values, 1, 0)) : null
  const mainText = `${factor(at(m, 0, 0))} · ${factor(at(m, 1, 1))}${main ? ` = ${show(main)}` : ''}`
  const otherText = `${factor(at(m, 0, 1))} · ${factor(at(m, 1, 0))}${other ? ` = ${show(other)}` : ''}`
  b.push((s) => ({
    ...withMarks(
      s,
      [
        { cell: [name, 0, 0], tone: 'row' },
        { cell: [name, 1, 1], tone: 'row' },
      ],
      true,
    ),
    notes: [mainText],
    sources: [
      { matrix: name, row: 0, col: 0 },
      { matrix: name, row: 1, col: 1 },
    ],
  }))
  b.push((s) => ({
    ...withMarks(s, [
      { cell: [name, 0, 1], tone: 'col' },
      { cell: [name, 1, 0], tone: 'col' },
    ]),
    notes: [mainText, otherText],
    sources: [
      { matrix: name, row: 0, col: 1 },
      { matrix: name, row: 1, col: 0 },
    ],
  }))
  if (main && other) {
    const value = sub(main, other)
    b.push((s) => ({
      ...s,
      notes: [...s.notes, `${show(main)} − ${factor(format(other))} = ${show(value)}`],
      result: show(value),
    }))
  } else {
    const symbolic = `${at(m, 0, 0)}${at(m, 1, 1)} − ${at(m, 0, 1)}${at(m, 1, 0)}`
    b.push((s) => ({ ...s, result: symbolic }))
  }
}

function sarrus(lesson: Lesson, name: string, b: Builder) {
  const m = lookup(lesson, name)
  const values = numeric(m)
  const copy = copyName(name)
  // With the first two columns copied to the right, every diagonal is a straight line of three cells.
  const diagonal = (start: number, step: 1 | -1) => [0, 1, 2].map((r) => ({ row: r, col: start + step * r }))
  const placed = (d: { row: number; col: number }): SourceCell =>
    d.col < 3
      ? { matrix: name, row: d.row, col: d.col }
      : { matrix: name, row: d.row, col: d.col - 3, copy: true }
  const markOf = (cellAt: SourceCell, tone: 'row' | 'col'): Mark => ({
    cell: [cellAt.copy ? copy : name, cellAt.row, cellAt.col] as const,
    tone,
  })
  const term = (cells: readonly { row: number; col: number }[]) => {
    const text = cells.map((d) => factor(at(m, d.row, d.col % 3))).join(' · ')
    if (!values) return { text, value: null }
    const value = cells.reduce<Rational>((acc, d) => mul(acc, cell(values, d.row, d.col % 3)), {
      num: 1n,
      den: 1n,
    })
    return { text: `${text} = ${show(value)}`, value }
  }
  b.push((s) => ({ ...s, marks: [], notes: [], extended: name }))
  let plus: Rational = { num: 0n, den: 1n }
  for (const [index, start] of [0, 1, 2].entries()) {
    const cells = diagonal(start, 1)
    const t = term(cells)
    if (t.value) plus = add(plus, t.value)
    const sources = cells.map(placed)
    b.push((s) => ({
      ...withMarks(
        s,
        sources.map((c) => markOf(c, 'row')),
        index === 0,
      ),
      notes: [...(index === 0 ? [] : s.notes), `+ ${t.text}`],
      sources,
    }))
  }
  let minus: Rational = { num: 0n, den: 1n }
  for (const [index, start] of [2, 3, 4].entries()) {
    const cells = diagonal(start, -1)
    const t = term(cells)
    if (t.value) minus = add(minus, t.value)
    const sources = cells.map(placed)
    b.push((s) => ({
      ...withMarks(
        s,
        sources.map((c) => markOf(c, 'col')),
        index === 0,
      ),
      notes: [...s.notes, `− ${t.text}`],
      sources,
    }))
  }
  const value = detOf(m)
  if (value) {
    b.push((s) => ({
      ...s,
      marks: [],
      notes: [`${show(plus)} − ${factor(format(minus))} = ${show(value)}`],
      result: show(value),
    }))
  }
}

function expand(lesson: Lesson, name: string, along: 'row' | 'col', index: number, b: Builder) {
  const m = lookup(lesson, name)
  const size = m.rows.length
  b.push((s) => ({
    ...withMarks(
      s,
      [
        {
          cell: along === 'row' ? [name, index, '*'] : [name, '*', index],
          tone: along === 'row' ? 'row' : 'col',
        },
      ],
      true,
    ),
    notes: [],
  }))
  for (let k = 0; k < size; k++) {
    const [r, c] = along === 'row' ? [index, k] : [k, index]
    const sign = (r + c) % 2 === 0 ? '+' : '−'
    b.push((s) => ({
      ...withMarks(s, [{ cell: [name, r, c], tone: 'ok' }]),
      notes: [...s.notes, `${sign} ${factor(at(m, r, c))} · M${r + 1}${c + 1}`],
    }))
  }
  const value = detOf(m)
  if (value) b.push((s) => ({ ...s, result: show(value) }))
}

function compileInto(lesson: Lesson, beat: Beat, b: Builder) {
  switch (beat.kind) {
    case 'det2':
      det2(lesson, beat.matrix, b)
      return
    case 'sarrus':
      sarrus(lesson, beat.matrix, b)
      return
    case 'expand':
      expand(lesson, beat.matrix, beat.along, beat.index, b)
      return
    case 'minor': {
      const { matrix, row, col } = beat
      lookup(lesson, matrix)
      b.push((s) => ({ ...s, marks: [], minor: { matrix, row, col, lifted: false }, notes: [] }))
      b.push((s) => ({ ...s, minor: { matrix, row, col, lifted: true } }))
      return
    }
    case 'rowOps': {
      const block = lookup(lesson, beat.matrix)
      const start = numeric(block)
      if (!start) return
      let values: Matrix = start
      const name = beat.matrix
      const text = (rows: Matrix) => rows.map((row) => row.map((v) => format(v)))
      for (const op of beat.ops) {
        const label = `$${rowOpLabel(op)}$`
        const touched =
          op.kind === 'swap'
            ? [
                { cell: [name, op.a, '*'] as const, tone: 'row' as const },
                { cell: [name, op.b, '*'] as const, tone: 'row' as const },
              ]
            : op.kind === 'scale'
              ? [{ cell: [name, op.row, '*'] as const, tone: 'row' as const }]
              : [
                  { cell: [name, op.target, '*'] as const, tone: 'row' as const },
                  { cell: [name, op.source, '*'] as const, tone: 'col' as const },
                ]
        const current = text(values)
        b.push((s) => ({ ...s, marks: touched, notes: [label], working: { matrix: name, rows: current } }))
        values = applyRowOperation(values, toOperation(op))
        const changed = op.kind === 'swap' ? [op.a, op.b] : [op.kind === 'scale' ? op.row : op.target]
        const next = text(values)
        b.push((s) => ({
          ...s,
          marks: changed.map((row) => ({ cell: [name, row, '*'] as const, tone: 'ok' as const })),
          working: { matrix: name, rows: next },
        }))
      }
      b.push((s) => ({ ...s, marks: [] }))
      return
    }
    case 'area':
      b.push((s) => ({ ...s, area: beat.matrix }))
      return
    case 'frames':
      for (const frame of beat.frames) {
        b.push((s) => ({
          ...withMarks(s, [...(frame.marks ?? [])], frame.clear),
          notes: frame.note ? [...(frame.clear ? [] : s.notes), frame.note] : frame.clear ? [] : s.notes,
        }))
      }
      return
    case 'equation':
      for (const line of beat.lines) b.push((s) => ({ ...s, notes: [...s.notes, `$${line}$`] }))
      return
    case 'sequence':
      for (const inner of beat.beats) compileInto(lesson, inner, b)
      return
    default:
      // Beat kinds the player does not know yet show their end state only (the scene).
      return
  }
}

export function compile(lesson: Lesson, beat: Beat | undefined): StageState[] {
  const b = builder(emptyStage)
  if (beat) compileInto(lesson, beat, b)
  return b.frames
}
