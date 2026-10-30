import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { Lesson, Step } from '../content/lessons/types'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { SPRINGS } from '../engine/tokens'
import { Blocks, RichText } from '../exam/Blocks'
import { returnTab } from '../shell/stage'
import { Keypad } from './Keypad'
import { checkKeypad, emptyRecord, firstTryScore, isQuestion, recordTry, resumeIndex } from './progress'
import { Stage } from './Stage'
import { recordOf, saveRecord } from './store'
import { compile, emptyStage } from './timeline'

/**
 * One beat frame per `teach` spring plus a short hold to read it; the channel's tempo
 * (engine.setTempo) scales it. İleri finishes a running beat before it moves on.
 */
const LESSON_CHANNEL = 'lesson'
const FRAME_MS = Math.round(SPRINGS.teach.duration * 1000 * 1.25)

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

type Attempt = {
  /** Keys or values tried and found wrong, in order. */
  wrong: string[]
  solved: boolean
  /** The learner asked for the answer, or solved it. */
  revealed: boolean
}

const freshAttempt: Attempt = { wrong: [], solved: false, revealed: false }

function beatOf(step: Step, attempt: Attempt) {
  if (step.kind === 'explain') return step.beat
  if (isQuestion(step) && attempt.revealed) return step.reveal
  return undefined
}

