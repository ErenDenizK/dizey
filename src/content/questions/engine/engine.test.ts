import { describe, expect, it } from 'vitest'
import * as Q from '../../../lib/math/rational'
import { determinantFamilies } from '../generated/determinant'
import { buildQuestion } from './assemble'
import { fingerprint } from './fingerprint'
import { renderValue, texNumber } from './format'
import { hashSeed, Rng } from './prng'

describe('seeded randomness', () => {
  it('repeats for the same seed and differs for another', () => {
    const run = (seed: number) =>
      Array.from(
        { length: 6 },
        (
          (r) => () =>
            r.int(0, 1000)
        )(new Rng(seed)),
      )
    expect(run(7)).toEqual(run(7))
    expect(run(7)).not.toEqual(run(8))
    expect(hashSeed('a', 1, 2)).toBe(hashSeed('a', 1, 2))
    expect(hashSeed('a', 1, 2)).not.toBe(hashSeed('a', 2, 1))
  })

  it('shuffles without losing items', () => {
    expect(new Rng(3).shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('number rendering', () => {
  it('writes fractions the way the question files do', () => {
    expect(texNumber(Q.rational(-3))).toBe('-3')
    expect(texNumber(Q.rational(1, 9))).toBe('\\frac{1}{9}')
    expect(texNumber(Q.rational(-4, 3))).toBe('-\\frac{4}{3}')
    expect(renderValue({ kind: 'set', roots: [Q.rational(-3), Q.rational(2)] })).toEqual({
      kind: 'text',
      text: '$k = -3$ ya da $k = 2$',
    })
  })
})

describe('assembler', () => {
  for (const family of determinantFamilies) {
    it(`${family.id} is deterministic per seed and has five distinct options`, () => {
      const meta = { id: `v1-gen-${family.id}-01`, item: 1 }
      const first = buildQuestion(family, 11, meta)
      expect(fingerprint(buildQuestion(family, 11, meta))).toBe(fingerprint(first))
      expect(fingerprint(buildQuestion(family, 12, meta))).not.toBe(fingerprint(first))
      expect(new Set(first.options.map((o) => JSON.stringify(o.content))).size).toBe(5)
      expect(first.options.filter((o) => o.errorType === undefined)).toHaveLength(1)
    })
  }
})
