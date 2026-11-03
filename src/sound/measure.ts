import { createConductor, createLearner } from './conductor'
import { type Flourish, hashOf, type MusicCue, planLesson, type StepKind, type Theme } from './form'
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
  plan.forEach((planned, i) => {
    state = { ...state, bar: 0 }
    // The loudest music a lesson makes: a rise on every arrival, a peak on the last two steps.
    const flourish: Flourish | undefined =
      i >= plan.length - 2 ? 'peak' : planned.role === 'arrival' ? 'rise' : undefined
    for (let k = 0; k < 2; k++) {
      const cue = k === 0 && flourish ? { ...planned, flourish } : planned
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
export async function measureLessonMusic(
  palette: PaletteId = 'rhodes',
  masterDb = 0,
  steps = 12,
  theme: Theme = 'S',
) {
  const plan = planLesson(sampleKinds(steps), 1234, theme)
  const buffer = await renderLesson(plan, { palette, masterDb })
  return { palette, peakEnergy: Math.max(...plan.map((c) => c.energy)), ...loudnessOf(buffer) }
}

/**
 * A listening sample: a lesson played the way a learner plays it, through the real conductor and
 * synth, offline. Steps change every 6 to 14 s (seeded), questions are answered (the first one
 * wrong, the rest right, so a streak builds), the lesson ends. Returns mono samples at `rate`.
 */
export async function renderListening(
  kinds: readonly StepKind[],
  lessonSeed: number,
  options: { rate?: number; palette?: PaletteId; maxSeconds?: number; theme?: Theme } = {},
) {
  const { rate = 22050, palette = 'rhodes', maxSeconds = 185, theme } = options
  const plan = planLesson(kinds, lessonSeed, theme)
  const random = seeded(99)
  // Step durations, then the whole thing scaled to fit the sample's length.
  let lengths = plan.map(() => 6 + random() * 8)
  const total = lengths.reduce((a, b) => a + b, 0)
  if (total > maxSeconds) lengths = lengths.map((l) => (l * maxSeconds) / total)
  const length = Math.ceil(lengths.reduce((a, b) => a + b, 0) + 22)
  const ctx = new OfflineAudioContext(1, rate * length, rate)
  const synth = createSynth(ctx, { random: seeded(7), palette })

  let clock = 0
  let step = 0
  const learner = createLearner()
  const conductor = createConductor({
    now: () => clock,
    sink: { play: (notes, at) => synth.playMusic(notes, at), cut: (at, tau) => synth.cutMusic(at, tau) },
    random: seeded(5),
    wanted: (n) => {
      const cue = plan[step] ?? idleCue(n)
      return { ...cue, energy: learner.energy(cue.energy, step) }
    },
  })
  conductor.setSeed(plan[0]?.seed ?? 0)

  const sound = (event: SoundEvent, at: number, index = step) => {
    clock = at
    learner.heard(event)
    const context = { chord: plan[index]?.chord ?? 'I', step: index, steps: plan.length }
    const played = synth.play(event, context, at)
    if (EVENTS[event].tier === 'lesson' || EVENTS[event].tier === 'reward') conductor.fade(played.end - 1.5)
  }

  type Item = { at: number; run: () => void }
  const items: Item[] = []
  let at = 0.3
  items.push({ at, run: () => sound('lessonOpen', 0.3) })
  let questions = 0
  let streak = 0
  plan.forEach((cue, i) => {
    const start = at
    const kind = kinds[i] as StepKind
    if (i > 0)
      items.push({
        at: start,
        run: () => {
          clock = start
          step = i
          sound('step', start, i)
          conductor.request(learner.stepped(i, cue.role, true))
        },
      })
    if (kind === 'choice' || kind === 'keypad') {
      const answerAt = start + (lengths[i] as number) * 0.55
      const wrong = questions === 0
      questions++
      if (wrong) items.push({ at: answerAt - 1.2, run: () => sound('wrong', answerAt - 1.2, i) })
      items.push({
        at: answerAt,
        run: () => {
          streak = wrong ? 0 : streak + 1
          sound(streak >= 3 ? 'streak' : 'correct', answerAt, i)
        },
      })
    }
    at += lengths[i] as number
  })
  const endAt = at
  items.push({ at: endAt, run: () => sound('lessonEnd', endAt) })

  // The transport ticks every 400 ms; sounds and steps land between ticks, in time order.
  items.sort((a, b) => a.at - b.at)
  let nextTick = 0
  let k = 0
  while (nextTick < length - 8) {
    const item = items[k]
    if (item && item.at <= nextTick) {
      item.run()
      k++
    } else {
      clock = nextTick
      conductor.tick()
      nextTick += 0.4
    }
  }

  const buffer = await ctx.startRendering()
  return { seconds: length, steps: plan.length, questions, int16: toInt16(buffer.getChannelData(0)) }
}

/** Peak-normalised to -1 dBFS, 16-bit. */
function toInt16(samples: Float32Array) {
  let peak = 0
  for (const x of samples) peak = Math.max(peak, Math.abs(x))
  const gain = 10 ** (-1 / 20) / (peak || 1)
  const int16 = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++)
    int16[i] = Math.round(Math.max(-1, Math.min(1, (samples[i] as number) * gain)) * 32767)
  return int16
}

/**
 * The five themes back to back, `seconds` each (home, M, R, D, S): each over the first steps of a
 * planned lesson in its unit, at a steady middle energy, steps every 5 s. Mono samples at `rate`.
 */
export async function renderThemes(options: { rate?: number; seconds?: number; palette?: PaletteId } = {}) {
  const { rate = 22050, seconds = 15, palette = 'rhodes' } = options
  const themes: Theme[] = ['home', 'M', 'R', 'D', 'S']
  const ctx = new OfflineAudioContext(1, rate * (seconds * themes.length + 6), rate)
  const synth = createSynth(ctx, { random: seeded(7), palette })
  themes.forEach((theme, n) => {
    const plan = planLesson(sampleKinds(12), hashOf(`theme-${theme}`), theme)
    const offset = n * seconds
    let clock = offset
    let step = 0
    const conductor = createConductor({
      now: () => clock,
      sink: { play: (notes, at) => synth.playMusic(notes, at), cut: (at, tau) => synth.cutMusic(at, tau) },
      random: seeded(5),
      wanted: (phrase) =>
        theme === 'home' ? idleCue(phrase) : { ...(plan[step] as MusicCue), energy: 0.55 },
    })
    conductor.setSeed(theme === 'home' ? 0 : (plan[0]?.seed ?? 0))
    for (let t = 0; t < seconds; t += 0.4) {
      clock = offset + t
      if (
        theme !== 'home' &&
        t > 0 &&
        Math.abs(t / 5 - Math.round(t / 5)) < 0.2 &&
        step < Math.round(t / 5)
      ) {
        step = Math.round(t / 5)
        conductor.request()
      }
      conductor.tick()
    }
    clock = offset + seconds
    conductor.stop(0.6)
  })
  const buffer = await ctx.startRendering()
  return { seconds: seconds * themes.length + 6, int16: toInt16(buffer.getChannelData(0)) }
}
