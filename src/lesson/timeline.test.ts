import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { compile, FLOOR, readingFloor, rowOpLabel, type StageState } from './timeline'

const lesson: Lesson = {
  id: 'test',
  node: 'D1',
  title: 'test',
  matrices: {
    A: {
      kind: 'matrix',
      delimiter: 'bars',
      rows: [
        ['3', '1'],
        ['4', '2'],
      ],
    },
    C: {
      kind: 'matrix',
      delimiter: 'bars',
      rows: [
        ['2', '-3'],
        ['1', '4'],
      ],
    },
    G: {
      kind: 'matrix',
      delimiter: 'bars',
      rows: [
        ['a', 'b'],
        ['c', 'd'],
      ],
    },
    L: {
      kind: 'matrix',
      delimiter: 'brackets',
      rows: [
        ['2', '1'],
        ['3', '-1'],
      ],
    },
    R: {
      kind: 'matrix',
      delimiter: 'brackets',
      rows: [
        ['1', '4'],
        ['2', '0'],
      ],
    },
    P: {
      kind: 'matrix',
      delimiter: 'brackets',
      rows: [
        ['?', '?'],
        ['?', '?'],
      ],
    },
    S: {
      kind: 'matrix',
      delimiter: 'bars',
      rows: [
        ['2', '1', '3'],
        ['0', '4', '1'],
        ['1', '2', '5'],
      ],
    },
  },
  steps: [],
}

const textOf = (frame: StageState | undefined) =>
  (frame?.lines ?? []).map((line) =>
    line.tokens
      .filter((t) => frame?.shown.includes(t.key))
      .map((t) => t.text)
      .join(' '),
  )

describe('product', () => {
  it('lights a row and a column, carries each pair, then lands the sum in its cell', () => {
    const frames = compile(lesson, { kind: 'product', left: 'L', right: 'R', into: 'P', cells: [[1, 0]] })
    expect(frames.map((f) => f.action)).toEqual([
      'line',
      'line',
      'highlight',
      'carry',
      'carry',
      'collect',
      'write',
    ])
    expect(frames[0]?.lines[0]?.tokens.map((t) => t.text).join(' ')).toBe('3 · 1 + (−1) · 2 = 1')
    expect(frames[0]?.working?.rows).toEqual([
      ['?', '?'],
      ['?', '?'],
    ])
    expect(frames[2]?.marks).toEqual([
      { cell: ['L', 1, '*'], tone: 'row' },
      { cell: ['R', '*', 0], tone: 'col' },
      { cell: ['P', 1, 0], tone: 'ok' },
    ])
    expect(textOf(frames[3])).toEqual(['3 · 1'])
    expect(frames[4]?.flights.map((f) => f.from)).toEqual([
      { matrix: 'L', row: 1, col: 1 },
      { matrix: 'R', row: 1, col: 0 },
    ])
    expect(textOf(frames[5])).toEqual(['3 · 1 + (−1) · 2 = 1'])
    // The sum is written first, then carried from the line into its cell.
    expect(frames[5]?.working?.rows).toEqual([
      ['?', '?'],
      ['?', '?'],
    ])
    expect(frames[6]?.working?.rows).toEqual([
      ['?', '?'],
      ['1', '?'],
    ])
    expect(frames[6]?.landFrom).toBe(frames[0]?.lines[0]?.tokens.at(-1)?.key)
  })

  it('fills every listed cell in turn and keeps the earlier ones', () => {
    const frames = compile(lesson, {
      kind: 'product',
      left: 'L',
      right: 'R',
      into: 'P',
      cells: [
        [0, 0],
        [0, 1],
      ],
    })
    expect(frames.at(-1)?.working?.rows).toEqual([
      ['4', '8'],
      ['?', '?'],
    ])
    expect(frames.at(-1)?.lines).toHaveLength(2)
  })
})

