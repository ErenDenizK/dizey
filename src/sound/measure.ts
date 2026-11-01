import { type MusicCue, planLesson, type StepKind } from './form'
import { PROGRESSION, seeded } from './harmony'
import { composeSection, freshState, idleCue, SECTION } from './music'
import { EVENTS, type SoundEvent } from './score'
import { createSynth, PALETTES, type PaletteId } from './synth'

/**
 * Offline measurement of the instrument: peak, loudness and clicks for each event. calibrate()
 * produces the TRIM table in synth.ts; the sound E2E test uses measure() to guard levels. Runs in a
 * browser (OfflineAudioContext), not in Node.
 */

const RATE = 48000

function biquad(x: Float32Array, type: 'highpass' | 'shelf', f0: number, q: number, gainDb: number) {
  const w = (2 * Math.PI * f0) / RATE
  const cos = Math.cos(w)
  const alpha = Math.sin(w) / (2 * q)
  const a = 10 ** (gainDb / 40)
  let b0: number
  let b1: number
  let b2: number
  let a0: number
  let a1: number
  let a2: number
  if (type === 'highpass') {
    b0 = (1 + cos) / 2
    b1 = -(1 + cos)
    b2 = b0
    a0 = 1 + alpha
    a1 = -2 * cos
    a2 = 1 - alpha
  } else {
    const s = 2 * Math.sqrt(a) * alpha
    b0 = a * (a + 1 + (a - 1) * cos + s)
    b1 = -2 * a * (a - 1 + (a + 1) * cos)
    b2 = a * (a + 1 + (a - 1) * cos - s)
    a0 = a + 1 - (a - 1) * cos + s
    a1 = 2 * (a - 1 - (a + 1) * cos)
    a2 = a + 1 - (a - 1) * cos - s
  }
  const y = new Float32Array(x.length)
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < x.length; i++) {
    const xi = x[i] as number
    const v = (b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
    x2 = x1
    x1 = xi
    y2 = y1
    y1 = v
    y[i] = v
  }
  return y
}

/**
 * ITU-R BS.1770 K-weighting, then the loudest 400 ms window (momentary loudness, LUFS). `phone`
 * adds two 400 Hz high-passes: a rough model of a phone speaker's missing low end.
 */
function momentary(channels: Float32Array[], phone: boolean) {
  const weighted = channels.map((c) => {
    let y = biquad(biquad(c, 'shelf', 1681.97, 0.7072, 4), 'highpass', 38.13, 0.5003, 0)
    if (phone) y = biquad(biquad(y, 'highpass', 400, Math.SQRT1_2, 0), 'highpass', 400, Math.SQRT1_2, 0)
    return y
  })
  const window = Math.floor(RATE * 0.4)
  const hop = Math.floor(RATE * 0.01)
  const sums = weighted.map((y) => {
    const s = new Float64Array(y.length + 1)
    for (let i = 0; i < y.length; i++) s[i + 1] = (s[i] as number) + (y[i] as number) ** 2
    return s
  })
  let best = 0
  for (let start = 0; start + window <= (weighted[0] as Float32Array).length; start += hop) {
    let power = 0
    for (const s of sums) power += ((s[start + window] as number) - (s[start] as number)) / window
    best = Math.max(best, power)
  }
  return -0.691 + 10 * Math.log10(best || 1e-12)
}

const pick = ({ step, steps }: { step?: number; steps?: number }) => ({
  ...(step === undefined ? {} : { step }),
  ...(steps === undefined ? {} : { steps }),
})

const round = (x: number) => Math.round(x * 10) / 10

export type Measurement = {
  event: SoundEvent
  peakDb: number
  loudness: number
  phoneLoudness: number
  /** Largest 4th difference relative to peak, dB: a click shows as a value near 0. */
  clickDb: number
}

export async function measure(
  event: SoundEvent,
  options: { levelDb?: number; masterDb?: number; step?: number; steps?: number; palette?: PaletteId } = {},
): Promise<Measurement> {
  const ctx = new OfflineAudioContext(2, RATE * 10, RATE)
  const synth = createSynth(ctx, { random: seeded(7), ...options })
  synth.play(event, { ...pick(options), index: 1 }, 0.05)
  const buffer = await ctx.startRendering()
  const channels = [buffer.getChannelData(0), buffer.getChannelData(1)]
  let peak = 0
  let click = 0
  for (const d of channels) {
    for (let i = 4; i < d.length; i++) {
      const at = (k: number) => d[i - k] as number
      peak = Math.max(peak, Math.abs(at(0)))
      click = Math.max(click, Math.abs(at(0) - 4 * at(1) + 6 * at(2) - 4 * at(3) + at(4)))
    }
  }
  return {
    event,
    peakDb: round(20 * Math.log10(peak)),
    loudness: round(momentary(channels, false)),
    phoneLoudness: round(momentary(channels, true)),
    clickDb: round(20 * Math.log10(click / peak)),
  }
}

