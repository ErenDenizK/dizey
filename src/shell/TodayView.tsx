import { useEffect, useRef, useState } from 'react'
import type { DuoHandle } from '../character/Duo'
import { daysUntil, examWeek } from '../content/exam'
import { lessons } from '../content/lessons'
import { chapterOf, chapters, pathCode } from '../content/path'
import { type Question, questions } from '../content/questions'
import { strings } from '../content/strings'
import { QuestionSheet } from '../exam/QuestionSheet'
import { recordOutcome, useExam } from '../exam/store'
import { resumeIndex } from '../lesson/progress'
import { stateOf, upNext } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { activityDays, type StripDay, weekStrip } from '../progress/activity'
import { useActivityDays } from '../progress/activity-store'
import { answeredOn, dayKey, pickDaily } from '../progress/daily'
import { saveDailyAnswer, useDailyAnswer } from '../progress/daily-store'
import { openMistakes } from '../progress/mistakes'
import { useSettings } from '../progress/settings'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { CompanionSlot } from './CompanionSlot'
import { PressLink } from './PressLink'
import { morphFrom, overlayHostRef, stageRef } from './stage'
import { type TodayBlock, todayBlocks } from './today-blocks'
import './today.css'

/** Days before the exam from which the rehearsal gets its own card. */
const EXAM_SOON_DAYS = 7

/**
 * Bugün: what to do now. At most four blocks, none of them ever empty: the hero, the one next lesson, the
 * mistakes to revisit, and the rehearsal when the exam is close (decision 0012). The duo and one line of state
 * are the scene on top; the work (rows, then the next lesson with its button) sits at the bottom, in the
 * thumb zone. The exam countdown lives only in the rehearsal row.
 */
