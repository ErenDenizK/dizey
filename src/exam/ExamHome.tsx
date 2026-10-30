import { Link, useNavigate } from '@tanstack/react-router'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { clock } from './format'
import { createSession, durationFor, examSets, remainingMs } from './session'
import { discardSession, saveSession, useExam } from './store'

export function ExamHome() {
  const { session, history } = useExam()
  const navigate = useNavigate()
  const running = session && session.finishedAt === null && remainingMs(session, Date.now()) > 0

  return (
    <div className="sh-view">
      <header>
        <h1 className="sh-title">{strings.exam.title}</h1>
        <p className="sh-sub">{strings.exam.subtitle}</p>
      </header>
      {running ? (
        <section className="sh-card ex-set">
          <span className="sh-label">{strings.exam.inProgress}</span>
          <b>{strings.exam.setTitle[session.set]}</b>
          <span className="sh-sub">
            {strings.exam.inProgressMeta(
              session.current + 1,
              session.questionIds.length,
              clock(remainingMs(session, Date.now())),
            )}
          </span>
          <Link to="/exam/run" className="sh-btn sh-btn--primary sh-press ex-btn-link">
            {strings.exam.resume}
          </Link>
        </section>
      ) : null}
      {examSets(questions).map((set) => (
        <section key={set.id} className="sh-card ex-set">
          <b>{strings.exam.setTitle[set.id]}</b>
          <span className="sh-sub">{strings.exam.setBody[set.id]}</span>
          <span className="sh-sub">{strings.exam.setMeta(set.size, durationFor(set.size) / 60_000)}</span>
          <button
            type="button"
            className={`sh-btn sh-press ${running ? 'sh-btn--soft' : 'sh-btn--primary'}`}
            onClick={() => {
              if (session) discardSession()
              saveSession(createSession(questions, set.id, Date.now(), Date.now()))
              void navigate({ to: '/exam/run' })
            }}
          >
            {strings.exam.start}
          </button>
        </section>
      ))}
      {history.length ? (
        <section>
          <h2 className="sh-label">{strings.exam.history}</h2>
          <div className="sh-card sh-rows">
            {history.slice(0, 5).map((entry) => (
              <div key={entry.finishedAt} className="sh-row ex-history">
                <span className="sh-row__ic">%{entry.percent}</span>
                <span>
                  <span className="sh-row__t">{strings.exam.historyRow(entry.correct, entry.total)}</span>
                  <span className="sh-row__d">
                    {strings.exam.setTitle[entry.set]} ·{' '}
                    {new Date(entry.finishedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </span>
              </div>
            ))}
          </div>
          {session?.finishedAt ? (
            <Link to="/exam/result" className="sh-link ex-review-link">
              {strings.exam.resultTitle}
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
