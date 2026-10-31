import { type ReactNode, useEffect, useRef } from 'react'
import { engine } from '../engine/driver'
import { ChevronLeft } from './icons'
import { Pressable } from './Pressable'

/** The bar title's size (--type-body, 17 px): where the large title ends up. */
const BAR_TITLE_PX = 17
/** Scroll distance over which the large title becomes the bar title. */
const MORPH_PX = 140

/**
 * A scrolling screen with a large title that becomes its own bar title. There is one title, not two: as
 * the page scrolls, the large title rises with the content, shrinks to the bar's size and slides to the
 * centre, arriving in the bar exactly as the bar's glass fades in behind it; from there it stays. Scroll
 * is direct manipulation, so the title follows the finger 1:1 (no spring and no timing to wait for).
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
  const bar = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = scroller.current
    const h = heading.current
    if (!el || !h) return
    const sync = () => {
      const barEl = bar.current
      if (!barEl) return
      // Resting geometry (offset* ignore transforms), read on every frame so a resize cannot stale it.
      // The bar and the scroller share the screen's top edge; the bar's padding is the safe area.
      const inset = parseFloat(getComputedStyle(barEl).paddingTop) || 0
      const barCentre = inset + (barEl.clientHeight - inset) / 2
      const centre = h.offsetTop + h.offsetHeight / 2
      const travel = Math.max(0, centre - barCentre)
      // The morph is spread over at least MORPH_PX of scroll, so it reads as a change, not a jump.
      const range = Math.max(travel, MORPH_PX)
      const top = Math.max(0, el.scrollTop)
      const p = Math.min(1, top / range)
      const eased = p * p * (3 - 2 * p)
      const size = parseFloat(getComputedStyle(h).fontSize)
      const scale = 1 + (BAR_TITLE_PX / size - 1) * eased
      const x = eased * (el.clientWidth / 2 - h.offsetLeft - (h.offsetWidth * scale) / 2)
      // The centre travels from rest to the bar over `range`; past it the title stays put in the bar.
      engine.set(h, { x, y: top - travel * p, scale })
      if (material.current)
        engine.set(material.current, { opacity: Math.min(1, Math.max(0, (p - 0.55) / 0.45)) })
    }
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
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
      <div ref={bar} className="dz-navbar">
        <div ref={material} className="dz-navbar-material" />
        {back ? (
          <Pressable className="dz-icon-button" onClick={back} aria-label={backLabel}>
            <ChevronLeft />
          </Pressable>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
