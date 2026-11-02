import { useRouterState } from '@tanstack/react-router'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { lessons } from '../content/lessons'
import { chapters } from '../content/path'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { stateOf, upNext } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { Screen } from '../ui/Screen'
import type { Preview } from './DockPreview'
import { LessonPeek, type Peek } from './LessonPeek'
import { PathDock } from './PathDock'
import { ChapterTestNode, Gate, LessonNode, type TestNote, TestNoteSheet } from './PathNodes'
import { useCelebrations } from './path-effects'
import { columnCount, columnsAt, layoutPath } from './path-layout'
import { overlayHostRef } from './stage'
import { useWide } from './wide'
import './path-home.css'

/**
 * Yol: the whole route as one game-like path, and the home screen. Every lesson and every chapter test walks a
 * grid in a serpentine (src/shell/path-layout.ts), Satır's blue along the rows and Sütun's plum down the
 * columns; what you have walked is full strength, what is left is faint. Each chapter opens with its bracketed
 * number, name and count; Mırtis sits on the lesson you are on, and a dock above the tab bar holds the next lesson's card
 * with the satellites (question of the day, mistakes, the rehearsal). Every lesson stays open (no locks).
 */
export function PathHome() {
  const records = useLessonRecords()
  const { main } = upNext(lessons, records, 0)
  const root = useRef<HTMLDivElement>(null)
  // Four columns from a path 600 px wide; the measured width is the one thing the layout reads.
  const width = useWidth(root)
  const count = columnCount(width)
  const columns = columnsAt(width, count)
  const layout = useMemo(() => layoutPath(chapters, count), [count])
  const [peek, setPeek] = useState<Peek | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const wide = useWide()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  // A wide window picks a lesson into the dock's slot; a phone-sized one into the sheet. Crossing the line clears both.
  const [seenWide, setSeenWide] = useState(wide)
  if (seenWide !== wide) {
    setSeenWide(wide)
    setPeek(null)
    setPreview(null)
  }
  // Going into a lesson hands the slot back.
  if (preview && pathname.startsWith('/lesson')) setPreview(null)
  const [note, setNote] = useState<TestNote | null>(null)
  const mainNode = layout.nodes.find((node) => node.lesson?.id === main?.id)
  // Segments up to the lesson you are on are walked; with every lesson done the whole path is.
  const reached = main ? (mainNode?.index ?? -1) : Number.POSITIVE_INFINITY

  useCelebrations(root, records)
  useWalked(root, reached)
  useOpening(root, main?.id ?? null)
  usePicked(preview?.tile ?? null)

  return (
    <Screen title={strings.path.title}>
      <div className="ph-paper">
        <div className="ph-field">
          <div
            ref={root}
            className="ph-root"
            style={{ height: layout.height }}
            data-testid="path"
            data-columns={count}
          >
            <svg className="ph-wires" width="100%" height={layout.height} aria-hidden="true">
              {layout.segments.map((seg, i) => (
                <line
                  // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list; one node can have up to three pieces arriving
                  key={i}
                  className="ph-wire"
                  data-axis={seg.axis}
                  data-to={seg.to}
                  data-faint={seg.to > reached || undefined}
                  x1={columns[seg.x1]}
                  x2={columns[seg.x2]}
                  y1={seg.y1}
                  y2={seg.y2}
                />
              ))}
            </svg>
            {layout.headers.map((header) => {
              const c = chapters[header.chapter]
              if (!c) return null
              return (
                <h2
                  key={c.id}
                  className="ph-chapter"
                  data-side={header.side}
                  data-testid={`chapter-${c.id}`}
                  style={{ top: header.y }}
                >
                  <span className="ph-chapter__no num" aria-hidden="true">
                    {header.chapter + 1}
                  </span>
                  <span className="ph-chapter__name">{c.label}</span>
                  <span className="ph-chapter__count num">
                    {strings.path.chapterCount(
                      c.lessons.filter((l) => stateOf(records[l.id]) === 'done').length,
                      c.lessons.length,
                    )}
                  </span>
                </h2>
              )
            })}
            <ol className="ph-nodes" aria-label={strings.path.listLabel}>
              {layout.nodes.map((node) => {
                const c = chapters[node.chapter]
                const current = node.lesson !== null && node.lesson.id === main?.id
                return (
                  <li
                    key={node.index}
                    className="ph-slot"
                    data-kind={node.kind}
                    data-current={current || undefined}
                    data-col={node.col}
                    style={{ left: columns[node.col], top: node.y }}
                  >
                    {node.lesson ? (
                      <LessonNode
                        lesson={node.lesson}
                        record={records[node.lesson.id]}
                        main={current}
                        onPick={(lesson, tile) =>
                          wide ? setPreview({ lesson, tile }) : setPeek({ lesson, tile })
                        }
                      />
                    ) : c ? (
                      <ChapterTestNode chapter={c} number={node.chapter + 1} onNote={setNote} />
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </div>
          <div className="ph-end">
            <Gate />
          </div>
        </div>
        <PathDock preview={preview} onBack={() => setPreview(null)} />
      </div>
      {overlayHostRef.current
        ? createPortal(
            <>
              <LessonPeek peek={peek} onClose={() => setPeek(null)} />
              <TestNoteSheet note={note} onClose={() => setNote(null)} />
            </>,
            overlayHostRef.current,
          )
        : null}
    </Screen>
  )
}

/** The path's width in px, measured before the first paint and kept current, so the columns can sit on whole pixels. */
function useWidth(root: React.RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(390)
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const read = () => setWidth(el.clientWidth || 390)
    read()
    const watch = new ResizeObserver(read)
    watch.observe(el)
    return () => watch.disconnect()
  }, [root])
  return width
}

/** The lesson picked into the dock's slot wears a ring that grows in and out (never in one frame). */
function usePicked(tile: HTMLElement | null) {
  useLayoutEffect(() => {
    if (!tile) return
    engine.to(tile, { '--pick': 1 }, 'fade')
    return () => {
      engine.to(tile, { '--pick': 0 }, 'fade')
    }
  }, [tile])
}

/**
 * Opening the app, and coming back to a new lesson: the view glides to the lesson you are on, like a camera
 * finding your place, so it lands between the top of the screen and the dock. It rides the spring engine (never a native
 * smooth scroll), and a touch stops it at once.
 */
function useOpening(root: React.RefObject<HTMLDivElement | null>, mainId: string | null) {
  useLayoutEffect(() => {
    const host = root.current
    const scroller = host?.closest<HTMLElement>('.dz-screen')
    if (!host || !scroller || !scroller.clientHeight || !mainId) return
    const node = host.querySelector<HTMLElement>(`.pa-tile[data-lesson="${mainId}"]`)
    const dock = scroller.querySelector<HTMLElement>('.ph-dock')
    if (!node || !dock) return
    const frame = scroller.getBoundingClientRect()
    const box = node.getBoundingClientRect()
    const center = box.top - frame.top + scroller.scrollTop + box.height / 2
    // The free band of the screen: under the screen's top padding and above the dock, which rests at the bottom.
    const top = Number.parseFloat(getComputedStyle(scroller).paddingTop) || 0
    const bottom = dock.getBoundingClientRect().top - frame.top
    const goal = Math.max(
      0,
      Math.min(center - (top + bottom) / 2, scroller.scrollHeight - scroller.clientHeight),
    )
    const inView =
      center - scroller.scrollTop > top + box.height && center - scroller.scrollTop < bottom - box.height
    if (inView || Math.abs(goal - scroller.scrollTop) < 4) return
    const camera = {}
    let stopped = false
    const stop = () => {
      stopped = true
      engine.set(camera, { top: scroller.scrollTop })
    }
    engine.bind(camera, (v) => {
      if (!stopped) scroller.scrollTop = v.top ?? 0
    })
    engine.set(camera, { top: scroller.scrollTop })
    for (const type of ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const)
      scroller.addEventListener(type, stop, { once: true, passive: true })
    engine.after(300, () => {
      if (!stopped) engine.to(camera, { top: goal }, 'page')
    })
  }, [root, mainId])
}

/** What is ahead of you is faint. A run that becomes walked (or not) fades to its new strength, never in one frame. */
const FAINT = 0.25
function useWalked(root: React.RefObject<HTMLElement | null>, reached: number) {
  const before = useRef<number | null>(null)
  useLayoutEffect(() => {
    const lines = root.current?.querySelectorAll<SVGLineElement>('.ph-wire') ?? []
    for (const line of lines) {
      const to = Number(line.dataset.to)
      const target = to > reached ? FAINT : 1
      if (before.current === null) engine.set(line, { opacity: target })
      else if (to > before.current !== to > reached) engine.to(line, { opacity: target }, 'fade')
    }
    before.current = reached
  }, [root, reached])
}
