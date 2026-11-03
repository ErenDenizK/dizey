import { describe, expect, it, vi } from 'vitest'
import {
  CUE_BUDGET,
  CUE_DUCK,
  CUE_TRIM,
  CUE_URLS,
  createCueBank,
  cueDuckEnd,
  isCueEvent,
  musicAnswersCue,
} from './cues'
import { CUE_TIMELINE } from './cueTimeline'
import { fakeContext } from './fakeAudio'
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

  it('keeps the lesson end home chord near 1.5 s and the whole cue within 4.6 s', () => {
    expect(CUE_TIMELINE.lessonEnd.home).toBeCloseTo(1.5, 1)
    expect(CUE_TIMELINE.lessonEnd.end).toBeLessThanOrEqual(4.6)
  })

  it('grows each budget by the tail the room rings out for (decision 0020)', () => {
    expect(CUE_BUDGET).toEqual({
      lessonOpen: 2.6,
      lessonEnd: 4.6,
      seal: 3.1,
      halfway: 4.1,
      milestone: 4.7,
      secret: 3.9,
    })
  })

  it.each(events)('%s rings on after its home chord: at least 1.3 s of tail, never a cut', (event) => {
    const { home, end } = CUE_TIMELINE[event]
    expect(end - home).toBeGreaterThanOrEqual(1.3 + 0.8)
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

describe('the music never stops for a recorded cue', () => {
  it('ducks 8 dB over 0.4 s, holds until 0.6 s after home, and is back 2 s later', () => {
    expect(CUE_DUCK).toEqual({ db: -8, glide: 0.4, afterHome: 0.6, back: 2 })
    expect(cueDuckEnd('lessonEnd', 10)).toBeCloseTo(10 + 1.5 + 0.6 + 2, 2)
  })

  it('schedules the glide at the cue start and the return at home + 0.6 s, without ever touching the conductor', () => {
    const { ctx } = fakeContext()
    const calls: { at: number; value: number; tau: number }[] = []
    // Every setTargetAtTime on any gain is recorded; the music input is the one that goes down by 8 dB.
    const original = ctx.createGain.bind(ctx)
    ;(ctx as unknown as { createGain: () => unknown }).createGain = () => {
      const node = original() as unknown as { gain: Record<string, unknown> }
      node.gain.setTargetAtTime = (value: number, at: number, tau: number) => calls.push({ at, value, tau })
      return node
    }
    const synth = createSynth(ctx, { random: () => 0.5, cues: { get: () => fakeBuffer(4.6) } })
    synth.play('lessonEnd', {}, 10)
    const down = 10 ** (-8 / 20)
    const glide = calls.find((c) => Math.abs(c.value - down) < 1e-6)
    expect(glide?.at).toBeCloseTo(10, 5)
    expect(glide?.tau).toBeCloseTo(0.4 / 3, 5)
    const back = calls.find((c) => c.value === 1 && c.at > 10)
    expect(back?.at).toBeCloseTo(10 + CUE_TIMELINE.lessonEnd.home + 0.6, 5)
    expect(back?.tau).toBeCloseTo(2 / 3, 5)
  })

  it('ducks the opening cue the same way, whatever its tier (it is a question-tier sound, 16 dB for taps)', () => {
    const { ctx } = fakeContext()
    const calls: { at: number; value: number; tau: number }[] = []
    const original = ctx.createGain.bind(ctx)
    ;(ctx as unknown as { createGain: () => unknown }).createGain = () => {
      const node = original() as unknown as { gain: Record<string, unknown> }
      node.gain.setTargetAtTime = (value: number, at: number, tau: number) => calls.push({ at, value, tau })
      return node
    }
    createSynth(ctx, { random: () => 0.5, cues: { get: () => fakeBuffer(2.6) } }).play('lessonOpen', {}, 3)
    expect(calls.some((c) => Math.abs(c.value - 10 ** (-8 / 20)) < 1e-6 && c.at === 3)).toBe(true)
    expect(calls.some((c) => Math.abs(c.value - 10 ** (-16 / 20)) < 1e-6)).toBe(false)
  })

  it('rests the melody for a reward and settles a lesson end on I, and does neither for the opening', () => {
    const calls: string[] = []
    const conductor = {
      rest: (u: number) => calls.push(`rest ${u.toFixed(1)}`),
      settle: (u: number) => calls.push(`settle ${u.toFixed(1)}`),
    }
    musicAnswersCue(conductor, 'halfway', 5)
    musicAnswersCue(conductor, 'lessonEnd', 5)
    musicAnswersCue(conductor, 'lessonOpen', 5)
    expect(calls).toEqual([`rest ${(5 + 0.8 + 2.6).toFixed(1)}`, `settle ${(5 + 1.5 + 2.6).toFixed(1)}`])
  })
})
