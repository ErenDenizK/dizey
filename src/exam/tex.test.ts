import { describe, expect, it } from 'vitest'
import type { Block } from '../content/questions'
import { questions } from '../content/questions'
import { splitTex, texToHtml } from './tex'

describe('splitTex', () => {
  it('separates inline TeX', () => {
    expect(splitTex('olduğuna göre $A^T$ nedir?')).toEqual([
      { tex: false, value: 'olduğuna göre ' },
      { tex: true, value: 'A^T' },
      { tex: false, value: ' nedir?' },
    ])
    expect(splitTex('fiyat $5')).toEqual([{ tex: false, value: 'fiyat $5' }])
  })
})

describe('question bank TeX', () => {
  it('every inline formula and equation renders without a KaTeX error', () => {
    const texts: string[] = []
    const collect = (blocks: readonly Block[]) => {
      for (const block of blocks) {
        if (block.kind === 'text')
          texts.push(
            ...splitTex(block.text)
              .filter((p) => p.tex)
              .map((p) => p.value),
          )
        if (block.kind === 'system') texts.push(...block.equations)
      }
    }
    const inline = (value: string | undefined) => {
      if (value)
        texts.push(
          ...splitTex(value)
            .filter((p) => p.tex)
            .map((p) => p.value),
        )
    }
    for (const question of questions) {
      collect(question.stem)
      inline(question.explanation)
      for (const option of question.options) {
        collect(option.content)
        inline(option.feedback)
      }
    }
    expect(texts.length).toBeGreaterThan(0)
    const broken = texts.filter((tex) => texToHtml(tex).includes('katex-error'))
    expect(broken).toEqual([])
  })
})
