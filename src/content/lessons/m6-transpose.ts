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
    T0: m('$A^T$ =', [
      ['?', '?'],
      ['?', '?'],
      ['?', '?'],
    ]),
    T1: m('$A^T$ =', [
      ['2', '?'],
      ['-1', '?'],
      ['3', '?'],
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
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Satırları sütun yapsak ne olur?',
      body: '$A$’nın satırlarını yatay değil dikey yaz. Ortaya çıkan matrisin adı transpoz: $A^T$.',
      scene: { items: ['P', 'T0'] },
    },
    {
      id: 'definition',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Satırlar sütun olur',
      body: '$A$’nın {row}1. satırı{/row}, $A^T$’nin {ok}1. sütunu{/ok} olur.',
      scene: { items: ['P', 'T0'] },
      beat: { kind: 'transpose', matrix: 'P', into: 'T0', rows: [0] },
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
      id: 'try-column',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$A^T$’nin 2. sütunu hangisi?',
      skill: 'transpose-entry',
      scene: {
        items: ['P', 'T1'],
        marks: [{ cell: ['T1', '*', 1], tone: 'ok' }],
      },
      options: [
        {
          key: 'a',
          content: [text('$(-1, 4)$')],
          errorType: 'kept-column',
          feedback: 'Bu $A$’nın 2. sütunu. Transpozda satır sütuna döner: 2. satırı al.',
        },
        { key: 'b', content: [text('$(0, 4, 1)$')] },
        {
          key: 'c',
          content: [text('$(2, 0)$')],
          errorType: 'kept-column',
          feedback: 'Bu $A$’nın 1. sütunu. $A^T$’nin 2. sütunu, $A$’nın 2. satırı.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'transpose', matrix: 'P', into: 'T1', rows: [1] },
      solution: '$A$’nın 2. satırı $(0, 4, 1)$, dikey yazılır.',
    },
    {
      id: 'size',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Boyut da döner',
      body: '2×3 bir matrisin transpozu 3×2. Tek eleman için indisler yer değiştirir: $(A^T)_{ij} = a_{ji}$.',
      scene: { items: ['P', 'tP'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['P', 0, 1], tone: 'row' },
              { cell: ['tP', 1, 0], tone: 'ok' },
            ],
            note: '(Aᵀ)₂₁ = a₁₂ = −1',
          },
        ],
      },
      claims: [{ kind: 'exprEntry', expr: 'P^T', row: 2, col: 1, equals: '-1' }],
    },
    {
      id: 'try-entry',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$A^T$’nin 3. satır 2. sütunu kaç?',
      body: 'İndisleri çevir: $a_{23}$.',
      skill: 'transpose-entry',
      scene: { items: ['P'] },
      answer: '1',
      feedbackWrong: '$A$’nın 2. satırı $(0, 4, 1)$; 3. elemanı al.',
      reveal: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['P', 1, '*'], tone: 'row' }] },
          { clear: true, marks: [{ cell: ['P', 1, 2], tone: 'ok' }], note: 'a₂₃ = 1' },
        ],
      },
      solution: '$(A^T)_{32} = a_{23} = 1$.',
      claims: [{ kind: 'exprEntry', expr: 'P^T', row: 3, col: 2, equals: '1' }],
    },
    {
      id: 'try-size',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$B$ 4×2 ise $B^T$ kaça kaç?',
      skill: 'matrix-size',
      options: [
        { key: 'a', content: [text('2×4')] },
        {
          key: 'b',
          content: [text('4×2')],
          errorType: 'kept-size',
          feedback: 'Transpoz boyutu çevirir: satırlar sütun olur.',
        },
        {
          key: 'c',
          content: [text('8')],
          errorType: 'counted-entries',
          feedback: '8, eleman sayısı. Boyut iki sayı: 2×4.',
        },
      ],
      answer: 'a',
      reveal: { kind: 'equation', lines: ['4 \\times 2 \\;\\to\\; 2 \\times 4'] },
      solution: '4 satır 4 sütun olur, 2 sütun 2 satır: 2×4.',
    },
    {
      id: 'rules',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Toplama ve sabite dağılır',
      body: '$(A + B)^T = A^T + B^T$ ve $(kA)^T = kA^T$. İki kez çevirince başa dönersin: $(A^T)^T = A$.',
      beat: {
        kind: 'equation',
        lines: ['(A + B)^T = A^T + B^T', '(kA)^T = kA^T', '(A^T)^T = A'],
      },
    },
    {
      id: 'try-scalar',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$(2A)^T$ neye eşit?',
      skill: 'transpose-rules',
      options: [
        {
          key: 'a',
          content: [text('$2A$')],
          errorType: 'dropped-transpose',
          feedback: 'Transpoz kaybolmaz; yalnız sabit dışarı çıkar.',
        },
        { key: 'b', content: [text('$2A^T$')] },
        {
          key: 'c',
          content: [text('$A^T$')],
          errorType: 'dropped-scalar',
          feedback: 'Sabit dışarı çıkar ama kaybolmaz: $2A^T$.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['(2A)^T = 2A^T'] },
      solution: 'Sabit dışarı çıkar: $(kA)^T = kA^T$.',
      claims: [{ kind: 'optionExpr', expr: '(2A)^T', where: { A: 'xA' } }],
    },
    {
      id: 'order',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'Çarpımda sıra ters döner',
      body: '$(AB)^T = B^TA^T$. $A^TB^T$ yazmak en sık yapılan hata; genelde eşit değiller.',
      beat: { kind: 'equation', lines: ['(AB)^T = B^T A^T', '(AB)^T \\neq A^T B^T'] },
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
      id: 'exam-order',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$(ABC)^T$ neye eşit?',
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
      reveal: { kind: 'equation', lines: ['(ABC)^T = C^T (AB)^T', '= C^T B^T A^T'] },
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
