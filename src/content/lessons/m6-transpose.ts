import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M6: the transpose and its rules; the order reverses in (AB)ᵀ = BᵀAᵀ. */
export const m6Transpose: Lesson = {
  id: 'm6-transpose',
  node: 'M6',
  title: 'Transpoz',
  matrices: {
    P: m('A =', [
      ['2', '-1', '3'],
      ['0', '4', '1'],
    ]),
    tP: m('$A^T$ =', [
      ['2', '0'],
      ['-1', '4'],
      ['3', '1'],
    ]),
    xA: m('', [
      ['1', '2'],
      ['0', '-1'],
    ]),
    xB: m('', [
      ['3', '0'],
      ['1', '2'],
    ]),
    xC: m('', [
      ['1', '1'],
      ['2', '0'],
    ]),
  },
  steps: [
    {
      id: 'definition',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Satırlar sütun olur',
      body: '$A^T$’nin $i.$ sütunu $A$’nın $i.$ satırıdır; eleman olarak $(A^T)_{ij} = a_{ji}$. Boyut da döner: 2×3 bir matrisin transpozu 3×2’dir.',
      scene: { items: ['P', 'tP'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['P', 0, '*'], tone: 'row' },
              { cell: ['tP', '*', 0], tone: 'row' },
            ],
          },
          {
            clear: true,
            marks: [
              { cell: ['P', 1, '*'], tone: 'col' },
              { cell: ['tP', '*', 1], tone: 'col' },
            ],
          },
        ],
      },
      claims: [
        {
          kind: 'expr',
          expr: 'P^T - tP',
          equals: [
            ['0', '0'],
            ['0', '0'],
            ['0', '0'],
          ],
        },
      ],
    },
    {
      id: 'rules',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Transpozun kuralları',
      body: '$(A^T)^T = A$, $(A + B)^T = A^T + B^T$, $(kA)^T = kA^T$. Çarpımda {ok}sıra ters döner{/ok}: $(AB)^T = B^TA^T$. Neden: $(AB)^T$’nin $(i, j)$ elemanı, $A$’nın $j.$ satırı ile $B$’nin $i.$ sütununun çarpımıdır; bu da $B^T$’nin $i.$ satırı ile $A^T$’nin $j.$ sütunu.',
      claims: [
        {
          kind: 'expr',
          expr: '(AB)^T - B^TA^T',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
          where: { A: 'xA', B: 'xB' },
        },
        {
          kind: 'expr',
          expr: '(AB)^T - A^TB^T',
          equals: [
            ['2', '-2'],
            ['-2', '-2'],
          ],
          where: { A: 'xA', B: 'xB' },
        },
      ],
    },
    {
      id: 'try-entry',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$A^T$’nin 3. satır 2. sütun elemanı kaç?',
      body: '$(A^T)_{32} = a_{23}$.',
      skill: 'transpose-entry',
      scene: { items: ['P'] },
      answer: '1',
      feedbackWrong: '$A$’nın 2. satırı $(0, 4, 1)$; 3. elemanı al.',
      solution: '$(A^T)_{32} = a_{23} = 1$.',
      claims: [{ kind: 'exprEntry', expr: 'P^T', row: 3, col: 2, equals: '1' }],
    },
    {
      id: 'exam-order',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$(ABC)^T$ hangisine eşittir?',
      skill: 'transpose-product',
      options: [
        {
          key: 'a',
          content: [text('$A^TB^TC^T$')],
          errorType: 'kept-order',
          feedback: 'Transpoz çarpımın sırasını ters çevirir: en sondaki $C$ en başa gelir.',
        },
        { key: 'b', content: [text('$C^TB^TA^T$')] },
        {
          key: 'c',
          content: [text('$CBA$')],
          errorType: 'dropped-transpose',
          feedback: 'Sıra doğru ama her çarpanın transpozu da alınmalı.',
        },
        {
          key: 'd',
          content: [text('$B^TC^TA^T$')],
          errorType: 'partial-reverse',
          feedback: 'Sıra tamamen ters dönmeli: $C$, $B$, $A$.',
        },
      ],
      answer: 'b',
      solution: '$(ABC)^T = ((AB)C)^T = C^T(AB)^T = C^TB^TA^T$.',
      claims: [{ kind: 'optionExpr', expr: '(ABC)^T', where: { A: 'xA', B: 'xB', C: 'xC' } }],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Transpoz',
      points: [
        '$(A^T)_{ij} = a_{ji}$; m×n matrisin transpozu n×m.',
        '$(A^T)^T = A$, $(A + B)^T = A^T + B^T$, $(kA)^T = kA^T$.',
        '$(AB)^T = B^TA^T$: sıra ters döner, uzun çarpımlarda da.',
      ],
    },
  ],
}
