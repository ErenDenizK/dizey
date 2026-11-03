import { clamp, dbToGain, TONIC_MIDI } from './harmony'
import { SAMPLE_SETS, type SampleNote, type SampleSetId } from './sampleSets'
import type { MusicVoice, Note } from './score'

/**
 * The sampler: the background music played on the same instruments as the recorded cues (decision 0020). Four small
 * mono sprite files (soft piano, harp, string pad, cello) are decoded once; a note is a slice of one, pitched with
 * playbackRate from the nearest recorded note. Sustained instruments loop a crossfaded region baked into the file.
 * Samples are dry: the music bus adds the room (synth.ts).
 */

/** Sampler voices alive at once. A new note over the cap steals the oldest, with a short fade. */
export const MAX_VOICES = 28

/** How a part of the music is played: which set, how loud relative to the others (dB), and its attack (s). */
export const VOICE_TABLE: Record<MusicVoice, { set: SampleSetId; db: number; attack: number }> = {
  pad: { set: 'strings', db: -9, attack: 0.4 },
  melody: { set: 'piano', db: 0, attack: 0.004 },
  melodyHarp: { set: 'harp', db: 3, attack: 0.004 },
  bass: { set: 'cello', db: -6, attack: 0.15 },
  flourish: { set: 'harp', db: 7, attack: 0.004 },
  pulse: { set: 'harp', db: -0.5, attack: 0.004 },
}

/** The part a music note plays: its own, or the default of its kind. Halos (glassy shimmer) are not played. */
export function voiceOf(note: Note): MusicVoice | undefined {
  if (note.voice) return note.voice
  if (note.kind === 'pad') return 'pad'
  if (note.kind === 'shine') return 'flourish'
  return note.kind === 'main' ? 'melody' : undefined
}

export type SampleSet = { buffer: AudioBuffer; notes: readonly SampleNote[] }

export type SampleBank = {
  /** true once every set is decoded: the music uses the sampler only then, and the synth voices before. */
  readonly ready: boolean
  get(id: SampleSetId): SampleSet | undefined
  /** Fetches and decodes every set once; a failure is forgotten, so the next call tries again. */
  load(): Promise<void>
}

type Fetcher = (url: string) => Promise<{ ok: boolean; arrayBuffer(): Promise<ArrayBuffer> }>

export function createSampleBank(
  ctx: Pick<BaseAudioContext, 'decodeAudioData'>,
  fetcher: Fetcher = (url) => fetch(url),
  specs: Record<string, { url: string; notes: readonly SampleNote[] }> = SAMPLE_SETS,
): SampleBank {
  const sets = new Map<string, SampleSet>()
  let loading: Promise<void> | null = null

  async function one(id: string, url: string, notes: readonly SampleNote[]) {
    if (sets.has(id)) return
    const response = await fetcher(url)
    if (!response.ok) throw new Error(`sample set ${id}: ${url} not available`)
    sets.set(id, { buffer: await ctx.decodeAudioData(await response.arrayBuffer()), notes })
  }

  return {
    get ready() {
      return Object.keys(specs).every((id) => sets.has(id))
    },
    get: (id) => sets.get(id),
    load() {
      loading ??= Promise.allSettled(
        Object.entries(specs).map(([id, spec]) => one(id, spec.url, spec.notes)),
      ).then((results) => {
        if (results.some((r) => r.status === 'rejected')) loading = null
      })
      return loading
    },
  }
}

/** The recorded note nearest to `midi` and how far it must be pitched (semitones). */
export function nearestSample(notes: readonly SampleNote[], midi: number) {
  let best = notes[0] as SampleNote
  for (const n of notes) if (Math.abs(n.midi - midi) < Math.abs(best.midi - midi)) best = n
  return { note: best, semitones: midi - best.midi }
}