export function LessonPlayer({ lesson, startStep }: { lesson: Lesson; startStep: string | undefined }) {
  const navigate = useNavigate()
  const [index, setIndex] = useState(() => {
    const asked = lesson.steps.findIndex((candidate) => candidate.id === startStep)
    return asked >= 0 ? asked : resumeIndex(lesson, recordOf(lesson.id))
  })
  const [attempt, setAttempt] = useState<Attempt>(freshAttempt)
  const [typed, setTyped] = useState('')
  const step = lesson.steps[index] as Step
  const frames = compile(lesson, beatOf(step, attempt))
  // Playback position, tied to the beat it belongs to so a new beat never renders a stale count.
  const beatKey = `${step.id}:${attempt.revealed}`
  const startAt = reducedMotion() ? frames.length : Math.min(frames.length, 1)
  const [play, setPlay] = useState({ key: beatKey, shown: startAt })
  const shown = play.key === beatKey ? play.shown : startAt
  const setShown = (value: number) => setPlay({ key: beatKey, shown: value })
  const playing = shown < frames.length

  // Resume point: the step on screen.
  useEffect(() => {
    const record = recordOf(lesson.id)
    if (record.at !== step.id) saveRecord(lesson.id, { ...record, at: step.id })
  }, [lesson.id, step.id])

  const scroller = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: each step opens at its top
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
  }, [index])

  // Beat playback on the engine's lesson channel: one cue per frame at the lesson tempo, so a tap
  // can finish the whole beat at once (finishChannel) and review tools can step it frame by frame.
  // biome-ignore lint/correctness/useExhaustiveDependencies: schedules once per beat
  useEffect(() => {
    if (shown >= frames.length) return
    engine.withChannel(LESSON_CHANNEL, () => {
      for (let next = shown + 1; next <= frames.length; next++) {
        engine.after((next - shown) * FRAME_MS, () => setPlay({ key: beatKey, shown: next }))
      }
    })
    return () => engine.cancelCues(LESSON_CHANNEL)
  }, [beatKey])

  const state = shown > 0 ? (frames[shown - 1] ?? emptyStage) : emptyStage

  const go = (next: number) => {
    setAttempt(freshAttempt)
    setTyped('')
    setIndex(next)
  }

  const answer = (given: string, correct: boolean) => {
    const record = recordOf(lesson.id)
    saveRecord(lesson.id, recordTry(record, step.id, given, correct, attempt.wrong.length === 0, Date.now()))
    if (correct) setAttempt((a) => ({ ...a, solved: true, revealed: true }))
    else setAttempt((a) => ({ ...a, wrong: [...a.wrong, given] }))
  }

  const finish = () => {
    saveRecord(lesson.id, { ...recordOf(lesson.id), at: null, doneAt: Date.now() })
    void navigate({ to: returnTab.current })
  }

  const isLast = index === lesson.steps.length - 1
  const locked = isQuestion(step) && !attempt.revealed
  const primary = () => {
    if (playing && frames.length) {
      engine.finishChannel(LESSON_CHANNEL)
      setShown(frames.length)
    } else if (isLast) finish()
    else go(index + 1)
  }
  const primaryLabel =
    playing && frames.length
      ? strings.lesson.finishBeat
      : isLast
        ? strings.lesson.finish
        : strings.lesson.next

  const lastWrong = attempt.wrong.at(-1)
  const wrongFeedback =
    step.kind === 'choice' && lastWrong
      ? step.options.find((option) => option.key === lastWrong)?.feedback
      : step.kind === 'keypad' && lastWrong
        ? step.feedbackWrong
        : undefined

  return (
    <div className="ls-run" data-testid="lesson-player">
      <div className="ls-top">
        <Link to={returnTab.current} className="ls-top__btn" aria-label={strings.lesson.close}>
          ✕
        </Link>
        <div
          className="ls-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={lesson.steps.length}
          aria-valuenow={index + 1}
          aria-label={strings.lesson.count(index + 1, lesson.steps.length)}
        >
          <span
            className="ls-progress__fill"
            style={{ width: `${((index + 1) / lesson.steps.length) * 100}%` }}
          />
        </div>
        <button
          type="button"
          className="ls-top__btn sh-press"
          aria-label={strings.lesson.back}
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          ‹
        </button>
      </div>

      <div ref={scroller} className="ls-scroll">
        <p className="ls-eyebrow">{step.eyebrow}</p>
        <h1 className="ls-title">
          <RichText text={step.title} />
        </h1>
        {step.scene || state.area || state.notes.length ? (
          <Stage lesson={lesson} scene={step.scene} state={state} />
        ) : null}
        {step.body ? (
          <p className="ls-body">
            <RichText text={step.body} />
          </p>
        ) : null}

        {step.kind === 'choice' ? (
          <fieldset className="ex-opts" aria-label={step.title}>
            {step.options.map((option) => {
              const wrong = attempt.wrong.includes(option.key)
              const right = attempt.revealed && option.key === step.answer
              return (
                <button
                  key={option.key}
                  type="button"
                  className="ex-opt sh-press"
                  data-state={right ? 'right' : wrong ? 'wrong' : undefined}
                  disabled={attempt.revealed || wrong}
                  onClick={() => answer(option.key, option.key === step.answer)}
                >
                  <span className="ex-opt__key">{option.key}</span>
                  <span className="ex-opt__body">
                    <Blocks blocks={option.content} />
                  </span>
                </button>
              )
            })}
          </fieldset>
        ) : null}

        {step.kind === 'summary' ? (
          <>
            <ul className="ls-points">
              {step.points.map((point) => (
                <li key={point}>
                  <RichText text={point} />
                </li>
              ))}
            </ul>
            <Score lesson={lesson} />
          </>
        ) : null}

        {isQuestion(step) && (wrongFeedback || attempt.revealed) ? (
          <div
            className="ls-feedback"
            role="status"
            data-tone={attempt.solved ? 'ok' : attempt.revealed ? undefined : 'wrong'}
          >
            {attempt.revealed ? (
              <>
                {attempt.solved ? <b>{strings.lesson.correct} </b> : null}
                <RichText text={step.solution} />
              </>
            ) : (
              <>
                <b>{strings.lesson.wrong} </b>
                {wrongFeedback ? <RichText text={wrongFeedback} /> : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="ls-dock">
        {step.kind === 'keypad' && !attempt.revealed ? (
          <Keypad
            value={typed}
            onChange={setTyped}
            onSubmit={() => {
              answer(typed, checkKeypad(step.answer, typed))
              setTyped('')
            }}
          />
        ) : null}
        {locked && attempt.wrong.length ? (
          <button
            type="button"
            className="sh-btn sh-btn--soft sh-press"
            onClick={() => setAttempt((a) => ({ ...a, revealed: true }))}
          >
            {strings.lesson.showAnswer}
          </button>
        ) : null}
        {locked ? null : (
          <button type="button" className="sh-btn sh-btn--primary sh-press" onClick={primary}>
            {primaryLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function Score({ lesson }: { lesson: Lesson }) {
  const { correct, total } = firstTryScore(lesson, recordOf(lesson.id) ?? emptyRecord)
  if (!total) return null
  return <p className="ls-score">{strings.lesson.score(correct, total)}</p>
}
