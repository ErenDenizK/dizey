import { engine as appEngine } from './driver'
import type { Engine } from './engine'
import { PRESS, PRESS_SCALE } from './tokens'

/**
 * Press physics for any pressable element.
 *
 * - The press-down starts on pointerdown in the same frame (iOS does not apply :active reliably): half
 *   the depth is drawn at once, the `press` spring takes the rest. The release springs back on `ui`.
 * - Every element sinks to PRESS_SCALE (0.96), as in the old app. A press released before it was drawn
 *   is drawn now at full depth, so even the shortest tap shows.
 * - A finger that moves past PRESS.slop is scrolling: the press cancels and nothing fires.
 * - The action fires on release, never after the animation: motion never delays a result.
 * - Keyboard activation does not animate (frequent, and already confirmed by focus).
 *
 * `dimTarget` (optional) receives `--press` from 0 to 1 for a highlight overlay in CSS.
 */
export function attachPress(
  element: HTMLElement,
  options: { engine?: Engine; dimTarget?: HTMLElement; disabled?: () => boolean } = {},
): () => void {
  const engine = options.engine ?? appEngine
  const dim = options.dimTarget ?? element
  let pointer: number | null = null
  let startX = 0
  let startY = 0

  const down = (event: PointerEvent) => {
    if (event.button !== 0 || options.disabled?.()) return
    pointer = event.pointerId
    startX = event.clientX
    startY = event.clientY
    engine.withChannel('chrome', () => pressIn(engine, element))
    engine.withChannel('chrome', () => {
      engine.to(dim, { '--press': 1 }, 'tap', { effect: true })
    })
  }
  const lift = () => {
    if (pointer === null) return
    pointer = null
    engine.withChannel('chrome', () => {
      pressOut(engine, element)
      engine.to(dim, { '--press': 0 }, 'fade', { effect: true })
    })
  }
  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > PRESS.slop) lift()
  }

  element.addEventListener('pointerdown', down)
  element.addEventListener('pointermove', move)
  element.addEventListener('pointerup', lift)
  element.addEventListener('pointercancel', lift)
  element.addEventListener('pointerleave', lift)
  // iOS Safari only reports touch presses promptly when a touch listener exists.
  element.addEventListener('touchstart', noop, { passive: true })
  return () => {
    element.removeEventListener('pointerdown', down)
    element.removeEventListener('pointermove', move)
    element.removeEventListener('pointerup', lift)
    element.removeEventListener('pointercancel', lift)
    element.removeEventListener('pointerleave', lift)
    element.removeEventListener('touchstart', noop)
  }
}

function noop() {}

/** Draws the first part of a press at once and lets the `press` spring take it the rest of the way. */
export function pressIn(engine: Engine, element: object): void {
  const depth = 1 - PRESS_SCALE
  if (1 - engine.value(element, 'scale') < depth * PRESS.first)
    engine.set(element, { scale: 1 - depth * PRESS.first })
  engine.to(element, { scale: PRESS_SCALE }, 'press')
}

/** Springs a press back; one released before half its depth showed is drawn at full depth first. */
export function pressOut(engine: Engine, element: object): void {
  const depth = 1 - PRESS_SCALE
  if (1 - engine.value(element, 'scale') < depth / 2) engine.set(element, { scale: PRESS_SCALE })
  engine.to(element, { scale: 1 }, 'ui')
}
