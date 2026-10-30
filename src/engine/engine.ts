import { physicsOf, type SpringPhysics, type SpringSpec, solve } from './spring'
import { LEGACY_NAMES, type LegacyName, SPRINGS, type SpringName } from './tokens'

/**
 * One virtual clock for every animation in Dizey: springs, cue timers and free-physics tickers.
 *
 * Guarantees, by construction:
 * - Interruptible: a new target starts from the live value and the live velocity, so motion
 *   never jumps or stalls when the finger changes its mind.
 * - Finishable: any channel (e.g. 'chrome' for UI, 'beat' for a lesson step) can land on its end
 *   state at once, so a tap never waits for an animation.
 * - Deterministic: time only moves through `advance`, so tests step it exactly.
 * - Frame-rate independent: springs are solved in closed form (see spring.ts), so 60 Hz, 120 Hz
 *   and dropped frames all show the same curve.
 * - Reduced motion is one switch: spatial values land at once, effects (opacity) still fade.
 *
 * The engine writes `transform`, `opacity` and CSS custom properties straight to elements, so React
 * never re-renders per frame.
 */

export type Channel = string

/** Anything the engine can animate: a DOM element, or a plain object in tests. */
export interface Target {
  style?: {
    transform: string
    opacity: string
    setProperty?: (name: string, value: string) => void
  }
  isConnected?: boolean
}

/** A named token or an inline spec (inline specs are for the motion lab and tests only). */
export type SpringRef = SpringName | LegacyName | SpringSpec

const TRANSFORM_KEYS = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate']
/** Effect properties never overshoot and still animate under reduced motion. */
const EFFECT_PROPS = new Set(['opacity', 'dim', 'blur'])
const DEFAULTS: Record<string, number> = { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 }
/** Distances below which a property counts as settled, by unit. */
const PIXEL_EPSILON = 0.05
const UNIT_EPSILON = 0.0005

interface Motion {
  start: number
  u0: number
  v0: number
  target: number
  physics: SpringPhysics
  channel: Channel
  /** Distance below which the motion counts as settled. */
  epsilon: number
}

interface Arrival {
  props: string[]
  fn: () => void
  channel: Channel
}

export interface MotionState {
  values: Record<string, number>
  motions: Record<string, Motion>
  arrivals: Arrival[]
  render: ((values: Record<string, number>, target: Target) => void) | null
}

interface Timer {
  at: number
  fn: () => void
  serial: number
  channel: Channel
}

/** Free physics (a flick's momentum, particles): step returns false when done; finish ends it at once. */
export interface Ticker {
  step(ms: number): boolean | undefined
  finish(): void
  channel?: Channel
}

export interface ToOptions {
  /** Initial velocity in units per second, e.g. the finger's speed at release. */
  velocity?: Record<string, number>
  /** Runs once every property of this call has settled. */
  onArrive?: () => void
  /** Treat every property in this call as an effect: no overshoot, still animates in reduced motion. */
  effect?: boolean
  /**
   * 0..1: start already moving toward the target (see CHOREO.launch). For motion a tap starts; motion a
   * finger hands over carries the finger's own velocity instead.
   */
  launch?: number
  /** Settle tolerance in the property's units, when "close enough" is coarser than the default. */
  epsilon?: number
}

function specOf(ref: SpringRef): SpringSpec {
  if (typeof ref !== 'string') return ref
  return SPRINGS[ref in LEGACY_NAMES ? LEGACY_NAMES[ref as LegacyName] : (ref as SpringName)]
}

function epsilonOf(prop: string): number {
  return prop === 'x' || prop === 'y' || prop === 'rotate' || prop.startsWith('--px')
    ? PIXEL_EPSILON
    : UNIT_EPSILON
}

export class Engine {
  /** Virtual time in ms. */
  now = 0
  reducedMotion = false
  private channel: Channel = 'chrome'
  private timers: Timer[] = []
  private serial = 0
  private readonly states = new Map<Target, MotionState>()
  private tickers: Ticker[] = []
  private readonly tempos = new Map<Channel, number>()

  /** Time scale for springs and cue timers started in a channel (1 = as written, 1.5 = slower). */
  setTempo(channel: Channel, tempo: number): void {
    this.tempos.set(channel, tempo)
  }

  tempoOf(channel: Channel = this.channel): number {
    return this.tempos.get(channel) ?? 1
  }

  get currentChannel(): Channel {
    return this.channel
  }

  withChannel<T>(name: Channel, fn: () => T): T {
    const previous = this.channel
    this.channel = name
    try {
      return fn()
    } finally {
      this.channel = previous
    }
  }

