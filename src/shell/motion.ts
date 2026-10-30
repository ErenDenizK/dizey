import { PRESS_SCALE } from '../engine/constants'
import { engine } from '../engine/driver'

/**
 * Shell motion on the app's engine (src/engine), never CSS transitions: one clock, the same springs
 * as the lesson layer, reduced motion handled in one place.
 */

/** Press feedback for every `.sh-press` element: sinks on 'press', settles back on 'land'. */
export function installPressFeedback(): () => void {
  let pressed: HTMLElement | null = null
  const down = (event: PointerEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('.sh-press') : null
    if (!target) return
    pressed = target
    engine.to(target, { scale: PRESS_SCALE }, 'press')
  }
  const up = () => {
    if (!pressed) return
    engine.to(pressed, { scale: 1 }, 'land')
    pressed = null
  }
  document.addEventListener('pointerdown', down)
  document.addEventListener('pointerup', up)
  document.addEventListener('pointercancel', up)
  return () => {
    document.removeEventListener('pointerdown', down)
    document.removeEventListener('pointerup', up)
    document.removeEventListener('pointercancel', up)
  }
}

/** Fades an element in or out; once out, it also leaves the accessibility and hit-test tree. */
export function fade(element: HTMLElement, visible: boolean, isCurrent: () => boolean) {
  if (visible) {
    element.style.visibility = 'visible'
    engine.to(element, { opacity: 1 }, 'fade')
    return
  }
  engine.to(element, { opacity: 0 }, 'fade', {
    onArrive: () => {
      if (isCurrent()) element.style.visibility = 'hidden'
    },
  })
}

/** Slides a bottom sheet up from below its own height, or back down and out. */
export function slideSheet(element: HTMLElement, open: boolean, isCurrent: () => boolean) {
  const offscreen = element.offsetHeight + 24
  if (open) {
    if (element.style.visibility !== 'visible') engine.set(element, { y: offscreen })
    element.style.visibility = 'visible'
    engine.to(element, { y: 0 }, 'page', { epsilon: 2 })
    return
  }
  engine.to(element, { y: offscreen }, 'page', {
    epsilon: 4,
    onArrive: () => {
      if (isCurrent()) element.style.visibility = 'hidden'
    },
  })
}
