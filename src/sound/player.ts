import { readSettings, saveSettings } from '../progress/settings'
import { EVENTS, type SoundContext, type SoundEvent } from './score'
import { createSynth, type Synth } from './synth'

/**
 * The app's one sound instance. Sound is on unless the learner turns it off in Ben. By default it
 * obeys iPhone's silent switch: the audio session is 'ambient', which also lets music from other
 * apps keep playing underneath. The learner can choose 'playback' in Ben ("Sessiz modda da çal"),
 * which sounds through the silent switch but pauses other apps' music. iOS only starts audio inside
 * a tap, so the context is created and resumed from the first tap and from any tap after it was
 * parked.
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

/** The session type the settings ask for. */
const sessionType = () => (readSettings().soundInSilent ? 'playback' : 'ambient')

function applySession() {
  try {
    const session = (navigator as AudioSessionNavigator).audioSession
    if (session && session.type !== sessionType()) session.type = sessionType()
  } catch {
    // Older Safari: Web Audio is 'ambient' by default there too, and cannot be changed.
  }
}

/**
 * Where the interface's sounds take their chord from: inside a lesson, the step on screen, so a
 * tap agrees with the lesson's harmony; elsewhere the home chord.
 */
let ambientContext: SoundContext = {}
export function setSoundContext(context: SoundContext) {
  ambientContext = context
}

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
    applySession()
    try {
      ctx = new Context({ latencyHint: 'interactive' })
    } catch {
      return
    }
    // Older iOS only unlocks a context that has played something inside the tap: one silent sample.
    try {
      const source = ctx.createBufferSource()
      source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
      source.connect(ctx.destination)
      source.start()
    } catch {
      // Nothing to unlock.
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
  // Registered after unlock, so the first tap's sound already has a context.
  document.addEventListener('click', touched, { capture: true, passive: true })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) quiet()
  })
}

/** Plays a cue on the frame its motion lands. Silent when sound is off or audio is not yet unlocked. */
export function playSound(event: SoundEvent, given?: SoundContext) {
  if (!soundOn() || !ctx || !synth) return
  const context = { ...(EVENTS[event].tier === 'touch' ? ambientContext : {}), ...given }
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

/** Ben's Sesler switch. Runs inside the tap, so turning sound on can unlock audio and preview it. */
export function setSoundOn(on: boolean) {
  const { sound: _, ...rest } = readSettings()
  saveSettings(on ? rest : { ...rest, sound: false })
  if (on) {
    unlock()
    playSound('toggleOn')
  } else quiet()
}

/** Ben's "Sessiz modda da çal" switch: takes effect at once, inside the tap. */
export function setSoundInSilent(on: boolean) {
  const { soundInSilent: _, ...rest } = readSettings()
  saveSettings(on ? { ...rest, soundInSilent: true } : rest)
  applySession()
}

const SOUNDS = new Set<string>(Object.keys(EVENTS))

/**
 * Every tap in the app makes a sound, without each screen having to ask for one. The nearest
 * `data-sound` names it: an event, or "none" where the screen plays its own (an answer, a step) or
 * stays silent (the exam rehearsal). `data-sound-index` picks the voice (a tab's own note).
 * Otherwise a switch rises or falls with its new state, and any other control taps.
 */
function touched(event: Event) {
  if (!soundOn()) return
  const target = event.target
  if (!(target instanceof Element)) return
  const control = target.closest('button, a[href], input, select, summary, [role="button"], [role="tab"]')
  if (!control || (control as HTMLButtonElement).disabled) return
  const named = target.closest('[data-sound]')
  const name = named?.getAttribute('data-sound')
  if (name === 'none') return
  if (name && SOUNDS.has(name)) {
    const index = named?.getAttribute('data-sound-index')
    playSound(name as SoundEvent, index ? { index: Number(index) } : undefined)
    return
  }
  if (control instanceof HTMLInputElement) {
    if (control.type === 'checkbox') playSound(control.checked ? 'toggleOn' : 'toggleOff')
    return
  }
  playSound('tap')
}
