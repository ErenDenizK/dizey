import { matrix } from '../questions/blocks'
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
      id: 'shapes',
      kind: 'explain',
      eyebrow: 'Türler',
      title: 'Şekle göre: satır, sütun, kare',
      body: 'Tek satırlı matris {row}satır matrisi{/row} (1×n), tek sütunlu matris {col}sütun matrisi{/col} (m×1). Satır ve sütun sayısı eşitse kare matris (n×n). Bütün elemanları $0$ olan matris sıfır matris, $0$ ile gösterilir.',
      scene: { items: ['R', 'C'] },
    },
    {
      id: 'diagonal',
      kind: 'explain',
      eyebrow: 'Türler',
      title: 'Kare matriste: köşegen, skaler, birim',
      body: 'Köşegen dışı bütün elemanlar $0$ ise köşegen matris ($D$). Köşegen elemanları da birbirine eşitse skaler matris ($S = 3I$). Köşegeni $1$ olan skaler matris birim matris $I$. Yani {ok}birim ⊂ skaler ⊂ köşegen ⊂ kare{/ok}.',
      scene: { items: ['D', 'S'] },
      claims: [
        { kind: 'property', expr: 'D', is: 'diagonal' },
        { kind: 'property', expr: 'D', is: 'scalar', holds: false },
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
      id: 'triangular',
      kind: 'explain',
      eyebrow: 'Türler',
      title: 'Üst üçgen ve alt üçgen',
      body: 'Köşegenin altı tamamen $0$ ise üst üçgen ($U$), üstü tamamen $0$ ise alt üçgen ($L$). Köşegenin kendisi serbest; sıfır da olabilir.',
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
      id: 'try-both',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi hem üst üçgen hem alt üçgendir?',
      body: 'Bir matris birden çok sınıfa ait olabilir.',
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
          feedback: 'Altı $0$, bu üst üçgen. Ama üstünde $2$ var: alt üçgen değil.',
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
              ['0', '1'],
              ['1', '0'],
            ]),
          ],
          errorType: 'zero-diagonal',
          feedback: 'Köşegen sıfır ama köşegen dışı elemanlar sıfır değil: ne üst ne alt üçgen.',
        },
        {
          key: 'd',
          content: [
            matrix([
              ['1', '0'],
              ['4', '1'],
            ]),
          ],
          errorType: 'one-condition',
          feedback: 'Üstü $0$, bu alt üçgen. Altında $4$ var: üst üçgen değil.',
        },
      ],
      answer: 'b',
      solution: 'Hem altı hem üstü $0$ olan matris köşegen matristir: (b).',
      claims: [{ kind: 'optionProperty', is: 'diagonal' }],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Matris türleri',
      points: [
        'Satır (1×n), sütun (m×1), kare (n×n), sıfır matris.',
        'Birim ⊂ skaler ⊂ köşegen ⊂ kare.',
        'Üst üçgen: köşegenin altı $0$. Alt üçgen: üstü $0$. İkisi birden: köşegen.',
        'Sınıflar ayrık değildir: $I$ aynı anda birim, skaler, köşegen, üst ve alt üçgendir.',
      ],
    },
  ],
}
