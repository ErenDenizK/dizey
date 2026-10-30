import { describe, expect, it } from 'vitest'
import { questions } from '../content/questions'
import {
  choose,
  createSession,
  durationFor,
  examSets,
  finish,
  parseSession,
  remainingMs,
  score,
  shuffled,
  toggleFlag,
} from './session'

const now = Date.UTC(2026, 9, 30, 17)

describe('exam session', () => {
  it('builds the 2024 paper in printed order', () => {
    const session = createSession(questions, 'summer-2024', now, 1)
    const printed = questions.filter((q) => q.source.exam === '2024-summer-midterm').map((q) => q.id)
    expect(session.questionIds).toEqual(printed)
    expect(session.durationMs).toBe(durationFor(printed.length))
  })

  it('draws a mixed paper of 18 distinct questions, reproducible by seed', () => {
    const a = createSession(questions, 'mixed', now, 7)
    const b = createSession(questions, 'mixed', now, 7)
    expect(a.questionIds).toHaveLength(18)
    expect(new Set(a.questionIds).size).toBe(18)
    expect(a.questionIds).toEqual(b.questionIds)
    expect(durationFor(18)).toBe(80 * 60_000)
  })

  it('lists both sets with their sizes', () => {
    expect(examSets(questions).map((set) => set.id)).toEqual(['summer-2024', 'mixed'])
  })

  it('choosing the same option again leaves the item blank', () => {
    const session = createSession(questions, 'mixed', now, 3)
    const id = session.questionIds[0] as string
    const once = choose(session, id, 'b')
    expect(once.answers[id]).toBe('b')
    expect(choose(once, id, 'b').answers[id]).toBeNull()
    expect(choose(once, id, 'c').answers[id]).toBe('c')
  })

  it('flags toggle', () => {
    const session = createSession(questions, 'mixed', now, 3)
    const id = session.questionIds[2] as string
    expect(toggleFlag(session, id).flagged).toEqual([id])
    expect(toggleFlag(toggleFlag(session, id), id).flagged).toEqual([])
  })

  it('scores correct, wrong and blank against the key', () => {
    let session = createSession(questions, 'summer-2024', now, 1)
    const [first, second] = session.questionIds.map((id) => questions.find((q) => q.id === id))
    if (!first || !second) throw new Error('bank too small')
    session = choose(session, first.id, first.answer)
    session = choose(session, second.id, second.answer === 'a' ? 'b' : 'a')
    expect(score(session, questions)).toMatchObject({
      correct: 1,
      wrong: 1,
      blank: session.questionIds.length - 2,
    })
  })

  it('the clock stops at the end and at time-out', () => {
    const session = createSession(questions, 'mixed', now, 3)
    expect(remainingMs(session, now + 60_000)).toBe(session.durationMs - 60_000)
    const late = finish(session, now + session.durationMs + 5000)
    expect(late.finishedAt).toBe(now + session.durationMs)
    expect(remainingMs(late, now + 10 * session.durationMs)).toBe(0)
  })

  it('stored sessions survive a round trip and stale ones are dropped', () => {
    const session = createSession(questions, 'mixed', now, 3)
    expect(parseSession(JSON.stringify(session), questions)).toEqual(session)
    expect(parseSession(JSON.stringify({ ...session, questionIds: ['gone'] }), questions)).toBeNull()
    expect(parseSession('{', questions)).toBeNull()
  })

  it('shuffle keeps every item', () => {
    expect([...shuffled([1, 2, 3, 4, 5], 9)].sort()).toEqual([1, 2, 3, 4, 5])
  })
})
