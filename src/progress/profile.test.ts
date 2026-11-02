import { describe, expect, it } from 'vitest'
import { cleanName, NAME_MAX, parseProfile, serializeProfile } from './profile'

describe('profile storage', () => {
  it('round-trips a name', () => {
    expect(parseProfile(serializeProfile({ name: 'Eren' }))).toEqual({ name: 'Eren' })
  })
  it('reads anything unreadable as unset', () => {
    for (const raw of [null, '', 'nope', '[]', '42', '{"v":1}', '{"v":1,"name":5}', '{"v":2,"name":"Eren"}'])
      expect(parseProfile(raw)).toEqual({ name: '' })
  })
  it('trims and cuts a long name to 24 characters', () => {
    expect(cleanName('  Eren  ')).toBe('Eren')
    const long = 'a'.repeat(40)
    expect(cleanName(long)).toHaveLength(NAME_MAX)
    expect(parseProfile(JSON.stringify({ v: 1, name: long })).name).toHaveLength(NAME_MAX)
    expect(JSON.parse(serializeProfile({ name: long })).name).toHaveLength(NAME_MAX)
  })
  it('keeps whole characters when cutting', () => {
    expect(Array.from(cleanName('😀'.repeat(30)))).toHaveLength(NAME_MAX)
  })
  it('treats a blank name as unset', () => {
    expect(cleanName('   ')).toBe('')
  })
})
