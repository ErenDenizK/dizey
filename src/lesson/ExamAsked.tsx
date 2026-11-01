import { useCallback, useRef, useState } from 'react'
import { type Question, questions } from '../content/questions'
import { strings } from '../content/strings'
import { QuestionSheet } from '../exam/QuestionSheet'
import { recordOutcome } from '../exam/store'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'

/** The bank question that belongs to a lesson's node, if there is one (the first in bank order). */
export function examQuestionFor(node: string, bank: readonly Question[] = questions): Question | null {
  return bank.find((question) => question.node === node) ?? null
}

/**
 * "Sınavda böyle sorulur": one real exam question on the lesson's topic, at the end of the lesson. Tapping
 * opens it in a sheet; the answer is graded and, if wrong, joins the mistake log like an exam mistake.
 */
export function ExamAsked({ question }: { question: Question }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const content = useRef<HTMLElement | null>(null)
  const mounted = useCallback((el: HTMLElement | null) => {
    content.current = el?.closest<HTMLElement>('.sh-overlay__content') ?? null
    setHost(el?.closest<HTMLElement>('.sh-overlay') ?? null)
  }, [])
  const [open, setOpen] = useState(false)
  const [given, setGiven] = useState<string | null>(null)
  return (
    <div ref={mounted} data-late="">
      <Pressable className="ls-asked" data-testid="lesson-exam-asked" onClick={() => setOpen(true)}>
        <span className="ls-asked__main">{strings.lessonEnd.examAsked}</span>
        <ChevronRight />
      </Pressable>
      {host ? (
        <QuestionSheet
          question={question}
          open={open}
          onClose={() => setOpen(false)}
          host={host}
          stage={content}
          eyebrow={strings.lessonEnd.examAsked}
          given={given}
          onAnswer={(key, correct) => {
            setGiven(key)
            recordOutcome(question.id, key, correct, Date.now())
          }}
        />
      ) : null}
    </div>
  )
}
