import { describe, expect, it } from 'vitest'
import { strings } from '../content/strings'
import { lineOf, type MomentContext, pastHalf, pickMoment } from './moments'

const q = (over: Partial<MomentContext> = {}): MomentContext => ({
  index: 4,
  count: 20,
  kind: 'question',
  run: 1,
  prevMissed: false,
  wrong: 0,
  solved: true,
  revealed: true,
  lastAt: null,
  halfDone: false,
  ...over,
})

describe('pickMoment', () => {
  it('shows nothing for a plain right answer', () => {
    expect(pickMoment(q())).toBeNull()
  })

  it('streaks at 3 first-try answers, then every 3, with the real count', () => {
    for (const run of [3, 6, 9]) {
      const m = pickMoment(q({ run }))
      expect(m).toEqual({ play: 'wow', line: 'streak', n: run })
      expect(m && lineOf(m)).toBe(`${run} üst üste!`)
    }
    for (const run of [1, 2, 4, 5]) expect(pickMoment(q({ run }))).toBeNull()
  })

  it('a streak needs a first-try solve', () => {
    expect(pickMoment(q({ run: 3, wrong: 1 }))?.line).not.toBe('streak')
    expect(pickMoment(q({ run: 3, solved: false }))?.line).not.toBe('streak')
  })

  it('a comeback after a missed question or after a wrong try, proud', () => {
    expect(pickMoment(q({ prevMissed: true }))?.play).toBe('proud')
    expect(pickMoment(q({ wrong: 1, run: 0 }))?.play).toBe('proud')
  })

  it('comeback lines alternate by step index', () => {
    const a = pickMoment(q({ prevMissed: true, index: 4 }))
    const b = pickMoment(q({ prevMissed: true, index: 5 }))
    expect(a && lineOf(a)).toBe('İşte bu!')
    expect(b && lineOf(b)).toBe('Toparladın.')
  })

  it('two wrongs and the answer revealed: think, gently', () => {
    const m = pickMoment(q({ wrong: 2, solved: false, run: 0 }))
    expect(m).toEqual({ play: 'think', line: 'together' })
    expect(m && lineOf(m)).toBe('Birlikte bakalım.')
    expect(pickMoment(q({ wrong: 1, solved: false, run: 0 }))).toBeNull()
  })

  it('halfway: the first verdict at or past 50 %, correct if clean and proud otherwise, once', () => {
    expect(pickMoment(q({ index: 8, count: 20 }))).toBeNull()
    expect(pickMoment(q({ index: 9, count: 20 }))).toEqual({ play: 'correct', line: 'halfway' })
    expect(pickMoment(q({ index: 9, count: 20, solved: false }))).toEqual({ play: 'proud', line: 'halfway' })
    expect(pickMoment(q({ index: 12, count: 20, halfDone: true }))).toBeNull()
    expect(pastHalf(9, 20)).toBe(true)
    expect(pastHalf(8, 20)).toBe(false)
  })

  it('the first explain step wakes her; later explain steps do not', () => {
    expect(pickMoment(q({ kind: 'explain', index: 0, revealed: false, solved: false }))).toEqual({
      play: 'wake',
      line: 'start',
    })
    expect(pickMoment(q({ kind: 'explain', index: 3, revealed: false, solved: false }))).toBeNull()
  })

  it('priority: streak > comeback > two wrongs > halfway', () => {
    const all = q({ index: 10, count: 20, run: 3, prevMissed: true })
    expect(pickMoment(all)?.line).toBe('streak')
    expect(pickMoment({ ...all, run: 0, wrong: 1 })?.play).toBe('proud')
    expect(pickMoment({ ...all, run: 0, wrong: 2, solved: true })?.line).toMatch(/^comeback/)
    expect(pickMoment({ ...all, run: 0, wrong: 2, solved: false })?.line).toBe('together')
    expect(pickMoment({ ...all, run: 0, prevMissed: false })?.line).toBe('halfway')
  })

  it('at most one moment every 3 steps, except a streak', () => {
    const base = q({ prevMissed: true, index: 5 })
    expect(pickMoment({ ...base, lastAt: 3 })).toBeNull()
    expect(pickMoment({ ...base, lastAt: 4 })).toBeNull()
    expect(pickMoment({ ...base, lastAt: 2 })?.play).toBe('proud')
    expect(pickMoment({ ...base, lastAt: 4, run: 3 })?.line).toBe('streak')
  })

  it('never on an unanswered question', () => {
    const open = q({ revealed: false, solved: false, wrong: 0, run: 3, prevMissed: true, index: 10 })
    expect(pickMoment(open)).toBeNull()
    expect(pickMoment({ ...open, wrong: 2 })).toBeNull()
    expect(pickMoment({ ...open, wrong: 1 })).toBeNull()
  })

  it('is deterministic', () => {
    const c = q({ prevMissed: true })
    expect(pickMoment(c)).toEqual(pickMoment({ ...c }))
  })

  it('every line fits a short bubble', () => {
    for (const value of Object.values(strings.mirtis)) {
      const text = typeof value === 'function' ? value(99) : value
      expect(text.length).toBeLessThanOrEqual(28)
    }
  })
})
