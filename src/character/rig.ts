/**
 * The duo's spring rig (old inventory sections 3.4 to 3.6, rebuilt): every feature of a face is a channel that
 * springs toward a target, so expressions blend instead of swapping drawings. Face channels are critically damped
 * (no frame shows a shape the drawing lacks); only the body (hop, lean, landing) bounces.
 *
 * Pure and clock-free: `step(ms)` advances it, `finish()` lands it. The component binds it to the engine.
 */

export type Who = 'row' | 'col'
export type Mood = 'neutral' | 'happy' | 'proud' | 'console' | 'curious' | 'wow' | 'asleep'

const FACE = ['openL', 'openR', 'happy', 'mc', 'mo', 'brow', 'tilt', 'hy', 'blush', 'lx', 'ly'] as const
const BODY = ['y', 'rot', 'sx', 'sy'] as const
export type FaceChannel = (typeof FACE)[number]
export type BodyChannel = (typeof BODY)[number]
export type ChannelName = FaceChannel | BodyChannel

type Spring = { x: number; v: number; t: number; k: number; c: number }

const REST: Record<ChannelName, number> = {
  openL: 1,
  openR: 1,
  happy: 0,
  mc: 0.6,
  mo: 0,
  brow: 0,
  tilt: 0,
  hy: 0,
  blush: 0.3,
  lx: 0,
  ly: 0,
  y: 0,
  rot: 0,
  sx: 1,
  sy: 1,
}

/** Face targets per mood; missing keys rest. happy/proud/console are the old values; curious and wow are new. */
export const MOODS: Record<Mood, Partial<Record<FaceChannel, number>>> = {
  neutral: {},
  happy: { happy: 1, mc: 0.95, mo: 0.5, blush: 0.55 },
  proud: { openR: 0.05, happy: 0.4, mc: 1, mo: 0.2, blush: 0.8 },
  console: { happy: 0.45, mc: 0.6, brow: 1, tilt: 12, hy: 2 },
  curious: { openL: 1.12, openR: 1.12, mc: 0.25, mo: 0.3, brow: 1, tilt: 3, ly: -1.2, lx: 0.8 },
  wow: { openL: 1.2, openR: 1.2, mc: 0.35, mo: 1.15, blush: 0.45 },
  /** Eyes shut, a small calm mouth: the duo before the hello wakes it. */
  asleep: { openL: 0.04, openR: 0.04, mc: 0.45, blush: 0.4 },
}

/** Per face channel: stiffness and start delay (eyes, brows, mouth, tilt), all critically damped. */
const FACE_MOTION: Record<FaceChannel, [k: number, at: number]> = {
  happy: [520, 0],
  openL: [900, 0],
  openR: [900, 30],
  hy: [300, 0],
  brow: [520, 40],
  mc: [380, 70],
  mo: [380, 90],
  tilt: [300, 110],
  blush: [200, 60],
  lx: [420, 0],
  ly: [420, 0],
}

/** Sütun's face starts this much after Satır's. */
export const HEAD_LAG = 70
const BLINK = { dur: 170, skew: 45, col: 110 } as const
const HOP = {
  squat: 100,
  push: -205,
  stretch: 1.1,
  thin: -0.6,
  lean: 40,
  echo: 0.28,
  echoAt: 150,
  proudAt: 120,
}
const LEAN = { tilt: -4, sink: 0.9, hold: 650 }
/** How far the happy eye's lower lid rises: at 1 the eye is a soft upward arch (^), never inside out. */
const HAPPY_CAP = 1
const SUBSTEP = 1000 / 240

export class Head {
  readonly who: Who
  readonly ch = {} as Record<ChannelName, Spring>
  /** Blink starts per eye, in rig time. */
  lids: [number[], number[]] = [[], []]
  air = false
  constructor(who: Who) {
    this.who = who
    for (const name of [...FACE, ...BODY])
      this.ch[name] = { x: REST[name], v: 0, t: REST[name], k: 400, c: 40 }
  }
  value(name: ChannelName): number {
    return this.ch[name].x
  }
}

type Cue = { at: number; fn: () => void }

export class Rig {
  readonly heads: Record<Who, Head> = { row: new Head('row'), col: new Head('col') }
  now = 0
  reduced = false
  private cues: Cue[] = []

  go(head: Head, name: ChannelName, target: number, k = 400, zeta = 1, velocity?: number) {
    const s = head.ch[name]
    s.t = target
    s.k = k
    s.c = 2 * zeta * Math.sqrt(k)
    if (velocity !== undefined) s.v += velocity
    if (this.reduced) {
      s.x = target
      s.v = 0
    }
  }

  after(ms: number, fn: () => void) {
    if (ms <= 0 || this.reduced) fn()
    else this.cues.push({ at: this.now + ms, fn })
  }

