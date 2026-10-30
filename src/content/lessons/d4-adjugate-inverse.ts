import { matrix, text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[], bars = false): MatrixBlock => ({
  kind: 'matrix',
  delimiter: bars ? 'bars' : 'brackets',
  rows,
  label,
})

/** D4: Ek(A) = [C_ij]ᵀ, A·Ek(A) = |A|I, A⁻¹ = Ek(A)/|A|, the 2×2 shortcut, |Ek(A)| = |A|ⁿ⁻¹. */
export const d4AdjugateInverse: Lesson = {
  id: 'd4-adjugate-inverse',
  node: 'D4',
  title: 'Ek matris ve ters matris',
  matrices: {
    A: m('A =', [
      ['1', '2', '0'],
      ['0', '1', '1'],
      ['1', '0', '2'],
    ]),
    Cof: m('$[C_{ij}]$ =', [
      ['2', '1', '-1'],
      ['-4', '2', '2'],
      ['2', '-1', '1'],
    ]),
    Adj: m('Ek(A) =', [
      ['2', '-4', '2'],
      ['1', '2', '-1'],
      ['-1', '2', '1'],
    ]),
    Inv: m('A⁻¹ =', [
      ['1/2', '-1', '1/2'],
      ['1/4', '1/2', '-1/4'],
      ['-1/4', '1/2', '1/4'],
    ]),
    G: m('A =', [
      ['a', 'b'],
      ['c', 'd'],
    ]),
    T: m('B =', [
      ['3', '5'],
      ['1', '2'],
    ]),
    K: m('C =', [
      ['4', '2'],
      ['3', '2'],
    ]),
    P: m('A =', [
      ['1', '0', '2'],
      ['2', '1', '0'],
      ['0', '1', '3'],
    ]),
    xA: m('', [
      ['1', '0', '0'],
      ['0', '1', '0'],
      ['0', '0', '3'],
    ]),
    xAdj: m('', [
      ['3', '0', '0'],
      ['0', '3', '0'],
      ['0', '0', '1'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Tersi var. Peki nasıl bulunur?',
      body: '$|A| = 4 \\neq 0$, yani $A$’nın tersi var. Bu derste tersi tek bir formülle kuracağız; parçaları D2’den tanıdık: kofaktörler.',
      scene: { items: ['A'] },
      claims: [{ kind: 'det', matrix: 'A', equals: '4' }],
    },
    {
      id: 'adjugate',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Ek matris: kofaktör matrisinin transpozu',
      body: 'Her elemanın yerine kendi kofaktörünü yaz: $[C_{ij}]$. Sonra transpozunu al, {ok}ek matris{/ok} budur: $\\text{Ek}(A) = [C_{ij}]^T$. Yani $C_{ij}$, $(j, i)$ konumuna yazılır.',
      scene: { items: ['Cof', 'Adj'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['Cof', 0, '*'], tone: 'row' }] },
          { marks: [{ cell: ['Adj', '*', 0], tone: 'col' }], note: '1. satır → 1. sütun' },
        ],
      },
      claims: [
        {
          kind: 'derived',
          of: 'cofactors',
          matrix: 'A',
          equals: [
            ['2', '1', '-1'],
            ['-4', '2', '2'],
            ['2', '-1', '1'],
          ],
        },
        {
          kind: 'derived',
          of: 'adjugate',
          matrix: 'A',
          equals: [
            ['2', '-4', '2'],
            ['1', '2', '-1'],
            ['-1', '2', '1'],
          ],
        },
      ],
    },
    {
      id: 'worked-cofactors',
      kind: 'explain',
      eyebrow: 'Örnek',
      title: 'Dokuz kofaktör, dokuz küçük determinant',
      body: '$C_{11} = +(1 \\cdot 2 - 1 \\cdot 0) = 2$, $C_{12} = -(0 \\cdot 2 - 1 \\cdot 1) = 1$, $C_{13} = +(0 \\cdot 0 - 1 \\cdot 1) = -1$. Diğer altısı aynı yolla. İşaret düzenini önceden yaz: $+, -, +$.',
      scene: { items: ['A', 'Cof'] },
      beat: {
        kind: 'sequence',
        beats: [
          { kind: 'minor', matrix: 'A', row: 0, col: 0 },
          { kind: 'minor', matrix: 'A', row: 0, col: 1 },
          { kind: 'minor', matrix: 'A', row: 0, col: 2 },
        ],
      },
      claims: [
        { kind: 'cofactor', matrix: 'A', row: 1, col: 1, equals: '2' },
        { kind: 'cofactor', matrix: 'A', row: 1, col: 2, equals: '1' },
        { kind: 'cofactor', matrix: 'A', row: 1, col: 3, equals: '-1' },
      ],
    },
    {
      id: 'identity',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$A \\cdot \\text{Ek}(A) = |A| \\, I$, bu yüzden $A^{-1} = \\frac{1}{|A|}\\text{Ek}(A)$',
      body: '$A$’nın bir satırı ile $\\text{Ek}(A)$’nın aynı numaralı sütunu çarpılınca Laplace açılımı çıkar: $|A|$. Farklı numaralı sütunla çarpılınca $0$. Bu yüzden $|A|$’ya bölmek tersi verir: $A^{-1} = \\frac{1}{4}\\text{Ek}(A)$.',
      scene: { items: ['Inv'] },
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
      id: 'shortcut-2x2',
      kind: 'explain',
      eyebrow: 'Kısa yol',
      title: '2×2: köşegeni değiştir, diğerlerinin işaretini çevir, $|A|$’ya böl',
      body: '2×2’de $\\text{Ek}(A)$ bir bakışta yazılır: $a$ ile $d$ yer değiştirir, $b$ ve $c$ eksi olur. $B$ için $|B| = 6 - 5 = 1$, $B^{-1}$’in satırları $(2, -5)$ ve $(-1, 3)$.',
      scene: { items: ['G', 'T'] },
      claims: [
        { kind: 'det', matrix: 'T', equals: '1' },
        {
          kind: 'derived',
          of: 'inverse',
          matrix: 'T',
          equals: [
            ['2', '-5'],
            ['-1', '3'],
          ],
        },
      ],
    },
    {
      id: 'try-entry',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$C^{-1}$’in 2. satır 1. sütun elemanı kaç?',
      body: 'Kesir olabilir: $-\\frac{3}{2}$ gibi yaz.',
      skill: 'inverse-2x2',
      scene: { items: ['K'] },
      answer: '-3/2',
      feedbackWrong: '$|C| = 8 - 6 = 2$. $\\text{Ek}(C)$’nin satırları $(2, -2)$ ve $(-3, 4)$; $2$’ye böl.',
      solution: '$C^{-1} = \\frac{1}{2}\\text{Ek}(C)$, 2. satır 1. sütun: $\\frac{-3}{2}$.',
      claims: [
        { kind: 'det', matrix: 'K', equals: '2' },
        { kind: 'derivedEntry', of: 'inverse', matrix: 'K', row: 2, col: 1, equals: '-3/2', answer: true },
      ],
    },
    {
      id: 'try-adjugate',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$\\text{Ek}(A)$ hangisi?',
      skill: 'adjugate-3x3',
      scene: { items: ['P'] },
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['3', '-6', '2'],
              ['2', '3', '-1'],
              ['-2', '4', '1'],
            ]),
          ],
          errorType: 'forgot-transpose',
          feedback: 'Bu kofaktör matrisi $[C_{ij}]$; $\\text{Ek}(A)$ onun transpozu.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['3', '2', '-2'],
              ['-6', '3', '4'],
              ['2', '-1', '1'],
            ]),
          ],
        },
        {
          key: 'c',
          content: [
            matrix([
              ['3', '-2', '-2'],
              ['6', '3', '-4'],
              ['2', '1', '1'],
            ]),
          ],
          errorType: 'forgot-cofactor-sign',
          feedback: 'Minörlere işaret eklenmemiş: $C_{ij} = (-1)^{i+j}M_{ij}$.',
        },
        {
          key: 'd',
          content: [
            matrix([
              ['-3', '-2', '2'],
              ['6', '-3', '-4'],
              ['-2', '1', '-1'],
            ]),
          ],
          errorType: 'lost-sign',
          feedback: 'İşaret düzeni sol üstten $+$ ile başlar; bütün işaretler ters olmuş.',
        },
      ],
      answer: 'b',
      solution:
        'Kofaktörler: 1. satır $3, -6, 2$; 2. satır $2, 3, -1$; 3. satır $-2, 4, 1$. Transpoz: bunlar sütun olur. Kontrol: $A \\cdot \\text{Ek}(A) = 7I$, çünkü $|A| = 7$.',
      claims: [
        { kind: 'det', matrix: 'P', equals: '7' },
        {
          kind: 'derived',
          of: 'adjugate',
          matrix: 'P',
          equals: [
            ['3', '2', '-2'],
            ['-6', '3', '4'],
            ['2', '-1', '1'],
          ],
          answer: true,
        },
      ],
    },
    {
      id: 'trap-transpose',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'Transpozu unutma; kontrolü $A \\cdot \\text{Ek}(A)$ ile yap',
      body: 'Sınavda şıklarda hem $[C_{ij}]$ hem $\\text{Ek}(A)$ bulunur. Hızlı eleme: $\\text{Ek}(A)$’nın 1. satır 2. sütun elemanı $C_{21}$’dir, $C_{12}$ değil. Tek bir elemanı hesaplayıp şıkları ele.',
      scene: { items: ['Cof', 'Adj'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['Cof', 1, 0], tone: 'row' }] },
          { marks: [{ cell: ['Adj', 0, 1], tone: 'ok' }], note: 'C₂₁ → (1, 2)' },
        ],
      },
    },
    {
      id: 'det-adjugate',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$|\\text{Ek}(A)| = |A|^{n-1}$',
      body: '$A \\cdot \\text{Ek}(A) = |A|I$ eşitliğinin iki yanının determinantını al: $|A| \\cdot |\\text{Ek}(A)| = |A|^n$. $|A| \\neq 0$ ise $|\\text{Ek}(A)| = |A|^{n-1}$. Örnekteki $A$ için $4^2 = 16$.',
      scene: { items: ['Adj'] },
      claims: [{ kind: 'derivedDet', of: 'adjugate', matrix: 'A', equals: '16' }],
    },
    {
      id: 'exam-adjugate-det',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$A$ 3×3 ve $|A| = 3$. $|2\\,\\text{Ek}(A)|$ kaçtır?',
      skill: 'adjugate-det',
      options: [
        {
          key: 'a',
          content: [text('$18$')],
          errorType: 'k-instead-of-k-power-n',
          feedback: '$|2M| = 2^3|M|$, $2|M|$ değil.',
        },
        {
          key: 'b',
          content: [text('$24$')],
          errorType: 'adjugate-det-as-det',
          feedback: '$|\\text{Ek}(A)| = |A|^{n-1} = 3^2 = 9$, $3$ değil.',
        },
        { key: 'c', content: [text('$72$')] },
        {
          key: 'd',
          content: [text('$216$')],
          errorType: 'adjugate-det-power-n',
          feedback: 'Üs $n - 1 = 2$: $|\\text{Ek}(A)| = 9$, $27$ değil.',
        },
        {
          key: 'e',
          content: [text('$\\frac{8}{3}$')],
          errorType: 'adjugate-as-inverse',
          feedback: 'Bu $|2A^{-1}|$. $\\text{Ek}(A) = |A| \\cdot A^{-1}$; $|A|$’ya bölünmüş hali değil.',
        },
      ],
      answer: 'c',
      reveal: { kind: 'equation', lines: ['|2\\,\\text{Ek}(A)| = 2^3 \\cdot |A|^{2}', '= 8 \\cdot 9 = 72'] },
      solution: '$|\\text{Ek}(A)| = 3^2 = 9$, $|2M| = 2^3|M|$: $8 \\cdot 9 = 72$.',
      claims: [
        { kind: 'det', matrix: 'xA', equals: '3' },
        {
          kind: 'derived',
          of: 'adjugate',
          matrix: 'xA',
          equals: [
            ['3', '0', '0'],
            ['0', '3', '0'],
            ['0', '0', '1'],
          ],
        },
        { kind: 'detProduct', scalar: '2', factors: [{ matrix: 'xAdj' }], equals: '72', answer: true },
      ],
    },
    {
      id: 'exam-inverse-entry',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: 'İlk örnekteki $A$ için $A^{-1}$’in 3. satır 1. sütun elemanı hangisidir?',
      body: 'Bütün tersi hesaplama: tek eleman yeter.',
      skill: 'inverse-entry',
      scene: { items: ['A'] },
      options: [
        { key: 'a', content: [text('$-\\frac{1}{4}$')] },
        {
          key: 'b',
          content: [text('$\\frac{1}{4}$')],
          errorType: 'wrong-cofactor-sign',
          feedback: '$C_{13} = (-1)^{1+3}M_{13}$, işaret artı; $M_{13} = 0 \\cdot 0 - 1 \\cdot 1 = -1$.',
        },
        {
          key: 'c',
          content: [text('$-1$')],
          errorType: 'forgot-divide-by-det',
          feedback: 'Bu $\\text{Ek}(A)$’nın elemanı; $|A| = 4$’e bölmek gerekiyor.',
        },
        {
          key: 'd',
          content: [text('$\\frac{1}{2}$')],
          errorType: 'forgot-transpose',
          feedback: 'Bu $C_{31}/|A|$. $(A^{-1})_{31} = C_{13}/|A|$: indisler yer değiştirir.',
        },
        {
          key: 'e',
          content: [text('$2$')],
          errorType: 'forgot-transpose',
          feedback: 'Bu $C_{31}$. Hem indisler yer değiştirir ($C_{13}$) hem $|A|$’ya bölünür.',
        },
      ],
      answer: 'a',
      solution: '$(A^{-1})_{31} = \\frac{C_{13}}{|A|} = \\frac{-1}{4}$.',
      claims: [
        { kind: 'cofactor', matrix: 'A', row: 1, col: 3, equals: '-1' },
        { kind: 'cofactor', matrix: 'A', row: 3, col: 1, equals: '2' },
        { kind: 'derivedEntry', of: 'inverse', matrix: 'A', row: 3, col: 1, equals: '-1/4', answer: true },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Ters matris tek formülde',
      points: [
        '$\\text{Ek}(A) = [C_{ij}]^T$: kofaktör matrisinin transpozu.',
        '$A \\cdot \\text{Ek}(A) = \\text{Ek}(A) \\cdot A = |A| \\, I$.',
        '$|A| \\neq 0$ ise $A^{-1} = \\frac{1}{|A|}\\text{Ek}(A)$; $(A^{-1})_{ij} = C_{ji}/|A|$.',
        '2×2: köşegeni değiştir, diğer ikisinin işaretini çevir, $|A|$’ya böl.',
        '$|\\text{Ek}(A)| = |A|^{n-1}$, $|A^{-1}| = 1/|A|$.',
        'Bilgisayarda büyük matrislerin tersi bu formülle değil Gauss-Jordan ile alınır; formül, tersin nereden geldiğini ve tek bir elemanı hızlı bulmayı sağlar.',
      ],
    },
  ],
}
