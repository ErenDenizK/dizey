import { type ReactNode, useEffect, useRef } from 'react'
import { engine } from '../engine/driver'
import { ChevronLeft } from './icons'
import { Pressable } from './Pressable'

/**
 * A scrolling screen with a large title. When the large title scrolls under the top edge, an inline
 * title bar fades in on glass (the "scroll edge"): the title is never lost and content never
 * collides with the status bar. The fade is a state change on `fade`, not tied 1:1 to scroll.
 */
export function Screen({
  title,
  back,
  backLabel,
  children,
  pushed = false,
}: {
  title: string
  back?: () => void
  backLabel?: string
  children: ReactNode
  pushed?: boolean
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const material = useRef<HTMLDivElement>(null)
  const inline = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    if (material.current) engine.set(material.current, { opacity: 0 })
    if (inline.current) engine.set(inline.current, { opacity: 0 })
    let shown = false
    const sync = () => {
      const h = heading.current
      const passed = h ? el.scrollTop > h.offsetTop + h.offsetHeight - 52 : false
      if (passed === shown) return
      shown = passed
      engine.withChannel('chrome', () => {
        if (material.current) engine.to(material.current, { opacity: passed ? 1 : 0 }, 'fade')
        if (inline.current) engine.to(inline.current, { opacity: passed ? 1 : 0 }, 'fade')
      })
    }
    el.addEventListener('scroll', sync, { passive: true })
    return () => el.removeEventListener('scroll', sync)
  }, [])

  return (
    <div className="dz-screen-frame" style={{ position: 'absolute', inset: 0 }}>
      <div ref={scroller} className="dz-screen" data-pushed={pushed || undefined}>
        <h1
          ref={heading}
          className="dz-large-title"
          style={back ? { marginTop: 'var(--space-12)' } : undefined}
        >
          {title}
        </h1>
        {children}
      </div>
      <div className="dz-navbar">
        <div ref={material} className="dz-navbar-material" />
        {back ? (
          <Pressable className="dz-icon-button" onClick={back} aria-label={backLabel}>
            <ChevronLeft />
          </Pressable>
        ) : (
          <span />
        )}
        <div ref={inline} className="dz-navbar-title" aria-hidden="true">
          {title}
        </div>
      </div>
    </div>
  )
}
