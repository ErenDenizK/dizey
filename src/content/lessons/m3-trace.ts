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
    XY: m('XY =', [
      ['10', '-3'],
      ['20', '-5'],
    ]),
    YX: m('YX =', [
      ['3', '4'],
      ['-1', '2'],
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
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Bir kare matris tek sayıyla özetlenebilir mi?',
      body: 'Sol üstten sağ alta inen çizgiye bak. Birazdan oradan tek bir sayı çıkacak.',
      scene: {
        items: ['A'],
        marks: [
          { cell: ['A', 0, 0], tone: 'ok' },
          { cell: ['A', 1, 1], tone: 'ok' },
          { cell: ['A', 2, 2], tone: 'ok' },
        ],
      },
    },
    {
      id: 'definition',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'İz: köşegenin toplamı',
      body: '{ok}Köşegendeki{/ok} sayıları topla. Köşegen dışındakiler sayılmaz. Yalnız kare matrislerde.',
      scene: { items: ['A'] },
      beat: { kind: 'trace', matrix: 'A' },
      claims: [{ kind: 'trace', expr: 'A', equals: '5' }],
    },
    {
      id: 'try-trace',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$B$’nin izi kaç?',
      skill: 'trace',
      scene: { items: ['B'] },
      answer: '3',
      feedbackWrong: 'Yalnız köşegen: $1$, $4$ ve $-2$.',
      reveal: { kind: 'trace', matrix: 'B' },
      solution: '$1 + 4 + (-2) = 3$.',
      claims: [{ kind: 'trace', expr: 'B', equals: '3' }],
    },
    {
      id: 'linear',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Toplam ve sabit dışarı çıkar',
      body: '$\\text{iz}(A + B) = \\text{iz}(A) + \\text{iz}(B)$ ve $\\text{iz}(kA) = k \\cdot \\text{iz}(A)$. Matrisi kurmana gerek yok.',
      scene: { items: ['A', 'B'] },
      beat: {
        kind: 'sequence',
        beats: [
          { kind: 'trace', matrix: 'A' },
          { kind: 'trace', matrix: 'B' },
        ],
      },
      claims: [
        { kind: 'trace', expr: 'B', equals: '3' },
        { kind: 'trace', expr: 'A + B', equals: '8' },
      ],
    },
    {
      id: 'try-combination',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$\\text{iz}(2A - 3B)$ kaç?',
      body: 'İzler 5 ve 3.',
      skill: 'trace-linearity',
      scene: { items: ['A', 'B'] },
      answer: '1',
      feedbackWrong: '$2 \\cdot \\text{iz}(A) - 3 \\cdot \\text{iz}(B)$.',
      reveal: {
        kind: 'equation',
        lines: ['\\text{iz}(2A - 3B) = 2 \\cdot 5 - 3 \\cdot 3', '= 10 - 9 = 1'],
      },
      solution: '$2 \\cdot 5 - 3 \\cdot 3 = 1$.',
      claims: [{ kind: 'trace', expr: '2A - 3B', equals: '1' }],
    },
    {
      id: 'transpose',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Transpoz köşegeni yerinde bırakır',
      body: 'Bu yüzden $\\text{iz}(A^T) = \\text{iz}(A)$. Birim matriste köşegen hep 1: $\\text{iz}(I_n) = n$.',
      scene: { items: ['A'] },
      beat: { kind: 'trace', matrix: 'A' },
      claims: [
        { kind: 'trace', expr: 'A^T', equals: '5' },
        { kind: 'trace', expr: 'A - A + I', equals: '3' },
      ],
    },
    {
      id: 'try-identity',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '4×4 birim matrisin izi kaç?',
      skill: 'trace',
      options: [
        {
          key: 'a',
          content: [text('$1$')],
          errorType: 'trace-of-identity',
          feedback: 'Köşegende dört tane 1 var; hepsi toplanır.',
        },
        {
          key: 'b',
          content: [text('$16$')],
          errorType: 'counted-entries',
          feedback: '16, eleman sayısı. Yalnız köşegen toplanır.',
        },
        { key: 'c', content: [text('$4$')] },
      ],
      answer: 'c',
      reveal: { kind: 'equation', lines: ['\\text{iz}(I_4) = 1 + 1 + 1 + 1 = 4'] },
      solution: 'Köşegende dört tane 1: $\\text{iz}(I_4) = 4$.',
    },
    {
      id: 'cyclic',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$XY$ ile $YX$ farklı, izleri aynı',
      body: 'Sıra değişince matris değişir ama iz değişmez: $\\text{iz}(XY) = \\text{iz}(YX)$.',
      scene: { items: ['XY', 'YX'] },
      beat: {
        kind: 'sequence',
        beats: [
          { kind: 'trace', matrix: 'XY' },
          { kind: 'trace', matrix: 'YX' },
        ],
      },
      claims: [
        {
          kind: 'expr',
          expr: 'XY',
          equals: [
            ['10', '-3'],
            ['20', '-5'],
          ],
        },
        {
          kind: 'expr',
          expr: 'YX',
          equals: [
            ['3', '4'],
            ['-1', '2'],
          ],
        },
        { kind: 'trace', expr: 'XY', equals: '5' },
        { kind: 'trace', expr: 'YX', equals: '5' },
      ],
    },
    {
      id: 'try-product-trap',
      kind: 'choice',
      eyebrow: 'Tuzak',
      title: '$\\text{iz}(XY)$, izlerin çarpımı mı?',
      skill: 'trace-linearity',
      scene: { items: ['X', 'Y'] },
      options: [
        {
          key: 'a',
          content: [text('Evet, her zaman')],
          errorType: 'trace-multiplicative',
          feedback:
            'Burada $\\text{iz}(X) \\cdot \\text{iz}(Y) = 5 \\cdot (-2) = -10$, oysa $\\text{iz}(XY) = 5$.',
        },
        { key: 'b', content: [text('Hayır, genelde değil')] },
      ],
      answer: 'b',
      reveal: {
        kind: 'sequence',
        beats: [
          { kind: 'trace', matrix: 'X' },
          { kind: 'trace', matrix: 'Y' },
        ],
      },
      solution: '$5 \\cdot (-2) = -10$ ama $\\text{iz}(XY) = 5$.',
      claims: [
        { kind: 'trace', expr: 'X', equals: '5' },
        { kind: 'trace', expr: 'Y', equals: '-2' },
        { kind: 'trace', expr: 'XY', equals: '5' },
      ],
    },
    {
      id: 'exam-trace',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$A, B$ 3×3, $\\text{iz}(A) = 3$, $\\text{iz}(B) = -2$. $\\text{iz}(2A - B^T + 3I)$ kaç?',
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
      reveal: {
        kind: 'equation',
        lines: ['2 \\cdot 3 - (-2) + 3 \\cdot 3', '= 6 + 2 + 9 = 17'],
      },
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
