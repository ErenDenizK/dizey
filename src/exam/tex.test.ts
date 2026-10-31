import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
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
  it('every inline formula and equation renders without an unknown command', () => {
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
    const broken = texts.filter((tex) => texToHtml(tex).includes('dz-m-error'))
    expect(broken).toEqual([])
  })
})

describe('splitTones', () => {
  it('reads highlight markup around text and TeX', async () => {
    const { splitTones } = await import('./tex')
    expect(splitTones('{row}Ana köşegen{/row} $ad$, {ok}tekil{/ok}dir')).toEqual([
      { tone: 'row', value: 'Ana köşegen' },
      { tone: null, value: ' $ad$, ' },
      { tone: 'ok', value: 'tekil' },
      { tone: null, value: 'dir' },
    ])
  })
})

describe('texToHtml', () => {
  it('sets ≠ as one glyph, never as the \\not slash over "="', () => {
    for (const tex of ['AB \\neq BA', 'A \\ne 0']) {
      const html = texToHtml(tex)
      expect(html).toContain('≠')
      expect(html).not.toContain('')
    }
  })
})

describe('lesson TeX', () => {
  it('every formula in every lesson renders without an unknown command', () => {
    const texts: string[] = []
    const walk = (value: unknown, key = ''): void => {
      if (typeof value === 'string') {
        if (key === 'lines') texts.push(value)
        else
          texts.push(
            ...splitTex(value)
              .filter((p) => p.tex)
              .map((p) => p.value),
          )
      } else if (Array.isArray(value)) {
        for (const item of value) walk(item, key)
      } else if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) walk(v, k)
      }
    }
    walk(lessons)
    expect(texts.length).toBeGreaterThan(500)
    const broken = texts.filter((tex) => texToHtml(tex).includes('dz-m-error'))
    expect(broken).toEqual([])
  })
})

describe('mathToHtml', () => {
  it('stacks fractions, raises exponents and spaces binary operators only', () => {
    expect(texToHtml('\\frac{1}{2}')).toContain('dz-m-frac')
    expect(texToHtml('A^T')).toContain('<sup class="dz-m-sup">T</sup>')
    expect(texToHtml('a - b')).toContain('dz-m-bin')
    expect(texToHtml('-1')).toContain('dz-m-sign')
    expect(texToHtml('(-1)')).toContain('dz-m-sign')
  })
  it('draws bmatrix with the stage matrix grid', () => {
    const html = texToHtml('\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}')
    expect(html).toContain('ex-mat')
    expect(html.match(/ex-cell/g)?.length).toBe(4)
  })
  it('draws vmatrix with bars', () => {
    expect(texToHtml('\\begin{vmatrix} 1 & 2 \\\\ 3 & 4 \\end{vmatrix}')).toContain('data-delimiter="bars"')
  })
  it('marks unknown commands', () => {
    expect(texToHtml('\\foo')).toContain('dz-m-error')
  })
})