  /** A cue on the virtual clock after `ms`, scaled by the channel's tempo. */
  after(ms: number, fn: () => void): void {
    this.timers.push({ at: this.now + ms * this.tempoOf(), fn, serial: ++this.serial, channel: this.channel })
  }

  /** Drops pending cues (of one channel, or all). Running springs keep going. */
  cancelCues(name?: Channel): void {
    this.timers = this.timers.filter((t) => name !== undefined && t.channel !== name)
  }

  stateOf(target: Target): MotionState {
    let state = this.states.get(target)
    if (!state) {
      state = { values: {}, motions: {}, arrivals: [], render: null }
      this.states.set(target, state)
    }
    return state
  }

  /** The live value of a property. */
  value(target: Target, prop: string): number {
    return this.stateOf(target).values[prop] ?? DEFAULTS[prop] ?? 0
  }

  /** The live velocity of a property in units per second (0 when at rest). */
  velocity(target: Target, prop: string): number {
    const motion = this.stateOf(target).motions[prop]
    if (!motion) return 0
    return solve(motion.physics, motion.u0, motion.v0, (this.now - motion.start) / 1000)[1]
  }

  /** Attaches a render function for values that are not transform or opacity. */
  bind(target: Target, render: MotionState['render'], values: Record<string, number> = {}): void {
    const state = this.stateOf(target)
    state.render = render
    Object.assign(state.values, values)
    this.apply(target, state)
  }

  /** Jumps to values with no motion (e.g. while a finger drags 1:1). */
  set(target: Target, values: Record<string, number | undefined>): void {
    const state = this.stateOf(target)
    for (const [prop, value] of Object.entries(values)) {
      if (value === undefined) continue
      state.values[prop] = value
      delete state.motions[prop]
    }
    this.apply(target, state)
    this.checkArrivals(state)
  }

  /** Springs each property to its target. A running motion is retargeted from its live value and velocity. */
  to(
    target: Target,
    values: Record<string, number | undefined>,
    ref: SpringRef,
    options: ToOptions = {},
  ): void {
    const state = this.stateOf(target)
    const spec = specOf(ref)
    const tempo = this.tempoOf()
    const props: string[] = []
    for (const [prop, goal] of Object.entries(values)) {
      if (goal === undefined) continue
      props.push(prop)
      const effect = options.effect === true || EFFECT_PROPS.has(prop)
      const current = state.values[prop] ?? DEFAULTS[prop] ?? 0
      if (this.reducedMotion && !effect) {
        state.values[prop] = goal
        delete state.motions[prop]
        continue
      }
      const physics = physicsOf(effect ? { duration: spec.duration, bounce: 0 } : spec, tempo)
      const pushed = options.velocity?.[prop]
      let v0 = pushed !== undefined ? pushed : this.velocity(target, prop)
      // A launch turns the spring's slow start into an immediate one: at 1 the critically damped curve
      // becomes a pure exponential ease-out, so a tap moves things on the very next frame.
      if (pushed === undefined && options.launch) v0 += -options.launch * physics.w0 * (current - goal)
      state.values[prop] = current
      // Settled within a ten-thousandth of the travel (never finer than the unit's floor, never coarser
      // than a tenth of a pixel), so a 700 px clip and a 0.03 scale both finish once the eye can no
      // longer see them move.
      const epsilon =
        options.epsilon ??
        Math.min(PIXEL_EPSILON * 2, Math.max(epsilonOf(prop), Math.abs(current - goal) * 1e-4))
      state.motions[prop] = {
        start: this.now,
        u0: current - goal,
        v0,
        target: goal,
        physics,
        channel: this.channel,
        epsilon,
      }
    }
    if (options.onArrive) state.arrivals.push({ props, fn: options.onArrive, channel: this.channel })
    this.apply(target, state)
    this.checkArrivals(state)
  }

  addTicker(ticker: Ticker): void {
    ticker.channel = this.channel
    this.tickers.push(ticker)
  }

  /** Moves the clock forward: due cues run in order, then springs and tickers update. */
  advance(ms: number): void {
    const end = this.now + ms
    for (let timer = this.popDue(end); timer; timer = this.popDue(end)) {
      this.now = Math.max(this.now, timer.at)
      this.run(timer)
    }
    const step = end - this.now
    this.now = end
    this.update()
    if (this.tickers.length) {
      const running = this.tickers
      this.tickers = []
      this.tickers = running.filter((t) => t.step(step) !== false).concat(this.tickers)
    }
  }

