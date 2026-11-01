import { describe, expect, it } from 'vitest'
import { eyePath, MOODS, mouthPath, Rig } from './rig'

const run = (rig: Rig, ms: number) => {
  for (let t = 0; t < ms; t += 16) rig.step(16)
}

describe('duo rig', () => {
  it('lands a mood on both heads, Sütun a little later', () => {
    const rig = new Rig()
    rig.pose('happy')
    run(rig, 40)
    expect(rig.heads.row.value('happy')).toBeGreaterThan(rig.heads.col.value('happy'))
    run(rig, 1500)
    for (const head of Object.values(rig.heads))
      expect(head.value('mc')).toBeCloseTo(MOODS.happy.mc as number, 2)
    expect(rig.active()).toBe(false)
  })

  it('never lets a face channel overshoot its pose', () => {
    const rig = new Rig()
    rig.pose('wow')
    let peak = 0
    for (let t = 0; t < 1500; t += 16) {
      rig.step(16)
      peak = Math.max(peak, rig.heads.row.value('mo'))
    }
    expect(peak).toBeLessThanOrEqual((MOODS.wow.mo as number) + 1e-6)
  })

  it('hops up and comes back to rest', () => {
    const rig = new Rig()
    rig.hop('row')
    let highest = 0
    for (let t = 0; t < 2500; t += 16) {
      rig.step(16)
      highest = Math.min(highest, rig.heads.row.value('y'))
    }
    expect(highest).toBeLessThan(-3)
    expect(rig.heads.row.value('y')).toBeCloseTo(0, 2)
    expect(rig.heads.row.value('sy')).toBeCloseTo(1, 2)
  })

  it('closes an eye mid-blink and opens it after', () => {
    const rig = new Rig()
    rig.blink('row')
    run(rig, 80)
    expect(rig.lid(rig.heads.row, 0)).toBeLessThan(0.2)
    run(rig, 400)
    expect(rig.lid(rig.heads.row, 0)).toBe(1)
  })

  it('finish lands every cue and spring at once', () => {
    const rig = new Rig()
    rig.react('happy')
    rig.finish()
    expect(rig.active()).toBe(false)
    expect(rig.heads.col.value('happy')).toBe(1)
  })

  it('jumps straight to a pose in reduced motion and skips gestures', () => {
    const rig = new Rig()
    rig.reduced = true
    rig.react('console')
    expect(rig.heads.row.value('brow')).toBe(1)
    expect(rig.heads.col.value('rot')).toBe(0)
  })

  it('draws the happy eye as an upward arch and the open mouth deeper than the closed one', () => {
    expect(eyePath(1, 0)).toBe('M-1.9 0C-1.9 -3.9 1.9 -3.9 1.9 0C1.9 3.9 -1.9 3.9 -1.9 0Z')
    // Fully happy: the lower lid sits above the eye line, an upward arch.
    expect(eyePath(1, 1)).toContain('C1.9 -2.14')
    expect(mouthPath(0.6, 0)).toBe('M-2.8 0Q0 1.56 2.8 0Q0 1.56 -2.8 0Z')
  })

  it('crouches, stretches in the air and lands with a squash that settles', () => {
    const rig = new Rig()
    rig.crouch('row')
    run(rig, 300)
    expect(rig.heads.row.value('sy')).toBeLessThan(0.97)
    rig.stretch('row')
    run(rig, 120)
    expect(rig.heads.row.value('sy')).toBeGreaterThan(1.02)
    rig.land('row')
    let lowest = 1
    for (let t = 0; t < 1500; t += 16) {
      rig.step(16)
      lowest = Math.min(lowest, rig.heads.row.value('sy'))
    }
    expect(lowest).toBeLessThan(0.99)
    expect(rig.heads.row.value('sy')).toBeCloseTo(1, 2)
    expect(rig.heads.row.value('y')).toBeCloseTo(0, 2)
  })

  it('wakes from asleep: the eyes shut, then open on neutral', () => {
    const rig = new Rig()
    rig.pose('asleep', true)
    expect(rig.heads.row.value('openL')).toBeCloseTo(0.04, 2)
    rig.pose('neutral')
    run(rig, 600)
    expect(rig.heads.row.value('openL')).toBeCloseTo(1, 2)
  })
})
