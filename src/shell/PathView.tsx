import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { dayLabel, daysUntil, examWeek } from '../content/exam'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { type Chapter, chapters, pathCode, tileTitle } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { CHAPTER_TEST_SIZE, chapterTestState, createChapterSession, isChapterSet } from '../exam/chapter-test'
import { remainingMs } from '../exam/session'
import { saveSession, useExam } from '../exam/store'
import { type LessonRecord, resumeIndex } from '../lesson/progress'
import { type LessonState, stateOf, upNext } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { readinessOf } from '../progress/readiness'
import { useSettings } from '../progress/settings'
import { Expander } from '../ui/Expander'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { Sheet } from '../ui/Sheet'
import { burst, glow, ring } from '../ui/shine'
import { LessonPeek, type Peek } from './LessonPeek'
import { fadeOutWas, holdInk, holdTag, inkOf, raiseTag } from './morph'
import { PressLink } from './PressLink'
import { morphFrom, overlayHostRef, stageRef } from './stage'
import './path.css'

type Records = Readonly<Record<string, LessonRecord>>

/**
 * Harita: the whole route on one screen. A summary line, then one compact row per chapter (its number, its
 * name and one readiness square per lesson); exactly one chapter is open, as a vertical list of its
 * lessons and its test. The lesson you are on is the one emphasised row and carries the screen's amber
 * pill. Any other row opens its card, so every lesson stays open (no locks).
 */
