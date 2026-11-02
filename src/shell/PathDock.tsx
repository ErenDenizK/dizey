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

/** Days before the exam from which the rehearsal gets its own item. */
const EXAM_SOON_DAYS = 7

/**
 * The dock above the tab bar: one card and nothing else. It holds the next lesson, the screen's only primary
 * button (decision 0012), and under a hairline one thin row of text links (the question of the day, the
 * mistakes to revisit, the rehearsal when the exam is close; none of them ever drawn empty).
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
  // The rehearsal item's one fact: the countdown when the date is known, else its size.
  const examValue =
    examDays === null || examDays < 0
      ? strings.today.examSub
      : examDays === 0
        ? strings.today.examToday
        : strings.today.examDays(examDays)

  const more = (
    <>
      {show('daily') && daily ? <DailyItem question={daily} answered={answered} /> : null}
      {show('review') ? (
        firstLesson ? (
          <PressLink
            to="/lesson/$id"
            params={{ id: firstLesson.lessonId }}
            search={{ step: firstLesson.stepId }}
            className="ph-more__item"
            data-testid="today-review"
          >
            <ItemFace title={strings.today.review} value={strings.today.reviewCount(open.length)} />
          </PressLink>
        ) : (
          <PressLink to="/me" className="ph-more__item" data-testid="today-review">
            <ItemFace title={strings.today.review} value={strings.today.reviewCount(open.length)} />
          </PressLink>
        )
      ) : null}
      {show('exam') ? (
        <PressLink to="/exam" className="ph-more__item" data-testid="today-exam">
          <ItemFace title={strings.today.exam} value={examValue} />
        </PressLink>
      ) : null}
    </>
  )

  return (
    <div className="ph-dock" data-testid="path-dock">
      {main ? <NextLesson lessonId={main.id}>{more}</NextLesson> : <AllDone>{more}</AllDone>}
    </div>
  )
}

/** The thin row under the card's lesson: whatever items exist, or nothing at all (no empty hairline). */
function MoreRow({ children }: { children: React.ReactNode }) {
  return <div className="ph-more">{children}</div>
}

function ItemFace({ title, value }: { title: string; value: string }) {
  return (
    <>
      <span className="ph-more__title">{title}</span>
      <span className="ph-more__dot" aria-hidden="true">
        {' · '}
      </span>
      <span className="ph-more__value">{value}</span>
    </>
  )
}

/** The one primary action: the lesson in progress, else the first one not finished. */
function NextLesson({ lessonId, children }: { lessonId: string; children: React.ReactNode }) {
  const records = useLessonRecords()
  const lesson = lessons.find((l) => l.id === lessonId)
  if (!lesson) return null
  const record = records[lesson.id]
  const resuming = stateOf(record) === 'current' && record
  const chapter = chapterOf(lesson)
  return (
    <div className="dz-card ph-next">
      <PressLink
        to="/lesson/$id"
        params={{ id: lesson.id }}
        className="ph-next__main"
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
      <MoreRow>{children}</MoreRow>
    </div>
  )
}

/** Every lesson done: the card becomes the way to the rehearsal. */
function AllDone({ children }: { children: React.ReactNode }) {
  return (
    <div className="dz-card ph-next" data-testid="today-done">
      <div className="ph-next__main">
        <b className="ph-next__title">{strings.today.allDone}</b>
        <PressLink to="/exam" className="dz-button ph-next__action" data-kind="primary">
          {strings.today.allDoneAction}
        </PressLink>
      </div>
      <MoreRow>{children}</MoreRow>
    </div>
  )
}

/** The question of the day: one item, it opens the sheet; once answered it rests until tomorrow. */
function DailyItem({
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
        className="ph-more__item"
        data-testid="today-daily"
        data-state={answered ? (answered.correct ? 'right' : 'wrong') : 'open'}
        onClick={() => setOpen(true)}
      >
        <ItemFace title={text.eyebrow} value={answered ? text.next : text.solve} />
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
