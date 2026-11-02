import { describe, expect, it, vi } from 'vitest'
import type { DuoHandle } from '../character/Duo'
import { type Anchor, AnchorRegistry, pickAnchor, reactionGate, wantedNames } from './companion'

const anchor = (id: string, name: string, connected = true): Anchor => ({
  id,
  name,
  size: 'large',
  el: { isConnected: connected } as HTMLElement,
  mood: 'happy',
  alive: true,
  look: [0, 0],
})

describe('companion anchors', () => {
  it('wants the tab’s own anchor', () => {
    expect(wantedNames({ tab: '/', overlay: false, present: 'push' })).toEqual(['today'])
    expect(wantedNames({ tab: '/me', overlay: false, present: 'push' })).toEqual(['me'])
  })

  it('keeps the tab behind a sheet and takes the lesson’s anchors for a full-screen route', () => {
    expect(wantedNames({ tab: '/me', overlay: true, present: 'sheet' })).toEqual(['me'])
    expect(wantedNames({ tab: '/', overlay: true, present: 'push' })).toEqual(['end', 'lesson'])
  })

  it('picks the first wanted name that has a live anchor', () => {
    const all = [anchor('1', 'today'), anchor('2', 'me'), anchor('3', 'lesson')]
    expect(pickAnchor(all, ['end', 'lesson'])?.id).toBe('3')
    expect(pickAnchor(all, ['today'])?.id).toBe('1')
    expect(pickAnchor(all, ['end'])).toBeNull()
    expect(pickAnchor(all, [])).toBeNull()
  })

  it('prefers the end hero over the top bar when both exist', () => {
    const all = [anchor('3', 'lesson'), anchor('4', 'end')]
    expect(pickAnchor(all, ['end', 'lesson'])?.id).toBe('4')
  })

  it('ignores detached anchors and prefers the latest among equals', () => {
    expect(pickAnchor([anchor('1', 'today', false)], ['today'])).toBeNull()
    expect(pickAnchor([anchor('1', 'today'), anchor('2', 'today')], ['today'])?.id).toBe('2')
  })
})

describe('anchor registry', () => {
  it('notifies on register, change and removal, and only on a real change', () => {
    const registry = new AnchorRegistry()
    const seen = vi.fn()
    registry.subscribe(seen)
    const off = registry.register(anchor('1', 'me'))
    expect(seen).toHaveBeenCalledTimes(1)
    registry.update('1', { mood: 'happy' })
    expect(seen).toHaveBeenCalledTimes(1)
    registry.update('1', { mood: 'proud' })
    expect(seen).toHaveBeenCalledTimes(2)
    expect(registry.all()[0]?.mood).toBe('proud')
    off()
    expect(registry.all()).toHaveLength(0)
    expect(seen).toHaveBeenCalledTimes(3)
  })

  it('runs a command now for the active anchor and keeps it for later otherwise', () => {
    const registry = new AnchorRegistry()
    const me = anchor('1', 'me')
    registry.register(me)
    const handle = { react: vi.fn() } as unknown as DuoHandle
    registry.command('1', (h) => h.react('happy'), handle)
    expect(handle.react).not.toHaveBeenCalled()
    registry.active = me
    registry.command('1', (h) => h.react('proud'), handle)
    expect(handle.react).toHaveBeenCalledWith('proud')
    // While the duo is on its way, commands wait for the landing.
    registry.traveling = true
    registry.command('1', (h) => h.react('wow'), handle)
    expect(handle.react).toHaveBeenCalledTimes(1)
    const waiting = registry.takePending('1')
    expect(waiting).toHaveLength(2)
    expect(registry.takePending('1')).toHaveLength(0)
  })

  it('drops an anchor’s waiting commands when it goes away', () => {
    const registry = new AnchorRegistry()
    const off = registry.register(anchor('1', 'me'))
    registry.command('1', () => {}, null)
    off()
    expect(registry.takePending('1')).toHaveLength(0)
  })
})

describe('reaction gate', () => {
  it('lets one reaction through per window', () => {
    let now = 0
    const gate = reactionGate(1500, () => now)
    expect(gate()).toBe(true)
    now = 1499
    expect(gate()).toBe(false)
    now = 1500
    expect(gate()).toBe(true)
  })
})
