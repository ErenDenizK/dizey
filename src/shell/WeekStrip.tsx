import { strings } from '../content/strings'
import { useExam } from '../exam/store'
import { useLessonRecords } from '../lesson/store'
import { activityDays, weekStrip } from '../progress/activity'
import { useActivityDays } from '../progress/activity-store'
import './week-strip.css'

/**
 * Monday to Sunday of this week: a dot per day that had study, and one line under it. No counts to lose; a week
 * without study gets an open invitation, not a zero.
 */
export function WeekStrip() {
  const records = useLessonRecords()
  const { outcomes, history, chapters } = useExam()
  const recorded = useActivityDays()
  const text = strings.week
  const days = weekStrip(new Date(), activityDays({ recorded, records, history, outcomes, chapters }))
  const studied = days.filter((day) => day.active).length
  const summary = studied ? text.summary(studied) : text.none
  return (
    <div className="wk">
      <ol className="wk__days" data-testid="week-strip" aria-label={`${text.label}: ${summary}`}>
        {days.map((day) => (
          <li
            key={day.key}
            className="wk__day"
            data-active={day.active}
            data-today={day.today}
            data-future={day.future}
          >
            <span className="wk__initial" aria-hidden="true">
              {text.initials[day.weekday]}
            </span>
            <i className="wk__dot" aria-hidden="true" />
            <span className="wk__sr">
              {text.names[day.weekday]}
              {day.today ? ` (${text.today})` : ''}: {day.active ? text.studied : text.rest}
            </span>
          </li>
        ))}
      </ol>
      <p className="wk__summary num" data-testid="week-summary">
        {summary}
      </p>
    </div>
  )
}
