import { type RefObject, useLayoutEffect } from 'react'
import { engine } from '../engine/driver'

/**
 * A control's enabled look eased instead of snapped: the engine drives `--on` (0 disabled, 1 enabled)
 * on the `fade` spring and the CSS under `[data-ease]` reads it. The first render sets the value with no
 * motion; the attribute marks the element as driven, so controls that do not use this keep their plain
 * `:disabled` styling.
 */
export function useEase(ref: RefObject<HTMLElement | null>, on: boolean): void {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const goal = on ? 1 : 0
    if (el.dataset.ease === undefined) {
      el.dataset.ease = ''
      engine.set(el, { '--on': goal })
    } else engine.withChannel('chrome', () => engine.to(el, { '--on': goal }, 'fade'))
  }, [ref, on])
}
