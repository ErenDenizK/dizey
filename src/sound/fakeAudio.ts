import { vi } from 'vitest'

/** A fake audio context for unit tests: just enough to see what the synth and the sampler schedule. */

/** Just enough of an audio context to see what the synth schedules. */
export function fakeContext() {
  const started: { kind: string; at?: number; offset?: number; stopAt?: number; rate?: number }[] = []
  const node = (kind: string) => {
    const n: Record<string, unknown> = {
      kind,
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
        setTargetAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        setValueCurveAtTime: vi.fn(),
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
      playbackRate: { value: 1 },
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      start(at?: number, offset?: number) {
        const entry: (typeof started)[number] = { kind }
        if (at !== undefined) entry.at = at
        if (offset !== undefined) entry.offset = offset
        started.push(entry)
        n.entry = entry
      },
      stop(at?: number) {
        const entry = n.entry as (typeof started)[number] | undefined
        if (entry && at !== undefined) entry.stopAt = at
      },
      addEventListener() {},
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
