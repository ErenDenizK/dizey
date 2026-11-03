import { useNavigate } from '@tanstack/react-router'
import { useLayoutEffect, useRef, useState } from 'react'
import { flight } from '../character/flight'
import { Mirtis, type MirtisHandle } from '../character/Mirtis'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { chapterOf, chapters } from '../content/path'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { useExam } from '../exam/store'
import { BadgeReveal, landReveal, REVEAL_MS } from '../rewards/BadgeReveal'
import { type Badge, earnedBadges } from '../rewards/badges'
import { markShown, unshown } from '../rewards/store'
import { PressLink } from '../shell/PressLink'
import { returnTab } from '../shell/stage'
import type { SoundEvent } from '../sound/score'
import { Check, Close } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { burst, glow, lightScore, pointIn, SHINE_CHANNEL, type SparkTone, sweep } from '../ui/shine'
import { ExamAsked, examQuestionFor } from './ExamAsked'
import { endResults, nextLesson, type Result, sealColumns } from './end'
import { useMoments } from './moments'
import { greetsOnOpen } from './progress'
import { recordOf, useLessonRecords } from './store'

const END_CHANNEL = 'lesson-end'
/** Old lesson-end timing (inventory 8.4): cells from 210 ms, one every 80 ms; brackets close 105 ms later. */
const END_MS = { cellsFrom: 210, cellStagger: 80, closeAfter: 105 } as const
/** Brackets start this far open (old --seal-gap). */
const SEAL_GAP = 14
/** New rozetler wait at least this long after the seal closes (the duo's cheer plays out), then one every badgeEvery(). */
const BADGE_AFTER_MIN = 1100
const BADGE_EVERY_MIN = 2600
/** A rozet's seal sound plays no sooner than this after the reward cue's home chord, and no sooner than its own end plus this (decision 0019). */
const SOUND_GAP_MS = { afterHome: 1000, afterSeal: 600 } as const
/** At most this many rozet moments at one lesson end; the rest wait on Profil with their spark dot. */
const BADGE_MAX = 3

const rewardKind = (reward: SoundEvent) =>
  reward === 'halfway' || reward === 'milestone' ? reward : 'lessonEnd'

/**
 * The first rozet comes after the reward cue has landed its home chord and rung for a second, so its own seal sound
 * never talks over the reward. The rozet's sound plays tileFrom + closeAfter after the rozet appears (BadgeReveal).
 */
function badgeAfter(reward: SoundEvent) {
  const home = (lightScore(rewardKind(reward)).chords.at(-1) ?? 0) * 1000
  const soundDelay = REVEAL_MS.tileFrom + REVEAL_MS.closeAfter
  return Math.max(BADGE_AFTER_MIN, Math.ceil(home + SOUND_GAP_MS.afterHome - soundDelay))
}

/**
 * One rozet after another, never closer than the rozet seal sound's body plus a breath. The body is the seal cue up to
 * 1.2 s past its home chord; the quiet room tail after it (decision 0020) may ring under the next rozet's seal.
 */
const SEAL_BODY_AFTER_HOME_MS = 1200
const badgeEvery = () => {
  const home = (lightScore('seal').chords.at(-1) ?? 0) * 1000
  return Math.max(BADGE_EVERY_MIN, Math.ceil(home + SEAL_BODY_AFTER_HOME_MS + SOUND_GAP_MS.afterSeal))
}

/**
 * The lesson end (old feel-layer end screen, inventory 8): the Satır and Sütun duo above a "Cevapların" seal, one
 * cell per question in lesson order, filled by the first try. When the brackets close the lesson's reward sounds and
 * the duo hops. Then the next lesson or back to the path.
 */
