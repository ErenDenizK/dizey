import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appStorage } from './app-storage'
import { keysToErase, resetProgress } from './reset-progress'

describe('progress reset', () => {
  it('keeps only the settings key', () => {
    expect(
      keysToErase(['dizey.settings', 'dizey.lessons', 'dizey.onboarding', 'dizey.settings.corrupt.x']),
    ).toEqual(['dizey.lessons', 'dizey.onboarding', 'dizey.settings.corrupt.x'])
  })

  describe('resetProgress', () => {
    const assign = vi.fn()
    beforeEach(() => {
      const data = new Map<string, string>()
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
      })
      // Object.keys(localStorage) is how the real store lists keys; the fake lists its own map instead,
      // without the channel prefix ("dev:") that appStorage adds.
      vi.spyOn(appStorage, 'keys').mockImplementation(() =>
        [...data.keys()].map((key) => key.replace(/^dev:/, '')),
      )
      vi.stubGlobal('window', { location: { assign } })
      assign.mockClear()
    })

    it('erases progress, keeps settings and reloads the root', () => {
      appStorage.setItem('dizey.settings', '{"sound":false}')
      appStorage.setItem('dizey.lessons', '[]')
      appStorage.setItem('dizey.onboarding', '1')
      resetProgress()
      expect(appStorage.getItem('dizey.settings')).toBe('{"sound":false}')
      expect(appStorage.getItem('dizey.lessons')).toBeNull()
      expect(appStorage.getItem('dizey.onboarding')).toBeNull()
      expect(assign).toHaveBeenCalledWith(import.meta.env.BASE_URL)
    })
  })
})
