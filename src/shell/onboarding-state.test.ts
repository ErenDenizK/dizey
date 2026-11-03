import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appStorage } from '../lib/storage/app-storage'
import { markOnboardingDone, ONBOARDING_KEY, onboardingDone, replayOnboarding } from './onboarding-state'

describe('onboarding state', () => {
  const assign = vi.fn()
  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    })
    vi.stubGlobal('window', { location: { assign } })
    assign.mockClear()
  })

  it('is not done until marked, and marking sticks', () => {
    expect(onboardingDone()).toBe(false)
    markOnboardingDone()
    expect(onboardingDone()).toBe(true)
    expect(appStorage.getItem(ONBOARDING_KEY)).toBe('1')
  })

  it('replay clears both keys and navigates to the app root', () => {
    markOnboardingDone()
    appStorage.setItem('dizey.onboarding.safari', '1')
    replayOnboarding()
    expect(onboardingDone()).toBe(false)
    expect(appStorage.getItem('dizey.onboarding.safari')).toBeNull()
    expect(assign).toHaveBeenCalledWith(import.meta.env.BASE_URL)
  })
})
