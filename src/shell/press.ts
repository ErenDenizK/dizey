import { engine } from '../engine/driver'
import { PRESS_SCALE } from '../engine/tokens'

/**
 * Press feedback for plain `.sh-press` buttons in the lesson player and the rehearsal, which are not
 * yet src/ui Pressables: sinks on press, settles back on release.
 */
export function installPressFeedback(): () => void {
  let pressed: HTMLElement | null = null
  const down = (event: PointerEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('.sh-press') : null
    if (!target || target.matches(':disabled')) return
    pressed = target
    engine.withChannel('chrome', () => engine.to(target, { scale: PRESS_SCALE }, 'tap'))
  }
  const up = () => {
    if (!pressed) return
    const target = pressed
    pressed = null
    engine.withChannel('chrome', () => engine.to(target, { scale: 1 }, 'release'))
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