describe('combine', () => {
  it('writes each scaled entry, the values, and lands the sum', () => {
    const frames = compile(lesson, {
      kind: 'combine',
      terms: [
        { matrix: 'L', scale: '2' },
        { matrix: 'R', scale: '-3' },
      ],
      into: 'P',
      cells: [[0, 0]],
    })
    expect(frames.map((f) => f.action)).toEqual([
      'line',
      'line',
      'highlight',
      'carry',
      'carry',
      'value',
      'collect',
      'write',
    ])
    expect(frames[0]?.lines[0]?.tokens.map((t) => t.text).join(' ')).toBe('2 · 2 − 3 · 1 = 4 − 3 = 1')
    expect(frames.at(-1)?.working?.rows).toEqual([
      ['1', '?'],
      ['?', '?'],
    ])
  })

  it('writes a plain sum without a values row', () => {
    const frames = compile(lesson, {
      kind: 'combine',
      terms: [{ matrix: 'L' }, { matrix: 'R' }],
      cells: [[1, 1]],
    })
    expect(frames[0]?.lines[0]?.tokens.map((t) => t.text).join(' ')).toBe('−1 + 0 = −1')
  })
})

describe('transpose', () => {
  it('lands each row down the matching column', () => {
    const frames = compile(lesson, { kind: 'transpose', matrix: 'L', into: 'P' })
    expect(frames.map((f) => f.action)).toEqual(['line', 'highlight', 'write', 'highlight', 'write'])
    expect(frames[1]?.marks).toEqual([
      { cell: ['L', 0, '*'], tone: 'row' },
      { cell: ['P', '*', 0], tone: 'ok' },
    ])
    expect(frames[2]?.working?.rows).toEqual([
      ['2', '?'],
      ['1', '?'],
    ])
    expect(frames.at(-1)?.working?.rows).toEqual([
      ['2', '3'],
      ['1', '-1'],
    ])
  })
})

describe('det2', () => {
  it('lays out one line, lights each diagonal, carries its numbers, writes the values, then collects', () => {
    const frames = compile(lesson, { kind: 'det2', matrix: 'A' })
    expect(frames.map((f) => f.action)).toEqual([
      'line',
      'highlight',
      'carry',
      'highlight',
      'carry',
      'value',
      'collect',
    ])
    // The whole line is laid out from the first action, hidden.
    expect(frames[0]?.lines[0]?.tokens.map((t) => t.text).join(' ')).toBe('3 · 2 − 1 · 4 = 6 − 4 = 2')
    expect(frames[0]?.shown).toEqual([])
    expect(frames[1]?.marks.map((m) => m.tone)).toEqual(['row', 'row'])
    expect(textOf(frames[2])).toEqual(['3 · 2'])
    expect(frames[2]?.flights.map((f) => f.from)).toEqual([
      { matrix: 'A', row: 0, col: 0 },
      { matrix: 'A', row: 1, col: 1 },
    ])
    // The values row comes only once every product is on the line.
    expect(textOf(frames[4])).toEqual(['3 · 2 − 1 · 4'])
    expect(textOf(frames[5])).toEqual(['3 · 2 − 1 · 4 = 6 − 4'])
    expect(textOf(frames[6])).toEqual(['3 · 2 − 1 · 4 = 6 − 4 = 2'])
    expect(frames[6]?.result).toBe('2')
  })
  it('keeps signs readable with negative entries', () => {
    const frames = compile(lesson, { kind: 'det2', matrix: 'C' })
    expect(textOf(frames.at(-1))).toEqual(['2 · 4 − (−3) · 1 = 8 − (−3) = 11'])
    expect(frames.at(-1)?.result).toBe('11')
  })
  it('stays symbolic for letters', () => {
    const frames = compile(lesson, { kind: 'det2', matrix: 'G' })
    expect(frames.at(-1)?.result).toBe('ad − bc')
  })
  it('confirms faster after a right answer', () => {
    const teach = compile(lesson, { kind: 'det2', matrix: 'A' })
    const reveal = compile(lesson, { kind: 'det2', matrix: 'A' }, 'reveal')
    expect(reveal.reduce((t, f) => t + f.dwell, 0)).toBeLessThan(teach.reduce((t, f) => t + f.dwell, 0))
  })
})

