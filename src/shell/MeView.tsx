import { useEffect, useRef, useState } from 'react'
import type { DuoHandle } from '../character/Duo'
import { lessons } from '../content/lessons'
import { chapters, codeOfNode, pathCode, tileTitle } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { RichText } from '../exam/Blocks'
import { useExam } from '../exam/store'
import { useMoments } from '../lesson/moments'
import { stateOf } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { appStorage } from '../lib/storage/app-storage'
import { openMistakes } from '../progress/mistakes'
import { hasNewProgress, moodOf, parseSeen, readinessOf } from '../progress/readiness'
import { BadgeShelf } from '../rewards/BadgeShelf'
import { badgeOf } from '../rewards/badges'
import { Emblem } from '../rewards/Emblem'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { CompanionSlot } from './CompanionSlot'
import { PressLink } from './PressLink'
import { morphFrom } from './stage'
import { WeekStrip } from './WeekStrip'
import './me.css'

/** Lessons done when Sen was last on show; the duo reacts when there are more now. */
const SEEN_KEY = 'dizey.me.seen'

export function MeView() {
  return (
    <Screen
      title={strings.me.title}
      action={
        <PressLink to="/settings" className="dz-text-button" data-testid="open-settings" data-sound="open">
          {strings.settings.open}
        </PressLink>
      }
    >
      <Scene />
      <MistakeLog />
      <BadgeShelf />
      <SecretMoments />
      <ReadinessMap />
    </Screen>
  )
}

/** The profile's head: the duo in a mood that follows progress, and your week under it. */
function Scene() {
  const records = useLessonRecords()
  const done = lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
  const chaptersDone = chapters.filter((chapter) =>
    chapter.lessons.every((lesson) => stateOf(records[lesson.id]) === 'done'),
  ).length
  const mood = moodOf(done, chaptersDone)
  const root = useRef<HTMLElement>(null)
  const duo = useRef<DuoHandle>(null)
  const latest = useRef({ done, mood })
  latest.current = { done, mood }

  // The tab panes stay mounted, so "Sen opens" is the pane losing its inert flag.
  useEffect(() => {
    const pane = root.current?.closest('.sh-pane')
    if (!pane) return
    const visit = () => {
      if (pane.hasAttribute('inert')) return
      const { done: count, mood: current } = latest.current
      const seen = parseSeen(appStorage.getItem(SEEN_KEY))
      if (hasNewProgress(count, seen)) duo.current?.react(current === 'neutral' ? 'happy' : current)
      if (seen !== count) appStorage.setItem(SEEN_KEY, String(count))
    }
    visit()
    const watch = new MutationObserver(visit)
    watch.observe(pane, { attributes: true, attributeFilter: ['inert'] })
    return () => watch.disconnect()
  }, [])

  return (
    <section ref={root} className="me-scene" aria-label={strings.me.companion} data-testid="me-scene">
      <CompanionSlot name="me" size="large" mood={mood} duo={duo} />
      <WeekStrip />
    </section>
  )
}

/**
 * Hazırlık haritası: a row per chapter, a cell per lesson, coloured by first-try accuracy. Not a number.
 * A tap opens the lesson the way the path does: the lesson grows out of the cell.
 */