export function LessonEnd({
  lesson,
  reward,
  insight = false,
  onSealed,
}: {
  lesson: Lesson
  reward: SoundEvent
  /** The gizli an was solved on this visit. */
  insight?: boolean
  onSealed: () => void
}) {
  const navigate = useNavigate()
  const results = endResults(lesson, recordOf(lesson.id))
  const next = nextLesson(lesson, chapters, lessons)
  const chapter = chapterOf(lesson)
  const chapterDone = Boolean(
    chapter?.lessons.every((other) => other === lesson || recordOf(other.id).doneAt !== null),
  )
  const correct = results.filter((result) => result === 'right').length
  const perfect = results.length > 0 && correct === results.length
  const cols = sealColumns(results.length)
  const asked = examQuestionFor(lesson.node)

  const root = useRef<HTMLDivElement>(null)
  const duo = useRef<MirtisHandle>(null)
  const records = useLessonRecords()
  const { history } = useExam()
  const moments = useMoments()
  // Rozetler this lesson end will show, fixed when the screen opens.
  const [fresh] = useState<Badge[]>(() =>
    unshown(earnedBadges({ records, history, moments })).slice(0, BADGE_MAX),
  )
  const [badge, setBadge] = useState<Badge | null>(null)
  // The hero steps back while a rozet shows: --badge (0..1) glides on the engine, the CSS turns it into the width.
  const stage = useRef<HTMLDivElement>(null)
  const shown = badge !== null
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const goal = shown ? 1 : 0
    if (engine.value(el, '--badge') === goal) return
    engine.withChannel(END_CHANNEL, () => engine.to(el, { '--badge': goal }, 'glide', { effect: true }))
  }, [shown])
  // She arrives from the verdict's perch (a flight, flight.ts) when the last answer left one in the air; she lands in
  // the hero's place and plays proud there. Otherwise the seal's closing makes her cheer, as before.
  const flown = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: decided once, when the screen opens
  useLayoutEffect(() => {
    flown.current ||= flight.holding() && flight.land('hero', 'proud')
  }, [])
  // biome-ignore lint/correctness/useExhaustiveDependencies: the ceremony plays once, when the screen opens
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const cells = [...el.querySelectorAll<HTMLElement>('.ls-seal__cell')]
    const [left, right] = [...el.querySelectorAll<HTMLElement>('.ls-seal__br')]
    const enter = [...el.querySelectorAll<HTMLElement>('[data-enter]')]
    const late = [...el.querySelectorAll<HTMLElement>('[data-late]')]
    for (const cell of cells) engine.set(cell, { scale: 0.55, opacity: 0 })
    if (left && right) {
      engine.set(left, { x: -SEAL_GAP, opacity: 0 })
      engine.set(right, { x: SEAL_GAP, opacity: 0 })
    }
    for (const item of [...enter, ...late]) engine.set(item, { y: 12, opacity: 0 })
    const sealed = () => {
      onSealed()
      hop()
      // The exam challenge springs in once the seal has settled.
      for (const item of late) engine.to(item, { y: 0, opacity: 1 }, 'move')
      celebrate(el, reward, perfect)
    }
    // The duo watches the cells fill, then cheers when the brackets close.
    const hop = () => {
      if (!flown.current) duo.current?.react('proud')
      // Then each new rozet takes the seal's place; it counts as shown once it is on screen.
      for (const [at, next] of fresh.entries()) {
        engine.after(badgeAfter(reward) + at * badgeEvery(), () => {
          markShown([next.id], Date.now())
          // The seal fades before the rozet takes its place, instead of vanishing in one frame.
          const seal = el.querySelector<HTMLElement>('.ls-seal')
          if (at === 0 && seal) engine.to(seal, { opacity: 0 }, 'leave', { onArrive: () => setBadge(next) })
          else setBadge(next)
        })
      }
    }
    engine.withChannel(END_CHANNEL, () => {
      for (const [at, item] of enter.entries()) {
        engine.after(at * 35, () => engine.to(item, { y: 0, opacity: 1 }, 'move'))
      }
      for (const [at, cell] of cells.entries()) {
        engine.after(END_MS.cellsFrom + at * END_MS.cellStagger, () => {
          engine.to(cell, { scale: 1, opacity: 1 }, 'land')
        })
      }
      const close = END_MS.cellsFrom + cells.length * END_MS.cellStagger + END_MS.closeAfter
      if (left && right) {
        engine.after(close, () => {
          engine.to(left, { x: 0, opacity: 1 }, 'move')
          engine.to(right, { x: 0, opacity: 1 }, 'move', { onArrive: sealed })
        })
      } else {
        engine.after(END_MS.cellsFrom, sealed)
      }
    })
    return () => {
      engine.cancelCues(END_CHANNEL)
      engine.finishChannel(END_CHANNEL)
      engine.cancelCues(SHINE_CHANNEL)
      engine.finishChannel(SHINE_CHANNEL)
    }
  }, [])

  // A tap on the scene lands the whole ceremony at once (old 8603).
  const toDock = () => {
    if (returnTab.current === '/') flight.go('hero', 'dock', 'happy')
  }
  const land = () => {
    landReveal()
    engine.finishChannel(END_CHANNEL)
  }

  return (
    <div ref={root} className="ls-end" data-testid="lesson-end">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the tap only skips motion; nothing is lost without it */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: as above */}
      <div ref={stage} className="ls-end__stage" data-badge={badge ? '' : undefined} onClick={land}>
        <i className="ls-end__halo" aria-hidden="true" />
        <Mirtis ref={duo} size="hero" className="ls-duo" anchor="hero" />
        {badge ? (
          <BadgeReveal key={badge.id} badge={badge} onClosed={() => duo.current?.react('wow')} />
        ) : null}
        {results.length ? (
          <div className="ls-seal" hidden={Boolean(badge)} style={{ '--cols': cols } as React.CSSProperties}>
            <span className="ls-seal__name">{strings.lessonEnd.sealName}</span>
            <div
              className="ls-seal__grid"
              role="img"
              aria-label={strings.lessonEnd.sealLabel(correct, results.length)}
            >
              <i className="ls-seal__br ls-seal__br--l" />
              {results.map((result, at) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: one cell per question, in lesson order
                <span key={at} className="ls-seal__cell" data-result={result}>
                  <ResultGlyph result={result} />
                </span>
              ))}
              <i className="ls-seal__br ls-seal__br--r" />
            </div>
          </div>
        ) : null}
        <div className="fx-layer" aria-hidden="true" />
      </div>

      <div className="ls-end__narr">
        <h1 className="ls-title" data-enter="">
          {chapterDone && chapter
            ? strings.lessonEnd.chapterTitle(chapter.label)
            : insight
              ? strings.lessonEnd.momentTitle
              : strings.lessonEnd.title}
        </h1>
        <p className="ls-body ls-end__line" data-enter="">
          {results.length ? strings.lessonEnd.score(correct, results.length) : strings.lessonEnd.noQuestions}
          {chapterDone && chapter?.examItems ? ` ${strings.lessonEnd.chapterWeight(chapter.examItems)}` : ''}
        </p>
        {asked ? <ExamAsked question={asked} /> : null}
      </div>

      <div className="ls-dock ls-end__dock" data-enter="">
        {next ? (
          <>
            <Pressable
              className="dz-button ls-end__next"
              data-kind="primary"
              data-wide=""
              onClick={() => {
                // If the next lesson greets her, she flies there from the hero; otherwise nothing flies.
                if (greetsOnOpen(next, recordOf(next.id))) flight.depart('hero')
                void navigate({ to: '/lesson/$id', params: { id: next.id } })
              }}
            >
              <span className="ls-end__next-label">{strings.lessonEnd.next(next.title)}</span>
            </Pressable>
            <PressLink to={returnTab.current} className="dz-text-button" data-sound="close" onClick={toDock}>
              {strings.lessonEnd.back}
            </PressLink>
          </>
        ) : (
          <PressLink
            to={returnTab.current}
            className="dz-button"
            data-kind="primary"
            data-wide=""
            data-sound="close"
            onClick={toDock}
          >
            {strings.lessonEnd.back}
          </PressLink>
        )}
      </div>
    </div>
  )
}

