import { describe, expect, it, vi } from 'vitest'
import { fakeContext } from './fakeAudio'
import type { MusicCue } from './form'
import { seeded, TONIC_MIDI } from './harmony'
import { composeSection, flourishNotes, freshState } from './music'
import {
  createSampleBank,
  createVoice,
  MAX_VOICES,
  nearestSample,
  placeNote,
  type Voice,
  voiceOf,
} from './sampler'
import { SAMPLE_SETS, type SampleNote } from './sampleSets'
import type { Note } from './score'
import { createSynth } from './synth'

const cue = (over: Partial<MusicCue> = {}): MusicCue => ({
  chord: 'IV',
  energy: 0.9,
  role: 'travel',
  act: 0,
  seed: 2,
  ...over,
})

describe('the sample sets', () => {
  it('cover the ranges of the spec at the spec spacing', () => {
    const midis = (id: keyof typeof SAMPLE_SETS) => SAMPLE_SETS[id].notes.map((n) => n.midi)
    expect(midis('piano')).toEqual(Array.from({ length: 17 }, (_, i) => 37 + 3 * i))
    expect(midis('harp')).toEqual(midis('piano'))
    expect(midis('strings')).toEqual([49, 53, 57, 61, 65, 69, 73, 77])
    expect(midis('cello')).toEqual([36, 40, 44, 48, 52, 56])
  })

  it('lay their notes out without overlap, and loop only the sustained instruments inside the note', () => {
    for (const [id, set] of Object.entries(SAMPLE_SETS)) {
      let end = 0
      for (const n of set.notes as readonly SampleNote[]) {
        expect(n.at, id).toBeGreaterThanOrEqual(end)
        end = n.at + n.length
        if (n.loop) {
          expect(['strings', 'cello'], id).toContain(id)
          expect(n.loop[0]).toBeGreaterThanOrEqual(n.at)
          expect(n.loop[1]).toBeLessThanOrEqual(end + 1e-3)
          expect(n.loop[1] - n.loop[0]).toBeGreaterThan(2)
        } else expect(['piano', 'harp'], id).toContain(id)
      }
    }
  })
})

describe('placing the music on the instruments', () => {
  const sections = (theme: MusicCue['theme'], energy = 0.9) => {
    const random = seeded(4)
    let state = freshState(2)
    const notes: Note[] = []
    for (let n = 0; n < 6; n++) {
      const written = composeSection(
        cue({ ...(theme ? { theme } : {}), energy, ...(n === 0 ? { flourish: 'peak' as const } : {}) }),
        n * 6.7,
        random,
        state,
        n === 0,
      )
      state = written.state
      notes.push(...written.notes)
    }
    return notes
  }

  it('sends the pad to the strings, the bass to the cello, the theme to piano (harp for R and S), flourishes to the harp', () => {
    for (const [theme, melody] of [
      ['M', 'piano'],
      ['D', 'piano'],
      [undefined, 'piano'],
      ['R', 'harp'],
      ['S', 'harp'],
    ] as const) {
      const notes = sections(theme)
      const where = (voice: string) =>
        new Set(notes.filter((n) => n.voice === voice).map((n) => placeNote(n)?.set))
      expect(where('pad'), theme).toEqual(new Set(['strings']))
      expect(where(theme === 'R' || theme === 'S' ? 'melodyHarp' : 'melody'), theme).toEqual(
        new Set([melody]),
      )
      expect(where('flourish')).toEqual(new Set(['harp']))
      expect(where('pulse')).toEqual(new Set(['harp']))
      expect([...where('bass')].every((set) => set === 'cello' || set === 'piano')).toBe(true)
    }
  })

  it('leaves no note without a part except the halo, which the sampler does not play (no glass)', () => {
    const notes = sections('S')
    expect(notes.filter((n) => !n.voice).every((n) => n.kind === 'halo')).toBe(true)
    expect(notes.some((n) => n.kind === 'halo')).toBe(true)
    for (const n of notes.filter((x) => x.kind === 'halo')) expect(voiceOf(n)).toBeUndefined()
  })

  it('never stretches a recorded note more than two semitones, whatever the pitch', () => {
    for (const theme of [undefined, 'M', 'R', 'D', 'S'] as const)
      for (const n of sections(theme)) {
        const placed = placeNote(n)
        if (!placed) continue
        const { semitones } = nearestSample(SAMPLE_SETS[placed.set].notes, placed.midi)
        expect(Math.abs(semitones), `${placed.voice} ${placed.midi}`).toBeLessThanOrEqual(2)
      }
  })

  it('keeps the bass in the cello unless it lies above the cello (then the low piano plays it)', () => {
    const bass = (pitch: number): Note => ({
      kind: 'main',
      pitch,
      at: 0,
      ring: 3,
      velocity: 0.3,
      bright: 0,
      voice: 'bass',
    })
    expect(placeNote(bass(-17))?.set).toBe('cello')
    expect(placeNote(bass(-7))?.set).toBe('cello')
    expect(placeNote(bass(5))?.set).toBe('piano')
    expect(TONIC_MIDI + 5).toBeGreaterThan(58)
  })

  it('plays flourishes on the harp in the harp range', () => {
    for (const kind of ['rise', 'peak', 'cascade'] as const)
      for (const n of flourishNotes(kind, 'V', 0).filter((x) => x.kind === 'shine'))
        expect(placeNote(n)?.set).toBe('harp')
  })
})

