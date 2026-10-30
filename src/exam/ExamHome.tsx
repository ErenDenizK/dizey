import { useNavigate } from '@tanstack/react-router'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { PressLink } from '../shell/PressLink'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { clock } from './format'
import { createSession, durationFor, examSets, remainingMs } from './session'
import { discardSession, saveSession, useExam } from './store'

/** Sınav hub: a resumable attempt first, then the sets, then history (shell spec). */
export function ExamHome() {
  const { session, history } = useExam()
  const navigate = useNavigate()
  const running = session && session.finishedAt === null && remainingMs(session, Date.now()) > 0

  return (
    <Screen title={strings.exam.title}>
      <p className="dz-subhead sh-lead">{strings.exam.subtitle}</p>
      <div className="sh-stack">
        {running ? (
          <section className="dz-card ex-set">
            <span className="dz-footnote">{strings.exam.inProgress}</span>
            <b className="dz-title3">{strings.exam.setTitle[session.set]}</b>
            <span className="dz-subhead">
              {strings.exam.inProgressMeta(
                session.current + 1,
                session.questionIds.length,
                clock(remainingMs(session, Date.now())),
              )}
            </span>
            <PressLink to="/exam/run" className="dz-button" data-kind="primary" data-wide="">
              {strings.exam.resume}
            </PressLink>
          </section>
        ) : null}
        {examSets(questions).map((set) => (
          <section key={set.id} className="dz-card ex-set">
            <b className="dz-title3">{strings.exam.setTitle[set.id]}</b>
            <span className="dz-subhead">{strings.exam.setBody[set.id]}</span>
            <span className="dz-footnote">
              {strings.exam.setMeta(set.size, durationFor(set.size) / 60_000)}
            </span>
            <Pressable
              className="dz-button"
              data-kind={running ? 'secondary' : 'primary'}
              data-wide=""
              onClick={() => {
                if (session) discardSession()
                saveSession(createSession(questions, set.id, Date.now(), Date.now()))
                void navigate({ to: '/exam/run' })
              }}
            >
              {strings.exam.start}
            </Pressable>
          </section>
        ))}
      </div>
      {history.length ? (
        <section>
          <h2 className="dz-section-label">{strings.exam.history}</h2>
          <div className="dz-list">
            {history.slice(0, 5).map((entry) => (
              <div key={entry.finishedAt} className="dz-row ex-history">
                <span className="num ex-history__pct">%{entry.percent}</span>
                <span className="dz-row-main">
                  {strings.exam.historyRow(entry.correct, entry.total)}
                  <small className="dz-footnote sh-row-sub">
                    {strings.exam.setTitle[entry.set]} ·{' '}
                    {new Date(entry.finishedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </small>
                </span>
              </div>
            ))}
          </div>
          {session?.finishedAt ? (
            <PressLink to="/exam/result" className="dz-button sh-review" data-kind="secondary" data-wide="">
              {strings.exam.resultTitle}
            </PressLink>
          ) : null}
        </section>
      ) : null}
    </Screen>
  )
}
