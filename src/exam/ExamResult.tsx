import { Link, Navigate } from '@tanstack/react-router'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { Blocks, RichText } from './Blocks'
import { score } from './session'
import { useExam } from './store'

const byId = new Map(questions.map((question) => [question.id, question]))

export function ExamResult() {
  const { session } = useExam()
  if (!session) return <Navigate to="/exam" />
  if (session.finishedAt === null) return <Navigate to="/exam/run" />
  const result = score(session, questions)
  const minutes = Math.max(1, Math.round((session.finishedAt - session.startedAt) / 60_000))

  return (
    <div className="sh-view">
      <header>
        <p className="sh-sub">{strings.exam.setTitle[session.set]}</p>
        <h1 className="sh-title">{strings.exam.resultTitle}</h1>
      </header>
      <section className="sh-card ex-score" data-testid="exam-score">
        <b>{strings.exam.resultScore(result.correct, result.total)}</b>
        <span>%{result.percent}</span>
        <span className="sh-sub">{strings.exam.resultSplit(result.wrong, result.blank)}</span>
        <span className="sh-sub">{strings.exam.resultTime(minutes)}</span>
      </section>
      <section>
        <h2 className="sh-label">{strings.exam.questions}</h2>
        <div className="ex-review">
          {session.questionIds.map((id, index) => {
            const question = byId.get(id)
            if (!question) return null
            const chosen = session.answers[id] ?? null
            const status = chosen === null ? 'blank' : chosen === question.answer ? 'correct' : 'wrong'
            const chosenOption = question.options.find((option) => option.key === chosen)
            const right = question.options.find((option) => option.key === question.answer)
            return (
              <details key={id} className="sh-card ex-item" data-status={status}>
                <summary>
                  <span className="ex-item__n">{index + 1}</span>
                  <span className="ex-item__st">{strings.exam.status[status]}</span>
                  <span className="sh-chev" aria-hidden="true">
                    ›
                  </span>
                </summary>
                <div className="ex-item__body">
                  <Blocks blocks={question.stem} />
                  {chosenOption && status === 'wrong' ? (
                    <div className="ex-answer" data-kind="wrong">
                      <span className="sh-label">
                        {strings.exam.yourAnswer} ({chosenOption.key})
                      </span>
                      <Blocks blocks={chosenOption.content} />
                      {chosenOption.feedback ? (
                        <p className="ex-feedback">
                          <RichText text={chosenOption.feedback} />
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {right ? (
                    <div className="ex-answer" data-kind="right">
                      <span className="sh-label">
                        {strings.exam.rightAnswer} ({right.key})
                      </span>
                      <Blocks blocks={right.content} />
                    </div>
                  ) : null}
                  <div className="ex-solution">
                    <span className="sh-label">{strings.exam.solution}</span>
                    <p>
                      <RichText text={question.explanation} />
                    </p>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      </section>
      <Link to="/exam" className="sh-btn sh-btn--primary sh-press ex-btn-link">
        {strings.exam.newAttempt}
      </Link>
    </div>
  )
}
