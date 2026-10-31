import { matrix, text } from '../questions/blocks'
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
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Her kare matrisin tersi var mı?',
      body: 'İki matrise bak. Birinin tersi yok; hangisi?',
      scene: { items: ['A', 'B'] },
    },
    {
      id: 'definition',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Tersi varsa regüler, yoksa singüler',
      body: '$B$’nin 2. sütunu 1. sütunun 3 katı: $|B| = 0$, {ok}tersi yok{/ok}. $B$ singüler.',
      scene: { items: ['B'] },
      beat: { kind: 'det2', matrix: 'B' },
      claims: [{ kind: 'det', matrix: 'B', equals: '0' }],
    },
    {
      id: 'try-det',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$|A|$ kaç?',
      body: 'Sıfır değilse $A$ regüler.',
      skill: 'det-2x2',
      scene: { items: ['A'] },
      answer: '2',
      feedbackWrong: '$2 \\cdot 3 - 1 \\cdot 4$.',
      reveal: { kind: 'det2', matrix: 'A' },
      solution: '$6 - 4 = 2 \\neq 0$: $A$ regüler.',
      claims: [
        { kind: 'det', matrix: 'A', equals: '2', answer: true },
        {
          kind: 'derived',
          of: 'inverse',
          matrix: 'A',
          equals: [
            ['3/2', '-1/2'],
            ['-2', '1'],
          ],
        },
      ],
    },
    {
      id: 'equivalent-tests',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Aynı sorunun dört cevabı',
      body: 'Ya hepsi doğru ya hepsi yanlış. {ok}Hangisi kolaysa onu kontrol et{/ok}.',
      scene: { items: ['C'] },
      beat: {
        kind: 'equation',
        lines: [
          'A \\text{ regüler}',
          '\\iff |A| \\neq 0',
          '\\iff \\text{rank}(A) = n',
          '\\iff Ax = 0 \\text{ yalnız } x = 0',
        ],
      },
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
          feedback: 'Köşegende $0$ olması tersi engellemez: $|A| = -1$.',
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
          feedback: 'Köşegende $0$ yok: $|A| = 15$, regüler.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['2 \\cdot 2 - (-4) \\cdot (-1)', '= 4 - 4 = 0'] },
      solution: '2. satır 1. satırın $-\\frac{1}{2}$ katı: $|A| = 4 - 4 = 0$.',
      claims: [{ kind: 'optionProperty', is: 'singular' }],
    },
    {
      id: 'try-rank',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '3×3 bir matrisin rankı 3. Hangisi kesin doğru?',
      skill: 'recognize-singular',
      options: [
        { key: 'a', content: [text('$|A| \\neq 0$')] },
        {
          key: 'b',
          content: [text('$|A| = 0$')],
          errorType: 'rank-invertible',
          feedback: 'Rank $n$ ise determinant sıfır olamaz.',
        },
        {
          key: 'c',
          content: [text('$Ax = 0$’ın sonsuz çözümü var')],
          errorType: 'rank-invertible',
          feedback: 'Rank $n$: yalnız $x = 0$ çözümü var.',
        },
      ],
      answer: 'a',
      reveal: { kind: 'equation', lines: ['\\text{rank} = 3 = n', '\\iff |A| \\neq 0'] },
      solution: 'Rank $n$ ⇔ $|A| \\neq 0$ ⇔ regüler.',
    },
    {
      id: 'product-rule',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Çarpım regüler ⇔ her çarpan regüler',
      body: 'Tek bir singüler çarpan bütün çarpımı singüler yapar. Toplamda böyle bir kural yok.',
      beat: { kind: 'equation', lines: ['|AB| = |A| \\cdot |B|'] },
    },
    {
      id: 'try-product',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$A$ regüler, $B$ singüler. $AB$ nedir?',
      skill: 'recognize-singular',
      options: [
        {
          key: 'a',
          content: [text('Regüler')],
          errorType: 'product-rule',
          feedback: '$|B| = 0$ olduğundan $|AB| = 0$.',
        },
        { key: 'b', content: [text('Singüler')] },
        {
          key: 'c',
          content: [text('Belirlenemez')],
          errorType: 'product-rule',
          feedback: '$|AB| = |A| \\cdot 0 = 0$ her zaman.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['|AB| = |A| \\cdot 0 = 0'] },
      solution: '$|AB| = |A||B| = 0$: singüler.',
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
