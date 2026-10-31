import { matrix, text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M2: row, column, zero, square, diagonal, scalar, identity and triangular matrices, and how the classes nest. */
export const m2MatrixTypes: Lesson = {
  id: 'm2-matrix-types',
  node: 'M2',
  title: 'Matris türleri',
  matrices: {
    R: m('satır =', [['3', '-1', '4']]),
    C: m('sütun =', [['2'], ['0'], ['-5']]),
    D: m('D =', [
      ['4', '0', '0'],
      ['0', '-1', '0'],
      ['0', '0', '2'],
    ]),
    S: m('S =', [
      ['3', '0', '0'],
      ['0', '3', '0'],
      ['0', '0', '3'],
    ]),
    U: m('U =', [
      ['1', '5', '-2'],
      ['0', '3', '7'],
      ['0', '0', '-4'],
    ]),
    L: m('L =', [
      ['2', '0', '0'],
      ['6', '1', '0'],
      ['-3', '4', '5'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Sıfırlar nerede?',
      body: 'Bu iki matriste sıfırlar aynı yerlerde. Birazdan bu düzenin adını koyacağız.',
      scene: { items: ['D', 'S'] },
    },
    {
      id: 'shapes',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Şekle göre: satır, sütun, kare',
      body: 'Tek satır: {row}satır matrisi{/row}. Tek sütun: {col}sütun matrisi{/col}. Satır sayısı sütun sayısına eşitse kare matris.',
      scene: { items: ['R', 'C'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['R', 0, '*'], tone: 'row' }], note: '1×3' },
          { clear: true, marks: [{ cell: ['C', '*', 0], tone: 'col' }], note: '3×1' },
        ],
      },
    },
    {
      id: 'try-shape',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$D$ hangi şekilde?',
      skill: 'matrix-classes',
      scene: { items: ['D'] },
      options: [
        {
          key: 'a',
          content: [text('Satır matrisi')],
          errorType: 'shape-confused',
          feedback: 'Satır matrisinde tek satır olur. $D$’de 3 satır var.',
        },
        { key: 'b', content: [text('Kare matris')] },
        {
          key: 'c',
          content: [text('Sütun matrisi')],
          errorType: 'shape-confused',
          feedback: 'Sütun matrisinde tek sütun olur. $D$’de 3 sütun var.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'frames',
        frames: [
          ...[0, 1, 2].map((r) => ({
            clear: true,
            marks: [{ cell: ['D', r, '*'] as const, tone: 'row' as const }],
            ...(r === 2 ? { note: '3 satır' } : {}),
          })),
          ...[0, 1, 2].map((c) => ({
            clear: true,
            marks: [{ cell: ['D', '*', c] as const, tone: 'col' as const }],
            ...(c === 2 ? { note: '3 sütun: kare' } : {}),
          })),
        ],
      },
      solution: '3 satır, 3 sütun: 3×3 kare matris.',
    },
    {
      id: 'diagonal',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Köşegenin dışı hep 0: köşegen matris',
      body: '{ok}Köşegen{/ok} sol üstten sağ alta iner. Dışındaki her eleman 0 ise köşegen matris.',
      scene: { items: ['D'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [0, 1, 2].map((i) => ({ cell: ['D', i, i] as const, tone: 'ok' as const })),
            note: 'köşegen',
          },
          {
            clear: true,
            marks: [
              [0, 1],
              [0, 2],
              [1, 0],
              [1, 2],
              [2, 0],
              [2, 1],
            ].map(([r, c]) => ({ cell: ['D', r as number, c as number] as const, tone: 'col' as const })),
            note: 'dışı 0',
          },
        ],
      },
      claims: [
        { kind: 'property', expr: 'D', is: 'diagonal' },
        { kind: 'property', expr: 'D', is: 'scalar', holds: false },
      ],
    },
    {
      id: 'scalar',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Köşegen sabitse skaler, 1 ise birim',
      body: '$S$’nin köşegeni hep 3: {ok}S = 3I{/ok}. Köşegeni 1 olan matris birim matris $I$.',
      scene: { items: ['S'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [0, 1, 2].map((i) => ({ cell: ['S', i, i] as const, tone: 'ok' as const })),
            note: '3, 3, 3',
          },
        ],
      },
      claims: [
        { kind: 'property', expr: 'S', is: 'scalar' },
        {
          kind: 'expr',
          expr: 'S - 3I',
          equals: [
            ['0', '0', '0'],
            ['0', '0', '0'],
            ['0', '0', '0'],
          ],
        },
      ],
    },
    {
      id: 'try-scalar',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi skaler matris?',
      skill: 'matrix-classes',
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['2', '0'],
              ['0', '5'],
            ]),
          ],
          errorType: 'diagonal-not-scalar',
          feedback: 'Köşegen matris ama köşegeni sabit değil: 2 ve 5.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['2', '2'],
              ['2', '2'],
            ]),
          ],
          errorType: 'all-equal',
          feedback: 'Sayılar eşit ama köşegenin dışı 0 değil.',
        },
        {
          key: 'c',
          content: [
            matrix([
              ['2', '0'],
              ['0', '2'],
            ]),
          ],
        },
      ],
      answer: 'c',
      reveal: { kind: 'equation', lines: ['\\begin{bmatrix} 2 & 0 \\\\ 0 & 2 \\end{bmatrix} = 2I'] },
      solution: 'Dışı 0, köşegeni sabit 2: $2I$.',
      claims: [{ kind: 'optionProperty', is: 'scalar' }],
    },
    {
      id: 'triangular',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Üst üçgen ve alt üçgen',
      body: 'Köşegenin altı 0: üst üçgen ($U$). Üstü 0: alt üçgen ($L$). Köşegenin kendisi serbest.',
      scene: { items: ['U', 'L'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['U', 1, 0], tone: 'ok' },
              { cell: ['U', 2, 0], tone: 'ok' },
              { cell: ['U', 2, 1], tone: 'ok' },
            ],
            note: 'altı 0',
          },
          {
            clear: true,
            marks: [
              { cell: ['L', 0, 1], tone: 'ok' },
              { cell: ['L', 0, 2], tone: 'ok' },
              { cell: ['L', 1, 2], tone: 'ok' },
            ],
            note: 'üstü 0',
          },
        ],
      },
      claims: [
        { kind: 'property', expr: 'U', is: 'upperTriangular' },
        { kind: 'property', expr: 'L', is: 'lowerTriangular' },
        { kind: 'property', expr: 'U', is: 'lowerTriangular', holds: false },
      ],
    },
    {
      id: 'try-upper',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi üst üçgen?',
      skill: 'matrix-classes',
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['1', '0'],
              ['4', '1'],
            ]),
          ],
          errorType: 'upper-lower-swapped',
          feedback: 'Üstü 0: bu alt üçgen. Üst üçgende köşegenin altı 0 olur.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['1', '2'],
              ['0', '3'],
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
          feedback: 'Köşegen 0 ama altında 1 var: üst üçgen değil.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: ['\\begin{bmatrix} 1 & 2 \\\\ 0 & 3 \\end{bmatrix}', '\\text{altı } 0'],
      },
      solution: 'Köşegenin altındaki tek eleman 0.',
      claims: [{ kind: 'optionProperty', is: 'upperTriangular' }],
    },
    {
      id: 'try-both',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi hem üst hem alt üçgen?',
      skill: 'matrix-classes',
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['1', '2'],
              ['0', '3'],
            ]),
          ],
          errorType: 'one-condition',
          feedback: 'Altı 0, üst üçgen. Ama üstünde 2 var: alt üçgen değil.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['5', '0'],
              ['0', '-2'],
            ]),
          ],
        },
        {
          key: 'c',
          content: [
            matrix([
              ['1', '0'],
              ['4', '1'],
            ]),
          ],
          errorType: 'one-condition',
          feedback: 'Üstü 0, alt üçgen. Altında 4 var: üst üçgen değil.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: ['\\begin{bmatrix} 5 & 0 \\\\ 0 & -2 \\end{bmatrix}', '\\text{altı ve üstü } 0'],
      },
      solution: 'Hem altı hem üstü 0: köşegen matris.',
      claims: [{ kind: 'optionProperty', is: 'diagonal' }],
    },
    {
      id: 'nesting',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Sınıflar iç içe',
      body: '{ok}Birim ⊂ skaler ⊂ köşegen ⊂ kare{/ok}. $I$ aynı anda birim, skaler, köşegen, üst ve alt üçgendir.',
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Sıfırların yeri ad verir',
      points: [
        'Satır (1×n), sütun (m×1), kare (n×n), sıfır matris.',
        'Köşegen: dışı 0. Skaler: köşegeni sabit. Birim: köşegeni 1.',
        'Üst üçgen: altı 0. Alt üçgen: üstü 0. İkisi birden: köşegen.',
      ],
    },
  ],
}
