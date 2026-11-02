import { describe, expect, it } from 'vitest'
import { chapters } from '../content/path'
import { columnCount, columnsAt, layoutPath, WIDE_PATH } from './path-layout'

describe('layoutPath', () => {
  const layout = layoutPath(chapters)
  const lessonCount = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0)

  it('walks every lesson and one test per chapter, in order', () => {
    expect(layout.nodes).toHaveLength(lessonCount + chapters.length)
    expect(layout.nodes.map((node) => node.index)).toEqual(layout.nodes.map((_, i) => i))
    const tests = layout.nodes.filter((node) => node.kind === 'test')
    expect(tests.map((node) => node.chapter)).toEqual(chapters.map((_, i) => i))
    for (const node of layout.nodes.filter((n) => n.kind === 'test'))
      expect(layout.nodes[node.index + 1]?.chapter ?? node.chapter + 1).toBeGreaterThan(node.chapter)
  })

  it('goes down the page and never doubles back', () => {
    for (let i = 1; i < layout.nodes.length; i++)
      expect(layout.nodes[i]?.y).toBeGreaterThanOrEqual(layout.nodes[i - 1]?.y ?? 0)
    expect(layout.height).toBeGreaterThan(layout.nodes.at(-1)?.y ?? 0)
  })

  it('joins consecutive nodes with one segment, horizontal inside a row and vertical between rows', () => {
    expect(layout.segments).toHaveLength(layout.nodes.length - 1)
    for (const seg of layout.segments) {
      if (seg.axis === 'row') {
        expect(seg.y1).toBe(seg.y2)
        expect(seg.x1).not.toBe(seg.x2)
      } else {
        expect(seg.y2).toBeGreaterThan(seg.y1)
        expect(seg.x1).toBe(seg.x2)
      }
    }
  })

  it('puts each chapter header between the rows it separates, off the vertical run', () => {
    expect(layout.headers).toHaveLength(chapters.length)
    for (const header of layout.headers.slice(1)) {
      const first = layout.nodes.find((n) => n.chapter === header.chapter)
      const before = layout.nodes[(first?.index ?? 1) - 1]
      expect(header.y).toBeGreaterThan(before?.y ?? 0)
      expect(header.y).toBeLessThan(first?.y ?? 0)
      expect(header.side).toBe(before?.col === 0 ? 'end' : 'start')
    }
  })

  it('puts every node and run endpoint on whole CSS px for any phone width', () => {
    for (let width = 320; width <= 430; width++) {
      const cols = columnsAt(width)
      expect(cols).toHaveLength(2)
      for (const [i, x] of cols.entries()) {
        expect(Number.isInteger(x)).toBe(true)
        if (i > 0) expect(x).toBeGreaterThan(cols[i - 1] ?? 0)
      }
      for (const node of layout.nodes) expect(Number.isInteger(node.y)).toBe(true)
      for (const header of layout.headers) expect(Number.isInteger(header.y)).toBe(true)
      for (const seg of layout.segments) {
        expect(Number.isInteger(seg.y1)).toBe(true)
        expect(Number.isInteger(seg.y2)).toBe(true)
      }
    }
  })

  it('walks four columns from a path 600 px wide, two below it', () => {
    expect(columnCount(WIDE_PATH - 1)).toBe(2)
    expect(columnCount(WIDE_PATH)).toBe(4)
    expect(columnsAt(WIDE_PATH - 1)).toHaveLength(2)
    expect(columnsAt(WIDE_PATH)).toHaveLength(4)
  })
})

describe('layoutPath in four columns', () => {
  const layout = layoutPath(chapters, 4)

  it('snakes a chapter of ten lessons in rows of 4, 4 and 2, and the test node continues the snake', () => {
    const first = layout.nodes.filter((node) => node.chapter === 0)
    expect(first).toHaveLength(11)
    const rows = [...new Set(first.map((node) => node.y))].map((y) => first.filter((node) => node.y === y))
    expect(rows.map((row) => row.length)).toEqual([4, 4, 3])
    expect(rows[0]?.map((node) => node.col)).toEqual([0, 1, 2, 3])
    expect(rows[1]?.map((node) => node.col)).toEqual([3, 2, 1, 0])
    expect(rows[2]?.map((node) => node.col)).toEqual([0, 1, 2])
    expect(rows[2]?.at(-1)?.kind).toBe('test')
    expect(rows[2]?.slice(0, 2).every((node) => node.kind === 'lesson')).toBe(true)
  })

  it('keeps the same shape guarantees as the phone path', () => {
    const lessonCount = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0)
    expect(layout.nodes).toHaveLength(lessonCount + chapters.length)
    expect(layout.segments).toHaveLength(layout.nodes.length - 1)
    for (const seg of layout.segments) {
      if (seg.axis === 'row') {
        expect(seg.y1).toBe(seg.y2)
        expect(Math.abs(seg.x1 - seg.x2)).toBe(1)
      } else {
        expect(seg.y2).toBeGreaterThan(seg.y1)
        expect(seg.x1).toBe(seg.x2)
      }
    }
    for (const node of layout.nodes) {
      expect(node.col).toBeGreaterThanOrEqual(0)
      expect(node.col).toBeLessThan(4)
    }
    for (let i = 1; i < layout.nodes.length; i++)
      expect(layout.nodes[i]?.y).toBeGreaterThanOrEqual(layout.nodes[i - 1]?.y ?? 0)
  })

  it('puts every column and every y on whole CSS px for any wide path width', () => {
    for (let width = WIDE_PATH; width <= 1200; width++) {
      const cols = columnsAt(width)
      expect(cols).toHaveLength(4)
      for (const [i, x] of cols.entries()) {
        expect(Number.isInteger(x)).toBe(true)
        if (i > 0) expect(x).toBeGreaterThan((cols[i - 1] ?? 0) + 56)
      }
    }
    for (const node of layout.nodes) expect(Number.isInteger(node.y)).toBe(true)
    for (const header of layout.headers) expect(Number.isInteger(header.y)).toBe(true)
  })
})
