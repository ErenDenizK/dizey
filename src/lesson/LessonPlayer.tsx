import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { lessons } from '../content/lessons'
import type { Lesson, Step } from '../content/lessons/types'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { CHOREO_MS, TEMPO_CLASSES } from '../engine/tokens'
import { Blocks, RichText } from '../exam/Blocks'
import { returnTab } from '../shell/stage'
import { haptic } from '../sound/haptics'
import { playSound, setSoundContext } from '../sound/player'
import type { SoundEvent } from '../sound/score'
import { Keypad } from './Keypad'
import { useAnswerMotion, useLessonMotion } from './motion'
import { checkKeypad, emptyRecord, firstTryScore, isQuestion, recordTry, resumeIndex } from './progress'
import { rewardFor } from './reward'
import { Stage } from './Stage'
import { stateOf } from './state'
import { recordOf, saveRecord } from './store'
import { tempoClassOf } from './tempo'
import { CARRY, compile, emptyStage, type Family, readingFloor } from './timeline'

/**
 * The lesson runner (old Runner, inventory 6b.2): the beat's actions play one at a time on the lesson
 * channel. After an action's motion has landed, the runner waits its dwell, never shorter than the reading
 * floor of what it made readable. Dwells are on-screen time; springs, staggers and leads scale with the
 * beat's tempo class. Waits run on their own channel, so finishing the lesson channel never skips one.
 */
const LESSON_CHANNEL = 'lesson'
const RUNNER_CHANNEL = 'runner'
const POLL_MS = 16

