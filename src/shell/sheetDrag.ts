import { engine } from '../engine/driver'
import { VelocityTracker } from '../engine/gesture'
import { PRESS } from '../engine/tokens'
import { DISMISS } from './LessonPeek'

export type SheetDrag = {
  /** Called once when the drag ends past the distance or speed of a card's dismiss (LessonPeek). */
  onClose: () => void
  /** Called with the sheet's live offset (px) while it follows the finger, and 0 when it springs back. */
  follow: (y: number) => void
}

/** True when something between the touched element and the sheet is scrolled away from its top. */
function scrolled(from: EventTarget | null, sheet: HTMLElement) {
  for (let node = from as HTMLElement | null; node && node !== sheet.parentElement; node = node.parentElement)
    if (node.scrollTop > 0) return true
  return false
}

/**
 * Drag down to close, with the thresholds and the follow/resist rule of a lesson card. A drag only starts
 * when the sheet's content is at its top, so scrolling keeps working. Returns the way to remove it.
 */
export function dragToDismiss(el: HTMLElement, { onClose, follow }: SheetDrag) {
  const tracker = new VelocityTracker()
  let pointer: number | null = null
  let startY = 0
  let eligible = false
  let dragging = false
  let closing = false
  const down = (e: PointerEvent) => {
    if (e.button !== 0 || closing) return
    pointer = e.pointerId
    startY = e.clientY
    dragging = false
    eligible = !scrolled(e.target, el)
    tracker.reset()
    tracker.add(e.timeStamp, 0, e.clientY)
  }
  const move = (e: PointerEvent) => {
    if (e.pointerId !== pointer) return
    tracker.add(e.timeStamp, 0, e.clientY)
    const dy = e.clientY - startY
    if (!dragging && dy < -PRESS.slop) eligible = false
    if (!dragging && eligible && dy > PRESS.slop) {
      dragging = true
      el.setPointerCapture(e.pointerId)
    }
    if (!dragging) return
    // Down follows the finger; up resists, the sheet has nowhere to go.
    // It starts moving from the point the drag was recognised, so it never jumps by the slop in one frame.
    const d = dy - PRESS.slop
    const y = d > 0 ? d : -Math.sqrt(-d) * 2
    engine.set(el, { y })
    follow(Math.max(0, y))
  }
  const up = (e: PointerEvent) => {
    if (e.pointerId !== pointer) return
    pointer = null
    if (!dragging) return
    dragging = false
    const vy = tracker.velocity(e.timeStamp).y
    if (engine.value(el, 'y') > DISMISS.distance || vy > DISMISS.speed) {
      closing = true
      onClose()
    } else {
      follow(0)
      engine.withChannel('chrome', () => engine.to(el, { y: 0 }, 'glide', { velocity: { y: vy } }))
    }
  }
  // A pull down at the top of the content is the sheet's, not the page's: keep the browser from panning.
  const touch = (e: TouchEvent) => {
    const t = e.touches[0]
    if (eligible && pointer !== null && t && e.cancelable && t.clientY - startY > 0) e.preventDefault()
  }
  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  el.addEventListener('touchmove', touch, { passive: false })
  return () => {
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
    el.removeEventListener('touchmove', touch)
  }
}
