import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { engine } from '../engine/driver'
import { ChevronLeft } from './icons'
import { Pressable } from './Pressable'

/**
 * A scrolling screen with one large title that scrolls away with its content.
 *
 * There is no inline bar title: the tab bar already names the page, so a second, smaller copy of the
 * title in a top bar only repeats it (Eren 2026-10-31 22:21Z and 23:28Z: "ikili yazı", and the opaque
 * top band hid content). The top edge is a soft fade over the safe area, not a solid band, so content
 * dissolves under the status bar instead of being cut by a hard edge. Pushed screens keep a floating
 * back button that stays put while the page scrolls.
 */
/** Scrolled past this (px), the floating top fade fades in; back at it, the fade goes. */
const FADE_AFTER = 8
/** Scrolling down this far (px) past the title slides the floating controls away. */
const HIDE_PAST_TITLE = 24
/** Scrolling up this far (px) brings them back. */
const SHOW_AFTER_UP = 12

export function Screen({
  title,
  back,
  backLabel,
  children,
  pushed = false,
  action,
}: {
  title: string
  back?: () => void
  backLabel?: string
  children: ReactNode
  pushed?: boolean
  /** A control floating at the top right, like the back button at the top left. */
  action?: ReactNode
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const edge = useRef<HTMLDivElement>(null)
  const backBox = useRef<HTMLDivElement>(null)
  const actionBox = useRef<HTMLDivElement>(null)
  const floating = Boolean(back || action)

  useLayoutEffect(() => {
    const el = scroller.current
    const fade = edge.current
    if (!el || !floating) return
    const boxes = [backBox.current, actionBox.current].filter((b): b is HTMLDivElement => b !== null)
    // The title owns the top of the page: no fade over it until the page has moved.
    if (fade) engine.set(fade, { opacity: 0 })
    let scrolled = false
    let hidden = false
    let last = el.scrollTop
    let upRun = 0
    const setHidden = (next: boolean) => {
      if (hidden === next) return
      hidden = next
      for (const box of boxes) {
        box.style.pointerEvents = next ? 'none' : ''
        box.inert = next
        // Travel is the control's own bottom edge, so it clears the screen top whatever the inset.
        engine.to(box, { y: next ? -box.getBoundingClientRect().bottom : 0 }, 'glide')
        engine.to(box, { opacity: next ? 0 : 1 }, 'fade')
      }
    }
    const onScroll = () => {
      const top = Math.max(0, el.scrollTop)
      const delta = top - last
      last = top
      const nowScrolled = top > FADE_AFTER
      if (nowScrolled !== scrolled) {
        scrolled = nowScrolled
        if (fade) engine.to(fade, { opacity: scrolled ? 1 : 0 }, 'fade')
      }
      if (delta > 0) upRun = 0
      else if (delta < 0) upRun -= delta
      const titleEnd = (heading.current?.offsetTop ?? 0) + (heading.current?.offsetHeight ?? 0)
      if (top <= FADE_AFTER) setHidden(false)
      else if (delta > 0 && top > titleEnd + HIDE_PAST_TITLE) setHidden(true)
      else if (upRun >= SHOW_AFTER_UP) setHidden(false)
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [floating])

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
      {/* One layer for the chrome: a route's arrival animates the frame's children, and the fade and the
          floating controls keep their own scroll-driven opacity inside it. */}
      <div className="dz-screen-chrome">
        <div
          ref={edge}
          className="dz-edge-top"
          data-floating={floating ? '' : undefined}
          aria-hidden="true"
        />
        {back ? (
          <div ref={backBox} className="dz-float-back">
            <Pressable className="dz-icon-button dz-icon-button--float" onClick={back} aria-label={backLabel}>
              <ChevronLeft />
            </Pressable>
          </div>
        ) : null}
        {action ? (
          <div ref={actionBox} className="dz-float-action">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  )
}