export function PathView() {
  const records = useLessonRecords()
  const { examDate } = useSettings()
  const { main } = upNext(lessons, records, 0)
  const doneCount = lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
  const [peek, setPeek] = useState<Peek | null>(null)
  const [note, setNote] = useState<TestNote | null>(null)
  const examLine = examDate
    ? strings.path.examDateLine(dayLabel(examDate))
    : strings.path.examWeekLine(examWeek.label)

  // The chapter holding the next lesson is open; when the next lesson moves to another chapter, so does the open one.
  const resumeId =
    (main ? chapters.find((c) => c.lessons.some((l) => l.id === main.id)) : undefined)?.id ??
    chapters[0]?.id ??
    null
  const [openId, setOpenId] = useState<string | null>(resumeId)
  const [seenResume, setSeenResume] = useState(resumeId)
  if (resumeId !== seenResume) {
    setSeenResume(resumeId)
    setOpenId(resumeId)
  }

  const root = useRef<HTMLDivElement>(null)
  useCelebrations(root, records)
  useOpening(root, main?.id ?? null)

  return (
    <Screen title={strings.path.title}>
      <div ref={root} className="pa-root">
        <div className="pa-summary">
          <p className="pa-summary__line">
            <span className="pa-summary__count">
              <b className="num">{doneCount}</b>
              <span>{strings.path.overallRest(lessons.length)}</span>
            </span>
            <span className="pa-summary__exam">{examLine}</span>
          </p>
          <Meter records={records} done={doneCount} />
        </div>
        {chapters.map((chapter, index) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            number={index + 1}
            records={records}
            mainId={main?.id ?? null}
            open={chapter.id === openId}
            onToggle={() => setOpenId(chapter.id === openId ? null : chapter.id)}
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

/**
 * One equal-width segment per chapter, so no chapter shrinks to a sliver: a finished chapter is full, the
 * chapter in progress is filled to its share, the others are a hairline track.
 */
function Meter({ records, done }: { records: Records; done: number }) {
  return (
    <div className="pa-meter" role="img" aria-label={strings.path.meterLabel(done, lessons.length)}>
      {chapters.map((chapter) => {
        const finished = chapter.lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
        const total = chapter.lessons.length
        return (
          <span key={chapter.id} className="pa-meter__track" data-complete={finished === total || undefined}>
            {finished > 0 ? (
              <i className="pa-meter__done" style={{ width: `${(finished / total) * 100}%` }} />
            ) : null}
          </span>
        )
      })}
    </div>
  )
}

/**
 * A chapter: one row (number, name, a square per lesson) that opens and closes the chapter, and under it,
 * when open, its lessons and its test. The squares are links of their own (a tap opens that lesson); the rest
 * of the row, 44 px or taller, is the toggle.
 */
function ChapterRow({
  chapter,
  number,
  records,
  mainId,
  open,
  onToggle,
  onPick,
  onNote,
}: {
  chapter: Chapter
  number: number
  records: Records
  mainId: string | null
  open: boolean
  onToggle: () => void
  onPick: (lesson: Lesson, tile: HTMLElement) => void
  onNote: (note: TestNote) => void
}) {
  const states = chapter.lessons.map((lesson) => stateOf(records[lesson.id]))
  const done = states.filter((state) => state === 'done').length
  const total = chapter.lessons.length
  const body = `chapter-body-${chapter.id}`
  return (
    <section
      className="pa-chapter"
      data-open={open || undefined}
      data-complete={done === total || undefined}
      data-testid={`chapter-${chapter.id}`}
    >
      <div className="pa-chapter__head">
        <h2 className="pa-chapter__heading">
          <Pressable
            className="pa-chapter__toggle"
            aria-expanded={open}
            aria-controls={body}
            data-testid={`chapter-toggle-${chapter.id}`}
            onClick={onToggle}
          >
            <span className="pa-chapter__no num" aria-hidden="true">
              {number}
            </span>
            <span className="pa-chapter__title">{chapter.label}</span>
          </Pressable>
        </h2>
        <ul className="pa-cells" aria-label={strings.path.chapterRow(chapter.label, done, total)}>
          {chapter.lessons.map((lesson) => (
            <li key={lesson.id}>
              <Cell lesson={lesson} record={records[lesson.id]} next={lesson.id === mainId} />
            </li>
          ))}
        </ul>
      </div>
      <Expander open={open} id={body}>
        <ol className="pa-lessons">
          {chapter.lessons.map((lesson, index) => (
            <li key={lesson.id}>
              <Tile
                lesson={lesson}
                record={records[lesson.id]}
                state={states[index] ?? 'new'}
                main={lesson.id === mainId}
                onPick={onPick}
              />
            </li>
          ))}
          <li>
            <ChapterTestCell chapter={chapter} onNote={onNote} />
          </li>
        </ol>
      </Expander>
    </section>
  )
}

/**
 * A lesson's readiness square: coloured by first-try accuracy, not a number. A tap opens the lesson the way
 * the rows do: the lesson grows out of the square.
 */
function Cell({ lesson, record, next }: { lesson: Lesson; record: LessonRecord | undefined; next: boolean }) {
  const level = readinessOf(lesson, record)
  return (
    <PressLink
      to="/lesson/$id"
      params={{ id: lesson.id }}
      className="pa-cell"
      data-level={level}
      data-next={next || undefined}
      data-testid="map-cell"
      data-lesson={lesson.id}
      data-morph-key={lesson.id}
      aria-label={strings.path.readinessCell(pathCode(lesson), tileTitle(lesson), strings.path.level[level])}
      onClick={(event) => {
        morphFrom.current = event.currentTarget
      }}
    />
  )
}

type TestNote =
  | { kind: 'preparing'; chapter: Chapter; available: number }
  | { kind: 'replaces'; chapter: Chapter }

/**
 * The chapter's test, the last row of its open list. Six questions from the bank, untimed, never locked. A chapter
 * whose bank has fewer than six is dimmed and says why on tap.
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
      <span className="pa-test__title">{strings.path.chapterTest.title}</span>
      <span className="pa-test__value num">
        {!ready
          ? strings.path.chapterTest.preparing
          : last
            ? strings.path.chapterTest.score(last.correct, last.total)
            : strings.path.chapterTest.size(CHAPTER_TEST_SIZE)}
      </span>
    </Pressable>
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
      <span className="pa-wide__text">
        <span className="pa-wide__title">{strings.path.gate.title}</span>
        <span className="pa-wide__sub">{strings.path.gate.body}</span>
      </span>
    </PressLink>
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
  useStateChange(lesson.id, `${state}${main ? '+next' : ''}`)
  const resuming = main && state === 'current' && record
  const face = (
    <>
      <span className="pa-tile__code num">{pathCode(lesson)}</span>
      <span className="pa-tile__title">{tileTitle(lesson)}</span>
      {state === 'done' ? <Check /> : null}
      {main ? (
        <span className="pa-tile__go">{resuming ? strings.path.resume : strings.path.start}</span>
      ) : null}
    </>
  )
  // The lesson you are on opens in one tap and grows out of its row; the others show their card.
  return main ? (
    <PressLink
      to="/lesson/$id"
      params={{ id: lesson.id }}
      className="pa-tile"
      data-state={state}
      data-next=""
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
  )
}

/**
 * A tile whose state changes while it is on screen (becomes current, done, or loses the ring) does not swap:
 * the old fill crossfades out, and a new check or pill fades in. While
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
      ':scope > .pa-tile__check, :scope > .pa-tile__go',
    )) {
      holdTag(part)
      if (!hidden) raiseTag(part)
    }
    if (hidden) return
    fadeOutWas(tile)
  }, [id, key])
}

/** The one quiet mark of a finished lesson. */
function Check() {
  return (
    <svg className="pa-tile__check" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.5 10.5 8.4 14.4 15.5 6" />
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
 * Opening the app: the screen starts at the top (title, where you stand), the open chapter's rows rise in from
 * the lesson you are on outward, and if that lesson is below the fold the view glides down to it, like a
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
      engine.set(tile, { opacity: 0, y: 10 })
      engine.after(40 + order * 28, () => engine.to(tile, { opacity: 1, y: 0 }, 'enter'))
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
 * A lesson finished while the path was hidden behind it: once you are back on the path, its row lands
 * with a small settle and its tick draws itself in.
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
      const check = root.current?.querySelector<SVGSVGElement>(
        `.pa-tile[data-lesson="${id}"] .pa-tile__check`,
      )
      if (check) engine.set(check, { scale: 0.3, opacity: 0 })
    }
    // Wait for the lesson to finish closing.
    engine.withChannel('chrome', () =>
      engine.after(420, () => {
        for (const id of ids) {
          const tile = root.current?.querySelector<HTMLElement>(`.pa-tile[data-lesson="${id}"]`)
          if (!tile) continue
          const chapter = chapters.find((c) => c.lessons.some((lesson) => lesson.id === id))
          const complete = Boolean(chapter?.lessons.every((lesson) => now.has(lesson.id)))
          lightTick(tile, complete)
          engine.set(tile, { scale: 0.86 })
          engine.to(tile, { scale: 1 }, 'settle')
        }
      }),
    )
  }, [onPath, root])
}

/** Check pop delay after the row starts settling, and the tick's draw delay after the mark lands (ms). */
const TICK_MS = { pop: 140, draw: 60 } as const

/**
 * The lesson's tick lands on its row: the tick draws itself in, and as it closes a ring of light
 * leaves it and the row glows green once. The tick that finishes a chapter also throws a few sparks from the row (src/ui/shine.ts).
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
      const matrix = tile.closest<HTMLElement>('.pa-chapter')
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
