import type { Lesson } from '../content/lessons/types'
import type { Chapter } from '../content/path'

/**
 * The geometry of the path: every lesson and every chapter test walks a grid in a serpentine (boustrophedon).
 * Rows hold as many nodes as the path has columns (two on a phone, four once the path is wide); a row connects
 * its nodes with a horizontal run, and the last node of a row drops straight down (a vertical run, through the
 * next chapter's header when a chapter ends) to the first node of the next row, which walks back the other way.
 * The path widens, it never shrinks: nodes and runs keep their size, only the space between columns grows.
 * Pure numbers, so the screen only draws them and a test can check them.
 */

/** Horizontal position of the columns, in percent of the path's width, by column count. */
export const COL_X: Record<number, readonly number[]> = {
  2: [28, 72],
  4: [12.5, 37.5, 62.5, 87.5],
}
/** The path is this wide (px) or wider: four columns. Below it, the phone's two. */
export const WIDE_PATH = 600
/** How many columns a path of this measured width (px) walks. */
export function columnCount(width: number): 2 | 4 {
  return width >= WIDE_PATH ? 4 : 2
}
/** Distance between the centres of two rows of one chapter (px). */
export const ROW = 100
/** Distance from a chapter header's centre to the row above and below it (px). */
export const HEAD_GAP = 75
/** The first chapter header's centre, from the top of the path (px). */
export const HEAD_TOP = 28
/** Space under the last row (px). */
export const TAIL = 56

/**
 * The columns' x in whole CSS px for a path of this width. Fractional positions (28% of 390 is 109.2) land
 * between device pixels and blur the 4 px runs and the tiles' edges; rounding here puts every node and every
 * run endpoint on the same whole pixel.
 */
export function columnsAt(width: number, count: 2 | 4 = columnCount(width)): readonly number[] {
  return (COL_X[count] ?? COL_X[2] ?? []).map((percent) => Math.round((width * percent) / 100))
}

export type PathNode = {
  /** Position in the whole walk, from 0. */
  index: number
  kind: 'lesson' | 'test'
  chapter: number
  /** Column index, from 0 on the left. */
  col: number
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
  x1: number
  x2: number
  y1: number
  y2: number
}

export type PathLayout = { nodes: PathNode[]; headers: PathHeader[]; segments: PathSegment[]; height: number }

export function layoutPath(chapters: readonly Chapter[], columns: 2 | 4 = 2): PathLayout {
  const nodes: PathNode[] = []
  const headers: PathHeader[] = []
  const segments: PathSegment[] = []
  const edge = columns - 1
  let last: PathNode | null = null
  let y = 0
  // The way the last row walked: 1 to the right, -1 to the left.
  let heading: 1 | -1 = -1
  chapters.forEach((chapter, ci) => {
    const headerY = last ? y + HEAD_GAP : HEAD_TOP
    // The heading sits on the side the vertical run does not cross.
    headers.push({ chapter: ci, y: headerY, side: last ? (last.col <= edge / 2 ? 'end' : 'start') : 'start' })
    y = headerY + HEAD_GAP
    const items: (Lesson | null)[] = [...chapter.lessons, null]
    let at = 0
    let first = true
    while (at < items.length) {
      if (!first) y += ROW
      first = false
      const from = last ? last.col : 0
      // From an edge the row walks away from it; from the middle it walks back the way the last row did not.
      const way: 1 | -1 = from === 0 ? 1 : from === edge ? -1 : heading === 1 ? -1 : 1
      const room = way === 1 ? columns - from : from + 1
      const count = Math.min(room, items.length - at)
      for (let k = 0; k < count; k++) {
        const col = from + way * k
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
      }
      heading = way
      at += count
    }
  })
  return { nodes, headers, segments, height: y + TAIL }
}
