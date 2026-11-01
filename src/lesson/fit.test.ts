import { describe, expect, it } from 'vitest'
import { CELL, fitCell, SOLO } from './Stage'

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
  it('sizes work lines alone on the stage within their own bounds', () => {
    // A short rule in a tall stage stops at the solo cap, not the matrix cap.
    expect(fitCell({ width: 358, height: 500 }, { width: 100, height: 60 }, CELL.probe, SOLO)).toBe(SOLO.max)
    // A long line never drops below today's work size.
    expect(fitCell({ width: 100, height: 500 }, { width: 1000, height: 60 }, CELL.probe, SOLO)).toBe(SOLO.min)
  })
})
