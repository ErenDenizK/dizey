import type { SpringSpec } from './spring'

/**
 * Converts the old app's spring notation (stiffness k at mass 1, damping ratio zeta) into ours. The two
 * are exactly equivalent: w0 = sqrt(k) = 2*pi / duration and bounce = 1 - zeta (see spring.ts).
 */
function fromStiffness(k: number, zeta: number): SpringSpec {
  return { duration: (2 * Math.PI) / Math.sqrt(k), bounce: 1 - zeta }
}

/**
 * Dizey's motion vocabulary: the old app's spring table, value for value (decision 0006; inventory
 * docs/research/old-ui-inventory.md section 1.1). Components name one of these and never write a duration
 * or curve of their own. Teaching motion is never played at the raw table time: the lesson channel's
 * tempo (TEMPO_CLASSES) scales it.
 */
const OLD = {
  /** A finger landing on a control. */
  press: fromStiffness(3800, 1),
  /** Small controls changing state; the release of a press. */
  ui: fromStiffness(1400, 0.9),
  /** Things that move across part of the screen. */
  move: fromStiffness(700, 0.9),
  /** Whole screens and sheets. */
  page: fromStiffness(300, 0.9),
  /** Teaching motion (before the tempo class scales it). */
  teach: fromStiffness(170, 0.8),
  /** The vertical half of a teaching move. */
  teachY: fromStiffness(260, 0.86),
  /** A value landing with one bounce. */
  land: fromStiffness(400, 0.6),
  /** Opacity and colour; also every effect whose preset would overshoot. */
  fade: fromStiffness(1600, 1),
  /** A shake started with a push (velocity), e.g. a wrong option. */
  shake: fromStiffness(1300, 0.2),
  /** A stroke or word being drawn; it reads from half ink (DRAW_READ). */
  draw: fromStiffness(200, 1),
  /** Leaving: quick and without bounce. */
  leave: fromStiffness(2600, 1),
  /** The quickest any appearance may be: invisible to 0.9 opacity in 175 ms (the entrance floor). */
  enter: fromStiffness(500, 1),
  /** A carried number, horizontal: peaks under the eye's pursuit limit and lands in about 0.6 s. */
  carry: fromStiffness(110, 0.9),
  /** A carried number, vertical: stiffer than `carry`, so the path curves (down first). */
  carryY: fromStiffness(160, 0.95),
  /** A carried number in a group whose paths would cross: sideways first, a row apart. */
  carrySide: fromStiffness(300, 1),
} as const satisfies Record<string, SpringSpec>

/**
 * Light: the celebration layer (src/ui/shine.ts). Light has no mass, so both are critically damped: a glow
 * swells in about a third of a second and dies away like an ember, several times slower than it came.
 */
const LIGHT = {
  /** A glow swelling toward its peak. */
  bloom: fromStiffness(320, 1),
  /** A glow dying away after its peak. */
  ember: fromStiffness(22, 1),
  /** A ring of light or a sheen travelling across a surface. */
  sheen: fromStiffness(60, 1),
} as const satisfies Record<string, SpringSpec>

export const SPRINGS = {
  ...OLD,
  ...LIGHT,
  // Names the current components use, bound to the old preset that does the same job.
  /** = press */
  tap: OLD.press,
  /** = ui (the old release of a press) */
  release: OLD.ui,
  /** = ui */
  snap: OLD.ui,
  /** = move */
  glide: OLD.move,
  /** = land */
  settle: OLD.land,
} as const satisfies Record<string, SpringSpec>

export type SpringName = keyof typeof SPRINGS

/** Kept for type compatibility; every old name is now a real token. */
export const LEGACY_NAMES = {} as const satisfies Record<string, SpringName>
export type LegacyName = never

/** An opacity spring from at most ENTRANCE.low to at least ENTRANCE.full is an entrance: never quicker than `enter`. */
export const ENTRANCE = { low: 0.1, full: 0.9 } as const

/** Every press, buttons, tabs, tiles and the stage card alike ("a softer press is missed"). */
export const PRESS_SCALE = 0.96

/**
 * Press feel: half the depth is drawn in the same frame as the touch, the spring takes the rest; a press
 * released before it was drawn is drawn now at its full depth, so the next frame always shows the tap.
 */
