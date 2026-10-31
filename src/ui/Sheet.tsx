import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { engine } from '../engine/driver'
import { nearestStop, rubberClamp, VelocityTracker } from '../engine/gesture'
import { CHOREO, PRESS } from '../engine/tokens'
import { playSound } from '../sound/player'
import { safeTop } from './safe-area'

/**
 * Bottom sheet with two detents (medium, large), drag to resize or dismiss.
 *
 * One value moves: the sheet's y. The scrim and the receding screen behind are derived from it in
 * the same frame, so they can never disagree, and a finger, a flick or a tap all drive the same
 * picture. Release picks the detent nearest to where the throw would coast (UIKit's projection) and
 * hands the finger's velocity to the spring.
 */
function geometry(sheet: HTMLElement | null) {
  const height = sheet?.parentElement?.clientHeight ?? window.innerHeight
  return { height, medium: Math.round(height * 0.48), large: safeTop() + 24, closed: height }
}

export function Sheet({
  open,
  onClose,
  stage,
  label,
  children,
}: {
  open: boolean
  onClose: () => void
  /** The screen behind, which recedes as the sheet rises to the large detent. */
  stage: RefObject<HTMLElement | null>
  label: string
  children: ReactNode
}) {
  const sheet = useRef<HTMLDivElement>(null)
  const scrim = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  if (open && !mounted) setMounted(true)

  useLayoutEffect(() => {
    const el = sheet.current
    if (!mounted || !el) return
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
  }, [mounted, stage])

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
    const g = geometry(sheet.current)
    engine.withChannel('chrome', () => {
      if (open) {
        engine.to(el, { y: g.medium }, 'page', { launch: CHOREO.launch })
        el.focus({ preventScroll: true })
      } else {
        engine.to(el, { y: g.closed }, 'page', { onArrive: () => setMounted(false) })
      }
    })
  }, [open, mounted])

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
      if (!dragging && Math.abs(e.clientY - startY) > PRESS.slop) {
        dragging = true
        el.setPointerCapture(e.pointerId)
        // Catch the sheet where it is, even mid-animation.
        startValue = engine.value(el, 'y') - (e.clientY - startY)
      }
      if (dragging) {
        const g = geometry(sheet.current)
        engine.set(el, { y: rubberClamp(startValue + e.clientY - startY, g.large, g.closed, g.height) })
      }
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      pointer = null
      if (!dragging) return
      dragging = false
      const g = geometry(sheet.current)
      const vy = tracker.velocity(e.timeStamp).y
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
  }, [mounted])

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
      <div ref={sheet} className="dz-sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <button type="button" className="dz-grabber-hit" onClick={cycle} aria-label={label}>
          <span className="dz-grabber" />
        </button>
        {children}
      </div>
    </>
  )
}
