import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { lessons } from '../content/lessons'
import { chapters, pathCode, tileTitle } from '../content/path'
import type { Question } from '../content/questions'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { PressLink } from '../shell/PressLink'
import { playSound } from '../sound/player'
import { Check, ChevronRight, Close } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Blocks, RichText } from './Blocks'
import { isChapterSet, setTitle } from './chapter-test'
import {
  type ExamSession,
  type QuestionStatus,
  score,
  sealColumnsFor,
  statusOf,
  topicsToReview,
} from './session'
import { useExam } from './store'
import './exam.css'

const byId = new Map(questions.map((question) => [question.id, question]))
const CHANNEL = 'exam-result'
/** The lesson end's seal timing (inventory 8.4), quicker per cell: a paper has three times the cells. */
const MS = { cellsFrom: 260, cellStagger: 45, closeAfter: 120 } as const
const SEAL_GAP = 14
/** The topics that cost the most points first; the rest one tap away, so the questions stay close. */
const TOPICS_SHOWN = 3

type Filter = 'all' | 'wrong' | 'blank'

/**
 * The rehearsal result. The paper comes back as a seal (the lesson end's bracketed matrix, one cell per
 * question) that closes before the score counts up; then what to do about it: the topics that cost
 * points, each one tap from its lesson, and every question to open in place with the right answer, the
 * mistake behind a wrong pick and the solution. One primary action: done.
 */
export function ExamResult() {
  const { session } = useExam()
  if (!session) return <Navigate to="/exam" />
  if (session.finishedAt === null) return <Navigate to="/exam/run" />
  return <Result session={session} />
}

