import { describe, expect, it } from 'vitest'
import { CELL, fitCell } from './Stage'

describe('fitCell', () => {
  it('caps a small scene so a 2×2 never shouts', () => {
    expect(fitCell({ width: 358, height: 500 }, { width: 100, height: 100 })).toBe(CELL.max)
  })
  it('scales by the tighter of width and height', () => {
    // Twice as wide as the room: half the probe size.
    expect(fitCell({ width: 300, height: 1000 }, { width: 600, height: 100 })).toBe(CELL.probe / 2)
  })
  it('keeps a floor so 4×4 scenes stay readable', () => {
    expect(fitCell({ width: 100, height: 100 }, { width: 1000, height: 1000 })).toBe(CELL.min)
  })
  it('falls back to the cap before anything is laid out', () => {
    expect(fitCell({ width: 358, height: 500 }, { width: 0, height: 0 })).toBe(CELL.max)
  })
})