  /** Sets an expression on both heads; Sütun follows Satır by HEAD_LAG. `instant` draws it at once. */
  pose(mood: Mood, instant = false) {
    const targets = MOODS[mood]
    for (const head of Object.values(this.heads)) {
      const lag = head.who === 'col' ? HEAD_LAG : 0
      for (const name of FACE) {
        const target = targets[name] ?? REST[name]
        const [k, at] = FACE_MOTION[name]
        if (instant) {
          head.ch[name].x = target
          head.ch[name].t = target
          head.ch[name].v = 0
        } else this.after(lag + at, () => this.go(head, name, target, k))
      }
    }
  }

  /** The eyes look somewhere: x and y in face units (about ±2). */
  look(x: number, y: number, delay = 0) {
    for (const head of Object.values(this.heads)) {
      const lag = head.who === 'col' ? HEAD_LAG : 0
      this.after(delay + lag, () => {
        this.go(head, 'lx', x, 420)
        this.go(head, 'ly', y, 420)
      })
    }
  }

  blink(who: Who, delay = 0) {
    if (this.reduced) return
    this.after(delay, () => {
      const head = this.heads[who]
      head.lids[0].push(this.now)
      head.lids[1].push(this.now + BLINK.skew)
    })
  }

  blinkBoth(delay = 0) {
    this.blink('row', delay)
    this.blink('col', delay + BLINK.col)
  }

  hop(who: Who, strength = 1, delay = 0) {
    if (this.reduced) return
    const head = this.heads[who]
    this.after(delay, () => {
      this.go(head, 'y', strength, 900)
      this.go(head, 'sy', 1 - 0.06 * strength, 900)
      this.go(head, 'sx', 1 + 0.035 * strength, 900)
      this.after(HOP.squat, () => {
        head.air = true
        this.go(head, 'y', 0, 360, 0.5, HOP.push * strength)
        this.go(head, 'sy', 1, 520, 0.5, HOP.stretch * strength)
        this.go(head, 'sx', 1, 520, 0.5, HOP.thin * strength)
        this.go(head, 'rot', 0, 240, 0.55, (who === 'row' ? 1 : -1) * HOP.lean * strength)
      })
    })
  }

  /** The wind-up of a leap that the caller carries out (a companion about to travel): the heads sink. */
  crouch(who: Who, delay = 0) {
    if (this.reduced) return
    const head = this.heads[who]
    this.after(delay, () => {
      this.go(head, 'y', 0.8, 900)
      this.go(head, 'sy', 0.94, 900)
      this.go(head, 'sx', 1.035, 900)
    })
  }

  /** In the air: the head is a little taller and thinner, springing back to rest if nothing lands it. */
  stretch(who: Who, delay = 0) {
    if (this.reduced) return
    const head = this.heads[who]
    this.after(delay, () => {
      this.go(head, 'y', 0, 420, 0.7)
      this.go(head, 'sy', 1.07, 420, 0.7)
      this.go(head, 'sx', 0.965, 420, 0.7)
    })
  }

  /** The end of a carried leap: a squash that settles (the hop's own landing, played on cue). */
  land(who: Who, delay = 0) {
    if (this.reduced) return
    const head = this.heads[who]
    this.after(delay, () => {
      this.go(head, 'sy', 1, 520, 0.45, -(180 * 0.05) / 2.6)
      this.go(head, 'sx', 1, 520, 0.45, (180 * 0.05) / 4)
      this.go(head, 'y', 0, 520, 0.6)
    })
  }

  lean(who: Who, delay = 0) {
    if (this.reduced) return
    const head = this.heads[who]
    this.after(delay, () => {
      this.go(head, 'y', LEAN.sink, 260)
      this.go(head, 'sy', 0.975, 260)
      this.go(head, 'sx', 1.015, 260)
      this.go(head, 'rot', LEAN.tilt, 170, 0.8)
      this.after(LEAN.hold, () => {
        this.go(head, 'rot', 0, 90, 0.85)
        this.go(head, 'y', 0, 110, 0.8)
        this.go(head, 'sy', 1, 110, 0.8)
        this.go(head, 'sx', 1, 110, 0.8)
      })
    })
  }

  /** A mood with its gesture: the old duo's reactions, plus wow (both jump, then blink) and curious (a lean). */
  react(mood: Mood) {
    this.pose(mood)
    if (mood === 'happy') {
      this.hop('row', 1)
      this.hop('col', HOP.echo, HOP.echoAt)
      this.blink('row', 520)
    } else if (mood === 'proud') {
      this.hop('row', 0.8)
      this.hop('col', 0.8, HOP.proudAt)
    } else if (mood === 'console') {
      this.lean('col')
      this.blink('col', 240)
    } else if (mood === 'wow') {
      this.hop('row', 1.25)
      this.hop('col', 1.1, 90)
      this.blinkBoth(900)
    } else if (mood === 'curious') {
      this.lean('row')
      this.blink('row', 420)
    }
  }

