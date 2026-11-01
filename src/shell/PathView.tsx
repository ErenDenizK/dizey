import { useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { dayLabel, daysUntil, examWeek } from '../content/exam'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { type Chapter, chapters, examItemTotal, pathCode, tileTitle } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { useExam } from '../exam/store'
import { type LessonRecord, resumeIndex } from '../lesson/progress'
import { type LessonState, stateOf, upNext } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { openMistakes } from '../progress/mistakes'
import { useSettings } from '../progress/settings'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { burst, glow, ring } from '../ui/shine'
import { LessonPeek, type Peek } from './LessonPeek'
import { drum } from './lens'
import { PressLink } from './PressLink'
import { morphFrom, overlayHostRef } from './stage'
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
  const { outcomes } = useExam()
  const { examDate } = useSettings()
  const { main } = upNext(lessons, records, 0)
  const mistakes = openMistakes(lessons, records, questions, outcomes).length
  const doneCount = lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
  const [peek, setPeek] = useState<Peek | null>(null)
  const examLine = examDate
    ? strings.path.examLine(daysUntil(examDate, new Date()), dayLabel(examDate))
    : strings.path.examWeekLine(examWeek.label)

  const root = useRef<HTMLDivElement>(null)
  useCelebrations(root, records)
  useOpening(root, main?.id ?? null)
  useFocusLens(root)

  return (
    <Screen title={strings.path.title}>
      <div ref={root} className="pa-root">
        <div className="pa-summary" data-focus="fade">
          <p className="pa-summary__count">
            <b className="num">{doneCount}</b>
            <span>{strings.path.overallRest(lessons.length)}</span>
          </p>
          <p className="pa-summary__exam">{examLine}</p>
          <Meter records={records} done={doneCount} />
          {mistakes ? (
            <PressLink to="/me" className="pa-mistakes" pressClass="dz-pressable">
              <span className="pa-mistakes__dot" aria-hidden="true" />
              <span className="dz-row-main">{strings.path.mistakes(mistakes)}</span>
              <ChevronRight />
            </PressLink>
          ) : null}
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
          />
        ))}
        {main ? null : <AllDone />}
      </div>
      {overlayHostRef.current
        ? createPortal(<LessonPeek peek={peek} onClose={() => setPeek(null)} />, overlayHostRef.current)
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
}: {
  chapter: Chapter
  number: number
  records: Records
  mainId: string | null
  last: boolean
  onPick: (lesson: Lesson, tile: HTMLElement) => void
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
    // Layout offsets, not client rects: the focus lens scales the cells, and the path must not follow it.
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
      <header className="pa-chapter__head" data-focus="fade">
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
              <li key={lesson.id} data-focus="" style={{ gridRow: row + 1, gridColumn: column + 1 }}>
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
      </div>
    </section>
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
  const svg = useRef<SVGSVGElement>(null)
  // React draws in layout coordinates; ask the focus lens to bend this drawing onto its drum again.
  useLayoutEffect(() => {
    svg.current?.dispatchEvent(new Event('pa-relens', { bubbles: true }))
  })
  const left = `M${inset + arm} ${inset} H${inset} V${height - inset} H${inset + arm}`
  const right = `M${width - inset - arm} ${inset} H${width - inset} V${height - inset} H${width - inset - arm}`
  const segments = centers.slice(1).map((to, index) => {
    const from = centers[index] as { x: number; y: number }
    return { from, to, walked: states[index] === 'done' }
  })
  return (
    <svg ref={svg} className="pa-deco" width={width} height={height} aria-hidden="true">
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
      <path className="pa-bracket" data-side="left" d={left} />
      <path className="pa-bracket" data-side="right" d={right} />
      {progress > 0 ? (
        <>
          <path
            className="pa-bracket-fill"
            data-side="left"
            d={left}
            pathLength={1}
            strokeDasharray={`${progress} 1`}
          />
          <path
            className="pa-bracket-fill"
            data-side="right"
            d={right}
            pathLength={1}
            strokeDasharray={`${progress} 1`}
          />
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
          aria-label={`${pathCode(lesson)} ${lesson.title}, ${strings.path.state[state]}`}
          onClick={(event) => onPick(lesson, event.currentTarget)}
        >
          {face}
        </Pressable>
      )}
      {main ? (
        <span className="pa-here" aria-hidden="true">
          {state === 'current' ? strings.path.here.resume : strings.path.here.start}
        </span>
      ) : null}
    </>
  )
}

function Check() {
  return (
    <svg className="pa-tile__check" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" />
      <path d="M5.8 10.3 8.6 13l5.6-6" />
    </svg>
  )
}

