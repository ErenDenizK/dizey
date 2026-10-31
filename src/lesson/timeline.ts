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
 * A beat compiles into a list of actions, the old app's teaching model (inventory 6b): each action is one
 * moment the learner reads, with what it changes on the stage, its kind, a nominal dwell and the sound it
 * plays. The player's runner shows one action, waits for its motion to land, then waits the dwell, never
 * shorter than the reading floor of what the action made readable. Pure data, testable without a browser.
 *
 * Work lines are laid out for the whole beat before the first action ("nothing on a line ever moves"):
 * every frame carries every line of the beat; `shown` says which tokens are visible.
 */
export type Role = 'row' | 'col' | 'ok'

export type Token = {
  readonly key: string
  readonly text: string
  /** Colour of the number (its source role); operators and words have none. */
  readonly role?: Role
  /** An operator or "=": does not count as a word for the reading floor. */
  readonly op?: true
  /** Text holds inline TeX (`$…$`). */
  readonly tex?: true
  /** Tokens of one group never wrap apart (a product, "= 6"). */
  readonly group?: number
}

export type WorkLine = { readonly key: string; readonly tokens: readonly Token[] }

/** Where a chip flies from: a matrix cell (or its Sarrus copy), or a token already on a work line. */
export type Source =
  | { readonly matrix: string; readonly row: number; readonly col: number; readonly copy?: true }
  | { readonly token: string }

export type Flight = { readonly token: string; readonly from: Source; readonly role: Role }

export type ActionKind = 'line' | 'highlight' | 'carry' | 'value' | 'collect' | 'write' | 'rewrite' | 'show'

export type StageState = {
  marks: Mark[]
  /** Every work line of the beat, laid out from the first action. */
  lines: readonly WorkLine[]
  /** Keys of the tokens visible now. */
  shown: readonly string[]
  /** Text in the result slot; null keeps the scene's own placeholder. */
  result: string | null
  /** Matrix whose unit-square image is drawn (area beats). */
  area: string | null
  /** Minor beat: the struck row and column, then the lifted submatrix. */
  minor: { matrix: string; row: number; col: number; lifted: boolean } | null
  /** Row-operation beat: the entries currently shown for a matrix, replacing its own. */
  working: { matrix: string; rows: string[][] } | null
  /** Tokens this action shows by flying a chip into them, in departure order. */
  flights: readonly Flight[]
  /** Sarrus: the matrix whose first two columns are copied to its right, so every diagonal is straight. */
  extended: string | null
  /** What this action is, for its dwell and its sound. */
  action: ActionKind
  /** Nominal dwell after the action's motion, in on-screen ms (the reading floor can raise it). */
  dwell: number
}

/** Name the stage uses for the Sarrus copy of a matrix's first two columns. */
export const copyName = (name: string) => `${name}+`

export const emptyStage: StageState = {
  marks: [],
  lines: [],
  shown: [],
  result: null,
  area: null,
  minor: null,
  working: null,
  flights: [],
  extended: null,
  action: 'show',
  dwell: 0,
}

/**
 * Dwells per action kind (on-screen ms), from the old app's TEACH tables: the teaching family plays the
 * first time; the reveal family confirms a right answer. `repeat` scales the dwells of a shape already shown.
 */
export const DWELLS = {
  teach: { line: 200, highlight: 450, carry: 200, value: 580, collect: 640, write: 600, rewrite: 700 },
  reveal: { line: 150, highlight: 350, carry: 300, value: 300, collect: 350, write: 350, rewrite: 420 },
} as const
export type Family = keyof typeof DWELLS
export const REPEAT_DWELL = 0.5

/** Reading floors (on-screen ms): a line of new words, plus per word; one value landing in place. */
export const FLOOR = { line: 1000, word: 200, value: 400 } as const

/** Chips of one term leave this far apart; a later term's chips wait `lead` (choreography ms, × pace). */
export const CARRY = { stagger: 180, lead: 250 } as const

/** Words a token adds for the reading floor: TeX and text count their words; numbers count one. */
function wordsOf(token: Token): number {
  if (token.op) return 0
  return token.text
    .replace(/\$/g, ' ')
    .split(/[\s=+−\-:,;]+/)
    .filter((word) => /[\p{L}\d]/u.test(word)).length
}

