import { type RefObject, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Question } from '../content/questions'
import { strings } from '../content/strings'
import { useAnswerMotion } from '../lesson/motion'
import { haptic } from '../sound/haptics'
import { playSound } from '../sound/player'
import { Pressable } from '../ui/Pressable'
import { Sheet } from '../ui/Sheet'
import { Blocks, RichText } from './Blocks'
import './exam.css'

/**
 * One bank question in a sheet, answered on the spot: pick an option, check it, read the worked solution.
 * Used by the question of the day and by "Sınavda böyle sorulur" at a lesson's end. The caller keeps the
 * result (`given`), so a question answered earlier opens already graded.
 */
export function QuestionSheet({
  question,
  open,
  onClose,
  host,
  stage,
  given,
  onAnswer,
  eyebrow,
  wrongNote,
}: {
  question: Question
  open: boolean
  onClose: () => void
  /** Where sheets mount (the overlay layer of the screen the sheet belongs to). */
  host: HTMLElement
  stage: RefObject<HTMLElement | null>
  /** The option already chosen for this question, or null while it is unanswered. */
  given: string | null
  onAnswer: (key: string, correct: boolean) => void
  eyebrow: string
  /** A gentle line after a wrong answer's verdict (the daily question promises tomorrow's). */
  wrongNote?: string
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const checked = given !== null
  const chosen = given ?? picked
  const wide = question.options.some((option) => option.content.some((block) => block.kind !== 'text'))
  const correct = chosen === question.answer
  const root = useRef<HTMLDivElement>(null)
  // The same spring as in a lesson: a wrong pick shakes, the right one swells once.
  const wrongPicks = useMemo(
    () => (checked && !correct && chosen ? [chosen] : []),
    [checked, correct, chosen],
  )
  useAnswerMotion(root, wrongPicks, checked && correct)

  const check = () => {
    if (!picked || checked) return
    const right = picked === question.answer
    playSound(right ? 'correct' : 'wrong')
    haptic(right ? 14 : [10, 60, 10])
    onAnswer(picked, right)
  }

  return createPortal(
    <Sheet open={open} onClose={onClose} stage={stage} label={eyebrow} detent="large">
      <div ref={root} className="sh-sheet-body td-q" data-testid="question-sheet">
        <div className="td-q__scroll">
          <span className="dz-footnote sh-code">{eyebrow}</span>
          <div className="dz-card td-q__stem">
            <Blocks blocks={question.stem} />
          </div>
          <fieldset
            className={`ex-opts ${checked ? 'exs-opts' : 'exr-opts'}`}
            data-wide={wide}
            aria-label={strings.question.options}
          >
            {question.options.map((candidate) => {
              const state = !checked
                ? undefined
                : candidate.key === question.answer
                  ? 'right'
                  : candidate.key === chosen
                    ? 'wrong'
                    : undefined
              return (
                <button
                  key={candidate.key}
                  type="button"
                  className="ex-opt sh-press"
                  data-testid={`question-option-${candidate.key}`}
                  data-state={state}
                  aria-pressed={checked ? undefined : chosen === candidate.key}
                  aria-disabled={checked}
                  onClick={() => {
                    if (!checked) setPicked(candidate.key)
                  }}
                >
                  <span className="ex-opt__key">{candidate.key}</span>
                  <span className="ex-opt__body">
                    <Blocks blocks={candidate.content} />
                  </span>
                </button>
              )
            })}
          </fieldset>
          {checked ? (
            <div className="td-q__result" data-testid="question-result" data-correct={correct}>
              <p className="td-q__verdict" ref={revealVerdict}>
                <b>{correct ? strings.question.right : strings.question.wrong(question.answer)}</b>
                {correct || !wrongNote ? null : ` ${wrongNote}`}
              </p>
              <h3 className="td-q__label">{strings.question.solution}</h3>
              <p className="td-q__why">
                <RichText text={question.explanation} />
              </p>
            </div>
          ) : null}
        </div>
        <div className="td-q__foot">
          {checked ? (
            <Pressable className="dz-button" data-kind="primary" data-wide="" onClick={onClose}>
              {strings.question.done}
            </Pressable>
          ) : (
            <Pressable
              className="dz-button"
              data-kind="primary"
              data-wide=""
              data-testid="question-check"
              disabled={!picked}
              onClick={check}
            >
              {strings.question.check}
            </Pressable>
          )}
        </div>
      </div>
    </Sheet>,
    host,
  )
}

/** On a short phone the verdict lands below the options: bring it into view once it appears. */
function revealVerdict(el: HTMLParagraphElement | null) {
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' }))
}
