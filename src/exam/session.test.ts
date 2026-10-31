import { describe, expect, it } from 'vitest'
import { questions } from '../content/questions'
import {
  bestBySet,
  choose,
  createSession,
  durationFor,
  examSets,
  finish,
  parseSession,
  remainingMs,
  score,
  sealColumnsFor,
  shuffled,
  statusOf,
  tally,
  toggleFlag,
  topicsToReview,
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

describe('exam review helpers', () => {
  const paper = createSession(questions, 'summer-2024', now, 1)
  const bank = questions.filter((q) => paper.questionIds.includes(q.id))
  const [first, second, third] = bank as [(typeof bank)[0], (typeof bank)[0], (typeof bank)[0]]
  const wrongKey = (['a', 'b', 'c', 'd', 'e'] as const).find((key) => key !== second.answer) ?? 'a'
  let session = choose(paper, first.id, first.answer)
  session = choose(session, second.id, wrongKey)
  session = toggleFlag(session, third.id)

  it('tells correct, wrong and blank apart', () => {
    expect(statusOf(session, first)).toBe('correct')
    expect(statusOf(session, second)).toBe('wrong')
    expect(statusOf(session, third)).toBe('blank')
  })

  it('tallies answered, blank and flagged items', () => {
    expect(tally(session)).toEqual({ answered: 2, blank: paper.questionIds.length - 2, flagged: 1 })
  })

  it('lists only topics with misses, most missed first', () => {
    const topics = topicsToReview(session, questions)
    expect(topics.every((topic) => topic.missed > 0 && topic.missed <= topic.total)).toBe(true)
    expect(topics.reduce((sum, topic) => sum + topic.missed, 0)).toBe(paper.questionIds.length - 1)
    for (let i = 1; i < topics.length; i++)
      expect((topics[i - 1] as { missed: number }).missed).toBeGreaterThanOrEqual(
        (topics[i] as { missed: number }).missed,
      )
  })

  it('lays the seal out in whole rows of at most six', () => {
    expect(sealColumnsFor(15)).toBe(5)
    expect(sealColumnsFor(18)).toBe(6)
    expect(sealColumnsFor(4)).toBe(4)
    expect(sealColumnsFor(16)).toBe(4)
  })

  it('keeps the best score per set', () => {
    expect(
      bestBySet([
        { set: 'mixed', percent: 40 },
        { set: 'mixed', percent: 70 },
        { set: 'summer-2024', percent: 20 },
      ]),
    ).toEqual({ mixed: 70, 'summer-2024': 20 })
  })
})
