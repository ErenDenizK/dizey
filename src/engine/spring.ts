/**
 * Closed-form damped spring (mass 1). Springs are described the way people perceive them:
 * a duration in seconds (how long the motion takes to look finished) and a bounce in [0, 1)
 * (0 = no overshoot). Physics follows: angular frequency w0 = 2*pi / duration, damping ratio
 * zeta = 1 - bounce. This is the parameterisation Apple documents for SwiftUI and Core Animation
 * (WWDC23 "Animate with springs"); see docs/research/motion-and-visual-system.md.
 *
 * Because the solution is analytic, a value at time t is exact for any frame rate (60 or 120 Hz,
 * a dropped frame, or a test stepping 1 ms at a time) and costs the same at every step.
 */
export interface SpringSpec {
  /** Perceptual duration in seconds. */
  duration: number
  /** 0 = critically damped, 0.15 = barely bouncy (under 1% overshoot), 0.3 = clearly bouncy (about 5%). */
  bounce: number
}

export interface SpringPhysics {
  w0: number
  zeta: number
}

export function physicsOf(spec: SpringSpec, tempo = 1): SpringPhysics {
  const duration = Math.max(0.001, spec.duration * tempo)
  return { w0: (2 * Math.PI) / duration, zeta: 1 - Math.min(0.95, Math.max(0, spec.bounce)) }
}

/** Stiffness and damping coefficient, for comparison with libraries that take k and c. */
export function stiffnessOf(spec: SpringSpec): { k: number; c: number } {
  const { w0, zeta } = physicsOf(spec)
  return { k: w0 * w0, c: 2 * zeta * w0 }
}

/**
 * Displacement u (value - target) and its velocity after t seconds, starting from
 * displacement u0 and velocity v0 (units per second).
 */
export function solve(p: SpringPhysics, u0: number, v0: number, t: number): [u: number, v: number] {
  const { w0, zeta } = p
  if (t <= 0) return [u0, v0]
  if (zeta < 1 - 1e-6) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    const decay = Math.exp(-zeta * w0 * t)
    const b = (v0 + zeta * w0 * u0) / wd
    const cos = Math.cos(wd * t)
    const sin = Math.sin(wd * t)
    const u = decay * (u0 * cos + b * sin)
    const v = decay * ((b * wd - zeta * w0 * u0) * cos - (u0 * wd + zeta * w0 * b) * sin)
    return [u, v]
  }
  if (zeta <= 1 + 1e-6) {
    const decay = Math.exp(-w0 * t)
    const b = v0 + w0 * u0
    return [decay * (u0 + b * t), decay * (b - w0 * (u0 + b * t))]
  }
  const s = w0 * Math.sqrt(zeta * zeta - 1)
  const r1 = -zeta * w0 + s
  const r2 = -zeta * w0 - s
  const c1 = (v0 - r2 * u0) / (r1 - r2)
  const c2 = u0 - c1
  const e1 = Math.exp(r1 * t)
  const e2 = Math.exp(r2 * t)
  return [c1 * e1 + c2 * e2, c1 * r1 * e1 + c2 * r2 * e2]
}

/**
 * Time in seconds until the motion stays within `epsilon` of the target (for a unit step from rest,
 * epsilon is a fraction of the distance). Sampled, not analytic: used by tests and the motion lab,
 * never on a hot path.
 */
export function settleTime(spec: SpringSpec, epsilon = 0.01, from = 1, velocity = 0): number {
  const p = physicsOf(spec)
  const dt = 1 / 1000
  let last = 0
  for (let t = 0; t < 10; t += dt) {
    const [u] = solve(p, from, velocity, t)
    if (Math.abs(u) > epsilon * Math.abs(from || 1)) last = t
  }
  return last
}

/** Largest overshoot past the target for a unit step from rest, as a fraction of the distance. */
export function overshoot(spec: SpringSpec): number {
  const p = physicsOf(spec)
  let worst = 0
  for (let t = 0; t < 5; t += 1 / 1000) worst = Math.max(worst, -solve(p, 1, 0, t)[0])
  return worst
}
