import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { DuoHandle } from '../character/Duo'
import { lessons } from '../content/lessons'
import { chapters, codeOfNode, pathCode } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { RichText } from '../exam/Blocks'
import { useExam } from '../exam/store'
import { useMoments } from '../lesson/moments'
import { stateOf } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { appStorage } from '../lib/storage/app-storage'
import { useActivityDays } from '../progress/activity-store'
import { openMistakes } from '../progress/mistakes'
import { NAME_MAX } from '../progress/profile'
import { chaptersDone, profileStats } from '../progress/profile-stats'
import { saveName, useProfile } from '../progress/profile-store'
import { hasNewProgress, moodOf, parseSeen } from '../progress/readiness'
import { BadgeShelf } from '../rewards/BadgeShelf'
import { badgeOf, earnedBadges } from '../rewards/badges'
import { Emblem } from '../rewards/Emblem'
import { ChevronRight, GearIcon } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { CompanionSlot } from './CompanionSlot'
import { PressLink } from './PressLink'
import './me.css'

/** Lessons done when Sen was last on show; the duo reacts when there are more now. */
const SEEN_KEY = 'dizey.me.seen'

export function MeView() {
  return (
    <Screen
      title={strings.me.title}
      action={
        <PressLink
          to="/settings"
          className="me-gear"
          aria-label={strings.settings.open}
          data-testid="open-settings"
          data-sound="open"
        >
          <GearIcon />
        </PressLink>
      }
    >
      <Scene />
      <ProfileMatrix />
      <MistakeLog />
      <BadgeShelf />
      <SecretMoments />
    </Screen>
  )
}

/** The profile's head: the duo in a mood that follows progress, your name and the title you have earned. */
function Scene() {
  const records = useLessonRecords()
  const done = lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
  const finished = chaptersDone(records, chapters)
  const mood = moodOf(done, finished)
  const titles = strings.me.titles
  const title = titles[Math.min(finished, titles.length - 1)]
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
      <div className="me-avatar">
        <CompanionSlot name="me" size="large" mood={mood} duo={duo} />
      </div>
      <div className="me-id">
        <NameField />
        <p className="me-title" data-testid="me-title">
          {title}
        </p>
      </div>
    </section>
  )
}

/**
 * The name: a text button until tapped, then an input in the same place. The two crossfade through the engine, so
 * nothing pops. Enter or leaving the field saves, Escape drops the edit, an empty name is no name.
 */
function NameField() {
  const { name } = useProfile()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const button = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const dropped = useRef(false)
  const first = useRef(true)

  useLayoutEffect(() => {
    const show = editing ? input.current : button.current
    const hide = editing ? button.current : input.current
    if (!show || !hide) return
    if (first.current) {
      first.current = false
      engine.set(show, { opacity: 1 })
      engine.set(hide, { opacity: 0 })
      return
    }
    engine.to(show, { opacity: 1 }, 'fade')
    engine.to(hide, { opacity: 0 }, 'fade')
    if (editing) input.current?.select()
  }, [editing])

  const begin = () => {
    dropped.current = false
    setDraft(name)
    setEditing(true)
    // Focus inside the tap itself, so the phone raises the keyboard.
    input.current?.focus()
  }
  const finish = () => {
    if (!dropped.current) saveName(draft)
    setEditing(false)
  }

  return (
    <div className="me-name" data-editing={editing || undefined}>
      <Pressable
        ref={button}
        className="me-name__text"
        data-placeholder={!name || undefined}
        data-testid="me-name"
        tabIndex={editing ? -1 : undefined}
        aria-hidden={editing || undefined}
        onClick={begin}
      >
        {name || strings.me.namePlaceholder}
      </Pressable>
      <input
        ref={input}
        className="me-name__input"
        data-testid="me-name-input"
        type="text"
        enterKeyHint="done"
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        maxLength={NAME_MAX}
        aria-label={strings.me.nameLabel}
        aria-hidden={!editing || undefined}
        tabIndex={editing ? undefined : -1}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={finish}
        onKeyDown={(event) => {
          if (event.key === 'Enter') input.current?.blur()
          if (event.key === 'Escape') {
            dropped.current = true
            input.current?.blur()
          }
        }}
      />
    </div>
  )
}

/**
 * Senin matrisin: six figures as one 2 x 3 matrix in the app's bracket style. They only ever count up, and with
 * nothing studied yet they read zero, honestly.
 */
function ProfileMatrix() {
  const records = useLessonRecords()
  const { outcomes, history, chapters: tested } = useExam()
  const recorded = useActivityDays()
  const moments = useMoments()
  const stats = profileStats({ records, history, outcomes, chapters: tested, recorded })
  const badges = earnedBadges({ records, history, moments }).length
  const text = strings.me.stats
  const cells = [
    ['lessons', stats.lessons, text.lessons],
    ['answered', stats.answered, text.answered],
    ['firstTry', stats.firstTry, text.firstTry],
    ['days', stats.days, text.days],
    ['fixed', stats.fixed, text.fixed],
    ['badges', badges, text.badges],
  ] as const
  return (
    <section aria-labelledby="matrix" className="me-matrix-block">
      <h2 id="matrix" className="dz-section-label">
        {strings.me.matrix}
      </h2>
      <ul className="me-matrix" data-testid="me-matrix">
        {cells.map(([key, value, label]) => (
          <li key={key} className="me-matrix__cell" data-testid={`stat-${key}`}>
            <b className="me-matrix__n num">{value}</b>
            <span className="me-matrix__l">{label}</span>
          </li>
        ))}
      </ul>
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
