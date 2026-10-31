import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M9: orthogonal matrices: AᵀA = I, orthonormal columns, |A| = ±1, closure under products. */
export const m9Orthogonal: Lesson = {
  id: 'm9-orthogonal',
  node: 'M9',
  title: 'Ortogonal matrisler',
  matrices: {
    Q: m('Q =', [
      ['3/5', '-4/5'],
      ['4/5', '3/5'],
    ]),
    F: m('F =', [
      ['3/5', '4/5'],
      ['4/5', '-3/5'],
    ]),
    W: m('W =', [
      ['1', '-1'],
      ['1', '1'],
    ]),
    X: m('A =', [
      ['1/3', '2/3', '2/3'],
      ['2/3', '1/3', '-2/3'],
      ['2/3', '-2/3', 'x'],
    ]),
    xX: m('', [
      ['1/3', '2/3', '2/3'],
      ['2/3', '1/3', '-2/3'],
      ['2/3', '-2/3', '1/3'],
    ]),
    xY: m('', [
      ['1/3', '2/3', '2/3'],
      ['2/3', '1/3', '-2/3'],
      ['2/3', '-2/3', '-1/3'],
    ]),
    xA: m('', [
      ['0', '-1', '0'],
      ['1', '0', '0'],
      ['0', '0', '1'],
    ]),
    xB: m('', [
      ['1', '0', '0'],
      ['0', '1', '0'],
      ['0', '0', '-1'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Hangi matris boyları hiç değiştirmez?',
      body: '$Q$ düzlemi döndürür, hiçbir vektör uzamaz. Sırrı sütunlarında.',
      scene: { items: ['Q'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['Q', '*', 0], tone: 'col' }], note: 'boy = 1' },
          { clear: true, marks: [{ cell: ['Q', '*', 1], tone: 'col' }], note: 'boy = 1' },
          {
            clear: true,
            marks: [
              { cell: ['Q', '*', 0], tone: 'row' },
              { cell: ['Q', '*', 1], tone: 'col' },
            ],
            note: 'iç çarpım = 0',
          },
        ],
      },
      claims: [{ kind: 'property', expr: 'Q', is: 'orthogonal' }],
    },
    {
      id: 'definition',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Ortogonal: $A^TA = I$',
      body: 'Sütunların boyu 1 ve hepsi birbirine dik. Kazanç: {ok}tersi, transpozudur{/ok}.',
      scene: { items: ['Q'] },
      claims: [
        {
          kind: 'expr',
          expr: 'Q^TQ',
          equals: [
            ['1', '0'],
            ['0', '1'],
          ],
        },
        {
          kind: 'expr',
          expr: 'Q^{-1} - Q^T',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
        },
      ],
    },
    {
      id: 'try-inverse',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$Q^{-1}$’in 1. satır 2. sütun elemanı kaç?',
      body: 'Hesap yapma: $Q^{-1} = Q^T$.',
      skill: 'orthogonal-inverse',
      scene: { items: ['Q'] },
      answer: '4/5',
      reveal: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['Q', 1, '*'], tone: 'row' }] },
          { marks: [{ cell: ['Q', '*', 0], tone: 'col' }] },
          { clear: true, marks: [{ cell: ['Q', 1, 0], tone: 'ok' }], note: '(Qᵀ)₁₂ = q₂₁ = 4/5' },
        ],
      },
      feedbackWrong: '$Q^T$’nin $(1, 2)$ elemanı, $Q$’nun $(2, 1)$ elemanıdır.',
      solution: '$(Q^{-1})_{12} = (Q^T)_{12} = q_{21} = \\frac{4}{5}$.',
      claims: [{ kind: 'exprEntry', expr: 'Q^{-1}', row: 1, col: 2, equals: '4/5' }],
    },
    {
      id: 'determinant',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$|A| = \\pm 1$',
      body: '$|A|^2 = |A^TA| = |I| = 1$. Dönme: $|Q| = 1$. Yansıma: $|F| = -1$.',
      beat: {
        kind: 'equation',
        lines: ['|A^TA| = |A|^2 = 1', '|A| = \\pm 1'],
      },
      scene: { items: ['Q', 'F'] },
      claims: [
        { kind: 'det', matrix: 'Q', equals: '1' },
        { kind: 'det', matrix: 'F', equals: '-1' },
        { kind: 'property', expr: 'F', is: 'orthogonal' },
      ],
    },
    {
      id: 'try-det',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Ortogonal bir matrisin determinantı hangisi olabilir?',
      skill: 'orthogonal-det',
      options: [
        {
          key: 'a',
          content: [text('$0$')],
          errorType: 'singular-orthogonal',
          feedback: 'Ortogonal matrisin tersi var ($A^T$): determinant 0 olamaz.',
        },
        { key: 'b', content: [text('$-1$')] },
        {
          key: 'c',
          content: [text('$2$')],
          errorType: 'any-det',
          feedback: '$|A|^2 = 1$ olmalı; $2^2 = 4$.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['|A|^2 = |A^TA| = |I| = 1', '|A| = \\pm 1'] },
      solution: '$|A|^2 = 1$, yani $|A| = \\pm 1$. Yansıma $F$ için $-1$.',
      claims: [{ kind: 'det', matrix: 'F', equals: '-1' }],
    },
    {
      id: 'trap-length',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'Dik sütunlar yetmez, boyları da $1$ olmalı',
      body: '$W$’nin sütunları dik ama boyları $\\sqrt{2}$. $|W| = 2$: ortogonal değil.',
      scene: { items: ['W'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['W', '*', 0], tone: 'row' },
              { cell: ['W', '*', 1], tone: 'col' },
            ],
            note: '−1 + 1 = 0: dik',
          },
          { clear: true, marks: [{ cell: ['W', '*', 0], tone: 'col' }], note: 'boy² = 1 + 1 = 2' },
        ],
      },
      claims: [
        {
          kind: 'expr',
          expr: 'W^TW',
          equals: [
            ['2', '0'],
            ['0', '2'],
          ],
        },
        { kind: 'det', matrix: 'W', equals: '2' },
        { kind: 'property', expr: 'W', is: 'orthogonal', holds: false },
      ],
    },
    {
      id: 'try-missing',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$A$ ortogonal ise $x$ kaçtır?',
      body: 'Boy iki değer verir. Dikliği de dene.',
      skill: 'orthogonal-missing-entry',
      scene: { items: ['X'] },
      options: [
        {
          key: 'a',
          content: [text('$-\\frac{1}{3}$')],
          errorType: 'length-only',
          feedback:
            'Boy koşulunu sağlar ama 1. sütunla iç çarpım $\\frac{2}{9} - \\frac{4}{9} - \\frac{2}{9} \\neq 0$.',
        },
        { key: 'b', content: [text('$\\frac{1}{3}$')] },
        {
          key: 'c',
          content: [text('$1$')],
          errorType: 'ignored-other-entries',
          feedback: 'Satırın boyu $1$ olmalı: $\\frac{4}{9} + \\frac{4}{9} + x^2 = 1$.',
        },
        {
          key: 'd',
          content: [text('$\\frac{1}{9}$')],
          errorType: 'forgot-square-root',
          feedback: 'Bu $x^2$. Karekök al ve işareti diklikten seç.',
        },
        {
          key: 'e',
          content: [text('$0$')],
          errorType: 'diagonal-guess',
          feedback: 'O zaman 3. satırın boyu $\\sqrt{\\frac{8}{9}}$ olur, $1$ değil.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: [
          '\\tfrac{4}{9} + \\tfrac{4}{9} + x^2 = 1 \\Rightarrow x = \\pm\\tfrac{1}{3}',
          '\\tfrac{2}{9} - \\tfrac{4}{9} + \\tfrac{2}{3}x = 0 \\Rightarrow x = \\tfrac{1}{3}',
        ],
      },
      solution:
        'Boy: $\\frac{4}{9} + \\frac{4}{9} + x^2 = 1$, $x = \\pm\\frac{1}{3}$. Diklik (1. ve 3. sütun): $\\frac{2}{9} - \\frac{4}{9} + \\frac{2}{3}x = 0$, $x = \\frac{1}{3}$.',
      claims: [
        { kind: 'property', expr: 'xX', is: 'orthogonal' },
        { kind: 'property', expr: 'xY', is: 'orthogonal', holds: false },
        { kind: 'exprEntry', expr: 'xX', row: 3, col: 3, equals: '1/3', answer: true },
      ],
    },
    {
      id: 'product',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Ortogonal çarpı ortogonal yine ortogonal',
      body: 'Yansıt, sonra döndür: $QF$ de boyları korur. $A^T$ ve $A^{-1}$ de ortogonaldir.',
      beat: {
        kind: 'equation',
        lines: ['(AB)^T(AB) = B^T(A^TA)B', '= B^TB = I'],
      },
      scene: { items: ['Q', 'F'] },
      claims: [
        { kind: 'property', expr: 'QF', is: 'orthogonal' },
        { kind: 'property', expr: 'Q^T', is: 'orthogonal' },
      ],
    },
    {
      id: 'exam-det',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$A, B$ 3×3 ortogonal, $|A| = 1$, $|B| = -1$. $|2A^TB^3A^{-1}|$ kaçtır?',
      skill: 'orthogonal-det',
      options: [
        {
          key: 'a',
          content: [text('$8$')],
          errorType: 'lost-sign',
          feedback: '$|B^3| = (-1)^3 = -1$: tek kuvvet işareti korur.',
        },
        {
          key: 'b',
          content: [text('$-2$')],
          errorType: 'k-instead-of-k-power-n',
          feedback: '$|2M| = 2^3|M|$, $2|M|$ değil.',
        },
        { key: 'c', content: [text('$-8$')] },
        {
          key: 'd',
          content: [text('$-6$')],
          errorType: 'k-times-n',
          feedback: '$2^3 = 8$, $2 \\cdot 3 = 6$ değil.',
        },
        {
          key: 'e',
          content: [text('$-\\frac{1}{8}$')],
          errorType: 'inverted-scalar',
          feedback: 'Ters alınan yalnız $A$; $2$ çarpanı aynen $2^3$ olarak çıkar.',
        },
      ],
      answer: 'c',
      reveal: {
        kind: 'equation',
        lines: [
          '|2A^TB^3A^{-1}| = 2^3 \\cdot |A| \\cdot |B|^3 \\cdot \\tfrac{1}{|A|}',
          '= 8 \\cdot 1 \\cdot (-1) \\cdot 1 = -8',
        ],
      },
      solution: '$2^3 \\cdot 1 \\cdot (-1)^3 \\cdot 1 = -8$.',
      claims: [
        { kind: 'property', expr: 'xA', is: 'orthogonal' },
        { kind: 'property', expr: 'xB', is: 'orthogonal' },
        { kind: 'det', matrix: 'xA', equals: '1' },
        { kind: 'det', matrix: 'xB', equals: '-1' },
        {
          kind: 'detProduct',
          scalar: '2',
          factors: [
            { matrix: 'xA', transpose: true },
            { matrix: 'xB', power: 3 },
            { matrix: 'xA', power: -1 },
          ],
          equals: '-8',
          answer: true,
        },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Ortogonal matrisler',
      points: [
        '$A^TA = AA^T = I$, yani $A^{-1} = A^T$.',
        'Sütunlar (ve satırlar) birim uzunlukta ve ikişer ikişer dik.',
        '$|A| = \\pm 1$ (2×2’de: dönme $+1$, yansıma $-1$). Tersi geçerli değil.',
        'Çarpım, transpoz ve ters yine ortogonal.',
        'Eksik eleman sorusunda boy iki değer verir; dikliği kullanarak birini seç.',
      ],
    },
  ],
}
