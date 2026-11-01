/**
 * The Dersler drum: the path is drawn on one curved surface, like a wheel turning past you. A point at
 * layout distance `d` from the focus line sits on a drum of radius R, seen from distance P in front of
 * the screen. Everything on the screen (headings, tiles, the path between them, the matrix brackets) is
 * mapped through this one function, so sizes, gaps and lines recede together instead of each piece
 * shrinking around its own centre.
 *
 * Units are half-screens (half the scroller's height), so the drum looks the same on every phone.
 */

/** Drum radius and eye distance, in half-screens. Chosen so the drum still fills the screen edge (see tests). */
export const DRUM = { radius: 3.2, eye: 2.2 } as const

export type DrumPoint = {
  /** Distance of the projected point from the focus line, in the same unit as the input. */
  offset: number
  /** Perspective factor: horizontal size and distance from the screen's centre line are multiplied by it. */
  depth: number
  /** Vertical size factor at this point (the slope of the mapping: perspective times foreshortening). */
  squash: number
}

const QUARTER = Math.PI / 2

function along(theta: number, radius: number, eye: number) {
  const depth = eye / (eye + radius * (1 - Math.cos(theta)))
  return { depth, offset: radius * Math.sin(theta) * depth }
}

/**
 * Projects a layout distance from the focus line (`d`, any unit) given half the screen height (`half`,
 * same unit). Monotonic, identity and slope 1 at the focus, so what is under your finger in the middle
 * moves exactly with it. Points past a quarter turn (far off screen) stay on the drum's rim.
 */
export function drum(d: number, half: number): DrumPoint {
  if (!(half > 0)) return { offset: d, depth: 1, squash: 1 }
  const radius = DRUM.radius * half
  const eye = DRUM.eye * half
  const theta = Math.min(QUARTER, Math.abs(d) / radius)
  const { depth, offset } = along(theta, radius, eye)
  // d offset / d d = (d offset / d theta) / radius.
  const s = Math.sin(theta)
  const c = Math.cos(theta)
  const squash = theta >= QUARTER ? 0 : depth * (c - (radius * s * s * depth) / eye)
  return { offset: Math.sign(d) * offset, depth, squash: Math.max(0, squash) }
}
