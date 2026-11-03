import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { CHROME, type Chrome } from './chrome'
import { ChevronLeft } from './icons'
import { Pressable } from './Pressable'

/**
 * A scrolling screen. Its top chrome is one of two directions, chosen by `CHROME` (src/ui/chrome.ts):
 *
 * - scene: tab screens show no title (the tab bar names the page; the hero is the top, and an `h1` stays
 *   hidden for assistive tech). A second-level screen has a header row with its title and a text "Bitti".
 *   The top edge is a soft fade over the safe area that appears once the page has moved.
 * - masthead: one compact row with the name left and a context slot right; second-level screens show
 *   "‹ parent" before the name. Solid background, a hairline under it once scrolled.
 *
 * Eren 2026-10-31 22:21Z and 23:28Z: no doubled titles, no opaque band hiding content, and no floating
 * circles over the title (2026-11-01).
 */
/** Scrolled past this (px), the top fade (or the masthead hairline) fades in; back at it, it goes. */
const FADE_AFTER = 8
/** Scrolling down this far (px) past the title slides the floating action away. */
const HIDE_PAST_TITLE = 24
/** Scrolling up this far (px) brings it back. */
const SHOW_AFTER_UP = 12

export function Screen({
  title,
  back,
  backLabel,
  parent,
  children,
  pushed = false,
  action,
  chrome = CHROME,
  measure = 'page',
}: {
  title: string
  /** Makes this a second-level screen: closes it (scene: "Bitti"; masthead: "‹ parent"). */
  back?: () => void
  backLabel?: string
  /** Masthead only: the name of the screen one level up, shown beside the chevron. */
  parent?: string
  children: ReactNode
  pushed?: boolean
  /** One control for the top right of a tab screen (a text button). */
  action?: ReactNode
  /** Defaults to the app-wide `CHROME`; tests pass both. */
  chrome?: Chrome
  /** The width its content takes from 600 px up (tokens.css): a page, a reading column or the two-column stage. */
  measure?: 'page' | 'read' | 'stage'
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const edge = useRef<HTMLDivElement>(null)
  const actionBox = useRef<HTMLDivElement>(null)
  const masthead = chrome === 'masthead'
  // Only a scene tab screen's action floats; it tucks away while reading down.
  const floating = !masthead && !back && Boolean(action)

  useLayoutEffect(() => {
    const el = scroller.current
    const fade = edge.current
    if (!el) return
    const box = floating ? actionBox.current : null
    // Nothing covers the top of the page until it has moved.
    if (fade) engine.set(fade, { opacity: 0 })
    let scrolled = false
    let hidden = false
    let last = el.scrollTop
    let upRun = 0
    const setHidden = (next: boolean) => {
      if (!box || hidden === next) return
      hidden = next
      box.style.pointerEvents = next ? 'none' : ''
      box.inert = next
      // Travel is the control's own bottom edge, so it clears the screen top whatever the inset.
      engine.to(box, { y: next ? -box.getBoundingClientRect().bottom : 0 }, 'glide')
      engine.to(box, { opacity: next ? 0 : 1 }, 'fade')
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
      if (!box) return
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

  // One h1 per screen, wherever the chrome puts it.
  const h1 = (className: string) => (
    <h1 ref={heading} className={className}>
      {title}
    </h1>
  )

  return (
    <div className="dz-screen-frame" data-measure={measure} style={{ position: 'absolute', inset: 0 }}>
      <div ref={scroller} className="dz-screen" data-pushed={pushed || undefined} data-chrome={chrome}>
        {masthead ? null : back ? (
          <header className="dz-screen-head">
            <span className="dz-screen-grabber" aria-hidden="true" />
            <div className="dz-screen-head__row">
              {h1('dz-title2 dz-screen-head__title')}
              <Pressable
                className="dz-text-button"
                data-weight="strong"
                onClick={back}
                data-testid="screen-done"
              >
                {strings.chrome.done}
              </Pressable>
            </div>
          </header>
        ) : (
          h1('dz-sr-only')
        )}
        {children}
      </div>
      {/* One layer for the chrome: a route's arrival animates the frame's children, and the fade and the
          floating action keep their own scroll-driven opacity inside it. */}
      <div className="dz-screen-chrome">
        {masthead ? (
          <div className="dz-masthead">
            <div className="dz-masthead__row">
              {back ? (
                <Pressable
                  className="dz-masthead__back"
                  onClick={back}
                  aria-label={backLabel}
                  data-testid="screen-back"
                >
                  <ChevronLeft />
                  <span>{parent ?? strings.chrome.back}</span>
                </Pressable>
              ) : null}
              {h1('dz-title3 dz-masthead__title')}
              {action ? <div className="dz-masthead__action">{action}</div> : null}
            </div>
            <div ref={edge} className="dz-masthead__rule" aria-hidden="true" />
          </div>
        ) : (
          <>
            <div
              ref={edge}
              className="dz-edge-top"
              data-floating={floating ? '' : undefined}
              aria-hidden="true"
            />
            {floating ? (
              <div ref={actionBox} className="dz-float-action">
                {action}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