/**
 * The reading floor of an action (on-screen ms): what it made readable must stay still this long. A value
 * landing in a line that is still being written, or a single word, needs 400 ms; a finished line needs
 * 1000 ms plus 200 ms per new word (old readingFloor).
 */
export function readingFloor(before: StageState, after: StageState): number {
  const was = new Set(before.shown)
  const fresh = after.shown.filter((key) => !was.has(key))
  const tokens = new Map(after.lines.flatMap((line) => line.tokens.map((t) => [t.key, { t, line }] as const)))
  let words = 0
  let open = true
  for (const key of fresh) {
    const entry = tokens.get(key)
    if (!entry) continue
    words += wordsOf(entry.t)
    if (entry.line.tokens.every((t) => after.shown.includes(t.key))) open = false
  }
  if (after.result !== before.result && after.result !== null) words += 1
  if (!words) return 0
  if (open || words === 1) return FLOOR.value
  return FLOOR.line + FLOOR.word * words
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

type Builder = {
  frames: StageState[]
  family: Family
  push(action: ActionKind, change: (state: StageState) => StageState, dwell?: number): void
}

function builder(start: StageState, family: Family): Builder {
  const frames: StageState[] = []
  let current = start
  return {
    frames,
    family,
    push(action, change, dwell) {
      const table = DWELLS[family] as Record<string, number>
      // Flights belong to the action that makes them.
      current = { ...change({ ...current, flights: [] }), action, dwell: dwell ?? table[action] ?? 0 }
      frames.push(current)
    },
  }
}

const withMarks = (state: StageState, marks: Mark[], clear = false): StageState => ({
  ...state,
  marks: clear ? marks : [...state.marks, ...marks],
})

const reveal = (state: StageState, keys: readonly string[]): StageState => ({
  ...state,
  shown: [...state.shown, ...keys.filter((key) => !state.shown.includes(key))],
})

/** Builds the tokens of one line; keys are `${line}:${n}`. */
function lineOf(key: string) {
  const tokens: Token[] = []
  let group = 0
  const add = (text: string, extra: Partial<Token> = {}) => {
    const token: Token = { key: `${key}:${tokens.length}`, text, group, ...extra }
    tokens.push(token)
    return token.key
  }
  return {
    key,
    tokens,
    num: (text: string, role?: Role) => add(text, role ? { role } : {}),
    op: (text: string) => add(text, { op: true }),
    /** Starts a new unbreakable group (a term, a values row). */
    group: () => {
      group += 1
    },
    line: (): WorkLine => ({ key, tokens }),
  }
}

/** A finished line of text (or TeX) shown at once: one token per word, or one TeX token. */
function textLine(key: string, text: string): WorkLine {
  if (/[$\\{]/.test(text)) return { key, tokens: [{ key: `${key}:0`, text, tex: true }] }
  return {
    key,
    tokens: text.split(' ').map((word, index) => ({
      key: `${key}:${index}`,
      text: word,
      group: 0,
      ...(/^[=+−·-]$/.test(word) ? { op: true as const } : {}),
    })),
  }
}

const keysOf = (line: WorkLine) => line.tokens.map((t) => t.key)

/**
 * det2, as the old recipe: one line "a·d − b·c = v1 − v2 = r" laid out hidden; the main diagonal lights
 * (row) and its numbers fly into the line, then the other diagonal (col); the values row is written once
 * every product is on the line (Eren 2026-10-29); then both diagonals light and the result collects.
 */
function det2(lesson: Lesson, name: string, b: Builder) {
  const lineKey = `d${b.frames.length}`
  const m = lookup(lesson, name)
  const values = numeric(m)
  const main = values ? mul(cell(values, 0, 0), cell(values, 1, 1)) : null
  const other = values ? mul(cell(values, 0, 1), cell(values, 1, 0)) : null
  const l = lineOf(lineKey)
  const a = l.num(factor(at(m, 0, 0)), 'row')
  const dot1 = l.op('·')
  const d = l.num(factor(at(m, 1, 1)), 'row')
  l.group()
  const minus = l.op('−')
  const bk = l.num(factor(at(m, 0, 1)), 'col')
  const dot2 = l.op('·')
  const c = l.num(factor(at(m, 1, 0)), 'col')
  const valueKeys: string[] = []
  const resultKeys: string[] = []
  let result: string | null = null
  if (main && other) {
    l.group()
    valueKeys.push(l.op('='), l.num(show(main), 'row'), l.op('−'), l.num(factor(format(other)), 'col'))
    l.group()
    const value = sub(main, other)
    result = show(value)
    resultKeys.push(l.op('='), l.num(result, 'ok'))
  }
  const line = l.line()
  b.push('line', (s) => ({ ...s, marks: [], lines: [...s.lines, line] }))
  const mainMarks: Mark[] = [
    { cell: [name, 0, 0], tone: 'row' },
    { cell: [name, 1, 1], tone: 'row' },
  ]
  const otherMarks: Mark[] = [
    { cell: [name, 0, 1], tone: 'col' },
    { cell: [name, 1, 0], tone: 'col' },
  ]
  b.push('highlight', (s) => withMarks(s, mainMarks, true))
  b.push('carry', (s) => ({
    ...reveal(s, [a, dot1, d]),
    flights: [
      { token: a, from: { matrix: name, row: 0, col: 0 }, role: 'row' },
      { token: d, from: { matrix: name, row: 1, col: 1 }, role: 'row' },
    ],
  }))
  b.push('highlight', (s) => withMarks(s, otherMarks, true))
  b.push('carry', (s) => ({
    ...reveal(s, [minus, bk, dot2, c]),
    flights: [
      { token: bk, from: { matrix: name, row: 0, col: 1 }, role: 'col' },
      { token: c, from: { matrix: name, row: 1, col: 0 }, role: 'col' },
    ],
  }))
  if (result) {
    const r = result
    b.push('value', (s) => reveal(s, valueKeys))
    b.push('collect', (s) => ({
      ...reveal(withMarks(s, [...mainMarks, ...otherMarks], true), resultKeys),
      result: r,
    }))
  } else {
    const symbolic = `${at(m, 0, 0)}${at(m, 1, 1)} − ${at(m, 0, 1)}${at(m, 1, 0)}`
    b.push('collect', (s) => ({ ...withMarks(s, [...mainMarks, ...otherMarks], true), result: symbolic }))
  }
}

/**
 * Sarrus, as the old recipe: the copy of the first two columns appears; the "plus" line collects the three
 * down-right diagonals (row colour) into its sum, the "minus" line the three down-left ones (column colour),
 * and the last line carries both sums into the determinant. Later terms of a line, and the whole minus line
 * (same shape as plus), play at half dwell.
 */
function sarrus(lesson: Lesson, name: string, b: Builder, diagonalsOnly = false) {
  const m = lookup(lesson, name)
  const values = numeric(m)
  const copy = copyName(name)
  const diagonal = (start: number, step: 1 | -1) => [0, 1, 2].map((r) => ({ row: r, col: start + step * r }))
  const placed = (d: { row: number; col: number }) =>
    d.col < 3
      ? { matrix: name, row: d.row, col: d.col }
      : { matrix: name, row: d.row, col: d.col - 3, copy: true as const }
  const markOf = (c: ReturnType<typeof placed>, tone: Role): Mark => ({
    cell: ['copy' in c ? copy : name, c.row, c.col] as const,
    tone,
  })
  const table = DWELLS[b.family]

  const side = (key: string, starts: number[], step: 1 | -1, role: 'row' | 'col', repeat: boolean) => {
    const l = lineOf(key)
    const terms = starts.map((start, index) => {
      const cells = diagonal(start, step).map(placed)
      if (index) {
        l.group()
        l.op('+')
      }
      const keys: string[] = []
      const nums: string[] = []
      cells.forEach((c, k) => {
        if (k) keys.push(l.op('·'))
        const t = l.num(factor(at(m, c.row, c.col)), role)
        keys.push(t)
        nums.push(t)
      })
      const value = values
        ? cells.reduce<Rational>((acc, c) => mul(acc, cell(values, c.row, c.col)), { num: 1n, den: 1n })
        : null
      return { cells, keys, nums, value }
    })
    // The operators between terms belong to the term that follows them.
    const plusOps = l.tokens.filter((t) => t.text === '+').map((t) => t.key)
    let total: Rational | null = null
    const valueKeys: string[] = []
    let sumKey: string | null = null
    if (terms.every((t) => t.value)) {
      total = terms.reduce<Rational>((acc, t) => add(acc, t.value as Rational), { num: 0n, den: 1n })
      l.group()
      terms.forEach((t, index) => {
        if (index) valueKeys.push(l.op('+'))
        else valueKeys.push(l.op('='))
        valueKeys.push(l.num(factor(format(t.value as Rational)), role))
      })
      l.group()
      const eq = l.op('=')
      sumKey = l.num(show(total), role)
      return { line: l.line(), terms, plusOps, valueKeys, sum: [eq, sumKey], sumKey, total, role, repeat }
    }
    return { line: l.line(), terms, plusOps, valueKeys, sum: [] as string[], sumKey, total, role, repeat }
  }

  const play = (p: ReturnType<typeof side>) => {
    const factorOf = (later: boolean) => (p.repeat || later ? REPEAT_DWELL : 1)
    b.push('line', (s) => ({ ...s, lines: [...s.lines, p.line] }), table.line * factorOf(false))
    p.terms.forEach((t, index) => {
      const marks = t.cells.map((c) => markOf(c, p.role))
      const shown = index ? [p.plusOps[index - 1] as string, ...t.keys] : t.keys
      const flights = t.cells.map((c, k) => ({ token: t.nums[k] as string, from: c, role: p.role }))
      b.push('highlight', (s) => withMarks(s, marks, true), table.highlight * factorOf(index > 0))
      b.push('carry', (s) => ({ ...reveal(s, shown), flights }), table.carry * factorOf(index > 0))
    })
    if (p.valueKeys.length) {
      b.push('value', (s) => reveal(s, p.valueKeys), table.value * factorOf(false))
      const all = p.terms.flatMap((t) => t.cells.map((c) => markOf(c, p.role)))
      b.push('collect', (s) => reveal(withMarks(s, all, true), p.sum), table.collect * factorOf(false))
    }
  }

  b.push('line', (s) => ({ ...s, marks: [], extended: name }), table.highlight)
  if (diagonalsOnly) {
    // The idea alone: each diagonal lights as one straight line of three, then each family together.
    for (const [starts, step, tone] of [
      [[0, 1, 2], 1, 'row'],
      [[2, 3, 4], -1, 'col'],
    ] as const) {
      const lines = starts.map((start) => diagonal(start, step).map((d) => markOf(placed(d), tone)))
      lines.forEach((marks, index) => {
        b.push('highlight', (s) => withMarks(s, marks, true), table.highlight * (index ? REPEAT_DWELL : 1))
      })
      b.push('highlight', (s) => withMarks(s, lines.flat(), true), table.collect)
    }
    return
  }
  const plus = side(`p${b.frames.length}`, [0, 1, 2], 1, 'row', false)
  play(plus)
  const minus = side(`m${b.frames.length}`, [2, 3, 4], -1, 'col', true)
  play(minus)
  const value = detOf(m)
  if (value && plus.total && minus.total && plus.sumKey && minus.sumKey) {
    const l = lineOf(`s${b.frames.length}`)
    const p = l.num(show(plus.total), 'row')
    const op = l.op('−')
    const q = l.num(factor(format(minus.total)), 'col')
    l.group()
    const eq = l.op('=')
    const r = l.num(show(value), 'ok')
    const line = l.line()
    const pk = plus.sumKey
    const mk = minus.sumKey
    b.push('line', (s) => ({ ...withMarks(s, [], true), lines: [...s.lines, line] }))
    b.push('carry', (s) => ({
      ...reveal(s, [p, op, q]),
      flights: [
        { token: p, from: { token: pk }, role: 'row' },
        { token: q, from: { token: mk }, role: 'col' },
      ],
    }))
    b.push('collect', (s) => ({ ...reveal(s, [eq, r]), result: show(value) }))
  }
}

/** Adds a finished text line and shows it at once. */
function writeLine(
  b: Builder,
  line: WorkLine,
  change: (s: StageState) => StageState = (s) => s,
  kind: ActionKind = 'write',
) {
  b.push(kind, (s) => reveal({ ...change(s), lines: [...s.lines, line] }, keysOf(line)))
}

/** Hides every token shown so far (a frame that clears its notes); the lines keep their room. */
const hideAll = (s: StageState): StageState => ({ ...s, shown: [] })

function expand(lesson: Lesson, name: string, along: 'row' | 'col', index: number, b: Builder) {
  const m = lookup(lesson, name)
  const size = m.rows.length
  b.push('highlight', (s) =>
    hideAll(
      withMarks(
        s,
        [
          {
            cell: along === 'row' ? [name, index, '*'] : [name, '*', index],
            tone: along === 'row' ? 'row' : 'col',
          },
        ],
        true,
      ),
    ),
  )
  for (let k = 0; k < size; k++) {
    const [r, c] = along === 'row' ? [index, k] : [k, index]
    const sign = (r + c) % 2 === 0 ? '+' : '−'
    const line = textLine(`e${b.frames.length}`, `${sign} ${factor(at(m, r, c))} · M${r + 1}${c + 1}`)
    writeLine(b, line, (s) => withMarks(s, [{ cell: [name, r, c], tone: 'ok' }]))
  }
  const value = detOf(m)
  if (value) b.push('collect', (s) => ({ ...s, result: show(value) }))
}

function compileInto(lesson: Lesson, beat: Beat, b: Builder) {
  switch (beat.kind) {
    case 'det2':
      det2(lesson, beat.matrix, b)
      return
    case 'sarrus':
      sarrus(lesson, beat.matrix, b, beat.diagonalsOnly === true)
      return
    case 'expand':
      expand(lesson, beat.matrix, beat.along, beat.index, b)
      return
    case 'minor': {
      const { matrix, row, col } = beat
      lookup(lesson, matrix)
      b.push('highlight', (s) => hideAll({ ...s, marks: [], minor: { matrix, row, col, lifted: false } }))
      b.push('write', (s) => ({ ...s, minor: { matrix, row, col, lifted: true } }))
      return
    }
    case 'rowOps': {
      const block = lookup(lesson, beat.matrix)
      const start = numeric(block)
      if (!start) return
      let values: Matrix = start
      const name = beat.matrix
      const text = (rows: Matrix) => rows.map((row) => row.map((v) => format(v)))
      beat.ops.forEach((op) => {
        const label = textLine(`r${b.frames.length}`, `$${rowOpLabel(op)}$`)
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
        writeLine(
          b,
          label,
          (s) => ({ ...hideAll(s), marks: touched, working: { matrix: name, rows: current } }),
          'highlight',
        )
        values = applyRowOperation(values, toOperation(op))
        const changed = op.kind === 'swap' ? [op.a, op.b] : [op.kind === 'scale' ? op.row : op.target]
        const next = text(values)
        b.push('write', (s) => ({
          ...s,
          marks: changed.map((row) => ({ cell: [name, row, '*'] as const, tone: 'ok' as const })),
          working: { matrix: name, rows: next },
        }))
      })
      b.push('highlight', (s) => ({ ...s, marks: [] }))
      return
    }
    case 'area':
      b.push('write', (s) => ({ ...s, area: beat.matrix }))
      return
    case 'frames':
      beat.frames.forEach((frame) => {
        const change = (s: StageState) => {
          const marked = withMarks(s, [...(frame.marks ?? [])], frame.clear)
          return frame.clear ? hideAll(marked) : marked
        }
        if (frame.note) writeLine(b, textLine(`f${b.frames.length}`, frame.note), change)
        else b.push('highlight', change)
      })
      return
    case 'equation':
      beat.lines.forEach((line, index) => {
        writeLine(b, textLine(`q${b.frames.length}`, `$${line}$`), (s) => s, index ? 'rewrite' : 'write')
      })
      return
    case 'sequence':
      for (const inner of beat.beats) compileInto(lesson, inner, b)
      return
    default:
      // Beat kinds the player does not know yet show their end state only (the scene).
      return
  }
}

/**
 * Compiles a beat into its actions. Every action carries every line of the beat, so the stage lays the
 * whole beat out before the first one plays.
 */
export function compile(lesson: Lesson, beat: Beat | undefined, family: Family = 'teach'): StageState[] {
  const b = builder(emptyStage, family)
  if (beat) compileInto(lesson, beat, b)
  const lines = b.frames.at(-1)?.lines ?? []
  return b.frames.map((frame) => ({ ...frame, lines }))
}
