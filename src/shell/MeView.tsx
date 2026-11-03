import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Mirtis, type MirtisHandle, type MirtisMood } from '../character/Mirtis'
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
import { activityDays } from '../progress/activity'
import { useActivityDays } from '../progress/activity-store'
import { openMistakes } from '../progress/mistakes'
import { NAME_MAX } from '../progress/profile'
import { chaptersDone, profileStats } from '../progress/profile-stats'
import { saveName, useProfile } from '../progress/profile-store'
import { hasNewProgress, moodOf, parseSeen } from '../progress/readiness'
import {
  firstTryRate,
  fixedCount,
  groupMistakes,
  pathProgress,
  pathSegments,
  percent,
  recentDays,
} from '../progress/status'
import { BadgeShelf } from '../rewards/BadgeShelf'
import { badgeOf } from '../rewards/badges'
import { Emblem } from '../rewards/Emblem'
import { NextBadge } from '../rewards/NextBadge'
import { Expander } from '../ui/Expander'
import { ChevronRight, GearIcon } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { RollNumber } from '../ui/RollNumber'
import { Screen } from '../ui/Screen'
import { PressLink } from './PressLink'
import './me.css'

/** Lessons done when Sen was last on show; the duo reacts when there are more now. */
const SEEN_KEY = 'dizey.me.seen'

export function MeView() {
  return (
    <Screen
      title={strings.me.title}
      measure="stage"
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
      <div className="me-page">
        <Scene />
        <ProfileStatus />
        {/* "What to do": under 1024 px these two sit in the page; from 1024 px they are the stage's side column. */}
        <div className="me-aside" data-testid="me-aside">
          <MistakeLog />
          <NextBadge />
        </div>
        <BadgeShelf />
        <SecretMoments />
      </div>
    </Screen>
  )
}

