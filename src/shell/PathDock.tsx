import { useState } from 'react'
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
import { answeredOn, dayKey, pickDaily } from '../progress/daily'
import { saveDailyAnswer, useDailyAnswer } from '../progress/daily-store'
import { openMistakes } from '../progress/mistakes'
import { useSettings } from '../progress/settings'
import { Pressable } from '../ui/Pressable'
import { PressLink } from './PressLink'
import { morphFrom, overlayHostRef, stageRef } from './stage'
import { type TodayBlock, todayBlocks } from './today-blocks'

/** Days before the exam from which the rehearsal gets its own chip. */
const EXAM_SOON_DAYS = 7

/**
 * The dock above the tab bar: a row of small satellites (the question of the day, the mistakes to revisit,
 * the rehearsal when the exam is close; none of them ever drawn empty) and under it the one next lesson,
 * the screen's only primary button (decision 0012).
 */
export function PathDock() {
  const records = useLessonRecords()
  const { outcomes } = useExam()
  const { examDate } = useSettings()
  const { main } = upNext(lessons, records, 0)
  const open = openMistakes(lessons, records, questions, outcomes)
  const firstLesson = open.find((mistake) => mistake.source === 'lesson')
  const now = new Date()
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
  // The rehearsal chip's one fact: the countdown when the date is known, else its size.
  const examValue =
    examDays === null || examDays < 0
      ? strings.today.examSub
      : examDays === 0
        ? strings.today.examToday
        : strings.today.examDays(examDays)

  return (
    <div className="ph-dock" data-testid="path-dock">
      <div className="ph-chips">
        {show('daily') && daily ? <DailyChip question={daily} answered={answered} /> : null}
        {show('review') ? (
          firstLesson ? (
            <PressLink
              to="/lesson/$id"
              params={{ id: firstLesson.lessonId }}
              search={{ step: firstLesson.stepId }}
              className="ph-chip"
              data-testid="today-review"
            >
              <ChipFace title={strings.today.review} value={strings.today.reviewCount(open.length)} />
            </PressLink>
          ) : (
            <PressLink to="/me" className="ph-chip" data-testid="today-review">
              <ChipFace title={strings.today.review} value={strings.today.reviewCount(open.length)} />
            </PressLink>
          )
        ) : null}
        {show('exam') ? (
          <PressLink to="/exam" className="ph-chip" data-testid="today-exam">
            <ChipFace title={strings.today.exam} value={examValue} />
          </PressLink>
        ) : null}
      </div>
      {main ? <NextLesson lessonId={main.id} /> : <AllDone />}
    </div>
  )
}

function ChipFace({ title, value }: { title: string; value: string }) {
  return (
    <>
      <span className="ph-chip__title">{title}</span>
      <span className="ph-chip__value">{value}</span>
    </>
  )
}

/** The one primary action: the lesson in progress, else the first one not finished. */
function NextLesson({ lessonId }: { lessonId: string }) {
  const records = useLessonRecords()
  const lesson = lessons.find((l) => l.id === lessonId)
  if (!lesson) return null
  const record = records[lesson.id]
  const resuming = stateOf(record) === 'current' && record
  const chapter = chapterOf(lesson)
  return (
    <PressLink
      to="/lesson/$id"
      params={{ id: lesson.id }}
      className="dz-card ph-next"
      data-lesson={lesson.id}
      data-testid="today-next"
      onClick={(event) => {
        morphFrom.current = event.currentTarget
      }}
    >
      <span className="ph-next__text">
        <span className="ph-next__where">
          <span className="num">{pathCode(lesson)}</span>
          {chapter && !resuming ? <span>{chapter.label}</span> : null}
          {resuming ? (
            <span className="num">
              {strings.today.stepOf(resumeIndex(lesson, record) + 1, lesson.steps.length)}
            </span>
          ) : null}
        </span>
        <b className="ph-next__title">{lesson.title}</b>
      </span>
      <span className="dz-button ph-next__action" data-kind="primary">
        {resuming ? strings.today.resume : strings.today.start}
      </span>
    </PressLink>
  )
}

/** Every lesson done: the card becomes the way to the rehearsal. */
function AllDone() {
  return (
    <div className="dz-card ph-next" data-testid="today-done">
      <b className="ph-next__title">{strings.today.allDone}</b>
      <PressLink to="/exam" className="dz-button ph-next__action" data-kind="primary">
        {strings.today.allDoneAction}
      </PressLink>
    </div>
  )
}

/** The question of the day: one chip, it opens the sheet; once answered it rests until tomorrow. */
function DailyChip({
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
        className="ph-chip"
        data-testid="today-daily"
        data-state={answered ? (answered.correct ? 'right' : 'wrong') : 'open'}
        onClick={() => setOpen(true)}
      >
        <ChipFace title={text.eyebrow} value={answered ? text.next : text.solve} />
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