export const PRESS = {
  /** Fraction of the depth drawn at once on touch. */
  first: 0.5,
  /** A finger that moves farther than this (px) is scrolling, not pressing: the press cancels. */
  slop: 10,
} as const

/** Deprecated: every pressable now uses PRESS_SCALE, as in the old app. */
export function pressScale(_width?: number): number {
  return PRESS_SCALE
}

/** Gesture physics (UIKit's documented values; see the research report). */
export const GESTURE = {
  /** Rubber-band coefficient for dragging past an edge. */
  rubberBand: 0.55,
  /** Momentum decay per millisecond for projecting where a flick would come to rest. */
  deceleration: 0.998,
  /** A flick faster than this (px/s) decides a binary gesture by direction alone. */
  flick: 500,
  /** Samples older than this (ms) are ignored when measuring release velocity. */
  velocityWindow: 100,
  /** Width of the left edge that starts a back swipe (px). */
  edge: 24,
} as const

/** Choreography timings (ms) for the chrome, from the old app (inventory 1.4). Beats keep their own cue times. */
export const CHOREO_MS = {
  stagger: 35,
  beatDelay: 420,
  openDelay: 180,
  revealDelay: 160,
  correctDelay: 220,
  sheetDelay: 380,
  mascotDelay: 140,
  /** Ripple across tiles and progress segments: px per ms, and the longest delay. */
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

/** Entrance travel (px) per part of the screen, from the old app. */
export const SHIFT = { enter: 12, narr: 14, scene: 10, dock: 16, tiles: 36 } as const

/** Narration and dock enter from this opacity, so a step change never shows an empty frame. */
export const ENTER_FLOOR = 0.35

/** A drawn word reads from half ink: when the critically damped `draw` spring passes 0.5 (w0*t = 1.678), in ms. */
export const DRAW_READ = (1678 / (2 * Math.PI)) * SPRINGS.draw.duration

/** Particle physics for celebrations (px, ms). */
export const PHYSICS = { gravity: 2.2e-3, drag: 0.9985, spin: 0.7 } as const

/** Choreography used by the current shell components (sheet, push). */
export const CHOREO = {
  /** Delay between items of a list entering for the first time (s). */
  stagger: CHOREO_MS.stagger / 1000,
  /** At most this many items get a stagger; the rest enter with the last one. */
  staggerMax: 6,
  /** How far outgoing screens drift during a push, as a fraction of the screen width. */
  parallax: 0.3,
  /** Scrim darkness over the screen being covered by a push. */
  pushDim: 0.12,
  /** Sheet backdrop scrim opacity at the large detent. */
  sheetScrim: 0.36,
  /** The screen behind a sheet recedes to this scale. */
  sheetRecede: 0.94,
  /** Launch for tap-started screen motion: the first frame after a tap already moves. */
  launch: 0.6,
  /** Entrance travel in px (old SHIFT.enter). */
  rise: SHIFT.enter,
} as const

/**
 * Teaching pace: every teaching motion takes TEACH_PACE times its table time (Eren 2026-10-26: "slower
 * teaching tempo"). Chrome motion never uses it.
 */
export const TEACH_PACE = 1.6
/** Cue-timed beats also scale their cue times by this, so each line is readable for about 1.2 s. */
export const CUE_TEMPO = 1.5

/**
 * Tempo classes: a beat's pace comes from what it teaches, inferred from the beat, never set per lesson.
 * `pace` scales a runner beat (springs, leads, staggers); `cue` scales a cue-timed beat.
 */
export const TEMPO_CLASSES = {
  /** Marks, signs, labels, layout: nothing travels and nothing is calculated. */
  quick: { pace: 1, cue: 1 },
  /** A move this lesson has already shown at the teaching pace. */
  repeat: { pace: 1.1, cue: CUE_TEMPO * 1.1 },
  /** The new idea, the first time. */
  teach: { pace: TEACH_PACE, cue: CUE_TEMPO * TEACH_PACE },
} as const
export type TempoClass = keyof typeof TEMPO_CLASSES

/** The longest frame step the driver feeds the clock (ms); longer gaps are treated as this. */
export const MAX_FRAME_MS = 64
