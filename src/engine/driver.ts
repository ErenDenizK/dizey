import { Engine } from './engine'
import { MAX_FRAME_MS } from './tokens'

/** The app's one engine. Tests create their own Engine and step it by hand instead. */
export const engine = new Engine()

/**
 * Drives the engine from animation frames and keeps reduced motion in sync. Frames are measured
 * with the frame timestamp, so a 120 Hz display gets 120 updates and a stall is capped at
 * MAX_FRAME_MS instead of teleporting. Returns a stop function.
 */
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
    const ms = Math.min(MAX_FRAME_MS, Math.max(0, now - last))
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

let stopActive: (() => void) | null = null

/** Starts the app's driver once (main.tsx). */
export function startAppDriver(): void {
  stopActive ??= startDriver(engine)
}

/**
 * Frame-by-frame review: stops the real-time driver so a recorder can step the clock exactly
 * (e.g. 1000 / 60 ms per captured frame). `resume` restarts real time.
 */
export const review = {
  pause(): void {
    stopActive?.()
    stopActive = null
  },
  resume(): void {
    startAppDriver()
  },
  step(ms: number): void {
    engine.advance(ms)
  },
}
