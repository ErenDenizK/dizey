/**
 * Motion vocabulary from the earlier app's in-lesson engine, which Eren chose to keep (2026-10-30).
 * Spring presets: stiffness k (mass 1) and damping ratio zeta; durations come from physics.
 * Times in ms, distances in px.
 *
 * These values are STARTING DEFAULTS, not settled (Eren, 2026-10-30): each one is reviewed on iPhone
 * screen recordings, and every change is recorded in docs/research/motion-tuning.md with its reason.
 * The principles stay fixed: one clock, a tap finishes motion, cause first, one bounce at a time.
 * All tunable motion values live in this file only.
 */
export const SPRINGS = {
  press: { k: 3800, zeta: 1 },
  ui: { k: 1400, zeta: 0.9 },
  move: { k: 700, zeta: 0.9 },
  page: { k: 300, zeta: 0.9 },
  teach: { k: 170, zeta: 0.8 },
  teachY: { k: 260, zeta: 0.86 },
  land: { k: 400, zeta: 0.6 },
  fade: { k: 1600, zeta: 1 },
  shake: { k: 1300, zeta: 0.2 },
  draw: { k: 200, zeta: 1 },
  leave: { k: 2600, zeta: 1 },
  // The quickest any appearance may be: invisible to 0.9 opacity in about 175 ms.
  enter: { k: 500, zeta: 1 },
  // A carried number peaks below the eye's smooth-pursuit limit and lands in about 0.6 s.
  carry: { k: 110, zeta: 0.9 },
  carryY: { k: 160, zeta: 0.95 },
  carrySide: { k: 300, zeta: 1 },
} as const satisfies Record<string, { k: number; zeta: number }>

export type SpringName = keyof typeof SPRINGS

/** An opacity spring from at most ENTRANCE_LOW to at least ENTRANCE_FULL is an entrance. */
export const ENTRANCE_LOW = 0.1
export const ENTRANCE_FULL = 0.9

/** Teaching motion runs slower than chrome; every teaching motion takes TEACH_PACE times its spring time. */
export const TEACH_PACE = 1.6
export const CUE_TEMPO = 1.5

/** Tempo classes for teaching beats: `pace` scales a runner beat, `cue` a cue-timed beat. */
export const TEMPO_CLASSES = {
  quick: { pace: 1, cue: 1 },
  repeat: { pace: 1.1, cue: CUE_TEMPO * 1.1 },
  teach: { pace: TEACH_PACE, cue: CUE_TEMPO * TEACH_PACE },
} as const

/** Choreography timings for the chrome. Beats keep their own cue times. */
export const CHOREO = {
  stagger: 35,
  beatDelay: 420,
  openDelay: 180,
  revealDelay: 160,
  correctDelay: 220,
  sheetDelay: 380,
  mascotDelay: 140,
  waveSpeed: 1.4,
  waveMax: 240,
  cellStagger: 80,
  glideHead: 90,
  tilesHead: 70,
  mapFadeDelay: 120,
  leaveHead: 120,
  markHold: 360,
  endMarksDelay: 600,
  noticeHold: 1800,
  prepHold: 1000,
  fontWait: 500,
  idlePoll: 50,
} as const

/** Entrance travel distances. Entrances never scale up from zero. */
export const SHIFT = { enter: 12, narr: 14, scene: 10, dock: 16, tiles: 36, count: 6 } as const

/** Chrome lines enter from this opacity, so a step change never shows an empty frame. */
export const ENTER_FLOOR = 0.35
export const PRESS_SCALE = 0.96
/** Particle physics for celebrations (px, ms). */
export const PHYSICS = { gravity: 2.2e-3, drag: 0.9985, spin: 0.7 } as const
/** The longest frame step the real-time driver feeds the clock. */
export const MAX_FRAME_MS = 64
/** Cue limit when landing everything at once. */
export const FINISH_GUARD = 5000
