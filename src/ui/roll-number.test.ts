import { describe, expect, it } from 'vitest'
import { toPlaces } from './RollNumber'

// Stageshow rule "change only what changed": a digit that did not change keeps its place object, so it
// never replays its roll; a changed digit rolls with the one it replaces leaving.
describe('RollNumber places', () => {
  it('starts still', () => {
    expect(toPlaces(7, null, 1)).toEqual([{ place: 0, digit: '7', leaving: null, direction: 1, turn: 0 }])
  })

  it('rolls only the changed place', () => {
    const twelve = toPlaces(12, null, 1)
    const thirteen = toPlaces(13, twelve, 1)
    const tens = thirteen.find((p) => p.place === 1)
    const ones = thirteen.find((p) => p.place === 0)
    expect(tens).toBe(twelve.find((p) => p.place === 1))
    expect(ones).toMatchObject({ digit: '3', leaving: '2', direction: 1, turn: 1 })
  })

  it('adds and removes a place with a roll, in the direction of travel', () => {
    const ten = toPlaces(10, toPlaces(9, null, 1), 1)
    expect(ten.map((p) => [p.place, p.digit, p.leaving])).toEqual([
      [1, '1', null],
      [0, '0', '9'],
    ])
    const back = toPlaces(9, ten, -1)
    expect(back.map((p) => [p.place, p.digit, p.leaving, p.direction])).toEqual([
      [1, '', '1', -1],
      [0, '9', '0', -1],
    ])
  })
})
