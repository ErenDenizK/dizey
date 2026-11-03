import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { chapters } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { PressLink } from '../shell/PressLink'
import { Expander } from '../ui/Expander'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
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
import { type HistoryEntry, saveSession, useExam } from './store'
import './exam.css'

const RECENT = 3

/**
 * Sınav hub. Every rehearsal set is drawn as an exam paper: its title, the best score, an answer grid
 * with one box per question, and the last attempts. A tap expands the paper in place (rules, a warning
 * when it would replace the unfinished attempt, the start button), so a stray tap never starts the clock
 * or throws an attempt away. An unfinished attempt leads with the only primary action on the screen.
 */
export function ExamHome() {
  const { session, history } = useExam()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => Date.now())
  // A chapter test belongs to the map: the hub neither resumes nor reviews it.
  const rehearsal = session !== null && !isChapterSet(session.set)
  const running = rehearsal && session.finishedAt === null && remainingMs(session, now) > 0
  // The resume paper's clock keeps moving while it is on screen.
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const [picked, setPicked] = useState<ExamSet['id'] | null>(null)
  const best = bestBySet(history)
  const sets = examSets(questions)
  const reviewable = rehearsal && session.finishedAt !== null

  const start = (set: ExamSet) => {
    const at = Date.now()
    saveSession(createSession(questions, set.id, at, at))
    void navigate({ to: '/exam/run' })
  }

  return (
    <Screen
      title={strings.exam.title}
      back={() => void navigate({ to: '/' })}
      backLabel={strings.exam.back}
      parent={strings.tabs.path}
      pushed
      measure="read"
    >
      <div className="exh">
        {running ? <ResumePaper session={session} now={now} /> : null}
        {/* The running set is the in-progress paper above; it is not drawn twice. */}
        {sets
          .filter((set) => !(running && session.set === set.id))
          .map((set) => (
            <SetPaper
              key={set.id}
              set={set}
              best={best[set.id]}
              recent={recentOf(history, set.id)}
              open={picked === set.id}
              replaces={running}
              reviewable={reviewable && session.set === set.id}
              onToggle={() => setPicked(picked === set.id ? null : set.id)}
              onStart={() => start(set)}
            />
          ))}
      </div>
    </Screen>
  )
}

/** The last attempts of one set, oldest to newest. */
function recentOf(history: readonly HistoryEntry[], id: ExamSet['id']): number[] {
  return history
    .filter((entry) => entry.set === id)
    .slice(0, RECENT)
    .map((entry) => entry.percent)
    .reverse()
}

function SetPaper({
  set,
  best,
  recent,
  open,
  replaces,
  reviewable,
  onToggle,
  onStart,
}: {
  set: ExamSet
  best: number | undefined
  recent: number[]
  open: boolean
  replaces: boolean
  reviewable: boolean
  onToggle: () => void
  onStart: () => void
}) {
  const body = `exam-paper-${set.id}`
  return (
    <section className="exh-paper" data-open={open || undefined}>
      <Pressable
        className="exh-paper__head"
        data-testid={`exam-set-${set.id}`}
        aria-expanded={open}
        aria-controls={body}
        onClick={onToggle}
      >
        <span className="exh-paper__top">
          <b className="dz-title3">{strings.exam.setTitle[set.id]}</b>
          {best !== undefined ? (
            <span className="exh-score num" data-band={band(best)}>
              %{best}
            </span>
          ) : null}
        </span>
        <span className="dz-subhead exh-paper__meta num">
          {strings.exam.setMeta(set.size, durationFor(set.size) / 60_000)}
        </span>
        <Grid count={set.size} />
        {recent.length ? (
          <span className="dz-subhead exh-paper__recent num">{strings.exam.lastAttempts(recent)}</span>
        ) : null}
      </Pressable>
      {reviewable ? (
        <PressLink to="/exam/result" className="dz-text-button exh-paper__result">
          {strings.exam.lastResult}
        </PressLink>
      ) : null}
      <Expander open={open} id={body}>
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
        {replaces ? <p className="dz-footnote exh-warn">{strings.exam.replaces}</p> : null}
        <Pressable
          className="dz-button"
          data-kind="primary"
          data-wide=""
          data-testid="exam-start"
          onClick={onStart}
        >
          {strings.exam.start}
        </Pressable>
      </Expander>
    </section>
  )
}

/** The answer boxes of a printed exam sheet: one per question, decorative. */
function Grid({ count, done }: { count: number; done?: readonly boolean[] }) {
  return (
    <span className="exh-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, at) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the cells are positions on a sheet
        <i key={at} data-done={done?.[at] ? 'true' : undefined} />
      ))}
    </span>
  )
}

function ResumePaper({ session, now }: { session: ExamSession; now: number }) {
  const { answered } = tally(session)
  const total = session.questionIds.length
  return (
    <section className="exh-paper" data-live="true" aria-label={strings.exam.inProgress}>
      <div className="exh-paper__head">
        <b className="dz-title3">{setTitle(session.set, chapters)}</b>
        <Grid count={total} done={session.questionIds.map((id) => Boolean(session.answers[id]))} />
        <span className="dz-subhead exh-paper__meta num">
          {strings.exam.inProgressMeta(answered, total, clock(remainingMs(session, now)))}
        </span>
      </div>
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