/**
 * How much light each ending earns (motion law 6: rarity sets the budget). Every ending lights its right cells and
 * the card on the last chord; a perfect lesson adds a burst from the seal; half the path adds sparks on the arpeggio;
 * a finished chapter adds both, wider, and leaves the card warm.
 */
const LIGHT: Record<
  'lessonEnd' | 'halfway' | 'milestone',
  { peak: number; burst: number; trail: number; rest: number }
> = {
  lessonEnd: { peak: 0.7, burst: 0, trail: 0, rest: 0 },
  halfway: { peak: 0.9, burst: 12, trail: 2, rest: 0.18 },
  milestone: { peak: 1, burst: 16, trail: 3, rest: 0.24 },
}
const PERFECT_BURST = 10
const TONES: Record<keyof typeof LIGHT, readonly SparkTone[]> = {
  lessonEnd: ['spark', 'ok'],
  halfway: ['spark', 'action'],
  milestone: ['spark', 'action', 'ok'],
}
/** Right cells catch the light one after another, left to right, this far apart (ms). */
const GLINT_STAGGER = 70

/**
 * The seal's light, timed to the reward's own chords (lightScore): the card warms a little on each chord before the
 * last, sparks rise along an arc on each arpeggio note, and on the home chord the card glows, the right cells glint
 * left to right and the burst leaves the seal. Runs on its own channel: a tap that lands the ceremony leaves the
 * light playing with the music.
 */
