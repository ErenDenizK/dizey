import { describe, expect, it } from 'vitest'
import { createBackup, parseBackup, readEntries, restoreEntries } from './backup'

function memoryStore(initial: Record<string, string>) {
  const data = new Map(Object.entries(initial))
  return {
    data,
    keys: () => [...data.keys()],
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
  }
}

describe('backup', () => {
  const now = new Date('2026-10-30T16:00:00Z')

  it('round-trips through JSON', () => {
    const store = memoryStore({ 'satir.v3.done': '{"B1":1}', 'satir-sound': '{"muted":false}' })
    const backup = createBackup(readEntries(store), 'production', now)
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup)
  })

  it('restore replaces every key of the channel', () => {
    const store = memoryStore({ stale: 'x', 'satir.v3.done': '{}' })
    const backup = createBackup({ 'satir.v3.done': '{"B1":1}' }, 'production', now)
    restoreEntries(store, backup)
    expect(Object.fromEntries(store.data)).toEqual({ 'satir.v3.done': '{"B1":1}' })
  })

  it('rejects files that are not Dizey backups', () => {
    expect(parseBackup('not json')).toBeNull()
    expect(parseBackup('{"app":"other","format":1}')).toBeNull()
    expect(
      parseBackup('{"app":"dizey","format":2,"exportedAt":"2026-10-30T00:00:00Z","entries":{}}'),
    ).toBeNull()
    expect(
      parseBackup('{"app":"dizey","format":1,"exportedAt":"2026-10-30T00:00:00Z","entries":{"a":1}}'),
    ).toBeNull()
    expect(parseBackup('{"app":"dizey","format":1,"exportedAt":"yesterday","entries":{}}')).toBeNull()
  })
})
