import { describe, expect, it } from 'vitest'
import { questions } from './index'
import { optionKeys } from './types'

const texts = (blocks: readonly { kind: string; text?: string; equations?: readonly string[] }[]) =>
  blocks.flatMap((b) =>
    b.kind === 'text' ? [b.text ?? ''] : b.kind === 'system' ? [...(b.equations ?? [])] : [],
  )

describe('question bank structure', () => {
  it('has unique, well-formed ids', () => {
    const ids = questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)+$/)
  })

  for (const q of questions) {
    describe(q.id, () => {
      it('has options a to e in order and an answer among them', () => {
        expect(q.options.map((o) => o.key)).toEqual(optionKeys)
        expect(optionKeys).toContain(q.answer)
      })

      it('gives feedback on every distractor and none on the answer', () => {
        for (const o of q.options) {
          if (o.key === q.answer) {
            expect(o.feedback).toBeUndefined()
            expect(o.errorType).toBeUndefined()
          } else {
            expect(o.feedback?.length ?? 0).toBeGreaterThan(0)
          }
        }
      })

      it('has five distinct options', () => {
        const shown = q.options.map((o) => JSON.stringify(o.content))
        expect(new Set(shown).size).toBe(5)
      })

      it('has rectangular matrices and balanced inline math', () => {
        const blocks = [...q.stem, ...q.options.flatMap((o) => o.content)]
        for (const b of blocks) {
          if (b.kind === 'matrix') {
            const width = b.rows[0]?.length ?? 0
            expect(width).toBeGreaterThan(0)
            for (const row of b.rows) expect(row.length).toBe(width)
          }
        }
        const all = [...texts(blocks), q.explanation, ...q.options.map((o) => o.feedback ?? '')]
        for (const t of all) expect((t.match(/\$/g) ?? []).length % 2).toBe(0)
      })
    })
  }
})