/** First-try answers in a row that turn the correct chord into a streak. */
const STREAK = 3

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
  // A right answer's reveal confirms (shorter dwells); a wrong one teaches again at full dwell.
  const family: Family = isQuestion(step) && attempt.solved && attempt.wrong.length === 0 ? 'reveal' : 'teach'
  const beat = beatOf(step, attempt)
  const frames = compile(lesson, beat, family)
  const tempo = TEMPO_CLASSES[tempoClassOf(lesson, index, beat, attempt.wrong.length > 0)].pace
  // Playback position, tied to the beat it belongs to so a new beat never renders a stale count.
  const [replays, setReplays] = useState(0)
  const [held, setHeld] = useState(false)
  const beatKey = `${step.id}:${attempt.revealed}:${replays}`
  const startAt = reducedMotion() ? frames.length : 0
  const [play, setPlay] = useState({ key: beatKey, shown: startAt })
  const shown = play.key === beatKey ? play.shown : startAt
  const setShown = (value: number) => setPlay({ key: beatKey, shown: value })
  const playing = shown < frames.length
  // Sounds follow the lesson's chord walk, so they are built from the step on screen.
  const cue = (event: SoundEvent, cell?: number) =>
    playSound(event, {
      step: index,
      steps: lesson.steps.length,
      ...(cell === undefined ? {} : { index: cell }),
    })
  // First-try answers in a row during this visit.
  const run = useRef(0)

  // The interface's taps take the step's chord; a new step sounds its chord (the lesson opening has its own).
  const sounded = useRef<number | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: one cue per step change
  useEffect(() => {
    setSoundContext({ step: index, steps: lesson.steps.length })
    if (sounded.current === null) playSound('lessonOpen')
    else if (sounded.current !== index) cue('step')
    sounded.current = index
  }, [index])
  useEffect(() => () => setSoundContext({}), [])

  // Resume point: the step on screen.
  useEffect(() => {
    const record = recordOf(lesson.id)
    if (record.at !== step.id) saveRecord(lesson.id, { ...record, at: step.id })
  }, [lesson.id, step.id])

  const root = useRef<HTMLDivElement>(null)
  useLessonMotion(root, index, lesson.steps.length)
  useAnswerMotion(root, attempt.wrong, attempt.solved)

  const scroller = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: each step opens at its top
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
  }, [index])

  // The runner: show the next action once the current one's motion has landed and its dwell has passed.
  // biome-ignore lint/correctness/useExhaustiveDependencies: one schedule per action, beat and hold
  useEffect(() => {
    engine.setTempo(LESSON_CHANNEL, tempo)
    if (shown >= frames.length || held) return
    const current = shown > 0 ? frames[shown - 1] : undefined
    const before = shown > 1 ? frames[shown - 2] : undefined
    const advance = () => {
      const next = frames[shown]
      setPlay({ key: beatKey, shown: shown + 1 })
      if (next?.action === 'highlight' && next.marks.length) cue('select')
      else if (next?.action === 'collect') cue('merge')
    }
    engine.withChannel(RUNNER_CHANNEL, () => {
      if (!current) {
        // The step enters first; the beat starts after it (chrome time).
        engine.after(CHOREO_MS.beatDelay, advance)
        return
      }
      const settle = () => {
        if (engine.isActive(LESSON_CHANNEL)) {
          engine.after(POLL_MS, settle)
          return
        }
        const floor = readingFloor(before ?? { ...emptyStage, lines: current.lines }, current)
        // A highlight's floor is its whole dwell; anything else waits at least its reading floor.
        const dwell = current.action === 'highlight' ? current.dwell : Math.max(floor, current.dwell)
        engine.after(dwell, advance)
      }
      settle()
    })
    return () => engine.cancelCues(RUNNER_CHANNEL)
  }, [beatKey, shown, held])

  // Before the first action the beat's lines are already laid out (hidden), so nothing moves later.
  const state =
    shown > 0 ? (frames[shown - 1] ?? emptyStage) : { ...emptyStage, lines: frames[0]?.lines ?? [] }

  const go = (next: number) => {
    setReplays(0)
    setHeld(false)
    setAttempt(freshAttempt)
    setTyped('')
    setIndex(next)
  }

  const answer = (given: string, correct: boolean) => {
    const record = recordOf(lesson.id)
    saveRecord(lesson.id, recordTry(record, step.id, given, correct, attempt.wrong.length === 0, Date.now()))
    if (correct) {
      run.current = attempt.wrong.length === 0 ? run.current + 1 : 0
      cue(run.current >= STREAK ? 'streak' : 'correct')
      haptic(14)
      setAttempt((a) => ({ ...a, solved: true, revealed: true }))
    } else {
      run.current = 0
      cue('wrong')
      haptic([10, 60, 10])
      setAttempt((a) => ({ ...a, wrong: [...a.wrong, given] }))
    }
  }

  const finish = () => {
    const doneBefore = lessons.filter((other) => stateOf(recordOf(other.id)) === 'done')
    saveRecord(lesson.id, { ...recordOf(lesson.id), at: null, doneAt: Date.now() })
    cue(rewardFor(lesson, doneBefore))
    haptic(20)
    void navigate({ to: returnTab.current })
  }

  const isLast = index === lesson.steps.length - 1
  const locked = isQuestion(step) && !attempt.revealed
  const primary = () => {
    if (playing && frames.length) {
      engine.cancelCues(RUNNER_CHANNEL)
      engine.finishChannel(LESSON_CHANNEL)
      setHeld(false)
      setShown(frames.length)
    } else if (isLast) finish()
    else go(index + 1)
  }
  // While a beat plays the button keeps its label and turns soft (old UC-2): a tap lands the beat.
  const skipping = playing && frames.length > 0
  const primaryLabel = isLast ? strings.lesson.finish : strings.lesson.next

  const lastWrong = attempt.wrong.at(-1)
  const wrongFeedback =
    step.kind === 'choice' && lastWrong
      ? step.options.find((option) => option.key === lastWrong)?.feedback
      : step.kind === 'keypad' && lastWrong
        ? step.feedbackWrong
        : undefined

  const final = frames.at(-1) ?? emptyStage
  const hasStage = Boolean(step.scene || state.area || final.area || state.lines.length)
  const transport =
    frames.length > 0
      ? {
          mode: playing ? (held ? ('play' as const) : ('pause' as const)) : ('replay' as const),
          onPress: () => {
            if (!playing) {
              setHeld(false)
              setReplays((n) => n + 1)
            } else setHeld((h) => !h)
          },
        }
      : undefined

  const options =
    step.kind === 'choice' ? (
      <fieldset className="ex-opts ls-opts" aria-label={step.title} data-sound="none">
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
    ) : null

  return (
    <div ref={root} className="ls-run" data-testid="lesson-player">
      <div className="ls-top">
        <Link
          to={returnTab.current}
          className="ls-top__btn"
          aria-label={strings.lesson.close}
          data-sound="close"
        >
          ✕
        </Link>
        <button
          type="button"
          className="ls-top__btn sh-press"
          aria-label={strings.lesson.back}
          data-sound="none"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          ‹
        </button>
        <div
          className="ls-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={lesson.steps.length}
          aria-valuenow={index + 1}
          aria-label={strings.lesson.count(index + 1, lesson.steps.length)}
        >
          <span className="ls-progress__fill" />
        </div>
        <span className="ls-count" aria-hidden="true">
          {lesson.node} · {strings.lesson.count(index + 1, lesson.steps.length)}
        </span>
      </div>

      <div className="ls-main" data-stage={hasStage}>
        {hasStage ? (
          <Stage
            lesson={lesson}
            scene={step.scene}
            state={state}
            final={final}
            stagger={CARRY.stagger}
            transport={transport}
          />
        ) : null}

        <div ref={scroller} className="ls-narr">
          <p className="ls-eyebrow">{step.eyebrow}</p>
          <h1 className="ls-title">
            <RichText text={step.title} />
          </h1>
          {step.body ? (
            <p className="ls-body">
              <RichText text={step.body} />
            </p>
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
      </div>

      <div className="ls-dock">
        {options}
        {step.kind === 'keypad' && !attempt.revealed ? (
          <Keypad
            sound="none"
            value={typed}
            onChange={(value) => {
              setTyped(value)
              cue('select')
            }}
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
          <button
            type="button"
            className="sh-btn sh-btn--primary sh-press"
            // Skipping a beat taps; the next step and the lesson end play their own sounds.
            data-sound={skipping ? undefined : 'none'}
            data-soft={skipping || undefined}
            aria-label={skipping ? strings.lesson.finishBeat : undefined}
            onClick={primary}
          >
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