/** Where a note plays: the set it comes from (bass above the cello's range goes to the piano) and its MIDI pitch. */
export function placeNote(
  note: Note,
): { voice: MusicVoice; set: SampleSetId; midi: number; db: number } | undefined {
  const voice = voiceOf(note)
  if (!voice) return undefined
  let { set, db } = VOICE_TABLE[voice]
  let midi = TONIC_MIDI + note.pitch
  if (voice === 'bass' && midi > 58) {
    set = 'piano'
    db = -3
  }
  const notes = SAMPLE_SETS[set].notes
  const low = (notes[0] as SampleNote).midi - 2
  const high = (notes[notes.length - 1] as SampleNote).midi + 2
  while (midi > high) midi -= 12
  while (midi < low) midi += 12
  return { voice, set, midi, db }
}

export type Voice = {
  source: AudioBufferSourceNode
  /** The voice's output (after its pan): connect it to the bus. */
  out: AudioNode
  nodes: AudioNode[]
  at: number
  stopAt: number
  done: boolean
  /** Fades the voice out quickly from context time `time` and stops it (voice stealing). */
  steal(time: number): void
}

/** Envelope: a short ramp up, a level hold until `fadeFrom`, then a smooth fall to zero at `ring`. */
function envelope(
  param: AudioParam,
  at: number,
  peak: number,
  attack: number,
  fadeFrom: number,
  ring: number,
) {
  param.setValueAtTime(0, at)
  param.linearRampToValueAtTime(peak, at + attack)
  const length = Math.max(0.05, ring - attack)
  const n = 96
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = attack + (i / (n - 1)) * length
    const u = clamp((x - fadeFrom) / Math.max(0.05, ring - fadeFrom), 0, 1)
    curve[i] = peak * Math.cos((u * Math.PI) / 2) ** 2
  }
  curve[n - 1] = 0
  param.setValueCurveAtTime(curve, at + attack + 5e-4, length)
}

/**
 * One music note as a sampler voice, or undefined if the note is not played (a halo) or its set is missing.
 * The caller connects `out` and starts nothing: the voice is already started (and stopped) for `note.at`.
 */
export function createVoice(
  ctx: BaseAudioContext,
  bank: Pick<SampleBank, 'get'>,
  note: Note,
  random: () => number,
): Voice | undefined {
  const placed = placeNote(note)
  const set = placed && bank.get(placed.set)
  if (!placed || !set) return undefined
  const { note: sample, semitones } = nearestSample(set.notes, placed.midi)
  const rate = 2 ** (semitones / 12)
  const table = VOICE_TABLE[placed.voice]
  // A player is never exact: a few cents of detune and +-6 % velocity.
  const detune = (random() * 2 - 1) * 4
  const peak = note.velocity * (1 + (random() * 2 - 1) * 0.06) * dbToGain(placed.db)
  const at = note.at
  const pad = placed.voice === 'pad'
  const attack = pad ? clamp(note.rise ?? table.attack, 0.3, 0.5) : table.attack
  const ring = Math.max(0.15, note.ring)
  // A pad holds its level for rise + hold (the phrase), then falls under the next pad; others taper over their last 0.6 s.
  const fadeFrom = pad ? Math.min(ring - 0.3, (note.rise ?? 0) + (note.hold ?? 0)) : Math.max(0, ring - 0.6)

  const source = ctx.createBufferSource()
  const env = ctx.createGain()
  const steal = ctx.createGain()
  const panner = ctx.createStereoPanner()
  source.buffer = set.buffer
  source.playbackRate.value = rate
  source.detune.value = detune
  panner.pan.value = note.pan ?? clamp((placed.midi - 66) / 34, -0.3, 0.3)
  envelope(env.gain, at, peak, attack, fadeFrom, ring)
  source.connect(env).connect(steal).connect(panner)

  let stopAt: number
  if (sample.loop) {
    source.loop = true
    source.loopStart = sample.loop[0]
    source.loopEnd = sample.loop[1]
    stopAt = at + ring + 0.05
  } else stopAt = at + Math.min(ring + 0.05, sample.length / rate + 0.02)
  source.start(at, sample.at)
  source.stop(stopAt)

  const voice: Voice = {
    source,
    out: panner,
    nodes: [source, env, steal, panner],
    at,
    stopAt,
    done: false,
    steal(time) {
      steal.gain.setTargetAtTime(0, time, 0.025)
      try {
        source.stop(time + 0.2)
      } catch {
        // Already stopped.
      }
    },
  }
  return voice
}
