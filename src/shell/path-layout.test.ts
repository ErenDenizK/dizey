import { describe, expect, it } from 'vitest'
import { chapters } from '../content/path'
import { layoutPath } from './path-layout'

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
})
