import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { topDim } from './status-band'

/** Minimal elements: a class list, closest() over a parent chain, and an inline opacity read by getComputedStyle. */
type Fake = { cls: string; opacity?: string; parent?: Fake }
const el = (f: Fake): Element =>
  ({
    classList: { contains: (c: string) => f.cls.split(' ').includes(c) },
    closest: (sel: string) => {
      const want = sel.slice(1)
      for (let n: Fake | undefined = f; n; n = n.parent) if (n.cls.split(' ').includes(want)) return el(n)
      return null
    },
    __opacity: f.opacity ?? '1',
  }) as unknown as Element

beforeEach(() => vi.stubGlobal('getComputedStyle', (e: { __opacity: string }) => ({ opacity: e.__opacity })))
afterEach(() => vi.unstubAllGlobals())

describe('topDim', () => {
  it('is 0 over an undimmed screen', () => {
    const stage: Fake = { cls: 'dz-stage', opacity: '1' }
    expect(topDim([el({ cls: 'dz-status-band' }), el({ cls: 'row', parent: stage })])).toBe(0)
  })
  it('adds a scrim and stops at the first surface', () => {
    const stage: Fake = { cls: 'dz-stage', opacity: '1' }
    expect(topDim([el({ cls: 'dz-scrim', opacity: '0.4' }), el({ cls: 'row', parent: stage })])).toBeCloseTo(
      0.4,
    )
  })
  it('follows the receding tab screen under a route sheet', () => {
    const stage: Fake = { cls: 'dz-stage', opacity: '0.6' }
    expect(topDim([el({ cls: 'sh-sheet-dismiss' }), el({ cls: 'row', parent: stage })])).toBeCloseTo(0.4)
  })
  it('ignores a dimmed stage under a full-screen route', () => {
    const stage: Fake = { cls: 'dz-stage', opacity: '0.6' }
    expect(topDim([el({ cls: 'ls-run' }), el({ cls: 'row', parent: stage })])).toBe(0)
  })
})
