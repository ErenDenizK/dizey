import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DuoHandle } from '../character/Duo'
import { lessons } from '../content/lessons'
import { chapters } from '../content/path'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { stateOf, upNext } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { Screen } from '../ui/Screen'
import { CompanionSlot } from './CompanionSlot'
import { LessonPeek, type Peek } from './LessonPeek'
import { PathDock } from './PathDock'
import { ChapterTestNode, Gate, LessonNode, type TestNote, TestNoteSheet } from './PathNodes'
import { useCelebrations } from './path-effects'
import { COL_X, layoutPath } from './path-layout'
import { overlayHostRef } from './stage'
import './companion-slot.css'
import './path-home.css'

/**
 * Yol: the whole route as one game-like path, and the home screen. Every lesson and every chapter test walks a
 * grid in a serpentine (src/shell/path-layout.ts), Satır's blue along the rows and Sütun's plum down the
 * columns; what you have walked is full strength, what is left is faint. A sticky header names the chapter you
 * are in, the duo stands by the lesson you are on, and a dock above the tab bar holds the next lesson's card
 * with the satellites (question of the day, mistakes, the rehearsal). Every lesson stays open (no locks).
 */
export function PathHome() {
  const records = useLessonRecords()
  const { main } = upNext(lessons, records, 0)
  const layout = useMemo(() => layoutPath(chapters), [])
  const [peek, setPeek] = useState<Peek | null>(null)
  const [note, setNote] = useState<TestNote | null>(null)
  const mainNode = layout.nodes.find((node) => node.lesson?.id === main?.id)
  // Segments up to the lesson you are on are walked; with every lesson done the whole path is.
  const reached = main ? (mainNode?.index ?? -1) : Number.POSITIVE_INFINITY

  const root = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLElement>(null)
  const duo = useRef<DuoHandle>(null)
  useEffect(() => {
    duo.current?.react('happy')
  }, [])
  useCelebrations(root, records)
  useOpening(root, main?.id ?? null)
  const chapterIndex = useChapterInView(root, head, mainNode?.chapter ?? chapters.length - 1)
  const chapter = chapters[chapterIndex]
  const doneInChapter = chapter?.lessons.filter((l) => stateOf(records[l.id]) === 'done').length ?? 0

  return (
    <Screen title={strings.path.title}>
      <header ref={head} className="ph-head" data-testid="path-head">
        <p className="ph-head__title">{chapter?.label}</p>
        <p className="ph-head__sub">
          {strings.path.chapterOrdinal(chapterIndex + 1)} ·{' '}
          <span className="num">
            {strings.path.chapterCount(doneInChapter, chapter?.lessons.length ?? 0)}
          </span>
        </p>
      </header>
      <div className="ph-field">
        <div ref={root} className="ph-root" style={{ height: layout.height }} data-testid="path">
          <svg className="ph-wires" width="100%" height={layout.height} aria-hidden="true">
            {layout.segments.map((seg) => (
              <line
                key={`${seg.to}`}
                className="ph-wire"
                data-axis={seg.axis}
                data-faint={seg.to > reached || undefined}
                x1={`${COL_X[seg.x1]}%`}
                x2={`${COL_X[seg.x2]}%`}
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
                  style={{ left: `${COL_X[node.col]}%`, top: node.y }}
                >
                  {node.lesson ? (
                    <LessonNode
                      lesson={node.lesson}
                      record={records[node.lesson.id]}
                      main={current}
                      onPick={(lesson, tile) => setPeek({ lesson, tile })}
                    />
                  ) : c ? (
                    <ChapterTestNode chapter={c} onNote={setNote} />
                  ) : null}
                  {current ? (
                    <span className="ph-duo">
                      <CompanionSlot name="today" size="large" mood="happy" alive duo={duo} />
                    </span>
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
      <PathDock />
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

/**
 * The chapter whose heading has scrolled under the sticky header (the first one before any has): what the
 * header names. Only a change of chapter renders.
 */
function useChapterInView(
  root: React.RefObject<HTMLElement | null>,
  head: React.RefObject<HTMLElement | null>,
  initial: number,
) {
  const [index, setIndex] = useState(initial)
  useEffect(() => {
    const scroller = root.current?.closest<HTMLElement>('.dz-screen')
    const bar = head.current
    if (!scroller || !bar) return
    const headings = [...(root.current?.querySelectorAll<HTMLElement>('.ph-chapter') ?? [])]
    const measure = () => {
      const line = bar.getBoundingClientRect().bottom
      let found = 0
      headings.forEach((heading, i) => {
        const box = heading.getBoundingClientRect()
        if (box.top + box.height / 2 <= line) found = i
      })
      setIndex(found)
    }
    scroller.addEventListener('scroll', measure, { passive: true })
    return () => scroller.removeEventListener('scroll', measure)
  }, [root, head])
  return index
}

/**
 * Opening the app, and coming back to a new lesson: the view glides to the lesson you are on, like a camera
 * finding your place, so it lands between the header and the dock. It rides the spring engine (never a native
 * smooth scroll), and a touch stops it at once.
 */
function useOpening(root: React.RefObject<HTMLDivElement | null>, mainId: string | null) {
  useLayoutEffect(() => {
    const host = root.current
    const scroller = host?.closest<HTMLElement>('.dz-screen')
    if (!host || !scroller || !scroller.clientHeight || !mainId) return
    const node = host.querySelector<HTMLElement>(`.pa-tile[data-lesson="${mainId}"]`)
    const bar = scroller.querySelector<HTMLElement>('.ph-head')
    const dock = scroller.querySelector<HTMLElement>('.ph-dock')
    if (!node || !bar || !dock) return
    const frame = scroller.getBoundingClientRect()
    const box = node.getBoundingClientRect()
    const center = box.top - frame.top + scroller.scrollTop + box.height / 2
    // The free band of the screen: under the header and above the dock, which rests at the bottom.
    const top = bar.getBoundingClientRect().bottom - frame.top
    const bottom =
      scroller.clientHeight - dock.offsetHeight - parseFloat(getComputedStyle(dock).bottom || '0')
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