/** Mırtis's reaction for the profile's progress mood: a glad bounce when there is something new to be glad about. */
function catMood(mood: ReturnType<typeof moodOf>): MirtisMood {
  return mood === 'proud' || mood === 'happy' ? 'happy' : 'rest'
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
  const duo = useRef<MirtisHandle>(null)
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
      if (hasNewProgress(count, seen)) duo.current?.react(catMood(current))
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
        <Pressable
          className="me-avatar__tap"
          aria-label={strings.me.petLabel}
          onClick={() => duo.current?.react('purr')}
        >
          <Mirtis ref={duo} size="profile" />
        </Pressable>
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
 * Durumun: one card. The hero is the Vize 1 readiness (lessons done of all on the path) over a segmented path bar,
 * one segment per lesson grouped by chapter; under a hairline sit three honest figures. Nothing here is invented:
 * with nothing studied it reads 0 %, a dash and an empty strip.
 */
function ProfileStatus() {
  const records = useLessonRecords()
  const { outcomes, history, chapters: tested } = useExam()
  const recorded = useActivityDays()
  const stats = profileStats({ records, history, outcomes, chapters: tested, recorded })
  const { done, total } = pathProgress(records, chapters)
  const segments = pathSegments(records, chapters)
  const rate = firstTryRate(records)
  const active = activityDays({ recorded, records, history, outcomes, chapters: tested })
  const strip = recentDays(active, new Date())
  const text = strings.me.stats
  return (
    <section aria-labelledby="status" className="me-status-block">
      <h2 id="status" className="dz-section-label">
        {strings.me.status}
      </h2>
      <div className="dz-card me-status" data-testid="me-status">
        <div className="me-status__hero" data-testid="status-readiness" data-zero={done === 0 || undefined}>
          <b className="me-status__big num">
            <RollNumber value={percent(done, total)} />
            <span className="me-status__unit">%</span>
          </b>
          <span className="me-status__caption">{strings.me.statusReadiness(done, total)}</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={strings.me.statusPathLabel(done, total)}
          aria-label={strings.me.statusReadiness(done, total)}
          data-testid="status-path"
        >
          <ul className="me-path">
            {segments.map((chapter) => (
              <li key={chapter.id} className="me-path__chapter" style={{ flexGrow: chapter.fills.length }}>
                {chapter.fills.map((fill, index) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: a chapter's lessons have a fixed order
                    key={index}
                    className="me-path__seg"
                    data-fill={fill || undefined}
                  />
                ))}
              </li>
            ))}
          </ul>
        </div>
        <div className="me-figures">
          <div className="me-figure" data-testid="status-firsttry">
            <b className="me-figure__n num" data-zero={!rate.percent || undefined}>
              {rate.percent === null ? (
                '–'
              ) : (
                <>
                  <RollNumber value={rate.percent} />
                  <span className="me-figure__unit">%</span>
                </>
              )}
            </b>
            <span className="me-figure__l">{text.firstTry}</span>
          </div>
          <div className="me-figure" data-testid="status-days">
            <b className="me-figure__n num" data-zero={stats.days === 0 || undefined}>
              <RollNumber value={stats.days} />
            </b>
            <span className="me-figure__l">{text.days}</span>
            <ul
              className="me-strip"
              role="img"
              aria-label={strings.me.daysStripLabel(strip.filter((day) => day.active).length)}
              data-testid="status-strip"
            >
              {strip.map((day) => (
                <li key={day.key} className="me-strip__day" data-active={day.active || undefined} />
              ))}
            </ul>
          </div>
          <div className="me-figure" data-testid="status-fixed">
            <b className="me-figure__n num" data-zero={stats.fixed === 0 || undefined}>
              <RollNumber value={stats.fixed} />
            </b>
            <span className="me-figure__l">{text.fixed}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Gizli anlar: only the moments found so far, each as its emblem, with the count of all of them in the label. Hidden
 * until the first one is found (nothing is drawn as a hole). Nothing here presses.
 */
function SecretMoments() {
  const moments = useMoments()
  const withMoment = lessons.filter((lesson) => lesson.moment)
  const found = withMoment.filter((lesson) => moments[lesson.id] === 'solved')
  if (!withMoment.length || !found.length) return null
  return (
    <section aria-labelledby="moments" className="me-moments" data-testid="moments-album">
      <h2 id="moments" className="dz-section-label">
        {strings.me.moments}
        {` · ${strings.me.momentsCount(found.length, withMoment.length)}`}
      </h2>
      <ul className="me-moments__list">
        {found.map((lesson) => (
          <li
            key={lesson.id}
            className="me-moments__slot"
            role="img"
            aria-label={strings.me.momentFound(pathCode(lesson))}
          >
            <Emblem badge={badgeOf('insight')} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The chevron turns through the engine (--on 0..1), never in one frame; it starts in place on first render. */
function Turn({ open }: { open: boolean }) {
  const root = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    if (!placed.current) {
      placed.current = true
      engine.set(el, { '--on': open ? 1 : 0 })
      return
    }
    engine.withChannel('chrome', () => engine.to(el, { '--on': open ? 1 : 0 }, 'snap', { effect: true }))
  }, [open])
  return (
    <span ref={root} className="me-mistakes__chevron me-group__chevron">
      <ChevronRight />
    </span>
  )
}

/**
 * Hata defteri: open mistakes grouped by lesson. One group is open at a time; its mistakes grow out of the row
 * through the Expander. With nothing open but something fixed it is one calm line; with no history it is hidden.
 */
function MistakeLog() {
  const records = useLessonRecords()
  const { outcomes } = useExam()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const list = openMistakes(lessons, records, questions, outcomes)
  const fixed = fixedCount(records)
  if (!list.length && !fixed) return null
  const groups = groupMistakes(list)
  return (
    <section aria-labelledby="mistakes" className="me-mistakes">
      <h2 id="mistakes" className="dz-section-label">
        {strings.me.mistakes}
        {list.length ? ` · ${strings.me.mistakesOpen(list.length)}` : ''}
      </h2>
      {list.length ? (
        <ul className="me-groups" data-testid="mistake-groups">
          {groups.map((group) => {
            const open = openKey === group.key
            const title = group.lessonId
              ? (lessons.find((lesson) => lesson.id === group.lessonId)?.title ?? group.node)
              : strings.me.mistakeExamGroup
            const code = codeOfNode(group.node)
            const bodyId = `mistakes-${group.key.replace(/[^a-z0-9-]/gi, '-')}`
            return (
              <li key={group.key} className="me-group" data-open={open || undefined}>
                <Pressable
                  className="me-row me-group__row"
                  aria-expanded={open}
                  aria-controls={bodyId}
                  aria-label={strings.me.mistakeGroupLabel(code, title, group.mistakes.length)}
                  data-testid="mistake-group"
                  onClick={() => setOpenKey(open ? null : group.key)}
                >
                  <span className="me-group__code num">{code}</span>
                  <span className="me-group__title">{title}</span>
                  <span className="me-group__count num">{group.mistakes.length}</span>
                  <Turn open={open} />
                </Pressable>
                <Expander open={open} id={bodyId}>
                  <ul className="me-group__list">
                    {group.mistakes.map((mistake) => (
                      <li
                        key={
                          mistake.source === 'lesson'
                            ? `${mistake.lessonId}:${mistake.stepId}`
                            : mistake.questionId
                        }
                        className="me-mistake"
                        data-testid="mistake-item"
                      >
                        <span className="me-mistake__text">
                          <b>
                            {mistake.source === 'lesson' ? (
                              <RichText text={mistake.title} />
                            ) : (
                              strings.me.mistakeExam
                            )}
                          </b>
                          <RichText text={mistake.text} />
                        </span>
                        {mistake.source === 'lesson' ? (
                          <PressLink
                            to="/lesson/$id"
                            params={{ id: mistake.lessonId }}
                            search={{ step: mistake.stepId }}
                            className="me-mistake__retry"
                          >
                            {strings.me.mistakeRetry}
                          </PressLink>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Expander>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="me-calm" data-testid="mistakes-calm">
          {strings.me.mistakesNone(fixed)}
        </p>
      )}
    </section>
  )
}
