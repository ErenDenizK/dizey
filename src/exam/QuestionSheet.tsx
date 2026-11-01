import { type RefObject, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Question } from '../content/questions'
import { strings } from '../content/strings'
import { playSound } from '../sound/player'
import { Check, Close } from '../ui/icons'
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
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const checked = given !== null
  const chosen = given ?? picked
  const wide = question.options.some((option) => option.content.some((block) => block.kind !== 'text'))
  const correct = chosen === question.answer
  const option = question.options.find((candidate) => candidate.key === chosen)

  const check = () => {
    if (!picked || checked) return
    const right = picked === question.answer
    playSound(right ? 'correct' : 'wrong')
    onAnswer(picked, right)
  }

  return createPortal(
    <Sheet open={open} onClose={onClose} stage={stage} label={eyebrow} detent="large">
      <div className="sh-sheet-body td-q" data-testid="question-sheet">
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
                <span className="ex-opt__key">
                  {state === 'right' ? <Check /> : state === 'wrong' ? <Close /> : candidate.key}
                </span>
                <span className="ex-opt__body">
                  <Blocks blocks={candidate.content} />
                </span>
              </button>
            )
          })}
        </fieldset>
        {checked ? (
          <div className="td-q__result" data-testid="question-result" data-correct={correct}>
            <p className="td-q__verdict">
              <b>{correct ? strings.question.right : strings.question.wrong}</b>
              {correct ? null : ` · ${strings.question.rightAnswer(question.answer)}`}
            </p>
            {!correct && option?.feedback ? (
              <p className="exs-why">
                <b>{strings.question.yourAnswer(option.key)}.</b> <RichText text={option.feedback} />
              </p>
            ) : null}
            <div className="exs-solution">
              <h3 className="exs-solution__label">{strings.question.solution}</h3>
              <p>
                <RichText text={question.explanation} />
              </p>
            </div>
          </div>
        ) : null}
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
    </Sheet>,
    host,
  )
}
