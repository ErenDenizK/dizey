import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { dayLabel, daysUntil, examWeek } from '../content/exam'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { type Chapter, chapters, examItemTotal, pathCode, tileTitle } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { CHAPTER_TEST_SIZE, chapterTestState, createChapterSession, isChapterSet } from '../exam/chapter-test'
import { remainingMs } from '../exam/session'
import { saveSession, useExam } from '../exam/store'
import { type LessonRecord, resumeIndex } from '../lesson/progress'
import { type LessonState, stateOf, upNext } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { useSettings } from '../progress/settings'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { Sheet } from '../ui/Sheet'
import { burst, glow, ring } from '../ui/shine'
import { LessonPeek, type Peek } from './LessonPeek'
import { drawRing, fadeOutWas, holdInk, holdTag, inkOf, raiseTag } from './morph'
import { PressLink } from './PressLink'
import { morphFrom, overlayHostRef, stageRef } from './stage'
import './path.css'

/** Tiles per matrix row. The path reads left to right, then right to left (boustrophedon). */
const COLUMNS = 3

type Records = Readonly<Record<string, LessonRecord>>

/**
 * Dersler: today's next step and the whole map in one screen. The study order is drawn as a path through
 * a stack of matrices, one per chapter, whose entries are the lessons: the path snakes through each
 * matrix row by row, the walked part is solid, the part ahead is a quiet rail, and each matrix's brackets
 * fill as its chapter is finished. The lesson you are on is the one dark tile, and it opens in one tap. Any other tile opens its card, so every lesson stays open (no locks).
 */
