import { Navigate, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { saveSettings, useSettings } from '../progress/settings'
import { Blocks } from './Blocks'
import { clock } from './format'
import { choose, goTo, remainingMs, toggleFlag } from './session'
import { endSession, saveSession, useExam } from './store'

const byId = new Map(questions.map((question) => [question.id, question]))

export function ExamRun() {
  const { session } = useExam()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => Date.now())
  const [confirming, setConfirming] = useState(false)
  const settings = useSettings()
  const hidden = settings.hideExamClock === true

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const scroller = useRef<HTMLDivElement>(null)
  const current = session?.current
  // Each question opens at its top.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on question change by design
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
  }, [current])

  const left = session ? remainingMs(session, now) : 0
  useEffect(() => {
    if (session && session.finishedAt === null && left <= 0) {
      endSession(Date.now())
      void navigate({ to: '/exam/result' })
    }
  }, [session, left, navigate])

  if (!session) return <Navigate to="/exam" />
  if (session.finishedAt !== null) return <Navigate to="/exam/result" />

  const id = session.questionIds[session.current] as string
  const question = byId.get(id)
  if (!question) return <Navigate to="/exam" />
  const total = session.questionIds.length
  const isLast = session.current === total - 1
  const blank = session.questionIds.filter((qid) => !session.answers[qid]).length
  const end = () => {
    endSession(Date.now())
    void navigate({ to: '/exam/result' })
  }

  return (
    <div className="ex-run">
      <div className="ex-top">
        <button type="button" className="ex-top__btn" onClick={() => setConfirming(true)}>
          {strings.exam.finishTop}
        </button>
        <span>{strings.exam.counter(session.current + 1, total)}</span>
        <button
          type="button"
          className="ex-clock"
          aria-live="off"
          aria-pressed={hidden}
          aria-label={hidden ? strings.exam.showClock : strings.exam.hideClock}
          data-low={!hidden && left < 5 * 60_000}
          onClick={() =>
            saveSettings(
              hidden ? { ...settings, hideExamClock: false } : { ...settings, hideExamClock: true },
            )
          }
        >
          {hidden ? strings.exam.clockHidden : clock(left)}
        </button>
      </div>
      <div ref={scroller} className="ex-scroll">
        <div className="sh-card ex-stem">
          <Blocks blocks={question.stem} />
        </div>
        <fieldset className="ex-opts" aria-label={strings.exam.counter(session.current + 1, total)}>
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
      <div className="ex-bottom">
        <nav className="ex-nav" aria-label={strings.exam.questions}>
          {session.questionIds.map((qid, index) => (
            <button
              key={qid}
              type="button"
              className="ex-nav__item"
              aria-current={index === session.current ? 'step' : undefined}
              data-done={Boolean(session.answers[qid])}
              data-flag={session.flagged.includes(qid)}
              onClick={() => saveSession(goTo(session, index))}
            >
              {index + 1}
            </button>
          ))}
        </nav>
        <div className="ex-bar">
          <button
            type="button"
            className="sh-btn sh-btn--soft sh-press"
            aria-pressed={session.flagged.includes(id)}
            onClick={() => saveSession(toggleFlag(session, id))}
          >
            {session.flagged.includes(id) ? strings.exam.flagged : strings.exam.flag}
          </button>
          <button
            type="button"
            className="sh-btn sh-btn--primary sh-press"
            onClick={() => (isLast ? setConfirming(true) : saveSession(goTo(session, session.current + 1)))}
          >
            {isLast ? strings.exam.last : strings.exam.next}
          </button>
        </div>
      </div>
      {confirming ? (
        <div className="ex-confirm" role="alertdialog" aria-modal="true" aria-labelledby="ex-confirm-title">
          <div className="sh-card ex-confirm__card">
            <h2 id="ex-confirm-title">{strings.exam.confirmTitle}</h2>
            <p>{strings.exam.confirmBody(blank)}</p>
            <div className="sh-note__actions">
              <button type="button" className="sh-btn sh-btn--soft" onClick={() => setConfirming(false)}>
                {strings.exam.confirmKeep}
              </button>
              <button type="button" className="sh-btn sh-btn--primary" onClick={end}>
                {strings.exam.confirmEnd}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
