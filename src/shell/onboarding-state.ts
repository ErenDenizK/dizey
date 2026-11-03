import { appStorage } from '../lib/storage/app-storage'

export const ONBOARDING_KEY = 'dizey.onboarding'

/** The key an earlier build used for the Safari install note; replaying clears it too. */
const LEGACY_SAFARI_KEY = 'dizey.onboarding.safari'

export function onboardingDone(): boolean {
  return appStorage.getItem(ONBOARDING_KEY) === '1'
}

export function markOnboardingDone(): void {
  appStorage.setItem(ONBOARDING_KEY, '1')
}

/** Forgets that the intro was seen and reloads the app root, so the shell remounts and shows it again. */
export function replayOnboarding(): void {
  appStorage.removeItem(ONBOARDING_KEY)
  appStorage.removeItem(LEGACY_SAFARI_KEY)
  window.location.assign(import.meta.env.BASE_URL)
}
