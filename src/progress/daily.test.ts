import { describe, expect, it } from 'vitest'
import { chapters } from '../content/path'
import { questions } from '../content/questions'
import { activityDays, parseActivity, serializeActivity, withDay } from './activity'
import { answeredOn, dayKey, parseDaily, pickDaily, serializeDaily } from './daily'

const firstNodes = new Set<string>(chapters[0]?.lessons.map((lesson) => lesson.node) ?? [])
const monday = new Date(2026, 10, 2, 9)

describe('pickDaily', () => {
  it('is the same all day and changes with the date', () => {
    const a = pickDaily(questions, new Set(), firstNodes, new Date(2026, 10, 2, 0, 5))
    const b = pickDaily(questions, new Set(), firstNodes, new Date(2026, 10, 2, 23, 55))
    expect(a?.id).toBe(b?.id)
    const ids = new Set<string | undefined>()
    for (let day = 1; day <= 20; day += 1)
      ids.add(pickDaily(questions, new Set(), firstNodes, new Date(2026, 10, day))?.id)
    expect(ids.size).toBeGreaterThan(1)
  })
  it('prefers nodes of finished lessons, else chapter 1', () => {
    const node = questions.find((q) => !firstNodes.has(q.node))?.node
    if (!node) throw new Error('bank has only chapter 1')
    for (let day = 1; day <= 15; day += 1) {
      const date = new Date(2026, 10, day)
      expect(pickDaily(questions, new Set([node]), firstNodes, date)?.node).toBe(node)
      const early = pickDaily(questions, new Set(), firstNodes, date)
      expect(firstNodes.has(early?.node ?? '')).toBe(true)
    }
  })
  it('falls back to the whole bank and to null for an empty one', () => {
    expect(pickDaily(questions, new Set(['none']), new Set(['none']), monday)).not.toBeNull()
    expect(pickDaily([], new Set(), firstNodes, monday)).toBeNull()
  })
})

describe('daily answer storage', () => {
  it('round-trips and ignores old, broken or other-day data', () => {
    const answer = { day: dayKey(monday), questionId: 'q', given: 'a', correct: true }
    expect(parseDaily(serializeDaily(answer))).toEqual(answer)
    expect(parseDaily(null)).toBeNull()
    expect(parseDaily('{oops')).toBeNull()
    expect(parseDaily(JSON.stringify({ ...answer, v: 0 }))).toBeNull()
    expect(answeredOn(answer, monday)).toEqual(answer)
    expect(answeredOn(answer, new Date(2026, 10, 3))).toBeNull()
  })
})

describe('activity days', () => {
  it('derives days from existing timestamps and recorded days', () => {
    const at = new Date(2026, 10, 3, 12).getTime()
    const days = activityDays({
      recorded: ['2026-11-01'],
      records: { x: { at: null, doneAt: at, answers: {}, cleared: { s: new Date(2026, 10, 4).getTime() } } },
      history: [{ finishedAt: new Date(2026, 10, 5).getTime() }],
      outcomes: { q: { correct: true, given: 'a', at: new Date(2026, 10, 6).getTime() } },
      chapters: { c: { at: 0 } },
    })
    expect([...days].sort()).toEqual(['2026-11-01', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'])
  })
  it('stores tolerant, versioned data', () => {
    expect(parseActivity(serializeActivity(['2026-11-02']))).toEqual(['2026-11-02'])
    expect(parseActivity('[]')).toEqual([])
    expect(parseActivity('nope')).toEqual([])
    expect(withDay(['2026-11-02'], monday)).toEqual(['2026-11-02'])
  })
})
