import { engine } from '../engine/driver'

/**
 * Lets an element that React is about to remove fade out where it stood instead of vanishing in one frame
 * (PR-16). Call it from a layout effect's cleanup: React runs that before it takes the element's node out
 * of the DOM, so the element can still be measured and copied. The copy sits over the same spot in the
 * element's positioned ancestor and leaves the DOM once it has faded.
 */
export function leaveInPlace(el: HTMLElement | null, channel = 'chrome'): void {
  const host = el?.offsetParent as HTMLElement | null
  if (!el?.isConnected || !host || el.closest('.ls-leaving')) return
  const r = el.getBoundingClientRect()
  const h = host.getBoundingClientRect()
  if (r.width < 1 || r.height < 1 || engine.value(el, 'opacity') < 0.05) return
  const copy = el.cloneNode(true) as HTMLElement
  copy.setAttribute('aria-hidden', 'true')
  copy.classList.add('ls-leaving')
  Object.assign(copy.style, {
    position: 'absolute',
    left: `${r.left - h.left - host.clientLeft + host.scrollLeft}px`,
    top: `${r.top - h.top - host.clientTop + host.scrollTop}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    margin: '0',
    transform: 'none',
    pointerEvents: 'none',
  })
  host.appendChild(copy)
  engine.withChannel(channel, () => {
    engine.set(copy, { opacity: engine.value(el, 'opacity') })
    engine.to(copy, { opacity: 0 }, 'leave', { onArrive: () => copy.remove() })
  })
}
