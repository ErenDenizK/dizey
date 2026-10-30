import { GESTURE } from './tokens'

/**
 * Gesture physics shared by every draggable thing (sheets, back swipe, the tab lens scrub).
 * Rules (docs/design/motion-system.md): the element follows the finger 1:1; past an edge it
 * resists with a rubber band; on release the decision uses where momentum would carry it, and
 * the finger's velocity is handed to the spring that finishes the motion.
 */

/** Measures release velocity from the most recent pointer samples (px/s). */
export class VelocityTracker {
  private samples: { t: number; x: number; y: number }[] = []

  reset(): void {
    this.samples = []
  }

  add(t: number, x: number, y: number): void {
    this.samples.push({ t, x, y })
    const cutoff = t - GESTURE.velocityWindow
    while (this.samples.length > 2 && (this.samples[0]?.t ?? t) < cutoff) this.samples.shift()
  }

  /** Least-squares slope over the window: steadier than the last two samples, which jitter. */
  velocity(now?: number): { x: number; y: number } {
    const last = this.samples[this.samples.length - 1]
    if (!last || this.samples.length < 2) return { x: 0, y: 0 }
    // A finger that stopped before lifting has no momentum.
    if (now !== undefined && now - last.t > 50) return { x: 0, y: 0 }
    const n = this.samples.length
    let st = 0
    let sx = 0
    let sy = 0
    for (const s of this.samples) {
      st += s.t
      sx += s.x
      sy += s.y
    }
    const mt = st / n
    const mx = sx / n
    const my = sy / n
    let num = 0
    let numY = 0
    let den = 0
    for (const s of this.samples) {
      const dt = s.t - mt
      num += dt * (s.x - mx)
      numY += dt * (s.y - my)
      den += dt * dt
    }
    if (den === 0) return { x: 0, y: 0 }
    return { x: (num / den) * 1000, y: (numY / den) * 1000 }
  }
}

/**
 * Resistance past an edge: the further you pull, the less it moves, approaching `dimension`.
 * `overshoot` is how far the finger is past the edge (px); returns how far the element moves.
 */
export function rubberBand(overshoot: number, dimension: number, c: number = GESTURE.rubberBand): number {
  if (dimension <= 0) return 0
  const sign = Math.sign(overshoot)
  const x = Math.abs(overshoot)
  return sign * (1 - 1 / ((x * c) / dimension + 1)) * dimension
}

/** Clamps a 1:1 drag position into [min, max], rubber-banding past either edge. */
export function rubberClamp(value: number, min: number, max: number, dimension: number): number {
  if (value < min) return min + rubberBand(value - min, dimension)
  if (value > max) return max + rubberBand(value - max, dimension)
  return value
}

/** Where momentum would carry a value released at `velocity` (px/s), with UIKit's deceleration. */
export function project(
  value: number,
  velocity: number,
  deceleration: number = GESTURE.deceleration,
): number {
  return value + ((velocity / 1000) * deceleration) / (1 - deceleration)
}

/** Picks the resting point nearest to where a release would coast to. */
export function nearestStop(value: number, velocity: number, stops: readonly number[]): number {
  const landing = project(value, velocity)
  let best = stops[0] ?? value
  for (const stop of stops) if (Math.abs(stop - landing) < Math.abs(best - landing)) best = stop
  return best
}
