import { useLayoutEffect, useRef, useState } from 'react'
import { daysUntil, examWeek } from '../content/exam'
import { lessons } from '../content/lessons'
import { chapterOf, chapters, pathCode } from '../content/path'
import { type Question, questions } from '../content/questions'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
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
import { DockPreview, type Preview } from './DockPreview'
import { PressLink } from './PressLink'
import { morphFrom, overlayHostRef, stageRef } from './stage'
import { type TodayBlock, todayBlocks } from './today-blocks'

/** Days before the exam from which the rehearsal gets its own item. */
const EXAM_SOON_DAYS = 7

/**
 * The dock above the tab bar: one card and nothing else. It holds the next lesson, the screen's only primary
 * button (decision 0012), and under a hairline one thin row of equal cells, each a label over its value (the question of the day, the
 * mistakes to revisit, the rehearsal when the exam is close; none of them ever drawn empty).
 */
export function PathDock({
  preview = null,
  onBack = () => {},
}: {
  /** Wide screens: the lesson picked on the path, whose card takes this slot. */
  preview?: Preview | null
  onBack?: () => void
}) {
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
    <div className="ph-dock" data-testid="path-dock" data-previewing={preview ? '' : undefined}>
      <NextLane away={preview !== null}>
        {main ? (
          <NextLesson lessonId={main.id} count={blocks.length - 1}>
            {more}
          </NextLesson>
        ) : (
          <AllDone count={blocks.length - 1}>{more}</AllDone>
        )}
      </NextLane>
      <DockPreview preview={preview} onBack={onBack} />
    </div>
  )
}

/**
 * The slot's usual card. On a phone the lane is transparent to layout (display: contents) and `away` never turns on.
 * On a wide screen it fades out under a picked lesson's card and back in over the spring engine, never in one frame.
 */
function NextLane({ away, children }: { away: boolean; children: React.ReactNode }) {
  const lane = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useLayoutEffect(() => {
    const el = lane.current
    if (!el) return
    if (first.current) {
      first.current = false
      if (!away) return
    }
    engine.to(el, { opacity: away ? 0 : 1 }, 'fade')
  }, [away])
  return (
    <div ref={lane} className="ph-lane ph-next-lane" inert={away || undefined}>
      {children}
    </div>
  )
}

/** The thin row under the card's lesson: whatever items exist, or nothing at all (no empty hairline). */
function MoreRow({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <div className="ph-more" style={{ '--cols': count } as React.CSSProperties}>
      {children}
    </div>
  )
}

function ItemFace({ title, value }: { title: string; value: string }) {
  return (
    <>
      <span className="ph-more__title">{title}</span>
      <span className="ph-more__value">{value}</span>
    </>
  )
}

/** The one primary action: the lesson in progress, else the first one not finished. */
function NextLesson({
  lessonId,
  count,
  children,
}: {
  lessonId: string
  count: number
  children: React.ReactNode
}) {
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
      <MoreRow count={count}>{children}</MoreRow>
    </div>
  )
}

/** Every lesson done: the card becomes the way to the rehearsal. */
function AllDone({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <div className="dz-card ph-next" data-testid="today-done">
      <div className="ph-next__main">
        <b className="ph-next__title">{strings.today.allDone}</b>
        <PressLink to="/exam" className="dz-button ph-next__action" data-kind="primary">
          {strings.today.allDoneAction}
        </PressLink>
      </div>
      <MoreRow count={count}>{children}</MoreRow>
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
        <ItemFace title={text.cell} value={answered ? text.cellNext : text.solve} />
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
