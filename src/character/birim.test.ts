import { describe, expect, it } from 'vitest'
import { bodyPoints, det, faceNumbers, faceTransform, type Mat, MOODS, smileLift } from './birim'

describe('moods', () => {
  it('are the specified matrices', () => {
    expect(MOODS.rest).toEqual([1, 0, 0, 1])
    expect(MOODS.happy).toEqual([1.22, 0, 0, 1.22])
    expect(MOODS.think).toEqual([1, 0.3, 0, 1])
    expect(MOODS.oops).toEqual([1.18, 0.12, 0, 0.8])
    expect(MOODS.wow).toEqual([-1, 0, 0, 1])
    expect(MOODS.sleep).toEqual([1, 0, 0, 0.08])
  })
  it('det: rest 1, happy 1.22^2, think 1, wow -1, sleep nearly flat', () => {
    expect(det(MOODS.rest)).toBe(1)
    expect(det(MOODS.happy)).toBeCloseTo(1.4884, 6)
    expect(det(MOODS.think)).toBe(1)
    expect(det(MOODS.wow)).toBe(-1)
    expect(Math.abs(det(MOODS.sleep))).toBeLessThan(0.25)
  })
})

describe('bodyPoints', () => {
  it('maps the unit square with y down', () => {
    expect(bodyPoints(MOODS.rest)).toEqual([
      [-1, 1],
      [1, 1],
      [1, -1],
      [-1, -1],
    ])
  })
  it('shear moves the top edge sideways (up is negative y)', () => {
    const p = bodyPoints(MOODS.think)
    // Corner (-1, 1) in matrix space: x = -1 + 0.3, svg y = -1.
    expect(p[3][0]).toBeCloseTo(-0.7, 9)
    expect(p[3][1]).toBeCloseTo(-1, 9)
  })
})

describe('face transform', () => {
  it('is untouched at rest', () => {
    expect(faceNumbers(MOODS.rest)).toEqual({ x: 0, y: 0, rotate: -0, sx: 1, sy: 1 })
  })
  it('leaves shear unsheared: uniform scale, tiny rotation, no mirror', () => {
    const f = faceNumbers(MOODS.think)
    expect(f.sx).toBe(f.sy)
    expect(f.sx).toBeCloseTo(1, 9)
    expect(Math.abs(f.rotate)).toBeLessThan(10)
  })
  it('a pure shear and its rotation part: the face is a rotation of the polar factor', () => {
    const m: Mat = [1, 1, 0, 1]
    const f = faceNumbers(m)
    expect(f.sx).toBe(f.sy)
    expect(f.rotate).toBeCloseTo((-Math.atan2(0 - 1, 2) * 180) / Math.PI, 9)
  })
  it('mirrors when det < 0', () => {
    const f = faceNumbers(MOODS.wow)
    expect(f.sx).toBeLessThan(0)
    expect(f.sy).toBeGreaterThan(0)
    expect(Math.abs(f.sx)).toBeCloseTo(f.sy, 9)
  })
  it('scale is sqrt|det|, clamped to [0.55, 1.3]', () => {
    expect(faceNumbers([1.1, 0, 0, 1.1]).sy).toBeCloseTo(1.1, 9)
    expect(faceNumbers([3, 0, 0, 3]).sy).toBe(1.3)
    expect(faceNumbers(MOODS.sleep).sy).toBe(0.55)
  })
  it('is centred on the body centroid', () => {
    const f = faceNumbers([1, 0, 0, 1])
    expect([f.x, f.y]).toEqual([0, 0])
    const g = faceNumbers([1, 0.5, 0, 1])
    expect(g.x).toBeCloseTo(0, 9)
  })
  it('renders an SVG transform string', () => {
    expect(faceTransform(MOODS.rest)).toMatch(/^translate\(0 0\) rotate\(-?0\) scale\(1 1\)$/)
  })
})

describe('smile', () => {
  it('is flat for a collapsed body and curved otherwise', () => {
    expect(Math.abs(smileLift(MOODS.sleep))).toBe(0)
    expect(smileLift(MOODS.happy)).toBeGreaterThan(smileLift(MOODS.rest))
  })
})