function celebrate(root: HTMLElement, reward: SoundEvent, perfect: boolean) {
  const kind = rewardKind(reward)
  const light = LIGHT[kind]
  const halo = root.querySelector<HTMLElement>('.ls-end__halo')
  const layer = root.querySelector<HTMLElement>('.fx-layer')
  const duo = root.querySelector<HTMLElement>('.ls-duo')
  const grid = root.querySelector<HTMLElement>('.ls-seal__grid')
  const rights = [...root.querySelectorAll<HTMLElement>('.ls-seal__cell[data-result="right"]')]
  if (!halo || !layer) return
  const score = lightScore(kind)
  const home = (score.chords[score.chords.length - 1] ?? 0) * 1000
  const lead = score.chords.slice(0, -1)
  engine.withChannel(SHINE_CHANNEL, () => {
    for (const [at, chord] of lead.entries()) {
      engine.after(chord * 1000, () => glow(halo, 0.22 + (0.16 * (at + 1)) / lead.length))
    }
    // The arpeggio climbs, so its sparks climb: an arc over the duo from lower left to upper right.
    if (light.trail && duo) {
      const count = score.shines.length
      for (const [at, shine] of score.shines.entries()) {
        engine.after(shine * 1000, () => {
          const t = count > 1 ? at / (count - 1) : 0.5
          const p = pointIn(layer, duo, 0.05 + t * 0.9, 0.85 - Math.sin(t * Math.PI) * 0.75 - t * 0.2)
          burst(layer, p.x, p.y, {
            count: light.trail,
            speed: 70,
            size: 14,
            seed: 11 + at,
            tones: TONES[kind],
          })
        })
      }
    }
    engine.after(home, () => {
      glow(halo, light.peak, perfect ? Math.max(light.rest, 0.14) : light.rest)
      if (duo && kind !== 'lessonEnd') glow(duo, 1)
      for (const [at, cell] of rights.entries()) {
        engine.after(at * GLINT_STAGGER, () => {
          glow(cell, 1)
          sweep(cell)
        })
      }
      const count = light.burst || (perfect ? PERFECT_BURST : 0)
      if (count && grid) {
        const from = pointIn(layer, grid, 0.5, 0.35)
        burst(layer, from.x, from.y, {
          count,
          speed: kind === 'milestone' ? 260 : 210,
          seed: 3,
          tones: TONES[kind],
        })
        if (kind === 'milestone') {
          for (const [side, fx] of [0, 1].entries()) {
            const corner = pointIn(layer, grid, fx, 0)
            burst(layer, corner.x, corner.y, {
              count: 6,
              speed: 170,
              aim: side ? -60 : -120,
              spread: 100,
              size: 13,
              seed: 7 + side,
              tones: TONES[kind],
            })
          }
        }
      }
    })
  })
}

function ResultGlyph({ result }: { result: Result }) {
  if (result === 'right') return <Check />
  if (result === 'miss') return <Close />
  return <span aria-hidden="true">–</span>
}
