import { useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Lesson } from '../content/lessons/types'
import { chapterOf, examItemTotal, pathCode } from '../content/path'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { VelocityTracker } from '../engine/gesture'
import { CHOREO, PRESS } from '../engine/tokens'
import { RichText } from '../exam/Blocks'
import { isQuestion, resumeIndex } from '../lesson/progress'
import { stateOf } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { playSound } from '../sound/player'
import { clipWith, faceOf, insets } from './morph'
import { PressLink } from './PressLink'
import { morphFrom, stageRef } from './stage'
import './lesson-peek.css'

export type Peek = { lesson: Lesson; tile: HTMLElement }

/** How far a downward drag (px) or how fast a flick (px/s) closes the card. */
export const DISMISS = { distance: 90, speed: 600 } as const

/** Runs `read` with the map behind at rest, so a tile is measured where it will come to rest. */
function atRest<T>(read: () => T): T {
  const stage = stageRef.current
  const saved = stage?.style.transform ?? ''
  if (stage) stage.style.transform = ''
  try {
    return read()
  } finally {
    if (stage) stage.style.transform = saved
  }
}

/**
 * A lesson's card. The tapped tile lifts out of the path and opens into a larger card in the thumb's
 * reach; closing it (a tap outside, a drag down, Escape) folds it back into the same tile. Entering the
 * lesson grows the lesson out of this card, and leaving the lesson shrinks it back into the tile, so
 * tile, card and lesson read as one object at three sizes (decision 0011).
 */
export function LessonPeek({ peek, onClose }: { peek: Peek | null; onClose: () => void }) {
  const [shown, setShown] = useState<Peek | null>(peek)
  if (peek && peek !== shown) setShown(peek)
  const surface = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const scrim = useRef<HTMLDivElement>(null)
  const closing = useRef(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const records = useLessonRecords()

  // Open: out of the tile.
  useLayoutEffect(() => {
    const el = surface.current
    const body = content.current
    if (!shown || !el || !body) return
    closing.current = false
    const tile = shown.tile
    const radius = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
    clipWith(el)
    el.style.opacity = ''
    if (engine.reducedMotion) {
      // Reduced motion: nothing grows out of the tile (a clip would land in one frame); the card fades in
      // where it rests, over the dimming map.
      engine.set(el, { t: 0, r: 0, b: 0, l: 0, rad: radius, y: 0 })
      engine.set(body, { opacity: 1, y: 0 })
      if (scrim.current) engine.set(scrim.current, { opacity: 0 })
      playSound('open')
      engine.withChannel('chrome', () => {
        fadeSurface(el, 0, 1)
        if (scrim.current) engine.to(scrim.current, { opacity: CHOREO.sheetScrim }, 'fade')
      })
      return () => {
        tile.style.visibility = ''
      }
    }
    // A card opened while the last one is still folding measures its tile with the map at rest.
    const { start, face } = atRest(() => ({ start: insets(el, tile), face: faceOf(el, tile) }))
    engine.set(el, { ...start, y: 0 })
    engine.set(face, { opacity: 1 })
    engine.set(body, { opacity: 0, y: CHOREO.rise })
    if (scrim.current) engine.set(scrim.current, { opacity: 0 })
    tile.style.visibility = 'hidden'
    playSound('open')
    const stage = stageRef.current
    engine.withChannel('chrome', () => {
      // The map behind recedes as one layer; the scrim does the dimming.
      // Under reduced motion the map only dims: a scale would land in one frame.
      if (stage && !engine.reducedMotion) engine.to(stage, { scale: CHOREO.sheetRecede }, 'page')
      engine.to(el, { t: 0, r: 0, b: 0, l: 0, rad: radius }, 'page', { launch: 0.4 })
      engine.to(face, { opacity: 0 }, 'fade', { onArrive: () => face.remove() })
      if (scrim.current) engine.to(scrim.current, { opacity: CHOREO.sheetScrim }, 'fade')
      engine.after(90, () => engine.to(body, { opacity: 1, y: 0 }, 'glide'))
    })
    el.focus({ preventScroll: true })
    return () => {
      tile.style.visibility = ''
    }
  }, [shown])

  // Close: back into the tile, from wherever a drag left the card.
  useEffect(() => {
    const el = surface.current
    const body = content.current
    if (peek || !shown || !el || !body || closing.current) return
    closing.current = true
    const tile = shown.tile
    if (engine.reducedMotion) {
      playSound('close')
      engine.withChannel('chrome', () => {
        if (scrim.current) engine.to(scrim.current, { opacity: 0 }, 'fade')
        fadeSurface(el, 1, 0, () => {
          tile.style.visibility = ''
          setShown((current) => (current === shown ? null : current))
        })
      })
      return
    }
    const lift = engine.value(el, 'y')
    // The tile is measured where it will come to rest: the map behind is still receded.
    const stage = stageRef.current
    const { target, face } = atRest(() => ({ target: insets(el, tile), face: faceOf(el, tile) }))
    target.t += lift
    target.b -= lift
    engine.set(face, { opacity: 0, y: -lift })
    playSound('close')
    engine.withChannel('chrome', () => {
      engine.to(body, { opacity: 0 }, 'fade')
      engine.to(face, { opacity: 1 }, 'fade')
      if (scrim.current) engine.to(scrim.current, { opacity: 0 }, 'fade')
      engine.to(el, { ...target, y: 0 }, 'page', {
        onArrive: () => {
          // A card opened again while this one was still folding must not be taken down with it.
          tile.style.visibility = ''
          setShown((current) => (current === shown ? null : current))
        },
      })
      engine.to(face, { y: 0 }, 'page')
      if (stage) engine.to(stage, { scale: 1 }, 'page')
    })
  }, [peek, shown])

  // Into the lesson: the route has grown out of the card, so the card steps aside at once and the
  // tile becomes what the lesson shrinks back into.
  useEffect(() => {
    if (!shown || !pathname.startsWith('/lesson')) return
    closing.current = true
    shown.tile.style.visibility = ''
    morphFrom.current = shown.tile
    setShown(null)
    closeRef.current()
  }, [pathname, shown])

  // Drag down to close; anything short of that springs back.
  useEffect(() => {
    const el = surface.current
    if (!shown || !el) return
    const tracker = new VelocityTracker()
    let pointer: number | null = null
    let startY = 0
    let dragging = false
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || closing.current) return
      pointer = e.pointerId
      startY = e.clientY
      dragging = false
      tracker.reset()
      tracker.add(e.timeStamp, 0, e.clientY)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      tracker.add(e.timeStamp, 0, e.clientY)
      const dy = e.clientY - startY
      if (!dragging && Math.abs(dy) > PRESS.slop) {
        dragging = true
        el.setPointerCapture(e.pointerId)
      }
      // Down follows the finger; up resists, the card has nowhere to go.
      if (dragging) engine.set(el, { y: dy > 0 ? dy : -Math.sqrt(-dy) * 2 })
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      pointer = null
      if (!dragging) return
      dragging = false
      const vy = tracker.velocity(e.timeStamp).y
      if (engine.value(el, 'y') > DISMISS.distance || vy > DISMISS.speed) closeRef.current()
      else engine.withChannel('chrome', () => engine.to(el, { y: 0 }, 'glide', { velocity: { y: vy } }))
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('keydown', key)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('keydown', key)
    }
  }, [shown])

  if (!shown) return null
  return (
    <>
      <div ref={scrim} className="dz-scrim lp-scrim" onClick={() => closeRef.current()} aria-hidden="true" />
      <div
        ref={surface}
        className="lp"
        role="dialog"
        aria-modal="true"
        aria-label={shown.lesson.title}
        tabIndex={-1}
        data-state={stateOf(records[shown.lesson.id])}
        data-testid="lesson-peek"
      >
        <div ref={content} className="lp__body">
          <PeekBody
            lesson={shown.lesson}
            onEnter={() => {
              morphFrom.current = surface.current
            }}
          />
        </div>
      </div>
    </>
  )
}

