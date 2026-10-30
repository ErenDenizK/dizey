import { useState } from 'react'
import { daysUntil, examWeek } from '../content/exam'
import { strings } from '../content/strings'
import { LessonSheet } from './LessonSheet'
import { lessonName, unitOf, upNext } from './progress'
import { startLesson, useShell } from './store'

export function TodayView() {
  const { catalog, done, resume } = useShell()
  const [sheet, setSheet] = useState<string | null>(null)
  const days = daysUntil(examWeek.iso, new Date())

  return (
    <div className="sh-view">
      <header>
        <h1 className="sh-title">{strings.today.title}</h1>
        <p className="sh-sub">{strings.today.examLine(days, examWeek.label)}</p>
      </header>
      {!catalog || !resume ? (
        <p className="sh-sub">{strings.loading}</p>
      ) : (
        <>
          <ContinueCard code={resume.code} step={resume.step} />
          {(() => {
            const next = upNext(catalog, done, resume, 3)
            return (
              <section>
                <h2 className="sh-label">{strings.today.next}</h2>
                {next.length ? (
                  <div className="sh-card sh-rows">
                    {next.map((code) => (
                      <button key={code} type="button" className="sh-row" onClick={() => setSheet(code)}>
                        <span className="sh-row__ic">{code}</span>
                        <span>
                          <span className="sh-row__t">{lessonName(catalog, code)}</span>
                          <span className="sh-row__d">
                            {unitOf(catalog, code)?.label} ·{' '}
                            {strings.today.lessonSteps(catalog.steps[code] ?? 0)}
                          </span>
                        </span>
                        <span className="sh-chev" aria-hidden="true">
                          ›
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="sh-sub">{strings.today.allDone}</p>
                )}
              </section>
            )
          })()}
          <div className="sh-spacer" />
          <div className="sh-dock">
            <button
              type="button"
              className="sh-btn sh-btn--primary sh-press"
              onClick={(event) => startLesson(resume.code, event.currentTarget)}
            >
              {resume.step > 0
                ? strings.today.continueAction(lessonName(catalog, resume.code))
                : strings.today.startAction(lessonName(catalog, resume.code))}
            </button>
          </div>
        </>
      )}
      <LessonSheet code={sheet} onClose={() => setSheet(null)} />
    </div>
  )
}

function ContinueCard({ code, step }: { code: string; step: number }) {
  const { catalog } = useShell()
  if (!catalog) return null
  const total = catalog.steps[code] ?? 0
  const name = lessonName(catalog, code)
  const progress = total ? Math.round((step / total) * 100) : 0
  return (
    <button
      type="button"
      className="sh-card sh-cont sh-press"
      data-testid="continue-card"
      onClick={(event) => startLesson(code, event.currentTarget)}
    >
      <span className="sh-label">{step > 0 ? strings.today.continueLabel : strings.today.startLabel}</span>
      <span className="sh-cont__code">
        {code} · {unitOf(catalog, code)?.label}
      </span>
      <span className="sh-cont__meta">
        <b>{name}</b>
        <span>{step > 0 ? strings.today.stepCount(step + 1, total) : strings.today.lessonSteps(total)}</span>
      </span>
      <span className="sh-pbar" aria-hidden="true">
        <i className="sh-pbar__fill" style={{ width: `${progress}%` }} />
      </span>
    </button>
  )
}
