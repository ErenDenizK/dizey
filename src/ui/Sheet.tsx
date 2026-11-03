import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { engine } from '../engine/driver'
import { nearestStop, rubberClamp, VelocityTracker } from '../engine/gesture'
import { CHOREO, PRESS } from '../engine/tokens'
import { playSound } from '../sound/player'
import { safeTop } from './safe-area'
import { isMediumUp } from './size-class'

/**
 * Bottom sheet with two detents (medium, large), drag to resize or dismiss. From 600 px it is a centred dialog instead
 * (decision 0021): as tall as its content, fading and rising in over a scrim that covers the whole window, closed by an
 * outside tap, Escape or a drag down; no detents and the screen behind does not recede.
 *
 * One value moves: the sheet's y. The scrim and the receding screen behind are derived from it in
 * the same frame, so they can never disagree, and a finger, a flick or a tap all drive the same
 * picture. Release picks the detent nearest to where the throw would coast (UIKit's projection) and
 * hands the finger's velocity to the spring.
 */
function geometry(sheet: HTMLElement | null) {
  const height = sheet?.parentElement?.clientHeight ?? window.innerHeight
  const large = safeTop() + 24
  let medium = Math.round(height * 0.48)
  // A fitting sheet rises exactly as far as its content needs, never past the large detent.
  if (sheet?.dataset.fit !== undefined) {
    const style = getComputedStyle(sheet)
    let content = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
    for (const child of Array.from(sheet.children)) {
      const box = getComputedStyle(child)
      content +=
        (child as HTMLElement).offsetHeight +
        Number.parseFloat(box.marginTop) +
        Number.parseFloat(box.marginBottom)
    }
    medium = Math.max(large, Math.round(height - content))
  }
  return { height, medium, large, closed: height }
}

/** How far (px) or how fast (px/s) a drag down closes a dialog, as for the lesson card (LessonPeek). */
const DIALOG_DISMISS = { distance: 90, speed: 600 } as const

