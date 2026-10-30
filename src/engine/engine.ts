import { ENTRANCE_FULL, ENTRANCE_LOW, FINISH_GUARD, SPRINGS, type SpringName } from './constants'

/**
 * One virtual clock for every animation: cue timers, springs and free-physics tickers.
 * No CSS transitions for movement, no Web Animations API, no setTimeout. That gives three
 * guarantees: a tap can finish any running animation, tests step time deterministically,
 * and reduced motion is one switch.
 *
 * Ported from the earlier app's engine (Eren kept its in-lesson layer, 2026-10-30). Not ported yet:
 * cue gates and teaching runners; they arrive with the lesson player.
 */

/** 'chrome' is UI motion (taps, sheets, navigation); teaching channels such as 'beat' and 'reveal' can be finished early. */
export type Channel = string

/** Anything the engine can animate: a DOM element, or a plain object in tests. */
export interface Target {
  style?: { transform: string; opacity: string; filter: string }
  isConnected?: boolean
}

type Prop = 'x' | 'y' | 'scale' | 'scaleX' | 'scaleY' | 'rotate' | 'opacity' | 'ink' | (string & {})

const TRANSFORM_PROPS = new Set<Prop>(['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate'])
const PIXEL_PROPS = new Set<Prop>(['x', 'y', 'rotate', 'count'])
const DEFAULTS: Record<string, number> = {
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  opacity: 1,
  ink: 1,
}

interface Spring {
  k: number
  c: number
  target: number
  velocity: number
  channel: Channel
}

interface Arrival {
  fn: () => void
  props: Prop[]
  epsilon: number
  channel: Channel
}

export interface MotionState {
  values: Record<string, number>
  springs: Record<string, Spring>
  arrivals: Arrival[]
  render: ((state: MotionState, target: Target) => void) | null
  inked: boolean
}

interface Timer {
  at: number
  fn: () => void
  serial: number
  channel: Channel
}

/** Free physics (particles): step returns false when done; finish ends it at once. */
export interface Ticker {
  step(ms: number): boolean | undefined
  finish(): void
  channel?: Channel
}

export interface SpringOptions {
  onArrive?: () => void
  /** Arrival distance in px for x and y. */
  epsilon?: number
  /** Initial push in units per second, e.g. a shake starts at rest. */
  velocity?: Partial<Record<Prop, number>>
  /** Stiffness factor: a long carry slows down to stay below the eye's pursuit limit. */
  kScale?: number
}

export class Engine {
  now = 0
  reducedMotion = false
  private channel: Channel = 'chrome'
  private timers: Timer[] = []
  private serial = 0
  private readonly states = new Map<Target, MotionState>()
  private tickers: Ticker[] = []
  private readonly tempos = new Map<Channel, number>()

  /** Time scale for cue timers and springs started in a channel (1 = as written). */
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

  /** A cue timer on the virtual clock, scaled by the current channel's tempo. */
  after(ms: number, fn: () => void): void {
    this.timers.push({ at: this.now + ms * this.tempoOf(), fn, serial: ++this.serial, channel: this.channel })
  }

  /** A wait on a teaching channel that belongs to the chrome's timeline: undoes the channel's tempo. */
  chromeDelay(ms: number): number {
    return ms / this.tempoOf()
  }

  cancelTimers(): void {
    this.timers = []
  }

  busy(name?: Channel): boolean {
    return this.timers.some((t) => name === undefined || t.channel === name)
  }

  stateOf(target: Target): MotionState {
    let state = this.states.get(target)
    if (!state) {
      state = { values: { ...DEFAULTS }, springs: {}, arrivals: [], render: null, inked: false }
      this.states.set(target, state)
    }
    return state
  }

  /** Attaches a render function for custom channels (a stroke being drawn, a number counting up). */
  bind(target: Target, render: MotionState['render'], values: Record<string, number> = {}): MotionState {
    const state = this.stateOf(target)
    state.render = render
    Object.assign(state.values, values)
    this.apply(target, state)
    return state
  }

  set(target: Target, values: Partial<Record<Prop, number>>): void {
    const state = this.stateOf(target)
    for (const [prop, value] of Object.entries(values)) {
      if (value === undefined) continue
      state.values[prop] = value
      delete state.springs[prop]
    }
    this.apply(target, state)
  }

