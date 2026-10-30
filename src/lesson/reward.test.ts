import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { unitOf } from '../content/units'
import { rewardFor } from './reward'

const unitM = lessons.filter((lesson) => unitOf(lesson)?.prefix === 'M')

describe('rewardFor', () => {
  it('closes a plain lesson with the lesson end', () => {
    expect(rewardFor(unitM[0] as Lesson, [])).toBe('lessonEnd')
  })

  it('celebrates the last lesson of a unit', () => {
    const last = unitM.at(-1) as Lesson
    expect(rewardFor(last, unitM.slice(0, -1))).toBe('milestone')
  })

  it('marks reaching half of all lessons once', () => {
    const half = Math.ceil(lessons.length / 2)
    const others = lessons.filter((lesson) => unitOf(lesson)?.prefix !== 'D')
    const target = lessons.find((lesson) => unitOf(lesson)?.prefix === 'D') as Lesson
    const before = others.slice(0, half - 1)
    expect(rewardFor(target, before)).toBe('halfway')
    expect(rewardFor(target, others.slice(0, half))).toBe('lessonEnd')
  })

  it('gives a repeated lesson only the lesson end', () => {
    const last = unitM.at(-1) as Lesson
    expect(rewardFor(last, unitM)).toBe('lessonEnd')
  })
})
