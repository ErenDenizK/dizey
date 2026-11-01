import { describe, expect, it } from 'vitest'
import { drum } from './lens'

const half = 422 // half of an iPhone 14 viewport (844 px)
/** The focus line sits at 46 % of the screen, so the bottom edge is this far from it. */
const edge = 0.54 * 2 * half

describe('Dersler drum', () => {
  it('is the identity at the focus line, with slope 1', () => {
    const at = drum(0, half)
    expect(at.offset).toBe(0)
    expect(at.depth).toBe(1)
    expect(at.squash).toBeCloseTo(1, 6)
    expect(drum(1, half).offset).toBeCloseTo(1, 3)
  })

  it('is symmetric above and below the focus', () => {
    for (const d of [40, 200, 500]) expect(drum(-d, half).offset).toBeCloseTo(-drum(d, half).offset, 9)
  })

  it('never folds back: offset grows with distance until it leaves the screen', () => {
    let last = 0
    for (let d = 1; ; d += 1) {
      const { offset } = drum(d, half)
      expect(offset).toBeGreaterThan(last)
      last = offset
      if (offset > edge) break
    }
  })

  it('fills the screen to its edges (the drum is taller than the screen)', () => {
    expect(drum(100 * half, half).offset).toBeGreaterThan(edge * 1.05)
  })

  it('squash is the slope of the mapping, so neighbouring pieces meet without gaps', () => {
    for (const d of [60, 250, 420]) {
      const slope = (drum(d + 0.5, half).offset - drum(d - 0.5, half).offset) / 1
      expect(drum(d, half).squash).toBeCloseTo(slope, 3)
    }
  })

  it('recedes visibly at the screen edge, but stays readable', () => {
    let d = 0
    while (drum(d, half).offset < edge) d += 1
    const { depth, squash } = drum(d, half)
    expect(depth).toBeGreaterThan(0.85)
    expect(depth).toBeLessThan(0.95)
    expect(squash).toBeGreaterThan(0.6)
  })

  it('falls back to the identity without a screen', () => {
    expect(drum(30, 0)).toEqual({ offset: 30, depth: 1, squash: 1 })
  })
})
