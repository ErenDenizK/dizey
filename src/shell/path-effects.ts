import { useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { lessons } from '../content/lessons'
import { chapters } from '../content/path'
import { engine } from '../engine/driver'
import type { LessonRecord } from '../lesson/progress'
import { stateOf } from '../lesson/state'
import { burst, glow, ring } from '../ui/shine'
import { fadeOutWas, holdInk, holdTag, inkOf, raiseTag } from './morph'

type Records = Readonly<Record<string, LessonRecord>>

/**
 * A node whose state changes while it is on screen (becomes current, done, or loses the ring) does not swap:
 * the old fill crossfades out, and a new check fades in. While the node is hidden (a lesson folding into it)
 * the same parts wait for the aftermath in morph.ts.
 */
export function useStateChange(id: string, key: string) {
  const last = useRef<{ key: string; fill: string; ink: ReturnType<typeof inkOf> } | null>(null)
  useLayoutEffect(() => {
    const tile = document.querySelector<HTMLElement>(`.pa-tile[data-lesson="${id}"]`)
    if (!tile) return
    const before = last.current
    last.current = { key, fill: getComputedStyle(tile).backgroundColor, ink: inkOf(tile) }
    if (!before || before.key === key) return
    const hidden = tile.style.visibility === 'hidden'
    const was = document.createElement('span')
    was.className = 'pa-tile__was'
    was.style.background = before.fill
    tile.prepend(was)
    holdInk(tile, before.ink)
    for (const part of tile.querySelectorAll<HTMLElement>(':scope > .pa-tile__check')) {
      holdTag(part)
      if (!hidden) raiseTag(part)
    }
    if (hidden) return
    fadeOutWas(tile)
  }, [id, key])
}

/**
 * A lesson finished while the path was hidden behind it: once you are back on the path, its node lands
 * with a small settle and its tick draws itself in.
 */
export function useCelebrations(root: React.RefObject<HTMLElement | null>, records: Records) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const seen = useRef<Set<string> | null>(null)
  const pending = useRef<string[]>([])
  const done = lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').map((lesson) => lesson.id)
  const doneKey = done.join(',')

  useEffect(() => {
    const now = new Set(doneKey ? doneKey.split(',') : [])
    if (seen.current) for (const id of now) if (!seen.current.has(id)) pending.current.push(id)
    seen.current = now
  }, [doneKey])

  const onPath = (pathname.replace(/\/$/, '') || '/') === '/'
  useEffect(() => {
    if (!onPath || !pending.current.length) return
    const ids = pending.current.splice(0)
    const now = new Set(seen.current)
    // The new ticks stay hidden while the lesson closes, so the first one seen is the one that lands.
    for (const id of ids) {
      const check = root.current?.querySelector<SVGSVGElement>(
        `.pa-tile[data-lesson="${id}"] .pa-tile__check`,
      )
      if (check) engine.set(check, { scale: 0.3, opacity: 0 })
    }
    // Wait for the lesson to finish closing.
    engine.withChannel('chrome', () =>
      engine.after(420, () => {
        for (const id of ids) {
          const tile = root.current?.querySelector<HTMLElement>(`.pa-tile[data-lesson="${id}"]`)
          if (!tile) continue
          const chapter = chapters.find((c) => c.lessons.some((lesson) => lesson.id === id))
          const complete = Boolean(chapter?.lessons.every((lesson) => now.has(lesson.id)))
          lightTick(tile, complete)
          engine.set(tile, { scale: 0.86 })
          engine.to(tile, { scale: 1 }, 'settle')
        }
      }),
    )
  }, [onPath, root])
}

/** Check pop delay after the node starts settling, and the tick's draw delay after the mark lands (ms). */
const TICK_MS = { pop: 140, draw: 60 } as const

/**
 * The lesson's tick lands on its node: the tick draws itself in, and as it closes a ring of light
 * leaves it and the node glows green once. The tick that finishes a chapter also throws a few sparks
 * (src/ui/shine.ts).
 */
function lightTick(tile: HTMLElement, chapterDone: boolean) {
  const check = tile.querySelector<SVGSVGElement>('.pa-tile__check')
  const mark = check?.querySelector<SVGPathElement>('path')
  if (!check || !mark) return
  // Measured before the tile's settle scales it.
  const center = {
    x: check.getBoundingClientRect().left - tile.getBoundingClientRect().left + check.clientWidth / 2,
    y: check.getBoundingClientRect().top - tile.getBoundingClientRect().top + check.clientHeight / 2,
  }
  const length = mark.getTotalLength()
  mark.style.strokeDasharray = `${length} ${length}`
  engine.bind(mark, (v) => {
    mark.style.strokeDashoffset = `${(v.offset ?? 0).toFixed(2)}`
  })
  engine.set(mark, { offset: length })
  engine.set(check, { scale: 0.3, opacity: 0 })
  engine.after(TICK_MS.pop, () => {
    engine.to(check, { opacity: 1 }, 'fade')
    engine.to(check, { scale: 1 }, 'land')
    engine.after(TICK_MS.draw, () => {
      engine.to(mark, { offset: 0 }, 'draw', {
        onArrive: () => {
          mark.style.strokeDasharray = ''
          mark.style.strokeDashoffset = ''
        },
      })
      ring(tile, center.x, center.y)
      glow(tile, 1)
      if (!chapterDone) return
      const field = tile.closest<HTMLElement>('.ph-root')
      if (field) {
        const box = field.getBoundingClientRect()
        const at = tile.getBoundingClientRect()
        burst(field, at.left - box.left + at.width / 2, at.top - box.top + at.height / 2, {
          count: 12,
          speed: 200,
          seed: 5,
          tones: ['spark', 'ok', 'action'],
        })
      }
    })
  })
}
