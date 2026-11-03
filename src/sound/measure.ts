import { createConductor, createLearner } from './conductor'
import { createCueBank, isCueEvent, musicAnswersCue } from './cues'
import { type Flourish, hashOf, type MusicCue, planLesson, type StepKind, type Theme } from './form'
import { PROGRESSION, seeded } from './harmony'
import { composeSection, freshState, idleCue, SECTION } from './music'
import { createSampleBank } from './sampler'
import { createScore, EVENTS, type MusicVoice, type SoundEvent } from './score'
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

/** The recorded cues decoded for an offline context, so a render hears what the app plays. */
async function recorded(ctx: BaseAudioContext) {
  const bank = createCueBank(ctx)
  await bank.load()
  return bank
}

/** The music's instruments decoded for an offline context, so a render plays the sampled music the app plays. */
async function instruments(ctx: BaseAudioContext) {
  const bank = createSampleBank(ctx)
  await bank.load()
  return bank
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
  options: {
    levelDb?: number
    masterDb?: number
    step?: number
    steps?: number
    palette?: PaletteId
    /** true: the synthesized cue, even for an event that has a recording (its fallback). */
    synthOnly?: boolean
  } = {},
): Promise<Measurement> {
  const ctx = new OfflineAudioContext(2, RATE * 10, RATE)
  const { synthOnly, ...rest } = options
  const synth = createSynth(ctx, {
    random: seeded(7),
    ...(synthOnly ? {} : { cues: await recorded(ctx) }),
    ...rest,
  })
  const plan = synth.play(event, { ...pick(options), index: 1 }, 0.05)
  const buffer = await ctx.startRendering()
  const channels = [buffer.getChannelData(0), buffer.getChannelData(1)]
  // A recording is full of real transients (a hammer, a plucked string) that a 4th difference cannot tell from a
  // click, and it was checked when it was rendered. What can still click is its edges: it starts from silence (its
  // first samples are a 2 ms fade-in, so a step at the start shows as a large first sample) and its last 50 ms
  // are a fade (a cut end shows in the 4th difference as usual).
  const recording = plan.notes.length === 0
  const from = Math.round(0.05 * RATE)
  const to = Math.round(plan.end * RATE)
  let peak = 0
  let click = 0
  for (const d of channels) {
    for (let i = 4; i < d.length; i++) {
      const at = (k: number) => d[i - k] as number
      peak = Math.max(peak, Math.abs(at(0)))
      if (recording) {
        if (i === from) click = Math.max(click, Math.abs(at(0)))
        else if (i > to - RATE * 0.05 && i < to + RATE * 0.05)
          click = Math.max(click, Math.abs(at(0) - 4 * at(1) + 6 * at(2) - 4 * at(3) + at(4)))
        continue
      }
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
    const m = await measure(event, {
      levelDb,
      masterDb: 0,
      step,
      steps: PROGRESSION.length,
      palette,
      synthOnly: true,
    })
    power += 10 ** (m.loudness / 10)
  }
  return 10 * Math.log10(power / steps.length)
}

/** Bus level (CUE_TRIM in cues.ts) per recorded cue that meets EVENTS.loudness, from the decoded files. */
export async function calibrateCues() {
  const table: Record<string, number> = {}
  for (const event of Object.keys(EVENTS) as SoundEvent[]) {
    if (!isCueEvent(event)) continue
    let level = -12
    for (let pass = 0; pass < 2; pass++) {
      const m = await measure(event, { levelDb: level, masterDb: 0 })
      level = round(level + EVENTS[event].loudness - m.loudness)
    }
    table[event] = level
  }
  return table
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
export async function measureMusic(palette: PaletteId = 'rhodes', masterDb = 0, sampled = true) {
  const sections = 8
  const ctx = new OfflineAudioContext(2, Math.ceil(RATE * (SECTION * sections + 4)), RATE)
  const synth = createSynth(ctx, {
    random: seeded(7),
    palette,
    masterDb,
    ...(sampled ? { samples: await instruments(ctx) } : {}),
  })
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
  options: {
    palette?: PaletteId
    masterDb?: number
    lessonEnd?: boolean
    seed?: number
    sampled?: boolean
  } = {},
) {
  const { palette = 'rhodes', masterDb = 0, lessonEnd = false, seed = 0, sampled = true } = options
  const sections = plan.length * 2
  const length = SECTION * sections + (lessonEnd ? 12 : 4)
  const ctx = new OfflineAudioContext(2, Math.ceil(RATE * length), RATE)
  const synth = createSynth(ctx, {
    random: seeded(7),
    palette,
    masterDb,
    cues: await recorded(ctx),
    ...(sampled ? { samples: await instruments(ctx) } : {}),
  })
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
  sampled = true,
) {
  const plan = planLesson(sampleKinds(steps), 1234, theme)
  const buffer = await renderLesson(plan, { palette, masterDb, sampled })
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
  const synth = createSynth(ctx, {
    random: seeded(7),
    palette,
    cues: await recorded(ctx),
    samples: await instruments(ctx),
  })

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
    if (isCueEvent(event)) musicAnswersCue(conductor, event, played.start ?? at)
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
  const synth = createSynth(ctx, { random: seeded(7), palette, samples: await instruments(ctx) })
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

/**
 * A scripted 70 s session through the real synth and conductor, offline: lesson open, ten steps, six
 * taps within a second, a select/land/merge burst, wrong, correct, streak, halfway, the lesson end,
 * then home music. Rendered twice, as the learner hears it and with the music alone (the same script
 * with no sounds), so a click anywhere and a music dropout can be measured.
 */
export async function renderSession(palette: PaletteId = 'rhodes') {
  const kinds = sampleKinds(10)
  const plan = planLesson(kinds, 4242, 'D')
  const length = 72
  type Step = { at: number; run: (play: (event: SoundEvent, at: number, step?: number) => void) => void }
  /** Where recorded cues sound: real transients there, so only their edges are scanned for clicks. */
  const recordings: [number, number][] = []

  /** 'mix': what the learner hears; 'music': the music alone (ducked as in the app); 'sounds': no music. */
  async function run(mode: 'mix' | 'music' | 'sounds') {
    const withSounds = mode !== 'music'
    const withMusic = mode !== 'sounds'
    const ctx = new OfflineAudioContext(2, RATE * length, RATE)
    const cues = await recorded(ctx)
    const synth = createSynth(ctx, { random: seeded(7), palette, cues, samples: await instruments(ctx) })
    const score = createScore(seeded(7))
    const learner = createLearner()
    let clock = 0
    let step = 0
    let inLesson = true
    const conductor = createConductor({
      now: () => clock,
      sink: { play: (n, at) => synth.playMusic(n, at), cut: (at, tau) => synth.cutMusic(at, tau) },
      random: seeded(5),
      wanted: (n) => {
        if (!inLesson) return idleCue(n)
        const cue = plan[step] as MusicCue
        return { ...cue, energy: learner.energy(cue.energy, step) }
      },
    })
    conductor.setSeed(plan[0]?.seed ?? 0)
    const play = (event: SoundEvent, at: number, index = step) => {
      clock = at
      learner.heard(event)
      const context = { chord: plan[index]?.chord ?? 'I', step: index, steps: plan.length }
      // The music-alone run still needs to know how long each cue lasts, so it asks the recording too.
      const recording = isCueEvent(event) ? cues.get(event) : undefined
      const planned = withSounds
        ? synth.play(event, context, at)
        : recording
          ? { end: at + recording.duration }
          : score.plan(event, context, at)
      if (mode === 'sounds' && recording) recordings.push([at, planned.end])
      // The music never stops for a recorded cue: it ducks and the conductor rests its melody. The run with the music
      // alone ducks too, so the dropout scan hears exactly the music the learner hears under the cue.
      if (isCueEvent(event) && withMusic) {
        if (!withSounds) synth.duckForCue(event, at)
        musicAnswersCue(conductor, event, at)
      }
    }
    const steps: Step[] = []
    const add = (at: number, f: Step['run']) => steps.push({ at, run: f })
    add(0.3, (p) => p('lessonOpen', 0.3, 0))
    for (let i = 1; i < 10; i++) {
      const at = 4 + i * 4.2
      add(at, (p) => {
        clock = at
        step = i
        p('step', at, i)
        conductor.request(learner.stepped(i, plan[i]?.role, true))
      })
    }
    for (let i = 0; i < 6; i++) add(20.5 + i * 0.17, (p) => p('tap', 20.5 + i * 0.17))
    for (const [k, event] of (['select', 'land', 'merge', 'select', 'land'] as SoundEvent[]).entries())
      add(26.2 + k * 0.15, (p) => p(event, 26.2 + k * 0.15))
    add(30.1, (p) => p('wrong', 30.1))
    add(32.4, (p) => p('correct', 32.4))
    add(35.2, (p) => p('streak', 35.2))
    add(42.5, (p) => p('halfway', 42.5))
    add(50, (p) => p('lessonEnd', 50))
    // The learner leaves the lesson end screen once the cue has rung out: the home walk takes over.
    add(56, () => {
      inLesson = false
      conductor.setSeed(0)
      learner.reset()
      conductor.request()
    })
    steps.sort((a, b) => a.at - b.at)
    let next = 0
    let k = 0
    while (next < length - 4) {
      const item = steps[k]
      if (item && item.at <= next) {
        item.run(play)
        k++
      } else {
        clock = next
        // After the lesson end the learner has left the lesson: the home walk resumes by itself.
        if (withMusic) conductor.tick()
        next += 0.4
      }
    }
    return ctx.startRendering()
  }

  const music = await run('music')
  const sounds = await run('sounds')

  // Clicks: the largest 4th difference against the peak, as measure() does, in the sounds alone. The music is made of
  // recorded instruments now, whose hammer and pluck attacks a 4th difference cannot tell from a click, so it is
  // guarded where a click could come from instead: its voices start and end at zero, are stolen with a fade and loop
  // on a crossfade (sampler.test.ts), and it is scanned for dropouts below.
  const mix = sounds
  let peak = 0
  let click = 0
  let clickAt = 0
  const inside = (i: number) => recordings.some(([a, b]) => i >= a * RATE && i < (b - 0.05) * RATE)
  for (let c = 0; c < mix.numberOfChannels; c++) {
    const d = mix.getChannelData(c)
    for (let i = 4; i < d.length; i++) {
      const at = (j: number) => d[i - j] as number
      peak = Math.max(peak, Math.abs(at(0)))
      if (inside(i)) continue
      const fourth = Math.abs(at(0) - 4 * at(1) + 6 * at(2) - 4 * at(3) + at(4))
      if (fourth > click) {
        click = fourth
        clickAt = i / RATE
      }
    }
  }

  // Dropouts: 50 ms RMS of the music alone (ducked under the cues as in the app) against its running median (the
  // last 4 s), everywhere from 3 s after the music starts: it never stops for a cue, so there is no exempt window.
  const left = music.getChannelData(0)
  const right = music.getChannelData(1)
  const hop = Math.round(RATE * 0.05)
  const db: number[] = []
  for (let i = 0; i + hop <= left.length; i += hop) {
    let sum = 0
    for (let j = i; j < i + hop; j++) sum += ((left[j] as number) ** 2 + (right[j] as number) ** 2) / 2
    db.push(10 * Math.log10(sum / hop + 1e-14))
  }
  const dropouts: { at: number; db: number; median: number }[] = []
  let worst = 0
  let worstAt = 0
  const firstSound = db.findIndex((x) => x > -90)
  for (let i = firstSound + 60; i < db.length - 30; i++) {
    const t = i * 0.05
    const recent = db.slice(Math.max(0, i - 80), i)
    if (recent.length < 20) continue
    const median = [...recent].sort((a, b) => a - b)[Math.floor(recent.length / 2)] as number
    if ((db[i] as number) - median < worst) {
      worst = (db[i] as number) - median
      worstAt = t
    }
    if ((db[i] as number) < median - 30)
      dropouts.push({ at: round(t), db: round(db[i] as number), median: round(median) })
  }
  return {
    clickDb: round(20 * Math.log10(click / peak)),
    /** Where the largest step is, s: where to look when the guard fails. */
    clickAt: round(clickAt),
    peakDb: round(20 * Math.log10(peak)),
    dropouts,
    worstDipDb: round(worst),
    worstDipAt: round(worstAt),
  }
}

/** Each cue alone, one after another with 1.5 s of quiet between (a listening sample). Mono samples. */
export async function renderCues(options: { rate?: number; palette?: PaletteId } = {}) {
  const { rate = 22050, palette = 'rhodes' } = options
  const events: SoundEvent[] = [
    'lessonOpen',
    'correct',
    'streak',
    'halfway',
    'milestone',
    'seal',
    'secret',
    'lessonEnd',
  ]
  const score = createScore(seeded(7))
  let at = 0.3
  const starts: number[] = []
  for (const event of events) {
    starts.push(at)
    at = score.plan(event, { chord: 'I' }, at).end + 1.5
  }
  const ctx = new OfflineAudioContext(1, Math.ceil(rate * (at + 1)), rate)
  const synth = createSynth(ctx, { random: seeded(7), palette, cues: await recorded(ctx) })
  events.forEach((event, i) => {
    synth.play(event, { chord: 'I' }, starts[i])
  })
  const buffer = await ctx.startRendering()
  return { seconds: at + 1, int16: toInt16(buffer.getChannelData(0)) }
}

/** Stereo 16-bit PCM, interleaved, as base64 chunks (a page cannot return 15 MB in one piece). */
function stereoChunks(buffer: AudioBuffer, peakDb: number, gain?: number) {
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)
  let peak = 0
  for (let i = 0; i < left.length; i++)
    peak = Math.max(peak, Math.abs(left[i] as number), Math.abs(right[i] as number))
  const scale = gain ?? 10 ** (peakDb / 20) / (peak || 1)
  const chunks: string[] = []
  const frames = 1 << 17
  for (let from = 0; from < left.length; from += frames) {
    const to = Math.min(left.length, from + frames)
    const pcm = new Int16Array((to - from) * 2)
    for (let i = from; i < to; i++) {
      pcm[(i - from) * 2] = Math.round(Math.max(-1, Math.min(1, (left[i] as number) * scale)) * 32767)
      pcm[(i - from) * 2 + 1] = Math.round(Math.max(-1, Math.min(1, (right[i] as number) * scale)) * 32767)
    }
    let text = ''
    const bytes = new Uint8Array(pcm.buffer)
    for (let i = 0; i < bytes.length; i += 0x8000)
      text += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    chunks.push(btoa(text))
  }
  return { rate: buffer.sampleRate, seconds: buffer.duration, scale, peak, chunks }
}

/**
 * Listening samples for the owner, stereo, through the real synth, sampler and conductor, offline:
 * - 'lesson': about 65 s of a lesson (theme M): the opening, nine steps, a first-try correct and a streak (each
 *   opens its flourish), the halfway reward, the lesson end over the music, the learner leaving, and 6 s more music;
 * - 'cues': the six recorded cues, 1.5 s apart, no music;
 * - 'music': 40 s of the home piece on the sampler.
 * Every file is one gain: the loudest sample peak at `peakDb` (default -3 dBFS), so the relative levels are the app's.
 */
export async function renderDemo(
  kind: 'lesson' | 'cues' | 'music',
  peakDb = -3,
  options: { silent?: boolean; voices?: MusicVoice[] } = {},
) {
  const { silent = false, voices } = options
  if (kind === 'cues') {
    const order: SoundEvent[] = ['lessonOpen', 'halfway', 'milestone', 'seal', 'secret', 'lessonEnd']
    const probe = new OfflineAudioContext(2, RATE, RATE)
    const bank = await recorded(probe)
    let at = 0.3
    const starts = order.map((event) => {
      const start = at
      at += (bank.get(event)?.duration ?? 0) + 1.5
      return start
    })
    const ctx = new OfflineAudioContext(2, Math.ceil(RATE * (at + 1)), RATE)
    const synth = createSynth(ctx, { random: seeded(7), cues: await recorded(ctx) })
    order.forEach((event, i) => {
      synth.play(event, { chord: 'I' }, starts[i])
    })
    return stereoChunks(await ctx.startRendering(), peakDb)
  }

  const length = kind === 'lesson' ? 69 : 41
  const ctx = new OfflineAudioContext(2, RATE * length, RATE)
  const synth = createSynth(ctx, {
    random: seeded(7),
    cues: await recorded(ctx),
    samples: await instruments(ctx),
  })
  const plan = planLesson(sampleKinds(10), 777, 'M')
  const learner = createLearner()
  let clock = 0
  let step = 0
  let inLesson = kind === 'lesson'
  const conductor = createConductor({
    now: () => clock,
    sink: {
      play: (n, at) => synth.playMusic(voices ? n.filter((x) => x.voice && voices.includes(x.voice)) : n, at),
      cut: (at, tau) => synth.cutMusic(at, tau),
    },
    random: seeded(5),
    wanted: (n) => {
      if (!inLesson) return idleCue(n)
      const cue = plan[step] as MusicCue
      return { ...cue, energy: learner.energy(cue.energy, step) }
    },
  })
  conductor.setSeed(kind === 'lesson' ? (plan[0]?.seed ?? 0) : 0)
  const play = (event: SoundEvent, at: number, index = step) => {
    clock = at
    learner.heard(event)
    const recorded = isCueEvent(event)
    // `silent`: the same lesson with only its music, to hear (and measure) what the sounds are laid over.
    if (silent) {
      if (recorded) synth.duckForCue(event, at)
    } else synth.play(event, { chord: plan[index]?.chord ?? 'I', step: index, steps: plan.length }, at)
    if (recorded) musicAnswersCue(conductor, event, at)
  }
  type Item = { at: number; run: () => void }
  const items: Item[] = []
  if (kind === 'lesson') {
    items.push({ at: 0.3, run: () => play('lessonOpen', 0.3, 0) })
    for (let i = 1; i < 10; i++) {
      const at = 4 + i * 5.2
      items.push({
        at,
        run: () => {
          clock = at
          step = i
          play('step', at, i)
          conductor.request(learner.stepped(i, plan[i]?.role, true))
        },
      })
    }
    // Two questions answered first try: the first a plain correct, the second a streak.
    items.push({ at: 4 + 3 * 5.2 + 2.2, run: () => play('correct', 4 + 3 * 5.2 + 2.2) })
    items.push({ at: 4 + 7 * 5.2 + 2.2, run: () => play('streak', 4 + 7 * 5.2 + 2.2) })
    items.push({ at: 31, run: () => play('halfway', 31) })
    items.push({ at: 56.5, run: () => play('lessonEnd', 56.5) })
    // The learner leaves the lesson end screen: the home walk takes over, and 6 s more music are heard.
    items.push({
      at: 61.2,
      run: () => {
        clock = 61.2
        inLesson = false
        conductor.setSeed(0)
        learner.reset()
        conductor.request()
      },
    })
  }
  items.sort((a, b) => a.at - b.at)
  let next = 0
  let k = 0
  while (next < length - 1.5) {
    const item = items[k]
    if (item && item.at <= next) {
      item.run()
      k++
    } else {
      clock = next
      if (kind === 'music' && next > 37.5) {
        if (conductor.playing) conductor.stop(2)
      } else conductor.tick()
      next += 0.4
    }
  }
  return stereoChunks(await ctx.startRendering(), peakDb)
}
