import { useEffect, useRef } from 'react'
import type { DuoHandle } from '../character/Duo'
import { dayLabel, daysUntil, examWeek } from '../content/exam'
import { lessons } from '../content/lessons'
import { chapterOf, pathCode } from '../content/path'
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
import { CompanionSlot } from './CompanionSlot'
import { PressLink } from './PressLink'
import { morphFrom } from './stage'
import './today.css'

/** Days before the exam from which the rehearsal gets its own card. */
const EXAM_SOON_DAYS = 7

function greetingOf(hour: number): string {
  const g = strings.today.greeting
  if (hour >= 5 && hour <= 11) return g.morning
  if (hour >= 12 && hour <= 17) return g.day
  if (hour >= 18 && hour <= 22) return g.evening
  return g.night
}

/**
 * Bugün: what to do now. At most four blocks, none of them ever empty: the greeting with the exam line,
 * the one next lesson, the mistakes to revisit, and the rehearsal when the exam is close (decision 0012).
 */
export function TodayView() {
  const records = useLessonRecords()
  const { outcomes } = useExam()
  const { examDate } = useSettings()
  const { main } = upNext(lessons, records, 0)
  const open = openMistakes(lessons, records, questions, outcomes)
  const firstLesson = open.find((mistake) => mistake.source === 'lesson')
  const now = new Date()
  const examLine = examDate
    ? strings.path.examLine(daysUntil(examDate, now), dayLabel(examDate))
    : strings.path.examWeekLine(examWeek.label)
  const examSoon = daysUntil(examDate ?? examWeek.iso, now) <= EXAM_SOON_DAYS

  const duo = useRef<DuoHandle>(null)
  useEffect(() => {
    duo.current?.react('happy')
  }, [])

  return (
    <Screen title={greetingOf(now.getHours())}>
      <div className="td-root">
        <div className="td-head">
          <p className="td-head__exam">{examLine}</p>
          <CompanionSlot name="today" size="small" mood="happy" alive duo={duo} />
        </div>
        {main ? <NextLesson lessonId={main.id} /> : <AllDone />}
        {open.length ? (
          firstLesson ? (
            <PressLink
              to="/lesson/$id"
              params={{ id: firstLesson.lessonId }}
              search={{ step: firstLesson.stepId }}
              className="dz-card td-row"
              data-testid="today-review"
            >
              <RowFace title={strings.today.review(open.length)} sub={strings.today.reviewHint} />
            </PressLink>
          ) : (
            <PressLink to="/me" className="dz-card td-row" data-testid="today-review">
              <RowFace title={strings.today.review(open.length)} sub={strings.today.reviewHint} />
            </PressLink>
          )
        ) : null}
        {main && examSoon ? (
          <PressLink to="/exam" className="dz-card td-row" data-testid="today-exam">
            <RowFace title={strings.today.exam} sub={strings.today.examSub} />
          </PressLink>
        ) : null}
      </div>
    </Screen>
  )
}

/** The one primary action: the lesson in progress, else the first one not finished. */
function NextLesson({ lessonId }: { lessonId: string }) {
  const records = useLessonRecords()
  const lesson = lessons.find((l) => l.id === lessonId)
  if (!lesson) return null
  const record = records[lesson.id]
  const resuming = stateOf(record) === 'current' && record
  const step = resuming ? resumeIndex(lesson, record) + 1 : 0
  const chapter = chapterOf(lesson)
  return (
    <PressLink
      to="/lesson/$id"
      params={{ id: lesson.id }}
      className="dz-card td-next"
      data-lesson={lesson.id}
      data-testid="today-next"
      onClick={(event) => {
        morphFrom.current = event.currentTarget
      }}
    >
      <span className="td-next__where">
        <span className="num">{pathCode(lesson)}</span>
        {chapter ? <span>{chapter.label}</span> : null}
      </span>
      <b className="td-next__title">{lesson.title}</b>
      {resuming ? (
        <span className="td-next__progress">
          <span className="td-next__bar" aria-hidden="true">
            <i style={{ width: `${(step / lesson.steps.length) * 100}%` }} />
          </span>
          <small className="dz-footnote num">{strings.today.stepOf(step, lesson.steps.length)}</small>
        </span>
      ) : null}
      <span className="dz-button td-next__action" data-kind="primary" data-wide="">
        {resuming ? strings.today.resume : strings.today.start}
      </span>
    </PressLink>
  )
}

/** Every lesson done: the card becomes the way to the rehearsal. */
function AllDone() {
  return (
    <div className="dz-card td-next" data-testid="today-done">
      <b className="td-next__title">{strings.today.allDone}</b>
      <PressLink to="/exam" className="dz-button" data-kind="primary" data-wide="">
        {strings.today.allDoneAction}
      </PressLink>
    </div>
  )
}

function RowFace({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <span className="td-row__main">
        <span className="dz-row-main">{title}</span>
        <small className="dz-footnote sh-row-sub">{sub}</small>
      </span>
      <ChevronRight />
    </>
  )
}