function Result({ session }: { session: ExamSession }) {
  const navigate = useNavigate()
  // A chapter test returns to the map; a rehearsal to the exam hub.
  const home = isChapterSet(session.set) ? '/map' : '/exam'
  const result = score(session, questions)
  const paper = session.questionIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => Boolean(question))
  const statuses = paper.map((question) => statusOf(session, question))
  const topics = topicsToReview(session, questions)
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [allTopics, setAllTopics] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  // A tapped mark of the paper row opens that question's review and brings it into view.
  const reveal = (id: string) => {
    setFilter('all')
    setOpen(id)
    setPending(id)
  }
  useEffect(() => {
    if (!pending) return
    root.current?.querySelector(`[data-q="${pending}"]`)?.scrollIntoView({ block: 'start' })
    setPending(null)
  }, [pending])

  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: the ceremony plays once, when the screen opens
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const cells = [...el.querySelectorAll<HTMLElement>('.exs-seal__cell')]
    const [left, right] = [...el.querySelectorAll<HTMLElement>('.exs-seal__br')]
    const enter = [...el.querySelectorAll<HTMLElement>('[data-enter]')]
    const n = count.current
    for (const cell of cells) engine.set(cell, { scale: 0.55, opacity: 0 })
    if (left && right) {
      engine.set(left, { x: -SEAL_GAP, opacity: 0 })
      engine.set(right, { x: SEAL_GAP, opacity: 0 })
    }
    for (const item of enter) engine.set(item, { y: 12, opacity: 0 })
    if (n) {
      engine.bind(n, (v) => {
        n.textContent = String(Math.round(v.n ?? 0))
      })
      engine.set(n, { n: 0 })
    }
    engine.withChannel(CHANNEL, () => {
      for (const [at, cell] of cells.entries()) {
        engine.after(MS.cellsFrom + at * MS.cellStagger, () =>
          engine.to(cell, { scale: 1, opacity: 1 }, 'land'),
        )
      }
      const close = MS.cellsFrom + cells.length * MS.cellStagger + MS.closeAfter
      engine.after(close, () => {
        if (left && right) {
          engine.to(left, { x: 0, opacity: 1 }, 'move')
          engine.to(right, { x: 0, opacity: 1 }, 'move')
        }
        playSound('seal')
        if (n) engine.to(n, { n: result.correct }, 'glide')
        for (const [at, item] of enter.entries()) {
          engine.after(at * 40, () => engine.to(item, { y: 0, opacity: 1 }, 'move'))
        }
      })
    })
    return () => {
      engine.cancelCues(CHANNEL)
      engine.finishChannel(CHANNEL)
    }
  }, [])

  const shown = paper
    .map((question, index) => ({ question, index, status: statuses[index] as QuestionStatus }))
    .filter(({ status }) => filter === 'all' || status === filter)

  return (
    <div ref={root} className="exs" data-testid="exam-result">
      <header className="exs-top">
        <h1 className="dz-title2 exs-top__title">{setTitle(session.set, chapters)}</h1>
        <Link to={home} className="ls-top__btn" aria-label={strings.exam.close}>
          <Close />
        </Link>
      </header>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: the tap only skips motion; nothing is lost without it */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: as above */}
      <section className="exs-hero" onClick={() => engine.finishChannel(CHANNEL)}>
        <div className="exs-seal" style={{ '--cols': sealColumnsFor(paper.length) } as React.CSSProperties}>
          <span className="exs-seal__name">{strings.exam.sealName}</span>
          <fieldset
            className="exs-seal__grid"
            aria-label={strings.exam.sealLabel(result.correct, result.total)}
          >
            <i className="exs-seal__br exs-seal__br--l" />
            {paper.map((question, at) => (
              <button
                key={question.id}
                type="button"
                className="exs-seal__cell sh-press"
                data-status={statuses[at]}
                aria-label={`${strings.exam.questionN(at + 1)}, ${strings.exam.status[statuses[at] as QuestionStatus]}`}
                onClick={() => reveal(question.id)}
              >
                <StatusGlyph status={statuses[at] as QuestionStatus} />
              </button>
            ))}
            <i className="exs-seal__br exs-seal__br--r" />
          </fieldset>
        </div>

        <div className="exs-score" data-testid="exam-score" data-enter="">
          <h2
            className="exs-score__big num"
            aria-label={strings.exam.sealLabel(result.correct, result.total)}
          >
            <span ref={count}>{result.correct}</span>
            <span className="exs-score__of">/ {result.total}</span>
          </h2>
          <p className="exs-score__verdict">{strings.exam.verdict(result.percent)}</p>
          <span className="exs-sr">
            {result.correct} / {result.total} doğru · {result.wrong} yanlış · {result.blank} boş
          </span>
        </div>
      </section>

      {topics.length ? (
        <section className="exs-group" data-enter="">
          <h2 className="dz-section-label">{strings.exam.review}</h2>
          <div className="dz-list">
            {(allTopics ? topics : topics.slice(0, TOPICS_SHOWN)).map((topic) => {
              const lesson = lessons.find((candidate) => candidate.node === topic.node)
              if (!lesson) return null
              return (
                <PressLink
                  key={topic.node}
                  to="/lesson/$id"
                  params={{ id: lesson.id }}
                  className="dz-row exs-topic"
                >
                  <span className="exs-topic__code num">{pathCode(lesson)}</span>
                  <span className="dz-row-main">
                    {tileTitle(lesson)}
                    <small className="dz-footnote sh-row-sub">
                      {strings.exam.reviewTopic(topic.missed, topic.total)}
                    </small>
                  </span>
                  <ChevronRight />
                </PressLink>
              )
            })}
            {!allTopics && topics.length > TOPICS_SHOWN ? (
              <Pressable className="dz-row exs-more" onClick={() => setAllTopics(true)}>
                {strings.exam.moreTopics(topics.length - TOPICS_SHOWN)}
              </Pressable>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="exs-group" data-enter="">
        <div className="exs-group__head">
          <h2 className="dz-section-label">{strings.exam.questions}</h2>
          <fieldset className="sh-segments" aria-label={strings.exam.filterLabel}>
            {(['all', 'wrong', 'blank'] as const).map((key) => (
              <Pressable
                key={key}
                className="sh-segment"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {strings.exam.filter[key]}
              </Pressable>
            ))}
          </fieldset>
        </div>
        <div className="exs-items">
          {shown.length ? (
            shown.map(({ question, index, status }) => (
              <ReviewItem
                key={question.id}
                question={question}
                number={index + 1}
                status={status}
                chosen={session.answers[question.id] ?? null}
                open={open === question.id}
                onToggle={() => setOpen(open === question.id ? null : question.id)}
              />
            ))
          ) : (
            <p className="dz-subhead exs-empty">{strings.exam.noneInFilter}</p>
          )}
        </div>
      </section>

      <div className="exs-end">
        <Pressable
          className="dz-button"
          data-kind="primary"
          data-wide=""
          data-sound="close"
          onClick={() => void navigate({ to: home })}
        >
          {home === '/map' ? strings.exam.backToMap : strings.exam.done}
        </Pressable>
      </div>
    </div>
  )
}

function StatusGlyph({ status }: { status: QuestionStatus }) {
  if (status === 'correct') return <Check />
  if (status === 'wrong') return <Close />
  return <span aria-hidden="true">–</span>
}

function ReviewItem({
  question,
  number,
  status,
  chosen,
  open,
  onToggle,
}: {
  question: Question
  number: number
  status: QuestionStatus
  chosen: string | null
  open: boolean
  onToggle: () => void
}) {
  const body = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = body.current
    if (!open || !el) return
    engine.set(el, { opacity: 0, y: -6 })
    engine.to(el, { opacity: 1, y: 0 }, 'glide')
  }, [open])
  const lesson = lessons.find((candidate) => candidate.node === question.node)
  const picked = question.options.find((option) => option.key === chosen)
  const wide = question.options.some((option) => option.content.some((block) => block.kind !== 'text'))
  return (
    <article className="exs-item" data-open={open} data-q={question.id}>
      <Pressable
        className="exs-item__head"
        aria-expanded={open}
        onClick={onToggle}
        data-sound={open ? 'close' : 'open'}
      >
        <span className="exs-tile" data-status={status}>
          <StatusGlyph status={status} />
        </span>
        <span className="dz-row-main">
          <b className="exs-item__n">{strings.exam.questionN(number)}</b>
          <small className="dz-footnote sh-row-sub">
            {strings.exam.status[status]}
            {lesson ? ` · ${pathCode(lesson)} ${tileTitle(lesson)}` : ''}
          </small>
        </span>
        <span className="exs-item__chev" data-open={open}>
          <ChevronRight />
        </span>
      </Pressable>
      {open ? (
        <div ref={body} className="exs-item__body">
          <div className="exs-stem">
            <Blocks blocks={question.stem} />
          </div>
          <div className="ex-opts exs-opts" data-wide={wide}>
            {question.options.map((option) => {
              const state =
                option.key === question.answer ? 'right' : option.key === chosen ? 'wrong' : undefined
              return (
                <div key={option.key} className="ex-opt" data-state={state}>
                  <span className="ex-opt__key">
                    {state === 'right' ? <Check /> : state === 'wrong' ? <Close /> : option.key}
                  </span>
                  <span className="ex-opt__body">
                    <Blocks blocks={option.content} />
                  </span>
                </div>
              )
            })}
          </div>
          {status === 'wrong' && picked?.feedback ? (
            <p className="exs-why">
              <b>
                {strings.exam.yourAnswer} ({picked.key}).
              </b>{' '}
              <RichText text={picked.feedback} />
            </p>
          ) : null}
          <div className="exs-solution">
            <h3 className="exs-solution__label">{strings.exam.solution}</h3>
            <p>
              <RichText text={question.explanation} />
            </p>
          </div>
        </div>
      ) : null}
    </article>
  )
}