describe('reading floor', () => {
  it('holds a finished line 1 s plus 200 ms per new word, a value in an open line 400 ms', () => {
    const frames = compile(lesson, { kind: 'det2', matrix: 'A' })
    // Carrying "3 · 2" into a line that is still being written: one value-sized wait.
    expect(readingFloor(frames[1] as StageState, frames[2] as StageState)).toBe(FLOOR.value)
    // The collect finishes the line and fills the result slot: two new words.
    expect(readingFloor(frames[5] as StageState, frames[6] as StageState)).toBe(FLOOR.line + 2 * FLOOR.word)
    expect(readingFloor(frames[0] as StageState, frames[1] as StageState)).toBe(0)
  })
})

describe('sarrus', () => {
  it('plays the plus line, the minus line and carries both sums into the determinant', () => {
    const frames = compile(lesson, { kind: 'sarrus', matrix: 'S' })
    expect(frames[0]?.extended).toBe('S')
    // 2·4·5 + 1·1·1 + 3·0·2 = 41; 3·4·1 + 2·1·2 + 1·0·5 = 16; 41 − 16 = 25
    expect(textOf(frames.at(-1))).toEqual([
      '2 · 4 · 5 + 1 · 1 · 1 + 3 · 0 · 2 = 40 + 1 + 0 = 41',
      '3 · 4 · 1 + 2 · 1 · 2 + 1 · 0 · 5 = 12 + 4 + 0 = 16',
      '41 − 16 = 25',
    ])
    expect(frames.at(-1)?.result).toBe('25')
    // The second plus diagonal starts in the matrix and continues into the copy.
    const second = frames.filter((f) => f.action === 'carry')[1]
    expect(second?.flights.map((f) => ('copy' in f.from ? f.from.copy : false) ?? false)).toEqual([
      false,
      false,
      true,
    ])
    // The final line carries the two sums from their lines.
    expect(
      frames
        .filter((f) => f.action === 'carry')
        .at(-1)
        ?.flights.map((f) => 'token' in f.from),
    ).toEqual([true, true])
  })
})

describe('the shipped lessons', () => {
  it('every beat and reveal compiles', () => {
    for (const shipped of lessons) {
      for (const step of shipped.steps) {
        const beat = step.kind === 'explain' ? step.beat : 'reveal' in step ? step.reveal : undefined
        expect(() => compile(shipped, beat)).not.toThrow()
      }
    }
  })
})

describe('minor', () => {
  it('strikes the row and column, then lifts the submatrix', () => {
    const frames = compile(lesson, { kind: 'minor', matrix: 'S', row: 0, col: 1 })
    expect(frames.map((f) => f.minor?.lifted)).toEqual([false, true])
  })
})

describe('rowOps', () => {
  it('labels each operation and ends on the lesson result matrix', () => {
    for (const lesson of lessons) {
      for (const step of lesson.steps) {
        const beat = step.kind === 'explain' ? step.beat : 'reveal' in step ? step.reveal : undefined
        if (beat?.kind !== 'rowOps') continue
        const frames = compile(lesson, beat)
        expect(frames).toHaveLength(beat.ops.length * 2 + 1)
        expect(frames.at(-1)?.working?.rows).toEqual(
          lesson.matrices[beat.result]?.rows.map((row) => row.map((v) => v.replace(/^\+/, ''))),
        )
        // Every applied operation stays listed: no hidden line leaves a hole between shown ones.
        const last = frames.at(-1)
        const keys = last?.lines.flatMap((line) => line.tokens.map((t) => t.key)) ?? []
        expect(keys.every((key) => last?.shown.includes(key))).toBe(true)
      }
    }
  })
  it('writes operations the way the board does', () => {
    expect(rowOpLabel({ kind: 'addMultiple', target: 2, source: 0, factor: '-1' })).toBe(
      'R_{3} \\to R_{3} - R_{1}',
    )
    expect(rowOpLabel({ kind: 'scale', row: 2, factor: '1/4' })).toBe('R_{3} \\to \\tfrac{1}{4}R_{3}')
    expect(rowOpLabel({ kind: 'swap', a: 0, b: 1 })).toBe('R_{1} \\leftrightarrow R_{2}')
  })
})
