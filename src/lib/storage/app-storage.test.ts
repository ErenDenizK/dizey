import { afterEach, describe, expect, it, vi } from 'vitest'
import { readRecords } from '../../lesson/store'
import { appStorage } from './app-storage'

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

describe('app storage', () => {
  const storage = fakeStorage()
  vi.stubGlobal('localStorage', storage)
  afterEach(() => vi.restoreAllMocks())

  it('never throws when storage refuses a write, and keeps the value for this visit', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(appStorage.setItem('t.full', 'kept')).toBe(false)
    expect(appStorage.getItem('t.full')).toBe('kept')
    vi.restoreAllMocks()
    expect(appStorage.setItem('t.full', 'stored')).toBe(true)
    expect(appStorage.getItem('t.full')).toBe('stored')
  })

  it('never throws when storage refuses a read', () => {
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(appStorage.getItem('t.blocked')).toBeNull()
  })

  it('keeps an unreadable value aside instead of losing it', () => {
    const write = vi.spyOn(storage, 'setItem')
    appStorage.keepCorrupt('t.corrupt', '{broken')
    expect(write).toHaveBeenCalledWith(expect.stringMatching(/t\.corrupt\.corrupt\.\d{4}-/), '{broken')
  })

  it('reads broken lesson records as no progress and flags them', () => {
    expect(readRecords('{broken')).toEqual({ records: {}, corrupt: true })
    expect(readRecords('[1]')).toEqual({ records: {}, corrupt: true })
    expect(readRecords(null)).toEqual({ records: {}, corrupt: false })
    expect(readRecords('{"d1":{"at":null}}').corrupt).toBe(false)
  })
})
