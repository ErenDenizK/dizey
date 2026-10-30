import { matrix } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M11: regular (invertible) and singular matrices, and the equivalent tests that tie the course together. */
export const m11RegularSingular: Lesson = {
  id: 'm11-regular-singular',
  node: 'M11',
  title: 'Regüler ve singüler matrisler',
  matrices: {
    A: m('A =', [
      ['2', '1'],
      ['4', '3'],
    ]),
    B: m('B =', [
      ['1', '3'],
      ['2', '6'],
    ]),
    C: m('C =', [
      ['1', '2', '3'],
      ['0', '1', '4'],
      ['5', '6', '0'],
    ]),
  },
  steps: [
    {
      id: 'definition',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Tersi varsa regüler, yoksa singüler',
      body: 'Kare bir $A$ için $AX = XA = I$ olan bir $X$ varsa $A$ {ok}regüler{/ok} (tersinir) matristir ve $X = A^{-1}$. Yoksa singülerdir. $A$’nın tersi var; $B$’nin 2. sütunu 1. sütunun $3$ katı, tersi yok.',
      scene: { items: ['A', 'B'] },
      claims: [
        {
          kind: 'derived',
          of: 'inverse',
          matrix: 'A',
          equals: [
            ['3/2', '-1/2'],
            ['-2', '1'],
          ],
        },
        { kind: 'det', matrix: 'B', equals: '0' },
      ],
    },
    {
      id: 'equivalent-tests',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Aynı sorunun dört cevabı',
      body: 'n×n bir $A$ için şunlar ya hep birlikte doğru ya hep birlikte yanlıştır: $A$ regüler; $|A| \\neq 0$; $\\text{rank}(A) = n$; $Ax = b$’nin her $b$ için tek çözümü var (özellikle $Ax = 0$’ın yalnız aşikâr çözümü). {ok}Hangisi kolaysa onu kontrol et{/ok}.',
      scene: { items: ['C'] },
      claims: [
        { kind: 'det', matrix: 'C', equals: '1' },
        { kind: 'rank', matrix: 'C', equals: '3' },
      ],
    },
    {
      id: 'try-singular',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi singülerdir?',
      skill: 'recognize-singular',
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['1', '2'],
              ['3', '4'],
            ]),
          ],
          errorType: 'det-slip',
          feedback: '$|A| = 4 - 6 = -2 \\neq 0$: regüler.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['2', '-4'],
              ['-1', '2'],
            ]),
          ],
        },
        {
          key: 'c',
          content: [
            matrix([
              ['0', '1'],
              ['1', '0'],
            ]),
          ],
          errorType: 'zero-diagonal',
          feedback: 'Köşegende $0$ olması tersi engellemez: $|A| = -1$, üstelik $A^{-1} = A$.',
        },
        {
          key: 'd',
          content: [
            matrix([
              ['3', '0'],
              ['0', '5'],
            ]),
          ],
          errorType: 'det-slip',
          feedback: 'Köşegen matris, köşegende $0$ yok: $|A| = 15$, regüler.',
        },
      ],
      answer: 'b',
      solution: '2. satır 1. satırın $-\\frac{1}{2}$ katı: $|A| = 4 - 4 = 0$.',
      claims: [{ kind: 'optionProperty', is: 'singular' }],
    },
    {
      id: 'product-rule',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Çarpım regülerdir ⇔ her çarpan regülerdir',
      body: '$|AB| = |A||B|$ olduğundan $AB$ regüler ancak $A$ ve $B$ ikisi de regülerse olur. Tek bir singüler çarpan bütün çarpımı singüler yapar. Toplam için böyle bir kural yok: $I + (-I) = 0$.',
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Regüler ve singüler',
      points: [
        'Regüler: tersi var. Singüler: tersi yok.',
        'Regüler ⇔ $|A| \\neq 0$ ⇔ rank $n$ ⇔ $Ax = 0$’ın yalnız aşikâr çözümü var.',
        '$AB$ regüler ⇔ $A$ ve $B$ regüler.',
      ],
    },
  ],
}
