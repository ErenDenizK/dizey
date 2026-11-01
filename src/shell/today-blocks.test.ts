import { describe, expect, it } from 'vitest'
import { MAX_BLOCKS, todayBlocks } from './today-blocks'

describe('todayBlocks', () => {
  it('always has the lesson card and never an empty block', () => {
    expect(todayBlocks({ review: false, daily: false, exam: false })).toEqual(['lesson'])
    expect(todayBlocks({ review: false, daily: true, exam: false })).toEqual(['lesson', 'daily'])
  })
  it('orders by priority and shows at most four', () => {
    const all = todayBlocks({ review: true, daily: true, exam: true })
    expect(all).toEqual(['lesson', 'review', 'daily', 'exam'])
    expect(all.length).toBeLessThanOrEqual(MAX_BLOCKS)
    expect(all.filter((block) => block === 'lesson')).toHaveLength(1)
  })
})
