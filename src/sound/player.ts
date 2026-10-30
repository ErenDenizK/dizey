import { readSettings, saveSettings } from '../progress/settings'
import type { SoundContext, SoundEvent } from './score'
import { createSynth, type Synth } from './synth'

/**
 * The app's one sound instance. Sound is on unless the learner turns it off in Ben, and it always
 * obeys iPhone's silent switch: the audio session is 'ambient', which also lets music from other
 * apps keep playing underneath. iOS only starts audio inside a tap, so the context is created and
 * resumed from the first tap and from any tap after it was parked.
 */

/** Park (suspend) the context after this long with nothing ringing: battery. */
const IDLE_MS = 30_000
/** A call made while parked plays when audio resumes, unless it would land later than this. */
const STALE_MS = 250

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

let ctx: AudioContext | null = null
let synth: Synth | null = null
let idle: ReturnType<typeof setTimeout> | undefined
let hooked = false

export const soundOn = () => readSettings().sound !== false

function armIdle() {
  clearTimeout(idle)
  idle = setTimeout(() => {
    if (synth?.ringing) armIdle()
    else void ctx?.suspend().catch(() => {})
  }, IDLE_MS)
}

/** Create or resume audio. Call only from a tap handler (or a listener on one). */
function unlock() {
  if (!soundOn() || document.hidden) return
  if (!ctx) {
    const Context = globalThis.AudioContext
    if (!Context) return
    try {
      const session = (navigator as AudioSessionNavigator).audioSession
      if (session) session.type = 'ambient'
    } catch {
      // Older Safari: Web Audio is 'ambient' by default there too.
    }
    try {
      ctx = new Context({ latencyHint: 'interactive' })
    } catch {
      return
    }
    synth = createSynth(ctx)
    ctx.addEventListener('statechange', () => {
      if (ctx?.state === 'running') armIdle()
    })
  }
  if (ctx.state !== 'running') void ctx.resume().catch(() => {})
}

function quiet() {
  synth?.stopAll()
  clearTimeout(idle)
  // Suspend once the 30 ms fades are done, so no old tail comes back on resume.
  setTimeout(() => void ctx?.suspend().catch(() => {}), 300)
}

/** Listens for taps (to unlock) and for the page being hidden (to fall silent). Call once at start-up. */
export function installSound() {
  if (hooked || typeof document === 'undefined') return
  hooked = true
  for (const type of ['touchend', 'pointerup', 'click', 'keydown'])
    document.addEventListener(type, unlock, { capture: true, passive: true })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) quiet()
  })
}

/** Plays a cue on the frame its motion lands. Silent when sound is off or audio is not yet unlocked. */
export function playSound(event: SoundEvent, context: SoundContext = {}) {
  if (!soundOn() || !ctx || !synth) return
  if (ctx.state === 'running') {
    armIdle()
    synth.play(event, context)
    return
  }
  const asked = performance.now()
  const live = synth
  void ctx
    .resume()
    .then(() => {
      if (performance.now() - asked <= STALE_MS && soundOn()) live.play(event, context)
    })
    .catch(() => {})
}

/** Ben's Ses switch. Runs inside the tap, so turning sound on can unlock audio and preview it. */
export function setSoundOn(on: boolean) {
  const { sound: _, ...rest } = readSettings()
  saveSettings(on ? rest : { ...rest, sound: false })
  if (on) {
    unlock()
    playSound('land')
  } else quiet()
}
