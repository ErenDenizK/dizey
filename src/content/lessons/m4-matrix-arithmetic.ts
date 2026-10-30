import { matrix } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M4: equality, sum, difference and scalar multiples, entry by entry. */
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
  },
  steps: [
    {
      id: 'equality',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'İki matris eşitse her konum eşittir',
      body: 'Eşitlik için önce boyutlar aynı olmalı, sonra her $(i, j)$ konumundaki elemanlar. Buradan $x + 1 = 4$ ve $y = -1$ çıkar: {ok}tek bir matris eşitliği, dört ayrı denklem{/ok}.',
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
      id: 'combine',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Toplama ve skalerle çarpma: konum konum',
      body: '$A + B$’nin her elemanı $a_{ij} + b_{ij}$, $kA$’nınki $k \\cdot a_{ij}$. Bu yüzden $2A - 3B$’nin sol üst elemanı $2 \\cdot 1 - 3 \\cdot 4 = -10$. İşlem kuralları sayılardaki gibidir: $A + B = B + A$, $k(A + B) = kA + kB$.',
      scene: { items: ['A', 'B'] },
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
      title: '$2A - 3B$’nin 1. satır 2. sütun elemanı kaç?',
      skill: 'linear-combination-entry',
      scene: { items: ['A', 'B'] },
      answer: '-7',
      feedbackWrong: '$2 \\cdot a_{12} - 3 \\cdot b_{12}$, burada $a_{12} = -2$, $b_{12} = 1$.',
      solution: '$2 \\cdot (-2) - 3 \\cdot 1 = -7$.',
      claims: [{ kind: 'exprEntry', expr: '2A - 3B', row: 1, col: 2, equals: '-7' }],
    },
    {
      id: 'trap-size',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'Boyutlar farklıysa toplam yok',
      body: '2×3 bir matrisle 3×2 bir matris toplanamaz: eşleşecek konumlar yok. Sınavda "tanımsız" şıkkı bu yüzden vardır; işleme başlamadan {ok}önce boyutlara bak{/ok}.',
    },
    {
      id: 'exam-solve',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$2X + A = 3B$ ise $X$ hangisidir?',
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
        'Toplama ve skalerle çarpma konum konum yapılır; boyutlar aynı olmalı.',
        'Matris denklemi sayı denklemi gibi çözülür: $2X + A = 3B \\Rightarrow X = \\frac{1}{2}(3B - A)$.',
      ],
    },
  ],
}