function ReadinessMap() {
  const records = useLessonRecords()
  const widest = Math.max(...chapters.map((chapter) => chapter.lessons.length))
  return (
    <section aria-labelledby="readiness" className="me-block">
      <h2 id="readiness" className="dz-section-label">
        {strings.me.readiness}
      </h2>
      <div className="me-map" style={{ '--cols': widest } as React.CSSProperties}>
        {chapters.map((chapter) => {
          const finished = chapter.lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
          return (
            <section
              key={chapter.id}
              className="me-map__chapter"
              aria-label={strings.me.readinessChapter(chapter.label, finished, chapter.lessons.length)}
            >
              <p className="me-map__label">
                <span className="me-map__name">{chapter.label}</span>
                <span className="me-map__count num">
                  {finished} / {chapter.lessons.length}
                </span>
              </p>
              <div className="me-map__row">
                {chapter.lessons.map((lesson) => {
                  const level = readinessOf(lesson, records[lesson.id])
                  return (
                    <PressLink
                      key={lesson.id}
                      to="/lesson/$id"
                      params={{ id: lesson.id }}
                      className="me-map__cell"
                      data-level={level}
                      data-testid="map-cell"
                      data-lesson={lesson.id}
                      data-morph-key={lesson.id}
                      aria-label={strings.me.readinessCell(
                        pathCode(lesson),
                        tileTitle(lesson),
                        strings.me.level[level],
                      )}
                      onClick={(event) => {
                        morphFrom.current = event.currentTarget
                      }}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Gizli anlar: a labelled group of one slot per hidden moment, in a single row. Found ones show their emblem, the
 * rest are dim with a "?". Nothing here presses.
 */
function SecretMoments() {
  const moments = useMoments()
  const withMoment = lessons.filter((lesson) => lesson.moment)
  if (!withMoment.length) return null
  const found = withMoment.filter((lesson) => moments[lesson.id] === 'solved').length
  return (
    <section aria-labelledby="moments" className="me-moments" data-testid="moments-album">
      <h2 id="moments" className="dz-section-label">
        {strings.me.moments}
        {` · ${strings.me.momentsCount(found, withMoment.length)}`}
      </h2>
      <ul className="me-moments__list" style={{ '--slots': withMoment.length } as React.CSSProperties}>
        {withMoment.map((lesson) =>
          moments[lesson.id] === 'solved' ? (
            <li
              key={lesson.id}
              className="me-moments__slot"
              role="img"
              aria-label={strings.me.momentFound(pathCode(lesson))}
            >
              <Emblem badge={badgeOf('insight')} />
            </li>
          ) : (
            <li
              key={lesson.id}
              className="me-moments__slot me-moments__slot--hidden"
              role="img"
              aria-label={strings.me.momentHidden}
            >
              <Emblem badge={badgeOf('insight')} />
              <span className="me-moments__mark" aria-hidden="true">
                ?
              </span>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}

const MISTAKES_SHOWN = 3

function MistakeLog() {
  const records = useLessonRecords()
  const { outcomes } = useExam()
  const [all, setAll] = useState(false)
  const [open, setOpen] = useState(false)
  const list = openMistakes(lessons, records, questions, outcomes)
  const shown = all ? list : list.slice(0, MISTAKES_SHOWN)
  if (!list.length) return null
  return (
    <section aria-labelledby="mistakes" className="me-mistakes">
      <h2 id="mistakes" className="dz-section-label">
        {strings.me.mistakes}
      </h2>
      <Pressable
        className="me-row me-mistakes__row"
        aria-expanded={open}
        aria-controls="mistake-list"
        data-testid="mistake-row"
        onClick={() => setOpen(!open)}
      >
        <span className="me-row__title num">{strings.me.mistakesRow(list.length)}</span>
        <span className="me-mistakes__chevron" data-open={open || undefined}>
          <ChevronRight />
        </span>
      </Pressable>
      {open ? (
        <div id="mistake-list">
          <ul className="dz-list sh-mistakes">
            {shown.map((mistake) => (
              <li
                key={
                  mistake.source === 'lesson' ? `${mistake.lessonId}:${mistake.stepId}` : mistake.questionId
                }
              >
                {mistake.source === 'lesson' ? (
                  <PressLink
                    to="/lesson/$id"
                    params={{ id: mistake.lessonId }}
                    search={{ step: mistake.stepId }}
                    className="sh-mistake"
                  >
                    <span className="sh-mistake__code">{codeOfNode(mistake.node)}</span>
                    <span>
                      <b>
                        <RichText text={mistake.title} />
                      </b>
                      <RichText text={mistake.text} />
                    </span>
                  </PressLink>
                ) : (
                  <div className="sh-mistake">
                    <span className="sh-mistake__code">{codeOfNode(mistake.node)}</span>
                    <span>
                      <b>{strings.me.mistakeExam}</b>
                      <RichText text={mistake.text} />
                    </span>
                  </div>
                )}
              </li>
            ))}
            {list.length > MISTAKES_SHOWN ? (
              <li>
                <Pressable className="me-more" aria-expanded={all} onClick={() => setAll(!all)}>
                  {all ? strings.me.mistakesLess : strings.me.mistakesMore(list.length - MISTAKES_SHOWN)}
                </Pressable>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
