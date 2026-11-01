import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { saveSettings, useSettings } from '../progress/settings'
import { holdMusic } from '../sound/player'
import { ChevronLeft, ClockIcon, Close, Flag } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Sheet } from '../ui/Sheet'
import { Blocks } from './Blocks'
import { isChapterSet } from './chapter-test'
import { clock } from './format'
import { choose, goTo, remainingMs, tally, toggleFlag } from './session'
import { endSession, saveSession, useExam } from './store'
import './exam.css'

const byId = new Map(questions.map((question) => [question.id, question]))
/** A horizontal flick this long (px), clearly wider than tall, turns the page. */
const SWIPE = 56
/** Under five minutes the clock turns red. */
const LOW_MS = 5 * 60_000

/**
 * The rehearsal: an exam hall in the lesson's own frame. The top bar holds the way out (the attempt is
 * kept), the paper as one segment per question (tap: the question map) and the clock. The dock holds
 * back, flag and next in the thumb zone; on the last question next becomes Bitir, which opens the map
 * as the finish summary, so ending is always a deliberate second tap on a screen that shows the blanks.
 */
export function ExamRun() {
  const { session } = useExam()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => Date.now())
  const [mapOpen, setMapOpen] = useState(false)
  const settings = useSettings()
  const hidden = settings.hideExamClock === true

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // An exam hall has no music either.
  useEffect(() => {
    holdMusic(true)
    return () => holdMusic(false)
  }, [])

  const frame = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const page = useRef<HTMLDivElement>(null)
  const current = session?.current ?? 0
  const previous = useRef(current)
  // Each question opens at its top and slides in from the side it comes from.
  useLayoutEffect(() => {
    const from = previous.current
    previous.current = current
    scroller.current?.scrollTo(0, 0)
    const el = page.current
    if (!el || from === current) return
    engine.set(el, { x: (current > from ? 1 : -1) * 28, opacity: 0 })
    engine.to(el, { x: 0, opacity: 1 }, 'glide')
  }, [current])

  const left = session ? remainingMs(session, now) : 0
  useEffect(() => {
    if (session && session.finishedAt === null && left <= 0) {
      endSession(Date.now())
      void navigate({ to: '/exam/result' })
    }
  }, [session, left, navigate])

  // Horizontal flicks on the paper turn pages; vertical drags stay scrolls.
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null)

  if (!session) return <Navigate to="/exam" />
  if (session.finishedAt !== null) return <Navigate to="/exam/result" />

  const id = session.questionIds[session.current] as string
  const question = byId.get(id)
  if (!question) return <Navigate to="/exam" />
  const total = session.questionIds.length
  // A chapter test has no clock and leads back to the map.
  const chapterTest = isChapterSet(session.set)
  const isLast = session.current === total - 1
  const flagged = session.flagged.includes(id)
  const counts = tally(session)
  const wide = question.options.some((option) => option.content.some((block) => block.kind !== 'text'))
  const go = (index: number) => saveSession(goTo(session, index))
  const end = () => {
    setMapOpen(false)
    endSession(Date.now())
    void navigate({ to: '/exam/result' })
  }

  return (
    // The rehearsal is an exam hall: no sound (decision 0005).
    <div className="exr" data-sound="none" data-testid="exam-run">
      <div ref={frame} className="exr-frame">
        <header className="exr-top">
          <Link
            to={chapterTest ? '/map' : '/exam'}
            className="ls-top__btn"
            aria-label={chapterTest ? strings.exam.leaveChapterTest : strings.exam.leave}
          >
            <Close />
          </Link>
          <button
            type="button"
            className="exr-paper"
            aria-label={`${strings.exam.map}: ${strings.exam.mapTally(counts.answered, counts.blank, counts.flagged)}`}
            onClick={() => setMapOpen(true)}
          >
            {session.questionIds.map((qid, index) => (
              <i
                key={qid}
                data-done={Boolean(session.answers[qid])}
                data-flag={session.flagged.includes(qid)}
                data-current={index === session.current}
              />
            ))}
          </button>
          {chapterTest ? (
            <span />
          ) : (
            <button
              type="button"
              className="exr-clock num"
              aria-live="off"
              aria-pressed={hidden}
              aria-label={hidden ? strings.exam.showClock : strings.exam.hideClock}
              data-low={!hidden && left < LOW_MS}
              onClick={() => saveSettings({ ...settings, hideExamClock: !hidden })}
            >
              {hidden ? <ClockIcon /> : clock(left)}
            </button>
          )}
        </header>

        <div
          ref={scroller}
          className="exr-scroll"
          onPointerDown={(e) => {
            swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
          }}
          onPointerUp={(e) => {
            const start = swipe.current
            swipe.current = null
            if (!start || start.id !== e.pointerId) return
            const dx = e.clientX - start.x
            const dy = e.clientY - start.y
            if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 1.6) return
            if (dx < 0 && !isLast) go(session.current + 1)
            if (dx > 0 && session.current > 0) go(session.current - 1)
          }}
          onPointerCancel={() => {
            swipe.current = null
          }}
        >
          <div ref={page} className="exr-page">
            <p className="exr-count">
              <span className="num">{strings.exam.counter(session.current + 1, total)}</span>
              {flagged ? (
                <span className="exr-count__flag">
                  <Flag active />
                  {strings.exam.flagged}
                </span>
              ) : null}
            </p>
            <div className="dz-card exr-stem">
              <Blocks blocks={question.stem} />
            </div>
            <fieldset
              className="ex-opts exr-opts"
              aria-label={strings.exam.counter(session.current + 1, total)}
              data-wide={wide}
            >
              {question.options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="ex-opt sh-press"
                  aria-pressed={session.answers[id] === option.key}
                  onClick={() => saveSession(choose(session, id, option.key))}
                >
                  <span className="ex-opt__key">{option.key}</span>
                  <span className="ex-opt__body">
                    <Blocks blocks={option.content} />
                  </span>
                </button>
              ))}
            </fieldset>
          </div>
        </div>

        <div className="exr-dock">
          <Pressable
            className="exr-icon"
            aria-label={strings.exam.previous}
            disabled={session.current === 0}
            onClick={() => go(session.current - 1)}
          >
            <ChevronLeft />
          </Pressable>
          <Pressable
            className="exr-icon"
            aria-label={flagged ? strings.exam.unflag : strings.exam.flag}
            aria-pressed={flagged}
            data-on={flagged}
            onClick={() => saveSession(toggleFlag(session, id))}
          >
            <Flag active={flagged} />
          </Pressable>
          <Pressable
            className="dz-button exr-next"
            data-kind="primary"
            onClick={() => (isLast ? setMapOpen(true) : go(session.current + 1))}
          >
            {isLast ? strings.exam.last : strings.exam.next}
          </Pressable>
        </div>
      </div>

      <Sheet open={mapOpen} onClose={() => setMapOpen(false)} stage={frame} label={strings.exam.map}>
        <div className="sh-sheet-body exr-map">
          <div className="exr-map__head">
            <h2 className="dz-title2">{strings.exam.map}</h2>
            <span className="dz-footnote num">
              {strings.exam.mapTally(counts.answered, counts.blank, counts.flagged)}
            </span>
          </div>
          <div className="exr-map__grid" style={{ '--cols': total > 15 ? 6 : 5 } as React.CSSProperties}>
            {session.questionIds.map((qid, index) => (
              <button
                key={qid}
                type="button"
                className="exr-cell num sh-press"
                aria-current={index === session.current ? 'step' : undefined}
                data-done={Boolean(session.answers[qid])}
                data-flag={session.flagged.includes(qid)}
                aria-label={`${strings.exam.questionN(index + 1)}${session.answers[qid] ? '' : `, ${strings.exam.stat.blank.toLowerCase()}`}`}
                onClick={() => {
                  go(index)
                  setMapOpen(false)
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <Pressable
            className="dz-button"
            data-kind="primary"
            data-wide=""
            data-testid="exam-finish"
            onClick={end}
          >
            {strings.exam.finish}
          </Pressable>
          <p className="dz-footnote exr-map__note">
            {counts.blank ? strings.exam.finishBlank(counts.blank) : strings.exam.finishAll}
          </p>
        </div>
      </Sheet>
    </div>
  )
}
