import { type RefObject, useLayoutEffect } from 'react'

/**
 * Keeps `--side-h` on a stage grid's side card equal to the card's own height, so its sticky offset can clear a
 * card taller than the window: `top: min(rest, 100dvh - --side-h - gap)` lets a tall card scroll until its foot is
 * in view and only then stick, instead of pinning its top and hiding the rest (decision 0020). A custom property, not a
 * position switch, so the card never jumps when a group opens inside it.
 */
export function useSideHeight(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const write = () => el.style.setProperty('--side-h', `${el.offsetHeight}px`)
    write()
    const watch = new ResizeObserver(write)
    watch.observe(el)
    return () => watch.disconnect()
  }, [ref])
}