describe('the sample bank', () => {
  it('is not ready until every set is decoded, then plays', async () => {
    const decode = vi.fn(async () => ({ duration: 1 }) as unknown as AudioBuffer)
    const bank = createSampleBank({ decodeAudioData: decode as never }, async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(2),
    }))
    expect(bank.ready).toBe(false)
    await bank.load()
    expect(bank.ready).toBe(true)
    expect(decode).toHaveBeenCalledTimes(Object.keys(SAMPLE_SETS).length)
  })

  it('stays not ready when one set fails, and retries on the next load', async () => {
    let fail = true
    const bank = createSampleBank(
      { decodeAudioData: (async () => ({ duration: 1 }) as unknown as AudioBuffer) as never },
      async (url) => ({
        ok: !(fail && url === SAMPLE_SETS.harp.url),
        arrayBuffer: async () => new ArrayBuffer(2),
      }),
    )
    await bank.load()
    expect(bank.ready).toBe(false)
    fail = false
    await bank.load()
    expect(bank.ready).toBe(true)
  })
})

const bufferOf = () => ({ duration: 60 }) as unknown as AudioBuffer
const fullBank = () => ({
  ready: true,
  get: (id: keyof typeof SAMPLE_SETS) => ({ buffer: bufferOf(), notes: SAMPLE_SETS[id].notes }),
})

