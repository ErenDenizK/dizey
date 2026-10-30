import { describe, expect, it } from 'vitest'
import { parseSettings } from './settings'

describe('parseSettings', () => {
  it('keeps sound on unless it was turned off', () => {
    expect(parseSettings(null).sound).toBeUndefined()
    expect(parseSettings('{"sound":false}').sound).toBe(false)
    expect(parseSettings('{"sound":true}').sound).toBeUndefined()
    expect(parseSettings('{"sound":"off"}').sound).toBeUndefined()
  })

  it('reads older saves and ignores junk', () => {
    expect(parseSettings('{"theme":"dark","examDate":"2026-11-18"}')).toEqual({
      theme: 'dark',
      examDate: '2026-11-18',
    })
    expect(parseSettings('not json')).toEqual({})
    expect(parseSettings('[1]')).toEqual({})
  })
})
