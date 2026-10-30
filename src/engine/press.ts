import { engine as appEngine } from './driver'
import type { Engine } from './engine'
import { PRESS, pressScale } from './tokens'

/**
 * Press physics for any pressable element.
 *
 * - The press-down starts on pointerdown in the same frame (iOS does not apply :active reliably),
 *   with the fast `tap` spring; the release uses `release`, which has a trace of give.
 * - Depth is physical: every element sinks by PRESS.depth px per side, so scale depends on width.
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
    const scale = pressScale(element.offsetWidth)
    engine.withChannel('chrome', () => {
      engine.to(element, { scale }, 'tap')
      engine.to(dim, { '--press': 1 }, 'tap', { effect: true })
    })
  }
  const lift = () => {
    if (pointer === null) return
    pointer = null
    engine.withChannel('chrome', () => {
      engine.to(element, { scale: 1 }, 'release')
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