/** Events that follow the lesson's chord are measured on every chord of the progression and power-averaged. */
async function averageLoudness(event: SoundEvent, levelDb: number, palette: PaletteId) {
  const followsStep = EVENTS[event].parts.some((part) => part.chord === 'step')
  const steps = followsStep ? PROGRESSION.map((_, i) => i) : [0]
  let power = 0
  for (const step of steps) {
    const m = await measure(event, { levelDb, masterDb: 0, step, steps: PROGRESSION.length, palette })
    power += 10 ** (m.loudness / 10)
  }
  return 10 * Math.log10(power / steps.length)
}

/** Bus level per event that meets EVENTS.loudness: render, correct, render again (the limiter is not linear). */
export async function calibrate() {
  const table = {} as Record<PaletteId, Record<SoundEvent, number>>
  for (const palette of Object.keys(PALETTES) as PaletteId[]) {
    const row: Partial<Record<SoundEvent, number>> = {}
    for (const event of Object.keys(EVENTS) as SoundEvent[]) {
      let level = -20
      for (let pass = 0; pass < 2; pass++) {
        level = round(level + EVENTS[event].loudness - (await averageLoudness(event, level, palette)))
      }
      row[event] = level
    }
    table[palette] = row as Record<SoundEvent, number>
  }
  return table
}

function loudnessOf(buffer: AudioBuffer) {
  const channels = [buffer.getChannelData(0), buffer.getChannelData(1)]
  let peak = 0
  for (const d of channels) for (const x of d) peak = Math.max(peak, Math.abs(x))
  return { loudness: round(momentary(channels, false)), peakDb: round(20 * Math.log10(peak)) }
}

/** Background music: loudness of eight sections (the whole idle walk) at the normal level, per palette. */
export async function measureMusic(palette: PaletteId = 'rhodes', masterDb = 0) {
  const sections = 8
  const ctx = new OfflineAudioContext(2, Math.ceil(RATE * (SECTION * sections + 4)), RATE)
  const synth = createSynth(ctx, { random: seeded(7), palette, masterDb })
  const random = seeded(11)
  let state = freshState(0)
  for (let n = 0; n < sections; n++) {
    const written = composeSection(idleCue(n), 0.05 + n * SECTION, random, state, n === 0)
    state = written.state
    synth.playMusic(written.notes)
  }
  return { palette, ...loudnessOf(await ctx.startRendering()) }
}

/** A planned lesson of `steps` steps: explanations with a question every fourth, so the plan has acts. */
export function sampleKinds(steps = 12): StepKind[] {
  return Array.from({ length: steps }, (_, i) => (i % 4 === 3 ? 'choice' : 'explain'))
}

/** Renders a whole planned lesson (2 sections per step) and returns the stereo buffer. */
export async function renderLesson(
  plan: readonly MusicCue[],
  options: { palette?: PaletteId; masterDb?: number; lessonEnd?: boolean; seed?: number } = {},
) {
  const { palette = 'rhodes', masterDb = 0, lessonEnd = false, seed = 0 } = options
  const sections = plan.length * 2
  const length = SECTION * sections + (lessonEnd ? 12 : 4)
  const ctx = new OfflineAudioContext(2, Math.ceil(RATE * length), RATE)
  const synth = createSynth(ctx, { random: seeded(7), palette, masterDb })
  const random = seeded(11)
  let state = freshState(seed)
  let at = 0.05
  plan.forEach((cue) => {
    state = { ...state, bar: 0 }
    for (let k = 0; k < 2; k++) {
      const written = composeSection(cue, at, random, state, k === 0)
      state = written.state
      synth.playMusic(written.notes)
      at += SECTION
    }
  })
  if (lessonEnd) synth.play('lessonEnd', { chord: plan.at(-1)?.chord ?? 'IV' }, at - 0.8)
  return ctx.startRendering()
}

/** Loudness of a whole planned lesson at its loudest (the peak energy), per palette. */
export async function measureLessonMusic(palette: PaletteId = 'rhodes', masterDb = 0, steps = 12) {
  const plan = planLesson(sampleKinds(steps), 1234)
  const buffer = await renderLesson(plan, { palette, masterDb })
  return { palette, peakEnergy: Math.max(...plan.map((c) => c.energy)), ...loudnessOf(buffer) }
}
