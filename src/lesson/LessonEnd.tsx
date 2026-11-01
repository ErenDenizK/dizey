import { Link, useNavigate } from '@tanstack/react-router'
import { useLayoutEffect, useRef, useState } from 'react'
import { Duo, type DuoHandle } from '../character/Duo'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { chapterOf, chapters, pathCode } from '../content/path'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { useExam } from '../exam/store'
import { BadgeReveal, landReveal } from '../rewards/BadgeReveal'
import { type Badge, earnedBadges } from '../rewards/badges'
import { markShown, unshown } from '../rewards/store'
import { returnTab } from '../shell/stage'
import type { SoundEvent } from '../sound/score'
import { Check, Close } from '../ui/icons'
import { burst, glow, lightScore, pointIn, SHINE_CHANNEL, type SparkTone, sweep } from '../ui/shine'
import { endResults, nextLesson, type Result, sealColumns } from './end'
import { recordOf, useLessonRecords } from './store'

const END_CHANNEL = 'lesson-end'
/** Old lesson-end timing (inventory 8.4): cells from 210 ms, one every 80 ms; brackets close 105 ms later. */
const END_MS = { cellsFrom: 210, cellStagger: 80, closeAfter: 105 } as const
/** Brackets start this far open (old --seal-gap). */
const SEAL_GAP = 14
/** New rozetler wait this long after the seal closes (the duo's cheer plays out), then one every BADGE_EVERY. */
const BADGE_AFTER = 1100
const BADGE_EVERY = 2600
/** At most this many rozet moments at one lesson end; the rest wait on Profil with their spark dot. */
const BADGE_MAX = 3

/**
 * The lesson end (old feel-layer end screen, inventory 8): the Satır and Sütun duo above a "Cevapların" seal, one
 * cell per question in lesson order, filled by the first try. When the brackets close the lesson's reward sounds and
 * the duo hops. Then the next lesson or back to the path.
 */
export function LessonEnd({
  lesson,
  reward,
  onSealed,
}: {
  lesson: Lesson
  reward: SoundEvent
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

  const root = useRef<HTMLDivElement>(null)
  const duo = useRef<DuoHandle>(null)
  const records = useLessonRecords()
  const { history } = useExam()
  // Rozetler this lesson end will show, fixed when the screen opens.
  const [fresh] = useState<Badge[]>(() => unshown(earnedBadges({ records, history })).slice(0, BADGE_MAX))
  const [badge, setBadge] = useState<Badge | null>(null)
  const proud = chapterDone || perfect
  // biome-ignore lint/correctness/useExhaustiveDependencies: the ceremony plays once, when the screen opens
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const cells = [...el.querySelectorAll<HTMLElement>('.ls-seal__cell')]
    const [left, right] = [...el.querySelectorAll<HTMLElement>('.ls-seal__br')]
    const enter = [...el.querySelectorAll<HTMLElement>('[data-enter]')]
    for (const cell of cells) engine.set(cell, { scale: 0.55, opacity: 0 })
    if (left && right) {
      engine.set(left, { x: -SEAL_GAP, opacity: 0 })
      engine.set(right, { x: SEAL_GAP, opacity: 0 })
    }
    for (const item of enter) engine.set(item, { y: 12, opacity: 0 })
    const sealed = () => {
      onSealed()
      hop()
      celebrate(el, reward, perfect)
    }
    // The duo watches the cells fill, then cheers when the brackets close.
    const hop = () => {
      duo.current?.look(0, 0)
      duo.current?.react(proud ? 'proud' : 'happy')
      // Then each new rozet takes the seal's place; it counts as shown once it is on screen.
      for (const [at, next] of fresh.entries()) {
        engine.after(BADGE_AFTER + at * BADGE_EVERY, () => {
          markShown([next.id], Date.now())
          setBadge(next)
        })
      }
    }
    if (cells.length) duo.current?.look(0, 1.6)
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
  const land = () => {
    landReveal()
    engine.finishChannel(END_CHANNEL)
  }

  return (
    <div ref={root} className="ls-end" data-testid="lesson-end">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the tap only skips motion; nothing is lost without it */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: as above */}
      <div className="ls-end__stage" onClick={land}>
        <i className="ls-end__halo" aria-hidden="true" />
        <Duo ref={duo} mood="neutral" className="ls-duo" />
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
        <p className="ls-eyebrow" data-enter="">
          {strings.lessonEnd.eyebrow(pathCode(lesson))}
        </p>
        <h1 className="ls-title" data-enter="">
          {chapterDone && chapter ? strings.lessonEnd.chapterTitle(chapter.label) : strings.lessonEnd.title}
        </h1>
        <p className="ls-body" data-enter="">
          {results.length ? strings.lessonEnd.score(correct, results.length) : strings.lessonEnd.noQuestions}
          {chapterDone && chapter?.examItems ? ` ${strings.lessonEnd.chapterWeight(chapter.examItems)}` : ''}
        </p>
      </div>

      <div className="ls-dock ls-end__dock" data-enter="">
        {next ? (
          <button
            type="button"
            className="sh-btn sh-btn--primary sh-press ls-end__next"
            onClick={() => void navigate({ to: '/lesson/$id', params: { id: next.id } })}
          >
            <span className="ls-end__next-kicker">{strings.lessonEnd.next(pathCode(next))}</span>
            <span className="ls-end__next-title">{next.title}</span>
          </button>
        ) : null}
        <Link
          to={returnTab.current}
          className={`sh-btn sh-press ${next ? 'sh-btn--soft' : 'sh-btn--primary'}`}
          data-sound="close"
        >
          {strings.lessonEnd.back}
        </Link>
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
  const kind = reward === 'halfway' || reward === 'milestone' ? reward : 'lessonEnd'
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
