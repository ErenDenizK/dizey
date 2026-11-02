import { useNavigate } from '@tanstack/react-router'
import { useLayoutEffect, useRef, useState } from 'react'
import { Birim } from '../character/Birim'
import type { Lesson } from '../content/lessons/types'
import { type Chapter, pathCode, tileTitle } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { CHAPTER_TEST_SIZE, chapterTestState, createChapterSession, isChapterSet } from '../exam/chapter-test'
import { remainingMs } from '../exam/session'
import { saveSession, useExam } from '../exam/store'
import type { LessonRecord } from '../lesson/progress'
import { type LessonState, stateOf } from '../lesson/state'
import { readinessOf } from '../progress/readiness'
import { Pressable } from '../ui/Pressable'
import { Sheet } from '../ui/Sheet'
import { PressLink } from './PressLink'
import { useStateChange } from './path-effects'
import { morphFrom, stageRef } from './stage'

export type TestNote =
  | { kind: 'preparing'; chapter: Chapter; available: number }
  | { kind: 'replaces'; chapter: Chapter }

/** The explanation behind a dimmed chapter test, or the warning before a test replaces a rehearsal. */
export function TestNoteSheet({ note, onClose }: { note: TestNote | null; onClose: () => void }) {
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

/** The end of the path: the full rehearsal, a pushed screen that grows out of this cell. */
export function Gate() {
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

/**
 * One lesson on the path: a rounded square. Done is green with a tick (a ring in the bad ink when the first
 * tries were weak), the lesson you are on is larger and amber and opens in one tap, any other opens its card
 * (no locks).
 */
export function LessonNode({
  lesson,
  record,
  main,
  onPick,
}: {
  lesson: Lesson
  record: LessonRecord | undefined
  main: boolean
  onPick: (lesson: Lesson, tile: HTMLElement) => void
}) {
  const state: LessonState = stateOf(record)
  // The weak-tries mark is drawn on finished lessons only; a lesson still open shows it through its card.
  const level = readinessOf(lesson, record)
  useStateChange(
    lesson.id,
    `${state}${main ? '+next' : ''}${state === 'done' && level === 'bad' ? '+weak' : ''}`,
    main,
  )
  const resuming = main && state === 'current' && record
  const face = (
    <>{state === 'done' ? <Tick /> : <span className="pa-tile__code num">{pathCode(lesson)}</span>}</>
  )
  return main ? (
    <PressLink
      to="/lesson/$id"
      params={{ id: lesson.id }}
      className="pa-tile"
      data-state={state}
      data-level={level}
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
      data-level={level}
      data-lesson={lesson.id}
      data-morph-key={lesson.id}
      data-testid="path-node"
      aria-label={`${pathCode(lesson)} ${tileTitle(lesson)}, ${strings.path.state[state]}${
        level === 'bad' ? `, ${strings.path.level.bad}` : ''
      }`}
      onClick={(event) => onPick(lesson, event.currentTarget)}
    >
      {face}
    </Pressable>
  )
}

/** The one quiet mark of a finished lesson. */
function Tick() {
  return (
    <svg className="pa-tile__check" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.5 10.5 8.4 14.4 15.5 6" />
    </svg>
  )
}

/**
 * The chapter's test, the bracketed node that ends its chapter. Six questions from the bank, untimed, never
 * locked. A chapter whose bank has fewer than six is dimmed and says why on tap.
 */
export function ChapterTestNode({ chapter, onNote }: { chapter: Chapter; onNote: (note: TestNote) => void }) {
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
      <i className="pa-test__bracket" data-side="start" aria-hidden="true" />
      <i className="pa-test__bracket" data-side="end" aria-hidden="true" />
      {last && ready ? (
        <span className="pa-test__score num">{strings.path.chapterTest.score(last.correct, last.total)}</span>
      ) : null}
    </Pressable>
  )
}

/**
 * Birim on the lesson you are on, inline in that node's slot (the same scrolling layer as its tile). When the lesson
 * you are on changes, the old one fades out and the new one fades in; nothing appears or vanishes in one frame.
 */
export function TileBirim({ on }: { on: boolean }) {
  const box = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(on)
  const first = useRef(true)
  useLayoutEffect(() => {
    if (on) setShown(true)
  }, [on])
  // biome-ignore lint/correctness/useExhaustiveDependencies: `shown` re-runs this once the span has mounted
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    if (first.current) {
      first.current = false
      engine.set(el, { opacity: 0 })
    }
    engine.withChannel('chrome', () =>
      engine.to(el, { opacity: on ? 1 : 0 }, 'fade', { onArrive: () => !on && setShown(false) }),
    )
  }, [on, shown])
  return shown ? (
    <span ref={box} className="pa-tile__birim" aria-hidden="true">
      <Birim size="path" mood="happy" />
    </span>
  ) : null
}
