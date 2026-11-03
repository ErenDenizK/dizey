import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appStorage } from '../../lib/storage/app-storage'
import { onboardingDone } from '../onboarding-state'
import { hasProgress, shouldShowOnboarding } from './gate'

describe('onboarding gate', () => {
  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
      key: (i: number) => [...data.keys()][i] ?? null,
      get length() {
        return data.size
      },
    })
  })

  it('shows for a fresh install', () => {
    expect(hasProgress()).toBe(false)
    expect(shouldShowOnboarding()).toBe(true)
    expect(onboardingDone()).toBe(false)
  })

  it('does not show once done', () => {
    appStorage.setItem('dizey.onboarding', '1')
    expect(shouldShowOnboarding()).toBe(false)
  })

  it.each([
    ['lesson progress', 'dizey.lessons', '{"m1-reading-a-matrix":{"at":null,"doneAt":1,"answers":{}}}'],
    ['a profile name', 'dizey.profile', '{"v":1,"name":"Eren"}'],
    ['exam outcomes', 'dizey.exam.outcomes', '{"q":{"correct":true}}'],
    ['the legacy Safari skip', 'dizey.onboarding.safari', '1'],
  ])('treats %s as an existing learner and marks them done', (_what, key, value) => {
    appStorage.setItem(key, value)
    expect(shouldShowOnboarding()).toBe(false)
    expect(onboardingDone()).toBe(true)
  })

  it('ignores empty stored records', () => {
    appStorage.setItem('dizey.lessons', '{}')
    appStorage.setItem('dizey.profile', '{"v":1,"name":""}')
    appStorage.setItem('dizey.exam.outcomes', '{}')
    expect(shouldShowOnboarding()).toBe(true)
  })
})