  /** Springs `targets` with a preset. New targets start from the live value and velocity. */
  to(
    target: Target,
    targets: Partial<Record<Prop, number>>,
    preset: SpringName,
    options: SpringOptions = {},
  ): void {
    const state = this.stateOf(target)
    const tempo = this.tempoOf()
    for (const [prop, goal] of Object.entries(targets)) {
      if (goal === undefined) continue
      const current = state.values[prop] ?? DEFAULTS[prop] ?? 0
      state.values[prop] = current
      const effect = prop === 'opacity'
      // Reduced motion: only opacity animates; everything else lands at once.
      if (!effect && this.reducedMotion) {
        state.values[prop] = goal
        delete state.springs[prop]
        continue
      }
      // Effects (opacity) and custom channels never overshoot.
      const config = !TRANSFORM_PROPS.has(prop) && SPRINGS[preset].zeta < 1 ? SPRINGS.fade : SPRINGS[preset]
      // Tempo t scales time: stiffness by 1/t², pushes by 1/t; the damping ratio stays.
      let k = (config.k * (options.kScale ?? 1)) / (tempo * tempo)
      let zeta: number = config.zeta
      // An entrance (invisible to readable) is never quicker than SPRINGS.enter: nothing pops in.
      if (effect && current <= ENTRANCE_LOW && goal >= ENTRANCE_FULL && k > SPRINGS.enter.k) {
        k = SPRINGS.enter.k
        zeta = SPRINGS.enter.zeta
      }
      const push = options.velocity?.[prop]
      state.springs[prop] = {
        k,
        c: 2 * zeta * Math.sqrt(k),
        target: goal,
        velocity: push !== undefined ? push / tempo : (state.springs[prop]?.velocity ?? 0),
        channel: this.channel,
      }
    }
    if (options.onArrive) {
      state.arrivals.push({
        fn: options.onArrive,
        props: Object.keys(targets),
        epsilon: options.epsilon ?? 1.5,
        channel: this.channel,
      })
    }
    this.apply(target, state)
    this.checkArrivals(state)
  }

  addTicker(ticker: Ticker): void {
    ticker.channel = this.channel
    this.tickers.push(ticker)
  }

  /** Advances the virtual clock: due cues run in order, then springs and tickers integrate. */
  advance(ms: number): void {
    this.now += ms
    for (let timer = this.popDue(this.now); timer; timer = this.popDue(this.now)) this.run(timer)
    this.integrate(ms)
  }

  /** True while channel `name` still shows motion (sub-pixel tails do not count). */
  isMoving(name: Channel): boolean {
    for (const state of this.states.values()) {
      if (state.arrivals.some((a) => a.channel === name)) return true
      for (const [prop, spring] of Object.entries(state.springs)) {
        if (spring.channel !== name) continue
        const near = PIXEL_PROPS.has(prop) ? 1 : prop === 'opacity' ? 0.08 : 0.01
        if (
          Math.abs((state.values[prop] ?? 0) - spring.target) > near ||
          Math.abs(spring.velocity) > near * 20
        ) {
          return true
        }
      }
    }
    return this.tickers.some((t) => t.channel === name)
  }

  isActive(name?: Channel, except?: ReadonlySet<Target>): boolean {
    for (const [target, state] of this.states) {
      if (except?.has(target)) continue
      if (Object.values(state.springs).some((s) => name === undefined || s.channel === name)) return true
      if (state.arrivals.some((a) => name === undefined || a.channel === name)) return true
    }
    return this.tickers.some((t) => name === undefined || t.channel === name)
  }

  /** Lands everything: runs every pending cue and snaps every spring. */
  finishAll(except?: ReadonlySet<Target>): void {
    for (let guard = 0; guard < FINISH_GUARD; guard++) {
      this.snap(undefined, except)
      if (!this.flushOne() && !this.isActive(undefined, except)) break
    }
  }

  /** Lands one channel on its end state and leaves the rest running; the clock keeps its time. */
  finishChannel(name: Channel, except?: ReadonlySet<Target>): void {
    const now = this.now
    for (let guard = 0; guard < FINISH_GUARD; guard++) {
      this.snap(name, except)
      if (!this.flushOne(name) && !this.isActive(name, except)) break
    }
    this.now = now
  }

  /** Runs `fn` on the chrome channel once channel `name` has no cues and no motion left. */
  whenIdle(name: Channel, fn: () => void, poll = 50): void {
    const check = () => {
      if (this.busy(name) || this.isActive(name)) this.after(poll, check)
      else fn()
    }
    this.withChannel('chrome', () => this.after(poll, check))
  }

