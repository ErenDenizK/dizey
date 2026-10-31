import { matrix, text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M4: equality, sum, difference and scalar multiples, entry by entry. */
const unknown2 = [
  ['?', '?'],
  ['?', '?'],
] as const

export const m4MatrixArithmetic: Lesson = {
  id: 'm4-matrix-arithmetic',
  node: 'M4',
  title: 'Toplama, çıkarma, skalerle çarpma',
  matrices: {
    L: m('', [
      ['x + 1', '2'],
      ['3', 'y'],
    ]),
    R: m('', [
      ['4', '2'],
      ['3', '-1'],
    ]),
    A: m('A =', [
      ['1', '-2'],
      ['0', '3'],
    ]),
    B: m('B =', [
      ['4', '1'],
      ['-1', '2'],
    ]),
    // A + B = [5 −1; −1 5], 3A = [3 −6; 0 9], 2A − 3B = [−10 −7; 3 0].
    S0: m('A + B =', unknown2),
    S1: m('A + B =', [
      ['5', '-1'],
      ['-1', '?'],
    ]),
    K0: m('3A =', unknown2),
    T0: m('2A − 3B =', unknown2),
    T1: m('2A − 3B =', [
      ['-10', '?'],
      ['?', '?'],
    ]),
    P: m('', [
      ['1', '0', '2'],
      ['3', '1', '0'],
    ]),
    Q: m('', [
      ['1', '2'],
      ['0', '1'],
      ['4', '3'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'İki matris ne zaman eşit?',
      body: 'Soldaki $x$ ve $y$ kaç olmalı ki iki matris aynı olsun?',
      scene: { items: ['L', '=', 'R'] },
    },
    {
      id: 'equality',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Aynı konum, aynı sayı',
      body: 'Her konum ayrı bir denklem: {row}x + 1 = 4{/row}, {col}y = −1{/col}. Boyutlar da aynı olmalı.',
      scene: { items: ['L', '=', 'R'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['L', 0, 0], tone: 'row' },
              { cell: ['R', 0, 0], tone: 'row' },
            ],
            note: 'x + 1 = 4',
          },
          {
            clear: true,
            marks: [
              { cell: ['L', 1, 1], tone: 'col' },
              { cell: ['R', 1, 1], tone: 'col' },
            ],
            note: 'y = −1',
          },
        ],
      },
    },
    {
      id: 'try-equality',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$x$ kaç?',
      skill: 'matrix-equality',
      scene: { items: ['L', '=', 'R'] },
      options: [
        {
          key: 'a',
          content: [text('$4$')],
          errorType: 'forgot-shift',
          feedback: '4’e eşit olan $x + 1$. $x$ bir eksiği.',
        },
        { key: 'b', content: [text('$3$')] },
        {
          key: 'c',
          content: [text('$5$')],
          errorType: 'wrong-sign',
          feedback: '$x + 1 = 4$ ise 1’i çıkar: $x = 4 - 1$.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['L', 0, 0], tone: 'ok' },
              { cell: ['R', 0, 0], tone: 'ok' },
            ],
            note: 'x + 1 = 4 → x = 3',
          },
        ],
      },
      solution: '$x + 1 = 4$, yani $x = 3$.',
    },
    {
      id: 'sum',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Toplama: konum konum',
      body: '$A + B$’nin her kutusu, aynı yerdeki {row}A{/row} ve {col}B{/col} sayılarının toplamı.',
      scene: { items: ['A', '+', 'B', '=', 'S0'], marks: [{ cell: ['S0', 0, 0], tone: 'ok' }] },
      beat: {
        kind: 'combine',
        terms: [{ matrix: 'A' }, { matrix: 'B' }],
        into: 'S0',
        cells: [
          [0, 0],
          [0, 1],
          [1, 0],
        ],
      },
      claims: [
        {
          kind: 'expr',
          expr: 'A + B',
          equals: [
            ['5', '-1'],
            ['-1', '5'],
          ],
        },
      ],
    },
    {
      id: 'try-sum',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: 'Son kutu kaç?',
      skill: 'linear-combination-entry',
      scene: { items: ['A', '+', 'B', '=', 'S1'], marks: [{ cell: ['S1', 1, 1], tone: 'ok' }] },
      answer: '5',
      feedbackWrong: 'Sağ alttaki iki sayıyı topla: $3$ ve $2$.',
      reveal: { kind: 'combine', terms: [{ matrix: 'A' }, { matrix: 'B' }], into: 'S1', cells: [[1, 1]] },
      solution: '$3 + 2 = 5$.',
      claims: [{ kind: 'exprEntry', expr: 'A + B', row: 2, col: 2, equals: '5' }],
    },
    {
      id: 'scalar',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Skalerle çarpma: her kutu çarpılır',
      body: '$3A$’da $A$’nın her elemanı 3 ile çarpılır. Hiçbir kutu atlanmaz.',
      scene: { items: ['A', '=', 'K0'] },
      beat: {
        kind: 'combine',
        terms: [{ matrix: 'A', scale: '3' }],
        into: 'K0',
        cells: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
      },
      claims: [
        {
          kind: 'expr',
          expr: '3A',
          equals: [
            ['3', '-6'],
            ['0', '9'],
          ],
        },
      ],
    },
    {
      id: 'combine',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Önce çarp, sonra topla',
      body: '$2A - 3B$’nin her kutusu: {row}$A$’nınkinin 2 katı{/row} eksi {col}$B$’ninkinin 3 katı{/col}.',
      scene: { items: ['A', 'B', '=', 'T0'] },
      beat: {
        kind: 'combine',
        terms: [
          { matrix: 'A', scale: '2' },
          { matrix: 'B', scale: '-3' },
        ],
        into: 'T0',
        cells: [[0, 0]],
      },
      claims: [
        {
          kind: 'expr',
          expr: '2A - 3B',
          equals: [
            ['-10', '-7'],
            ['3', '0'],
          ],
        },
        {
          kind: 'expr',
          expr: 'A + B - (B + A)',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
        },
      ],
    },
    {
      id: 'try-entry',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: 'Sağ üst kutu kaç?',
      skill: 'linear-combination-entry',
      scene: { items: ['A', 'B', '=', 'T1'], marks: [{ cell: ['T1', 0, 1], tone: 'ok' }] },
      answer: '-7',
      feedbackWrong: '$2 \\cdot (-2) - 3 \\cdot 1$: önce çarp, sonra çıkar.',
      reveal: {
        kind: 'combine',
        terms: [
          { matrix: 'A', scale: '2' },
          { matrix: 'B', scale: '-3' },
        ],
        into: 'T1',
        cells: [[0, 1]],
      },
      solution: '$2 \\cdot (-2) - 3 \\cdot 1 = -4 - 3 = -7$.',
      claims: [{ kind: 'exprEntry', expr: '2A - 3B', row: 1, col: 2, equals: '-7' }],
    },
    {
      id: 'trap-size',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'Boyutlar farklıysa toplam yok',
      body: '2×3 ile 3×2 toplanamaz: eşleşecek konumlar yok. İşleme başlamadan {ok}önce boyutlara bak{/ok}.',
      scene: { items: ['P', '+', 'Q'] },
    },
    {
      id: 'try-size',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$C$ 2×3, $D$ 3×2. $C + D$ ne olur?',
      skill: 'matrix-size',
      options: [
        {
          key: 'a',
          content: [text('2×2 matris')],
          errorType: 'product-size-for-sum',
          feedback: '2×2, çarpımın boyutu. Toplamada iki matris aynı boyutta olmalı.',
        },
        {
          key: 'b',
          content: [text('3×3 matris')],
          errorType: 'product-size-for-sum',
          feedback: 'Toplamada boyut değişmez; boyutlar farklıysa toplam tanımsızdır.',
        },
        { key: 'c', content: [text('Tanımsız')] },
      ],
      answer: 'c',
      solution: '2×3 ile 3×2 aynı boyutta değil: toplam tanımsız.',
    },
    {
      id: 'exam-solve',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$2X + A = 3B$ ise $X$ hangisi?',
      body: 'Sayılardaki gibi çöz: $X = \\frac{1}{2}(3B - A)$.',
      skill: 'solve-matrix-equation',
      scene: { items: ['A', 'B'] },
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['13/2', '1/2'],
              ['-3/2', '9/2'],
            ]),
          ],
          errorType: 'lost-sign',
          feedback: '$A$ karşıya geçince işaret değiştirir: $3B - A$, $3B + A$ değil.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['11', '5'],
              ['-3', '3'],
            ]),
          ],
          errorType: 'forgot-divide',
          feedback: 'Bu $2X$. Son adımda $2$’ye böl.',
        },
        {
          key: 'c',
          content: [
            matrix([
              ['11/2', '5/2'],
              ['-3/2', '3/2'],
            ]),
          ],
        },
        {
          key: 'd',
          content: [
            matrix([
              ['-11/2', '-5/2'],
              ['3/2', '-3/2'],
            ]),
          ],
          errorType: 'lost-sign',
          feedback: 'Bu $\\frac{1}{2}(A - 3B)$: iki terim de yanlış tarafa geçmiş.',
        },
      ],
      answer: 'c',
      reveal: {
        kind: 'combine',
        terms: [
          { matrix: 'B', scale: '3/2' },
          { matrix: 'A', scale: '-1/2' },
        ],
        cells: [[0, 0]],
      },
      solution: '$3B - A$’nın satırları $(11, 5)$ ve $(-3, 3)$; $2$’ye bölünce $X$.',
      claims: [
        {
          kind: 'expr',
          expr: '1/2(3B - A)',
          equals: [
            ['11/2', '5/2'],
            ['-3/2', '3/2'],
          ],
          answer: true,
        },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Konum konum işlemler',
      points: [
        'Eşitlik: aynı boyut ve her konumda aynı eleman.',
        'Toplama ve skalerle çarpma konum konum; boyutlar aynı olmalı.',
        'Matris denklemi sayı denklemi gibi çözülür: $2X + A = 3B \\Rightarrow X = \\frac{1}{2}(3B - A)$.',
      ],
    },
  ],
}
