import { buildInfo } from '../../lib/build-info'
import { appStorage } from '../../lib/storage/app-storage'
import { parseProfile } from '../../progress/profile'
import { markOnboardingDone, onboardingDone } from '../onboarding-state'

/** The key an earlier build wrote when the learner skipped the Safari install note: that learner is no newcomer. */
const LEGACY_SAFARI_KEY = 'dizey.onboarding.safari'

/** Stored data that only a learner who has already used the app has. */
const PROGRESS_KEYS = [
  'dizey.lessons',
  'dizey.exam.outcomes',
  'dizey.exam.history',
  'dizey.daily',
  'dizey.badges',
] as const

/** True when a stored JSON value holds something: a non-empty object or array, or any other non-null value. */
function hasContent(raw: string | null): boolean {
  if (raw === null || raw === '') return false
  try {
    const value: unknown = JSON.parse(raw)
    if (value === null || value === false || value === '') return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  } catch {
    return true
  }
}

/** Whether this browser already holds a learner's progress or name (an update must never greet them as new). */
export function hasProgress(): boolean {
  if (appStorage.getItem(LEGACY_SAFARI_KEY) === '1') return true
  if (parseProfile(appStorage.getItem('dizey.profile')).name !== '') return true
  return PROGRESS_KEYS.some((key) => hasContent(appStorage.getItem(key)))
}

/**
 * Whether the first-run scene shows. A learner who already has progress is marked done on the spot (the first run of
 * the version that brought onboarding), so only a truly fresh install sees it.
 */
export function shouldShowOnboarding(): boolean {
  if (onboardingDone()) return false
  if (hasProgress()) {
    markOnboardingDone()
    return false
  }
  return true
}

/**
 * First visit in iPhone Safari: install first. iOS keeps Safari's and the Home Screen app's storage apart, so
 * progress made in Safari would not carry over. Production only: previews are for a quick look in the browser.
 */
export function needsInstall(): boolean {
  if (buildInfo.channel !== 'production') return false
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone =
    (navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  return ios && !standalone
}
