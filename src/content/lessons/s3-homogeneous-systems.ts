import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** S3: Ax = 0 always has x = 0; non-trivial solutions exist exactly when r_A < n (|A| = 0 if square). */
export const s3HomogeneousSystems: Lesson = {
  id: 's3-homogeneous-systems',
  node: 'S3',
  title: 'Homojen sistemler',
  matrices: {
    H: m('A =', [
      ['1', '2', '-1'],
      ['2', '5', '1'],
      ['1', '3', '2'],
    ]),
    hV: m('', [['7'], ['-3'], ['1']]),
    W: m('A =', [
      ['1', '2', '-1', '3'],
      ['2', '1', '0', '1'],
    ]),
    K: m('A =', [
      ['1', '2', '1'],
      ['2', 'k', '3'],
      ['1', '1', '2'],
    ]),
    KZ: {
      kind: 'matrix',
      delimiter: 'brackets',
      rows: [
        ['1', '2', '1', '0'],
        ['2', 'k', '3', '0'],
        ['1', '1', '2', '0'],
      ],
      label: '$[A \\mid 0]$ =',
      augmentedAt: 3,
    },
  },
  steps: [
    {
      id: 'trivial',
      kind: 'explain',
      eyebrow: 'Gözlem',
      title: '$Ax = 0$ her zaman çözülür',
      body: 'Sağ taraf sıfırsa $x = 0$ her denklemi sağlar: buna {ok}aşikâr (trivial) çözüm{/ok} denir. Bu yüzden homojen bir sistem asla "çözümsüz" olamaz. Tek soru şu: $0$’dan başka çözüm var mı?',
      scene: { items: ['H'] },
    },
    {
      id: 'nontrivial',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Aşikâr olmayan çözüm ⇔ $r_A < n$',
      body: '$r_A = n$ ise tek çözüm, o da $0$. $r_A < n$ ise $n - r_A$ serbest değişken, yani sonsuz çözüm. Kare $A$ için bu, {ok}$|A| = 0$ demek{/ok}. Burada $|A| = 0$, $r_A = 2$: çözümler $t(7, -3, 1)$.',
      scene: { items: ['H', 'hV'] },
      claims: [
        { kind: 'det', matrix: 'H', equals: '0' },
        { kind: 'rank', matrix: 'H', equals: '2' },
        { kind: 'expr', expr: 'HhV', equals: [['0'], ['0'], ['0']] },
      ],
    },
    {
      id: 'wide',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Bilinmeyen sayısı denklem sayısından fazlaysa',
      body: '2 denklem, 4 bilinmeyen: $r_A \\leq 2 < 4$. Hiç hesap yapmadan {ok}sonsuz çözüm var{/ok}; en az $4 - 2 = 2$ serbest değişken.',
      scene: { items: ['W'] },
      claims: [{ kind: 'rank', matrix: 'W', equals: '2' }],
    },
    {
      id: 'try-k',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: 'Sistemin aşikâr olmayan çözümü olması için $k$ kaç olmalı?',
      body: 'Kare sistem: $|A| = 0$ koşulunu yaz.',
      skill: 'homogeneous-parameter',
      scene: { items: ['K'] },
      answer: '3',
      feedbackWrong: '1. satırdan aç: $1(2k - 3) - 2(4 - 3) + 1(2 - k)$.',
      solution: '$|A| = k - 3 = 0$, $k = 3$.',
      claims: [{ kind: 'detRoots', matrix: 'K', variable: 'k', roots: ['3'], answer: true }],
    },
    {
      id: 'exam-homogeneous',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$k = 3$ için $Ax = 0$ sistemi hakkında hangisi doğrudur?',
      skill: 'classify-homogeneous',
      scene: { items: ['K'] },
      options: [
        {
          key: 'a',
          content: [text('Tek çözüm')],
          errorType: 'det-zero-ignored',
          feedback: '$k = 3$’te $|A| = 0$: sıfırdan başka çözümler de var.',
        },
        { key: 'b', content: [text('Sonsuz çözüm')] },
        {
          key: 'c',
          content: [text('Çözüm yok')],
          errorType: 'homogeneous-no-solution',
          feedback: 'Homojen sistem her zaman $x = 0$’ı çözüm olarak kabul eder; "çözüm yok" olamaz.',
        },
      ],
      answer: 'b',
      solution: '$|A| = 0$, $r_A = 2 < 3$: bir serbest değişken, sonsuz çözüm.',
      claims: [
        { kind: 'rank', matrix: 'K', at: { k: '3' }, equals: '2' },
        { kind: 'system', matrix: 'KZ', at: { k: '3' }, is: 'infinite', answer: true },
        { kind: 'system', matrix: 'KZ', at: { k: '0' }, is: 'unique' },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Homojen sistemler',
      points: [
        '$Ax = 0$ her zaman $x = 0$ çözümüne sahiptir; "çözüm yok" şıkkı yanlıştır.',
        'Aşikâr olmayan çözüm ⇔ $r_A < n$ ⇔ (kare ise) $|A| = 0$.',
        'Bilinmeyen sayısı denklem sayısından fazlaysa her zaman sonsuz çözüm.',
        'Serbest değişken sayısı $n - r_A$.',
      ],
    },
  ],
}
