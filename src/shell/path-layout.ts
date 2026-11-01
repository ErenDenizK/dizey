import type { Lesson } from '../content/lessons/types'
import type { Chapter } from '../content/path'

/**
 * The geometry of the path: every lesson and every chapter test walks a grid in a serpentine. Rows hold two
 * nodes (left and right column); a row connects its nodes with a horizontal run, and the last node of a row
 * drops straight down (a vertical run, through the next chapter's header when a chapter ends) to the first node
 * of the next row. Pure numbers, so the screen only draws them and a test can check them.
 */

/** Horizontal position of the two columns, in percent of the path's width. */
export const COL_X = [28, 72] as const
/** Distance between the centres of two rows of one chapter (px). */
export const ROW = 100
/** Distance from a chapter header's centre to the row above and below it (px). */
export const HEAD_GAP = 75
/** The first chapter header's centre, from the top of the path (px). */
export const HEAD_TOP = 28
/** Space under the last row (px). */
export const TAIL = 56

export type PathNode = {
  /** Position in the whole walk, from 0. */
  index: number
  kind: 'lesson' | 'test'
  chapter: number
  col: 0 | 1
  y: number
  lesson: Lesson | null
}

export type PathHeader = {
  chapter: number
  y: number
  /** The side of the screen the heading sits on: opposite the vertical run that crosses it. */
  side: 'start' | 'end'
}

export type PathSegment = {
  /** `row`: a horizontal run (the duo's Satır); `col`: a vertical run (Sütun). */
  axis: 'row' | 'col'
  /** The walk index of the node this segment arrives at. */
  to: number
  x1: 0 | 1
  x2: 0 | 1
  y1: number
  y2: number
}

export type PathLayout = { nodes: PathNode[]; headers: PathHeader[]; segments: PathSegment[]; height: number }

export function layoutPath(chapters: readonly Chapter[]): PathLayout {
  const nodes: PathNode[] = []
  const headers: PathHeader[] = []
  const segments: PathSegment[] = []
  let last: PathNode | null = null
  let y = 0
  chapters.forEach((chapter, ci) => {
    const headerY = last ? y + HEAD_GAP : HEAD_TOP
    headers.push({ chapter: ci, y: headerY, side: last ? (last.col === 0 ? 'end' : 'start') : 'start' })
    y = headerY + HEAD_GAP
    const items: (Lesson | null)[] = [...chapter.lessons, null]
    let start: 0 | 1 = last ? last.col : 0
    for (let at = 0; at < items.length; at += 2) {
      if (at > 0) y += ROW
      const cols: (0 | 1)[] = at + 1 < items.length ? (start === 0 ? [0, 1] : [1, 0]) : [start]
      cols.forEach((col, k) => {
        const item = items[at + k] ?? null
        const node: PathNode = {
          index: nodes.length,
          kind: item ? 'lesson' : 'test',
          chapter: ci,
          col,
          y,
          lesson: item,
        }
        if (last) {
          const horizontal = last.y === y
          segments.push({
            axis: horizontal ? 'row' : 'col',
            to: node.index,
            x1: last.col,
            x2: col,
            y1: last.y,
            y2: y,
          })
        }
        nodes.push(node)
        last = node
      })
      start = (last as PathNode | null)?.col ?? start
    }
  })
  return { nodes, headers, segments, height: y + TAIL }
}