export function TodayView() {
  const records = useLessonRecords()
  const { outcomes, history, chapters: chapterResults } = useExam()
  const recorded = useActivityDays()
  const { examDate } = useSettings()
  const { main } = upNext(lessons, records, 0)
  const open = openMistakes(lessons, records, questions, outcomes)
  const firstLesson = open.find((mistake) => mistake.source === 'lesson')
  const now = new Date()
  const hero = strings.today.hero
  const examDays = examDate ? daysUntil(examDate, now) : null
  const examSoon = daysUntil(examDate ?? examWeek.iso, now) <= EXAM_SOON_DAYS

  const stored = useDailyAnswer()
  const answered = answeredOn(stored, now)
  const doneNodes = new Set(lessons.filter((l) => records[l.id]?.doneAt != null).map((l) => l.node))
  const firstNodes = new Set<string>(chapters[0]?.lessons.map((l) => l.node) ?? [])
  const daily =
    (answered ? questions.find((q) => q.id === answered.questionId) : undefined) ??
    pickDaily(questions, doneNodes, firstNodes, now)
  const blocks = todayBlocks({
    review: open.length > 0,
    daily: daily !== null,
    exam: Boolean(main && examSoon),
  })
  const show = (block: TodayBlock) => blocks.includes(block)
  const days = weekStrip(
    now,
    activityDays({ recorded, records, history, outcomes, chapters: chapterResults }),
  )

  const doneCount = lessons.filter((l) => records[l.id]?.doneAt != null).length
  // One sentence of state, by priority: a lesson in progress, nothing started, all done.
  const stateLine = !main
    ? hero.done
    : stateOf(records[main.id]) === 'current'
      ? hero.resume
      : doneCount === 0
        ? hero.fresh
        : hero.next
  // The rehearsal row's one fact: the countdown when the date is known, else its size.
  const examValue =
    examDays === null || examDays < 0
      ? strings.today.examSub
      : examDays === 0
        ? strings.today.examToday
        : strings.today.examDays(examDays)
  const duo = useRef<DuoHandle>(null)
  useEffect(() => {
    duo.current?.react('happy')
  }, [])

  return (
    <Screen title={strings.tabs.today}>
      <div className="td-root">
        <header className="td-top">
          <div className="td-head">
            <CompanionSlot name="today" size="large" mood="happy" alive duo={duo} />
            <p className="td-head__state dz-title3" data-testid="today-state">
              {stateLine}
            </p>
          </div>
          {days.some((day) => day.active) ? <WeekStrip days={days} /> : null}
        </header>
        <div className="td-work">
          <div className="td-rows">
            {show('review') ? (
              firstLesson ? (
                <PressLink
                  to="/lesson/$id"
                  params={{ id: firstLesson.lessonId }}
                  search={{ step: firstLesson.stepId }}
                  className="td-row"
                  data-testid="today-review"
                >
                  <RowFace title={strings.today.review} value={strings.today.reviewCount(open.length)} />
                </PressLink>
              ) : (
                <PressLink to="/me" className="td-row" data-testid="today-review">
                  <RowFace title={strings.today.review} value={strings.today.reviewCount(open.length)} />
                </PressLink>
              )
            ) : null}
            {show('daily') && daily ? <DailyRow question={daily} answered={answered} /> : null}
            {show('exam') ? (
              <PressLink to="/exam" className="td-row" data-testid="today-exam">
                <RowFace title={strings.today.exam} value={examValue} />
              </PressLink>
            ) : null}
          </div>
          {main ? <NextLesson lessonId={main.id} /> : <AllDone />}
        </div>
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
        <span className="td-next__step num">{strings.today.stepOf(step, lesson.steps.length)}</span>
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

function RowFace({ title, value }: { title: string; value: string }) {
  return (
    <>
      <span className="dz-row-main">{title}</span>
      <span className="dz-footnote sh-row-sub td-row__value">{value}</span>
      <ChevronRight />
    </>
  )
}

/** Monday to Sunday of this week: a dot per day that had study. No counts, nothing to lose. */
function WeekStrip({ days }: { days: StripDay[] }) {
  const text = strings.today.week
  const studied = days.filter((day) => day.active).length
  return (
    <ol className="td-week" data-testid="today-week" aria-label={`${text.label}: ${text.summary(studied)}`}>
      {days.map((day) => (
        <li
          key={day.key}
          className="td-week__day"
          data-active={day.active}
          data-today={day.today}
          data-future={day.future}
        >
          <span className="td-week__initial" aria-hidden="true">
            {text.initials[day.weekday]}
          </span>
          <i className="td-week__dot" aria-hidden="true" />
          <span className="td-sr">
            {text.names[day.weekday]}
            {day.today ? ` (${text.today})` : ''}: {day.active ? text.studied : text.rest}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** The question of the day: one quiet row, the whole row opens the sheet; once answered it rests until tomorrow. */
function DailyRow({
  question,
  answered,
}: {
  question: Question
  answered: { given: string; correct: boolean } | null
}) {
  const text = strings.today.daily
  const [open, setOpen] = useState(false)
  const host = overlayHostRef.current
  return (
    <>
      <Pressable
        className="td-row"
        data-testid="today-daily"
        data-state={answered ? (answered.correct ? 'right' : 'wrong') : 'open'}
        onClick={() => setOpen(true)}
      >
        <span className="dz-row-main">{text.eyebrow}</span>
        <span className="dz-footnote sh-row-sub td-row__value">{answered ? text.next : text.solve}</span>
        <ChevronRight />
      </Pressable>
      {host ? (
        <QuestionSheet
          question={question}
          open={open}
          onClose={() => setOpen(false)}
          host={host}
          stage={stageRef}
          eyebrow={text.eyebrow}
          wrongNote={text.wrongNote}
          given={answered?.given ?? null}
          onAnswer={(key, correct) => {
            const at = new Date()
            recordOutcome(question.id, key, correct, at.getTime())
            saveDailyAnswer({ day: dayKey(at), questionId: question.id, given: key, correct })
          }}
        />
      ) : null}
    </>
  )
}
