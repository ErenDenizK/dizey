import { engine } from '../engine/driver'
import { isCueEvent } from '../sound/cues'
import { CUE_TIMELINE } from '../sound/cueTimeline'
import { createScore, type SoundEvent } from '../sound/score'

/**
 * The light layer: glow, sheen and sparks for the few moments a learner earns (a lesson sealed, half the path, a
 * chapter finished, a lesson's tick landing on the path). Everything runs on the spring engine, so a tap lands it,
 * reduced motion keeps only the glows (they fade, nothing travels) and the review script can step it frame by frame.
 *
 * The light follows the music: `lightScore` reads the recorded cue's timeline, or the same score the synth plays, so a glow swells on each chord and
 * a spark leaves on each arpeggio note. With sound off the light keeps the same rhythm.
 */

export const SHINE_CHANNEL = 'shine'

/** When a reward's chords and arpeggio notes sound, in seconds from its start. */
export type LightScore = { chords: number[]; shines: number[]; end: number }

/** Notes closer than this start one chord (a chord is rolled, its voices a few hundredths apart). */
const CHORD_SPLIT = 0.3

export function lightScore(event: SoundEvent): LightScore {
  // A recorded cue brings its own timeline (rendered with it), so the light lands on the notes that are heard.
  if (isCueEvent(event)) {
    const { chords, shines, end } = CUE_TIMELINE[event]
    return { chords: [...chords], shines: [...shines], end }
  }
  const plan = createScore(() => 0.5).plan(event)
  const mains = plan.notes
    .filter((note) => note.kind === 'main')
    .map((note) => note.at)
    .sort((a, b) => a - b)
  const chords: number[] = []
  for (const at of mains) {
    const last = chords[chords.length - 1]
    if (last === undefined || at - last > CHORD_SPLIT) chords.push(at)
  }
  // A spark leaves on each melody note that comes before the home chord (the home chord has its own burst).
  const home = chords[chords.length - 1] ?? 0
  const shines = plan.notes
    .filter((note) => note.kind === 'shine' && note.at < home)
    .map((note) => note.at)
    .sort((a, b) => a - b)
  return { chords, shines, end: plan.end }
}

/**
 * Swells `--glow` on an element to `peak`, then lets it die away to `rest`. CSS reads `--glow` (0..1) for the
 * element's halo, shadow or sheen; nothing here knows how it is drawn.
 */
export function glow(el: HTMLElement, peak: number, rest = 0, prop = '--glow'): void {
  engine.to(el, { [prop]: peak }, 'bloom', {
    effect: true,
    onArrive: () => engine.to(el, { [prop]: rest }, 'ember', { effect: true }),
  })
}

/** A band of light crosses an element once (`--sweep` 0 to 1). Travel, so reduced motion skips it. */
export function sweep(el: HTMLElement): void {
  if (engine.reducedMotion) return
  engine.set(el, { '--sweep': 0 })
  engine.to(el, { '--sweep': 1 }, 'sheen', { epsilon: 0.002 })
}

/** A ring of light leaves a point and fades as it widens. */
export function ring(host: HTMLElement, x: number, y: number): void {
  if (engine.reducedMotion) return
  const el = document.createElement('i')
  el.className = 'fx-ring'
  // The ring is 20 px (ui.css): its centre sits on the point.
  el.style.left = `${x - 10}px`
  el.style.top = `${y - 10}px`
  host.append(el)
  engine.set(el, { scale: 0.5, opacity: 0.9 })
  engine.to(el, { scale: 2.8 }, 'sheen')
  engine.to(el, { opacity: 0 }, 'ember', { effect: true, epsilon: 0.01, onArrive: () => el.remove() })
}

export type BurstOptions = {
  /** Sparks in the burst. */
  count: number
  /** Launch speed, px/s (each spark varies around it). */
  speed?: number
  /** Direction of the spread's centre in degrees (0 = right, -90 = up) and its width. */
  aim?: number
  spread?: number
  /** Spark size, px. */
  size?: number
  /** Seed: the same burst draws the same sparks, so reviews are repeatable. */
  seed?: number
  /** Which colours the sparks take, in turn. */
  tones?: readonly SparkTone[]
}