describe('a sampler voice', () => {
  it('starts the slice of the nearest note, pitched by playbackRate, and loops the sustained sets', () => {
    const { ctx, started } = fakeContext()
    const pad: Note = {
      kind: 'pad',
      pitch: 7,
      at: 5,
      ring: 9,
      velocity: 0.4,
      bright: 0,
      rise: 0.3,
      hold: 6,
      voice: 'pad',
    }
    const voice = createVoice(ctx, fullBank(), pad, () => 0.5)
    expect(voice).toBeDefined()
    const strings = SAMPLE_SETS.strings.notes.find((n) => n.midi === 69)
    expect(started[0]?.offset).toBe(strings?.at)
    expect((voice as Voice).source.loop).toBe(true)
    expect(voice?.stopAt).toBeGreaterThan(5 + 9)
  })

  it('does not loop a plucked note and stops it with its slice', () => {
    const { ctx } = fakeContext()
    const melody: Note = {
      kind: 'main',
      pitch: 6,
      at: 2,
      ring: 3.4,
      velocity: 0.2,
      bright: 0.2,
      voice: 'melody',
    }
    const voice = createVoice(ctx, fullBank(), melody, () => 0.5)
    expect((voice as Voice).source.loop).toBe(false)
    expect(voice?.stopAt).toBeLessThanOrEqual(2 + 3.4 + 0.05 + 1e-6)
  })

  it('can never click: it starts at zero, falls to zero before its stop, and a stolen voice fades', () => {
    const { ctx } = fakeContext()
    for (const [voiceName, pitch] of [
      ['pad', 7],
      ['melody', 6],
      ['bass', -12],
      ['flourish', 12],
    ] as const) {
      const note: Note = {
        kind: voiceName === 'pad' ? 'pad' : 'main',
        pitch,
        at: 3,
        ring: voiceName === 'pad' ? 9 : 2,
        velocity: 0.3,
        bright: 0,
        voice: voiceName,
        ...(voiceName === 'pad' ? { rise: 2.4, hold: 6 } : {}),
      }
      const voice = createVoice(ctx, fullBank(), note, () => 0.5) as Voice
      const calls = (node: unknown, method: string) =>
        (
          (node as { gain: Record<string, ReturnType<typeof vi.fn>> }).gain[method] as ReturnType<
            typeof vi.fn
          >
        ).mock.calls
      expect(calls(voice.nodes[1], 'setValueAtTime')[0]).toEqual([0, 3])
      const [curve, at, length] = calls(voice.nodes[1], 'setValueCurveAtTime')[0] as [
        Float32Array,
        number,
        number,
      ]
      expect(curve[curve.length - 1]).toBe(0)
      expect(at + length).toBeLessThanOrEqual(voice.stopAt)
      // Stealing is a short exponential fade on its own gain, then a stop: never a cut.
      voice.steal(5)
      expect(calls(voice.nodes[2], 'setTargetAtTime')[0]).toEqual([0, 5, 0.025])
    }
  })

  it('does not play a halo', () => {
    const { ctx } = fakeContext()
    const halo: Note = { kind: 'halo', pitch: 20, at: 0, ring: 3, velocity: 0.1, bright: 0 }
    expect(createVoice(ctx, fullBank(), halo, () => 0.5)).toBeUndefined()
  })
})

describe('the synth playing the music on the sampler', () => {
  const group = (at: number): Note[] =>
    Array.from({ length: 6 }, (_, i) => ({
      kind: 'main' as const,
      pitch: 6 + i,
      at: at + i * 0.1,
      ring: 3,
      velocity: 0.2,
      bright: 0.2,
      voice: 'melody' as const,
    }))

  it('uses the sampler once its sets are decoded, and the synth voices before', () => {
    const before = fakeContext()
    createSynth(before.ctx, { random: () => 0.5 }).playMusic(group(1))
    expect(before.started.some((s) => s.kind === 'oscillator')).toBe(true)
    const after = fakeContext()
    createSynth(after.ctx, { random: () => 0.5, samples: fullBank() }).playMusic(group(1))
    expect(after.started.some((s) => s.kind === 'oscillator')).toBe(false)
    expect(after.started.filter((s) => s.kind === 'buffer')).toHaveLength(6)
  })

  it('caps the voices sounding at once and steals the oldest, never the newest', () => {
    const { ctx, started } = fakeContext()
    const synth = createSynth(ctx, { random: () => 0.5, samples: fullBank() })
    // Eight groups of six notes, each ringing 3 s and starting 0.4 s apart: 48 voices over a cap of MAX_VOICES.
    for (let g = 0; g < 8; g++) synth.playMusic(group(1 + g * 0.4))
    expect(started).toHaveLength(48)
    // A stolen voice is stopped early (0.2 s after the group that stole it); the rest ring their whole length.
    const early = started.filter((s) => (s.stopAt ?? 0) < (s.at ?? 0) + 3)
    expect(48 - early.length).toBeLessThanOrEqual(MAX_VOICES)
    expect(early.length).toBeGreaterThan(0)
    // The newest group is never the one stolen.
    const newest = started.slice(-6)
    for (const s of newest) expect((s.stopAt ?? 0) - (s.at ?? 0)).toBeGreaterThanOrEqual(3)
  })
})
