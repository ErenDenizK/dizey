import { describe, expect, it } from 'vitest'
import { daysUntil } from './exam'

describe('daysUntil', () => {
  it('counts whole local days', () => {
    expect(daysUntil('2026-11-15', new Date(2026, 9, 30, 23, 59))).toBe(16)
    expect(daysUntil('2026-11-15', new Date(2026, 10, 15, 8))).toBe(0)
    expect(daysUntil('2026-11-15', new Date(2026, 10, 16))).toBe(-1)
  })
})