export function PathView() {
  const records = useLessonRecords()
  const { examDate } = useSettings()
  const { main } = upNext(lessons, records, 0)
  const doneCount = lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
  const [peek, setPeek] = useState<Peek | null>(null)
  const [note, setNote] = useState<TestNote | null>(null)
  const examLine = examDate
    ? strings.path.examLine(daysUntil(examDate, new Date()), dayLabel(examDate))
    : strings.path.examWeekLine(examWeek.label)

  const root = useRef<HTMLDivElement>(null)
  useCelebrations(root, records)
  useOpening(root, main?.id ?? null)

  return (
    <Screen title={strings.path.title}>
      <div ref={root} className="pa-root">
        <div className="pa-summary">
          <p className="pa-summary__count">
            <b className="num">{doneCount}</b>
            <span>{strings.path.overallRest(lessons.length)}</span>
          </p>
          <p className="pa-summary__exam">{examLine}</p>
          <Meter records={records} done={doneCount} />
        </div>
        {chapters.map((chapter, index) => (
          <ChapterMatrix
            key={chapter.id}
            chapter={chapter}
            number={index + 1}
            records={records}
            mainId={main?.id ?? null}
            last={index === chapters.length - 1}
            onPick={(lesson, tile) => setPeek({ lesson, tile })}
            onNote={setNote}
          />
        ))}
        <Gate />
        {main ? null : <AllDone />}
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

/** One thin segment per lesson, grouped by chapter: the whole course at a glance. */
function Meter({ records, done }: { records: Records; done: number }) {
  return (
    <div className="pa-meter" role="img" aria-label={strings.path.meterLabel(done, lessons.length)}>
      {chapters.map((chapter) => {
        const states = chapter.lessons.map((lesson) => stateOf(records[lesson.id]))
        const done = states.filter((state) => state === 'done').length
        const current = states.includes('current') ? 1 : 0
        const total = chapter.lessons.length
        return (
          <span key={chapter.id} className="pa-meter__track" style={{ flexGrow: total }}>
            <i className="pa-meter__now" style={{ width: `${((done + current) / total) * 100}%` }} />
            <i className="pa-meter__done" style={{ width: `${(done / total) * 100}%` }} />
          </span>
        )
      })}
    </div>
  )
}

type Geometry = { width: number; height: number; centers: { x: number; y: number }[] }

function ChapterMatrix({
  chapter,
  number,
  records,
  mainId,
  last,
  onPick,
  onNote,
}: {
  chapter: Chapter
  number: number
  records: Records
  mainId: string | null
  last: boolean
  onPick: (lesson: Lesson, tile: HTMLElement) => void
  onNote: (note: TestNote) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  const states = chapter.lessons.map((lesson) => stateOf(records[lesson.id]))
  const done = states.filter((state) => state === 'done').length
  const total = chapter.lessons.length
  const complete = done === total

  // The path and the brackets are drawn in pixels from the tiles' real centres, so they follow any
  // text size or screen width.
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    // Layout offsets, not client rects: a tile's own press or settle motion must not move the path.
    const measure = () => {
      if (!el.offsetWidth) return
      const tiles = [...el.querySelectorAll<HTMLElement>('.pa-tile')]
      setGeometry({
        width: el.offsetWidth,
        height: el.offsetHeight,
        centers: tiles.map((tile) => {
          const at = offsetWithin(tile, el)
          return { x: at.left + tile.offsetWidth / 2, y: at.top + tile.offsetHeight / 2 }
        }),
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      className="pa-chapter"
      data-complete={complete || undefined}
      data-last={last || undefined}
      aria-labelledby={`chapter-${chapter.id}`}
    >
      <header className="pa-chapter__head">
        <span className="pa-chapter__no num" aria-hidden="true">
          {number}
        </span>
        <span className="pa-chapter__titles">
          <h2 id={`chapter-${chapter.id}`} className="pa-chapter__title">
            {chapter.label}
          </h2>
          <span className="pa-chapter__sub" data-complete={complete || undefined}>
            {complete ? strings.path.chapterDone : strings.path.chapterCount(done, total)}
            {chapter.examItems ? ` · ${strings.path.chapterWeight(chapter.examItems, examItemTotal)}` : ''}
          </span>
        </span>
      </header>
      <div ref={box} className="pa-matrix">
        {geometry ? <Decoration geometry={geometry} states={states} progress={done / total} /> : null}
        <ol className="pa-grid">
          {chapter.lessons.map((lesson, index) => {
            const row = Math.floor(index / COLUMNS)
            const column = row % 2 === 0 ? index % COLUMNS : COLUMNS - 1 - (index % COLUMNS)
            return (
              <li key={lesson.id} style={{ gridRow: row + 1, gridColumn: column + 1 }}>
                <Tile
                  lesson={lesson}
                  record={records[lesson.id]}
                  state={states[index] ?? 'new'}
                  main={lesson.id === mainId}
                  onPick={onPick}
                />
              </li>
            )
          })}
        </ol>
        <ChapterTestCell chapter={chapter} onNote={onNote} />
      </div>
    </section>
  )
}

type TestNote =
  | { kind: 'preparing'; chapter: Chapter; available: number }
  | { kind: 'replaces'; chapter: Chapter }

/**
 * The chapter's test, drawn as the augmented part of its matrix: a bar under the lessons, then one cell
 * inside the same brackets. Six questions from the bank, untimed, never locked. A chapter whose bank has
 * fewer than six is dimmed and says why on tap.
 */
function ChapterTestCell({ chapter, onNote }: { chapter: Chapter; onNote: (note: TestNote) => void }) {
  const navigate = useNavigate()
  const { session, chapters: results } = useExam()
  const { ready, available } = chapterTestState(questions, chapter)
  const last = results[chapter.id]
  const label = ready
    ? last
      ? strings.path.chapterTest.scoreLabel(chapter.label, last.correct, last.total)
      : strings.path.chapterTest.readyLabel(chapter.label, CHAPTER_TEST_SIZE)
    : strings.path.chapterTest.preparingLabel(chapter.label)

  const open = (el: HTMLElement) => {
    morphFrom.current = el
    const mine = session && session.set === `chapter:${chapter.id}`
    // A test left half done is picked up again; otherwise a fresh draw.
    if (!(mine && session.finishedAt === null)) {
      const at = Date.now()
      saveSession(createChapterSession(questions, chapter, at, at))
    }
    void navigate({ to: '/exam/run' })
  }
  const start = (el: HTMLElement) => {
    // The one stored attempt would be replaced: a rehearsal in progress is never thrown away silently.
    const rehearsalRunning =
      session !== null &&
      !isChapterSet(session.set) &&
      session.finishedAt === null &&
      remainingMs(session, Date.now()) > 0
    if (rehearsalRunning) onNote({ kind: 'replaces', chapter })
    else open(el)
  }

  return (
    <div className="pa-aug">
      <i className="pa-aug__bar" aria-hidden="true" />
      <Pressable
        className="pa-test"
        data-state={ready ? (last ? 'done' : 'new') : 'preparing'}
        data-chapter={chapter.id}
        data-morph-key={chapter.id}
        data-testid={`chapter-test-${chapter.id}`}
        aria-label={label}
        onClick={(event) =>
          ready ? start(event.currentTarget) : onNote({ kind: 'preparing', chapter, available })
        }
      >
        <span className="pa-test__text">
          <span className="pa-test__title">{strings.path.chapterTest.title}</span>
          <span className="pa-test__sub">
            {ready ? strings.path.chapterTest.size(CHAPTER_TEST_SIZE) : strings.path.chapterTest.preparing}
          </span>
        </span>
        {ready && last ? (
          <span className="pa-test__score num">
            {strings.path.chapterTest.score(last.correct, last.total)}
          </span>
        ) : ready ? (
          <ChevronRight />
        ) : null}
      </Pressable>
    </div>
  )
}

/** The explanation behind a dimmed chapter test, or the warning before a test replaces a rehearsal. */
function TestNoteSheet({ note, onClose }: { note: TestNote | null; onClose: () => void }) {
  const [shown, setShown] = useState<TestNote | null>(note)
  if (note && note !== shown) setShown(note)
  const navigate = useNavigate()
  const text = strings.path.chapterTest
  const goOn = () => {
    if (!shown) return
    const at = Date.now()
    saveSession(createChapterSession(questions, shown.chapter, at, at))
    onClose()
    void navigate({ to: '/exam/run' })
  }
  return (
    <Sheet open={note !== null} onClose={onClose} stage={stageRef} label={text.title}>
      {shown ? (
        <div className="sh-sheet-body" data-testid="chapter-test-note">
          <span className="dz-footnote sh-code">{shown.chapter.label}</span>
          {shown.kind === 'preparing' ? (
            <>
              <h2 className="dz-title2">{text.preparingTitle}</h2>
              <p className="dz-subhead">{text.preparingBody(shown.available, CHAPTER_TEST_SIZE)}</p>
              <Pressable className="dz-button" data-kind="primary" data-wide="" onClick={onClose}>
                {text.understood}
              </Pressable>
            </>
          ) : (
            <>
              <h2 className="dz-title2">{text.replacesTitle}</h2>
              <p className="dz-subhead">{text.replacesBody}</p>
              <Pressable
                className="dz-button"
                data-kind="primary"
                data-wide=""
                onClick={() => {
                  onClose()
                  void navigate({ to: '/exam' })
                }}
              >
                {text.replacesKeep}
              </Pressable>
              <Pressable className="dz-button" data-wide="" onClick={goOn}>
                {text.replacesGo}
              </Pressable>
            </>
          )}
        </div>
      ) : null}
    </Sheet>
  )
}

/** The end of the map: the full rehearsal, a pushed screen that grows out of this cell. */
function Gate() {
  return (
    <PressLink
      to="/exam"
      className="pa-gate"
      data-morph-key="gate"
      data-testid="vize-gate"
      aria-label={strings.path.gate.label}
      onClick={(event) => {
        morphFrom.current = event.currentTarget
      }}
    >
      <span className="pa-gate__text">
        <span className="pa-gate__title">{strings.path.gate.title}</span>
        <span className="pa-gate__sub">{strings.path.gate.body}</span>
      </span>
      <ChevronRight />
    </PressLink>
  )
}

/** Bracket arm length and stroke inset, in px. */
const BRACKET = { arm: 12, inset: 1.5 } as const

/** Brackets and path, behind the tiles. */
function Decoration({
  geometry,
  states,
  progress,
}: {
  geometry: Geometry
  states: LessonState[]
  progress: number
}) {
  const { width, height, centers } = geometry
  const { arm, inset } = BRACKET
  const left = `M${inset + arm} ${inset} H${inset} V${height - inset} H${inset + arm}`
  const right = `M${width - inset - arm} ${inset} H${width - inset} V${height - inset} H${width - inset - arm}`
  const segments = centers.slice(1).map((to, index) => {
    const from = centers[index] as { x: number; y: number }
    return { from, to, walked: states[index] === 'done' }
  })
  return (
    <svg className="pa-deco" width={width} height={height} aria-hidden="true">
      {segments.map(({ from, to, walked }, index) => (
        <line
          // biome-ignore lint/suspicious/noArrayIndexKey: segments follow the fixed lesson order
          key={index}
          className="pa-link"
          data-walked={walked || undefined}
          data-segment={index}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
        />
      ))}
      <path className="pa-bracket" d={left} />
      <path className="pa-bracket" d={right} />
      {progress > 0 ? (
        <>
          <path className="pa-bracket-fill" d={left} pathLength={1} strokeDasharray={`${progress} 1`} />
          <path className="pa-bracket-fill" d={right} pathLength={1} strokeDasharray={`${progress} 1`} />
        </>
      ) : null}
    </svg>
  )
}

function Tile({
  lesson,
  record,
  state,
  main,
  onPick,
}: {
  lesson: Lesson
  record: LessonRecord | undefined
  state: LessonState
  main: boolean
  onPick: (lesson: Lesson, tile: HTMLElement) => void
}) {
  useStateChange(lesson.id, `${state}${main ? '+main' : ''}`)
  const resuming = main && state === 'current' && record
  const step = resuming ? resumeIndex(lesson, record) + 1 : 0
  const face = (
    <>
      <span className="pa-tile__code num">{pathCode(lesson)}</span>
      <span className="pa-tile__title">{tileTitle(lesson)}</span>
      {state === 'done' ? <Check /> : null}
      {resuming ? (
        <span className="pa-tile__bar" aria-hidden="true">
          <i style={{ width: `${(step / lesson.steps.length) * 100}%` }} />
        </span>
      ) : null}
    </>
  )
  return (
    <>
      {main ? (
        // The lesson you are on opens in one tap and grows out of its tile; the others show their card.
        <PressLink
          to="/lesson/$id"
          params={{ id: lesson.id }}
          className="pa-tile"
          data-state={state}
          data-main=""
          data-lesson={lesson.id}
          data-morph-key={lesson.id}
          data-testid="continue-card"
          onClick={(event) => {
            morphFrom.current = event.currentTarget
          }}
          aria-label={
            resuming
              ? strings.path.continueAction(pathCode(lesson), lesson.title)
              : strings.path.startAction(pathCode(lesson), lesson.title)
          }
        >
          {face}
        </PressLink>
      ) : (
        <Pressable
          className="pa-tile"
          data-state={state}
          data-lesson={lesson.id}
          data-morph-key={lesson.id}
          aria-label={`${pathCode(lesson)} ${lesson.title}, ${strings.path.state[state]}`}
          onClick={(event) => onPick(lesson, event.currentTarget)}
        >
          {face}
        </Pressable>
      )}
      {main ? (
        <Tag lesson={lesson.id}>
          {state === 'current' ? strings.path.here.resume : strings.path.here.start}
        </Tag>
      ) : null}
    </>
  )
}

/**
 * The marker over the lesson you are on. It enters on `ui` (a few px low, transparent, then up) instead of
 * appearing; when the tile is still out of sight (a lesson folding into it) it waits for the tile's aftermath.
 */
function Tag({ lesson, children }: { lesson: string; children: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const tag = ref.current
    if (!tag) return
    holdTag(tag)
    const tile = tag.parentElement?.querySelector<HTMLElement>('.pa-tile')
    if (tile?.style.visibility === 'hidden') return
    raiseTag(tag)
  }, [])
  return (
    <span ref={ref} className="pa-here" data-tag="" data-lesson-tag={lesson} aria-hidden="true">
      {children}
    </span>
  )
}

/**
 * A tile whose state changes while it is on screen (becomes current, done, or loses the ring) does not swap:
 * the old fill crossfades out, the new ring draws itself in, and a new check or progress mark fades in. While
 * the tile is hidden (a lesson folding into it) the same parts wait for the aftermath in morph.ts.
 */
function useStateChange(id: string, key: string) {
  const last = useRef<{ key: string; fill: string; ink: ReturnType<typeof inkOf> } | null>(null)
  useLayoutEffect(() => {
    const tile = document.querySelector<HTMLElement>(`.pa-tile[data-lesson="${id}"]`)
    if (!tile) return
    const before = last.current
    last.current = { key, fill: getComputedStyle(tile).backgroundColor, ink: inkOf(tile) }
    if (!before || before.key === key) return
    const hidden = tile.style.visibility === 'hidden'
    const was = document.createElement('span')
    was.className = 'pa-tile__was'
    was.style.background = before.fill
    tile.prepend(was)
    holdInk(tile, before.ink)
    for (const part of tile.querySelectorAll<HTMLElement>(
      ':scope > .pa-tile__check, :scope > .pa-tile__bar',
    )) {
      holdTag(part)
      if (!hidden) raiseTag(part)
    }
    if (hidden) return
    fadeOutWas(tile)
    if (key.endsWith('+main')) drawRing(tile)
  }, [id, key])
}

function Check() {
  return (
    <svg className="pa-tile__check" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" />
      <path d="M5.8 10.3 8.6 13l5.6-6" />
    </svg>
  )
}

/** Every lesson done: the gate below is the next step. */
function AllDone() {
  return (
    <div className="pa-end">
      <p className="dz-subhead">{strings.path.allDone}</p>
    </div>
  )
}

/** Opens the path where you are: the current tile sits in the upper half of the screen. */
/** An element's layout position inside one of its ancestors, ignoring transforms. */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement): { left: number; top: number } {
  let left = 0
  let top = 0
  let node: HTMLElement | null = el
  while (node && node !== ancestor) {
    left += node.offsetLeft
    top += node.offsetTop
    const parent = node.offsetParent as HTMLElement | null
    if (parent && parent !== ancestor && !ancestor.contains(parent)) break
    node = parent
  }
  return { left, top }
}

/**
 * Opening the app: the screen starts at the top (title, where you stand), the tiles rise in from the
 * lesson you are on outward, and if that lesson is below the fold the view glides down to it, like a
 * camera finding your place on a map. A touch stops the glide at once.
 */
function useOpening(root: React.RefObject<HTMLDivElement | null>, mainId: string | null) {
  const played = useRef(false)
  useLayoutEffect(() => {
    const host = root.current
    const scroller = host?.closest<HTMLElement>('.dz-screen')
    if (played.current || !host || !scroller || !scroller.clientHeight) return
    played.current = true
    const tiles = [...host.querySelectorAll<HTMLElement>('.pa-tile')]
    const from = Math.max(
      0,
      tiles.findIndex((tile) => tile.dataset.lesson === mainId),
    )
    tiles.forEach((tile, index) => {
      const order = Math.abs(index - from)
      if (order > 9) return
      engine.set(tile, { opacity: 0, scale: 0.9, y: 14 })
      engine.after(40 + order * 28, () => engine.to(tile, { opacity: 1, scale: 1, y: 0 }, 'enter'))
    })

    const tile = tiles[from]
    if (!tile || !mainId) return
    const center = offsetWithin(tile, scroller).top + tile.offsetHeight / 2
    const goal = Math.min(
      center - scroller.clientHeight * 0.46,
      scroller.scrollHeight - scroller.clientHeight,
    )
    if (center < scroller.clientHeight * 0.72 || goal <= 0) return
    const camera = {}
    let stopped = false
    const stop = () => {
      stopped = true
      engine.set(camera, { top: scroller.scrollTop })
    }
    engine.bind(camera, (v) => {
      if (!stopped) scroller.scrollTop = v.top ?? 0
    })
    engine.set(camera, { top: 0 })
    for (const type of ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const)
      scroller.addEventListener(type, stop, { once: true, passive: true })
    engine.after(420, () => {
      if (!stopped) engine.to(camera, { top: goal }, 'page')
    })
  }, [root, mainId])
}

/**
 * A lesson finished while the path was hidden behind it: once you are back on the path, its tile lands
 * with a small settle and the segment it opens draws itself in.
 */
function useCelebrations(root: React.RefObject<HTMLDivElement | null>, records: Records) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const seen = useRef<Set<string> | null>(null)
  const pending = useRef<string[]>([])
  const done = lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').map((lesson) => lesson.id)
  const doneKey = done.join(',')

  useEffect(() => {
    const now = new Set(doneKey ? doneKey.split(',') : [])
    if (seen.current) for (const id of now) if (!seen.current.has(id)) pending.current.push(id)
    seen.current = now
  }, [doneKey])

  const onPath = (pathname.replace(/\/$/, '') || '/') === '/map'
  useEffect(() => {
    if (!onPath || !pending.current.length) return
    const ids = pending.current.splice(0)
    const now = new Set(seen.current)
    // The new ticks stay hidden while the lesson closes, so the first one seen is the one that lands.
    for (const id of ids) {
      const check = root.current?.querySelector<SVGSVGElement>(`[data-lesson="${id}"] .pa-tile__check`)
      if (check) engine.set(check, { scale: 0.3, opacity: 0 })
    }
    // Wait for the lesson to finish closing.
    engine.withChannel('chrome', () =>
      engine.after(420, () => {
        for (const id of ids) {
          const tile = root.current?.querySelector<HTMLElement>(`[data-lesson="${id}"]`)
          if (!tile) continue
          const chapter = chapters.find((c) => c.lessons.some((lesson) => lesson.id === id))
          const complete = Boolean(chapter?.lessons.every((lesson) => now.has(lesson.id)))
          lightTick(tile, complete)
          engine.set(tile, { scale: 0.86 })
          engine.to(tile, { scale: 1 }, 'settle')
          const local = chapter?.lessons.findIndex((lesson) => lesson.id === id) ?? -1
          const section = tile.closest('.pa-chapter')
          const link = section?.querySelector<SVGLineElement>(`[data-segment="${local}"]`)
          if (link) drawIn(link)
        }
      }),
    )
  }, [onPath, root])
}

/** Check pop delay after the tile starts settling, and the tick's draw delay after the disc lands (ms). */
const TICK_MS = { pop: 140, draw: 60 } as const

/**
 * The lesson's tick lands on the path: the disc pops, the tick draws itself in, and as it closes a ring of light
 * leaves it and the tile glows green once. The tick that finishes a chapter also lights the chapter's brackets and
 * throws a few sparks from the tile (src/ui/shine.ts).
 */
function lightTick(tile: HTMLElement, chapterDone: boolean) {
  const check = tile.querySelector<SVGSVGElement>('.pa-tile__check')
  const mark = check?.querySelector<SVGPathElement>('path')
  if (!check || !mark) return
  // Measured before the tile's settle scales it.
  const center = {
    x: check.getBoundingClientRect().left - tile.getBoundingClientRect().left + check.clientWidth / 2,
    y: check.getBoundingClientRect().top - tile.getBoundingClientRect().top + check.clientHeight / 2,
  }
  const length = mark.getTotalLength()
  mark.style.strokeDasharray = `${length} ${length}`
  engine.bind(mark, (v) => {
    mark.style.strokeDashoffset = `${(v.offset ?? 0).toFixed(2)}`
  })
  engine.set(mark, { offset: length })
  engine.set(check, { scale: 0.3, opacity: 0 })
  engine.after(TICK_MS.pop, () => {
    engine.to(check, { opacity: 1 }, 'fade')
    engine.to(check, { scale: 1 }, 'land')
    engine.after(TICK_MS.draw, () => {
      engine.to(mark, { offset: 0 }, 'draw', {
        onArrive: () => {
          mark.style.strokeDasharray = ''
          mark.style.strokeDashoffset = ''
        },
      })
      ring(tile, center.x, center.y)
      glow(tile, 1)
      if (!chapterDone) return
      const matrix = tile.closest<HTMLElement>('.pa-matrix')
      const deco = matrix?.querySelector<HTMLElement>('.pa-deco')
      if (deco) glow(deco, 1, 0.35)
      if (matrix) {
        const box = matrix.getBoundingClientRect()
        const at = tile.getBoundingClientRect()
        burst(matrix, at.left - box.left + at.width / 2, at.top - box.top + at.height / 2, {
          count: 12,
          speed: 200,
          seed: 5,
          tones: ['spark', 'ok', 'action'],
        })
      }
    })
  })
}

function drawIn(link: SVGLineElement) {
  const length = Math.hypot(
    link.x2.baseVal.value - link.x1.baseVal.value,
    link.y2.baseVal.value - link.y1.baseVal.value,
  )
  link.style.strokeDasharray = `${length} ${length}`
  engine.bind(link, (v) => {
    link.style.strokeDashoffset = `${(v.offset ?? 0).toFixed(2)}`
  })
  engine.set(link, { offset: length })
  engine.to(link, { offset: 0 }, 'draw', {
    onArrive: () => {
      link.style.strokeDasharray = ''
      link.style.strokeDashoffset = ''
    },
  })
}
