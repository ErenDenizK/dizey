import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** R3: rank as the number of pivots, its bounds, and the square invertibility test. */
export const r3Rank: Lesson = {
  id: 'r3-rank',
  node: 'R3',
  title: 'Rank',
  matrices: {
    F: m('A =', [
      ['1', '2', '0', '3'],
      ['2', '4', '1', '8'],
      ['1', '2', '1', '5'],
    ]),
    rF: m('', [
      ['1', '2', '0', '3'],
      ['0', '0', '1', '2'],
      ['0', '0', '0', '0'],
    ]),
    H: m('B =', [
      ['1', '2', '3'],
      ['2', '4', '6'],
      ['1', '1', '1'],
    ]),
  },
  steps: [
    {
      id: 'definition',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Rank: eşelon formdaki sıfır olmayan satır sayısı',
      body: 'Matrisi eşelon forma getir, pivotları say. Burada 3. satır diğer ikisinden üretilebiliyor ($R_3 = R_2 - R_1$) ve sıfırlanıyor: {ok}rank 2{/ok}. Rank, matristeki birbirinden bağımsız bilgi sayısıdır.',
      scene: { items: ['F'] },
      beat: {
        kind: 'rowOps',
        matrix: 'F',
        ops: [
          { kind: 'addMultiple', target: 1, source: 0, factor: '-2' },
          { kind: 'addMultiple', target: 2, source: 0, factor: '-1' },
          { kind: 'addMultiple', target: 2, source: 1, factor: '-1' },
        ],
        result: 'rF',
      },
      claims: [{ kind: 'rank', matrix: 'F', equals: '2' }],
    },
    {
      id: 'bounds',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Rank, satır ve sütun sayısını aşamaz',
      body: 'm×n bir matriste $\\text{rank}(A) \\leq \\min(m, n)$. Satır rankı sütun rankına eşittir, bu yüzden $\\text{rank}(A^T) = \\text{rank}(A)$. Eşelon formu tamamlamak yeter; indirgenmiş forma gitmek gerekmez.',
      scene: { items: ['F'] },
      claims: [{ kind: 'rank', matrix: 'F', equals: '2' }],
    },
    {
      id: 'square',
      kind: 'explain',
      eyebrow: 'Bağlantı',
      title: 'Kare matriste: rank $n$ ⇔ tersinir ⇔ $|A| \\neq 0$',
      body: '$B$’nin 2. satırı 1. satırın iki katı: rank en fazla $2$, yani $3$’ten küçük. Bu yüzden {ok}$|B| = 0$ ve $B$’nin tersi yok{/ok}.',
      scene: { items: ['H'] },
      claims: [
        { kind: 'rank', matrix: 'H', equals: '2' },
        { kind: 'det', matrix: 'H', equals: '0' },
      ],
    },
    {
      id: 'try-rank',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$\\text{rank}(B)$ kaçtır?',
      skill: 'rank',
      scene: { items: ['H'] },
      options: [
        {
          key: 'a',
          content: [text('$1$')],
          errorType: 'over-reduced',
          feedback: '3. satır $(1, 1, 1)$ ilk satırın katı değil; iki bağımsız satır kalır.',
        },
        { key: 'b', content: [text('$2$')] },
        {
          key: 'c',
          content: [text('$3$')],
          errorType: 'counted-rows',
          feedback: 'Satır sayısı değil, eşelon formdaki sıfır olmayan satır sayısı: 2. satır sıfırlanır.',
        },
        {
          key: 'd',
          content: [text('$0$')],
          errorType: 'det-as-rank',
          feedback: '$|B| = 0$ rankın $3$’ten küçük olduğunu söyler, $0$ olduğunu değil.',
        },
      ],
      answer: 'b',
      solution: '$R_2 \\to R_2 - 2R_1$ sıfır satır verir; $R_1$ ve $R_3$ bağımsız: rank $2$.',
      claims: [{ kind: 'rank', matrix: 'H', equals: '2', answer: true }],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Rank',
      points: [
        'Rank = eşelon formdaki pivot sayısı.',
        '$\\text{rank}(A) \\leq \\min(m, n)$, $\\text{rank}(A^T) = \\text{rank}(A)$.',
        'n×n matris: rank $n$ ⇔ $|A| \\neq 0$ ⇔ tersinir.',
        'Sistemlerde: $r_A$ ve $r_B$ çözüm sayısını belirler.',
      ],
    },
  ],
}
