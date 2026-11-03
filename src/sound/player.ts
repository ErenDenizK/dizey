import { readSettings, saveSettings } from '../progress/settings'
import { type Conductor, createConductor, createLearner } from './conductor'
import { type CueBank, createCueBank, isCueEvent, musicAnswersCue } from './cues'
import type { MusicCue } from './form'
import { chordAt, seeded } from './harmony'
import { idleCue } from './music'
import { createSampleBank, type SampleBank } from './sampler'
import { EVENTS, type Plan, type SoundContext, type SoundEvent } from './score'
import { createSynth, PALETTES, type PaletteId, type Synth } from './synth'

/**
 * The app's one sound instance. Sound is on unless the learner turns it off in Ben. By default it
 * obeys iPhone's silent switch: the audio session is 'ambient', which also lets music from other
 * apps keep playing underneath. The learner can choose 'playback' in Ben ("Sessiz modda da çal"),
 * which sounds through the silent switch but pauses other apps' music. iOS only starts audio inside
 * a tap, so the context is built while idle, then unlocked and resumed from the first tap and from any tap after it was
 * parked.
 */

/** Park (suspend) the context after this long with nothing ringing: battery. */
const IDLE_MS = 30_000
/** A call made while parked plays when audio resumes, unless it would land later than this. */
const STALE_MS = 250

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

let ctx: AudioContext | null = null
let synth: Synth | null = null
let cues: CueBank | null = null
let samples: SampleBank | null = null
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
let ambientContext: SoundContext & { music?: MusicCue } = {}
export function setSoundContext(context: SoundContext & { music?: MusicCue }) {
  const stepBefore = ambientContext.step
  const inLesson = ambientContext.steps !== undefined
  // A new lesson opens over a lesson end still ringing: its opening fades that cadence (the pedal in
  // synth.ts), so the music may come back with the new lesson's first chord.
  if (context.steps && !inLesson) {
    conductor?.resume()
    learner.reset()
  }
  ambientContext = context
  // A new lesson starts its own piece (its own motif); leaving one returns to the home walk.
  conductor?.setSeed(context.music?.seed ?? 0)
  if (context.step === stepBefore) return
  // A new step: the music moves with it on the next beat. What the learner just did decides how it
  // answers: a flourish after a correct answer, a softer next step after a wrong one.
  conductor?.request(learner.stepped(context.step, context.music?.role, inLesson && !!context.steps))
}

/** The learner's answers steer the music (tracked from the sounds the lesson plays). */
const learner = createLearner()

function armIdle() {
  clearTimeout(idle)
  idle = setTimeout(() => {
    if (synth?.ringing || musicWanted()) armIdle()
    else void ctx?.suspend().catch(() => {})
  }, IDLE_MS)
}

/**
 * Builds the context and the synth (a 3 s reverb impulse, its convolution set-up) without making a sound. This is
 * the expensive part of audio start-up (about 60 ms on a phone-class CPU), so it runs once while the app is idle,
 * never inside the first tap where it would stall the tap's own animation.
 */
function prepare() {
  if (ctx || !soundOn()) return
  const Context = globalThis.AudioContext
  if (!Context) return
  applySession()
  try {
    ctx = new Context({ latencyHint: 'interactive' })
  } catch {
    return
  }
  const settings = readSettings()
  cues = createCueBank(ctx)
  samples = createSampleBank(ctx)
  synth = createSynth(ctx, { palette: paletteOf(settings.palette), cues, samples })
  // Decode the recorded cues and the music's instruments while the app is idle; until they are ready the synth
  // plays the old cues and the music's synth voices.
  void cues.load()
  void samples.load()
  synth.setMusicLevel(settings.musicSoft ? MUSIC_SOFT_DB : 0)
  conductor = createConductor({
    now: () => ctx?.currentTime ?? 0,
    sink: {
      play: (notes, at) => synth?.playMusic(notes, at),
      cut: (at, tau) => synth?.cutMusic(at, tau),
    },
    random: musicRandom,
    wanted: wantedCue,
  })
  synth.listen((plan) => {
    const now = ctx?.currentTime ?? 0
    for (const listener of heard) listener(plan, now)
  })
  ctx.addEventListener('statechange', () => {
    if (ctx?.state === 'running') {
      armIdle()
      syncMusic()
    }
  })
}

let primed = false