  private popDue(limit: number, name?: Channel): Timer | undefined {
    let best = -1
    this.timers.forEach((timer, index) => {
      if (timer.at > limit || (name !== undefined && timer.channel !== name)) return
      const current = this.timers[best]
      if (!current || timer.at < current.at || (timer.at === current.at && timer.serial < current.serial))
        best = index
    })
    return best < 0 ? undefined : this.timers.splice(best, 1)[0]
  }

  private run(timer: Timer): void {
    this.withChannel(timer.channel, timer.fn)
  }

  private flushOne(name?: Channel): boolean {
    const timer = this.popDue(Number.POSITIVE_INFINITY, name)
    if (!timer) return false
    this.now = Math.max(this.now, timer.at)
    this.run(timer)
    return true
  }

  private integrate(ms: number): void {
    const dt = ms / 1000
    const substeps = Math.max(1, Math.ceil(dt * 240))
    const h = dt / substeps
    for (const [target, state] of this.states) {
      const props = Object.keys(state.springs)
      if (!props.length && !state.arrivals.length) {
        if (target.isConnected === false) this.states.delete(target)
        continue
      }
      for (const prop of props) {
        const spring = state.springs[prop]
        if (!spring) continue
        let value = state.values[prop] ?? 0
        for (let i = 0; i < substeps; i++) {
          const accel = -spring.k * (value - spring.target) - spring.c * spring.velocity
          spring.velocity += accel * h
          value += spring.velocity * h
        }
        const coarse = PIXEL_PROPS.has(prop)
        if (
          Math.abs(value - spring.target) < (coarse ? 0.05 : 0.0005) &&
          Math.abs(spring.velocity) < (coarse ? 2 : 0.005)
        ) {
          value = spring.target
          delete state.springs[prop]
        }
        state.values[prop] = value
      }
      this.apply(target, state)
      this.checkArrivals(state)
    }
    if (this.tickers.length) {
      const running = this.tickers
      this.tickers = []
      this.tickers = running.filter((t) => t.step(ms) !== false).concat(this.tickers)
    }
  }

  private snap(name?: Channel, except?: ReadonlySet<Target>): void {
    const ending = this.tickers.filter((t) => name === undefined || t.channel === name)
    this.tickers = this.tickers.filter((t) => !ending.includes(t))
    for (const t of ending) t.finish()
    for (const [target, state] of this.states) {
      if (except?.has(target)) continue
      let changed = false
      for (const [prop, spring] of Object.entries(state.springs)) {
        if (name !== undefined && spring.channel !== name) continue
        state.values[prop] = spring.target
        delete state.springs[prop]
        changed = true
      }
      if (!changed && !state.arrivals.length) continue
      this.apply(target, state)
      this.checkArrivals(state)
    }
  }

  private checkArrivals(state: MotionState): void {
    if (!state.arrivals.length) return
    const fired: Arrival[] = []
    state.arrivals = state.arrivals.filter((arrival) => {
      const near = arrival.props.every((prop) => {
        const spring = state.springs[prop]
        if (!spring) return true
        const epsilon = prop === 'x' || prop === 'y' ? arrival.epsilon : 0.02
        return Math.abs((state.values[prop] ?? 0) - spring.target) < epsilon
      })
      if (near) fired.push(arrival)
      return !near
    })
    for (const arrival of fired) this.withChannel(arrival.channel, arrival.fn)
  }

  private apply(target: Target, state: MotionState): void {
    const v = state.values
    const sx = (v.scale ?? 1) * (v.scaleX ?? 1)
    const sy = (v.scale ?? 1) * (v.scaleY ?? 1)
    const x = v.x ?? 0
    const y = v.y ?? 0
    const rotate = v.rotate ?? 0
    const opacity = v.opacity ?? 1
    const ink = v.ink ?? 1
    if (target.style) {
      const identity = x === 0 && y === 0 && rotate === 0 && sx === 1 && sy === 1
      target.style.transform = identity
        ? ''
        : `translate3d(${x}px, ${y}px, 0)${rotate ? ` rotate(${rotate}deg)` : ''} scale(${sx}${sx === sy ? '' : `, ${sy}`})`
      target.style.opacity = opacity === 1 ? '' : String(Math.max(0, Math.min(1, opacity)))
      // Ink dimmed under a passing chip: a filter, so it never fights the element's opacity.
      if (ink !== 1 || state.inked) {
        target.style.filter = ink < 0.999 ? `opacity(${Math.max(0, ink).toFixed(3)})` : ''
        state.inked = ink < 0.999
      }
    }
    state.render?.(state, target)
  }
}
