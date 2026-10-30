import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** R1: the three elementary row operations and row-equivalent matrices. */
export const r1RowOperations: Lesson = {
  id: 'r1-row-operations',
  node: 'R1',
  title: 'Elemanter satır işlemleri',
  matrices: {
    E: m('A =', [
      ['2', '4', '-2'],
      ['1', '3', '0'],
      ['3', '1', '5'],
    ]),
    E1: m('', [
      ['1', '3', '0'],
      ['2', '4', '-2'],
      ['3', '1', '5'],
    ]),
    E2: m('B =', [
      ['1', '3', '0'],
      ['0', '-2', '-2'],
      ['0', '-8', '5'],
    ]),
  },
  steps: [
    {
      id: 'three-ops',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Üç işlem, başka yok',
      body: '1) İki satırın yerini değiştir: $R_i \\leftrightarrow R_j$. 2) Bir satırı sıfır olmayan bir sayıyla çarp: $R_i \\to kR_i$, $k \\neq 0$. 3) Bir satıra başka bir satırın katını ekle: $R_i \\to R_i + kR_j$. Önce pivotu kolay olsun diye $R_1 \\leftrightarrow R_2$:',
      scene: { items: ['E'] },
      beat: { kind: 'rowOps', matrix: 'E', ops: [{ kind: 'swap', a: 0, b: 1 }], result: 'E1' },
    },
    {
      id: 'eliminate',
      kind: 'explain',
      eyebrow: 'Örnek',
      title: 'Pivotun altını sıfırla',
      body: '$R_2 \\to R_2 - 2R_1$ ve $R_3 \\to R_3 - 3R_1$. Çarpanı pivottan oku: sıfırlanacak sayı bölü pivot.',
      scene: { items: ['E1'] },
      beat: {
        kind: 'rowOps',
        matrix: 'E1',
        ops: [
          { kind: 'addMultiple', target: 1, source: 0, factor: '-2' },
          { kind: 'addMultiple', target: 2, source: 0, factor: '-3' },
        ],
        result: 'E2',
      },
    },
    {
      id: 'equivalent',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Denk matrisler: $A \\sim B$',
      body: 'Satır işlemleriyle birbirine dönüşen matrisler denktir. Her işlem geri alınabilir (değiştirmeyi tekrar et, $\\frac{1}{k}$ ile çarp, katı geri çıkar), bu yüzden {ok}denklik iki yönlüdür{/ok}. Denk matrislerin rankı aynıdır ve bir sisteme uygulanınca çözüm kümesi değişmez.',
      scene: { items: ['E', 'E2'] },
      claims: [
        { kind: 'rank', matrix: 'E', equals: '3' },
        { kind: 'rank', matrix: 'E2', equals: '3' },
      ],
    },
    {
      id: 'determinant-effect',
      kind: 'explain',
      eyebrow: 'Bağlantı',
      title: 'Determinanta etkileri',
      body: 'Yer değiştirme işareti çevirir, $k$ ile çarpma determinantı $k$ ile çarpar, kat ekleme değiştirmez. Burada bir yer değiştirme yaptık: $|B| = -|A|$.',
      scene: { items: ['E', 'E2'] },
      claims: [
        { kind: 'det', matrix: 'E', equals: '26' },
        { kind: 'det', matrix: 'E2', equals: '-26' },
      ],
    },
    {
      id: 'try-which',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi elemanter satır işlemi değildir?',
      skill: 'row-operations',
      options: [
        {
          key: 'a',
          content: [text('$R_2 \\to R_2 - 3R_1$')],
          errorType: 'rule-misread',
          feedback: 'Bir satıra başka satırın katını eklemek (burada $-3$ katı) üçüncü işlemdir.',
        },
        {
          key: 'b',
          content: [text('$R_1 \\leftrightarrow R_3$')],
          errorType: 'rule-misread',
          feedback: 'İki satırın yer değiştirmesi birinci işlemdir.',
        },
        { key: 'c', content: [text('$R_3 \\to 0 \\cdot R_3$')] },
        {
          key: 'd',
          content: [text('$R_2 \\to -\\frac{1}{2}R_2$')],
          errorType: 'rule-misread',
          feedback: 'Sıfır olmayan bir sayıyla çarpmak serbest; kesir ya da negatif olabilir.',
        },
      ],
      answer: 'c',
      solution: '$0$ ile çarpmak satırı siler ve geri alınamaz; bu yüzden elemanter işlem değildir.',
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Elemanter satır işlemleri',
      points: [
        '$R_i \\leftrightarrow R_j$, $R_i \\to kR_i$ ($k \\neq 0$), $R_i \\to R_i + kR_j$.',
        'Her işlem geri alınabilir; denk matrislerin rankı aynı.',
        'Determinant: yer değiştirme $-1$, $k$ ile çarpma $k$, kat ekleme $1$ katına çevirir.',
      ],
    },
  ],
}
