import { describe, expect, it } from 'vitest'
import { parseSettings } from './settings'

describe('parseSettings', () => {
  it('keeps sound on unless it was turned off', () => {
    expect(parseSettings(null).sound).toBeUndefined()
    expect(parseSettings('{"sound":false}').sound).toBe(false)
    expect(parseSettings('{"sound":true}').sound).toBeUndefined()
    expect(parseSettings('{"sound":"off"}').sound).toBeUndefined()
  })

  it('keeps silent-mode playback and haptics at their defaults unless changed', () => {
    expect(parseSettings(null)).toEqual({})
    expect(parseSettings('{"soundInSilent":true,"haptics":false}')).toEqual({
      soundInSilent: true,
      haptics: false,
    })
    expect(parseSettings('{"soundInSilent":"yes","haptics":true}')).toEqual({})
  })

  it('reads older saves and ignores junk', () => {
    // The theme switch is gone (dark only); an old saved theme is dropped, the rest survives.
    expect(parseSettings('{"theme":"light","examDate":"2026-11-18"}')).toEqual({ examDate: '2026-11-18' })
    expect(parseSettings('not json')).toEqual({})
    expect(parseSettings('[1]')).toEqual({})
  })

  it('keeps a known colour palette and drops unknown ones', () => {
    expect(parseSettings('{"colours":"tahta"}')).toEqual({ colours: 'tahta' })
    expect(parseSettings('{"colours":"patlican","sound":false}')).toEqual({
      colours: 'patlican',
      sound: false,
    })
    expect(parseSettings('{"colours":"neon"}')).toEqual({})
  })

  it('keeps the cell reveal off unless it was turned on, and loads saves without it', () => {
    expect(parseSettings(null).cellReveal).toBeUndefined()
    expect(parseSettings('{"sound":false}')).toEqual({ sound: false })
    expect(parseSettings('{"cellReveal":true}')).toEqual({ cellReveal: true })
    expect(parseSettings('{"cellReveal":"yes"}')).toEqual({})
    expect(parseSettings('{"cellReveal":false}')).toEqual({})
  })
})