/** Create or resume audio. Call only from a tap handler (or a listener on one). */
function unlock() {
  if (!soundOn() || document.hidden) return
  prepare()
  if (!ctx) return
  if (!primed) {
    primed = true
    applySession()
    // Older iOS only unlocks a context that has played something inside the tap: one silent sample.
    try {
      const source = ctx.createBufferSource()
      source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
      source.connect(ctx.destination)
      source.start()
    } catch {
      // Nothing to unlock.
    }
  }
  if (ctx.state !== 'running') void ctx.resume().catch(() => {})
  // A load that failed (offline at start-up) is tried again on a tap.
  void cues?.load()
  void samples?.load()
}

function quiet() {
  synth?.stopAll()
  stopMusic(0.05)
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
  setInterval(syncMusic, TICK_MS)
  // Build the (silent, suspended) audio graph once the first screen has settled.
  const whenIdle = globalThis.requestIdleCallback ?? ((run: () => void) => setTimeout(run, 1000))
  setTimeout(() => whenIdle(prepare), 1500)
}

/** Plays a cue on the frame its motion lands. Silent when sound is off or audio is not yet unlocked. */
export function playSound(event: SoundEvent, given?: SoundContext) {
  if (!soundOn() || !ctx || !synth) return
  learner.heard(event)
  const tier = EVENTS[event].tier
  const context: SoundContext = { ...(tier === 'touch' ? ambientContext : {}), ...given }
  // Outside a lesson a 'step' sound takes the chord the music is holding, so the two always agree.
  const holding = conductor?.chordAt(ctx.currentTime)
  if (!context.steps && holding) context.chord = holding
  if (ctx.state === 'running') {
    armIdle()
    const plan = synth.play(event, context)
    // The music never stops for a recorded cue: its bus ducks (synth.ts) and the melody rests until the duck has
    // returned; a lesson end also settles on I. A synthesized fallback cue walks its own chords, so the music steps
    // aside and comes back after it.
    if ((tier === 'lesson' || tier === 'reward') && conductor) {
      if (plan.start !== undefined && isCueEvent(event)) musicAnswersCue(conductor, event, plan.start)
      else conductor.fade(plan.end - 1.5)
    }
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
    syncMusic()
  } else quiet()
}

const paletteOf = (id: string | undefined): PaletteId => (id && id in PALETTES ? (id as PaletteId) : 'rhodes')

/** The learner's palette: timbre only, the same notes. */
export function setPalette(id: PaletteId) {
  const { palette: _, ...rest } = readSettings()
  saveSettings(id === 'rhodes' ? rest : { ...rest, palette: id })
  synth?.setPalette(id)
}

/* ---------- Background music ---------- */

/** How often the music scheduler runs, ms (it writes bars about 2.4 s ahead, see conductor.ts). */
const TICK_MS = 400

/** Softer music setting, dB under normal. */
const MUSIC_SOFT_DB = -7

let conductor: Conductor | null = null

/** What the music should play now: the lesson's plan for the step on screen, or the home walk. */
const wantedCue = (phrase: number): MusicCue => {
  const { step, steps, music } = ambientContext
  if (!steps) return idleCue(phrase)
  const base = music ?? { ...idleCue(phrase), chord: chordAt(step, steps) }
  return { ...base, energy: learner.energy(base.energy, step) }
}
let held = false
const musicRandom = seeded(Date.now() & 0xffff)

const musicWanted = () => soundOn() && readSettings().music !== false && !held && !document.hidden

function stopMusic(tau = 0.8) {
  conductor?.stop(tau)
}

/** Writes the next bars when they are due; starts and stops with the settings, the page and the exam. */
function syncMusic() {
  if (!ctx || !synth || ctx.state !== 'running' || !musicWanted()) {
    if (!musicWanted()) stopMusic()
    return
  }
  conductor?.tick()
}

/** Ben's music switch: inside the tap, so turning it on can start at once. */
export function setMusicOn(on: boolean) {
  const { music: _, ...rest } = readSettings()
  saveSettings(on ? rest : { ...rest, music: false })
  if (on) {
    unlock()
    syncMusic()
  } else stopMusic()
}

export function setMusicSoft(soft: boolean) {
  const { musicSoft: _, ...rest } = readSettings()
  saveSettings(soft ? { ...rest, musicSoft: true } : rest)
  synth?.setMusicLevel(soft ? MUSIC_SOFT_DB : 0)
}

/** The exam rehearsal holds the music (and nothing else plays there). */
export function holdMusic(hold: boolean) {
  held = hold
  syncMusic()
}

const heard = new Set<(plan: Plan, now: number) => void>()
/** Every sound as it is scheduled, with the context time it was scheduled at (the sound lab draws from it). */
export function listenSounds(listener: (plan: Plan, now: number) => void) {
  heard.add(listener)
  return () => {
    heard.delete(listener)
  }
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
