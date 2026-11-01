import { type Ref, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import type { DuoHandle } from '../character/Duo'
import { type AnchorMood, type AnchorSize, companion, registry } from './companion'

/** Where the eyes glance on arrival, per anchor name (toward the screen's words). */
const LOOK: Record<string, [number, number]> = {
  today: [1.1, 0.2],
  me: [0, 1.1],
  lesson: [-0.9, 0.3],
  end: [0, 1.2],
}

/**
 * A place for the duo on a screen. It renders an empty box of the duo's shape (its width comes from a CSS class)
 * and registers with the companion layer, which draws the one duo there while this is the active anchor. The
 * `duo` ref gives the layer's handle while this anchor is active; commands given earlier wait for the arrival.
 */
export function CompanionSlot({
  name,
  size,
  mood = 'happy',
  alive = true,
  className = '',
  duo,
}: {
  name: string
  size: AnchorSize
  mood?: AnchorMood
  alive?: boolean
  className?: string
  duo?: Ref<DuoHandle>
}) {
  const id = useId()
  const el = useRef<HTMLDivElement>(null)
  const first = useRef({ mood, alive, size })

  useLayoutEffect(() => {
    const node = el.current
    if (!node) return
    return registry.register({
      id,
      name,
      size: first.current.size,
      el: node,
      mood: first.current.mood,
      alive: first.current.alive,
      look: LOOK[name] ?? [0, 0],
    })
  }, [id, name])
  useLayoutEffect(() => registry.update(id, { mood, alive, size }), [id, mood, alive, size])

  useImperativeHandle(duo, () => {
    const to = (run: (handle: DuoHandle) => void) => registry.command(id, run, companion.handle)
    return {
      react: (next) => to((h) => h.react(next)),
      pose: (next, instant) => to((h) => h.pose(next, instant)),
      look: (x, y) => to((h) => h.look(x, y)),
      blink: () => to((h) => h.blink()),
      crouch: () => to((h) => h.crouch()),
      stretch: () => to((h) => h.stretch()),
      land: () => to((h) => h.land()),
      finish: () => companion.handle?.finish(),
    }
  }, [id])

  return (
    <div
      ref={el}
      className={`companion-slot companion-slot--${size} ${className}`.trim()}
      data-slot={name}
      aria-hidden="true"
    />
  )
}
