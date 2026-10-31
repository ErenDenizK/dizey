import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { engine } from '../engine/driver'
import { project, VelocityTracker } from '../engine/gesture'
import { CHOREO, GESTURE, PRESS } from '../engine/tokens'
import { playSound } from '../sound/player'

/**
 * A pushed screen over a root screen (hierarchical navigation inside a tab).
 *
 * The pushed screen's x is the one value that moves; the root's parallax drift and dim are derived
 * from it each frame. Back is the chevron, or a swipe from the left edge that follows the finger
 * 1:1 and finishes on release with the finger's velocity (pop if the throw would carry it past half
 * the width, otherwise settle back).
 */
export function Push({
  content,
  onPopped,
  under,
}: {
  /** The screen to show, or null to pop. */
  content: ReactNode | null
  onPopped: () => void
  under: RefObject<HTMLElement | null>
}) {
  const layer = useRef<HTMLDivElement>(null)
  const dim = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<ReactNode | null>(content)
  const poppedRef = useRef(onPopped)
  poppedRef.current = onPopped

  if (content && content !== shown) setShown(content)

  // biome-ignore lint/correctness/useExhaustiveDependencies: binds once per mount of a pushed screen, not on every new screen node.
  useLayoutEffect(() => {
    const el = layer.current
    if (!shown || !el) return
    const width = () => el.parentElement?.clientWidth ?? window.innerWidth
    engine.bind(el, (v) => {
      const w = width()
      const p = 1 - Math.min(1, Math.max(0, (v.x ?? 0) / w))
      const back = under.current
      if (back)
        back.style.transform =
          p > 0.0005 ? `translate3d(${(-CHOREO.parallax * w * p).toFixed(2)}px, 0, 0)` : ''
      if (dim.current) dim.current.style.opacity = (CHOREO.pushDim * p).toFixed(4)
    })
    engine.set(el, { x: width() })
    return () => {
      if (under.current) under.current.style.transform = ''
    }
  }, [shown !== null, under])

  // A pushed screen sounds as it comes in and as it goes back, by tap or by swipe.
  const isOpen = content !== null
  const wasOpen = useRef(isOpen)
  useEffect(() => {
    if (isOpen === wasOpen.current) return
    wasOpen.current = isOpen
    playSound(isOpen ? 'open' : 'close')
  }, [isOpen])

  useEffect(() => {
    const el = layer.current
    if (!shown || !el) return
    const w = el.parentElement?.clientWidth ?? window.innerWidth
    engine.withChannel('chrome', () => {
      if (content) engine.to(el, { x: 0 }, 'page', { launch: CHOREO.launch })
      else
        engine.to(el, { x: w }, 'page', {
          launch: CHOREO.launch,
          onArrive: () => {
            setShown(null)
            poppedRef.current()
          },
        })
    })
  }, [content, shown])

  // Edge swipe back.
  useEffect(() => {
    const el = layer.current
    if (!shown || !el) return
    const tracker = new VelocityTracker()
    let pointer: number | null = null
    let startX = 0
    let startY = 0
    let tracking = false
    const down = (e: PointerEvent) => {
      const left = el.getBoundingClientRect().left
      if (e.clientX - left > GESTURE.edge) return
      pointer = e.pointerId
      startX = e.clientX
      startY = e.clientY
      tracking = false
      tracker.reset()
      tracker.add(e.timeStamp, e.clientX, 0)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      tracker.add(e.timeStamp, e.clientX, 0)
      const dx = e.clientX - startX
      if (!tracking) {
        if (Math.abs(e.clientY - startY) > PRESS.slop && Math.abs(e.clientY - startY) > Math.abs(dx)) {
          pointer = null
          return
        }
        if (dx > PRESS.slop) {
          tracking = true
          el.setPointerCapture(e.pointerId)
        }
      }
      if (tracking) engine.set(el, { x: Math.max(0, dx) })
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      pointer = null
      if (!tracking) return
      tracking = false
      const w = el.clientWidth
      const vx = tracker.velocity(e.timeStamp).x
      const x = engine.value(el, 'x')
      const pop = project(x, vx) > w / 2
      engine.withChannel('chrome', () => {
        if (pop)
          engine.to(el, { x: w }, 'page', {
            velocity: { x: vx },
            onArrive: () => {
              setShown(null)
              poppedRef.current()
            },
          })
        else engine.to(el, { x: 0 }, 'page', { velocity: { x: vx } })
      })
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [shown])

  if (!shown) return null
  return (
    <>
      <div ref={dim} className="dz-scrim" style={{ zIndex: 9, pointerEvents: 'none' }} aria-hidden="true" />
      <div ref={layer} style={{ position: 'absolute', inset: 0, zIndex: 10, willChange: 'transform' }}>
        {shown}
      </div>
    </>
  )
}
