import { useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { dayLabel, daysUntil, examWeek } from '../content/exam'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { type Chapter, chapterOf, chapters, examItemTotal, pathCode } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { RichText } from '../exam/Blocks'
import { useExam } from '../exam/store'
import { isQuestion, type LessonRecord, resumeIndex } from '../lesson/progress'
import { type LessonState, stateOf, upNext } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { openMistakes } from '../progress/mistakes'
import { useSettings } from '../progress/settings'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { Sheet } from '../ui/Sheet'
import { PressLink } from './PressLink'
import { morphFrom, overlayHostRef, stageRef } from './stage'
import './path.css'

/** Tiles per matrix row. The path reads left to right, then right to left (boustrophedon). */
const COLUMNS = 3

type Records = Readonly<Record<string, LessonRecord>>

/**
 * Dersler: today's next step and the whole map in one screen. The study order is drawn as a path through
 * a stack of matrices, one per chapter, whose entries are the lessons: the path snakes through each
 * matrix row by row, the walked part is solid, the part ahead is dotted, and each matrix's brackets
 * fill as its chapter is finished. The lesson you are on is the one dark tile; the button at the bottom
 * always opens it. Any tile opens its card, so every lesson stays open (no locks).
 */
export function PathView() {
  const records = useLessonRecords()
  const { outcomes } = useExam()
  const { examDate } = useSettings()
  const { main } = upNext(lessons, records, 0)
  const mistakes = openMistakes(lessons, records, questions, outcomes).length
  const doneCount = lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
  const [picked, setPicked] = useState<Lesson | null>(null)
  const [open, setOpen] = useState(false)
  const examLine = examDate
    ? strings.path.examLine(daysUntil(examDate, new Date()), dayLabel(examDate))
    : strings.path.examWeekLine(examWeek.label)

  const root = useRef<HTMLDivElement>(null)
  useCelebrations(root, records)
  useScrollToMain(root, main?.id ?? null)

  return (
    <Screen title={strings.path.title}>
      <div ref={root} className="pa-root">
        <div className="pa-summary">
          <p className="dz-subhead">{examLine}</p>
          <p className="pa-summary__count">
            <b className="num">{doneCount}</b> {strings.path.overallRest(lessons.length)}
          </p>
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
            onPick={(lesson) => {
              setPicked(lesson)
              setOpen(true)
            }}
          />
        ))}
        <Continue main={main} records={records} />
      </div>
      {overlayHostRef.current
        ? createPortal(
            <Sheet open={open} onClose={() => setOpen(false)} stage={stageRef} label={picked?.title ?? ''}>
              {picked ? <LessonCard lesson={picked} /> : null}
            </Sheet>,
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
      {chapters.map((chapter) => (
        <span key={chapter.id} className="pa-meter__group" style={{ flexGrow: chapter.lessons.length }}>
          {chapter.lessons.map((lesson) => (
            <i key={lesson.id} data-state={stateOf(records[lesson.id])} />
          ))}
        </span>
      ))}
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
  onPick: (lesson: Lesson) => void
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
    const measure = () => {
      const outer = el.getBoundingClientRect()
      if (!outer.width) return
      const tiles = [...el.querySelectorAll<HTMLElement>('.pa-tile')]
      setGeometry({
        width: outer.width,
        height: outer.height,
        centers: tiles.map((tile) => {
          const r = tile.getBoundingClientRect()
          return { x: r.left - outer.left + r.width / 2, y: r.top - outer.top + r.height / 2 }
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
          {chapter.examItems ? (
            <span className="dz-footnote">
              {strings.path.chapterWeight(chapter.examItems, examItemTotal)}
            </span>
          ) : null}
        </span>
        <span className="pa-chapter__count num" data-complete={complete || undefined}>
          {complete ? strings.path.chapterDone : strings.path.chapterCount(done, total)}
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
      </div>
    </section>
  )
}

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
  const arm = 12
  const inset = 1.5
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
  onPick: (lesson: Lesson) => void
}) {
  const resuming = main && state === 'current' && record
  const step = resuming ? resumeIndex(lesson, record) + 1 : 0
  return (
    <>
      <Pressable
        className="pa-tile"
        data-state={state}
        data-main={main || undefined}
        data-lesson={lesson.id}
        aria-label={`${pathCode(lesson)} ${lesson.title}, ${strings.path.state[state]}`}
        onClick={() => onPick(lesson)}
      >
        <span className="pa-tile__code num">{pathCode(lesson)}</span>
        <span className="pa-tile__title">{lesson.title}</span>
        {state === 'done' ? <Check /> : null}
        {resuming ? (
          <span className="pa-tile__bar" aria-hidden="true">
            <i style={{ width: `${(step / lesson.steps.length) * 100}%` }} />
          </span>
        ) : null}
      </Pressable>
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

/** The one primary action: always the lesson you are on, docked above the tab bar. */
function Continue({ main, records }: { main: Lesson | null; records: Records }) {
  if (!main)
    return (
      <div className="pa-dock">
        <p className="pa-dock__note dz-subhead">{strings.path.allDone}</p>
        <PressLink to="/exam" className="dz-button pa-continue" data-kind="primary" data-wide="">
          {strings.path.allDoneAction}
        </PressLink>
      </div>
    )
  const record = records[main.id]
  const resuming = stateOf(record) === 'current' && record
  const step = resuming ? resumeIndex(main, record) + 1 : 0
  return (
    <div className="pa-dock">
      <PressLink
        to="/lesson/$id"
        params={{ id: main.id }}
        className="dz-button pa-continue"
        data-kind="primary"
        data-wide=""
        data-testid="continue-card"
        onClick={(event) => {
          morphFrom.current = event.currentTarget
        }}
        aria-label={
          resuming
            ? strings.path.continueAction(pathCode(main), main.title)
            : strings.path.startAction(pathCode(main), main.title)
        }
      >
        <span className="pa-continue__verb">{resuming ? strings.path.resume : strings.path.start}</span>
        <span className="pa-continue__name">
          {pathCode(main)} · {main.title}
        </span>
        <span className="pa-continue__meta num">
          {resuming
            ? strings.path.stepCount(step, main.steps.length)
            : strings.path.lessonSteps(main.steps.length)}
        </span>
      </PressLink>
    </div>
  )
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const records = useLessonRecords()
  const record = records[lesson.id]
  const state = stateOf(record)
  const total = lesson.steps.length
  const asks = lesson.steps.filter(isQuestion).length
  const chapter = chapterOf(lesson)
  const first = lesson.steps[0]
  const opening = first && 'title' in first ? first.title : null
  const status =
    state === 'current' && record
      ? strings.sheet.resumeAt(resumeIndex(lesson, record) + 1, total)
      : strings.path.state[state]
  const action =
    state === 'done'
      ? strings.sheet.review(lesson.title)
      : state === 'current'
        ? strings.sheet.resume(lesson.title)
        : strings.sheet.enter(lesson.title)
  return (
    <div className="sh-sheet-body">
      <span className="dz-footnote sh-code">
        {pathCode(lesson)}
        {chapter ? ` · ${chapter.label}` : ''}
      </span>
      <h2 className="dz-title2">{lesson.title}</h2>
      {opening ? (
        <p className="pa-opens">
          <span className="dz-footnote">{strings.path.opensWith}</span>
          <span className="pa-opens__line">
            <RichText text={opening} />
          </span>
        </p>
      ) : null}
      <dl className="sh-facts pa-facts">
        <div>
          <dt className="dz-footnote">{strings.sheet.status}</dt>
          <dd>{status}</dd>
        </div>
        <div>
          <dt className="dz-footnote">{strings.sheet.length}</dt>
          <dd>{strings.path.lessonSize(total, asks)}</dd>
        </div>
        {chapter?.examItems ? (
          <div>
            <dt className="dz-footnote">{strings.path.weight}</dt>
            <dd>{strings.path.weightValue(chapter.examItems, examItemTotal)}</dd>
          </div>
        ) : null}
      </dl>
      <PressLink
        to="/lesson/$id"
        params={{ id: lesson.id }}
        className="dz-button"
        data-kind="primary"
        data-wide=""
        aria-label={action}
      >
        {action.split(':')[0]}
      </PressLink>
    </div>
  )
}

/** Opens the path where you are: the current tile sits in the upper half of the screen. */
function useScrollToMain(root: React.RefObject<HTMLDivElement | null>, mainId: string | null) {
  const placed = useRef(false)
  useLayoutEffect(() => {
    if (placed.current || !mainId) return
    const tile = root.current?.querySelector<HTMLElement>(`[data-lesson="${mainId}"]`)
    const scroller = tile?.closest<HTMLElement>('.dz-screen')
    if (!tile || !scroller || !scroller.clientHeight) return
    placed.current = true
    const top = tile.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
    const goal = top - scroller.clientHeight * 0.38
    if (goal > 0) scroller.scrollTop = goal
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
    // Wait for the lesson to finish closing.
    engine.withChannel('chrome', () =>
      engine.after(420, () => {
        for (const id of ids) {
          const tile = root.current?.querySelector<HTMLElement>(`[data-lesson="${id}"]`)
          if (!tile) continue
          engine.set(tile, { scale: 0.86 })
          engine.to(tile, { scale: 1 }, 'settle')
          const chapter = chapters.find((c) => c.lessons.some((lesson) => lesson.id === id))
          const local = chapter?.lessons.findIndex((lesson) => lesson.id === id) ?? -1
          const section = tile.closest('.pa-chapter')
          const link = section?.querySelector<SVGLineElement>(`[data-segment="${local}"]`)
          if (link) drawIn(link)
        }
      }),
    )
  }, [onPath, root])
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