  /** Lid factor of one eye: 1 open, down to 0.04 mid-blink. */
  lid(head: Head, eye: 0 | 1): number {
    let factor = 1
    for (const start of head.lids[eye]) {
      const age = this.now - start
      if (age >= 0 && age < BLINK.dur)
        factor = Math.min(factor, 1 - 0.96 * Math.sin((Math.PI * age) / BLINK.dur))
    }
    return factor
  }

  /** Advances by ms; returns true while anything still moves or waits. */
  step(ms: number): boolean {
    const end = this.now + Math.min(ms, 64)
    while (this.now < end) {
      const dt = Math.min(SUBSTEP, end - this.now)
      this.now += dt
      this.runDue()
      for (const head of Object.values(this.heads)) this.integrate(head, dt / 1000)
    }
    return this.active()
  }

  /** Lands everything: cues run, springs snap, blinks end. */
  finish() {
    for (let guard = 0; guard < 200 && this.cues.length; guard++) {
      this.cues.sort((a, b) => a.at - b.at)
      const cue = this.cues.shift()
      if (!cue) break
      this.now = Math.max(this.now, cue.at)
      cue.fn()
    }
    for (const head of Object.values(this.heads)) {
      for (const s of Object.values(head.ch)) {
        s.x = s.t
        s.v = 0
      }
      head.lids = [[], []]
      head.air = false
    }
  }

  active(): boolean {
    if (this.cues.length) return true
    for (const head of Object.values(this.heads)) {
      if (head.lids.some((eye) => eye.some((start) => this.now - start < BLINK.dur))) return true
      for (const s of Object.values(head.ch))
        if (Math.abs(s.x - s.t) > 0.0008 || Math.abs(s.v) > 0.01) return true
    }
    return false
  }

  private runDue() {
    if (!this.cues.length) return
    const due = this.cues.filter((cue) => cue.at <= this.now).sort((a, b) => a.at - b.at)
    if (!due.length) return
    this.cues = this.cues.filter((cue) => cue.at > this.now)
    for (const cue of due) cue.fn()
  }

  private integrate(head: Head, dt: number) {
    const before = head.ch.y.x
    for (const s of Object.values(head.ch)) {
      const a = -s.k * (s.x - s.t) - s.c * s.v
      s.v += a * dt
      s.x += s.v * dt
    }
    head.lids = head.lids.map((eye) => eye.filter((start) => this.now - start < BLINK.dur)) as [
      number[],
      number[],
    ]
    // A landing: the head comes down through rest while falling. Harder hops land flatter.
    if (head.air && before < 0 && head.ch.y.x >= 0 && head.ch.y.v > 0) {
      head.air = false
      const hit = Math.min(head.ch.y.v, 260)
      this.go(head, 'sy', 1, 520, 0.45, (-hit * 0.05) / 2.6)
      this.go(head, 'sx', 1, 520, 0.45, (hit * 0.05) / 4)
    }
  }
}

/* Drawing: paths are functions of channel values (face units; eyes at ±6.6, mouth 6.6 below the eye line).
   Every shape is drawn a little smaller than it shows and outlined with a round stroke in the same colour
   (character.css), so no corner is ever sharp: the outline is the illustration's soft edge. */

const round = (n: number) => Math.round(n * 100) / 100

/** An eye: a tall soft oval; `happy` lifts the lower lid until it is an upward arch. */
export function eyePath(open: number, happy: number): string {
  const w = 1.9
  const h = 3.9 * Math.min(Math.max(open, 0.04), 1.2)
  const top = round(-h)
  const bottom = round(h * (1 - 1.55 * Math.min(Math.max(happy, 0), HAPPY_CAP)))
  return `M${-w} 0C${-w} ${top} ${w} ${top} ${w} 0C${w} ${bottom} ${-w} ${bottom} ${-w} 0Z`
}

/** The mouth: a small soft smile; `open` drops the lower lip into an open mouth. */
export function mouthPath(curve: number, open: number): string {
  const c = round(curve * 2.6)
  const o = round(c + Math.max(0, open) * 3.4)
  return `M-2.8 0Q0 ${c} 2.8 0Q0 ${o} -2.8 0Z`
}

/** A brow: a short soft arc. side 0 left, 1 right (the same arc; the rig tilts each side). */
export function browPath(_side: 0 | 1): string {
  return 'M-2.2 0.7Q0 -0.8 2.2 0.7'
}