export function Sheet({
  open,
  onClose,
  stage,
  label,
  detent = 'medium',
  fit = false,
  children,
}: {
  open: boolean
  onClose: () => void
  /** The screen behind, which recedes as the sheet rises to the large detent. */
  stage: RefObject<HTMLElement | null>
  label: string
  /** Where it rises to: tall content opens at the large detent. */
  detent?: 'medium' | 'large'
  /** Rise only as far as the content needs, so no dead space is left under it. */
  fit?: boolean
  children: ReactNode
}) {
  const sheet = useRef<HTMLDivElement>(null)
  const scrim = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)
  // Decided each time it opens, so a window that is resized while it is open keeps the form it opened in.
  const [dialog, setDialog] = useState(() => open && isMediumUp())
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  if (open && !mounted) {
    setMounted(true)
    setDialog(isMediumUp())
  }

  useLayoutEffect(() => {
    const el = sheet.current
    if (!mounted || !el) return
    if (dialog) {
      // The scrim follows the dialog's own opacity: one value, so the two can never disagree.
      engine.bind(el, (v) => {
        if (scrim.current) scrim.current.style.opacity = (CHOREO.sheetScrim * (v.opacity ?? 0)).toFixed(4)
      })
      engine.set(el, { opacity: 0, y: CHOREO.rise, scale: 0.97 })
      return
    }
    engine.bind(el, (v) => {
      const y = v.y ?? 0
      const g = geometry(sheet.current)
      const rise = Math.min(1, Math.max(0, (g.closed - y) / (g.closed - g.medium)))
      const lift = Math.min(1, Math.max(0, (g.medium - y) / (g.medium - g.large)))
      if (scrim.current) scrim.current.style.opacity = (CHOREO.sheetScrim * rise).toFixed(4)
      const back = stage.current
      if (back) {
        const s = 1 - (1 - CHOREO.sheetRecede) * lift
        back.style.transform =
          lift > 0.001 ? `translate3d(0, ${(lift * 10).toFixed(2)}px, 0) scale(${s.toFixed(4)})` : ''
        back.style.borderRadius = lift > 0.001 ? `${Math.round(lift * 22)}px` : ''
      }
    })
    engine.set(el, { y: geometry(sheet.current).closed })
    return () => {
      if (stage.current) {
        stage.current.style.transform = ''
        stage.current.style.borderRadius = ''
      }
    }
  }, [mounted, stage, dialog])

  // The sheet sounds as it rises and as it goes, however it was opened or dismissed.
  const wasOpen = useRef(open)
  useEffect(() => {
    if (open === wasOpen.current) return
    wasOpen.current = open
    playSound(open ? 'open' : 'close')
  }, [open])

  useEffect(() => {
    const el = sheet.current
    if (!mounted || !el) return
    if (dialog) {
      engine.withChannel('chrome', () => {
        if (open) {
          engine.to(el, { opacity: 1 }, 'enter')
          engine.to(el, { y: 0, scale: 1 }, 'page', { launch: CHOREO.launch })
          el.focus({ preventScroll: true })
        } else {
          engine.to(el, { y: CHOREO.rise, scale: 0.98 }, 'page')
          engine.to(el, { opacity: 0 }, 'fade', { onArrive: () => setMounted(false) })
        }
      })
      return
    }
    const g = geometry(sheet.current)
    engine.withChannel('chrome', () => {
      if (open) {
        engine.to(el, { y: detent === 'large' ? g.large : g.medium }, 'page', { launch: CHOREO.launch })
        el.focus({ preventScroll: true })
      } else {
        engine.to(el, { y: g.closed }, 'page', { onArrive: () => setMounted(false) })
      }
    })
  }, [open, mounted, detent, dialog])

  // Escape closes whatever is open, wherever the focus is (a keyboard or a hardware keyboard on a tablet).
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open])

  // Drag.
  useEffect(() => {
    const el = sheet.current
    if (!mounted || !el) return
    const tracker = new VelocityTracker()
    let pointer: number | null = null
    let startY = 0
    let startValue = 0
    let dragging = false
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      pointer = e.pointerId
      startY = e.clientY
      startValue = engine.value(el, 'y')
      dragging = false
      tracker.reset()
      tracker.add(e.timeStamp, 0, e.clientY)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      tracker.add(e.timeStamp, 0, e.clientY)
      // A dialog that is scrolled inside belongs to the scroll, not to the drag.
      if (dialog && !dragging && el.scrollTop > 0) return
      if (!dragging && Math.abs(e.clientY - startY) > PRESS.slop) {
        dragging = true
        el.setPointerCapture(e.pointerId)
        // Catch the sheet where it is, even mid-animation.
        startValue = engine.value(el, 'y') - (e.clientY - startY)
      }
      if (dragging && dialog) {
        // Down follows the finger, up resists: a dialog has nowhere higher to go.
        const dy = e.clientY - startY
        engine.set(el, { y: dy > 0 ? dy : -Math.sqrt(-dy) * 2 })
      } else if (dragging) {
        const g = geometry(sheet.current)
        engine.set(el, { y: rubberClamp(startValue + e.clientY - startY, g.large, g.closed, g.height) })
      }
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      pointer = null
      if (!dragging) return
      dragging = false
      const vy = tracker.velocity(e.timeStamp).y
      if (dialog) {
        if (engine.value(el, 'y') > DIALOG_DISMISS.distance || vy > DIALOG_DISMISS.speed) closeRef.current()
        else engine.withChannel('chrome', () => engine.to(el, { y: 0 }, 'glide', { velocity: { y: vy } }))
        return
      }
      const g = geometry(sheet.current)
      const y = engine.value(el, 'y')
      const stop = nearestStop(y, vy, [g.large, g.medium, g.closed])
      if (stop === g.closed) {
        engine.withChannel('chrome', () => engine.to(el, { y: g.closed }, 'page', { velocity: { y: vy } }))
        closeRef.current()
      } else {
        engine.withChannel('chrome', () => engine.to(el, { y: stop }, 'glide', { velocity: { y: vy } }))
      }
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('keydown', key)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('keydown', key)
    }
  }, [mounted, dialog])

  if (!mounted) return null
  const cycle = () => {
    const el = sheet.current
    if (!el) return
    const g = geometry(sheet.current)
    const y = engine.value(el, 'y')
    engine.withChannel('chrome', () =>
      engine.to(el, { y: Math.abs(y - g.large) < 4 ? g.medium : g.large }, 'glide'),
    )
  }
  return (
    <>
      <div ref={scrim} className="dz-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheet}
        className="dz-sheet"
        data-fit={fit ? '' : undefined}
        data-dialog={dialog ? '' : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <button type="button" className="dz-grabber-hit" onClick={cycle} aria-label={label}>
          <span className="dz-grabber" />
        </button>
        {children}
      </div>
    </>
  )
}