export type SparkTone = 'spark' | 'action' | 'ok'

/** Air drag (1/s) and a light fall (px/s²): sparks fly out, slow almost at once and drift down like embers. */
const DRAG = 3.4
const FALL = 70
/** Life of a spark, seconds, before its variation. */
const LIFE = 1.05

type Spark = {
  el: HTMLElement
  x: number
  y: number
  vx: number
  vy: number
  spin: number
  turn: number
  size: number
  life: number
  age: number
}

/**
 * Four-pointed sparks thrown from a point (layer coordinates). Free physics on an engine ticker: drag, a light fall,
 * a twinkle (grow fast, shrink slowly) and a spin; a tap on the channel ends them. Reduced motion: no sparks.
 */
export function burst(layer: HTMLElement, x: number, y: number, options: BurstOptions): void {
  if (engine.reducedMotion || options.count <= 0) return
  const random = seeded(options.seed ?? 1)
  const speed = options.speed ?? 190
  const aim = ((options.aim ?? -90) * Math.PI) / 180
  const spread = ((options.spread ?? 360) * Math.PI) / 180
  const tones = options.tones ?? ['spark']
  const sparks: Spark[] = []
  for (let i = 0; i < options.count; i++) {
    // Even spacing with a little jitter, so a burst never clumps on one side.
    const angle = aim - spread / 2 + (spread * (i + 0.5 + (random() - 0.5) * 0.7)) / options.count
    const v = speed * (0.55 + random() * 0.7)
    const el = document.createElement('i')
    el.className = 'fx-spark'
    el.dataset.tone = tones[i % tones.length]
    layer.append(el)
    const size = (options.size ?? 16) * (0.6 + random() * 0.7)
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    sparks.push({
      el,
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      spin: random() * 45,
      turn: (random() < 0.5 ? -1 : 1) * (90 + random() * 120),
      size,
      life: LIFE * (0.75 + random() * 0.5),
      age: 0,
    })
  }
  const draw = (spark: Spark) => {
    const t = Math.min(1, spark.age / spark.life)
    // Twinkle: full size by 12 % of its life, then a slow shrink; light fades over the last half.
    const scale = t < 0.12 ? t / 0.12 : 1 - ((t - 0.12) / 0.88) ** 1.6
    const opacity = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5
    const half = spark.size / 2
    spark.el.style.transform = `translate3d(${(spark.x - half).toFixed(2)}px, ${(spark.y - half).toFixed(2)}px, 0) rotate(${spark.spin.toFixed(1)}deg) scale(${scale.toFixed(3)})`
    spark.el.style.opacity = opacity.toFixed(3)
  }
  for (const spark of sparks) draw(spark)
  engine.addTicker({
    step(ms) {
      const dt = ms / 1000
      const keep = Math.exp(-DRAG * dt)
      let alive = false
      for (const spark of sparks) {
        if (spark.age >= spark.life) continue
        spark.age += dt
        spark.vx *= keep
        spark.vy = spark.vy * keep + FALL * dt
        spark.x += spark.vx * dt
        spark.y += spark.vy * dt
        spark.spin += spark.turn * dt
        if (spark.age >= spark.life) spark.el.remove()
        else {
          draw(spark)
          alive = true
        }
      }
      return alive
    },
    finish() {
      for (const spark of sparks) spark.el.remove()
    },
  })
}

/** A point's position inside a layer, from both elements' boxes (scroll and transforms included). */
export function pointIn(layer: HTMLElement, el: Element, fx = 0.5, fy = 0.5): { x: number; y: number } {
  const box = layer.getBoundingClientRect()
  const at = el.getBoundingClientRect()
  return { x: at.left - box.left + at.width * fx, y: at.top - box.top + at.height * fy }
}

/** mulberry32: a tiny repeatable random source. */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
