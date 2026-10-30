import { describe, expect, it } from 'vitest'
import * as M from '../../lib/math/matrix'
import * as Q from '../../lib/math/rational'
import { evaluate, evaluateMatrix } from './expression'

const A = M.fromNumbers([
  [1, 2],
  [3, 4],
])
const B = M.fromNumbers([
  [0, 1],
  [1, 0],
])
const scope = { A, B, xA: B }
const show = (source: string) => evaluateMatrix(source, scope, 2).map((row) => row.map(Q.format))

describe('evaluate', () => {
  it('multiplies by juxtaposition and keeps the order', () => {
    expect(show('AB')).toEqual([
      ['2', '1'],
      ['4', '3'],
    ])
    expect(show('BA')).toEqual([
      ['3', '4'],
      ['1', '2'],
    ])
  })

  it('handles transpose, scalars, identity and precedence', () => {
    expect(show('A^T')).toEqual([
      ['1', '3'],
      ['2', '4'],
    ])
    expect(show('1/2(A + A^T)')).toEqual([
      ['1', '5/2'],
      ['5/2', '4'],
    ])
    expect(show('A^2 - 5A - 2I')).toEqual([
      ['0', '0'],
      ['0', '0'],
    ])
    expect(show('-A + A')).toEqual([
      ['0', '0'],
      ['0', '0'],
    ])
    expect(show('\\frac{1}{2}xA')).toEqual([
      ['0', '1/2'],
      ['1/2', '0'],
    ])
  })

  it('inverts with negative powers', () => {
    expect(show('A^{-1}A')).toEqual([
      ['1', '0'],
      ['0', '1'],
    ])
    expect(show('(AB)^{-1} - B^{-1}A^{-1}')).toEqual([
      ['0', '0'],
      ['0', '0'],
    ])
  })

  it('keeps a bare scalar as a scalar and rejects unknown names', () => {
    expect('scalar' in evaluate('3I', scope)).toBe(true)
    expect(() => evaluate('C', scope)).toThrow()
    expect(() => evaluate('(A', scope)).toThrow()
    expect(() => evaluate('A^10', scope)).toThrow()
  })
})
