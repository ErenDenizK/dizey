import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

const augmented = (label: string, rows: readonly (readonly string[])[], at: number): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
  augmentedAt: at,
})

/** R4: the inverse by Gauss-Jordan on [A | I], singular cases, inverse rules, inverse from a polynomial identity. */
export const r4Inverse: Lesson = {
  id: 'r4-inverse',
  node: 'R4',
  title: 'Ters matris: Gauss-Jordan ve özdeşlikler',
  matrices: {
    D: m('D =', [
      ['2', '0', '0'],
      ['0', '-1', '0'],
      ['0', '0', '4'],
    ]),
    A: m('A =', [
      ['1', '2', '0'],
      ['0', '1', '1'],
      ['1', '0', '2'],
    ]),
    Start: augmented(
      '$[A \\mid I]$ =',
      [
        ['1', '2', '0', '1', '0', '0'],
        ['0', '1', '1', '0', '1', '0'],
        ['1', '0', '2', '0', '0', '1'],
      ],
      3,
    ),
    S1: augmented(
      '',
      [
        ['1', '2', '0', '1', '0', '0'],
        ['0', '1', '1', '0', '1', '0'],
        ['0', '-2', '2', '-1', '0', '1'],
      ],
      3,
    ),
    Mid: augmented(
      '',
      [
        ['1', '2', '0', '1', '0', '0'],
        ['0', '1', '1', '0', '1', '0'],
        ['0', '0', '1', '-1/4', '1/2', '1/4'],
      ],
      3,
    ),
    End: augmented(
      '$[I \\mid A^{-1}]$ =',
      [
        ['1', '0', '0', '1/2', '-1', '1/2'],
        ['0', '1', '0', '1/4', '1/2', '-1/4'],
        ['0', '0', '1', '-1/4', '1/2', '1/4'],
      ],
      3,
    ),
    T: augmented(
      '$[B \\mid I]$ =',
      [
        ['1', '2', '1', '0'],
        ['2', '4', '0', '1'],
      ],
      2,
    ),
    TEnd: augmented(
      '',
      [
        ['1', '2', '1', '0'],
        ['0', '0', '-2', '1'],
      ],
      2,
    ),
    C: m('C =', [
      ['2', '1'],
      ['5', '3'],
    ]),
    H: m('A =', [
      ['3', '2'],
      ['1', '1'],
    ]),
    xP: m('', [
      ['1', '2'],
      ['0', '1'],
    ]),
    xQ: m('', [
      ['2', '0'],
      ['1', '1'],
    ]),
    xA: m('', [
      ['0', '3/2'],
      ['1', '-1'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: '3×3 tersi formülsüz bulunur mu?',
      body: 'Ek matris uzun sürer. Satır işlemleriyle daha düzenli bir yol var.',
      scene: { items: ['A'] },
      claims: [{ kind: 'det', matrix: 'A', equals: '4' }],
    },
    {
      id: 'method',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: '$[A \\mid I]$ yaz, solu $I$ yap',
      body: 'Sol $I$ olunca sağda {ok}A⁻¹{/ok} kalır. Önce köşegenin altı.',
      scene: { items: ['Start'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['Start', 1, 0], tone: 'col' },
              { cell: ['Start', 2, 0], tone: 'col' },
              { cell: ['Start', 2, 1], tone: 'col' },
            ],
            note: 'önce bunlar 0',
          },
        ],
      },
    },
    {
      id: 'try-first',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$R_3 \\to R_3 - R_1$ sonrası 3. satırın 2. elemanı kaç?',
      skill: 'row-operations',
      scene: { items: ['Start'] },
      answer: '-2',
      feedbackWrong: '$0 - 2$.',
      reveal: {
        kind: 'rowOps',
        matrix: 'Start',
        ops: [{ kind: 'addMultiple', target: 2, source: 0, factor: '-1' }],
        result: 'S1',
      },
      solution: '$0 - 2 = -2$.',
      claims: [{ kind: 'exprEntry', expr: 'S1', row: 3, col: 2, equals: '-2', answer: true }],
    },
    {
      id: 'method-down',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: 'Altı bitir, pivotu 1 yap',
      body: '$R_3 \\to R_3 + 2R_2$, sonra $\\frac{1}{4}$ ile çarp.',
      scene: { items: ['S1'] },
      beat: {
        kind: 'rowOps',
        matrix: 'S1',
        ops: [
          { kind: 'addMultiple', target: 2, source: 1, factor: '2' },
          { kind: 'scale', row: 2, factor: '1/4' },
        ],
        result: 'Mid',
      },
    },
    {
      id: 'method-up',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: 'Sonra köşegenin üstünü sıfırla',
      body: 'Alttan yukarı temizle. Sağda kalan: {ok}A⁻¹{/ok}.',
      scene: { items: ['Mid'] },
      beat: {
        kind: 'rowOps',
        matrix: 'Mid',
        ops: [
          { kind: 'addMultiple', target: 1, source: 2, factor: '-1' },
          { kind: 'addMultiple', target: 0, source: 1, factor: '-2' },
        ],
        result: 'End',
      },
      claims: [
        {
          kind: 'derived',
          of: 'inverse',
          matrix: 'A',
          equals: [
            ['1/2', '-1', '1/2'],
            ['1/4', '1/2', '-1/4'],
            ['-1/4', '1/2', '1/4'],
          ],
        },
      ],
    },
    {
      id: 'singular',
      kind: 'explain',
      eyebrow: 'Durum',
      title: 'Solda sıfır satır çıkarsa ters yok',
      body: 'Solda {ok}sıfır satır{/ok}: sol asla $I$ olamaz. $|B| = 0$, $B$ singüler.',
      scene: { items: ['T'] },
      beat: {
        kind: 'rowOps',
        matrix: 'T',
        ops: [{ kind: 'addMultiple', target: 1, source: 0, factor: '-2' }],
        result: 'TEnd',
      },
    },
    {
      id: 'try-entry',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$C^{-1}$’in 2. satır 1. sütun elemanı kaç?',
      body: '2×2 kısa yolu: köşegeni değiştir, diğerlerinin işaretini çevir.',
      skill: 'inverse-2x2',
      scene: { items: ['C'] },
      answer: '-5',
      feedbackWrong: '$|C| = 6 - 5 = 1$. Köşegeni değiştir, diğer ikisinin işaretini çevir.',
      reveal: {
        kind: 'equation',
        lines: ['|C| = 6 - 5 = 1', 'C^{-1} = \\begin{bmatrix} 3 & -1 \\\\ -5 & 2 \\end{bmatrix}'],
      },
      solution: '$C^{-1}$’in satırları $(3, -1)$ ve $(-5, 2)$.',
      claims: [{ kind: 'derivedEntry', of: 'inverse', matrix: 'C', row: 2, col: 1, equals: '-5' }],
    },
    {
      id: 'rules',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Tersin kuralları',
      body: 'Çarpımda {ok}sıra ters döner{/ok}: önce ayakkabı çıkar, sonra çorap.',
      beat: {
        kind: 'equation',
        lines: ['(AB)^{-1} = B^{-1}A^{-1}', '(A^T)^{-1} = (A^{-1})^T', '(kA)^{-1} = \\tfrac{1}{k}A^{-1}'],
      },
      claims: [
        {
          kind: 'expr',
          expr: '(AB)^{-1} - B^{-1}A^{-1}',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
          where: { A: 'xP', B: 'xQ' },
        },
        {
          kind: 'expr',
          expr: '(A^T)^{-1} - (A^{-1})^T',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
          where: { A: 'xP' },
        },
        {
          kind: 'expr',
          expr: '(3A)^{-1} - 1/3A^{-1}',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
          where: { A: 'xQ' },
        },
      ],
    },
    {
      id: 'try-rules',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$(ABC)^{-1}$ hangisi?',
      skill: 'inverse-rules',
      options: [
        {
          key: 'a',
          content: [text('$A^{-1}B^{-1}C^{-1}$')],
          errorType: 'order-kept',
          feedback: 'Sıra ters döner: en son giyilen ilk çıkar.',
        },
        { key: 'b', content: [text('$C^{-1}B^{-1}A^{-1}$')] },
        {
          key: 'c',
          content: [text('$C^{-1}A^{-1}B^{-1}$')],
          errorType: 'order-partial',
          feedback: 'Tamamen ters sırada: $C$, sonra $B$, sonra $A$.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: ['(ABC)^{-1} = C^{-1}(AB)^{-1}', '= C^{-1}B^{-1}A^{-1}'],
      },
      solution: '$(ABC)^{-1} = C^{-1}B^{-1}A^{-1}$.',
    },
    {
      id: 'identity',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: 'Bir özdeşlikten ters: $A$’yı paranteze al',
      body: '$I$’lı terimi yalnız bırak, $A$’yı paranteze al. Eleman hesabı yok.',
      scene: { items: ['H'] },
      beat: {
        kind: 'equation',
        lines: ['A^2 - 4A + I = 0', 'A(A - 4I) = -I', 'A(4I - A) = I', 'A^{-1} = 4I - A'],
      },
      claims: [
        {
          kind: 'expr',
          expr: 'H^2 - 4H + I',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
        },
        {
          kind: 'expr',
          expr: 'H^{-1} - (4I - H)',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
        },
      ],
    },
    {
      id: 'exam-identity',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$2A^3 - 5A + 3I = 0$ ise $A^{-1}$ hangisidir?',
      skill: 'inverse-from-identity',
      options: [
        {
          key: 'a',
          content: [text('$\\frac{1}{3}(2A^2 - 5I)$')],
          errorType: 'lost-sign',
          feedback: '$A(2A^2 - 5I) = -3I$: sağda eksi var, $-\\frac{1}{3}$ ile böl.',
        },
        { key: 'b', content: [text('$\\frac{1}{3}(5I - 2A^2)$')] },
        {
          key: 'c',
          content: [text('$5I - 2A^2$')],
          errorType: 'forgot-divide',
          feedback: '$A(5I - 2A^2) = 3I$, $I$ değil: $3$’e bölmek gerek.',
        },
        {
          key: 'd',
          content: [text('$\\frac{1}{3}(5A - 2A^2)$')],
          errorType: 'factor-slip',
          feedback: '$2A^3 - 5A$’dan $A$ çekince $2A^2 - 5I$ kalır; $5A$ değil.',
        },
        {
          key: 'e',
          content: [text('$\\frac{1}{5}(2A^2 + 3I)$')],
          errorType: 'wrong-term-isolated',
          feedback: 'Yalnız bırakılacak terim $I$’lı olan: $3I$. $A$ çarpanı diğer iki terimden çekilir.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: ['2A^3 - 5A = -3I', 'A(2A^2 - 5I) = -3I', 'A \\cdot \\tfrac{1}{3}(5I - 2A^2) = I'],
      },
      solution:
        '$A(2A^2 - 5I) = -3I$, iki yanı $-\\frac{1}{3}$ ile çarp: $A^{-1} = \\frac{1}{3}(5I - 2A^2)$.',
      claims: [
        {
          kind: 'expr',
          expr: '2A^3 - 5A + 3I',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
          where: { A: 'xA' },
        },
        { kind: 'optionExpr', expr: 'A^{-1}', where: { A: 'xA' } },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Ters matris',
      points: [
        '$[A \\mid I]$’yı satır işlemleriyle $[I \\mid A^{-1}]$’e getir: önce köşegenin altı, sonra üstü.',
        'Solda sıfır satır çıkarsa $|A| = 0$, ters yok.',
        '$(AB)^{-1} = B^{-1}A^{-1}$, $(A^T)^{-1} = (A^{-1})^T$, $(kA)^{-1} = \\frac{1}{k}A^{-1}$.',
        'Özdeşlikten ters: $I$’lı terimi yalnız bırak, $A$’yı ortak çarpan yap, sağ taraf $I$ olacak şekilde böl.',
      ],
    },
  ],
  moment: {
    id: 'moment-diagonal',
    kind: 'choice',
    eyebrow: 'Gizli an',
    title: 'Hesaplamadan söyle: $D^{-1}$’in köşegeni ne?',
    body: '$[D \\mid I]$ yazmana gerek yok.',
    skill: 'inverse-diagonal',
    scene: { items: ['D'] },
    options: [
      {
        key: 'a',
        content: [text('$(-2,\\ 1,\\ -4)$')],
        errorType: 'negated',
        feedback:
          'Ters, işaret çevirmek değil: $D \\cdot D^{-1} = I$ olmalı. $2 \\cdot (-2) = -4$, $1$ değil.',
      },
      { key: 'b', content: [text('$(\\tfrac{1}{2},\\ -1,\\ \\tfrac{1}{4})$')] },
      {
        key: 'c',
        content: [text('$(\\tfrac{1}{2},\\ 1,\\ \\tfrac{1}{4})$')],
        errorType: 'dropped-sign',
        feedback: '$-1$’in tersi yine $-1$: $(-1)(-1) = 1$.',
      },
    ],
    answer: 'b',
    reveal: {
      kind: 'frames',
      frames: [
        {
          clear: true,
          marks: [
            { cell: ['D', 0, 0], tone: 'ok' },
            { cell: ['D', 1, 1], tone: 'ok' },
            { cell: ['D', 2, 2], tone: 'ok' },
          ],
          note: 'Her köşegen elemanının tersi: 1/2, −1, 1/4',
        },
      ],
    },
    solution:
      'Köşegen matrisi çarpmak her satırı kendi köşegen elemanıyla çarpmaktır. Geri almak için her elemanın tersiyle çarparsın: $D^{-1}$ köşegeni $\\frac{1}{2}, -1, \\frac{1}{4}$ olan köşegen matris.',
    claims: [
      {
        kind: 'derived',
        of: 'inverse',
        matrix: 'D',
        equals: [
          ['1/2', '0', '0'],
          ['0', '-1', '0'],
          ['0', '0', '1/4'],
        ],
      },
    ],
  },
}
