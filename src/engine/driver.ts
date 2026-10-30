import { MAX_FRAME_MS } from './constants'
import { Engine } from './engine'

/** The app's one engine. Tests create their own Engine and step it by hand instead. */
export const engine = new Engine()

/** Drives the engine from animation frames and keeps reduced motion in sync. Returns a stop function. */
export function startDriver(target: Engine = engine): () => void {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  const syncReduced = () => {
    target.reducedMotion = query.matches
  }
  syncReduced()
  query.addEventListener('change', syncReduced)

  let last = performance.now()
  let handle = 0
  const frame = (now: number) => {
    const ms = Math.min(MAX_FRAME_MS, now - last)
    last = now
    target.advance(ms)
    handle = requestAnimationFrame(frame)
  }
  handle = requestAnimationFrame(frame)
  return () => {
    cancelAnimationFrame(handle)
    query.removeEventListener('change', syncReduced)
  }
}
