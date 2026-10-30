import { dayLabel, daysUntil, examWeek } from '../content/exam'
import { lessons } from '../content/lessons'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { useExam } from '../exam/store'
import { resumeIndex } from '../lesson/progress'
import { stateOf, upNext } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { openMistakes } from '../progress/mistakes'
import { useSettings } from '../progress/settings'
import { ChevronRight } from '../ui/icons'
import { Screen } from '../ui/Screen'
import { Glyph } from './Glyph'
import { PressLink } from './PressLink'
import { morphFrom } from './stage'

export function TodayView() {
  const records = useLessonRecords()
  const { outcomes } = useExam()
  const { examDate } = useSettings()
  // The date is not announced: say "around" until Eren enters the day, then count down to it.
  const examLine = examDate
    ? strings.today.examLine(daysUntil(examDate, new Date()), dayLabel(examDate))
    : strings.today.examWeekLine(examWeek.label)
  const { main, after } = upNext(lessons, records, 3)
  const mistakes = openMistakes(lessons, records, questions, outcomes).length

  return (
    <Screen title={strings.today.title}>
      <p className="dz-subhead sh-lead">{examLine}</p>
      {main ? (
        (() => {
          const record = records[main.id]
          const resuming = stateOf(record) === 'current'
          const step = record ? resumeIndex(main, record) + 1 : 1
          return (
            <PressLink
              to="/lesson/$id"
              params={{ id: main.id }}
              className="dz-card sh-continue"
              data-testid="continue-card"
              onClick={(event) => {
                morphFrom.current = event.currentTarget
              }}
              aria-label={
                resuming ? strings.today.continueAction(main.title) : strings.today.startAction(main.title)
              }
            >
              <span className="dz-footnote">
                {resuming ? strings.today.continueLabel : strings.today.startLabel}
              </span>
              <span className="dz-footnote sh-code">{main.node}</span>
              <span className="dz-title3">{main.title}</span>
              <span className="sh-progress" aria-hidden="true">
                <span
                  className="sh-progress__fill"
                  style={{ width: `${resuming ? (step / main.steps.length) * 100 : 0}%` }}
                />
              </span>
              <span className="dz-footnote">
                {resuming
                  ? strings.today.stepCount(step, main.steps.length)
                  : strings.today.lessonSteps(main.steps.length)}
              </span>
            </PressLink>
          )
        })()
      ) : (
        <div className="dz-card sh-continue">
          <span className="dz-read">{strings.today.allDone}</span>
          <PressLink to="/exam" className="dz-button" data-kind="primary" data-wide="">
            {strings.today.allDoneAction}
          </PressLink>
        </div>
      )}
      {after.length || mistakes ? (
        <>
          <h2 className="dz-section-label">{strings.today.next}</h2>
          <div className="dz-list">
            {after.map((lesson) => (
              <PressLink
                key={lesson.id}
                to="/lesson/$id"
                params={{ id: lesson.id }}
                className="dz-row"
                pressClass="dz-pressable"
              >
                <Glyph state={stateOf(records[lesson.id])} />
                <span className="dz-row-main">
                  <span className="dz-footnote sh-code">{lesson.node}</span> {lesson.title}
                </span>
                <span className="dz-chevron">
                  <ChevronRight />
                </span>
              </PressLink>
            ))}
            {mistakes ? (
              <PressLink to="/me" className="dz-row" pressClass="dz-pressable">
                <span className="dz-row-main">{strings.today.mistakes(mistakes)}</span>
                <span className="dz-chevron">
                  <ChevronRight />
                </span>
              </PressLink>
            ) : null}
          </div>
        </>
      ) : null}
    </Screen>
  )
}
