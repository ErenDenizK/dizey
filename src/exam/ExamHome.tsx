import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { chapters } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { PressLink } from '../shell/PressLink'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { Sheet } from '../ui/Sheet'
import { isChapterSet, setTitle } from './chapter-test'
import { clock } from './format'
import {
  bestBySet,
  createSession,
  durationFor,
  type ExamSession,
  type ExamSet,
  examSets,
  remainingMs,
  tally,
} from './session'
import { saveSession, useExam } from './store'
import './exam.css'

/**
 * Sınav hub. An unfinished attempt leads with the only primary action on the screen. The sets are
 * cards: a tap opens a short start sheet (the rules, and a warning when it would replace the
 * unfinished attempt), so a stray tap never starts the clock or throws an attempt away.
 */
export function ExamHome() {
  const { session, history } = useExam()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => Date.now())
  // A chapter test belongs to the map: the hub neither resumes nor reviews it.
  const rehearsal = session !== null && !isChapterSet(session.set)
  const running = rehearsal && session.finishedAt === null && remainingMs(session, now) > 0
  // The resume card's clock keeps moving while it is on screen.
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  // The hub is a pushed route above the shell, so its start sheet mounts inside that route (the shared
  // sheet host sits below it) and the route content is what recedes behind the sheet.
  const [host, setHost] = useState<HTMLElement | null>(null)
  const content = useRef<HTMLElement | null>(null)
  const mounted = useCallback((el: HTMLElement | null) => {
    content.current = el?.closest<HTMLElement>('.sh-overlay__content') ?? null
    setHost(el?.closest<HTMLElement>('.sh-overlay') ?? null)
  }, [])
  const [picked, setPicked] = useState<ExamSet | null>(null)
  const [open, setOpen] = useState(false)
  const best = bestBySet(history)
  const sets = examSets(questions)
  const reviewable = rehearsal && session.finishedAt !== null

  const start = (set: ExamSet) => {
    const at = Date.now()
    saveSession(createSession(questions, set.id, at, at))
    setOpen(false)
    void navigate({ to: '/exam/run' })
  }

  return (
    <Screen
      title={strings.exam.title}
      back={() => void navigate({ to: '/map' })}
      backLabel={strings.exam.back}
      pushed
    >
      <p className="dz-subhead sh-lead">{strings.exam.subtitle}</p>
      <div className="exh" ref={mounted}>
        {running ? <ResumeCard session={session} now={now} /> : null}

        <section className="exh-group">
          <h2 className="dz-section-label">{strings.exam.sets}</h2>
          <div className="exh-sets">
            {sets.map((set) => (
              <Pressable
                key={set.id}
                className="dz-card exh-set"
                data-testid={`exam-set-${set.id}`}
                onClick={() => {
                  setPicked(set)
                  setOpen(true)
                }}
              >
                <span className="exh-set__main">
                  <span className="dz-row-main">{strings.exam.setTitle[set.id]}</span>
                  <small className="dz-footnote sh-row-sub">{strings.exam.setBody[set.id]}</small>
                  <span className="exh-set__meta">
                    <span className="exh-chip">
                      {strings.exam.setMeta(set.size, durationFor(set.size) / 60_000)}
                    </span>
                    {best[set.id] !== undefined ? (
                      <span className="exh-chip" data-tone="ok">
                        {strings.exam.best(best[set.id] as number)}
                      </span>
                    ) : null}
                  </span>
                </span>
                <ChevronRight />
              </Pressable>
            ))}
          </div>
        </section>

        {history.length ? (
          <section className="exh-group">
            <h2 className="dz-section-label">{strings.exam.history}</h2>
            <div className="dz-list">
              {history.slice(0, 5).map((entry, at) => {
                const body = (
                  <>
                    <span className="exh-pct num" data-band={band(entry.percent)}>
                      %{entry.percent}
                    </span>
                    <span className="dz-row-main">
                      {strings.exam.historyRow(entry.correct, entry.total)}
                      <small className="dz-footnote sh-row-sub">
                        {setTitle(entry.set, chapters)} ·{' '}
                        {new Date(entry.finishedAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </small>
                    </span>
                  </>
                )
                // Only the latest attempt is kept in full, so only it opens.
                return at === 0 && reviewable ? (
                  <PressLink
                    key={entry.finishedAt}
                    to="/exam/result"
                    className="dz-row exh-history"
                    aria-label={strings.exam.lastResult}
                  >
                    {body}
                    <ChevronRight />
                  </PressLink>
                ) : (
                  <div key={entry.finishedAt} className="dz-row exh-history">
                    {body}
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}
      </div>

      {host
        ? createPortal(
            <Sheet
              open={open}
              onClose={() => setOpen(false)}
              stage={content}
              label={picked ? strings.exam.setTitle[picked.id] : ''}
            >
              {picked ? (
                <div className="sh-sheet-body exh-start">
                  <span className="dz-footnote sh-code">
                    {strings.exam.setMeta(picked.size, durationFor(picked.size) / 60_000)}
                  </span>
                  <h2 className="dz-title2">{strings.exam.setTitle[picked.id]}</h2>
                  <ol className="exh-rules">
                    {strings.exam.startRules.map((rule, at) => (
                      <li key={rule}>
                        <span className="exh-rules__n num" aria-hidden="true">
                          {at + 1}
                        </span>
                        <span className="dz-subhead">{rule}</span>
                      </li>
                    ))}
                  </ol>
                  {running ? <p className="dz-footnote exh-warn">{strings.exam.replaces}</p> : null}
                  <Pressable
                    className="dz-button"
                    data-kind="primary"
                    data-wide=""
                    data-testid="exam-start"
                    onClick={() => start(picked)}
                  >
                    {strings.exam.start}
                  </Pressable>
                </div>
              ) : null}
            </Sheet>,
            host,
          )
        : null}
    </Screen>
  )
}

function ResumeCard({ session, now }: { session: ExamSession; now: number }) {
  const { answered } = tally(session)
  const total = session.questionIds.length
  return (
    <section className="dz-card exh-resume" aria-label={strings.exam.inProgress}>
      <span className="dz-footnote exh-eyebrow">{strings.exam.inProgress}</span>
      <b className="dz-title3">{setTitle(session.set, chapters)}</b>
      <span className="exh-strip" aria-hidden="true">
        {session.questionIds.map((id) => (
          <i key={id} data-done={Boolean(session.answers[id])} />
        ))}
      </span>
      <span className="dz-subhead exh-resume__meta num">
        {strings.exam.inProgressMeta(answered, total, clock(remainingMs(session, now)))}
      </span>
      <PressLink to="/exam/run" className="dz-button" data-kind="primary" data-wide="">
        {strings.exam.resume}
      </PressLink>
    </section>
  )
}

/** Score band for colour: the history reads at a glance without a chart. */
export function band(percent: number): 'high' | 'mid' | 'low' {
  return percent >= 70 ? 'high' : percent >= 40 ? 'mid' : 'low'
}
