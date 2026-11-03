import halfway from '../assets/sound/halfway.m4a'
import lessonEnd from '../assets/sound/lessonEnd.m4a'
import lessonOpen from '../assets/sound/lessonOpen.m4a'
import milestone from '../assets/sound/milestone.m4a'
import seal from '../assets/sound/seal.m4a'
import secret from '../assets/sound/secret.m4a'
import type { Conductor } from './conductor'
import { CUE_TIMELINE } from './cueTimeline'
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
  lessonEnd: -18.5,
  halfway: -18.1,
  milestone: -16.9,
  seal: -18.6,
  secret: -16.8,
  lessonOpen: -25.4,
}

/**
 * The sound map's length budget per cue, seconds (decisions 0019 and 0020): a cue is as short as the moment it plays
 * with, plus the tail its room rings out for (1.3 s; the lesson end 1.4 s, its home chord still at 1.5 s).
 */
export const CUE_BUDGET: Record<CueEvent, number> = {
  lessonOpen: 2.6,
  lessonEnd: 4.6,
  seal: 3.1,
  halfway: 4.1,
  milestone: 4.7,
  secret: 3.9,
}

/**
 * The music never stops for a recorded cue (decision 0020). Its bus ducks `db` over `glide` s from the cue's start,
 * holds until `afterHome` s past the cue's home chord, and returns to normal over `back` s.
 */
export const CUE_DUCK = { db: -8, glide: 0.4, afterHome: 0.6, back: 2.0 } as const

/** When the duck of a cue that starts at `start` is back to normal: the melody rests until then. */
export const cueDuckEnd = (event: CueEvent, start: number) =>
  start + CUE_TIMELINE[event].home + CUE_DUCK.afterHome + CUE_DUCK.back

/**
 * What the music does while a recorded cue rings: it keeps its grid. A reward rests the melody until the duck has
 * returned; a lesson end also moves the music to chord I; a lesson's opening only ducks.
 */
export function musicAnswersCue(
  conductor: Pick<Conductor, 'rest' | 'settle'>,
  event: CueEvent,
  start: number,
) {
  if (event === 'lessonOpen') return
  const until = cueDuckEnd(event, start)
  if (event === 'lessonEnd') conductor.settle(until)
  else conductor.rest(until)
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
