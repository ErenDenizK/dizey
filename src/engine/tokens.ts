import type { SpringSpec } from './spring'

/**
 * Dizey's motion vocabulary. Every value is a decision recorded in docs/design/motion-system.md,
 * with its evidence; changes are logged in docs/research/motion-tuning.md. Components never
 * write a duration or curve of their own: they name one of these.
 *
 * Durations are perceptual (seconds until the motion looks finished). For bounce 0 the motion is
 * within 1% of its distance at about 1.05x the duration and within 5% at about 0.75x.
 */
export const SPRINGS = {
  /** A finger landing on a control: the press-down. Fast enough to feel caused by the touch. */
  tap: { duration: 0.14, bounce: 0 },
  /** The finger lifting: the control springs back with a trace of give, like a real key. */
  release: { duration: 0.34, bounce: 0.22 },
  /** Opacity, colour and blur. Effects never overshoot (an opacity of 1.08 means nothing). */
  fade: { duration: 0.22, bounce: 0 },
  /** Small controls changing state: tab lens, switch knob, check marks, segmented choice. */
  snap: { duration: 0.32, bounce: 0.16 },
  /** Things that move across part of the screen: cards reordering, a sheet changing detent. */
  glide: { duration: 0.42, bounce: 0 },
  /** Whole screens: push, pop, a sheet opening, a card growing into the lesson stage. */
  page: { duration: 0.5, bounce: 0 },
  /** The end of a throw, or a rare earned moment (mastery seal): physical, with momentum. */
  settle: { duration: 0.55, bounce: 0.32 },
  /** Teaching motion inside lessons: slower so the eye can follow a number to its place. */
  teach: { duration: 0.72, bounce: 0.08 },
} as const satisfies Record<string, SpringSpec>

export type SpringName = keyof typeof SPRINGS

/**
 * Names used by code written against the previous engine, mapped to the new tokens so that code keeps
 * working. Deprecated: new code names a token from SPRINGS.
 */
export const LEGACY_NAMES = {
  press: 'tap',
  land: 'settle',
  ui: 'snap',
  move: 'glide',
} as const satisfies Record<string, SpringName>
export type LegacyName = keyof typeof LEGACY_NAMES

/** Deprecated fixed press scale; new code uses pressScale(width). */
export const PRESS_SCALE = 0.97

/**
 * Press depth: every pressable sinks by the same physical distance, so a wide card and a small
 * button feel like the same material. Scale is derived from the element's width.
 */
export const PRESS = {
  /** Pixels the element's edges move inwards on each side. */
  depth: 3,
  /** Bounds so tiny icons do not collapse and huge cards still respond visibly. */
  minScale: 0.92,
  maxScale: 0.985,
  /** Highlight overlay opacity while pressed. */
  dim: 0.06,
  /** A finger that moves farther than this (px) is scrolling, not pressing: the press cancels. */
  slop: 10,
} as const

export function pressScale(width: number): number {
  if (!(width > 0)) return PRESS.maxScale
  const scale = 1 - (2 * PRESS.depth) / width
  return Math.min(PRESS.maxScale, Math.max(PRESS.minScale, scale))
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

/** Choreography: offsets between related motions. Short, and never blocking input. */
export const CHOREO = {
  /** Delay between items of a list entering for the first time. */
  stagger: 0.03,
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
  /**
   * Launch for tap-started screen motion (push, pop, sheet open): the first frame after a tap already
   * moves, as if the finger had flicked it. 1 would be a pure ease-out; 0.6 keeps a soft start.
   */
  launch: 0.6,
  /** Entrance travel in px: items rise into place from this far below. */
  rise: 8,
} as const

/** The lesson tempo multiplies teaching durations (1 = as written). */
export const TEMPO = { chrome: 1, teach: 1 } as const

/** The longest frame step the driver feeds the clock (ms); longer gaps are treated as this. */
export const MAX_FRAME_MS = 64
