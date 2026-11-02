/**
 * Birim: a unit square whose moods are real 2x2 matrices. The body takes the whole matrix; the face takes only its
 * polar part (rotation, uniform scale, mirror), so a sheared or stretched body never shears or stretches the face.
 * Pure geometry; src/character/Birim.tsx draws it and moves it on the engine's springs.
 */

/** [a, b, c, d] is the matrix [[a, b], [c, d]] acting on column vectors (y up). */
export type Mat = [number, number, number, number]

export type BirimMood = 'rest' | 'happy' | 'think' | 'oops' | 'wow' | 'sleep'

export const MOODS: Record<BirimMood, Mat> = {
  rest: [1, 0, 0, 1],
  happy: [1.22, 0, 0, 1.22],
  think: [1, 0.3, 0, 1],
  oops: [1.18, 0.12, 0, 0.8],
  wow: [-1, 0, 0, 1],
  sleep: [1, 0, 0, 0.08],
}

/** Moods that come back to the resting one on their own. */
export const TRANSIENT: ReadonlySet<BirimMood> = new Set<BirimMood>(['oops', 'wow'])

export const det = ([a, b, c, d]: Mat): number => a * d - b * c

type Point = [number, number]

/** The corners of the square [-1, 1]^2 mapped by m, in SVG coordinates (y down). */
export function bodyPoints([a, b, c, d]: Mat): [Point, Point, Point, Point] {
  const at = (x: number, y: number): Point => [a * x + b * y, -(c * x + d * y)]
  return [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)]
}

export const FACE_SCALE = { min: 0.55, max: 1.3 } as const
/** Below this |det| the body is nearly a line and the eyes close. */
export const FLAT = 0.25

export type FaceTransform = {
  /** Body centroid in SVG coordinates. */
  x: number
  y: number
  /** Degrees, SVG (clockwise positive). */
  rotate: number
  /** Uniform scale, signed on x when the matrix mirrors. */
  sx: number
  sy: number
}

/** The polar part of m: rotation, uniform scale from sqrt(|det|), and a mirror when det < 0. */
export function faceNumbers(m: Mat): FaceTransform {
  const [a, b, c, d] = m
  const [p0, , p2] = bodyPoints(m)
  const theta = Math.atan2(c - b, a + d)
  const s = Math.min(FACE_SCALE.max, Math.max(FACE_SCALE.min, Math.sqrt(Math.abs(det(m)))))
  return {
    x: (p0[0] + p2[0]) / 2,
    y: (p0[1] + p2[1]) / 2,
    rotate: (-theta * 180) / Math.PI,
    sx: det(m) < 0 ? -s : s,
    sy: s,
  }
}

export function faceTransform(m: Mat): string {
  const f = faceNumbers(m)
  const n = (v: number) => Number(v.toFixed(4))
  return `translate(${n(f.x)} ${n(f.y)}) rotate(${n(f.rotate)}) scale(${n(f.sx)} ${n(f.sy)})`
}

/** 0 for a collapsed body (|det| below 0.15), 1 from FLAT + 0.15 up, smooth between: eyes and smile never jump. */
export function openness(m: Mat): number {
  const t = Math.min(1, Math.max(0, (Math.abs(det(m)) - 0.15) / (FLAT + 0.15 - 0.15)))
  return t * t * (3 - 2 * t)
}

/** How far the smile curves: flat for a collapsed body, gladder as det grows. */
export function smileLift(m: Mat): number {
  return Math.max(-0.08, Math.min(0.2, (det(m) - 0.9) * 0.4 + 0.1)) * openness(m)
}
