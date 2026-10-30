import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

/** S2: systems with a parameter k: the determinant finds the critical values, ranks settle each one. */
export const s2ParametricSystems: Lesson = {
  id: 's2-parametric-systems',
  node: 'S2',
  title: 'Parametreli sistemler',
  matrices: {
    K: {
      kind: 'matrix',
      delimiter: 'brackets',
      rows: [
        ['1', '1', 'k', '1'],
        ['1', 'k', '1', '1'],
        ['k', '1', '1', '1'],
      ],
      label: '$[A \\mid b]$ =',
      augmentedAt: 3,
    } satisfies MatrixBlock,
    KA: {
      kind: 'matrix',
      delimiter: 'bars',
      rows: [
        ['1', '1', 'k'],
        ['1', 'k', '1'],
        ['k', '1', '1'],
      ],
      label: '$|A|$ =',
    } satisfies MatrixBlock,
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Tek bir $k$ her şeyi değiştirir',
      body: '$x + y + kz = 1$, $x + ky + z = 1$, $kx + y + z = 1$. Bazı $k$ değerlerinde tek çözüm, bazılarında sonsuz, bazılarında hiç çözüm yok. Görev: {ok}her $k$ için hangisi olduğunu{/ok} bir tabloda vermek.',
      scene: { items: ['K'] },
    },
    {
      id: 'determinant',
      kind: 'explain',
      eyebrow: 'Adım 1',
      title: 'Önce determinant: kritik $k$ değerleri',
      body: 'Kare sistemde $|A| \\neq 0$ ise tek çözüm vardır. $|A| = -(k - 1)^2(k + 2)$, yani yalnız {ok}$k = 1$ ve $k = -2$ şüpheli{/ok}. Diğer bütün $k$ değerlerinde, örneğin $k = 0$’da, tek çözüm.',
      scene: { items: ['KA'] },
      claims: [
        { kind: 'detRoots', matrix: 'KA', variable: 'k', roots: ['1', '-2'] },
        { kind: 'det', matrix: 'KA', at: { k: '0' }, equals: '-2' },
        { kind: 'system', matrix: 'K', at: { k: '0' }, is: 'unique' },
      ],
    },
    {
      id: 'k-one',
      kind: 'explain',
      eyebrow: 'Adım 2',
      title: '$k = 1$: üç denklem aynı',
      body: 'Üç denklem de $x + y + z = 1$ olur. $r_A = r_B = 1 < 3$: sonsuz çözüm, $3 - 1 = 2$ serbest değişken.',
      scene: { items: ['K'] },
      claims: [
        { kind: 'rank', matrix: 'K', columns: 3, at: { k: '1' }, equals: '1' },
        { kind: 'rank', matrix: 'K', at: { k: '1' }, equals: '1' },
        { kind: 'system', matrix: 'K', at: { k: '1' }, is: 'infinite' },
      ],
    },
    {
      id: 'k-minus-two',
      kind: 'explain',
      eyebrow: 'Adım 3',
      title: '$k = -2$: denklemler çelişir',
      body: 'Üç denklemi topla: sol taraf $(1 + 1 - 2)(x + y + z) = 0$, sağ taraf $3$. {ok}$0 = 3$ olamaz{/ok}: $r_A = 2$, $r_B = 3$, çözüm yok.',
      scene: { items: ['K'] },
      claims: [
        { kind: 'rank', matrix: 'K', columns: 3, at: { k: '-2' }, equals: '2' },
        { kind: 'rank', matrix: 'K', at: { k: '-2' }, equals: '3' },
        { kind: 'system', matrix: 'K', at: { k: '-2' }, is: 'none' },
      ],
    },
    {
      id: 'table',
      kind: 'explain',
      eyebrow: 'Sonuç',
      title: 'Durum tablosu',
      body: 'Sınavda istenen cevap bu üç satır. Bir durumu atlamak en sık kayıp: determinantın her kökünü ayrı ayrı yerine koy.',
      beat: {
        kind: 'equation',
        lines: [
          'k \\neq 1,\\ k \\neq -2: \\text{ tek çözüm}',
          'k = 1: \\text{ sonsuz çözüm}',
          'k = -2: \\text{ çözüm yok}',
        ],
      },
    },
    {
      id: 'exam-none',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: 'Sistemin çözümü olmaması için $k$ kaç olmalıdır?',
      skill: 'parametric-case',
      scene: { items: ['K'] },
      options: [
        {
          key: 'a',
          content: [text('$1$')],
          errorType: 'root-not-checked',
          feedback: '$k = 1$ determinantı sıfırlar ama denklemler çelişmez, hepsi aynı: sonsuz çözüm.',
        },
        { key: 'b', content: [text('$-2$')] },
        {
          key: 'c',
          content: [text('$0$')],
          errorType: 'zero-guess',
          feedback: '$k = 0$’da $|A| = -2 \\neq 0$: tek çözüm.',
        },
        {
          key: 'd',
          content: [text('$2$')],
          errorType: 'sign-slip',
          feedback: 'Kök $k + 2 = 0$’dan gelir: $k = -2$. $k = 2$’de $|A| \\neq 0$.',
        },
        {
          key: 'e',
          content: [text('$-1$')],
          errorType: 'sign-slip',
          feedback: '$(k - 1)^2$ çarpanının kökü $+1$’dir; $k = -1$’de $|A| \\neq 0$.',
        },
      ],
      answer: 'b',
      solution: 'Kritik değerler $1$ ve $-2$. $k = 1$ sonsuz çözüm, $k = -2$ çözüm yok.',
      claims: [{ kind: 'optionSystem', matrix: 'K', variable: 'k', is: 'none' }],
    },
    {
      id: 'exam-infinite',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$k = 1$ iken sistem için hangisi doğrudur?',
      skill: 'parametric-case',
      scene: { items: ['K'] },
      options: [
        {
          key: 'a',
          content: [text('Tek çözüm')],
          errorType: 'det-zero-ignored',
          feedback: '$k = 1$’de $|A| = 0$: tek çözüm olamaz.',
        },
        { key: 'b', content: [text('Sonsuz çözüm')] },
        {
          key: 'c',
          content: [text('Çözüm yok')],
          errorType: 'det-zero-means-none',
          feedback: '$|A| = 0$ yalnız "tek çözüm yok" der. Sağ taraf tutarlı: $r_A = r_B = 1$.',
        },
      ],
      answer: 'b',
      solution: '$r_A = r_B = 1 < 3$: sonsuz çözüm, iki serbest değişken.',
      claims: [{ kind: 'system', matrix: 'K', at: { k: '1' }, is: 'infinite', answer: true }],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Parametreli sistem',
      points: [
        'Kare sistemde önce $|A|$’yı $k$ cinsinden hesapla, köklerini bul.',
        'Kök olmayan her $k$: tek çözüm.',
        'Her kökü ayrı ayrı yerine koy, $r_A$ ve $r_B$’yi karşılaştır: sonsuz ya da çözüm yok.',
        '$|A| = 0$ "çözüm yok" demek değildir; sağ tarafa bakmadan karar verme.',
      ],
    },
  ],
}
