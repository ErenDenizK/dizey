import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { compile } from './timeline'

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

describe('det2', () => {
  it('lights the main diagonal, then the other, then writes the difference', () => {
    const frames = compile(lesson, { kind: 'det2', matrix: 'A' })
    expect(frames).toHaveLength(3)
    expect(frames[0]?.marks.map((m) => m.tone)).toEqual(['row', 'row'])
    expect(frames[1]?.notes).toEqual(['3 · 2 = 6', '1 · 4 = 4'])
    expect(frames[2]?.result).toBe('2')
    expect(frames[2]?.notes.at(-1)).toBe('6 − 4 = 2')
  })
  it('keeps signs readable with negative entries', () => {
    const frames = compile(lesson, { kind: 'det2', matrix: 'C' })
    expect(frames[1]?.notes[1]).toBe('(−3) · 1 = −3')
    expect(frames[2]?.notes.at(-1)).toBe('8 − (−3) = 11')
    expect(frames[2]?.result).toBe('11')
  })
  it('stays symbolic for letters', () => {
    const frames = compile(lesson, { kind: 'det2', matrix: 'G' })
    expect(frames.at(-1)?.result).toBe('ad − bc')
  })
})

describe('sarrus', () => {
  it('plays three plus and three minus diagonals and lands on the determinant', () => {
    const frames = compile(lesson, { kind: 'sarrus', matrix: 'S' })
    expect(frames).toHaveLength(7)
    // 2·4·5 + 1·1·1 + 3·0·2 = 41; 3·4·1 + 2·1·2 + 1·0·5 = 16; 41 − 16 = 25
    expect(frames.at(-1)?.notes).toEqual(['41 − 16 = 25'])
    expect(frames.at(-1)?.result).toBe('25')
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
