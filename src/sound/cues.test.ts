import { describe, expect, it, vi } from 'vitest'
import { CUE_BUDGET, CUE_TRIM, CUE_URLS, createCueBank, isCueEvent } from './cues'
import { CUE_TIMELINE } from './cueTimeline'
import { EVENTS, type SoundEvent } from './score'
import { createSynth } from './synth'

const events = Object.keys(CUE_URLS) as (keyof typeof CUE_URLS)[]

describe('the sound map: recorded cues are short and land on the impact', () => {
  it.each(events)('%s fits its length budget and has its downbeat at 0', (event) => {
    const timeline = CUE_TIMELINE[event]
    expect(timeline.end).toBeLessThanOrEqual(CUE_BUDGET[event])
    expect(timeline.chords[0]).toBe(0)
    expect(timeline.shines[0] ?? 0).toBe(0)
    expect(timeline.home).toBeGreaterThanOrEqual(timeline.chords.at(-1) ?? 0)
    expect(timeline.home).toBeLessThan(timeline.end)
    for (const at of timeline.shines) expect(at).toBeLessThan(timeline.home)
  })

  it('keeps the lesson end home chord near 1.5 s and the whole cue within 3.2 s', () => {
    expect(CUE_TIMELINE.lessonEnd.home).toBeCloseTo(1.5, 1)
    expect(CUE_TIMELINE.lessonEnd.end).toBeLessThanOrEqual(3.2)
  })

  it('has a calibrated level and a loudness target for each cue', () => {
    for (const event of events) {
      expect(isCueEvent(event)).toBe(true)
      expect(CUE_TRIM[event]).toBeLessThan(0)
      expect(EVENTS[event].loudness).toBeLessThan(0)
    }
    expect(isCueEvent('tap')).toBe(false)
  })
})

const fakeBuffer = (duration: number) => ({ duration }) as unknown as AudioBuffer

describe('createCueBank', () => {
  const okFetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) })

  it('has no buffer before it is loaded, then decodes every cue once', async () => {
    const decode = vi.fn(async () => fakeBuffer(2))
    const bank = createCueBank({ decodeAudioData: decode as never }, okFetch)
    expect(bank.get('lessonEnd')).toBeUndefined()
    await bank.load()
    await bank.load()
    expect(bank.get('lessonEnd')?.duration).toBe(2)
    expect(decode).toHaveBeenCalledTimes(events.length)
  })

  it('stays without a buffer when the fetch or the decode fails, and tries again on the next load', async () => {
    let fail = true
    const decode = vi.fn(async () => {
      if (fail) throw new Error('bad data')
      return fakeBuffer(1)
    })
    const bank = createCueBank({ decodeAudioData: decode as never }, okFetch)
    await bank.load()
    expect(bank.get('seal')).toBeUndefined()
    fail = false
    await bank.load()
    expect(bank.get('seal')?.duration).toBe(1)
    const missing = createCueBank({ decodeAudioData: decode as never }, async () => ({
      ok: false,
      arrayBuffer: async () => new ArrayBuffer(0),
    }))
    await missing.load()
    expect(missing.get('seal')).toBeUndefined()
  })
})

/** Just enough of an audio context to see what the synth schedules. */
function fakeContext() {
  const started: { kind: string }[] = []
  const node = (kind: string) => {
    const n: Record<string, unknown> = {
      kind,
      gain: {
        value: 1,
        setValueAtTime() {},
        cancelScheduledValues() {},
        setTargetAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
        setValueCurveAtTime() {},
      },
      frequency: { value: 0 },
      Q: { value: 0 },
      detune: { value: 0 },
      pan: { value: 0 },
      threshold: { value: 0 },
      knee: { value: 0 },
      ratio: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 },
      connect: (to: unknown) => to,
      disconnect() {},
      start() {
        started.push({ kind })
      },
      stop() {},
    }
    return n
  }
  const ctx = {
    currentTime: 0,
    sampleRate: 48000,
    destination: node('destination'),
    createGain: () => node('gain'),
    createBiquadFilter: () => node('filter'),
    createConvolver: () => node('convolver'),
    createDynamicsCompressor: () => node('compressor'),
    createStereoPanner: () => node('panner'),
    createOscillator: () => node('oscillator'),
    createBufferSource: () => node('buffer'),
    createBuffer: (_c: number, length: number) => ({
      length,
      getChannelData: () => new Float32Array(length),
    }),
  }
  return { ctx: ctx as unknown as BaseAudioContext, started }
}

describe('the synth with recorded cues', () => {
  const play = (event: SoundEvent, buffer?: AudioBuffer) => {
    const { ctx, started } = fakeContext()
    const synth = createSynth(ctx, { random: () => 0.5, cues: { get: () => buffer } })
    const plan = synth.play(event, {}, 1)
    return { plan, started }
  }

  it('plays the decoded buffer, ringing for its whole length', () => {
    const { plan, started } = play('lessonEnd', fakeBuffer(3.2))
    expect(started.map((s) => s.kind)).toEqual(['buffer'])
    expect(plan.end).toBeCloseTo(4.2, 5)
    expect(plan.notes).toEqual([])
  })

  it('falls back to the synthesized cue while the buffer is not decoded', () => {
    const { plan, started } = play('lessonEnd')
    expect(started.some((s) => s.kind === 'oscillator')).toBe(true)
    expect(started.some((s) => s.kind === 'buffer')).toBe(false)
    expect(plan.notes.length).toBeGreaterThan(0)
  })

  it('never uses a recording for a frequent sound', () => {
    const { plan } = play('tap', fakeBuffer(1))
    expect(plan.notes.length).toBeGreaterThan(0)
  })
})
