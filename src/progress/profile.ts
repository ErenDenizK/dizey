export const PROFILE_VERSION = 1
export const NAME_MAX = 24

export type Profile = { name: string }

/** A typed name as it is kept: trimmed, at most NAME_MAX characters, empty when unset. */
export function cleanName(raw: string): string {
  return Array.from(raw.trim()).slice(0, NAME_MAX).join('').trim()
}

/** Reads the stored profile; anything unreadable or from another version reads as an empty profile. */
export function parseProfile(raw: string | null): Profile {
  if (!raw) return { name: '' }
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return { name: '' }
    const v = value as Record<string, unknown>
    if (v.v !== PROFILE_VERSION || typeof v.name !== 'string') return { name: '' }
    return { name: cleanName(v.name) }
  } catch {
    return { name: '' }
  }
}

export function serializeProfile(profile: Profile): string {
  return JSON.stringify({ v: PROFILE_VERSION, name: cleanName(profile.name) })
}