/** A lesson's card content: its head, how it opens, its shape and the way in. One component for the phone's sheet and the wide screen's card. */
export function PeekBody({ lesson, onEnter }: { lesson: Lesson; onEnter: () => void }) {
  const records = useLessonRecords()
  const record = records[lesson.id]
  const state = stateOf(record)
  const total = lesson.steps.length
  const asks = lesson.steps.filter(isQuestion).length
  const chapter = chapterOf(lesson)
  const first = lesson.steps[0]
  const opening = first && 'title' in first ? first.title : null
  const reached = state === 'done' ? total : state === 'current' && record ? resumeIndex(lesson, record) : 0
  const action =
    state === 'done'
      ? strings.sheet.review(lesson.title)
      : state === 'current'
        ? strings.sheet.resume(lesson.title)
        : strings.sheet.enter(lesson.title)
  return (
    <>
      <div className="lp__head">
        <h2 className="dz-title1 lp__title">
          <span className="lp__code num">{pathCode(lesson)}</span> {lesson.title}
        </h2>
        <span className="lp__state" data-state={state}>
          {state === 'current' && record
            ? strings.sheet.resumeAt(resumeIndex(lesson, record) + 1, total)
            : strings.path.state[state]}
        </span>
      </div>
      {opening ? (
        <p className="lp__opens">
          <span className="dz-footnote">{strings.path.opensWith}</span>
          <span className="lp__opens-line">
            <RichText text={opening} />
          </span>
        </p>
      ) : null}
      <div className="lp__shape">
        {/* The lesson's shape as a row vector: one entry per step, questions taller. */}
        <span className="lp__steps" role="img" aria-label={strings.sheet.steps(reached, total)}>
          {lesson.steps.map((step, index) => (
            <i
              // biome-ignore lint/suspicious/noArrayIndexKey: steps are a fixed sequence; the order is the identity
              key={index}
              data-ask={isQuestion(step) ? '' : undefined}
              data-done={index < reached ? '' : undefined}
            />
          ))}
        </span>
        <span className="dz-footnote lp__size">{strings.path.lessonSize(total, asks)}</span>
      </div>
      {chapter ? (
        <p className="dz-footnote lp__weight">
          {strings.sheet.chapterNote(
            chapter.label,
            chapter.examItems,
            chapter.examItems ? examItemTotal : undefined,
          )}
        </p>
      ) : null}
      <PressLink
        to="/lesson/$id"
        params={{ id: lesson.id }}
        className="dz-button"
        data-kind="primary"
        data-wide=""
        aria-label={action}
        onClick={onEnter}
      >
        {action.split(':')[0]}
      </PressLink>
    </>
  )
}

/** The card's own opacity, through a stand-in target: the card's engine state already draws its clip. */
function fadeSurface(el: HTMLElement, from: number, to: number, onArrive?: () => void) {
  const fader = {}
  engine.bind(fader, (v) => {
    el.style.opacity = String(v.opacity ?? 1)
  })
  el.style.opacity = String(from)
  engine.set(fader, { opacity: from })
  engine.to(fader, { opacity: to }, 'fade', { onArrive: () => onArrive?.() })
}