/** Every lesson done: the path ends in the exam rehearsal. */
function AllDone() {
  return (
    <div className="pa-end">
      <p className="dz-subhead">{strings.path.allDone}</p>
      <PressLink to="/exam" className="dz-button" data-kind="primary" data-wide="">
        {strings.path.allDoneAction}
      </PressLink>
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

/** Where the focus line sits, as a share of the screen height, and how far headings fade at the drum's rim. */
const LENS = { focus: 0.46, fade: 0.5 } as const

/** Points per bracket side: enough for the bracket to bend smoothly with the drum. */
const BRACKET_SAMPLES = 10

type LensItem = { el: HTMLElement; x: number; y: number; fade: boolean; last: string }
type LensMatrix = {
  x: number
  y: number
  width: number
  height: number
  centers: { x: number; y: number }[]
  links: SVGLineElement[]
  brackets: SVGPathElement[]
}

/**
 * The focus lens: the whole path sits on one drum (src/shell/lens.ts). Whatever is at the focus line is
 * flat and full size; toward the top and bottom edges the surface turns away, so headings, tiles, the
 * gaps between them, the path and the matrix brackets all recede together, narrowing toward the
 * screen's centre line and flattening vertically, like a wheel turning past you. Tiles never fade (the
 * path runs behind them); headings fade a little with depth. Tied 1:1 to the scroll (no spring of its
 * own), set through the engine so it never fights a running motion on the tiles inside.
 */
function useFocusLens(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const host = root.current
    const scroller = host?.closest<HTMLElement>('.dz-screen')
    if (!host || !scroller) return
    let items: LensItem[] = []
    let matrices: LensMatrix[] = []
    let rimDepth = 1
    const measure = () => {
      items = [...host.querySelectorAll<HTMLElement>('[data-focus]')].map((el) => {
        const at = offsetWithin(el, scroller)
        return {
          el,
          x: at.left + el.offsetWidth / 2,
          y: at.top + el.offsetHeight / 2,
          fade: el.dataset.focus === 'fade',
          last: '',
        }
      })
      matrices = [...host.querySelectorAll<HTMLElement>('.pa-matrix')].map((el) => {
        const at = offsetWithin(el, scroller)
        return {
          x: at.left,
          y: at.top,
          width: el.offsetWidth,
          height: el.offsetHeight,
          centers: [...el.querySelectorAll<HTMLElement>('.pa-tile')].map((tile) => {
            const t = offsetWithin(tile, el)
            return { x: t.left + tile.offsetWidth / 2, y: t.top + tile.offsetHeight / 2 }
          }),
          links: [...el.querySelectorAll<SVGLineElement>('.pa-link')],
          brackets: [...el.querySelectorAll<SVGPathElement>('[data-side]')],
        }
      })
      const half = scroller.clientHeight / 2
      rimDepth = drum((1 - LENS.focus) * 2 * half, half).depth
      for (const item of items) item.last = ''
      apply()
    }
    // Scroll events already arrive once per frame, so the lens is applied straight from them.
    const apply = () => {
      const height = scroller.clientHeight
      if (!height) return
      const flat = engine.reducedMotion
      const half = height / 2
      const axis = scroller.clientWidth / 2
      const focus = scroller.scrollTop + height * LENS.focus
      // One mapping for every point on the screen: layout position in, drawn position and scale out.
      const project = (x: number, y: number) => {
        if (flat) return { x, y, depth: 1, squash: 1 }
        const p = drum(y - focus, half)
        return { x: axis + (x - axis) * p.depth, y: focus + p.offset, depth: p.depth, squash: p.squash }
      }
      for (const item of items) {
        const p = project(item.x, item.y)
        const dim = rimDepth < 1 ? Math.min(1, (1 - p.depth) / (1 - rimDepth)) : 0
        const key = `${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.depth.toFixed(4)} ${p.squash.toFixed(4)}`
        if (key === item.last) continue
        item.last = key
        engine.set(item.el, {
          x: p.x - item.x,
          y: p.y - item.y,
          scaleX: p.depth,
          scaleY: p.squash,
          opacity: item.fade && !flat ? 1 - LENS.fade * dim : 1,
        })
      }
      for (const m of matrices) {
        // Off-screen matrices keep their last drawing.
        if (m.y > focus + height || m.y + m.height < focus - height) continue
        const local = (x: number, y: number) => {
          const p = project(m.x + x, m.y + y)
          return { x: p.x - m.x, y: p.y - m.y, depth: p.depth }
        }
        const centers = m.centers.map((c) => local(c.x, c.y))
        m.links.forEach((link, index) => {
          const from = centers[index]
          const to = centers[index + 1]
          if (!from || !to) return
          link.setAttribute('x1', from.x.toFixed(1))
          link.setAttribute('y1', from.y.toFixed(1))
          link.setAttribute('x2', to.x.toFixed(1))
          link.setAttribute('y2', to.y.toFixed(1))
          link.style.strokeWidth = ((6 * (from.depth + to.depth)) / 2).toFixed(2)
        })
        for (const bracket of m.brackets)
          bracket.setAttribute('d', bracketPath(m, bracket.dataset.side, local))
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    observer.observe(scroller)
    scroller.addEventListener('scroll', apply, { passive: true })
    // The path redraws itself (new geometry, new progress) in layout coordinates; put it back on the drum.
    host.addEventListener('pa-relens', measure)
    return () => {
      observer.disconnect()
      scroller.removeEventListener('scroll', apply)
      host.removeEventListener('pa-relens', measure)
    }
  }, [root])
}

/** A matrix bracket as it lies on the drum: its vertical stroke bends with the surface. */
function bracketPath(
  m: { width: number; height: number },
  side: string | undefined,
  local: (x: number, y: number) => { x: number; y: number },
): string {
  const { arm, inset } = BRACKET
  const edge = side === 'right' ? m.width - inset : inset
  const tip = side === 'right' ? edge - arm : edge + arm
  const points = [local(tip, inset)]
  for (let i = 0; i <= BRACKET_SAMPLES; i++) {
    points.push(local(edge, inset + ((m.height - 2 * inset) * i) / BRACKET_SAMPLES))
  }
  points.push(local(tip, m.height - inset))
  return points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
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

  const onPath = (pathname.replace(/\/$/, '') || '/') === '/'
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
