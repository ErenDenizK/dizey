import { describe, expect, it } from 'vitest'
import { determinantFamilies, determinantQuestions } from '../generated/determinant'
import type { Question } from '../types'
import { optionKeys } from '../types'
import { buildQuestion } from './assemble'
import { genericFit } from './phone-fit'
import { familyOf, phoneFitProblems, verifyQuestion } from './verify'

const FUZZ_SEEDS = 150

const fuzz = new Map(
  determinantFamilies.map((family) => [
    family.id,
    Array.from({ length: FUZZ_SEEDS }, (_, i) =>
      buildQuestion(family, 1000 + i, { id: `v1-gen-${family.id}-s${1000 + i}`, item: 1 }),
    ),
  ]),
)

const dollars = (q: Question) => [
  ...q.stem.flatMap((b) => (b.kind === 'text' ? [b.text] : [])),
  ...q.options.flatMap((o) => [
    ...o.content.flatMap((b) => (b.kind === 'text' ? [b.text] : [])),
    o.feedback ?? '',
  ]),
  q.explanation,
]

describe('committed generated items', () => {
  it('has about four items per family', () => {
    for (const family of determinantFamilies) {
      const own = determinantQuestions.filter((q) => familyOf(q.id) === family.id)
      expect(own.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('has ids and sources in the generated shape', () => {
    for (const q of determinantQuestions) {
      expect(q.id).toMatch(/^v1-gen-[a-z0-9-]+-\d{2}$/)
      expect(q.source.exam).toBe('dizey-generated')
    }
  })

  it('uses every answer letter somewhere', () => {
    expect(new Set(determinantQuestions.map((q) => q.answer)).size).toBe(5)
  })

  for (const q of determinantQuestions) {
    it(`${q.id} verifies independently and fits a phone`, () => {
      expect(verifyQuestion(q)).toEqual([])
      expect(phoneFitProblems(q)).toEqual([])
    })
  }
})

describe('fuzz: every output verifies', () => {
  for (const family of determinantFamilies) {
    describe(family.id, () => {
      const items = fuzz.get(family.id) ?? []

      it('is verified by the independent verifier', () => {
        for (const q of items) expect(verifyQuestion(q), q.id).toEqual([])
      })

      it('fits a phone (generic and family limits)', () => {
        for (const q of items) expect(phoneFitProblems(q), q.id).toEqual([])
      })

      it('has balanced dollars and no empty feedback', () => {
        for (const q of items) {
          for (const t of dollars(q)) expect((t.match(/\$/g) ?? []).length % 2, `${q.id}: ${t}`).toBe(0)
          for (const o of q.options)
            if (o.key !== q.answer) expect(o.feedback?.length ?? 0).toBeGreaterThan(0)
        }
      })

      it('spreads the answer over a to e', () => {
        const count = Object.fromEntries(
          optionKeys.map((k) => [k, items.filter((q) => q.answer === k).length]),
        )
        for (const k of optionKeys) {
          expect(count[k], `${family.id} ${JSON.stringify(count)}`).toBeGreaterThan(FUZZ_SEEDS * 0.08)
          expect(count[k]).toBeLessThan(FUZZ_SEEDS * 0.35)
        }
      })

      it('varies: many different stems', () => {
        expect(new Set(items.map((q) => JSON.stringify(q.stem))).size).toBeGreaterThan(FUZZ_SEEDS * 0.5)
      })
    })
  }
})

describe('the verifier catches wrong items', () => {
  const sample = determinantQuestions.filter((q) => familyOf(q.id) !== null)
  const swapAnswer = (q: Question): Question => ({
    ...q,
    answer: optionKeys[(optionKeys.indexOf(q.answer) + 1) % 5] as Question['answer'],
  })

  it('rejects a wrong answer letter', () => {
    for (const q of sample) expect(verifyQuestion(swapAnswer(q)).length, q.id).toBeGreaterThan(0)
  })

  it('rejects a distractor that its named mistake does not produce', () => {
    for (const q of sample) {
      const victim = q.options.find((o) => o.key !== q.answer)
      const other = q.options.find((o) => o.key !== q.answer && o !== victim)
      if (!victim || !other) continue
      const options = q.options.map((o) => (o === victim ? { ...o, errorType: other.errorType } : o))
      expect(
        verifyQuestion({ ...q, options: options as unknown as Question['options'] }).length,
        q.id,
      ).toBeGreaterThan(0)
    }
  })

  it('rejects a changed number in the displayed data', () => {
    for (const q of determinantQuestions.filter((x) => familyOf(x.id) === 'd2-numeric')) {
      const block = q.stem[0]
      if (block?.kind !== 'matrix') continue
      const size = block.rows.length
      const failures = Array.from({ length: size * size }, (_, at) => {
        const rows = block.rows.map((r, i) =>
          r.map((e, j) => (i * size + j === at ? String(Number(e) + 1) : e)),
        )
        return verifyQuestion({ ...q, stem: [{ ...block, rows }, ...q.stem.slice(1)] }).length
      }).filter((count) => count > 0)
      expect(failures.length, q.id).toBeGreaterThan(size)
    }
  })
})

describe('phone-fit rules', () => {
  const base = determinantQuestions[0] as Question
  const withStem = (rows: string[][]): Question => ({
    ...base,
    stem: [{ kind: 'matrix', delimiter: 'bars', rows }],
  })
  const ok = (rows: string[][]) => genericFit(withStem(rows)).filter((p) => /matrix|entry|digit/.test(p))

  it('allows 3x3, sparse 4x4 and triangular 4x4', () => {
    expect(
      ok([
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
      ]),
    ).toEqual([])
    expect(
      ok([
        ['1', '0', '0', '0'],
        ['2', '3', '4', '5'],
        ['1', '1', '1', '1'],
        ['2', '2', '2', '2'],
      ]),
    ).toEqual([])
    expect(
      ok([
        ['1', '2', '3', '4'],
        ['0', '5', '6', '7'],
        ['0', '0', '8', '9'],
        ['0', '0', '0', '1'],
      ]),
    ).toEqual([])
  })

  it('rejects dense 4x4, 5x5, long entries and two-digit entries', () => {
    expect(
      ok([
        ['1', '2', '3', '4'],
        ['1', '2', '3', '4'],
        ['1', '2', '3', '4'],
        ['1', '2', '3', '4'],
      ]),
    ).not.toEqual([])
    // Two nonzero entries in its sparsest line: two 3x3 minors, too much scratch work for a phone.
    expect(
      ok([
        ['1', '0', '0', '2'],
        ['2', '3', '4', '5'],
        ['1', '1', '1', '1'],
        ['2', '2', '2', '3'],
      ]),
    ).not.toEqual([])
    expect(ok(Array.from({ length: 5 }, () => ['1', '1', '1', '1', '1']))).not.toEqual([])
    expect(
      ok([
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '2a+3bc+d'],
      ]),
    ).not.toEqual([])
    expect(
      ok([
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '12'],
      ]),
    ).not.toEqual([])
  })

  it('rejects a long stem and a matrix in an option', () => {
    expect(genericFit({ ...base, stem: [{ kind: 'text', text: 'x'.repeat(230) }] }).length).toBeGreaterThan(0)
    const options = base.options.map((o, i) =>
      i === 0
        ? { ...o, content: [{ kind: 'matrix' as const, delimiter: 'brackets' as const, rows: [['1']] }] }
        : o,
    )
    expect(
      genericFit({ ...base, options: options as unknown as Question['options'] }).length,
    ).toBeGreaterThan(0)
  })
})
