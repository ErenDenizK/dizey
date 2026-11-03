import { describe, expect, it, vi } from 'vitest'
import { CHECK_EVERY_MS, keepFresh } from './keepFresh'

function rig() {
  const update = vi.fn(() => Promise.resolve())
  let onVisible: () => void = () => {}
  let tick: () => void = () => {}
  let interval = 0
  const doc = {
    visibilityState: 'hidden' as DocumentVisibilityState,
    addEventListener: (_: string, run: () => void) => {
      onVisible = run
    },
  }
  keepFresh(
    { update },
    {
      doc: doc as never,
      setInterval: (run, ms) => {
        tick = run
        interval = ms
        return 0
      },
    },
  )
  return { update, doc, show: () => onVisible(), tick: () => tick(), interval: () => interval }
}

describe('keepFresh', () => {
  it('checks for an update when the app becomes visible, not when it hides', () => {
    const r = rig()
    r.show()
    expect(r.update).not.toHaveBeenCalled()
    r.doc.visibilityState = 'visible'
    r.show()
    expect(r.update).toHaveBeenCalledTimes(1)
  })

  it('checks every 30 minutes', () => {
    const r = rig()
    expect(r.interval()).toBe(CHECK_EVERY_MS)
    expect(CHECK_EVERY_MS).toBe(30 * 60 * 1000)
    r.tick()
    expect(r.update).toHaveBeenCalledTimes(1)
  })

  it('does nothing without a registration, and survives a failed check', async () => {
    expect(() => keepFresh(undefined)).not.toThrow()
    const failing = { update: vi.fn(() => Promise.reject(new Error('offline'))) }
    let tick: () => void = () => {}
    keepFresh(failing, {
      doc: { visibilityState: 'visible', addEventListener: () => {} } as never,
      setInterval: (run) => {
        tick = run
      },
    })
    tick()
    await Promise.resolve()
    expect(failing.update).toHaveBeenCalled()
  })
})
