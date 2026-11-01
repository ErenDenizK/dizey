import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { engine } from '../engine/driver'

/**
 * Height and opacity follow one spring, so nothing appears in a single frame. The spring is an effect,
 * so under reduced motion the height still eases (briefly) instead of cutting. A body that is open on
 * first render starts open (the screen opening is not an expansion).
 */
export function Expander({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open)
  const el = useRef<HTMLDivElement | null>(null)
  const latest = useRef(open)
  latest.current = open
  const born = useRef(open)

  const attach = useCallback((node: HTMLDivElement | null) => {
    el.current = node
    if (!node) return
    engine.bind(node, (v, target) => {
      const style = (target as HTMLElement).style
      const inner = (target as HTMLElement).firstElementChild as HTMLElement | null
      const progress = v.open ?? 0
      style.height = progress >= 0.999 ? 'auto' : `${Math.round(progress * (inner?.scrollHeight ?? 0))}px`
    })
    const start = born.current ? 1 : 0
    born.current = false
    engine.set(node, { open: start, opacity: start })
  }, [])

  useLayoutEffect(() => {
    if (open && !mounted) setMounted(true)
  }, [open, mounted])

  useLayoutEffect(() => {
    const node = el.current
    if (!mounted || !node) return
    engine.withChannel('chrome', () => {
      engine.to(node, { open: open ? 1 : 0, opacity: open ? 1 : 0 }, 'enter', {
        effect: true,
        onArrive: () => {
          if (!latest.current) setMounted(false)
        },
      })
    })
  }, [open, mounted])

  if (!mounted) return null
  return (
    <div id={id} ref={attach} className="dz-expander">
      <div className="dz-expander__inner">{children}</div>
    </div>
  )
}