  /** True while anything (of one channel) is moving or waiting. */
  isActive(name?: Channel): boolean {
    if (this.timers.some((t) => name === undefined || t.channel === name)) return true
    if (this.tickers.some((t) => name === undefined || t.channel === name)) return true
    for (const state of this.states.values()) {
      for (const motion of Object.values(state.motions))
        if (name === undefined || motion.channel === name) return true
    }
    return false
  }

  /** Lands one channel on its end state now: cues run in order, springs snap, tickers finish. */
  finishChannel(name: Channel): void {
    const now = this.now
    for (let guard = 0; guard < 5000; guard++) {
      this.snap(name)
      const timer = this.popDue(Number.POSITIVE_INFINITY, name)
      if (!timer) break
      this.now = Math.max(this.now, timer.at)
      this.run(timer)
    }
    this.now = now
  }

  /** Lands everything. */
  finishAll(): void {
    for (let guard = 0; guard < 5000; guard++) {
      this.snap()
      const timer = this.popDue(Number.POSITIVE_INFINITY)
      if (!timer) break
      this.now = Math.max(this.now, timer.at)
      this.run(timer)
    }
  }

  private popDue(limit: number, name?: Channel): Timer | undefined {
    let best = -1
    for (let i = 0; i < this.timers.length; i++) {
      const timer = this.timers[i] as Timer
      if (timer.at > limit || (name !== undefined && timer.channel !== name)) continue
      const current = this.timers[best]
      if (!current || timer.at < current.at || (timer.at === current.at && timer.serial < current.serial))
        best = i
    }
    return best < 0 ? undefined : this.timers.splice(best, 1)[0]
  }

  private run(timer: Timer): void {
    this.update()
    this.withChannel(timer.channel, timer.fn)
  }

  private update(): void {
    for (const [target, state] of this.states) {
      const props = Object.keys(state.motions)
      if (!props.length) {
        if (target.isConnected === false && !state.arrivals.length) this.states.delete(target)
        continue
      }
      for (const prop of props) {
        const motion = state.motions[prop] as Motion
        const [u, v] = solve(motion.physics, motion.u0, motion.v0, (this.now - motion.start) / 1000)
        const epsilon = motion.epsilon
        if (Math.abs(u) < epsilon && Math.abs(v) < epsilon * 20) {
          state.values[prop] = motion.target
          delete state.motions[prop]
        } else {
          state.values[prop] = motion.target + u
        }
      }
      this.apply(target, state)
      this.checkArrivals(state)
    }
  }

  private snap(name?: Channel): void {
    const ending = this.tickers.filter((t) => name === undefined || t.channel === name)
    this.tickers = this.tickers.filter((t) => !ending.includes(t))
    for (const ticker of ending) ticker.finish()
    for (const [target, state] of this.states) {
      let changed = false
      for (const [prop, motion] of Object.entries(state.motions)) {
        if (name !== undefined && motion.channel !== name) continue
        state.values[prop] = motion.target
        delete state.motions[prop]
        changed = true
      }
      if (changed) this.apply(target, state)
      this.checkArrivals(state)
    }
  }

  private checkArrivals(state: MotionState): void {
    if (!state.arrivals.length) return
    const due = state.arrivals.filter((a) => a.props.every((p) => !state.motions[p]))
    if (!due.length) return
    state.arrivals = state.arrivals.filter((a) => !due.includes(a))
    for (const arrival of due) this.withChannel(arrival.channel, arrival.fn)
  }

  private apply(target: Target, state: MotionState): void {
    const style = target.style
    if (style) {
      const v = state.values
      // Only properties the engine was asked to drive are written; the rest stay with CSS.
      if (TRANSFORM_KEYS.some((key) => key in v)) {
        const x = v.x ?? 0
        const y = v.y ?? 0
        const rotate = v.rotate ?? 0
        const sx = (v.scale ?? 1) * (v.scaleX ?? 1)
        const sy = (v.scale ?? 1) * (v.scaleY ?? 1)
        const identity = x === 0 && y === 0 && rotate === 0 && sx === 1 && sy === 1
        style.transform = identity
          ? ''
          : `translate3d(${round(x)}px, ${round(y)}px, 0)${rotate ? ` rotate(${round(rotate)}deg)` : ''} scale(${round4(sx)}${sx === sy ? '' : `, ${round4(sy)}`})`
      }
      if ('opacity' in v) style.opacity = String(round4(Math.min(1, Math.max(0, v.opacity as number))))
      if (style.setProperty) {
        for (const prop of Object.keys(v)) {
          if (prop.startsWith('--')) style.setProperty(prop, String(round4(v[prop] as number)))
        }
      }
    }
    state.render?.(state.values, target)
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}
