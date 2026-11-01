import { describe, expect, it } from 'vitest'
import { advanceMoment, momentState, parseMoments, solvedMoments } from './moments'

describe('moments store', () => {
  it('reads bad data as empty and keeps unknown keys', () => {
    expect(parseMoments(null)).toEqual({})
    expect(parseMoments('nope')).toEqual({})
    expect(parseMoments('[1]')).toEqual({})
    expect(parseMoments('{"a":"solved","b":3,"c":"later-state"}')).toEqual({ a: 'solved', c: 'later-state' })
  })

  it('treats a missing or unknown state as open', () => {
    expect(momentState({}, 'x')).toBe('open')
    expect(momentState({ x: 'later-state' }, 'x')).toBe('open')
  })

  it('only moves forward', () => {
    let moments = advanceMoment({}, 'x', 'skipped')
    expect(moments).toEqual({ x: 'skipped' })
    moments = advanceMoment(moments, 'x', 'open')
    expect(moments).toEqual({ x: 'skipped' })
    moments = advanceMoment(moments, 'x', 'solved')
    expect(moments).toEqual({ x: 'solved' })
    expect(advanceMoment(moments, 'x', 'skipped')).toBe(moments)
    expect(advanceMoment({ y: 'future', x: 'skipped' }, 'x', 'solved')).toEqual({ y: 'future', x: 'solved' })
  })

  it('lists solved lessons', () => {
    expect(solvedMoments({ a: 'solved', b: 'skipped', c: 'solved' })).toEqual(['a', 'c'])
  })
})
