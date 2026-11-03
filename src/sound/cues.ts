import halfway from '../assets/sound/halfway.m4a'
import lessonEnd from '../assets/sound/lessonEnd.m4a'
import lessonOpen from '../assets/sound/lessonOpen.m4a'
import milestone from '../assets/sound/milestone.m4a'
import seal from '../assets/sound/seal.m4a'
import secret from '../assets/sound/secret.m4a'
import type { SoundEvent } from './score'

/**
 * The musical moments are recorded, not synthesized: six short pieces rendered offline from real CC0 instrument
 * samples (tools/sound/render_cues.py, decision 0019) and decoded here into AudioBuffers. The frequent sounds and the
 * background music stay synthesized. Until a buffer is decoded (the first seconds, or a failed decode) the synth
 * plays the old cue, so nothing is ever silent.
 */

export const CUE_URLS = { lessonEnd, halfway, milestone, seal, secret, lessonOpen } as const
export type CueEvent = keyof typeof CUE_URLS

export const isCueEvent = (event: SoundEvent): event is CueEvent => event in CUE_URLS

/**
 * Bus level (dB) per recorded cue that meets its EVENTS loudness target (measure.ts calibrate(); the files are
 * peak-normalized, so only the level differs per cue). Re-run the calibration after re-rendering the files.
 */
export const CUE_TRIM: Record<CueEvent, number> = {
  lessonEnd: -16.7,
  halfway: -16.6,
  milestone: -15.9,
  seal: -16.9,
  secret: -18.3,
  lessonOpen: -24.2,
}

/** The sound map's length budget per cue, seconds (decision 0019): a cue is as short as the moment it plays with. */
export const CUE_BUDGET: Record<CueEvent, number> = {
  lessonOpen: 1.3,
  lessonEnd: 3.2,
  seal: 1.8,
  halfway: 2.8,
  milestone: 3.4,
  secret: 2.6,
}

export type CueBank = {
  /** The decoded cue, or undefined while it is not (yet) available. */
  get(event: SoundEvent): AudioBuffer | undefined
  /** Fetches and decodes every cue once; a failure is forgotten, so the next call tries again. */
  load(): Promise<void>
}

type Fetcher = (url: string) => Promise<{ ok: boolean; arrayBuffer(): Promise<ArrayBuffer> }>

export function createCueBank(
  ctx: Pick<BaseAudioContext, 'decodeAudioData'>,
  fetcher: Fetcher = (url) => fetch(url),
  urls: Partial<Record<CueEvent, string>> = CUE_URLS,
): CueBank {
  const buffers = new Map<string, AudioBuffer>()
  let loading: Promise<void> | null = null

  async function one(event: string, url: string) {
    if (buffers.has(event)) return
    const response = await fetcher(url)
    if (!response.ok) throw new Error(`cue ${event}: ${url} not available`)
    buffers.set(event, await ctx.decodeAudioData(await response.arrayBuffer()))
  }

  return {
    get: (event) => buffers.get(event),
    load() {
      loading ??= Promise.allSettled(
        Object.entries(urls).map(([event, url]) => one(event, url as string)),
      ).then((results) => {
        // Forget a failed load, so a later unlock retries; the cues that decoded stay.
        if (results.some((r) => r.status === 'rejected')) loading = null
      })
      return loading
    },
  }
}
