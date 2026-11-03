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
    Y: m('A =', [
      ['1', '2', '0', '1'],
      ['0', '1', '1', '2'],
      ['1', '4', '2', '5'],
    ]),
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
    rH: m('', [
      ['1', '2', '3'],
      ['0', '-1', '-2'],
      ['0', '0', '0'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Kaç satır gerçekten yeni bilgi taşıyor?',
      body: 'Üç satır var. Ama biri diğer ikisinden üretilebiliyor olabilir.',
      scene: { items: ['F'] },
    },
    {
      id: 'definition',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Rank: pivot sayısı',
      body: 'Eşelon forma getir, sıfır olmayan satırları say: {ok}rank 2{/ok}.',
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
      id: 'try-rank',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$\\text{rank}(B)$ kaçtır?',
      body: '2. satıra dikkat.',
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
          feedback: 'Satır sayısı değil, pivot sayısı: 2. satır sıfırlanır.',
        },
        {
          key: 'd',
          content: [text('$0$')],
          errorType: 'det-as-rank',
          feedback: 'Rank 0 yalnız sıfır matriste olur.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'rowOps',
        matrix: 'H',
        ops: [
          { kind: 'addMultiple', target: 1, source: 0, factor: '-2' },
          { kind: 'addMultiple', target: 2, source: 0, factor: '-1' },
          { kind: 'swap', a: 1, b: 2 },
        ],
        result: 'rH',
      },
      solution: '$R_2 - 2R_1$ sıfır satır verir; iki pivot kalır: rank $2$.',
      claims: [{ kind: 'rank', matrix: 'H', equals: '2', answer: true }],
    },
    {
      id: 'bounds',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Rank, satır ve sütun sayısını aşamaz',
      body: 'Her pivot ayrı bir satırda ve ayrı bir sütunda. $\\text{rank}(A^T) = \\text{rank}(A)$: satır rankı sütun rankına eşit. Üst sınıra ulaşan matris tam ranklıdır.',
      beat: { kind: 'equation', lines: ['\\text{rank}(A) \\leq \\min(m, n)'] },
      scene: { items: ['F'] },
      claims: [{ kind: 'rank', matrix: 'F', equals: '2' }],
    },
    {
      id: 'try-bounds',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '3×5 bir matrisin rankı en fazla kaç?',
      skill: 'rank',
      options: [
        { key: 'a', content: [text('$3$')] },
        {
          key: 'b',
          content: [text('$5$')],
          errorType: 'max-instead-of-min',
          feedback: 'Pivotlar ayrı satırlarda: 3 satır, en fazla 3 pivot.',
        },
        {
          key: 'c',
          content: [text('$15$')],
          errorType: 'counted-entries',
          feedback: '15 eleman sayısı; rank satır ve sütun sayısının küçüğünü aşamaz.',
        },
      ],
      answer: 'a',
      reveal: { kind: 'equation', lines: ['\\text{rank} \\leq \\min(3, 5) = 3'] },
      solution: '$\\min(3, 5) = 3$.',
    },
    {
      id: 'square',
      kind: 'explain',
      eyebrow: 'Bağlantı',
      title: 'Kare matriste: rank $n$ ⇔ $|A| \\neq 0$',
      body: '$B$’nin rankı 2, yani 3’ten küçük: {ok}$|B| = 0$, tersi yok{/ok}.',
      scene: { items: ['H'] },
      beat: { kind: 'equation', lines: ['\\text{rank} = n \\iff |A| \\neq 0 \\iff A^{-1} \\text{ var}'] },
      claims: [
        { kind: 'rank', matrix: 'H', equals: '2' },
        { kind: 'det', matrix: 'H', equals: '0' },
      ],
    },
    {
      id: 'try-invertible',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '4×4 bir matrisin rankı 3. Tersi var mı?',
      skill: 'rank',
      options: [
        {
          key: 'a',
          content: [text('Var')],
          errorType: 'rank-invertible',
          feedback: 'Tersi için rank 4 olmalı.',
        },
        { key: 'b', content: [text('Yok')] },
        {
          key: 'c',
          content: [text('Matrise bağlı')],
          errorType: 'rank-invertible',
          feedback: 'Rank 3 < 4 her zaman $|A| = 0$ demektir.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['3 < 4 \\Rightarrow |A| = 0', '\\Rightarrow A^{-1} \\text{ yok}'] },
      solution: 'Rank $3 < 4$: $|A| = 0$, tersi yok.',
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
  moment: {
    id: 'moment-hidden-row',
    kind: 'choice',
    eyebrow: 'Gizli an',
    title: 'Hesaplamadan söyle: $\\text{rank}(A)$ kaç?',
    body: 'Üçüncü satır gerçekten yeni mi?',
    skill: 'rank-dependent-rows',
    scene: { items: ['Y'] },
    options: [
      {
        key: 'a',
        content: [text('$1$')],
        errorType: 'over-reduced',
        feedback: 'İlk iki satır birbirinin katı değil; en az iki pivot var.',
      },
      { key: 'b', content: [text('$2$')] },
      {
        key: 'c',
        content: [text('$3$')],
        errorType: 'counted-rows',
        feedback: 'Satır saydın. 3. satır ilk ikisinden üretiliyor.',
      },
    ],
    answer: 'b',
    reveal: {
      kind: 'frames',
      frames: [
        {
          clear: true,
          marks: [
            { cell: ['Y', 0, '*'], tone: 'row' },
            { cell: ['Y', 1, '*'], tone: 'row' },
          ],
          note: '$R_1$ ve $R_2$',
        },
        { marks: [{ cell: ['Y', 2, '*'], tone: 'ok' }], note: '$R_3 = R_1 + 2R_2$ ⇒ rank 2' },
      ],
    },
    solution:
      '$(1, 4, 2, 5) = (1, 2, 0, 1) + 2 \\cdot (0, 1, 1, 2)$. Üçüncü satır yeni bilgi taşımıyor, ilk ikisi bağımsız: rank $2$.',
    claims: [{ kind: 'rank', matrix: 'Y', equals: '2', answer: true }],
  },
}
