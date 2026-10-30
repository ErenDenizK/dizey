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
      eyebrow: 'Fikir',
      title: 'Ters matris, yapılanı geri alır',
      body: '$A^{-1}$, $AA^{-1} = A^{-1}A = I$ olan matristir. Ek matris formülü küçük matrislerde iyi; 3×3 ve üstünde daha düzenli yol satır işlemleri. D4’teki $A$’nın tersini şimdi bu yolla bulacağız.',
      scene: { items: ['A'] },
      claims: [{ kind: 'det', matrix: 'A', equals: '4' }],
    },
    {
      id: 'method',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: '$[A \\mid I]$ yaz, solu $I$ olana kadar satır işlemi yap',
      body: 'Her satır işlemi bir matrisle soldan çarpmaktır. Sol taraf $I$ olduğunda bu işlemlerin çarpımı $A^{-1}$ olur; aynı işlemler sağdaki $I$’yı da $A^{-1}$’e çevirir. Önce köşegenin altını sıfırla.',
      scene: { items: ['Start'] },
      beat: {
        kind: 'rowOps',
        matrix: 'Start',
        ops: [
          { kind: 'addMultiple', target: 2, source: 0, factor: '-1' },
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
      body: 'Alttan yukarı çalış: 3. satırdaki pivotla 2. satırı, 2. satırdaki pivotla 1. satırı temizle. Sağda kalan, D4’te $\\frac{1}{|A|}\\text{Ek}(A)$ ile bulduğumuz matrisin aynısı.',
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
      body: '$B$’nin 2. satırı 1. satırın iki katı. $R_2 \\to R_2 - 2R_1$ sol tarafta bir {ok}sıfır satır{/ok} bırakır: sol taraf asla $I$ olamaz. Bu, $|B| = 0$ demektir; $B$ singülerdir.',
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
      body: '2×2 kısa yolunu ya da $[C \\mid I]$’yı kullan.',
      skill: 'inverse-2x2',
      scene: { items: ['C'] },
      answer: '-5',
      feedbackWrong: '$|C| = 6 - 5 = 1$. Köşegeni değiştir, diğer ikisinin işaretini çevir.',
      solution: '$C^{-1}$’in satırları $(3, -1)$ ve $(-5, 2)$.',
      claims: [{ kind: 'derivedEntry', of: 'inverse', matrix: 'C', row: 2, col: 1, equals: '-5' }],
    },
    {
      id: 'rules',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Tersin kuralları',
      body: '$(AB)^{-1} = B^{-1}A^{-1}$: {ok}sıra ters döner{/ok}, tıpkı ayakkabıyı çorabı çıkarmadan önce çıkarmak gibi. Ayrıca $(A^T)^{-1} = (A^{-1})^T$, $(kA)^{-1} = \\frac{1}{k}A^{-1}$ ve $(A^{-1})^{-1} = A$ ($A$, $B$ tersinir, $k \\neq 0$ iken).',
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
      id: 'identity',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: 'Bir özdeşlikten ters: $A$’yı paranteze al',
      body: '$A^2 - 4A + I = 0$ olsun. $I$’yı yalnız bırak: $A^2 - 4A = -I$. $A$’yı ortak çarpan yap: $A(A - 4I) = -I$, yani $A(4I - A) = I$. Hiç eleman hesaplamadan {ok}tersi bulduk: $A^{-1} = 4I - A$.{/ok}',
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
}
