import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M3: the trace, its linearity, tr(Aᵀ) = tr(A) and tr(AB) = tr(BA). */
export const m3Trace: Lesson = {
  id: 'm3-trace',
  node: 'M3',
  title: 'İz (trace)',
  matrices: {
    A: m('A =', [
      ['2', '5', '-1'],
      ['0', '-3', '4'],
      ['7', '1', '6'],
    ]),
    B: m('B =', [
      ['1', '0', '2'],
      ['3', '4', '0'],
      ['-1', '2', '-2'],
    ]),
    X: m('X =', [
      ['1', '2'],
      ['3', '4'],
    ]),
    Y: m('Y =', [
      ['0', '1'],
      ['5', '-2'],
    ]),
    xA: m('', [
      ['1', '0', '0'],
      ['0', '1', '0'],
      ['0', '0', '1'],
    ]),
    xB: m('', [
      ['-2', '7', '0'],
      ['1', '0', '0'],
      ['0', '5', '0'],
    ]),
  },
  steps: [
    {
      id: 'definition',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'İz: köşegenin toplamı',
      body: 'Kare bir $A$ için $\\text{iz}(A) = a_{11} + a_{22} + \\dots + a_{nn}$. Köşegen dışındaki hiçbir eleman sayılmaz. Burada {ok}iz $5$ çıkar{/ok}: $2 + (-3) + 6 = 5$.',
      scene: { items: ['A'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['A', 0, 0], tone: 'ok' },
              { cell: ['A', 1, 1], tone: 'ok' },
              { cell: ['A', 2, 2], tone: 'ok' },
            ],
            note: '2 − 3 + 6 = 5',
          },
        ],
      },
      claims: [{ kind: 'trace', expr: 'A', equals: '5' }],
    },
    {
      id: 'linear',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'İz doğrusaldır: toplam ve skaler dışarı çıkar',
      body: '$\\text{iz}(A + B) = \\text{iz}(A) + \\text{iz}(B)$, $\\text{iz}(kA) = k \\, \\text{iz}(A)$, $\\text{iz}(A^T) = \\text{iz}(A)$: transpoz köşegeni yerinde bırakır. Ayrıca $\\text{iz}(I_n) = n$.',
      scene: { items: ['A', 'B'] },
      claims: [
        { kind: 'trace', expr: 'B', equals: '3' },
        { kind: 'trace', expr: 'A + B', equals: '8' },
        { kind: 'trace', expr: 'A^T', equals: '5' },
        { kind: 'trace', expr: 'A - A + I', equals: '3' },
      ],
    },
    {
      id: 'try-combination',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$\\text{iz}(2A - 3B)$ kaç?',
      body: 'Matrisi kurma: izleri kullan.',
      skill: 'trace-linearity',
      scene: { items: ['A', 'B'] },
      answer: '1',
      feedbackWrong: '$\\text{iz}(A) = 5$, $\\text{iz}(B) = 1 + 4 - 2$.',
      solution: '$2 \\cdot 5 - 3 \\cdot 3 = 1$.',
      claims: [{ kind: 'trace', expr: '2A - 3B', equals: '1' }],
    },
    {
      id: 'cyclic',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$\\text{iz}(AB) = \\text{iz}(BA)$',
      body: '$XY$ ile $YX$ farklı matrisler, ama izleri aynı: $10 + (-5) = 5$ ve $3 + 2 = 5$. Bu, $AB \\neq BA$ iken bile geçerli. Dikkat: {ok}$\\text{iz}(AB)$, izlerin çarpımı değildir{/ok}; burada $\\text{iz}(X) \\cdot \\text{iz}(Y) = 5 \\cdot (-2) = -10$.',
      scene: { items: ['X', 'Y'] },
      claims: [
        { kind: 'trace', expr: 'XY', equals: '5' },
        { kind: 'trace', expr: 'YX', equals: '5' },
        { kind: 'trace', expr: 'X', equals: '5' },
        { kind: 'trace', expr: 'Y', equals: '-2' },
      ],
    },
    {
      id: 'exam-trace',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$A, B$ 3×3, $\\text{iz}(A) = 3$, $\\text{iz}(B) = -2$. $\\text{iz}(2A - B^T + 3I)$ kaçtır?',
      skill: 'trace-linearity',
      options: [
        {
          key: 'a',
          content: [text('$11$')],
          errorType: 'trace-of-identity',
          feedback: '$\\text{iz}(3I) = 3 \\cdot 3 = 9$, $3$ değil.',
        },
        {
          key: 'b',
          content: [text('$13$')],
          errorType: 'lost-sign',
          feedback: '$-\\text{iz}(B^T) = -(-2) = +2$.',
        },
        { key: 'c', content: [text('$17$')] },
        {
          key: 'd',
          content: [text('$14$')],
          errorType: 'dropped-scalar',
          feedback: '$\\text{iz}(2A) = 2 \\cdot 3 = 6$.',
        },
        {
          key: 'e',
          content: [text('$9$')],
          errorType: 'trace-of-identity',
          feedback: 'Bu sadece $\\text{iz}(3I)$. Diğer iki terimi de ekle: $6 + 2$.',
        },
      ],
      answer: 'c',
      solution: '$2 \\cdot 3 - (-2) + 3 \\cdot 3 = 6 + 2 + 9 = 17$.',
      claims: [
        { kind: 'trace', expr: 'xA', equals: '3' },
        { kind: 'trace', expr: 'xB', equals: '-2' },
        { kind: 'trace', expr: '2A - B^T + 3I', equals: '17', where: { A: 'xA', B: 'xB' }, answer: true },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'İz',
      points: [
        'Yalnız kare matriste: köşegen elemanlarının toplamı.',
        '$\\text{iz}(A \\pm B) = \\text{iz}(A) \\pm \\text{iz}(B)$, $\\text{iz}(kA) = k \\, \\text{iz}(A)$, $\\text{iz}(I_n) = n$.',
        '$\\text{iz}(A^T) = \\text{iz}(A)$, $\\text{iz}(AB) = \\text{iz}(BA)$.',
        '$\\text{iz}(AB) \\neq \\text{iz}(A) \\cdot \\text{iz}(B)$ genelde.',
      ],
    },
  ],
}
