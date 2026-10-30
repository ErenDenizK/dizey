import type { Beat, Lesson, Mark, MatrixBlock } from '../content/lessons/types'
import { determinant, fromNumbers } from '../lib/math/matrix'
import { add, format, mul, parse, type Rational, sub } from '../lib/math/rational'

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
}

export const emptyStage: StageState = { marks: [], notes: [], result: null, area: null, minor: null }

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
      current = change(current)
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
  }))
  b.push((s) => ({
    ...withMarks(s, [
      { cell: [name, 0, 1], tone: 'col' },
      { cell: [name, 1, 0], tone: 'col' },
    ]),
    notes: [mainText, otherText],
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
  const diagonal = (start: number, step: 1 | -1) =>
    [0, 1, 2].map((r) => [r, (((start + step * r) % 3) + 3) % 3] as const)
  const term = (cells: readonly (readonly [number, number])[]) => {
    const text = cells.map(([r, c]) => factor(at(m, r, c))).join(' · ')
    if (!values) return { text, value: null }
    const value = cells.reduce<Rational>((acc, [r, c]) => mul(acc, cell(values, r, c)), { num: 1n, den: 1n })
    return { text: `${text} = ${show(value)}`, value }
  }
  let plus: Rational = { num: 0n, den: 1n }
  for (const [index, start] of [0, 1, 2].entries()) {
    const cells = diagonal(start, 1)
    const t = term(cells)
    if (t.value) plus = add(plus, t.value)
    b.push((s) => ({
      ...withMarks(
        s,
        cells.map(([r, c]) => ({ cell: [name, r, c] as const, tone: 'row' as const })),
        index === 0,
      ),
      notes: [...(index === 0 ? [] : s.notes), `+ ${t.text}`],
    }))
  }
  let minus: Rational = { num: 0n, den: 1n }
  for (const [index, start] of [2, 0, 1].entries()) {
    const cells = diagonal(start, -1)
    const t = term(cells)
    if (t.value) minus = add(minus, t.value)
    b.push((s) => ({
      ...withMarks(
        s,
        cells.map(([r, c]) => ({ cell: [name, r, c] as const, tone: 'col' as const })),
        index === 0,
      ),
      notes: [...s.notes, `− ${t.text}`],
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
