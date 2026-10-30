// Kept v21 lesson layer (engine, lessons, sound), moved here unchanged except for storage access.
// See src/legacy/README.md before editing.
import { versionLine } from './build-line'
import { shellBridge } from './bridge'
import { appStorage } from './storage'

/* ---------- Content (lesson data; the engine below never hard-codes lesson text) ---------- */

const UNITS = [
  {id: 'A', label: 'Matrisler', lessons: [
    ['A1', 'Matris, boyut, eleman'], ['A2', 'Toplama, skaler çarpım'], ['A3', 'Matris çarpımı'],
    ['A4', 'Çarpım tuzakları'], ['A5', 'Transpoz ve iz'], ['A6', 'Simetrik, üçgen'],
    ['A7', 'İdempotent, ortogonal'], ['A8', 'Satır işlemi, eşelon'], ['A9', 'Rank'],
    ['A11', 'Gauss-Jordan ile ters'],
  ]},
  {id: 'B', label: 'Determinant', lessons: [
    ['B1', 'Determinant: 2×2, Sarrus'], ['B2', 'Kofaktör ve Laplace'], ['B3', 'Satır işlemleri ve det'],
    ['B4', 'Det çarpım kuralları'], ['B5', 'k\'lı determinant'], ['B6', 'Ek matrisle ters'],
    ['A10', 'Ters matris, (AB)⁻¹'],
  ]},
  {id: 'C', label: 'Sistemler', lessons: [
    ['C1', 'Gauss ile çözüm'], ['C2', 'Çözüm türleri'], ['C3', 'k\'lı sistemler'],
    ['C4', 'Homojen sistemler'], ['C5', 'Cramer ve X = A⁻¹b'],
  ]},
];
/** Lesson registry: each lessons/<ID>.js file adds one entry; the build inlines them here. */
const LESSONS = {};
/* A3 Matris çarpımı: one entry at a time (row of A meets column of B). */
LESSONS.A3 = {
  id: 'A3',
  title: 'Matris çarpımı',
  matrices: {
    A: {name: 'A', values: [[2, 3], [1, -1]]},
    B: {name: 'B', values: [[1, 2], [4, 0]]},
    C: {name: 'AB', values: [[null, null], [null, null]]},
    D: {name: 'BA', values: [[null, null], [null, null]]},
    M: {name: '[A | b]', values: [[1, 2, 5], [2, 3, 8]], augmented: true},
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Hatırla', title: 'Satır yatay, sütun dikey okunur',
      body: 'Bir eleman satır ve sütun numarasıyla anılır: a<sub>12</sub>, 1. satır 2. sütundaki <b>3</b>.',
      scene: {items: ['A'], mode: 'solo'},
      beat: {type: 'readEntry', mat: 'A', i: 0, j: 1},
    },
    {
      kind: 'explain', eyebrow: 'Soru', title: 'AB\'nin sol üst elemanı nereden geliyor?',
      body: 'Sonuçtaki <span class="st-hl-result">14</span> sayısını A ve B\'nin hangi sayıları üretiyor? Bir sonraki adımda göreceksin.',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'C']},
      state: {C: [[14, null], [null, null]]},
      marks: [['C', 0, 0, 'is-target']],
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Satır, sütunla buluşur',
      body: 'A\'nın <span class="st-hl-row">1. satırı</span> ile B\'nin <span class="st-hl-col">1. sütununu</span> eşle. Eş sayıları çarp, sonra topla.',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'C']},
      beat: {type: 'multiply', a: 'A', b: 'B', c: 'C', i: 0, j: 0},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'AB\'nin sağ üst elemanı kaç?',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'C']},
      state: {C: [[14, null], [null, null]]},
      marks: [['C', 0, 1, 'is-target']],
      options: [
        {text: '8', tag: 'row-times-row', feedback: 'Bu A\'nın 1. satırı ile B\'nin 2. satırı. B\'den sütun alınır: <span class="st-math">2·2 + 3·0</span>.'},
        {text: '4', correct: true, feedback: '1. satır <span class="st-math">(2, 3)</span> ile 2. sütun <span class="st-math">(2, 0)</span>: <span class="st-math">4 + 0 = 4</span>.'},
        {text: '6', tag: 'entrywise', feedback: 'Aynı yerdeki iki sayıyı çarptın. Satırın tamamı sütunun tamamıyla eşlenir.'},
      ],
      reveal: {type: 'multiply', a: 'A', b: 'B', c: 'C', i: 0, j: 1},
    check: {expr: '(A*B)[0, 1]'},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'c<sub>ij</sub>: A\'nın i. satırı ile B\'nin j. sütunu',
      body: 'Satır numarasını A, sütun numarasını B verir. Eş elemanları çarpıp toplarsın.',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'C']},
      state: {C: [[14, 4], [null, null]]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'AB\'nin (2,1) elemanı kaç?',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'C']},
      state: {C: [[14, 4], [null, null]]},
      marks: [['C', 1, 0, 'is-target']],
      options: [
        {text: '5', tag: 'sign-dropped', feedback: 'İşareti kaçırdın: <span class="st-math">1·1 + (−1)·4 = 1 − 4</span>.'},
        {text: '−3', correct: true, feedback: '2. satır <span class="st-math">(1, −1)</span> ile 1. sütun <span class="st-math">(1, 4)</span>: <span class="st-math">1 − 4 = −3</span>.'},
        {text: '−1', tag: 'row-times-row', feedback: 'Bu A\'nın 2. satırı ile B\'nin 1. satırı. B\'den sütun alınır.'},
      ],
      reveal: {type: 'multiply', a: 'A', b: 'B', c: 'C', i: 1, j: 0},
    check: {expr: '(A*B)[1, 0]'},
    },
    {
      kind: 'explain', eyebrow: 'Tuzak', title: 'BA, AB değildir',
      body: 'Sıra değişince satırlar B\'den gelir. BA\'nın sol üstü <span class="st-hl-result">4</span>, AB\'ninki 14.',
      scene: {items: ['B', 'op:dot', 'A', 'op:eq', 'D']},
      beat: {type: 'multiply', a: 'B', b: 'A', c: 'D', i: 0, j: 0},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'BA\'nın (1,2) elemanı kaç?',
      scene: {items: ['B', 'op:dot', 'A', 'op:eq', 'D']},
      state: {D: [[4, null], [null, null]]},
      marks: [['D', 0, 1, 'is-target']],
      answer: 1,
      feedbackRight: 'B\'nin 1. satırı ile A\'nın 2. sütunu: <span class="st-math">3 − 2 = 1</span>.',
      feedbackWrong: 'B\'nin 1. satırı <span class="st-math">(1, 2)</span>, A\'nın 2. sütunu <span class="st-math">(3, −1)</span>: <span class="st-math">3 − 2 = 1</span>.',
      reveal: {type: 'multiply', a: 'B', b: 'A', c: 'D', i: 0, j: 1},
    check: {expr: '(B*A)[0, 1]'},
    },
    {
      kind: 'explain', eyebrow: 'Önizleme · C1 Gauss', title: 'İkinci satırdan birincinin iki katını çıkar',
      body: 'Alt hedef: x\'i 2. denklemden silmek. Satır inip ikinci satıra değdiği anda sayılar değişir.',
      scene: {items: ['M'], mode: 'aug'},
      beat: {type: 'rowOp', mat: 'M', source: 0, target: 1, factor: -2},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Sınavda tek eleman sorulur',
      body: 'c<sub>ij</sub> için yalnız A\'nın i. satırını ve B\'nin j. sütununu kullan. AB ile BA genelde farklıdır.',
      scene: {items: ['mascot'], mode: 'solo'},
    },
  ],
};

/* B1 Determinant nedir: 2×2 by ad − bc, 3×3 by Sarrus, det = 0 means singular (no inverse). */
LESSONS.B1 = {
  id: 'B1',
  title: 'Determinant: 2×2, Sarrus',
  // What the learner can do now: the lesson end's title (a can-do sentence, at most 2 lines at 24 px).
  outcome: 'Artık 3×3 bir matrisin tersi var mı, söyleyebilirsin.',
  matrices: {
    A: {name: 'A', values: [[3, 1], [4, 2]], bars: true},
    B: {name: 'B', values: [[5, 2], [3, 4]], bars: true},
    C: {name: 'C', values: [[2, -3], [1, 4]], bars: true},
    T: {name: 'A', values: [[2, 4], [3, 6]], bars: true},
    G: {name: 'A', values: [['a', 'b'], ['c', 'd']], bars: true},
    K: {name: 'A', values: [['k', 2], [8, 'k']], bars: true},
    S: {name: 'A', values: [[1, 2, 3], [0, 1, 4], [2, 1, 1]], bars: true},
    X: {name: 'ilk iki sütun', values: [[1, 2], [0, 1], [2, 1]]},
    S2: {name: 'B', values: [[2, 1, 0], [1, 3, 2], [0, 1, 4]], bars: true},
    X2: {name: 'ilk iki sütun', values: [[2, 1], [1, 3], [0, 1]]},
    F: {name: '4×4', values: [[1, 2, 0, 1], [3, 1, 2, 0], [0, 1, 1, 2], [2, 0, 1, 1]], bars: true},
    K3: {name: 'A', values: [['k', 1, 2], [0, 1, 3], [1, 1, 4]], bars: true},
    XK: {name: 'ilk iki sütun', values: [['k', 1], [0, 1], [1, 1]]},
    KK: {name: 'A', values: [['k', 1, 1], [1, 'k', 1], [1, 1, 'k']], bars: true},
    XKK: {name: 'ilk iki sütun', values: [['k', 1], [1, 'k'], [1, 1]]},
    Q2: {name: 'A', values: [['k-1', 2], [3, 'k']], bars: true},
    N: {name: 'A', values: [[1, -1, 2], [3, 0, 1], [-2, 1, 4]], bars: true},
    // The secret moment's matrix: the third column is the sum of the first two. No bars: the seal's brackets close around it.
    M: {name: 'A', values: [[2, 1, 3], [1, 4, 5], [3, 2, 5]]},
    XN: {name: 'ilk iki sütun', values: [[1, -1], [3, 0], [-2, 1]]},
  },
  labels: {v: '?', f: '?'},
  steps: [
    {
      id: 'hook', kind: 'explain', eyebrow: 'Soru', title: 'Bu matrisin tersi var mı?',
      body: 'Cevabı <b>determinant</b> verir: kare matrise bağlı tek bir sayı. <span class="st-math">det(A)</span>, kısaca <span class="st-math">det A</span> ya da <span class="st-math">|A|</span> yazılır.',
      scene: {items: ['A', 'op:eq', 'v'], mode: 'solo'},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Ana köşegen eksi diğer köşegen',
      body: '<span class="st-hl-row">Ana köşegenin</span> çarpımından <span class="st-hl-col">diğer köşegenin</span> çarpımını çıkar. <span class="st-math">3·2 − 1·4 = 2</span>, sıfır değil: A\'nın tersi var.',
      scene: {items: ['A', 'op:eq', 'v'], mode: 'solo'},
      beat: {type: 'det2', mat: 'A', into: ['v', '{v}']},
      claims: [{expr: 'det(A)', equals: 2}],
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: '2×2 kuralı: |A| = ad − bc',
      body: 'Elemanlara a, b, c, d diyelim. <span class="st-hl-row">Ana köşegen</span> sol üstten sağ alta iner, çarpımı ad. <span class="st-hl-col">Diğer köşegen</span> sağ üstten sol alta iner, çarpımı bc.',
      scene: {items: ['G', 'op:eq', 'f'], mode: 'solo'},
      beat: {type: 'det2', mat: 'G', values: ['ad', 'bc', 'ad − bc'], result: false, into: ['f', '{v}']},
    },
    {
      skill: 'det2',
      stageExplains: true, kind: 'choice', eyebrow: 'Senin sıran', title: '|B| kaç?',
      scene: {items: ['B', 'op:eq', 'v'], mode: 'solo'},
      options: [
        {text: '26', tag: 'added-diagonals', expr: '5*4 + 2*3', feedback: 'İki çarpımı topladın. Diğer köşegen çıkarılır: <span class="st-math">20 − 6</span>.'},
        {text: '14', correct: true, feedback: '<span class="st-math">5·4 − 2·3 = 20 − 6 = 14</span>.'},
        {text: '−14', tag: 'diagonals-reversed', expr: '-det(B)', feedback: 'Sırayı ters çevirdin: <span class="st-math">6 − 20</span>. Önce ana köşegen gelir.'},
      ],
      reveal: {type: 'det2', mat: 'B', into: ['v', '{v}']},
      check: {expr: 'det(B)'},
    },
    {
      skill: 'det2',
      stageExplains: true, kind: 'keypad', eyebrow: 'Senin sıran', title: 'Eksiye dikkat: |C| kaç?',
      scene: {items: ['C', 'op:eq', 'v'], mode: 'solo'},
      answer: 11,
      feedbackRight: '<span class="st-math">2·4 − (−3)·1 = 8 + 3 = 11</span>.',
      feedbackWrong: '<span class="st-math">(−3)·1 = −3</span>. Eksiyi çıkarmak artı yapar: <span class="st-math">8 − (−3) = 11</span>.',
      reveal: {type: 'det2', mat: 'C', into: ['v', '{v}']},
      check: {expr: 'det(C)'},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'det A = 0 ise A tekildir',
      body: 'Determinantı 0 olan matris <b>tekil</b>dir, tersi yoktur. Burada <span class="st-hl-col">2. sütun</span>, <span class="st-hl-col">1. sütunun</span> 2 katı; bu yüzden det 0.',
      scene: {items: ['T', 'op:eq', 'v'], mode: 'solo'},
      beat: {type: 'sequence', beats: [
        {type: 'det2', mat: 'T', into: ['v', '{v}']},
        // Why 0: column 2 is twice column 1. Ends on both columns lit together, never the whole matrix.
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['T', '*', 0, 'is-col']]},
          {marks: [['T', '*', 1, 'is-col']], work: [{html: '2. sütun = 2·(1. sütun)', kind: 'b'}]},
        ]},
      ]},
      claims: [{expr: 'det(T)', equals: 0}],
    },
    {
      skill: 'singular',
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Hangi k için A tekil olur?',
      body: 'Determinantı sıfıra eşitle.',
      scene: {items: ['K', 'op:eq', 'v'], mode: 'solo'},
      labels: {v: '0'},
      options: [
        {text: 'k = 4', value: ['4'], tag: 'missed-negative-root', feedback: '<span class="st-math">k² = 16</span>\'nın iki kökü var: <span class="st-math">k = −4</span> de tekil yapar.'},
        {text: 'k = −4 ya da 4', value: ['-4', '4'], correct: true, feedback: 'Karesi 16 olan iki sayı var; ikisi de determinantı sıfır yapar.'},
        {text: 'k = 16', value: ['16'], tag: 'forgot-square-root', feedback: 'Bu k² değeri. <span class="st-math">k² = 16</span> ise <span class="st-math">k = ±4</span>.'},
      ],
      reveal: {type: 'det2', mat: 'K', values: ['k²'], rhs: '0', rhsFrom: 'v', then: [{eq: ['k² = 16', 'k = −4 ya da 4']}]},
      check: {expr: 'solve(det(K), k)'},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: '3×3: ilk iki sütunu sağa yaz',
      body: 'Bazı köşegenler sağ kenarda kesilir, soldan devam eder. <b>Sarrus kuralı</b>: ilk iki sütunu sağa tekrar yaz; her köşegen üç sayılık düz çizgi olur.',
      scene: {items: ['S', 'X'], mode: 'solo'},
      state: {X: [['', ''], ['', ''], ['', '']]},
      beat: {type: 'paced', frames: [
        // The problem first: a diagonal breaks at the right edge and goes on from the left.
        {clear: true, marks: [['S', 0, 1, 'is-row'], ['S', 1, 2, 'is-row']], work: [{text: 'kesik köşegen: 2, 4, …', kind: 'a', label: true}]},
        {marks: [['S', 2, 0, 'is-row']], work: [{text: 'kesik köşegen: 2, 4, … 2', kind: 'a', label: true}]},
        // The fix: the first two columns written again on the right.
        // Both copied columns in the column colour (blue stays for the diagonals).
        {clear: true, marks: [['S', '*', 0, 'is-col']], work: [{text: '1. sütun', kind: 'b', label: true}]},
        {fly: [
          {from: ['S', 0, 0], to: ['X', 0, 0], kind: 'col'}, {from: ['S', 1, 0], to: ['X', 1, 0], kind: 'col'},
          {from: ['S', 2, 0], to: ['X', 2, 0], kind: 'col'}],
          set: [['X', 0, 0, 1], ['X', 1, 0, 0], ['X', 2, 0, 2]], marks: [['X', '*', 0, 'is-col']]},
        {marks: [['S', '*', 1, 'is-col']], work: [{text: '2. sütun', kind: 'b', label: true}]},
        {fly: [
          {from: ['S', 0, 1], to: ['X', 0, 1], kind: 'col'}, {from: ['S', 1, 1], to: ['X', 1, 1], kind: 'col'},
          {from: ['S', 2, 1], to: ['X', 2, 1], kind: 'col'}],
          set: [['X', 0, 1, 2], ['X', 1, 1, 1], ['X', 2, 1, 1]], marks: [['X', '*', 1, 'is-col']]},
        // The broken diagonal is now a straight line of three.
        {clear: true, marks: [['S', 0, 1, 'is-row'], ['S', 1, 2, 'is-row'], ['X', 2, 0, 'is-row']], work: [{text: 'düz köşegen: 2·4·2', kind: 'a', label: true}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Sağa inen üç köşegen: artı',
      body: '<span class="st-hl-row">Sağa inen</span> üç köşegen artıyla girer. Her birinin üç sayısını çarp: <span class="st-math">1·1·1</span>, <span class="st-math">2·4·2</span>, <span class="st-math">3·0·1</span>. Toplam 17.',
      scene: {items: ['S', 'X'], mode: 'solo'},
      beat: {type: 'sarrus', mat: 'S', copy: 'X', only: 'plus'},
      claims: [{expr: 'S[0,0]*S[1,1]*S[2,2] + S[0,1]*S[1,2]*S[2,0] + S[0,2]*S[1,0]*S[2,1]', equals: 17}],
    },
    {
      skill: 'sarrus',
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'Sola inenlerin toplamı kaç?',
      body: '<span class="st-hl-col">Sola inenler</span> eksiyle girer; şimdi yalnız topla. İlki boyalı: <span class="st-hl-col">3·1·2</span>.',
      scene: {items: ['S', 'X']},
      marks: [['S', 0, 2, 'is-col'], ['S', 1, 1, 'is-col'], ['S', 2, 0, 'is-col']],
      answer: 10,
      feedbackRight: 'Üçü de üst satırdan başlar ve sola iner.',
      feedbackWrong: 'Çarpımlar 6, 4 ve 0; toplam 10. Eksi işareti sonraki adımda gelir.',
      reveal: {type: 'sarrus', mat: 'S', copy: 'X', only: 'minus'},
      check: {expr: 'S[0,2]*S[1,1]*S[2,0] + S[0,0]*S[1,2]*S[2,1] + S[0,1]*S[1,0]*S[2,2]'},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'det = artılar − eksiler',
      body: '<span class="st-hl-row">Sağa inenlerin</span> toplamından <span class="st-hl-col">sola inenlerin</span> toplamını çıkar. Burada |A| = 7.',
      scene: {items: ['S', 'X'], mode: 'solo'},
      beat: {type: 'sarrus', mat: 'S', copy: 'X', given: ['plus', 'minus']},
      claims: [{expr: 'det(S)', equals: 7}],
    },
    {
      skill: 'sarrus',
      kind: 'choice', eyebrow: 'Senin sıran', title: '|B| kaç?',
      body: 'Önce sağa inen üç çarpım, sonra sola inen üç çarpım.',
      scene: {items: ['S2', 'X2']},
      options: [
        {text: '16', correct: true, feedback: 'Çarpanında 0 olan çarpım 0 verir; artılarda yalnız <span class="st-math">2·3·4</span> kalır.'},
        {text: '24', tag: 'full-diagonals-only', expr: 'S2[0,0]*S2[1,1]*S2[2,2] - S2[0,2]*S2[1,1]*S2[2,0]', feedback: 'Yalnız iki tam köşegeni aldın. İlk iki sütunla oluşan köşegenler de sayılır: <span class="st-math">24 − 8 = 16</span>.'},
        {text: '32', tag: 'added-both', expr: '24 + 8', feedback: 'Sola inenler (<span class="st-math">0·3·0 + 2·2·1 + 1·1·4 = 8</span>) çıkarılır, eklenmez: <span class="st-math">24 − 8 = 16</span>.'},
      ],
      reveal: {type: 'sarrus', mat: 'S2', copy: 'X2'},
      check: {expr: 'det(S2)'},
    },
    {
      kind: 'explain', eyebrow: 'Tuzak', title: 'Sarrus yalnız 3×3\'te çalışır',
      body: '4×4\'lük determinantta 24 çarpım var: her satır ve sütundan birer sayı. Köşegenler yalnız 8\'ini verir. Mor çarpım hiçbir köşegende yok.',
      scene: {items: ['F']},
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['F', 0, 0, 'is-row'], ['F', 1, 1, 'is-row'], ['F', 2, 2, 'is-row'], ['F', 3, 3, 'is-row']],
            work: [{text: 'köşegende var', kind: 'a', label: true}]},
        ]},
        // The purple product: one number from each row and column, on no diagonal.
        {type: 'derive', lines: [{label: 'köşegende yok:', role: 'col', expr: ['·', ['F', 0, 0], ['F', 1, 1], ['F', 2, 3], ['F', 3, 2]]}]},
      ]},
      claims: [{expr: 'factorial(4)', equals: 24}, {expr: '2*4', equals: 8}, {expr: 'F[0,0]*F[1,1]*F[2,3]*F[3,2]', equals: 2}],
    },
    {
      skill: 'singular',
      paysOff: 'hook', kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k için A tekil olur?',
      scene: {items: ['KK', 'XKK']},
      options: [
        {text: 'k = 1', value: ['1'], tag: 'missed-root', feedback: 'k = −2 de kök: <span class="st-math">(k − 1)²(k + 2) = 0</span>.'},
        {text: 'k = 1 ya da −2', value: ['1', '-2'], correct: true, feedback: '<span class="st-math">k = 1</span> kökü <span class="st-math">(k − 1)</span> çarpanını verir; kalan <span class="st-math">k² + k − 2</span> de <span class="st-math">(k − 1)(k + 2)</span>.'},
        {text: 'k = −1 ya da 2', value: ['-1', '2'], tag: 'roots-sign-flipped', feedback: 'Çarpanlar <span class="st-math">(k − 1)²(k + 2)</span>; kökler 1 ve −2.'},
      ],
      reveal: {type: 'sarrus', mat: 'KK', copy: 'XKK', plus: ['k³', 1, 1, 'k³ + 2'], minus: ['k', 'k', 'k', '3k'], result: 'k³ − 3k + 2',
        // Standard order, the root k = 1 checked, its factor split off, then the rest factored.
        rhs: '0', then: [{eq: ['k³ − 3k + 2 = 0', 'k = 1: 1 − 3 + 2 = 0', '(k − 1)(k² + k − 2) = 0', '(k − 1)²(k + 2) = 0', 'k = 1 ya da −2']}]},
      check: {expr: 'solve(det(KK), k)'},
    },
    {
      skill: 'singular',
      stageExplains: true, kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k için |A| = 0 olur?',
      scene: {items: ['K3', 'XK']},
      options: [
        {text: 'k = −5', value: ['-5'], tag: 'minus-only-first', feedback: 'Eksi üç terimin hepsine dağılır: <span class="st-math">4k + 3 − (3k + 2)</span>.'},
        {text: 'k = 1', value: ['1'], tag: 'root-sign', feedback: '<span class="st-math">k + 1 = 0</span> ise <span class="st-math">k = −1</span>. Kökün işaretini kaçırdın.'},
        {text: 'k = −1', value: ['-1'], correct: true, feedback: 'Artılar <span class="st-math">4k + 3</span>, eksiler <span class="st-math">3k + 2</span>. Fark <span class="st-math">k + 1 = 0</span>.'},
      ],
      reveal: {type: 'sarrus', mat: 'K3', copy: 'XK', plus: ['4k', 3, 0, '4k + 3'], minus: [2, '3k', 0, '3k + 2'], result: 'k + 1',
        rhs: '0', then: [{eq: ['k + 1 = 0', 'k = −1']}]},
      check: {expr: 'solve(det(K3), k)'},
    },
    {
      skill: 'singular',
      stageExplains: true, kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k için A tekil olur?',
      scene: {items: ['Q2', 'op:eq', 'v'], mode: 'solo'},
      labels: {v: '0'},
      options: [
        {text: 'k = 2 ya da −3', value: ['2', '-3'], tag: 'roots-sign-flipped', feedback: 'Çarpanlar <span class="st-math">(k − 3)(k + 2)</span>; kökler 3 ve −2.'},
        {text: 'k = 0 ya da 1', value: ['0', '1'], tag: 'entries-zero', feedback: 'Elemanı sıfır yapmak yetmez. Determinantı sıfırla: <span class="st-math">k² − k − 6 = 0</span>.'},
        {text: 'k = −2 ya da 3', value: ['-2', '3'], correct: true, feedback: '<span class="st-math">(k − 1)k − 6 = k² − k − 6</span>, yani <span class="st-math">(k − 3)(k + 2) = 0</span>.'},
      ],
      reveal: {type: 'det2', mat: 'Q2', values: ['(k − 1)k', 6, 'k² − k − 6'], rhs: '0', rhsFrom: 'v',
        then: [{eq: ['k² − k − 6 = 0', '(k − 3)(k + 2) = 0', 'k = −2 ya da 3']}]},
      check: {expr: 'solve(det(Q2), k)'},
    },
    {
      skill: 'sarrus',
      kind: 'choice', eyebrow: 'Sınav tipi', title: '|A| kaç?',
      scene: {items: ['N', 'XN']},
      options: [
        {text: '−5', tag: 'sign-dropped', expr: '8 - 13', feedback: '<span class="st-math">(−1)·3·4 = −12</span>, işaret düştü. Eksiler toplamı −11 olmalı.'},
        {text: '19', correct: true, feedback: 'Eksiler toplamı negatif: çıkarınca eklenir, <span class="st-math">8 − (−11) = 8 + 11</span>.'},
        {text: '−3', tag: 'added-both', expr: '8 + (-11)', feedback: 'Eksiler toplamını ekledin. Çıkarılır: <span class="st-math">8 − (−11) = 19</span>.'},
      ],
      reveal: {type: 'sarrus', mat: 'N', copy: 'XN'},
      check: {expr: 'det(N)'},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Sınav için üç cümle',
      body: '2×2: <span class="st-math">|A| = ad − bc</span>. <br>3×3: Sarrus, artılar eksi eksiler. <br><span class="st-math">det = 0</span> ise tekil, tersi yok; k için <span class="st-math">det = 0</span> çöz.',
      scene: {items: ['mascot'], mode: 'solo'},
    },
  ],
  // The secret moment (feel layer, after Bitir): never part of `steps`, so the engine's length, bar, score and records cannot change.
  moments: [
    {
      moment: 'secret', kind: 'choice', eyebrow: 'Gizli an', title: 'Hesaplamadan söyle: |A| kaç?',
      body: 'Çarpmana gerek yok, matrise bak.',
      scene: {items: ['M'], mode: 'solo'},
      options: [
        {text: '61', tag: 'plus-only', expr: '2*4*5 + 1*5*3 + 3*1*2', feedback: 'Yalnız sağa inenleri topladın. Önce sütunlara bak.'},
        {text: '0', correct: true, feedback: 'Bağımlı sütunlar: determinant 0.'},
        {text: '122', tag: 'added-both', expr: '61 + 61', feedback: 'İki toplamı topladın; biri çıkarılır. Önce sütunlara bak.'},
      ],
      reveal: {type: 'paced', endMarks: false, frames: [
        // The two source columns, then the third that they make.
        {clear: true, marks: [['M', '*', 0, 'is-col'], ['M', '*', 1, 'is-col']], work: [{text: '1. ve 2. sütun', kind: 'b', label: true}]},
        {marks: [['M', '*', 2, 'is-col']], work: [{html: '3. sütun = 1. + 2. sütun ⇒ |A| = 0', kind: 'b'}]},
      ]},
      check: {expr: 'det(M)'},
      claims: [{expr: 'det(M)', equals: 0}, {expr: 'M[0,0] + M[0,1]', equals: 3}, {expr: 'M[1,0] + M[1,1]', equals: 5}, {expr: 'M[2,0] + M[2,1]', equals: 5},
        {expr: 'M[0,0]*M[1,1]*M[2,2] + M[0,1]*M[1,2]*M[2,0] + M[0,2]*M[1,0]*M[2,1]', equals: 61}],
    },
  ],
};

/* B2 Laplace açılımı: minor, cofactor sign, expansion along the line with most zeros, 4×4, triangular. */
// Every beat ends without 'is-struck' marks: faded cells fail the contrast gate in the resting state,
// so cofactor beats are written as scripts instead of the engine's 'minor' beat.
// The 4×4 scenes share one object (Q) with per-step state, so it glides instead of leaving a ghost.
LESSONS.B2 = {
  id: 'B2',
  title: 'Kofaktör ve Laplace',
  matrices: {
    Q: {name: '4×4', values: [[1, 2, 0, 3], [0, 2, 0, 0], [4, 1, 1, 2], [2, 0, 0, 1]], bars: true},
    A: {name: 'A', values: [[2, 0, 1], [2, 1, 3], [1, 0, 4]], bars: true},
    M1: {name: 'M<sub>11</sub>', values: [[1, 3], [0, 4]], bars: true},
    M2: {name: 'M<sub>12</sub>', values: [[2, 3], [1, 4]], bars: true},
    P: {name: 'işaret', values: [[null, null, null], [null, null, null], [null, null, null]]},
    R: {name: 'C<sub>1j</sub>', values: [[4, -5, -1]]},
    B: {name: 'B', values: [[1, 4, 2], [0, 0, 3], [2, 6, 1]], bars: true},
    Q3: {name: 'M<sub>33</sub>', values: [[1, 2, 3], [0, 2, 0], [2, 0, 1]], bars: true},
    U: {name: '4×4', values: [[2, 5, 1, 3], [0, 1, 4, 2], [0, 0, 3, 7], [0, 0, 0, -1]], bars: true},
    L: {name: '4×4', values: [[3, 0, 0, 0], [5, -2, 0, 0], [1, 4, 1, 0], [7, 2, 9, 2]], bars: true},
    K: {name: 'A', values: [['k', 0, 0, 0], [2, 'k', 0, 2], [5, 4, 3, 1], [1, 2, 0, 'k']], bars: true},
  },
  labels: {
    v: '?',
    col: 'a<sub>1</sub><sub class="st-hl-row">2</sub>C<sub>1</sub><sub class="st-hl-col">3</sub> + a<sub>2</sub><sub class="st-hl-row">2</sub>C<sub>2</sub><sub class="st-hl-col">3</sub><br>+ a<sub>3</sub><sub class="st-hl-row">2</sub>C<sub>3</sub><sub class="st-hl-col">3</sub> + a<sub>4</sub><sub class="st-hl-row">2</sub>C<sub>4</sub><sub class="st-hl-col">3</sub>',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: '4×4 determinant nasıl bulunur?',
      body: 'Sarrus burada çalışmaz. <b>Laplace açılımı</b> büyük determinantı küçüklere böler. Bunu ders bitmeden çözeceksin.',
      scene: {items: ['Q', 'op:eq', 'v']},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Minör: satırı ve sütunu sil',
      body: 'a<sub>ij</sub>, i. satır ve j. sütundaki eleman. Onun satırını ve sütununu sil: kalanın determinantı <b>minör</b> M<sub>ij</sub>. Burada M<sub>11</sub> = 4.',
      scene: {items: ['A', 'op:arrow', 'M1']},
      state: {M1: [['', ''], ['', '']]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 0, 0, 'is-pivot']], work: [{html: 'a<sub>11</sub> = 2', label: true}]},
        {at: 450, marks: [['A', 0, 1, 'is-struck'], ['A', 0, 2, 'is-struck']], work: [{html: '1. satır silinir', label: true}]},
        {at: 800, marks: [['A', 1, 0, 'is-struck'], ['A', 2, 0, 'is-struck']], work: [{html: '1. sütun silinir', label: true}]},
        {at: 1150, marks: [['A', 1, 1, 'is-col'], ['A', 1, 2, 'is-col'], ['A', 2, 1, 'is-col'], ['A', 2, 2, 'is-col']],
          fly: [
            {from: ['A', 1, 1], to: ['M1', 0, 0], kind: 'col'}, {from: ['A', 1, 2], to: ['M1', 0, 1], kind: 'col'},
            {from: ['A', 2, 1], to: ['M1', 1, 0], kind: 'col'}, {from: ['A', 2, 2], to: ['M1', 1, 1], kind: 'col'}]},
        {at: 1800, set: [['M1', 0, 0, 1], ['M1', 0, 1, 3], ['M1', 1, 0, 0], ['M1', 1, 1, 4]], marks: [['M1', '*', '*', 'is-col']]},
        {at: 2250, clear: true,
          marks: [['A', 0, 0, 'is-pivot'], ['A', 1, 1, 'is-col'], ['A', 1, 2, 'is-col'], ['A', 2, 1, 'is-col'], ['A', 2, 2, 'is-col'],
            ['M1', '*', '*', 'is-col']],
          work: [{html: 'M<sub>11</sub> =', label: true}, {text: '1·4 − 3·0', kind: 'b'}, {text: '='}, {text: '4', kind: 'sum'}]},
      ]},
      claims: [{expr: 'minor(A, 1, 1)', equals: 4}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'M<sub>12</sub> kaç?',
      scene: {items: ['A', 'op:arrow', 'M2']},
      state: {M2: [[null, null], [null, null]]},
      marks: [['A', 0, 1, 'is-pivot']],
      options: [
        {text: '11', tag: 'added-diagonals', expr: '2*4 + 3*1', feedback: 'Çarpımları topladın. 2×2\'de çıkarılır: <span class="st-math">8 − 3</span>.'},
        {text: '0', tag: 'row-col-swapped', expr: 'minor(A, 2, 1)', feedback: 'Bu M<sub>21</sub>. M<sub>12</sub>\'de 1. satır ve 2. sütun silinir.'},
        {text: '5', correct: true, feedback: '1. satır ve 2. sütun gider: <span class="st-math">2·4 − 3·1 = 5</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 0, 1, 'is-pivot'], ['A', 0, 0, 'is-struck'], ['A', 0, 2, 'is-struck']]},
        {at: 400, marks: [['A', 1, 1, 'is-struck'], ['A', 2, 1, 'is-struck']]},
        {at: 800, marks: [['A', 1, 0, 'is-col'], ['A', 1, 2, 'is-col'], ['A', 2, 0, 'is-col'], ['A', 2, 2, 'is-col']],
          fly: [
            {from: ['A', 1, 0], to: ['M2', 0, 0], kind: 'col'}, {from: ['A', 1, 2], to: ['M2', 0, 1], kind: 'col'},
            {from: ['A', 2, 0], to: ['M2', 1, 0], kind: 'col'}, {from: ['A', 2, 2], to: ['M2', 1, 1], kind: 'col'}]},
        {at: 1450, set: [['M2', 0, 0, 2], ['M2', 0, 1, 3], ['M2', 1, 0, 1], ['M2', 1, 1, 4]], marks: [['M2', '*', '*', 'is-col']]},
        {at: 1900, clear: true,
          marks: [['A', 0, 1, 'is-pivot'], ['A', 1, 0, 'is-col'], ['A', 1, 2, 'is-col'], ['A', 2, 0, 'is-col'], ['A', 2, 2, 'is-col'],
            ['M2', '*', '*', 'is-col']],
          work: [{html: 'M<sub>12</sub> =', label: true}, {text: '2·4 − 3·1', kind: 'b'}, {text: '='}, {text: '5', kind: 'sum'}]},
      ]},
      check: {expr: 'minor(A, 1, 2)'},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Kofaktör: minöre işaret ekle',
      body: '<b>Kofaktör</b> <span class="st-math">C<sub>ij</sub> = (−1)<sup>i+j</sup>M<sub>ij</sub></span>. İşaret sol üstte + ile başlar, satranç tahtası gibi değişir.',
      scene: {items: ['P'], mode: 'solo'},
      state: {P: [['', '', ''], ['', '', ''], ['', '', '']]},
      beat: {type: 'script', frames: [
        {at: 100, set: [['P', 0, 0, '+']], marks: [['P', 0, 0, 'is-row']]},
        {at: 250, set: [['P', 0, 1, '-']], marks: [['P', 0, 1, 'is-col']]},
        {at: 400, set: [['P', 0, 2, '+']], marks: [['P', 0, 2, 'is-row']]},
        {at: 650, set: [['P', 1, 0, '-']], marks: [['P', 1, 0, 'is-col']]},
        {at: 800, set: [['P', 1, 1, '+']], marks: [['P', 1, 1, 'is-row']]},
        {at: 950, set: [['P', 1, 2, '-']], marks: [['P', 1, 2, 'is-col']]},
        {at: 1200, set: [['P', 2, 0, '+']], marks: [['P', 2, 0, 'is-row']]},
        {at: 1350, set: [['P', 2, 1, '-']], marks: [['P', 2, 1, 'is-col']]},
        {at: 1500, set: [['P', 2, 2, '+']], marks: [['P', 2, 2, 'is-row']]},
        {at: 1900, work: [{text: 'i + j çift → +', kind: 'a'}, {text: ','}, {text: 'tek → −', kind: 'b'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'M<sub>12</sub> = 5 ise C<sub>12</sub> kaç?',
      scene: {items: ['A', 'P']},
      state: {P: [['+', '-', '+'], ['-', '+', '-'], ['+', '-', '+']]},
      marks: [['A', 0, 1, 'is-pivot'], ['P', 0, 1, 'is-col']],
      options: [
        {text: '5', tag: 'sign-forgotten', expr: 'minor(A, 1, 2)', feedback: 'Minörü buldun, işareti unuttun. (1, 2) konumunda işaret eksi.'},
        {text: '−5', correct: true, feedback: '1 + 2 = 3 tek, işaret eksi: <span class="st-math">C<sub>12</sub> = −5</span>.'},
        {text: '0', tag: 'times-entry', expr: 'A[0,1]*cof(A, 1, 2)', feedback: 'Bu a<sub>12</sub>·C<sub>12</sub> terimi. Kofaktörde eleman çarpılmaz.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 0, 1, 'is-pivot'], ['P', 0, 1, 'is-col']],
          work: [{html: 'C<sub>12</sub> =', label: true}, {html: '(−1)<sup>1+2</sup>', ref: 'sign'}, {html: 'M<sub>12</sub>', kind: 'b'}]},
        {at: 1100, work: [{html: 'C<sub>12</sub> =', label: true}, {text: '(−1)·5', kind: 'b'}, {text: '='}, {text: '−5', kind: 'sum'}]},
      ]},
      check: {expr: 'cof(A, 1, 2)'},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'C<sub>13</sub> kaç?',
      scene: {items: ['A', 'P']},
      state: {P: [['+', '-', '+'], ['-', '+', '-'], ['+', '-', '+']]},
      marks: [['A', 0, 2, 'is-pivot'], ['P', 0, 2, 'is-row']],
      answer: -1,
      feedbackRight: '1 + 3 = 4 çift, işaret artı: <span class="st-math">C<sub>13</sub> = +(2·0 − 1·1) = −1</span>.',
      feedbackWrong: 'Minör <span class="st-math">2·0 − 1·1 = −1</span>. İşaret artı, yani <span class="st-math">C<sub>13</sub> = −1</span>.',
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 0, 2, 'is-pivot'], ['A', 0, 0, 'is-struck'], ['A', 0, 1, 'is-struck']]},
        {at: 400, marks: [['A', 1, 2, 'is-struck'], ['A', 2, 2, 'is-struck']]},
        {at: 800, marks: [['A', 1, 0, 'is-col'], ['A', 1, 1, 'is-col'], ['A', 2, 0, 'is-col'], ['A', 2, 1, 'is-col']]},
        {at: 1300, clear: true, marks: [['A', 0, 2, 'is-pivot'], ['A', 1, 0, 'is-col'], ['A', 1, 1, 'is-col'], ['A', 2, 0, 'is-col'],
          ['A', 2, 1, 'is-col'], ['P', 0, 2, 'is-row']],
          work: [{html: 'C<sub>13</sub> =', label: true}, {text: '+(2·0 − 1·1)', kind: 'b'}, {text: '='}, {text: '−1', kind: 'sum'}]},
      ]},
      check: {expr: 'cof(A, 1, 3)'},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Satır ya da sütun boyunca: eleman × kofaktör',
      body: 'Bir satır ya da sütun seç. Her elemanı kendi kofaktörüyle çarp ve topla: <span class="st-math">a<sub>11</sub>C<sub>11</sub> + a<sub>12</sub>C<sub>12</sub> + a<sub>13</sub>C<sub>13</sub> = det A</span>.',
      scene: {items: ['A', 'R']},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 0, '*', 'is-row'], ['R', 0, '*', 'is-col']], work: [
          {text: '8', kind: 'a', hidden: true, ref: 't1'}, {text: '+', hidden: true, ref: 'p1'},
          {text: '0', kind: 'a', hidden: true, ref: 't2'}, {text: '+', hidden: true, ref: 'p2'},
          {text: '(−1)', kind: 'a', hidden: true, ref: 't3'}, {text: '=', hidden: true, ref: 'eq'},
          {text: '7', kind: 'sum', hidden: true, ref: 'sum'}]},
        {at: 200, fly: [{from: ['A', 0, 0], to: 'work:t1', kind: 'row'}, {from: ['R', 0, 0], to: 'work:t1', kind: 'col'}]},
        {at: 900, reveal: ['p1'], fly: [{from: ['A', 0, 1], to: 'work:t2', kind: 'row'}, {from: ['R', 0, 1], to: 'work:t2', kind: 'col'}]},
        {at: 1600, reveal: ['p2'], fly: [{from: ['A', 0, 2], to: 'work:t3', kind: 'row'}, {from: ['R', 0, 2], to: 'work:t3', kind: 'col'}]},
        {at: 2400, reveal: ['eq', 'sum']},
      ]},
      claims: [
        {expr: 'cof(A, 1, 1)', equals: 4}, {expr: 'cof(A, 1, 2)', equals: -5}, {expr: 'cof(A, 1, 3)', equals: -1},
        {expr: 'det(A)', equals: 7},
      ],
    },
    {
      kind: 'explain', eyebrow: 'Kısayol', title: 'En çok sıfırlı sütunu seç',
      body: 'Sıfır çarpı kofaktör sıfırdır, hesaplamazsın. 2. sütunda tek terim kalır: <span class="st-math">det A = 1·C<sub>22</sub> = 7</span>.',
      scene: {items: ['A'], mode: 'solo'},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', '*', 1, 'is-col']], work: [{text: '2. sütun: 0, 1, 0', label: true}]},
        {at: 800, clear: true, marks: [['A', 0, 1, 'is-struck'], ['A', 2, 1, 'is-struck'], ['A', 1, 1, 'is-pivot']],
          work: [{html: 'det A = 1·C<sub>22</sub>', label: true}]},
        {at: 1500, marks: [['A', 1, 0, 'is-struck'], ['A', 1, 2, 'is-struck']]},
        {at: 2000, clear: true, marks: [['A', 1, 1, 'is-pivot'], ['A', 0, 0, 'is-col'], ['A', 0, 2, 'is-col'], ['A', 2, 0, 'is-col'], ['A', 2, 2, 'is-col']],
          work: [{html: 'C<sub>22</sub> =', label: true}, {text: '+(2·4 − 1·1)', kind: 'b'}, {text: '='}, {text: '7', kind: 'sum'}]},
      ]},
      claims: [{expr: 'cof(A, 2, 2)', equals: 7}, {expr: 'det(A)', equals: 7}],
    },
    {
      kind: 'explain', eyebrow: 'Tuzak', title: 'İşaret sayıdan değil, konumdan gelir',
      body: 'a<sub>23</sub> = 3 pozitif, ama (2, 3) konumunun işareti eksi. 2. satırın işaretleri − + − diye gider.',
      scene: {items: ['B', 'P']},
      state: {P: [['+', '-', '+'], ['-', '+', '-'], ['+', '-', '+']]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['B', 1, '*', 'is-row']], work: [{text: '2. satır', label: true}]},
        {at: 700, marks: [['P', 1, 0, 'is-col'], ['P', 1, 1, 'is-row'], ['P', 1, 2, 'is-col']],
          work: [{text: '2. satır', label: true}, {text: '− + −', kind: 'b'}]},
        {at: 1500, clear: true, marks: [['B', 1, 2, 'is-pivot'], ['P', 1, 2, 'is-col']],
          work: [{html: 'a<sub>23</sub> = 3', label: true}, {text: '→'}, {text: 'işaret −', kind: 'b'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '2. satırdan aç: |B| kaç?',
      scene: {items: ['B', 'P']},
      state: {P: [['+', '-', '+'], ['-', '+', '-'], ['+', '-', '+']]},
      marks: [['B', 1, '*', 'is-row']],
      options: [
        {text: '−6', tag: 'sign-forgotten', expr: '-det(B)', feedback: '(2, 3) konumunda işaret eksi: <span class="st-math">−(6 − 8) = +2</span>, sonuç 6.'},
        {text: '6', correct: true, feedback: '<span class="st-math">C<sub>23</sub> = −(1·6 − 4·2) = 2</span>, <span class="st-math">|B| = 3·2 = 6</span>.'},
        {text: '2', tag: 'forgot-entry', expr: 'cof(B, 2, 3)', feedback: 'Bu C<sub>23</sub>. Terimi a<sub>23</sub> ile çarp: <span class="st-math">3·2 = 6</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['B', 1, 2, 'is-pivot'], ['B', 1, 0, 'is-struck'], ['B', 1, 1, 'is-struck']],
          work: [{html: 'sıfırlar düşer:', label: true}, {html: '3·C<sub>23</sub>', kind: 'a'}]},
        {at: 700, marks: [['B', 0, 2, 'is-struck'], ['B', 2, 2, 'is-struck'], ['B', 0, 0, 'is-col'], ['B', 0, 1, 'is-col'], ['B', 2, 0, 'is-col'], ['B', 2, 1, 'is-col']]},
        {at: 1300, clear: true, marks: [['B', 1, 2, 'is-pivot'], ['B', 0, 0, 'is-col'], ['B', 0, 1, 'is-col'], ['B', 2, 0, 'is-col'], ['B', 2, 1, 'is-col'], ['P', 1, 2, 'is-col']],
          work: [{html: 'C<sub>23</sub> =', label: true}, {text: '−(1·6 − 4·2)', kind: 'b'}, {text: '='}, {text: '2', kind: 'sum'}]},
        {at: 2300, work: [{html: '|B| = 3·2 =', label: true}, {text: '6', kind: 'sum'}]},
      ]},
      check: {expr: 'det(B)'},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '<span class="st-hl-row">3. satır</span> × <span class="st-hl-col">C<sub>1j</sub></span>: toplam kaç?',
      scene: {items: ['A', 'R']},
      marks: [['A', 2, '*', 'is-row'], ['R', 0, '*', 'is-col']],
      options: [
        {text: '7', tag: 'alien-as-det', expr: 'det(A)', feedback: 'det A, satır kendi kofaktörleriyle eşlenince çıkar. Burada satırlar farklı.'},
        {text: '0', correct: true, feedback: 'Bu toplam, 1. satırın yerine 3. satır yazılmış matrisin det\'i. İki satırı aynı: 0.'},
        {text: '−7', tag: 'row-swap-sign', expr: '-det(A)', feedback: 'Satır yer değiştirmedi. <span class="st-math">1·4 + 0·(−5) + 4·(−1) = 0</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 2, '*', 'is-row'], ['R', 0, '*', 'is-col']], work: [
          {text: '4', kind: 'a', hidden: true, ref: 't1'}, {text: '+', hidden: true, ref: 'p1'},
          {text: '0', kind: 'a', hidden: true, ref: 't2'}, {text: '−', hidden: true, ref: 'p2'},
          {text: '4', kind: 'a', hidden: true, ref: 't3'}, {text: '=', hidden: true, ref: 'eq'},
          {text: '0', kind: 'sum', hidden: true, ref: 'sum'}],
          fly: [{from: ['A', 2, 0], to: 'work:t1', kind: 'row'}, {from: ['R', 0, 0], to: 'work:t1', kind: 'col'}]},
        {at: 650, reveal: ['p1'], fly: [{from: ['A', 2, 1], to: 'work:t2', kind: 'row'}, {from: ['R', 0, 1], to: 'work:t2', kind: 'col'}]},
        {at: 1300, reveal: ['p2'], fly: [{from: ['A', 2, 2], to: 'work:t3', kind: 'row'}, {from: ['R', 0, 2], to: 'work:t3', kind: 'col'}]},
        {at: 2000, reveal: ['eq', 'sum']},
      ]},
      check: {expr: 'A[2,0]*cof(A, 1, 1) + A[2,1]*cof(A, 1, 2) + A[2,2]*cof(A, 1, 3)'},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: '4×4: üç sıfırlı sütundan aç',
      body: '3. sütunda yalnız a<sub>33</sub> sıfır değil. 3 + 3 çift, işaret artı. Geriye 3×3 minör kalır: M<sub>33</sub>.',
      scene: {items: ['Q']},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['Q', '*', 2, 'is-col']], work: [{text: '3. sütun: 0, 0, 1, 0', label: true}]},
        {at: 900, clear: true, marks: [['Q', 0, 2, 'is-struck'], ['Q', 1, 2, 'is-struck'], ['Q', 3, 2, 'is-struck'], ['Q', 2, 2, 'is-pivot']],
          work: [{html: 'det = 1·C<sub>33</sub>', label: true}]},
        {at: 1600, marks: [['Q', 2, 0, 'is-struck'], ['Q', 2, 1, 'is-struck'], ['Q', 2, 3, 'is-struck']]},
        {at: 2200, clear: true, marks: [['Q', 2, 2, 'is-pivot'],
          ['Q', 0, 0, 'is-col'], ['Q', 0, 1, 'is-col'], ['Q', 0, 3, 'is-col'], ['Q', 1, 0, 'is-col'], ['Q', 1, 1, 'is-col'],
          ['Q', 1, 3, 'is-col'], ['Q', 3, 0, 'is-col'], ['Q', 3, 1, 'is-col'], ['Q', 3, 3, 'is-col']],
          work: [{html: 'det = 1·(+M<sub>33</sub>)', kind: 'sum'}]},
      ]},
      claims: [{expr: 'det(Q)', equals: 'minor(Q, 3, 3)'}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'M<sub>33</sub>\'ü aç: 4×4 det kaç?',
      scene: {items: ['Q3']},
      marks: [['Q3', 1, '*', 'is-row']],
      options: [
        {text: '−5', tag: 'forgot-entry', expr: 'cof(Q3, 2, 2)', feedback: 'Bu C<sub>22</sub>. a<sub>22</sub> = 2 ile çarp: <span class="st-math">2·(−5) = −10</span>.'},
        {text: '10', tag: 'diagonals-reversed', expr: '-det(Q)', feedback: '2×2\'de önce ana köşegen: <span class="st-math">1·1 − 3·2 = −5</span>, sonra 2 ile çarp.'},
        {text: '−10', correct: true, feedback: '<span class="st-math">C<sub>22</sub> = 1·1 − 3·2 = −5</span>, <span class="st-math">det = 2·(−5) = −10</span>. Baştaki sorunun cevabı bu.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['Q3', 1, 1, 'is-pivot'], ['Q3', 1, 0, 'is-struck'], ['Q3', 1, 2, 'is-struck']],
          work: [{html: 'sıfırlar düşer:', label: true}, {html: '2·C<sub>22</sub>', kind: 'a'}]},
        {at: 700, marks: [['Q3', 0, 1, 'is-struck'], ['Q3', 2, 1, 'is-struck'],
          ['Q3', 0, 0, 'is-col'], ['Q3', 0, 2, 'is-col'], ['Q3', 2, 0, 'is-col'], ['Q3', 2, 2, 'is-col']]},
        {at: 1300, clear: true, marks: [['Q3', 1, 1, 'is-pivot'], ['Q3', 0, 0, 'is-col'], ['Q3', 0, 2, 'is-col'], ['Q3', 2, 0, 'is-col'], ['Q3', 2, 2, 'is-col']],
          work: [{html: 'C<sub>22</sub> =', label: true}, {text: '+(1·1 − 3·2)', kind: 'b'}, {text: '='}, {text: '−5', kind: 'sum'}]},
        {at: 2300, work: [{html: 'det = 2·(−5) =', label: true}, {text: '−10', kind: 'sum'}]},
      ]},
      check: {expr: 'det(Q)'},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Üçgen matris: köşegeni çarp',
      body: 'Köşegenin altı hep 0 ise <b>üst üçgen</b>, üstü hep 0 ise <b>alt üçgen</b>. Üst üçgende 1. sütundan aç: her seferinde yalnız köşegendeki sayı kalır. Determinant, köşegenin çarpımıdır.',
      scene: {items: ['Q']},
      state: {Q: [[2, 5, 1, 3], [0, 1, 4, 2], [0, 0, 3, 7], [0, 0, 0, -1]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['Q', '*', 0, 'is-col']], work: [
          {text: '2', kind: 'a', hidden: true, ref: 'd0'}, {text: '·', hidden: true, ref: 'x1'},
          {text: '1', kind: 'a', hidden: true, ref: 'd1'}, {text: '·', hidden: true, ref: 'x2'},
          {text: '3', kind: 'a', hidden: true, ref: 'd2'}, {text: '·', hidden: true, ref: 'x3'},
          {text: '(−1)', kind: 'a', hidden: true, ref: 'd3'}, {text: '=', hidden: true, ref: 'eq'},
          {text: '−6', kind: 'sum', hidden: true, ref: 'sum'}]},
        {at: 450, clear: true, marks: [['Q', 0, 0, 'is-pivot'], ['Q', 0, 1, 'is-struck'], ['Q', 0, 2, 'is-struck'], ['Q', 0, 3, 'is-struck'],
          ['Q', 1, 0, 'is-struck'], ['Q', 2, 0, 'is-struck'], ['Q', 3, 0, 'is-struck']],
          fly: [{from: ['Q', 0, 0], to: 'work:d0', kind: 'row'}]},
        {at: 1000, marks: [['Q', 1, 1, 'is-pivot'], ['Q', 1, 2, 'is-struck'], ['Q', 1, 3, 'is-struck'], ['Q', 2, 1, 'is-struck'], ['Q', 3, 1, 'is-struck']],
          reveal: ['x1'], fly: [{from: ['Q', 1, 1], to: 'work:d1', kind: 'row'}]},
        {at: 1550, marks: [['Q', 2, 2, 'is-pivot'], ['Q', 2, 3, 'is-struck'], ['Q', 3, 2, 'is-struck']],
          reveal: ['x2'], fly: [{from: ['Q', 2, 2], to: 'work:d2', kind: 'row'}]},
        {at: 2100, marks: [['Q', 3, 3, 'is-pivot']], reveal: ['x3'], fly: [{from: ['Q', 3, 3], to: 'work:d3', kind: 'row'}]},
        {at: 2650, clear: true, marks: [['Q', 0, 0, 'is-row'], ['Q', 1, 1, 'is-row'], ['Q', 2, 2, 'is-row'], ['Q', 3, 3, 'is-row']],
          reveal: ['eq', 'sum']},
      ]},
      claims: [{expr: 'det(U)', equals: -6}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Alt üçgen matriste det kaç?',
      scene: {items: ['Q']},
      state: {Q: [[3, 0, 0, 0], [5, -2, 0, 0], [1, 4, 1, 0], [7, 2, 9, 2]]},
      options: [
        {text: '4', tag: 'trace-not-det', expr: 'tr(L)', feedback: 'Köşegeni topladın, bu iz. Determinantta köşegen çarpılır.'},
        {text: '−12', correct: true, feedback: 'Alt üçgende 1. satırdan aç; yine köşegen kalır: <span class="st-math">3·(−2)·1·2 = −12</span>.'},
        {text: '12', tag: 'sign-dropped', expr: '-det(L)', feedback: '−2\'nin işaretini kaybettin: <span class="st-math">3·(−2)·1·2 = −12</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['Q', 0, 0, 'is-row'], ['Q', 1, 1, 'is-row'], ['Q', 2, 2, 'is-row'], ['Q', 3, 3, 'is-row']],
          work: [{text: '3·(−2)·1·2', kind: 'a'}, {text: '=', hidden: true, ref: 'eq'}, {text: '−12', kind: 'sum', hidden: true, ref: 'sum'}]},
        {at: 700, reveal: ['eq', 'sum']},
      ]},
      check: {expr: 'det(L)'},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: '4×4 A için |A| = 6. Bu toplam kaç?',
      scene: {items: ['col', 'op:eq', 'v'], mode: 'solo'},
      options: [
        {text: '6', tag: 'alien-as-det', feedback: 'Kendi sütununun kofaktörleri |A| verir. Burada 2. sütun, 3. sütunun kofaktörleriyle.'},
        {text: '−6', tag: 'col-swap-sign', feedback: 'Sütun yer değiştirmedi; 3. sütunun yerine 2. sütun yazıldı. İki sütun aynı: 0.'},
        {text: '0', correct: true, feedback: '2. sütun, 3. sütunun kofaktörleriyle: iki sütunu aynı bir matrisin det\'i, 0.'},
      ],
      check: {
        expr: 'G[0,1]*cof(G, 1, 3) + G[1,1]*cof(G, 2, 3) + G[2,1]*cof(G, 3, 3) + G[3,1]*cof(G, 4, 3)',
        given: {G: [[1, 2, 0, 1], [0, 1, 3, 0], [0, 0, 1, 2], [0, 0, 0, 6]]},
      },
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k değerleri için A tekil?',
      scene: {items: ['K']},
      options: [
        {text: 'k = −2 ya da 2', value: ['-2', '2'], tag: 'lost-k-root', feedback: 'k = 0 da kök. 1. satırdan açınca dışarıda kalan k çarpanını unutma.'},
        {text: 'k = 0 ya da 2', value: ['0', '2'], tag: 'missed-negative-root', feedback: '<span class="st-math">k² = 4</span>\'ün iki kökü var: −2 de.'},
        {text: 'k = −2, 0 ya da 2', value: ['-2', '0', '2'], correct: true, feedback: 'Önce 1. satırdan, sonra 3\'lü sütundan açıldı. <span class="st-math">k = 0</span> da bir kök.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['K', 0, 0, 'is-pivot'], ['K', 0, 1, 'is-struck'], ['K', 0, 2, 'is-struck'], ['K', 0, 3, 'is-struck']],
          work: [{html: 'k·M<sub>11</sub>', kind: 'a'}]},
        {at: 800, marks: [['K', 1, 0, 'is-struck'], ['K', 2, 0, 'is-struck'], ['K', 3, 0, 'is-struck'],
          ['K', 1, 2, 'is-struck'], ['K', 3, 2, 'is-struck'], ['K', 2, 2, 'is-pivot']],
          work: [{html: 'k·3·', kind: 'a'}, {html: '(k·k − 2·2)', kind: 'b'}]},
        {at: 1600, clear: true, marks: [['K', 0, 0, 'is-pivot'], ['K', 2, 2, 'is-pivot'],
          ['K', 1, 1, 'is-row'], ['K', 1, 3, 'is-row'], ['K', 3, 1, 'is-row'], ['K', 3, 3, 'is-row']],
          work: [{text: '3k(k² − 4) = 0', kind: 'a'}]},
        {at: 2400, work: [{text: '3k(k² − 4) = 0', kind: 'a'}, {text: '→'}, {text: 'k = −2, 0 ya da 2', kind: 'sum'}]},
      ]},
      check: {expr: 'sorted(solve(det(K), k))'},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Laplace\'ı üç adımda hatırla',
      body: 'En çok sıfırlı satırı ya da sütunu seç. <br>Eleman × kofaktör; işaret tahtası + − +. <br>Başka satırın kofaktörleriyle toplam 0; üçgende köşegeni çarp.',
      scene: {items: ['mascot'], mode: 'solo'},
    },
  ],
};

/* B3 Determinant özellikleri 1: how each row operation changes det, det(cA) = cⁿ·det A, zero rows. */

LESSONS.B3 = {
  id: 'B3',
  title: 'Satır işlemleri ve det',
  matrices: {
    S: {name: '', values: [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']], bars: true},
    B: {name: '', values: [['d', 'e', 'f'], ['2a', '2b', '2c'], ['g+3d', 'h+3e', 'i+3f']], bars: true},
    C: {name: '', values: [['g', 'h', 'i'], ['-3d', '-3e', '-3f'], ['a+2g', 'b+2h', 'c+2i']], bars: true},
    P: {name: '', values: [[2, 1], [4, 5]], bars: true},
    R: {name: '', values: [[2, 1, 3], [0, 3, 1], [4, 2, 5]], bars: true},
    Z: {name: '', values: [[1, 2, 3], [5, 0, 1], [2, 4, 6]], bars: true},
    K: {name: '', values: [[1, 2, 3], [4, 5, 6], [2, 4, 'k']], bars: true},
    X: {name: '', values: [['x', 'y', 'z', 't'], ['-x', 'y', '-z', '-t'], ['-x', '-y', 'z', '-t'], ['-x', '-y', '-z', 't']], bars: true},
    W: {name: '', values: [['1+a', 1, 1], [1, '1+a', 1], [1, 1, '1+a']], bars: true},
    V: {name: '', values: [['1+a', 1, 1], [1, '1+b', 1], [1, 1, '1+c']], bars: true},
  },
  labels: {k: '= −4', v: '= ?', q: 'det(3A) = ?', f: ''},
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: '<span class="st-math">|A| = −4</span>. Satırlar böyle değişirse det kaç?',
      body: 'Sınavda sık çıkan bir soru tipi. Matrisi bilmeden, üç kuralla yarım dakikada çözeceksin.',
      scene: {items: ['S', 'k'], mode: 'solo'},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['S', 0, '*', 'is-row'], ['S', 1, '*', 'is-row'], ['S', 1, '*', 'is-target']],
          work: [{html: 'R<sub>1</sub> ↔ R<sub>2</sub>', label: true}]},
        {at: 250, set: [['S', 0, 0, ''], ['S', 0, 1, ''], ['S', 0, 2, ''], ['S', 1, 0, ''], ['S', 1, 1, ''], ['S', 1, 2, '']], fly: [
          {from: ['S', 0, 0], to: ['S', 1, 0], kind: 'row', text: 'a'},
          {from: ['S', 1, 0], to: ['S', 0, 0], kind: 'row', text: 'd'},
          {from: ['S', 0, 1], to: ['S', 1, 1], kind: 'row', text: 'b'},
          {from: ['S', 1, 1], to: ['S', 0, 1], kind: 'row', text: 'e'},
          {from: ['S', 0, 2], to: ['S', 1, 2], kind: 'row', text: 'c'},
          {from: ['S', 1, 2], to: ['S', 0, 2], kind: 'row', text: 'f'},
        ]},
        {at: 800, clear: true, marks: [['S', 0, '*', 'is-row'], ['S', 0, '*', 'is-target'], ['S', 1, '*', 'is-row']],
          set: [['S', 0, 0, 'd'], ['S', 0, 1, 'e'], ['S', 0, 2, 'f'], ['S', 1, 0, 'a'], ['S', 1, 1, 'b'], ['S', 1, 2, 'c']]},
        {at: 1100, clear: true, marks: [['S', 1, '*', 'is-row']], work: [{html: 'R<sub>2</sub> → 2R<sub>2</sub>', label: true}]},
        {at: 1350, set: [['S', 1, 0, '2a'], ['S', 1, 1, '2b'], ['S', 1, 2, '2c']]},
        {at: 1750, clear: true, marks: [['S', 2, '*', 'is-row']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> + 3R<sub>1</sub>', label: true}]},
        {at: 2000, set: [['S', 2, 0, 'g+3d'], ['S', 2, 1, 'h+3e'], ['S', 2, 2, 'i+3f']]},
        {at: 2400, clear: true, label: ['k', '= ?'], work: [{html: 'R<sub>1</sub>↔R<sub>2</sub>, R<sub>2</sub>→2R<sub>2</sub>, R<sub>3</sub>→R<sub>3</sub>+3R<sub>1</sub>', label: true}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Tahmin et', title: 'Bu det 6. Satırlar yer değiştirdi, şimdi kaç?',
      scene: {items: ['P', 'v'], mode: 'solo'},
      labels: {v: '= 6'},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['P', 0, '*', 'is-row'], ['P', 1, '*', 'is-row'], ['P', 1, '*', 'is-target']],
          work: [{html: 'R<sub>1</sub> ↔ R<sub>2</sub>', label: true}]},
        {at: 250, set: [['P', 0, 0, ''], ['P', 0, 1, ''], ['P', 1, 0, ''], ['P', 1, 1, '']], fly: [
          {from: ['P', 0, 0], to: ['P', 1, 0], kind: 'row', text: '2'},
          {from: ['P', 1, 0], to: ['P', 0, 0], kind: 'row', text: '4'},
          {from: ['P', 0, 1], to: ['P', 1, 1], kind: 'row', text: '1'},
          {from: ['P', 1, 1], to: ['P', 0, 1], kind: 'row', text: '5'},
        ]},
        {at: 800, clear: true, marks: [['P', 0, '*', 'is-row'], ['P', 0, '*', 'is-target'], ['P', 1, '*', 'is-row']],
          set: [['P', 0, 0, 4], ['P', 0, 1, 5], ['P', 1, 0, 2], ['P', 1, 1, 1]]},
        {at: 1050, label: ['v', '= ?']},
      ]},
      answer: -6,
      check: {expr: 'det(Matrix([[4, 5], [2, 1]]))'},
      claims: [{expr: 'det(P)', equals: 6}],
      feedbackRight: 'Sayılar aynı, sıra ters: <span class="st-math">4·1 − 5·2 = −6</span>. İşaret döndü.',
      feedbackWrong: 'Yeniden hesapla: <span class="st-math">4·1 − 5·2 = −6</span>. Yer değiştirme işareti çevirir.',
      reveal: {type: 'det2', mat: 'P', into: ['v', '= {v}']},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Satır değiştirmek işareti çevirir',
      body: 'Her yer değiştirme det\'i −1 ile çarpar. İki kez değiştirirsen işaret geri döner.',
      scene: {items: ['S', 'k'], mode: 'solo'},
      claims: [{expr: '-1*(-4)', equals: 4}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['S', 0, '*', 'is-row'], ['S', 1, '*', 'is-row'], ['S', 1, '*', 'is-target']],
          work: [{html: 'R<sub>1</sub> ↔ R<sub>2</sub>', label: true}]},
        {at: 250, set: [['S', 0, 0, ''], ['S', 0, 1, ''], ['S', 0, 2, ''], ['S', 1, 0, ''], ['S', 1, 1, ''], ['S', 1, 2, '']], fly: [
          {from: ['S', 0, 0], to: ['S', 1, 0], kind: 'row', text: 'a'},
          {from: ['S', 1, 0], to: ['S', 0, 0], kind: 'row', text: 'd'},
          {from: ['S', 0, 1], to: ['S', 1, 1], kind: 'row', text: 'b'},
          {from: ['S', 1, 1], to: ['S', 0, 1], kind: 'row', text: 'e'},
          {from: ['S', 0, 2], to: ['S', 1, 2], kind: 'row', text: 'c'},
          {from: ['S', 1, 2], to: ['S', 0, 2], kind: 'row', text: 'f'},
        ]},
        {at: 800, clear: true, marks: [['S', 0, '*', 'is-row'], ['S', 0, '*', 'is-target'], ['S', 1, '*', 'is-row']],
          set: [['S', 0, 0, 'd'], ['S', 0, 1, 'e'], ['S', 0, 2, 'f'], ['S', 1, 0, 'a'], ['S', 1, 1, 'b'], ['S', 1, 2, 'c']]},
        {at: 1150, label: ['k', '= <span class="st-hl-result">4</span>'],
          work: [{html: 'R<sub>1</sub> ↔ R<sub>2</sub>', label: true}, {html: 'det → −det', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tahmin et', title: 'Bu det 6 idi. R<sub>2</sub> üçle çarpıldı, şimdi kaç?',
      scene: {items: ['P', 'v'], mode: 'solo'},
      beat: {type: 'rowScale', mat: 'P', row: 1, factor: 3},
      check: {expr: 'det(Matrix([[2, 1], [12, 15]]))'},
      claims: [{expr: 'det(P)', equals: 6}],
      options: [
        {text: '54', tag: 'scaled-whole-matrix', expr: '3**2*det(P)',
          feedback: 'Bu 3A olurdu: <span class="st-math">3²·6</span>. Burada yalnız bir satır çarpıldı.'},
        {text: '18', correct: true,
          feedback: 'Bir satırı 3 ile çarpmak det\'i 3 ile çarpar: <span class="st-math">3·6 = 18</span>.'},
        {text: '6', tag: 'scale-ignored', expr: 'det(P)',
          feedback: 'Satır çarpımı det\'i değiştirir: <span class="st-math">2·15 − 1·12 = 18</span>.'},
      ],
      reveal: {type: 'det2', mat: 'P', into: ['v', '= {v}']},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Bir satırı c ile çarp: det de c ile çarpılır',
      body: 'Çarpan yalnız o satırdan gelir. Tersi de doğru: bir satırın ortak çarpanı det\'in önüne çıkar.',
      scene: {items: ['S', 'k'], mode: 'solo'},
      claims: [{expr: '3*(-4)', equals: -12}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['S', 0, '*', 'is-row']],
          work: [{html: 'R<sub>1</sub> → 3R<sub>1</sub>', label: true}]},
        {at: 550, set: [['S', 0, 0, '3a'], ['S', 0, 1, '3b'], ['S', 0, 2, '3c']]},
        {at: 1100, clear: true, marks: [['S', 0, '*', 'is-result']],
          label: ['k', '= <span class="st-hl-result">−12</span>'],
          work: [{html: 'R<sub>1</sub> → 3R<sub>1</sub>', label: true}, {html: 'det → 3·det', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tahmin et',
      title: 'Bu det 6 idi. <span class="st-math">R<sub>2</sub> → R<sub>2</sub> − 2R<sub>1</sub></span> yapıldı. Şimdi?',
      scene: {items: ['P', 'v'], mode: 'aug'},
      beat: {type: 'rowOp', mat: 'P', source: 0, target: 1, factor: -2},
      check: {expr: 'det(Matrix([[2, 1], [0, 3]]))'},
      claims: [{expr: 'det(P)', equals: 6}],
      options: [
        {text: '6', correct: true,
          feedback: 'Bir satıra kat eklemek det\'i değiştirmez: <span class="st-math">2·3 − 1·0 = 6</span>.'},
        {text: '−12', tag: 'factor-multiplied', expr: '-2*det(P)',
          feedback: 'R<sub>2</sub>\'yi −2 ile çarpmadın; R<sub>2</sub>\'ye R<sub>1</sub>\'in katını ekledin. Bu det\'i değiştirmez.'},
        {text: '−6', tag: 'minus-carried', expr: '-det(P)',
          feedback: 'İşlemdeki eksi det\'e geçmez. Satır eklemek det\'i aynı bırakır.'},
      ],
      reveal: {type: 'det2', mat: 'P', into: ['v', '= {v}']},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Kat eklemek det\'i değiştirmez',
      body: 'Bir satıra başka satırın katını eklemek det\'i korur; doğru kat seçilirse bir sıfır da doğar. Üçgen matrisin det\'i köşegen çarpımıdır: <span class="st-math">2·3 = 6</span>.',
      scene: {items: ['P', 'v'], mode: 'aug'},
      state: {P: [[2, 1], [0, 3]]},
      labels: {v: '= 6'},
      claims: [{expr: 'det(Matrix([[2, 1], [0, 3]]))', equals: 6}, {expr: '2*3', equals: 6}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['P', 1, 0, 'is-target']], work: [{html: 'üçgen: köşegeni çarp', label: true}]},
        {at: 600, clear: true, marks: [['P', 0, 0, 'is-row'], ['P', 1, 1, 'is-row']],
          work: [
            {text: '2', kind: 'a', ref: 'p0', hidden: true}, {text: '·', ref: 'dot', hidden: true},
            {text: '3', kind: 'a', ref: 'p1', hidden: true}, {text: '=', ref: 'eq', hidden: true},
            {text: '6', kind: 'sum', ref: 'sum', hidden: true},
          ],
          fly: [{from: ['P', 0, 0], to: 'work:p0', kind: 'row'}]},
        {at: 850, reveal: ['dot'], fly: [{from: ['P', 1, 1], to: 'work:p1', kind: 'row'}]},
        {at: 1550, reveal: ['eq', 'sum'], clear: true, marks: [['P', 0, 0, 'is-result'], ['P', 1, 1, 'is-result']]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Tek satır işlemiyle üçgen yap. det kaç?',
      scene: {items: ['R', 'v'], mode: 'aug'},
      check: {expr: 'det(R)'},
      options: [
        {text: '30', tag: 'diag-before-triangular', expr: '2*3*5',
          feedback: 'Köşegen çarpımı yalnız üçgende geçerli. Önce <span class="st-math">R<sub>3</sub> → R<sub>3</sub> − 2R<sub>1</sub></span>.'},
        {text: '6', tag: 'sign-slip', expr: '2*3*1',
          feedback: 'Son eleman <span class="st-math">5 − 2·3 = −1</span>, +1 değil: <span class="st-math">2·3·(−1) = −6</span>.'},
        {text: '−6', correct: true,
          feedback: '<span class="st-math">R<sub>3</sub> → R<sub>3</sub> − 2R<sub>1</sub></span> ile R<sub>3</sub> = (0, 0, −1). det = <span class="st-math">2·3·(−1) = −6</span>.'},
      ],
      reveal: {type: 'rowOp', mat: 'R', source: 0, target: 2, factor: -2},
    },
    {
      kind: 'explain', eyebrow: 'Tuzak', title: 'Tuzak: det(3A) ≠ 3·det A',
      body: '3A\'da her satır 3 ile çarpılır. Her satır det\'e bir 3 çarpanı getirir: <span class="st-math">3·3·6 = 54</span>. n×n\'de <span class="st-math">det(cA) = cⁿ·det A</span>.',
      scene: {items: ['P', 'v'], mode: 'solo'},
      labels: {v: '= 6'},
      claims: [{expr: 'det(3*P)', equals: 54}, {expr: '3*3*6', equals: 54}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['P', 0, '*', 'is-row']], work: [
          {html: 'det(3A) =', label: true},
          {text: '3', kind: 'a', ref: 'f1', hidden: true}, {text: '·', ref: 'x1', hidden: true},
          {text: '3', kind: 'a', ref: 'f2', hidden: true}, {text: '·', ref: 'x2', hidden: true},
          {text: '6', ref: 'd', hidden: true}, {text: '= 54', kind: 'sum', ref: 's', hidden: true},
        ]},
        {at: 500, set: [['P', 0, 0, 6], ['P', 0, 1, 3]], reveal: ['f1']},
        {at: 1050, clear: true, marks: [['P', 1, '*', 'is-row']]},
        {at: 1400, set: [['P', 1, 0, 12], ['P', 1, 1, 15]], reveal: ['x1', 'f2']},
        {at: 2000, clear: true, reveal: ['x2', 'd', 's'], label: ['v', '= <span class="st-hl-result">54</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'A 4×4 ve |A| = 2. det(3A) kaç?',
      scene: {items: ['q'], mode: 'solo'},
      check: {expr: '3**4*2'},
      options: [
        {text: '6', tag: 'c-times-det', expr: '3*2',
          feedback: 'Klasik tuzak. 3 her satırdan ayrı çıkar, 4 satır var: <span class="st-math">3⁴·2</span>.'},
        {text: '162', correct: true,
          feedback: 'Dört satır, dört tane 3: <span class="st-math">3⁴·2 = 81·2 = 162</span>.'},
        {text: '24', tag: 'n-times-c', expr: '4*3*2',
          feedback: '4 ile 3\'ü çarptın. 3 dört kez çarpan olur: <span class="st-math">3⁴ = 81</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['q', 'det(3A) = 3<sup>4</sup>·2 = <span class="st-hl-result">162</span>']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Eşit ya da orantılı iki satır: det = 0',
      body: 'R<sub>3</sub> = 2R<sub>1</sub>; <span class="st-math">R<sub>3</sub> → R<sub>3</sub> − 2R<sub>1</sub></span> sıfır satır üretir, det değişmez. Sıfır satırlı matrisin det\'i 0\'dır. <span class="st-math">|Aᵀ| = |A|</span>: orantılı sütunlar da det\'i 0 yapar.',
      scene: {items: ['Z'], mode: 'aug'},
      claims: [{expr: 'det(Z)', equals: 0}],
      beat: {type: 'rowOp', mat: 'Z', source: 0, target: 2, factor: -2},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Hangi k için |A| = 0 olur?',
      scene: {items: ['K'], mode: 'solo'},
      check: {expr: 'solve(det(K), k)'},
      options: [
        {text: 'k = 9', value: ['9'], tag: 'remembered-1-to-9',
          feedback: '1…9 matrisi akla geliyor ama burada <span class="st-math">R<sub>3</sub> = (2, 4, k)</span>. R<sub>3</sub> = 2R<sub>1</sub> için k = 6.'},
        {text: 'k = 6', value: ['6'], correct: true,
          feedback: 'R<sub>3</sub> = 2R<sub>1</sub> olur: <span class="st-math">(2, 4, 6) = 2·(1, 2, 3)</span>. det = 0.'},
        {text: 'k = 0', value: ['0'], tag: 'zero-entry',
          feedback: 'Tek bir 0 det\'i sıfırlamaz. Gereken orantı R<sub>3</sub> = 2R<sub>1</sub>, yani k = 6.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, set: [['K', 2, 2, 6]],
          marks: [['K', 0, '*', 'is-row'], ['K', 2, '*', 'is-row'], ['K', 2, '*', 'is-target']],
          work: [{html: 'R<sub>3</sub> = 2R<sub>1</sub>', label: true}]},
        {at: 700, work: [{html: 'R<sub>3</sub> = 2R<sub>1</sub>', label: true}, {html: 'det = 0', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Baştaki soru: <span class="st-math">|A| = −4</span>',
      body: 'A\'nın satırları (a,b,c), (d,e,f), (g,h,i).',
      scene: {items: ['B', 'k'], mode: 'solo'},
      labels: {k: '= ?'},
      check: {expr: 'det(B)/det(S)*(-4)'},
      options: [
        {text: '−8', tag: 'swap-sign-missed', expr: '2*(-4)',
          feedback: 'R<sub>1</sub> ile R<sub>2</sub> yer değiştirdi, bir −1 daha var: <span class="st-math">(−1)·2·(−4) = 8</span>.'},
        {text: '8', correct: true,
          feedback: 'Değiştirme −1, çarpma 2, ekleme 1: <span class="st-math">(−1)·2·(−4) = 8</span>.'},
        {text: '24', tag: 'add-multiplied', expr: '(-1)*2*3*(-4)',
          feedback: '<span class="st-math">R<sub>3</sub> → R<sub>3</sub> + 3R<sub>1</sub></span> det\'i 3 ile çarpmaz. Ekleme det\'i değiştirmez.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['B', 0, '*', 'is-row'], ['B', 0, '*', 'is-target'], ['B', 1, '*', 'is-row']], work: [
          {text: '(−1)', kind: 'a', ref: 't1', hidden: true}, {text: '·', ref: 'd1', hidden: true},
          {text: '2', kind: 'a', ref: 't2', hidden: true}, {text: '·', ref: 'd2', hidden: true},
          {text: '1', kind: 'a', ref: 't3', hidden: true}, {text: '·', ref: 'd3', hidden: true},
          {text: '(−4)', ref: 't4', hidden: true}, {text: '=', ref: 'eq', hidden: true},
          {text: '8', kind: 'sum', ref: 't5', hidden: true},
        ], reveal: ['t1']},
        {at: 800, clear: true, marks: [['B', 1, '*', 'is-row']], reveal: ['d1', 't2']},
        {at: 1600, clear: true, marks: [['B', 2, '*', 'is-row']], reveal: ['d2', 't3']},
        {at: 2300, clear: true, reveal: ['d3', 't4', 'eq', 't5'], label: ['k', '= <span class="st-hl-result">8</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Yine <span class="st-math">|A| = −4</span>. Bu det kaç?',
      scene: {items: ['C', 'k'], mode: 'solo'},
      labels: {k: '= ?'},
      check: {expr: 'det(C)/det(S)*(-4)'},
      options: [
        {text: '12', tag: 'swap-sign-missed', expr: '(-3)*(-4)',
          feedback: 'Bir işaret kayboldu: R<sub>1</sub> ile R<sub>3</sub> yer değiştirdi. <span class="st-math">(−1)·(−3)·(−4) = −12</span>.'},
        {text: '−24', tag: 'add-multiplied', expr: '(-1)*(-3)*2*(-4)',
          feedback: '<span class="st-math">R<sub>3</sub> → R<sub>3</sub> + 2R<sub>1</sub></span> det\'i 2 ile çarpmaz. Sonuç <span class="st-math">−12</span>.'},
        {text: '−12', correct: true,
          feedback: 'Değiştirme −1, çarpma −3, ekleme 1: <span class="st-math">(−1)·(−3)·(−4) = −12</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['C', 0, '*', 'is-row'], ['C', 0, '*', 'is-target'], ['C', 2, '*', 'is-row']], work: [
          {text: '(−1)', kind: 'a', ref: 't1', hidden: true}, {text: '·', ref: 'd1', hidden: true},
          {text: '(−3)', kind: 'a', ref: 't2', hidden: true}, {text: '·', ref: 'd2', hidden: true},
          {text: '1', kind: 'a', ref: 't3', hidden: true}, {text: '·', ref: 'd3', hidden: true},
          {text: '(−4)', ref: 't4', hidden: true}, {text: '=', ref: 'eq', hidden: true},
          {text: '−12', kind: 'sum', ref: 't5', hidden: true},
        ], reveal: ['t1']},
        {at: 800, clear: true, marks: [['C', 1, '*', 'is-row']], reveal: ['d1', 't2']},
        {at: 1600, clear: true, marks: [['C', 2, '*', 'is-row']], reveal: ['d2', 't3']},
        {at: 2300, clear: true, reveal: ['d3', 't4', 'eq', 't5'], label: ['k', '= <span class="st-hl-result">−12</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'R<sub>1</sub>\'i diğer üç satıra ekle. det kaç?',
      scene: {items: ['X', 'v']},
      check: {expr: 'det(X)'},
      options: [
        {text: 'xyzt', value: 'x*y*z*t', tag: 'forgot-factor-2',
          feedback: 'Eklemeden sonra köşegen <span class="st-math">x, 2y, 2z, 2t</span>. 2\'ler de çarpılır.'},
        {text: '16xyzt', value: '16*x*y*z*t', tag: 'factor-2-four-times',
          feedback: 'R<sub>1</sub> değişmedi, köşesi x kalır. Üç tane 2 var: <span class="st-math">2³ = 8</span>.'},
        {text: '8xyzt', value: '8*x*y*z*t', correct: true,
          feedback: 'Eklemek det\'i korur, üçgen yapar: <span class="st-math">x·2y·2z·2t = 8xyzt</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['X', 0, '*', 'is-row'], ['X', 1, '*', 'is-row'], ['X', 1, '*', 'is-target']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> + R<sub>1</sub>', label: true}]},
        {at: 300, set: [['X', 1, 0, 0], ['X', 1, 1, '2y'], ['X', 1, 2, 0], ['X', 1, 3, 0]]},
        {at: 750, clear: true, marks: [['X', 0, '*', 'is-row'], ['X', 2, '*', 'is-row'], ['X', 2, '*', 'is-target']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> + R<sub>1</sub>', label: true}]},
        {at: 1050, set: [['X', 2, 0, 0], ['X', 2, 1, 0], ['X', 2, 2, '2z'], ['X', 2, 3, 0]]},
        {at: 1500, clear: true, marks: [['X', 0, '*', 'is-row'], ['X', 3, '*', 'is-row'], ['X', 3, '*', 'is-target']],
          work: [{html: 'R<sub>4</sub> → R<sub>4</sub> + R<sub>1</sub>', label: true}]},
        {at: 1800, set: [['X', 3, 0, 0], ['X', 3, 1, 0], ['X', 3, 2, 0], ['X', 3, 3, '2t']]},
        {at: 2300, clear: true, marks: [['X', 0, 0, 'is-result'], ['X', 1, 1, 'is-result'], ['X', 2, 2, 'is-result'], ['X', 3, 3, 'is-result']],
          work: [{text: 'x·2y·2z·2t ='}, {text: '8xyzt', kind: 'sum'}], label: ['v', '= <span class="st-hl-result">8xyzt</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi',
      title: '<span class="st-math">R<sub>1</sub> → R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub></span> yap. det kaç?',
      scene: {items: ['f', 'W', 'v'], mode: 'solo'},
      check: {expr: 'det(W)'},
      options: [
        {text: 'a²(a+3)', value: 'a**2*(a+3)', correct: true,
          feedback: 'R<sub>1</sub> = (a+3)·(1, 1, 1). Çarpanı al, R<sub>1</sub>\'i öbür satırlardan çıkar: <span class="st-math">(a+3)·a·a</span>.'},
        {text: '(1+a)³', value: '(1+a)**3', tag: 'diag-before-triangular',
          feedback: 'Köşegeni çarpmak yalnız üçgen matriste geçerli. Önce satır işlemiyle sıfır üret.'},
        {text: 'a²', value: 'a**2', tag: 'factor-dropped',
          feedback: 'Dışarı aldığın <span class="st-math">(a+3)</span> çarpanını unuttun: <span class="st-math">a²(a+3)</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['W', 0, '*', 'is-row']],
          work: [{html: 'R<sub>1</sub> → R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>', label: true}]},
        {at: 300, set: [['W', 0, 0, 'a+3'], ['W', 0, 1, 'a+3'], ['W', 0, 2, 'a+3']]},
        {at: 850, work: [{html: '(a+3) dışarı', label: true}], label: ['f', '(a+3)·'],
          set: [['W', 0, 0, 1], ['W', 0, 1, 1], ['W', 0, 2, 1]]},
        {at: 1350, clear: true, marks: [['W', 0, '*', 'is-row'], ['W', 1, '*', 'is-row'], ['W', 1, '*', 'is-target']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − R<sub>1</sub>', label: true}],
          set: [['W', 1, 0, 0], ['W', 1, 1, 'a'], ['W', 1, 2, 0]]},
        {at: 1850, clear: true, marks: [['W', 0, '*', 'is-row'], ['W', 2, '*', 'is-row'], ['W', 2, '*', 'is-target']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>1</sub>', label: true}],
          set: [['W', 2, 0, 0], ['W', 2, 1, 0], ['W', 2, 2, 'a']]},
        {at: 2400, clear: true, marks: [['W', 0, 0, 'is-result'], ['W', 1, 1, 'is-result'], ['W', 2, 2, 'is-result']],
          work: [{text: '(a+3)·1·a·a ='}, {text: 'a²(a+3)', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi',
      title: '<span class="st-math">R<sub>2</sub> → R<sub>2</sub> − R<sub>1</sub></span>, <span class="st-math">R<sub>3</sub> → R<sub>3</sub> − R<sub>1</sub></span>. det kaç?',
      scene: {items: ['V', 'v'], mode: 'solo'},
      check: {expr: 'det(V)'},
      options: [
        {text: '(1+a)(1+b)(1+c)', value: '(1+a)*(1+b)*(1+c)', tag: 'diag-before-triangular',
          feedback: 'Köşegeni çarpmak yalnız üçgende geçerli. Buradaki 1\'ler de terim üretir.'},
        {text: 'abc+ab+bc+ca', value: 'a*b*c+a*b+b*c+c*a', correct: true,
          feedback: '1. satırdan aç: <span class="st-math">(1+a)bc + ac + ab</span>, yani abc + ab + bc + ca.'},
        {text: 'abc', value: 'a*b*c', tag: 'ones-ignored',
          feedback: '1\'ler sonucu etkiler: açılımda <span class="st-math">ab, bc, ca</span> terimleri de gelir.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['V', 0, '*', 'is-row'], ['V', 1, '*', 'is-row'], ['V', 1, '*', 'is-target']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − R<sub>1</sub>', label: true}]},
        {at: 300, set: [['V', 1, 0, '-a'], ['V', 1, 1, 'b'], ['V', 1, 2, 0]]},
        {at: 800, clear: true, marks: [['V', 0, '*', 'is-row'], ['V', 2, '*', 'is-row'], ['V', 2, '*', 'is-target']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>1</sub>', label: true}]},
        {at: 1100, set: [['V', 2, 0, '-a'], ['V', 2, 1, 0], ['V', 2, 2, 'c']]},
        {at: 1650, clear: true, marks: [['V', 0, '*', 'is-row']],
          work: [{html: '1. satırdan aç:', label: true}, {text: '(1+a)bc + ac + ab'}]},
        {at: 2350, clear: true, work: [{text: 'det ='}, {text: 'abc + ab + bc + ca', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Sınavda bunları hatırla',
      body: 'Değiştirme: işaret döner.<br> Satırı c ile çarpma: det × c.<br> Kat ekleme: değişmez.<br> <span class="st-math">det(cA) = cⁿ·det A</span><br> Orantılı satır: 0. Üçgen: köşegeni çarp.',
      scene: {items: ['mascot'], mode: 'solo'},
    },
  ],
};

/* B4 Determinant özellikleri 2: products, transpose, inverse, powers, cⁿ and special matrices. */
LESSONS.B4 = {
  id: 'B4',
  title: 'Det çarpım kuralları',
  matrices: {
    A: {name: 'A', values: [[1, 2], [-1, 3]]},
    B: {name: 'B', values: [[2, 0], [1, 1]]},
    C: {name: 'AB', values: [[4, 2], [1, 3]]},
    AT: {name: 'Aᵀ', values: [[null, null], [null, null]]},
    X: {name: 'A', values: [[null, null], [null, null]]},
    Y: {name: 'B', values: [[null, null], [null, null]]},
    Z: {name: 'A + B', values: [[null, null], [null, null]]},
    S: {name: 'A', values: [[1, 2, 0], [0, 1, 1], [1, 0, 0]], bars: true},
    U: {name: 'U', values: [[2, 5, 1], [0, 3, 4], [0, 0, -1]], bars: true},
    K: {name: 'A', values: [[0, 2, -1], [-2, 0, 3], [1, -3, 0]]},
    KT: {name: 'Aᵀ', values: [[null, null, null], [null, null, null], [null, null, null]]},
    Q: {name: 'ters simetrik A', values: [[0, 'a', 'b', 'c'], ['-a', 0, 'd', 'e'], ['-b', '-d', 0, 'f'], ['-c', '-e', '-f', 0]]},
    // Generic skew-symmetric matrices for the answer check only; never shown.
    R: {name: 'A', values: [[0, 'a', 'b'], ['-a', 0, 'c'], ['-b', '-c', 0]]},
    P: {name: 'A', values: [[0, 'a'], ['-a', 0]]},
  },
  labels: {
    hook: '|2A⁻¹BAᵀB⁻¹A| = ?',
    inv: 'A · A⁻¹ = I',
    sc: '2',
    chain: '|2AᵀB⁻¹| = ?',
    ex: 'A³ = 2B',
    orth: 'AᵀA = I',
    skew: '|A| = |Aᵀ| = |−A|',
    rules: '|AB| = |A| · |B|<br>|Aᵀ| = |A|<br>|A⁻¹| = 1 / |A|<br>|cA| = c<sup>n</sup> · |A|',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'Matrisi görmeden determinant',
      body: 'A, B 3×3, A³ = 2B ve |B| = 27 verilmiş. Matrisleri görmeden, dört kuralla tek satırda biter.',
      scene: {items: ['hook'], mode: 'solo'},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: '|AB| kaç?',
      body: 'AB hazır hesaplandı. 2×2 kuralı: <span class="st-math">ad − bc</span>.',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'C']},
      answer: 10,
      check: {expr: 'det(C)'},
      claims: [{expr: 'A*B', equals: [[4, 2], [1, 3]]}],
      feedbackRight: 'Ana köşegen eksi diğer köşegen: <span class="st-math">4·3 − 2·1 = 10</span>.',
      feedbackWrong: 'Ana köşegen eksi diğer köşegen: <span class="st-math">4·3 − 2·1 = 10</span>.',
      reveal: {type: 'det2', mat: 'C'},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: '10 = 5 · 2: determinantlar çarpılır',
      body: '|A| = 5, |B| = 2 ve |AB| bunların çarpımı. Kural: |AB| = |A|·|B|. Buradan |A<sup>n</sup>| = |A|<sup>n</sup>.',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'C']},
      claims: [
        {expr: 'det(A)', equals: 5},
        {expr: 'det(B)', equals: 2},
        {expr: 'det(A*B)', equals: 'det(A)*det(B)'},
      ],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', '*', '*', 'is-row']], work: [{html: '|A| = 5', kind: 'a'}]},
        {at: 900, marks: [['B', '*', '*', 'is-col']],
          work: [{html: '|A| = 5', kind: 'a'}, {text: '·'}, {html: '|B| = 2', kind: 'b'}]},
        {at: 1800, clear: true, marks: [['C', '*', '*', 'is-target']], work: [
          {text: '5', kind: 'a'}, {text: '·'}, {text: '2', kind: 'b'}, {text: '='}, {text: '10', kind: 'sum'},
          {text: '='}, {html: '|AB|', label: true},
        ]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: '|A| = 1, |B| = 2 ise |A + B| kaç?',
      scene: {items: ['X', 'op:plus', 'Y', 'op:eq', 'Z']},
      // 'u' stands for "cannot be determined"; the claims show two cases with different answers.
      check: {expr: 'u', given: {X1: [[1, 0], [0, 1]], Y1: [[2, 0], [0, 1]], Y2: [[-1, 0], [0, -2]]}},
      claims: [
        {expr: 'det(X1)', equals: 1},
        {expr: 'det(Y1)', equals: 2},
        {expr: 'det(Y2)', equals: 2},
        {expr: 'det(X1 + Y1)', equals: 6},
        {expr: 'det(X1 + Y2)', equals: 0},
      ],
      options: [
        {text: '3', tag: 'det-of-sum-splits', feedback: 'Toplam parçalanmaz: <span class="st-math">|A + B| ≠ |A| + |B|</span>. Aynı verilerle 6 da çıkar, 0 da.'},
        {text: '2', tag: 'sum-as-product', feedback: 'Çarpım kuralı yalnız AB için. Aynı verilerle <span class="st-math">|A + B|</span> 6 da olur, 0 da.'},
        {text: 'Bilinemez', value: 'u', correct: true, feedback: 'Doğru: A = I iken B\'ye göre <span class="st-math">|A + B|</span> 6 da olur, 0 da.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, set: [['X', 0, 0, 1], ['X', 0, 1, 0], ['X', 1, 0, 0], ['X', 1, 1, 1],
          ['Y', 0, 0, 2], ['Y', 0, 1, 0], ['Y', 1, 0, 0], ['Y', 1, 1, 1],
          ['Z', 0, 0, 3], ['Z', 0, 1, 0], ['Z', 1, 0, 0], ['Z', 1, 1, 2]],
          marks: [['Z', '*', '*', 'is-target']], work: [{html: '|A + B| = 6', kind: 'sum'}]},
        {at: 1500, set: [['Y', 0, 0, -1], ['Y', 1, 1, -2], ['Z', 0, 0, 0], ['Z', 1, 1, -1]],
          // The first result stays on its line: the conclusion below quotes both values.
          work: [{html: '|A + B| = 6', kind: 'sum'}, {text: 'ya da'}, {html: '|A + B| = 0', kind: 'sum'}]},
        {at: 2500, work: [{html: '6 ya da 0: bilinemez', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '|A| = 5 ise |Aᵀ| kaç?',
      scene: {items: ['A', 'op:arrow', 'AT']},
      check: {expr: 'det(T(A))'},
      claims: [{expr: 'det(A)', equals: 5}],
      options: [
        {text: '−5', tag: 'transpose-flips-sign', feedback: 'Transpoz işaret çevirmez: <span class="st-math">1·3 − (−1)·2 = 5</span>.'},
        {text: '5', correct: true, feedback: 'Aynı çarpımlar, aynı fark: <span class="st-math">1·3 − (−1)·2 = 5</span>. Kural: <span class="st-math">|Aᵀ| = |A|</span>.'},
        {text: '1/5', tag: 'transpose-as-inverse', feedback: '1/5, A⁻¹ için olurdu. Transpozda <span class="st-math">|Aᵀ| = |A| = 5</span>.'},
      ],
      reveal: {type: 'transpose', mat: 'A', into: 'AT'},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'A⁻¹\'in determinantı 1 / |A|',
      body: 'A·A⁻¹ = I ve |I| = 1. İki yanın determinantını al, sonra |A|\'ya böl.',
      scene: {items: ['inv'], mode: 'solo'},
      beat: {type: 'script', frames: [
        {at: 700, label: ['inv', 'A · A⁻¹ = I<br>|A| · |A⁻¹| = 1'], work: [{text: 'iki yanın determinantı', label: true}]},
        {at: 1900, label: ['inv', 'A · A⁻¹ = I<br>|A| · |A⁻¹| = 1<br><span class="st-hl-result">|A⁻¹| = 1 / |A|</span>'],
          work: [{text: '|A|\'ya böl', label: true}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '|A| = 5 ise |(Aᵀ)⁻¹| kaç?',
      scene: {items: ['inv'], mode: 'solo'},
      labels: {inv: '|A⁻¹| = 1 / |A|'},
      check: {expr: '1/det(T(A))'},
      options: [
        {text: '5', tag: 'inverse-ignored', feedback: 'Ters unutuldu: <span class="st-math">|(Aᵀ)⁻¹| = 1 / |Aᵀ| = 1/5</span>.'},
        {text: '1/5', correct: true, feedback: 'Transpoz determinantı değiştirmez, ters alma 1/|A| yapar: <span class="st-math">1/5</span>.'},
        {text: '−1/5', tag: 'transpose-flips-sign', feedback: 'Transpoz işaret çevirmez: <span class="st-math">|Aᵀ| = 5</span>, tersi <span class="st-math">1/5</span>.'},
        {text: '−5', tag: 'inverse-as-negative', feedback: 'A⁻¹, −A demek değil. Ters almak determinantı <span class="st-math">1 / |A|</span> yapar.'},
      ],
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'A 3×3, |A| = 2 ise |3A| kaç?',
      scene: {items: ['S', 'op:eq', 'sc']},
      check: {expr: '3**3*det(S)'},
      claims: [{expr: 'det(S)', equals: 2}],
      options: [
        {text: '6', tag: 'k-times-det', feedback: 'Klasik hata. 3, her satırdan bir kez çıkar: <span class="st-math">3³·2 = 54</span>.'},
        {text: '54', correct: true, feedback: 'Üç satır, üç kez 3: <span class="st-math">|3A| = 3³·|A| = 54</span>.'},
        {text: '18', tag: 'wrong-power', feedback: 'Kuvvet boyuttan gelir: 3×3 için <span class="st-math">3³</span>, <span class="st-math">3²</span> değil.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, work: [{html: 'A → 3A', label: true}]},
        {at: 600, marks: [['S', 0, '*', 'is-row']], set: [['S', 0, 0, 3], ['S', 0, 1, 6], ['S', 0, 2, 0]],
          label: ['sc', '3 · 2'], work: [{html: 'R<sub>1</sub> → 3R<sub>1</sub>', label: true}]},
        {at: 1300, marks: [['S', 1, '*', 'is-row']], set: [['S', 1, 0, 0], ['S', 1, 1, 3], ['S', 1, 2, 3]],
          label: ['sc', '3 · 3 · 2'], work: [{html: 'R<sub>2</sub> → 3R<sub>2</sub>', label: true}]},
        {at: 2000, marks: [['S', 2, '*', 'is-row']], set: [['S', 2, 0, 3], ['S', 2, 1, 0], ['S', 2, 2, 0]],
          label: ['sc', '3³ · 2 = <span class="st-hl-result">54</span>'],
          work: [{html: 'R<sub>3</sub> → 3R<sub>3</sub>', label: true}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Yöntem: parçala, sonra sayıya çevir',
      body: 'Örnek: A, B 2×2, |A| = 3, |B| = 2. Katsayı 2² olarak çıkar. Her matris kendi determinantına döner.',
      scene: {items: ['chain'], mode: 'solo'},
      claims: [{expr: '2**2*3/2', equals: 6}],
      beat: {type: 'script', frames: [
        {at: 600, label: ['chain', '|2AᵀB⁻¹|<br>= 2² · |Aᵀ| · |B⁻¹|'], work: [{html: 'katsayı → 2<sup>n</sup>', label: true}]},
        {at: 1700, label: ['chain', '|2AᵀB⁻¹|<br>= 2² · |Aᵀ| · |B⁻¹|<br>= 4 · 3 · 1/2 = <span class="st-hl-result">6</span>'],
          work: [{text: 'her matris → sayı', label: true}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: '|2AᵀBA⁻¹| kaç?',
      body: 'A, B 2×2; |A| = 2, |B| = 3.',
      scene: {items: ['chain'], mode: 'solo'},
      labels: {chain: '|2AᵀBA⁻¹| = ?'},
      answer: 12,
      check: {expr: '2**2*2*3/2'},
      feedbackRight: '<span class="st-math">4 · 2 · 3 · 1/2 = 12</span>. A ile A⁻¹ birbirini götürdü.',
      feedbackWrong: 'Katsayı <span class="st-math">2² = 4</span>. <span class="st-math">|Aᵀ|·|A⁻¹| = 1</span>, kalan <span class="st-math">4·3 = 12</span>.',
      reveal: {type: 'script', frames: [
        {at: 0, label: ['chain', '|2AᵀBA⁻¹|<br>= 2² · 2 · 3 · 1/2'], work: [{text: 'her matris → sayı', label: true}]},
        {at: 1000, label: ['chain', '|2AᵀBA⁻¹|<br>= 2² · 2 · 3 · 1/2<br>= <span class="st-hl-result">12</span>']},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: '|U| kaç?',
      body: 'Köşegenin altı hep 0. İlk sütundan aç.',
      scene: {items: ['U']},
      answer: -6,
      check: {expr: 'det(U)'},
      feedbackRight: 'Üçgen matriste determinant, köşegenin çarpımı: <span class="st-math">2·3·(−1) = −6</span>.',
      feedbackWrong: 'Yalnız köşegen kalır: <span class="st-math">2·3·(−1) = −6</span>. Köşegen matriste de aynı.',
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['U', 1, 0, 'is-struck'], ['U', 2, 0, 'is-struck'], ['U', 2, 1, 'is-struck']], work: [
          {text: '2', kind: 'a', ref: 'd0', hidden: true}, {text: '·', ref: 'x1', hidden: true},
          {text: '3', kind: 'a', ref: 'd1', hidden: true}, {text: '·', ref: 'x2', hidden: true},
          {text: '(−1)', kind: 'a', ref: 'd2', hidden: true}, {text: '=', ref: 'eq', hidden: true},
          {text: '−6', kind: 'sum', ref: 'sum', hidden: true},
        ]},
        {at: 400, marks: [['U', 0, 0, 'is-row']], fly: [{from: ['U', 0, 0], to: 'work:d0', kind: 'row'}]},
        {at: 900, marks: [['U', 1, 1, 'is-row']], reveal: ['x1'], fly: [{from: ['U', 1, 1], to: 'work:d1', kind: 'row'}]},
        {at: 1400, marks: [['U', 2, 2, 'is-row']], reveal: ['x2'], fly: [{from: ['U', 2, 2], to: 'work:d2', kind: 'row'}]},
        {at: 2100, clear: true, marks: [['U', 0, 0, 'is-result'], ['U', 1, 1, 'is-result'], ['U', 2, 2, 'is-result']], reveal: ['eq', 'sum']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Ortogonal A için |A| ne olabilir?',
      body: 'Tanım: AᵀA = I. İki yanın determinantını al.',
      scene: {items: ['orth'], mode: 'solo'},
      check: {expr: ['1', '-1']},
      options: [
        {text: 'Yalnız 1', value: '1', tag: 'forgot-negative-root', feedback: '−1 de olur: yansıma matrisi ortogonaldir ve determinantı −1.'},
        {text: '0', tag: 'confused-with-skew', feedback: 'Ortogonal matrisin tersi var, Aᵀ. Determinantı 0 olamaz.'},
        {text: '±1', value: ['1', '-1'], correct: true, feedback: '<span class="st-math">|Aᵀ|·|A| = |A|² = 1</span>, yani <span class="st-math">|A| = ±1</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['orth', 'AᵀA = I<br>|A| · |A| = 1'], work: [{text: '|Aᵀ| = |A|', label: true}]},
        {at: 1100, label: ['orth', 'AᵀA = I<br>|A| · |A| = 1<br>|A| = <span class="st-hl-result">±1</span>']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Ters simetrik: Aᵀ = −A',
      body: 'Transpozda her eleman, zıt işaretli eşiyle yer değiştirir. Sonuç: Aᵀ = −A.',
      scene: {items: ['K', 'op:arrow', 'KT']},
      claims: [{expr: 'T(K)', equals: '-K'}],
      beat: {type: 'script', frames: [
        {at: 250, clear: true, marks: [['K', 0, '*', 'is-row']], fly: [{from: ['K', 0, 0], to: ['KT', 0, 0], kind: 'row'}, {from: ['K', 0, 1], to: ['KT', 1, 0], kind: 'row'}, {from: ['K', 0, 2], to: ['KT', 2, 0], kind: 'row'}]},
        {at: 750, set: [['KT', 0, 0, 0], ['KT', 1, 0, 2], ['KT', 2, 0, -1]]},
        {at: 1000, clear: true, marks: [['K', 1, '*', 'is-row']], fly: [{from: ['K', 1, 0], to: ['KT', 0, 1], kind: 'row'}, {from: ['K', 1, 1], to: ['KT', 1, 1], kind: 'row'}, {from: ['K', 1, 2], to: ['KT', 2, 1], kind: 'row'}]},
        {at: 1500, set: [['KT', 0, 1, -2], ['KT', 1, 1, 0], ['KT', 2, 1, 3]]},
        {at: 1750, clear: true, marks: [['K', 2, '*', 'is-row']], fly: [{from: ['K', 2, 0], to: ['KT', 0, 2], kind: 'row'}, {from: ['K', 2, 1], to: ['KT', 1, 2], kind: 'row'}, {from: ['K', 2, 2], to: ['KT', 2, 2], kind: 'row'}]},
        {at: 2250, set: [['KT', 0, 2, 1], ['KT', 1, 2, -3], ['KT', 2, 2, 0]]},
        {at: 2600, clear: true, marks: [['KT', '*', '*', 'is-col']], work: [{html: 'Aᵀ = −A', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Tek mertebede |A| = 0',
      body: 'Sınavların klasiği. |−A| = (−1)<sup>n</sup>|A| ve n tekse bu −|A|. Kendi negatifine eşit sayı 0\'dır.',
      scene: {items: ['skew'], mode: 'solo'},
      claims: [{expr: 'det(K)', equals: 0}],
      beat: {type: 'script', frames: [
        {at: 800, label: ['skew', '|A| = |Aᵀ| = |−A|<br>= (−1)<sup>n</sup>·|A| = −|A|'], work: [{html: 'n tek: (−1)<sup>n</sup> = −1', label: true}]},
        {at: 2000, label: ['skew', '|A| = |Aᵀ| = |−A|<br>= (−1)<sup>n</sup>·|A| = −|A|<br>⇒ |A| = <span class="st-hl-result">0</span>'],
          work: [{text: 'kendi negatifine eşit', label: true}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi boyutta |A| hep 0?',
      scene: {items: ['Q']},
      check: {expr: '0'},
      claims: [
        {expr: 'det(Q)', equals: '(a*f - b*e + c*d)**2'},
        {expr: 'det(Q).subs({a: 1, f: 1, b: 0, c: 0, d: 0, e: 0})', equals: 1},
      ],
      options: [
        {text: '4×4', value: 'det(Q)', tag: 'odd-rule-on-even', feedback: 'Çift n\'de kural işlemez: <span class="st-math">a = f = 1</span>, gerisi 0 ise <span class="st-math">|A| = 1</span>.'},
        {text: '3×3', value: 'det(R)', correct: true, feedback: 'n tek: <span class="st-math">|A| = (−1)³|A| = −|A|</span>, yani <span class="st-math">|A| = 0</span>.'},
        {text: '2×2', value: 'det(P)', tag: 'even-order', feedback: 'Çift n: <span class="st-math">0·0 − a·(−a) = a²</span>, 0 olmak zorunda değil.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, work: [{text: 'a = f = 1, gerisi 0', label: true}], set: [
          ['Q', 0, 1, 1], ['Q', 1, 0, -1], ['Q', 2, 3, 1], ['Q', 3, 2, -1],
          ['Q', 0, 2, 0], ['Q', 2, 0, 0], ['Q', 0, 3, 0], ['Q', 3, 0, 0],
          ['Q', 1, 2, 0], ['Q', 2, 1, 0], ['Q', 1, 3, 0], ['Q', 3, 1, 0],
        ]},
        {at: 1000, work: [{text: 'a = f = 1, gerisi 0:', label: true}, {html: '|A| = 1', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Sınav tipi', title: 'A, B 3×3, A³ = 2B, |B| = 27 ise |A| kaç?',
      body: 'İki yanın determinantını al.',
      scene: {items: ['ex'], mode: 'solo'},
      answer: 6,
      check: {expr: '(2**3*27)**Rational(1, 3)'},
      claims: [{expr: '2**3*27', equals: 216}],
      feedbackRight: '<span class="st-math">|A|³ = 2³·27 = 216</span>, yani <span class="st-math">|A| = 6</span>.',
      feedbackWrong: '3×3\'te <span class="st-math">|2B| = 2³·|B| = 216</span>. Küpü 216 olan sayı 6.',
      reveal: {type: 'script', frames: [
        {at: 0, label: ['ex', 'A³ = 2B<br>|A|³ = 2³ · 27 = 216']},
        {at: 1000, label: ['ex', 'A³ = 2B<br>|A|³ = 2³ · 27 = 216<br>|A| = <span class="st-hl-result">6</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'A, B 3×3: |2A⁻¹BAᵀB⁻¹A| kaç?',
      scene: {items: ['hook'], mode: 'solo'},
      labels: {hook: '|A| = 6, |B| = 27<br>|2A⁻¹BAᵀB⁻¹A| = ?'},
      check: {expr: '2**3*(1/6)*27*6*(1/27)*6'},
      options: [
        {text: '12', tag: 'k-not-powered', expr: '2*6', feedback: '2, üç satırın her birinden çıkar: <span class="st-math">2³ = 8</span>, 2 değil.'},
        {text: '288', tag: 'extra-det-kept', expr: '2**3*6*6', feedback: 'Bir |A| fazla kaldı. A⁻¹ ile Aᵀ sadeleşir, geriye tek <span class="st-math">|A| = 6</span> kalır.'},
        {text: '48', correct: true, feedback: 'B ile B⁻¹, A⁻¹ ile Aᵀ gider; bir |A| kalır: <span class="st-math">8·6 = 48</span>.'},
        {text: '8', tag: 'over-cancel', expr: '2**3', feedback: 'Aᵀ ve A iki kez, A⁻¹ bir kez var. Biri sadeleşir, <span class="st-math">|A| = 6</span> kalır.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['hook', '|2A⁻¹BAᵀB⁻¹A|<br>= 2³·1/6·27·6·1/27·6'], work: [{text: 'her matris → sayı', label: true}]},
        {at: 1100, label: ['hook', '|2A⁻¹BAᵀB⁻¹A|<br>= 2³·1/6·27·6·1/27·6<br>= 8 · 6 = <span class="st-hl-result">48</span>'],
          work: [{text: 'çiftler sadeleşir', label: true}]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Sınavda: her şeyi sayıya çevir',
      body: 'Üçgen matriste |A| köşegenin çarpımıdır. Ortogonalde |A| = ±1, tek mertebeli ters simetrikte |A| = 0.',
      scene: {items: ['mascot', 'rules'], mode: 'solo'},
    },
  ],
};

/* B6 Ek matris ve ters: cofactor matrix, Ek(A) = Cᵀ, A⁻¹ = Ek(A) / det A, the 2×2 shortcut, det(Ek(A)). */
LESSONS.B6 = {
  id: 'B6',
  title: 'Ek matrisle ters',
  matrices: {
    A: {name: 'A', values: [[1, 0, 1], [2, 1, 0], [3, 2, 2]]},
    X: {name: 'A⁻¹', values: [[null, null, null], [null, null, null], [null, null, null]]},
    C: {name: 'C', values: [[2, -4, 1], [2, -1, -2], [-1, 2, 1]]},
    E: {name: 'Ek(A)', values: [[2, 2, -1], [-4, -1, 2], [1, -2, 1]]},
    P: {name: 'A·Ek(A)', values: [[3, 0, 0], [0, 3, 0], [0, 0, 3]]},
    EB: {name: 'Ek(A)', values: [[2, 2, -1], [-4, -1, 2], [1, -2, 1]], bars: true},
    N: {name: 'N', values: [[4, 3], [2, 2]]},
    EN: {name: 'Ek(N)', values: [[2, -3], [-2, 4]]},
    Q: {name: 'A', values: [[5, 1], [2, 3]]},
    T2: {name: 'Aᵀ − 2I', values: [[3, 2], [1, 1]]},
    B: {name: 'B', values: [[2, 1, 0], [0, 3, 1], [4, 0, 2]]},
    EK: {name: 'Ek(B)', values: [[null, null, null], [null, null, null], [null, null, null]]},
    D: {name: 'D', values: [[2, 4, 0], [1, -3, 0], [0, 3, 2]]},
    XD: {name: 'D⁻¹', values: [[null, null, null], [null, null, null], [null, null, null]]},
    S: {name: 'A', values: [[1, 2, 3], [2, 4, 6], [1, 0, 1]]},
  },
  labels: {
    L3I: '= 3·I',
    L9: '= ?',
    LN: 'A: 3×3, det A = −2<br>|Ek(A)| = ?',
    L0: 'det A = ?',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'A⁻¹\'in tek elemanını nasıl bulursun?',
      body: 'Sınav çoğu zaman tek eleman sorar. Bütün tersi hesaplamadan, bir kofaktör ve det A ile bulacaksın.',
      scene: {items: ['A', 'op:arrow', 'X']},
      marks: [['X', 2, 0, 'is-target']],
    },
    {
      kind: 'explain', eyebrow: 'Hatırla', title: 'Kofaktör: işaretli minör',
      body: 'a<sub>12</sub>\'nin satırını ve sütununu sil; kalan 2×2\'nin determinantı minör M<sub>12</sub>. ' +
        'İşaret (−1)<sup>1+2</sup>, yani eksi.',
      scene: {items: ['A'], mode: 'solo'},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 0, 1, 'is-pivot']], work: [{html: 'a<sub>12</sub> = 0', label: true}]},
        {at: 450, set: [['A', 0, 0, ''], ['A', 0, 2, '']]},
        {at: 800, set: [['A', 1, 1, ''], ['A', 2, 1, '']]},
        {at: 1150, marks: [['A', 1, 0, 'is-col'], ['A', 1, 2, 'is-col'], ['A', 2, 0, 'is-col'], ['A', 2, 2, 'is-col']], work: [{html: 'C<sub>12</sub> =', label: true}, {html: '(−1)<sup>1+2</sup>'}, {html: 'M<sub>12</sub>', kind: 'b'}]},
        {at: 1900, work: [{html: 'C<sub>12</sub> =', label: true}, {text: '−', kind: 'sum'}, {text: '(2·2 − 0·3)', kind: 'b'}, {text: '='}, {text: '−4', kind: 'sum'}]},
      ]},
      claims: [{expr: 'minor(A, 1, 2)', equals: 4}, {expr: 'cof(A, 1, 2)', equals: -4}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'C<sub>21</sub> kaç?',
      body: 'a<sub>21</sub>\'in satırını ve sütununu sil, işareti unutma.',
      scene: {items: ['A']},
      marks: [['A', 1, 0, 'is-target']],
      check: {expr: 'cof(A, 2, 1)'},
      options: [
        {text: '−2', tag: 'sign-dropped', expr: 'minor(A, 2, 1)',
          feedback: '−2 minör M<sub>21</sub>. 2+1 tek, işaret eksi: <span class="st-math">C<sub>21</sub> = −(−2) = 2</span>.'},
        {text: '2', correct: true,
          feedback: 'Kalan <span class="st-math">0·2 − 1·2 = −2</span>. İşaret eksi: <span class="st-math">C<sub>21</sub> = 2</span>.'},
        {text: '−4', tag: 'index-swapped', expr: 'cof(A, 1, 2)',
          feedback: 'Bu C<sub>12</sub>. C<sub>21</sub> için 2. satır ve 1. sütun silinir.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 1, 0, 'is-pivot']], work: [{html: 'a<sub>21</sub> = 2', label: true}]},
        {at: 450, set: [['A', 1, 1, ''], ['A', 1, 2, '']]},
        {at: 800, set: [['A', 0, 0, ''], ['A', 2, 0, '']]},
        {at: 1150, marks: [['A', 0, 1, 'is-col'], ['A', 0, 2, 'is-col'], ['A', 2, 1, 'is-col'], ['A', 2, 2, 'is-col']], work: [{html: 'C<sub>21</sub> =', label: true}, {html: '(−1)<sup>2+1</sup>'}, {html: 'M<sub>21</sub>', kind: 'b'}]},
        {at: 1900, work: [{html: 'C<sub>21</sub> =', label: true}, {text: '−', kind: 'sum'}, {text: '(0·2 − 1·2)', kind: 'b'}, {text: '='}, {text: '2', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Her elemanın yerine kofaktörünü yaz',
      body: 'Böylece kofaktör matrisi C çıkar. C<sub>12</sub> = −4 ve C<sub>21</sub> = 2\'yi zaten buldun.',
      scene: {items: ['A', 'op:arrow', 'C']},
      state: {C: [[null, null, null], [null, null, null], [null, null, null]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['C', 0, '*', 'is-target']],
          work: [{html: '1. satır → C<sub>11</sub> C<sub>12</sub> C<sub>13</sub>', label: true}],
          set: [['C', 0, 0, 2], ['C', 0, 1, -4], ['C', 0, 2, 1]]},
        {at: 650, clear: true, marks: [['C', 1, '*', 'is-target']], set: [['C', 1, 0, 2], ['C', 1, 1, -1], ['C', 1, 2, -2]],
          work: [{html: '2. satır → C<sub>21</sub> C<sub>22</sub> C<sub>23</sub>', label: true}]},
        {at: 1300, clear: true, marks: [['C', 2, '*', 'is-target']], set: [['C', 2, 0, -1], ['C', 2, 1, 2], ['C', 2, 2, 1]],
          work: [{html: '3. satır → C<sub>31</sub> C<sub>32</sub> C<sub>33</sub>', label: true}]},
        {at: 1950, clear: true, marks: [['C', 0, 1, 'is-result'], ['C', 1, 0, 'is-result']]},
      ]},
      claims: [
        {expr: 'cof(A, 1, 2)', equals: -4}, {expr: 'cof(A, 2, 1)', equals: 2},
        {expr: 'T(adj(A))', equals: [[2, -4, 1], [2, -1, -2], [-1, 2, 1]]},
      ],
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Ek(A) = Cᵀ',
      body: '<b>Ek matris</b>, kofaktör matrisinin transpozudur; adj(A) diye de yazılır. C\'nin satırları Ek(A)\'nın sütunları olur.',
      scene: {items: ['C', 'op:arrow', 'E']},
      state: {E: [[null, null, null], [null, null, null], [null, null, null]]},
      beat: {type: 'transpose', mat: 'C', into: 'E'},
      claims: [{expr: 'adj(A)', equals: [[2, 2, -1], [-4, -1, 2], [1, -2, 1]]}],
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'Ek(A)\'nın (1,2) elemanı kaç?',
      body: 'Klasik tuzak: transpozu unutmak.',
      scene: {items: ['C', 'op:arrow', 'E']},
      state: {E: [[null, null, null], [null, null, null], [null, null, null]]},
      marks: [['E', 0, 1, 'is-target']],
      check: {expr: 'adj(A)[0, 1]'},
      options: [
        {text: '−4', tag: 'forgot-transpose', expr: 'cof(A, 1, 2)',
          feedback: 'Bu C<sub>12</sub>: transpozu unuttun. (1,2) yerine <span class="st-math">C<sub>21</sub></span> gelir.'},
        {text: '2', correct: true,
          feedback: 'Transpoz indisleri çevirir: <span class="st-math">Ek(A)<sub>12</sub> = C<sub>21</sub> = 2</span>.'},
        {text: '−2', tag: 'sign-dropped', expr: 'minor(A, 2, 1)',
          feedback: '−2 minör M<sub>21</sub>. Kofaktörün işareti eksi: <span class="st-math">C<sub>21</sub> = 2</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['C', 1, 0, 'is-row']],
          work: [{html: 'Ek(A)<sub>12</sub> = C<sub>21</sub>', label: true}]},
        {at: 250, fly: [{from: ['C', 1, 0], to: ['E', 0, 1], kind: 'row'}]},
        {at: 900, set: [['E', 0, 1, 2]], marks: [['E', 0, 1, 'is-result']]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'A\'nın satırı × Ek(A)\'nın sütunu',
      body: '1. satır kendi kofaktörleriyle çarpılır. Bu, 1. satıra göre Laplace açılımı: det A = 3.',
      scene: {items: ['A', 'op:dot', 'E']},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 0, '*', 'is-row'], ['E', '*', 0, 'is-col']], work: [
          {text: '1', kind: 'a', hidden: true, ref: 'a0'}, {text: '·', hidden: true, ref: 'm0'},
          {text: '2', kind: 'b', hidden: true, ref: 'b0'}, {text: '+', hidden: true, ref: 'p1'},
          {text: '0', kind: 'a', hidden: true, ref: 'a1'}, {text: '·', hidden: true, ref: 'm1'},
          {text: '(−4)', kind: 'b', hidden: true, ref: 'b1'}, {text: '+', hidden: true, ref: 'p2'},
          {text: '1', kind: 'a', hidden: true, ref: 'a2'}, {text: '·', hidden: true, ref: 'm2'},
          {text: '1', kind: 'b', hidden: true, ref: 'b2'}, {text: '=', hidden: true, ref: 'eq'},
          {text: '3', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 300, fly: [{from: ['A', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['E', 0, 0], to: 'work:b0', kind: 'col'}]},
        {at: 800, reveal: ['m0', 'p1'], fly: [{from: ['A', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['E', 1, 0], to: 'work:b1', kind: 'col'}]},
        {at: 1300, reveal: ['m1', 'p2'], fly: [{from: ['A', 0, 2], to: 'work:a2', kind: 'row'}, {from: ['E', 2, 0], to: 'work:b2', kind: 'col'}]},
        {at: 1850, reveal: ['m2', 'eq', 'sum']},
      ]},
      claims: [{expr: 'det(A)', equals: 3}, {expr: '(A*adj(A))[0, 0]', equals: 3}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '1. satır × 2. sütun kaç?',
      body: 'Bu kez sütun, başka bir satırın kofaktörlerinden geliyor.',
      scene: {items: ['A', 'op:dot', 'E']},
      marks: [['A', 0, '*', 'is-row'], ['E', '*', 1, 'is-col']],
      check: {expr: '(A*adj(A))[0, 1]'},
      options: [
        {text: '3', tag: 'same-as-det', expr: 'det(A)',
          feedback: 'det A yalnız kendi kofaktörleriyle çıkar. Bu sütun 2. satırın kofaktörleri: <span class="st-math">2 + 0 − 2 = 0</span>.'},
        {text: '0', correct: true,
          feedback: '<span class="st-math">1·2 + 0·(−1) + 1·(−2) = 0</span>. Başka satırın kofaktörleri hep 0 verir.'},
        {text: '4', tag: 'sign-dropped', expr: '1*2 + 0*1 + 1*2',
          feedback: 'Eksileri kaybettin: <span class="st-math">1·2 + 0·(−1) + 1·(−2) = 0</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, work: [
          {text: '1', kind: 'a', hidden: true, ref: 'a0'}, {text: '·', hidden: true, ref: 'm0'},
          {text: '2', kind: 'b', hidden: true, ref: 'b0'}, {text: '+', hidden: true, ref: 'p1'},
          {text: '0', kind: 'a', hidden: true, ref: 'a1'}, {text: '·', hidden: true, ref: 'm1'},
          {text: '(−1)', kind: 'b', hidden: true, ref: 'b1'}, {text: '+', hidden: true, ref: 'p2'},
          {text: '1', kind: 'a', hidden: true, ref: 'a2'}, {text: '·', hidden: true, ref: 'm2'},
          {text: '(−2)', kind: 'b', hidden: true, ref: 'b2'}, {text: '=', hidden: true, ref: 'eq'},
          {text: '0', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 200, fly: [{from: ['A', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['E', 0, 1], to: 'work:b0', kind: 'col'}]},
        {at: 650, reveal: ['m0', 'p1'], fly: [{from: ['A', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['E', 1, 1], to: 'work:b1', kind: 'col'}]},
        {at: 1100, reveal: ['m1', 'p2'], fly: [{from: ['A', 0, 2], to: 'work:a2', kind: 'row'}, {from: ['E', 2, 1], to: 'work:b2', kind: 'col'}]},
        {at: 1600, reveal: ['m2', 'eq', 'sum']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'A·Ek(A) = Ek(A)·A = det(A)·I',
      body: 'Köşegende det A = 3 var, gerisi sıfır. İki tarafı det A\'ya bölersen A⁻¹ = Ek(A) / det A olur. ' +
        'det A = 0 ise ters yoktur.',
      scene: {items: ['P', 'L3I']},
      state: {P: [[null, null, null], [null, null, null], [null, null, null]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, set: [['P', 0, 0, 3], ['P', 1, 1, 3], ['P', 2, 2, 3]],
          marks: [['P', 0, 0, 'is-result'], ['P', 1, 1, 'is-result'], ['P', 2, 2, 'is-result']]},
        {at: 700, set: [['P', 0, 1, 0], ['P', 0, 2, 0], ['P', 1, 0, 0], ['P', 1, 2, 0], ['P', 2, 0, 0], ['P', 2, 1, 0]]},
        {at: 1200, work: [{html: 'A⁻¹ = Ek(A) / det A', label: true}]},
      ]},
      claims: [{expr: 'A*adj(A)', equals: '3*eye(3)'}, {expr: 'inv(A)', equals: 'adj(A)/det(A)'}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'A⁻¹\'in (3,1) elemanı kaç?',
      body: 'det A = 3. Önce hangi kofaktörün gerektiğini düşün.',
      scene: {items: ['A', 'op:arrow', 'X']},
      marks: [['X', 2, 0, 'is-target']],
      check: {expr: 'inv(A)[2, 0]'},
      options: [
        {text: '−1/3', tag: 'forgot-transpose', expr: 'cof(A, 3, 1)/det(A)',
          feedback: 'Bu C<sub>31</sub> / 3. Transpoz yüzünden (3,1) yerine <span class="st-math">C<sub>13</sub> = 1</span> gelir.'},
        {text: '1', tag: 'not-divided', expr: 'cof(A, 1, 3)',
          feedback: '<span class="st-math">C<sub>13</sub> = 1</span> doğru, ama det A = 3\'e bölmedin.'},
        {text: '1/3', correct: true,
          feedback: '(3,1) yerine C<sub>13</sub> gelir: <span class="st-math">2·2 − 1·3 = 1</span>, bölü 3.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 0, 2, 'is-pivot']], work: [{html: 'a<sub>13</sub> = 1', label: true}]},
        {at: 450, set: [['A', 0, 0, ''], ['A', 0, 1, '']]},
        {at: 800, set: [['A', 1, 2, ''], ['A', 2, 2, '']]},
        {at: 1150, marks: [['A', 1, 0, 'is-col'], ['A', 1, 1, 'is-col'], ['A', 2, 0, 'is-col'], ['A', 2, 1, 'is-col']], work: [{html: 'C<sub>13</sub> =', label: true}, {html: '(−1)<sup>1+3</sup>'}, {html: 'M<sub>13</sub>', kind: 'b'}]},
        {at: 1900, work: [{html: 'C<sub>13</sub> =', label: true}, {text: '+', kind: 'sum'}, {text: '(2·2 − 1·3)', kind: 'b'}, {text: '='}, {text: '1', kind: 'sum'}]},
        {at: 2500, work: [{html: '(A⁻¹)<sub>31</sub> =', label: true}, {html: 'C<sub>13</sub> / 3', kind: 'b'}, {text: '='}, {text: '1/3', kind: 'sum'}],
          set: [['X', 2, 0, '⅓']], marks: [['X', 2, 0, 'is-result']]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'det(Ek(A)) = (det A)<sup>n−1</sup>',
      body: 'A·Ek(A) = det(A)·I eşitliğinin determinantını al: det A · det(Ek(A)) = (det A)<sup>n</sup> olur. ' +
        'det&nbsp;A&nbsp;≠&nbsp;0 ise bir det A sadeleşir.',
      scene: {items: ['EB', 'L9']},
      beat: {type: 'script', frames: [
        {at: 0, work: [{html: '3 · |Ek(A)| = det(3I)', label: true}]},
        {at: 900, work: [{html: 'det(3I) =', label: true}, {html: '3<sup>3</sup>', kind: 'b'}, {text: '='}, {text: '27', kind: 'sum'}]},
        {at: 1800, work: [{html: '|Ek(A)| =', label: true}, {text: '27 / 3', kind: 'b'}, {text: '='}, {text: '9', kind: 'sum'}],
          label: ['L9', '= <span class="st-hl-result">9</span>']},
      ]},
      claims: [{expr: 'det(adj(A))', equals: 9}, {expr: 'det(A)**2', equals: 9}, {expr: 'det(3*eye(3))', equals: 27}],
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'det(Ek(A)) kaç?',
      scene: {items: ['LN'], mode: 'solo'},
      check: {expr: 'det(adj(G))', given: {G: [[1, 0, 0], [0, 1, 0], [0, 0, -2]]}},
      answer: 4,
      feedbackRight: 'Üs n − 1 = 2: <span class="st-math">(−2)² = 4</span>.',
      feedbackWrong: '<span class="st-math">(det A)<sup>n−1</sup> = (−2)² = 4</span>. Üs n değil, n − 1.',
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: '2×2: köşegeni değiştir, diğerlerinin işaretini çevir',
      body: 'Bu, kofaktör ve transpozun 2×2\'deki sonucu. Sonra det N = 2\'ye bölersin.',
      scene: {items: ['N', 'op:arrow', 'EN']},
      state: {EN: [[null, null], [null, null]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['N', 0, 0, 'is-row'], ['N', 1, 1, 'is-row']],
          work: [{html: 'köşegen yer değiştirir', label: true}]},
        {at: 300, fly: [{from: ['N', 0, 0], to: ['EN', 1, 1], kind: 'row'}, {from: ['N', 1, 1], to: ['EN', 0, 0], kind: 'row'}]},
        {at: 950, set: [['EN', 0, 0, 2], ['EN', 1, 1, 4]]},
        {at: 1200, clear: true, marks: [['N', 0, 1, 'is-col'], ['N', 1, 0, 'is-col'], ['EN', 0, 0, 'is-row'], ['EN', 1, 1, 'is-row']],
          work: [{html: 'diğer ikisi işaret değiştirir', label: true}]},
        {at: 1450, fly: [{from: ['N', 0, 1], to: ['EN', 0, 1], kind: 'col', text: '−3'}, {from: ['N', 1, 0], to: ['EN', 1, 0], kind: 'col', text: '−2'}]},
        {at: 2100, set: [['EN', 0, 1, -3], ['EN', 1, 0, -2]], marks: [['EN', 0, 1, 'is-col'], ['EN', 1, 0, 'is-col']]},
        {at: 2350, work: [{html: 'N⁻¹ = Ek(N) / 2', label: true}]},
      ]},
      claims: [{expr: 'adj(N)', equals: [[2, -3], [-2, 4]]}, {expr: 'det(N)', equals: 2}],
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: '(Aᵀ − 2I)⁻¹\'in (2,1) elemanı kaç?',
      body: 'Önce Aᵀ − 2I\'yı yaz, sonra 2×2 kısayolunu kullan.',
      scene: {items: ['Q', 'op:arrow', 'T2']},
      state: {T2: [[null, null], [null, null]]},
      check: {expr: 'inv(T(Q) - 2*eye(2))[1, 0]'},
      options: [
        {text: '−2', tag: 'forgot-transpose', expr: 'inv(Q - 2*eye(2))[1, 0]',
          feedback: 'Aᵀ yerine A kullandın. Aᵀ − 2I\'nın sol altı <span class="st-math">1</span>, tersinde <span class="st-math">−1</span> olur.'},
        {text: '−1', correct: true,
          feedback: 'Aᵀ − 2I\'nın sol altı <span class="st-math">1</span>, det = 1. İşareti çevrilir: <span class="st-math">−1</span>.'},
        {text: '1', tag: 'sign-not-flipped', expr: '(T(Q) - 2*eye(2))[1, 0]',
          feedback: 'Köşegen dışı elemanlar işaret değiştirir: <span class="st-math">1 → −1</span>, det = 1.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['Q', 1, 0, 'is-target'], ['Q', 0, 1, 'is-target']], work: [{html: 'Aᵀ: satır → sütun', label: true}]},
        {at: 200, fly: [{from: ['Q', 1, 0], to: ['T2', 0, 1]}, {from: ['Q', 0, 1], to: ['T2', 1, 0]}]},
        {at: 850, set: [['T2', 0, 1, 2], ['T2', 1, 0, 1]], marks: [['T2', 0, 1, 'is-target'], ['T2', 1, 0, 'is-target']]},
        {at: 1100, clear: true, marks: [['Q', 0, 0, 'is-row'], ['Q', 1, 1, 'is-row']], work: [{html: '5 − 2 = 3, 3 − 2 = 1', label: true}],
          fly: [{from: ['Q', 0, 0], to: ['T2', 0, 0], kind: 'row', text: '3'}, {from: ['Q', 1, 1], to: ['T2', 1, 1], kind: 'row', text: '1'}]},
        {at: 1750, set: [['T2', 0, 0, 3], ['T2', 1, 1, 1]]},
        // The det line reads Aᵀ − 2I's diagonals (3·1 and 2·1), so those cells light, not A's 5 and 3.
        {at: 1900, clear: true, marks: [['T2', 0, 0, 'is-row'], ['T2', 1, 1, 'is-row'], ['T2', 0, 1, 'is-col'], ['T2', 1, 0, 'is-col']],
          work: [{html: 'det = 3·1 − 2·1 = 1', label: true}]},
        {at: 2450, marks: [['T2', 1, 0, 'is-target']], work: [{html: '(2,1) = −(1) / 1 = −1', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Ek(B)\'nin (2,3) elemanı kaç?',
      body: 'Tek eleman yeter: hangi kofaktör gerekir?',
      scene: {items: ['B', 'op:arrow', 'EK']},
      marks: [['EK', 1, 2, 'is-target']],
      check: {expr: 'adj(B)[1, 2]'},
      options: [
        {text: '4', tag: 'forgot-transpose', expr: 'cof(B, 2, 3)',
          feedback: 'Bu C<sub>23</sub>: transpozu unuttun. Ek(B)\'nin (2,3) elemanı <span class="st-math">C<sub>32</sub></span>.'},
        {text: '2', tag: 'sign-dropped', expr: 'minor(B, 3, 2)',
          feedback: '2 minör M<sub>32</sub>. 3+2 tek, işaret eksi: <span class="st-math">C<sub>32</sub> = −2</span>.'},
        {text: '−2', correct: true,
          feedback: '(2,3) yerine C<sub>32</sub>: <span class="st-math">−(2·1 − 0·0) = −2</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['B', 2, 1, 'is-pivot']], work: [{html: 'a<sub>32</sub> = 0', label: true}]},
        {at: 450, set: [['B', 2, 0, ''], ['B', 2, 2, '']]},
        {at: 800, set: [['B', 0, 1, ''], ['B', 1, 1, '']]},
        {at: 1150, marks: [['B', 0, 0, 'is-col'], ['B', 0, 2, 'is-col'], ['B', 1, 0, 'is-col'], ['B', 1, 2, 'is-col']], work: [{html: 'C<sub>32</sub> =', label: true}, {html: '(−1)<sup>3+2</sup>'}, {html: 'M<sub>32</sub>', kind: 'b'}]},
        {at: 1900, work: [{html: 'C<sub>32</sub> =', label: true}, {text: '−', kind: 'sum'}, {text: '(2·1 − 0·0)', kind: 'b'}, {text: '='}, {text: '−2', kind: 'sum'}]},
        {at: 2500, set: [['EK', 1, 2, -2]], marks: [['EK', 1, 2, 'is-result']]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'D⁻¹\'in (1,2) elemanı kaç?',
      body: 'det D = −20. Ek matrisle çöz.',
      scene: {items: ['D', 'op:arrow', 'XD']},
      marks: [['XD', 0, 1, 'is-target']],
      check: {expr: 'inv(D)[0, 1]'},
      options: [
        {text: '2/5', correct: true,
          feedback: '<span class="st-math">C<sub>21</sub> = −(4·2 − 0·3) = −8</span>, bölü −20: <span class="st-math">2/5</span>.'},
        {text: '1/10', tag: 'forgot-transpose', expr: 'cof(D, 1, 2)/det(D)',
          feedback: 'Bu C<sub>12</sub> / det D. (1,2) yerine <span class="st-math">C<sub>21</sub> = −8</span> gelir.'},
        {text: '−2/5', tag: 'sign-dropped', expr: 'minor(D, 2, 1)/det(D)',
          feedback: 'Kofaktör işaretini unuttun: <span class="st-math">C<sub>21</sub> = −8</span>, bölü −20: 2/5.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['D', 1, 0, 'is-pivot']], work: [{html: 'a<sub>21</sub> = 1', label: true}]},
        {at: 450, set: [['D', 1, 1, ''], ['D', 1, 2, '']]},
        {at: 800, set: [['D', 0, 0, ''], ['D', 2, 0, '']]},
        {at: 1150, marks: [['D', 0, 1, 'is-col'], ['D', 0, 2, 'is-col'], ['D', 2, 1, 'is-col'], ['D', 2, 2, 'is-col']], work: [{html: 'C<sub>21</sub> =', label: true}, {html: '(−1)<sup>2+1</sup>'}, {html: 'M<sub>21</sub>', kind: 'b'}]},
        {at: 1900, work: [{html: 'C<sub>21</sub> =', label: true}, {text: '−', kind: 'sum'}, {text: '(4·2 − 0·3)', kind: 'b'}, {text: '='}, {text: '−8', kind: 'sum'}]},
        {at: 2500, work: [{html: '(D⁻¹)<sub>12</sub> =', label: true}, {html: '−8 / −20', kind: 'b'}, {text: '='}, {text: '2/5', kind: 'sum'}],
          set: [['XD', 0, 1, '⅖']], marks: [['XD', 0, 1, 'is-result']]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Bu A için Ek(A)·A nedir?',
      body: 'Satırlara bak: R<sub>2</sub> ile R<sub>1</sub> arasında ne var?',
      scene: {items: ['S', 'op:arrow', 'L0']},
      marks: [['S', 0, '*', 'is-row'], ['S', 1, '*', 'is-row']],
      check: {expr: 'adj(S)*S'},
      options: [
        {text: 'I', value: 'eye(3)', tag: 'assumed-inverse',
          feedback: 'I için A⁻¹ gerekirdi. <span class="st-math">det A = 0</span> iken ters yoktur.'},
        {text: 'Sıfır matris', value: '0*eye(3)', correct: true,
          feedback: '<span class="st-math">Ek(A)·A = 0·I = 0</span>. Ek(A) vardır, ama A⁻¹ yoktur.'},
        {text: 'Tanımsız', value: 'nan', tag: 'adjugate-undefined',
          feedback: 'Ek(A) her kare matriste vardır. Yalnız det A\'ya bölemezsin, A⁻¹ yoktur.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['L0', 'det A = <span class="st-hl-result">0</span>'],
          work: [{html: 'Ek(A)·A =', label: true}, {html: '0·I', kind: 'b'}, {text: '='}, {text: '0', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Ek(A)&nbsp;=&nbsp;Cᵀ, det(Ek(A))&nbsp;=&nbsp;(det&nbsp;A)<sup>n−1</sup>',
      body: '(A⁻¹)<sub>ij</sub> = C<sub>ji</sub> / det A. 2×2\'de köşegeni değiştir, diğerlerinin işaretini çevir. ' +
        'A·Ek(A) = det(A)·I; det A = 0 ise ters yok.',
      scene: {items: ['mascot'], mode: 'solo'},
    },
  ],
};

/* C1 Sistem = matris: [A | b], the pivot idea, elemanter satır işlemleri, eşelon form, Gauss (eşelon + geriye doğru yerine koyma), RREF in one line. */
/*
 * Scope: Gauss elimination on augmented matrices. The formal r_A = r_B test and "n − r_A serbest değişken" are lesson C2's;
 * here only the visible outcome of an echelon last row (0 = 0 / 0 = c) is asked, without rank symbols.
 * Notation follows the lecturer's slides (N2): genişletilmiş matris [A | b], elemanter satır işlemleri, pivot,
 * eşelon = zero rows at the bottom + each pivot right of the one above + zeros below each pivot (pivot need not be 1),
 * indirgenmiş eşelon (RREF) = pivots 1 and the only non-zero entry of their column.
 * The engine resets every step to `state` or `matrices`, so each step states the matrix it starts from.
 * X and X3 hold no numbers in `matrices` (they show "?"); the solved values are written by the reveals.
 * Checks use the real data of M (2×2 system), T (3×3 system), E, W, U; the 2×2 system is x = 1, y = 2, the 3×3 is (2, 1, 3).
 */
LESSONS.C1 = {
  id: 'C1',
  title: 'Gauss ile çözüm',
  matrices: {
    M: {name: '[A | b]', values: [[1, 2, 5], [3, 1, 5]], augmented: true},
    X: {name: 'X', values: [[null], [null]]},
    R: {name: '[A | b]', values: [[null, null, null, null]], augmented: true},
    N0: {name: '[A | b]', values: [[0, 2, 4], [3, 1, 5]], augmented: true},
    F: {name: '[A | b]', values: [[2, 1, 0, 3], [0, 0, 5, 1], [0, 0, 0, 0]], augmented: true},
    G: {name: 'A', values: [[1, 2, 3], [0, 0, 4], [0, 0, 4]]},
    T: {name: '[A | b]', values: [[1, 2, 1, 7], [2, 5, 3, 18], [3, 4, -1, 7]], augmented: true},
    X3: {name: 'X', values: [[null], [null], [null]]},
    RR: {name: '[A | b]', values: [[null, null, null, null], [null, null, null, null], [null, null, null, null]], augmented: true},
    U: {name: '[A | b]', values: [[1, -2, 1, 3], [-2, 5, 1, -4], [0, 1, 3, 6]], augmented: true},
    E: {name: '[A | b]', values: [[1, -2, 3, 1], [0, 2, 1, 6], [0, 0, 4, 8]], augmented: true},
    W: {name: '[A | b]', values: [[1, 1, 2, 3], [0, 1, 1, 2], [0, 0, 0, 4]], augmented: true},
  },
  labels: {
    S: 'x + 2y = 5<br>3x + y = 5',
    eq3: '2y − z = 5',
    ops: 'R<sub>i</sub> ↔ R<sub>j</sub><br>R<sub>i</sub> → kR<sub>i</sub> &nbsp;(k ≠ 0)<br>R<sub>i</sub> → R<sub>i</sub> + kR<sub>j</sub> &nbsp;(i ≠ j)',
  },
  steps: [
    // Soru
    {
      kind: 'explain', eyebrow: 'Soru', title: 'İki denklem, iki bilinmeyen: x ve y kaç?',
      body: 'Sistemi bir matrise çevirip satır işlemleriyle çözeceksin. Sondaki iki <span class="st-math">?</span> kutusu dolacak.',
      scene: {items: ['S', 'op:arrow', 'X']},
      marks: [['X', '*', 0, 'is-target']],
    },
    // Kural: [A | b]
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Kısa yazım: genişletilmiş matris',
      body: 'Her denklem bir satır, her bilinmeyen bir sütun olur. Çizginin sağı b. Sistem AX = b, bu matris <b>[A | b]</b>.',
      scene: {items: ['S', 'op:arrow', 'M']},
      state: {M: [[null, null, null], [null, null, null]]},
      beat: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['M', '*', 0, 'is-col']], work: [{text: 'x\'in katsayıları', kind: 'b', label: true}],
          label: ['S', '<span class="st-hl-col">x</span> + 2y = 5<br><span class="st-hl-col">3x</span> + y = 5'],
          set: [['M', 0, 0, 1], ['M', 1, 0, 3]]},
        {clear: true, marks: [['M', '*', 1, 'is-col']], work: [{text: 'y\'nin katsayıları', kind: 'b', label: true}],
          label: ['S', 'x + <span class="st-hl-col">2y</span> = 5<br>3x + <span class="st-hl-col">y</span> = 5'],
          set: [['M', 0, 1, 2], ['M', 1, 1, 1]]},
        {clear: true, marks: [['M', '*', 2, 'is-col']], work: [{text: 'sağ taraf b', kind: 'b', label: true}],
          label: ['S', 'x + 2y = <span class="st-hl-col">5</span><br>3x + y = <span class="st-hl-col">5</span>'],
          set: [['M', 0, 2, 5], ['M', 1, 2, 5]]},
        {clear: true, marks: [['M', 0, '*', 'is-row']], work: [{text: '1. satır = 1. denklem', kind: 'a', label: true}],
          label: ['S', '<span class="st-hl-row">x + 2y = 5</span><br>3x + y = 5']},
      ]},
    },
    // Soru: write a row (missing unknown = 0)
    {
      kind: 'choice', eyebrow: 'Soru', title: 'Bilinmeyenler x, y, z. Bu denklemin satırı hangisi?',
      scene: {items: ['eq3', 'op:arrow', 'R']},
      options: [
        {text: '2  −1 | 5', value: [[2, -1, 5]], tag: 'missing-zero', feedback: 'Üç bilinmeyen, üç sütun gerekir. Denklemde olmayan x\'in katsayısı 0\'dır.'},
        {text: '2  −1  0 | 5', value: [[2, -1, 0, 5]], tag: 'zero-wrong-column', feedback: 'Sütun sırası hep x, y, z. 0 baştaki x sütununa yazılır, sona değil.'},
        {text: '0  2  −1 | 5', value: [[0, 2, -1, 5]], correct: true, feedback: 'x yok, katsayısı 0. Sonra y\'nin 2\'si, z\'nin −1\'i ve sağ taraf 5.'},
      ],
      check: {expr: 'Matrix([[0, 2, -1, 5]])'},
      reveal: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['R', 0, 0, 'is-result']], set: [['R', 0, 0, 0]], work: [{text: 'x yok → 0', kind: 'sum', label: true}]},
        {clear: true, marks: [['R', 0, 1, 'is-col']], set: [['R', 0, 1, 2]], work: [{text: 'y\'nin katsayısı', kind: 'b', label: true}]},
        {clear: true, marks: [['R', 0, 2, 'is-col']], set: [['R', 0, 2, -1]], work: [{text: 'z\'nin katsayısı', kind: 'b', label: true}]},
        {clear: true, marks: [['R', 0, 3, 'is-col']], set: [['R', 0, 3, 5]], work: [{text: 'sağ taraf', kind: 'b', label: true}]},
      ]},
    },
    // Sezgi: the pivot idea
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Pivot: altındakini sıfırla',
      body: 'Bir satırdaki ilk sıfırdan farklı sayıya <b>pivot</b> denir. Pivotun altını sıfırlarsan, o bilinmeyen alt satırdan çıkar.',
      scene: {items: ['M'], mode: 'aug'},
      beat: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['M', 0, 0, 'is-pivot']], work: [{text: '1. satırın pivotu', kind: 'a', label: true}]},
        {clear: true, marks: [['M', 0, 0, 'is-pivot'], ['M', 1, 0, 'is-target']], work: [{text: 'bunu sıfırlayacağız', kind: 'a', label: true}]},
        {clear: true, marks: [['M', 0, 0, 'is-pivot'], ['M', 1, 0, 'is-target']], work: [{text: 'sıfırsa 2. satırda x kalmaz', kind: 'a', label: true}]},
      ]},
    },
    // Soru: which operation (faded practice) + rowOp reveal
    {
      kind: 'choice', eyebrow: 'Soru', title: 'R<sub>2</sub>\'deki 3\'ü hangi işlem sıfırlar?',
      scene: {items: ['M'], mode: 'aug'},
      marks: [['M', 0, 0, 'is-pivot'], ['M', 1, 0, 'is-target']],
      options: [
        {text: 'R<sub>2</sub> → R<sub>2</sub> + 3R<sub>1</sub>', value: 3, tag: 'factor-sign', feedback: 'Eklersen <span class="st-math">3 + 3 = 6</span> olur. Sıfır için çıkarmalısın.'},
        {text: 'R<sub>2</sub> → R<sub>2</sub> − 3R<sub>1</sub>', value: -3, correct: true, feedback: 'Pivot 1, altındaki 3: <span class="st-math">3 − 3·1 = 0</span>. Satırın geri kalanı ve b de aynı işlemden geçer.'},
        {text: 'R<sub>2</sub> → R<sub>2</sub> − R<sub>1</sub>', value: -1, tag: 'factor-one', feedback: 'Bir kat yetmez: <span class="st-math">3 − 1 = 2</span> kalır. Pivotun 3 katını çıkarmalısın.'},
      ],
      check: {expr: '-M[1, 0]/M[0, 0]'},
      claims: [{expr: 'M.row(1) - 3*M.row(0)', equals: [[0, -5, -10]]}],
      reveal: {type: 'rowOp', mat: 'M', source: 0, target: 1, factor: -3},
    },
    // Kural: the three elemanter row operations
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Üç elemanter satır işlemi',
      body: 'Satır değiştir, sıfırdan farklı bir sayıyla çarp ya da bir satıra başkasının katını ekle. Hiçbiri çözümü değiştirmez.',
      scene: {items: ['ops'], mode: 'solo'},
      beat: {type: 'paced', endMarks: false, frames: [
        {label: ['ops', '<span class="st-hl-row">R<sub>i</sub> ↔ R<sub>j</sub><br>R<sub>i</sub> → kR<sub>i</sub> &nbsp;(k ≠ 0)</span><br>R<sub>i</sub> → R<sub>i</sub> + kR<sub>j</sub> &nbsp;(i ≠ j)']},
        {work: [{text: 'sıfır üreten işlem bu', kind: 'sum', label: true}],
          label: ['ops', 'R<sub>i</sub> ↔ R<sub>j</sub><br>R<sub>i</sub> → kR<sub>i</sub> &nbsp;(k ≠ 0)<br><span class="st-hl-result">R<sub>i</sub> → R<sub>i</sub> + kR<sub>j</sub> &nbsp;(i ≠ j)</span>']},
      ]},
    },
    // Soru: a zero where the pivot should be -> swap (uses k != 0 and the swap operation)
    {
      kind: 'choice', eyebrow: 'Soru', title: 'R<sub>1</sub>\'in başı 0. Pivot için hangi işlem?',
      scene: {items: ['N0'], mode: 'aug'},
      marks: [['N0', 0, 0, 'is-target'], ['N0', 1, 0, 'is-pivot']],
      options: [
        {text: 'R<sub>2</sub> → R<sub>2</sub> − 3R<sub>1</sub>', value: [[0, 2, 4], [3, -5, -7]], tag: 'zero-pivot-used', feedback: 'R<sub>1</sub>\'in başı 0: <span class="st-math">3 − 3·0 = 3</span>, R<sub>2</sub>\'nin başı yerinde kalır. Önce 0\'ı aşağı indirmelisin.'},
        {text: 'R<sub>1</sub> ↔ R<sub>2</sub>', value: [[3, 1, 5], [0, 2, 4]], correct: true, feedback: 'Satırlar yer değiştirir, 3 üste çıkar ve pivot olur. Çözüm değişmez.'},
        {text: 'R<sub>1</sub> → 0·R<sub>1</sub>', value: [[0, 0, 0], [3, 1, 5]], tag: 'scaled-by-zero', feedback: '0 ile çarpmak satırı siler. Çarpan sıfır olamaz: <span class="st-math">k ≠ 0</span>.'},
      ],
      check: {expr: 'Matrix([[3, 1, 5], [0, 2, 4]])'},
      reveal: {type: 'rowSwap', mat: 'N0', a: 0, b: 1},
    },
    // Soru (keypad): last row -> y
    {
      kind: 'keypad', eyebrow: 'Soru', title: 'Son satırda yalnız y kaldı. y kaç?',
      scene: {items: ['M', 'op:arrow', 'X']},
      state: {M: [[1, 2, 5], [0, -5, -10]], X: [[null], [null]]},
      marks: [['M', 1, '*', 'is-target']],
      answer: 2,
      check: {expr: '(Matrix([[1, 2], [3, 1]]).inv()*Matrix([5, 5]))[1]'},
      feedbackRight: 'Pivotun katsayısına böldün: son satır tek bilinmeyenli bir denklem.',
      feedbackWrong: 'Eşitliğin iki tarafını y\'nin katsayısına böl. Eksiyi eksiye bölünce sonuç artı çıkar.',
      // One paced beat per work line, so the earlier line stays on the stage.
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['M', 1, '*', 'is-row']],
            work: [{text: '−5', kind: 'a', hidden: true, ref: 'a'}, {text: 'y'}, {text: '='}, {text: '−10', kind: 'b', hidden: true, ref: 'b'}],
            fly: [{from: ['M', 1, 1], to: 'work:a', kind: 'row'}, {from: ['M', 1, 2], to: 'work:b', kind: 'row'}]}]},
        {type: 'paced', endMarks: false, frames: [
          {work: [{text: 'y'}, {text: '='}, {text: '−10 ÷ (−5)'}, {text: '='}, {text: '2', kind: 'sum'}],
            set: [['X', 1, 0, 2]], marks: [['X', 1, 0, 'is-result']]}]},
      ]},
    },
    // Kural: back substitution (pays off the opening question)
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Aşağıdan yukarı çöz',
      body: 'Bulduğun y\'yi bir üst satıra koy, x kalır. Eşelona indirip geriye doğru yerine koymaya <b>Gauss yöntemi</b> denir.',
      scene: {items: ['M', 'op:arrow', 'X']},
      state: {M: [[1, 2, 5], [0, -5, -10]], X: [[null], [2]]},
      claims: [{expr: 'Matrix([[1, 2], [3, 1]]).inv()*Matrix([5, 5])', equals: [[1], [2]]}],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['M', 0, '*', 'is-row']],
            work: [{text: 'x'}, {text: '+'}, {text: '2', kind: 'a', hidden: true, ref: 'c'}, {text: '·'}, {text: '2', kind: 'result', hidden: true, ref: 'y'},
              {text: '='}, {text: '5', kind: 'b', hidden: true, ref: 'b'}],
            fly: [{from: ['M', 0, 1], to: 'work:c', kind: 'row'}, {from: ['X', 1, 0], to: 'work:y', kind: 'result'}, {from: ['M', 0, 2], to: 'work:b', kind: 'row'}]}]},
        {type: 'paced', endMarks: false, frames: [
          {work: [{text: 'x'}, {text: '='}, {text: '5 − 2·2'}, {text: '='}, {text: '1', kind: 'sum'}],
            set: [['X', 0, 0, 1]], marks: [['X', 0, 0, 'is-result']]}]},
      ]},
    },
    // Kural: eşelon form (N2 definition, pivot need not be 1)
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Eşelon form: basamak biçimi',
      body: 'Üç şart: sıfır satırlar altta, her pivot üsttekinin sağında, pivotun altı sıfır. Pivotlar 1 olmak zorunda değil.',
      scene: {items: ['F'], mode: 'solo'},
      beat: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['F', 0, 0, 'is-pivot'], ['F', 1, 2, 'is-pivot']], work: [{text: 'pivotlar 2 ve 5, sağa kayıyor', kind: 'a', label: true}]},
        {clear: true, marks: [['F', 0, 0, 'is-pivot'], ['F', 1, 2, 'is-pivot'], ['F', 1, 0, 'is-result'], ['F', 2, '*', 'is-result']],
          work: [{text: 'pivotun altı sıfır, sıfır satır altta', kind: 'sum', label: true}]},
      ]},
    },
    // Tuzak: triangular is not echelon
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'Köşegenin altı sıfır. Eşelon forma hangi işlem getirir?',
      scene: {items: ['G'], mode: 'solo'},
      options: [
        {text: 'Gerek yok', value: [[1, 2, 3], [0, 0, 4], [0, 0, 4]], tag: 'triangular-is-echelon', feedback: 'Köşegenin altı sıfır olması yetmez. R<sub>2</sub> ve R<sub>3</sub> aynı sütunda başlıyor: pivotun altı sıfır değil.'},
        {text: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>2</sub>', value: [[1, 2, 3], [0, 0, 4], [0, 0, 0]], correct: true, feedback: 'Pivotun altı sıfırlanır, sıfır satır en altta kalır. Üç şartın üçü de tamam.'},
        {text: 'R<sub>1</sub> ↔ R<sub>2</sub>', value: [[0, 0, 4], [1, 2, 3], [0, 0, 4]], tag: 'swap-moves-pivot-left', feedback: 'Yer değiştirince pivot sola kayar. Pivotlar aşağı indikçe sağa gitmeli.'},
      ],
      check: {expr: 'Matrix([[1, 2, 3], [0, 0, 4], [0, 0, 0]])'},
      reveal: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['G', 1, 2, 'is-pivot'], ['G', 2, 2, 'is-target']], work: [{text: 'aynı sütunda iki sayı', kind: 'a', label: true}]},
        {clear: true, marks: [['G', 1, '*', 'is-row'], ['G', 2, 2, 'is-target']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>2</sub>', kind: 'a', label: true}]},
        {set: [['G', 2, 2, 0]], marks: [['G', 2, 2, 'is-result']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>2</sub>', kind: 'a', label: true}, {text: 'sıfır satır altta', kind: 'sum'}]},
      ]},
    },
    // Sezgi: the same plan in 3×3
    {
      kind: 'explain', eyebrow: 'Sezgi', title: '3×3\'te de aynı plan',
      body: 'Önce 1. sütunda pivotun altını sıfırla: <span class="st-math">R<sub>2</sub> → R<sub>2</sub> − 2R<sub>1</sub></span>. İşlem b sütununu da değiştirir.',
      scene: {items: ['T', 'op:arrow', 'X3'], mode: 'aug'},
      marks: [['T', 0, 0, 'is-pivot']],
      claims: [{expr: 'T.row(1) - 2*T.row(0)', equals: [[0, 1, 1, 4]]}],
      beat: {type: 'rowOp', mat: 'T', source: 0, target: 1, factor: -2},
    },
    // Soru: next elimination in column 1
    {
      kind: 'choice', eyebrow: 'Soru', title: 'R<sub>3</sub>\'teki x\'i hangi işlem siler?',
      scene: {items: ['T', 'op:arrow', 'X3'], mode: 'aug'},
      state: {T: [[1, 2, 1, 7], [0, 1, 1, 4], [3, 4, -1, 7]]},
      marks: [['T', 0, 0, 'is-pivot'], ['T', 2, 0, 'is-target']],
      options: [
        {text: 'R<sub>3</sub> → R<sub>3</sub> − 2R<sub>1</sub>', value: -2, tag: 'copied-factor', feedback: '2, bir önceki satırın çarpanıydı. R<sub>3</sub>\'ün başında 3 var: <span class="st-math">3 − 2 = 1</span>, sıfır olmaz.'},
        {text: 'R<sub>3</sub> → R<sub>3</sub> + 3R<sub>1</sub>', value: 3, tag: 'factor-sign', feedback: 'Eklersen <span class="st-math">3 + 3 = 6</span> olur. Sıfır için çıkarmalısın.'},
        {text: 'R<sub>3</sub> → R<sub>3</sub> − 3R<sub>1</sub>', value: -3, correct: true, feedback: 'Pivot 1, R<sub>3</sub>\'ün başı 3: <span class="st-math">3 − 3·1 = 0</span>.'},
      ],
      check: {expr: '-T[2, 0]/T[0, 0]'},
      claims: [{expr: 'T.row(2) - 3*T.row(0)', equals: [[0, -2, -4, -14]]}],
      reveal: {type: 'rowOp', mat: 'T', source: 0, target: 2, factor: -3},
    },
    // Tuzak: forget the b column; next pivot in column 2
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'Şimdi <span class="st-math">R<sub>3</sub> → R<sub>3</sub> + 2R<sub>2</sub></span>. Yeni R<sub>3</sub> hangi denklem?',
      scene: {items: ['T', 'op:arrow', 'X3'], mode: 'aug'},
      state: {T: [[1, 2, 1, 7], [0, 1, 1, 4], [0, -2, -4, -14]]},
      marks: [['T', 1, 1, 'is-pivot'], ['T', 2, 1, 'is-target']],
      options: [
        {text: '−2z = −14', value: [[0, 0, -2, -14]], tag: 'forgot-b-column', feedback: 'İşlemi b sütununa uygulamadın. Çizginin sağı da değişir: <span class="st-math">−14 + 2·4 = −6</span>.'},
        {text: '−4y − 6z = −22', value: [[0, -4, -6, -22]], tag: 'subtracted-instead', feedback: 'Bu R<sub>3</sub> − 2R<sub>2</sub>. Çıkarınca y silinmez: <span class="st-math">−2 − 2 = −4</span>. Silmek için topla.'},
        {text: '−2z = −6', value: [[0, 0, -2, -6]], correct: true, feedback: 'Satırın her elemanı değişir, çizginin sağındaki b de.'},
      ],
      check: {expr: 'T2.row(2) + 2*T2.row(1)', given: {T2: [[1, 2, 1, 7], [0, 1, 1, 4], [0, -2, -4, -14]]}},
      claims: [{expr: 'T2.row(2) + 2*T2.row(1)', equals: [[0, 0, -2, -6]]}],
      reveal: {type: 'rowOp', mat: 'T', source: 1, target: 2, factor: 2},
    },
    // Soru (keypad): z from the pivot -2
    {
      kind: 'keypad', eyebrow: 'Soru', title: 'Eşelon hazır. Son satırdan z kaç?',
      scene: {items: ['T', 'op:arrow', 'X3']},
      state: {T: [[1, 2, 1, 7], [0, 1, 1, 4], [0, 0, -2, -6]], X3: [[null], [null], [null]]},
      marks: [['T', 2, '*', 'is-target']],
      answer: 3,
      check: {expr: '(inv(T[:, :3])*T[:, 3])[2]'},
      feedbackRight: 'Pivot −2 çıktı; 1 olması gerekmiyordu. İki tarafı −2\'ye böldün.',
      feedbackWrong: 'İki tarafı pivota, yani −2\'ye böl. Eksiyi eksiye bölmek artı verir.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['T', 2, '*', 'is-row']],
            work: [{text: '−2', kind: 'a', hidden: true, ref: 'a'}, {text: 'z'}, {text: '='}, {text: '−6', kind: 'b', hidden: true, ref: 'b'}],
            fly: [{from: ['T', 2, 2], to: 'work:a', kind: 'row'}, {from: ['T', 2, 3], to: 'work:b', kind: 'row'}]}]},
        {type: 'paced', endMarks: false, frames: [
          {work: [{text: 'z'}, {text: '='}, {text: '−6 ÷ (−2)'}, {text: '='}, {text: '3', kind: 'sum'}],
            set: [['X3', 2, 0, 3]], marks: [['X3', 2, 0, 'is-result']]}]},
      ]},
    },
    // Soru (keypad): y by substituting z, then x shown
    {
      kind: 'keypad', eyebrow: 'Soru', title: 'z = 3\'ü R<sub>2</sub>\'ye koy. y kaç?',
      scene: {items: ['T', 'op:arrow', 'X3']},
      state: {T: [[1, 2, 1, 7], [0, 1, 1, 4], [0, 0, -2, -6]], X3: [[null], [null], [3]]},
      marks: [['T', 1, '*', 'is-target']],
      answer: 1,
      check: {expr: '(inv(T[:, :3])*T[:, 3])[1]'},
      claims: [{expr: 'inv(T[:, :3])*T[:, 3]', equals: [[2], [1], [3]]}],
      feedbackRight: 'Aşağıdan yukarı: z\'yi bir üst satıra koydun.',
      feedbackWrong: 'R<sub>2</sub>\'de z\'nin katsayısı 1. z yerine 3 koyunca y\'nin yanında 3 kalır; onu sağ taraftan çıkar.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['T', 1, '*', 'is-row']],
            work: [{text: 'y'}, {text: '+'}, {text: '3', kind: 'result', hidden: true, ref: 'z1'}, {text: '='}, {text: '4', kind: 'b', hidden: true, ref: 'b1'}],
            fly: [{from: ['X3', 2, 0], to: 'work:z1', kind: 'result'}, {from: ['T', 1, 3], to: 'work:b1', kind: 'row'}]}]},
        {type: 'paced', endMarks: false, frames: [
          {work: [{text: 'y'}, {text: '='}, {text: '4 − 3'}, {text: '='}, {text: '1', kind: 'sum', ref: 'sy'}],
            set: [['X3', 1, 0, 1]], marks: [['X3', 1, 0, 'is-result']]}]},
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['T', 0, '*', 'is-row']],
            work: [{text: 'x'}, {text: '+'}, {text: '2', kind: 'a', hidden: true, ref: 'c3'}, {text: '·'}, {text: '1', kind: 'result', hidden: true, ref: 'y3'},
              {text: '+'}, {text: '3', kind: 'result', hidden: true, ref: 'z3'}, {text: '='}, {text: '7', kind: 'b', hidden: true, ref: 'b3'}],
            fly: [{from: ['T', 0, 1], to: 'work:c3', kind: 'row'}, {from: ['X3', 1, 0], to: 'work:y3', kind: 'result'},
              {from: ['X3', 2, 0], to: 'work:z3', kind: 'result'}, {from: ['T', 0, 3], to: 'work:b3', kind: 'row'}]}]},
        {type: 'paced', endMarks: false, frames: [
          {work: [{text: 'x'}, {text: '='}, {text: '7 − 2·1 − 3'}, {text: '='}, {text: '2', kind: 'sum', ref: 'sx'}],
            set: [['X3', 0, 0, 2]], marks: [['X3', 0, 0, 'is-result']]}]},
      ]},
    },
    // Kural: indirgenmiş eşelon / Gauss-Jordan
    {
      kind: 'explain', eyebrow: 'Kural', title: 'İndirgenmiş eşelon: çözüm sağda',
      body: 'Pivotları 1 yapıp üstlerini de sıfırlarsan <b>indirgenmiş eşelon form</b> çıkar (Gauss–Jordan). Hocan genelde pivotu 1 yapar; bazı kaynaklar eşelonda da 1 ister.',
      scene: {items: ['X3', 'op:arrow', 'RR']},
      state: {X3: [[2], [1], [3]], RR: [[null, null, null, null], [null, null, null, null], [null, null, null, null]]},
      claims: [{expr: 'rref(T)', equals: [[1, 0, 0, 2], [0, 1, 0, 1], [0, 0, 1, 3]]}],
      beat: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['RR', 0, 0, 'is-pivot'], ['RR', 1, 1, 'is-pivot'], ['RR', 2, 2, 'is-pivot']],
          work: [{text: 'pivotlar 1, sütunlarında başka sayı yok', kind: 'a', label: true}],
          set: [['RR', 0, 0, 1], ['RR', 0, 1, 0], ['RR', 0, 2, 0], ['RR', 1, 0, 0], ['RR', 1, 1, 1], ['RR', 1, 2, 0],
            ['RR', 2, 0, 0], ['RR', 2, 1, 0], ['RR', 2, 2, 1]]},
        {clear: true, marks: [['X3', '*', 0, 'is-result']], work: [{text: 'çözüm b sütununa yerleşir', kind: 'sum', label: true}],
          fly: [{from: ['X3', 0, 0], to: ['RR', 0, 3], kind: 'result'}, {from: ['X3', 1, 0], to: ['RR', 1, 3], kind: 'result'},
            {from: ['X3', 2, 0], to: ['RR', 2, 3], kind: 'result'}],
          set: [['RR', 0, 3, 2], ['RR', 1, 3, 1], ['RR', 2, 3, 3]]},
      ]},
    },
    // Sınav tipi: apply a row operation to a given augmented matrix
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: '<span class="st-math">R<sub>2</sub> → R<sub>2</sub> + 2R<sub>1</sub></span> sonrası yeni R<sub>2</sub> hangisi?',
      scene: {items: ['U'], mode: 'aug'},
      options: [
        {text: '0  1  3 | −4', value: [[0, 1, 3, -4]], tag: 'forgot-b-column', expr: 'U.row(1) + 2*U.row(0) - Matrix([[0, 0, 0, 6]])', feedback: 'İşlemi b sütununa uygulamadın: <span class="st-math">−4 + 2·3 = 2</span>.'},
        {text: '−4  9  −1 | −10', value: [[-4, 9, -1, -10]], tag: 'subtracted-instead', expr: 'U.row(1) - 2*U.row(0)', feedback: 'Bu R<sub>2</sub> − 2R<sub>1</sub>. İşlem artı: <span class="st-math">−2 + 2·1 = 0</span>.'},
        {text: '0  1  3 | 2', value: [[0, 1, 3, 2]], correct: true, feedback: 'Her sütun kendi sırasıyla: <span class="st-math">−2+2, 5−4, 1+2, −4+6</span>.'},
      ],
      check: {expr: 'U.row(1) + 2*U.row(0)'},
      reveal: {type: 'rowOp', mat: 'U', source: 0, target: 1, factor: 2},
    },
    // Sınav tipi: back substitution on a given echelon form
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Eşelon form verildi. x kaç?',
      scene: {items: ['E'], mode: 'solo'},
      options: [
        {text: '3', value: ['3'], tag: 'sign-slip', expr: '[1 - 2*2 + 3*2]', feedback: 'R<sub>1</sub>: <span class="st-math">x = 1 + 2y − 3z</span>. −2y karşıya +2y olarak geçer.'},
        {text: '7', value: ['7'], tag: 'b-as-value', expr: '[1 + 2*6 - 3*2]', feedback: 'y = 6 değil; 6, R<sub>2</sub>\'nin sağ tarafı. Önce <span class="st-math">2y + 2 = 6</span> ile y bulunur.'},
        {text: '−1', value: ['-1'], correct: true, feedback: 'En alttan başladın: önce z, sonra y, en son x.'},
      ],
      check: {expr: '[(inv(E[:, :3])*E[:, 3])[0]]'},
      claims: [{expr: 'inv(E[:, :3])*E[:, 3]', equals: [[-1], [2], [2]]}],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['E', 2, '*', 'is-row']]}]},
        {type: 'derive', lines: [{eq: ['4z = 8', 'z = 2']}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['E', 1, '*', 'is-row']]}]},
        {type: 'derive', lines: [{eq: ['2y + 2 = 6', '2y = 4', 'y = 2']}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['E', 0, '*', 'is-row']]}]},
        {type: 'derive', lines: [{eq: ['x − 2·2 + 3·2 = 1', 'x + 2 = 1', 'x = −1']}]},
      ]},
    },
    // Sınav tipi: the outcome of an echelon last row (tek / sonsuz / çözümsüz); the rank test itself is C2
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Eşelon formdaki bu sistemin çözümü?',
      scene: {items: ['W'], mode: 'solo'},
      marks: [['W', 2, '*', 'is-target']],
      options: [
        {text: 'Tek çözüm', value: [3, 3], tag: 'ignored-last-row', feedback: 'Son satır <span class="st-math">0·x + 0·y + 0·z = 4</span> diyor. Bunu hiçbir x, y, z sağlamaz.'},
        {text: 'Sonsuz çözüm', value: [2, 2], tag: 'zero-row-means-free', feedback: 'Sonsuz çözüm <span class="st-math">0 = 0</span> satırından gelir. Burada sağ taraf 4, sıfır değil.'},
        {text: 'Çözüm yok', value: [2, 3], correct: true, feedback: '<span class="st-math">0 = 4</span> hiçbir x, y, z için doğru olmaz: denklemler çelişir.'},
      ],
      check: {expr: '[rank(W[:, :3]), rank(W)]'},
      reveal: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['W', 2, '*', 'is-wrong']], work: [{text: '0·x + 0·y + 0·z = 4', kind: 'a', label: true}]},
        {work: [{text: '0·x + 0·y + 0·z = 4', kind: 'a', label: true}, {text: '→ çelişki, çözüm yok', kind: 'sum'}]},
      ]},
    },
    // Özet
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Sistemi matrisle çöz',
      body: 'Genişletilmiş matrisi yaz, pivotun altını sıfırla, eşelona in. Sonra en alttan yukarı çöz. Son satır 0 = c (c ≠ 0) ise çözüm yok.',
      scene: {items: ['mascot'], mode: 'solo'},
    },
  ],
};

/* C3 k'lı sistemler: det A decides "tek çözüm"; at the roots of det A the last echelon row decides "sonsuz" or "yok". */
/*
 * Checks encode a solution type as [rank A, rank [A | b]] (rank test): [n, n] tek, [r, r] with r < n sonsuz,
 * [r, r + 1] yok. Values of k come from det A; "sonsuz" k values are the common roots of det A and every
 * Cramer numerator det A_i (valid when rank A = n - 1), and claims confirm each case by rank.
 */
LESSONS.C3 = {
  id: 'C3',
  title: 'k\'lı sistemler',
  matrices: {
    M: {name: '[A | b]', values: [[1, 'k', 1], ['k', 4, 2]], augmented: true},
    A: {name: 'A', values: [[1, 'k'], ['k', 4]], bars: true},
    N: {name: '[A | b]', values: [[1, 2, 3], [2, 4, 6]], augmented: true},
    H: {name: '[A | 0]', values: [[1, 'k', 0], ['k', 4, 0]], augmented: true},
    T: {name: '[A | b]', values: [[1, 1, 'k', 1], [1, 'k', 1, 1], ['k', 1, 1, 1]], augmented: true},
    G: {name: '[A | 0]', values: [[1, 1, 1, 0], [2, 3, 2, 0], [1, 2, 1, 0]], augmented: true},
  },
  labels: {
    det: 'det A = ?',
    // Multi-line labels: one block per line, with room between lines.
    plan: 'det A ≠ 0 → <span class="st-hl-result">tek</span><br>son satır 0 = 0 → sonsuz<br>son satır 0 = c, c ≠ 0 → yok',
    last: '(λ² − 9)z = λ − 3',
    simp: '(4 − k²)y = 2 − k<br>y = (2 − k)/((2 − k)(2 + k))<br>y = 1/(2 + k)',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'Hangi k bu sistemi bozar?',
      body: 'Sistem <span class="st-math">x + ky = 1</span> ve <span class="st-math">kx + 4y = 2</span> olsun. A katsayı matrisi, b sağ taraf; <span class="st-math">[A | b]</span> genişletilmiş matristir. Çözüm k\'ya bağlı.',
      scene: {items: ['M'], mode: 'solo'},
      marks: [['M', 0, 1, 'is-target'], ['M', 1, 0, 'is-target']],
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Önce yalnız A\'nın determinantı',
      body: 'Sağ taraftaki b sütununu ayır, katsayılara bak. Köşegenler çarpılır, farkları alınır.',
      scene: {items: ['A', 'det'], mode: 'solo'},
      claims: [{expr: 'det(A)', equals: '4 - k**2'}],
      // det2 needs numbers; the same choreography with symbolic entries.
      beat: {type: 'script', frames: [
        {at: 0, clear: true, work: [
          {text: '1', kind: 'a', hidden: true, ref: 'p0'}, {text: '·', hidden: true, ref: 'd0'},
          {text: '4', kind: 'a', hidden: true, ref: 'p1'}, {text: '−', hidden: true, ref: 'minus'},
          {text: 'k', kind: 'b', hidden: true, ref: 'q0'}, {text: '·', hidden: true, ref: 'd1'},
          {text: 'k', kind: 'b', hidden: true, ref: 'q1'}, {text: '=', hidden: true, ref: 'eq'},
          {text: '4 − k²', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 300, marks: [['A', 0, 0, 'is-row'], ['A', 1, 1, 'is-row']], fly: [{from: ['A', 0, 0], to: 'work:p0', kind: 'row'}]},
        {at: 420, fly: [{from: ['A', 1, 1], to: 'work:p1', kind: 'row'}]},
        {at: 900, reveal: ['d0']},
        {at: 1300, marks: [['A', 0, 1, 'is-col'], ['A', 1, 0, 'is-col']], reveal: ['minus'], fly: [{from: ['A', 0, 1], to: 'work:q0', kind: 'col'}]},
        {at: 1420, fly: [{from: ['A', 1, 0], to: 'work:q1', kind: 'col'}]},
        {at: 1900, reveal: ['d1']},
        {at: 2300, reveal: ['eq', 'sum']},
        {at: 2600, label: ['det', 'det A = <span class="st-hl-result">4 − k²</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'det A = 0 yapan k değerleri hangileri?',
      scene: {items: ['det'], mode: 'solo'},
      labels: {det: 'det A = 4 − k²'},
      options: [
        {text: 'k = 2', value: ['2'], tag: 'lost-negative-root', feedback: 'Bir kök eksik: <span class="st-math">(−2)² = 4</span> de olur. <span class="st-math">k² = 4</span> iki kök verir.'},
        {text: 'k = −2 ya da 2', value: ['-2', '2'], correct: true, feedback: '<span class="st-math">4 − k² = 0</span>, yani <span class="st-math">k² = 4</span>: <span class="st-math">k = −2</span> ya da <span class="st-math">k = 2</span>.'},
        {text: 'k = 4', value: ['4'], tag: 'no-square-root', feedback: '<span class="st-math">k² = 4</span> buldun ama karekök almadın. <span class="st-math">k = ±2</span> olur.'},
      ],
      check: {expr: 'solve(det(A), k)'},
      reveal: {type: 'script', frames: [
        {at: 0, label: ['det', '4 − k² = 0 → <span class="st-hl-result">k = ±2</span>']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'det A ≠ 0 ise tek çözüm',
      body: 'O zaman A\'nın tersi vardır ve <span class="st-math">(x, y) = A⁻¹b</span> tek çözümdür. Bu sistemde <span class="st-math">k ≠ ±2</span> iken böyle.',
      scene: {items: ['det'], mode: 'solo'},
      labels: {det: 'k ≠ ±2 → <span class="st-hl-result">tek çözüm</span>'},
      claims: [{expr: 'solve(det(A), k)', equals: ['-2', '2']}],
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'det A = 0 ise eşelon forma indir',
      body: 'Her satır üstündekinden daha çok sıfırla başlıyorsa matris <b>eşelon formdadır</b> (basamak biçimi). <span class="st-math">R<sub>2</sub> → R<sub>2</sub> − kR<sub>1</sub></span> ile son satır: <span class="st-math">(4 − k²)y = 2 − k</span>.',
      scene: {items: ['M'], mode: 'solo'},
      claims: [{expr: 'M.row(1) - k*M.row(0)', equals: [['0', '4-k**2', '2-k']]}],
      // rowOp needs numbers; the scaled row k·R1 flies onto R2, which turns into R2 − k·R1.
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['M', 0, '*', 'is-row']], work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − kR<sub>1</sub>', label: true}]},
        {at: 450, fly: [{from: ['M', 0, 0], to: ['M', 1, 0], kind: 'row', text: 'k'}]},
        {at: 560, fly: [{from: ['M', 0, 1], to: ['M', 1, 1], kind: 'row', text: 'k²'}]},
        {at: 670, fly: [{from: ['M', 0, 2], to: ['M', 1, 2], kind: 'row', text: 'k'}]},
        {at: 1450, clear: true, set: [['M', 1, 0, 0], ['M', 1, 1, '4-k²'], ['M', 1, 2, '2-k']], marks: [['M', 1, '*', 'is-result']]},
        {at: 2000, work: [{html: 'R<sub>2</sub>:', label: true}, {text: '(4 − k²)y = 2 − k', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'k = −2 iken son satır?',
      scene: {items: ['M'], mode: 'solo'},
      state: {M: [[1, 'k', 1], [0, '4-k²', '2-k']]},
      marks: [['M', 1, '*', 'is-target']],
      options: [
        {text: '0 = 0', value: [[0, 0, 0]], tag: 'wrong-root', feedback: 'Bu <span class="st-math">k = 2</span>\'nin satırı. <span class="st-math">k = −2</span>\'de sağ taraf <span class="st-math">2 − (−2) = 4</span>.'},
        {text: '8y = 4', value: [[0, 8, 4]], tag: 'square-sign', feedback: '<span class="st-math">(−2)² = 4</span>, −4 değil. Sol taraf <span class="st-math">4 − 4 = 0</span> olur.'},
        {text: '0 = 4', value: [[0, 0, 4]], correct: true, feedback: '<span class="st-math">4 − (−2)² = 0</span> ve <span class="st-math">2 − (−2) = 4</span>. Son satır <span class="st-math">0 = 4</span> diyor.'},
      ],
      check: {expr: '(M.row(1) - k*M.row(0)).subs(k, -2)'},
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, work: [{text: 'k = −2', label: true}]},
        {at: 250, set: [['M', 0, 1, -2], ['M', 1, 1, 0], ['M', 1, 2, 4]], marks: [['M', 1, '*', 'is-wrong']]},
        {at: 800, work: [{text: 'k = −2:', label: true}, {text: '0·y = 4'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Son satır <span class="st-math">0 = c (c ≠ 0)</span> ise çözüm yok',
      body: 'Hiçbir x, y için <span class="st-math">0·x + 0·y = 4</span> olmaz. Denklemler çelişir, sistem çözümsüzdür.',
      scene: {items: ['M'], mode: 'solo'},
      state: {M: [[1, -2, 1], [0, 0, 4]]},
      marks: [['M', 1, '*', 'is-wrong']],
      claims: [
        {expr: '(M.row(1) - k*M.row(0)).subs(k, -2)', equals: [[0, 0, 4]]},
        {expr: '[rank(A.subs(k, -2)), rank(M.subs(k, -2))]', equals: [1, 2]},
      ],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '<span class="st-math">k = 2</span>: son satır <span class="st-math">0 = 0</span>. Kaç çözüm var?',
      scene: {items: ['M'], mode: 'solo'},
      state: {M: [[1, 2, 1], [0, 0, 0]]},
      marks: [['M', 1, '*', 'is-target']],
      options: [
        {text: 'Çözüm yok', value: [1, 2], tag: 'zero-row-means-none', feedback: '<span class="st-math">0 = 0</span> çelişki değil, her zaman doğru. Çelişki <span class="st-math">0 = 4</span> gibi bir satırdır.'},
        {text: 'Sonsuz çözüm', value: [1, 1], correct: true, feedback: '<span class="st-math">0 = 0</span> bilgi taşımaz. Kalan <span class="st-math">x + 2y = 1</span>\'de y serbest: sonsuz çözüm.'},
        {text: 'Tek çözüm', value: [2, 2], tag: 'one-equation-one-answer', feedback: 'Tek bir denklem <span class="st-math">x + 2y = 1</span> kaldı, iki bilinmeyen var. y serbest kalır.'},
      ],
      check: {expr: '[rank(A.subs(k, 2)), rank(M.subs(k, 2))]'},
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['M', 0, '*', 'is-row']]},
        {at: 500, work: [{text: 'y = t,', kind: 'sum'}, {text: 'x = 1 − 2t', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Yöntem: det\'in köklerini tek tek dene',
      body: 'Önce det A = 0 yapan k\'ları bul; diğer bütün k\'larda çözüm tektir. Sonra her kökü yerine koy ve son satırı oku.',
      scene: {items: ['plan'], mode: 'solo'},
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'Bu sistemde det A = 0. Yani çözüm yok mu?',
      scene: {items: ['N'], mode: 'solo'},
      options: [
        {text: 'Evet, çözüm yok', value: [1, 2], tag: 'det-zero-means-none', feedback: 'det = 0 yalnız "tek değil" der. <span class="st-math">R<sub>2</sub> − 2R<sub>1</sub></span> son satırı <span class="st-math">0 = 0</span> yapar.'},
        {text: 'Hayır, sonsuz', value: [1, 1], correct: true, feedback: 'İkinci denklem birincinin iki katı. Son satır <span class="st-math">0 = 0</span>: sonsuz çözüm.'},
        {text: 'Hayır, tek çözüm', value: [2, 2], tag: 'ignored-det', feedback: 'Tek çözüm için det ≠ 0 gerekir. Burada <span class="st-math">1·4 − 2·2 = 0</span>.'},
      ],
      check: {expr: '[rank(NA), rank(N)]', given: {NA: [[1, 2], [2, 4]]}},
      claims: [{expr: 'det(NA)', equals: 0}],
      reveal: {type: 'rowOp', mat: 'N', source: 0, target: 1, factor: -2},
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'Bu sadeleştirmede hangi k gözden kaçar?',
      body: 'Pay ve paydadaki <span class="st-math">2 − k</span> çarpanını sadeleştirdin.',
      scene: {items: ['simp']},
      options: [
        {text: 'k = −2', value: ['-2'], tag: 'visible-root', feedback: '<span class="st-math">k = −2</span> gözden kaçmaz, <span class="st-math">1/(2 + k)</span> orada tanımsız. Kaçan, <span class="st-math">2 − k = 0</span> yapan k.'},
        {text: 'k = 2', value: ['2'], correct: true, feedback: '<span class="st-math">2 − k</span> ile böldün, o da <span class="st-math">k = 2</span>\'de 0. Orada satır <span class="st-math">0 = 0</span>: sonsuz çözüm.'},
        {text: 'Hiçbiri', value: [], tag: 'safe-cancel', feedback: 'k\'lı bir ifadeyle bölmek, onun sıfır olduğu k\'yı siler. Burada <span class="st-math">k = 2</span>.'},
      ],
      check: {expr: 'solve(gcd(det(A), det(M[:, [0, 2]])), k)'},
      claims: [{expr: 'cancel(det(M[:, [0, 2]]) / det(A))', equals: '1/(2 + k)'}],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['simp', '(4 − k²)y = 2 − k<br>k = 2: <span class="st-hl-result">0 = 0</span>, sonsuz çözüm']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Bağlantı', title: 'Homojen sistem: sağ taraf 0',
      body: '(0, 0) her zaman çözümdür, yani homojen sistem asla çözümsüz olmaz. det A = 0 ise sıfır dışı çözümler de çıkar.',
      scene: {items: ['H'], mode: 'solo'},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['H', '*', 2, 'is-result']]},
        {at: 700, work: [{text: '(0, 0) daima çözüm', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'k = 3 iken bu homojen sistemin çözümü?',
      scene: {items: ['H'], mode: 'solo'},
      options: [
        {text: 'Sonsuz çözüm', value: [1, 1], tag: 'homogeneous-always-infinite', feedback: 'Sonsuz çözüm için det A = 0 gerekir. <span class="st-math">k = 3</span>\'te <span class="st-math">det A = 4 − 9 = −5</span>.'},
        {text: 'Çözüm yok', value: [1, 2], tag: 'homogeneous-inconsistent', feedback: 'Homojen sistem hiç çözümsüz olmaz: <span class="st-math">(0, 0)</span> her zaman sağlar.'},
        {text: 'Yalnız (0, 0)', value: [2, 2], correct: true, feedback: '<span class="st-math">det A = 4 − 9 = −5 ≠ 0</span>: tek çözüm, o da <span class="st-math">(0, 0)</span>.'},
      ],
      check: {expr: '[rank(A.subs(k, 3)), rank(H.subs(k, 3))]'},
      claims: [{expr: 'det(A.subs(k, 3))', equals: -5}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, set: [['H', 0, 1, 3], ['H', 1, 0, 3]]},
        {at: 500, work: [{text: 'det A = 4 − 9 = −5', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: '<span class="st-math">det A = −(k − 1)²(k + 2)</span>. Sonsuz çözüm için k?',
      scene: {items: ['T'], mode: 'aug'},
      options: [
        {text: 'k = −2', value: ['-2'], tag: 'wrong-root', feedback: '<span class="st-math">k = −2</span>\'de üç satırı topla: <span class="st-math">0 = 3</span>. Orada çözüm yok.'},
        {text: 'k = 1', value: ['1'], correct: true, feedback: '<span class="st-math">k = 1</span>\'de üç denklem de <span class="st-math">x + y + z = 1</span>. İki satır <span class="st-math">0 = 0</span> olur: sonsuz çözüm.'},
        {text: 'k = 1 ya da −2', value: ['1', '-2'], tag: 'det-zero-means-infinite', feedback: 'det = 0 yalnız aday verir. <span class="st-math">k = −2</span>\'de son satır <span class="st-math">0 = 3</span> çıkar.'},
      ],
      check: {expr: 'solve(gcd(gcd(gcd(det(TA), det(T[:, [3, 1, 2]])), det(T[:, [0, 3, 2]])), det(T[:, [0, 1, 3]])), k)', given: {TA: [[1, 1, 'k'], [1, 'k', 1], ['k', 1, 1]]}},
      claims: [
        {expr: 'factor(det(TA))', equals: '-(k - 1)**2*(k + 2)'},
        {expr: '[rank(TA.subs(k, 1)), rank(T.subs(k, 1))]', equals: [1, 1]},
        {expr: '[rank(TA.subs(k, -2)), rank(T.subs(k, -2))]', equals: [2, 3]},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true},
        {at: 250, set: [['T', 0, 2, 1], ['T', 1, 1, 1], ['T', 2, 0, 1]], marks: [['T', 0, '*', 'is-row']]},
        {at: 800, marks: [['T', '*', '*', 'is-row']]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Aynı sistem: hangi k için çözüm yok?',
      scene: {items: ['T'], mode: 'aug'},
      options: [
        {text: 'k = 1', value: ['1'], tag: 'infinite-read-as-none', feedback: '<span class="st-math">k = 1</span>\'de satırlar aynı, sonsuz çözüm var. det = 0 tek başına "yok" demek değil.'},
        {text: 'k = 1 ya da −2', value: ['1', '-2'], tag: 'det-zero-means-none', feedback: 'Kökleri ayrı dene. <span class="st-math">k = 1</span> sonsuz çözüm, yalnız <span class="st-math">k = −2</span> çözümsüz.'},
        {text: 'k = −2', value: ['-2'], correct: true, feedback: 'Üç satırı topla: sol taraf <span class="st-math">0</span>, sağ taraf <span class="st-math">3</span>. <span class="st-math">0 = 3</span> çelişki.'},
      ],
      check: {
        expr: 'sorted(Complement(FiniteSet(*solve(det(TA), k)), FiniteSet(*solve(gcd(gcd(gcd(det(TA), det(T[:, [3, 1, 2]])), det(T[:, [0, 3, 2]])), det(T[:, [0, 1, 3]])), k))))',
        given: {TA: [[1, 1, 'k'], [1, 'k', 1], ['k', 1, 1]]},
      },
      claims: [{expr: '(T.row(0) + T.row(1) + T.row(2)).subs(k, -2)', equals: [[0, 0, 0, 3]]}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true},
        {at: 250, set: [['T', 0, 2, -2], ['T', 1, 1, -2], ['T', 2, 0, -2]], marks: [['T', '*', 3, 'is-wrong']]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Eşelonda son satır bu. Hangi λ için tek çözüm?',
      scene: {items: ['last'], mode: 'solo'},
      options: [
        {text: 'λ ≠ 3', value: 'Complement(Reals, FiniteSet(3))', tag: 'missed-negative-root', feedback: '<span class="st-math">λ = −3</span>\'te de <span class="st-math">λ² − 9 = 0</span>. Orada <span class="st-math">0 = −6</span>: çözüm yok.'},
        {text: 'λ ≠ ±3', value: 'Complement(Reals, FiniteSet(-3, 3))', correct: true, feedback: '<span class="st-math">λ² − 9 ≠ 0</span> iken z tek bulunur. <span class="st-math">λ = 3</span> sonsuz, <span class="st-math">λ = −3</span> yok.'},
        {text: 'λ ≠ −3', value: 'Complement(Reals, FiniteSet(-3))', tag: 'only-contradiction-root', feedback: 'Yalnız çelişkiyi dışladın. <span class="st-math">λ = 3</span>\'te <span class="st-math">0 = 0</span>: sonsuz çözüm, tek değil.'},
      ],
      check: {
        expr: 'Complement(Reals, FiniteSet(*solve(det(SA), lam)))',
        given: {
          SA: [[1, 2, -1], [2, 5, 1], [1, 3, 'lam**2-7']],
          S: [[1, 2, -1, 1], [2, 5, 1, 3], [1, 3, 'lam**2-7', 'lam-1']],
        },
      },
      claims: [
        {expr: 'S.row(2) - S.row(1) + S.row(0)', equals: [['0', '0', 'lam**2-9', 'lam-3']]},
        {expr: '[rank(SA.subs(lam, 3)), rank(S.subs(lam, 3))]', equals: [2, 2]},
        {expr: '[rank(SA.subs(lam, -3)), rank(S.subs(lam, -3))]', equals: [2, 3]},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['last', 'λ² − 9 ≠ 0 → <span class="st-hl-result">λ ≠ ±3</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Bu homojen sistemin çözüm kümesi? <span class="st-math">(t ∈ ℝ)</span>',
      scene: {items: ['G'], mode: 'aug'},
      options: [
        {text: '(t, 0, t)', value: [[1], [0], [1]], tag: 'sign-slip', feedback: 'İşaret: <span class="st-math">x + z = 0</span> ise <span class="st-math">x = −z = −t</span>.'},
        {text: '(−t, 0, t)', value: [[-1], [0], [1]], correct: true, feedback: '<span class="st-math">R<sub>2</sub> − 2R<sub>1</sub></span> ve <span class="st-math">R<sub>3</sub> − R<sub>1</sub></span> ile <span class="st-math">y = 0</span>, sonra <span class="st-math">x = −z</span>.'},
        {text: 'Yalnız (0, 0, 0)', value: [[0], [0], [0]], tag: 'trivial-only', feedback: 'Burada det A = 0, çünkü iki satır sonunda aynı çıkıyor. Sıfır dışı çözümler var.'},
      ],
      check: {expr: 'GA.nullspace()[0]', given: {GA: [[1, 1, 1], [2, 3, 2], [1, 2, 1]]}},
      claims: [{expr: 'det(GA)', equals: 0}, {expr: 'rank(GA)', equals: 2}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['G', 0, '*', 'is-row']]},
        {at: 300, set: [['G', 1, 0, 0], ['G', 1, 1, 1], ['G', 1, 2, 0]]},
        {at: 700, set: [['G', 2, 0, 0], ['G', 2, 1, 1], ['G', 2, 2, 0]]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'k\'lı sistem: iki adım',
      body: '1) det A = 0 yapan k\'ları bul, gerisi tek çözüm. 2) Her kökü dene: <span class="st-math">0 = 0</span> sonsuz, <span class="st-math">0 = (sıfır olmayan)</span> yok. Homojende yok çıkmaz.',
      scene: {items: ['mascot', 'plan']},
    },
  ],
};

/* A10 Ters matris özellikleri: AX = XA = I, uniqueness, det A ≠ 0, (AB)⁻¹ = B⁻¹A⁻¹, (Aᵀ)⁻¹, (kA)⁻¹, inverse from a matrix polynomial. */
/*
 * A10 comes after B6 in the course, so it uses det, ad − bc, det(AB) = det A · det B and Ek(A) as already taught.
 * Checks that are not plain numbers:
 *  - Statements about products of inverses are tested on concrete non-commuting matrices GA, GB, GC
 *    (never shown); an option's value is the matrix it claims, so only the true rule matches.
 *  - "Hangisi her zaman doğru?" encodes each statement as LHS − RHS on GA, GB: the true one is the zero matrix.
 *  - Polynomial items treat A as the commuting symbol a (I as 1); the check is SymPy's inverse of a
 *    modulo the polynomial (invert), which is exactly A⁻¹ written as a polynomial in A.
 * Symbolic matrix algebra (no numbers to recompute) is written one move per line: a sequence of
 * single-line paced beats, so every earlier line stays on the stage while the next one arrives.
 */
LESSONS.A10 = {
  id: 'A10',
  title: 'Ters matris, (AB)⁻¹',
  matrices: {
    A: {name: 'A', values: [[2, 1], [5, 3]]},
    B: {name: 'B', values: [[3, -1], [-5, 2]]},
    P: {name: 'A·B', values: [[null, null], [null, null]]},
    Q: {name: 'B·A', values: [[null, null], [null, null]]},
    K: {name: 'A', values: [['k', 2], [2, 'k-3']], bars: true},
    AI: {name: 'A⁻¹', values: [[4, -2], [6, 8]]},
    T: {name: '(2Aᵀ)⁻¹', values: [[null, null], [null, null]]},
    IA: {name: '', values: [[2, 1], [1, 1]]},
    IB: {name: '', values: [[1, 3], [0, 2]]},
    // Never shown: concrete matrices that check the general rules (GA, GB, GC do not commute).
    GA: {name: 'A', values: [[1, 2], [3, 5]]},
    GB: {name: 'B', values: [[2, 1], [1, 1]]},
    GC: {name: 'C', values: [[1, 1], [0, 2]]},
    CM: {name: 'A', values: [[3, 1], [1, 1]]},
  },
  labels: {
    tek: 'B ve C, A\'nın tersi',
    inv: 'A·A⁻¹ = A⁻¹·A = I',
    detl: 'A·A⁻¹ = I',
    v: '0',
    shoe: '(AB)⁻¹ = ?',
    abc: '(ABC)⁻¹ = ?',
    rules: '(Aᵀ)⁻¹ = ?<br>(kA)⁻¹ = ?',
    poly: 'A² − 4A + 2I = 0',
    p2: 'A² + 3A − I = 0',
    p3: 'A³ − 2A + 3I = 0',
    nl: 'A⁻¹ =',
    nr: 'B⁻¹ =',
    sep: ',',
    tf: 'A ve B tersinir n×n',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'B, A\'nın tersi mi?',
      body: 'Ters, iki sırada da birim matris I vermeli. Önce A·B\'yi, sonra B·A\'yı çarpıp bakacağız.',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'P']},
      marks: [['P', '*', '*', 'is-target']],
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'A·B: üç eleman',
      body: 'Her eleman, A\'nın <span class="st-hl-row">satırı</span> ile B\'nin <span class="st-hl-col">sütununun</span> çarpımı. Dördüncüyü sen bulacaksın.',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'P']},
      beat: {type: 'derive', lines: [
        {into: ['P', 0, 0], expr: ['+',
          ['·', {role: 'row', expr: ['A', 0, 0]}, {role: 'col', expr: ['B', 0, 0]}],
          ['·', {role: 'row', expr: ['A', 0, 1]}, {role: 'col', expr: ['B', 1, 0]}]]},
        {into: ['P', 0, 1], expr: ['+',
          ['·', {role: 'row', expr: ['A', 0, 0]}, {role: 'col', expr: ['B', 0, 1]}],
          ['·', {role: 'row', expr: ['A', 0, 1]}, {role: 'col', expr: ['B', 1, 1]}]]},
        {into: ['P', 1, 1], expr: ['+',
          ['·', {role: 'row', expr: ['A', 1, 0]}, {role: 'col', expr: ['B', 0, 1]}],
          ['·', {role: 'row', expr: ['A', 1, 1]}, {role: 'col', expr: ['B', 1, 1]}]]},
      ]},
      claims: [{expr: '(A*B)[0, 0]', equals: 1}, {expr: '(A*B)[0, 1]', equals: 0}, {expr: '(A*B)[1, 1]', equals: 1}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '(A·B)\'nin (2,1) elemanı kaç?',
      scene: {items: ['A', 'op:dot', 'B', 'op:eq', 'P']},
      state: {P: [[1, 0], [null, 1]]},
      marks: [['P', 1, 0, 'is-target']],
      check: {expr: '(A*B)[1, 0]'},
      options: [
        {text: '30', tag: 'sign-dropped', expr: '5*3 + 3*5',
          feedback: 'B\'deki −5\'in eksisini kaybettin: <span class="st-math">3·(−5) = −15</span>.'},
        {text: '0', correct: true,
          feedback: 'A\'nın 2. satırı ile B\'nin 1. sütununun çarpımları birbirini götürür.'},
        {text: '12', tag: 'row-times-row', expr: '5*3 + 3*(-1)',
          feedback: 'B\'nin 1. satırını aldın. Satır × sütun: B\'den <span class="st-math">3, −5</span> sütunu gelir.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'derive', lines: [
          {into: ['P', 1, 0], expr: ['+',
            ['·', {role: 'row', expr: ['A', 1, 0]}, {role: 'col', expr: ['B', 0, 0]}],
            ['·', {role: 'row', expr: ['A', 1, 1]}, {role: 'col', expr: ['B', 1, 0]}]]},
        ]},
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['P', '*', '*', 'is-result']], work: [{html: 'A·B = I', kind: 'sum'}]},
        ]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'AB = BA = I ise B = A⁻¹',
      body: 'İki sırada da I çıktı: B, A\'nın tersidir ve A⁻¹ yazılır. Ters yalnız kare matriste aranır. Böyle bir B\'yi Ek(A) / det A ile bulursun.',
      scene: {items: ['B', 'op:dot', 'A', 'op:eq', 'Q']},
      beat: {type: 'sequence', beats: [
        {type: 'derive', lines: [
          {into: ['Q', 0, 0], expr: ['+',
            ['·', {role: 'row', expr: ['B', 0, 0]}, {role: 'col', expr: ['A', 0, 0]}],
            ['·', {role: 'row', expr: ['B', 0, 1]}, {role: 'col', expr: ['A', 1, 0]}]]},
          {into: ['Q', 0, 1], expr: ['+',
            ['·', {role: 'row', expr: ['B', 0, 0]}, {role: 'col', expr: ['A', 0, 1]}],
            ['·', {role: 'row', expr: ['B', 0, 1]}, {role: 'col', expr: ['A', 1, 1]}]]},
          {into: ['Q', 1, 0], expr: ['+',
            ['·', {role: 'row', expr: ['B', 1, 0]}, {role: 'col', expr: ['A', 0, 0]}],
            ['·', {role: 'row', expr: ['B', 1, 1]}, {role: 'col', expr: ['A', 1, 0]}]]},
          {into: ['Q', 1, 1], expr: ['+',
            ['·', {role: 'row', expr: ['B', 1, 0]}, {role: 'col', expr: ['A', 0, 1]}],
            ['·', {role: 'row', expr: ['B', 1, 1]}, {role: 'col', expr: ['A', 1, 1]}]]},
        ]},
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['Q', '*', '*', 'is-result']], work: [{html: 'AB = BA = I → B = A⁻¹', kind: 'sum'}]},
        ]},
      ]},
      claims: [{expr: 'B*A', equals: [[1, 0], [0, 1]]}, {expr: 'inv(A)', equals: [[3, -1], [-5, 2]]}],
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Ters varsa tektir',
      body: 'B ve C, A\'nın iki tersi olsun. I yerine AC yaz, parantezi kaydır, BA = I kullan.',
      scene: {items: ['tek'], mode: 'solo'},
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'B = B·I'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= B(AC)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= (BA)C'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= I·C'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= C', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '(A⁻¹)⁻¹ nedir?',
      body: 'Eşitliğe bu kez A⁻¹\'in gözüyle bak.',
      scene: {items: ['inv'], mode: 'solo'},
      check: {expr: 'inv(inv(A))'},
      options: [
        {text: 'I', value: 'eye(2)', tag: 'identity-guess',
          feedback: 'I ile çarpmak hiçbir şeyi değiştirmez: <span class="st-math">A⁻¹·I = A⁻¹</span>, I değil.'},
        {text: 'A⁻¹', value: 'inv(A)', tag: 'inverse-unchanged',
          feedback: 'A⁻¹·A⁻¹ genelde I vermez. A⁻¹ ile iki sırada da I veren matris A.'},
        {text: 'A', value: 'A', correct: true,
          feedback: 'A⁻¹ ile iki sırada da I veren matris A. Ters tek olduğu için başka aday yok.'},
      ],
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Ters ancak det A ≠ 0 ise var',
      body: '<span class="st-math">det(AB) = det A · det B</span> kuralını A·A⁻¹ = I\'ya uygula. Çarpım 1 ise hiçbir çarpan 0 olamaz. Tersi olmayana tekil denir.',
      scene: {items: ['detl'], mode: 'solo'},
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'det(A·A⁻¹) = det I = 1'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'det A · det(A⁻¹) = 1'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'det A = 0 ise 0 = 1 ✗'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'det A ≠ 0', kind: 'sum'}]}]},
      ]},
      claims: [{expr: 'det(GA*inv(GA))', equals: 1}, {expr: 'det(GA)*det(inv(GA))', equals: 1}],
    },
    {
      stageExplains: true, kind: 'choice', eyebrow: 'Senin sıran', title: 'Hangi k için A⁻¹ yoktur?',
      scene: {items: ['K', 'op:eq', 'v'], mode: 'solo'},
      check: {expr: 'solve(det(K), k)'},
      options: [
        {text: 'k = −4 ya da 1', value: ['-4', '1'], tag: 'root-sign-flipped',
          feedback: 'Kökün işaretini çevirdin: <span class="st-math">k − 4 = 0</span> ise k = 4, −4 değil.'},
        {text: 'k = 0 ya da 3', value: ['0', '3'], tag: 'zero-on-diagonal',
          feedback: 'Köşegende 0 olması tersi yok etmez. k = 0\'da <span class="st-math">det A = −4 ≠ 0</span>.'},
        {text: 'k = 4 ya da −1', value: ['4', '-1'], correct: true,
          feedback: 'Ters yok demek det A = 0 demek; ikinci dereceden denklemin iki kökü de sayılır.'},
      ],
      claims: [{expr: 'factor(det(K))', equals: '(k - 4)*(k + 1)'}],
      reveal: {type: 'det2', mat: 'K', values: ['k(k − 3)', 4, 'k² − 3k − 4'], rhs: '0', rhsFrom: 'v',
        then: [{eq: ['k² − 3k − 4 = 0', '(k − 4)(k + 1) = 0', 'k = 4 ya da −1']}]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: '(AB)⁻¹ = B⁻¹A⁻¹: sıra döner',
      body: 'Önce çorap, sonra ayakkabı giyersin; çıkarırken sıra tersine döner. Çarpımın tersinde de öyle.',
      scene: {items: ['shoe'], mode: 'solo'},
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(AB)(B⁻¹A⁻¹)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= A(<span class="st-hl-result">BB⁻¹</span>)A⁻¹'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= A·<span class="st-hl-result">I</span>·A⁻¹'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= AA⁻¹ = I', kind: 'sum'}],
          label: ['shoe', '(AB)⁻¹ = <span class="st-hl-result">B⁻¹A⁻¹</span>']}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(B⁻¹A⁻¹)(AB) = I de aynı yoldan'}]}]},
      ]},
      claims: [{expr: 'inv(GA*GB)', equals: 'inv(GB)*inv(GA)'}],
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: '(ABC)⁻¹ hangisi?',
      body: 'A, B ve C tersinir n×n matrisler.',
      scene: {items: ['abc'], mode: 'solo'},
      check: {expr: 'inv(GA*GB*GC)'},
      options: [
        {text: 'A⁻¹B⁻¹C⁻¹', value: 'inv(GA)*inv(GB)*inv(GC)', tag: 'order-kept',
          feedback: 'Klasik tuzak: sırayı korudun. Ters alınca sıra döner.'},
        {text: 'C⁻¹A⁻¹B⁻¹', value: 'inv(GC)*inv(GA)*inv(GB)', tag: 'half-reversed',
          feedback: 'Yalnız C\'yi başa aldın. Sıranın tamamı döner: <span class="st-math">C⁻¹B⁻¹A⁻¹</span>.'},
        {text: 'C⁻¹B⁻¹A⁻¹', value: 'inv(GC)*inv(GB)*inv(GA)', correct: true,
          feedback: 'En son giyilen en önce çıkar: C⁻¹ başa, A⁻¹ sona gelir.'},
      ],
      reveal: {type: 'paced', endMarks: false, frames: [
        {work: [{html: '(ABC)⁻¹ =', label: true}, {html: 'C⁻¹'}]},
        {work: [{html: '(ABC)⁻¹ =', label: true}, {html: 'C⁻¹'}, {html: 'B⁻¹'}]},
        {work: [{html: '(ABC)⁻¹ =', label: true}, {html: 'C⁻¹', kind: 'sum'}, {html: 'B⁻¹', kind: 'sum'}, {html: 'A⁻¹', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: '(Aᵀ)⁻¹ = (A⁻¹)ᵀ ve (kA)⁻¹ = (1/k)·A⁻¹',
      body: 'Transpozda sıra döner: <span class="st-math">(XY)ᵀ = YᵀXᵀ</span>. Skaler kendi tersine döner. <span class="st-math">k&nbsp;≠&nbsp;0</span> olmalı.',
      scene: {items: ['rules'], mode: 'solo'},
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'Aᵀ·(A⁻¹)ᵀ = (A⁻¹A)ᵀ'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= Iᵀ = I', kind: 'sum'}],
          label: ['rules', '(Aᵀ)⁻¹ = <span class="st-hl-result">(A⁻¹)ᵀ</span><br>(kA)⁻¹ = ?']}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(kA)·(1/k)A⁻¹ = (k·1/k)·AA⁻¹'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= 1·I = I', kind: 'sum'}],
          label: ['rules', '(Aᵀ)⁻¹ = (A⁻¹)ᵀ<br>(kA)⁻¹ = <span class="st-hl-result">(1/k)·A⁻¹</span>']}]},
      ]},
      claims: [{expr: 'inv(T(GA))', equals: 'T(inv(GA))'}, {expr: 'inv(3*GA)', equals: 'inv(GA)/3'}],
    },
    {
      stageExplains: true, kind: 'choice', eyebrow: 'Senin sıran', title: '(2Aᵀ)⁻¹\'in (2,1) elemanı kaç?',
      body: 'A\'yı bulmana gerek yok.',
      scene: {items: ['AI', 'op:arrow', 'T']},
      marks: [['T', 1, 0, 'is-target']],
      check: {expr: 'inv(2*T(inv(AI)))[1, 0]'},
      options: [
        {text: '3', tag: 'forgot-transpose', expr: 'AI[1, 0]/2',
          feedback: 'Transpozu unuttun: (2,1) yerine A⁻¹\'in (1,2) elemanı −2 gelir.'},
        {text: '−4', tag: 'k-not-inverted', expr: '2*AI[0, 1]',
          feedback: '2 ile çarptın. Skaler tersine döner: <span class="st-math">(2A)⁻¹ = (1/2)·A⁻¹</span>.'},
        {text: '−1', correct: true,
          feedback: 'Transpoz elemanın yerini, skaler değerini değiştirir.'},
        {text: '−2', tag: 'scalar-dropped', expr: 'AI[0, 1]',
          feedback: 'Yeri doğru buldun ama 2\'yi unuttun: skaler 1/2 olarak çarpar.'},
      ],
      claims: [{expr: 'inv(2*T(inv(AI)))', equals: 'T(AI)/2'}],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['AI', 0, 1, 'is-pivot'], ['T', 1, 0, 'is-target']],
            work: [{html: '(2Aᵀ)⁻¹ = (1/2)·(A⁻¹)ᵀ: (1,2) → (2,1)'}]},
        ]},
        {type: 'derive', lines: [
          {into: ['T', 1, 0], expr: ['·', '1/2', {role: 'row', expr: ['AI', 0, 1]}]},
        ]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Polinomdan ters: A·(…) = I',
      body: 'I\'lı terimi sağa at, A\'yı ortak paranteze al. Sonra sağda yalnız I kalacak şekilde böl.',
      scene: {items: ['poly'], mode: 'solo'},
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A² − 4A = <span class="st-hl-result">−2I</span>'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '<span class="st-hl-result">A</span>(A − 4I) = −2I'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A·(A − 4I)/(−2) = I'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A·(4I − A)/2 = I'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A⁻¹ = (4I − A)/2', kind: 'sum'}]}]},
      ]},
      claims: [
        {expr: 'CM**2 - 4*CM + 2*eye(2)', equals: [[0, 0], [0, 0]]},
        {expr: 'inv(CM)', equals: '(4*eye(2) - CM)/2'},
        {expr: 'invert(a, a**2 - 4*a + 2)', equals: '(4 - a)/2'},
      ],
    },
    {
      stageExplains: true, kind: 'choice', eyebrow: 'Senin sıran', title: 'A bu eşitliği sağlıyor. A⁻¹ nedir?',
      scene: {items: ['p2'], mode: 'solo'},
      check: {expr: 'invert(a, a**2 + 3*a - 1)'},
      options: [
        {text: 'A − 3I', value: 'a - 3', tag: 'sign-slip',
          feedback: 'Paranteze alırken işaret kaydı: <span class="st-math">A² + 3A = A(A + 3I)</span>.'},
        {text: 'A + 3I', value: 'a + 3', correct: true,
          feedback: 'I sağa geçince artı olur. A\'yı paranteze alınca sağda tam I kalır.'},
        {text: '−A − 3I', value: '-a - 3', tag: 'moved-term-sign',
          feedback: '−I sağa geçince +I olur, −I değil. Sağda +I olduğu için bölmeye gerek yok.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A² + 3A = <span class="st-hl-result">I</span>'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '<span class="st-hl-result">A</span>(A + 3I) = I'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A⁻¹ = A + 3I', kind: 'sum'}]}]},
      ]},
    },
    {
      stageExplains: true, kind: 'choice', eyebrow: 'Sınav tipi', title: 'Bu eşitlikten A⁻¹ hangisi?',
      scene: {items: ['p3'], mode: 'solo'},
      check: {expr: 'invert(a, a**3 - 2*a + 3)'},
      options: [
        {text: '(A² − 2I)/3', value: '(a**2 - 2)/3', tag: 'moved-term-sign',
          feedback: '+3I sağa geçince −3I olur; bölerken o eksi parantezi çevirir.'},
        {text: '(2I − A)/3', value: '(2 - a)/3', tag: 'power-slip',
          feedback: 'A³\'ten bir A çıkınca A² kalır, A değil: <span class="st-math">A³ = A·A²</span>.'},
        {text: '(2I − A²)/3', value: '(2 - a**2)/3', correct: true,
          feedback: 'A paranteze alınıp −3\'e bölünce sağda yalnız I kalır; eksi parantezi çevirir.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A³ − 2A = <span class="st-hl-result">−3I</span>'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '<span class="st-hl-result">A</span>(A² − 2I) = −3I'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A·(A² − 2I)/(−3) = I'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A·(2I − A²)/3 = I'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A⁻¹ = (2I − A²)/3', kind: 'sum'}]}]},
      ]},
    },
    {
      stageExplains: true, kind: 'choice', eyebrow: 'Sınav tipi', title: '(AB)⁻¹\'in (1,2) elemanı kaç?',
      scene: {items: ['nl', 'IA', 'sep', 'nr', 'IB']},
      check: {expr: 'inv(inv(IA)*inv(IB))[0, 1]'},
      options: [
        {text: '8', tag: 'order-kept', expr: '(IA*IB)[0, 1]',
          feedback: 'A⁻¹B⁻¹ hesapladın. Sıra döner: <span class="st-math">(AB)⁻¹ = B⁻¹A⁻¹</span>.'},
        {text: '4', correct: true,
          feedback: 'Önce sırayı çevirdin, sonra satır × sütun yaptın.'},
        {text: '3', tag: 'entrywise', expr: 'IA[0, 1]*IB[0, 1]',
          feedback: 'Eleman eleman çarptın. Çarpım satır × sütun ister: B⁻¹A⁻¹.'},
      ],
      // B⁻¹A⁻¹: the row comes from B⁻¹ (right on screen), the column from A⁻¹ (left on screen).
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [
          {clear: true, work: [{html: '(AB)⁻¹ = B⁻¹A⁻¹: B⁻¹\'in satırı, A⁻¹\'in sütunu'}]},
        ]},
        {type: 'derive', lines: [
          {label: '(1,2):', expr: ['+',
            ['·', {role: 'row', expr: ['IB', 0, 0]}, {role: 'col', expr: ['IA', 0, 1]}],
            ['·', {role: 'row', expr: ['IB', 0, 1]}, {role: 'col', expr: ['IA', 1, 1]}]]},
        ]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangisi her zaman doğru?',
      scene: {items: ['tf'], mode: 'solo'},
      // Each option's value is LHS − RHS on the test pair GA, GB: only an identity gives the zero matrix.
      check: {expr: 'zeros(2, 2)'},
      options: [
        {text: '(AB)⁻¹ = A⁻¹B⁻¹', value: 'inv(GA*GB) - inv(GA)*inv(GB)', tag: 'order-kept',
          feedback: 'Sıra döner: <span class="st-math">(AB)⁻¹ = B⁻¹A⁻¹</span>. A ve B değişmeli değilse ikisi farklı.'},
        {text: '(Aᵀ)⁻¹ = (A⁻¹)ᵀ', value: 'inv(T(GA)) - T(inv(GA))', correct: true,
          feedback: 'Transpoz ile ters yer değiştirebilir. Toplamda ise kural yok: <span class="st-math">(A + B)⁻¹ ≠ A⁻¹ + B⁻¹</span>.'},
        {text: '(2A)⁻¹ = 2A⁻¹', value: 'inv(2*GA) - 2*inv(GA)', tag: 'k-not-inverted',
          feedback: 'Skaler tersine döner: <span class="st-math">(2A)⁻¹ = (1/2)·A⁻¹</span>.'},
      ],
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'A⁻¹: iki yönden I, sıra döner',
      body: 'AB = BA = I; ters tek, det A ≠ 0 ise var. (AB)⁻¹ = B⁻¹A⁻¹, (Aᵀ)⁻¹ = (A⁻¹)ᵀ, (kA)⁻¹ = A⁻¹/k (k ≠ 0).',
      scene: {items: ['mascot'], mode: 'solo'},
    },
  ],
};

/* C4 Homojen sistemler: AX = 0 always has the trivial solution; non-trivial ones exist iff rank A < n (det A = 0); rank = pivots, free variables, solution sets with one or two parameters. */
/*
 * Builds on C1 (genişletilmiş matris, pivot, eşelon, geriye doğru yerine koyma) and C3 (which showed that (0, 0) always solves
 * and that det A ≠ 0 leaves only it) without repeating them. Eşelon form is recalled in one clause where rank first appears.
 * Solution sets are checked as the nullspace basis (columns = parameters); the three counts of step 3 are encoded as the set of t for which t·v solves (Reals = sonsuz); the claims on HA machine-check the premise.
 * HA is never shown: it makes the premise of step 3 machine-checked (HA·(1, 2, −1) = 0 and a free variable remains).
 * One row operation per beat, one work line per beat, so every earlier line stays on the stage.
 * The parameter is t (or s, t for two); the lesson says once that any letter works, since k is the system parameter in steps 16-17.
 */
LESSONS.C4 = {
  id: 'C4',
  title: 'Homojen sistemler',
  matrices: {
    W: {name: '[A | 0]', values: [[1, 3, 2, 0], [2, 6, 5, 0], [2, 6, 4, 0]], augmented: true},
    F: {name: 'A', values: [[1, 2, 0, -1], [0, 0, 1, 3]]},
    K: {name: '[A | 0]', values: [[1, 2, 3, 0], [2, 'k', 4, 0], [1, 1, 'k', 0]], augmented: true},
    E: {name: '[A | 0]', values: [[1, 2, -1, 0], [2, 5, 1, 0]], augmented: true},
    HA: {name: 'A', values: [[1, 1, 3], [2, 0, 2]]},
  },
  labels: {
    tv: 'Av = 0',
    one: 'AX = 0<br>v = (1, 2, −1) bir çözüm',
    rule: 'rank A = n → yalnız aşikar<br>rank A < n → sonsuz çözüm',
    wide: 'm denklem, n bilinmeyen<br>m < n',
    m35: 'AX = 0<br>3 denklem, 5 bilinmeyen',
    sol: 'X = (2t, −t, t), t ∈ ℝ<br>A: 3×3, rank A = ?',
    sum: 'rank A < n ⇔ sonsuz çözüm<br>serbest sayısı = n − rank A<br>m < n → hep sonsuz çözüm',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'Homojen sistem: sıfırdan başka çözüm var mı?',
      body: 'Sağ taraf hep 0, sütunlar x, y, z: homojen sistem. (0, 0, 0) hep çözümdür, adı aşikar çözüm. Aşikar olmayan çözüm var mı?',
      scene: {items: ['W'], mode: 'solo'},
      marks: [['W', '*', 3, 'is-target']],
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Sıfır dışı bir çözüm varsa sonsuz tane var',
      body: 'v ≠ 0 bir çözüm olsun. Sayı çarpanı dışarı çıkar, her tv de çözüm olur. Ya yalnız aşikar çözüm vardır, ya sonsuz tane.',
      scene: {items: ['tv'], mode: 'solo'},
      beat: {type: 'paced', endMarks: false, frames: [
        {label: ['tv', 'Av = 0']},
        {label: ['tv', 'Av = 0<br>A(tv) = t·(Av)']},
        {label: ['tv', 'Av = 0<br>A(tv) = t·(Av)<br>= t·0 = <span class="st-hl-result">0</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Bu homojen sistemin kaç çözümü var?',
      scene: {items: ['one'], mode: 'solo'},
      options: [
        {text: 'Tek', value: 'FiniteSet(0)', tag: 'nonzero-means-unique', feedback: 'Tek çözüm olsaydı o, aşikar çözüm olurdu. <span class="st-math">(2, 4, −2)</span> de sağlar.'},
        {text: 'İki', value: 'FiniteSet(0, 1)', tag: 'only-two-solutions', feedback: '<span class="st-math">(0, 0, 0)</span> ve <span class="st-math">(1, 2, −1)</span> dışında bütün katları da çözüm.'},
        {text: 'Sonsuz', value: 'Reals', correct: true, feedback: 'Bir sıfır dışı çözüm, bütün katlarını da çözüm yapar.'},
      ],
      check: {expr: 'Reals'},
      claims: [
        {expr: '2*Matrix([1, 2, -1])', equals: [[2], [4], [-2]]},
        {expr: 'HA*Matrix([1, 2, -1])', equals: [[0], [0]]},
        {expr: '3 - rank(HA)', equals: 1},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: '2v = (2, 4, −2) de çözüm'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(−1)v = (−1, −2, 1) de çözüm'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tv her t için çözüm', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Önce eşelon forma indir',
      body: 'Pivotun altını sıfırla. Sağ sütun 0 olduğu için hep 0 kalır.',
      scene: {items: ['W'], mode: 'aug'},
      marks: [['W', 0, 0, 'is-pivot'], ['W', 1, 0, 'is-target']],
      claims: [{expr: 'W.row(1) - 2*W.row(0)', equals: [[0, 0, 1, 0]]}],
      beat: {type: 'rowOp', mat: 'W', source: 0, target: 1, factor: -2},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'R<sub>3</sub>\'teki 2\'yi hangi işlem sıfırlar?',
      scene: {items: ['W'], mode: 'aug'},
      state: {W: [[1, 3, 2, 0], [0, 0, 1, 0], [2, 6, 4, 0]]},
      marks: [['W', 0, 0, 'is-pivot'], ['W', 2, 0, 'is-target']],
      options: [
        {text: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>1</sub>', value: -1, tag: 'factor-one', feedback: 'Bir kat yetmez: <span class="st-math">2 − 1 = 1</span> kalır. Pivotun 2 katını çıkarmalısın.'},
        {text: 'R<sub>3</sub> → R<sub>3</sub> − 2R<sub>1</sub>', value: -2, correct: true, feedback: 'Pivot 1, altındaki 2: <span class="st-math">2 − 2·1 = 0</span>. Satırın geri kalanı da aynı işlemden geçer.'},
        {text: 'R<sub>3</sub> → R<sub>3</sub> + 2R<sub>1</sub>', value: 2, tag: 'factor-sign', feedback: 'Eklersen <span class="st-math">2 + 2 = 4</span> olur. Sıfır için çıkarmalısın.'},
      ],
      check: {expr: '-W[2, 0]/W[0, 0]'},
      claims: [{expr: 'W.row(2) - 2*W.row(0)', equals: [[0, 0, 0, 0]]}],
      reveal: {type: 'sequence', beats: [
        {type: 'rowOp', mat: 'W', source: 0, target: 2, factor: -2},
        {type: 'paced', endMarks: false, frames: [
          {work: [{html: 'R<sub>3</sub> tamamen sıfır oldu: <span class="st-math">0 = 0</span>', kind: 'sum'}]},
        ]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'rank A = eşelon formdaki pivot sayısı',
      body: 'Eşelon formda pivotlar sağa kayar, sıfır satırlar altta. Sıfır olmayan her satırın bir pivotu var: pivot sayısı rank A.',
      scene: {items: ['W'], mode: 'aug'},
      state: {W: [[1, 3, 2, 0], [0, 0, 1, 0], [0, 0, 0, 0]]},
      claims: [{expr: 'rank(W[:, :3])', equals: 2}],
      beat: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['W', 0, 0, 'is-pivot'], ['W', 1, 2, 'is-pivot']], work: [{html: '2 pivot (R<sub>3</sub> sıfır satır)', kind: 'a'}]},
        {work: [{html: 'rank A = 2', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Hangi değişken serbest?',
      body: 'Sütunlar sırayla x, y, z. Pivotu olmayan sütunun değişkeni serbesttir.',
      scene: {items: ['W'], mode: 'aug'},
      state: {W: [[1, 3, 2, 0], [0, 0, 1, 0], [0, 0, 0, 0]]},
      options: [
        {text: 'z', tag: 'last-variable-free', feedback: 'Serbest değişken hep sonuncu değildir. z\'nin sütununda R<sub>2</sub>\'nin pivotu var.'},
        {text: 'y', correct: true, feedback: 'x ve z sütunlarında pivot var; y\'ninkinde yok.'},
        {text: 'Hiçbiri', value: '0', tag: 'zero-row-ignored', feedback: 'R<sub>3</sub> tamamen sıfır. Üç bilinmeyene iki pivot düşüyor, biri serbest kalır.'},
      ],
      check: {expr: 'y'},
      claims: [{expr: 'W[:, :3].rref()[1][1]', equals: 2}],
      reveal: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['W', 0, 0, 'is-pivot']]},
        {marks: [['W', 1, 2, 'is-pivot']]},
        {marks: [['W', '*', 1, 'is-col']], work: [{text: 'pivotsuz sütun:', label: true}, {text: 'y', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Serbest değişken sayısı = n − rank A',
      body: 'Her pivotsuz sütun bir serbest değişken, yani bir parametre verir. Pivot sayısı rank A olduğundan, serbestler kalan sütunlardır.',
      scene: {items: ['W'], mode: 'aug'},
      state: {W: [[1, 3, 2, 0], [0, 0, 1, 0], [0, 0, 0, 0]]},
      marks: [['W', 0, 0, 'is-pivot'], ['W', 1, 2, 'is-pivot'], ['W', '*', 1, 'is-col']],
      claims: [{expr: '3 - rank(W[:, :3])', equals: 1}],
      beat: {type: 'paced', endMarks: false, frames: [
        {work: [{html: 'n = 3 sütun, rank A = 2'}]},
        {work: [{html: 'serbest = n − rank A = 3 − 2 = 1', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Serbest değişken t olsun, aşağıdan yukarı çöz',
      body: 'Parametreye t denir; k gibi başka bir harf de olur. Son pivot satırından başla, bir üst satıra çık.',
      scene: {items: ['W'], mode: 'aug'},
      state: {W: [[1, 3, 2, 0], [0, 0, 1, 0], [0, 0, 0, 0]]},
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['W', '*', 1, 'is-col']], work: [{html: 'y = t', kind: 'b'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['W', 1, '*', 'is-row']], work: [{html: 'R<sub>2</sub>: z = 0', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['W', 0, '*', 'is-row']], work: [{html: 'R<sub>1</sub>: x + 3t + 2·0 = 0', kind: 'a'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Çözüm kümesi hangisi? <span class="st-math">(t ∈ ℝ)</span>',
      scene: {items: ['W'], mode: 'aug'},
      state: {W: [[1, 3, 2, 0], [0, 0, 1, 0], [0, 0, 0, 0]]},
      options: [
        {text: '(3t, t, 0)', value: [[3], [1], [0]], tag: 'sign-slip', feedback: '3t karşı tarafa geçince işaret değişir: <span class="st-math">x = −3t</span>.'},
        {text: '(−3t, t, t)', value: [[-3], [1], [1]], tag: 'pivot-variable-made-free', feedback: 'z serbest değil: R<sub>2</sub> açıkça <span class="st-math">z = 0</span> diyor.'},
        {text: '(−3t, t, 0)', value: [[-3], [1], [0]], correct: true, feedback: 'Karşıya geçen 3t eksi olur; z ise pivot satırından 0 gelir.'},
      ],
      check: {expr: 'W[:, :3].nullspace()[0]'},
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['W', 0, '*', 'is-row']], work: [{html: 'x + 3t + 2·0 = 0', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'x = −3t'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'X = (−3t, t, 0), t ∈ ℝ', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'Sıfır satır yok. Kaç serbest değişken var?',
      body: 'AX = 0; bilinmeyenler x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>, x<sub>4</sub>.',
      scene: {items: ['F'], mode: 'solo'},
      options: [
        {text: '0', tag: 'free-equals-zero-rows', feedback: 'Serbest değişkeni sıfır satır değil, pivotsuz sütun belirler.'},
        {text: '1', tag: 'only-last-free', feedback: 'Yalnız x<sub>4</sub> değil; x<sub>2</sub>\'nin sütununda da pivot yok.'},
        {text: '2', correct: true, feedback: 'Dört bilinmeyene iki pivot düşüyor; ikisi serbest kalır.'},
      ],
      check: {expr: '4 - rank(F)'},
      reveal: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['F', 0, 0, 'is-pivot'], ['F', 1, 2, 'is-pivot']]},
        {marks: [['F', '*', 1, 'is-col'], ['F', '*', 3, 'is-col']]},
        {work: [{html: 'x<sub>2</sub>, x<sub>4</sub> serbest:', label: true}, {text: '4 − 2 = 2', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Aynı sistemin çözüm kümesi? <span class="st-math">(s, t ∈ ℝ)</span>',
      body: 'Her serbest değişkene ayrı parametre ver: x<sub>2</sub> = s, x<sub>4</sub> = t.',
      scene: {items: ['F'], mode: 'solo'},
      options: [
        {text: '(2s − t, s, −3t, t)', value: [[2, -1], [1, 0], [0, -3], [0, 1]], tag: 'sign-slip', feedback: 'R<sub>1</sub>: <span class="st-math">x<sub>1</sub> + 2s − t = 0</span>. Terimler karşıya geçince işaret değişir: <span class="st-math">x<sub>1</sub> = −2s + t</span>.'},
        {text: '(−2s + t, s, −3t, t)', value: [[-2, 1], [1, 0], [0, -3], [0, 1]], correct: true, feedback: 'Önce x<sub>3</sub> = −3t, sonra x<sub>1</sub> bulunur. İki parametre, iki serbest değişken.'},
        {text: '(−2s + t, s, 3t, t)', value: [[-2, 1], [1, 0], [0, 3], [0, 1]], tag: 'sign-slip-second-row', feedback: 'R<sub>2</sub>: <span class="st-math">x<sub>3</sub> + 3t = 0</span>, yani <span class="st-math">x<sub>3</sub> = −3t</span>.'},
        {text: '(−2s, s, 0, 0)', value: [[-2, 0], [1, 0], [0, 0], [0, 0]], tag: 'one-parameter-only', feedback: 'x<sub>4</sub> de serbest. Onu 0 yaparsan ikinci parametreyi kaybedersin.'},
      ],
      check: {expr: 'Matrix.hstack(*F.nullspace())'},
      claims: [{expr: 'F*Matrix([-2, 1, 0, 0])', equals: [[0], [0]]}, {expr: 'F*Matrix([1, 0, -3, 1])', equals: [[0], [0]]}],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['F', 1, '*', 'is-row']], work: [{html: 'R<sub>2</sub>: x<sub>3</sub> = −3t', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['F', 0, '*', 'is-row']], work: [{html: 'R<sub>1</sub>: x<sub>1</sub> = −2s + t', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'X = (−2s + t, s, −3t, t)', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Aşikar olmayan çözüm ⇔ rank A < n',
      body: 'n bilinmeyen sayısı. rank A = n: yalnız aşikar çözüm; rank A < n: sonsuz çözüm. Kare A\'da bu, det A = 0 demek.',
      scene: {items: ['rule'], mode: 'solo'},
      beat: {type: 'paced', endMarks: false, frames: [
        {label: ['rule', '<span class="st-hl-result">rank A = n → yalnız aşikar</span><br>rank A < n → sonsuz çözüm']},
        {label: ['rule', 'rank A = n → yalnız aşikar<br><span class="st-hl-result">rank A < n → sonsuz çözüm</span>']},
        {work: [{html: 'kare A: rank A < n ⇔ det A = 0', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Bilinmeyen denklemden fazlaysa sonsuz çözüm',
      body: 'm denklem, n bilinmeyen olsun. Pivot sayısı en fazla m olur. m < n ise serbest değişken kesin kalır.',
      scene: {items: ['wide'], mode: 'solo'},
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'her satırda en çok 1 pivot'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'rank A ≤ m < n'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'rank A < n: serbest değişken var', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'En az kaç serbest değişken var?',
      scene: {items: ['m35'], mode: 'solo'},
      answer: 2,
      check: {expr: '5 - 3'},
      feedbackRight: 'rank A en fazla 3 olabilir; 5 bilinmeyenden en az ikisi serbest kalır.',
      feedbackWrong: 'rank A en fazla denklem sayısı, 3. En az <span class="st-math">5 − 3 = 2</span> serbest değişken.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'rank A ≤ 3 (3 denklem)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'serbest = 5 − rank A ≥ 5 − 3 = 2', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k için aşikar olmayan çözüm var?',
      scene: {items: ['K'], mode: 'aug'},
      options: [
        {text: 'k ≠ 2, 5', value: 'Complement(Reals, FiniteSet(2, 5))', tag: 'condition-inverted', feedback: 'Ters çevirdin. det A ≠ 0 iken yalnız aşikar çözüm var; aşikar olmayan çözüm det A = 0\'da.'},
        {text: 'k = 2 ya da 5', value: ['2', '5'], correct: true, feedback: 'Aşikar olmayan çözüm için det A = 0 olmalı; iki kök de geçerli.'},
        {text: 'k = −2 ya da −5', value: ['-2', '-5'], tag: 'roots-sign-flipped', feedback: '<span class="st-math">k − 2 = 0</span> ise <span class="st-math">k = 2</span>. Köklerin işaretini çevirdin.'},
      ],
      check: {expr: 'solve(det(K[:, :3]), k)'},
      claims: [{expr: 'det(K[:, :3])', equals: 'k**2 - 7*k + 10'}, {expr: 'factor(det(K[:, :3]))', equals: '(k - 2)*(k - 5)'}],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['K', 0, '*', 'is-row']], work: [{html: 'det A, 1. satırdan açılım:', label: true}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '1(k² − 4) − 2(2k − 4) + 3(2 − k)', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= k² − 7k + 10'}]}]},
        {type: 'derive', lines: [{eq: ['k² − 7k + 10 = 0', '(k − 2)(k − 5) = 0', 'k = 2 ya da 5']}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: '<span class="st-math">k = 2</span> iken çözüm kümesi? <span class="st-math">(t ∈ ℝ)</span>',
      scene: {items: ['K'], mode: 'aug'},
      state: {K: [[1, 2, 3, 0], [2, 2, 4, 0], [1, 1, 2, 0]]},
      marks: [['K', 1, 1, 'is-target'], ['K', 2, 2, 'is-target']],
      options: [
        {text: '(−3t, −t, t)', value: [[-3], [-1], [1]], tag: 'backsub-skipped', feedback: 'x\'i bulurken y terimini atladın. <span class="st-math">x = −2y − 3z</span>, y = −t koyunca x = −t.'},
        {text: '(−t, −t, t)', value: [[-1], [-1], [1]], correct: true, feedback: 'İki satır orantılı, iki denklem kalır; z serbest.'},
        {text: '(−7t, 2t, t)', value: [[-7], [2], [1]], tag: 'other-root', feedback: 'Bu <span class="st-math">k = 5</span>\'in çözüm kümesi. Soru <span class="st-math">k = 2</span>\'yi soruyor.'},
      ],
      check: {expr: 'K.subs(k, 2)[:, :3].nullspace()[0]'},
      claims: [
        {expr: 'K.subs(k, 2).row(1) - 2*K.row(2).subs(k, 2)', equals: [[0, 0, 0, 0]]},
        {expr: 'K.subs(k, 2).row(0) - K.subs(k, 2).row(2)', equals: [[0, 1, 1, 0]]},
        {expr: 'K.subs(k, 5)[:, :3].nullspace()[0]', equals: [[-7], [2], [1]]},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['K', 1, '*', 'is-row'], ['K', 2, '*', 'is-row']], work: [{html: 'R<sub>2</sub> = 2R<sub>3</sub>: bir denklem fazla', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['K', 0, '*', 'is-row'], ['K', 2, '*', 'is-row']], work: [{html: 'R<sub>1</sub> − R<sub>3</sub>: y + z = 0', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'z = t → y = −t'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['K', 2, '*', 'is-row']], work: [{html: 'R<sub>3</sub>: x − t + 2t = 0 → x = −t', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'X = (−t, −t, t), t ∈ ℝ', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Bu sistemin çözüm kümesi? <span class="st-math">(t ∈ ℝ)</span>',
      scene: {items: ['E'], mode: 'aug'},
      options: [
        {text: 'Yalnız (0, 0, 0)', value: [[0], [0], [0]], tag: 'trivial-only', feedback: 'Bilinmeyen sayısı denklemden fazla. Serbest değişken kesin var.'},
        {text: '(7t, −3t, t)', value: [[7], [-3], [1]], correct: true, feedback: 'Önce y\'yi z cinsinden bul, sonra ilk denklemde yerine koy.'},
        {text: '(−5t, 3t, t)', value: [[-5], [3], [1]], tag: 'sign-slip', feedback: '<span class="st-math">y + 3z = 0</span> ise <span class="st-math">y = −3z</span>. 3z karşıya geçerken işaret değişir.'},
      ],
      check: {expr: 'E[:, :3].nullspace()[0]'},
      claims: [{expr: 'E.row(1) - 2*E.row(0)', equals: [[0, 1, 3, 0]]}],
      reveal: {type: 'sequence', beats: [
        {type: 'rowOp', mat: 'E', source: 0, target: 1, factor: -2},
        {type: 'paced', endMarks: false, frames: [{marks: [['E', 1, '*', 'is-row']], work: [{html: 'z = t, R<sub>2</sub>: y + 3t = 0', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'y = −3t'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['E', 0, '*', 'is-row']], work: [{html: 'R<sub>1</sub>: x + 2(−3t) − t = 0 → x = 7t', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'X = (7t, −3t, t), t ∈ ℝ', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Sınav tipi', title: 'rank A kaç?',
      scene: {items: ['sol'], mode: 'solo'},
      answer: 2,
      check: {expr: 'rank(R)', given: {R: [[1, 2, 0], [0, 1, 1], [1, 3, 1]]}},
      claims: [{expr: 'R*Matrix([2, -1, 1])', equals: [[0], [0], [0]]}],
      feedbackRight: 'Bir parametre, bir serbest değişken demek: n − rank A = 1.',
      feedbackWrong: 'Bir parametre, yani bir serbest değişken. <span class="st-math">rank A = 3 − 1 = 2</span>.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: '1 parametre = 1 serbest değişken'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'n − rank A = 1'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'rank A = 3 − 1 = 2', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Homojende aşikar çözüm hep var',
      body: 'Serbest değişkenlere parametre ver, aşağıdan yukarı çöz. t yerine −t yazmak aynı kümeyi verir.',
      scene: {items: ['mascot', 'sum']},
    },
  ],
};

/* A4 Çarpım tuzakları: AB ≠ BA, (A + B)² without 2AB, AB = 0 with A, B ≠ 0, no cancelling, (AB)ᵀ = BᵀAᵀ, matrix equations from the exam. */
/*
 * Builds on the product lesson (row × column, size rule) without re-teaching it; the size rule returns as a one-line recall in the (AB)ᵀ step.
 * Every number that appears in a matrix is computed on the stage: the hook's AB is filled cell by cell (three in an explain step, the fourth
 * as a keypad question), and AB ≠ BA is shown on one entry that both steps derive (4 and 5), not on two full matrices.
 * Z2 is never shown: it is the zero matrix that makes the cancelling counter-example machine-checked (A·0 = AB = 0 but B ≠ 0).
 * Z23 and Z34 are never shown either: they only carry the shapes of the size argument.
 * Commuting is stated with its condition: (A + B)² = A² + 2AB + B² holds exactly when AB = BA.
 */
LESSONS.A4 = {
  id: 'A4',
  title: 'Çarpım tuzakları',
  matrices: {
    // Hook: two non-zero matrices whose product is the zero matrix.
    HA: {name: 'A', values: [[1, 2], [2, 4]]},
    HB: {name: 'B', values: [[2, -4], [-1, 2]]},
    HP: {name: 'AB', values: [[null, null], [null, null]]},
    // Order matters: one entry of AB, then of BA.
    M: {name: 'A', values: [[1, 2], [3, 0]]},
    N: {name: 'B', values: [[2, 1], [1, 1]]},
    P: {name: 'AB', values: [[null, null], [null, null]]},
    Q: {name: 'BA', values: [[null, null], [null, null]]},
    // AB = 0 with an unknown entry.
    K: {name: 'A', values: [[2, 1], [6, 3]]},
    L: {name: 'B', values: [[1, 'x'], [-2, 6]]},
    KL: {name: 'AB', values: [[0, 0], [0, 0]]},
    // Transpose.
    TA: {name: 'A', values: [[1, 4, 0], [2, -1, 3]]},
    TT: {name: 'Aᵀ', values: [[null, null], [null, null], [null, null]]},
    // Never shown: the zero matrix and the shapes of A 2×3, B 3×4.
    Z2: {name: '', values: [[0, 0], [0, 0]]},
    Z23: {name: '', values: [[0, 0, 0], [0, 0, 0]]},
    Z34: {name: '', values: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]},
    // 3A − 2B = 2C.
    SA: {name: '', values: [['a', 2], [2, 4]]},
    SB: {name: '', values: [[1, 'b'], [1, 0]]},
    SC: {name: '', values: [[5, 7], ['c', 6]]},
    // AB given, find an entry of B.
    RA: {name: 'A', values: [[1, 2], [0, 3]]},
    RB: {name: 'B', values: [[null, null, null], [null, null, null]]},
    RP: {name: 'AB', values: [[6, 5, 8], [3, 6, 9]]},
    // AB given, find y and z.
    VA: {name: 'A', values: [[2, 'y', -1], ['z', 3, 1]]},
    VB: {name: 'B', values: [[1], [2], [4]]},
    VP: {name: 'AB', values: [[6], [7]]},
  },
  labels: {
    cmp: 'AB ile BA',
    sq: '(A + B)²',
    sq2: '(A − B)² = ?',
    k2: '2',
    k3: '3',
    dims: 'A: 2×3, B: 3×4',
    tq: '(ABC)ᵀ = ?',
    sum: 'AB ≠ BA, (A + B)²\'de 2AB yok<br>AB = 0 iken A, B ≠ 0 olabilir<br>(AB)ᵀ = BᵀAᵀ',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'Sıfır olmayan iki matrisin çarpımı sıfır olabilir mi?',
      body: 'Sayılarda ab = 0 ise a ya da b sıfırdır. Matrislerde de öyle mi? Dört kutuyu ders içinde hesaplayacağız.',
      scene: {items: ['HA', 'op:dot', 'HB', 'op:eq', 'HP']},
      marks: [['HP', '*', '*', 'is-target']],
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'AB\'nin (1,1) elemanı',
      body: 'Eleman, A\'nın <span class="st-hl-row">satırı</span> ile B\'nin <span class="st-hl-col">sütununun</span> çarpımıdır. Şimdi sıranın etkisine bakacağız.',
      scene: {items: ['M', 'op:dot', 'N', 'op:eq', 'P']},
      claims: [{expr: '(M*N)[0, 0]', equals: 4}],
      beat: {type: 'derive', lines: [
        {into: ['P', 0, 0], expr: ['+',
          ['·', {role: 'row', expr: ['M', 0, 0]}, {role: 'col', expr: ['N', 0, 0]}],
          ['·', {role: 'row', expr: ['M', 0, 1]}, {role: 'col', expr: ['N', 1, 0]}]]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'Sırayı çevir: BA\'nın (1,1) elemanı kaç?',
      scene: {items: ['N', 'op:dot', 'M', 'op:eq', 'Q']},
      marks: [['Q', 0, 0, 'is-target']],
      answer: 5,
      check: {expr: '(N*M)[0, 0]'},
      claims: [{expr: '(N*M)[0, 0]', equals: 5}],
      feedbackRight: 'BA\'da satır B\'den, sütun A\'dan gelir. Aynı iki matris, ters sırada başka sayı verdi.',
      feedbackWrong: 'BA\'da önce B\'nin 1. satırı, sonra A\'nın 1. sütunu alınır. Eş sayıları çarpıp topla.',
      reveal: {type: 'derive', lines: [
        {into: ['Q', 0, 0], expr: ['+',
          ['·', {role: 'row', expr: ['N', 0, 0]}, {role: 'col', expr: ['M', 0, 0]}],
          ['·', {role: 'row', expr: ['N', 0, 1]}, {role: 'col', expr: ['M', 1, 0]}]]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Sıra önemli: genelde AB ≠ BA',
      body: 'Eşit çıkarsa A ile B değişmelidir. Birim matris I, her A ile değişir: AI = IA = A.',
      scene: {items: ['cmp'], mode: 'solo'},
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'AB\'nin (1,1) elemanı: 4'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'BA\'nın (1,1) elemanı: 5'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '4 ≠ 5, yani AB ≠ BA', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Tuzak', title: '(A + B)²\'de 2AB yok: AB + BA var',
      body: '(A + B)(A + B) dört çarpım verir. AB = BA olsaydı AB + BA = 2AB olurdu; genelde olmaz.',
      scene: {items: ['sq'], mode: 'solo'},
      claims: [{expr: '(M + N)**2', equals: 'M**2 + M*N + N*M + N**2'}],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(A + B)(A + B)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= AA + AB + BA + BB'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= A² + AB + BA + B²', kind: 'sum'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '2AB yalnız AB = BA ise'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '(A − B)² neye eşit?',
      scene: {items: ['sq2'], mode: 'solo'},
      check: {expr: '(M - N)**2'},
      options: [
        {text: 'A² − 2AB + B²', value: 'M**2 - 2*M*N + N**2', tag: 'assumed-commute',
          feedback: 'Bu, AB = BA varsayar. Genelde AB ile BA ayrı kalır, 2AB olmaz.'},
        {text: 'A² − AB − BA + B²', value: 'M**2 - M*N - N*M + N**2', correct: true,
          feedback: 'Dağıtınca dört çarpım çıkar. Ortadaki −AB ve −BA, sıra yüzünden birleşmez.'},
        {text: 'A² − B²', value: 'M**2 - N**2', tag: 'confused-with-difference-of-squares',
          feedback: 'A² − B², (A − B)(A + B) ile karışmış; o da yalnız AB = BA iken doğru. Burada dört çarpım var.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(A − B)(A − B)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= AA − AB − BA + BB'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= A² − AB − BA + B²', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Baştaki AB\'nin üç elemanı',
      body: 'Her eleman yine A\'nın satırı ile B\'nin sütunu. Dördüncü elemanı sen hesaplayacaksın.',
      scene: {items: ['HA', 'op:dot', 'HB', 'op:eq', 'HP']},
      claims: [{expr: '(HA*HB)[0, 0]', equals: 0}, {expr: '(HA*HB)[0, 1]', equals: 0}, {expr: '(HA*HB)[1, 0]', equals: 0}],
      beat: {type: 'derive', lines: [
        {into: ['HP', 0, 0], expr: ['+',
          ['·', {role: 'row', expr: ['HA', 0, 0]}, {role: 'col', expr: ['HB', 0, 0]}],
          ['·', {role: 'row', expr: ['HA', 0, 1]}, {role: 'col', expr: ['HB', 1, 0]}]]},
        {into: ['HP', 0, 1], expr: ['+',
          ['·', {role: 'row', expr: ['HA', 0, 0]}, {role: 'col', expr: ['HB', 0, 1]}],
          ['·', {role: 'row', expr: ['HA', 0, 1]}, {role: 'col', expr: ['HB', 1, 1]}]]},
        {into: ['HP', 1, 0], expr: ['+',
          ['·', {role: 'row', expr: ['HA', 1, 0]}, {role: 'col', expr: ['HB', 0, 0]}],
          ['·', {role: 'row', expr: ['HA', 1, 1]}, {role: 'col', expr: ['HB', 1, 0]}]]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'AB\'nin sağ alt elemanı kaç?',
      scene: {items: ['HA', 'op:dot', 'HB', 'op:eq', 'HP']},
      state: {HP: [[0, 0], [0, null]]},
      marks: [['HP', 1, 1, 'is-target']],
      answer: 0,
      check: {expr: '(HA*HB)[1, 1]'},
      claims: [{expr: 'HA*HB', equals: [[0, 0], [0, 0]]}],
      feedbackRight: 'Sıfır çıktı: dört eleman da 0, yani AB sıfır matris. Baştaki sorunun cevabı: evet olabilir.',
      feedbackWrong: 'A\'nın 2. satırını B\'nin 2. sütunuyla eşle: 2·(−4) ve 4·2. Eksi işaretini kaybetme.',
      reveal: {type: 'sequence', beats: [
        {type: 'derive', lines: [
          {into: ['HP', 1, 1], expr: ['+',
            ['·', {role: 'row', expr: ['HA', 1, 0]}, {role: 'col', expr: ['HB', 0, 1]}],
            ['·', {role: 'row', expr: ['HA', 1, 1]}, {role: 'col', expr: ['HB', 1, 1]}]]},
        ]},
        {type: 'paced', endMarks: false, frames: [
          {work: [{html: 'AB = 0, ama A ≠ 0 ve B ≠ 0', kind: 'sum'}]},
        ]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Tuzak', title: 'AB = AC iken B = C olmayabilir',
      body: 'Sayılarda ab = ac ise b = c olur. Matrislerde A\'yı sadeleştiremezsin: sıfır olmayan A, B\'yi sıfıra çevirebilir.',
      scene: {items: ['HA', 'op:dot', 'HB', 'op:eq', 'HP']},
      state: {HP: [[0, 0], [0, 0]]},
      claims: [{expr: 'HA*HB', equals: [[0, 0], [0, 0]]}, {expr: 'HA*Z2', equals: [[0, 0], [0, 0]]}],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['HP', '*', '*', 'is-result']], work: [{html: 'AB = 0'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'A·0 = 0 (0: sıfır matris)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'AB = A·0, ama B ≠ 0', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'AB = AC ve A ≠ 0 ise B = C mi?',
      scene: {items: ['HA', 'op:dot', 'HB', 'op:eq', 'HP']},
      state: {HP: [[0, 0], [0, 0]]},
      // The implication "AB = AC and A ≠ 0 ⇒ B = C", evaluated at A = HA, B = HB, C = 0: false.
      check: {expr: '(HA*HB != HA*Z2) | (HB == Z2)'},
      options: [
        {text: 'Evet, hep', value: true, tag: 'cancel-like-numbers',
          feedback: 'Sayılar gibi sadeleştirdin. C = 0 alırsan AB = AC = 0 olur, ama B sıfır değil.'},
        {text: 'Hayır, olmayabilir', value: false, correct: true,
          feedback: 'C = 0 al: AC = 0 = AB, ama B ≠ C. A\'nın tersi varsa sadeleşir.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['HP', '*', '*', 'is-result']], work: [{html: 'C = 0 al: AC = 0'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'AB = 0 = AC'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'B ≠ 0 = C: sadeleşmedi', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'AB = 0 olsun. x kaç?',
      body: 'x, AB\'nin sağ sütunundaki iki elemana girer. Üstteki elemanı 0\'a eşitle.',
      scene: {items: ['K', 'op:dot', 'L', 'op:eq', 'KL']},
      marks: [['L', 0, 1, 'is-target']],
      answer: -3,
      check: {expr: 'solve((K*L)[0, 1], x)[0]'},
      claims: [{expr: '(K*L).subs(x, -3)', equals: [[0, 0], [0, 0]]}],
      feedbackRight: 'Üst eleman 2x + 6, alt eleman 6x + 18. İkisi de x = −3 ister, o yüzden AB sıfır matris olabildi.',
      feedbackWrong: 'A\'nın 1. satırını B\'nin 2. sütunuyla çarp: 2·x + 1·6. Sonra 0\'a eşitle ve x\'i yalnız bırak.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['K', 0, '*', 'is-row'], ['L', '*', 1, 'is-col'], ['KL', 0, 1, 'is-target']],
            work: [{html: '2·x + 1·6 = 0', kind: 'a'}]},
        ]},
        {type: 'derive', lines: [{eq: ['2x + 6 = 0', '2x = −6', 'x = −3']}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Transpoz: satırlar sütun olur',
      body: 'Aᵀ\'nin 1. sütunu, A\'nın 1. satırıdır. 2×3 bir matrisin transpozu 3×2 olur.',
      scene: {items: ['TA', 'op:arrow', 'TT']},
      claims: [{expr: 'T(TA)', equals: [[1, 2], [4, -1], [0, 3]]}],
      beat: {type: 'transpose', mat: 'TA', into: 'TT'},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: '(AB)ᵀ = BᵀAᵀ: sıra döner',
      body: 'Boyut kuralı: (m×n)·(n×p) = m×p. Kare matrislerde iki sıra da tanımlıdır, ama eşit olan yine BᵀAᵀ.',
      scene: {items: ['dims'], mode: 'solo'},
      claims: [
        {expr: 'Matrix([[(Z23*Z34).rows, (Z23*Z34).cols]])', equals: [[2, 4]]},
        {expr: 'Matrix([[T(Z23*Z34).rows, T(Z23*Z34).cols]])', equals: [[4, 2]]},
        {expr: 'Matrix([[(T(Z34)*T(Z23)).rows, (T(Z34)*T(Z23)).cols]])', equals: [[4, 2]]},
        {expr: 'Matrix([[T(Z23).cols, T(Z34).rows]])', equals: [[2, 4]]},
      ],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'AB: (2×3)·(3×4) = 2×4'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(AB)ᵀ: 4×2'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'BᵀAᵀ: (4×3)·(3×2) = 4×2', kind: 'sum'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'AᵀBᵀ: (3×2)·(4×3) tanımsız'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '(ABC)ᵀ neye eşit?',
      scene: {items: ['tq'], mode: 'solo'},
      check: {
        expr: 'T(P*Q*R)',
        given: {P: [[1, 2], [0, 1]], Q: [[0, 1], [1, 1]], R: [[2, 0], [1, 3]]},
      },
      options: [
        {text: 'AᵀBᵀCᵀ', value: 'T(P)*T(Q)*T(R)', tag: 'order-kept',
          feedback: 'Transpozlar doğru, sıra yanlış. Çarpımın transpozunda sıra tersine döner.'},
        {text: 'CᵀBᵀAᵀ', value: 'T(R)*T(Q)*T(P)', correct: true,
          feedback: 'ABC\'yi (AB)·C gibi iki çarpan say: önce Cᵀ gelir, sonra (AB)ᵀ = BᵀAᵀ.'},
        {text: 'CBA', value: 'R*Q*P', tag: 'transpose-dropped',
          feedback: 'Sıra doğru döndü ama transpozlar düştü. Her çarpan ayrıca transpoz alır.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(ABC)ᵀ = (AB·C)ᵀ = Cᵀ(AB)ᵀ'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= Cᵀ·BᵀAᵀ = CᵀBᵀAᵀ', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: '3A − 2B = 2C ise a − b + c kaç?',
      scene: {items: ['k3', 'SA', 'op:minus', 'k2', 'SB', 'op:eq', 'k2', 'SC']},
      check: {expr: '(a - b + c).subs(solve(list(3*SA - 2*SB - 2*SC), [a, b, c]))'},
      claims: [{expr: '(3*SA - 2*SB - 2*SC).subs({a: 4, b: -4, c: 2})', equals: [[0, 0], [0, 0]]}],
      options: [
        {text: '2', expr: '4 + (-4) + 2', tag: 'sign-of-b-ignored',
          feedback: 'b = −4 ama a + b + c hesaplamışsın. İstenen a − b + c: −b, +4 verir.'},
        {text: '10', correct: true,
          feedback: 'Her konum ayrı bir denklem. a, b ve c üç ayrı konumdan tek tek çıkar: 4, −4 ve 2.'},
        {text: '18', expr: '12 + 4 + 2', tag: 'factor-dropped',
          feedback: '(1,1) konumunda 3 çarpanını unuttun: a − 2 = 10 dedin, a = 12 çıktı. Doğrusu 3a − 2 = 10.'},
        {text: '12', expr: '4 + 4 + 4', tag: 'moved-term-sign',
          feedback: '(2,1) konumunda −2·1 eksi kalır: 6 − 2 = 4 = 2c, yani c = 2. Sen artı almışsın, c = 4 çıkmış.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['SA', 0, 0, 'is-target'], ['SB', 0, 0, 'is-target'], ['SC', 0, 0, 'is-target']], set: [['SA', 0, 0, 4]],
          work: [{html: '(1,1): 3a − 2·1 = 2·5 → a = 4', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['SA', 0, 1, 'is-target'], ['SB', 0, 1, 'is-target'], ['SC', 0, 1, 'is-target']], set: [['SB', 0, 1, -4]],
          work: [{html: '(1,2): 3·2 − 2b = 2·7 → b = −4', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['SA', 1, 0, 'is-target'], ['SB', 1, 0, 'is-target'], ['SC', 1, 0, 'is-target']], set: [['SC', 1, 0, 2]],
          work: [{html: '(2,1): 3·2 − 2·1 = 2c → c = 2', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['SA', 0, 0, 'is-result'], ['SB', 0, 1, 'is-result'], ['SC', 1, 0, 'is-result']],
          work: [{html: 'a − b + c = 4 − (−4) + 2 = 10', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'AB verildi. b<sub>12</sub> kaç?',
      body: 'AB\'nin 2. sütunu, A ile B\'nin 2. sütunundan gelir.',
      scene: {items: ['RA', 'op:dot', 'RB', 'op:eq', 'RP']},
      marks: [['RB', 0, 1, 'is-target']],
      check: {expr: '(inv(RA)*RP)[0, 1]'},
      claims: [{expr: 'RA*Matrix([[4, 1, 2], [1, 2, 3]])', equals: [[6, 5, 8], [3, 6, 9]]}],
      options: [
        {text: '5', tag: 'read-product-entry',
          feedback: 'Bu AB\'nin (1,2) elemanı. B\'ninkini bulmak için A\'nın satırlarıyla geri çözmen gerekir.'},
        {text: '1', correct: true,
          feedback: 'Önce alt satır b<sub>22</sub>\'yi tek başına verir, sonra üst satırda yerine konur.'},
        {text: '9', tag: 'sign-slip',
          feedback: 'İşaret kayması: 2·b<sub>22</sub> = 4\'ü 5\'ten çıkarman gerekirdi, eklemişsin.'},
        {text: '3', tag: 'factor-dropped',
          feedback: '5\'ten yalnız b<sub>22</sub> = 2\'yi çıkardın. A\'daki 2 çarpanı unutuldu: 2·2 = 4.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['RA', 1, '*', 'is-row'], ['RB', '*', 1, 'is-col'], ['RP', 1, 1, 'is-target']],
          work: [{html: '0·b<sub>12</sub> + 3·b<sub>22</sub> = 6', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{set: [['RB', 1, 1, 2]], work: [{html: 'b<sub>22</sub> = 2', kind: 'sum'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['RA', 0, '*', 'is-row'], ['RB', '*', 1, 'is-col'], ['RP', 0, 1, 'is-target']],
          work: [{html: '1·b<sub>12</sub> + 2·2 = 5', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{set: [['RB', 0, 1, 1]], marks: [['RB', 0, 1, 'is-result']], work: [{html: 'b<sub>12</sub> = 1', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Sınav tipi', title: 'AB verildi. y + z kaç?',
      scene: {items: ['VA', 'op:dot', 'VB', 'op:eq', 'VP']},
      answer: 1,
      check: {expr: '(y + z).subs(solve(list(VA*VB - VP), [y, z]))'},
      claims: [{expr: 'VA.subs({y: 4, z: -3})*VB', equals: [[6], [7]]}],
      feedbackRight: 'Her satır bir denklem: üst satır y\'yi, alt satır z\'yi tek başına verir. 4 + (−3) = 1.',
      feedbackWrong: 'Önce üst satırdan y, sonra alt satırdan z çıkar. (−1)·4 eksi verir; 3·2 ise artıdır.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['VA', 0, '*', 'is-row'], ['VB', '*', 0, 'is-col'], ['VP', 0, 0, 'is-target']],
          work: [{html: '2·1 + y·2 + (−1)·4 = 6', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{set: [['VA', 0, 1, 4]], work: [{html: '2y − 2 = 6, y = 4', kind: 'sum'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['VA', 1, '*', 'is-row'], ['VB', '*', 0, 'is-col'], ['VP', 1, 0, 'is-target']],
          work: [{html: 'z·1 + 3·2 + 1·4 = 7', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{set: [['VA', 1, 0, -3]], work: [{html: 'z + 10 = 7, z = −3', kind: 'sum'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['VA', 0, 1, 'is-result'], ['VA', 1, 0, 'is-result']],
          work: [{html: 'y + z = 4 + (−3) = 1', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Çarpımda sıra her şeydir',
      body: 'AB = BA ise (A + B)² = A² + 2AB + B². Sadeleştirme yok. Transpozda sıra döner.',
      scene: {items: ['mascot', 'sum']},
    },
  ],
};

/* A5 Transpoz ve iz: transpose rules, tr(A) and its rules, tr(AB) = tr(BA) (and not tr(A)·tr(B)), AB − BA ≠ I, tr(AᵀA) as a sum of squares. */
/*
 * Notation: the stage writes tr(A) (the lecturer's symbol and the exam's); prose says "iz" (tr(A), Türkçesi iz). Scalars are c, because k is the unknown of the exam items.
 * The transpose basics were taught in the product-traps lesson; here "Hatırla" shows only what is new: a<sub>ij</sub> goes to (j, i) and (Aᵀ)ᵀ = A.
 * Every trace that is stated is computed from the diagonal cells on the stage. tr(AB) = tr(BA) is shown twice, on numbers (steps 8-9)
 * and on a generic 2×2 (step 10) where both traces hold the same four products; tr(AB) ≠ tr(A)·tr(B) is a Tuzak step with a reveal that ends on the trap.
 * The hook (AB − BA = I) is answered by taking the trace of both sides, one line at a time.
 * Statement item: each option's value is the sum of 1 (I), 2 (II), 4 (III) over the statements it calls true; the check evaluates the three
 * statements on generic 2×2 matrices G1, G2 (never shown), so only the true set matches.
 * G1, G2 also carry the generic symbols of step 10; G3, H3 are the generic 3×3 of the last item; JB only checks the tr(A + B) rule.
 */
LESSONS.A5 = {
  id: 'A5',
  title: 'Transpoz ve iz',
  matrices: {
    I2: {name: 'I', values: [[1, 0], [0, 1]]},
    // Transpose.
    TA: {name: 'A', values: [[2, 0, 5], [1, 3, -4]]},
    TT: {name: 'Aᵀ', values: [[null, null], [null, null], [null, null]]},
    // Trace.
    IA: {name: 'A', values: [[4, -1, 2], [3, -2, 0], [1, 5, 6]]},
    JB: {name: 'B', values: [[-3, 2, 7], [0, 5, 1], [4, -6, 1]]},
    // tr(AB) = tr(BA), on numbers.
    MA: {name: 'A', values: [[2, 1], [0, 3]]},
    MB: {name: 'B', values: [[1, 4], [2, -1]]},
    MAB: {name: 'AB', values: [[null, null], [null, null]]},
    MBA: {name: 'BA', values: [[null, null], [null, null]]},
    // The trap: tr(AB) ≠ tr(A)·tr(B).
    NA: {name: 'A', values: [[3, -1], [2, 4]]},
    NB: {name: 'B', values: [[1, 2], [5, 0]]},
    NAB: {name: 'AB', values: [[null, null], [null, null]]},
    // tr(AᵀA).
    SA: {name: 'Aᵀ', values: [[1, 3], [-2, 2]]},
    SQ: {name: 'A', values: [[1, -2], [3, 2]]},
    SR: {name: 'AᵀA', values: [[null, null], [null, null]]},
    TQ: {name: 'A', values: [[2, -1, 0], [1, 3, -2]]},
    UA: {name: 'A', values: [['k', 2, 1], [0, 3, -1], [4, 5, 'k']]},
    // Generic matrices for the identities.
    G1: {name: 'A', values: [['a', 'b'], ['c', 'd']]},
    G2: {name: 'B', values: [['e', 'f'], ['g', 'h']]},
    G3: {name: '', values: [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'm']]},
    H3: {name: '', values: [['p', 'q', 'r'], ['s', 't', 'u'], ['v', 'w', 'x']]},
  },
  labels: {
    hL: 'AB − BA',
    rules: 'Transpoz kuralları',
    tq: '(2AᵀB)ᵀ = ?',
    trL: 'tr(A) = ?',
    lin: 'İz kuralları',
    gv: 'tr(A) = 3<br>tr(B) = −2',
    sqL: 'tr(AᵀA) = ?',
    uL: 'tr(A + Aᵀ) = 18',
    hq: 'A, B aynı boyutta kare<br>I. tr(AB) = tr(BA)<br>II. tr(AᵀA) ≥ 0<br>III. tr(AB) = tr(A)·tr(B)',
    kq: 'A, B: 3×3<br>AB − BA = k·I',
    sum: '(AB)ᵀ = BᵀAᵀ, (Aᵀ)ᵀ = A<br>tr(A + B), tr(cA), tr(Aᵀ) = tr(A)<br>tr(AB) = tr(BA), tr(A)·tr(B) değil<br>AB − BA = I olamaz, tr(AᵀA) ≥ 0',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'AB − BA = I olabilir mi?',
      body: 'A ve B aynı boyutta kare matrisler. Tek tek denemek bitmez; cevabı köşegendeki sayıların toplamı verecek.',
      scene: {items: ['hL', 'op:eq', 'I2'], mode: 'solo'},
    },
    {
      kind: 'explain', eyebrow: 'Hatırla', title: 'Transpoz: a<sub>ij</sub> → (j, i)',
      body: 'Transpoz, bir elemanın satır ve sütun numarasını değiştirir: a<sub>13</sub> = 5, Aᵀ\'de (3, 1) konumuna gider. İki kez alırsan A\'ya dönersin.',
      scene: {items: ['TA', 'op:arrow', 'TT']},
      claims: [{expr: 'T(TA)', equals: [[2, 1], [0, 3], [5, -4]]}, {expr: 'T(T(TA))', equals: 'TA'}],
      beat: {type: 'transpose', mat: 'TA', into: 'TT'},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Transpozun dört kuralı',
      body: 'Transpoz toplamaya ve skalere dağılır; çarpımda ise sıra döner.',
      scene: {items: ['rules'], mode: 'solo'},
      claims: [
        {expr: 'T(MA + MB)', equals: 'T(MA) + T(MB)'}, {expr: 'T(3*MA)', equals: '3*T(MA)'},
        {expr: 'T(MA*MB)', equals: 'T(MB)*T(MA)'},
      ],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(A + B)ᵀ = Aᵀ + Bᵀ'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(cA)ᵀ = c·Aᵀ'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(Aᵀ)ᵀ = A'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(AB)ᵀ = BᵀAᵀ', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Bu transpoz neye eşit?',
      scene: {items: ['tq'], mode: 'solo'},
      check: {expr: 'T(2*T(P)*Q)', given: {P: [[1, 2], [0, 1]], Q: [[0, 1], [1, 1]]}},
      options: [
        {text: '2ABᵀ', value: '2*P*T(Q)', tag: 'order-kept',
          feedback: 'Çarpımın transpozunda sıra döner: B sona değil, başa gelir. Burada (AᵀB)ᵀ = Bᵀ(Aᵀ)ᵀ.'},
        {text: '2BᵀA', value: '2*T(Q)*P', correct: true,
          feedback: 'Sıra döner ve iki transpoz birbirini götürür: (Aᵀ)ᵀ = A. 2 skaler olduğu için yerinde kalır.'},
        {text: '2BᵀAᵀ', value: '2*T(Q)*T(P)', tag: 'double-transpose-missed',
          feedback: 'Aᵀ\'nin transpozu A\'dır; iki transpoz birbirini götürür. Sonuçta Aᵀ değil A kalır.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: '(2AᵀB)ᵀ = 2·Bᵀ(Aᵀ)ᵀ'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= 2BᵀA', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'tr(A): ana köşegenin toplamı',
      body: 'Sol üstten sağ alta inen ana köşegenin toplamına iz denir, tr(A) yazılır. Yalnız kare matriste tanımlıdır.',
      scene: {items: ['IA', 'trL'], mode: 'solo'},
      claims: [{expr: 'tr(IA)', equals: 8}],
      beat: {type: 'sequence', beats: [
        {type: 'derive', lines: [
          {label: 'tr(A) =', expr: ['+', ['IA', 0, 0], ['IA', 1, 1], ['IA', 2, 2]]},
        ]},
        {type: 'paced', endMarks: false, frames: [
          {label: ['trL', 'tr(A) = <span class="st-hl-result">8</span>']},
        ]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'İz toplamaya ve skalere uyar',
      body: 'Köşegenler toplanınca ya da c ile çarpılınca iz de öyle değişir. Transpoz köşegeni yerinde bırakır.',
      scene: {items: ['lin'], mode: 'solo'},
      claims: [
        {expr: 'tr(IA + JB)', equals: 'tr(IA) + tr(JB)'}, {expr: 'tr(3*IA)', equals: '3*tr(IA)'},
        {expr: 'tr(T(IA))', equals: 'tr(IA)'}, {expr: 'tr(IA + T(IA))', equals: '2*tr(IA)'},
      ],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(A + B) = tr(A) + tr(B)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(cA) = c·tr(A)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(Aᵀ) = tr(A)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(A + Aᵀ) = tr(A) + tr(Aᵀ)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= 2·tr(A)', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'tr(2Aᵀ − 3B) kaç?',
      scene: {items: ['gv'], mode: 'solo'},
      answer: 12,
      check: {expr: 'tr(2*T(P) - 3*Q)', given: {P: [[1, 2], [0, 2]], Q: [[-1, 4], [1, -1]]}},
      claims: [{expr: 'tr(P)', equals: 3}, {expr: 'tr(Q)', equals: -2}],
      feedbackRight: 'tr(Aᵀ) = tr(A) = 3 ve katsayılar dışarı çıkar: 2·3 − 3·(−2) = 12. İki eksi artı yapar.',
      feedbackWrong: 'Önce tr(Aᵀ) = tr(A) = 3 yaz, katsayıları dışarı çıkar. −3 ile −2\'nin çarpımı artıdır.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(2Aᵀ − 3B) = 2·tr(Aᵀ) − 3·tr(B)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= 2·3 − 3·(−2)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '= 6 + 6 = 12', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'AB\'nin yalnız köşegeni',
      body: 'İz için bütün AB gerekmez. Köşegen elemanları, A\'nın <span class="st-hl-row">satırı</span> ile B\'nin <span class="st-hl-col">sütununun</span> çarpımıdır.',
      scene: {items: ['MA', 'op:dot', 'MB', 'op:eq', 'MAB']},
      claims: [{expr: 'MA*MB', equals: [[4, 7], [6, -3]]}, {expr: 'tr(MA*MB)', equals: 1}],
      beat: {type: 'sequence', beats: [
        {type: 'derive', lines: [
          {into: ['MAB', 0, 0], expr: ['+',
            ['·', {role: 'row', expr: ['MA', 0, 0]}, {role: 'col', expr: ['MB', 0, 0]}],
            ['·', {role: 'row', expr: ['MA', 0, 1]}, {role: 'col', expr: ['MB', 1, 0]}]]},
          {into: ['MAB', 1, 1], expr: ['+',
            ['·', {role: 'row', expr: ['MA', 1, 0]}, {role: 'col', expr: ['MB', 0, 1]}],
            ['·', {role: 'row', expr: ['MA', 1, 1]}, {role: 'col', expr: ['MB', 1, 1]}]]},
        ]},
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['MAB', 0, 0, 'is-result'], ['MAB', 1, 1, 'is-result']],
            work: [{html: 'tr(AB) = 4 + (−3) = 1', kind: 'sum'}]},
        ]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'Sırayı çevir: tr(BA) kaç?',
      scene: {items: ['MB', 'op:dot', 'MA', 'op:eq', 'MBA']},
      marks: [['MBA', 0, 0, 'is-target'], ['MBA', 1, 1, 'is-target']],
      answer: 1,
      check: {expr: 'tr(MB*MA)'},
      claims: [{expr: 'MB*MA', equals: [[2, 13], [4, -1]]}],
      feedbackRight: 'BA ile AB farklı matrisler, ama köşegen toplamları aynı: ikisi de 1. Nedenini sıradaki adımda göreceksin.',
      feedbackWrong: 'BA\'da B\'nin satırları A\'nın sütunlarıyla eşlenir. Yalnız (1,1) ve (2,2) elemanlarını hesapla, topla.',
      reveal: {type: 'sequence', beats: [
        {type: 'derive', lines: [
          {into: ['MBA', 0, 0], expr: ['+',
            ['·', {role: 'row', expr: ['MB', 0, 0]}, {role: 'col', expr: ['MA', 0, 0]}],
            ['·', {role: 'row', expr: ['MB', 0, 1]}, {role: 'col', expr: ['MA', 1, 0]}]]},
          {into: ['MBA', 1, 1], expr: ['+',
            ['·', {role: 'row', expr: ['MB', 1, 0]}, {role: 'col', expr: ['MA', 0, 1]}],
            ['·', {role: 'row', expr: ['MB', 1, 1]}, {role: 'col', expr: ['MA', 1, 1]}]]},
        ]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(BA) = 2 + (−1) = 1'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(AB) = tr(BA) = 1', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'tr(AB) = tr(BA): aynı dört çarpım',
      body: 'AB ile BA farklı matrisler, ama köşegenlerindeki çarpımlar aynıdır; yalnız sıraları değişir. Bu her kare A, B için doğrudur.',
      scene: {items: ['G1', 'op:dot', 'G2']},
      claims: [{expr: 'tr(G1*G2)', equals: 'tr(G2*G1)'}, {expr: 'tr(G1*G2)', equals: 'a*e + b*g + c*f + d*h'}],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(AB) = (ae + bg) + (cf + dh)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(BA) = (ea + fc) + (gb + hd)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'ae, bg, cf, dh: iki iz de aynı', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'tr(AB) kaç?',
      body: 'Yalnız köşegeni hesapla.',
      scene: {items: ['NA', 'op:dot', 'NB', 'op:eq', 'NAB']},
      marks: [['NAB', 0, 0, 'is-target'], ['NAB', 1, 1, 'is-target']],
      check: {expr: 'tr(NA*NB)'},
      claims: [{expr: 'NA*NB', equals: [[-2, 6], [22, 4]]}, {expr: 'tr(NA)*tr(NB)', equals: 7}],
      options: [
        {text: '7', tag: 'trace-multiplicative', expr: 'tr(NA)*tr(NB)',
          feedback: 'Bu tr(A)·tr(B) = 7·1. İz toplama ve skalere uyar, çarpıma dağılmaz.'},
        {text: '12', tag: 'sign-dropped', expr: '3*1 + 1*5 + 2*2 + 4*0',
          feedback: '(−1)·5 eksi verir; sol üst eleman 3 − 5 = −2 olmalı. Eksiyi kaybedince 12 çıkar.'},
        {text: '2', correct: true,
          feedback: 'İki köşegen elemanı yeter: −2 + 4. tr(A)·tr(B) = 7 ile aynı değil, iz çarpıma dağılmaz.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'derive', lines: [
          {into: ['NAB', 0, 0], expr: ['+',
            ['·', {role: 'row', expr: ['NA', 0, 0]}, {role: 'col', expr: ['NB', 0, 0]}],
            ['·', {role: 'row', expr: ['NA', 0, 1]}, {role: 'col', expr: ['NB', 1, 0]}]]},
          {into: ['NAB', 1, 1], expr: ['+',
            ['·', {role: 'row', expr: ['NA', 1, 0]}, {role: 'col', expr: ['NB', 0, 1]}],
            ['·', {role: 'row', expr: ['NA', 1, 1]}, {role: 'col', expr: ['NB', 1, 1]}]]},
        ]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(AB) = −2 + 4 = 2', kind: 'sum'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['NA', 0, 0, 'is-target'], ['NA', 1, 1, 'is-target'], ['NB', 0, 0, 'is-target'], ['NB', 1, 1, 'is-target']],
            work: [{html: 'tr(A)·tr(B) = (3 + 4)·(1 + 0) = 7'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '2 ≠ 7: iz çarpıma dağılmaz', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Baştaki soru: AB − BA = I olamaz',
      body: 'I, n×n ise tr(I) = n ≥ 1. Soldaki iz 0, sağdaki n: eşitlik sağlanmaz.',
      scene: {items: ['hL', 'op:eq', 'I2'], mode: 'solo'},
      claims: [{expr: 'tr(G1*G2 - G2*G1)', equals: 0}, {expr: 'tr(eye(2))', equals: 2}],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'AB − BA = I'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(AB − BA) = tr(I)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(AB) − tr(BA) = tr(I)'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '0 = tr(I)'}]}]},
        {type: 'derive', lines: [
          {label: 'tr(I) =', expr: ['+', ['I2', 0, 0], ['I2', 1, 1]]},
        ]},
        {type: 'paced', endMarks: false, frames: [
          {work: [{html: '0 ≠ 2: AB − BA = I olamaz', kind: 'sum'}]},
        ]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'tr(AᵀA): elemanların kareleri toplamı',
      body: 'Aᵀ\'nin j. satırı, A\'nın j. sütunuyla aynı sayılardır. Köşegen elemanı, o sütunun kareleri toplamı olur.',
      scene: {items: ['SA', 'op:dot', 'SQ', 'op:eq', 'SR']},
      claims: [{expr: 'tr(T(SQ)*SQ)', equals: 18}, {expr: '(T(SQ)*SQ)[0, 0]', equals: 10}, {expr: '(T(SQ)*SQ)[1, 1]', equals: 8}],
      beat: {type: 'sequence', beats: [
        {type: 'derive', lines: [
          {into: ['SR', 0, 0], expr: ['+',
            ['·', {role: 'row', expr: ['SA', 0, 0]}, {role: 'col', expr: ['SQ', 0, 0]}],
            ['·', {role: 'row', expr: ['SA', 0, 1]}, {role: 'col', expr: ['SQ', 1, 0]}]]},
          {into: ['SR', 1, 1], expr: ['+',
            ['·', {role: 'row', expr: ['SA', 1, 0]}, {role: 'col', expr: ['SQ', 0, 1]}],
            ['·', {role: 'row', expr: ['SA', 1, 1]}, {role: 'col', expr: ['SQ', 1, 1]}]]},
        ]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['SR', 0, 0, 'is-result'], ['SR', 1, 1, 'is-result']],
            work: [{html: 'tr(AᵀA) = 10 + 8 = 18', kind: 'sum'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'kareler toplamı ≥ 0; sıfırsa A = 0'}]}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'Bu A için tr(AᵀA) kaç?',
      scene: {items: ['TQ', 'sqL'], mode: 'solo'},
      answer: 19,
      check: {expr: 'tr(T(TQ)*TQ)'},
      claims: [{expr: 'tr(T(TQ)*TQ)', equals: 19}],
      feedbackRight: 'tr(AᵀA), A\'nın bütün elemanlarının karelerinin toplamı: 5 + 10 + 4 = 19. Negatifin karesi pozitiftir.',
      feedbackWrong: 'Her sütunun karelerini ayrı topla: 2² + 1², (−1)² + 3², 0² + (−2)². Sonra üç sonucu topla.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['TQ', '*', 0, 'is-col']], work: [{html: '2² + 1² = 5', kind: 'b'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['TQ', '*', 1, 'is-col']], work: [{html: '(−1)² + 3² = 10', kind: 'b'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['TQ', '*', 2, 'is-col']], work: [{html: '0² + (−2)² = 4', kind: 'b'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '5 + 10 + 4 = 19', kind: 'sum'}],
          label: ['sqL', 'tr(AᵀA) = <span class="st-hl-result">19</span>']}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Bu A için k kaç?',
      scene: {items: ['UA', 'uL'], mode: 'solo'},
      check: {expr: 'solve(tr(UA + T(UA)) - 18, k)[0]'},
      options: [
        {text: '15/2', tag: 'forgot-double', expr: 'solve(tr(UA) - 18, k)[0]',
          feedback: '<span class="st-math">tr(Aᵀ)</span>\'yi unuttun: <span class="st-math">tr(A + Aᵀ) = 2·tr(A)</span>. Denklem <span class="st-math">2k + 3 = 18</span> değil, <span class="st-math">2(2k + 3) = 18</span>.'},
        {text: '6', tag: 'one-k-counted', expr: 'solve(2*(k + 3) - 18, k)[0]',
          feedback: 'Köşegende iki tane k var: sol üstte ve sağ altta. Toplam k + 3 + k = 2k + 3 olur.'},
        {text: '3', correct: true,
          feedback: '<span class="st-math">tr(A + Aᵀ) = 2·tr(A)</span>, yani <span class="st-math">tr(A) = 9</span>. Köşegen <span class="st-math">2k + 3</span> verir, buradan <span class="st-math">k = 3</span>.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [
          {clear: true, marks: [['UA', 0, 0, 'is-target'], ['UA', 1, 1, 'is-target'], ['UA', 2, 2, 'is-target']],
            work: [{html: 'tr(A + Aᵀ) = 2·tr(A) = 2·(k + 3 + k)'}]},
        ]},
        {type: 'derive', lines: [{eq: ['2(k + 3 + k) = 18', 'k + 3 + k = 9', '2k = 6', 'k = 3']}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangileri her zaman doğrudur?',
      scene: {items: ['hq'], mode: 'solo'},
      // Each option's value adds 1 (I), 2 (II), 4 (III) for the statements it calls true. II holds because
      // tr(AᵀA) expands to a sum of squares; I holds by the identity; III fails on generic matrices.
      check: {expr: '(expand(tr(G1*G2) - tr(G2*G1)) == 0) * 1 + (expand(tr(T(G1)*G1) - (a**2 + b**2 + c**2 + d**2)) == 0) * 2 + (expand(tr(G1*G2) - tr(G1)*tr(G2)) == 0) * 4'},
      options: [
        {text: 'Yalnız I', value: 1, tag: 'sum-of-squares-missed',
          feedback: 'II de doğru: <span class="st-math">tr(AᵀA)</span>, A\'nın elemanlarının karelerinin toplamıdır, yani <span class="st-math">≥ 0</span>.'},
        {text: 'I ve II', value: 3, correct: true,
          feedback: 'I iz kuralı, II kareler toplamı. III yanlış: iz çarpıma dağılmaz, tr(AB) ≠ tr(A)·tr(B).'},
        {text: 'I ve III', value: 5, tag: 'trace-multiplicative',
          feedback: 'III yanlış: <span class="st-math">A = B = I</span> (2×2) için <span class="st-math">tr(AB) = 2</span>, ama <span class="st-math">tr(A)·tr(B) = 4</span>. II ise doğru.'},
        {text: 'I, II ve III', value: 7, tag: 'trace-multiplicative-too',
          feedback: 'III yanlış: <span class="st-math">A = B = I</span> (2×2) için <span class="st-math">tr(AB) = 2</span>, ama <span class="st-math">tr(A)·tr(B) = 4</span>. İz çarpıma dağılmaz.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'I: tr(AB) = tr(BA) doğru'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'II: kareler toplamı ≥ 0 doğru'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'III: A = B = I için 2 ≠ 4, yanlış', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'k kaç olabilir?',
      scene: {items: ['kq'], mode: 'solo'},
      check: {
        expr: 'solve(Eq(tr(G3*H3 - H3*G3), tr(k*eye(3))), k)[0]',
        given: {
          G3: [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'm']],
          H3: [['p', 'q', 'r'], ['s', 't', 'u'], ['v', 'w', 'x']],
        },
      },
      options: [
        {text: '1', tag: 'assumed-possible',
          feedback: 'k = 1 olsa sağın izi 3 olurdu. Soldaki iz ise 0, eşit olamazlar.'},
        {text: '3', tag: 'trace-of-I',
          feedback: '3, I\'nın izi; k değil. Sağın izi 3k, o da soldaki 0\'a eşit olmalı.'},
        {text: '0', correct: true,
          feedback: 'Solun izi 0, sağın izi 3k. Demek ki k = 0, yani AB = BA olmalı.'},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(AB − BA) = tr(AB) − tr(BA) = 0'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tr(k·I) = k + k + k = 3k'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: '0 = 3k, k = 0', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Transpoz ve iz',
      body: 'Transpozda sıra döner. İz köşegenin toplamı ve çarpıma dağılmaz.',
      scene: {items: ['mascot', 'sum']},
    },
  ],
};

/* C2 Çözüm türleri: tek / sonsuz / çözümsüz, r_A ve r_B, tutarlılık testi (r_A = r_B ⇔ çözüm var), serbest değişken sayısı n − r_A. */
/*
 * Builds on C1 (genişletilmiş matris, pivot, eşelon, geriye doğru yerine koyma, the visible 0 = c row) and C4 (rank = pivots of the
 * echelon form, free variables, parameter t) without repeating them; here the outcome is stated as a rank comparison.
 * Notation follows the lecturer's board: r_A = rank of the coefficient part (left of the bar), r_B = rank of the whole [A | b].
 * Always r_A <= r_B <= r_A + 1. The three cases: r_A < r_B yok; r_A = r_B = n tek; r_A = r_B < n sonsuz with n − r_A parameters.
 * Matrix ids end in a digit or are two letters so they never collide with SymPy names (E, I, Q, S, N).
 * Answers of the "kaç çözüm" type are encoded as 0, 1 or oo; rank-pair options as [r_A, r_B]; solution sets as the 3×2 matrix
 * [particular solution | direction of the free variable], checked against the nullspace.
 * One work line per beat so every earlier line stays on the stage. The parameter is t (k and m are the system parameters in the exam steps).
 */
LESSONS.C2 = {
  id: 'C2',
  title: 'Çözüm türleri',
  matrices: {
    T2: {name: '[A | b]', values: [[1, 2, 1, 4], [0, 1, 2, 3], [0, 0, 0, 0]], augmented: true},
    T3: {name: '[A | b]', values: [[1, 2, 1, 4], [0, 1, 2, 3], [0, 0, 0, 5]], augmented: true},
    G1: {name: '[A | b]', values: [[1, 3, 0, 2], [0, 0, 2, 4], [0, 0, 0, 1]], augmented: true},
    H1: {name: '[A | b]', values: [[1, -1, 2, 3], [0, 2, 4, 2], [0, 0, 0, 0]], augmented: true},
    T1: {name: '[A | b]', values: [[2, 1, 0, 5], [0, 3, 1, 5], [0, 0, 2, 4]], augmented: true},
    Z1: {name: '[A | b]', values: [[1, 3, 2, 5], [0, 0, 2, 4]], augmented: true},
    J1: {name: '[A | b]', values: [[3, 1, 0, 2, 6], [0, 2, 1, 1, 4], [0, 0, 1, 3, 2]], augmented: true},
    P1: {name: '[A | b]', values: [[1, 0, 2, 1, 3], [0, 1, -1, 0, 2], [0, 0, 0, 0, 4]], augmented: true},
    KM: {name: '[A | b]', values: [[1, 2, 1, 3], [0, 1, 2, 1], [0, 0, 'k-3', 'm-2']], augmented: true},
    K2: {name: '[A | b]', values: [[1, 1, 1, 2], [2, 2, 'k', 5], [0, 1, 2, 1]], augmented: true},
  },
  labels: {
    q: 'AX = b<br>çözüm sayısı: ?',
    two: 'AX<sub>1</sub> = b, AX<sub>2</sub> = b',
    test: 'r<sub>A</sub> = r<sub>B</sub> → çözüm var<br>r<sub>A</sub> &lt; r<sub>B</sub> → çözüm yok',
    rule3: 'r<sub>A</sub> &lt; r<sub>B</sub> → çözüm yok<br>r<sub>A</sub> = r<sub>B</sub> = n → tek çözüm<br>r<sub>A</sub> = r<sub>B</sub> &lt; n → sonsuz çözüm',
    n5: 'AX = b<br>5 bilinmeyen<br>r<sub>A</sub> = r<sub>B</sub> = 3',
    tf: 'r<sub>A</sub> = r<sub>B</sub><br>⇒ tek çözüm ?',
    sum: 'r<sub>A</sub> &lt; r<sub>B</sub> → yok<br>r<sub>A</sub> = r<sub>B</sub> = n → tek<br>r<sub>A</sub> = r<sub>B</sub> &lt; n → sonsuz<br>parametre sayısı = n − r<sub>A</sub>',
  },
  steps: [
    // Soru
    {
      kind: 'explain', eyebrow: 'Soru', title: 'Bir sistemin kaç çözümü olabilir?',
      body: 'Denklem sayısı ne olursa olsun, çözüm sayısı birkaç değerden biri. Hangileri? Önce bunu bulacağız.',
      scene: {items: ['q'], mode: 'solo'},
    },
    // Sezgi: two solutions force infinitely many
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'İki farklı çözüm varsa sonsuz çözüm var',
      body: 'X<sub>1</sub> ve X<sub>2</sub> çözüm olsun. <span class="st-math">X = X<sub>1</sub> + t(X<sub>2</sub> − X<sub>1</sub>)</span> her t için çözüm çıkar.',
      scene: {items: ['two'], mode: 'solo'},
      beat: {type: 'paced', endMarks: false, frames: [
        {label: ['two', 'AX<sub>1</sub> = b, AX<sub>2</sub> = b']},
        {label: ['two', 'AX<sub>1</sub> = b, AX<sub>2</sub> = b<br>AX = AX<sub>1</sub> + t(AX<sub>2</sub> − AX<sub>1</sub>)']},
        {label: ['two', 'AX<sub>1</sub> = b, AX<sub>2</sub> = b<br>AX = AX<sub>1</sub> + t(AX<sub>2</sub> − AX<sub>1</sub>)<br>= b + t(b − b) = <span class="st-hl-result">b</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Hangisi çözüm sayısı olamaz?',
      scene: {items: ['q'], mode: 'solo'},
      options: [
        {text: '0', value: 0, tag: 'no-solution-impossible', feedback: 'Denklemler birbiriyle çelişirse hiç çözüm kalmaz. Bu olabilen bir durum.'},
        {text: '1', value: 1, tag: 'unique-impossible', feedback: 'Her bilinmeyen tek bir değere bağlanırsa çözüm tek olur. Bu da olabilir.'},
        {text: '2', value: 2, correct: true, feedback: 'İki çözüm varsa aralarındaki her nokta da çözümdür. Yani sayı ya 0, ya 1, ya sonsuz; tam 2 olmaz.'},
        {text: 'sonsuz', value: 'oo', tag: 'infinite-impossible', feedback: 'Serbest bir değişken kalırsa her değeri bir çözüm verir. Bu da olabilen bir durum.'},
      ],
      check: {expr: '2'},
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'X<sub>1</sub> ≠ X<sub>2</sub> iki çözüm'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'X<sub>1</sub> + t(X<sub>2</sub> − X<sub>1</sub>) her t için çözüm'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'olabilir: 0, 1 ya da sonsuz', kind: 'sum'}]}]},
      ]},
    },
    // Kural: r_A and r_B
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Rank\'ı iki kez say: r<sub>A</sub> ve r<sub>B</sub>',
      body: 'Rank, eşelon formdaki pivot sayısıdır. <b>r<sub>A</sub></b> çizginin solundaki pivotlar, <b>r<sub>B</sub></b> bütün [A | b] matrisindeki pivotlar.',
      scene: {items: ['T2'], mode: 'aug'},
      claims: [{expr: 'rank(T2[:, :3])', equals: 2}, {expr: 'rank(T2)', equals: 2}],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['T2', 0, 0, 'is-pivot'], ['T2', 1, 1, 'is-pivot']], work: [{html: 'solda 2 pivot: r<sub>A</sub> = 2', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{marks: [['T2', '*', 3, 'is-col']], work: [{html: 'b sütununda yeni pivot yok: r<sub>B</sub> = 2', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Sıfır satırın sağında sıfır olmayan sayı',
      body: 'Yalnız son b değişti: 0 yerine 5. Son satırı bir denklem olarak oku.',
      scene: {items: ['T3'], mode: 'aug'},
      claims: [{expr: 'rank(T3[:, :3])', equals: 2}, {expr: 'rank(T3)', equals: 3}],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['T3', 2, '*', 'is-row']], work: [{html: '0x + 0y + 0z = 5: çelişki', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['T3', 0, 0, 'is-pivot'], ['T3', 1, 1, 'is-pivot'], ['T3', 2, 3, 'is-pivot']], work: [{html: 'b sütununda yeni pivot: r<sub>B</sub> = 3 > r<sub>A</sub> = 2', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'r<sub>A</sub> ve r<sub>B</sub> kaç?',
      body: 'Pivotlar köşegende olmak zorunda değil.',
      scene: {items: ['G1'], mode: 'aug'},
      options: [
        {text: 'r<sub>A</sub> = 2, r<sub>B</sub> = 2', value: [2, 2], tag: 'b-column-ignored', feedback: 'Son satır <span class="st-math">0 = 1</span> diyor; b sütununda üçüncü bir pivot var. r<sub>B</sub> = 3.'},
        {text: 'r<sub>A</sub> = 2, r<sub>B</sub> = 3', value: [2, 3], correct: true, feedback: 'Solda iki pivot var (1. ve 3. sütun), r<sub>A</sub> = 2. b sütunundaki 1 üçüncü pivottur, r<sub>B</sub> = 3.'},
        {text: 'r<sub>A</sub> = 3, r<sub>B</sub> = 3', value: [3, 3], tag: 'b-pivot-counted-in-rA', feedback: 'r<sub>A</sub> yalnız çizginin solunu sayar. Orada 2 pivot var; üçüncüsü b sütunundadır.'},
      ],
      check: {expr: '[rank(G1[:, :3]), rank(G1)]'},
      reveal: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['G1', 0, 0, 'is-pivot'], ['G1', 1, 2, 'is-pivot']], work: [{html: 'solda 2 pivot: r<sub>A</sub> = 2', kind: 'a'}]},
        {marks: [['G1', 2, 3, 'is-pivot']], work: [{html: 'b sütununda 1 pivot daha: r<sub>B</sub> = 3', kind: 'sum'}]},
      ]},
    },
    // Kural: the test
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Çözüm var ⇔ r<sub>A</sub> = r<sub>B</sub>',
      body: 'b sütunu yeni pivot getirirse son satır 0 = c (c ≠ 0) olur. Getirmezse çelişki çıkmaz.',
      scene: {items: ['test'], mode: 'solo'},
      beat: {type: 'paced', endMarks: false, frames: [
        {label: ['test', '<span class="st-hl-result">r<sub>A</sub> = r<sub>B</sub> → çözüm var</span><br>r<sub>A</sub> &lt; r<sub>B</sub> → çözüm yok']},
        {label: ['test', 'r<sub>A</sub> = r<sub>B</sub> → çözüm var<br><span class="st-hl-result">r<sub>A</sub> &lt; r<sub>B</sub> → çözüm yok</span>']},
        {work: [{html: 'her zaman r<sub>A</sub> ≤ r<sub>B</sub> ≤ r<sub>A</sub> + 1', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Bu sistemin çözümü var mı?',
      body: 'Son satır tamamen sıfır.',
      scene: {items: ['H1'], mode: 'aug'},
      options: [
        {text: 'Var', value: true, correct: true, feedback: 'Sıfır satır <span class="st-math">0 = 0</span> der, bu hep doğrudur. r<sub>A</sub> = r<sub>B</sub> = 2 olduğundan çelişki yok.'},
        {text: 'Yok', value: false, tag: 'zero-row-means-none', feedback: 'Sıfır satırın sağı da 0. Çelişki <span class="st-math">0 = c</span> ile gelir, c ≠ 0 olmalı.'},
      ],
      check: {expr: 'rank(H1[:, :3]) == rank(H1)'},
      claims: [{expr: 'rank(H1[:, :3])', equals: 2}, {expr: 'rank(H1)', equals: 2}],
      reveal: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['H1', 2, '*', 'is-row']], work: [{html: '0x + 0y + 0z = 0 hep doğru', kind: 'a'}]},
        {clear: true, marks: [['H1', 0, 0, 'is-pivot'], ['H1', 1, 1, 'is-pivot']], work: [{html: 'r<sub>A</sub> = r<sub>B</sub> = 2 → çözüm var', kind: 'sum'}]},
      ]},
    },
    // Tek çözüm
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Her sütunda pivot varsa çözüm tek',
      body: 'Üç bilinmeyen, üç pivot: hiçbir değişken serbest kalmaz. Aşağıdan yukarı her biri tek değer alır.',
      scene: {items: ['T1'], mode: 'aug'},
      claims: [{expr: 'inv(T1[:, :3])*T1[:, 3]', equals: [[2], [1], [2]]}, {expr: 'rank(T1[:, :3])', equals: 3}],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['T1', 0, 0, 'is-pivot'], ['T1', 1, 1, 'is-pivot'], ['T1', 2, 2, 'is-pivot']], work: [{html: 'r<sub>A</sub> = r<sub>B</sub> = 3 = n', kind: 'b'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['T1', 2, '*', 'is-row']], work: [{html: 'R<sub>3</sub>: 2z = 4 → z = 2', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['T1', 1, '*', 'is-row']], work: [{html: 'R<sub>2</sub>: 3y + 2 = 5 → y = 1', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['T1', 0, '*', 'is-row']], work: [{html: 'R<sub>1</sub>: 2x + 1 = 5 → x = 2', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tek çözüm: (2, 1, 2)', kind: 'sum'}]}]},
      ]},
    },
    // Sonsuz çözüm
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Serbest değişken sayısı n − r<sub>A</sub>',
      body: 'n bilinmeyen sayısı. Pivotsuz her sütun bir serbest değişken, yani bir parametre verir.',
      scene: {items: ['Z1'], mode: 'aug'},
      claims: [{expr: '3 - rank(Z1[:, :3])', equals: 1}],
      beat: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['Z1', 0, 0, 'is-pivot'], ['Z1', 1, 2, 'is-pivot'], ['Z1', '*', 1, 'is-col']], work: [{html: 'y\'nin sütununda pivot yok'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'n = 3, r<sub>A</sub> = r<sub>B</sub> = 2'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'serbest = n − r<sub>A</sub> = 3 − 2 = 1', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Çözüm kümesi hangisi? <span class="st-math">(t ∈ ℝ)</span>',
      body: 'Serbest değişken y = t olsun. Aşağıdan yukarı çöz.',
      scene: {items: ['Z1'], mode: 'aug'},
      options: [
        {text: '(1 − 3t, t, 2)', value: [[1, -3], [0, 1], [2, 0]], correct: true, feedback: 'Önce z = 2, sonra x = 5 − 3t − 4 = 1 − 3t. Sabit 1 sağ taraftan gelir; homojen sistemde olmazdı.'},
        {text: '(−3t, t, 2)', value: [[0, -3], [0, 1], [2, 0]], tag: 'constant-dropped', feedback: 'Sağ taraf 5 sıfır değil. <span class="st-math">x + 3t + 4 = 5</span> olduğundan x = 1 − 3t kalır.'},
        {text: '(1 + 3t, t, 2)', value: [[1, 3], [0, 1], [2, 0]], tag: 'sign-slip', feedback: '3t karşıya geçerken işaret değiştirir: <span class="st-math">x = 1 − 3t</span>.'},
        {text: '(5 − 3t, t, 2)', value: [[5, -3], [0, 1], [2, 0]], tag: 'z-term-forgotten', feedback: 'z = 2 yerine konmadı. <span class="st-math">2z = 4</span> terimi de karşıya geçmeli: x = 5 − 3t − 4.'},
      ],
      check: {expr: 'Matrix.hstack(Matrix([1, 0, 2]), Z1[:, :3].nullspace()[0])'},
      claims: [{expr: 'Z1[:, :3]*Matrix([1, 0, 2])', equals: [[5], [4]]}, {expr: 'Z1[:, :3]*Matrix([-3, 1, 0])', equals: [[0], [0]]}],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['Z1', 1, '*', 'is-row']], work: [{html: 'R<sub>2</sub>: 2z = 4 → z = 2', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['Z1', 0, '*', 'is-row']], work: [{html: 'R<sub>1</sub>: x + 3t + 2·2 = 5 → x = 1 − 3t', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'X = (1 − 3t, t, 2), t ∈ ℝ', kind: 'sum'}]}]},
      ]},
    },
    // Kural: the three cases
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Üç durum: önce r<sub>A</sub> ile r<sub>B</sub>, sonra n',
      body: 'Önce r<sub>A</sub> ile r<sub>B</sub>\'yi karşılaştır. Çözüm varsa n ile karşılaştır.',
      scene: {items: ['rule3'], mode: 'solo'},
      beat: {type: 'paced', endMarks: false, frames: [
        {label: ['rule3', '<span class="st-hl-result">r<sub>A</sub> &lt; r<sub>B</sub> → çözüm yok</span><br>r<sub>A</sub> = r<sub>B</sub> = n → tek çözüm<br>r<sub>A</sub> = r<sub>B</sub> &lt; n → sonsuz çözüm']},
        {label: ['rule3', 'r<sub>A</sub> &lt; r<sub>B</sub> → çözüm yok<br><span class="st-hl-result">r<sub>A</sub> = r<sub>B</sub> = n → tek çözüm</span><br>r<sub>A</sub> = r<sub>B</sub> &lt; n → sonsuz çözüm']},
        {label: ['rule3', 'r<sub>A</sub> &lt; r<sub>B</sub> → çözüm yok<br>r<sub>A</sub> = r<sub>B</sub> = n → tek çözüm<br><span class="st-hl-result">r<sub>A</sub> = r<sub>B</sub> &lt; n → sonsuz çözüm</span>']},
        {work: [{html: 'sonsuzda n − r<sub>A</sub> parametre', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Kaç çözümü var?',
      body: 'Dört bilinmeyen, üç satır.',
      scene: {items: ['J1'], mode: 'aug'},
      options: [
        {text: 'Yok', value: [3, 4], tag: 'consistent-misread', feedback: 'Son satır <span class="st-math">z + 3w = 2</span>, çelişki değil. Sağ sütunda ek pivot yok, r<sub>A</sub> = r<sub>B</sub>.'},
        {text: 'Tek', value: [4, 4], tag: 'rank-equals-rows', feedback: 'Üç pivot var ama bilinmeyen dört. Tek çözüm için pivot sayısı n = 4 olmalıydı.'},
        {text: 'Sonsuz', value: [3, 3], correct: true, feedback: 'r<sub>A</sub> = r<sub>B</sub> = 3 < n = 4: çözüm var ve bir serbest değişken kalıyor. Bu da sonsuz çözüm demek.'},
      ],
      check: {expr: '[rank(J1[:, :4]), rank(J1)]'},
      claims: [{expr: 'rank(J1[:, :4])', equals: 3}, {expr: 'rank(J1)', equals: 3}],
      reveal: {type: 'paced', endMarks: false, frames: [
        {clear: true, marks: [['J1', 0, 0, 'is-pivot'], ['J1', 1, 1, 'is-pivot'], ['J1', 2, 2, 'is-pivot']], work: [{html: 'r<sub>A</sub> = r<sub>B</sub> = 3', kind: 'a'}]},
        {marks: [['J1', '*', 3, 'is-col']], work: [{html: 'n = 4: bir serbest değişken', kind: 'sum'}]},
      ]},
    },
    // Tuzak
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'Pivotsuz sütunlar var. Kaç çözüm?',
      body: 'AX = b, bilinmeyenler x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>, x<sub>4</sub>.',
      scene: {items: ['P1'], mode: 'aug'},
      options: [
        {text: 'Sonsuz', value: [2, 2], tag: 'free-columns-only', feedback: 'Pivotsuz sütunlara bakıp b sütununu unuttun. Son satır <span class="st-math">0 = 4</span>: r<sub>B</sub> = 3 > r<sub>A</sub> = 2.'},
        {text: 'Tek', value: [4, 4], tag: 'unique-with-free-columns', feedback: 'Dört bilinmeyene iki pivot düşüyor; tek çözüm bu yüzden zaten olamazdı.'},
        {text: 'Yok', value: [2, 3], correct: true, feedback: 'Son satır <span class="st-math">0 = 4</span> çelişkisi. r<sub>A</sub> = 2 < r<sub>B</sub> = 3 iken serbest değişkenlerin anlamı kalmaz.'},
      ],
      check: {expr: '[rank(P1[:, :4]), rank(P1)]'},
      claims: [{expr: 'rank(P1[:, :4])', equals: 2}, {expr: 'rank(P1)', equals: 3}],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['P1', 2, '*', 'is-wrong']], work: [{html: '0 = 4 çelişki', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['P1', 0, 0, 'is-pivot'], ['P1', 1, 1, 'is-pivot'], ['P1', 2, 4, 'is-pivot']], work: [{html: 'r<sub>A</sub> = 2 < r<sub>B</sub> = 3 → çözüm yok', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'Çözüm kümesi kaç parametreli?',
      scene: {items: ['n5'], mode: 'solo'},
      answer: 2,
      check: {expr: '5 - 3'},
      feedbackRight: 'r<sub>A</sub> = r<sub>B</sub> olduğundan çözüm var. Serbest değişken sayısı <span class="st-math">5 − 3 = 2</span>, yani iki parametre.',
      feedbackWrong: 'Parametre sayısı n − r<sub>A</sub>. 5 bilinmeyene 3 pivot düşüyor: <span class="st-math">5 − 3 = 2</span>.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'r<sub>A</sub> = r<sub>B</sub>: çözüm var'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'n − r<sub>A</sub> = 5 − 3 = 2', kind: 'sum'}]}]},
      ]},
    },
    // Sınav tipi
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'r<sub>A</sub> = r<sub>B</sub> ise sistemin tek çözümü vardır. Doğru mu?',
      scene: {items: ['tf'], mode: 'solo'},
      options: [
        {text: 'Doğru', value: true, tag: 'consistent-means-unique', feedback: 'r<sub>A</sub> = r<sub>B</sub> yalnız çözümün var olduğunu söyler. Tek olması için r<sub>A</sub> = n de gerekir.'},
        {text: 'Yanlış', value: false, correct: true, feedback: 'r<sub>A</sub> = r<sub>B</sub> < n ise çözüm var ama serbest değişken kalır: sonsuz çözüm. Tek çözüm r<sub>A</sub> = n ister.'},
      ],
      check: {expr: 'False'},
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'r<sub>A</sub> = r<sub>B</sub> → çözüm var'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'tek olması için r<sub>A</sub> = n gerek'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'r<sub>A</sub> = r<sub>B</sub> < n → sonsuz çözüm', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k, m için çözüm yok?',
      scene: {items: ['KM'], mode: 'aug'},
      options: [
        {text: 'k = 3, m ≠ 2', value: [2, 3], correct: true, feedback: 'k = 3 iken son satır <span class="st-math">0 = m − 2</span> olur. m ≠ 2 ise 0 = c, c ≠ 0 çelişkisi çıkar.'},
        {text: 'k = 3, m = 2', value: [2, 2], tag: 'swapped-cases', feedback: 'm = 2 ise son satır <span class="st-math">0 = 0</span>. Çelişki yok, sonsuz çözüm var.'},
        {text: 'k ≠ 3', value: [3, 3], tag: 'wrong-case-no-solution', feedback: 'k ≠ 3 ise son satırdan z bulunur ve her şey tek değere bağlanır: tek çözüm.'},
      ],
      check: {expr: '[rank(KM.subs({k: 3, m: 5})[:, :3]), rank(KM.subs({k: 3, m: 5}))]'},
      claims: [
        {expr: 'rank(KM.subs({k: 3, m: 5})[:, :3])', equals: 2},
        {expr: 'rank(KM.subs({k: 3, m: 5}))', equals: 3},
        {expr: 'rank(KM.subs({k: 3, m: 2}))', equals: 2},
        {expr: 'rank(KM.subs({k: 4, m: 5})[:, :3])', equals: 3},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['KM', 2, '*', 'is-row']], work: [{html: 'son satır: (k − 3)z = m − 2', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'k = 3: 0z = m − 2'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'm ≠ 2: 0 = c, c ≠ 0 → çözüm yok', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Sınav tipi', title: '<span class="st-math">k = 3, m = 2</span> iken kaç serbest değişken var?',
      scene: {items: ['KM'], mode: 'aug'},
      answer: 1,
      check: {expr: '3 - rank(KM.subs({k: 3, m: 2})[:, :3])'},
      claims: [{expr: 'rank(KM.subs({k: 3, m: 2})[:, :3])', equals: 2}],
      feedbackRight: 'Son satır <span class="st-math">0 = 0</span> olur, çözüm var. r<sub>A</sub> = 2 olduğundan <span class="st-math">3 − 2 = 1</span> serbest değişken kalır.',
      feedbackWrong: 'Son satır sıfır satır, geriye 2 pivot kalır: r<sub>A</sub> = 2. Serbest değişken sayısı <span class="st-math">3 − 2 = 1</span>.',
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['KM', 2, '*', 'is-row']], work: [{html: 'son satır: 0 = 0', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['KM', 0, 0, 'is-pivot'], ['KM', 1, 1, 'is-pivot']], work: [{html: 'r<sub>A</sub> = r<sub>B</sub> = 2'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'n − r<sub>A</sub> = 3 − 2 = 1', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k için çözüm yok?',
      body: 'Önce R<sub>2</sub> − 2R<sub>1</sub>, sonra satırları sırala.',
      scene: {items: ['K2'], mode: 'aug'},
      options: [
        {text: 'k = 2', value: ['2'], correct: true, feedback: 'R<sub>2</sub> − 2R<sub>1</sub> satırı <span class="st-math">(k − 2)z = 1</span> verir. k = 2 ise 0 = 1 olur, çözüm yok.'},
        {text: 'k ≠ 2', value: 'Complement(Reals, FiniteSet(2))', tag: 'condition-inverted', feedback: 'Ters çevirdin. k ≠ 2 ise z = 1/(k − 2) bulunur ve çözüm tek olur.'},
        {text: 'Hiçbir k için', value: 'EmptySet', tag: 'singular-case-missed', feedback: 'k = 2 için üçüncü denklem birinci ile çelişir: sol taraf 2 katı, sağ taraf 5 ≠ 4. Bu durumu atlamışsın.'},
      ],
      check: {expr: 'solve(det(K2[:, :3]), k)'},
      claims: [
        {expr: 'K2.row(1) - 2*K2.row(0)', equals: [[0, 0, 'k - 2', 1]]},
        {expr: 'rank(K2.subs(k, 2)[:, :3])', equals: 2},
        {expr: 'rank(K2.subs(k, 2))', equals: 3},
        {expr: 'rank(K2.subs(k, 3))', equals: 3},
      ],
      reveal: {type: 'sequence', beats: [
        {type: 'paced', endMarks: false, frames: [{clear: true, marks: [['K2', 0, '*', 'is-row'], ['K2', 1, '*', 'is-row']], work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − 2R<sub>1</sub>: [0 0 k − 2 | 1]', kind: 'a'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'eşelon için R<sub>2</sub> ↔ R<sub>3</sub>'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'son satır: (k − 2)z = 1'}]}]},
        {type: 'paced', endMarks: false, frames: [{work: [{html: 'k = 2: 0 = 1 → r<sub>A</sub> = 2 < r<sub>B</sub> = 3', kind: 'sum'}]}]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Önce r<sub>A</sub> ile r<sub>B</sub>\'yi karşılaştır',
      body: 'Sonra n ile kıyasla. Çelişki yalnız 0 = c (c ≠ 0) satırından gelir; 0 = 0 zararsızdır.',
      scene: {items: ['mascot', 'sum']},
    },
  ],
};

/* A6 Özel matrisler 1: köşegen, skaler, birim, üçgen, simetrik, ters simetrik; A = (A + Aᵀ)/2 + (A − Aᵀ)/2. */
/*
 * Type questions are checked with residuals: a matrix is of a type exactly when its residual is the
 * zero matrix (skaler: X − x11·I, ters simetrik: X + Xᵀ), so the right option's residual equals the
 * check and every distractor's residual is a different non-zero matrix. "Hangileri doğru" questions
 * encode the answer as a row of truth values [I, II, III] (1 = doğru), each computed in the check.
 * Letters: c is a scalar (c·I), k is only the parameter of the exam question, K is the skew part.
 */
LESSONS.A6 = {
  id: 'A6',
  title: 'Özel matrisler 1',
  matrices: {
    A: {name: 'A', values: [[3, 5], [1, 2]]},
    AT: {name: 'Aᵀ', values: [[3, 1], [5, 2]]},
    S: {name: 'S', values: [[3, 3], [3, 2]]},
    K: {name: 'K', values: [[0, 2], [-2, 0]]},
    SUM: {name: 'A + Aᵀ', values: [[6, 6], [6, 4]]},
    D: {name: 'D', values: [[4, 0, 0], [0, -1, 0], [0, 0, 2]]},
    SP: {name: 'P', values: [[2, 0], [0, 2]]},
    SQ: {name: 'Q', values: [[2, 0], [0, -2]]},
    SR: {name: 'R', values: [[0, 2], [2, 0]]},
    U: {name: 'A', values: [[1, 4, -2], [0, 3, 5], [0, 0, 6]]},
    M: {name: 'A', values: [[7, 0, 0], [2, -1, 0], [4, 6, 3]]},
    SY: {name: 'A', values: [[1, 4, -2], [4, 0, 7], [-2, 7, 5]]},
    SYT: {name: 'Aᵀ', values: [[1, 4, -2], [4, 0, 7], [-2, 7, 5]]},
    X: {name: 'A', values: [[2, 'x+1', 0], [5, 1, -3], [0, -3, 4]]},
    KS: {name: 'A', values: [[0, 3, -1], [-3, 0, 2], [1, -2, 0]]},
    TP: {name: 'P', values: [[0, 3], [3, 0]]},
    TQ: {name: 'Q', values: [[2, -3], [3, 2]]},
    TR: {name: 'R', values: [[0, -3], [3, 0]]},
    B: {name: 'B', values: [[1, 6, 0], [2, 4, -3], [4, 5, 2]]},
    KB: {name: 'K', values: [[0, 2, -2], [-2, 0, -4], [2, 4, 0]]},
    KK: {name: 'A', values: [['k²-4', 'k+1', 2], [-3, 0, -1], [-2, 1, 0]]},
    C: {name: 'A', values: [[2, 7, -1], [3, -5, 4], [6, 0, 9]]},
    L3: {name: 'A', values: [[2, 0, 0], [5, -1, 0], [3, 8, 7]]},
    SK3: {name: 'A', values: [[0, -4, null], [null, 0, -2], [-3, null, 0]]},
  },
  labels: {
    q: '(A − Aᵀ)<sub>21</sub> = ?',
    st: 'I. Her köşegen matris simetriktir.<br>II. Her üçgen matris köşegendir.<br>III. Aᵀ = A ve Aᵀ = −A ise A = 0.',
    rules: 'Köşegen dışı 0: köşegen<br>c·I: skaler, I: birim<br>Altı ya da üstü 0: üçgen<br>Aᵀ = A: simetrik<br>Aᵀ = −A: ters simetrik',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'Bu A hangi iki matrisin toplamı?',
      body: 'Her kare matris, bir simetrik ve bir ters simetrik matrisin toplamıdır. ' +
        'Önce matris türlerini tanıyacaksın, sonra bu iki parçayı bulacaksın.',
      scene: {items: ['A', 'op:eq', 'S', 'op:plus', 'K']},
      state: {S: [[null, null], [null, null]], K: [[null, null], [null, null]]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Ana köşegen: sol üstten sağ alta',
      body: 'Kare matriste a<sub>11</sub>, a<sub>22</sub>, a<sub>33</sub> ana köşegeni oluşturur. ' +
        'Köşegen dışındaki her eleman 0 ise matrise köşegen matris denir.',
      scene: {items: ['D'], mode: 'solo'},
      state: {D: [[4, 7, 1], [2, -1, 5], [3, 6, 2]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['D', 0, 0, 'is-target'], ['D', 1, 1, 'is-target'], ['D', 2, 2, 'is-target']],
          work: [{text: 'ana köşegen', label: true}]},
        {at: 1200, set: [['D', 0, 1, 0], ['D', 0, 2, 0], ['D', 1, 2, 0], ['D', 1, 0, 0], ['D', 2, 0, 0], ['D', 2, 1, 0]],
          work: [{text: 'dışı 0', label: true}]},
        {at: 2400, work: [{text: 'dışı 0 →', label: true}, {text: 'köşegen matris', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Köşegendekiler eşitse skaler, hepsi 1 ise birim',
      body: 'Birim matris I\'nın köşegeni hep 1\'dir. Skaler matris c·I biçimindedir, örneğin 3·I. ' +
        'Her birim matris skaler, her skaler matris köşegendir.',
      scene: {items: ['D'], mode: 'solo'},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['D', 0, 0, 'is-target'], ['D', 1, 1, 'is-target'], ['D', 2, 2, 'is-target']],
          work: [{text: 'köşegen matris', label: true}]},
        {at: 1100, set: [['D', 0, 0, 3], ['D', 1, 1, 3], ['D', 2, 2, 3]], work: [{text: '3·I: skaler', kind: 'sum'}]},
        {at: 2400, set: [['D', 0, 0, 1], ['D', 1, 1, 1], ['D', 2, 2, 1]],
          work: [{text: '3·I: skaler,'}, {text: 'I: birim', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Hangisi skaler matris?',
      scene: {items: ['SP', 'SQ', 'SR']},
      check: {expr: '0*eye(2)'},
      options: [
        {text: 'P', value: 'SP - SP[0, 0]*eye(2)', correct: true,
          feedback: 'Köşegen dışı 0 ve köşegendeki iki sayı eşit.'},
        {text: 'Q', value: 'SQ - SQ[0, 0]*eye(2)', tag: 'sign-overlooked',
          feedback: 'Q köşegen ama skaler değil: köşegende 2 ile −2 var, eşit değiller.'},
        {text: 'R', value: 'SR - SR[0, 0]*eye(2)', tag: 'wrong-diagonal',
          feedback: 'R\'nin 2\'leri öbür köşegende. Ana köşegen 0, 0; köşegen dışı ise 0 değil.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['SP', 0, 0, 'is-result'], ['SP', 1, 1, 'is-result']], work: [{html: 'P = 2·I', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Köşegenin altı 0 ise üst üçgen',
      body: 'Üst üçgende köşegenin altı hep 0\'dır. Alt üçgende köşegenin üstü 0\'dır. Köşegen matris ikisidir de.',
      scene: {items: ['U'], mode: 'solo'},
      claims: [{expr: 'T(U)', equals: [[1, 0, 0], [4, 3, 0], [-2, 5, 6]]}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['U', 1, 0, 'is-target'], ['U', 2, 0, 'is-target'], ['U', 2, 1, 'is-target']],
          work: [{text: 'altı 0 →', label: true}, {text: 'üst üçgen', kind: 'sum'}]},
        {at: 1400, clear: true, set: [['U', 0, 1, 0], ['U', 0, 2, 0], ['U', 1, 2, 0], ['U', 1, 0, 4], ['U', 2, 0, -2], ['U', 2, 1, 5]],
          marks: [['U', 0, 1, 'is-target'], ['U', 0, 2, 'is-target'], ['U', 1, 2, 'is-target']],
          work: [{html: 'Aᵀ: üstü 0 →', label: true}, {text: 'alt üçgen', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Bu matris hangi türden?',
      scene: {items: ['M'], mode: 'solo'},
      // Value [üst üçgen mi, alt üçgen mi]; köşegen means both.
      check: {expr: 'Matrix([[Integer(M.is_upper), Integer(M.is_lower)]])'},
      options: [
        {text: 'Üst üçgen', value: [[1, 0]], tag: 'named-by-zeros',
          feedback: 'Ad, sayıların durduğu yerden gelir. Sıfırlar üstte, sayılar altta: alt üçgen.'},
        {text: 'Alt üçgen', value: [[0, 1]], correct: true,
          feedback: 'Köşegenin üstü tamamen 0, sayılar köşegende ve altında duruyor.'},
        {text: 'Köşegen', value: [[1, 1]], tag: 'half-zeros-enough',
          feedback: 'Köşegen matriste alt taraf da 0 olmalı. Burada köşegenin altında 2, 4, 6 var.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['M', 0, 1, 'is-target'], ['M', 0, 2, 'is-target'], ['M', 1, 2, 'is-target']],
          work: [{text: 'üstü 0 →', label: true}, {text: 'alt üçgen', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'Alt üçgen 3×3\'te en çok kaç eleman 0 değildir?',
      scene: {items: ['L3'], mode: 'solo'},
      marks: [['L3', 0, 0, 'is-target'], ['L3', 1, 0, 'is-target'], ['L3', 1, 1, 'is-target'], ['L3', 2, 0, 'is-target'], ['L3', 2, 1, 'is-target'], ['L3', 2, 2, 'is-target']],
      answer: 6,
      check: {expr: '1 + 2 + 3'},
      claims: [{expr: 'L3.is_lower', equals: true}],
      feedbackRight: 'Köşegen dahil 1 + 2 + 3 eleman kalır: köşegenin üstü zorunlu 0, köşegen ve altı serbest.',
      feedbackWrong: 'Köşegenin üstündeki 3 yer 0 olmak zorunda. Kalan 9 − 3 yerde sayı olabilir: köşegen dahil.',
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L3', 0, 0, 'is-target']], work: [{text: '1. satır: 1 yer', label: true}]},
        {at: 1000, clear: true, marks: [['L3', 1, 0, 'is-target'], ['L3', 1, 1, 'is-target']], work: [{text: '2. satır: 2 yer', label: true}]},
        {at: 2000, clear: true, marks: [['L3', 2, 0, 'is-target'], ['L3', 2, 1, 'is-target'], ['L3', 2, 2, 'is-target']],
          work: [{text: '1 + 2 + 3 =', label: true}, {text: '6', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Simetrik: Aᵀ = A',
      body: 'Transpoz satırları sütun yapar. Simetrik matriste hiçbir şey değişmez: köşegene göre karşılıklı ' +
        'elemanlar eşittir, <span class="st-math">a<sub>ij</sub> = a<sub>ji</sub></span>.',
      scene: {items: ['SY', 'op:arrow', 'SYT']},
      state: {SYT: [[null, null, null], [null, null, null], [null, null, null]]},
      claims: [{expr: 'T(SY)', equals: 'SY'}],
      // The transpose beat, written out so that the last frame can state the conclusion.
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['SY', 0, '*', 'is-row']], work: [{text: 'satır → sütun', label: true}],
          fly: [{from: ['SY', 0, 0], to: ['SYT', 0, 0], kind: 'row'}, {from: ['SY', 0, 1], to: ['SYT', 1, 0], kind: 'row'}, {from: ['SY', 0, 2], to: ['SYT', 2, 0], kind: 'row'}]},
        {at: 500, set: [['SYT', 0, 0, 1], ['SYT', 1, 0, 4], ['SYT', 2, 0, -2]]},
        {at: 900, clear: true, marks: [['SY', 1, '*', 'is-row']],
          fly: [{from: ['SY', 1, 0], to: ['SYT', 0, 1], kind: 'row'}, {from: ['SY', 1, 1], to: ['SYT', 1, 1], kind: 'row'}, {from: ['SY', 1, 2], to: ['SYT', 2, 1], kind: 'row'}]},
        {at: 1400, set: [['SYT', 0, 1, 4], ['SYT', 1, 1, 0], ['SYT', 2, 1, 7]]},
        {at: 1800, clear: true, marks: [['SY', 2, '*', 'is-row']],
          fly: [{from: ['SY', 2, 0], to: ['SYT', 0, 2], kind: 'row'}, {from: ['SY', 2, 1], to: ['SYT', 1, 2], kind: 'row'}, {from: ['SY', 2, 2], to: ['SYT', 2, 2], kind: 'row'}]},
        {at: 2300, set: [['SYT', 0, 2, -2], ['SYT', 1, 2, 7], ['SYT', 2, 2, 5]]},
        {at: 2800, clear: true, marks: [['SYT', 0, 1, 'is-result'], ['SYT', 1, 0, 'is-result'], ['SY', 0, 1, 'is-target'], ['SY', 1, 0, 'is-target']],
          work: [{html: 'a<sub>12</sub> = a<sub>21</sub> = 4,', label: true}, {html: 'Aᵀ = A', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'A simetrik ise x kaç?',
      scene: {items: ['X'], mode: 'solo'},
      marks: [['X', 0, 1, 'is-target']],
      answer: 4,
      check: {expr: 'solve(X[0, 1] - X[1, 0], x)[0]'},
      claims: [{expr: 'T(X.subs(x, 4))', equals: 'X.subs(x, 4)'}],
      feedbackRight: 'Köşegene göre karşılıklı iki eleman eşit olmalı.',
      feedbackWrong: 'a<sub>12</sub> ile a<sub>21</sub> eşit olmalı. Eşitlenen x değil, <span class="st-math">x + 1</span>.',
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['X', 0, 1, 'is-target'], ['X', 1, 0, 'is-target']],
          work: [{html: 'a<sub>12</sub> = a<sub>21</sub>', label: true}]},
        {at: 1200, work: [{html: 'a<sub>12</sub> = a<sub>21</sub>:', label: true}, {text: 'x + 1 = 5'}]},
        {at: 2400, set: [['X', 0, 1, '4+1']], marks: [['X', 0, 1, 'is-result'], ['X', 1, 0, 'is-result']],
          work: [{text: 'x + 1 = 5 →'}, {text: 'x = 4', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Ters simetrik: Aᵀ = −A',
      body: 'Karşılıklı elemanlar zıt işaretlidir: <span class="st-math">a<sub>ij</sub> = −a<sub>ji</sub></span>. ' +
        'Üç çifti sırayla göreceksin.',
      scene: {items: ['KS'], mode: 'solo'},
      claims: [{expr: 'T(KS)', equals: '-KS'}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['KS', 0, 1, 'is-target'], ['KS', 1, 0, 'is-target']],
          work: [{html: '3 ve −3', label: true}]},
        {at: 900, clear: true, marks: [['KS', 0, 2, 'is-target'], ['KS', 2, 0, 'is-target'], ['KS', 1, 2, 'is-target'], ['KS', 2, 1, 'is-target']],
          work: [{html: '−1 ve 1, 2 ve −2', label: true}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'A ters simetrik. ? yerlerinin toplamı kaç?',
      body: 'Önce köşegenin öbür yanındaki karşılığa bak.',
      scene: {items: ['SK3'], mode: 'solo'},
      marks: [['SK3', 0, 2, 'is-target'], ['SK3', 1, 0, 'is-target'], ['SK3', 2, 1, 'is-target']],
      answer: 9,
      check: {expr: '-(-3) - (-4) - (-2)'},
      claims: [{expr: 'T(Matrix([[0, -4, 3], [4, 0, -2], [-3, 2, 0]]))', equals: '-Matrix([[0, -4, 3], [4, 0, -2], [-3, 2, 0]])'}],
      feedbackRight: 'Her ? yerinin karşılığı var ve işareti ters: 3, 4 ve 2. Köşegen zaten 0 olduğu için ona bakmadın.',
      feedbackWrong: 'Her ? için karşılığının işaretini çevir: <span class="st-math">a<sub>13</sub> = −a<sub>31</sub></span>, <span class="st-math">a<sub>21</sub> = −a<sub>12</sub></span>, <span class="st-math">a<sub>32</sub> = −a<sub>23</sub></span>.',
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['SK3', 0, 2, 'is-target'], ['SK3', 2, 0, 'is-target']],
          work: [{html: 'a<sub>13</sub> = −a<sub>31</sub> = 3', label: true}]},
        {at: 1100, clear: true, marks: [['SK3', 1, 0, 'is-target'], ['SK3', 0, 1, 'is-target']],
          work: [{html: 'a<sub>21</sub> = −a<sub>12</sub> = 4', label: true}]},
        {at: 2200, clear: true, marks: [['SK3', 2, 1, 'is-target'], ['SK3', 1, 2, 'is-target']],
          work: [{html: 'a<sub>32</sub> = −a<sub>23</sub> = 2', label: true}]},
        {at: 3300, clear: true, work: [{text: '3 + 4 + 2 =', label: true}, {text: '9', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'Ters simetrik A için a<sub>22</sub> + a<sub>33</sub> kaç?',
      body: 'Köşegendeki eleman kendi karşılığıdır.',
      scene: {items: ['KS'], mode: 'solo'},
      marks: [['KS', 1, 1, 'is-target'], ['KS', 2, 2, 'is-target']],
      answer: 0,
      check: {expr: 'KS[1, 1] + KS[2, 2]'},
      feedbackRight: 'Köşegen kendi karşılığı olduğundan a<sub>ii</sub> = −a<sub>ii</sub> çıkar. Bu da 0 demek, toplam 0.',
      feedbackWrong: '<span class="st-math">a<sub>22</sub> = −a<sub>22</sub></span> ise <span class="st-math">2a<sub>22</sub> = 0</span>. Köşegende hep 0 vardır.',
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['KS', 0, 0, 'is-result'], ['KS', 1, 1, 'is-result'], ['KS', 2, 2, 'is-result']],
          work: [{html: 'a<sub>ii</sub> = −a<sub>ii</sub> →', label: true}, {html: 'a<sub>ii</sub> = 0', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'Hangisi ters simetrik?',
      scene: {items: ['TP', 'TQ', 'TR']},
      check: {expr: '0*eye(2)'},
      options: [
        {text: 'P', value: 'TP + T(TP)', tag: 'same-sign-pairs',
          feedback: 'P\'de karşılıklılar eşit, 3 ve 3: bu simetrik. Ters simetrikte zıt işaret gerekir.'},
        {text: 'Q', value: 'TQ + T(TQ)', tag: 'diagonal-ignored',
          feedback: 'Çiftler zıt işaretli ama köşegende 2 var. Ters simetrikte köşegen hep 0.'},
        {text: 'R', value: 'TR + T(TR)', correct: true,
          feedback: 'Çiftler zıt işaretli ve köşegen 0. İki koşul birlikte gerekir.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['TR', 0, 1, 'is-target'], ['TR', 1, 0, 'is-target']], work: [{text: '−3 ve 3', label: true}]},
        {at: 1300, clear: true, marks: [['TR', 0, 0, 'is-result'], ['TR', 1, 1, 'is-result']], work: [{text: '−3 ve 3,'}, {text: 'köşegen 0', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'A + Aᵀ her zaman simetrik',
      body: 'Karşılıklı iki yer aynı toplamı alır: a<sub>12</sub> + a<sub>21</sub>. Köşegendeki her sayı iki katına çıkar.',
      scene: {items: ['A', 'op:plus', 'AT', 'op:eq', 'SUM']},
      state: {SUM: [[null, null], [null, null]]},
      claims: [{expr: 'A + T(A)', equals: [[6, 6], [6, 4]]}, {expr: 'T(SUM)', equals: 'SUM'}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 0, 1, 'is-target'], ['A', 1, 0, 'is-target'], ['AT', 0, 1, 'is-target']],
          work: [{html: 'Aᵀ\'nın sağ üstü = a<sub>21</sub>', label: true}]},
        {at: 500, fly: [{from: ['A', 0, 1], to: ['SUM', 0, 1], kind: 'result'}, {from: ['AT', 0, 1], to: ['SUM', 0, 1], kind: 'result'}]},
        {at: 1000, set: [['SUM', 0, 1, 6]], work: [{text: '5 + 1 = 6', kind: 'sum'}]},
        {at: 1400, clear: true, marks: [['A', 1, 0, 'is-target'], ['AT', 1, 0, 'is-target']],
          fly: [{from: ['A', 1, 0], to: ['SUM', 1, 0], kind: 'result'}, {from: ['AT', 1, 0], to: ['SUM', 1, 0], kind: 'result'}]},
        {at: 1900, set: [['SUM', 1, 0, 6]], work: [{text: '5 + 1 = 6,'}, {text: '1 + 5 = 6', kind: 'sum'}]},
        {at: 2400, clear: true, set: [['SUM', 0, 0, 6], ['SUM', 1, 1, 4]], marks: [['SUM', 0, 0, 'is-target'], ['SUM', 1, 1, 'is-target']],
          work: [{text: 'köşegen iki katı:'}, {text: '3 + 3, 2 + 2'}]},
        {at: 2900, clear: true, marks: [['SUM', 0, 1, 'is-result'], ['SUM', 1, 0, 'is-result']],
          work: [{text: 'iki yerde de 6 →'}, {text: 'simetrik', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'A − Aᵀ\'nın (2,1) elemanı kaç?',
      scene: {items: ['A', 'op:minus', 'AT', 'q']},
      check: {expr: '(A - T(A))[1, 0]'},
      options: [
        {text: '4', tag: 'order-reversed', expr: '(A - T(A))[0, 1]',
          feedback: 'Bu (1,2) yerindeki sayı. (2,1) için <span class="st-math">a<sub>21</sub> − a<sub>12</sub></span> alınır.'},
        {text: '−4', correct: true,
          feedback: '(2,1) yerinde A\'dan 1, Aᵀ\'dan 5 gelir; çıkarma bu sırayla yapılır.'},
        {text: '6', tag: 'used-sum', expr: '(A + T(A))[1, 0]',
          feedback: '6, A + Aᵀ\'nın elemanı. Burada çıkarma var: <span class="st-math">a<sub>21</sub> − a<sub>12</sub></span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['A', 1, 0, 'is-target'], ['AT', 1, 0, 'is-target']], work: [
          {text: '1', kind: 'a', hidden: true, ref: 'a0'}, {text: '−', hidden: true, ref: 'm0'},
          {text: '5', kind: 'b', hidden: true, ref: 'b0'}, {text: '=', hidden: true, ref: 'eq'},
          {text: '−4', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 400, fly: [{from: ['A', 1, 0], to: 'work:a0', kind: 'row'}]},
        {at: 1100, reveal: ['m0'], fly: [{from: ['AT', 1, 0], to: 'work:b0', kind: 'col'}]},
        {at: 1800, reveal: ['eq', 'sum'], label: ['q', '(A − Aᵀ)<sub>21</sub> = <span class="st-hl-result">−4</span>']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'A = (A + Aᵀ)/2 + (A − Aᵀ)/2',
      body: 'İlk parça simetrik S, ikincisi ters simetrik K. Toplarken Aᵀ\'ler sadeleşir, A kalır. İkiye bölmeyi unutma.',
      scene: {items: ['A', 'op:eq', 'S', 'op:plus', 'K']},
      state: {S: [[null, null], [null, null]], K: [[null, null], [null, null]]},
      claims: [
        {expr: '(A + T(A))/2', equals: 'S'}, {expr: '(A - T(A))/2', equals: 'K'}, {expr: 'A - T(A)', equals: [[0, 4], [-4, 0]]},
        {expr: 'S + K', equals: 'A'}, {expr: 'T(S)', equals: 'S'}, {expr: 'T(K)', equals: '-K'},
      ],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, set: [['S', 0, 0, 6], ['S', 0, 1, 6], ['S', 1, 0, 6], ['S', 1, 1, 4]], marks: [['S', '*', '*', 'is-target']],
          work: [{html: 'A + Aᵀ', label: true}]},
        {at: 600, set: [['S', 0, 0, 3], ['S', 0, 1, 3], ['S', 1, 0, 3], ['S', 1, 1, 2]],
          work: [{html: 'S = (A + Aᵀ)/2:', label: true}, {text: '6/2 = 3, 4/2 = 2'}]},
        {at: 1300, clear: true, set: [['K', 0, 0, 0], ['K', 0, 1, 4], ['K', 1, 0, -4], ['K', 1, 1, 0]], marks: [['K', '*', '*', 'is-target']],
          work: [{html: 'A − Aᵀ', label: true}]},
        {at: 1900, set: [['K', 0, 1, 2], ['K', 1, 0, -2]],
          work: [{html: 'K = (A − Aᵀ)/2:', label: true}, {text: '4/2 = 2, −4/2 = −2'}]},
        {at: 2600, clear: true, marks: [['A', 0, 1, 'is-result'], ['S', 0, 1, 'is-target'], ['K', 0, 1, 'is-target']],
          work: [{html: 'S<sub>12</sub> + K<sub>12</sub> =', label: true}, {html: '3 + 2 = 5 = a<sub>12</sub>', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'B\'nin ters simetrik parçası K. K\'nın (2,3) elemanı?',
      scene: {items: ['B', 'op:arrow', 'KB']},
      state: {KB: [[null, null, null], [null, null, null], [null, null, null]]},
      marks: [['KB', 1, 2, 'is-target']],
      check: {expr: '((B - T(B))/2)[1, 2]'},
      options: [
        {text: '4', tag: 'order-reversed', expr: '(B[2, 1] - B[1, 2])/2',
          feedback: 'Sırayı ters aldın. (2,3) için <span class="st-math">b<sub>23</sub> − b<sub>32</sub></span> gerekir, tersi değil.'},
        {text: '1', tag: 'used-sum', expr: '(B[1, 2] + B[2, 1])/2',
          feedback: 'Toplamın yarısı simetrik parçayı verir. Ters simetrik parça farkın yarısıdır.'},
        {text: '−4', correct: true,
          feedback: 'K = (B − Bᵀ)/2: b<sub>23</sub>\'ten b<sub>32</sub> çıkarılır, sonra ikiye bölünür.'},
        {text: '−8', tag: 'forgot-half', expr: 'B[1, 2] - B[2, 1]',
          feedback: 'Farkı doğru buldun ama ikiye bölmedin: <span class="st-math">K = (B − Bᵀ)/2</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['B', 1, 2, 'is-target'], ['B', 2, 1, 'is-target']],
          work: [{html: 'K<sub>23</sub> = (b<sub>23</sub> − b<sub>32</sub>)/2', label: true}]},
        {at: 1200, work: [{html: 'K<sub>23</sub> =', label: true}, {text: '(−3 − 5)/2'}]},
        {at: 2300, set: [['KB', 1, 2, -4]], marks: [['KB', 1, 2, 'is-result']],
          work: [{html: 'K<sub>23</sub> =', label: true}, {text: '(−3 − 5)/2 ='}, {text: '−4', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k için A ters simetrik olur?',
      scene: {items: ['KK'], mode: 'solo'},
      check: {expr: 'sorted(FiniteSet(*solve(KK[0, 0], k)).intersect(FiniteSet(*solve(KK[0, 1] + KK[1, 0], k))))'},
      claims: [{expr: 'T(KK.subs(k, 2))', equals: '-KK.subs(k, 2)'}],
      options: [
        {text: 'k = 2 ya da −2', value: ['-2', '2'], tag: 'diagonal-only',
          feedback: '<span class="st-math">k = −2</span> köşegeni sıfırlar ama <span class="st-math">a<sub>12</sub> = −1</span> olur. Oysa <span class="st-math">−a<sub>21</sub> = 3</span> gerekir.'},
        {text: 'k = −4', value: ['-4'], tag: 'symmetric-condition',
          feedback: 'Simetri koşulunu kurdun: <span class="st-math">a<sub>12</sub> = a<sub>21</sub></span>. Ters simetrikte <span class="st-math">a<sub>12</sub> = −a<sub>21</sub></span>.'},
        {text: 'k = 2', value: ['2'], correct: true,
          feedback: 'Köşegen iki aday verir, karşılıklı çift tek aday. İkisini birden yalnız k = 2 sağlar.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['KK', 0, 0, 'is-target']], work: [{html: 'k² − 4 = 0 →', label: true}, {text: 'k = 2 ya da −2'}]},
        {at: 1200, clear: true, marks: [['KK', 0, 1, 'is-target'], ['KK', 1, 0, 'is-target']],
          work: [{text: 'k = ±2,'}, {html: 'k + 1 = 3 →'}, {text: 'k = 2'}]},
        {at: 2400, clear: true, set: [['KK', 0, 0, 0], ['KK', 0, 1, 3]], marks: [['KK', 0, 0, 'is-result'], ['KK', 0, 1, 'is-result']],
          work: [{text: 'ikisi birden:', label: true}, {text: 'k = 2', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'A = S + K (S simetrik, K ters simetrik). iz(S) kaç?',
      body: 'iz: köşegen elemanlarının toplamı.',
      scene: {items: ['C'], mode: 'solo'},
      check: {expr: 'tr((C + T(C))/2)'},
      claims: [{expr: 'tr((C - T(C))/2)', equals: 0}, {expr: 'tr(C)', equals: 6}],
      options: [
        {text: '12', tag: 'forgot-half', expr: 'tr(C + T(C))',
          feedback: 'İkiye bölmeyi unuttun: <span class="st-math">S = (A + Aᵀ)/2</span>.'},
        {text: '3', tag: 'halved-trace', expr: 'tr(C)/2',
          feedback: 'Aᵀ\'nın köşegeni A\'nınkiyle aynı: <span class="st-math">iz(A + Aᵀ) = 2·iz(A)</span>. Yarısı iz(A).'},
        {text: '6', correct: true,
          feedback: 'K\'nın köşegeni 0 olduğu için izi de 0. Bütün iz S\'den gelir.'},
        {text: '0', tag: 'parts-swapped', expr: 'tr((C - T(C))/2)',
          feedback: '0, ters simetrik K\'nın izi. S\'nin izi A\'nınkine eşit.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['C', 0, 0, 'is-result'], ['C', 1, 1, 'is-result'], ['C', 2, 2, 'is-result']],
          work: [{text: 'iz(A) =', label: true}, {text: '2 − 5 + 9 = 6'}]},
        {at: 1300, work: [{text: 'iz(K) = 0 →', label: true}, {text: 'iz(S) = iz(A) = 6', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangileri her zaman doğru?',
      scene: {items: ['st']},
      // [I, II, III]: I for a general diagonal matrix, II refuted by the triangular U, III from A = −A.
      check: {expr: 'Matrix([[Integer(diag(a, b, c) == T(diag(a, b, c))), Integer(U.is_diagonal()), Integer(solve(a + a, a) == [0])]])'},
      options: [
        {text: 'Yalnız I', value: [[1, 0, 0]], tag: 'missed-zero-matrix',
          feedback: 'III de doğru: Aᵀ hem A hem −A ise <span class="st-math">A = −A</span>, yani <span class="st-math">2A = 0</span>.'},
        {text: 'I ve II', value: [[1, 1, 0]], tag: 'triangular-as-diagonal',
          feedback: 'II yanlış: üst üçgenin köşegen üstünde sıfır olmayan sayılar olabilir.'},
        {text: 'I ve III', value: [[1, 0, 1]], correct: true,
          feedback: 'Köşegen matriste karşılıklı elemanlar hep 0, yani eşit. III\'te <span class="st-math">A = −A</span> çıkar; bu yalnız sıfır matriste olur.'},
        {text: 'Hepsi', value: [[1, 1, 1]], tag: 'all-true',
          feedback: 'II yanlış: üçgen matrisin yalnız bir yanı 0 olmak zorunda, iki yanı değil.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['st', '<span class="st-hl-result">I. Her köşegen matris simetriktir.</span><br><s>II. Her üçgen matris köşegendir.</s><br>' +
          '<span class="st-hl-result">III. Aᵀ = A ve Aᵀ = −A ise A = 0.</span>']},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Türü bir bakışta tanı',
      body: 'Ters simetriğin köşegeni sıfırdır. Sınav kısayolu: <span class="st-math">iz(S) = iz(A)</span>. Her A, <span class="st-math">S = (A+Aᵀ)/2</span> ile <span class="st-math">K = (A−Aᵀ)/2</span> toplamıdır.',
      scene: {items: ['mascot', 'rules']},
    },
  ],
};

/* A7 Özel matrisler 2: idempotent, involutif, nilpotent, periyodik, ortogonal (+ dönme matrisi) and their exam consequences, without determinants. */
/*
 * Determinant-free on purpose: A7 comes before the determinant unit, so every consequence is argued with A⁻¹ alone
 * (idempotent: multiply A² = A by A⁻¹; nilpotent: multiply A² = 0 by A⁻¹). The |A| consequences are left to B4.
 * Abstract statements are checked on concrete witnesses kept in `matrices` (never shown when the scene does not list
 * them): SA, SB are general symmetric 2×2 matrices; SK (ters simetrik) and SM (simetrik) commute; OA, OB are orthogonal,
 * ters simetrik and commute. Type questions carry the residual (X − Xᵀ, X + Xᵀ), the zero matrix only for the right option.
 * "Hangileri doğru" options encode [I, II, III] as a row of truth values (1 = doğru).
 * Product beats compute one diagonal and one off-diagonal cell from their row and column, then fill the other two in one frame.
 */
LESSONS.A7 = {
  id: 'A7',
  title: 'Özel matrisler 2',
  matrices: {
    P: {name: 'A', values: [[2, -2], [1, -1]]},
    PB: {name: 'A', values: [[2, -2], [1, -1]]},
    P2: {name: 'A²', values: [[2, -2], [1, -1]]},
    PM: {name: 'A − I', values: [[1, -2], [1, -2]]},
    PZ: {name: 'A(A − I)', values: [[0, 0], [0, 0]]},
    J: {name: 'A', values: [[3, -4], [2, -3]]},
    JB: {name: 'A', values: [[3, -4], [2, -3]]},
    J2: {name: 'A²', values: [[1, 0], [0, 1]]},
    N: {name: 'A', values: [[2, -4], [1, -2]]},
    NB: {name: 'A', values: [[2, -4], [1, -2]]},
    N2: {name: 'A²', values: [[0, 0], [0, 0]]},
    N3: {name: 'A', values: [[0, 2, 1], [0, 0, 3], [0, 0, 0]]},
    N32: {name: 'A²', values: [[0, 0, 6], [0, 0, 0], [0, 0, 0]]},
    CP: {name: 'P', values: [[0, 0, 1], [1, 0, 0], [0, 1, 0]]},
    CP2: {name: 'P²', values: [[0, 1, 0], [0, 0, 1], [1, 0, 0]]},
    Q: {name: 'A', values: [['3/5', '-4/5'], ['4/5', '3/5']]},
    QT: {name: 'Aᵀ', values: [['3/5', '4/5'], ['-4/5', '3/5']]},
    QI: {name: 'AᵀA', values: [[1, 0], [0, 1]]},
    QX: {name: 'A⁻¹', values: [['3/5', '4/5'], ['-4/5', '3/5']]},
    RO: {name: 'R', values: [[0, -1], [1, 0]]},
    // Witnesses for the checks only; never shown.
    SA: {name: 'A', values: [['a', 'b'], ['b', 'c']]},
    SB: {name: 'B', values: [['d', 'e'], ['e', 'f']]},
    SK: {name: 'A', values: [[0, 1, 0, 0], [-1, 0, 0, 0], [0, 0, 0, 2], [0, 0, -2, 0]]},
    SM: {name: 'B', values: [[3, 0, 0, 0], [0, 3, 0, 0], [0, 0, 5, 0], [0, 0, 0, 5]]},
    OA: {name: 'A', values: [[0, 1, 0, 0], [-1, 0, 0, 0], [0, 0, 0, 1], [0, 0, -1, 0]]},
    OB: {name: 'B', values: [[0, 1, 0, 0], [-1, 0, 0, 0], [0, 0, 0, -1], [0, 0, 1, 0]]},
  },
  labels: {
    hook: 'A² = A<br>A⁻¹ = ?',
    pw: 'A² = A<br>A⁵ = ?',
    sq: 'A² = A<br>(I − A)² = ?',
    inv2: 'A² = I<br>A⁻¹ = ?',
    nil: 'A² = 0, A ≠ 0<br>A⁻¹ var mı?',
    chain: '(AB)ᵀ = BᵀAᵀ',
    given: 'Aᵀ = −A, Bᵀ = B<br>AB = BA',
    st: 'I. Ortogonal ise A⁻¹ = Aᵀ.<br>II. İnvolutif ise A⁻¹ = A.<br>III. İdempotent matrisin tersi yoktur.',
    given2: 'A, B ortogonal<br>A, B ters simetrik<br>AB = BA',
    rules: 'İdempotent: A² = A<br>İnvolutif: A² = I<br>Nilpotent: bir k için A<sup>k</sup> = 0<br>Periyodik: A<sup>k+1</sup> = A<br>Ortogonal: AᵀA = I',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'A² = A ise A\'nın tersi var mı?',
      body: 'A⁻¹, A ile çarpınca I veren matristir. Sınav özel matrisleri kuvvetleriyle tanımlar. ' +
        'Kuvvetlere bakınca cevap kendiliğinden çıkacak.',
      scene: {items: ['hook'], mode: 'solo'},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Kendisiyle çarp: hiç değişmiyor',
      body: 'Bu matrisin karesi yine kendisi: A² = A. Böyle matrise idempotent denir.',
      scene: {items: ['P', 'op:dot', 'PB', 'op:eq', 'P2']},
      state: {P2: [[null, null], [null, null]]},
      claims: [{expr: 'P*P', equals: 'P'}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['P', 0, '*', 'is-row'], ['PB', '*', 0, 'is-col']], work: [
          {text: '2', kind: 'a', hidden: true, ref: 'a0'},
          {text: '·', hidden: true, ref: 'm0'},
          {text: '2', kind: 'b', hidden: true, ref: 'b0'},
          {text: '+', hidden: true, ref: 'p1'},
          {text: '(−2)', kind: 'a', hidden: true, ref: 'a1'},
          {text: '·', hidden: true, ref: 'm1'},
          {text: '1', kind: 'b', hidden: true, ref: 'b1'},
          {text: '=', hidden: true, ref: 'eq'},
          {text: '2', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 350, fly: [{from: ['P', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['PB', 0, 0], to: 'work:b0', kind: 'col'}, {from: ['P', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['PB', 1, 0], to: 'work:b1', kind: 'col'}]},
        {at: 1000, reveal: ['m0', 'p1', 'm1', 'eq', 'sum'], set: [['P2', 0, 0, 2]], marks: [['P2', 0, 0, 'is-result']]},
        {at: 1400, clear: true, marks: [['P', 0, '*', 'is-row'], ['PB', '*', 1, 'is-col']], work: [
          {text: '2', kind: 'a', hidden: true, ref: 'a0'},
          {text: '·', hidden: true, ref: 'm0'},
          {text: '(−2)', kind: 'b', hidden: true, ref: 'b0'},
          {text: '+', hidden: true, ref: 'p1'},
          {text: '(−2)', kind: 'a', hidden: true, ref: 'a1'},
          {text: '·', hidden: true, ref: 'm1'},
          {text: '(−1)', kind: 'b', hidden: true, ref: 'b1'},
          {text: '=', hidden: true, ref: 'eq'},
          {text: '−2', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 1750, fly: [{from: ['P', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['PB', 0, 1], to: 'work:b0', kind: 'col'}, {from: ['P', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['PB', 1, 1], to: 'work:b1', kind: 'col'}]},
        {at: 2400, reveal: ['m0', 'p1', 'm1', 'eq', 'sum'], set: [['P2', 0, 1, -2]], marks: [['P2', 0, 1, 'is-result']]},
        {at: 2800, clear: true, set: [['P2', 1, 0, 1], ['P2', 1, 1, -1]], marks: [['P', '*', '*', 'is-target'], ['P2', '*', '*', 'is-result']],
          work: [{text: 'kalan ikisi aynı yolla →'}, {html: 'A² = A', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'A idempotent ise A⁵ nedir?',
      scene: {items: ['pw'], mode: 'solo'},
      check: {expr: 'P**5'},
      options: [
        {text: 'I', value: 'eye(2)', tag: 'confused-with-involutive',
          feedback: 'A⁵ = I olsaydı A·A⁴ = I olurdu. Ama her A² yeniden A olur, o yüzden A⁵ = A kalır.'},
        {text: 'A', value: 'P', correct: true,
          feedback: 'Her yeni A çarpanı A²\'yi yine A yapar. Kuvvet kaç olursa olsun sonuç A kalır.'},
        {text: '5A', value: '5*P', tag: 'power-as-multiple',
          feedback: 'Kuvvet, katsayı değildir: A⁵ beş A\'nın çarpımı, toplamı değil. Çarpımda A²\'nin A olduğunu kullan.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['pw', 'A² = A']},
        {at: 1200, label: ['pw', 'A² = A<br>A³ = A²·A = A·A = A']},
        {at: 2400, label: ['pw', 'A² = A<br>A³ = A²·A = A·A = A<br>A⁴ = A³·A = A·A = A']},
        {at: 3600, label: ['pw', 'A² = A<br>A³ = A²·A = A·A = A<br>A⁴ = A³·A = A·A = A<br>A⁵ = <span class="st-hl-result">A</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'A² = A ise (I − A)² nedir?',
      body: 'Parantezi aç, A² = A kullan.',
      scene: {items: ['sq'], mode: 'solo'},
      check: {expr: 'eye(2) - P'},
      claims: [{expr: '(eye(2) - P)**2', equals: 'eye(2) - P'}],
      options: [
        {text: 'I', value: 'eye(2)', tag: 'dropped-cross-terms',
          feedback: 'A\'lı terimleri attın. Açılımda −A − A ve +A² var, hepsi yok olmaz.'},
        {text: 'I − A', value: 'eye(2) - P', correct: true,
          feedback: '<span class="st-math">I − 2A + A²</span> yazılınca A² yerine A gelir ve −2A + A = −A kalır. I − A da idempotent çıkar.'},
        {text: 'I − 2A', value: 'eye(2) - 2*P', tag: 'forgot-square-term',
          feedback: 'Orta terimi buldun ama +A² terimini unuttun. O terim A\'ya dönüp −2A\'nın yarısını geri alır.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['sq', '(I − A)² = (I − A)(I − A)']},
        {at: 1200, label: ['sq', '(I − A)² = (I − A)(I − A)<br>= I − A − A + A²']},
        {at: 2400, label: ['sq', '(I − A)² = (I − A)(I − A)<br>= I − A − A + A²<br>= I − 2A + A = <span class="st-hl-result">I − A</span>']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'İdempotent ve A&nbsp;≠&nbsp;I ise tersi yok',
      body: 'A⁻¹ olsaydı, A² = A\'yı soldan onunla çarpınca A = I çıkardı. Tersi olmayan matrise tekil denir.',
      scene: {items: ['hook'], mode: 'solo'},
      labels: {hook: 'A·A = A'},
      beat: {type: 'script', frames: [
        {at: 0, work: [{text: 'A⁻¹ varsa soldan çarp', label: true}]},
        {at: 800, label: ['hook', 'A·A = A<br>A⁻¹·A·A = A⁻¹·A']},
        {at: 1600, label: ['hook', 'A·A = A<br>A⁻¹·A·A = A⁻¹·A<br>I·A = I, yani A = I']},
        {at: 2400, label: ['hook', 'A ≠ I ise A⁻¹ yok: A tekil<br>A = I ise A⁻¹ = I']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'A(A − I) = 0. Yani A = 0 ya da A = I mi?',
      body: 'Sayılarda xy = 0 ise x ya da y sıfırdır.',
      scene: {items: ['P', 'op:dot', 'PM', 'op:eq', 'PZ']},
      state: {PZ: [[null, null], [null, null]]},
      check: {expr: '(P == eye(2)) | (P == 0*eye(2))'},
      claims: [{expr: 'P*(P - eye(2))', equals: '0*eye(2)'}, {expr: 'P - eye(2)', equals: 'PM'}],
      options: [
        {text: 'Evet', value: true, tag: 'matrix-zero-product',
          feedback: 'Sayı alışkanlığı burada çalışmaz: iki matris de sıfırdan farklı olduğu halde çarpımları 0 çıkıyor.'},
        {text: 'Hayır', value: false, correct: true,
          feedback: 'A ne 0 ne I, ama A² − A = 0. Matrislerde sıfırdan farklı iki çarpan, çarpımı 0 yapabilir.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['P', '*', '*', 'is-target'], ['PM', '*', '*', 'is-target']], work: [{text: 'A ≠ 0 ve A − I ≠ 0', label: true}]},
        {at: 1200, set: [['PZ', 0, 0, 0], ['PZ', 0, 1, 0], ['PZ', 1, 0, 0], ['PZ', 1, 1, 0]], marks: [['PZ', '*', '*', 'is-result']],
          work: [{text: 'A ≠ 0, A − I ≠ 0,'}, {text: 'çarpım 0', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'İki kez uygula, başa dön: A² = I',
      body: 'Bu matrisin karesi birim matris. Karesi I olan matrise involutif denir.',
      scene: {items: ['J', 'op:dot', 'JB', 'op:eq', 'J2']},
      state: {J2: [[null, null], [null, null]]},
      claims: [{expr: 'J*J', equals: 'eye(2)'}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['J', 0, '*', 'is-row'], ['JB', '*', 0, 'is-col']], work: [
          {text: '3', kind: 'a', hidden: true, ref: 'a0'},
          {text: '·', hidden: true, ref: 'm0'},
          {text: '3', kind: 'b', hidden: true, ref: 'b0'},
          {text: '+', hidden: true, ref: 'p1'},
          {text: '(−4)', kind: 'a', hidden: true, ref: 'a1'},
          {text: '·', hidden: true, ref: 'm1'},
          {text: '2', kind: 'b', hidden: true, ref: 'b1'},
          {text: '=', hidden: true, ref: 'eq'},
          {text: '1', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 350, fly: [{from: ['J', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['JB', 0, 0], to: 'work:b0', kind: 'col'}, {from: ['J', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['JB', 1, 0], to: 'work:b1', kind: 'col'}]},
        {at: 1000, reveal: ['m0', 'p1', 'm1', 'eq', 'sum'], set: [['J2', 0, 0, 1]], marks: [['J2', 0, 0, 'is-result']]},
        {at: 1400, clear: true, marks: [['J', 0, '*', 'is-row'], ['JB', '*', 1, 'is-col']], work: [
          {text: '3', kind: 'a', hidden: true, ref: 'a0'},
          {text: '·', hidden: true, ref: 'm0'},
          {text: '(−4)', kind: 'b', hidden: true, ref: 'b0'},
          {text: '+', hidden: true, ref: 'p1'},
          {text: '(−4)', kind: 'a', hidden: true, ref: 'a1'},
          {text: '·', hidden: true, ref: 'm1'},
          {text: '(−3)', kind: 'b', hidden: true, ref: 'b1'},
          {text: '=', hidden: true, ref: 'eq'},
          {text: '0', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 1750, fly: [{from: ['J', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['JB', 0, 1], to: 'work:b0', kind: 'col'}, {from: ['J', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['JB', 1, 1], to: 'work:b1', kind: 'col'}]},
        {at: 2400, reveal: ['m0', 'p1', 'm1', 'eq', 'sum'], set: [['J2', 0, 1, 0]], marks: [['J2', 0, 1, 'is-result']]},
        {at: 2800, clear: true, set: [['J2', 1, 0, 0], ['J2', 1, 1, 1]], marks: [['J2', '*', '*', 'is-result']],
          work: [{text: 'kalan ikisi aynı yolla →'}, {html: 'A² = I', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'A² = I ise A⁻¹ nedir?',
      scene: {items: ['inv2'], mode: 'solo'},
      check: {expr: 'inv(J)'},
      options: [
        {text: 'Aᵀ', value: 'T(J)', tag: 'confused-with-orthogonal',
          feedback: 'A⁻¹ = Aᵀ başka bir türün kuralı, onu birazdan göreceksin. Burada A·A = I, yani tersi A\'nın kendisi.'},
        {text: 'A', value: 'J', correct: true,
          feedback: 'A·A = I, yani A\'yı geri alan matris yine A. İnvolutif matris kendi tersidir.'},
        {text: '−A', value: '-J', tag: 'sign-guess',
          feedback: 'A·(−A) = −I olur, I değil. Çarpınca I veren matris A\'nın kendisi.'},
        {text: 'I', value: 'eye(2)', tag: 'inverse-is-identity',
          feedback: 'A·I = A olur, I değil. Çarpınca I veren matris A\'nın kendisi.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['inv2', 'A² = I']},
        {at: 1200, label: ['inv2', 'A² = I<br>A·A = I']},
        {at: 2400, label: ['inv2', 'A² = I<br>A·A = I<br>A⁻¹ = <span class="st-hl-result">A</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tahmin et', title: 'Bu matriste hiç 0 yok. A² ne çıkar?',
      body: 'Bir kuvveti 0 olan matrise nilpotent denir.',
      scene: {items: ['N', 'op:dot', 'NB', 'op:eq', 'N2']},
      state: {N2: [[null, null], [null, null]]},
      check: {expr: 'N*N'},
      options: [
        {text: 'A', value: 'N', tag: 'assumed-idempotent',
          feedback: 'Karesi kendisi olan idempotentti. Burada çarpımlar 0 çıkıyor.'},
        {text: 'Sıfır matris', value: '0*eye(2)', correct: true,
          feedback: 'Her satır her sütunla 0 veriyor, dört elemanın dördü de 0. Demek ki A nilpotent.'},
        {text: 'I', value: 'eye(2)', tag: 'assumed-involutive',
          feedback: 'Köşegen bile 0 çıkıyor, I için 1 gerekirdi. Her çarpım 0 veriyor.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['N', 0, '*', 'is-row'], ['NB', '*', 0, 'is-col']], work: [
          {text: '2', kind: 'a', hidden: true, ref: 'a0'},
          {text: '·', hidden: true, ref: 'm0'},
          {text: '2', kind: 'b', hidden: true, ref: 'b0'},
          {text: '+', hidden: true, ref: 'p1'},
          {text: '(−4)', kind: 'a', hidden: true, ref: 'a1'},
          {text: '·', hidden: true, ref: 'm1'},
          {text: '1', kind: 'b', hidden: true, ref: 'b1'},
          {text: '=', hidden: true, ref: 'eq'},
          {text: '0', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 350, fly: [{from: ['N', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['NB', 0, 0], to: 'work:b0', kind: 'col'}, {from: ['N', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['NB', 1, 0], to: 'work:b1', kind: 'col'}]},
        {at: 1000, reveal: ['m0', 'p1', 'm1', 'eq', 'sum'], set: [['N2', 0, 0, 0]], marks: [['N2', 0, 0, 'is-result']]},
        {at: 1400, clear: true, marks: [['N', 0, '*', 'is-row'], ['NB', '*', 1, 'is-col']], work: [
          {text: '2', kind: 'a', hidden: true, ref: 'a0'},
          {text: '·', hidden: true, ref: 'm0'},
          {text: '(−4)', kind: 'b', hidden: true, ref: 'b0'},
          {text: '+', hidden: true, ref: 'p1'},
          {text: '(−4)', kind: 'a', hidden: true, ref: 'a1'},
          {text: '·', hidden: true, ref: 'm1'},
          {text: '(−2)', kind: 'b', hidden: true, ref: 'b1'},
          {text: '=', hidden: true, ref: 'eq'},
          {text: '0', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 1750, fly: [{from: ['N', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['NB', 0, 1], to: 'work:b0', kind: 'col'}, {from: ['N', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['NB', 1, 1], to: 'work:b1', kind: 'col'}]},
        {at: 2400, reveal: ['m0', 'p1', 'm1', 'eq', 'sum'], set: [['N2', 0, 1, 0]], marks: [['N2', 0, 1, 'is-result']]},
        {at: 2800, clear: true, set: [['N2', 1, 0, 0], ['N2', 1, 1, 0]], marks: [['N2', '*', '*', 'is-result']],
          work: [{text: 'kalan ikisi de 0 →'}, {html: 'A² = 0', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'Kaçıncı kuvvet ilk kez sıfır matris olur?',
      body: 'Bu sayıya nilpotentlik indeksi denir.',
      scene: {items: ['N3', 'op:arrow', 'N32']},
      state: {N32: [[null, null, null], [null, null, null], [null, null, null]]},
      answer: 3,
      check: {expr: '4 - Integer(N3.is_zero_matrix) - Integer((N3**2).is_zero_matrix) - Integer((N3**3).is_zero_matrix)'},
      claims: [{expr: 'N3**2', equals: 'N32'}, {expr: 'N3**3', equals: '0*eye(3)'}],
      feedbackRight: 'Her kuvvette sayılar köşegenden bir basamak uzaklaşır; üçüncüde yer kalmaz.',
      feedbackWrong: 'A²\'de sağ üst köşede bir sayı kalır, A³\'te o da gider. İndeks 3.',
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['N3', 0, 1, 'is-row'], ['N3', 1, 2, 'is-col']], work: [
          {text: '2', kind: 'a', hidden: true, ref: 'a0'}, {text: '·', hidden: true, ref: 'm0'},
          {text: '3', kind: 'b', hidden: true, ref: 'b0'}, {text: '=', hidden: true, ref: 'eq'},
          {text: '6', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 400, fly: [{from: ['N3', 0, 1], to: 'work:a0', kind: 'row'}, {from: ['N3', 1, 2], to: 'work:b0', kind: 'col'}]},
        {at: 1100, reveal: ['m0', 'eq', 'sum'], set: [['N32', 0, 2, 6]], marks: [['N32', 0, 2, 'is-result']]},
        {at: 1800, clear: true, set: [['N32', 0, 0, 0], ['N32', 0, 1, 0], ['N32', 1, 0, 0], ['N32', 1, 1, 0], ['N32', 1, 2, 0], ['N32', 2, 0, 0], ['N32', 2, 1, 0], ['N32', 2, 2, 0]],
          marks: [['N32', 0, 2, 'is-result']], work: [{text: 'A² ≠ 0, bir 6 kaldı'}]},
        {at: 3000, clear: true, work: [{text: 'A³ = A²·A: 6 · 0 = 0 →', label: true}, {text: 'indeks 3', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'A² = 0 ve A ≠ 0 ise A\'nın tersi var mı?',
      scene: {items: ['nil'], mode: 'solo'},
      check: {expr: '0'},
      options: [
        {text: 'Var', value: 1, tag: 'nilpotent-invertible',
          feedback: 'Tersi olsaydı A² = 0\'ı soldan A⁻¹ ile çarpınca A = 0 çıkardı. Oysa A ≠ 0.'},
        {text: 'Yok', value: 0, correct: true,
          feedback: 'A⁻¹ olsaydı A² = 0\'dan A = 0 çıkardı, çelişki. Nilpotent matris tekildir.'},
        {text: 'Yalnız A = I ise', value: 2, tag: 'confused-with-idempotent',
          feedback: 'Bu idempotentin kuralı. Burada A² = 0, A = I olsaydı A² = I olurdu.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['nil', 'A⁻¹ varsa A⁻¹·A·A = A⁻¹·0']},
        {at: 1200, label: ['nil', 'A⁻¹ varsa A⁻¹·A·A = A⁻¹·0<br>I·A = 0, yani A = 0']},
        {at: 2400, label: ['nil', 'A⁻¹ varsa A⁻¹·A·A = A⁻¹·0<br>I·A = 0, yani A = 0<br>A ≠ 0 ile çelişir: <span class="st-hl-result">tersi yok</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tahmin et', title: 'P<sup>k+1</sup> = P olan en küçük k kaç?',
      body: 'Böyle matrise periyodik, bu k\'ya periyot denir.',
      scene: {items: ['CP', 'op:arrow', 'CP2']},
      state: {CP2: [[null, null, null], [null, null, null], [null, null, null]]},
      check: {expr: '1 + Integer(CP**2 != CP) + Integer((CP**2 != CP) & (CP**3 != CP))'},
      claims: [{expr: 'CP**2', equals: 'CP2'}, {expr: 'CP**3', equals: 'eye(3)'}, {expr: 'CP**4', equals: 'CP'}],
      options: [
        {text: '1', tag: 'confused-with-idempotent',
          feedback: 'k = 1, P² = P demek; bu idempotent olurdu. P²\'de 1\'ler bir basamak kaymış, P\'ye eşit değil.'},
        {text: '3', correct: true,
          feedback: 'P üç adımda I\'ya döner, bir adım sonra yine P olur. Demek ki P⁴ = P ve periyot k = 3.'},
        {text: '4', tag: 'counted-power',
          feedback: '4, kuvvetin kendisi: P⁴ = P. Tanımda k + 1 = 4 olduğundan k = 3.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, set: [['CP2', 0, 0, 0], ['CP2', 0, 1, 1], ['CP2', 0, 2, 0], ['CP2', 1, 0, 0], ['CP2', 1, 1, 0], ['CP2', 1, 2, 1], ['CP2', 2, 0, 1], ['CP2', 2, 1, 0], ['CP2', 2, 2, 0]],
          marks: [['CP2', '*', '*', 'is-result']], work: [{html: 'P² ≠ P: 1\'ler bir kaydı', label: true}]},
        {at: 1300, clear: true, work: [{html: 'P³ = P²·P = I', label: true}]},
        {at: 2500, work: [{html: 'P³ = I,', label: true}, {html: 'P⁴ = P³·P = P', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Ortogonal: AᵀA = I',
      body: 'AᵀA = I olan matrise ortogonal denir. Her sütun kendisiyle 1, öbür sütunla 0 verir. Bu yüzden A⁻¹ = Aᵀ.',
      scene: {items: ['QT', 'op:dot', 'Q', 'op:eq', 'QI']},
      state: {QI: [[null, null], [null, null]]},
      claims: [{expr: 'T(Q)*Q', equals: 'eye(2)'}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['QT', 0, '*', 'is-row'], ['Q', '*', 0, 'is-col']], work: [
          {text: '3/5', kind: 'a', hidden: true, ref: 'a0'},
          {text: '·', hidden: true, ref: 'm0'},
          {text: '3/5', kind: 'b', hidden: true, ref: 'b0'},
          {text: '+', hidden: true, ref: 'p1'},
          {text: '4/5', kind: 'a', hidden: true, ref: 'a1'},
          {text: '·', hidden: true, ref: 'm1'},
          {text: '4/5', kind: 'b', hidden: true, ref: 'b1'},
          {text: '=', hidden: true, ref: 'eq'},
          {text: '1', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 350, fly: [{from: ['QT', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['Q', 0, 0], to: 'work:b0', kind: 'col'}, {from: ['QT', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['Q', 1, 0], to: 'work:b1', kind: 'col'}]},
        {at: 1000, reveal: ['m0', 'p1', 'm1', 'eq', 'sum'], set: [['QI', 0, 0, 1]], marks: [['QI', 0, 0, 'is-result']]},
        {at: 1400, clear: true, marks: [['QT', 0, '*', 'is-row'], ['Q', '*', 1, 'is-col']], work: [
          {text: '3/5', kind: 'a', hidden: true, ref: 'a0'},
          {text: '·', hidden: true, ref: 'm0'},
          {text: '(−4/5)', kind: 'b', hidden: true, ref: 'b0'},
          {text: '+', hidden: true, ref: 'p1'},
          {text: '4/5', kind: 'a', hidden: true, ref: 'a1'},
          {text: '·', hidden: true, ref: 'm1'},
          {text: '3/5', kind: 'b', hidden: true, ref: 'b1'},
          {text: '=', hidden: true, ref: 'eq'},
          {text: '0', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 1750, fly: [{from: ['QT', 0, 0], to: 'work:a0', kind: 'row'}, {from: ['Q', 0, 1], to: 'work:b0', kind: 'col'}, {from: ['QT', 0, 1], to: 'work:a1', kind: 'row'}, {from: ['Q', 1, 1], to: 'work:b1', kind: 'col'}]},
        {at: 2400, reveal: ['m0', 'p1', 'm1', 'eq', 'sum'], set: [['QI', 0, 1, 0]], marks: [['QI', 0, 1, 'is-result']]},
        {at: 2800, clear: true, set: [['QI', 1, 0, 0], ['QI', 1, 1, 1]], marks: [['QI', '*', '*', 'is-result']],
          work: [{text: 'kalan ikisi aynı yolla →'}, {html: 'AᵀA = I', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'A ortogonal. A⁻¹\'in (1,2) elemanı kaç?',
      body: 'Uzun hesaba gerek yok.',
      scene: {items: ['Q', 'op:arrow', 'QX']},
      state: {QX: [[null, null], [null, null]]},
      marks: [['QX', 0, 1, 'is-target']],
      check: {expr: 'inv(Q)[0, 1]'},
      options: [
        {text: '−4/5', tag: 'forgot-transpose', expr: 'Q[0, 1]',
          feedback: 'Bu A\'nın kendi (1,2) elemanı. Tersi transpoz: (1,2) yerine (2,1)\'deki sayı gelir.'},
        {text: '4/5', correct: true,
          feedback: 'Ortogonalde ters, transpozdur: (1,2) yerine (2,1)\'deki sayı gelir. Hesaplamaya gerek kalmaz.'},
        {text: '−5/4', tag: 'entry-reciprocal', expr: '1/Q[0, 1]',
          feedback: 'Matrisin tersi, elemanların tersi değildir. Ortogonalde <span class="st-math">A⁻¹ = Aᵀ</span>.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['Q', 1, 0, 'is-col']], work: [{html: '(A⁻¹)<sub>12</sub> = a<sub>21</sub>', label: true}]},
        {at: 600, fly: [{from: ['Q', 1, 0], to: ['QX', 0, 1], kind: 'col'}]},
        {at: 1500, set: [['QX', 0, 1, '4/5']], marks: [['QX', 0, 1, 'is-result']]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'R düzlemi 90° döndürür. R⁴ nedir?',
      body: 'R ortogonaldir: RᵀR = I.',
      scene: {items: ['RO'], mode: 'solo'},
      check: {expr: 'RO**4'},
      claims: [{expr: 'T(RO)*RO', equals: 'eye(2)'}, {expr: 'RO**2', equals: '-eye(2)'}],
      options: [
        {text: 'I', value: 'eye(2)', correct: true,
          feedback: 'R² = −I, yani yarım tur. İki yarım tur tam turdur: R⁴ = (−I)² = I.'},
        {text: '−I', value: '-eye(2)', tag: 'stopped-at-square',
          feedback: '−I, R²\'nin değeri (yarım tur). R⁴ onun karesi olduğundan (−I)(−I) = I çıkar.'},
        {text: 'R', value: 'RO', tag: 'power-same-matrix',
          feedback: 'R, dört kez uygulanınca başladığı yere döner; o da yalnız I. R⁴ = R olması için R³ = I gerekirdi.'},
        {text: '0', value: '0*eye(2)', tag: 'nilpotent-confusion',
          feedback: 'R nilpotent değil: R² = −I sıfır matris değil. Her kuvvet I ya da −I\'ye dönüyor, R de olabilir.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, work: [{html: 'R² = −I (yarım tur)', label: true}]},
        {at: 1200, work: [{html: 'R² = −I,', label: true}, {html: 'R⁴ = (−I)² = I', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: '(AB)ᵀ = BᵀAᵀ: sıra döner',
      body: 'A ve B simetrik olsun. Transpoz BA verir, AB değil. Yani AB simetrik olması için AB = BA gerekir.',
      scene: {items: ['chain'], mode: 'solo'},
      claims: [{expr: 'T(SA*SB)', equals: 'SB*SA'}],
      beat: {type: 'script', frames: [
        {at: 0, work: [{text: 'türleri yerine yaz', label: true}]},
        {at: 1000, label: ['chain', '(AB)ᵀ = BᵀAᵀ<br>= BA']},
        {at: 2200, label: ['chain', '(AB)ᵀ = BᵀAᵀ<br>= BA<br>= AB, <span class="st-hl-result">AB = BA ise</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangisi simetrik olmak zorunda?',
      scene: {items: ['given'], mode: 'solo'},
      check: {expr: '0*eye(4)'},
      claims: [
        {expr: 'T(SK)', equals: '-SK'}, {expr: 'T(SM)', equals: 'SM'}, {expr: 'SK*SM', equals: 'SM*SK'},
      ],
      options: [
        {text: 'A²', value: 'SK*SK - T(SK*SK)', correct: true,
          feedback: '<span class="st-math">(A²)ᵀ = (Aᵀ)² = (−A)² = A²</span>. İki eksi birbirini götürür.'},
        {text: 'AB', value: 'SK*SM - T(SK*SM)', tag: 'product-keeps-type',
          feedback: '<span class="st-math">(AB)ᵀ = BᵀAᵀ = B(−A) = −BA = −AB</span>. Bu ters simetrik, simetrik değil.'},
        {text: 'A + B', value: 'SK + SM - T(SK + SM)', tag: 'sum-of-types',
          feedback: '<span class="st-math">(A + B)ᵀ = −A + B</span>. Bu ne A + B ne de −(A + B): karışık bir tür.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['given', '(A²)ᵀ = AᵀAᵀ']},
        {at: 1200, label: ['given', '(A²)ᵀ = AᵀAᵀ<br>= (−A)(−A)']},
        {at: 2400, label: ['given', '(A²)ᵀ = AᵀAᵀ<br>= (−A)(−A)<br>= <span class="st-hl-result">A²</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangileri her zaman doğru?',
      scene: {items: ['st']},
      // [I, II, III]: I and II on the orthogonal Q and the involutive J, III refuted by I (idempotent and its own inverse).
      check: {expr: 'Matrix([[Integer(inv(Q) == T(Q)), Integer(inv(J) == J), Integer(eye(2).is_zero_matrix)]])'},
      options: [
        {text: 'Yalnız I', value: [[1, 0, 0]], tag: 'missed-involutive-inverse',
          feedback: 'II de doğru: A·A = I, yani A\'nın tersi kendisi.'},
        {text: 'I ve II', value: [[1, 1, 0]], correct: true,
          feedback: 'AᵀA = I ve A·A = I iki ayrı tersi verir. III yanlış: A = I idempotenttir ve tersi kendisidir.'},
        {text: 'I ve III', value: [[1, 0, 1]], tag: 'idempotent-always-singular',
          feedback: 'III yanlış: yalnız A ≠ I olan idempotentlerin tersi yoktur. A = I idempotenttir ve tersi kendisi. II ise doğru.'},
        {text: 'Hepsi', value: [[1, 1, 1]], tag: 'all-true',
          feedback: 'III yanlış: A = I için A² = A ve A⁻¹ = I var. "A ≠ I ise" şartı kayboldu.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['st', '<span class="st-hl-result">I. Ortogonal ise A⁻¹ = Aᵀ.</span><br>' +
          '<span class="st-hl-result">II. İnvolutif ise A⁻¹ = A.</span><br><s>III. İdempotent matrisin tersi yoktur.</s>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Bu koşullarda (AB)² nedir?',
      body: 'Önce AᵀA = I içine Aᵀ = −A yaz.',
      scene: {items: ['given2'], mode: 'solo'},
      check: {expr: '(OA*OB)**2'},
      claims: [
        {expr: 'T(OA)*OA', equals: 'eye(4)'}, {expr: 'T(OB)*OB', equals: 'eye(4)'},
        {expr: 'T(OA)', equals: '-OA'}, {expr: 'T(OB)', equals: '-OB'}, {expr: 'OA*OB', equals: 'OB*OA'},
        {expr: 'OA**2', equals: '-eye(4)'},
      ],
      options: [
        {text: '−I', value: '-eye(4)', tag: 'one-minus-only',
          feedback: 'A² = −I ve B² = −I. İki eksi çarpılınca artı olur.'},
        {text: 'I', value: 'eye(4)', correct: true,
          feedback: 'AB = BA sayesinde (AB)² = A²B² yazılır; iki eksi birbirini götürür.'},
        {text: '0', value: '0*eye(4)', tag: 'skew-square-zero',
          feedback: 'Ters simetriğin karesi 0 olmak zorunda değil. Burada AᵀA = I\'dan A² = −I çıkar.'},
        {text: 'AB', value: 'OA*OB', tag: 'assumed-idempotent',
          feedback: '(AB)² = ABAB. AB = BA ile A²B² olur, A² = B² = −I.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['given2', 'AᵀA = I ⇒ −A² = I']},
        {at: 1200, label: ['given2', 'AᵀA = I ⇒ −A² = I<br>A² = −I, B² = −I']},
        {at: 2400, label: ['given2', 'AᵀA = I ⇒ −A² = I<br>A² = −I, B² = −I<br>(AB)² = A²B² = <span class="st-hl-result">I</span>']},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Kuvvete bak, türü tanı',
      body: 'İdempotent (A ≠ I) ve nilpotent matrisin tersi yoktur. İnvolutif kendi tersidir; ortogonalde <span class="st-math">A⁻¹ = Aᵀ</span>.',
      scene: {items: ['mascot', 'rules']},
    },
  ],
};

/* B5 Parametreli determinant: det as a polynomial in k; find the singular k fast by factoring (row operations, plugging in k, triangular form). */
/*
 * Exam technique lesson. Every answer is a root set of det, checked with solve(); factorizations shown on screen
 * are claims. The tricks: pull a (k − a) factor out of a row after a row operation, plug k = a in and look for
 * proportional rows or columns, make a 4×4 triangular. Trap: scaling the target row by k adds a fake root k = 0.
 * Pace: one action per script frame, about 900 ms apart; work lines grow token by token (hidden + reveal) so every
 * intermediate result stays visible. Entry beats must settle within 3.5 s (design gate), so they hold 3-4 actions.
 */
LESSONS.B5 = {
  id: 'B5',
  title: 'Parametreli determinant',
  matrices: {
    H: {name: 'A', values: [[1, 1, 1, 1], [1, 'k', 1, 2], [1, 1, '2k', 1], [1, 1, 1, 'k+3']], bars: true},
    D: {name: 'A', values: [['3-k', 2], [2, '3-k']], bars: true},
    P: {name: 'A', values: [[1, 'k', 'k'], ['k', 1, 'k'], ['k', 'k', 1]], bars: true},
    PR: {name: 'kalan', values: [[1, 'k', 'k'], [1, -1, 0], [1, 0, -1]], bars: true},
    S: {name: 'A', values: [[1, 'k', 3], [2, 4, 'k+3'], [1, 2, 1]], bars: true},
    Z: {name: 'A', values: [['k', 3], [1, 'k-2']], bars: true},
    Z2: {name: '', values: [['k', 3], [0, 'k²-2k-3']], bars: true},
    Q: {name: 'A', values: [[1, 1, 'k'], [1, 'k', 1], [2, 3, 4]], bars: true},
    TV: {name: 'A', values: [[1, 2, 1, 0], [2, 'k+4', 2, 1], [1, 2, 'k', 0], [0, 0, 0, 'k+1']], bars: true},
    V: {name: 'A', values: [[1, 1, 1], [1, 'k', 3], [1, 'k²', 9]], bars: true},
  },
  labels: {
    det: 'det A = ?',
    plan: '1. Satır işlemi: çarpan<br>2. k = a koy: orantılı mı?<br>3. Üçgen yap: çarp',
    fac: 'det A =<br>(k − 1)² ·',
    dl: 'det A = (k − 1)²(2k + 1)',
  },
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: 'Bu 4×4 hangi k değerlerinde tekil?',
      body: '4×4\'ü kofaktörle açmak sınavda beş dakika sürer. Bu derste aynı soruyu bir dakikada çözeceksin.',
      scene: {items: ['H'], mode: 'solo'},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Elemanlarda k varsa det, k\'nın polinomu',
      body: 'Ana köşegenin çarpımından diğer köşegenin çarpımını çıkar. Çıkan ifadeyi sıfır yapan her k, matrisi tekil yapar.',
      scene: {items: ['D', 'det'], mode: 'solo'},
      claims: [{expr: 'det(D)', equals: '(3 - k)**2 - 4'}],
      // det2 needs numbers; the same choreography with symbolic entries, one diagonal per frame.
      beat: {type: 'script', frames: [
        {at: 0, clear: true, work: [
          {text: '(3 − k)', kind: 'a', hidden: true, ref: 'p0'}, {text: '·', hidden: true, ref: 'd0'},
          {text: '(3 − k)', kind: 'a', hidden: true, ref: 'p1'}, {text: '−', hidden: true, ref: 'minus'},
          {text: '2', kind: 'b', hidden: true, ref: 'q0'}, {text: '·', hidden: true, ref: 'd1'},
          {text: '2', kind: 'b', hidden: true, ref: 'q1'},
        ]},
        {at: 100, marks: [['D', 0, 0, 'is-row'], ['D', 1, 1, 'is-row']], reveal: ['d0'],
          fly: [{from: ['D', 0, 0], to: 'work:p0', kind: 'row'}, {from: ['D', 1, 1], to: 'work:p1', kind: 'row'}]},
        {at: 1100, clear: true, marks: [['D', 0, 1, 'is-col'], ['D', 1, 0, 'is-col']], reveal: ['minus', 'd1'],
          fly: [{from: ['D', 0, 1], to: 'work:q0', kind: 'col'}, {from: ['D', 1, 0], to: 'work:q1', kind: 'col'}]},
        {at: 2200, clear: true, label: ['det', 'det A = <span class="st-hl-result">(3 − k)² − 4</span>']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '<span class="st-math">(3 − k)² − 4 = 0</span> yapan k\'lar?',
      body: 'Açmadan dene: önce <span class="st-math">3 − k</span> kaç olmalı?',
      scene: {items: ['D', 'det'], mode: 'solo'},
      labels: {det: 'det A = (3 − k)² − 4'},
      options: [
        {text: 'k = 5', value: ['5'], tag: 'lost-negative-root', feedback: 'Bir kök eksik. <span class="st-math">3 − k = 2</span> de olur, o da <span class="st-math">k = 1</span> verir.'},
        {text: 'k = ±√5', value: ['-sqrt(5)', 'sqrt(5)'], tag: 'binomial-square-wrong', feedback: '<span class="st-math">(3 − k)²</span>, <span class="st-math">9 − k²</span> değildir; ortadaki <span class="st-math">−6k</span> unutuldu.'},
        {text: 'k = 1 ya da 5', value: ['1', '5'], correct: true, feedback: 'Karesi 4 olan iki sayı var, 2 ve −2. Her biri ayrı bir k verir.'},
      ],
      check: {expr: 'solve(det(D), k)'},
      claims: [{expr: 'factor(det(D))', equals: '(k - 1)*(k - 5)'}],
      reveal: {type: 'script', frames: [
        {at: 0, label: ['det', 'det A = (3 − k)² − 4 = 0<br>(3 − k)² = 4']},
        {at: 1000, label: ['det', 'det A = (3 − k)² − 4 = 0<br>(3 − k)² = 4<br>3 − k = 2 → k = 1']},
        {at: 2000, label: ['det', 'det A = (3 − k)² − 4 = 0<br>(3 − k)² = 4<br>3 − k = 2 → <span class="st-hl-result">k = 1</span><br>3 − k = −2 → <span class="st-hl-result">k = 5</span>']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Hedef: det\'i çarpanlarına ayır',
      body: 'Açıp toplamak yerine çarpan halinde bırak. Her <span class="st-math">(k − a)</span> çarpanı bir tekil değer verir: <span class="st-math">k = a</span>. Üç yol var.',
      scene: {items: ['plan'], mode: 'solo'},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Önce satır işlemi, sonra aç',
      body: '<span class="st-math">R<sub>2</sub> → R<sub>2</sub> − R<sub>1</sub></span> det\'i değiştirmez. Yeni satırın her elemanı <span class="st-math">(k − 1)</span> katı; bu çarpan det\'in önüne çıkar.',
      scene: {items: ['P'], mode: 'aug'},
      claims: [{expr: 'P.row(1) - P.row(0)', equals: [['k-1', '1-k', 0]]}],
      // rowOp needs numbers; R1 flies onto R2, the entry differences are written, then R2 turns into R2 − R1.
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['P', 0, '*', 'is-row']], work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − R<sub>1</sub>', label: true}]},
        {at: 600, fly: [{from: ['P', 0, 0], to: ['P', 1, 0], kind: 'row'}, {from: ['P', 0, 1], to: ['P', 1, 1], kind: 'row'}, {from: ['P', 0, 2], to: ['P', 1, 2], kind: 'row'}]},
        {at: 1400, clear: true, marks: [['P', 1, '*', 'is-target']], work: [{html: 'k − 1,  1 − k,  k − k = 0', label: true}]},
        {at: 2300, clear: true, set: [['P', 1, 0, 'k-1'], ['P', 1, 1, '1-k'], ['P', 1, 2, 0]], marks: [['P', 1, '*', 'is-result']],
          work: [{html: 'yeni R<sub>2</sub> =', label: true}, {text: '(k − 1)', kind: 'sum'}, {text: '·'}, {text: '(1, −1, 0)', kind: 'a'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '<span class="st-math">R<sub>3</sub></span> de aynı işlemi görünce det\'in önünde ne olur?',
      body: 'R<sub>2</sub>\'den bir (k − 1) çıkmıştı. R<sub>3</sub> − R<sub>1</sub> yapınca toplam çarpan ne olur?',
      scene: {items: ['P'], mode: 'aug'},
      state: {P: [[1, 'k', 'k'], ['k-1', '1-k', 0], ['k', 'k', 1]]},
      marks: [['P', 2, '*', 'is-target']],
      options: [
        {text: 'k − 1', value: 'k - 1', tag: 'factor-once', feedback: 'R<sub>2</sub> ve R<sub>3</sub> ayrı ayrı birer <span class="st-math">(k − 1)</span> verir. İkisi de dışarı çıkar.'},
        {text: '(k − 1)²', value: '(k - 1)**2', correct: true, feedback: 'İki satırın her biri kendi çarpanını getirir; çarpanlar çarpılır.'},
        {text: '2(k − 1)', value: '2*(k - 1)', tag: 'factors-added', feedback: 'Satırlardan çıkan çarpanlar toplanmaz, çarpılır: <span class="st-math">(k − 1)·(k − 1)</span>.'},
      ],
      check: {expr: 'cancel(det(P) / det(PR))'},
      claims: [{expr: 'P.row(2) - P.row(0)', equals: [['k-1', 0, '1-k']]}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['P', 0, '*', 'is-row']], work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>1</sub>', label: true}]},
        {at: 700, fly: [{from: ['P', 0, 0], to: ['P', 2, 0], kind: 'row'}, {from: ['P', 0, 1], to: ['P', 2, 1], kind: 'row'}, {from: ['P', 0, 2], to: ['P', 2, 2], kind: 'row'}]},
        {at: 1500, clear: true, marks: [['P', 2, '*', 'is-target']], work: [{html: 'k − 1,  k − k = 0,  1 − k', label: true}]},
        {at: 2400, clear: true, set: [['P', 2, 0, 'k-1'], ['P', 2, 1, 0], ['P', 2, 2, '1-k']], marks: [['P', 2, '*', 'is-result'], ['P', 1, '*', 'is-result']],
          work: [{html: 'det A =', label: true}, {text: '(k − 1)', kind: 'sum', ref: 'f1'}, {text: '(k − 1)', kind: 'sum', hidden: true, ref: 'f2'}]},
        {at: 3300, reveal: ['f2']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Ortak çarpanları dışarı al',
      body: 'Her satırdan <span class="st-math">(k − 1)</span> çıkar ve det\'in önüne yaz. Geriye 1\'li satırlar kalır.',
      scene: {items: ['P'], mode: 'aug'},
      state: {P: [[1, 'k', 'k'], ['k-1', '1-k', 0], ['k-1', 0, '1-k']]},
      claims: [{expr: 'det(P) - (k - 1)**2*det(PR)', equals: 0}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['P', 1, '*', 'is-row']], work: [
          {html: 'det A =', label: true}, {text: '(k − 1)', kind: 'sum', hidden: true, ref: 'f1'}, {text: '(k − 1)', kind: 'sum', hidden: true, ref: 'f2'},
          {text: '· |kalan|', kind: 'sum', hidden: true, ref: 'rest'},
        ]},
        {at: 400, fly: [{from: ['P', 1, 0], to: 'work:f1', kind: 'row'}]},
        {at: 1100, reveal: ['f1'], set: [['P', 1, 0, 1], ['P', 1, 1, -1], ['P', 1, 2, 0]]},
        {at: 1700, clear: true, marks: [['P', 2, '*', 'is-row']], fly: [{from: ['P', 2, 0], to: 'work:f2', kind: 'row'}]},
        {at: 2400, reveal: ['f2'], set: [['P', 2, 0, 1], ['P', 2, 1, 0], ['P', 2, 2, -1]]},
        {at: 3000, clear: true, marks: [['P', 1, '*', 'is-result'], ['P', 2, '*', 'is-result']], reveal: ['rest']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Çarpanlar çıktı. Kalan determinant kaç?',
      body: 'Birinci satırdan aç: eleman × silinince kalan 2×2\'nin det\'i.',
      scene: {items: ['fac', 'PR']},
      options: [
        {text: '2k + 1', correct: true, feedback: 'İki k terimi de artı işaretle gelir ve toplanır.'},
        {text: '1', tag: 'cofactor-sign-dropped', expr: 'PR[0, 0]*minor(PR, 1, 1) + PR[0, 1]*minor(PR, 1, 2) + PR[0, 2]*minor(PR, 1, 3)',
          feedback: 'Orta terimin kofaktör işareti eksi: <span class="st-math">−k·(−1) = +k</span>. İşaretler <span class="st-math">+ − +</span> sırasıyla gelir.'},
        {text: '2k − 1', tag: 'sign-slip', expr: '2*k - 1',
          feedback: '<span class="st-math">(−1)·(−1) = +1</span>, −1 değil. İlk terim <span class="st-math">+1</span>.'},
      ],
      check: {expr: 'det(PR)'},
      claims: [{expr: 'factor(det(P))', equals: '(k - 1)**2*(2*k + 1)'}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, work: [
          {text: '1·1', kind: 'a', hidden: true, ref: 't1'}, {text: '− k·(−1)', kind: 'a', hidden: true, ref: 't2'},
          {text: '+ k·1', kind: 'a', hidden: true, ref: 't3'}, {text: '=', hidden: true, ref: 'eq'}, {text: '2k + 1', kind: 'sum', hidden: true, ref: 'sum'},
        ]},
        {at: 200, marks: [['PR', 0, 0, 'is-pivot'], ['PR', 1, 1, 'is-target'], ['PR', 1, 2, 'is-target'], ['PR', 2, 1, 'is-target'], ['PR', 2, 2, 'is-target']], reveal: ['t1']},
        {at: 1200, clear: true, marks: [['PR', 0, 1, 'is-pivot'], ['PR', 1, 0, 'is-target'], ['PR', 1, 2, 'is-target'], ['PR', 2, 0, 'is-target'], ['PR', 2, 2, 'is-target']], reveal: ['t2']},
        {at: 2200, clear: true, marks: [['PR', 0, 2, 'is-pivot'], ['PR', 1, 0, 'is-target'], ['PR', 1, 1, 'is-target'], ['PR', 2, 0, 'is-target'], ['PR', 2, 1, 'is-target']], reveal: ['t3']},
        {at: 3200, clear: true, reveal: ['eq', 'sum']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'İki satır birden sıfırlanırsa kök çift',
      body: 'k = 1\'de bütün satırlar eşit. R<sub>2</sub> − R<sub>1</sub> ve R<sub>3</sub> − R<sub>1</sub> birlikte sıfırlanır; her biri bir <span class="st-math">(k − 1)</span> verir.',
      scene: {items: ['P'], mode: 'aug'},
      claims: [{expr: 'P.subs(k, 1)', equals: [[1, 1, 1], [1, 1, 1], [1, 1, 1]]}, {expr: 'factor(det(P))', equals: '(k - 1)**2*(2*k + 1)'}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['P', 0, 1, 'is-target'], ['P', 0, 2, 'is-target'], ['P', 1, 0, 'is-target'], ['P', 1, 2, 'is-target'], ['P', 2, 0, 'is-target'], ['P', 2, 1, 'is-target']],
          work: [{text: 'k = 1:', label: true}, {html: 'R<sub>1</sub> = R<sub>2</sub> = R<sub>3</sub>', kind: 'sum', hidden: true, ref: 'eq'}]},
        {at: 700, set: [['P', 0, 1, 1], ['P', 0, 2, 1], ['P', 1, 0, 1], ['P', 1, 2, 1], ['P', 2, 0, 1], ['P', 2, 1, 1]]},
        {at: 1500, clear: true, marks: [['P', '*', '*', 'is-row']], reveal: ['eq']},
        {at: 2400, clear: true, set: [['P', 1, 0, 0], ['P', 1, 1, 0], ['P', 1, 2, 0], ['P', 2, 0, 0], ['P', 2, 1, 0], ['P', 2, 2, 0]],
          marks: [['P', 1, '*', 'is-result'], ['P', 2, '*', 'is-result']],
          work: [{html: 'R<sub>2</sub> − R<sub>1</sub> = R<sub>3</sub> − R<sub>1</sub> = 0 →', label: true}, {text: '(k − 1)²', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'Kaç farklı k tekil yapar?',
      scene: {items: ['dl'], mode: 'solo'},
      answer: 2,
      check: {expr: 'len(solve(det(P), k))'},
      claims: [{expr: 'factor(det(P))', equals: '(k - 1)**2*(2*k + 1)'}],
      feedbackRight: 'Çift kök tek bir değerdir. <span class="st-math">k = 1</span> ve <span class="st-math">k = −1/2</span>.',
      feedbackWrong: '<span class="st-math">(k − 1)²</span> yalnız <span class="st-math">k = 1</span> verir, iki kez sayılmaz. Bir de <span class="st-math">k = −1/2</span>: toplam 2.',
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Kısayol: şıktaki k\'yı yerine koy',
      body: 'Şıklarda <span class="st-math">k = −1</span> var. Yerine koyunca <span class="st-math">R<sub>2</sub> = 2R<sub>3</sub></span> olur. Orantılı satırlar det\'i sıfırlar, yani <span class="st-math">(k + 1)</span> bir çarpan.',
      scene: {items: ['S'], mode: 'aug'},
      claims: [{expr: 'S.subs(k, -1).row(1) - 2*S.row(2)', equals: [[0, 0, 0]]}, {expr: 'det(S.subs(k, -1))', equals: 0}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['S', 0, 1, 'is-target'], ['S', 1, 2, 'is-target']], work: [
          {text: 'k = −1:', label: true}, {html: 'R<sub>2</sub> = 2R<sub>3</sub>', kind: 'a', hidden: true, ref: 'prop'},
          {text: '→', hidden: true, ref: 'arrow'}, {text: 'det = 0', kind: 'sum', hidden: true, ref: 'zero'},
        ]},
        {at: 700, set: [['S', 0, 1, -1], ['S', 1, 2, 2]]},
        {at: 1600, clear: true, marks: [['S', 1, '*', 'is-row'], ['S', 2, '*', 'is-row']], reveal: ['prop']},
        {at: 2500, reveal: ['arrow', 'zero']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Bir k daha A\'yı tekil yapar. Hangisi?',
      body: 'Şıkları yerine koy. Bu kez sütunlara bak.',
      scene: {items: ['S'], mode: 'aug'},
      marks: [['S', 0, 1, 'is-target'], ['S', 1, 2, 'is-target']],
      options: [
        {text: 'k = −3', value: ['-3'], tag: 'entries-zero', feedback: '<span class="st-math">k + 3 = 0</span> yalnız bir elemanı sıfırlar. Orada det 10, sıfır değil.'},
        {text: 'k = 2', value: ['2'], correct: true, feedback: 'Orantılı sütunlar da orantılı satırlar gibi det\'i sıfırlar.'},
        {text: 'k = 1', value: ['1'], tag: 'one-entry-matches', feedback: 'k = 1\'de yalnız ilk elemanlar uyuyor, sütunlar orantılı değil. det = <span class="st-math">(k + 1)(k − 2)</span> burada −2.'},
      ],
      check: {expr: 'solve(cancel(det(S) / (k + 1)), k)'},
      claims: [{expr: 'factor(det(S))', equals: '(k + 1)*(k - 2)'}, {expr: 'det(S.subs(k, -3))', equals: 10}, {expr: 'det(S.subs(k, 1))', equals: -2}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, work: [
          {text: 'k = 2:', label: true}, {text: '(2, 4, 2)', kind: 'b', hidden: true, ref: 'c2'},
          {text: '= 2·', hidden: true, ref: 'eq'}, {text: '(1, 2, 1)', kind: 'b', hidden: true, ref: 'c1'},
        ]},
        {at: 300, set: [['S', 0, 1, 2], ['S', 1, 2, 5]]},
        {at: 1300, marks: [['S', '*', 1, 'is-col']], reveal: ['c2']},
        {at: 2300, clear: true, marks: [['S', '*', 0, 'is-col'], ['S', '*', 1, 'is-col']], reveal: ['eq', 'c1']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: '4×4: R<sub>1</sub>\'i alttaki satırlardan çıkar',
      body: 'Önce R<sub>2</sub> − R<sub>1</sub>: sıfırlar belirir, det değişmez. R<sub>3</sub> ve R<sub>4</sub> için aynısını sen yapacaksın.',
      scene: {items: ['H'], mode: 'solo'},
      claims: [{expr: 'H.row(1) - H.row(0)', equals: [[0, 'k-1', 0, 1]]}],
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['H', 0, '*', 'is-row']], work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − R<sub>1</sub>', label: true}]},
        {at: 600, fly: [0, 1, 2, 3].map((j) => ({from: ['H', 0, j], to: ['H', 1, j], kind: 'row'}))},
        {at: 1400, clear: true, set: [['H', 1, 0, 0], ['H', 1, 1, 'k-1'], ['H', 1, 2, 0], ['H', 1, 3, 1]], marks: [['H', 1, '*', 'is-result']],
          work: [{html: 'yeni R<sub>2</sub> =', label: true}, {text: '(0, k − 1, 0, 1)', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '<span class="st-math">R<sub>3</sub> → R<sub>3</sub> − R<sub>1</sub></span> sonrası 3. satırın 3. elemanı?',
      scene: {items: ['H'], mode: 'solo'},
      state: {H: [[1, 1, 1, 1], [0, 'k-1', 0, 1], [1, 1, '2k', 1], [1, 1, 1, 'k+3']]},
      marks: [['H', 2, 2, 'is-target']],
      options: [
        {text: '2k', value: '2*k', tag: 'forgot-subtract', feedback: 'Bu çıkarmadan önceki sayı. R<sub>1</sub>\'in üçüncü elemanı 1, çıkarılmalı.'},
        {text: '2k − 1', value: '2*k - 1', correct: true, feedback: 'Üçüncü sütunda <span class="st-math">2k − 1</span> kalır; R<sub>3</sub>\'ün öbür elemanları 1 − 1 = 0 olur.'},
        {text: '2k + 1', value: '2*k + 1', tag: 'sign-slip', feedback: 'Çıkarma işlemi: <span class="st-math">2k − 1</span>. Eklersen R<sub>1</sub> sıfırlanmaz.'},
      ],
      check: {expr: '(H.row(2) - H.row(0))[2]'},
      claims: [{expr: 'H.row(2) - H.row(0)', equals: [[0, 0, '2k-1', 0]]}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['H', 0, '*', 'is-row']], work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>1</sub>', label: true}]},
        {at: 600, fly: [0, 1, 2, 3].map((j) => ({from: ['H', 0, j], to: ['H', 2, j], kind: 'row'}))},
        {at: 1500, clear: true, set: [['H', 2, 0, 0], ['H', 2, 1, 0], ['H', 2, 2, '2k-1'], ['H', 2, 3, 0]], marks: [['H', 2, '*', 'is-result']],
          work: [{html: 'yeni R<sub>3</sub> =', label: true}, {text: '(0, 0, 2k − 1, 0)', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: '<span class="st-math">R<sub>4</sub> → R<sub>4</sub> − R<sub>1</sub></span> sonrası 4. satırın 4. elemanı?',
      scene: {items: ['H'], mode: 'solo'},
      state: {H: [[1, 1, 1, 1], [0, 'k-1', 0, 1], [0, 0, '2k-1', 0], [1, 1, 1, 'k+3']]},
      marks: [['H', 3, 3, 'is-target']],
      options: [
        {text: 'k + 3', value: 'k + 3', tag: 'forgot-subtract', feedback: 'Bu çıkarmadan önceki sayı. Son sütunda R<sub>1</sub>\'den 1 çıkarılır.'},
        {text: 'k + 2', value: 'k + 2', correct: true, feedback: '<span class="st-math">(k + 3) − 1 = k + 2</span>. Sol üç eleman 1 − 1 = 0 olur, matris üst üçgenleşir.'},
        {text: 'k + 4', value: 'k + 4', tag: 'sign-slip', feedback: 'Çıkarma işlemi: <span class="st-math">k + 3 − 1</span>. Eklemek R<sub>4</sub>\'ü sıfırlamaz.'},
      ],
      check: {expr: '(H.row(3) - H.row(0))[3]'},
      claims: [{expr: 'H.row(3) - H.row(0)', equals: [[0, 0, 0, 'k+2']]}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['H', 0, '*', 'is-row']], work: [{html: 'R<sub>4</sub> → R<sub>4</sub> − R<sub>1</sub>', label: true}]},
        {at: 600, fly: [0, 1, 2, 3].map((j) => ({from: ['H', 0, j], to: ['H', 3, j], kind: 'row'}))},
        {at: 1500, clear: true, set: [['H', 3, 0, 0], ['H', 3, 1, 0], ['H', 3, 2, 0], ['H', 3, 3, 'k+2']], marks: [['H', 0, 0, 'is-result'], ['H', 1, 1, 'is-result'], ['H', 2, 2, 'is-result'], ['H', 3, 3, 'is-result']],
          work: [{text: 'üst üçgen: köşegeni çarp', label: true}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Hangi k değerlerinde A tekil?',
      scene: {items: ['H'], mode: 'solo'},
      state: {H: [[1, 1, 1, 1], [0, 'k-1', 0, 1], [0, 0, '2k-1', 0], [0, 0, 0, 'k+2']]},
      marks: [['H', 1, 1, 'is-target'], ['H', 2, 2, 'is-target'], ['H', 3, 3, 'is-target']],
      options: [
        {text: 'k = 0 ya da −3', value: ['0', '-3'], tag: 'diag-before-triangular', expr: 'solve(1*k*2*k*(k + 3), k)',
          feedback: 'Bu ilk matrisin köşegeni. Köşegen çarpımı ancak üçgen hale getirdikten sonra det olur.'},
        {text: 'k = 1, 1/2 ya da −2', value: ['1', '1/2', '-2'], correct: true, feedback: 'Üç köşegen çarpanından her biri ayrı bir k verir.'},
        {text: 'k = −1, −1/2 ya da 2', value: ['-1', '-1/2', '2'], tag: 'roots-sign-flipped', feedback: '<span class="st-math">k − 1 = 0</span> ise <span class="st-math">k = 1</span>. Köklerin işaretini çevirdin.'},
      ],
      check: {expr: 'solve(det(H), k)'},
      claims: [{expr: 'factor(det(H))', equals: '(k - 1)*(2*k - 1)*(k + 2)'}],
      // Pays off the opening question: each diagonal factor gives one k, collected on the work line.
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, work: [
          {text: 'tekil:', label: true}, {text: 'k = 1,', kind: 'sum', hidden: true, ref: 'r1'},
          {text: 'k = 1/2,', kind: 'sum', hidden: true, ref: 'r2'}, {text: 'k = −2', kind: 'sum', hidden: true, ref: 'r3'},
        ]},
        {at: 200, marks: [['H', 1, 1, 'is-result']], reveal: ['r1']},
        {at: 1200, marks: [['H', 2, 2, 'is-result']], reveal: ['r2']},
        {at: 2200, marks: [['H', 3, 3, 'is-result']], reveal: ['r3']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Tuzak', title: 'Hangi k değerlerinde A tekil?',
      body: 'Bir öğrenci <span class="st-math">R<sub>2</sub> → kR<sub>2</sub> − R<sub>1</sub></span> yaptı. Yeni det\'i <span class="st-math">k(k − 3)(k + 1)</span> buldu.',
      scene: {items: ['Z'], mode: 'solo'},
      options: [
        {text: 'k = 0, 3 ya da −1', value: ['0', '3', '-1'], tag: 'scaled-target-row', feedback: 'k = 0 sahte kök. R<sub>2</sub>\'yi k ile çarpmak det\'i de k ile çarptı; <span class="st-math">k = 0</span>\'da det A = −3.'},
        {text: 'k = 3 ya da −1', value: ['3', '-1'], correct: true, feedback: 'Öndeki k, satırı k ile çarpmaktan geldi; A\'nın kendi çarpanı değil.'},
        {text: 'k = −3 ya da 1', value: ['-3', '1'], tag: 'roots-sign-flipped', feedback: '<span class="st-math">k − 3 = 0</span> ise <span class="st-math">k = 3</span>. Köklerin işaretini çevirdin.'},
      ],
      check: {expr: 'solve(det(Z), k)'},
      claims: [{expr: 'det(Z2)', equals: 'k*(k - 3)*(k + 1)'}, {expr: 'det(Z.subs(k, 0))', equals: -3}, {expr: 'factor(det(Z))', equals: '(k - 3)*(k + 1)'}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, work: [{html: 'satırı k ile çarptın →', label: true}, {html: 'yeni det = k · det A', kind: 'sum'}]},
        {at: 1300, clear: true, work: [{html: 'k(k − 3)(k + 1) = k · det A →', label: true}, {html: 'det A = (k − 3)(k + 1)', kind: 'sum'}]},
        {at: 2700, clear: true, marks: [['Z', 0, 0, 'is-row'], ['Z', 1, 1, 'is-row']], work: [{html: 'kontrol: k(k − 2) − 3 =', label: true}, {text: '(k − 3)(k + 1)', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k değerleri için A tekil olur?',
      scene: {items: ['Q'], mode: 'aug'},
      options: [
        {text: 'k = 1', value: ['1'], tag: 'stopped-at-first-root', feedback: '<span class="st-math">k = 1</span> doğru ama yalnız değil. Çarpanı çıkarınca kalan <span class="st-math">5 − 2k</span> de sıfır olabilir.'},
        {text: 'k = 1 ya da 5/2', value: ['1', '5/2'], correct: true, feedback: '<span class="st-math">k = 1</span>\'de R<sub>1</sub> = R<sub>2</sub>. Çarpanı çıkarınca kalan doğrusal ifade ikinci kökü verir.'},
        {text: 'k = 1 ya da 2/5', value: ['1', '2/5'], tag: 'linear-root-inverted', feedback: '<span class="st-math">5 − 2k = 0</span> ise <span class="st-math">k = 5/2</span>. Bölmeyi ters yaptın.'},
      ],
      check: {expr: 'solve(det(Q), k)'},
      claims: [{expr: 'factor(det(Q))', equals: '(k - 1)*(5 - 2*k)'}, {expr: 'Q.row(1) - Q.row(0)', equals: [[0, 'k-1', '1-k']]}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['Q', 0, '*', 'is-row']], work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − R<sub>1</sub>', label: true}]},
        {at: 700, fly: [{from: ['Q', 0, 0], to: ['Q', 1, 0], kind: 'row'}, {from: ['Q', 0, 1], to: ['Q', 1, 1], kind: 'row'}, {from: ['Q', 0, 2], to: ['Q', 1, 2], kind: 'row'}]},
        {at: 1500, clear: true, marks: [['Q', 1, '*', 'is-target']], work: [{html: '1 − 1 = 0,  k − 1,  1 − k', label: true}]},
        {at: 2400, clear: true, set: [['Q', 1, 0, 0], ['Q', 1, 1, 'k-1'], ['Q', 1, 2, '1-k']], marks: [['Q', 1, '*', 'is-result']],
          work: [{text: 'det A =', label: true}, {text: '(k − 1)', kind: 'sum', ref: 'f'}, {text: '(5 − 2k)', kind: 'sum', hidden: true, ref: 'g'}]},
        {at: 3300, reveal: ['g']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'A hangi k değerleri için tersinir?',
      body: 'Sıfırların çok olduğu satırdan aç.',
      scene: {items: ['TV'], mode: 'solo'},
      options: [
        {text: 'k = −1, 0 ya da 1', value: 'FiniteSet(-1, 0, 1)', tag: 'singular-for-invertible', feedback: 'Bunlar A\'yı tekil yapan değerler; tersinir için dışarıda kalır.'},
        {text: 'k ≠ −1, 0, 1', value: 'Complement(Reals, FiniteSet(-1, 0, 1))', correct: true, feedback: 'det = <span class="st-math">k(k − 1)(k + 1)</span> ≠ 0 olmalı.'},
        {text: 'k ≠ −1, 1', value: 'Complement(Reals, FiniteSet(-1, 1))', tag: 'lost-factor', feedback: 'R<sub>2</sub> − 2R<sub>1</sub> = (0, k, 0): k çarpanı da var.'},
      ],
      check: {expr: 'Complement(Reals, FiniteSet(*solve(det(TV), k)))'},
      claims: [{expr: 'factor(det(TV))', equals: 'k*(k - 1)*(k + 1)'}, {expr: 'det(TV.subs(k, 0))', equals: 0}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['TV', 3, '*', 'is-row']], work: [
          {text: 'det A =', label: true}, {text: '(k + 1)', kind: 'sum', hidden: true, ref: 'f1'}, {text: '· k', kind: 'sum', hidden: true, ref: 'f2'},
          {text: '· (k − 1)', kind: 'sum', hidden: true, ref: 'f3'}, {text: '≠ 0', hidden: true, ref: 'ne'},
        ]},
        {at: 200, reveal: ['f1']},
        {at: 1300, clear: true, marks: [['TV', 1, '*', 'is-target']], reveal: ['f2']},
        {at: 2400, clear: true, marks: [['TV', 2, '*', 'is-target']], reveal: ['f3']},
        {at: 3400, clear: true, reveal: ['ne']},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'Hangi k değerleri için A tekil?',
      body: 'Şıklardaki k\'yı yerine koy: iki sütun eşit mi?',
      scene: {items: ['V'], mode: 'solo'},
      options: [
        {text: 'k = 1', value: ['1'], tag: 'stopped-at-first-root', feedback: 'k = 1 doğru ama tek değil. k = 3\'te ikinci ve üçüncü sütun eşit olur.'},
        {text: 'k = 1 ya da 3', value: ['1', '3'], correct: true, feedback: 'k = 1\'de 1. ve 2. sütun, k = 3\'te 2. ve 3. sütun eşit. Eşit iki sütun det\'i sıfırlar.'},
        {text: 'k = 1, 3 ya da 9', value: ['1', '3', '9'], tag: 'entries-as-roots', feedback: '9 yalnız bir eleman; k = 9\'da sütunlar (1, 9, 81) ve (1, 3, 9), eşit değil.'},
      ],
      check: {expr: 'solve(det(V), k)'},
      claims: [{expr: 'factor(det(V))', equals: '-2*(k - 3)*(k - 1)'}, {expr: 'det(V.subs(k, 9))', equals: -96}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, set: [['V', 1, 1, 1], ['V', 2, 1, 1]], marks: [['V', '*', 0, 'is-col'], ['V', '*', 1, 'is-col']], work: [{text: 'k = 1:', label: true}, {html: 'C<sub>1</sub> = C<sub>2</sub>', kind: 'sum'}]},
        {at: 1400, clear: true, set: [['V', 1, 1, 3], ['V', 2, 1, 9]], marks: [['V', '*', 1, 'is-col'], ['V', '*', 2, 'is-col']], work: [{text: 'k = 3:', label: true}, {html: 'C<sub>2</sub> = C<sub>3</sub>', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Tekil k = det\'in kökü',
      body: 'Önce çarpan ara: satır işlemi, şıktaki k\'yı koymak ya da üçgen yapmak. Çift kök tek değerdir. Satırı k ile çarparsan sahte k = 0 gelir.',
      scene: {items: ['mascot', 'plan']},
    },
  ],
};

/* A11 Gauss-Jordan: row-reduce [A | I] to [I | A⁻¹] (2×2, 3×3), spot the zero row (no inverse), read one entry. */
/*
 * [A | I] is drawn as two matrices with a bar between them (the engine's augmented bar only sits before the
 * last column; a full-height split is an engine request). The halves are named "sol yarı" and "sağ yarı", the
 * words the lesson teaches with, and the identity is written I₂ / I₃ next to the bar, so "|" is never read as I. A row operation acts on both halves, so it is a script beat: the scaled source row
 * flies onto the target row in both halves, then both target rows change together (the rowOp choreography).
 * "Which operation?" options are checked by the left half each operation produces; the right one gives the
 * echelon form U of A (SymPy's LU decomposition), computed independently of the lesson.
 */
LESSONS.A11 = {
  id: 'A11',
  title: 'Gauss-Jordan',
  matrices: {
    A3: {name: 'A', values: [[1, 2, 0], [2, 5, 1], [0, 1, 2]]},
    X3: {name: 'A⁻¹', values: [[9, -4, 2], [-4, 2, -1], [2, -1, 1]]},
    L: {name: 'sol yarı', values: [[1, 2], [3, 7]]},
    R: {name: 'sağ yarı', values: [[1, 0], [0, 1]]},
    L2: {name: 'sol yarı', values: [[1, 3], [2, 5]]},
    R2: {name: 'sağ yarı', values: [[1, 0], [0, 1]]},
    L3: {name: 'sol yarı', values: [[1, 2, 0], [2, 5, 1], [0, 1, 2]]},
    R3: {name: 'sağ yarı', values: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]},
    S: {name: 'sol yarı', values: [[1, 2, 1], [0, 1, 1], [1, 4, 3]]},
    KM: {name: 'A', values: [[1, 2, 1], [2, 5, 3], [1, 3, 'k']]},
    FL: {name: 'sol yarı', values: [[0, 2], [1, 3]]},
    FR: {name: 'sağ yarı', values: [[1, 0], [0, 1]]},
    GL: {name: 'sol yarı', values: [[1, 0, 0], [2, 1, 0], [3, 4, 1]]},
    GR: {name: 'sağ yarı', values: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]},
    H: {name: 'sol yarı', values: [[1, 1, 1], [1, 2, 2], [1, 2, 3]]},
    HR: {name: 'sağ yarı', values: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]},
    HA: {name: 'A', values: [[1, 1, 1], [1, 2, 2], [1, 2, 3]]},
    UL: {name: 'sol yarı', values: [[1, 4], [0, 1]]},
    UR: {name: 'sağ yarı', values: [[1, 0], [0, 1]]},
  },
  labels: {},
  steps: [
    {
      kind: 'explain', eyebrow: 'Soru', title: '3×3 bir matrisin tersi nasıl bulunur?',
      body: 'A10\'da 2×2 tersini formülle bulduk. 3×3 için satır işlemleri yeter; adım adım göreceksin.',
      scene: {items: ['A3', 'op:arrow', 'X3']},
      state: {X3: [[null, null, null], [null, null, null], [null, null, null]]},
      marks: [['X3', '*', '*', 'is-target']],
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'A\'nın yanına birim matris yaz',
      body: 'Sol yarıda A, sağ yarıda I var. Satır işlemleriyle sol yarıyı I\'ya çevir, her işlemi sağ yarıya da uygula.',
      scene: {items: ['L', 'op:|', 'R']},
      state: {R: [[null, null], [null, null]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, work: [{html: 'sol: A, sağ: I<sub>2</sub>', label: true}, {text: '⇒', hidden: true, ref: 'to'}, {html: 'sol: I<sub>2</sub>, sağ: A⁻¹', kind: 'sum', hidden: true, ref: 'goal'}]},
        {at: 800, set: [['R', 0, 0, 1], ['R', 1, 1, 1]], marks: [['R', 0, 0, 'is-target'], ['R', 1, 1, 'is-target']]},
        {at: 1700, set: [['R', 0, 1, 0], ['R', 1, 0, 0]]},
        {at: 2600, reveal: ['to', 'goal']},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'a<sub>21</sub>\'i sıfırla: R<sub>2</sub> → R<sub>2</sub> − 3R<sub>1</sub>',
      body: 'İşlem satırın tamamına uygulanır. Soldaki 3 sıfır olurken sağ yarı da değişir.',
      scene: {items: ['L', 'op:|', 'R']},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L', 0, '*', 'is-row'], ['R', 0, '*', 'is-row']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − 3R<sub>1</sub>', label: true}]},
        {at: 900, fly: [
          {from: ['L', 0, 0], to: ['L', 1, 0], kind: 'row'}, {from: ['L', 0, 1], to: ['L', 1, 1], kind: 'row'},
          {from: ['R', 0, 0], to: ['R', 1, 0], kind: 'row'}, ]},
        {at: 1900, clear: true, set: [['L', 1, 0, 0], ['L', 1, 1, 1], ['R', 1, 0, -3], ['R', 1, 1, 1]],
          marks: [['L', 1, '*', 'is-result'], ['R', 1, '*', 'is-result']]},
      ]},
      claims: [{expr: 'L.row(1) - 3*L.row(0)', equals: [[0, 1]]}, {expr: 'R.row(1) - 3*R.row(0)', equals: [[-3, 1]]}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Sıradaki işlem hangisi?',
      scene: {items: ['L', 'op:|', 'R']},
      state: {L: [[1, 2], [0, 1]], R: [[1, 0], [-3, 1]]},
      marks: [['L', 0, 1, 'is-target']],
      // Each option's value is the left half it produces; the right operation produces I.
      check: {expr: 'eye(2)'},
      options: [
        {text: 'R₂ → R₂ − 2R₁', value: [[1, 2], [-2, -3]], tag: 'wrong-target',
          feedback: 'Bu R<sub>2</sub>\'yi bozar: az önceki 0 gider. Değişmesi gereken R<sub>1</sub>.'},
        {text: 'R₁ → R₁ + 2R₂', value: [[1, 4], [0, 1]], tag: 'sign-slip',
          feedback: 'İşaret ters: 2 + 2·1 = 4 olur. 2\'yi sıfırlamak için 2R<sub>2</sub> çıkarılır.'},
        {text: 'R₁ → R₁ − 2R₂', value: [[1, 0], [0, 1]], correct: true,
          feedback: 'R<sub>2</sub>\'nin solu (0, 1): R<sub>1</sub>\'in ilk elemanına dokunmadan 2\'yi siler.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L', 1, '*', 'is-row'], ['R', 1, '*', 'is-row']],
          work: [{html: 'R<sub>1</sub> → R<sub>1</sub> − 2R<sub>2</sub>', label: true}]},
        {at: 900, fly: [
          {from: ['L', 1, 1], to: ['L', 0, 1], kind: 'row'},
          {from: ['R', 1, 0], to: ['R', 0, 0], kind: 'row'}, {from: ['R', 1, 1], to: ['R', 0, 1], kind: 'row'},
        ]},
        {at: 1900, clear: true, set: [['L', 0, 0, 1], ['L', 0, 1, 0], ['R', 0, 0, 7], ['R', 0, 1, -2]],
          marks: [['L', 0, '*', 'is-result'], ['R', 0, '*', 'is-result']]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Sol yarı I olunca sağ yarı A⁻¹',
      body: 'Sağ yarı, A\'ya yapılan bütün işlemleri biriktirir; birikime E diyelim. Sol yarı E·A = I olunca E = A⁻¹ olur.',
      scene: {items: ['L', 'op:|', 'R']},
      state: {L: [[1, 0], [0, 1]], R: [[7, -2], [-3, 1]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L', '*', '*', 'is-target']],
          work: [{html: 'E·A = I ise', label: true}, {html: 'E = A⁻¹'}, {text: 've', hidden: true, ref: 'c'}, {html: 'E·I = E = A⁻¹', kind: 'sum', hidden: true, ref: 'r'}]},
        {at: 1500, clear: true, marks: [['R', '*', '*', 'is-result']], reveal: ['c', 'r']},
      ]},
      claims: [{expr: 'inv(L)', equals: [[7, -2], [-3, 1]]}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'R<sub>2</sub> → −R<sub>2</sub> sonrası sağda 2. satır?',
      body: 'A = [[1, 3], [2, 5]] için R<sub>2</sub> → R<sub>2</sub> − 2R<sub>1</sub> yapıldı. Sıradaki işlem R<sub>2</sub> → −R<sub>2</sub>.',
      scene: {items: ['L2', 'op:|', 'R2']},
      state: {L2: [[1, 3], [0, -1]], R2: [[1, 0], [-2, 1]]},
      marks: [['L2', 1, 1, 'is-target']],
      check: {expr: 'inv(L2)[1, :]'},
      options: [
        {text: '(−2, 1)', value: [[-2, 1]], tag: 'right-half-skipped',
          feedback: 'Yalnız sol yarıyı çevirdin. İşlem satırın tamamına: sağdaki (−2, 1) de işaret değiştirir.'},
        {text: '(2, −1)', value: [[2, -1]], correct: true,
          feedback: '−1 ile çarpmak satırın her elemanının işaretini çevirir, sağ yarı dahil.'},
        {text: '(2, 1)', value: [[2, 1]], tag: 'partial-sign',
          feedback: 'Yalnız ilk elemanı çevirdin. Satırın her elemanı −1 ile çarpılır: 1 → −1.'},
      ],
      claims: [{expr: 'L2.row(1) - 2*L2.row(0)', equals: [[0, -1]]}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L2', 1, '*', 'is-row'], ['R2', 1, '*', 'is-row']],
          work: [{html: 'R<sub>2</sub> → −R<sub>2</sub>', label: true}]},
        {at: 1000, set: [['L2', 1, 1, 1], ['R2', 1, 0, 2], ['R2', 1, 1, -1]]},
        {at: 1800, clear: true, marks: [['L2', 1, '*', 'is-result'], ['R2', 1, '*', 'is-result']]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran',
      title: 'Son adım <span class="st-math">R<sub>1</sub> → R<sub>1</sub> − 3R<sub>2</sub></span>. A⁻¹\'in (1,1) elemanı?',
      scene: {items: ['L2', 'op:|', 'R2']},
      state: {L2: [[1, 3], [0, 1]], R2: [[1, 0], [2, -1]]},
      marks: [['R2', 0, 0, 'is-target']],
      check: {expr: 'inv(L2)[0, 0]'},
      options: [
        {text: '7', tag: 'sign-slip', expr: '1 + 3*2',
          feedback: 'Çıkarma yerine ekledin: <span class="st-math">1 − 3·2 = −5</span>.'},
        {text: '−5', correct: true,
          feedback: 'R<sub>2</sub>\'nin üç katı çıkar; sağda R<sub>2</sub>\'nin yeni hâli (2, −1) kullanılır.'},
        {text: '1', tag: 'right-half-skipped', expr: 'R2[0, 0]',
          feedback: 'Sağ yarıyı değiştirmedin. İşlem sağdaki 1\'den de <span class="st-math">3·2</span> çıkarır.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L2', 1, '*', 'is-row'], ['R2', 1, '*', 'is-row']],
          work: [{html: 'R<sub>1</sub> → R<sub>1</sub> − 3R<sub>2</sub>', label: true}]},
        {at: 900, fly: [
          {from: ['L2', 1, 1], to: ['L2', 0, 1], kind: 'row'},
          {from: ['R2', 1, 0], to: ['R2', 0, 0], kind: 'row'}, {from: ['R2', 1, 1], to: ['R2', 0, 1], kind: 'row'},
        ]},
        {at: 1900, clear: true, set: [['L2', 0, 1, 0], ['R2', 0, 0, -5], ['R2', 0, 1, 3]],
          marks: [['L2', 0, '*', 'is-result'], ['R2', 0, '*', 'is-result']]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Senin sıran', title: 'R<sub>1</sub> → R<sub>1</sub> − 4R<sub>2</sub> sonrası sağda (1,2) elemanı?',
      body: 'Solda sıfırlanacak sayı 4. Sağ yarı henüz I.',
      scene: {items: ['UL', 'op:|', 'UR']},
      marks: [['UL', 0, 1, 'is-target'], ['UR', 0, 1, 'is-target']],
      answer: -4,
      check: {expr: 'inv(UL)[0, 1]'},
      claims: [{expr: 'inv(UL)', equals: [[1, -4], [0, 1]]}],
      feedbackRight: 'Sağdaki R<sub>1</sub> = (1, 0) olduğundan 0 − 4·1 çıkar. A⁻¹ budur.',
      feedbackWrong: 'İşlem sağ yarıya da uygulanır: <span class="st-math">0 − 4·1 = −4</span>. Soldaki 4\'ü sıfırlamak için 4 kat çıkarılır.',
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['UL', 1, '*', 'is-row'], ['UR', 1, '*', 'is-row']], work: [{html: 'R<sub>1</sub> → R<sub>1</sub> − 4R<sub>2</sub>', label: true}]},
        {at: 1100, clear: true, set: [['UL', 0, 1, 0], ['UR', 0, 1, -4]], marks: [['UL', 0, '*', 'is-result'], ['UR', 0, '*', 'is-result']],
          work: [{html: 'sağ: 0 − 4·1 =', label: true}, {text: '−4', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: '3×3: önce köşegenin altını sıfırla',
      body: 'Plan aynı, sütun sütun ilerle. 1. sütunda a<sub>31</sub> zaten 0: tek işlem yeter.',
      scene: {items: ['L3', 'op:|', 'R3']},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L3', 0, '*', 'is-row'], ['R3', 0, '*', 'is-row']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − 2R<sub>1</sub>', label: true}]},
        {at: 900, fly: [
          {from: ['L3', 0, 0], to: ['L3', 1, 0], kind: 'row'}, {from: ['L3', 0, 1], to: ['L3', 1, 1], kind: 'row'},
          {from: ['R3', 0, 0], to: ['R3', 1, 0], kind: 'row'},
          ]},
        {at: 1900, clear: true, set: [['L3', 1, 0, 0], ['L3', 1, 1, 1], ['L3', 1, 2, 1], ['R3', 1, 0, -2]],
          marks: [['L3', 1, '*', 'is-result'], ['R3', 1, '*', 'is-result']]},
      ]},
      claims: [{expr: 'L3.row(1) - 2*L3.row(0)', equals: [[0, 1, 1]]}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Köşegenin altındaki son 1\'i hangi işlem siler?',
      scene: {items: ['L3', 'op:|', 'R3']},
      state: {L3: [[1, 2, 0], [0, 1, 1], [0, 1, 2]], R3: [[1, 0, 0], [-2, 1, 0], [0, 0, 1]]},
      marks: [['L3', 2, 1, 'is-target']],
      // Each option's value is the left half it produces; the right one reaches the echelon form U of A.
      check: {expr: 'A3.LUdecomposition()[1]'},
      options: [
        {text: 'R₃ → R₃ − R₁', value: [[1, 2, 0], [0, 1, 1], [-1, -1, 2]], tag: 'wrong-source',
          feedback: 'R<sub>1</sub>\'in başı 1: a<sub>31</sub> = 0 bozulur, −1 olur.'},
        {text: 'R₃ → R₃ − R₂', value: [[1, 2, 0], [0, 1, 1], [0, 0, 1]], correct: true,
          feedback: 'R<sub>2</sub>\'nin başı 0: 1. sütun bozulmaz.'},
        {text: 'R₂ → R₂ − R₃', value: [[1, 2, 0], [0, 0, -1], [0, 1, 2]], tag: 'above-first',
          feedback: 'Bu işlem R<sub>2</sub>\'nin köşegenini 0 yapar.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L3', 1, '*', 'is-row'], ['R3', 1, '*', 'is-row']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>2</sub>', label: true}]},
        {at: 900, fly: [
          {from: ['L3', 1, 1], to: ['L3', 2, 1], kind: 'row'},
          {from: ['L3', 1, 2], to: ['L3', 2, 2], kind: 'row'}, {from: ['R3', 1, 0], to: ['R3', 2, 0], kind: 'row'},
          {from: ['R3', 1, 1], to: ['R3', 2, 1], kind: 'row'}, ]},
        {at: 1900, clear: true, set: [['L3', 2, 1, 0], ['L3', 2, 2, 1], ['R3', 2, 0, 2], ['R3', 2, 1, -1]],
          marks: [['L3', 2, '*', 'is-result'], ['R3', 2, '*', 'is-result']]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Sonra köşegenin üstü, alttan yukarı',
      body: 'Önce R<sub>3</sub> ile üstü temizle; a<sub>13</sub> zaten 0, yalnız R<sub>2</sub> değişir. Başı 0 olan satır hazır sütunları bozmaz.',
      scene: {items: ['L3', 'op:|', 'R3']},
      state: {L3: [[1, 2, 0], [0, 1, 1], [0, 0, 1]], R3: [[1, 0, 0], [-2, 1, 0], [2, -1, 1]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L3', 2, '*', 'is-row'], ['R3', 2, '*', 'is-row']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − R<sub>3</sub>', label: true}]},
        {at: 900, fly: [
          {from: ['L3', 2, 2], to: ['L3', 1, 2], kind: 'row'}, {from: ['R3', 2, 0], to: ['R3', 1, 0], kind: 'row'},
          {from: ['R3', 2, 1], to: ['R3', 1, 1], kind: 'row'}, {from: ['R3', 2, 2], to: ['R3', 1, 2], kind: 'row'},
        ]},
        {at: 1900, clear: true, set: [['L3', 1, 2, 0], ['R3', 1, 0, -4], ['R3', 1, 1, 2], ['R3', 1, 2, -1]],
          marks: [['L3', 1, '*', 'is-result'], ['R3', 1, '*', 'is-result']]},
      ]},
      claims: [{expr: 'Matrix([[-2, 1, 0]]) - Matrix([[2, -1, 1]])', equals: [[-4, 2, -1]]}, {expr: 'inv(A3)[1, :]', equals: [[-4, 2, -1]]}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran',
      title: 'Son adım <span class="st-math">R<sub>1</sub> → R<sub>1</sub> − 2R<sub>2</sub></span>. A⁻¹\'in 1. satırı?',
      scene: {items: ['L3', 'op:|', 'R3']},
      state: {L3: [[1, 2, 0], [0, 1, 0], [0, 0, 1]], R3: [[1, 0, 0], [-4, 2, -1], [2, -1, 1]]},
      marks: [['R3', 0, '*', 'is-target']],
      check: {expr: 'inv(A3)[0, :]'},
      options: [
        {text: '(−7, 4, −2)', value: [[-7, 4, -2]], tag: 'sign-slip',
          feedback: 'Çıkarma yerine ekledin: <span class="st-math">1 + 2·(−4) = −7</span>. İşlem −2R<sub>2</sub>.'},
        {text: '(5, −2, 0)', value: [[5, -2, 0]], tag: 'stale-row',
          feedback: 'R<sub>2</sub>\'nin eski hâlini kullandın. Sağda R<sub>2</sub> artık (−4, 2, −1).'},
        {text: '(9, −4, 2)', value: [[9, -4, 2]], correct: true,
          feedback: 'R<sub>2</sub>\'nin son hâli kullanılır; sağdaki (1, 0, 0)\'dan iki katı çıkar.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['L3', 1, '*', 'is-row'], ['R3', 1, '*', 'is-row']],
          work: [{html: 'R<sub>1</sub> → R<sub>1</sub> − 2R<sub>2</sub>', label: true}]},
        {at: 900, fly: [
          {from: ['L3', 1, 1], to: ['L3', 0, 1], kind: 'row'},
          {from: ['R3', 1, 0], to: ['R3', 0, 0], kind: 'row'},
          {from: ['R3', 1, 1], to: ['R3', 0, 1], kind: 'row'}, {from: ['R3', 1, 2], to: ['R3', 0, 2], kind: 'row'},
        ]},
        {at: 1900, clear: true, set: [['L3', 0, 1, 0], ['R3', 0, 0, 9], ['R3', 0, 1, -4], ['R3', 0, 2, 2]],
          marks: [['L3', 0, '*', 'is-result'], ['R3', 0, '*', 'is-result']]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Kural', title: 'Sol I oldu: sağ yarı A⁻¹',
      body: 'Kontrol et: A\'nın 1. satırı ile A⁻¹\'in 1. sütunu 1 vermeli. Formül gerekmedi.',
      scene: {items: ['A3', 'op:arrow', 'X3']},
      state: {X3: [[null, null, null], [null, null, null], [null, null, null]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, set: [['X3', 0, 0, 9], ['X3', 0, 1, -4], ['X3', 0, 2, 2]]},
        {at: 600, set: [['X3', 1, 0, -4], ['X3', 1, 1, 2], ['X3', 1, 2, -1]]},
        {at: 1200, set: [['X3', 2, 0, 2], ['X3', 2, 1, -1], ['X3', 2, 2, 1]], marks: [['X3', '*', '*', 'is-result']]},
        {at: 2200, clear: true, marks: [['A3', 0, '*', 'is-row'], ['X3', '*', 0, 'is-col']],
          work: [{html: 'kontrol:', label: true}, {text: '1·9 + 2·(−4) + 0·2'}, {text: '='}, {text: '1', kind: 'sum'}]},
      ]},
      claims: [{expr: 'inv(A3)', equals: [[9, -4, 2], [-4, 2, -1], [2, -1, 1]]}, {expr: '(A3*X3)[0, 0]', equals: 1}],
    },
    {
      kind: 'explain', eyebrow: 'Tuzak', title: 'Solda sıfır satır çıkarsa ters yok',
      body: 'Satır işlemleri rankı değiştirmez. Sıfır satır rank < 3 demek: sol yarı I olamaz, A tekil. Bunu sol yarı tek başına söyler.',
      scene: {items: ['S'], mode: 'aug'},
      state: {S: [[1, 2, 1], [0, 1, 1], [0, 2, 2]]},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['S', 1, '*', 'is-row']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − 2R<sub>2</sub>', label: true}, {html: 'sıfır satır ⇒ A⁻¹ yok', kind: 'sum', hidden: true, ref: 'r'}]},
        {at: 900, fly: [
          {from: ['S', 1, 1], to: ['S', 2, 1], kind: 'row'},
          {from: ['S', 1, 2], to: ['S', 2, 2], kind: 'row'},
        ]},
        {at: 1900, clear: true, set: [['S', 2, 1, 0], ['S', 2, 2, 0]], marks: [['S', 2, '*', 'is-wrong']]},
        {at: 2800, reveal: ['r']},
      ]},
      claims: [{expr: 'det(S)', equals: 0}, {expr: 'S.row(2) - S.row(0)', equals: [[0, 2, 2]]}],
    },
    {
      kind: 'choice', eyebrow: 'Senin sıran', title: 'Hangi k için sol yarı I olamaz?',
      body: 'Köşegenin altını sıfırla, son satıra bak.',
      scene: {items: ['KM'], mode: 'solo'},
      check: {expr: 'solve(det(KM), k)'},
      options: [
        {text: 'k = 1', value: ['1'], tag: 'stopped-early',
          feedback: 'R<sub>3</sub> − R<sub>1</sub> sonrası (0, 1, k − 1) henüz bitmedi. R<sub>3</sub> − R<sub>2</sub> ile (0, 0, k − 2) olur.'},
        {text: 'k = 2', value: ['2'], correct: true,
          feedback: 'Son satırın tek elemanı sıfırlanınca satırın tamamı sıfır olur: ters yok.'},
        {text: 'k = 0', value: ['0'], tag: 'zero-entry',
          feedback: 'Matristeki tek bir 0 tersi yok etmez. Ölçüt, son satırın tamamen 0 olması.'},
      ],
      claims: [{expr: 'det(KM)', equals: 'k - 2'}],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['KM', 0, '*', 'is-row']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − 2R<sub>1</sub>', label: true}]},
        {at: 1000, clear: true, set: [['KM', 1, 0, 0], ['KM', 1, 1, 1], ['KM', 1, 2, 1]], marks: [['KM', 1, '*', 'is-result']]},
        {at: 2000, clear: true, marks: [['KM', 0, '*', 'is-row']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>1</sub>', label: true}]},
        {at: 3000, clear: true, set: [['KM', 2, 0, 0], ['KM', 2, 1, 1], ['KM', 2, 2, 'k-1']], marks: [['KM', 2, '*', 'is-result']]},
        {at: 4000, clear: true, marks: [['KM', 1, '*', 'is-row']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>2</sub>', label: true}]},
        {at: 5000, clear: true, set: [['KM', 2, 1, 0], ['KM', 2, 2, 'k-2']], marks: [['KM', 2, 2, 'is-target']]},
        {at: 6000, clear: true, marks: [['KM', 2, '*', 'is-target']], work: [{html: 'k = 2 ise', label: true}, {html: 'sıfır satır, ters yok'}]},
      ]},
    },
    {
      kind: 'explain', eyebrow: 'Sezgi', title: 'Köşegende 0 varsa satırları değiştir',
      body: 'Satır değiştirme de bir satır işlemi: iki yarıda birden yapılır. Sonra köşegen 1 olana kadar satırı bir sayıyla çarp.',
      scene: {items: ['FL', 'op:|', 'FR']},
      beat: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['FL', 0, '*', 'is-row'], ['FR', 0, '*', 'is-row'], ['FL', 1, '*', 'is-target'], ['FR', 1, '*', 'is-target']],
          work: [{html: 'R<sub>1</sub> ↔ R<sub>2</sub>', label: true}]},
        {at: 900, fly: [
          {from: ['FL', 0, 0], to: ['FL', 1, 0], kind: 'row'}, {from: ['FL', 0, 1], to: ['FL', 1, 1], kind: 'row'},
          {from: ['FL', 1, 0], to: ['FL', 0, 0], kind: 'row'}, {from: ['FL', 1, 1], to: ['FL', 0, 1], kind: 'row'},
          {from: ['FR', 0, 0], to: ['FR', 1, 0], kind: 'row'}, {from: ['FR', 0, 1], to: ['FR', 1, 1], kind: 'row'},
          {from: ['FR', 1, 0], to: ['FR', 0, 0], kind: 'row'}, {from: ['FR', 1, 1], to: ['FR', 0, 1], kind: 'row'},
        ]},
        {at: 1900, clear: true,
          set: [['FL', 0, 0, 1], ['FL', 0, 1, 3], ['FL', 1, 0, 0], ['FL', 1, 1, 2], ['FR', 0, 0, 0], ['FR', 0, 1, 1], ['FR', 1, 0, 1], ['FR', 1, 1, 0]],
          marks: [['FL', '*', '*', 'is-result'], ['FR', '*', '*', 'is-result']], work: [{text: 'iki yarıda da satırlar yer değiştirdi', label: true}]},
      ]},
      claims: [{expr: 'FL.row(1)', equals: [[1, 3]]}],
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'A⁻¹\'in (1,1) elemanı kaç?',
            scene: {items: ['FL', 'op:|', 'FR']},
      check: {expr: 'inv(FL)[0, 0]'},
      options: [
        {text: '3/2', tag: 'sign-slip', expr: '-inv(FL)[0, 0]',
          feedback: 'R<sub>1</sub> − 3R<sub>2</sub>\'de 3·(1/2) çıkar, eklenmez.'},
        {text: '−3/2', correct: true,
          feedback: 'Üç işlem de satırın tamamına uygulandı.'},
        {text: '−3', tag: 'right-half-skipped',
          feedback: '(1/2)R<sub>2</sub> sağ yarıya da uygulanır: 1 değil 1/2.'},
        {text: '1', tag: 'swap-left-only',
          feedback: 'Satırları yalnız solda değiştirdin; sağ yarı da yer değiştirir.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['FL', 0, '*', 'is-row'], ['FR', 0, '*', 'is-row'], ['FL', 1, '*', 'is-row'], ['FR', 1, '*', 'is-row']],
          work: [{html: 'R<sub>1</sub> ↔ R<sub>2</sub>', label: true}]},
        {at: 1000, clear: true,
          set: [['FL', 0, 0, 1], ['FL', 0, 1, 3], ['FL', 1, 0, 0], ['FL', 1, 1, 2], ['FR', 0, 0, 0], ['FR', 0, 1, 1], ['FR', 1, 0, 1], ['FR', 1, 1, 0]],
          marks: [['FL', 0, '*', 'is-result'], ['FR', 0, '*', 'is-result'], ['FL', 1, '*', 'is-result'], ['FR', 1, '*', 'is-result']]},
        {at: 2000, clear: true, marks: [['FL', 1, '*', 'is-row'], ['FR', 1, '*', 'is-row']],
          work: [{html: 'R<sub>2</sub> → (1/2)R<sub>2</sub>', label: true}]},
        {at: 3000, clear: true, set: [['FL', 1, 1, 1], ['FR', 1, 0, '1/2']], marks: [['FL', 1, '*', 'is-result'], ['FR', 1, '*', 'is-result']]},
        {at: 4000, clear: true, marks: [['FL', 1, '*', 'is-row'], ['FR', 1, '*', 'is-row']],
          work: [{html: 'R<sub>1</sub> → R<sub>1</sub> − 3R<sub>2</sub>', label: true}]},
        {at: 5000, clear: true, set: [['FL', 0, 1, 0], ['FR', 0, 0, '-3/2']], marks: [['FL', 0, '*', 'is-result'], ['FR', 0, '*', 'is-result']],
          work: [{html: '0 − 3·(1/2) =', label: true}, {text: '−3/2', kind: 'sum'}]},
        {at: 6000, clear: true, marks: [['FR', 0, 0, 'is-result']]},
      ]},
    },
    {
      kind: 'choice', eyebrow: 'Sınav tipi', title: 'A⁻¹\'in (3,1) elemanı kaç?',
      scene: {items: ['GL', 'op:|', 'GR']},
      check: {expr: 'inv(GL)[2, 0]'},
      options: [
        {text: '−3', tag: 'negated-entry', expr: '-GL[2, 0]',
          feedback: 'İşaret çevirmek yetmez: R<sub>3</sub> − 4R<sub>2</sub> bir katkı daha getirir.'},
        {text: '5', correct: true,
          feedback: 'Sağdaki R<sub>3</sub>\'ten yeni R<sub>2</sub>\'nin 4 katı çıkar.'},
        {text: '−11', tag: 'sign-slip', expr: '-3 + 4*(-2)',
          feedback: '−4·(−2) = +8: eksiyle eksiyi karıştırdın.'},
      ],
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, marks: [['GL', 0, '*', 'is-row'], ['GR', 0, '*', 'is-row']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − 2R<sub>1</sub>', label: true}]},
        {at: 1000, clear: true, set: [['GL', 1, 0, 0], ['GR', 1, 0, -2]], marks: [['GL', 1, '*', 'is-result'], ['GR', 1, '*', 'is-result']]},
        {at: 2000, clear: true, marks: [['GL', 0, '*', 'is-row'], ['GR', 0, '*', 'is-row']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − 3R<sub>1</sub>', label: true}]},
        {at: 3000, clear: true, set: [['GL', 2, 0, 0], ['GR', 2, 0, -3]], marks: [['GL', 2, '*', 'is-result'], ['GR', 2, '*', 'is-result']]},
        {at: 4000, clear: true, marks: [['GL', 1, '*', 'is-row'], ['GR', 1, '*', 'is-row']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − 4R<sub>2</sub>', label: true}]},
        {at: 5000, clear: true, set: [['GL', 2, 1, 0], ['GR', 2, 0, 5], ['GR', 2, 1, -4]], marks: [['GL', 2, '*', 'is-result'], ['GR', 2, '*', 'is-result']],
          work: [{html: '−3 − 4·(−2) =', label: true}, {text: '5', kind: 'sum'}]},
        {at: 6000, clear: true, marks: [['GR', 2, 0, 'is-result']]},
      ]},
    },
    {
      kind: 'keypad', eyebrow: 'Sınav tipi', title: 'iz(A⁻¹) kaç?',
      body: 'Gauss-Jordan ile A⁻¹\'i bul, köşegenini topla.',
      scene: {items: ['H', 'op:|', 'HR']},
      check: {expr: 'tr(inv(HA))'},
      answer: 5,
      claims: [{expr: 'inv(HA)', equals: [[2, -1, 0], [-1, 2, -1], [0, -1, 1]]}],
      feedbackRight: 'A⁻¹\'in köşegeni 2, 2 ve 1 çıkar; toplamı 5.',
      feedbackWrong: 'A⁻¹\'in köşegeni 2, 2 ve 1: <span class="st-math">iz(A⁻¹) = 5</span>. iz(A) = 6\'dan türetilemez.',
      reveal: {type: 'script', frames: [
        {at: 0, clear: true, set: [['H', 1, 0, 0], ['H', 1, 1, 1], ['H', 1, 2, 1], ['HR', 1, 0, -1]], marks: [['H', 1, '*', 'is-result'], ['HR', 1, '*', 'is-result']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − R<sub>1</sub>', label: true}]},
        {at: 1000, clear: true, set: [['H', 2, 0, 0], ['H', 2, 1, 1], ['H', 2, 2, 2], ['HR', 2, 0, -1]], marks: [['H', 2, '*', 'is-result'], ['HR', 2, '*', 'is-result']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>1</sub>', label: true}]},
        {at: 2000, clear: true, set: [['H', 2, 1, 0], ['H', 2, 2, 1], ['HR', 2, 0, 0], ['HR', 2, 1, -1]], marks: [['H', 2, '*', 'is-result'], ['HR', 2, '*', 'is-result']],
          work: [{html: 'R<sub>3</sub> → R<sub>3</sub> − R<sub>2</sub>', label: true}]},
        {at: 3000, clear: true, set: [['H', 1, 2, 0], ['HR', 1, 0, -1], ['HR', 1, 1, 2], ['HR', 1, 2, -1]], marks: [['H', 1, '*', 'is-result'], ['HR', 1, '*', 'is-result']],
          work: [{html: 'R<sub>2</sub> → R<sub>2</sub> − R<sub>3</sub>', label: true}]},
        {at: 4000, clear: true, set: [['H', 0, 2, 0], ['HR', 0, 0, 1], ['HR', 0, 1, 1], ['HR', 0, 2, -1]], marks: [['H', 0, '*', 'is-result'], ['HR', 0, '*', 'is-result']],
          work: [{html: 'R<sub>1</sub> → R<sub>1</sub> − R<sub>3</sub>', label: true}]},
        {at: 5000, clear: true, set: [['H', 0, 1, 0], ['HR', 0, 0, 2], ['HR', 0, 1, -1], ['HR', 0, 2, 0]], marks: [['HR', 0, 0, 'is-result'], ['HR', 1, 1, 'is-result'], ['HR', 2, 2, 'is-result']],
          work: [{html: 'R<sub>1</sub> → R<sub>1</sub> − R<sub>2</sub>:', label: true}, {text: '2 + 2 + 1 = 5', kind: 'sum'}]},
      ]},
    },
    {
      kind: 'summary', eyebrow: 'Özet', title: 'Sol yarı I, sağ yarı A⁻¹',
      body: 'İşlemi satırın tamamına uygula. Önce köşegenin altı, sonra üstü; köşegende 0 varsa satır değiştir. ' +
        'Solda sıfır satır çıkarsa ters yok.',
      scene: {items: ['mascot'], mode: 'solo'},
    },
  ],
};


// lab rebuild: python3 work/sound/build.py
/* satir-sound.js: Satır's sound language. One harmonic system, synthesised with Web Audio (no audio files).
 *
 *   SatirSound.init()                Call from a touchend or click handler (iOS counts those as gestures). Creates
 *                                    the AudioContext and unlocks it. Does nothing while muted. After that, any tap
 *                                    (touchend, pointerup, click, keydown) resumes a context that was parked (idle 30 s,
 *                                    mute), backgrounded or interrupted (a call, Siri).
 *   SatirSound.play(event, context)  Call on the frame where a value settles; sound never plays on its own.
 *                                    event: a key of EVENTS. context: { step, steps } (lesson position, picks the
 *                                    chord), index (cell or option number), when (AudioContext time, default now),
 *                                    chord (a CHORDS id, overrides the position), atMs (page-clock time, the
 *                                    performance.now() of the frame the sound must be heard on). Call it at least
 *                                    SatirSound.lead seconds before that frame. Returns the schedule
 *                                    { t0, end, chords, notes } (AudioContext time), or null when muted, locked or
 *                                    parked: then the call is held and plays at atMs once a tap resumes the context.
 *   SatirSound.lead                  Output latency in s (≈0.01 on a speaker, 0.15–0.25 on Bluetooth).
 *   SatirSound.plan(event, context)  The same schedule without sound (visual twins, tests); never changes play().
 *   SatirSound.muted / setMuted(b)   Persisted in localStorage 'satir-sound' (try/catch). Default: muted (opt-in).
 *   SatirSound.setAmbient(b)         The optional quiet pad (default off, kept by the app). Plays only when unlocked, unmuted and visible.
 *   SatirSound.palette / setPalette(id), stopAll(), context
 *   SatirSound.createEngine(ctx, o)  The synth on any (Offline)AudioContext; measure() and calibrate() use it.
 *
 * Musical meaning lives in two tables: CHORDS (harmony) and EVENTS (what each event plays). Event gains come from
 * TRIM, which calibrate() generates (loudness-matched per palette). Nothing is tuned at a call site.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SatirSound = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ---------- Pitch and spelling. Every pitch is semitones from D♭4 (MIDI 61). ---------- */
  const KEY = 61;
  const KEY_LETTER = 1;  // D: chords are spelled by scale degree from D♭
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const NATURAL = [0, 2, 4, 5, 7, 9, 11];
  const FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
  const MAJOR_DEGREE = {0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7};
  const mod = (x, m) => ((x % m) + m) % m;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const dbToGain = (d) => Math.pow(10, d / 20);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  // mulberry32: a full-period 32-bit PRNG (reverb noise must not repeat audibly).
  const prng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // A double accidental falls back to the common enharmonic (♭VI in D♭ is written A, as charts do).
  function spell(degree, semis) {
    const li = (KEY_LETTER + degree - 1) % 7, pc = mod(KEY + semis, 12);
    let acc = pc - NATURAL[li];
    if (acc > 6) acc -= 12;
    if (acc < -6) acc += 12;
    if (Math.abs(acc) > 1) return FLAT[pc];
    return LETTERS[li] + (acc < 0 ? '♭' : acc > 0 ? '♯' : '');
  }
  const toneName = (x) => (MAJOR_DEGREE[mod(x, 12)] ? spell(MAJOR_DEGREE[mod(x, 12)], x) : FLAT[mod(KEY + x, 12)]);

  /* ---------- Harmony ----------
     n: rootless voicing (3rd and 7th always present), semitones above D♭4, found by a search for
     the least total voice movement along PROGRESSION; the top voice only rocks between E♭5 and F5, so the walk is
     heard as colour, not as a melody. bass: the root, under it. arp: chord tones stacked in thirds above the root
     (no semitone or tritone between neighbours), used by the reward arpeggios. */
  const CHORDS = {
    I: {degree: 1, root: 0, q: 'maj9', roman: 'I', fn: 'tonik', bass: -12, n: [4, 7, 11, 14], arp: [0, 4, 7, 11, 14]},
    IV: {degree: 4, root: 5, q: 'maj9', roman: 'IV', fn: 'subdominant', bass: -7, n: [7, 9, 12, 16], arp: [0, 4, 7, 11, 14]},
    iii: {degree: 3, root: 4, q: 'm11', roman: 'iii', fn: 'tonik rengi', bass: -8, n: [7, 9, 11, 14], arp: [0, 3, 7, 10, 17]},
    vi: {degree: 6, root: 9, q: 'm9', roman: 'vi', fn: 'tonik rengi', bass: -15, n: [7, 11, 12, 16], arp: [0, 3, 7, 10, 14]},
    ii: {degree: 2, root: 2, q: 'm9', roman: 'ii', fn: 'subdominant', bass: -10, n: [5, 9, 12, 16], arp: [0, 3, 7, 10, 14]},
    V: {degree: 5, root: 7, q: '13', roman: 'V', fn: 'dominant', bass: -17, n: [5, 9, 11, 16], arp: [0, 4, 7, 10, 14]},
    iv: {degree: 4, root: 5, q: 'm9', roman: 'iv', fn: 'minör subdominant', bass: -7, n: [8, 12, 15, 19], arp: [0, 3, 7, 10, 14]},
    bVII: {degree: 7, root: 10, q: '13', roman: '♭VII', fn: 'arka kapı dominantı', bass: -14, n: [8, 12, 14, 19], arp: [0, 4, 7, 10, 14, 21]},
    bVI: {degree: 6, root: 8, q: 'maj7♯11', roman: '♭VI', fn: 'ödünç renk', bass: -16, n: [3, 7, 12, 14], arp: [0, 4, 7, 11, 18]},
    Is11: {degree: 1, root: 0, q: 'maj7♯11', roman: 'I♯11', fn: 'lidyen tonik', bass: -12, n: [4, 7, 11, 18], arp: [0, 4, 7, 11, 18]},
  };
  // A lesson walks this line, one chord per slice of its steps: I–IV, then the diatonic circle of fifths
  // iii–vi–ii–V. The lesson end closes it with ii–V–I.
  const PROGRESSION = ['I', 'IV', 'iii', 'vi', 'ii', 'V'];
  const chordAt = (step, steps) => (step == null || !steps ? 'I'
    : PROGRESSION[clamp(Math.floor((step * PROGRESSION.length) / steps), 0, PROGRESSION.length - 1)]);
  const chordName = (id) => spell(CHORDS[id].degree, CHORDS[id].root) + CHORDS[id].q;

  // Suspension: the 3rd starts on the 4th and falls into place; a maj7 starts on the root (else the 4th makes a
  // tritone with it). A voice already on the 4th (m11) is null: it enters only with the resolution, so the
  // suspended chord has no 3rd at all and really sounds open.
  function susOf(c, n) {
    const ivs = n.map((x) => mod(x - c.root, 12)), has3 = ivs.some((iv) => iv === 3 || iv === 4);
    return n.map((x, i) => {
      const iv = ivs[i];
      if (iv === 3 || iv === 4) return x + 5 - iv;
      if (iv === 11) return x + 1;
      if (iv === 5 && has3) return null;
      return x;
    });
  }
  function susName(c, s) {
    const ivs = new Set(s.filter((x) => x != null).map((x) => mod(x - c.root, 12))), root = spell(c.degree, c.root);
    if (ivs.has(3) || ivs.has(4)) return root + c.q.replace(/\d+$/, '') + '(add11)';
    const ext = ivs.has(10) ? (ivs.has(9) ? '13' : ivs.has(2) ? '9' : '7') : '';
    return root + ext + 'sus4' + (!ext && ivs.has(2) ? '(9)' : '');
  }
  // Inside one event, the next chord takes the inversion of its voicing that moves the voices least.
  function nearest(n, prev) {
    const opts = [n];
    for (let k = 1; k < n.length; k++) {
      opts.push([...n.slice(k), ...n.slice(0, k).map((x) => x + 12)].sort((a, b) => a - b));
      opts.push([...n.slice(n.length - k).map((x) => x - 12), ...n.slice(0, n.length - k)].sort((a, b) => a - b));
    }
    const ok = (v) => v[0] >= 2 && v[v.length - 1] <= 19 && v[v.length - 1] - v[v.length - 2] > 1
      && v.every((x, i) => v.every((y, j) => j <= i || y - x !== 13));
    const cost = (v) => v.reduce((s, x, i) => s + Math.abs(x - prev[i]), 0);
    return opts.filter(ok).reduce((best, v) => (cost(v) < cost(best) ? v : best), n);
  }

  /* ---------- Events: the one table of musical meaning ----------
     tier: how often it happens. loud: loudness target (LUFS, BS.1770 momentary max, full volume); frequent sounds are
     quietest. cut: tone low-pass (Hz). wet: reverb send. seq: the chords it plays ('step' = the lesson's chord now);
     the next chord comes after `gap` s, or right after an arpeggio. Per chord: part (one tone | guide tones | all),
     sus (resolve: the suspension falls into the chord after `resolve` s | hold: it stays open), bass, roll (s between
     voices, rising), dur (ring time to −80 dB), bloom (slow pad swell), halo (octave shimmer), arp (rising chord-tone
     arpeggio: count, from, at), felt (a soft contact thump). */
  const ITEM = {part: 'all', vel: 0.44, roll: 0.035, bass: 0.45, dur: 2, bloom: 0, halo: 0, resolve: 0.38};
  const EVENTS = {
    select: {tier: 'frequent', loud: -45, cut: 4200, wet: 0.8, seq: [{chord: 'step', part: 'one', pick: 'wander', bass: 0, dur: 1.3, vel: 0.5}]},
    land: {tier: 'frequent', loud: -43, cut: 3400, wet: 0.8, seq: [{chord: 'step', part: 'one', pick: 'cell', bass: 0.35, felt: 0.4, dur: 1.7, vel: 0.55}]},
    merge: {tier: 'frequent', loud: -41, cut: 3800, wet: 0.9, seq: [{chord: 'step', part: 'guide', bass: 0, roll: 0.06, dur: 2, vel: 0.48}]},
    wrong: {tier: 'question', loud: -37, cut: 2100, wet: 1, seq: [{chord: 'step', sus: 'hold', roll: 0.045, bass: 0.4, dur: 2.2, bloom: 0.2, vel: 0.42}]},
    correct: {tier: 'question', loud: -32, cut: 4600, wet: 1, seq: [{chord: 'step', sus: 'resolve', dur: 3, bloom: 0.5, vel: 0.46}]},
    streak: {tier: 'question', loud: -31, cut: 5200, wet: 1.1, seq: [{chord: 'step', sus: 'resolve', dur: 3.2, bloom: 0.5, vel: 0.46, arp: {count: 3, from: 2, at: 0.62}}]},
    lessonEnd: {tier: 'lesson', loud: -28, cut: 5000, wet: 1.1, gap: 0.9, seq: [{chord: 'ii', dur: 1.6}, {chord: 'V', dur: 1.6}, {chord: 'I', dur: 4.2, bloom: 0.8}]},
    seal: {tier: 'reward', loud: -28, cut: 5600, wet: 1.2, seq: [{chord: 'V', sus: 'hold', dur: 1.8, bloom: 0.3, arp: {count: 4}}, {chord: 'I', dur: 4.4, bloom: 0.8, halo: 0.4}]},
    halfway: {tier: 'reward', loud: -27, cut: 5600, wet: 1.2, seq: [{chord: 'iv', dur: 2, bloom: 0.3, arp: {count: 5}}, {chord: 'I', dur: 4.8, bloom: 0.8, halo: 0.5}]},
    milestone: {tier: 'reward', loud: -26, cut: 6000, wet: 1.3, gap: 1, seq: [{chord: 'iv', dur: 1.8}, {chord: 'bVII', dur: 2.2, bloom: 0.3, arp: {count: 6}}, {chord: 'I', dur: 5, bloom: 1, halo: 0.8}]},
    secret: {tier: 'reward', loud: -27, cut: 6400, wet: 1.3, seq: [{chord: 'bVI', dur: 2.4, bloom: 0.5, arp: {count: 5}}, {chord: 'Is11', dur: 4.6, bloom: 0.9, halo: 0.8}]},
  };
  const ARP_STEP = 0.14;  // s between arpeggio notes, slowing by ARP_RIT each note: unhurried, never a coin
  const ARP_RIT = 1.07;
  const LAND_ORDER = [3, 1, 2, 0];  // voices for consecutive cells: a zigzag, never a ladder

  /* ---------- Palettes: timbre only; harmony and timing are shared, so a comparison is fair. ---------- */
  const PALETTES = {
    rhodes: {id: 'rhodes', name: 'Rhodes', voice: 'epiano', pad: 1, wet: 0.3, cut: 1},
    felt: {id: 'felt', name: 'Keçe piyano', voice: 'felt', pad: 0.8, wet: 0.34, cut: 0.9},
    glass: {id: 'glass', name: 'Cam', voice: 'glass', pad: 1.15, wet: 0.36, cut: 1.1},
  };
  /* Bus gain (dB) per palette and event that meets EVENTS.loud. Generated by calibrate(); re-run it after any change
     to a voice, a chord, an event or a target. */
  const TRIM = {
    rhodes: {select: -30.4, land: -30.7, merge: -30.1, wrong: -28.8, correct: -24.2, streak: -23.3, lessonEnd: -21.7, seal: -20.9, halfway: -20, milestone: -19.2, secret: -20.8},
    felt: {select: -30.7, land: -30.9, merge: -30.5, wrong: -29, correct: -24.6, streak: -23.7, lessonEnd: -21.7, seal: -21.7, halfway: -20.3, milestone: -19.5, secret: -20.6},
    glass: {select: -28.7, land: -29.1, merge: -28.6, wrong: -27.2, correct: -22.8, streak: -21.8, lessonEnd: -20.5, seal: -20.4, halfway: -18.8, milestone: -17.7, secret: -19.4},
  };

  /* ---------- Plan: an event and its context → notes and chord names. No audio here. ---------- */
  function createPerformer(rnd) {
    const state = {sel: -1, land: 0};
    function plan(name, cx, t0) {
      const spec = EVENTS[name];
      if (!spec) return null;
      cx = cx || {};
      const stepId = CHORDS[cx.chord] ? cx.chord : chordAt(cx.step, cx.steps);
      const notes = [], chords = [];
      let t = t0 || 0, prev = null, harm = '*', end = t;
      const note = (o) => {
        // Higher notes ring shorter, as on a real instrument.
        o.dur *= clamp(1 - (KEY + o.midi - 66) * 0.012, 0.6, 1.25);
        notes.push(o);
        end = Math.max(end, o.t + o.dur);
      };
      spec.seq.forEach((raw) => {
        const it = Object.assign({}, ITEM, raw), id = it.chord === 'step' ? stepId : it.chord, c = CHORDS[id];
        const n = prev ? nearest(c.n, prev) : c.n.slice(), s = it.sus ? susOf(c, n) : n;
        const role = (x) => ([0, 3, 4, 7, 10, 11].includes(mod(x - c.root, 12)) ? 'chord' : 'tension');
        const label = {t, id, name: chordName(id), roman: c.roman, fn: c.fn};
        if (spec.seq.length === 1) harm = id + (it.sus === 'hold' ? ':sus' : '');
        if (it.bass) note({kind: 'main', midi: c.bass, t, dur: it.dur * 1.1, vel: it.vel * it.bass, bright: 0.05, role: 'bass'});
        if (it.felt) notes.push({kind: 'felt', t, dur: 0.04, vel: it.felt});
        let bloomAt = t;
        if (it.part === 'one') {
          let v;
          if (it.pick === 'wander') {  // one of the top three voices, never the same twice, never a climb
            if (cx.index != null) v = mod(cx.index, 3);
            else { v = Math.floor(rnd() * 2); if (v >= state.sel) v += 1; }
            state.sel = v;
            v += 1;
          } else v = LAND_ORDER[mod(cx.index != null ? cx.index : state.land++, LAND_ORDER.length)];
          note({kind: 'main', midi: n[v], t, dur: it.dur, vel: it.vel, bright: 0.3, role: 'tone'});
          label.tones = toneName(n[v]);
        } else if (it.part === 'guide') {
          const g = n.filter((x) => [3, 4, 10, 11].includes(mod(x - c.root, 12)));
          g.forEach((x, i) => note({kind: 'main', midi: x, t: t + i * it.roll, dur: it.dur, vel: it.vel, bright: 0.28, role: 'chord'}));
          label.tones = g.map(toneName).join(' + ');
        } else {
          const at = t + it.resolve;
          s.forEach((x, i) => {
            const tv = t + i * it.roll;  // the lowest voice starts on the contact frame
            if (x === n[i]) note({kind: 'main', midi: x, t: tv, dur: it.dur, vel: it.vel, bright: it.sus === 'hold' ? 0.12 : 0.3, role: role(x)});
            else if (it.sus === 'resolve') {
              if (x != null) note({kind: 'main', midi: x, t: tv, dur: it.resolve + 0.16, vel: it.vel, bright: 0.3, role: 'lean'});
              note({kind: 'main', midi: n[i], t: at + i * 0.012, dur: it.dur - it.resolve, vel: it.vel * 0.85, bright: 0.26, role: role(n[i])});
            } else if (x != null) note({kind: 'main', midi: x, t: tv, dur: it.dur, vel: it.vel, bright: 0.12, role: 'lean'});
          });
          if (it.sus) {
            chords.push(Object.assign({}, label, {name: susName(c, s), fn: 'asma', sus: true}));
            if (it.sus === 'resolve') { label.t = at; bloomAt = at; }
          }
        }
        if (it.sus !== 'hold') chords.push(label);
        const final = it.sus === 'hold' ? s.filter((x) => x != null) : n;
        if (it.bloom) final.forEach((x) => note({kind: 'pad', midi: x, t: bloomAt, dur: it.dur * 1.1, vel: it.vel * it.bloom, rise: 0.6}));
        if (it.halo) final.slice(-2).forEach((x) => note({kind: 'halo', midi: x + 12, t: bloomAt + 0.15, dur: it.dur * 1.1, vel: it.vel * it.halo * 0.5, rise: 0.9}));
        let next = t + (spec.gap || 0.9);
        if (it.arp) {
          const from = it.arp.from || 0, base = mod(c.root + 3, 12) - 3;  // arpeggio root between B♭3 and A4
          const tones = (it.sus ? c.arp.map((iv) => (iv === 3 || iv === 4 ? 5 : iv)) : c.arp).map((iv) => base + iv);
          let ta = t + (it.arp.at != null ? it.arp.at : 0.06), gap = ARP_STEP;
          for (let i = 0; i < it.arp.count; i++) {
            const last = i === it.arp.count - 1, x = tones[from + i];
            note({kind: 'shine', midi: x, t: ta, dur: last ? 2.4 : 1.6, vel: 0.38, bright: 0.5, role: role(x)});
            if (!last) { ta += gap; gap *= ARP_RIT; }
          }
          next = ta + gap * 1.4;
        }
        prev = final;
        t = next;
      });
      return {t0: t0 || 0, end, chords, notes, harm, event: name};
    }
    return {plan, state};
  }

  /* ---------- Synthesis ---------- */
  // Strike: a short linear attack, a first decay to `hold` over `knee` s, then a straight line in dB to −80 dB.
  function strike(param, t, peak, atk, dur, hold, knee) {
    param.setValueAtTime(0, t);
    param.linearRampToValueAtTime(peak, t + atk);
    const len = Math.max(0.06, dur - atk), N = 128, c = new Float32Array(N), kd = 20 * Math.log10(hold);
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * len;
      const d = x < knee ? kd * (x / knee) : kd + (-80 - kd) * ((x - knee) / Math.max(1e-3, len - knee));
      c[i] = peak * dbToGain(d);
    }
    c[N - 1] = 0;
    param.setValueCurveAtTime(c, t + atk + 5e-4, len);
  }
  // Bloom: an exponential approach over `rise` s (an analogue swell), a long hold, then a fade to −80 dB.
  function bloom(param, t, peak, rise, dur) {
    const N = 160, c = new Float32Array(N), tau = rise / 3;
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * dur, u = Math.max(0, (x - rise) / (dur - rise));
      c[i] = peak * (1 - Math.exp(-x / tau)) * dbToGain(-80 * Math.pow(u, 1.6));
    }
    c[0] = 0; c[N - 1] = 0;
    param.setValueCurveAtTime(c, t, dur);
  }

  const VOICES = {
    // Electric piano: FM with a 1:1 modulator for the warm body (its index falls slowly) and a soft 14:1 tine.
    epiano(b, n, end) {
      const f = mtof(KEY + n.midi), t = n.t, amp = b.amp(n);
      strike(amp.gain, t, n.vel, 0.008, n.dur, 0.5, 0.3);
      const car = b.osc('sine', f, t, end, n.detune), mod1 = b.osc('sine', f, t, end, n.detune), mg = b.gain();
      const i0 = f * (0.3 + 1.1 * n.bright);
      mg.gain.setValueAtTime(i0, t);
      mg.gain.exponentialRampToValueAtTime(i0 * 0.08, t + Math.min(n.dur, 0.9));
      mod1.connect(mg).connect(car.frequency);
      if (KEY + n.midi < 84 && n.bright > 0.1) {
        const tine = b.osc('sine', f * 14, t, t + 0.1, n.detune), tg = b.gain();
        tg.gain.setValueAtTime(f * 0.2 * n.bright, t);
        tg.gain.exponentialRampToValueAtTime(f * 0.002, t + 0.07);
        tine.connect(tg).connect(car.frequency);
      }
      car.connect(amp);
    },
    // Felt piano: slightly stretched partials (string stiffness), a soft 12 ms hammer, upper partials dying first,
    // and a second string 1.6 cents sharp so the fundamental breathes.
    felt(b, n, end) {
      const f = mtof(KEY + n.midi), t = n.t, amp = b.amp(n);
      amp.gain.value = 1;
      for (let k = 1; k <= 6; k++) {
        const fk = k * f * Math.sqrt(1 + 0.0004 * k * k);
        if (fk > 12000) break;
        const a = n.vel * (k === 1 ? 0.8 : (0.5 + 0.6 * n.bright) / Math.pow(k, 1.9));
        [[0, 1], [1.6, k === 1 ? 0.35 : 0]].forEach(([cents, w]) => {
          if (!w) return;
          const g = b.gain();
          strike(g.gain, t, a * w, 0.012, Math.max(0.25, n.dur / (1 + 0.8 * (k - 1))), 0.6, 0.2);
          b.osc('sine', fk, t, end, n.detune + cents).connect(g).connect(amp);
        });
      }
    },
    // Glass: a sine with a 5-cent twin (slow chorus) and soft 2nd and 4th partials; also the reward arpeggios' voice.
    glass(b, n, end) {
      const f = mtof(KEY + n.midi), t = n.t, amp = b.amp(n);
      amp.gain.value = 1;
      [[1, 0.7, 1, 0], [1, 0.3, 1, 5], [2, 0.06, 0.5, 0], [4, 0.05 + 0.06 * n.bright, 0.2, 0]].forEach(([r, a, d, cents]) => {
        if (f * r > 12000) return;
        const g = b.gain();
        strike(g.gain, t, n.vel * a, 0.006, Math.max(0.15, n.dur * d), 0.55, 0.25);
        b.osc('sine', f * r, t, end, n.detune + cents).connect(g).connect(amp);
      });
    },
    // Pad (bloom): two triangles ±7 cents apart, swelling in; halo uses sines an octave up.
    pad(b, n, end, wave) {
      const f = mtof(KEY + n.midi), amp = b.amp(n);
      bloom(amp.gain, n.t, n.vel, n.rise, n.dur);
      [-7, 7].forEach((cents) => b.osc(wave || 'triangle', f, n.t, end, n.detune + cents).connect(amp));
    },
  };

  const cache = new WeakMap();
  function resources(ctx) {
    if (cache.has(ctx)) return cache.get(ctx);
    const sr = ctx.sampleRate, r = prng(12345);
    const noise = ctx.createBuffer(1, Math.floor(sr * 0.05), sr), d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    // Room from code: 20 ms pre-delay, five early reflections, then independent noise per channel decaying at
    // RT60 2.3 s and darkening as it ages (a one-pole low-pass closing over time).
    const len = Math.floor(sr * 3.2), pre = Math.floor(sr * 0.02), ir = ctx.createBuffer(2, len, sr);
    const taps = [[0.009, 0.5], [0.017, -0.35], [0.026, 0.3], [0.037, -0.22], [0.051, 0.18]];
    const fadeFrom = len - Math.floor(sr * 0.1);
    for (let ch = 0; ch < 2; ch++) {
      const x = ir.getChannelData(ch), rr = prng(987 + ch * 7919);
      let lp = 0;
      for (let i = pre; i < len; i++) {
        const tt = (i - pre) / sr, a = 0.3 + 0.62 * Math.min(1, tt / 1.6);
        lp += (1 - a) * (rr() * 2 - 1 - lp);
        let v = lp * Math.exp((-6.91 * tt) / 2.3);
        if (i > fadeFrom) v *= (len - i) / (len - fadeFrom);
        x[i] = v;
      }
      taps.forEach(([sec, a]) => { const i = pre + Math.floor(sec * sr * (ch ? 1.07 : 1)); if (i < len) x[i] += a * (ch ? -1 : 1) * 0.6; });
    }
    const res = {noise, ir};
    cache.set(ctx, res);
    return res;
  }

  /* ---------- Engine: one bus per event; every node it creates is stopped and disconnected when it ends. ---------- */
  const MAX_LIVE = 6;  // more overlapping events than this release the oldest
  /* Master boost (dB) ahead of the limiter: Eren found the effects too quiet (2026-10-30), so everything is +6 dB. It sits before the
     limiter, so overlaps are still caught; the TRIM table (loudness balance between events) is unchanged. calibrate() renders with
     master 0, so it keeps producing the same trims. */
  const MASTER_DB = 6;
  const PEDAL_TAU = 0.25;  // a harmony change lifts the pedal: older tails fade with this time constant
  // Half-pedal: a new frequent sound turns the frequent sounds still ringing down by 9 dB, fast and just before its
  // contact, so at the app's 0.3 s spacing each tap stands ≥ 6 dB over the tail (measured) while the chord keeps
  // sounding underneath. The shared reverb is not ducked; only its input is.
  const DUCK = dbToGain(-9);
  const DUCK_TAU = 0.02;
  const DUCK_EARLY = 0.02;  // s before the contact, when play() is called that far ahead
  function createEngine(ctx, opts) {
    opts = opts || {};
    const rnd = opts.random || Math.random, performer = createPerformer(rnd), res = resources(ctx);
    const dry = ctx.createGain(), sendIn = ctx.createBiquadFilter(), conv = ctx.createConvolver(), sum = ctx.createGain();
    sendIn.type = 'highpass'; sendIn.frequency.value = 250;
    conv.normalize = true; conv.buffer = res.ir;
    // Limiter: a fast compressor (ratio 20) that only acts on overlaps. Web Audio adds makeup gain of
    // (1 / gain at 0 dBFS)^0.6; the next node cancels it, so the limiter never makes anything louder.
    const comp = ctx.createDynamicsCompressor(), TH = -6, RATIO = 20;
    comp.threshold.value = TH; comp.knee.value = 0; comp.ratio.value = RATIO;
    comp.attack.value = 0.002; comp.release.value = 0.2;
    const unMakeup = ctx.createGain(), mute = ctx.createGain(), master = ctx.createGain();
    unMakeup.gain.value = dbToGain((TH - TH / RATIO) * 0.6);
    master.gain.value = dbToGain(opts.master != null ? opts.master : MASTER_DB);
    dry.connect(sum); sendIn.connect(conv).connect(sum);
    sum.connect(master).connect(comp).connect(unMakeup).connect(mute);
    const output = mute;
    if (opts.connect !== false) output.connect(ctx.destination);
    let palette = PALETTES[opts.palette] || PALETTES.rhodes;
    const live = [];

    function makeBus(spec, levelDb) {
      const nodes = [], sources = [];
      let last = null, lastStop = -1;
      const add = (x) => { nodes.push(x); return x; };
      const fade = add(ctx.createGain()), lp = add(ctx.createBiquadFilter()), level = add(ctx.createGain()), send = add(ctx.createGain());
      lp.type = 'lowpass'; lp.frequency.value = spec.cut * palette.cut; lp.Q.value = 0.5;
      level.gain.value = dbToGain(levelDb);
      send.gain.value = palette.wet * spec.wet;
      fade.connect(lp).connect(level).connect(dry);
      level.connect(send).connect(sendIn);
      const b = {fade, nodes, sources, released: false, harm: '*', tier: spec.tier, duck: 1};
      b.gain = () => add(ctx.createGain());
      b.osc = (type, f, t, stopAt, detune) => {
        const o = add(ctx.createOscillator());
        o.type = type; o.frequency.value = f; o.detune.value = detune || 0;
        b.start(o, t, stopAt);
        return o;
      };
      b.start = (src, t, stopAt) => {
        src.start(t); src.stop(stopAt); sources.push([src, stopAt]);
        if (stopAt > lastStop) { lastStop = stopAt; last = src; }
      };
      b.amp = (n) => {
        const g = add(ctx.createGain());
        if (ctx.createStereoPanner) { const p = add(ctx.createStereoPanner()); p.pan.value = n.pan || 0; g.connect(p).connect(fade); } else g.connect(fade);
        return g;
      };
      b.close = () => { last.onended = () => cleanup(b); };
      return b;
    }
    function cleanup(b) {
      b.nodes.forEach((x) => { try { x.disconnect(); } catch (e) { /* already disconnected */ } });
      b.nodes.length = 0; b.sources.length = 0;
      const i = live.indexOf(b);
      if (i >= 0) live.splice(i, 1);
    }
    function release(b, at, tau) {
      if (b.released) return;
      b.released = true;
      b.fade.gain.cancelScheduledValues(at);
      b.fade.gain.setTargetAtTime(0, at, tau);
      b.sources.forEach(([s, stopAt]) => { try { s.stop(Math.min(stopAt, at + tau * 8)); } catch (e) { /* stopped already */ } });
    }
    function render(b, n) {
      if (n.kind === 'felt') {  // the contact of a value landing: 30 ms of band-passed noise, 1.5 ms attack
        const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = b.gain();
        b.nodes.push(src, f);
        src.buffer = res.noise;
        f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.9;
        g.gain.setValueAtTime(0, n.t);
        g.gain.linearRampToValueAtTime(n.vel, n.t + 0.0015);
        g.gain.exponentialRampToValueAtTime(n.vel * 1e-4, n.t + 0.03);
        g.gain.setValueAtTime(0, n.t + 0.031);
        src.connect(f).connect(g).connect(b.fade);
        b.start(src, n.t, n.t + 0.045);
        return;
      }
      const m = Object.assign({}, n, {detune: (rnd() * 2 - 1) * 4, vel: n.vel * (1 + (rnd() * 2 - 1) * 0.06), pan: clamp((KEY + n.midi - 66) / 34, -0.3, 0.3)});
      m.t += n.kind === 'main' && n.role !== 'bass' ? rnd() * 0.004 : 0;
      const stopAt = m.t + m.dur + 0.05;
      if (n.kind === 'pad') VOICES.pad(b, Object.assign(m, {vel: m.vel * palette.pad * 0.3}), stopAt);
      else if (n.kind === 'halo') VOICES.pad(b, Object.assign(m, {vel: m.vel * palette.pad * 0.3}), stopAt, 'sine');
      else if (n.kind === 'shine') VOICES.glass(b, m, stopAt);
      else VOICES[palette.voice](b, m, stopAt);
    }

    const lead = () => (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
    // Page clock (performance.now ms) → the context time that is heard at that moment.
    function contextTime(ms) {
      if (ctx.state !== 'running' || typeof performance === 'undefined') return ctx.currentTime + 0.01;
      const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
      if (ts && ts.performanceTime > 0) return ts.contextTime + (ms - ts.performanceTime) / 1000;
      return ctx.currentTime + (ms - performance.now()) / 1000 - lead();
    }
    function play(name, cx) {
      cx = cx || {};
      const now = ctx.currentTime, want = cx.atMs != null ? contextTime(cx.atMs) : cx.when != null ? cx.when : now + 0.01;
      const t0 = Math.max(want, now + 0.005);
      const s = performer.plan(name, cx, t0);
      if (!s) return null;
      // Pedal: a different harmony (or any multi-chord event) fades the tails still ringing.
      live.forEach((b) => { if (s.harm === '*' || b.harm !== s.harm) release(b, t0, PEDAL_TAU); });
      if (EVENTS[name].tier === 'frequent') {
        const td = Math.max(now, t0 - DUCK_EARLY);
        live.forEach((b) => {
          if (b.released || b.tier !== 'frequent') return;
          b.duck *= DUCK;
          b.fade.gain.cancelScheduledValues(td);
          b.fade.gain.setTargetAtTime(b.duck, td, DUCK_TAU);
        });
      }
      const ringing = live.filter((b) => !b.released);
      for (let i = 0; i <= ringing.length - MAX_LIVE; i++) release(ringing[i], t0, 0.15);
      const levelDb = opts.levelDb != null ? opts.levelDb : (TRIM[palette.id] && TRIM[palette.id][name] != null ? TRIM[palette.id][name] : -20);
      const b = makeBus(EVENTS[name], levelDb);
      b.harm = s.harm;
      s.notes.forEach((n) => render(b, n));
      b.close();
      live.push(b);
      return s;
    }
    function stopAll() { const now = ctx.currentTime; live.slice().forEach((b) => release(b, now, 0.03)); }
    function setMuted(m) { const now = ctx.currentTime; mute.gain.cancelScheduledValues(now); mute.gain.setTargetAtTime(m ? 0 : 1, now, 0.02); }
    function setPalette(id) { if (PALETTES[id]) palette = PALETTES[id]; }
    return {ctx, output, play, plan: performer.plan, stopAll, setMuted, setPalette, live, get lead() { return lead(); }, get palette() { return palette.id; }};
  }


  /* ---------- Ambient pad: a very quiet, slow chord bed in D♭ (optional; the app's second switch, default off) ----------
     Four chords of one loop (I, vi, IV, V-sus: the lesson progression's home harmonies), each a soft Rhodes-like sine stack that swells
     in and fades out on its own envelope (zero at both ends: no click, whatever the loop does). Chords overlap, so the bed never
     stops; the order repeats. It has its own bus beside the effects (no limiter, no ducking), so effects keep their level. */
  const AMBIENT = {
    db: -48,  // bus level (dB): measureAmbient() gives momentary loudness about -44 LUFS, ~5 LU under 'select' (-39), peak about -36 dBFS
    step: 8, len: 13, rise: 3.2,  // s between chord starts, chord length, swell time
    cut: 900, wet: 0.5,
    chords: [[-12, -5, 4, 7, 14], [-15, -3, 0, 4, 7], [-19, -7, 0, 4, 11], [-17, -5, -3, 2, 7]],
  };
  function createAmbient(ctx, opts) {
    opts = opts || {};
    const rnd = opts.random || Math.random, res = resources(ctx), db = opts.levelDb != null ? opts.levelDb : AMBIENT.db;
    const lp = ctx.createBiquadFilter(), level = ctx.createGain(), send = ctx.createGain(), hp = ctx.createBiquadFilter(), conv = ctx.createConvolver(), tail = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.value = AMBIENT.cut; lp.Q.value = 0.4;
    level.gain.value = dbToGain(db); send.gain.value = AMBIENT.wet;
    hp.type = 'highpass'; hp.frequency.value = 200; conv.normalize = true; conv.buffer = res.ir; tail.gain.value = 1;
    lp.connect(level); level.connect(send).connect(hp).connect(conv).connect(tail);
    const output = ctx.createGain();
    level.connect(output); tail.connect(output);
    if (opts.connect !== false) output.connect(ctx.destination);
    let bus = null, timer = 0, next = 0, index = 0, on = false;
    function note(b, midi, t, vel) {
      const f = mtof(KEY + midi), amp = ctx.createGain(), nodes = [amp];
      bloom(amp.gain, t, vel, AMBIENT.rise, AMBIENT.len);
      amp.connect(b);
      let last = null;
      [[-5, 1], [5, 1], [0, 0.18]].forEach(([cents, w], i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = i === 2 ? f * 2 : f; o.detune.value = cents + (rnd() * 2 - 1) * 2;
        g.gain.value = w * 0.5; o.connect(g).connect(amp); nodes.push(o, g);
        o.start(t); o.stop(t + AMBIENT.len + 0.05); last = o;
      });
      last.onended = () => nodes.forEach((x) => { try { x.disconnect(); } catch (e) { /* gone */ } });
    }
    // One chord of the loop at time t, on bus b: a low voice a little softer than the rest, the others spread by 0.25 s (a slow roll).
    function chord(b, i, t) {
      AMBIENT.chords[i % AMBIENT.chords.length].forEach((m, k) => note(b, m, t + k * 0.25, m < -10 ? 0.8 : 1));
    }
    // Schedules `count` chords from t0 (offline renders, tests). Returns the end time.
    function plan(t0, count) {
      const b = ctx.createGain(); b.connect(lp);
      for (let i = 0; i < count; i++) chord(b, i, t0 + i * AMBIENT.step);
      return t0 + (count - 1) * AMBIENT.step + AMBIENT.len;
    }
    function pump() {
      while (next < ctx.currentTime + 6) { chord(bus, index++, next); next += AMBIENT.step; }
    }
    function start() {
      if (on) return;
      on = true;
      const now = ctx.currentTime;
      bus = ctx.createGain(); bus.gain.setValueAtTime(0, now); bus.gain.setTargetAtTime(1, now, 1.2); bus.connect(lp);
      next = now + 0.1; index = 0;
      pump();
      timer = setInterval(pump, 1000);
    }
    // Pausing fades the bus out and drops it (what was scheduled ahead stays silent and is disconnected); start() begins a fresh loop.
    function stop(tau) {
      if (!on) return;
      on = false;
      clearInterval(timer);
      const b = bus, now = ctx.currentTime, k = tau || 0.4;
      bus = null;
      b.gain.cancelScheduledValues(now); b.gain.setTargetAtTime(0, now, k);
      setTimeout(() => { try { b.disconnect(); } catch (e) { /* gone */ } }, k * 1000 * 8);
    }
    return {output, plan, start, stop, get on() { return on; }};
  }

  /* ---------- Measurement (offline): peak, loudness, phone-speaker loudness, clicks, audible length ---------- */
  function biquad(x, type, f0, q, gainDb, sr) {
    const w = (2 * Math.PI * f0) / sr, cw = Math.cos(w), al = Math.sin(w) / (2 * q), A = Math.pow(10, gainDb / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; } else {
      const s = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) + (A - 1) * cw + s); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - s);
      a0 = (A + 1) - (A - 1) * cw + s; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - s;
    }
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
    return y;
  }
  // ITU-R BS.1770 K-weighting, then the loudest 400 ms window (momentary loudness). phone: two extra 400 Hz
  // high-passes, a rough model of a phone speaker's missing low end.
  function momentary(chs, sr, phone) {
    const w = chs.map((c) => {
      let y = biquad(biquad(c, 'shelf', 1681.97, 0.7072, 4, sr), 'hp', 38.13, 0.5003, 0, sr);
      if (phone) y = biquad(biquad(y, 'hp', 400, 0.7071, 0, sr), 'hp', 400, 0.7071, 0, sr);
      return y;
    });
    const win = Math.floor(sr * 0.4), hop = Math.floor(sr * 0.01);
    const cum = w.map((y) => { const c = new Float64Array(y.length + 1); for (let i = 0; i < y.length; i++) c[i + 1] = c[i] + y[i] * y[i]; return c; });
    let best = 0;
    for (let s = 0; s + win <= w[0].length; s += hop) { let ms = 0; cum.forEach((c) => { ms += (c[s + win] - c[s]) / win; }); if (ms > best) best = ms; }
    return -0.691 + 10 * Math.log10(best || 1e-12);
  }
  async function measure(palette, event, o) {
    o = o || {};
    const sr = 48000, oc = new OfflineAudioContext(2, sr * 10, sr);
    const e = createEngine(oc, {palette, random: prng(o.seed != null ? o.seed : 7), levelDb: o.levelDb, master: o.master});
    const s = e.play(event, Object.assign({when: 0.05}, o.context));
    const buf = await oc.startRendering();
    const chs = [buf.getChannelData(0), buf.getChannelData(1)];
    let peak = 0, hf = 0;
    chs.forEach((d) => { for (let i = 4; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; const k = Math.abs(d[i] - 4 * d[i - 1] + 6 * d[i - 2] - 4 * d[i - 3] + d[i - 4]); if (k > hf) hf = k; } });
    // Audible length: until the 50 ms RMS stays 60 dB below its loudest window.
    const blk = Math.floor(sr * 0.05), rms = [];
    for (let i = 0; i + blk <= chs[0].length; i += blk) { let a = 0; for (let j = i; j < i + blk; j++) a += chs[0][j] * chs[0][j] + chs[1][j] * chs[1][j]; rms.push(a / blk); }
    const top = Math.max(...rms);
    let lastLoud = 0;
    rms.forEach((v, i) => { if (v > top * 1e-6) lastLoud = i; });
    const r1 = (x) => Math.round(x * 10) / 10;
    return {palette, event, peakDb: r1(20 * Math.log10(peak)), loud: r1(momentary(chs, sr, false)), phone: r1(momentary(chs, sr, true)),
      hfDb: r1(20 * Math.log10(hf / peak)), len60: r1((lastLoud + 1) * 0.05 - 0.05), end: r1(s.end - s.t0)};
  }
  // The ambient bed rendered offline (seconds long, its own bus): peak and momentary loudness, to place it under the effects.
  async function measureAmbient(o) {
    o = o || {};
    const sr = 48000, secs = o.seconds || 40, oc = new OfflineAudioContext(2, sr * secs, sr);
    const a = createAmbient(oc, {random: prng(7), levelDb: o.levelDb});
    a.plan(0.05, Math.ceil(secs / AMBIENT.step) + 1);
    const buf = await oc.startRendering();
    const chs = [buf.getChannelData(0), buf.getChannelData(1)];
    let peak = 0;
    chs.forEach((d) => { for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; } });
    const r1 = (x) => Math.round(x * 10) / 10;
    return {peakDb: r1(20 * Math.log10(peak)), loud: r1(momentary(chs, sr, false)), phone: r1(momentary(chs, sr, true))};
  }
  // Events that follow the lesson's chord are measured on every chord of PROGRESSION and power-averaged.
  const contextsOf = (ev) => (EVENTS[ev].seq.some((x) => x.chord === 'step') ? PROGRESSION.map((id) => ({chord: id, index: 1})) : [{}]);
  async function loudness(pid, ev, levelDb) {
    let p = 0;
    const cxs = contextsOf(ev);
    for (const context of cxs) p += Math.pow(10, (await measure(pid, ev, {levelDb, context, master: 0})).loud / 10);
    return 10 * Math.log10(p / cxs.length);
  }
  // Level-match: render, set trim = target − loudness, repeat (the limiter is not linear).
  async function calibrate(onProgress) {
    const table = {};
    for (const pid of Object.keys(PALETTES)) {
      table[pid] = {};
      for (const ev of Object.keys(EVENTS)) {
        let g = -20;
        for (let k = 0; k < 2; k++) g = Math.round((g + EVENTS[ev].loud - (await loudness(pid, ev, g))) * 10) / 10;
        table[pid][ev] = g;
        if (onProgress) onProgress(pid, ev, g);
      }
    }
    return table;
  }

  /* ---------- The app's single instance: unlock, mute, persistence ---------- */
  const STORE = 'satir-sound';
  const IDLE_MS = 30000;  // park (suspend) the context after this long with nothing ringing: battery on the metro
  const PARK_MS = 300;  // a hidden page or a mute parks once its fades are done (stopAll τ 0.03, mute τ 0.02)
  const STALE_MS = 250;  // a held call plays at most this late after the resume; later, it is dropped
  const HOLD_MAX = 4;  // held calls kept while parked (the newest)
  const app = {ctx: null, engine: null, performer: null, idle: 0, held: [], ambient: null, wantAmbient: false};
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function stored() { try { const v = JSON.parse(appStorage.getItem(STORE) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function store(patch) { try { appStorage.setItem(STORE, JSON.stringify(Object.assign(stored(), patch))); } catch (e) { /* private mode: keep it in memory only */ } }
  const memory = {};
  const read = (k) => (k in memory ? memory[k] : stored()[k]);
  const write = (patch) => { Object.assign(memory, patch); store(patch); };

  function park() { if (app.ctx && app.ctx.state === 'running') app.ctx.suspend().catch(() => {}); }
  function armIdle() {
    clearTimeout(app.idle);
    app.idle = setTimeout(() => { if (app.engine.live.length || (app.ambient && app.ambient.on)) armIdle(); else park(); }, IDLE_MS);
  }
  // Resume a parked, suspended or interrupted context. From a tap it counts as a gesture (iOS needs one).
  function wake() {
    if (!app.ctx || api.muted || app.ctx.state === 'running' || (typeof document !== 'undefined' && document.hidden)) return;
    try { app.ctx.resume().catch(() => {}); } catch (e) { /* refused: the next tap tries again */ }
  }
  // Hidden page or mute: stop what rings (so no old tail comes back on resume), then park after the fades.
  function quiet(still) {
    app.held.length = 0;
    if (app.ambient) app.ambient.stop(0.15);
    app.engine.stopAll();
    setTimeout(() => { if (still()) park(); }, PARK_MS);
  }
  // A parked clock cannot map atMs, so play() held the call. Running again: each plays at its own atMs, at once if
  // that has just passed, and not at all if it is more than STALE_MS late (a late sound must not land off its motion).
  // The bed plays only while it is wanted, sound is not muted, the page is visible and the context runs.
  function syncAmbient() {
    if (!app.ctx) return;
    const ok = app.wantAmbient && !api.muted && app.ctx.state === 'running' && !(typeof document !== 'undefined' && document.hidden);
    if (ok) { if (!app.ambient) app.ambient = createAmbient(app.ctx); app.ambient.start(); } else if (app.ambient) app.ambient.stop();
  }
  function flush() { app.held.splice(0).forEach(([ev, cx]) => { if (nowMs() - cx.atMs <= STALE_MS) api.play(ev, cx); }); }
  function hook() {
    // While running, the idle timer is armed (a tap may resume with no sound after it). iOS can leave the context
    // 'interrupted' after a call or Siri: try at once; the next tap retries any state that is not 'running'.
    app.ctx.addEventListener('statechange', () => {
      if (app.ctx.state === 'running') { armIdle(); flush(); syncAmbient(); } else if (app.ctx.state === 'interrupted') wake();
    });
    if (typeof document === 'undefined') return;
    ['touchend', 'pointerup', 'click', 'keydown'].forEach((e) => document.addEventListener(e, wake, {capture: true, passive: true}));
    document.addEventListener('visibilitychange', () => { if (document.hidden && app.ctx) quiet(() => document.hidden); else syncAmbient(); });
  }

  const api = {
    defaultMuted: true,
    get muted() { const v = read('muted'); return typeof v === 'boolean' ? v : api.defaultMuted; },
    get palette() { const v = read('palette'); return PALETTES[v] ? v : 'rhodes'; },
    get context() { return app.ctx; },
    get lead() { return app.engine ? app.engine.lead : 0; },
    init() {
      if (api.muted) return Promise.resolve(false);
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return Promise.resolve(false);
      if (!app.ctx) {
        // iOS: 'ambient' mixes with other audio and obeys the silent switch.
        try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* not supported */ }
        try { app.ctx = new AC({latencyHint: 'interactive'}); } catch (e) { return Promise.resolve(false); }
        app.engine = createEngine(app.ctx, {palette: api.palette});
        // One silent sample inside the gesture: the oldest iOS unlock, harmless elsewhere.
        const src = app.ctx.createBufferSource();
        src.buffer = app.ctx.createBuffer(1, 1, app.ctx.sampleRate);
        src.connect(app.ctx.destination);
        src.onended = () => src.disconnect();
        src.start();
        hook();
      }
      if (app.ctx.state === 'running') { syncAmbient(); return Promise.resolve(true); }
      let p = null;
      try { p = app.ctx.resume(); } catch (e) { /* resume refused outside a gesture */ }
      return Promise.resolve(p).then(() => app.ctx.state === 'running', () => false);
    },
    play(event, context) {
      if (api.muted || !app.engine) return null;
      if (app.ctx.state !== 'running') {  // parked: hold the call for flush(), with its page-clock time
        const cx = Object.assign({}, context);
        if (cx.atMs == null) cx.atMs = nowMs() + Math.max(0, cx.when != null ? (cx.when - app.ctx.currentTime) * 1000 : 0);
        if (app.held.push([event, cx]) > HOLD_MAX) app.held.shift();
        return null;
      }
      if (app.held.length) flush();
      armIdle();
      return app.engine.play(event, context);
    },
    plan(event, context) {
      // Its own performer, so planning a visual twin never changes what play() picks next.
      if (!app.performer) app.performer = createPerformer(Math.random);
      return app.performer.plan(event, context || {}, (context && context.when) || 0);
    },
    /** The optional background pad (not persisted here: the app keeps the setting). It starts once audio is unlocked by a tap, and never while muted. */
    get ambient() { return app.wantAmbient; },
    setAmbient(on) {
      app.wantAmbient = !!on;
      if (app.ctx && app.ctx.state === 'running') syncAmbient(); else if (!on) syncAmbient();
    },
    setMuted(m) {
      write({muted: !!m});
      if (!app.engine) return m ? Promise.resolve(false) : api.init();
      app.engine.setMuted(!!m);
      if (m) { quiet(() => api.muted); return Promise.resolve(false); }
      return api.init().then((ok) => { syncAmbient(); return ok; });
    },
    setPalette(id) { if (!PALETTES[id]) return; write({palette: id}); if (app.engine) app.engine.setPalette(id); },
    stopAll() { if (app.engine) app.engine.stopAll(); },
    createEngine, createAmbient, measure, measureAmbient, calibrate, chordAt, chordName, toneName, prng,
    CHORDS, EVENTS, PALETTES, PROGRESSION, TRIM, KEY, AMBIENT, MASTER_DB,
  };
  return api;
});

/**
 * Sound adapter (feel layer): the one place cues leave the feel layer and the engine. Cue names map to
 * SatirSound events (work/sound/satir-sound.js, bundled first). Sound is on by default (Eren, 2026-10-29)
 * with one switch on Profil (feelSoundSet); the setting lives in the feel ledger. In QA mode
 * (window.SATIR_QA) cues are only logged, never played. Each cue fires from the same onArrive as the
 * motion it belongs to, never from a timer of its own.
 */

const FEEL_CUE_EVENTS = {
  'answer.correct': 'correct', 'answer.wrong': 'wrong', 'seal.mini': 'streak', 'seal.lesson': 'lessonEnd',
  'seal.row': 'halfway', 'seal.unit': 'milestone', 'seal.insight': 'secret',
  'teach.select': 'select', 'teach.land': 'land', 'teach.merge': 'merge',
};

const feelSound = {
  cue(name, detail) {
    if (window.SATIR_QA) {
      feelState.cues.push({name, detail: detail ?? null, at: clock.now});
      return;
    }
    const event = FEEL_CUE_EVENTS[name];
    if (!event || !window.SatirSound || !feelLedger().settings.sound) return;
    try {
      window.SatirSound.play(event, {step: lesson.index, steps: STEPS.length, ...(detail || {})});
    } catch (error) {
      feelWarn(`sound cue ${name} failed`);
    }
  },
  /** Applies the ledger setting to the synth and unlocks audio on the first tap (iOS needs a gesture). The switch lives on Profil. */
  boot() {
    if (!window.SatirSound || window.SATIR_QA) return;
    window.SatirSound.setMuted(!feelLedger().settings.sound);
    window.SatirSound.setAmbient(feelAmbientOn());
    document.addEventListener('pointerup', feelSoundUnlock, {once: true, capture: true});
  },
};

function feelSoundUnlock() {
  if (!window.SatirSound || window.SATIR_QA) return;
  try { window.SatirSound.init(); } catch (error) { feelWarn('sound init failed'); }
}

function feelSoundOn() {
  return feelLedger().settings.sound;
}

/** Profil's Ses switch: the ledger setting, the synth, and a short preview when it turns on (it runs inside the tap's gesture). */
function feelSoundSet(on) {
  feelSetting('sound', on);
  if (window.SatirSound && !window.SATIR_QA) {
    window.SatirSound.setMuted(!on);
    window.SatirSound.setAmbient(feelAmbientOn());
    if (on) feelSoundUnlock();
  }
  if (on) feelSound.cue('teach.land');
}

/** The optional background pad ("Müzik"): off until the learner turns it on; never on while Ses is off. */
function feelAmbientOn() {
  const settings = feelLedger().settings;
  return settings.sound !== false && settings.ambient === true;
}

/** Profil's Müzik switch: the ledger setting and the pad. It runs inside the tap's gesture, so it may unlock audio itself. */
function feelAmbientSet(on) {
  feelSetting('ambient', on);
  if (!window.SatirSound || window.SATIR_QA) return;
  window.SatirSound.setAmbient(feelAmbientOn());
  if (on) feelSoundUnlock();
}

/**
 * Duo heads rig (feel layer, SPEC section 4 "Duo heads rig"): Satır (row, blue) and Sütun (column, purple) as
 * round heads with pill eyes, bracket brows and a mouth, after proposals/mascot.html (variant D1). Drawn as code
 * SVG with the proposal's own numbers; colours come from tokens (--duo-skin-* in duo.css, --color-on-head-*), strokes
 * from --stroke-duo-*; nothing here names a colour.
 *
 * The drawing is the proposal's exactly (light role tint, no rim, the same eye, mouth and brow paths). What is new is the
 * motion: every part (head, squash, each eye, mouth, brows) has its own spring and its own delay, so a reaction is a chain
 * (squat, launch, follow-through, a landing squash, a blink that starts in one eye and then the other) and nothing arrives
 * at the same instant. The rig runs on the engine's ticker, so it follows the engine's clock, finish and reduced motion.
 *
 * Moods: neutral, happy (Satır hops), console (Sütun sinks and leans, then blinks), proud (both lift and wink, as in the proposal).
 * Nothing idles: the duo moves once when something happened and then rests (reading is still).
 * Slots where the duo may appear carry data-cast="duo" (the cast rule, SPEC section 0).
 */

/**
 * Head geometry in SVG units, the proposal's own (mascot.html HEAD 44; the SC pair: Satır at 0,-26 and Sütun at 34,-48, Satır in front).
 * The pair box is 2 * 44 - 10 = 78 wide and 66 high (the layout code in feel.js sizes it from these three constants); one head sits in 44 x 48.
 */
const DUO_HEAD = 44;
const DUO_OVERLAP = 10;
const DUO_HEIGHT = 66;
const DUO_CY = 26;
const DUO_ONE_HEIGHT = 48;
/** Each head group's offset in the pair box (the head circle is centred at 22, 26 in its own group). */
const DUO_PAIR = {S: [0, 18], C: [34, -4]};
/** Face parts (mascot.html faceOpts): eye half-width/height, mouth half-width, eye and mouth offsets. */
const DUO_FACE = {w: 2.6, h: 4, mw: 4, mcu: 3.2, mou: 4, eyes: [[-7.5, -3], [7.5, -3]], mouth: [0, 8], hmax: 0.65};

/** Expression targets per mood. Missing keys keep the neutral value. */
const DUO_NEUTRAL = {happy: 0, oL: 1, oR: 1, mc: 0.6, mo: 0, brow: 0, tilt: 0, hy: 0};
const DUO_MOODS = {
  neutral: {},
  happy: {happy: 1, mc: 0.95, mo: 0.5},
  console: {happy: 0.45, mc: 0.6, brow: 1, tilt: 12, hy: 2},
  proud: {oR: 0.05, happy: 0.4, mc: 1, mo: 0.2},
};

/**
 * How each face channel travels between two of the proposal's poses: critically damped (it never passes its target, so no frame
 * shows a shape the drawing does not have), the eyes first, the brows next, the mouth last. Sütun's face runs DUO_HEAD_LAG later.
 */
const DUO_FACE_MOTION = {
  happy: {k: 520, at: 0}, oL: {k: 900, at: 0}, oR: {k: 900, at: 30}, hy: {k: 300, at: 0},
  brow: {k: 520, at: 40}, mc: {k: 380, at: 70}, mo: {k: 380, at: 90}, tilt: {k: 300, at: 110},
};
const DUO_HEAD_LAG = 70;

/** Blink: the proposal's own (mascot.html blinkOf): the eye's opening is scaled by 1 - 0.96 sin(pi t / 0.17 s), so it is the same eye at every frame. */
const DUO_BLINK = {dur: 170, skew: 45, sutun: 110};

/** Hop: a squat (anticipation), a launch with stretch, a landing squash on the way down, a tilt that trails the body. Per unit of strength. */
const DUO_HOP = {squat: 100, push: -205, stretch: 1.1, thin: -0.6, sink: 1, squash: 0.05, lean: 40, echo: 0.28, echoAt: 150, proudAt: 120};
/** Sütun's lean when something went wrong: sinks and tilts, holds, then rights itself slowly. */
const DUO_LEAN = {tilt: -4, sink: 0.9, hold: 650, blinkAt: 240};

const duoClamp = (value, low, high) => Math.min(high, Math.max(low, value));
const duoRound = (value) => Math.round(value * 100) / 100;

function duoEyePath(open, happy) {
  const {w, h} = DUO_FACE;
  const top = -h * 1.33 * duoClamp(open, 0.04, 1.2);
  const bottom = h * 1.33 * duoClamp(open, 0.04, 1.2) * (1 - 1.55 * happy);
  return `M${-w} 0C${-w} ${duoRound(top)} ${w} ${duoRound(top)} ${w} 0C${w} ${duoRound(bottom)} ${-w} ${duoRound(bottom)} ${-w} 0Z`;
}

function duoMouthPath(curve, open) {
  const {mw} = DUO_FACE;
  return `M${-mw} 0Q0 ${duoRound(curve)} ${mw} 0Q0 ${duoRound(curve + open)} ${-mw} 0Z`;
}

/** Brows are bracket corners, so the duo's expression language is made of brackets (mascot.html). */
function duoBrowPath(side) {
  const {w, h} = DUO_FACE;
  return side ? `M${-w} 0H${w}V${duoRound(h * 0.7)}` : `M${w} 0H${-w}V${duoRound(h * 0.7)}`;
}

/** Draws one head from its channel values (runs after every rig step): the face paths and the body transform. */
function duoDraw(part) {
  const {ch, face} = part.rig;
  const v = (name) => ch[name].x;
  const happy = duoClamp(v('happy'), 0, 1) * DUO_FACE.hmax;
  face.eyeL.setAttribute('d', duoEyePath(v('oL') * duoLid(part, 'L'), happy));
  face.eyeR.setAttribute('d', duoEyePath(v('oR') * duoLid(part, 'R'), happy));
  face.mouth.setAttribute('d', duoMouthPath(v('mc') * DUO_FACE.mcu, Math.max(0, v('mo')) * DUO_FACE.mou));
  const lift = -DUO_FACE.h * 1.9;
  face.brows.forEach((brow, index) => {
    brow.setAttribute('opacity', String(duoClamp(v('brow'), 0, 1)));
    const [x, y] = DUO_FACE.eyes[index];
    brow.setAttribute('transform', `translate(${x} ${duoRound(y + lift)}) rotate(${duoRound(index ? v('tilt') : -v('tilt'))})`);
  });
  const y = v('y') + v('hy');
  const rest = Math.abs(y) < 0.005 && Math.abs(v('rot')) < 0.005 && Math.abs(v('sx') - 1) < 0.0005 && Math.abs(v('sy') - 1) < 0.0005;
  part.head.style.transform = rest ? '' :
    `translate3d(0, ${duoRound(y)}px, 0) rotate(${duoRound(v('rot'))}deg) scale(${Math.round(v('sx') * 1000) / 1000}, ${Math.round(v('sy') * 1000) / 1000})`;
}

/** The eyelid factor of one eye at this moment: 1 open, down to 0.04 at the middle of a blink. */
function duoLid(part, side) {
  const blink = part.rig.lid[side];
  if (!blink) return 1;
  return 1 - 0.96 * Math.sin(Math.PI * duoClamp(blink.age / DUO_BLINK.dur, 0, 1));
}

/** One spring channel: value x, velocity v, target t, stiffness k and damping c; `on` while it still moves. */
function duoChannel(x) {
  return {x, v: 0, t: x, k: 400, c: 40, on: false};
}

function duoReduced() {
  return typeof reducedMotion !== 'undefined' && reducedMotion.matches;
}

/** Sends one channel to a target with its own spring (and an optional push). Starts the rig's ticker if it is asleep. */
function duoGo(part, name, target, {k = 400, z = 1, v} = {}) {
  duoWake(part);
  const rig = part.rig;
  const channel = rig.ch[name];
  channel.t = target;
  if (duoReduced()) {
    channel.x = target;
    channel.v = 0;
    channel.on = false;
    duoDraw(part);
    return;
  }
  channel.k = k;
  channel.c = 2 * z * Math.sqrt(k);
  if (v !== undefined) channel.v = v;
  channel.on = true;
}

/** Makes sure the rig's ticker is running. */
function duoWake(part) {
  const rig = part.rig;
  if (duoReduced() || rig.ticker) return;
  rig.ticker = {
    step: (ms) => duoStep(part, ms),
    finish: () => duoFinish(part),
  };
  motion.addTicker(rig.ticker);
}

/** Integrates every moving channel (240 Hz substeps like the engine), then the landing squash, then draws. False when all rest. */
function duoStep(part, ms) {
  const rig = part.rig;
  const dt = Math.min(ms, 64) / 1000;
  const steps = Math.max(1, Math.ceil(dt * 240));
  const h = dt / steps;
  const y = rig.ch.y;
  for (let i = 0; i < steps; i++) {
    for (const channel of Object.values(rig.ch)) {
      if (!channel.on) continue;
      const before = channel.x;
      channel.v += (-channel.k * (channel.x - channel.t) - channel.c * channel.v) * h;
      channel.x += channel.v * h;
      // The body comes down: the squash is the landing's own speed, so a harder hop lands flatter.
      if (channel === y && rig.air && before < 0 && channel.x >= 0 && channel.v > 0) duoLand(part, channel.v);
    }
  }
  let moving = false;
  for (const side of ['L', 'R']) {
    const blink = part.rig.lid[side];
    if (!blink) continue;
    blink.age += dt * 1000;
    if (blink.age >= DUO_BLINK.dur) part.rig.lid[side] = null;
    else moving = true;
  }
  for (const channel of Object.values(rig.ch)) {
    if (!channel.on) continue;
    if (Math.abs(channel.x - channel.t) < 0.0008 && Math.abs(channel.v) < 0.01) {
      channel.x = channel.t;
      channel.v = 0;
      channel.on = false;
    } else moving = true;
  }
  duoDraw(part);
  if (!moving) {
    rig.ticker = null;
    rig.air = false;
    return false;
  }
  return true;
}

/** Engine finish (snapAll): every channel lands on its target now. */
function duoFinish(part) {
  const rig = part.rig;
  for (const channel of Object.values(rig.ch)) {
    channel.x = channel.t;
    channel.v = 0;
    channel.on = false;
  }
  rig.ticker = null;
  rig.air = false;
  rig.lid = {L: null, R: null};
  duoDraw(part);
}

function duoLand(part, speed) {
  const rig = part.rig;
  rig.air = false;
  const hit = Math.min(speed, 260);
  const squash = {k: 520, z: 0.45};
  duoGo(part, 'sy', 1, {...squash, v: rig.ch.sy.v - hit * DUO_HOP.squash / 2.6});
  duoGo(part, 'sx', 1, {...squash, v: rig.ch.sx.v + hit * DUO_HOP.squash / 4});
}

function duoHeadSvg(who, [dx, dy]) {
  const role = who === 'S' ? 'row' : 'col';
  // The outer group places the head; the inner one is what the rig moves (a CSS transform would replace the placement).
  return `<g transform="translate(${dx} ${dy})"><g class="st-duo__head st-duo__head--${role}" data-who="${who}">` +
    `<circle class="st-duo__skull" cx="${DUO_HEAD / 2}" cy="${DUO_CY}" r="${DUO_HEAD / 2}"/>` +
    `<g class="st-duo__face" transform="translate(${DUO_HEAD / 2} ${DUO_CY})">` +
    `<path class="st-duo__eye" transform="translate(${DUO_FACE.eyes[0].join(' ')})"/>` +
    `<path class="st-duo__eye" transform="translate(${DUO_FACE.eyes[1].join(' ')})"/>` +
    `<path class="st-duo__mouth" transform="translate(${DUO_FACE.mouth.join(' ')})"/>` +
    '<path class="st-duo__brow"/><path class="st-duo__brow"/></g></g></g>';
}

/**
 * A duo for the stage or the sheet. `who`: 'both' (Satır left, Sütun right), 'S' or 'C' (one head). `size`: one (a head in the
 * sheet), sm, md, lg, xl, or fit (the width comes from --duo-fit: the lesson-end stage). The element is a scene object (it glides and rises like any other), tagged data-cast="duo".
 */
function duoEl({who = 'both', size = 'md', mood = 'neutral'} = {}) {
  const wrap = document.createElement('div');
  wrap.className = `st-obj st-duo st-duo--${size}`;
  wrap.dataset.cast = 'duo';
  wrap.dataset.obj = `duo:${who}`;
  const pair = who === 'both';
  const width = pair ? DUO_HEAD * 2 - DUO_OVERLAP : DUO_HEAD;
  const height = pair ? DUO_HEIGHT : DUO_ONE_HEIGHT;
  // Sütun is drawn first: Satır stands in front of it.
  wrap.innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">` +
    (who !== 'S' ? duoHeadSvg('C', pair ? DUO_PAIR.C : [0, 0]) : '') +
    (who !== 'C' ? duoHeadSvg('S', pair ? DUO_PAIR.S : [0, 0]) : '') + '</svg>';
  wrap.duo = {};
  wrap.querySelectorAll('.st-duo__head').forEach((head) => {
    const eyes = head.querySelectorAll('.st-duo__eye');
    const face = {eyeL: eyes[0], eyeR: eyes[1], mouth: head.querySelector('.st-duo__mouth'), brows: [...head.querySelectorAll('.st-duo__brow')]};
    face.brows.forEach((brow, index) => brow.setAttribute('d', duoBrowPath(index)));
    const ch = {y: duoChannel(0), rot: duoChannel(0), sx: duoChannel(1), sy: duoChannel(1)};
    Object.entries(DUO_NEUTRAL).forEach(([name, value]) => { ch[name] = duoChannel(value); });
    const part = {who: head.dataset.who, head, face: head.querySelector('.st-duo__face'), rig: {ch, face, base: {...DUO_NEUTRAL}, ticker: null, air: false, lid: {L: null, R: null}}};
    wrap.duo[part.who] = part;
  });
  duoPose(wrap, mood, false);
  return wrap;
}

/** The face targets of a mood for one head. */
function duoTargets(part, mood) {
  return {...DUO_NEUTRAL, ...DUO_MOODS[mood]};
}

/** Sets a mood: each face channel springs to its target on its own spring after its own delay (or jumps there when `animate` is false). */
function duoPose(wrap, mood, animate = true) {
  Object.values(wrap.duo).forEach((part) => {
    const target = duoTargets(part, mood);
    const lag = part.who === 'C' ? DUO_HEAD_LAG : 0;
    Object.entries(target).forEach(([name, value]) => {
      part.rig.base[name] = value;
      if (!animate) {
        const channel = part.rig.ch[name];
        channel.x = channel.t = value;
        channel.v = 0;
        channel.on = false;
        return;
      }
      const {k, at} = DUO_FACE_MOTION[name];
      clock.after(lag + at, () => duoGo(part, name, value, {k}));
    });
    if (!animate) duoDraw(part);
  });
}

/** One eyelid runs the proposal's blink curve; an eye that is held shut (a wink) stays as it is. */
function duoBlinkEye(part, side, delay) {
  clock.after(delay, () => {
    if (part.rig.base[side === 'L' ? 'oL' : 'oR'] < 0.5 || duoReduced()) return;
    part.rig.lid[side] = {age: 0};
    duoWake(part);
  });
}

/** A blink: the left eye goes first, the right one a moment later; Sütun's starts after Satır's when both blink together. */
function duoBlink(part, delay = 0) {
  const start = delay + (part.who === 'C' ? DUO_BLINK.sutun : 0);
  duoBlinkEye(part, 'L', start);
  duoBlinkEye(part, 'R', start + DUO_BLINK.skew);
}

/**
 * A hop: squat first (anticipation), then up with a push and a stretch, down with a landing squash, and a tilt that trails the body
 * and wobbles once more than the body does. Satır tilts one way and Sütun the other.
 */
function duoHop(part, strength = 1, delay = 0) {
  const dir = part.who === 'S' ? 1 : -1;
  const hop = () => {
    duoGo(part, 'y', DUO_HOP.sink * strength, {k: 900, z: 1});
    duoGo(part, 'sy', 1 - 0.06 * strength, {k: 900, z: 1});
    duoGo(part, 'sx', 1 + 0.035 * strength, {k: 900, z: 1});
    clock.after(DUO_HOP.squat, () => {
      part.rig.air = true;
      duoGo(part, 'y', 0, {k: 360, z: 0.5, v: DUO_HOP.push * strength});
      duoGo(part, 'sy', 1, {k: 520, z: 0.5, v: DUO_HOP.stretch * strength});
      duoGo(part, 'sx', 1, {k: 520, z: 0.5, v: DUO_HOP.thin * strength});
      duoGo(part, 'rot', 0, {k: 240, z: 0.55, v: dir * DUO_HOP.lean * strength});
    });
  };
  if (delay) clock.after(delay, hop);
  else hop();
}

/** Sütun's lean: it sinks and tilts (the face has already started to change), holds a moment, then rights itself slowly. */
function duoLean(part) {
  duoGo(part, 'y', DUO_LEAN.sink, {k: 260, z: 1});
  duoGo(part, 'sy', 0.975, {k: 260, z: 1});
  duoGo(part, 'sx', 1.015, {k: 260, z: 1});
  duoGo(part, 'rot', DUO_LEAN.tilt, {k: 170, z: 0.8});
  clock.after(DUO_LEAN.hold, () => {
    duoGo(part, 'rot', 0, {k: 90, z: 0.85});
    duoGo(part, 'y', 0, {k: 110, z: 0.8});
    duoGo(part, 'sy', 1, {k: 110, z: 0.8});
    duoGo(part, 'sx', 1, {k: 110, z: 0.8});
  });
}

/**
 * One reaction, then rest. happy: Satır hops and Sütun echoes it a little later and smaller. console: Sütun sinks and leans, then blinks.
 * proud: both lift (Sütun a beat after Satır) and wink. Reduced motion keeps the expression and skips the movement (every channel lands at once).
 */
function duoReact(wrap, mood) {
  duoPose(wrap, mood);
  const {S, C} = wrap.duo;
  if (mood === 'happy') {
    if (S) duoHop(S);
    if (C) duoHop(C, S ? DUO_HOP.echo : 1, S ? DUO_HOP.echoAt : 0);
    if (S) duoBlink(S, 520);
  }
  if (mood === 'proud') {
    if (S) duoHop(S, 0.8);
    if (C) duoHop(C, 0.8, DUO_HOP.proudAt);
  }
  if (mood === 'console' && C) {
    duoLean(C);
    duoBlink(C, DUO_LEAN.blinkAt - DUO_BLINK.sutun);
  }
}

/**
 * Seal component (feel layer, SPEC section 4 "Seal component"): a bracketed matrix of N cells that plays closed.
 * Every celebration is this one picture: two brackets glide in around a matrix, then its cells take ink in
 * reading order. Size and rarity pick the tier; the tiers differ only in spring and ink, never in look.
 *
 *   lesson  the answers matrix at a lesson end: its cells already carry their marks, so no ink
 *   row     the course matrix (three lessons a row): the new row takes ink
 *   unit    the unit's lessons: every cell takes ink, the big brackets close on the slower page spring
 *
 * Runs on the engine's clock and springs only (motion.to, clock.after); this file is inlined before the engine,
 * so nothing here runs at load: every engine name is read when a function is called.
 */

const SEAL_TIERS = {
  lesson: {spring: 'move', ink: false},
  row: {spring: 'move', ink: true},
  unit: {spring: 'page', ink: true},
};

/** A token's number (px for a length), read from the stylesheet so JS never carries a design value of its own. */
function tokenNum(name, el = document.documentElement) {
  return parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;
}
const tokenPx = tokenNum;

/**
 * Builds a seal object for the stage. `cells`: [{label, className?, ink?}]. A cell with `ink` carries an ink
 * layer that sealClose fades in; `inked` cells start with their ink already on (earlier rows).
 */
function buildSeal({tier, id, name, cols, cells, label, caption = ''}) {
  const el = document.createElement('div');
  el.className = `st-obj st-mat st-mat--seal st-seal st-seal--${tier}`;
  el.dataset.obj = id;
  el.dataset.tier = tier;
  // Every string that can come from storage or lesson data (cell labels, names, captions) goes in as text, never as markup.
  if (name) {
    const title = document.createElement('span');
    title.className = 'st-mat__name';
    title.textContent = name;
    el.appendChild(title);
  }
  const grid = document.createElement('div');
  grid.className = 'st-mat__grid';
  grid.style.setProperty('--cols', cols);
  grid.setAttribute('role', 'img');
  grid.setAttribute('aria-label', label || name || '');
  grid.innerHTML = '<i class="st-seal__br st-seal__br--l"></i><i class="st-seal__br st-seal__br--r"></i>';
  cells.forEach((cell, index) => {
    const tile = document.createElement('span');
    tile.className = ['st-cell', tier === 'lesson' ? '' : 'st-seal__tile', cell.className || ''].filter(Boolean).join(' ');
    tile.dataset.k = index;
    tile.textContent = cell.label ?? '';
    if (cell.ink || cell.inked) {
      const ink = document.createElement('span');
      ink.className = 'st-seal__ink';
      ink.textContent = cell.label ?? '';
      tile.appendChild(ink);
      motion.set(ink, {opacity: cell.inked ? 1 : 0});
    }
    grid.appendChild(tile);
  });
  el.appendChild(grid);
  if (caption) {
    const line = document.createElement('span');
    line.className = 'st-seal__caption';
    line.textContent = caption;
    el.appendChild(line);
  }
  return el;
}

function sealParts(seal) {
  return {
    left: seal.querySelector('.st-seal__br--l'),
    right: seal.querySelector('.st-seal__br--r'),
    cells: [...seal.querySelectorAll('.st-cell[data-k]')],
  };
}

/** Brackets stand open by --seal-gap and are not drawn yet. */
function sealOpen(seal) {
  const {left, right} = sealParts(seal);
  const gap = tokenPx('--seal-gap');
  motion.set(left, {x: -gap, opacity: 0});
  motion.set(right, {x: gap, opacity: 0});
}

/** Brackets drawn and already closed, with no glide (reduced motion: the cells are in place, so nothing needs to travel). */
function sealCloseNow(seal) {
  const {left, right} = sealParts(seal);
  motion.set(left, {x: 0, opacity: 1});
  motion.set(right, {x: 0, opacity: 1});
}

/**
 * Closes a seal: the brackets glide in on the tier's spring; once they arrive, the cells in `inkCells` (indices,
 * reading order) take ink one after another. `onStart` fires when the brackets start to move, `onClosed` when they arrive, `onDone` after the
 * last ink has landed. Reduced motion lands the brackets at once (the engine's springs), the ink still fades.
 */
function sealClose(seal, {delay = 0, inkCells = [], onStart, onClosed, onDone} = {}) {
  const tier = SEAL_TIERS[seal.dataset.tier];
  const {left, right, cells} = sealParts(seal);
  const inkOf = (index) => cells[index].querySelector('.st-seal__ink');
  const finish = () => {
    onClosed?.();
    const inks = inkCells.map(inkOf).filter(Boolean);
    if (!tier.ink || !inks.length) {
      onDone?.();
      return;
    }
    inks.forEach((ink, order) => clock.after(order * CHOREO.stagger, () => motion.to(ink, {opacity: 1}, 'fade',
      {onArrive: order === inks.length - 1 ? onDone : undefined})));
  };
  clock.after(delay, () => {
    onStart?.();
    motion.to(left, {x: 0, opacity: 1}, tier.spring);
    motion.to(right, {x: 0, opacity: 1}, tier.spring, {onArrive: finish});
  });
}

/**
 * Answer moment (feel layer, SPEC M2: F16, F40): the duo in the feedback sheet's mascot column and in the summary step,
 * and the streak's pair with its in-lesson mini moment. Everything here is reached through the seam slots registered in feel.js
 * (sheetMascot, sheetReact, sceneMascot, sceneReact, answerFx).
 * Uses: duo.js (duoEl, duoReact, duoBlink), the ledger functions and feelSound of feel.js.
 */

/**
 * The third right answer in a row shows the pair of heads and the streak badge. The badge becomes the mini seal in
 * feelStreakSeal (a stub: its look and timing come with the rewards addendum, FEEL_TIMING.streakSealCap); until then the
 * engine's badge stays as it is. `pairAt` is the one number that says when the pair appears.
 */
const FEEL_STREAK = {pairAt: 3};

/** True for the engine's neutral sheet (the "unknown" state): flagged in the slot's detail or by a class on the sheet. */
function feelSheetNeutral(sheet, flag) {
  return Boolean(flag) || sheet.classList.contains('is-neutral') || sheet.classList.contains('is-unknown');
}

/** Every verdict card shows the pair (Satır and Sütun); at rest the faces already show the mood (happy / console). */
function feelSheetMascot(sheet, {correct, streak, neutral = false}) {
  const old = sheet.querySelector('.st-sheet__mascot');
  // The neutral sheet ("Bilmiyorum": no verdict, no duo) is the engine's alone.
  if (!old || feelSheetNeutral(sheet, neutral)) return;
  const duo = duoEl({who: 'both', size: 'sm', mood: correct ? 'happy' : 'console'});
  duo.classList.add('st-sheet__mascot');
  sheet.classList.add('st-sheet--pair');
  old.replaceWith(duo);
}

/** The reaction, once, after the verdict has started to land: Satır hops, Sütun leans and blinks, the pair lifts at the streak. */
function feelSheetReact(sheet, {correct, streak, neutral = false}) {
  const duo = sheet.querySelector('[data-cast="duo"]');
  if (!duo || feelSheetNeutral(sheet, neutral)) return;
  const sealed = correct && streak === FEEL_STREAK.pairAt;
  clock.after(CHOREO.mascotDelay, () => {
    duoReact(duo, !correct ? 'console' : sealed ? 'proud' : 'happy');
    feelSound.cue(correct ? 'answer.correct' : 'answer.wrong');
    if (sealed) feelStreakSeal();
  });
}

/** The mini seal's place (in the lesson only: nothing is stored, counted or shelved, council 27 Oct). Stub: only its cue exists; the three-cell seal is drawn once the rewards addendum says how. */
function feelStreakSeal() {
  feelSound.cue('seal.mini');
}

/** The summary step's mascot item is the pair of heads. */
function feelSceneMascot() {
  const duo = duoEl({who: 'both', size: 'md'});
  duo.classList.add('st-duo--scene');
  duo.dataset.obj = 'mascot';
  return duo;
}

/** The summary duo is glad once when the scene has landed, and blinks later; then it rests. */
function feelSceneReact(delay) {
  const duo = els.scene.querySelector('[data-obj="mascot"][data-cast="duo"]');
  if (!duo) return;
  clock.after(delay + 260, () => duoReact(duo, 'happy'));
  clock.after(delay + 1100, () => Object.values(duo.duo).forEach(duoBlink));
}


/**
 * Secret moment (feel layer, SPEC M3: F39 + F32, F38): after Bitir, a lesson that has a `moments` entry asks one surprise
 * question before its end screen. It reaches the engine through two seam slots only:
 *   beforeEnd(resume)  called when the completion is saved; the moment shows and later calls `resume()` (the end screen)
 *   stepEyebrow(step)  "Artık yapabildiğin" on the step that pays off an earlier question (F38, `paysOff`)
 * The moment is not a step: the engine never reads `moments`, so its length, progress bar, counter, score, run records and
 * streak cannot change. The step is drawn with the engine's own renderers (narration, dock, scene, reveal runner) and its
 * taps are caught before the engine's handler, so a pick records nowhere.
 * Uses: ledger functions and feelState (feel.js), seal.js (sealOpen, sealClose), the engine's render functions.
 */

/** Words and limits of the moment (UI text is Turkish). */
const FEEL_MOMENT = {
  eyebrow: 'Gizli an',
  eyebrowFirst: 'Gizli an · not tutulmaz',
  skip: 'Geç',
  skipLabel: 'Gizli soruyu geç',
  next: 'İleri',
  payoff: 'Artık yapabildiğin',
  title: 'Gizli anı çözdün: sezgi mührü senin.',
  sealKind: 'insight',
};

/** What the moment is doing now (null outside it): {code, step, solved, resume}. */
let feelMoment = null;
let feelMomentParked = null;

/** A lesson's secret moment, or null. A lesson without `moments` has none. */
function feelMomentFor(code) {
  const list = LESSONS[code]?.moments;
  return Array.isArray(list) ? list.find((item) => item && item.moment === 'secret' && item.kind === 'choice') || null : null;
}

/** F38: the step that pays off an earlier question says so in its eyebrow; nothing else about it changes. */
function feelStepEyebrow(step) {
  return step.paysOff && STEPS.some((other) => other.id === step.paysOff) ? FEEL_MOMENT.payoff : step.eyebrow;
}

/** The ledger entry of a lesson's moment: open until it is skipped or solved. */
function feelMomentState(code) {
  return feelMerge(feelLedger()).moments[code] || 'open';
}

function feelMomentSave(code, state) {
  const ledger = feelMerge(feelLedger());
  ledger.moments[code] = state;
  const id = `${FEEL_MOMENT.sealKind}-${code}`;
  if (state === 'solved' && !ledger.seals.some((seal) => seal.id === id)) {
    ledger.seals.push({id, kind: FEEL_MOMENT.sealKind, lesson: code, at: Date.now()});
  }
  feelSave(ledger);
}

/** Layer A for the moment: the ✕ place holds the 48 px "Geç" (same action, so no second exit); everything else stays where it was. */
function feelMomentHeader(on) {
  const close = els.close;
  if (on) {
    close.dataset.was = close.innerHTML;
    close.classList.add('st-skip');
    close.textContent = FEEL_MOMENT.skip;
    close.setAttribute('aria-label', FEEL_MOMENT.skipLabel);
  } else if (close.classList.contains('st-skip')) {
    close.classList.remove('st-skip');
    close.innerHTML = close.dataset.was;
    close.setAttribute('aria-label', 'Ders haritasına dön');
    delete close.dataset.was;
  }
  close.disabled = false;
  motion.set(close, {opacity: 1});
  if (!on) {
    // Whatever reduced motion pinned for the moment (narration and dock heights) is let go.
    els.body.style.removeProperty('min-height');
    els.dock.style.removeProperty('min-height');
    els.dock.style.removeProperty('align-content');
  }
}

/** Replaces the narration's body with `html` (a wrong pick's feedback, the right pick's explanation). */
function feelMomentSay(html) {
  // The narration changes height, so the stage does too: the scene is fitted again inside flipScene and glides (the engine's resize path).
  flipScene(() => {
    els.body.innerHTML = html || '';
    els.body.hidden = !html;
    fitScene(feelMoment?.view ?? null);
  });
  if (!html) return;
  motion.set(els.body, {opacity: ENTER_FLOOR, x: SHIFT.narr});
  motion.to(els.body, {opacity: 1, x: 0}, 'move');
}

/** Reduced motion has no glide, so the narration keeps the height of its tallest text (hint or feedback) and the stage never changes size. */
function feelMomentReserve(step) {
  els.body.style.removeProperty('min-height');
  if (!reducedMotion.matches) return;
  const shown = els.body.innerHTML;
  const wasHidden = els.body.hidden;
  els.body.hidden = false;
  const tallest = Math.max(...[step.body, ...step.options.map((option) => option.feedback)].map((html) => {
    els.body.innerHTML = html || '';
    return els.body.offsetHeight;
  }));
  els.body.innerHTML = shown;
  els.body.hidden = wasHidden;
  els.body.style.minHeight = `${tallest}px`;
}

/** Draws the secret step the way goStep draws a step, minus the progress bar and the counter, which stay as they were. */
function feelMomentDraw(step) {
  // The first time it shows (never skipped before) it says that nothing is graded.
  const view = {...step, eyebrow: feelMomentState(feelMoment.code) === 'open' ? FEEL_MOMENT.eyebrowFirst : FEEL_MOMENT.eyebrow, hideUnclear: true};
  feelMoment.view = view;
  lesson.answered = null;
  renderProgress(1); // the lesson is complete: the bar is full and the counter keeps its last value; no segment is added
  renderNarration(view, 1);
  feelMomentReserve(step);
  renderDock(view);
  workPlanEm = 0;
  planWork(view);
  setWork([]);
  renderScene(view, 1, {});
  syncTransport();
  if (step.beat) withChannel('beat', () => clock.after(chromeDelay(CHOREO.beatDelay), () => playBeat(step.beat)));
}

/** beforeEnd: the moment shows when the lesson has one that is not solved; otherwise the end screen comes at once. */
function feelBeforeEnd(resume) {
  const code = currentLesson;
  const step = feelMomentFor(code);
  if (!step || !feelKnown(code) || feelMomentState(code) === 'solved') {
    resume();
    return;
  }
  feelMoment = {code, step, solved: false, resume};
  feelState.moment = {code, phase: 'open', picks: []};
  feelMomentHeader(true);
  feelMomentDraw(step);
}

/**
 * Leaves the moment for the end screen. `state`: 'solved' or 'skipped'. The scene fades out first (the tap shows at once), so
 * nothing visible is left to resize when the end screen's narration and dock change the stage's height; then the end comes.
 */
function feelMomentLeave(state) {
  const current = feelMoment;
  if (!current || current.leaving) return;
  current.leaving = true;
  if (state === 'skipped') feelMomentSave(current.code, 'skipped');
  const go = () => {
    if (feelMoment !== current) return;
    feelMoment = null;
    feelState.moment.phase = state;
    feelMomentHeader(false);
    current.resume();
  };
  const targets = [...els.scene.querySelectorAll('[data-obj]'), ...els.work.children].filter((el) => motion.stateOf(el).opacity > 0.01);
  if (!targets.length) {
    go();
    return;
  }
  targets.forEach((el, index) => motion.to(el, {opacity: 0}, 'fade', {onArrive: index === targets.length - 1 ? go : undefined}));
}

/** A wrong pick: the option is struck and its feedback takes the body's place. Nothing is recorded; the others stay tappable. */
function feelMomentMiss(button, option) {
  // A miss is struck in neutral ink: no red, no cross badge (it is a try, not a mistake), and the feedback is a hint.
  button.classList.add('is-miss');
  button.disabled = true;
  feelMomentSay(option.feedback);
}

/**
 * The seal of insight (stub: its look comes with the rewards addendum, FEEL_TIMING.closeCap bounds it): the scene's matrix
 * swaps its drawn brackets for the seal component's, which stand open and close around it on the lesson tier's spring.
 */
function feelInsightSeal(done) {
  const mat = els.scene.querySelector('.st-mat');
  const grid = mat?.querySelector('.st-mat__grid');
  if (!grid) {
    done();
    return;
  }
  grid.insertAdjacentHTML('beforeend', '<i class="st-seal__br st-seal__br--l"></i><i class="st-seal__br st-seal__br--r"></i>');
  mat.classList.add('st-mat--seal');
  mat.dataset.tier = 'lesson';
  feelMark('insight:start');
  const closed = () => {
    feelMark('insight:closed');
    feelSound.cue('seal.insight');
    done();
  };
  if (reducedMotion.matches) {
    sealCloseNow(mat);
    closed();
    return;
  }
  sealOpen(mat);
  sealClose(mat, {onClosed: closed});
}

/** The right pick: the answers are marked, the reveal plays, the brackets close, then the single primary leads on. */
function feelMomentSolve(index) {
  const {step, code} = feelMoment;
  feelMoment.solved = true;
  feelState.moment.phase = 'solved';
  feelMomentSave(code, 'solved');
  // The completion that earned it: a ceremony of its own when the lesson end has none, else one more line.
  if (feelState.end) {
    feelState.end.insight = true;
    if (feelState.end.ceremony) feelState.end.extra += 1;
  }
  markChoice(step, index, true);
  feelMomentSay(step.options[index].feedback);
  feelSound.cue('answer.correct');
  withChannel('reveal', () => clock.after(chromeDelay(CHOREO.revealDelay), () => playBeat(step.reveal, 'reveal')));
  const skip = els.close;
  skip.disabled = true;
  motion.to(skip, {opacity: 0}, 'fade');
  whenIdle('reveal', () => feelInsightSeal(feelMomentOffer));
}

/** The dock holds one primary, "İleri", and nothing else. */
function feelMomentOffer() {
  if (!feelMoment) return;
  // Reduced motion has no glide: the dock keeps the options' height, so the stage (and the scene) stay exactly as they are.
  if (reducedMotion.matches) {
    els.dock.style.minHeight = `${els.dock.offsetHeight}px`;
    els.dock.style.alignContent = 'end';
  }
  flipScene(() => {
    els.dock.className = 'st-dock st-dock--nav st-dock--moment';
    els.dock.dataset.kind = 'nav';
    els.dock.removeAttribute('data-group');
    els.dock.innerHTML = `<button type="button" class="st-btn st-btn--primary" data-action="moment-next" data-primary>${FEEL_MOMENT.next}</button>`;
    fitScene(feelMoment.view);
  });
  enterDock();
}

/** A tap during the moment goes here first and never reaches the engine's handler (so nothing is recorded). */
function feelMomentTap(event) {
  if (!feelMoment) return;
  const button = event.target.closest('.st-dock button, #lesson-close');
  if (!button) return;
  event.stopPropagation();
  event.preventDefault();
  if (button.disabled) return;
  if (button === els.close) feelMomentLeave('skipped');
  else if (button.dataset.action === 'moment-next') feelMomentLeave('solved');
  else if (button.dataset.option !== undefined && !feelMoment.solved) {
    const index = Number(button.dataset.option);
    const option = feelMoment.step.options[index];
    feelState.moment.picks.push(index);
    if (option?.correct) feelMomentSolve(index);
    else if (option) feelMomentMiss(button, option);
  }
}

/** Keys: the arrows do nothing here (they would step the lesson), Escape is "Geç". */
function feelMomentKey(event) {
  if (!feelMoment) return;
  if (event.key === 'Escape' && !feelMoment.solved) {
    event.stopPropagation();
    feelMomentLeave('skipped');
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Escape') {
    event.stopPropagation();
  }
}

/**
 * A step change while the moment is up (a harness: in the UI the arrows do nothing and ✕ is "Geç") ends it before the engine draws.
 * Its scene goes at once, so the engine does not ghost it out of the moment's layout into the next step's.
 */
function feelMomentAbandon() {
  if (!feelMoment) return;
  [...els.scene.querySelectorAll('[data-obj]'), ...els.work.children].forEach((el) => motion.set(el, {opacity: 0}));
  feelMomentReset();
}

/** Leaving the lesson by any other way: the moment ends where it stands (the ledger keeps what it was). */
function feelMomentReset() {
  if (!feelMoment) return;
  feelMoment = null;
  feelMomentHeader(false);
}

/**
 * The hidden-page rule: a teaching beat that is playing pauses through its runner when the page hides and, on visible,
 * resumes by itself after a short hold (never a tap). An action that was mid-way lands first, then the hold.
 */
function feelOnVisibility() {
  if (document.visibilityState === 'hidden') {
    const runner = activeRunner();
    if (runner && !runner.held) {
      runner.pause();
      feelMomentParked = runner;
    }
    return;
  }
  const runner = feelMomentParked;
  feelMomentParked = null;
  if (runner && runner.held && runners.has(runner)) clock.after(FEEL_TIMING.resumeHold, () => runner.resume());
}

function feelMomentBoot() {
  els.lessonView.addEventListener('click', feelMomentTap, true);
  document.addEventListener('keydown', feelMomentKey, true);
  document.addEventListener('visibilitychange', feelOnVisibility);
}

/**
 * Touch (feel layer, SPEC M5: F34, F35): every tap is answered in the frame it lands. The engine's own press (a spring to
 * PRESS_SCALE) starts at rest, so its first frame moves only a little; here the first frame already draws half the press and an
 * ink tint starts to rise (the CSS `.is-pressed`). The stage answers a tap the same way. Spacing and text alignment of the
 * controls are tokens and rules in feel.css under `:root.st-touch`; nothing here is per screen.
 * Uses: the engine's PRESSABLE, PRESS_SCALE, motion and the 'press' / 'ui' springs.
 */

/** Every control and the stage press to the engine's PRESS_SCALE (the engine's softer step for tabs and tiles is not used); `first` is the share drawn in the pointerdown frame itself. */
const FEEL_PRESS = {first: 0.5};
/** The engine's constants are declared after the feel layer in the one scope, so the depth is read when a press starts. */
const feelPressDepth = () => 1 - PRESS_SCALE;

let feelPressedEl = null;
let feelPressedStage = false;

/** Draws the first part of a press at once and lets the spring take it the rest of the way. */
function feelPressIn(el, depth) {
  if (1 - motion.stateOf(el).scale < depth * FEEL_PRESS.first) motion.set(el, {scale: 1 - depth * FEEL_PRESS.first});
  motion.to(el, {scale: 1 - depth}, 'press');
}

/** Runs after the engine's pointerdown handler (same target, registered earlier), so it only adds to what the engine did. */
function feelPointerDown(event) {
  feelPressOut();
  const el = event.target.closest(PRESSABLE);
  if (el) {
    if (el.disabled) return;
    el.classList.add('is-pressed');
    feelPressedEl = el;
    feelPressIn(el, feelPressDepth());
    return;
  }
  // Anywhere else on the stage: the stage itself takes the press (a tap on the scene is never silent).
  if (els.stage.contains(event.target)) {
    feelPressedStage = true;
    feelPressIn(els.stage, feelPressDepth());
  }
}

function feelPressOut() {
  if (feelPressedEl) {
    feelPressedEl.classList.remove('is-pressed');
    feelPressedEl = null;
  }
  if (feelPressedStage) {
    feelPressedStage = false;
    motion.to(els.stage, {scale: 1}, 'ui');
  }
}

function feelTouchBoot() {
  document.documentElement.classList.add('st-touch');
  document.addEventListener('pointerdown', feelPointerDown);
  document.addEventListener('pointerup', feelPressOut);
  document.addEventListener('pointercancel', feelPressOut);
}

/**
 * Launch greeting (feel layer, SPEC M4, simplified 2026-10-29): when the learner comes back after a gap of
 * 20 minutes or more, a short layer greets them before the map: Köşeli's mark settles, "Dizey" and a
 * time-of-day greeting rise in, then the layer fades. The first ever launch ("başlayalım") and a return after 72 hours ("devam edelim")
 * play a little longer. A tap anywhere lands it at once. No day count, nothing that blocks input for
 * long (the layer is a single skip target). Under 20 minutes: no layer (the map is just there).
 */

const FEEL_LAUNCH = {nearGapMs: 20 * 60 * 1000, longGapMs: 72 * 3600 * 1000, shortMs: 1300, longMs: 2100, outMs: 260};

function feelGreeting(hour) {
  return hour < 5 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
}

/** @returns {'first'|'long'|'daily'|'none'} how long the layer plays, from the gap since the ledger's lastSeen. */
function feelLaunchKind(lastSeen, now) {
  if (!lastSeen) return 'first';
  const gap = now - lastSeen;
  if (!(gap >= FEEL_LAUNCH.nearGapMs)) return 'none';
  return gap > FEEL_LAUNCH.longGapMs ? 'long' : 'daily';
}

function feelLaunchPlay(kind) {
  const long = kind === 'first' || kind === 'long';
  const layer = document.createElement('div');
  layer.className = 'st-launch';
  layer.dataset.cast = 'brand';
  const mark = els.brand.querySelector('.st-mascot')?.cloneNode(true);
  const word = document.createElement('p');
  word.className = 'st-launch__word';
  word.textContent = 'Dizey';
  const line = document.createElement('p');
  line.className = 'st-launch__line';
  const greeting = feelGreeting(new Date().getHours());
  // Nothing to continue on a first launch (SPEC rule 30): the copy is true to the state.
  line.textContent = kind === 'first' ? `${greeting}, başlayalım.` : kind === 'long' ? `${greeting}, devam edelim.` : greeting;
  if (mark) {
    mark.classList.add('st-launch__mark');
    layer.append(mark);
  }
  layer.append(word, line);
  document.body.append(layer);

  const total = long ? FEEL_LAUNCH.longMs : FEEL_LAUNCH.shortMs;
  const items = [mark, word, line].filter(Boolean);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    motion.to(layer, {opacity: 0}, 'fade', {onArrive: () => layer.remove()});
  };
  layer.addEventListener('pointerdown', (event) => { event.preventDefault(); event.stopPropagation(); finish(); }, true);

  if (reducedMotion.matches) {
    items.forEach((el) => motion.set(el, {opacity: 1}));
  } else {
    items.forEach((el) => motion.set(el, {opacity: 0, y: SHIFT.enter}));
    if (mark) motion.set(mark, {opacity: 0, y: SHIFT.enter, scale: 0.86});
    items.forEach((el, index) => clock.after(80 + index * 220, () => motion.to(el, {opacity: 1, y: 0, scale: 1}, 'move')));
    if (mark) clock.after(500, () => cheerMascot(mark, 0.9));
  }
  clock.after(total, finish);
}

function feelLaunchBoot(lastSeen) {
  // The launch greeting belongs to the v21 home, which the new shell replaces.
  if (window.SATIR_QA || shellBridge.embedded) return;
  const kind = feelLaunchKind(lastSeen, Date.now());
  if (kind !== 'none') feelLaunchPlay(kind);
}

/**
 * Dersler, the home (feel layer, DESIGN_AUDIT_AND_REDESIGN 3.0 and 3.1). The top bar is a bracketed title switch, "[ Dersler ]  Profil":
 * the current place is ink inside matrix brackets, the other is muted, and a tap slides the brackets across and swaps the pages.
 * The active unit is a head (a line and a strip, one segment per lesson) over one inset list of all its lessons (the engine still renders
 * tiles; here each is shaped into a row: done, next, ready or "Yakında", quiet but in place, so the whole course is visible), the next
 * lesson is the one row with a ring, and the engine's single primary stays at the bottom. The exam date lives on Profil; the engine's one-line notice becomes a small pill above the primary.
 * Uses: the engine's els, LESSONS, STORE, savedProgress, motion, clock, CHOREO, SHIFT, PRESS_SCALE, pulse, reducedMotion,
 * unitMetaText, storageGet; fitLabel (feel.js); tokenNum (seal.js); profile.js (the Profil page).
 */

const feelNav = {place: 'dersler', serial: 0, el: null, tabs: {}, brackets: null, soon: null, reveal: false};

/* ---------- The lesson list ---------- */

const feelIsQuestion = (step) => step.kind === 'choice' || step.kind === 'keypad';

/** Shortest honest variants of a lesson name: the whole name, then what stands before its first comma or colon. */
const feelNameVariants = (name) => [...new Set([name, name.split(/[,:]/)[0].trim()])];

/** The lesson the row ring and the primary point at (the engine's own pick), only while it still has something to do. */
function feelNextLesson() {
  const saved = savedProgress();
  const done = Boolean(storageGet(STORE.done, {})[saved.lesson]);
  return done && !saved.step ? null : saved;
}

/** Shapes one tile into a list row. Ready: code, name, an end slot (check, chevron, step or tag) and, for the next lesson, a second
 *  line. Not written yet: the same row, quiet, with "Yakında" at its end (the engine still answers a tap with its notice). */
function feelShapeRow(tile, next) {
  const locked = tile.classList.contains('is-locked');
  const code = locked ? tile.dataset.locked : tile.dataset.lesson;
  const lesson = LESSONS[code];
  if (tile.dataset.row !== code) {
    tile.dataset.row = code;
    const step = tile.querySelector('.st-tile__step');
    if (step) tile.appendChild(step);
    const name = tile.querySelector('.st-tile__name');
    if (name) name.dataset.name = name.textContent;
    const end = document.createElement('span');
    end.setAttribute('aria-hidden', 'true');
    end.className = locked ? 'st-tile__soon' : 'st-tile__go';
    if (locked) end.textContent = 'Yakında';
    tile.appendChild(end);
  }
  const isNext = !locked && Boolean(next) && next.lesson === code;
  tile.classList.toggle('is-next', isNext);
  if (!isNext || !lesson) return;
  const inProgress = next.step > 0;
  const meta = document.createElement('span');
  meta.className = 'st-tile__meta';
  meta.textContent = inProgress ? `Kaldığın yer · ${next.step + 1}/${lesson.steps.length}` :
    `Sıradaki · ${lesson.steps.length} adım · ${lesson.steps.filter(feelIsQuestion).length} soru`;
  const tag = document.createElement('span');
  tag.className = 'st-tile__tag';
  tag.textContent = 'Sıradaki';
  tile.append(meta, tag);
  if (inProgress) {
    const bar = document.createElement('span');
    bar.className = 'st-tile__bar';
    bar.innerHTML = '<i></i>';
    motion.set(bar.firstChild, {scaleX: (next.step + 1) / lesson.steps.length});
    tile.appendChild(bar);
  }
}

/** The unit head above the list: one line (lessons in the unit, how many are done, how many are still being written) and a strip
 *  with one segment per lesson, in list order, so the whole unit reads at a glance. Done is read from storage, so a lesson whose
 *  check is still to be stamped already counts. */
function feelUnitHead(rows, next) {
  const head = feelNav.soon;
  const done = storageGet(STORE.done, {});
  const states = rows.map((tile) => {
    if (tile.classList.contains('is-locked')) return 'soon';
    const code = tile.dataset.lesson;
    if (done[code] && !(next && next.lesson === code)) return 'done';
    return next && next.lesson === code ? 'next' : 'ready';
  });
  const count = (state) => states.filter((item) => item === state).length;
  const ready = states.length - count('soon');
  const finished = ready > 0 && states.every((state) => state === 'done' || state === 'soon');
  const parts = [`${states.length} ders`];
  if (finished) parts.push('hazır olanların hepsi bitti');
  else if (count('done')) parts.push(`${count('done')} bitti`);
  if (count('soon')) parts.push(`${count('soon')} yakında`);
  head.dataset.line = JSON.stringify(parts);
  head.dataset.calm = finished ? 'done' : '';
  const strip = head.querySelector('.st-unit__strip');
  strip.textContent = '';
  states.forEach((state) => {
    const seg = document.createElement('i');
    seg.className = `st-unit__seg is-${state}`;
    strip.appendChild(seg);
  });
}

/** The engine just (re)rendered #tiles: every lesson of the unit becomes a row, in course order (no layout is read here). */
function feelShapeList() {
  const box = els.tiles;
  if (!box || !feelNav.soon) return;
  const next = feelNextLesson();
  const rows = [...box.children];
  box.querySelectorAll('.st-tile__meta, .st-tile__tag, .st-tile__bar').forEach((el) => el.remove());
  rows.forEach((tile, index) => {
    feelShapeRow(tile, next);
    tile.classList.toggle('is-first', index === 0);
    tile.classList.toggle('is-last', index === rows.length - 1);
  });
  box.classList.add('st-list');
  feelUnitHead(rows, next);
  feelNav.soon.hidden = feelNav.place !== 'dersler';
  feelNav.reveal = true;
}

/** Layout-dependent parts: names and the head line fit on one line; a unit taller than the room scrolls inside the list (no bar shows),
 *  and right after a render the next lesson is brought into view. */
function feelListFit() {
  const box = els.tiles;
  const head = feelNav.soon;
  if (!box || !head || els.mapView.hidden || feelNav.place !== 'dersler' || !box.clientWidth) return;
  box.querySelectorAll('.st-tile__name').forEach((name) => fitLabel(name, feelNameVariants(name.dataset.name || name.textContent)));
  const parts = JSON.parse(head.dataset.line || '[]');
  const line = head.querySelector('.st-unit__line');
  if (parts.length) fitLabel(line, [parts.join(' · '), parts.slice(0, 2).join(' · '), parts[0]]);
  const scrolls = box.scrollHeight > box.clientHeight + 1;
  box.classList.toggle('is-scroll', scrolls);
  if (!feelNav.reveal) return feelListEdge();
  feelNav.reveal = false;
  const target = box.querySelector('.is-next') || box.querySelector('.is-ready:not(.is-done)');
  box.scrollTop = scrolls && target ? target.offsetTop + target.offsetHeight / 2 - box.clientHeight / 2 : 0;
  feelListEdge();
}

/** The fade at the list's lower (or upper) edge shows only while there is more to scroll that way. */
function feelListEdge() {
  const box = els.tiles;
  box.classList.toggle('is-more-down', box.scrollTop + box.clientHeight < box.scrollHeight - 1);
  box.classList.toggle('is-more-up', box.scrollTop > 1);
}

/* ---------- The title switch ---------- */

/** Brackets sit on the active word: each arm slides to its edge on the ui spring (they jump when motion is reduced). */
function feelNavPlace(animated) {
  const nav = feelNav;
  const tab = nav.tabs[nav.place];
  if (!tab || !nav.el || !tab.offsetWidth) return;
  const arm = nav.brackets.l.offsetWidth;
  [[nav.brackets.l, tab.offsetLeft], [nav.brackets.r, tab.offsetLeft + tab.offsetWidth - arm]].forEach(([bracket, x]) => {
    if (animated && !reducedMotion.matches) motion.to(bracket, {x}, 'ui');
    else motion.set(bracket, {x});
  });
}

function feelNavPaint() {
  Object.entries(feelNav.tabs).forEach(([place, tab]) => {
    const on = place === feelNav.place;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
  });
}

const feelDerslerBlocks = () => [els.tabs, feelNav.soon, els.tiles, els.mapDock];

const feelSoonEmpty = () => false;

/** Moves between the two places: the outgoing blocks slide away and fade, the incoming ones arrive in turn from the other side. */
function feelNavGo(place, {focus = false} = {}) {
  const nav = feelNav;
  if (place === nav.place || els.mapView.hidden || (place === 'profil' && !FEEL_FLAGS.shelf)) return;
  const serial = ++nav.serial;
  const toProfil = place === 'profil';
  nav.place = place;
  feelNavPaint();
  feelNavPlace(true);
  const calm = reducedMotion.matches;
  const dir = toProfil ? 1 : -1;
  if (toProfil) feelProfileShow();
  const outgoing = toProfil ? feelDerslerBlocks() : feelProfileBlocks();
  const incoming = toProfil ? feelProfileBlocks() : feelDerslerBlocks();
  // Both pages are in layout while they cross; a reversal mid-way retargets the springs from where they are.
  incoming.forEach((el) => { el.hidden = el === nav.soon && feelSoonEmpty(); el.inert = false; });
  outgoing.forEach((el) => { el.inert = true; });
  if (!toProfil) feelListFit();
  outgoing.forEach((el) => {
    const hide = () => { if (serial === nav.serial) { el.hidden = true; if (el === outgoing[outgoing.length - 1]) feelProfileSettle(); } };
    if (calm) motion.to(el, {opacity: 0}, 'fade', {onArrive: hide});
    else motion.to(el, {opacity: 0, x: -dir * SHIFT.enter}, 'leave', {onArrive: hide});
  });
  incoming.forEach((el, index) => {
    if (calm) {
      motion.set(el, {opacity: 0, x: 0});
      motion.to(el, {opacity: 1}, 'fade');
      return;
    }
    motion.set(el, {opacity: 0, x: dir * SHIFT.enter});
    clock.after(CHOREO.stagger * (index + 1), () => { if (serial === nav.serial) motion.to(el, {opacity: 1, x: 0}, 'move'); });
  });
  if (toProfil) feelProfileArrive();
  if (focus) nav.tabs[place].focus({preventScroll: true});
}

function feelNavBoot() {
  const top = els.mapTop;
  if (!top || top.querySelector('.st-nav')) return;
  const nav = document.createElement('nav');
  nav.className = 'st-nav';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Yer');
  nav.innerHTML = '<button type="button" class="st-nav__tab" role="tab" id="nav-dersler" data-place="dersler" data-layer="A">Dersler</button>' +
    '<button type="button" class="st-nav__tab" role="tab" id="nav-profil" data-place="profil" data-layer="A" aria-controls="profile-view">Profil</button>' +
    '<i class="st-nav__br st-nav__br--l" aria-hidden="true"></i><i class="st-nav__br st-nav__br--r" aria-hidden="true"></i>';
  top.appendChild(nav);
  feelNav.el = nav;
  feelNav.tabs = {dersler: nav.querySelector('#nav-dersler'), profil: nav.querySelector('#nav-profil')};
  feelNav.brackets = {l: nav.querySelector('.st-nav__br--l'), r: nav.querySelector('.st-nav__br--r')};
  Object.values(feelNav.tabs).forEach((tab) => {
    tab.addEventListener('pointerdown', () => motion.to(tab, {scale: PRESS_SCALE}, 'press'));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((name) => tab.addEventListener(name, () => motion.to(tab, {scale: 1}, 'land')));
    tab.addEventListener('click', (event) => {
      if (!event.detail) pulse(tab);
      feelNavGo(tab.dataset.place);
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      feelNavGo(event.key === 'ArrowRight' ? 'profil' : 'dersler', {focus: true});
    });
  });
  feelNavPaint();
}

/* ---------- Boot and events ---------- */

/** The unit meta element becomes the notice pill: shown only while it holds a notice, never in the flow. */
function feelNoticeBoot() {
  const meta = els.unitMeta;
  if (!meta) return;
  meta.classList.add('st-notice');
  els.mapView.appendChild(meta);
  const sync = () => { meta.hidden = meta.textContent === unitMetaText(); };
  new MutationObserver(sync).observe(meta, {childList: true, characterData: true, subtree: true});
  sync();
}

function feelHomeBoot() {
  document.getElementById('exam-countdown')?.remove();
  if (els.mapHead) els.mapHead.hidden = true;
  if (els.brand) els.brand.hidden = true;
  // The unit head sits between the unit tabs and the list (the id keeps its grid row).
  const soon = document.createElement('div');
  soon.className = 'st-unit';
  soon.id = 'tiles-soon';
  soon.innerHTML = '<p class="st-unit__line"></p><div class="st-unit__strip" aria-hidden="true"></div>';
  els.tiles.before(soon);
  feelNav.soon = soon;
  els.tiles.addEventListener('scroll', feelListEdge, {passive: true});
  feelNoticeBoot();
  feelNavBoot();
  new MutationObserver(() => { feelShapeList(); feelListFit(); }).observe(els.tiles, {childList: true});
  feelShapeList();
  feelListFit();
  feelNavPlace(false);
  document.fonts?.ready.then(() => { feelListFit(); feelNavPlace(false); });
}

/** The map is on screen again (a lesson closed): everything measured is measured now. */
function feelOnMap() {
  feelShapeList();
  feelListFit();
  feelNavPlace(false);
}

function feelOnResize() {
  feelListFit();
  feelNavPlace(false);
  feelProfileResize();
}

/**
 * Profil (feel layer, DESIGN_AUDIT_AND_REDESIGN 3.2, reworked): the second place of the title switch, "where I stand in the course".
 * The pair beside one sentence, a summary card (exam date, three positive counts), the course matrix card (every lesson of every unit
 * as a numbered cell on one shared grid, with a legend), and the Ses and Müzik switches at the bottom. It lives inside the map view as a page of its own (home.js moves between the two pages),
 * so the title switch never leaves the screen. Only things done are shown: no misses, no ratios, no day counts, no badges, no taps on
 * cells.
 * Uses: the engine's els, motion, clock, CHOREO, reducedMotion, STORE, UNITS, READY_LESSONS, lessonName, unitMetaText, savedProgress;
 * seal.js (sealOpen, sealClose, sealCloseNow); duo.js (duoEl); feel.js (ledger, readKey); sound-adapter.js; home.js (feelNav, feelNavGo).
 */

const feelProfile = {view: null, parts: null};

const PROFILE_EMPTY_LINE = 'İlk dersin bitince burası dolmaya başlar.';

/* ---------- Data ---------- */

/** An answer, once per question (lesson:step), is work done. Right, wrong or "Bilmiyorum" all count: this counts effort. */
function feelNoteWorked(detail) {
  if (!detail || typeof detail.lesson !== 'string' || !Number.isInteger(detail.index)) return;
  const ledger = feelLedger();
  const key = `${detail.lesson}:${detail.index}`;
  if (ledger.worked.includes(key)) return;
  ledger.worked.push(key);
  feelSave(ledger);
}

/** The four positive counts of Profil. Questions come from the ledger and from the engine's answer log (older answers). */
function feelStats(ledger) {
  const logged = readKey(STORE.answers, Array.isArray, [])
    .filter((entry) => feelIsObject(entry) && typeof entry.lesson === 'string' && Number.isInteger(entry.step))
    .map((entry) => `${entry.lesson}:${entry.step}`);
  const worked = [...new Set([...ledger.worked, ...logged])];
  if (worked.length > ledger.worked.length) {
    ledger.worked = worked;
    feelSave(ledger);
  }
  return {
    lessons: feelKnownDone(ledger).length,
    worked: worked.length,
    seals: ledger.seals.filter((seal) => seal.kind === 'row' || seal.kind === 'unit').length,
    secrets: Object.values(ledger.moments).filter((state) => state === 'solved').length,
  };
}

const FEEL_STAT_LABELS = [['lessons', 'ders bitti'], ['worked', 'soru çalıştın'], ['seals', 'mühür']];

/** The ledger's own Müzik value (it is kept while Ses is off, and comes back with Ses). */
const feelAmbientRaw = () => feelLedger().settings.ambient === true;

/** Paints both switches; Müzik follows Ses: with Ses off it shows off and does not answer a tap. */
function feelProfileSoundPaint(animated) {
  const {sound, music} = feelProfile.parts;
  const soundOn = feelSoundOn();
  [[sound, soundOn], [music, soundOn && feelAmbientRaw()]].forEach(([button, on]) => {
    const knob = button.querySelector('.st-me-sound__knob'), track = button.querySelector('.st-me-sound__track');
    button.setAttribute('aria-checked', String(on));
    button.classList.toggle('is-on', on);
    if (button === music) { button.disabled = !soundOn; button.classList.toggle('is-disabled', !soundOn); }
    const x = on ? track.clientWidth - knob.offsetWidth - 2 * knob.offsetLeft : 0;
    if (animated) motion.to(knob, {x}, 'ui');
    else motion.set(knob, {x});
  });
}

/* ---------- The page ---------- */

function feelProfileMake() {
  const view = document.createElement('section');
  view.className = 'st-me';
  view.id = 'profile-view';
  view.lang = 'tr';
  view.hidden = true;
  view.setAttribute('role', 'tabpanel');
  view.setAttribute('aria-labelledby', 'nav-profil');
  view.innerHTML =
    '<div class="st-me__intro"><div class="st-me__pair"></div><p class="st-me__line st-me__line--page"></p></div>' +
    '<section class="st-me__hero" aria-label="Özet"><div class="st-me__exam"><span class="st-me__exam-k">Sınav</span>' +
    '<span class="st-me__eyebrow"></span></div><dl class="st-me__stats"></dl></section>' +
    '<section class="st-me__card" aria-label="Ders matrisi"><div class="st-me__card-head"><h2 class="st-me__card-title">Ders matrisi</h2>' +
    '<p class="st-me__legend" aria-hidden="true"><i class="st-course__key is-done"></i>bitti<i class="st-course__key is-next"></i>sıradaki' +
    '<i class="st-course__key is-ready"></i>hazır<i class="st-course__key is-locked"></i>yakında</p></div>' +
    '<div class="st-me__course"></div></section>' +
    '<div class="st-me__switches" data-group="controls">' +
    '<button type="button" class="st-me-sound st-me-sound--ses" role="switch"><span class="st-me-sound__text">' +
    '<span class="st-me-sound__name">Ses</span><span class="st-me-sound__sub">Ders, cevap ve mühür sesleri</span></span>' +
    '<span class="st-me-sound__track" aria-hidden="true"><i class="st-me-sound__knob"></i></span></button>' +
    '<button type="button" class="st-me-sound st-me-sound--music" role="switch"><span class="st-me-sound__text">' +
    '<span class="st-me-sound__name">Müzik</span><span class="st-me-sound__sub">Çok hafif fon müziği</span></span>' +
    '<span class="st-me-sound__track" aria-hidden="true"><i class="st-me-sound__knob"></i></span></button></div>' +
    `<p class="st-me__version" data-testid="build-info">${versionLine()}</p>`;
  els.mapView.appendChild(view);
  const parts = {
    intro: view.querySelector('.st-me__intro'), pair: view.querySelector('.st-me__pair'),
    linePage: view.querySelector('.st-me__line--page'), hero: view.querySelector('.st-me__hero'), card: view.querySelector('.st-me__card'),
    eyebrow: view.querySelector('.st-me__eyebrow'), stats: view.querySelector('.st-me__stats'), course: view.querySelector('.st-me__course'),
    switches: view.querySelector('.st-me__switches'),
    sound: view.querySelector('.st-me-sound--ses'), music: view.querySelector('.st-me-sound--music'),
  };
  parts.sound.addEventListener('click', () => { feelSoundSet(!feelSoundOn()); feelProfileSoundPaint(true); });
  parts.music.addEventListener('click', () => { if (feelSoundOn()) { feelAmbientSet(!feelAmbientRaw()); feelProfileSoundPaint(true); } });
  feelProfile.view = view;
  feelProfile.parts = parts;
  return view;
}

/** The first lesson still to do: the engine's own pick, else the first ready lesson not done, in course order. */
function feelProfileNext(done) {
  const pick = feelNextLesson();
  if (pick) return pick.lesson;
  return UNITS.flatMap((unit) => unit.lessons.map(([code]) => code)).find((code) => READY_LESSONS.has(code) && !done.includes(code)) || null;
}

/** The pair's mood and its one sentence, by state (the faces are drawn still: no idle loop on this page). */
function feelProfileSay(done, ledger) {
  if (!done.length) return {mood: 'neutral', text: PROFILE_EMPTY_LINE};
  const last = done[done.length - 1];
  const unit = UNITS.find((item) => item.lessons.some(([code]) => code === last));
  const ready = unit ? unit.lessons.map(([code]) => code).filter((code) => READY_LESSONS.has(code)) : [];
  if (unit && ready.length && ready.every((code) => done.includes(code))) return {mood: 'proud', text: `${unit.label} hazır derslerinin hepsi bitti.`};
  const next = feelProfileNext(done);
  return next ? {mood: 'happy', text: `Sıradaki: ${next} · ${lessonName(next)}.`} : {mood: 'proud', text: 'Hazır derslerin hepsi bitti.'};
}

/** One unit row of the course matrix: the unit's name and what is done in it, then one cell per lesson carrying the lesson's number
 *  (done ink, next ringed, ready outlined, not written yet faint). The cells sit on one shared grid, so the units line up as a matrix. */
function feelCourseUnit(unit, done, next, ledger) {
  const row = document.createElement('div');
  row.className = 'st-course__unit';
  const sealed = ledger.seals.some((seal) => seal.id === `unit-${unit.id}`);
  const finished = unit.lessons.filter(([code]) => done.includes(code)).length;
  const head = document.createElement('p');
  head.className = 'st-course__label';
  const name = document.createElement('span');
  name.textContent = unit.label;
  const count = document.createElement('span');
  count.className = 'st-course__count';
  count.textContent = sealed ? 'mühürlü' : finished ? `${finished}/${unit.lessons.length} bitti` : `${unit.lessons.length} ders`;
  count.classList.toggle('is-sealed', sealed);
  head.append(name, count);
  const cells = document.createElement('div');
  cells.className = 'st-course__cells';
  unit.lessons.forEach(([code, title]) => {
    const cell = document.createElement('i');
    const state = done.includes(code) ? 'done' : code === next ? 'next' : READY_LESSONS.has(code) ? 'ready' : 'locked';
    cell.className = `st-course__cell is-${state}`;
    cell.dataset.code = code;
    cell.title = `${code} · ${title}`;
    // The unit's own lessons show their number; a lesson borrowed from another unit keeps its letter.
    const own = code.startsWith(unit.id);
    cell.textContent = own ? code.slice(unit.id.length) : code;
    cell.classList.toggle('is-wide', !own);
    if (ledger.moments[code] === 'solved') {
      const dot = document.createElement('b');
      dot.className = 'st-me__dot';
      cell.appendChild(dot);
    }
    cells.appendChild(cell);
  });
  row.append(head, cells);
  return row;
}

/** (Re)builds what the page shows from the ledger: the pair and its line, the hero (date, counts, matrix by unit), the switches. */
function feelProfileRender() {
  const {pair, linePage, eyebrow, stats, course} = feelProfile.parts;
  const ledger = feelLedger();
  const counts = feelStats(ledger);
  const done = feelKnownDone(ledger);
  const say = feelProfileSay(done, ledger);
  pair.textContent = '';
  pair.appendChild(duoEl({who: 'both', size: 'md', mood: say.mood}));
  linePage.textContent = say.text;
  eyebrow.textContent = unitMetaText();
  stats.textContent = '';
  FEEL_STAT_LABELS.forEach(([key, label]) => {
    const item = document.createElement('div');
    item.className = 'st-me__stat';
    const term = document.createElement('dt');
    term.textContent = label;
    const value = document.createElement('dd');
    value.textContent = String(counts[key]);
    item.append(value, term);
    stats.append(item);
  });
  const next = feelProfileNext(done);
  course.textContent = '';
  const seal = document.createElement('div');
  seal.className = 'st-me__matrix';
  seal.dataset.tier = 'row';
  seal.setAttribute('role', 'img');
  seal.setAttribute('aria-label', done.length ? `Ders matrisi, ${done.length} ders bitti` : 'Ders matrisi');
  seal.innerHTML = '<i class="st-seal__br st-seal__br--l"></i><i class="st-seal__br st-seal__br--r"></i>';
  UNITS.forEach((unit) => seal.appendChild(feelCourseUnit(unit, done, next, ledger)));
  course.appendChild(seal);
  feelProfile.matrix = seal;
  feelProfileSoundPaint(false);
}

/* ---------- Called by the title switch (home.js) ---------- */

/** The blocks that arrive and leave one after another. */
const feelProfileBlocks = () => {
  const {intro, hero, card, switches} = feelProfile.parts || {};
  return [intro, hero, card, switches].filter(Boolean);
};

/** Profil is about to be shown: its page is in layout and painted from the ledger. */
function feelProfileShow() {
  if (!feelProfile.view) feelProfileMake();
  feelProfile.view.hidden = false;
  feelProfile.view.inert = false;
  feelProfileRender();
}

/** The blocks of the page the learner left are hidden for good; the page itself goes when Dersler is the place. */
function feelProfileSettle() {
  const p = feelProfile;
  if (p.view && feelNav.place === 'dersler') p.view.hidden = true;
}

/** Once per visit the matrix brackets open by the seal gap and close on the move spring. */
function feelProfileArrive() {
  const seal = feelProfile.matrix;
  if (!seal) return;
  if (reducedMotion.matches) { sealCloseNow(seal); return; }
  sealOpen(seal);
  sealClose(seal, {delay: CHOREO.openDelay, inkCells: []});
}

function feelProfileResize() {
  if (feelNav.place === 'profil' && feelProfile.view && !feelProfile.view.hidden) feelProfileSoundPaint(false);
}

function feelProfileKeys(event) {
  if (event.key === 'Escape' && feelNav.place === 'profil') feelNavGo('dersler', {focus: true});
}

function feelProfileBoot() {
  if (!feelProfile.view) feelProfileMake();
  document.addEventListener('keydown', feelProfileKeys);
}

/**
 * Satır feel layer (work/feel-v1). Registered before the engine runs (this file is inlined ahead of it), so the
 * engine's seam finds window.satirFeel at boot. Nothing here runs at load beyond defining names: every engine
 * name (motion, clock, els, CHOREO, ...) is read when a function is called, after the engine has initialised.
 *
 * With every FEEL_FLAGS entry off the layer registers nothing and the page behaves exactly as pilot v2.
 * Contents: flags, timing and data tables; the storage gate and the versioned ledger; the label-fit helper;
 * the lesson end and its seals (M1); the seam registration and the QA hooks.
 * Spec: work/feel-v1/SPEC.md. Cast rule: Köşeli (data-cast="brand") only on the brand surfaces; the duo
 * (data-cast="duo") is the in-lesson cast; never both on one screen.
 */

/** Build-time flags, one per item (SPEC 3.1). The build writes this object; an item without a clean review is off. */
const FEEL_FLAGS = {"end": true, "answer": true, "moment": true, "launch": true, "touch": true, "shelf": true, "sound": true};
const FEEL_ON = Object.values(FEEL_FLAGS).some(Boolean);

/** Every threshold of the feel layer, with its reason (SPEC 4, "One timing table"). ms unless noted. */
const FEEL_TIMING = {
  closeCap: 600, // the answers matrix's own soft close is the frequent tier: small, no bounce (M1)
  ceremonyHold: 350, // the eye lands on the sealed answers before they travel (one fixation, SATIR_DESIGN dwells)
  ceremonyCap: 1200, // first movement of a ceremony to its last ink: SPEC 2.5 and M1 acceptance 2
  endSettleCap: 4000, // the whole lesson-end screen has settled by here (M1 acceptance 2)
  resumeHold: 360, // a teaching beat paused by a hidden page resumes this long after the page is visible again (no tap)
  streakSealCap: 900, // the "üst üste 3" mini seal, first movement to last ink (SPEC M2); reserved: the look comes with the rewards addendum
};

/**
 * Share of the 34 questions of the four real Vize 1 papers (2017, 2019 bahar, 2019 güz, 2024 yaz) that belong
 * to each unit. Source: research/past-exam-inventory.md, topic table: A matrix-ops 5 + special-matrices 4 +
 * trace 3 + transpose-symmetric 1 + inverse-gauss-jordan 1 = 14; B determinant-properties 6 + adjoint-inverse 6
 * + determinant-cofactor 3 = 15; C parametric-k-cases 3 + homogeneous 2 + cramer 0 = 5. Sums to EXAM_QUESTIONS.
 */
const UNIT_EXAM_SHARE = {A: 14, B: 15, C: 5};
const EXAM_QUESTIONS = 34;

const LEDGER_KEY = 'satir.v3.feel';
const LEDGER_VERSION = 1;
/** The end-stage layout's one preference that is not a size: how much cell a full last row may cost (share of the largest cell). */
const FEEL_LAYOUT = {padTolerance: 0.1};
const FEEL_MOMENT_STATES = ['solved', 'skipped', 'open'];
/** A moment only moves forward: solved beats skipped beats open, so a stale copy from another tab never undoes it. */
const feelMomentRank = (state) => FEEL_MOMENT_STATES.length - FEEL_MOMENT_STATES.indexOf(state);
/** Step-by-step upgraders from older ledger versions: LEDGER_UPGRADES[v](ledger) returns version v + 1. */
const LEDGER_UPGRADES = {};
/** Lessons per row of the course matrix (F37: 3, 6, 9). */
const COURSE_COLS = 3;
/** The lesson-end course matrix shows at most this many rows, the newest last (it never scrolls). */
const COURSE_ROWS_SHOWN = 3;

const feelState = {warnings: [], cues: [], timeline: [], events: [], end: null, moment: null, readOnly: false};

function feelWarn(message) {
  feelState.warnings.push(message);
}

/** Timeline marks for the QA gates (ceremony and settle lengths are read from them). */
function feelMark(name) {
  if (window.SATIR_QA) feelState.timeline.push({name, at: clock.now});
}

/* ---------- Storage gate: every read goes through readKey; nothing here throws ---------- */

const feelIsObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** The raw string of a key: localStorage first, then the engine's in-memory mirror (blocked storage). */
function feelRaw(key) {
  try {
    const raw = appStorage.getItem(key);
    if (raw !== null) return raw;
  } catch (error) {
    // Blocked storage: the mirror below still holds this visit's writes.
  }
  return key in memoryStore ? memoryStore[key] : null;
}

/** Parses and validates one key; any failure (missing, unparsable, wrong shape) returns `fallback`. */
function readKey(key, validate, fallback) {
  const raw = feelRaw(key);
  if (raw === null) return fallback;
  try {
    const value = JSON.parse(raw);
    if (validate(value)) return value;
    feelWarn(`${key}: wrong shape`);
  } catch (error) {
    feelWarn(`${key}: not JSON`);
  }
  return fallback;
}

/** Write-then-read probe: is storage really there (private windows and blocked frames throw or forget)? */
function feelProbeStorage() {
  try {
    const key = `${LEDGER_KEY}.probe`;
    appStorage.setItem(key, '1');
    const ok = appStorage.getItem(key) === '1';
    appStorage.removeItem(key);
    return ok ? 'ok' : 'blocked';
  } catch (error) {
    return 'blocked';
  }
}

/* ---------- Ledger: the feel layer's own record (engine keys stay the engine's) ---------- */

function feelEmptyLedger() {
  return {version: LEDGER_VERSION, lastSeen: 0, storage: 'ok', lessonsDone: [], seals: [], moments: {}, notices: [],
    settings: {sound: true}, stamps: {}, worked: []};
}

function feelLedgerShape(value) {
  return feelIsObject(value) && Number.isInteger(value.version) && value.version >= 1 && Array.isArray(value.lessonsDone) &&
    Array.isArray(value.seals) && feelIsObject(value.moments) && Array.isArray(value.notices) && feelIsObject(value.settings);
}

/** A lesson code the course knows (any lesson of any unit, ready or not). Codes that are gone stay in the ledger but never count or render. */
const feelKnown = (code) => UNITS.some((unit) => unit.lessons.some(([id]) => id === code));
const feelKnownDone = (ledger) => ledger.lessonsDone.filter(feelKnown);

/** Repairs a shape-valid ledger element by element: strings stay strings, seals keep an id, moments keep a known state. */
function feelClean(ledger) {
  const text = (value) => typeof value === 'string' && value !== '';
  const unique = (list) => [...new Set(list.filter(text))];
  const ids = new Set();
  const seals = ledger.seals.filter((seal) => feelIsObject(seal) && text(seal.id) && !ids.has(seal.id) && ids.add(seal.id))
    .map((seal) => ({...seal, kind: text(seal.kind) ? seal.kind : seal.id.split('-')[0], at: Number.isFinite(seal.at) ? seal.at : 0}));
  const moments = Object.fromEntries(Object.entries(ledger.moments).filter(([code, state]) => text(code) && FEEL_MOMENT_STATES.includes(state)));
  const stamps = feelIsObject(ledger.stamps) ? Object.fromEntries(Object.entries(ledger.stamps).filter(([, at]) => Number.isFinite(at))) : {};
  const worked = unique(Array.isArray(ledger.worked) ? ledger.worked : []);
  return {...ledger, lessonsDone: unique(ledger.lessonsDone), seals, notices: unique(ledger.notices), moments, stamps, worked,
    settings: {...feelEmptyLedger().settings, ...ledger.settings, sound: ledger.settings.sound !== false},
    lastSeen: Number.isFinite(ledger.lastSeen) ? ledger.lastSeen : 0};
}

/**
 * Seals earned when `code` becomes the newest distinct completed lesson (`done` already contains it): the unit
 * seal when every lesson the unit lists is done (not-ready lessons count), the row seal at 3, 6, 9, ...
 */
function feelSealsFor(done, code, at) {
  const earned = [];
  const unit = UNITS.find((item) => item.lessons.some(([id]) => id === code));
  if (unit && unit.lessons.every(([id]) => done.includes(id))) earned.push({id: `unit-${unit.id}`, kind: 'unit', at, lesson: code});
  if (done.length % COURSE_COLS === 0) earned.push({id: `row-${done.length / COURSE_COLS}`, kind: 'row', at, lesson: code});
  return earned;
}

/** Counts `code` as completed (once) and files the seals it earns; returns them. `silent` seals have no ceremony. */
function feelAddDone(ledger, code, at, silent = false) {
  const earned = [];
  if (ledger.lessonsDone.includes(code)) return earned;
  ledger.lessonsDone.push(code);
  if (!feelKnown(code)) return earned;
  feelSealsFor(feelKnownDone(ledger), code, at).forEach((seal) => {
    if (ledger.seals.some((item) => item.id === seal.id)) return;
    ledger.seals.push(silent ? {...seal, silent: true} : seal);
    earned.push(seal);
  });
  return earned;
}

/**
 * Adds the lessons the engine marked done but the ledger has not seen; their seals are silent (no ceremony). The engine's `done`
 * stamp is the LAST completion (it is rewritten on every repeat), so the order uses the earliest answer in the engine's answer
 * log when there is one (the log keeps the last 500 answers, so it is only known for recent lessons), else the `done` stamp.
 */
function feelAbsorbDone(ledger) {
  const done = readKey(STORE.done, feelIsObject, {});
  const first = {};
  readKey(STORE.answers, Array.isArray, []).forEach((entry) => {
    if (feelIsObject(entry) && Number.isFinite(entry.at) && !(first[entry.lesson] <= entry.at)) first[entry.lesson] = entry.at;
  });
  Object.entries(done).filter(([code, at]) => !ledger.lessonsDone.includes(code) && Number.isFinite(at))
    .map(([code, at]) => [code, Math.min(at, first[code] ?? at)]).sort((a, b) => a[1] - b[1])
    .forEach(([code, at]) => feelAddDone(ledger, code, at, true));
  return ledger;
}

/**
 * Folds what another tab saved into this tab's ledger (lessons in the saved order, seals by id, the other fields from the
 * stored copy), so a save never loses or doubles a lesson or a seal. Called before every save and before a completion is decided.
 */
function feelMerge(ledger) {
  const raw = feelRaw(LEDGER_KEY);
  const stored = raw === null ? null : feelParse(raw);
  // Something unreadable appeared mid-visit: it is kept once (as at boot) before this save replaces it.
  if (raw !== null && !stored) feelKeepCorrupt(raw);
  if (!stored) return ledger;
  const ids = new Set(stored.seals.map((seal) => seal.id));
  ledger.lessonsDone = [...new Set([...stored.lessonsDone, ...ledger.lessonsDone])];
  ledger.seals = [...stored.seals, ...ledger.seals.filter((seal) => !ids.has(seal.id))];
  ledger.notices = [...new Set([...stored.notices, ...ledger.notices])];
  ledger.worked = [...new Set([...(stored.worked || []), ...(ledger.worked || [])])];
  // Per-field rules, so a change made in this tab is never undone by an older copy: a moment only moves forward (solved beats
  // skipped beats open); a setting takes the value with the newest stamp (feelSetting writes one); a tie keeps the stored copy.
  ledger.moments = {...ledger.moments};
  Object.entries(stored.moments).forEach(([code, state]) => {
    if (!ledger.moments[code] || feelMomentRank(state) > feelMomentRank(ledger.moments[code])) ledger.moments[code] = state;
  });
  const stamp = (copy, name) => copy.stamps[`settings.${name}`] ?? 0;
  const settings = {...ledger.settings, ...stored.settings};
  Object.keys(ledger.settings).forEach((name) => {
    if (stamp(ledger, name) > stamp(stored, name)) settings[name] = ledger.settings[name];
  });
  ledger.stamps = {...stored.stamps, ...ledger.stamps};
  Object.keys(settings).forEach((name) => { ledger.stamps[`settings.${name}`] = Math.max(stamp(ledger, name), stamp(stored, name)); });
  ledger.settings = settings;
  ledger.lastSeen = Math.max(ledger.lastSeen, stored.lastSeen);
  return ledger;
}

function feelSave(ledger) {
  // Merge first: it is the merge that finds a newer version in storage, and a newer ledger is never written back.
  const merged = feelMerge(ledger);
  if (!feelState.readOnly) storageSet(LEDGER_KEY, merged);
}

/** Changes one setting and stamps it, so the newest change wins when tabs merge. */
function feelSetting(name, value) {
  const ledger = feelLedger();
  ledger.settings[name] = value;
  ledger.stamps[`settings.${name}`] = Date.now();
  feelSave(ledger);
}

/** Stamps the time the learner was last here: on a step change, when the page hides and on pagehide (SPEC ledger). */
function feelTouch() {
  const ledger = feelLedger();
  ledger.lastSeen = Date.now();
  feelSave(ledger);
}

/** Keeps an unreadable ledger once under a dated key, so nothing is lost when a fresh one replaces it. */
function feelKeepCorrupt(raw) {
  try {
    appStorage.setItem(`${LEDGER_KEY}.corrupt-${Date.now()}`, raw);
  } catch (error) {
    // Nothing to keep it in; the fresh ledger still starts.
  }
}

/** A ledger from another build: older ones are upgraded step by step, newer ones are read and never written back. */
function feelAdopt(parsed) {
  let ledger = parsed;
  while (ledger.version < LEDGER_VERSION) {
    const upgrade = LEDGER_UPGRADES[ledger.version];
    if (!upgrade) return null;
    ledger = upgrade(ledger);
  }
  if (ledger.version > LEDGER_VERSION) {
    feelState.readOnly = true;
    feelWarn(`ledger version ${ledger.version} is newer than ${LEDGER_VERSION}: read only`);
  }
  return feelClean({...feelEmptyLedger(), ...ledger, version: Math.min(ledger.version, LEDGER_VERSION)});
}

/** A stored ledger string as a clean ledger, or null when it is not one. */
function feelParse(raw) {
  try {
    const parsed = JSON.parse(raw);
    return feelLedgerShape(parsed) ? feelAdopt(parsed) : null;
  } catch (error) {
    return null;
  }
}

let feelLedgerCache = null;

function feelLedger() {
  if (feelLedgerCache) return feelLedgerCache;
  const raw = feelRaw(LEDGER_KEY);
  let ledger = null;
  if (raw !== null) {
    ledger = feelParse(raw);
    if (!ledger) {
      feelWarn(`${LEDGER_KEY}: unreadable, kept and replaced`);
      feelKeepCorrupt(raw);
    }
  }
  ledger = feelAbsorbDone(ledger || feelEmptyLedger());
  ledger.storage = feelProbeStorage();
  feelLedgerCache = ledger;
  feelSave(ledger);
  return ledger;
}

/* ---------- Label fit: the first variant that fits on one line (SPEC 2.3) ---------- */

/** Picks the longest variant that fits on one line; the last (shortest) one when none does. */
function fitLabel(el, variants) {
  el.classList.add('st-fit');
  el.dataset.variants = JSON.stringify(variants);
  for (const text of variants) {
    el.textContent = text;
    if (el.scrollWidth <= el.clientWidth + 0.5) return text;
  }
  return variants[variants.length - 1];
}

function fitLabels(root = document) {
  root.querySelectorAll('[data-variants]').forEach((el) => fitLabel(el, JSON.parse(el.dataset.variants)));
}

/* ---------- Lesson end and seals (M1: F9, F13, F37, F11, F17 end) ---------- */

/** Narration of the lesson end: the lesson's can-do line, or the seal's title and body when this completion earned one. */
function feelEndNarration(score, base) {
  const plan = feelState.end;
  if (!plan || plan.lesson !== currentLesson) return base;
  const ledger = feelLedger();
  let title = LESSONS[plan.lesson]?.outcome || 'Bu dersi bitirdin';
  let body = score.total ? 'Her kare bir soru.' : '';
  const seal = plan.ceremony;
  if (seal?.kind === 'row') {
    const count = feelKnownDone(ledger).length;
    title = `${count} ders bitti. Ders matrisinde ${count / COURSE_COLS}. satır doldu.`;
    body = 'Her üç ders bir satır; ara verince hiçbir şey silinmez.';
  } else if (seal?.kind === 'unit') {
    const unit = plan.unit;
    const share = UNIT_EXAM_SHARE[unit.id] ? ` Vizede ${UNIT_EXAM_SHARE[unit.id]}/${EXAM_QUESTIONS} soru bu üniteden.` : '';
    title = `${unit.label} ünitesi bitti.`;
    body = `Mührün kapandı.${share}`;
  }
  // The secret moment solved on this completion: its own title when the lesson end has no ceremony (the seal closed in the moment itself).
  if (plan.insight && !seal) title = FEEL_MOMENT.title;
  // Other seals earned by the same completion: one muted line, never a second ceremony.
  if (plan.extra) body += `${body ? '<br>' : ''}<span class="st-narr__extra">+ ${plan.extra} mühür daha · Profilinde</span>`;
  return {...base, title, body};
}

/** Counts the completion into the ledger and picks the ceremony: unit over row. The seal is saved first. */
function feelOnComplete({lesson: code}) {
  const ledger = feelMerge(feelLedger());
  const first = !ledger.lessonsDone.includes(code);
  const earned = feelAddDone(ledger, code, Date.now());
  if (first) feelSave(ledger);
  const ceremony = earned.find((seal) => seal.kind === 'unit') || earned.find((seal) => seal.kind === 'row') || null;
  const unit = ceremony?.kind === 'unit' ? UNITS.find((item) => `unit-${item.id}` === ceremony.id) : null;
  feelState.end = {lesson: code, first, earned, ceremony, unit, extra: earned.length - (ceremony ? 1 : 0)};
}

/** A copy of a scene object that keeps its look outside the scene (as the engine's ghostOut pins its cell vars). */
function feelFlyer(el, rect) {
  const flyer = el.cloneNode(true);
  const computed = getComputedStyle(el);
  ['--cell', '--cell-w', '--cell-font', '--cell-font-long'].forEach((name) => {
    const value = computed.getPropertyValue(name);
    if (value) flyer.style.setProperty(name, value);
  });
  flyer.classList.add('st-ghost');
  flyer.style.left = `${rect.x}px`;
  flyer.style.top = `${rect.y}px`;
  flyer.style.width = `${rect.w}px`;
  return flyer;
}

/**
 * The sizing rule of the lesson-end stage, one for every viewport and both screens (answers and ceremony): the duo
 * stacks above the matrix; its width is a share of the stage height (--end-duo-share) clamped between --duo-sm and
 * --duo-xl; the whole group (duo, matrix) fills --end-fill of the stage height, and the matrix takes the column
 * count that gives the largest cells in what is left. The chosen cell size becomes the scene's cap (--end-cell); the
 * engine's own fit (fitScene, --cell-solo) still guards the width. Returns the duo width, the group's top offset, the grid, the cell and
 * `sceneRows`, the scene's height in cell rows (for the engine's height fit).
 */
function feelEndLayout(count, fixedCols = 0) {
  const stageW = els.stage.clientWidth;
  const stageH = els.stage.clientHeight;
  const duoW = Math.min(tokenPx('--duo-xl'), Math.max(tokenPx('--duo-sm'), tokenNum('--end-duo-share') * stageH));
  const duoH = duoW * DUO_HEIGHT / (2 * DUO_HEAD - DUO_OVERLAP);
  const roomH = tokenNum('--end-fill') * stageH - duoH - 2 * tokenPx('--stage-gap');
  const roomW = stageW - 2 * tokenNum('--scene-inset', els.scene);
  const cap = tokenPx('--end-cell-max');
  const options = (fixedCols ? [fixedCols] : [...Array(4).keys()].map((i) => i + Math.min(3, count)).filter((cols) => cols <= Math.max(count, 1)))
    .map((cols) => {
      const rows = Math.max(1, Math.ceil(count / cols));
      // 0.5 cell of padding and bracket gaps across, 0.7 of name and padding down (the engine's own fit uses 0.8).
      return {cols, rows, cell: Math.min(cap, roomW / (cols + 0.5), roomH / (rows + 0.7)), pad: rows * cols - count};
    }).sort((a, b) => Math.round(b.cell) - Math.round(a.cell) || a.pad - b.pad);
  // A matrix that fills its last row (nine answers as 3 x 3) beats a ragged one (5 + 4) unless it costs more than a tenth of the cell.
  const largest = options[0];
  const best = (largest && options.filter((option) => option.cell >= largest.cell * (1 - FEEL_LAYOUT.padTolerance))
    .sort((a, b) => a.pad - b.pad || b.cell - a.cell)[0]) || {cols: 1, rows: 1, cell: cap, pad: 0};
  // Space above the group: the engine re-flows the stage for the next step (a taller narration shrinks it by about 60 px) before the
  // leaving duo is ghosted at its re-flowed position. A group that is merely centred then starts that ghost above the stage edge.
  const group = duoH + 2 * tokenPx('--stage-gap') + (best.rows + 0.7) * best.cell;
  const top = Math.max(0, tokenNum('--end-top-share') * (stageH - els.work.offsetHeight - group));
  return {duoW, top, cols: best.cols, rows: best.rows, cell: best.cell, sceneRows: best.rows + duoH / Math.max(best.cell, 1) + 0.5};
}

/** Applies a layout: the duo's width (a scene object, so the engine glides and scales it when it changes) and the scene's cell cap. */
function feelApplyLayout(duo, layout) {
  duo.style.setProperty('--duo-fit', `${Math.round(layout.duoW)}px`);
  els.scene.style.setProperty('--end-cell', `${Math.floor(layout.cell)}px`);
  els.scene.style.setProperty('--end-top', `${Math.round(layout.top)}px`);
  sizeScene([[layout.sceneRows, layout.cols]]);
}

/** The matrix the ceremony closes: the course matrix (row) or the unit's lessons (unit). */
function feelCourseSeal(plan) {
  const ledger = feelLedger();
  if (plan.ceremony.kind === 'unit') {
    const cells = plan.unit.lessons.map(([code]) => ({label: code, ink: true}));
    const cols = cells.length <= 6 ? 3 : 4;
    return {tier: 'unit', cols, name: plan.unit.label, cells, label: `${plan.unit.label} ünitesi`,
      newIndex: plan.unit.lessons.findIndex(([code]) => code === plan.lesson), inkCells: cells.map((_, index) => index)};
  }
  const done = feelKnownDone(ledger);
  const rows = done.length / COURSE_COLS;
  const first = (rows - Math.min(COURSE_ROWS_SHOWN, rows)) * COURSE_COLS;
  const cells = done.slice(first).map((code, index) => {
    const fresh = first + index >= done.length - COURSE_COLS;
    return {label: code, inked: !fresh, ink: fresh};
  });
  return {tier: 'row', cols: COURSE_COLS, name: 'Ders matrisi', cells, label: `${done.length} ders bitti`,
    newIndex: cells.length - 1, inkCells: cells.map((_, index) => index).slice(-COURSE_COLS)};
}

/**
 * The ceremony: the sealed answers shrink and travel into their cell of the course matrix, the matrix's brackets
 * close, and the new cells take ink. At most one per lesson end; the whole move stays under FEEL_TIMING.ceremonyCap.
 * Reduced motion has no travel: the answers crossfade out, the matrix crossfades in already sealed.
 */
function feelCeremony(plan, answers, oldDuo, mood) {
  const spec = feelCourseSeal(plan);
  const travel = Boolean(answers) && !reducedMotion.matches;
  feelMark('ceremony:start');
  let flyer = null;
  let source = null;
  if (travel) {
    source = rectIn(els.stage, answers);
    flyer = feelFlyer(answers, source);
    els.fx.appendChild(flyer);
    // The answers stay in the scene (hidden, no longer an object swapScene keeps) until swapScene has measured, so the retained duo
    // glides from where it stood; removing them first re-centres the scene and the duo would start from its already-moved box.
    delete answers.dataset.obj;
    answers.style.visibility = 'hidden';
  }
  const course = buildSeal({tier: spec.tier, id: `course:${spec.tier}`, name: spec.name, cols: spec.cols, cells: spec.cells,
    label: spec.label});
  const layout = feelEndLayout(spec.cells.length, spec.cols);
  // Reduced motion has no spatial channel: a duo that has to move to its new place is not carried there, a fresh one fades in
  // while the old one fades out (the engine's swapScene does both for a new element). With motion, the same duo glides.
  const duo = reducedMotion.matches ? duoEl({who: 'both', size: 'fit', mood}) : oldDuo;
  // The layout is applied inside swapScene (after it has measured where everything stands), so the retained duo glides from its old place.
  swapScene([duo, course], 'stack', {load: () => feelApplyLayout(duo, layout)});
  const cell = sealParts(course).cells[spec.newIndex];
  sealOpen(course);
  if (reducedMotion.matches) sealCloseNow(course);
  const land = () => {
    if (flyer) motion.to(flyer, {opacity: 0}, 'fade', {onArrive: () => flyer.remove()});
    motion.to(cell, {opacity: 1}, 'fade');
    sealClose(course, {inkCells: spec.inkCells,
      onClosed: () => feelSound.cue(`seal.${spec.tier}`),
      onDone: () => feelMark('ceremony:last-ink')});
  };
  if (!travel) {
    land();
    return;
  }
  motion.set(cell, {opacity: 0});
  // The course matrix is still rising into place; aim at where its cell will rest.
  const target = rectIn(els.stage, cell);
  const rise = motion.stateOf(course).y;
  const scale = Math.min(target.w / source.w, target.h / source.h);
  motion.to(flyer, {
    x: target.x + (target.w - source.w * scale) / 2 - source.x,
    y: target.y - rise + (target.h - source.h * scale) / 2 - source.y,
    scale,
  }, 'move', {onArrive: land});
}

/** Draws one answer into its cell: a check or a cross written like a pen stroke (the engine's own end cells). */
function feelFillAnswer(seal, index, result) {
  const cell = seal.querySelector(`[data-k="${index}"]`);
  if (!cell || result === null) return;
  cell.classList.remove('is-skipped');
  // `unknown` is the engine's "Bilmiyorum" result: a soft cell with no glyph, distinct from the check and from the neutral cross.
  const unknown = result === 'unknown';
  cell.classList.add(unknown ? 'is-unknown' : result ? 'is-result' : 'is-miss');
  cell.textContent = '';
  if (!unknown) {
    cell.innerHTML = glyphSvg(result ? 'check' : 'cross');
    drawGlyphs(cell);
  }
  motion.set(cell, {scale: 0.55});
  motion.to(cell, {scale: 1}, 'land');
}

/** The lesson end stage: the duo stacked above the answers matrix; its brackets close softly; a ceremony may follow. */
function feelEndScene(score) {
  const plan = feelState.end;
  const n = score.total;
  feelMark('end:start');
  const layout = feelEndLayout(n);
  const {cols, rows} = layout;
  // The summary step's duo (M2) carries over and glides into place, as the old mascot did; reduced motion uses a fresh one.
  const kept = FEEL_FLAGS.answer && !reducedMotion.matches ? els.scene.querySelector('[data-obj="mascot"][data-cast="duo"]') : null;
  const duo = kept || duoEl({who: 'both', size: 'fit'});
  const nodes = [duo];
  let answers = null;
  if (n) {
    const cells = score.results.map((result) => ({label: result === null ? '–' : '', className: 'is-skipped'}));
    for (let pad = n; pad < rows * cols; pad++) cells.push({label: '', className: 'st-seal__pad'});
    answers = buildSeal({tier: 'lesson', id: 'end:results', name: 'Cevapların', cols, cells,
      label: `${n} sorunun cevapları`});
    nodes.push(answers);
  }
  swapScene(nodes, 'stack', {load: () => {
    if (kept) {
      kept.classList.remove('st-duo--scene', 'st-duo--md');
      kept.classList.add('st-duo--fit');
      kept.dataset.obj = 'duo:both';
    }
    feelApplyLayout(duo, layout);
  }});
  if (answers) sealOpen(answers);
  // Pride is for finishing, not for a clean sheet: the first completion of a lesson and any ceremony, whatever the answers were.
  const mood = plan?.first || plan?.ceremony ? 'proud' : 'happy';
  if (plan) plan.mood = mood;
  const settled = () => {
    duoReact(duo, mood);
    if (plan?.ceremony) clock.after(FEEL_TIMING.ceremonyHold, () => feelCeremony(plan, answers, duo, mood));
    else feelMark('end:settled');
  };
  const start = CHOREO.stagger * 6;
  score.results.forEach((result, index) => clock.after(start + index * CHOREO.cellStagger, () => feelFillAnswer(answers, index, result)));
  const closeAt = start + n * CHOREO.cellStagger + CHOREO.stagger * 3;
  if (answers) {
    sealClose(answers, {delay: closeAt, onStart: () => feelMark('answers:close-start'),
      onClosed: () => { feelMark('answers:closed'); feelSound.cue('seal.lesson'); settled(); }});
  } else {
    clock.after(closeAt, settled);
  }
  // The next lesson's name rides along when it fits on one line; the code alone when it does not.
  const following = followingLesson(currentLesson);
  const nextButton = els.dock.querySelector('[data-action="next-lesson"]');
  if (nextButton && following) fitLabel(nextButton, [`Sıradaki: ${following} · ${lessonName(following)}`, `Sıradaki: ${following}`]);
}

/* ---------- Seam registration and QA hooks ---------- */

function feelBoot() {
  const lastSeen = feelLedger().lastSeen;
  if (FEEL_FLAGS.launch) feelLaunchBoot(lastSeen);
  feelTouch();
  els.brand.dataset.cast = 'brand';
  window.addEventListener('resize', () => fitLabels());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') feelTouch(); });
  window.addEventListener('pagehide', feelTouch);
  // A tap on the stage while the end screen plays lands everything in one frame; a button still acts at once.
  els.lessonView.addEventListener('pointerdown', (event) => {
    if (!feelState.end || event.target.closest('button')) return;
    if (motion.isActive() || clock.busy()) finishAll();
  }, true);
  if (FEEL_FLAGS.moment) feelMomentBoot();
  if (FEEL_FLAGS.touch) feelTouchBoot();
  if (FEEL_FLAGS.sound) feelSound.boot();
  feelHomeBoot();
  if (FEEL_FLAGS.shelf) feelProfileBoot();
  window.addEventListener('resize', feelOnResize);
  if (window.SATIR_QA) feelQaHooks();
}

function feelOn(name, detail) {
  if (window.SATIR_QA) feelState.events.push({name, at: clock.now, lesson: detail?.lesson ?? null, index: detail?.index ?? null});
  if (name === 'boot') feelBoot();
  else if (name === 'lesson:complete' && FEEL_FLAGS.end) feelOnComplete(detail);
  else if (name === 'step:leave') {
    if (FEEL_FLAGS.moment) feelMomentAbandon();
  }
  else if (name === 'answer') feelNoteWorked(detail);
  else if (name === 'view' && detail === 'map') feelOnMap(feelState.end);
  if (name === 'step:enter' || name === 'view') {
    if (FEEL_FLAGS.moment) feelMomentReset();
    feelState.end = null;
    if (name === 'step:enter') feelTouch();
  }
}

/**
 * The seam's catch: a failure in the feel layer must never stop the engine. The engine continues with its own code (a slot
 * falls back to its default); the failure is kept for QA and logged once.
 */
let feelFailed = false;
function feelFail(name, error) {
  feelWarn(`${name} failed: ${error?.message || error}`);
  if (name === 'lesson:complete') feelState.end = null;
  if (feelFailed) return;
  feelFailed = true;
  console.warn('Satır feel layer failed; falling back to the engine:', name, error);
}

/** Answers a lesson's questions correctly, the way a learner would (QA only). */
function feelAnswerAll() {
  const satir = window.satir;
  satir.steps.forEach((step, index) => {
    if (step.kind !== 'choice' && step.kind !== 'keypad') return;
    satir.goStep(index);
    satir.finish();
    if (step.kind === 'choice') {
      satir.answerChoice(step.options.findIndex((option) => option.correct));
    } else {
      String(Math.abs(step.answer)).split('').forEach((key) => satir.pressKey(key));
      if (step.answer < 0) satir.pressKey('−');
      satir.checkKeypad();
    }
    satir.finish();
  });
}

/** A lesson that is not playable yet (a draft) counts as done in the ledger only, with silent seals (QA only). */
function feelSeed(code) {
  const ledger = feelLedger();
  feelAddDone(ledger, code, Date.now(), true);
  feelSave(ledger);
  return {lesson: code, seeded: true};
}

function feelQaHooks() {
  window.satir.feel = {
    ledger: () => JSON.parse(JSON.stringify(feelLedger())),
    state: feelState,
    lessons: LESSONS,
    timing: FEEL_TIMING,
    flags: FEEL_FLAGS,
    cues: feelState.cues,
    warnings: feelState.warnings,
    cast: () => [...document.querySelectorAll('[data-cast]')]
      .filter((el) => !el.closest('[hidden]') && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => el.dataset.cast),
    /** Forgets the ledger and every satir.* key (this visit and storage), for a clean scripted start. */
    reset() {
      try {
        appStorage.keys().filter((key) => key.startsWith('satir.')).forEach((key) => appStorage.removeItem(key));
      } catch (error) {
        // Blocked storage: only the mirror below exists.
      }
      Object.keys(memoryStore).forEach((key) => delete memoryStore[key]);
      feelLedgerCache = null;
      feelState.readOnly = false;
      feelFailed = false;
      ['warnings', 'cues', 'timeline', 'events'].forEach((name) => { feelState[name].length = 0; });
      feelState.end = null;
      feelState.moment = null;
      feelLedger();
    },
    setSetting: feelSetting,
    simulate: {
      /** Bitir for tests that are not about the secret moment: completes the lesson and skips the moment if one shows (QA only). */
      bitir() {
        window.satir.complete();
        if (FEEL_FLAGS.moment && feelMoment) feelMomentLeave('skipped');
      },
      /** Opens a lesson and answers all its questions right, the way a learner would (stops before Bitir). */
      play(code) {
        window.satir.openLesson(0, code);
        window.satir.finish();
        feelAnswerAll();
      },
      /** Plays the real end of each lesson in turn and returns what each one earned. A draft (not ready) is only seeded. */
      complete(codes, {settleMs = FEEL_TIMING.endSettleCap + 1000} = {}) {
        return codes.map((code) => {
          if (!READY_LESSONS.has(code)) return feelSeed(code);
          window.satir.feel.simulate.play(code);
          window.satir.feel.simulate.bitir();
          window.satir.advance(settleMs);
          const end = feelState.end;
          return {lesson: code, first: end.first, ceremony: end.ceremony?.id ?? null, earned: end.earned.map((seal) => seal.id), extra: end.extra};
        });
      },
    },
  };
}

if (FEEL_ON) {
  window.satirFeel = {
    on: feelOn,
    fail: feelFail,
    slots: {
      ...(FEEL_FLAGS.end ? {endScene: feelEndScene, endNarration: feelEndNarration, stampFx: () => {}} : {}),
      ...(FEEL_FLAGS.moment ? {beforeEnd: feelBeforeEnd, stepEyebrow: feelStepEyebrow} : {}),
      ...(FEEL_FLAGS.answer ? {sheetMascot: feelSheetMascot, sheetReact: feelSheetReact, sceneMascot: feelSceneMascot,
        sceneReact: feelSceneReact, answerFx: () => {}} : {}),
    },
  };
}

/**
 * Satır lesson player 0.4.0: one fixed screen, spring physics, persistent math objects.
 * Expects globals from the page: UNITS and LESSONS (filled by lessons/<ID>.js files).
 * Lesson format and the beat catalogue: see LESSON_GUIDE.md. Tokens, components and motion presets:
 * see design/SATIR_DESIGN.md. Inlined into the page by tools/build-preview.py; do not edit the
 * generated page by hand.
 *
 * Every animation runs on one virtual clock (Clock + Motion below): springs, cue timers and particle
 * tickers. Nothing uses CSS keyframes, the Web Animations API or setTimeout, so a tap can finish any
 * running animation and tools/design-qa.js can step time deterministically (window.SATIR_QA).
 */

/* ---------- Motion tokens ---------- */

/**
 * Spring presets: stiffness k (mass 1) and damping ratio zeta. Durations come from physics.
 * Shared vocabulary with design-research/motion.md; when to use each: design/SATIR_DESIGN.md.
 */
/** An opacity spring from at most ENTRANCE_LOW to at least ENTRANCE_FULL is an entrance (SPRINGS.enter). */
const ENTRANCE_LOW = 0.1;
const ENTRANCE_FULL = 0.9;

const SPRINGS = {
  press: {k: 3800, zeta: 1},
  ui: {k: 1400, zeta: 0.9},
  move: {k: 700, zeta: 0.9},
  page: {k: 300, zeta: 0.9},
  teach: {k: 170, zeta: 0.8},
  teachY: {k: 260, zeta: 0.86},
  land: {k: 400, zeta: 0.6},
  fade: {k: 1600, zeta: 1},
  shake: {k: 1300, zeta: 0.2},
  draw: {k: 200, zeta: 1},
  leave: {k: 2600, zeta: 1},
  // The quickest any appearance may be (Motion.to): invisible to 0.9 opacity in 175 ms (critically
  // damped, ωt = 3.89 at 0.9). Above design-qa's 150 ms single-frame floor; SATIR_DESIGN's line entrance
  // is 150-200 ms. Faster presets (fade 97 ms, ui, press) slow to it for an entrance only.
  enter: {k: 500, zeta: 1},
  // Teaching runner: a carried number peaks below the eye's smooth-pursuit limit (~1000 px/s at phone
  // distance) and lands in ~0.6 s. The stiffer spring leads: y (down first), or x for the chips of a
  // group whose paths would cross (carrySide: sideways first, so they pass at least a row apart).
  carry: {k: 110, zeta: 0.9},
  carryY: {k: 160, zeta: 0.95},
  carrySide: {k: 300, zeta: 1},
};

/**
 * Teaching pace: the one calibration point for how calm teaching motion is (carry, combine, collect,
 * write, rewrite, highlight): every teaching motion takes TEACH_PACE times its spring-table time
 * (Eren, 2026-10-26: "öğrenme hareketinin temposu daha yavaş olsun"). Calibrated so every B1 entry
 * beat is at least 1.3 × the 21:37 pilot's (design-qa --baselines prints the ratios; 1.9 gives
 * ×1.31-1.43, none over 14 s). The runner's reading dwells stay in on-screen ms (TEACH): repetition
 * and dwell are cut, motion is not sped up. Chrome motion (press, tap response, screen transitions)
 * never uses it. design-qa derives its teaching limits from it.
 */
const TEACH_PACE = 1.6;

/**
 * Tempo per channel: a time scale for cue timers and springs started in that channel. Legacy timed
 * beats (the entry beat and the answer reveal) run at 1.5 (every line readable for about 1.2 s, review
 * of hotfix 1, H3) times the teaching pace; their cue times are their choreography, so both scale.
 */
const CUE_TEMPO = 1.5;
const TEMPO = {beat: CUE_TEMPO * TEACH_PACE, reveal: CUE_TEMPO * TEACH_PACE};

/**
 * Tempo classes (SATIR_DESIGN.md, Tempo classes; Eren 2026-10-27: "it doesn't need to be that slow" about
 * the sign pattern, after asking for slower teaching on 26 Oct). A beat's pace comes from what it teaches,
 * inferred from the beat itself (tempoClass), never set per lesson: only the lesson's new idea, the first
 * time it is shown, keeps the calm TEACH_PACE. Every class keeps the reading floors, the entrance floor and
 * the pursuit limit, so fast is a shorter visible travel, never a jump. `pace` scales a runner beat (its
 * springs, leads and staggers); `cue` scales a cue-timed beat (its cue times and springs).
 */
const TEMPO_CLASSES = {
  // Marks, signs, labels, layout: no number travels and nothing is calculated. Spring-table time and
  // cue times as written, like chrome: CUE_TEMPO's 1.5 was for reading lines (hotfix 1), which the
  // reading floor now guarantees, and a quick beat has nothing to follow but words the floor holds.
  quick: {pace: 1, cue: 1},
  // A move this lesson has already shown at the teaching pace: the 21:37 pilot's pace (1.9 gave
  // ×1.31-1.43 of it, so about 1.4 is ×1.0), which Eren followed; numbers still travel and combine.
  repeat: {pace: 1.1, cue: CUE_TEMPO * 1.1},
  // The new idea, the first time: the first carry of an operation, a calculation to follow.
  teach: {pace: TEACH_PACE, cue: CUE_TEMPO * TEACH_PACE},
};

/** The class each teaching channel is playing at now (set by useTempo before a beat is scheduled). */
const channelPace = {beat: TEMPO_CLASSES.teach, reveal: TEMPO_CLASSES.teach};

/**
 * Channels a teaching runner is playing run at their class pace: its springs and in-action
 * choreography (staggers, leads, holds) scale by it; the runner undoes it for reading dwells.
 */
const pacedChannels = new Set();

function tempoOf(name) {
  if (!(name in channelPace)) return 1;
  return pacedChannels.has(name) ? channelPace[name].pace : channelPace[name].cue;
}

/** A drawn word reads from half ink: when the critically damped draw spring passes 0.5 (ωt = 1.678). */
const DRAW_READ = 1678 / Math.sqrt(SPRINGS.draw.k);

/** Choreography timings (ms) and distances (px) for the chrome. Beats keep their own cue times. */
const CHOREO = {
  stagger: 35,
  beatDelay: 420,
  openDelay: 180,
  revealDelay: 160,
  correctDelay: 220,
  sheetDelay: 380,
  mascotDelay: 140,
  waveSpeed: 1.4,
  waveMax: 240,
  cellStagger: 80,
  glideHead: 90,
  tilesHead: 70,
  mapFadeDelay: 120,
  leaveHead: 120,
  markHold: 360,
  endMarksDelay: 600,
  noticeHold: 1800,
  prepHold: 1000,
  fontWait: 500,
  idlePoll: 50,
};
const SHIFT = {enter: 12, narr: 14, scene: 10, dock: 16, tiles: 36, count: 6};
/** Chrome lines (narration, dock) enter from this opacity, so a step change never shows an empty frame. */
const ENTER_FLOOR = 0.35;
/** A locked tile shakes its head by about 5 px (push speed for the 'shake' spring, px/s). */
const LOCKED_SHAKE = 180;
/** Every press, buttons, tabs, tiles and the stage card alike (RECHECK3: a softer press is missed). */
const PRESS_SCALE = 0.96;

/** Particle physics for celebrations (px, ms). */
const PHYSICS = {gravity: 2.2e-3, drag: 0.9985, spin: 0.7};

const TRANSFORM_PROPS = new Set(['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate']);
const PIXEL_PROPS = new Set(['x', 'y', 'rotate', 'count']);
const DEFAULTS = {x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, ink: 1};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- Physics ---------- */

/**
 * Channels separate teaching motion ('beat') from chrome motion ('chrome'). A tap on the primary
 * action finishes a running beat first; chrome motion never swallows a tap.
 */
let channel = 'chrome';

function withChannel(name, fn) {
  const previous = channel;
  channel = name;
  try {
    return fn();
  } finally {
    channel = previous;
  }
}

/** Timer queue on a virtual clock so animation can be advanced deterministically by tests. */
class Clock {
  constructor() {
    this.now = 0;
    this.timers = [];
    this.serial = 0;
  }

  after(ms, fn, gate = null) {
    this.timers.push({at: this.now + ms * tempoOf(channel), fn, serial: ++this.serial, channel, gate});
  }

  cancelAll() {
    this.timers = [];
  }

  busy(name) {
    return this.timers.some((timer) => !name || timer.channel === name);
  }

  popDue(limit, name = null) {
    let best = -1;
    this.timers.forEach((timer, index) => {
      if (timer.at > limit || (name && timer.channel !== name)) return;
      const current = this.timers[best];
      if (best < 0 || timer.at < current.at || (timer.at === current.at && timer.serial < current.serial)) {
        best = index;
      }
    });
    return best < 0 ? null : this.timers.splice(best, 1)[0];
  }

  run(timer) {
    const outer = cueGate;
    cueGate = timer.gate;
    timer.gate?.open();
    try {
      withChannel(timer.channel, timer.fn);
    } finally {
      cueGate = outer;
    }
  }

  advance(ms) {
    this.now += ms;
    let timer;
    while ((timer = this.popDue(this.now))) {
      // A held cue moves its beat's later cues with it: the author's spacing stays, only later.
      const ready = timer.gate?.readyAt() ?? 0;
      if (ready > timer.at) {
        const shift = ready - timer.at;
        this.timers.push(timer);
        this.timers.forEach((other) => {
          if (other.gate === timer.gate) other.at += shift;
        });
        continue;
      }
      this.run(timer);
    }
  }

  flushOne(name = null) {
    const timer = this.popDue(Infinity, name);
    if (!timer) return false;
    this.now = Math.max(this.now, timer.at);
    this.run(timer);
    return true;
  }
}

/**
 * Interruptible springs on transform, opacity and custom numeric channels (e.g. a stroke being drawn
 * or a number counting up, rendered by a bound function). New targets start from the live value and
 * velocity. Tickers run free physics (particles) on the same clock.
 */
class Motion {
  constructor() {
    this.states = new Map();
    this.tickers = [];
  }

  stateOf(el) {
    let state = this.states.get(el);
    if (!state) {
      state = {...DEFAULTS, springs: {}, arrivals: [], render: null};
      this.states.set(el, state);
    }
    return state;
  }

  /** Attaches a render function for custom channels; it runs after every update. */
  bind(el, render, values = {}) {
    const state = this.stateOf(el);
    state.render = render;
    Object.assign(state, values);
    this.apply(el, state);
    return state;
  }

  set(el, values) {
    const state = this.stateOf(el);
    for (const [prop, value] of Object.entries(values)) {
      state[prop] = value;
      delete state.springs[prop];
    }
    this.apply(el, state);
  }

  /**
   * Springs `targets` with a named preset. options: onArrive, epsilon (px), velocity ({prop: v} in
   * units per second, e.g. a shake or a hop starts at rest with a push), kScale (stiffness factor:
   * a long carry slows down to stay below the eye's pursuit limit).
   */
  to(el, targets, presetName, options = {}) {
    const state = this.stateOf(el);
    const preset = SPRINGS[presetName];
    if (!preset) throw new Error(`Unknown spring ${presetName}`);
    for (const [prop, target] of Object.entries(targets)) {
      if (state[prop] === undefined) state[prop] = DEFAULTS[prop] ?? 0;
      const effect = prop === 'opacity';
      // Reduced motion: only opacity animates; everything else lands at once.
      if (!effect && reducedMotion.matches) {
        state[prop] = target;
        delete state.springs[prop];
        continue;
      }
      // Effects (opacity) and custom channels never overshoot.
      const config = !TRANSFORM_PROPS.has(prop) && preset.zeta < 1 ? SPRINGS.fade : preset;
      const previous = state.springs[prop];
      const push = options.velocity?.[prop];
      // Tempo t scales time: stiffness by 1/t², pushes by 1/t; the damping ratio stays.
      const tempo = tempoOf(channel);
      let k = config.k * (options.kScale ?? 1) / (tempo * tempo);
      let zeta = config.zeta;
      // An entrance (from invisible to readable) is never quicker than SPRINGS.enter: nothing pops in.
      if (effect && state.opacity <= ENTRANCE_LOW && target >= ENTRANCE_FULL && k > SPRINGS.enter.k) {
        k = SPRINGS.enter.k;
        zeta = SPRINGS.enter.zeta;
      }
      state.springs[prop] = {
        k,
        c: 2 * zeta * Math.sqrt(k),
        target,
        velocity: push !== undefined ? push / tempo : (previous ? previous.velocity : 0),
        channel,
      };
    }
    if (options.onArrive) {
      state.arrivals.push({fn: options.onArrive, props: Object.keys(targets), epsilon: options.epsilon ?? 1.5, channel});
    }
    this.apply(el, state);
    this.checkArrivals(state);
  }

  /** Registers free physics: ticker.step(ms) returns false when done; ticker.finish() ends it at once. */
  addTicker(ticker) {
    ticker.channel = channel;
    this.tickers.push(ticker);
  }

  tick(ms) {
    const dt = ms / 1000;
    const substeps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / substeps;
    for (const [el, state] of this.states) {
      const props = Object.keys(state.springs);
      if (!props.length && !state.arrivals.length) {
        if (!el.isConnected) this.states.delete(el);
        continue;
      }
      for (const prop of props) {
        const spring = state.springs[prop];
        for (let i = 0; i < substeps; i++) {
          const accel = -spring.k * (state[prop] - spring.target) - spring.c * spring.velocity;
          spring.velocity += accel * h;
          state[prop] += spring.velocity * h;
        }
        const coarse = PIXEL_PROPS.has(prop);
        const doneDistance = coarse ? 0.05 : 0.0005;
        const doneVelocity = coarse ? 2 : 0.005;
        if (Math.abs(state[prop] - spring.target) < doneDistance && Math.abs(spring.velocity) < doneVelocity) {
          state[prop] = spring.target;
          delete state.springs[prop];
        }
      }
      this.apply(el, state);
      this.checkArrivals(state);
    }
    if (this.tickers.length) {
      const running = this.tickers;
      this.tickers = [];
      const alive = running.filter((ticker) => ticker.step(ms) !== false);
      this.tickers = alive.concat(this.tickers);
    }
    this.afterTick?.();
  }

  checkArrivals(state) {
    if (!state.arrivals.length) return;
    const fired = [];
    state.arrivals = state.arrivals.filter((arrival) => {
      const near = arrival.props.every((prop) => {
        const spring = state.springs[prop];
        if (!spring) return true;
        const epsilon = prop === 'x' || prop === 'y' ? arrival.epsilon : 0.02;
        return Math.abs(state[prop] - spring.target) < epsilon;
      });
      if (near) fired.push(arrival);
      return !near;
    });
    fired.forEach((arrival) => withChannel(arrival.channel, arrival.fn));
  }

  /**
   * True while channel `name` still shows motion: a spring more than a pixel (1 % for scale, 8 % for
   * opacity: text at 92 % reads as written) from its target, an arrival not yet fired, or a ticker.
   * Sub-pixel tails do not count.
   */
  isMoving(name) {
    for (const state of this.states.values()) {
      if (state.arrivals.some((arrival) => arrival.channel === name)) return true;
      for (const [prop, spring] of Object.entries(state.springs)) {
        if (spring.channel !== name) continue;
        const near = PIXEL_PROPS.has(prop) ? 1 : prop === 'opacity' ? 0.08 : 0.01;
        if (Math.abs(state[prop] - spring.target) > near || Math.abs(spring.velocity) > near * 20) return true;
      }
    }
    return this.tickers.some((ticker) => ticker.channel === name);
  }

  isActive(name, except = null) {
    for (const [el, state] of this.states) {
      if (except?.has(el)) continue;
      if (Object.values(state.springs).some((spring) => !name || spring.channel === name)) return true;
      if (state.arrivals.some((arrival) => !name || arrival.channel === name)) return true;
    }
    return this.tickers.some((ticker) => !name || ticker.channel === name);
  }

  /** Snaps every spring (or only those of channel `name`) to its target and ends the tickers. */
  snapAll(name = null, except = null) {
    const tickers = this.tickers.filter((ticker) => !name || ticker.channel === name);
    this.tickers = this.tickers.filter((ticker) => !tickers.includes(ticker));
    tickers.forEach((ticker) => ticker.finish());
    for (const [el, state] of this.states) {
      if (except?.has(el)) continue;
      let changed = false;
      for (const [prop, spring] of Object.entries(state.springs)) {
        if (name && spring.channel !== name) continue;
        state[prop] = spring.target;
        delete state.springs[prop];
        changed = true;
      }
      if (!changed && !state.arrivals.length) continue;
      this.apply(el, state);
      this.checkArrivals(state);
    }
    this.afterTick?.();
  }

  apply(el, state) {
    const sx = state.scale * state.scaleX;
    const sy = state.scale * state.scaleY;
    const identity = state.x === 0 && state.y === 0 && state.rotate === 0 && sx === 1 && sy === 1;
    if (el.style) {
      el.style.transform = identity ? '' :
        `translate3d(${state.x}px, ${state.y}px, 0)${state.rotate ? ` rotate(${state.rotate}deg)` : ''}` +
        ` scale(${sx}${sx === sy ? '' : `, ${sy}`})`;
      el.style.opacity = state.opacity === 1 ? '' : String(Math.max(0, Math.min(1, state.opacity)));
      // Ink dimmed under a passing chip (inkCheck): a filter, so it never fights the element's opacity.
      if (state.ink !== 1 || state.inked) {
        el.style.filter = state.ink < 0.999 ? `opacity(${Math.max(0, state.ink).toFixed(3)})` : '';
        state.inked = state.ink < 0.999;
      }
    }
    if (state.render) state.render(state, el);
  }
}

const clock = new Clock();
const motion = new Motion();

/** Cue limit for landing everything at once: a long Sarrus reveal is about 600 cues. */
const FINISH_GUARD = 5000;

/** Runs every pending cue and snaps every spring; used by "next" mid-animation and by tests. */
function finishAll() {
  rushRunners();
  // A press in progress (the İleri that lands a running beat) keeps its spring: it still shows.
  const pressing = new Set([...motion.states.keys()].filter((el) => el.matches?.(PRESSABLE) && motion.states.get(el).springs.scale));
  for (let guard = 0; guard < FINISH_GUARD; guard++) {
    motion.snapAll(null, pressing);
    if (!clock.flushOne() && !motion.isActive(null, pressing)) break;
  }
}

/**
 * Lands one channel on its end state (e.g. the entry beat when the learner answers early) and leaves
 * the rest running. The clock keeps its time, so chrome cues stay where they were.
 */
function finishChannel(name) {
  rushRunners(name);
  landNow(name);
}

/** Runs channel `name`'s cues and snaps its springs without rushing its runner (a given line). */
/** Lands channel `name` at once; elements in `except` (already on screen) keep gliding. */
function landNow(name, except = null) {
  const now = clock.now;
  for (let guard = 0; guard < FINISH_GUARD; guard++) {
    motion.snapAll(name, except);
    if (!clock.flushOne(name) && !motion.isActive(name, except)) break;
  }
  clock.now = now;
}

/**
 * A wait scheduled on a teaching channel that belongs to the chrome's timeline (the beat starts after
 * the step has entered): undoes the channel's tempo, so it stays in step with the chrome.
 */
function chromeDelay(ms) {
  return ms / tempoOf(channel);
}

/** Runs `fn` (on the chrome channel) once channel `name` has no cues and no motion left. */
function whenIdle(name, fn) {
  const check = () => {
    if (clock.busy(name) || motion.isActive(name) || runnerBusy(name)) clock.after(CHOREO.idlePoll, check);
    else fn();
  };
  withChannel('chrome', () => clock.after(CHOREO.idlePoll, check));
}

function advance(ms) {
  const frame = 1000 / 120;
  for (let t = 0; t < ms; t += frame) {
    clock.advance(frame);
    motion.tick(frame);
  }
}

if (!window.SATIR_QA) {
  let last = performance.now();
  const frame = (now) => {
    const ms = Math.min(64, now - last);
    last = now;
    clock.advance(ms);
    motion.tick(ms);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------- Helpers ---------- */

const byId = (id) => document.getElementById(id);
const els = {
  mapView: byId('map-view'), lessonView: byId('lesson-view'), tabs: byId('unit-tabs'), tiles: byId('tiles'),
  unitMeta: byId('unit-meta'), mapContinue: byId('map-continue'), mapTop: byId('map-top'), mapHead: byId('map-head'),
  mapDock: byId('map-dock'), mapGhost: byId('map-ghost'), brand: byId('brand'),
  countdown: byId('exam-countdown'), stage: byId('stage'), scene: byId('scene'), work: byId('work'),
  fx: byId('fx'), replay: byId('replay'), narr: byId('narr'), narrRow: byId('narr-row'), eyebrow: byId('eyebrow'),
  title: byId('title'), body: byId('body'), unclear: byId('unclear'), dock: byId('dock'), progress: byId('progress'),
  count: byId('count'), countLesson: byId('count-lesson'), close: byId('lesson-close'), back: byId('lesson-back'), top: byId('top'),
  overlay: byId('overlay'),
};

function formatNumber(value) {
  if (value === null || value === undefined) return '?';
  if (typeof value === 'string') return value.replace(/-/g, '−');
  return value < 0 ? `−${Math.abs(value)}` : String(value);
}

/** A factor written after another one (one formatter for every product: termText). */
function formatFactor(value) {
  return termText(value, '·', false);
}

function rectIn(container, el) {
  const outer = container.getBoundingClientRect();
  const inner = el.getBoundingClientRect();
  return {x: inner.left - outer.left, y: inner.top - outer.top, w: inner.width, h: inner.height};
}

/** Storage with an in-memory mirror, so a blocked localStorage (private mode) still works per visit. */
const memoryStore = {};

/** A stored value must have the fallback's shape (null: any object); a wrong one reads as missing. */
function shaped(value, fallback) {
  if (value === null || typeof value !== 'object') return false;
  return fallback === null || Array.isArray(value) === Array.isArray(fallback);
}

function storageGet(key, fallback) {
  try {
    const raw = appStorage.getItem(key);
    if (raw) {
      const value = JSON.parse(raw);
      if (shaped(value, fallback)) return value;
    }
  } catch (error) {
    // Fall through to the in-memory copy.
  }
  return key in memoryStore ? JSON.parse(memoryStore[key]) : fallback;
}

function storageSet(key, value) {
  memoryStore[key] = JSON.stringify(value);
  try {
    appStorage.setItem(key, memoryStore[key]);
  } catch (error) {
    // Storage can be unavailable (private mode, previews); the lesson still works.
  }
}

/**
 * Feel seam: the engine tells an optional feel layer (window.satirFeel, registered before this script runs)
 * what happens, and lets it replace a few named slots. Without that layer every call falls through to the
 * engine's own code, so a page built without it behaves exactly as before.
 */
const feel = window.satirFeel || null;

/** A feel failure never stops the engine: an event is dropped, a slot falls back to the engine's own function. */
function feelEmit(name, detail) {
  try {
    feel?.on?.(name, detail);
  } catch (error) {
    feel.fail?.(name, error);
  }
}

function feelSlot(name, fallback) {
  const slot = feel?.slots?.[name];
  if (!slot) return fallback;
  return (...args) => {
    try {
      return slot(...args);
    } catch (error) {
      feel.fail?.(name, error);
      return fallback(...args);
    }
  };
}

/** UC-4: whether this view can keep progress (probed once at boot); home says so once per visit if not. */
const storageBlocked = (() => {
  try {
    appStorage.setItem('satir.v3.probe', '1');
    appStorage.removeItem('satir.v3.probe');
    return false;
  } catch (error) {
    return true;
  }
})();
let storageNoticeShown = false;

const STORE = {
  progress: 'satir.v3.progress', done: 'satir.v3.done', answers: 'satir.v3.answers',
  unclear: 'satir.v3.unclear', run: 'satir.v3.run', picks: 'satir.v3.picks',
};

/** Deterministic pseudo-random numbers (mulberry32) so celebrations replay identically in QA. */
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashText(text) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Light haptics where the platform has them (Android); silent elsewhere and in tests. */
/** Haptic requests made (counted under QA too, where the device call is skipped): design-qa reads it. */
let hapticCalls = 0;

function haptic(pattern) {
  hapticCalls += 1;
  if (window.SATIR_QA || reducedMotion.matches) return;
  try {
    navigator.vibrate?.(pattern);
  } catch (error) {
    // Not available in this frame.
  }
}

/** A stroke icon whose path can be drawn with the 'draw' spring (pathLength 1). */
const GLYPHS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cross: 'M7 7l10 10M17 7L7 17',
  lock: 'M6.5 11h11v9h-11zM9 11V8a3 3 0 0 1 6 0v3',
};

function glyphSvg(name) {
  return `<svg class="st-glyph" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="${GLYPHS[name]}"/></svg>`;
}

/** Draws every glyph path inside `root` from nothing (stroke dash on a custom spring channel). */
function drawGlyphs(root, delay = 0) {
  root.querySelectorAll('.st-glyph path').forEach((path) => {
    motion.bind(path, (state, el) => {
      el.style.strokeDasharray = '1';
      el.style.strokeDashoffset = String(1 - state.draw);
      // A round cap would show a dot before the stroke starts.
      el.style.visibility = state.draw < 0.01 ? 'hidden' : '';
    }, {draw: 0});
    clock.after(delay, () => motion.to(path, {draw: 1}, 'draw'));
  });
}

/** Throws celebration sparks from `origin` (px, inside `layer`). Free physics; skipped in reduced motion. */
function burst(layer, origin, options) {
  if (reducedMotion.matches || !layer) return;
  const {count, speed, spread = Math.PI * 0.9, life = 900, seed = 1, glyphs = [], kinds = ['row', 'col', 'ok', 'accent']} = options;
  const random = seededRandom(seed);
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    const glyph = glyphs.length && i % 4 === 3 ? glyphs[i % glyphs.length] : '';
    el.className = `st-spark st-spark--${kinds[i % kinds.length]}${glyph ? ' st-spark--glyph' : ''}`;
    el.textContent = glyph;
    layer.appendChild(el);
    const angle = -Math.PI / 2 + (random() - 0.5) * spread;
    const v = speed * (0.45 + random() * 0.75);
    pieces.push({
      el, x: origin.x, y: origin.y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v,
      r: random() * 90, vr: (random() - 0.5) * PHYSICS.spin, age: 0, life: life * (0.7 + random() * 0.5),
      sx: 0.6 + random() * 0.8,
    });
  }
  const render = (piece) => {
    const fade = Math.max(0, Math.min(1, (piece.life - piece.age) / 220));
    piece.el.style.transform = `translate3d(${piece.x}px, ${piece.y}px, 0) rotate(${piece.r}deg) scale(${piece.sx}, 1)`;
    piece.el.style.opacity = String(fade);
  };
  pieces.forEach(render);
  motion.addTicker({
    step(ms) {
      for (const piece of pieces) {
        if (piece.age >= piece.life) continue;
        const steps = Math.max(1, Math.round(ms / 4));
        const h = ms / steps;
        for (let s = 0; s < steps; s++) {
          piece.vy += PHYSICS.gravity * h;
          piece.vx *= PHYSICS.drag ** h;
          piece.vy *= PHYSICS.drag ** h;
          piece.x += piece.vx * h;
          piece.y += piece.vy * h;
          piece.r += piece.vr * h;
        }
        piece.age += ms;
        render(piece);
        if (piece.age >= piece.life) piece.el.remove();
      }
      return pieces.some((piece) => piece.age < piece.life);
    },
    finish() {
      pieces.forEach((piece) => piece.el.remove());
    },
  });
}

/* ---------- Mascot ---------- */

/** A 1×2 matrix face: brackets are its arms, two eyes and a mouth. Parts animate separately. */
function mascotSvg(mood, extraClass = '') {
  const eyes = mood === 'oops' ?
    '<circle class="st-mascot__eye" cx="16" cy="19" r="2.4"/><circle class="st-mascot__eye" cx="24" cy="19" r="2.4"/>' :
    '<path class="st-mascot__smile" d="M13.5 19.5q2.5-3 5 0M21.5 19.5q2.5-3 5 0"/>';
  const mouth = mood === 'oops' ?
    '<path class="st-mascot__smile" d="M16.5 27h7"/>' :
    '<path class="st-mascot__smile" d="M15.5 25.5q4.5 4 9 0"/>';
  return `<svg class="st-mascot ${extraClass}" viewBox="0 0 40 40" aria-hidden="true"><g class="st-mascot__body">` +
    '<path class="st-mascot__bracket st-mascot__arm" data-side="-1" d="M10 6H6v28h4"/>' +
    '<path class="st-mascot__bracket st-mascot__arm" data-side="1" d="M30 6h4v28h-4"/>' +
    `<g class="st-mascot__eyes">${eyes}</g>${mouth}</g></svg>`;
}

function mascotParts(svg) {
  return {
    body: svg.querySelector('.st-mascot__body'),
    arms: [...svg.querySelectorAll('.st-mascot__arm')],
    eyes: svg.querySelector('.st-mascot__eyes'),
  };
}

/** Joy: a hop with stretch and squash, arms (brackets) fling open and spring back. */
function cheerMascot(svg, strength = 1) {
  if (!svg) return;
  const {body, arms} = mascotParts(svg);
  motion.to(body, {y: 0}, 'land', {velocity: {y: -150 * strength}});
  motion.to(body, {scaleY: 1, scaleX: 1}, 'land', {velocity: {scaleY: 2.2 * strength, scaleX: -1.4 * strength}});
  arms.forEach((arm) => motion.to(arm, {x: 0}, 'land', {velocity: {x: Number(arm.dataset.side) * 70 * strength}}));
}

/** Oops: a small wobble and a blink, no drama. */
function worryMascot(svg) {
  if (!svg) return;
  const {body, eyes} = mascotParts(svg);
  motion.to(body, {rotate: 0}, 'land', {velocity: {rotate: -110}});
  blinkMascot(eyes);
}

function blinkMascot(eyes) {
  if (!eyes) return;
  motion.set(eyes, {scaleY: 0.12});
  motion.to(eyes, {scaleY: 1}, 'move');
}

/* ---------- Lessons ---------- */

const READY_LESSONS = new Set(Object.keys(LESSONS));
const LESSON_ORDER = UNITS.flatMap((unit) => unit.lessons.map(([code]) => code)).filter((code) => READY_LESSONS.has(code));
let MATRICES = {};
let STEPS = [];
let LABELS = {};
let currentLesson = null;

function lessonName(code) {
  for (const unit of UNITS) {
    const found = unit.lessons.find(([id]) => id === code);
    if (found) return found[1];
  }
  return LESSONS[code]?.title || code;
}

function unitOf(code) {
  return UNITS.find((unit) => unit.lessons.some(([id]) => id === code))?.id || UNITS[0].id;
}

/** Makes `code` the current lesson; the scene, steps and labels all come from its file. */
function useLesson(code) {
  const data = LESSONS[code];
  if (!data) throw new Error(`Unknown lesson ${code}`);
  currentLesson = code;
  MATRICES = data.matrices || {};
  STEPS = data.steps;
  LABELS = data.labels || {};
  lesson.answered = null;
  els.scene.replaceChildren();
}

const lesson = {index: 0, mats: {}, labels: {}, answered: null, keypadValue: '', complete: false, streak: 0};

const OPERATORS = {'op:dot': '·', 'op:eq': '=', 'op:plus': '+', 'op:minus': '−', 'op:times': '×', 'op:arrow': '→', 'op:neq': '≠'};

function createObject(id) {
  if (id.startsWith('op:')) {
    const op = document.createElement('span');
    op.className = 'st-obj st-op';
    op.dataset.obj = id;
    op.textContent = OPERATORS[id] ?? id.slice(3);
    op.setAttribute('aria-hidden', 'true');
    return op;
  }
  if (LABELS[id] !== undefined) {
    const label = document.createElement('span');
    label.className = 'st-obj st-label';
    label.dataset.obj = id;
    return label;
  }
  if (id === 'mascot') {
    return feelSlot('sceneMascot', () => {
      const wrap = document.createElement('div');
      wrap.className = 'st-obj';
      wrap.dataset.obj = id;
      wrap.innerHTML = mascotSvg('happy', 'st-mascot--big');
      return wrap;
    })();
  }
  const spec = MATRICES[id];
  const mat = document.createElement('div');
  mat.className = `st-obj st-mat${spec.bars ? ' st-mat--det' : ''}`;
  mat.dataset.obj = id;
  const cols = spec.values[0].length;
  const cells = spec.values.map((row, i) => row.map((value, j) => {
    const aug = spec.augmented && j === cols - 1 ? ' st-cell--aug' : '';
    return `<span class="st-cell${aug}" data-i="${i}" data-j="${j}"></span>`;
  }).join('')).join('');
  mat.innerHTML = `<span class="st-mat__name">${spec.name}</span>` +
    `<div class="st-mat__grid" style="--cols:${cols}" role="img">${cells}</div>`;
  return mat;
}

function cellEl(matId, i, j) {
  return els.scene.querySelector(`[data-obj="${matId}"] .st-cell[data-i="${i}"][data-j="${j}"]`);
}

function setCell(matId, i, j, value, options = {}) {
  lesson.mats[matId][i][j] = value;
  const cell = cellEl(matId, i, j);
  if (!cell) return;
  // The landing pop is an entrance: a cell that already reads a value changes in place (a pop from half
  // size over a written value is a one-frame size cut).
  const blank = !cell.textContent.trim() || cell.textContent.trim() === '?';
  const write = () => {
    cell.textContent = formatNumber(value);
    cell.classList.toggle('is-unknown', value === null);
    cell.classList.toggle('is-long', cell.textContent.length > 2);
    fitLongEntries(matId);
  };
  // A value that changes its matrix's column width moves the objects beside it: on a live stage they
  // glide (flipScene). Loading a scene (glide: false) is laid out by swapScene.
  const mat = els.scene.querySelector(`[data-obj="${matId}"]`);
  const longest = String(Math.max(...lesson.mats[matId].flat().map((entry) => formatNumber(entry).length)));
  if (options.glide !== false && mat && mat.style.getPropertyValue('--long') !== longest) flipScene(write);
  else write();
  if (options.land && blank) {
    motion.set(cell, {scale: 0.55});
    motion.to(cell, {scale: 1}, 'land');
  }
}

/** Widens a matrix's columns to its longest entry (CSS reads --long), so long entries keep their size. */
function fitLongEntries(matId) {
  const mat = els.scene.querySelector(`[data-obj="${matId}"]`);
  if (!mat) return;
  const longest = Math.max(...lesson.mats[matId].flat().map((value) => formatNumber(value).length));
  mat.style.setProperty('--long', String(longest));
}

/** Tells the scene how big its matrices are so solo and stacked scenes scale down to fit. */
function sizeScene(dims) {
  const rows = Math.max(2, ...dims.map(([r]) => r));
  const cols = Math.max(2, dims.reduce((sum, [, c]) => sum + c, 0));
  els.scene.style.setProperty('--scene-rows', String(rows));
  els.scene.style.setProperty('--scene-cols', String(cols));
}

function describeMatrix(matId) {
  const rows = lesson.mats[matId].map((row) => row.map(formatNumber).join(' ')).join('; ');
  const grid = els.scene.querySelector(`[data-obj="${matId}"] .st-mat__grid`);
  if (grid) grid.setAttribute('aria-label', `${MATRICES[matId].name}: ${rows}`);
}

const MARK_CLASSES = ['is-row', 'is-col', 'is-target', 'is-result', 'is-wrong', 'is-struck', 'is-pivot'];

/**
 * Marks repaint, they never blank: clearMarks() keeps the old marks until the next mark lands (or
 * CHOREO.markHold passes), so cells change colour straight from the old mark to the new one.
 * `now` clears at once (a new step's scene).
 */
let marksStale = false;
let staleSerial = 0;
let restruck = new Set();

function clearMarks(now = false) {
  if (now) {
    applyClear(false);
    return;
  }
  if (marksStale) return;
  marksStale = true;
  // Only this pending clear may fire: once a new mark has repainted, the hold timer does nothing.
  const serial = ++staleSerial;
  // In a cue-timed beat the held clear is a cue: it waits for the reading floor like any other start.
  cue(CHOREO.markHold, () => {
    if (marksStale && serial === staleSerial) applyClear(false);
  });
}

/** Removes the marks. `repaint`: a new mark follows in the same tick, so struck cells keep their line. */
function applyClear(repaint) {
  marksStale = false;
  restruck = new Set();
  els.scene.querySelectorAll('.st-cell').forEach((cell) => {
    if (repaint && cell.querySelector('.st-cell__strike')) restruck.add(cell);
    cell.classList.remove(...MARK_CLASSES);
  });
  els.scene.querySelectorAll('.st-cell__strike').forEach((line) => line.remove());
}

/**
 * Crossed-out entries (is-struck) get a pen line drawn through them on a spring: along the row when
 * the struck cells share a row, down the column when they share a column, diagonal otherwise.
 */
function strike(cells, cellsOf) {
  const sameRow = cells.every(([i]) => i === cells[0][0]);
  const sameCol = !sameRow && cells.every(([, j]) => j === cells[0][1]);
  const axis = sameRow ? 'h' : sameCol ? 'v' : 'd';
  cells.forEach(([i, j], index) => {
    const cell = cellsOf(i, j);
    if (!cell || cell.querySelector('.st-cell__strike')) return;
    const line = document.createElement('span');
    line.className = `st-cell__strike st-cell__strike--${axis}`;
    line.setAttribute('aria-hidden', 'true');
    cell.appendChild(line);
    const prop = axis === 'v' ? 'scaleY' : 'scaleX';
    // Struck before the repaint: the line stays drawn instead of being drawn again.
    if (restruck.has(cell)) return;
    motion.set(line, {[prop]: 0});
    clock.after(index * CHOREO.stagger, () => motion.to(line, {[prop]: 1}, 'move'));
  });
}

function mark(matId, cells, className) {
  if (marksStale) applyClear(true);
  cells.forEach(([i, j]) => cellEl(matId, i, j)?.classList.add(className));
  if (className === 'is-struck' && cells.length) strike(cells, (i, j) => cellEl(matId, i, j));
}

/** Expands a mark spec [mat, i, j, class]; i or j may be '*' for a whole column or row. */
function applyMark([matId, i, j, className]) {
  const rows = lesson.mats[matId];
  if (!rows) return;
  const cells = [];
  rows.forEach((row, r) => row.forEach((_, c) => {
    if ((i === '*' || i === r) && (j === '*' || j === c)) cells.push([r, c]);
  }));
  mark(matId, cells, className);
}

function setLabel(id, html, options = {}) {
  lesson.labels[id] = html;
  const el = els.scene.querySelector(`[data-obj="${id}"]`);
  if (!el) return;
  // A label written where nothing read before enters (SPRINGS.enter): it never pops in.
  const appears = options.fit !== false && !el.textContent.trim() && html.replace(/<[^>]*>/g, '').trim();
  // A new scene is fitted by swapScene; a label changed on a live stage glides its neighbours (and any
  // refit) into place.
  if (options.fit === false) {
    el.innerHTML = html;
    padLabel(el);
  } else {
    flipScene(() => {
      el.innerHTML = html;
      padLabel(el);
      refitScene();
    }, el);
  }
  if (appears) {
    motion.set(el, {opacity: 0});
    motion.to(el, {opacity: 1}, 'fade');
  }
  if (options.land) {
    motion.set(el, {scale: 0.85});
    motion.to(el, {scale: 1}, 'land');
  }
}

function rowCells(matId, i) {
  return lesson.mats[matId][i].map((_, j) => [i, j]);
}

function colCells(matId, j) {
  return lesson.mats[matId].map((_, i) => [i, j]);
}

function loadMatrices(step) {
  for (const id of step.scene.items) {
    if (!MATRICES[id]) continue;
    const source = step.state?.[id] || MATRICES[id].values;
    lesson.mats[id] = source.map((row) => row.slice());
    lesson.mats[id].forEach((row, i) => row.forEach((value, j) => setCell(id, i, j, value, {glide: false})));
    describeMatrix(id);
  }
  for (const id of step.scene.items) {
    if (LABELS[id] !== undefined) setLabel(id, step.labels?.[id] ?? LABELS[id], {fit: false});
  }
  clearMarks(true);
  (step.marks || []).forEach(applyMark);
}

/** A leaving scene object fades out where it stood; it never jumps. */
function ghostOut(el, rect) {
  // Outside the scene the object would lose the scene's cell size and reflow; pin it first.
  const computed = getComputedStyle(el);
  ['--cell', '--cell-w', '--cell-font', '--cell-font-long'].forEach((name) => {
    const value = computed.getPropertyValue(name);
    if (value) el.style.setProperty(name, value);
  });
  el.classList.add('st-ghost');
  el.style.left = `${rect.x}px`;
  el.style.top = `${rect.y}px`;
  el.style.width = `${rect.w}px`;
  els.fx.appendChild(el);
  // Quick, so it is nearly gone before anything new takes its pixels.
  motion.to(el, {opacity: 0}, 'leave', {onArrive: () => el.remove()});
}

/**
 * New scene objects rise in, one after another from left to right. Always from below, whatever the
 * travel direction: rising from above would cut tall matrices at the stage's top edge.
 */
function riseIn(nodes, delay = 0) {
  nodes.forEach((el, index) => {
    motion.set(el, {opacity: 0, y: SHIFT.scene});
    clock.after(delay + index * CHOREO.stagger, () => motion.to(el, {opacity: 1, y: 0}, 'move'));
  });
}

/**
 * Builds the scene for `items` (ids, or ready-made nodes for engine scenes such as the lesson end).
 * Persistent objects glide from where they were (FLIP); new ones rise in; leaving ones fade in place.
 */
function swapScene(nextEls, mode, options = {}) {
  const before = new Map();
  els.scene.querySelectorAll('[data-obj]').forEach((el) => {
    before.set(el.dataset.obj, {el, rect: rectIn(els.stage, el)});
  });
  let leaving = 0;
  before.forEach(({el, rect}) => {
    if (nextEls.includes(el)) return;
    ghostOut(el, rect);
    leaving++;
  });
  els.scene.className = `st-scene${mode ? ` st-scene--${mode}` : ''}`;
  els.scene.replaceChildren(...nextEls);
  options.load?.();
  fitScene(options.step);
  const entering = [];
  let glides = false;
  nextEls.forEach((el) => {
    const previous = before.get(el.dataset.obj);
    if (previous && previous.el === el) {
      const rect = rectIn(els.stage, el);
      // A resized object (same content, new cell size) glides and scales from its old box. One whose
      // content changed shape (a label with other text) only glides, centre to centre: scaling it would
      // blow its text up.
      const sw = previous.rect.w / rect.w;
      const sh = previous.rect.h / rect.h;
      if (Math.abs(sw - sh) < 0.08) {
        motion.set(el, {x: previous.rect.x - rect.x, y: previous.rect.y - rect.y, scale: sw});
      } else {
        motion.set(el, {x: previous.rect.x + previous.rect.w / 2 - rect.x - rect.w / 2, y: previous.rect.y + previous.rect.h / 2 - rect.y - rect.h / 2});
      }
      motion.to(el, {x: 0, y: 0, scale: 1}, 'move');
      glides = true;
    } else {
      entering.push(el);
    }
  });
  // Newcomers wait until leaving objects are nearly gone and staying ones have mostly made room.
  const head = Math.max(leaving ? CHOREO.leaveHead : 0, glides ? CHOREO.glideHead : 0);
  riseIn(entering, (options.delay || 0) + (entering.length ? head : 0));
  return entering;
}

/**
 * Lets matrices grow into the stage's width: measures the scene's content at the current cell size
 * and tells CSS the cell size that would fill the width (--cell-fit-x). CSS still caps it by height
 * and by the cell token's maximum, so tall phones get bigger cells and narrow scenes never overflow.
 */
function sceneRoom() {
  const inset = parseFloat(getComputedStyle(els.scene).getPropertyValue('--scene-inset')) || 0;
  const stage = getComputedStyle(els.stage);
  const px = (name) => parseFloat(stage.getPropertyValue(name)) || 0;
  // A corner column (the transport on top, fold chips beside the scene): the centred scene keeps it
  // clear on both sides.
  let column = inset;
  if (els.stage.classList.contains('is-transport-top')) column = Math.max(column, px('--space-xs') + px('--hit') + px('--work-gap-transport'));
  if (els.stage.classList.contains('is-fold-side')) column = Math.max(column, px('--space-xs') + px('--fold-side-w') + px('--work-gap-transport'));
  return els.stage.clientWidth - 2 * column;
}

/** Width of the scene's content, gaps and margins included (layout positions, not transforms). */
function sceneWidth() {
  const kids = [...els.scene.children];
  if (!kids.length) return 0;
  const left = Math.min(...kids.map((el) => el.offsetLeft));
  return Math.max(...kids.map((el) => el.offsetLeft + el.offsetWidth)) - left;
}

/** The work line never outgrows the numbers it explains: its font is capped at the cells' font. */
function fitWorkCap() {
  const cell = els.scene.querySelector('.st-cell');
  if (cell) els.stage.style.setProperty('--work-cap', getComputedStyle(cell).fontSize);
  else els.stage.style.removeProperty('--work-cap');
}

/**
 * Label texts a step's beats will write, by label id (so the fit leaves room for the longest from the
 * start): a script's label frames, and the labels a runner's derivation writes its result into.
 */
const plannedLabels = new WeakMap();
function scriptedLabels(step) {
  if (!step) return {};
  if (!plannedLabels.has(step)) plannedLabels.set(step, collectLabels(step));
  return plannedLabels.get(step);
}
function collectLabels(step) {
  const found = {};
  [step?.beat, step?.reveal].forEach((beat) => {
    if (!beat) return;
    if (beat.type === 'script') {
      beat.frames.forEach((frame) => {
        if (frame.label) (found[frame.label[0]] ||= []).push(frame.label[1]);
      });
      return;
    }
    const actions = compileBeat(beat, beat === step.reveal ? 'reveal' : 'teach', stepMats(step));
    (actions?.labelWrites || []).forEach(([id, html]) => (found[id] ||= []).push(html));
  });
  return found;
}

function fitScene(step = null) {
  const scene = els.scene;
  scene.style.removeProperty('--cell-fit-x');
  reserveLabelHeights(step);
  const cell = scene.querySelector('.st-cell');
  if (!cell || !scene.children.length) {
    fitWorkCap();
    return;
  }
  const room = sceneRoom();
  // While measuring, each label holds the widest text it will show in this step.
  const restore = [];
  Object.entries(scriptedLabels(step)).forEach(([id, texts]) => {
    const label = scene.querySelector(`[data-obj="${id}"]`);
    if (!label) return;
    const current = label.innerHTML;
    let widest = current;
    let max = label.offsetWidth;
    texts.forEach((html) => {
      label.innerHTML = html;
      if (label.offsetWidth > max) {
        max = label.offsetWidth;
        widest = html;
      }
    });
    label.innerHTML = widest;
    restore.push([label, current]);
  });
  try {
    fitWidth(cell, room);
  } finally {
    restore.forEach(([label, html]) => {
      label.innerHTML = html;
    });
  }
  fitWorkCap();
}

/**
 * Each label keeps the height of the tallest text it will show this step (a two-line result), so a label
 * that grows mid-step never moves the scene and the work under it (CHECK5: "katsayı → 2ⁿ" was crossed).
 */
function reserveLabelHeights(step) {
  els.scene.querySelectorAll('.st-label').forEach((label) => {
    label.style.removeProperty('padding-block');
    delete label.dataset.reserve;
    const texts = scriptedLabels(step)[label.dataset.obj];
    if (!texts) return;
    const current = label.innerHTML;
    const own = label.offsetHeight;
    let max = own;
    texts.forEach((html) => {
      label.innerHTML = html;
      max = Math.max(max, label.offsetHeight);
    });
    label.innerHTML = current;
    if (max > own) {
      label.dataset.own = String(own);
      label.dataset.reserve = String(max);
    }
  });
  capLabelReserve();
}

/** A reserve never takes more than the room the stage has left above the work (a label-only scene has no cell to give way). */
function capLabelReserve() {
  const labels = [...els.scene.querySelectorAll('.st-label[data-reserve]')];
  if (!labels.length) return;
  const gap = parseFloat(getComputedStyle(els.stage).rowGap) || 0;
  const room = els.stage.clientHeight - els.work.offsetHeight - gap;
  labels.forEach(padLabel);
  labels.sort((a, b) => Number(b.dataset.reserve) - Number(a.dataset.reserve)).forEach((label) => {
    const over = Math.max(...[...els.scene.children].map((el) => el.offsetHeight)) - room;
    if (over <= 0) return;
    label.dataset.reserve = String(Math.max(Number(label.dataset.own), Number(label.dataset.reserve) - over));
    padLabel(label);
  });
}

/** Centres a label's text in its reserved height (equal padding above and below). */
function padLabel(label) {
  if (!label.dataset.reserve) return;
  label.style.removeProperty('padding-block');
  const pad = Math.max(0, (Number(label.dataset.reserve) - label.offsetHeight) / 2);
  if (pad) label.style.paddingBlock = `${pad}px`;
}

function fitWidth(cell, room) {
  const scene = els.scene;
  const measure = sceneWidth;
  // Not every part scales with the cell (labels have a minimum font size), so iterate a few times.
  let fit = 0;
  for (let pass = 0; pass < 4; pass++) {
    const size = cell.offsetHeight;
    const width = measure();
    if (!size || !width || room <= 0) return;
    if (Math.abs(width - room) < 2 || (fit && size < fit - 1 && width <= room)) return;
    fit = Math.floor(size * room / width * 10) / 10;
    scene.style.setProperty('--cell-fit-x', `${fit}px`);
  }
  // Still too wide after the passes: shrink once more by the overshoot.
  const width = measure();
  if (width > room) scene.style.setProperty('--cell-fit-x', `${Math.floor(fit * room / width * 10) / 10}px`);
}

/**
 * Fallback for a label a beat wrote that the step's fit did not foresee: if the scene no longer fits,
 * refit. Callers run it inside flipScene, so the refit glides (its start held inside the stage).
 */
function refitScene() {
  if (sceneWidth() <= sceneRoom() + 1) return;
  fitScene(lesson.complete ? null : STEPS[lesson.index]);
}

/**
 * A glide's start box held inside the stage. What would stick out below is taken half by moving the box
 * up and half by starting it a little smaller (scale about its top-left), so neither is a visible jump
 * (design-qa scene-snap: 8 px, 4 %).
 */
function startInside(now, dy, scale, stage) {
  const below = now.top + dy + now.height * scale - stage.bottom;
  if (below > 0) {
    dy -= below / 2;
    scale -= below / 2 / (now.height || 1);
  }
  const above = stage.top - (now.top + dy);
  if (above > 0) dy += above;
  return {dy, scale};
}

/**
 * Every re-layout of a live stage glides: scene objects (and the work and narration below them) are
 * measured, `mutate` changes the layout, and each moves from its old box to its new one on the 'move'
 * spring of the current channel (the teaching pace inside a beat), as folds do. A scene object's start
 * stays inside the stage; `own` (an element whose content changed) only moves, it does not scale.
 */
function flipScene(mutate, own = null) {
  const objects = [...els.scene.querySelectorAll('[data-obj]')];
  const targets = [...objects, els.work, els.narr];
  const before = targets.map((el) => el.getBoundingClientRect());
  // Cells move inside their matrix too (a wider column pushes its neighbours, a refit shrinks them).
  const cells = [...els.scene.querySelectorAll('.st-cell')].filter((el) => !el.querySelector('.st-cell'));
  const cellsBefore = cells.map((el) => el.getBoundingClientRect());
  mutate();
  const stage = els.stage.getBoundingClientRect();
  targets.forEach((el, index) => {
    if (!el.isConnected) return;
    const now = el.getBoundingClientRect();
    const state = motion.stateOf(el);
    const object = objects.includes(el);
    // Width and height each glide from the old box: a matrix that widens (a long entry) and refits
    // keeps its height continuous too (a uniform scale would cut it).
    const sized = object && el !== own && now.width && now.height;
    const sx = sized ? before[index].width / now.width : 1;
    let scale = sized ? before[index].height / now.height : 1;
    let dx = before[index].left - now.left;
    let dy = before[index].top - now.top;
    if (object) ({dy, scale} = startInside(now, dy, scale, stage));
    // Nor from past a side of the stage: a label that widens at the edge ("?" → "ad − bc") starts inside.
    if (object) dx = Math.min(Math.max(dx, stage.left - now.left), Math.max(0, stage.right - now.left - now.width * sx));
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.005 && Math.abs(scale - 1) < 0.005) return;
    motion.set(el, {x: state.x + dx, y: state.y + dy, scaleX: state.scaleX * sx, scaleY: state.scaleY * scale});
    motion.to(el, {x: 0, y: 0, scaleX: 1, scaleY: 1}, 'move');
  });
  // Then each cell: what its object's glide does not already cover (measured on screen with the
  // object's start transform applied; a cell's offset is scaled by its object's scale).
  cells.forEach((el, index) => {
    if (!el.isConnected) return;
    const was = cellsBefore[index];
    const now = el.getBoundingClientRect();
    if (!now.width || !was.width) return;
    const host = motion.states.get(el.parentElement.closest('[data-obj]'));
    const dx = (was.left + was.width / 2 - now.left - now.width / 2) / (host ? host.scale * host.scaleX || 1 : 1);
    const dy = (was.top + was.height / 2 - now.top - now.height / 2) / (host ? host.scale * host.scaleY || 1 : 1);
    // Width and height separately: a widened column keeps its row height.
    const sx = was.width / now.width;
    const sy = was.height / now.height;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.005 && Math.abs(sy - 1) < 0.005) return;
    const state = motion.stateOf(el);
    motion.set(el, {x: state.x + dx, y: state.y + dy, scaleX: state.scaleX * sx, scaleY: state.scaleY * sy});
    motion.to(el, {x: 0, y: 0, scaleX: 1, scaleY: 1}, 'move');
  });
}

function renderScene(step, direction, options = {}) {
  const existing = new Map();
  if (els.scene.dataset.lesson === currentLesson) {
    els.scene.querySelectorAll('[data-obj]').forEach((el) => existing.set(el.dataset.obj, el));
  }
  els.scene.dataset.lesson = currentLesson;
  const nextEls = step.scene.items.map((id) => existing.get(id) || createObject(id));
  sizeScene(step.scene.items.filter((id) => MATRICES[id]).map((id) => {
    const values = step.state?.[id] || MATRICES[id].values;
    return [values.length, values[0].length];
  }));
  swapScene(nextEls, step.scene.mode, {delay: options.delay, step, load: () => {
    // A mascot kept from the lesson end goes back to its lesson size.
    els.scene.querySelector('[data-obj="mascot"] .st-mascot--done')?.setAttribute('class', 'st-mascot st-mascot--big');
    loadMatrices(step);
  }});
  feelSlot('sceneReact', (delay) => {
    const mascot = els.scene.querySelector('.st-mascot');
    if (!mascot) return;
    clock.after(delay + 260, () => cheerMascot(mascot, 1.2));
    clock.after(delay + 1100, () => blinkMascot(mascotParts(mascot).eyes));
  })(options.delay || 0);
}

/* ---------- Teaching motion: calibrated pace (SATIR_DESIGN.md, Teaching motion) ---------- */

/**
 * Times (ms) for the teaching runner. Dwells are on-screen ms; leads and staggers are choreography and
 * scale with the teaching pace (TEACH_PACE) like the motion they pace. A channel a runner plays runs at
 * the teaching pace (tempoOf), so
 * these are the times on screen. Each dwell is reading time after an action's motion has landed; the
 * reasoning and the measurements are in SATIR_DESIGN.md.
 */
const TEACH = {
  line: 200, // a new (still empty) line: the eye finds where the next numbers will land
  highlight: 450, // sources lit before they move: one saccade (~200 ms) plus naming 1-3 cells
  lead: 250, // a later or repeated term: its sources light up this long before they move (no separate dwell)
  carryStagger: 180, // between the chips of one term: each start is its own pursuit target
  carry: 200, // after a product's last chip has landed, before its value is written
  value: 580, // a product's value (or a carried term) stays readable before the next term starts
  collect: 640, // a line's result is read before the next line
  write: 600, // a value written back into the scene
  rewrite: 700, // one equation line becomes the next
  flip: 0.2, // share of a crossing flight after which the chip shows its new sign (early: it reads "+16" most of the way)
  sideways: 200, // ms a chip of a crossing group keeps its row while it moves sideways (carrySide ~95 %)
  inkDim: 0.3, // written ink a chip passes over dims to this (review: at most 40 %), so no false reading forms
  inkGap: 0.5, // em of the chip's font: written letters or digits closer than this beside a moving chip dim too
  inkLead: 220, // ms ahead of a chip that ink starts to dim (the 'press' spring at tempo 1 passes half in about 40 ms)
  repeat: 0.5, // dwell factor for a term or line whose shape was already shown (a faded worked example)
  leadAfterFirst: false, // later terms of a line lead instead of getting their own highlight
  valueOnLanding: false, // a product's value is written as its last number lands (no separate action)
  contact: 2, // px on both axes: a carried chip has arrived (landChip); its value is written only then
  pursuit: 900, // px/s: a carried chip never moves faster (smooth pursuit holds up to ~1000 px/s)
  peakPerPx: 4.9, // measured peak speed of the carry springs per px of flight, at full stiffness
  poll: 16,
  maxLines: 5, // open work lines at most; older lines fold into labelled chips in a compact row above
  cellTarget: 32, // px: a step keeps fewer open lines (folding sooner) rather than cells smaller than this
  indent: 1.5, // em: the second row of a wrapped line ("= values = result") starts this far in
  /**
   * Answered reveals: the learner has just done this calculation, so the reveal confirms it instead of
   * teaching it. No motion is faster (same springs, same pursuit limit); repetition and dwell are cut:
   * a product's numbers travel as one group, later terms lead instead of their own highlight, and a
   * repeated shape (the other Sarrus side) reads at half the dwell. Targets: SATIR_DESIGN.md.
   */
  reveal: {line: 150, highlight: 350, lead: 100, carryStagger: 60, carry: 100, value: 300, collect: 350, write: 350,
    rewrite: 420, repeat: 0.5, leadAfterFirst: true, valueOnLanding: true},
  /**
   * Reading floor (RECHECK3: reading always wins over the reveal budget). Whatever an action makes
   * readable stays still at least this long before the next action starts: a finished line or result
   * (or several values written at once) floorLine + floorWord per new word (a number, term or product),
   * a single value written where the eye already is (a product landing in an unfinished line, one cell)
   * floorValue. Each dwell is max(floor, its normal dwell); a source highlight keeps its full dwell and a
   * term keeps its full lead.
   */
  floorLine: 1000,
  floorWord: 200,
  floorValue: 400,
  /**
   * Reveal budget by verdict (RECHECK2, RECHECK3): after a right answer the reveal aims to land within
   * revealBudget ms of the tap by trimming only the dwell above each reading floor. Motion is never cut
   * (no faster springs, no early landing). If motion plus floors need longer, the reveal runs long:
   * Devam lands it in one tap. A wrong answer keeps the full pace.
   */
  revealBudget: 16000,
  revealMargin: 1100,
  motionGuess: 900, // ms at pace 1: a carry's motion, until this device has measured one
};

/** Timing table of a family: 'teach' (entry beats: first teaching) or 'reveal' (after an answer). */
function teachTimes(family) {
  return family === 'reveal' ? {...TEACH, ...TEACH.reveal} : TEACH;
}

/**
 * A runner wait in the runner's channel (scaled by the teaching pace, like the motion it paces); none
 * while that runner is rushed. `screen`: the wait is on-screen ms (a reading dwell).
 */
function teachAfter(ms, fn, screen = false) {
  const rushed = [...runners].some((runner) => runner.fast && runner.name === channel);
  clock.after(rushed ? 0 : screen ? ms / tempoOf(channel) : ms, fn);
}

/* ---------- Work area: kept lines of calculation under the scene ---------- */

/**
 * The work area is a column of lines with a shared left edge, as on paper. A calculation keeps every
 * finished line (intermediate results stay); past the step's line budget (workMax, from the stage
 * height) the oldest lines fold into chips that still show their results. A teaching beat owns the work area: its first action starts it fresh.
 */
const OP_TEXT = /^([+−·=×→(),±]|-)$/;
const WORD = /^\p{L}{2,}$/u;

function tokenEl(token) {
  const span = document.createElement('span');
  span.className = `st-work__tok${token.kind ? ` st-work__tok--${token.kind}` : ''}${token.hidden ? ' is-hidden' : ''}`;
  if (token.label) span.classList.add('st-work__label');
  span.innerHTML = token.html ?? token.text;
  const text = span.textContent.trim();
  if (token.op || (!token.label && OP_TEXT.test(text))) span.classList.add('st-work__op');
  if (text === '·') span.classList.add('st-work__dot');
  if (token.ref) span.dataset.ref = token.ref;
  return span;
}

function lineEl(tokens) {
  const line = document.createElement('div');
  line.className = 'st-work__line';
  line.append(...tokens.map((token) => (token instanceof Element ? token : tokenEl(token))));
  return line;
}

function openLines() {
  return [...els.work.querySelectorAll('.st-work__line:not(.st-work__line--folded)')];
}

function visibleTokens() {
  return [...els.work.querySelectorAll('.st-work__tok')]
    .filter((el) => !el.classList.contains('is-hidden') && !el.closest('.is-hidden') && el.textContent.trim());
}

/** A token that leaves fades out where it stood (in the fx layer, so nothing reflows). */
function ghostToken(el, rect, size) {
  el.classList.add('st-ghost');
  el.style.left = `${rect.x}px`;
  el.style.top = `${rect.y}px`;
  el.style.fontSize = size;
  els.fx.appendChild(el);
  motion.to(el, {opacity: 0}, 'leave', {onArrive: () => el.remove()});
}

/**
 * Writes one line in place of the whole work area (labels, legacy beats). A new line never cuts: a
 * token whose text was already there glides from where it stood, new tokens fade in, the rest fade out
 * where they were.
 */
function setWork(tokens) {
  const before = visibleTokens().filter((el) => !el.querySelector('.st-work__tok'))
    .map((el) => ({el, text: el.textContent.trim(), rect: rectIn(els.stage, el), size: getComputedStyle(el).fontSize, used: false}));
  let line = tokens.length ? lineEl(tokens) : null;
  // One open line rewritten stays the same line (one reading unit): words it keeps are not new words.
  const open = openLines();
  if (line && open.length === 1 && els.work.children.length === 1) {
    const [kept] = open;
    Object.keys(kept.dataset).forEach((key) => delete kept.dataset[key]);
    delete kept.group;
    kept.className = line.className;
    kept.replaceChildren(...line.children);
    line = kept;
  }
  els.work.replaceChildren(...(line ? [line] : []));
  fitWork();
  const fresh = [];
  const glides = [];
  if (line) {
    [...line.children].forEach((el) => {
      if (el.classList.contains('is-hidden')) return;
      const match = before.find((old) => !old.used && old.text === el.textContent.trim());
      if (match) {
        match.used = true;
        // A kept word keeps its element (it never enters again): it takes the new token's role and glides.
        const kept = match.el;
        if (kept !== el) {
          kept.className = el.className;
          Object.keys(kept.dataset).forEach((key) => delete kept.dataset[key]);
          Object.assign(kept.dataset, el.dataset);
          if (kept.innerHTML !== el.innerHTML) kept.innerHTML = el.innerHTML;
          el.replaceWith(kept);
        }
        motion.set(kept, {x: 0, y: 0});
        const now = rectIn(els.stage, kept);
        motion.set(kept, {x: match.rect.x - now.x, y: match.rect.y - now.y});
        motion.to(kept, {x: 0, y: 0}, 'teach');
        if (!reducedMotion.matches) glides.push({box: now, dx: match.rect.x - now.x, dy: match.rect.y - now.y});
      } else {
        motion.set(el, {opacity: 0});
        fresh.push(el);
      }
    });
  }
  const leaving = before.filter((old) => !old.used);
  leaving.forEach(({el, rect, size}) => ghostToken(el, rect, size));
  // New words come in once the old ones have left (leaveHead), and each once no kept word gliding home
  // still crosses its place (CHECK5: "1. satıre 2. sütun"), so two words never read on each other.
  const head = leaving.length ? CHOREO.leaveHead : 0;
  const waits = fresh.map((el) => glideClear(rectIn(els.stage, el), glides));
  fresh.forEach((el, k) => {
    const draw = () => motion.to(el, {opacity: 1}, 'draw');
    const wait = Math.max(head, waits[k]);
    if (wait > 0) clock.after(wait, draw);
    else draw();
  });
  // When the new words start drawing in (a frame writes its cells as they become readable).
  if (line) line.drawIn = fresh.length ? Math.max(head, ...waits) : null;
  return line;
}

/** Breathing room (px) between a fresh word and a kept word gliding past it. */
const GLIDE_CLEAR = 2;

/**
 * Ms (in the current channel's time, as clock.after takes it) until no kept word's glide (the 'teach'
 * spring from its offset to its place, as motion.to will run it) comes within GLIDE_CLEAR of `box` again.
 */
function glideClear(box, glides) {
  if (!glides.length) return 0;
  const tempo = tempoOf(channel);
  const k = SPRINGS.teach.k / (tempo * tempo);
  const c = 2 * SPRINGS.teach.zeta * Math.sqrt(k);
  const hits = (g, f) => g.box.x + g.dx * f < box.x + box.w + GLIDE_CLEAR && box.x < g.box.x + g.dx * f + g.box.w + GLIDE_CLEAR &&
    g.box.y + g.dy * f < box.y + box.h + GLIDE_CLEAR && box.y < g.box.y + g.dy * f + g.box.h + GLIDE_CLEAR;
  // The spring's share of its offset left over time (same integrator step as motion), until it rests.
  let f = 1;
  let v = 0;
  let last = -1;
  const h = 1 / 240;
  for (let t = 0; t < 4; t += h) {
    if (glides.some((g) => hits(g, f))) last = t;
    v += (-k * f - c * v) * h;
    f += v * h;
    if (Math.abs(f) < 0.002 && Math.abs(v) < 0.01) break;
  }
  return last < 0 ? 0 : Math.ceil((last + h) * 1000 / tempo);
}

/** Open lines the current step keeps (planWork); older lines fold into chips. */
let workMax = TEACH.maxLines;
/** Whether a calculation line too wide for the stage may wrap after its products (planWork). */
let workWrap = true;

/** Adds a line under the kept ones; past workMax open lines the oldest fold into chips. */
function pushWorkLine(tokens, prepare) {
  return pushWorkLines([lineEl(tokens)], prepare)[0];
}

/**
 * Adds lines that belong together (a wrapped calculation's two rows) under the kept ones. Past workMax
 * open lines the oldest group folds; a group being added never folds itself.
 */
function pushWorkLines(lines, prepare) {
  lines.forEach((line) => {
    line.group = lines;
  });
  const folds = Math.max(0, openLines().length + lines.length - Math.max(lines.length, workMax));
  flipWork(() => {
    els.work.append(...lines);
    prepare?.(lines);
    let open = openLines();
    while (open.length > Math.max(lines.length, workMax)) {
      foldLine(open[0]);
      open = openLines();
    }
    fitWork();
  });
  // The kept lines glide up from a row lower: the new lines (already at their final place) stay clear
  // until those lines have mostly made room, so no two ever overlap.
  // A new line always enters (never pops in): at once when nothing makes room, else after the glide.
  lines.forEach((line) => {
    motion.set(line, {opacity: 0});
    if (folds) clock.after(CHOREO.leaveHead + CHOREO.glideHead, () => motion.to(line, {opacity: 1}, 'fade'));
    else motion.to(line, {opacity: 1}, 'fade');
  });
  return lines;
}

/**
 * A folded calculation keeps its result as a chip in the top row, labelled when the line has a name
 * for it ("artılar: 24"). The result itself moves into the chip (flipWork glides it there and scales it
 * to the chip's size) while the rest of the line fades where it stood; the chip's pill and label fade
 * in around it. An equation line folds without a chip: the next line of its chain says the same thing.
 */
function foldLine(line) {
  const group = (line.group || [line]).filter((member) => member.isConnected);
  const head = group[0];
  let row = els.work.querySelector('.st-work__line--folded');
  if (!row) {
    row = document.createElement('div');
    row.className = 'st-work__line st-work__line--folded';
    els.work.prepend(row);
  }
  const result = group.map((member) => member.querySelector('[data-result]')).find(Boolean);
  const keep = head.dataset.fold !== 'none' && !els.work.classList.contains('is-fold-silent');
  // A result folded away without a chip has no visible source when a later line uses it (design-qa).
  if (!keep && head.dataset.fold !== 'none' && group.some((member) => member.querySelector('[data-result]'))) teachStats.silentFolds = (teachStats.silentFolds || 0) + 1;
  const moving = keep && result && !result.classList.contains('is-hidden') ? result : null;
  group.forEach((member) => {
    const ghost = member.cloneNode(true);
    ghost.style.minWidth = '';
    ghost.style.marginLeft = '';
    // The moving result is not doubled by its ghost.
    if (moving) ghost.querySelector('[data-result]')?.classList.add('is-hidden');
    ghostToken(ghost, rectIn(els.stage, member), getComputedStyle(member).fontSize);
  });
  let chip = null;
  if (keep && (result || head.dataset.chip)) {
    chip = document.createElement('span');
    chip.className = 'st-work__chip';
    const fill = document.createElement('span');
    fill.className = 'st-work__chip-fill';
    chip.append(fill);
    const fades = [fill];
    if (head.dataset.chipLabel) {
      const label = document.createElement('span');
      label.className = 'st-work__chip-label';
      label.textContent = `${head.dataset.chipLabel}:`;
      chip.append(label);
      fades.push(label);
    }
    if (moving) {
      chip.append(moving);
    } else {
      const token = tokenEl(result ? {html: result.innerHTML, kind: (result.className.match(/st-work__tok--(\w+)/) || [])[1]} :
        {html: head.dataset.chip, kind: head.dataset.chipKind});
      chip.append(token);
      fades.push(token);
    }
    row.append(chip);
    // The pill and label come in once the line's ghost has left, so their text never mixes with it;
    // the result keeps gliding meanwhile, so there is no empty frame.
    fades.forEach((el) => {
      motion.set(el, {opacity: 0});
      clock.after(CHOREO.leaveHead, () => motion.to(el, {opacity: 1}, 'draw'));
    });
  }
  group.forEach((member) => {
    member.chipEl = chip;
    member.remove();
  });
}

/**
 * Natural width of a line: its tokens side by side, its reservation and its alignment shift. Both are
 * set in em (workEm), so they scale with the work font.
 */
function lineWidth(line) {
  const style = getComputedStyle(line);
  const gap = parseFloat(style.columnGap) || 0;
  const kids = [...line.children];
  const sum = kids.reduce((total, el) => {
    const own = getComputedStyle(el);
    return total + el.offsetWidth + (parseFloat(own.marginLeft) || 0) + (parseFloat(own.marginRight) || 0);
  }, 0) + gap * Math.max(0, kids.length - 1);
  return Math.max(sum, parseFloat(style.minWidth) || 0) + (parseFloat(style.marginLeft) || 0);
}

function workEm(px, el) {
  return `${(px / parseFloat(getComputedStyle(el).fontSize)).toFixed(3)}em`;
}

/**
 * Work text never outgrows the numbers it explains (--work-cap, from fitScene). It shrinks (down to
 * --text-ui) when the widest line would not fit the stage, or when a line level with the transport
 * button would run under it; past that a line wraps at a token boundary.
 */
/**
 * The work area's room and the transport's column. The block is centred in the content box; the
 * transport button (bottom right of the stage, `--hit` wide) takes the column right of `limit`, whether
 * or not the button shows yet. Both sides use the left inset, so a reserve set on the right never
 * changes what is measured.
 */
function workSpace() {
  const style = getComputedStyle(els.work);
  const stage = getComputedStyle(els.stage);
  const px = (name) => parseFloat(stage.getPropertyValue(name)) || 0;
  const inset = parseFloat(style.paddingLeft) || 0;
  const left = els.work.getBoundingClientRect().left + inset;
  const room = els.work.clientWidth - 2 * inset;
  // On a step whose work cannot clear the bottom corner, the transport sits in the top corner (planWork).
  const limit = els.stage.classList.contains('is-transport-top') ? room :
    els.stage.getBoundingClientRect().right - px('--space-xs') - px('--hit') - px('--work-gap-transport') - left;
  return {room, limit, inset};
}
/** Width the work block may use: all of the room left of the transport column (fitWork routes it there). */
function workRoom() {
  const {room, limit} = workSpace();
  return Math.max(0, Math.min(room, limit));
}

/**
 * Work font for the beat: smaller (--work-fit, down to --text-ui) when the widest line the beat will
 * write (planned up front, workPlanEm) or shows now does not fit workRoom. Planned once per beat, so
 * the font never changes when a wide line folds away. A block whose centred right end would run under
 * the transport moves left just enough (a right reserve), so the route around the button is planned too.
 */
let workPlanEm = 0;
function fitWork() {
  els.work.style.removeProperty('--work-fit');
  els.work.style.removeProperty('padding-right');
  const lines = [...els.work.children];
  if (!lines.length && !workPlanEm) return;
  const size = parseFloat(getComputedStyle(els.work).fontSize);
  const widest = Math.max(workPlanEm * size, ...lines.map(lineWidth));
  if (!widest) return;
  const scale = Math.min(1, workRoom() / widest);
  let fitted = widest;
  if (scale < 1) {
    const font = Math.max(parseFloat(getComputedStyle(els.stage).getPropertyValue('--text-ui')) || 0, Math.floor(size * scale));
    els.work.style.setProperty('--work-fit', `${font}px`);
    fitted = widest * font / size;
  }
  const {room, limit, inset} = workSpace();
  const shift = (room + fitted) / 2 - limit;
  // At most the whole transport column: a block wider than the free room then wraps inside it.
  if (shift > 0.5) els.work.style.paddingRight = `${inset + Math.min(2 * shift, Math.max(0, room - limit))}px`;
}

/** Position without the element's own spring offset, so FLIP also works on tokens still gliding. */
function layoutPos(el) {
  const rect = el.getBoundingClientRect();
  const state = motion.stateOf(el);
  return {x: rect.left - state.x, y: rect.top - state.y};
}

/**
 * FLIP for the work area: every visible token that stays glides from where it was, centre to centre.
 * A token that changed size (a result moving into its fold chip) also scales from its old size, so
 * its text never jumps.
 */
function flipWork(mutate) {
  const before = new Map();
  els.work.querySelectorAll('.st-work__tok').forEach((el) => {
    const rect = el.getBoundingClientRect();
    before.set(el, {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, size: parseFloat(getComputedStyle(el).fontSize) * motion.stateOf(el).scale});
  });
  mutate();
  before.forEach((old, el) => {
    if (!el.isConnected || el.classList.contains('is-hidden') || el.closest('.is-hidden')) return;
    const now = layoutPos(el);
    const dx = old.x - now.x - el.offsetWidth / 2;
    const dy = old.y - now.y - el.offsetHeight / 2;
    const scale = old.size / parseFloat(getComputedStyle(el).fontSize);
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scale - 1) < 0.01) return;
    motion.set(el, {x: dx, y: dy, scale});
    motion.to(el, {x: 0, y: 0, scale: 1}, 'move');
  });
}

function workToken(ref) {
  return els.work.querySelector(`[data-ref="${ref}"]`);
}

/**
 * A hidden token appears in place (it was laid out already, so nothing moves): only its ink arrives,
 * by opacity. An entrance never scales up.
 */
function showToken(el) {
  if (!el || !el.isConnected || !el.classList.contains('is-hidden')) return false;
  el.classList.remove('is-hidden');
  motion.set(el, {opacity: 0});
  motion.to(el, {opacity: 1}, 'draw');
  return true;
}

function revealToken(ref) {
  return showToken(workToken(ref));
}

/** An operator written just before a token appears with it. */
function showWithOperator(el) {
  const before = el?.previousElementSibling;
  if (before?.classList.contains('st-work__op')) showToken(before);
  return showToken(el);
}

/**
 * Chip over ink. A flying chip never forms a false reading with written ink ("0·3·4", "22"): ink it is
 * about to cross (work tokens and fold chips, scene cells and labels) dims to TEACH.inkDim, and comes
 * back once the chip has passed. Its source dims too as the copy lifts off it (no doubled "33"); only
 * its landing slot (chip.inkTarget) is left alone. Runs after every engine tick, on the engine clock.
 */
const inkDimmed = new Set();
function inkElements() {
  return [...els.stage.querySelectorAll('#work .st-work__tok, #work .st-work__chip-label, #scene .st-cell, #scene .st-label')]
    .filter((el) => !el.querySelector('.st-work__tok') && el.textContent.trim());
}
function glyphRect(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}
function inkCheck() {
  // A result gliding into its fold chip (beside the scene when the stage is tight) crosses the scene's ink like a flying chip.
  const folding = [...els.work.querySelectorAll('.st-work__chip .st-work__tok')].filter((el) => {
    const {springs} = motion.stateOf(el);
    return springs.x || springs.y;
  });
  const chips = [...els.stage.querySelectorAll('.st-chip')].filter((chip) => parseFloat(chip.style.opacity || '1') >= 0.3).concat(folding);
  if (!chips.length && !inkDimmed.size) return;
  const ink = chips.length ? inkElements().map((el) => ({el, rect: glyphRect(el)})) : [];
  const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const want = new Set();
  const now = new Set();
  chips.forEach((chip) => {
    const rect = chip.getBoundingClientRect();
    const state = motion.stateOf(chip);
    // Where the chip will be inkLead from now: second order (a chip leaving at rest has no velocity yet,
    // but its spring's pull says where it goes), never past its target.
    const lead = TEACH.inkLead / 1000;
    const travel = (prop) => {
      const spring = state.springs[prop];
      if (!spring) return 0;
      const gap = spring.target - state[prop];
      const accel = spring.k * gap - spring.c * spring.velocity;
      const move = spring.velocity * lead + 0.5 * accel * lead * lead;
      return Math.sign(move) === Math.sign(gap) && Math.abs(move) > Math.abs(gap) ? gap : move;
    };
    const vx = travel('x');
    const vy = travel('y');
    const ahead = {left: rect.left + Math.min(0, vx), right: rect.right + Math.max(0, vx),
      top: rect.top + Math.min(0, vy), bottom: rect.bottom + Math.max(0, vy)};
    // Beside counts too: a chip on the same baseline as written digits, closer than inkGap of its font,
    // reads as one number with them ("2" next to "8" reads "82"). Its landing line is exempt as it lands.
    const gap = TEACH.inkGap * (parseFloat(chip.style.fontSize) || rect.height);
    const landing = ['x', 'y'].every((prop) => !state.springs[prop] || Math.abs(state[prop] - state.springs[prop].target) < 6);
    const home = chip.inkTarget?.closest('.st-work__line, [data-obj]') || null;
    const beside = (box, item) => Math.min(box.bottom, item.rect.bottom) - Math.max(box.top, item.rect.top) >= 0.5 * Math.min(rect.height, item.rect.height) &&
      Math.max(item.rect.left - box.right, box.left - item.rect.right) < gap && /[\p{L}\p{N}]/u.test(item.el.textContent);
    ink.forEach((item) => {
      if (chip.closest('#work') && !item.el.closest('#scene')) return;
      // Its landing slot is left alone while it is blank or "?"; a slot with text (a row operation's old
      // entry, or the same letter: "k" onto "k") dims like any ink, so the two never read together.
      if (item.el === chip.inkTarget || item.el.contains(chip.inkTarget || null)) {
        const old = item.el.textContent.trim();
        if (!old || old === '?') return;
      }
      if (hit(ahead, item.rect)) {
        want.add(item.el);
        if (hit(rect, item.rect) || beside(rect, item)) now.add(item.el);
        return;
      }
      if (landing && home && home.contains(item.el)) return;
      if (beside(ahead, item)) want.add(item.el);
      // No lead left (a chip born beside a cell, lifting off its own matrix row): the dim is instant.
      if (beside(rect, item) && !landing) now.add(item.el);
    });
  });
  // The dim is chrome, at tempo 1: it must beat the chip there, whatever pace the chip flies at.
  withChannel('chrome', () => {
    inkDimmed.forEach((el) => {
      if (want.has(el)) return;
      inkDimmed.delete(el);
      motion.to(el, {ink: 1}, 'fade');
    });
    want.forEach((el) => {
      if (now.has(el) && motion.stateOf(el).ink > TEACH.inkDim + 0.05) motion.set(el, {ink: TEACH.inkDim});
      if (inkDimmed.has(el)) return;
      inkDimmed.add(el);
      // The stiffest fade: a chip lifting off beside a cell reaches it in about 60 ms.
      motion.to(el, {ink: TEACH.inkDim}, 'press');
    });
  });
}
motion.afterTick = () => {
  inkCheck();
  watchCueGates();
};

function makeChip(rect, text, kind, fontSize) {
  const chip = document.createElement('span');
  chip.className = `st-chip st-chip--${kind}`;
  chip.textContent = text;
  chip.style.width = `${rect.w}px`;
  chip.style.height = `${rect.h}px`;
  chip.style.fontSize = fontSize;
  els.fx.appendChild(chip);
  motion.set(chip, {x: rect.x, y: rect.y, scale: 1});
  return chip;
}

/**
 * A chip as big as its text (the runner's carries): it lands on a token of the same size, so it never
 * covers the operators beside it. `swap`: a second text that takes over mid-flight (a sign change).
 */
function textChip(rect, text, kind, fontSize, swap = null) {
  const chip = document.createElement('span');
  chip.className = `st-chip st-chip--${kind} st-chip--text`;
  chip.style.fontSize = fontSize;
  const face = (value) => {
    const span = document.createElement('span');
    span.className = 'st-chip__face';
    span.textContent = value;
    chip.appendChild(span);
    return span;
  };
  const first = face(text);
  const second = swap === null ? null : face(swap);
  if (second) motion.set(second, {opacity: 0});
  els.fx.appendChild(chip);
  const w = chip.offsetWidth;
  const h = chip.offsetHeight;
  motion.set(chip, {x: rect.x + rect.w / 2 - w / 2, y: rect.y + rect.h / 2 - h / 2, scale: 1});
  return {chip, w, h, first, second};
}

/**
 * Carry: a copy of a number travels to `toEl`; the source stays. x and y use different springs, so the
 * path curves. Legacy beats use the 'teach' pair at TEMPO with cell-sized chips; the runner uses the
 * 'carry' pair, calibrated to the eye's smooth-pursuit limit, with text-sized chips
 * (SATIR_DESIGN.md, Teaching motion). options: {text: true} text-sized chip, {swap: text} its new text
 * from TEACH.flip of the flight on.
 */
function fly(fromEl, toEl, text, kind, onArrive, springs = ['teach', 'teachY'], kScale = 1, options = {}) {
  const from = inkRect(fromEl);
  const to = rectIn(els.stage, toEl);
  const fromSize = fromEl.size ?? parseFloat(getComputedStyle(fromEl).fontSize);
  const toSize = parseFloat(getComputedStyle(toEl).fontSize);
  let chip;
  let w = from.w;
  let h = from.h;
  if (options.text) {
    const made = textChip(from, text, kind, `${fromSize}px`, options.swap ?? null);
    ({chip, w, h} = made);
    if (made.second) {
      teachAfter(options.swapAt || 0, () => {
        motion.to(made.first, {opacity: 0}, 'fade');
        motion.to(made.second, {opacity: 1}, 'fade');
      });
    }
  } else {
    chip = makeChip(from, text, kind, `${fromSize}px`);
  }
  // The chip lands centred on the target as it stands now, scaled to its font, never past the stage edge.
  const scale = toSize / fromSize;
  const aim = () => {
    const to = rectIn(els.stage, toEl);
    const half = w * scale / 2;
    const centre = Math.min(Math.max(to.x + to.w / 2, half), els.stage.clientWidth - half);
    return {x: centre - w / 2, y: to.y + to.h / 2 - h / 2};
  };
  const [kx, ky] = Array.isArray(kScale) ? kScale : [kScale, kScale];
  let dropping = false;
  const steer = (goal) => {
    motion.to(chip, {x: goal.x}, springs[0], {kScale: kx});
    if (dropping) motion.to(chip, {y: goal.y, scale}, springs[1], {kScale: ky});
  };
  steer(aim());
  const down = () => {
    dropping = true;
    steer(aim());
  };
  if (options.yDelay) teachAfter(options.yDelay, down);
  else down();
  // The operator written with the value ("·" just before it) enters as the chip lifts off: it has
  // landed by contact, without popping in (SPRINGS.enter).
  const op = toEl.previousElementSibling;
  if (op?.classList.contains('st-work__op')) showToken(op);
  landChip(chip, toEl, aim, steer, () => dropping, onArrive);
}

/**
 * One arrival for every carried chip (RECHECK4). A chip has arrived when both axes are within
 * TEACH.contact px of where it lands on its target as the target stands now (a target that moves in
 * flight is followed); one axis already in place at lift-off (a carry along a row) never counts as
 * arrival. At contact the value is written (onContact), the target's own entrance and any ink dim end at
 * once, and the chip goes in the same frame: the chip and the written value are never both readable.
 * `ready()`: every leg of the flight has started (a sideways carry drops later).
 */
function landChip(chip, toEl, aim, steer, ready, onContact) {
  chip.inkTarget = toEl;
  let goal = aim();
  let done = false;
  const handOff = () => {
    done = true;
    endEntrance(toEl);
    chip.remove();
    motion.states.delete(chip);
  };
  // Contact writes the value. A value that changes its target's width (`?` → `ad − bc`, `4` → `4−k²`)
  // moves its centre: the written value starts where the chip touched and glides into its place, so it
  // never appears away from its chip.
  const contact = (snap = false) => {
    if (done) return;
    onContact?.();
    const next = aim();
    handOff();
    const dx = goal.x - next.x;
    const dy = goal.y - next.y;
    if (!snap && (Math.abs(dx) > TEACH.contact || Math.abs(dy) > TEACH.contact)) {
      const state = motion.stateOf(toEl);
      motion.set(toEl, {x: state.x + dx, y: state.y + dy});
      motion.to(toEl, {x: 0, y: 0}, 'move');
    }
  };
  motion.addTicker({
    step() {
      if (done || !chip.isConnected) return false;
      const now = aim();
      if (Math.abs(now.x - goal.x) > 0.5 || Math.abs(now.y - goal.y) > 0.5) {
        goal = now;
        steer(goal);
      }
      const state = motion.stateOf(chip);
      if (!ready() || Math.abs(state.x - goal.x) > TEACH.contact || Math.abs(state.y - goal.y) > TEACH.contact) return true;
      // A slot whose line or object is still fading in (a new line waiting for a fold) is not readable yet:
      // the chip holds there, so the value it hands over is never written invisible.
      if (!hostShown(toEl)) return true;
      withChannel(this.channel, () => contact());
      return !done;
    },
    finish() {
      withChannel(this.channel, () => contact(true));
    },
  });
}

/** Whether every element around a landing slot, up to the stage, is (nearly) fully shown. */
function hostShown(el) {
  for (let n = el.parentElement; n && n !== els.stage; n = n.parentElement) {
    if ((motion.states.get(n)?.opacity ?? 1) < 0.9) return false;
  }
  return true;
}

/** A value handed over by a chip shows whole at once: its entrance (opacity, scale to 1) and any ink dim end. */
function endEntrance(el) {
  if (!el?.isConnected) return;
  const state = motion.stateOf(el);
  const now = {};
  if (state.opacity !== 1) now.opacity = 1;
  // A landing pop ends too; a re-fit glide (moving as it scales back) keeps gliding.
  if (state.springs.scale?.target === 1 && !state.springs.x && !state.springs.y) now.scale = 1;
  if (inkDimmed.delete(el) || state.ink !== 1) now.ink = 1;
  motion.set(el, now);
}

/**
 * Where a carry starts, in stage coordinates: an element, a whole work line (the box of its visible
 * tokens, not its reserved width), several tokens (their common box), or a snapshot {rect, size} of a
 * token that has since left.
 */
function inkRect(source) {
  if (source.rect) return source.rect;
  const parts = Array.isArray(source) ? source : source.classList?.contains('st-work__line') ?
    [...source.children].filter((el) => !el.classList.contains('is-hidden')) : null;
  if (parts) {
    const rects = parts.map((el) => rectIn(els.stage, el));
    if (rects.length) {
      const x = Math.min(...rects.map((r) => r.x));
      const y = Math.min(...rects.map((r) => r.y));
      return {x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y};
    }
  }
  return rectIn(els.stage, source);
}

/** A token's (or several tokens') place and size now, so it can still be carried from after it left. */
function snapshot(el) {
  const first = Array.isArray(el) ? el[0] : el;
  return {rect: inkRect(el), size: parseFloat(getComputedStyle(first).fontSize)};
}

/**
 * A runner carry: a long flight is slowed (softer springs) so its peak speed stays at TEACH.pursuit.
 * The chip is as big as its text. options.swap: the text it shows from TEACH.flip of the flight on (a
 * sign change). options.sideways: the chip moves sideways along its own row first, then drops into its
 * slot, so chips of one group whose paths would cross pass each other a row apart and drop in columns
 * of their own, never on top of each other.
 */
function carry(fromEl, toEl, text, kind, onArrive0, options = {}) {
  const onArrive = (...args) => {
    feelSound.cue('teach.land');
    return onArrive0?.(...args);
  };
  const a = inkRect(fromEl);
  const b = rectIn(els.stage, toEl);
  const distance = Math.hypot(b.x + b.w / 2 - a.x - a.w / 2, b.y + b.h / 2 - a.y - a.h / 2);
  const slow = Math.min(1, TEACH.pursuit / (TEACH.peakPerPx * Math.max(1, distance)));
  const swap = options.swap ?? null;
  // Settling time of the carry springs grows as 1/sqrt(k): the swap comes at the same share of it.
  const swapAt = swap === null ? 0 : Math.round(TEACH.flip * 650 / slow);
  if (options.sideways) {
    // Sideways first: the chip keeps its row until its sideways move is nearly done, then drops. The
    // two moves are one after the other, so each is held to the pursuit limit on its own.
    const limit = (d, spring) => Math.min(1, TEACH.pursuit / (springPeak(spring) * Math.max(1, d)));
    const sx = limit(Math.abs(b.x + b.w / 2 - a.x - a.w / 2), 'carrySide');
    const sy = limit(Math.abs(b.y + b.h / 2 - a.y - a.h / 2), 'carryY');
    fly(fromEl, toEl, text, kind, onArrive, ['carrySide', 'carryY'], [sx * sx, sy * sy],
      {text: true, swap, swapAt, yDelay: Math.round(TEACH.sideways / sx)});
    return;
  }
  fly(fromEl, toEl, text, kind, onArrive, ['carry', 'carryY'], slow * slow, {text: true, swap, swapAt});
}

/**
 * Peak speed of a spring's move from rest, per px of distance (at kScale 1): found once by stepping
 * the spring, so a single-axis move can be held to the pursuit limit whatever its stiffness.
 */
const springPeaks = {};
function springPeak(name) {
  if (springPeaks[name]) return springPeaks[name];
  const {k, zeta} = SPRINGS[name];
  let x = 0;
  let v = 0;
  let peak = 0;
  for (let i = 0; i < 4000; i++) {
    v += (k * (1 - x) - 2 * zeta * Math.sqrt(k) * v) * 0.001;
    x += v * 0.001;
    peak = Math.max(peak, v);
  }
  springPeaks[name] = peak;
  return peak;
}

/** True when the chips of one group would cross: their left-to-right order changes on the way. */
function crossingPaths(flights) {
  const xs = flights.map((f) => {
    const a = inkRect(f.from);
    const b = rectIn(els.stage, f.target);
    return [a.x + a.w / 2, b.x + b.w / 2];
  });
  return xs.some(([a0, b0], i) => xs.slice(i + 1).some(([a1, b1]) => (a0 - a1) * (b0 - b1) < 0));
}

/**
 * Combine (paced frames): the parts of a slot fade out completely, then the value fades in at full
 * size in their place, so no two numbers ever overlap; the rest of the line glides to the new width.
 */
function combineSlot(slot, html) {
  const parts = [...slot.children];
  if (!parts.length) return false;
  const release = holdTeach();
  let pending = parts.length;
  parts.forEach((part) => {
    motion.to(part, {opacity: 0}, 'leave', {
      onArrive: () => {
        pending -= 1;
        if (pending) return;
        flipWork(() => {
          slot.innerHTML = html;
          slot.classList.remove('st-work__slot--open');
          fitWork();
        });
        motion.set(slot, {opacity: 0});
        motion.to(slot, {opacity: 1}, 'draw');
        release();
      },
    });
  });
  return true;
}

/** Opens a slot to show its parts (hidden until they arrive); returns the part elements. */
function openSlot(slot, parts, op) {
  const targets = [];
  flipWork(() => {
    slot.classList.remove('is-hidden');
    slot.classList.add('st-work__slot--open');
    slot.replaceChildren(...parts.flatMap((part, c) => {
      const el = tokenEl({html: part.text, kind: part.kind, hidden: true});
      targets.push(el);
      return c > 0 ? [tokenEl({text: op, op: true, hidden: true}), el] : [el];
    }));
    fitWork();
  });
  return targets;
}

function chipOf(el) {
  if (!el?.classList) return 'result';
  if (el.classList.contains('st-work__tok--b')) return 'col';
  if (el.classList.contains('st-work__tok--sum')) return 'result';
  return 'row';
}

/**
 * Collect: the result is written after "=", right of the values it sums (they stay on the line, so
 * where it came from stays readable). Opacity only: no chip crosses the written line.
 */
function collectInto(resultEl) {
  if (!resultEl) return false;
  feelSound.cue('teach.merge');
  const eq = resultEl.previousElementSibling;
  if (eq?.textContent.trim() === '=') showToken(eq);
  return showToken(resultEl);
}

/* ---------- Teaching runner: one mathematical action at a time, on its own, at a calm pace ---------- */

/**
 * A teaching beat compiles to actions ({kind, run, dwell}). The runner starts an action, waits until
 * its motion has landed (and any follow-up it holds), then waits the action's dwell before the next.
 * It runs by itself; the transport in the stage corner pauses after the current action, resumes, or
 * replays when the beat is done. İleri and Devam land everything at once (finishAll), as before.
 * run() returning false means nothing visible changed (no dwell); a number delays the settle check.
 */
const runners = new Set();
let teachHolds = 0;
/** Per-action trace since the page loaded, read by tools/design-qa.js (window.satir.teach). */
const teachStats = {trace: []};

function holdTeach() {
  teachHolds += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    teachHolds = Math.max(0, teachHolds - 1);
  };
}

/**
 * Reading gate of a cue-timed beat (script frames and the named beats): a cue never starts before
 * what the beat made readable since its previous cue has had its reading floor (readingFloor, from
 * when it became readable); a held cue moves the beat's later cues with it. Staggers inside one cue
 * (siblings 60-110 ms apart) are plain timers: they are one reading moment.
 */
class CueGate {
  constructor() {
    this.pending = 0;
    this.open();
  }

  /** A cue starts: what reads now is the base its own changes are measured from. */
  open() {
    this.base = readables();
    this.seen = [...this.base.values()].join('\u0001');
    this.readAt = null;
  }

  /** Each frame: when what reads last changed (a new word, or a word rewritten in place: 0·(−5) → 0). */
  watch() {
    const now = readables();
    const seen = [...now.values()].join('\u0001');
    if (seen !== this.seen && changedCount(this.base, now)) this.readAt = clock.now;
    this.seen = seen;
  }

  /** The earliest clock time the next cue may start (a pending combine holds it frame by frame). */
  readyAt() {
    if (this.pending) return clock.now + 1;
    // Watch first: a combine written in this same clock step has not been seen by afterTick yet.
    this.watch();
    return this.readAt === null ? 0 : this.readAt + readingFloor(this.base, readables());
  }
}

let cueGate = null;
const cueGates = new Set();

/** A beat cue: clock.after through the current beat's reading gate. */
function cue(ms, fn) {
  clock.after(ms, fn, cueGate);
}

/** The frame hook: gates with cues left watch the stage; the others close. */
function watchCueGates() {
  cueGates.forEach((gate) => {
    if (clock.timers.some((timer) => timer.gate === gate)) gate.watch();
    else cueGates.delete(gate);
  });
}

/** Longest motion time per action kind measured on this device (a reveal's budget projects from it). */
const motionByKind = new Map();
/** Longest reading floor per action kind seen so far (the budget never plans to trim below it). */
const floorByKind = new Map();

/**
 * What reads on the stage now: written work tokens (not folded re-presentations), scene cells and
 * labels, each with its text. The reading floor compares two of these.
 */
function readables() {
  const out = new Map();
  // Readable once it is at least half in (a fading-in token is not read yet); ink dimming is a
  // filter, not opacity, so a token dimmed under a passing chip still counts as already there.
  const shown = (el, root) => {
    let value = 1;
    for (let node = el; node && node !== root; node = node.parentElement) value *= parseFloat(getComputedStyle(node).opacity);
    return value >= 0.5;
  };
  els.work.querySelectorAll('.st-work__line:not(.st-work__line--folded) .st-work__tok').forEach((el) => {
    if (el.querySelector('.st-work__tok') || el.closest('.is-hidden') || el.closest('.st-work__chip')) return;
    // Operators too: a line's terms are read with them (a product 2·3 is one term: readingTerms).
    const text = el.textContent.trim();
    if (text && shown(el, els.work)) out.set(el, text);
  });
  els.scene.querySelectorAll('.st-cell, .st-label').forEach((el) => {
    if (el.querySelector('.st-cell, .st-label')) return;
    const text = el.textContent.trim();
    if (/[\p{L}\p{N}]/u.test(text) && shown(el, els.scene)) out.set(el, text);
  });
  return out;
}

/** How many readables differ from a snapshot (new, or with new text). */
function changedCount(before, after) {
  let count = 0;
  after.forEach((text, el) => {
    if (before.get(el) !== text) count += 1;
  });
  return count;
}

/**
 * Reading terms of a text, as tools-lab/motion-audit counts them: operators and spaces split it, a
 * product (3·1) is one term, and only terms with a letter or digit count. It never reads fewer terms
 * than design-qa's port (which also joins bracket groups and reads a caption as one), so a floor that
 * holds here holds for both.
 */
function readingTerms(text) {
  return text.replace(/\s*·\s*/g, '·').split(/[\s=+−\-:,;]+/).filter((term) => /[\p{L}\p{N}]/u.test(term));
}

/** Readables grouped by reading unit (a work line, a cell, a label): unit → its text. */
function readingUnits(snapshot) {
  const units = new Map();
  snapshot.forEach((text, el) => {
    const unit = el.closest('.st-work__line') || el;
    units.set(unit, units.has(unit) ? `${units.get(unit)} ${text}` : text);
  });
  return units;
}

/**
 * The reading floor of what changed between two readables() snapshots (TEACH.floorLine/Word/Value):
 * per unit, its new words, counted both as motion-audit does (terms that were not there before, a
 * multiset: "3 → 5" is one new term, "?" none) and per changed token or cell; the larger count wins.
 */
function readingFloor(before, after) {
  const was = readingUnits(before);
  // Per unit, the readables that are new or changed, counted as words: a token or cell is one, a label
  // its letter-and-digit runs (the count RECHECK4-B1's frame analysis uses).
  const changed = new Map();
  after.forEach((text, el) => {
    if (before.get(el) === text || !/[\p{L}\p{N}]/u.test(text)) return;
    const unit = el.closest('.st-work__line') || el;
    const n = el.classList.contains('st-label') ? (text.match(/[\p{L}\p{N}]+/gu) || []).length : 1;
    changed.set(unit, (changed.get(unit) || 0) + n);
  });
  let words = 0;
  let unfinished = 0;
  let cells = true;
  readingUnits(after).forEach((text, unit) => {
    const left = readingTerms(was.get(unit) || '');
    const terms = readingTerms(text).filter((term) => {
      const i = left.indexOf(term);
      if (i >= 0) left.splice(i, 1);
      return i < 0;
    }).length;
    // Both reviewers' word rules hold: the larger count wins, so a floor never under-reads either.
    const fresh = Math.max(terms, changed.get(unit) || 0);
    if (!fresh) return;
    words += fresh;
    if (unit.classList.contains('st-work__line') && unit.querySelector('.st-work__tok.is-hidden')) unfinished += fresh;
    if (!unit.classList.contains('st-cell')) cells = false;
  });
  if (!words) return 0;
  // A value landing where the eye already is: in a line still being filled, or one cell.
  if (unfinished === words || (words === 1 && cells)) return TEACH.floorValue;
  return TEACH.floorLine + TEACH.floorWord * words;
}

class Runner {
  /** `deadline`: clock time by which the last action should land (a right answer's reveal), or null. */
  constructor(actions, name, deadline = null) {
    Object.assign(this, {actions, name, index: 0, held: false, waiting: false, fast: false, deadline, moved: 0, done: 0, share: 1});
  }

  /**
   * Over budget? The rest is projected from the motion measured so far (longest per kind) plus the
   * reading floors still to come (longest seen per kind); the last action's dwell comes after it lands
   * and does not count. Returns the share of each dwell's part above its floor that fits (1: all).
   */
  dwellShare() {
    if (this.deadline === null) return 1;
    const rest = this.actions.slice(this.index);
    if (!rest.length) return 1;
    // A kind not measured yet counts as the longest measured one, or a carry's typical time at this pace.
    const unknown = Math.max(TEACH.motionGuess * channelPace[this.name].pace, ...motionByKind.values());
    const motionLeft = rest.reduce((sum, action) => sum + (motionByKind.get(action.kind) ?? unknown), 0);
    const waits = [...rest.slice(0, -1), this.actions[this.index - 1]].filter(Boolean);
    const floors = waits.reduce((sum, action) => sum + Math.min(action.dwell || 0, floorByKind.get(action.kind) ?? 0), 0);
    const above = waits.reduce((sum, action) => sum + Math.max(0, (action.dwell || 0) - (floorByKind.get(action.kind) ?? 0)), 0);
    const room = this.deadline - clock.now - motionLeft - floors;
    return above > 0 ? Math.max(0, Math.min(1, room / above)) : 1;
  }

  start() {
    runners.add(this);
    pacedChannels.add(this.name);
    this.next();
    syncTransport();
  }

  next() {
    if (!runners.has(this)) return;
    if (this.index >= this.actions.length) {
      runners.delete(this);
      if (!runnerBusy(this.name)) pacedChannels.delete(this.name);
      syncTransport();
      return;
    }
    if (this.held && !this.fast) {
      this.waiting = true;
      syncTransport();
      return;
    }
    const action = this.actions[this.index++];
    this.share = this.dwellShare();
    const entry = {kind: action.kind, start: clock.now, channel: this.name, fast: this.fast};
    teachStats.trace.push(entry);
    // What reads before the action: what it adds sets its reading floor once it has landed.
    entry.before = this.fast ? null : readables();
    withChannel(this.name, () => {
      const result = action.run();
      entry.changed = result !== false;
      teachAfter(typeof result === 'number' ? result : 0, () => this.settle(action, entry));
    });
  }

  settle(action, entry) {
    // When the action's last new word became readable: its reading floor runs from there, so the
    // floor overlaps the tail of the motion (a chip fading out on its value), never the next action.
    if (!this.fast && entry.before) {
      const count = changedCount(entry.before, readables());
      if (count > (entry.readCount || 0)) {
        entry.readCount = count;
        entry.readAt = clock.now;
      }
    }
    if (!this.fast && (motion.isMoving(this.name) || teachHolds > 0)) {
      teachAfter(TEACH.poll, () => this.settle(action, entry), true);
      return;
    }
    entry.settled = clock.now;
    this.moved += entry.settled - entry.start;
    this.done += 1;
    if (!this.fast && entry.changed) {
      const last = motionByKind.get(action.kind);
      // The longest seen per kind: a projection that errs long only shortens dwells a little more.
      motionByKind.set(action.kind, Math.max(last ?? 0, entry.settled - entry.start));
    }
    // Reading floor first: the budget only trims the part of a dwell above it. A source highlight keeps
    // its whole dwell (its lead is where the numbers come from).
    const nominal = action.dwell || 0;
    const floor = this.fast || !entry.changed ? 0 : action.kind === 'highlight' ? nominal : readingFloor(entry.before, readables());
    entry.before = null;
    entry.floor = floor;
    if (floor) floorByKind.set(action.kind, Math.max(floorByKind.get(action.kind) ?? 0, floor));
    // The normal dwell runs from the landing (trimmed above the floor under a budget); the floor runs
    // from when the words became readable. Whichever ends later starts the next action.
    const since = entry.readAt == null ? 0 : clock.now - entry.readAt;
    const normal = Math.min(nominal, floor) + Math.max(0, nominal - floor) * this.dwellShare();
    entry.dwell = this.fast || !entry.changed ? 0 : Math.max(floor - since, action.kind === 'highlight' ? nominal : normal, 0);
    teachAfter(entry.dwell, () => this.next(), true);
  }

  pause() {
    this.held = true;
    syncTransport();
  }

  resume(fast = false) {
    this.held = false;
    this.fast = this.fast || fast;
    if (this.waiting) {
      this.waiting = false;
      withChannel(this.name, () => clock.after(0, () => this.next()));
    }
    syncTransport();
  }
}

function activeRunner() {
  return [...runners].pop() || null;
}

function runnerBusy(name = null) {
  return [...runners].some((runner) => !name || runner.name === name);
}

/** Lets every runner of `name` (all when null) run to its end without waits; the caller flushes. */
function rushRunners(name = null) {
  runners.forEach((runner) => {
    if (!name || runner.name === name) runner.resume(true);
  });
}

function dropRunners() {
  runners.clear();
  cueGates.clear();
  pacedChannels.clear();
  teachHolds = 0;
}

/**
 * Transport in the stage corner: pause while a beat plays, play while paused, replay when it is done.
 * The icon changes on the tap itself, so every tap has a visible answer.
 */
const TRANSPORT = {
  pause: {d: 'M9 6.5v11M15 6.5v11', label: 'Duraklat'},
  play: {d: 'M8.5 6v12l9.5-6z', label: 'Devam ettir'},
  replay: {d: 'M5 12a7 7 0 1 0 2.1-5M5 4v4h4', label: 'Hareketi tekrar oynat'},
};

function syncTransport() {
  const runner = activeRunner();
  const step = STEPS[lesson.index];
  const hasBeat = Boolean(step && !lesson.complete && (step.beat || (lesson.answered !== null && step.reveal)));
  const state = !runner ? 'replay' : runner.held ? 'play' : 'pause';
  els.replay.hidden = !hasBeat && !runner;
  if (els.replay.dataset.state === state) return;
  els.replay.dataset.state = state;
  els.replay.setAttribute('aria-label', TRANSPORT[state].label);
  els.replay.querySelector('path').setAttribute('d', TRANSPORT[state].d);
}

function pressTransport() {
  const runner = activeRunner();
  const icon = els.replay.querySelector('svg');
  if (runner) {
    if (runner.held) runner.resume();
    else runner.pause();
    motion.set(icon, {scale: 0.8});
    motion.to(icon, {scale: 1}, 'land');
    return;
  }
  replay();
  motion.set(icon, {rotate: 0});
  motion.to(icon, {rotate: -360}, 'move', {onArrive: () => motion.set(icon, {rotate: 0})});
}

/* ---------- Derivations: the maths is declared, the motion is derived ---------- */

/**
 * A derivation is {lines: [...]}. A line is {expr, role?, name?, value?, result?, rhs?, rhsFrom?,
 * into?, given?} or an equation chain {eq: ['k² = 16', 'k = −4 ya da 4'], role?, given?}.
 * Expressions are JSON:
 *   number | 'k²' (a symbol, shown as written) | '@name' (an earlier line's result)
 *   [mat, i, j] (a matrix cell) | [op, ...terms] with op '+', '−' ('-'), '·' ('*', '×')
 *   {expr, role, value, show}: role colours a subtree ('row' | 'col' | 'result'); value declares what a
 *   symbolic node shows once combined ('k²'); show replaces a node's text.
 * Line options: value (declared result), result: false (no "= …"), rhs: '0' (the line ends "= 0"
 * instead of its value; rhsFrom: a scene label the 0 travels from), into: [mat, i, j] or
 * [labelId, '{v}'] (the result is written back), given: true (known from an earlier step: appears at
 * once), label: a word written before the line ('köşegende yok:'), chip: the name its fold chip shows
 * ('artılar'). tools/lesson-check.py verifies every declared value and equation step with SymPy.
 */
const ROLES = {
  row: {mark: 'is-row', tok: 'a', chip: 'row'},
  col: {mark: 'is-col', tok: 'b', chip: 'col'},
  result: {mark: 'is-result', tok: 'sum', chip: 'result'},
};
const OP_ALIASES = {'+': '+', '-': '−', '−': '−', '*': '·', '·': '·', '×': '·'};
/** Cell values while a derivation compiles: earlier lines' write-backs are seen by later lines. */
let deriveMats = null;

function isCell(node) {
  return Array.isArray(node) && node.length === 3 && typeof node[0] === 'string' && Boolean(MATRICES[node[0]]) &&
    Number.isInteger(node[1]) && Number.isInteger(node[2]);
}

function isOp(node) {
  return Array.isArray(node) && OP_ALIASES[node[0]] !== undefined && !isCell(node);
}

function isRef(node) {
  return typeof node === 'string' && node.startsWith('@');
}

/** Unwraps {expr, role, value, show}: the bare node, its role (inherited unless set) and own role. */
function unwrap(raw, role) {
  let node = raw;
  let info = {role, own: undefined, value: undefined, show: undefined};
  while (node && typeof node === 'object' && !Array.isArray(node)) {
    info = {role: node.role || info.role, own: node.role || info.own, value: node.value ?? info.value, show: node.show ?? info.show};
    node = node.expr;
  }
  return {node, ...info};
}

function cellValue([matId, i, j]) {
  return (deriveMats || lesson.mats)[matId]?.[i]?.[j];
}

/** Numeric value of a node, or undefined when it is symbolic (its declared value is shown). */
function evaluate(raw, results) {
  const {node} = unwrap(raw);
  if (typeof node === 'number') return node;
  if (isRef(node)) return results[node.slice(1)]?.number;
  if (isCell(node)) {
    const value = cellValue(node);
    return typeof value === 'number' ? value : undefined;
  }
  if (!isOp(node)) return undefined;
  const op = OP_ALIASES[node[0]];
  const values = node.slice(1).map((child) => evaluate(child, results));
  if (values.some((value) => typeof value !== 'number')) return undefined;
  if (op === '·') return values.reduce((a, b) => a * b, 1);
  if (op === '+') return values.reduce((a, b) => a + b, 0);
  return values.length === 1 ? -values[0] : values.slice(1).reduce((a, b) => a - b, values[0]);
}

/**
 * Text of a value inside an expression. Parentheses: a negative number after an operator ("8 − (−11)",
 * "(−1)·1"); a sum or difference as a factor ("(k−1)·k") or after a minus ("4k + 3 − (3k + 2)").
 */
function termText(value, op, first) {
  // Written work spaces its operators as text does ("k − 1"), even when a cell shows "k−1".
  const text = formatNumber(value).replace(/([^\s(+−·=])\s*([+−])\s*(?=[^\s)+−·=])/g, '$1 $2 ');
  const negative = text.startsWith('−');
  const sum = /.\s?[+−]\s?./.test(text.replace(/^\(.*\)$/, ''));
  const wrap = (negative && !first) || (sum && (op === '·' || (op === '−' && !first)));
  return wrap ? `(${text})` : text;
}

/** The value a node shows: its declared value, its computed value, or the symbol as written. */
function shownValue(raw, results) {
  const {node, value} = unwrap(raw);
  if (value !== undefined) return value;
  const number = evaluate(raw, results);
  if (number !== undefined) return number;
  if (isRef(node)) return results[node.slice(1)]?.declared ?? '?';
  if (isCell(node)) return cellValue(node) ?? '?';
  return typeof node === 'string' ? node : '?';
}

/** The leaves a term carries (cells, earlier results, literals), each with its role. */
function leavesOf(raw, role) {
  const {node, role: own} = unwrap(raw, role);
  if (isOp(node)) return node.slice(1).flatMap((child) => leavesOf(child, own));
  return [{node, role: own}];
}

function leafSource(leaf, results) {
  if (isCell(leaf.node)) return cellEl(...leaf.node);
  if (isRef(leaf.node)) return resultNow(results[leaf.node.slice(1)]);
  return null;
}

/**
 * Where an earlier line's result is on screen now: its token (also once it sits in a fold chip), the
 * values it was written as (a line without "= result"), or its chip once the line has folded.
 */
function resultNow(result) {
  const el = result?.el;
  if (!el) return null;
  const chip = result.line?.chipEl?.isConnected ? result.line.chipEl : null;
  if (Array.isArray(el)) {
    const live = el.filter((token) => token.isConnected && !token.classList.contains('is-hidden'));
    return live.length ? snapshot(live) : chip;
  }
  return el.isConnected ? el : el.chipEl?.isConnected ? el.chipEl : chip;
}

/** Shape of a line, for the faded repetition rule (same shape as an earlier line: shorter dwell). */
function shapeOf(raw) {
  const {node} = unwrap(raw);
  return isOp(node) ? `${OP_ALIASES[node[0]]}(${node.slice(1).map(shapeOf).join(',')})` : 'x';
}

function pulseToken(el) {
  if (!(el instanceof Element)) return;
  motion.set(el, {scale: 1.15});
  motion.to(el, {scale: 1}, 'land');
}

/**
 * A calculation line, as on paper: the products stay written and their values follow them,
 * "3·2 − 1·4 = 6 − 4 = 2", so every value keeps its provenance on screen. A line that would not fit
 * wraps after its products ("2·3·4 + 1·2·0 + 0·1·1" / "= 24 + 0 + 0 = 24"). Every token is laid out
 * (hidden) when the line starts, so nothing on it ever moves: numbers arrive in their own slots.
 */
function lineActions(line, ctx) {
  if (line.eq) return equationActions(line, ctx);
  const {results, T} = ctx;
  const lineRole = line.role;
  const top = unwrap(line.expr, lineRole);
  // A lone product ("1·1·2·1") is one term: its numbers travel as one group.
  const op = isOp(top.node) && OP_ALIASES[top.node[0]] !== '·' ? OP_ALIASES[top.node[0]] : null;
  const terms = op ? top.node.slice(1) : [line.expr];
  const number = evaluate(line.expr, results);
  const declared = line.value ?? top.value;
  const name = line.name || `line${ctx.count}`;
  ctx.count += 1;
  const shape = shapeOf(line.expr);
  const pace = ctx.shapes.has(shape) ? T.repeat : 1;
  ctx.shapes.add(shape);
  const dwell = (ms) => Math.round(ms * pace);
  // A term whose shape was already worked through (the second diagonal on) is faded: its sources light
  // up as they leave, and its dwells are shorter.
  const termPace = terms.map((term) => {
    const seen = ctx.terms.has(shapeOf(term));
    ctx.terms.add(shapeOf(term));
    return seen ? T.repeat : 1;
  });

  // Terms: a product shows its factors, each in its leaf's role colour; its value takes the term's role.
  const termInfo = terms.map((term, k) => {
    const info = unwrap(term, op ? top.role : lineRole);
    const group = isOp(info.node);
    const groupOp = group ? OP_ALIASES[info.node[0]] : null;
    const text = info.show ?? termText(shownValue(term, results), op, k === 0);
    const parts = group ? info.node.slice(1).map((child) => {
      const leaf = unwrap(child, info.role);
      // A factor is always written so it reads alone: "(−1)·3·4", "(k−1)·k".
      return {text: leaf.show ?? termText(shownValue(child, results), groupOp, false), kind: ROLES[leaf.role]?.tok};
    }) : [];
    return {term, group, groupOp, text, parts, kind: ROLES[info.own || lineRole]?.tok};
  });
  const hasRhs = line.rhs !== undefined;
  // Values after the products: a sum or difference with at least one product in it.
  const valued = terms.length > 1 && termInfo.some((t) => t.group);
  const showResult = !hasRhs && line.result !== false && (terms.length > 1 || termInfo[0].group);
  const resultRole = lineRole || 'result';
  const resultValue = number !== undefined ? number : declared ?? '?';
  results[name] = {number, declared: number === undefined ? declared : undefined, el: null, line: null};

  // The line's tokens, built fresh for each use (layout planning measures them; the line action writes
  // them). wrap: the values and result go to a second row, indented.
  let refs = null;
  const build = (wrap) => {
    const r = {terms: [], eqValues: null, eqEnd: null, end: null, label: null};
    const first = [];
    // A line may say what it is ("köşegende yok:"): a label before it, written with the line.
    if (line.label) {
      r.label = tokenEl({text: line.label, kind: ROLES[lineRole]?.tok, label: true, hidden: true});
      first.push(r.label);
    }
    termInfo.forEach((t, k) => {
      const entry = {op: null, parts: [], slot: null, valueOp: null, value: null};
      if (k > 0) {
        entry.op = tokenEl({text: op, op: true, hidden: true});
        first.push(entry.op);
      }
      if (t.group) {
        t.parts.forEach((part, c) => {
          if (c > 0) first.push(tokenEl({text: t.groupOp, op: true, hidden: true}));
          const el = tokenEl({html: part.text, kind: part.kind, hidden: true});
          entry.parts.push(el);
          first.push(el);
        });
      } else {
        entry.slot = tokenEl({html: t.text, kind: t.kind, hidden: true});
        first.push(entry.slot);
      }
      r.terms.push(entry);
    });
    const rest = [];
    if (valued) {
      r.eqValues = tokenEl({text: '=', op: true, hidden: true});
      rest.push(r.eqValues);
      termInfo.forEach((t, k) => {
        const entry = r.terms[k];
        if (k > 0) {
          entry.valueOp = tokenEl({text: op, op: true, hidden: true});
          rest.push(entry.valueOp);
        }
        entry.value = tokenEl({html: t.text, kind: t.kind, hidden: true});
        rest.push(entry.value);
      });
    }
    if (showResult || hasRhs) {
      r.eqEnd = tokenEl({text: '=', op: true, hidden: true});
      r.end = tokenEl({html: hasRhs ? formatNumber(line.rhs) : termText(resultValue, null, true),
        kind: hasRhs ? undefined : ROLES[resultRole]?.tok, hidden: true});
      if (!hasRhs) r.end.dataset.result = name;
      rest.push(r.eqEnd, r.end);
    }
    const nodes = wrap && rest.length ? [lineEl(first), lineEl(rest)] : [lineEl([...first, ...rest])];
    if (nodes.length > 1) nodes[1].style.marginLeft = `${T.indent}em`;
    // Folded, a line keeps its result (labelled when it has a name for it); a line that ends "= 0"
    // starts an equation chain and folds without a chip.
    if (hasRhs) nodes[0].dataset.fold = 'none';
    else if (!showResult) nodes[0].dataset.chip = termInfo.map((t) => t.text).join(` ${op} `);
    if (line.chip) nodes[0].dataset.chipLabel = line.chip;
    return {nodes, refs: r};
  };
  const layout = {build, breakable: valued || showResult || hasRhs, opensChain: hasRhs};
  ctx.layouts.push(layout);

  const intoCell = line.into && isCell(line.into) ? line.into : null;
  // A label this line will write, so the scene's fit leaves room for it from the start (fitScene).
  if (line.into && !intoCell && ctx.labelWrites) {
    const [labelId, template = '{v}'] = line.into;
    ctx.labelWrites.push([labelId, template.replace('{v}', `<span class="st-hl-result">${formatNumber(resultValue)}</span>`)]);
  }
  const markTarget = () => {
    if (intoCell) mark(intoCell[0], [[intoCell[1], intoCell[2]]], 'is-target');
  };
  // A finished line keeps every cell it used lit in its role colour. A line built from earlier results
  // only (24 − 8) keeps the cells that are lit: the last ones worked stay on screen.
  const ownCells = terms.flatMap((term) => leavesOf(term, op ? top.role : lineRole)).filter((leaf) => isCell(leaf.node));
  const markUsed = () => {
    if (!ownCells.length) return;
    clearMarks();
    markTarget();
    ownCells.forEach((leaf) => mark(leaf.node[0], [[leaf.node[1], leaf.node[2]]], (ROLES[leaf.role] || ROLES.row).mark));
  };
  const actions = [{kind: 'line', dwell: T.line, run: () => {
    const built = build(layout.wrap);
    refs = built.refs;
    pushWorkLines(built.nodes, (nodes) => applyLayout(layout, nodes));
    showToken(refs.label);
    results[name].line = built.nodes[0];
    results[name].el = refs.end && !hasRhs ? refs.end : valued ? refs.terms.map((entry) => entry.value) : built.nodes[0];
    markTarget();
    return true;
  }}];

  termInfo.forEach((t, k) => {
    const leaves = leavesOf(t.term, op ? top.role : lineRole);
    const sourced = leaves.filter((leaf) => isCell(leaf.node) || isRef(leaf.node));
    const faded = termPace[k] < 1;
    const termDwell = (ms) => Math.round(ms * termPace[k] * pace);
    // Reveals: only a line's first cell term gets its own highlight; later terms and earlier results lead.
    const lead = sourced.length && (faded || (T.leadAfterFirst && (k > 0 || !sourced.some((leaf) => isCell(leaf.node)))));
    // A term of earlier results only (24 − 8) pulses them and leaves the lit cells as they are.
    const cells = sourced.some((leaf) => isCell(leaf.node));
    const highlight = () => {
      feelSound.cue('teach.select');
      if (cells) {
        clearMarks();
        markTarget();
      }
      sourced.forEach((leaf) => {
        if (isCell(leaf.node)) mark(leaf.node[0], [[leaf.node[1], leaf.node[2]]], (ROLES[leaf.role] || ROLES.row).mark);
        else pulseToken(resultNow(results[leaf.node.slice(1)]));
      });
    };
    // 1. Highlight: the sources light up in their role colours (cells) or pulse (earlier results).
    if (sourced.length && !lead) {
      actions.push({kind: 'highlight', dwell: dwell(T.highlight), run: () => {
        highlight();
        return true;
      }});
    }
    // 3. Value: a product's value is written after "=", in its own slot (opacity only).
    // The values row ("= 6 − 4") is read only once every product is on the line (Eren, 2026-10-29): a
    // value written after the first product made "3·2 − = 6" a false statement on screen. Earlier
    // terms write nothing; the last term writes the whole row, in order.
    const lastTerm = k === termInfo.length - 1;
    const writeValue = () => {
      if (!lastTerm) return true;
      showToken(refs.eqValues);
      let shown = false;
      refs.terms.forEach((entry) => {
        if (entry.valueOp) showToken(entry.valueOp);
        shown = showToken(entry.value) || shown;
      });
      return shown;
    };
    const onLanding = valued && T.valueOnLanding;
    // 2. Carry: each source travels into its own slot; a product's numbers travel as one group.
    actions.push({kind: 'carry', dwell: termDwell(t.group && valued && !onLanding ? T.carry : T.value), run: () => {
      // The lead is a reading wait too: a reveal over budget shortens it like its dwells.
      const wait = lead ? T.lead : 0;
      if (lead) highlight();
      const entry = refs.terms[k];
      if (entry.op) showToken(entry.op);
      const targets = t.group ? entry.parts : [entry.slot];
      const flights = leaves.map((leaf, s) => ({leaf, target: targets[s] || entry.slot, from: leafSource(leaf, results)}));
      flights.filter((f) => !f.from).forEach((f) => showWithOperator(f.target));
      const moving = flights.filter((f) => f.from);
      // A group whose chips would cross on the way moves sideways first: they pass a row apart.
      const sideways = moving.length > 1 && crossingPaths(moving);
      let pending = moving.length;
      const release = onLanding && pending ? holdTeach() : null;
      moving.forEach((f, s) => {
        const kind = f.from.closest?.('#work') ? chipOf(f.from) : (ROLES[f.leaf.role] || ROLES.row).chip;
        // A crossing group leaves together: each chip keeps its row until all have moved sideways.
        teachAfter(wait + (sideways ? 0 : s * T.carryStagger), () => carry(f.from, f.target, f.target.textContent, kind, () => {
          showWithOperator(f.target);
          pending -= 1;
          if (pending || !release) return;
          writeValue();
          release();
        }, {sideways}));
      });
      if (onLanding && !moving.length) writeValue();
      return wait + (sideways ? 0 : Math.max(0, moving.length - 1) * T.carryStagger);
    }});
    if (valued && !onLanding) actions.push({kind: 'value', dwell: termDwell(T.value), run: writeValue});
  });
  // 4. Collect: the result is written after the last "=". A declared right side arrives instead.
  if (showResult) {
    actions.push({kind: 'collect', dwell: dwell(T.collect), run: () => {
      markUsed();
      return collectInto(refs.end);
    }});
  }
  if (hasRhs) {
    actions.push({kind: 'collect', dwell: T.collect, run: () => {
      markUsed();
      showToken(refs.eqEnd);
      const from = line.rhsFrom && els.scene.querySelector(`[data-obj="${line.rhsFrom}"]`);
      if (!from) return showToken(refs.end);
      const release = holdTeach();
      carry(from, refs.end, refs.end.textContent, 'result', () => {
        showToken(refs.end);
        release();
      });
      return true;
    }});
  }
  // 5. Write back into the scene.
  if (line.into) {
    if (intoCell) deriveMats[intoCell[0]][intoCell[1]][intoCell[2]] = resultValue;
    actions.push({kind: 'write', dwell: T.write, run: () => {
      if (!showResult && !hasRhs) markUsed();
      return writeInto(line.into, resultNow(results[name]), resultValue);
    }});
  }
  return line.given ? givenActions(actions) : actions;
}

/** A line known from an earlier step appears at once, in its end state (no highlights, no waits). */
function givenActions(actions) {
  return [{kind: 'given', dwell: TEACH.line, run: () => {
    // What was already on screen (older lines, a result folding into its chip) still glides: only the
    // given line itself lands at once, so nothing visible jumps.
    const shown = new Set([...els.work.querySelectorAll('*'), ...els.scene.querySelectorAll('*')]);
    actions.filter((action) => action.kind !== 'highlight').forEach((action) => {
      action.run();
      landNow(channel, shown);
    });
    // The new line fades in (an entrance, never a one-frame cut), after its marks; if an older line is
    // folding meanwhile, it waits for that glide, as pushWorkLines does.
    const gliding = [...shown].some((el) => Object.keys(motion.states.get(el)?.springs || {}).length);
    [...els.work.querySelectorAll('.st-work__line:not(.st-work__line--folded)')].filter((line) => !shown.has(line)).forEach((line) => {
      motion.set(line, {opacity: 0});
      // The runner holds until the line reads: its reading floor starts when it is there.
      const release = holdTeach();
      clock.after(gliding ? CHOREO.leaveHead + CHOREO.glideHead : 0, () => motion.to(line, {opacity: 1}, 'fade', {onArrive: release}));
    });
    return true;
  }}];
}

function writeInto(into, fromEl, value) {
  const text = formatNumber(value);
  if (!fromEl) return false;
  const release = holdTeach();
  if (isCell(into)) {
    const [matId, i, j] = into;
    const target = cellEl(matId, i, j);
    if (!target) {
      release();
      return false;
    }
    carry(fromEl, target, text, 'result', () => {
      setCell(matId, i, j, value, {land: true});
      describeMatrix(matId);
      target.classList.remove('is-target');
      mark(matId, [[i, j]], 'is-result');
      release();
    });
    return true;
  }
  const [labelId, template = '{v}'] = into;
  const label = els.scene.querySelector(`[data-obj="${labelId}"]`);
  if (!label) {
    release();
    return false;
  }
  // The label takes its new text as the chip leaves, the value itself unseen: the refit glides while
  // the chip flies, the chip lands on the value's own box, and the value shows as the chip goes (one
  // readable copy, in one place).
  setLabel(labelId, template.replace('{v}', `<span class="st-hl-result" data-carried>${text}</span>`));
  const slot = label.querySelector('[data-carried]');
  motion.set(slot, {opacity: 0});
  carry(fromEl, slot, text, 'result', release);
  return true;
}

/** Splits an equation into tokens at spaces outside parentheses: "(k − 3)(k + 2) = 0" has three. */
function equationTokens(text) {
  const tokens = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (/\s/.test(char) && depth === 0) {
      if (current) tokens.push(current);
      current = '';
    } else current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

/** Side (0 left, 1 right of the last "=") and sign (the operator written before it) of each token. */
function sidesOf(kids) {
  const texts = kids.map((el) => el.textContent.trim());
  const eq = texts.lastIndexOf('=');
  return kids.map((el, k) => {
    const before = texts[k - 1];
    return {side: eq >= 0 && k > eq ? 1 : 0, sign: before === '−' ? '−' : '+', opEl: before === '−' || before === '+' ? kids[k - 1] : null};
  });
}

/**
 * An equation chain: each equation is a new line; all lines of the chain share the column of their
 * last "=", fixed before the first one is written (planLayouts), so no line moves sideways. Tokens
 * that move are carried down from the line above and keep their colour (one after another when their
 * paths would cross); a token that stays in its column ("= 0") is simply written again. A term that
 * changes side visibly changes sign: its chip leaves as "−16" and lands as "+16". The other tokens
 * appear once the carried ones have landed. The last equation is the result.
 */
function equationActions(line, ctx) {
  const {T} = ctx;
  const chain = `chain${ctx.count++}`;
  const actions = line.eq.map((equation, e) => {
    const last = e === line.eq.length - 1;
    const specs = equationTokens(equation).map((raw) => {
      const text = formatNumber(raw);
      const op = OP_TEXT.test(text);
      const word = WORD.test(text);
      return {text, op, hidden: true, kind: op || word ? undefined : last ? ROLES.result.tok : ROLES[line.role]?.tok};
    });
    const eqAt = specs.map((spec) => spec.text).lastIndexOf('=');
    const build = () => {
      const node = lineEl(specs.map((spec) => ({...spec})));
      node.dataset.fold = 'none';
      return {nodes: [node]};
    };
    const layout = {build, chain, eqAt};
    ctx.layouts.push(layout);
    return {kind: e ? 'rewrite' : 'line', dwell: last ? T.collect : T.rewrite, run: () => {
      const above = openLines().pop();
      const aboveKids = above ? [...above.children] : [];
      const aboveSides = sidesOf(aboveKids);
      // Latest segment first: "k·k − 2·8 = k² − 16 = 0" gives k² and 16 from after the products.
      const pool = aboveKids.map((el, k) => ({el, ...aboveSides[k], text: el.textContent.trim(), used: false}))
        .filter((p) => !p.el.classList.contains('is-hidden') && !p.el.classList.contains('st-work__op')).reverse();
      pool.forEach((p) => {
        p.from = snapshot(p.el);
        if (p.opEl) p.fromSigned = snapshot([p.opEl, p.el]);
      });
      const [node] = pushWorkLines(build().nodes, (nodes) => applyLayout(layout, nodes));
      const kids = [...node.children];
      const sides = sidesOf(kids);
      const strip = (text) => text.replace(/^[−-]/, '');
      const flights = [];
      kids.forEach((el, k) => {
        if (el.classList.contains('st-work__op')) return;
        const text = el.textContent.trim();
        const match = pool.find((p) => !p.used && p.text === text) || pool.find((p) => !p.used && strip(p.text) === strip(text));
        if (!match) return;
        match.used = true;
        // A carried token keeps its colour (16 came from the purple diagonal) until the result line.
        if (!last) ['a', 'b', 'sum'].forEach((kind) => el.classList.toggle(`st-work__tok--${kind}`, match.el.classList.contains(`st-work__tok--${kind}`)));
        const crossed = match.side !== sides[k].side && match.sign !== sides[k].sign;
        // A token that stays where it was, one line down ("= 0" under "= 0"), is written in place.
        const a = match.from.rect;
        const b = rectIn(els.stage, el);
        if (!crossed && Math.abs(a.x + a.w / 2 - b.x - b.w / 2) < 4) return;
        flights.push({el, match, crossed, kind: last ? 'result' : chipOf(match.el), signed: crossed ? `${match.sign}${text}` : null, next: crossed ? `${sides[k].sign}${text}` : null});
      });
      const release = holdTeach();
      const rest = () => {
        kids.filter((el) => el.classList.contains('is-hidden')).forEach((el) => showToken(el));
        release();
      };
      if (!flights.length) {
        rest();
        return true;
      }
      // Chips whose paths would cross go one at a time, so they never stack; the others go together.
      const oneByOne = flights.length > 1 && crossingPaths(flights.map((f) => ({from: f.match.from, target: f.el})));
      let pending = flights.length;
      const fly1 = (n) => {
        const f = flights[n];
        const done = () => {
          showToken(f.el);
          if (oneByOne && n + 1 < flights.length) teachAfter(T.carryStagger, () => fly1(n + 1));
          pending -= 1;
          if (!pending) rest();
        };
        if (f.crossed) carry(f.match.fromSigned || f.match.from, f.el, f.signed, f.kind, done, {swap: f.next});
        else carry(f.match.from, f.el, f.el.textContent.trim(), f.kind, done);
      };
      if (oneByOne) fly1(0);
      else flights.forEach((f, n) => teachAfter(n * T.carryStagger, () => fly1(n)));
      return true;
    }};
  });
  return line.given ? givenActions(actions) : actions;
}

/**
 * Fixes a beat's layout before its first line is written: which calculation lines wrap (values and
 * result on a second row when the line would not fit), the "=" column of each equation chain, and one
 * width for the whole block, so a line never moves sideways when a later one arrives. Measured
 * invisibly in the work area at its current font (or at `font`, for planWork before the scene is
 * fitted). Stores em values on each layout, so they scale with the work font.
 */
function planLayouts(layouts, font = null) {
  if (!layouts?.length) return;
  if (!font) els.work.style.removeProperty('--work-fit');
  const room = workRoom();
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;';
  if (font) probe.style.fontSize = font;
  els.work.append(probe);
  const size = parseFloat(getComputedStyle(probe).fontSize) || 16;
  const measure = (nodes) => nodes.map((node) => {
    node.style.maxWidth = 'none';
    node.style.flexWrap = 'nowrap';
    probe.append(node);
    const eq = [...node.children].map((el) => el.textContent.trim()).lastIndexOf('=');
    const out = {width: lineWidth(node), eqLeft: eq >= 0 ? node.children[eq].offsetLeft : 0};
    node.remove();
    return out;
  });
  // A line's width at the floor font (--text-ui), measured: gaps do not scale with the font.
  const atFloor = (layout) => {
    probe.style.removeProperty('font-size');
    probe.classList.add('st-work__probe--floor');
    const width = measure(layout.build(false).nodes)[0].width;
    probe.classList.remove('st-work__probe--floor');
    if (font) probe.style.fontSize = font;
    return width;
  };
  layouts.floorWidth = 0;
  layouts.forEach((layout) => {
    const flat = measure(layout.build(false).nodes);
    // A short stage keeps lines on one row (workWrap off, fitWork shrinks them; a planned second row
    // would push the scene). A line too wide for the room left of the transport even at the floor font
    // moves the transport to the top corner for the step (planWork).
    const floorWidth = !workWrap && flat[0].width > room + 0.5 ? atFloor(layout) : 0;
    layout.wrap = workWrap && Boolean(layout.breakable) && flat[0].width > room + 0.5;
    layouts.floorWidth = Math.max(layouts.floorWidth, floorWidth);
    const rows = layout.wrap ? measure(layout.build(true).nodes) : flat;
    layout.rows = rows.length;
    layout.widths = rows.map((row) => row.width);
    layout.eqLeft = flat[0].eqLeft;
    layout.margin = 0;
  });
  // A line ending "= 0" on one row opens the chain after it and shares its "=" column, as on paper,
  // unless that column would push a line of the chain past the room.
  const align = () => {
    const columns = new Map();
    layouts.filter((layout) => layout.chain).forEach((layout) => {
      columns.set(layout.chain, Math.max(columns.get(layout.chain) || 0, layout.eqLeft));
    });
    layouts.forEach((layout) => {
      layout.margin = layout.chain ? columns.get(layout.chain) - layout.eqLeft : 0;
    });
  };
  const openers = layouts.filter((layout, k) => layout.opensChain && !layout.wrap && layouts[k + 1]?.chain);
  openers.forEach((layout) => {
    layout.chain = layouts[layouts.indexOf(layout) + 1].chain;
  });
  align();
  const tooWide = (chain) => layouts.some((layout) => layout.chain === chain && layout.widths[0] + layout.margin > room + 0.5);
  const dropped = openers.filter((layout) => tooWide(layout.chain));
  dropped.forEach((layout) => {
    delete layout.chain;
  });
  if (dropped.length) align();
  const block = Math.max(...layouts.flatMap((layout) => layout.widths.map((width, row) => width + (row ? 0 : layout.margin))));
  layouts.forEach((layout) => {
    layout.em = {margin: layout.margin / size, block: Math.min(block, room) / size, size};
  });
  // The beat's widest line sets its work font once (fitWork), not the lines shown at the moment.
  if (!font) workPlanEm = Math.max(workPlanEm, block / size);
  probe.remove();
}

/** Applies a planned layout to the lines just added (inside the FLIP mutation). */
function applyLayout(layout, nodes) {
  if (!layout?.em) return;
  nodes.forEach((node, row) => {
    const margin = row ? 0 : layout.em.margin;
    if (margin > 0.01) node.style.marginLeft = `${margin.toFixed(3)}em`;
    // The second row's indent is part of its width; the block width is shared by every line.
    const indent = row ? parseFloat(node.style.marginLeft) || 0 : 0;
    node.style.minWidth = `${Math.max(0, layout.em.block - margin - indent).toFixed(3)}em`;
  });
}

/** Compiles a derivation into the runner's actions (ctx: the beat's timing family, layouts, matrices). */
function deriveActions({lines}, ctx) {
  const derive = {results: {}, shapes: new Set(), terms: new Set(), count: 0, ...ctx};
  deriveMats = JSON.parse(JSON.stringify(ctx.mats || lesson.mats));
  try {
    return lines.flatMap((line) => lineActions(line, derive));
  } finally {
    deriveMats = null;
  }
}

/** The first action of a teaching beat starts the work area fresh and fixes the beat's layout. */
function freshWork(actions) {
  if (!actions.length) return actions;
  const first = actions[0];
  const run = first.run;
  first.run = () => {
    visibleTokens().forEach((el) => ghostToken(el, rectIn(els.stage, el), getComputedStyle(el).fontSize));
    els.work.replaceChildren();
    workPlanEm = 0;
    planLayouts(actions.layouts);
    return run();
  };
  return actions;
}

/* ---------- Recipes: the standard calculations, declared as derivations ---------- */

const RECIPES = {
  /**
   * 2×2 determinant: main diagonal (row colour) minus the other diagonal (column colour). values:
   * declared [main, other, result] for symbolic entries; rhs / rhsFrom / result as on a line; then:
   * lines that follow (an equation chain).
   */
  det2({mat, i0 = 0, j0 = 0, into, values = [], result, rhs, rhsFrom, then = []}) {
    const cell = (i, j) => [mat, i0 + i, j0 + j];
    return {lines: [{
      expr: ['−', {role: 'row', expr: ['·', cell(0, 0), cell(1, 1)], value: values[0]},
        {role: 'col', expr: ['·', cell(0, 1), cell(1, 0)], value: values[1]}],
      value: values[2], into, result, rhs, rhsFrom,
    }, ...then]};
  },

  /**
   * 3×3 determinant by Sarrus with the first two columns written again (`copy`): the three down-right
   * products (row colour) minus the three down-left ones (column colour). plus / minus: declared values
   * for symbolic entries ([p1, p2, p3, sum]); result: the declared difference; only: 'plus' | 'minus'
   * keeps one side; given: the sides already known from earlier steps; rhs / then as in det2.
   */
  sarrus({mat, copy, into, only, plus = [], minus = [], result, rhs, rhsFrom, given = [], then = []}) {
    const at = (i, j) => (j < 3 ? [mat, i, j] : [copy || mat, i, j - 3]);
    const diagonal = (start, down, value) => ({expr: ['·', ...[0, 1, 2].map((i) => at(i, down ? start + i : start + 2 - i))], value});
    const side = (name, role, down, values) => ({
      name, role, given: given.includes(name), value: values[3], chip: name === 'plus' ? 'artılar' : 'eksiler',
      expr: ['+', ...[0, 1, 2].map((s) => diagonal(s, down, values[s]))],
    });
    const lines = [];
    if (only !== 'minus') lines.push(side('plus', 'row', true, plus));
    if (only !== 'plus') lines.push(side('minus', 'col', false, minus));
    if (!only) lines.push({expr: ['−', {role: 'row', expr: '@plus'}, {role: 'col', expr: '@minus'}], value: result, into, rhs, rhsFrom});
    return {lines: lines.concat(then)};
  },
};

/* ---------- Paced scripts: free choreography on the same runner ---------- */

const plainText = (token) => String(token.html ?? token.text ?? '').replace(/<[^>]*>/g, '').trim();

function visibleText(line) {
  return [...line.children].filter((el) => !el.classList.contains('is-hidden')).map((el) => el.textContent.trim()).join(' ');
}

/**
 * Keeps intermediate results: a frame's work line replaces the last line only when that line is labels
 * only, the new one is, or the new one extends it; otherwise the last line stays and the new one goes
 * under it.
 */
function pacedWork(tokens) {
  const last = openLines().pop();
  if (!last || !tokens.length) return setWork(tokens);
  const labelsOnly = [...last.children].every((el) => el.classList.contains('st-work__label'));
  const oldText = visibleText(last);
  const newText = tokens.filter((token) => !token.hidden).map(plainText).join(' ');
  if (labelsOnly || tokens.every((token) => token.label) || !oldText || newText.startsWith(oldText)) return setWork(tokens);
  return pushWorkLine(tokens);
}

/**
 * A carried value is written when its chip lands (RECHECK3): the target cell's next `set` (the value the
 * chip carries, or what it combines into, e.g. 4 with k² becomes 4−k²) is done on contact, not at its
 * own later cue, so the slot never shows its old text, "?" or nothing under a landed chip. A set that
 * clears the cell is not a write. `done` holds the specs written that way; their own frame skips them.
 */
function setOnLanding(frames, f, cell) {
  if (!Array.isArray(cell)) return null;
  for (let k = f; k < frames.length; k++) {
    const spec = (frames[k].set || []).find(([m, i, j]) => m === cell[0] && i === cell[1] && j === cell[2]);
    if (spec) return spec[3] === '' || spec[3] == null ? null : spec;
  }
  return null;
}
/**
 * Reserves the set a chip will write as it lands (its own cue skips it, so the value never appears
 * while the chip is still in the air) and returns the write for the chip's contact.
 */
function landSet(spec, done) {
  if (!spec || done.has(spec)) return () => {};
  done.add(spec);
  return () => {
    setCell(...spec, {land: true});
    describeMatrix(spec[0]);
  };
}

/** The operator joining several numbers that fly into one token: a product unless their sum fits. */
function joinOp(cells, text) {
  const values = cells.map((cell) => lesson.mats[cell[0]]?.[cell[1]]?.[cell[2]]);
  const target = Number(String(text).replace('−', '-'));
  if (!values.every((value) => typeof value === 'number') || Number.isNaN(target)) return '·';
  if (values.reduce((a, b) => a * b, 1) === target) return '·';
  return values.reduce((a, b) => a + b, 0) === target ? '+' : '·';
}

/**
 * A paced frame becomes up to six actions in teaching order: line, highlight, carry (several numbers
 * flying into one token open it, then combine), collect (a result after "="), write (set, label), and
 * the marks on the cells it wrote. Frame times (`at`) are not used: the runner paces every frame. Same
 * fields as `script`; `endMarks: false` on the beat skips the end-marks rule.
 */
function pacedActions(beat, ctx = {T: TEACH, layouts: []}) {
  const T = ctx.T;
  const end = beat.endMarks === false ? null : endMarks(beat.frames);
  const frames = end ? [...beat.frames, end] : beat.frames;
  // Its lines count for the block width (planLayouts); a paced beat writes one line in the budget.
  const worked = frames.filter((frame) => frame.work);
  if (worked.length) ctx.pacedLines = (ctx.pacedLines || 0) + 1;
  worked.forEach((frame) => ctx.layouts.push({widthOnly: true, build: () => ({nodes: [lineEl(frame.work.map((token) => ({...token})))]})}));
  const actions = [];
  const results = new Set();
  const landed = new Set();
  frames.forEach((frame, f) => {
    let reveals = frame.reveal || [];
    if (frame.work) {
      // A result written with its line (after "=") arrives by collect, after the rest of the line.
      const tokens = frame.work.map((token) => ({...token}));
      tokens.forEach((token, k) => {
        if (token.kind !== 'sum' || k < 2 || plainText(tokens[k - 1]) !== '=') return;
        token.ref = token.ref || `collect${f}`;
        results.add(token.ref);
        if (!token.hidden) {
          token.hidden = true;
          tokens[k - 1].hidden = true;
          reveals = [...reveals, token.ref];
        }
      });
      const visible = tokens.some((token) => !token.hidden);
      actions.push({kind: 'line', dwell: visible ? T.line : 0, run: () => {
        pacedWork(tokens);
        return true;
      }});
    }
    const written = new Set((frame.set || []).map(([matId]) => matId));
    const early = (frame.marks || []).filter((spec) => !written.has(spec[0]));
    const late = (frame.marks || []).filter((spec) => written.has(spec[0]));
    if (frame.clear || early.length) {
      const highlight = {kind: 'highlight', dwell: T.highlight, run: () => {
        if (frame.clear) clearMarks();
        early.forEach(applyMark);
        return true;
      }};
      // Cells first, then the words about them, unless numbers fly into the new line.
      const intoWork = (frame.fly || []).some((item) => typeof item.to === 'string' && item.to.startsWith('work:'));
      if (frame.work && !intoWork) actions.splice(actions.length - 1, 0, highlight);
      else actions.push(highlight);
    }
    const plain = reveals.filter((ref) => !results.has(ref));
    const collects = reveals.filter((ref) => results.has(ref));
    const groups = new Map();
    (frame.fly || []).forEach((item) => {
      const key = typeof item.to === 'string' ? item.to : item.to.join(':');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const merging = [...groups.entries()].filter(([key, items]) => key.startsWith('work:') && items.length > 1);
    if (groups.size || plain.length) {
      actions.push({kind: 'carry', dwell: merging.length ? T.carry : T.value, run: () => {
        let changed = false;
        plain.forEach((ref) => {
          changed = revealToken(ref) || changed;
        });
        let index = 0;
        groups.forEach((items, key) => {
          const toCell = typeof items[0].to === 'string' ? null : items[0].to;
          const toEl = toCell ? cellEl(...toCell) :
            key.startsWith('work:') ? workToken(key.slice(5)) : els.scene.querySelector(`[data-obj="${key.slice(4)}"]`);
          if (!toEl) return;
          const texts = items.map((item) => item.text ?? formatNumber(lesson.mats[item.from[0]][item.from[1]][item.from[2]]));
          let targets = items.map(() => toEl);
          if (items.length > 1 && key.startsWith('work:')) {
            toEl.dataset.final = toEl.innerHTML;
            const op = joinOp(items.map((item) => item.from), toEl.textContent);
            targets = openSlot(toEl, texts.map((text, t) => ({text: termText(text, op, t === 0), kind: ROLES[items[t].kind || 'row']?.tok})), op);
          }
          items.forEach((item, s) => {
            const fromEl = cellEl(...item.from);
            if (!fromEl) return;
            changed = true;
            const target = targets[s];
            teachAfter((index++) * T.carryStagger, () => {
              // A number carried into a cell is written there on contact.
              const write = landSet(setOnLanding(frames, f, toCell), landed);
              carry(fromEl, target, texts[s], item.kind || 'row', () => {
                if (key.startsWith('work:')) showWithOperator(target);
                write();
              });
            });
          });
        });
        return changed ? Math.max(0, index - 1) * T.carryStagger : false;
      }});
    }
    merging.forEach(([key]) => {
      actions.push({kind: 'combine', dwell: T.value, run: () => {
        const slot = workToken(key.slice(5));
        return slot ? combineSlot(slot, slot.dataset.final) : false;
      }});
    });
    collects.forEach((ref) => {
      actions.push({kind: 'collect', dwell: T.collect, run: () => collectInto(workToken(ref))});
    });
    if (frame.set?.length || frame.label || late.length) {
      actions.push({kind: 'write', dwell: T.write, run: () => {
        (frame.set || []).filter((spec) => !landed.has(spec)).forEach(([matId, i, j, value]) => {
          setCell(matId, i, j, value, {land: true});
          describeMatrix(matId);
        });
        if (frame.label) setLabel(frame.label[0], frame.label[1], {land: true});
        late.forEach(applyMark);
        return true;
      }});
    }
  });
  return actions;
}

/* ---------- Teaching beats: what a step declares, compiled for the runner ---------- */

/**
 * Compiles a beat for the runner in a timing family ('teach' or 'reveal'), or returns null for a legacy
 * timed beat (BEATS). The actions carry the layouts of the lines they write (planLayouts).
 */
function compileBeat(beat, family = 'teach', mats = null) {
  const ctx = {T: teachTimes(family), layouts: [], mats, pacedLines: 0, labelWrites: []};
  const actions = teachActions(beat, ctx);
  if (actions) {
    actions.layouts = ctx.layouts;
    actions.pacedLines = ctx.pacedLines;
    actions.labelWrites = ctx.labelWrites;
  }
  return actions;
}

/** Actions of a teaching beat, or null for a legacy timed beat (BEATS). */
function teachActions(beat, ctx) {
  if (beat.type === 'sequence') return beat.beats.flatMap((part) => teachActions(part, ctx) || []);
  if (RECIPES[beat.type]) return deriveActions(RECIPES[beat.type](beat), ctx);
  if (beat.type === 'derive') return deriveActions(beat, ctx);
  if (beat.type === 'paced') return pacedActions(beat, ctx);
  return null;
}

/** A step's matrices as its scene will load them (planWork compiles before the scene is built). */
function stepMats(step) {
  const mats = {};
  step.scene.items.filter((id) => MATRICES[id]).forEach((id) => {
    mats[id] = (step.state?.[id] || MATRICES[id].values).map((row) => row.slice());
  });
  return {...lesson.mats, ...mats};
}

/**
 * Work rows a beat writes in all (a wrapped line has two), measured at the largest work font, and the
 * rows of its tallest line (a wrapped line never folds half of itself).
 */
function workRowsOf(beat, family, step) {
  if (!beat) return {rows: 1, group: 1};
  const actions = compileBeat(beat, family, stepMats(step));
  if (!actions) return {rows: 1, group: 1};
  planLayouts(actions.layouts, 'var(--work-text)');
  const lines = actions.layouts.filter((layout) => !layout.widthOnly);
  return {
    rows: Math.max(1, lines.reduce((sum, layout) => sum + layout.rows, 0) + actions.pacedLines),
    group: Math.max(1, ...lines.map((layout) => layout.rows)),
    floorWidth: actions.layouts.floorWidth || 0,
  };
}

/** Width of the widest fold chip a step's beats will make (label and result), measured at its own font. */
function foldChipsWidth(step) {
  const row = document.createElement('div');
  row.className = 'st-work__line st-work__line--folded';
  row.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;';
  els.work.append(row);
  [[step.beat, 'teach'], [step.reveal, 'reveal']].forEach(([beat, family]) => {
    if (!beat) return;
    (compileBeat(beat, family, stepMats(step))?.layouts || []).forEach((layout) => {
      if (layout.widthOnly) return;
      const nodes = layout.build(false).nodes;
      if (nodes[0].dataset.fold === 'none') return;
      const result = nodes.map((node) => node.querySelector('[data-result]')).find(Boolean);
      if (!result && !nodes[0].dataset.chip) return;
      const chip = document.createElement('span');
      chip.className = 'st-work__chip';
      if (nodes[0].dataset.chipLabel) chip.innerHTML = `<span class="st-work__chip-label">${nodes[0].dataset.chipLabel}:</span>`;
      chip.append(tokenEl(result ? {html: result.innerHTML} : {html: nodes[0].dataset.chip}));
      row.append(chip);
    });
  });
  const width = Math.max(0, ...[...row.children].map((chip) => chip.offsetWidth));
  row.remove();
  return width;
}

/**
 * Line budget of a step: as many open lines as it writes (up to TEACH.maxLines) while the scene's cells
 * stay at least TEACH.cellTarget tall on this stage, never fewer than its tallest line; the rest fold into a compact
 * chip row. Sets the reservation (--work-lines, --work-fold) before the scene is fitted, so the work
 * area never grows during the step.
 */
function planWork(step) {
  const style = getComputedStyle(els.stage);
  const px = (name) => parseFloat(style.getPropertyValue(name)) || 0;
  const rows = Math.max(2, ...step.scene.items.filter((id) => MATRICES[id]).map((id) => (step.state?.[id] || MATRICES[id].values).length));
  const workHeight = (lines, fold) => px('--work-pad-y') * 2 + px('--work-line-h') * lines + px('--work-line-gap') * (lines - 1) +
    (fold ? px('--work-fold-h') + px('--work-line-gap') : 0);
  const cellAt = (lines, fold) => (els.stage.clientHeight - workHeight(lines, fold) - px('--stage-gap') - px('--space-xl')) / (rows + 0.8);
  const cellMin = parseFloat(getComputedStyle(els.scene).getPropertyValue('--cell-min')) || 0;
  const plan = () => {
    const beat = workRowsOf(step.beat, 'teach', step);
    const reveal = workRowsOf(step.reveal, 'reveal', step);
    const needed = Math.max(beat.rows, reveal.rows);
    return {needed, group: Math.min(needed, Math.max(beat.group, reveal.group)), floorWidth: Math.max(beat.floorWidth || 0, reveal.floorWidth || 0)};
  };
  workWrap = true;
  els.stage.classList.remove('is-transport-top');
  let {needed, group, floorWidth} = plan();
  // A stage too small for a wrapped line's second row keeps every line on one row (fitWork shrinks it).
  if (group > 1 && cellAt(group, needed > group) < cellMin) {
    workWrap = false;
    ({needed, group, floorWidth} = plan());
  }
  // A one-row line that cannot clear the transport even at the floor font: the transport takes the
  // stage's top corner for this step, so the work never runs under it and never jumps mid-step.
  els.stage.classList.toggle('is-transport-top', floorWidth > workRoom() + 0.5);
  let lines = Math.min(needed, TEACH.maxLines);
  while (lines > group && cellAt(lines, needed > lines) < TEACH.cellTarget) lines -= 1;
  // No room for a chip row above the lines (a 3×3 on a small phone): the chips park in a column in the
  // stage's top-left corner instead, beside the scene, so a folded result never loses its source.
  const side = needed > lines && cellAt(lines, true) < cellMin;
  workMax = lines;
  els.work.classList.remove('is-fold-silent');
  els.stage.classList.toggle('is-fold-side', side);
  if (side) els.stage.style.setProperty('--fold-side-w', `${foldChipsWidth(step)}px`);
  else els.stage.style.removeProperty('--fold-side-w');
  els.stage.style.setProperty('--work-lines', String(lines));
  els.stage.style.setProperty('--work-fold', needed > lines && !side ? '1' : '0');
}

/* ---------- Legacy timed beats (lessons not on the teaching runner yet) ---------- */

const BEATS = {
  readEntry({mat, i, j}) {
    const label = (text, kind) => ({text, kind, label: true});
    clearMarks();
    mark(mat, rowCells(mat, i), 'is-row');
    setWork([label(`${i + 1}. satır`, 'a')]);
    cue(650, () => {
      mark(mat, colCells(mat, j), 'is-col');
      setWork([label(`${i + 1}. satır`, 'a'), {text: 've'}, label(`${j + 1}. sütun`, 'b')]);
    });
    cue(1250, () => {
      clearMarks();
      mark(mat, [[i, j]], 'is-result');
      const cell = cellEl(mat, i, j);
      motion.set(cell, {scale: 0.7});
      motion.to(cell, {scale: 1}, 'land');
      setWork([{html: `a<sub>${i + 1}${j + 1}</sub> = ${formatNumber(lesson.mats[mat][i][j])}`, kind: 'sum'}]);
    });
  },

  multiply({a, b, c, i, j}) {
    const left = lesson.mats[a];
    const right = lesson.mats[b];
    const n = left[0].length;
    let sum = 0;
    const tokens = [];
    for (let k = 0; k < n; k++) {
      sum += left[i][k] * right[k][j];
      if (k > 0) tokens.push({text: '+', hidden: true, ref: `plus${k}`});
      const rightText = formatFactor(right[k][j]);
      tokens.push({text: termText(left[i][k], '+', k === 0), kind: 'a', hidden: true, ref: `a${k}`});
      tokens.push({text: '·', hidden: true, ref: `dot${k}`});
      tokens.push({text: rightText, kind: 'b', hidden: true, ref: `b${k}`});
    }
    tokens.push({text: '=', hidden: true, ref: 'eq'});
    tokens.push({text: formatNumber(sum), kind: 'sum', hidden: true, ref: 'sum'});

    clearMarks();
    setCell(c, i, j, null);
    describeMatrix(c);
    setWork(tokens);
    mark(a, rowCells(a, i), 'is-row');
    mark(b, colCells(b, j), 'is-col');
    mark(c, [[i, j]], 'is-target');

    for (let k = 0; k < n; k++) {
      cue(380 + k * 520, () => {
        if (k > 0) revealToken(`plus${k}`);
        fly(cellEl(a, i, k), workToken(`a${k}`), formatNumber(left[i][k]), 'row', () => revealToken(`a${k}`));
        clock.after(90, () => {
          fly(cellEl(b, k, j), workToken(`b${k}`), formatNumber(right[k][j]), 'col', () => {
            revealToken(`dot${k}`);
            revealToken(`b${k}`);
          });
        });
      });
    }
    const sumAt = 380 + n * 520 + 260;
    cue(sumAt, () => {
      revealToken('eq');
      revealToken('sum');
    });
    cue(sumAt + 380, () => {
      fly(workToken('sum'), cellEl(c, i, j), formatNumber(sum), 'result', () => {
        setCell(c, i, j, sum, {land: true});
        describeMatrix(c);
        cellEl(c, i, j).classList.remove('is-target');
        mark(c, [[i, j]], 'is-result');
      });
    });
  },

  rowOp({mat, source, target, factor}) {
    const rows = lesson.mats[mat];
    const scaled = rows[source].map((value) => value * factor);
    const result = rows[target].map((value, j) => value + scaled[j]);
    const sign = factor < 0 ? '−' : '+';
    clearMarks();
    mark(mat, rowCells(mat, source), 'is-row');
    setWork([{
      html: `R<sub>${target + 1}</sub> → R<sub>${target + 1}</sub> ${sign} ${Math.abs(factor)}R<sub>${source + 1}</sub>`,
      label: true,
    }]);

    let chips = [];
    cue(420, () => {
      // Copy the source row and drop it under the matrix, where it is written on paper.
      chips = rows[source].map((value, j) => {
        const cell = cellEl(mat, source, j);
        const rect = rectIn(els.stage, cell);
        const targetRect = rectIn(els.stage, cellEl(mat, target, j));
        const chip = makeChip(rect, formatNumber(value), 'row', getComputedStyle(cell).fontSize);
        chip.inkTarget = cellEl(mat, target, j);
        clock.after(j * 60, () => motion.to(chip, {y: targetRect.y + targetRect.h * 1.3}, 'teachY'));
        return {chip, j, targetRect};
      });
    });
    cue(1250, () => {
      // Scale it: the numbers become factor × row.
      chips.forEach(({chip, j}) => {
        chip.textContent = formatNumber(scaled[j]);
        motion.set(chip, {scale: 0.7});
        motion.to(chip, {scale: 1}, 'land');
      });
    });
    cue(1750, () => {
      // Push it up into the target row; the row changes on contact (causal "launch" within 100 ms).
      // The highlight moves to the target row as the chips go up: on contact only the values change.
      clearMarks();
      mark(mat, rowCells(mat, target), 'is-result');
      chips.forEach(({chip, j}, index) => {
        const isLast = index === chips.length - 1;
        const toEl = cellEl(mat, target, j);
        const aim = () => {
          const to = rectIn(els.stage, toEl);
          return {x: motion.stateOf(chip).x, y: to.y};
        };
        const steer = (goal) => motion.to(chip, {y: goal.y}, 'teachY');
        steer(aim());
        // Each cell changes on its own chip's contact (landChip: the chip goes as the value is written).
        landChip(chip, toEl, aim, steer, () => true, () => {
          setCell(mat, target, j, result[j], {land: true});
          if (isLast) describeMatrix(mat);
        });
      });
    });
  },

  /** Cofactor of entry (i, j): strike its row and column, keep the minor, show the sign. */
  minor({mat, i, j}) {
    const m = lesson.mats[mat];
    const n = m.length;
    const sign = (i + j) % 2 === 0 ? '+' : '−';
    const sub = `${i + 1}${j + 1}`;
    clearMarks();
    mark(mat, [[i, j]], 'is-pivot');
    setWork([{html: `a<sub>${sub}</sub> = ${formatNumber(m[i][j])}`, label: true}]);
    cue(450, () => mark(mat, rowCells(mat, i).filter(([, c]) => c !== j), 'is-struck'));
    cue(800, () => mark(mat, colCells(mat, j).filter(([r]) => r !== i), 'is-struck'));
    cue(1250, () => {
      const rest = [];
      m.forEach((row, r) => row.forEach((_, c) => {
        if (r !== i && c !== j) rest.push([r, c]);
      }));
      mark(mat, rest, 'is-col');
      setWork([
        {html: `C<sub>${sub}</sub> =`, label: true},
        {html: `(−1)<sup>${i + 1}+${j + 1}</sup>`, ref: 'sign'},
        {html: `M<sub>${sub}</sub>`, kind: 'b'},
      ]);
    });
    cue(2050, () => {
      const numeric = m.every((row) => row.every((value) => typeof value === 'number'));
      const tokens = [{html: `C<sub>${sub}</sub> =`, label: true}, {text: sign, kind: 'sum', ref: 'sign'}];
      if (numeric && n === 3) {
        const rest = m.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j));
        const minorValue = rest[0][0] * rest[1][1] - rest[0][1] * rest[1][0];
        const cofactor = sign === '+' ? minorValue : -minorValue;
        tokens.push({text: `(${formatNumber(rest[0][0])}·${formatFactor(rest[1][1])} − ${formatFactor(rest[0][1])}·${formatFactor(rest[1][0])})`, kind: 'b'});
        tokens.push({text: '='}, {text: formatNumber(cofactor), kind: 'sum', ref: 'sum'});
      } else {
        tokens.push({html: `M<sub>${sub}</sub>`, kind: 'b'});
      }
      setWork(tokens);
      const signEl = workToken('sign');
      if (signEl) {
        motion.set(signEl, {scale: 0.5});
        motion.to(signEl, {scale: 1}, 'land');
      }
    });
  },

  /** Rows a and b trade places; each number travels on its own spring. */
  rowSwap({mat, a, b, note}) {
    const rows = lesson.mats[mat];
    clearMarks();
    mark(mat, rowCells(mat, a), 'is-row');
    mark(mat, rowCells(mat, b), 'is-col');
    setWork([{html: `R<sub>${a + 1}</sub> ↔ R<sub>${b + 1}</sub>`, label: true}]);
    cue(450, () => {
      const pairs = [[a, b, 'row'], [b, a, 'col']];
      let pending = rows[a].length * 2;
      const swapped = {[a]: rows[b].slice(), [b]: rows[a].slice()};
      pairs.forEach(([from, to, kind]) => rows[from].forEach((value, j) => {
        const fromEl = cellEl(mat, from, j);
        const toEl = cellEl(mat, to, j);
        fly(fromEl, toEl, formatNumber(value), kind, () => {
          pending -= 1;
          if (pending > 0) return;
          [a, b].forEach((r) => swapped[r].forEach((v, c) => setCell(mat, r, c, v, {land: true})));
          describeMatrix(mat);
          clearMarks();
          mark(mat, rowCells(mat, a), 'is-col');
          mark(mat, rowCells(mat, b), 'is-row');
          if (note) setWork([{html: `R<sub>${a + 1}</sub> ↔ R<sub>${b + 1}</sub>`, label: true}, {html: note, kind: 'sum'}]);
        });
        fromEl.textContent = '';
      }));
    });
  },

  /** Multiply one row by a factor in place. */
  rowScale({mat, row, factor, note}) {
    const rows = lesson.mats[mat];
    const label = {html: `R<sub>${row + 1}</sub> → ${formatNumber(factor)}R<sub>${row + 1}</sub>`, label: true};
    clearMarks();
    mark(mat, rowCells(mat, row), 'is-row');
    setWork([label]);
    cue(700, () => {
      rows[row].forEach((value, j) => clock.after(j * 90, () => {
        setCell(mat, row, j, typeof value === 'number' && typeof factor === 'number' ? value * factor : value, {land: true});
      }));
      cue(rows[row].length * 90 + 200, () => {
        describeMatrix(mat);
        clearMarks();
        mark(mat, rowCells(mat, row), 'is-result');
        if (note) setWork([label, {html: note, kind: 'sum'}]);
      });
    });
  },

  /** Each row of `mat` flies over to become the same-numbered column of `into`. */
  transpose({mat, into}) {
    const m = lesson.mats[mat];
    clearMarks();
    lesson.mats[into].forEach((row, r) => row.forEach((_, c) => setCell(into, r, c, null)));
    setWork([{html: 'satır → sütun', label: true}]);
    m.forEach((row, i) => cue(350 + i * 750, () => {
      clearMarks();
      mark(mat, rowCells(mat, i), 'is-row');
      // Sibling chips leave a sibling stagger apart (on screen), so they land as one reading moment.
      row.forEach((value, j) => clock.after(chromeDelay(j * CHOREO.stagger), () => {
        fly(cellEl(mat, i, j), cellEl(into, j, i), formatNumber(value), 'row', () => {
          setCell(into, j, i, value, {land: true});
          cellEl(into, j, i)?.classList.add('is-col');
          describeMatrix(into);
        });
      }));
    }));
  },

  /**
   * Free choreography for anything the named beats do not cover. Each frame runs at `at` ms:
   * clear (bool), marks [[mat, i|'*', j|'*', class]], work [tokens], set [[mat, i, j, value]],
   * label [id, html], fly [{from: [mat, i, j], to: [mat, i, j] | 'work:<ref>' | 'obj:<id>', kind, text}].
   */
  script({frames}) {
    const end = endMarks(frames);
    if (end) frames = [...frames, end];
    // Chips of fly-only frames that follow a fly closer than a value's reading floor (on screen) leave
    // as one volley, a sibling stagger apart: their values land as one reading moment, not 300 ms apart.
    const tempo = tempoOf(channel);
    let lead = null;
    let previous = 0;
    let sibling = 0;
    frames = frames.map((frame) => {
      const at = frame.at || 0;
      const flyOnly = frame.fly && Object.keys(frame).every((key) => key === 'at' || key === 'fly');
      const close = lead && (at - previous) * tempo < TEACH.floorValue;
      previous = at;
      if (flyOnly && close) {
        sibling += 1;
        return {...frame, at: lead + sibling * CHOREO.stagger / tempo};
      }
      lead = frame.fly ? at : null;
      sibling = 0;
      return frame;
    });
    const landed = new Set();
    const blank = (spec) => spec[3] === '' || spec[3] == null;
    const writeSet = (spec) => {
      if (landed.has(spec)) return;
      landed.add(spec);
      setCell(...spec, {land: true});
      describeMatrix(spec[0]);
    };
    // One reading moment per frame. What changes or leaves goes first (marks, emptied cells, the old
    // words, chips lifting off); what is read comes after, all at once: cells and labels are written as
    // the frame's new words reach half ink (DRAW_READ), or leaveHead after the rest. So nothing the
    // frame starts begins while its words are being read (the cue gate then holds the next frame).
    frames.forEach((frame, f) => cue(frame.at || 0, () => {
      if (frame.clear) clearMarks();
      (frame.marks || []).forEach(applyMark);
      const sets = frame.set || [];
      sets.filter(blank).forEach(writeSet);
      const line = frame.work ? setWork(frame.work) : null;
      const shown = (frame.reveal || []).map(revealToken).some(Boolean);
      flyFrame(frame, f);
      // A label written with a new line is a reading moment of its own (it may re-fit the scene): it is a
      // cue, so the gate holds it until the line's reading floor has passed. Cells are read with the line.
      const ownLabel = frame.label && line?.drawIn != null;
      const read = () => {
        sets.filter((spec) => !blank(spec)).forEach(writeSet);
        if (frame.label && !ownLabel) setLabel(frame.label[0], frame.label[1], {land: true});
      };
      const drawIn = shown ? 0 : line?.drawIn;
      const head = frame.clear || frame.marks?.length || frame.fly?.length || sets.some(blank) || frame.work;
      const delay = drawIn != null ? drawIn + DRAW_READ : head ? CHOREO.leaveHead : 0;
      // One frame past half ink: the gate has seen the line by then.
      if (ownLabel) cue(delay + 1000 / 60, () => setLabel(frame.label[0], frame.label[1], {land: true}));
      if (!(frame.label && !ownLabel) && !sets.some((spec) => !blank(spec))) return;
      if (delay) clock.after(delay, read);
      else read();
    }));
    function flyFrame(frame, f) {
      const gate = cueGate;
      // Several numbers flying into one work token (a product): each shows in it as its chip lands
      // ("1", then "1·4"), and the token becomes its declared value once that has been read (a cue,
      // so the gate holds it to the reading floor). No carried factor vanishes into a result.
      const feeds = new Map();
      (frame.fly || []).forEach((item) => {
        if (item.to.startsWith?.('work:')) feeds.set(item.to, [...(feeds.get(item.to) || []), item]);
      });
      // The beat's next cue waits for each joined token's value (gate.pending), from lift-off on.
      // Room for the joined factors ("0·(−5)") is made as they lift off: the line glides once, during
      // the flight, so the product never lands on a neighbour still gliding away (CHECK5 minor 1).
      feeds.forEach((group, to) => {
        if (group.length < 2) return;
        if (gate) gate.pending += 1;
        const token = workToken(to.slice(5));
        if (!token) return;
        const op = joinOp(group.map((member) => member.from), token.textContent);
        const joined = group.map((member, k) => {
          const part = member.text ?? formatNumber(lesson.mats[member.from[0]][member.from[1]][member.from[2]]);
          return k && /^[−-]/.test(part) ? `(${part})` : part;
        }).join(op);
        const own = token.textContent;
        token.textContent = joined;
        const room = token.getBoundingClientRect().width;
        token.textContent = own;
        if (room > token.getBoundingClientRect().width) flipWork(() => {
          token.style.minWidth = `${room}px`;
        });
      });
      const parts = new Map();
      const feed = (item, text) => {
        const group = feeds.get(item.to);
        const ref = item.to.slice(5);
        const token = workToken(ref);
        if (!token) return;
        const done = parts.get(item.to) || new Map();
        parts.set(item.to, done);
        if (!done.size) token.dataset.value = token.textContent;
        done.set(item, text);
        const op = joinOp(group.map((member) => member.from), token.dataset.value);
        const shown = group.filter((member) => done.has(member)).map((member, k) => {
          const part = done.get(member);
          return k && /^[−-]/.test(part) ? `(${part})` : part;
        });
        flipWork(() => {
          token.textContent = shown.join(op);
          revealToken(ref);
        });
        if (done.size < group.length) return;
        // The joined factors are read once their line has stopped gliding, then the value takes their place.
        const line = token.closest('.st-work__line');
        const moving = () => [...(line?.children || [])].some((el) => Object.keys(motion.states.get(el)?.springs || {}).length);
        const combine = () => {
          if (gate) gate.pending -= 1;
          flipWork(() => {
            token.textContent = token.dataset.value;
            token.style.minWidth = '';
          });
        };
        const wait = () => {
          const glide = moving();
          clock.after(chromeDelay(glide ? TEACH.poll : TEACH.floorValue), glide ? wait : combine);
        };
        wait();
      };
      (frame.fly || []).forEach((item) => {
        const fromEl = cellEl(...item.from);
        const toEl = typeof item.to === 'string' ?
          (item.to.startsWith('work:') ? workToken(item.to.slice(5)) : els.scene.querySelector(`[data-obj="${item.to.slice(4)}"]`)) :
          cellEl(...item.to);
        if (!fromEl || !toEl) return;
        const [matId, i, j] = item.from;
        const text = item.text ?? formatNumber(lesson.mats[matId][i][j]);
        // This frame's own set ran before the chip left (it clears the slot): look from the next one.
        const write = landSet(setOnLanding(frames, f + 1, item.to), landed);
        fly(fromEl, toEl, text, item.kind || 'row', () => {
          if (feeds.get(item.to)?.length > 1) feed(item, text);
          else if (item.to.startsWith?.('work:')) revealToken(item.to.slice(5));
          write();
        });
      });
    }
  },
};


/**
 * Reveal-end rule: when a script ends with cells marked, it ends with every cell its last run of
 * same-colour frames marked (the three diagonals of a sum, not only the last one).
 */
function endMarks(frames) {
  let last = -1;
  frames.forEach((frame, index) => {
    if (frame.marks?.length) last = index;
  });
  if (last < 0 || frames.slice(last + 1).some((frame) => frame.clear)) return null;
  const colour = (frame) => {
    const classes = new Set((frame.marks || []).map((spec) => spec[3]));
    return classes.size === 1 ? [...classes][0] : null;
  };
  const className = colour(frames[last]);
  if (!className) return null;
  const marks = [];
  for (let index = last; index >= 0; index--) {
    const frame = frames[index];
    if (!frame.marks?.length) continue;
    if (colour(frame) !== className) break;
    marks.push(...frame.marks);
  }
  const at = Math.max(...frames.map((frame) => frame.at || 0)) + CHOREO.endMarksDelay;
  return marks.length > frames[last].marks.length ? {at, marks} : null;
}

/**
 * Reveal-end rule: a scene label that still asks ("= ?") gets the answer once the reveal has landed,
 * when the answer is a number.
 */
function answerLabels(step) {
  const right = step.kind === 'keypad' ? step.answer : step.options?.find((option) => option.correct)?.text;
  const text = right === undefined ? '' : formatNumber(typeof right === 'number' ? right : String(right).trim());
  if (!/^−?\d+([.,]\d+)?$/.test(text)) return;
  els.scene.querySelectorAll('.st-label[data-obj]').forEach((label) => {
    const id = label.dataset.obj;
    const html = lesson.labels[id] ?? '';
    if (!/\?\s*$/.test(html.replace(/<[^>]*>/g, ''))) return;
    setLabel(id, html.replace(/\?(\s*(<[^>]*>\s*)*)$/, `<span class="st-hl-result">${text}</span>$1`), {land: true});
  });
}

/**
 * Beats are teaching motion. The entry beat runs in 'beat' (a tap on İleri finishes it first); the
 * answer reveal runs in 'reveal' and never holds up Devam. Teaching beats (teachActions) run on the
 * runner at the calibrated pace; legacy beats keep their cue times at TEMPO.
 */
/* ---------- Tempo classes: what a beat teaches sets its pace (TEMPO_CLASSES) ---------- */

/** Text of a frame's work tokens, tags stripped. */
function workText(work = []) {
  return work.map((token) => token.text ?? String(token.html ?? '').replace(/<[^>]*>/g, '')).join(' ');
}

/** A written calculation: an "=" and an operator between two operands ("1·4 − 3·0 = 4", "(−1)·5 = −5"). */
const CALC = /[\p{L}\p{N})|]\s*[·×−+\-/]\s*[\p{L}\p{N}(|]/u;

/** The moves of one frame (script or paced): carries by target, and a calculation written. */
function frameMoves(frame) {
  const moves = [];
  const targets = new Map();
  (frame.fly || []).forEach((fly) => {
    const key = Array.isArray(fly.to) ? `cell:${fly.to.join()}` : String(fly.to);
    targets.set(key, (targets.get(key) || 0) + 1);
  });
  targets.forEach((count, key) => moves.push(key.startsWith('cell:') ? 'copy' : count > 1 ? 'product' : 'carry'));
  const text = workText(frame.work);
  if (text.includes('=') && CALC.test(text)) moves.push('calc');
  return moves;
}

/**
 * Kinds of move a beat makes. A number written into a cell no chip carries to is a write (a cofactor, a
 * scaled row); a sign or a blank is not. A runner recipe on letters ("ad − bc") is its own move: the formula.
 */
function beatMoves(beat) {
  if (!beat) return [];
  if (beat.type === 'sequence') return beat.beats.flatMap(beatMoves);
  if (beat.type === 'script' || beat.type === 'paced') {
    const carried = new Set(beat.frames.flatMap((frame) => (frame.fly || []).filter((fly) => Array.isArray(fly.to)).map((fly) => fly.to.join())));
    const writes = beat.frames.some((frame) => (frame.set || []).some(([id, i, j, value]) =>
      !carried.has([id, i, j].join()) && /[\p{L}\p{N}]/u.test(String(value ?? ''))));
    return [...beat.frames.flatMap(frameMoves), ...(writes ? ['write'] : [])];
  }
  // Reading an entry only marks cells and labels them.
  if (beat.type === 'readEntry') return [];
  const symbolic = (beat.values || []).some((value) => /\p{L}/u.test(String(value)));
  return [beat.type + (symbolic ? ':letters' : '')];
}

/**
 * A beat's tempo class: quick when it moves no number and writes no calculation; repeat when every move
 * it makes was already played earlier in this lesson (in step order, a step's beat before its reveal);
 * teach otherwise. A beat's `tempo` declares the class where this inference is wrong (listed in
 * SATIR_DESIGN.md). After a wrong answer a repeat reveal teaches: the move is not known to this learner yet.
 */
function tempoClass(index, name, wrong = false) {
  const step = STEPS[index];
  const beat = name === 'reveal' ? step?.reveal : step?.beat;
  if (!beat) return null;
  let cls = beat.tempo;
  if (!cls) {
    const moves = beatMoves(beat);
    const seen = new Set();
    STEPS.slice(0, index).forEach((before) => [before.beat, before.reveal].forEach((b) => beatMoves(b).forEach((m) => seen.add(m))));
    if (name === 'reveal') beatMoves(step.beat).forEach((m) => seen.add(m));
    cls = !moves.length ? 'quick' : moves.every((m) => seen.has(m)) ? 'repeat' : 'teach';
  }
  return wrong && cls === 'repeat' ? 'teach' : cls;
}

/** Every beat played: its step, channel and class (design-qa holds a quick beat to its budget). */
const tempoLog = [];

/** Sets channel `name` to the class pace of the current step's beat, before anything of it is scheduled. */
function useTempo(name) {
  const right = name !== 'reveal' || lesson.answered === null || answeredRight(STEPS[lesson.index]);
  const cls = tempoClass(lesson.index, name, !right) || 'teach';
  channelPace[name] = TEMPO_CLASSES[cls];
  return cls;
}

/** Whether the current step's answer is right (a reveal's budget depends on it). */
function answeredRight(step) {
  if (lesson.answered === null || !step) return false;
  return step.kind === 'choice' ? Boolean(step.options[lesson.answered]?.correct) : Number(lesson.answered) === step.answer;
}

/** When the answer was tapped: a fresh reveal's budget counts from there (revisits from their start). */
let revealTapAt = null;

function playBeat(beat, name = 'beat') {
  if (beat) {
    tempoLog.push({step: lesson.index, name, cls: useTempo(name), at: clock.now});
    withChannel(name, () => {
      const actions = compileBeat(beat, name === 'reveal' ? 'reveal' : 'teach');
      const right = name === 'reveal' && answeredRight(STEPS[lesson.index]);
      // It aims revealMargin early: the projection learns the slower crossing carries only when they come.
      const deadline = right ? (revealTapAt ?? clock.now) + TEACH.revealBudget - TEACH.revealMargin : null;
      if (name === 'reveal') revealTapAt = null;
      if (actions) new Runner(freshWork(actions), name, deadline).start();
      else {
        cueGate = new CueGate();
        cueGates.add(cueGate);
        try {
          BEATS[beat.type](beat);
        } finally {
          cueGate = null;
        }
      }
    });
  }
  if (name === 'reveal') {
    const step = STEPS[lesson.index];
    whenIdle('reveal', () => {
      if (STEPS[lesson.index] === step && lesson.answered !== null) answerLabels(step);
    });
  }
}

/* ---------- Narration, progress and dock ---------- */

/** Layer C: the eyebrow row, title and body arrive one after another from the travel direction. */
function enterNarration(direction, delay = 0) {
  [els.narrRow, els.title, els.body].filter((el) => !el.hidden).forEach((el, index) => {
    motion.set(el, {opacity: ENTER_FLOOR, x: SHIFT.narr * direction});
    clock.after(delay + index * CHOREO.stagger, () => motion.to(el, {opacity: 1, x: 0}, 'move'));
  });
}

/**
 * Math in a title never breaks: runs like "A = 0" or "det(cA) ≠ c·det A" (terms joined by spaced
 * relation or operator signs) are wrapped in st-math spans. Markup already in the title is kept.
 */
const MATH_RUN = /[^\s<>]+(?:\s[=≠<>≤≥+−·→]\s[^\s<>]+)+/g;

function mathTitle(html) {
  let depth = 0;
  return html.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) {
      if (/^<span\b/.test(part)) depth += 1;
      else if (/^<\/span/.test(part) && depth) depth -= 1;
      return part;
    }
    return depth ? part : part.replace(MATH_RUN, (run) => `<span class="st-math">${run}</span>`);
  }).join('');
}

function renderNarration(step, direction, delay = 0) {
  els.eyebrow.textContent = feelSlot('stepEyebrow', (item) => item.eyebrow)(step);
  // Midpoint line: calm, silent, inside the narration's own eyebrow, so it never blocks or adds a layer.
  if (halfNote) els.eyebrow.textContent = `Yarısı bitti · ${els.eyebrow.textContent}`;
  els.title.innerHTML = mathTitle(step.title);
  els.body.innerHTML = step.body || '';
  els.body.hidden = !step.body;
  els.unclear.hidden = Boolean(step.hideUnclear);
  syncUnclear(step);
  enterNarration(direction, delay);
}

/**
 * The narration row's quiet control (UC-1): on a graded question not answered yet it is "Bilmiyorum", an
 * action that is never shown pressed (a flag from an earlier run must not read as pressed); otherwise it is
 * the "Anlamadım" toggle, pressed when this step is flagged.
 */
function syncUnclear(step = STEPS[lesson.index]) {
  const ask = (step.kind === 'choice' || step.kind === 'keypad') && lesson.answered === null;
  els.unclear.textContent = ask ? 'Bilmiyorum' : 'Anlamadım';
  els.unclear.dataset.mode = ask ? 'unknown' : 'unclear';
  if (ask) els.unclear.removeAttribute('aria-pressed');
  else els.unclear.setAttribute('aria-pressed', String(Boolean(storageGet(STORE.unclear, {})[`${currentLesson}:${lesson.index}`])));
}

/** After an answer the control becomes "Anlamadım" again: the old word leaves, the new one enters (labels never crossfade). */
function swapUnclear() {
  withChannel('chrome', () => motion.to(els.unclear, {opacity: 0}, 'fade', {onArrive: () => {
    syncUnclear();
    motion.to(els.unclear, {opacity: 1}, 'fade');
  }}));
}

/**
 * UC-2: while the entry beat plays, İleri is drawn soft (Geri's look), never disabled; when the beat lands,
 * by itself or on the tap that lands it, it is the one primary again. The two-tap rule now shows itself.
 */
function softNext(step) {
  const next = els.dock.querySelector('.st-btn--primary[data-action="next"]');
  if (!next) return;
  next.classList.add('is-soft');
  whenIdle('beat', () => {
    if (STEPS[lesson.index] === step) next.classList.remove('is-soft');
  });
}

/** Dock items rise from the thumb zone, row by row. */
function enterDock(delay = 0) {
  const items = [...els.dock.children];
  const rows = [...new Set(items.map((el) => el.offsetTop))].sort((a, b) => a - b);
  items.forEach((el) => {
    motion.set(el, {opacity: ENTER_FLOOR, y: SHIFT.dock});
    clock.after(delay + rows.indexOf(el.offsetTop) * CHOREO.stagger, () => motion.to(el, {opacity: 1, y: 0}, 'move'));
  });
}

const SHORT_OPTION = 7;

/**
 * Option badges are letters, unless an option names a matrix (A, AB, A + B): then "B  A" would read as
 * one expression, so the badges are numbers.
 */
function optionKeys(step) {
  const names = step.options.some((option) => /(^|[^A-Za-zÇĞİÖŞÜçğıöşü])[A-Z]($|[^a-zçğıöşü])/.test(option.text.replace(/<[^>]*>/g, ' ')));
  return names ? '1234' : 'ABCD';
}
const KEY_NAMES = {'⌫': 'Sil', '−': 'Eksi'};

function dockKind(step) {
  return step.kind === 'choice' || step.kind === 'keypad' ? step.kind : 'nav';
}

function renderDock(step, delay = 0) {
  const dock = els.dock;
  const kind = dockKind(step);
  const isLast = lesson.index === STEPS.length - 1;
  if (kind === 'nav' && dock.dataset.kind === 'nav') {
    // Layer A between two explanation steps: the buttons stay where they are, only their state changes.
    // UC-D10: no Geri in the dock; the top bar's chevron is the one back location.
    const next = dock.querySelector('[data-action="next"]');
    next.textContent = isLast ? 'Bitir' : 'İleri';
    next.classList.remove('is-soft');
    return;
  }
  dock.dataset.kind = kind;
  // The tap budget is declared in markup (data-group / data-primary / data-secondary / data-layer), see SPEC 2.4.
  if (kind === 'nav') dock.removeAttribute('data-group');
  else dock.dataset.group = kind;
  if (kind === 'choice') {
    // Four short answers (numbers, short words) sit in a 2×2 grid: two rows less in the thumb zone.
    const short = step.options.length === 4 &&
      step.options.every((option) => option.text.replace(/<[^>]*>/g, '').length <= SHORT_OPTION);
    dock.className = `st-dock st-dock--choice${short ? ' st-dock--grid' : ''}`;
    dock.innerHTML = step.options.map((option, index) =>
      `<button type="button" class="st-option" data-option="${index}">` +
      `<span class="st-option__key">${optionKeys(step)[index]}</span>${option.text}</button>`).join('');
    if (lesson.answered === 'unknown') markShown(step);
    else if (lesson.answered !== null) markChoice(step, lesson.answered, false);
  } else if (kind === 'keypad') {
    dock.className = 'st-dock st-dock--keypad';
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '−', '⌫'];
    dock.innerHTML = '<div class="st-keypad__display is-empty" id="keypad-display">' +
      '<span class="st-keypad__value" id="keypad-value">Cevap</span><span class="st-keypad__caret"></span></div>' +
      '<button type="button" class="st-btn st-btn--primary st-keypad__check" data-action="check" data-primary>Kontrol</button>' +
      keys.map((key) =>
        `<button type="button" class="st-key" data-key="${key}" aria-label="${KEY_NAMES[key] || key}">${key}</button>`).join('');
    if (lesson.answered === 'unknown') markShown(step);
    else if (lesson.answered !== null) markKeypad(lesson.answered === step.answer, lesson.answered);
  } else {
    dock.className = 'st-dock st-dock--nav';
    dock.innerHTML = `<button type="button" class="st-btn st-btn--primary" data-action="next" data-primary>${isLast ? 'Bitir' : 'İleri'}</button>`;
  }
  enterDock(delay);
}

/**
 * The top bar's back chevron stands in for Geri where the dock has none (questions, the feedback
 * sheet). It keeps its place when hidden, so the progress bar never moves.
 */
function syncBack() {
  const step = STEPS[lesson.index];
  const show = !lesson.complete && lesson.index > 0 && Boolean(step); // UC-D10: every step after the first
  els.back.classList.toggle('is-off', !show);
  els.back.disabled = !show;
}

/** The lesson's midpoint step: the first 'Sınav tipi' step if there is one, else the middle step. Display only. */
function midpointOf() {
  return Math.floor(STEPS.length / 2); // true halfway: 'Sınav tipi' starts too late to say "half done"
}

/** Lessons whose midpoint line already showed in this page session (the line is shown once, never on revisit). */
const halfShown = new Set();
/** True while the step being entered is the midpoint reached forward for the first time. */
let halfNote = false;

/** Above this many steps the progress segments sit closer together. */
const DENSE_PROGRESS = 12;

function buildProgress() {
  els.progress.innerHTML = STEPS.map(() => '<span class="st-progress__seg"><span class="st-progress__fill"></span></span>').join('');
  // Midpoint mark: one slightly wider gap before the midpoint step, so the bar reads as two parts. Display only.
  const midSeg = els.progress.children[midpointOf()];
  if (midSeg) {
    midSeg.classList.add('st-progress__seg--mid');
    midSeg.style.marginInlineStart = 'var(--space-xs)'; // on top of the bar's own gap
  }
  els.progress.classList.toggle('is-dense', STEPS.length > DENSE_PROGRESS);
  els.progress.dataset.lesson = currentLesson;
  els.progress.querySelectorAll('.st-progress__fill').forEach((fill) => motion.set(fill, {scaleX: 0}));
}

/** Segments fill left to right on a spring; going back drains them. The counter rolls. */
function renderProgress(direction = 1, delay = 0) {
  if (els.progress.dataset.lesson !== currentLesson || els.progress.children.length !== STEPS.length) buildProgress();
  const segs = [...els.progress.children];
  let order = 0;
  segs.forEach((seg, index) => {
    const done = lesson.complete || index < lesson.index;
    const current = !lesson.complete && index === lesson.index;
    seg.classList.toggle('is-done', done);
    seg.classList.toggle('is-current', current);
    const fill = seg.firstElementChild;
    const target = done || current ? 1 : 0;
    const state = motion.stateOf(fill);
    if (state.scaleX === target && !state.springs.scaleX) return;
    const wait = delay + (order++) * CHOREO.stagger / 2;
    clock.after(wait, () => motion.to(fill, {scaleX: target}, 'move'));
  });
  els.countLesson.textContent = `${currentLesson} · `;
  const text = `${lesson.complete ? STEPS.length : lesson.index + 1}/${STEPS.length}`;
  if (els.count.textContent !== text) {
    els.count.textContent = text;
    motion.set(els.count, {opacity: 0, y: SHIFT.count * direction});
    clock.after(delay, () => motion.to(els.count, {opacity: 1, y: 0}, 'move'));
  }
}

/** Lesson end: a ripple runs along the finished bar. */
function rippleProgress(delay = 0) {
  els.progress.querySelectorAll('.st-progress__fill').forEach((fill, index) => {
    clock.after(delay + index * CHOREO.stagger / 1.5, () => motion.to(fill, {scaleY: 1}, 'land', {velocity: {scaleY: 9}}));
  });
}

/* ---------- Answer feedback ---------- */


/** The verdict always says right or wrong; a streak is an extra badge, never a replacement. */
function verdictFor(correct) {
  return correct ? 'Doğru' : 'Tam değil';
}

const STREAK_MIN = 3;

/**
 * The stage shows the math, the sheet says why in words. A step whose reveal ends on the whole
 * derivation sets `stageExplains: true`: its right-answer text is then not repeated in the sheet.
 * Wrong answers always keep their explanation.
 */
function sheetText(step, correct, text) {
  return correct && step.stageExplains ? '' : text || '';
}

/** A word of the sheet's value ("ya", "Sonsuz", "Hayır,") stays in the text face; the rest is math. */
const VALUE_WORD = /^[A-Za-zÇĞİÖŞÜçğıöşü]{2,}[,.;]?$/;

/** A value as sheet HTML: authored markup as it is, plain text with its math runs in the math face. */
function valueHtml(value) {
  const text = String(value);
  if (/[<&]/.test(text)) return text;
  const runs = [];
  text.split(' ').forEach((token) => {
    const math = !VALUE_WORD.test(token);
    const last = runs[runs.length - 1];
    if (last && last.math === math) last.tokens.push(token);
    else runs.push({math, tokens: [token]});
  });
  return runs.map(({math, tokens}) => (math ? `<span class="st-math">${tokens.join(' ')}</span>` : tokens.join(' '))).join(' ');
}

/**
 * The sheet's first sentence carries the right value in words (UX audit fix 2): "Cevabın: X." or
 * "Doğrusu: X.", with a colon because some answers are words. His own answer (a typed value, a pick on a
 * revisit) is not in the sentence: it is the head chip "Senin: X", so the text stays short enough for 3 lines.
 */
function firstSentence(correct, right) {
  const value = (html) => `<b class="st-sheet__value">${valueHtml(html)}</b>`;
  return `${correct ? 'Cevabın' : 'Doğrusu'}: ${value(right)}.`;
}

/** What the sheet says for an answer: the right value, his own if the sheet must show it, the why. */
function sheetFor(step, value, quiet) {
  const right = step.kind === 'choice' ? step.options.find((option) => option.correct).text : formatNumber(step.answer);
  // "Bilmiyorum": no verdict; the right answer and why it is right (UC-1).
  if (value === 'unknown') {
    const why = step.kind === 'choice' ? step.options.find((option) => option.correct).feedback : step.feedbackRight;
    return {correct: false, neutral: true, verdict: '', right, mine: null, text: sheetText(step, true, why)};
  }
  const correct = step.kind === 'choice' ? Boolean(step.options[value].correct) : value === step.answer;
  const typed = step.kind === 'keypad';
  const mine = correct || (!typed && !quiet) ? null :
    {html: typed ? formatNumber(value) : step.options[value].text, typed};
  const why = step.kind === 'choice' ? step.options[value].feedback : correct ? step.feedbackRight : step.feedbackWrong;
  return {correct, verdict: verdictFor(correct), right, mine, text: sheetText(step, correct, why)};
}

/**
 * The feedback sheet (TYPE_SYSTEM.md): the verdict row with the mascot at its end, then the text on the
 * same left edge, then Devam, always the one primary. Chrome motion: Devam always works at once.
 * `quiet` (a revisit) skips the mascot's reaction.
 */
function buildSheet({correct, neutral = false, verdict, text, right, mine = null, streak = 0, quiet = false}) {
  const sheet = document.createElement('div');
  sheet.className = `st-sheet ${neutral ? 'is-neutral' : correct ? 'is-correct' : 'is-wrong'}`;
  sheet.setAttribute('role', 'status');
  // Every sheet has the same head row (the card is always the same height): the verdict, the streak or his own value, and the duo
  // head at its end. The neutral sheet ("Bilmiyorum") has no duo and says "Birlikte bakalım".
  sheet.innerHTML = `<div class="st-sheet__head"><p class="st-sheet__verdict">${neutral ? 'Birlikte bakalım' : verdict}</p>` +
    (streak >= STREAK_MIN ? `<p class="st-sheet__streak">${streak} üst üste</p>` : '') +
    (mine ? `<p class="st-sheet__mine">Senin: <b class="st-sheet__mine-value">${valueHtml(mine.html)}</b></p>` : '') + '</div>' +
    (neutral ? '' : mascotSvg(correct ? 'happy' : 'oops', 'st-sheet__mascot')) +
    `<p class="st-sheet__text">${[firstSentence(correct, right), text].filter(Boolean).join(' ')}</p>` +
    '<button type="button" class="st-btn st-btn--primary" data-action="next" data-primary>Devam</button>';
  feelSlot('sheetMascot', () => {})(sheet, {correct, streak, quiet, neutral});
  return sheet;
}

/**
 * Runtime safety (the authoring gate keeps every text inside its 3 lines): a text that still overflows is clamped and gets
 * a quiet "Tamamı" in the head row. The tap opens it: the sheet grows upward over the narration and glides there; "Kısalt" folds it.
 */
function sheetOverflow(sheet) {
  const text = sheet.querySelector('.st-sheet__text');
  if (!text || text.scrollHeight <= text.clientHeight + 1) return;
  text.classList.add('is-clamped');
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'st-sheet__more';
  more.dataset.secondary = '';
  more.setAttribute('aria-expanded', 'false');
  more.textContent = 'Tamamı';
  sheet.querySelector('.st-sheet__head').appendChild(more);
  more.addEventListener('click', () => {
    const open = !text.classList.contains('is-open');
    const before = sheet.getBoundingClientRect().height;
    text.classList.toggle('is-open', open);
    sheet.classList.toggle('is-open', open);
    more.setAttribute('aria-expanded', String(open));
    more.textContent = open ? 'Kısalt' : 'Tamamı';
    const grown = sheet.getBoundingClientRect().height - before;
    motion.set(sheet, {y: grown});
    motion.to(sheet, {y: 0}, 'move');
  });
}

function showSheet(options) {
  const {correct, quiet = false} = options;
  withChannel('chrome', () => {
    const sheet = buildSheet(options);
    removeSheet(false);
    els.lessonView.appendChild(sheet);
    sheetOverflow(sheet);
    reserveDock(sheet.offsetHeight);
    els.dock.dataset.kind = 'sheet';
    const clip = narrationClip(sheet.getBoundingClientRect().top);
    if (quiet) {
      // A revisit: the sheet takes the dock's place and enters like a dock row.
      clip();
      els.dock.classList.add('has-sheet');
      motion.set(sheet, {opacity: ENTER_FLOOR, y: SHIFT.dock});
      motion.to(sheet, {opacity: 1, y: 0}, 'move');
    } else {
      // Layer E: slides up over the answers from below the screen edge.
      motion.set(sheet, {y: sheet.getBoundingClientRect().height + SHIFT.dock});
      motion.to(sheet, {y: 0}, 'move', {epsilon: 1, onArrive: () => {
        els.dock.classList.add('has-sheet');
        clip();
      }});
    }
    // The words enter with the verdict, whatever the stage is still showing: the reveal is the stage's,
    // the sheet's text is chrome (UX audit fix 1). A revisit: they are simply there, like narration.
    [...sheet.querySelectorAll('.st-sheet__verdict, .st-sheet__streak, .st-sheet__text')].forEach((el, index) => {
      motion.set(el, {opacity: quiet ? ENTER_FLOOR : 0, x: -SHIFT.narr});
      clock.after((quiet ? 0 : CHOREO.mascotDelay) + index * CHOREO.stagger, () => motion.to(el, {opacity: 1, x: 0}, 'move'));
    });
    if (quiet) return;
    feelSlot('sheetReact', () => {
      const mascot = sheet.querySelector('.st-mascot');
      if (!mascot) return;
      clock.after(CHOREO.mascotDelay, () => (correct ? cheerMascot(mascot) : worryMascot(mascot)));
    })(sheet, {correct, streak: options.streak || 0, neutral: Boolean(options.neutral)});
  });
}

/** Choice dock after an answer: chosen and right answers marked, the rest dimmed, nothing tappable. */
function markChoice(step, index, animate) {
  const buttons = [...els.dock.querySelectorAll('.st-option')];
  const right = step.options.findIndex((item) => item.correct);
  const chosen = buttons[index];
  buttons.forEach((button, i) => {
    button.disabled = true;
    if (i !== index && i !== right) button.classList.add('is-dim');
  });
  const showRight = () => {
    buttons[right]?.classList.add('is-correct');
    setKeyGlyph(buttons[right], 'check', animate);
  };
  if (step.options[index].correct) {
    chosen.classList.add('is-correct');
    setKeyGlyph(chosen, 'check', animate);
    if (animate) celebrateAnswer(chosen, chosen.querySelector('.st-option__key'));
    return;
  }
  chosen.classList.add('is-wrong');
  setKeyGlyph(chosen, 'cross', animate);
  if (!animate) {
    showRight();
    return;
  }
  rejectAnswer(chosen);
  // Cause, then effect: the right answer lights up a moment after the shake.
  clock.after(CHOREO.correctDelay, showRight);
}

/** Keypad after an answer: the value stays in the display, marked right or wrong; keys rest. */
function markKeypad(correct, value) {
  const display = byId('keypad-display');
  display.classList.remove('is-empty');
  display.classList.add(correct ? 'is-correct' : 'is-wrong');
  byId('keypad-value').textContent = formatNumber(value);
  els.dock.querySelectorAll('button').forEach((button) => {
    button.disabled = true;
  });
  return display;
}

/**
 * "Bilmiyorum" (UC-1): the right answer is shown with no verdict: an ink ring on the right option (the
 * others dim) or on the keypad display with the right value, one rule (`is-shown`); no glyph, no shake.
 */
function markShown(step) {
  if (step.kind === 'choice') {
    const right = step.options.findIndex((item) => item.correct);
    els.dock.querySelectorAll('.st-option').forEach((button, i) => {
      button.disabled = true;
      button.classList.add(i === right ? 'is-shown' : 'is-dim');
    });
    return;
  }
  lesson.keypadValue = '';
  const display = byId('keypad-display');
  display.classList.remove('is-empty');
  display.classList.add('is-shown');
  byId('keypad-value').textContent = formatNumber(step.answer);
  els.dock.querySelectorAll('button').forEach((button) => {
    button.disabled = true;
  });
}

/** What the learner chose at each question of this run, so a revisit shows it read-only. */
function savePick(record) {
  const picks = storageGet(STORE.picks, {});
  picks[currentLesson] = {...(picks[currentLesson] || {}), [lesson.index]: record};
  storageSet(STORE.picks, picks);
}

function pickAt(index) {
  return storageGet(STORE.picks, {})[currentLesson]?.[index] || null;
}

/**
 * After an answer: the reveal plays on the stage while the sheet comes up with the verdict and its
 * words together. Devam moves on at once.
 */
function reveal(step, sheet) {
  // Room for the whole sheet is made in the tap's frame, before the reveal measures anything, so the
  // stage is laid out once per reveal and never shrinks while the result is read.
  reserveDock(measureSheet(() => buildSheet(sheet)));
  revealTapAt = clock.now;
  useTempo('reveal');
  withChannel('reveal', () => clock.after(chromeDelay(CHOREO.revealDelay), () => playBeat(step.reveal, 'reveal')));
  clock.after(CHOREO.sheetDelay, () => showSheet(sheet));
}

/**
 * UC-6: a sheet that reaches into the narration covers whole body lines, never half of one. Returns what to
 * run once the sheet is in place: the line the sheet edge would cut (and any below it) is clipped away,
 * which only takes the part above the edge, since the sheet already covers the rest.
 */
function narrationClip(edge) {
  const body = els.body;
  body.style.removeProperty('clip-path');
  if (body.hidden) return () => {};
  const range = document.createRange();
  range.selectNodeContents(body);
  const cut = [...range.getClientRects()].find((r) => r.width > 1 && r.top < edge - 1 && r.bottom > edge + 1);
  if (!cut) return () => {};
  const inset = body.getBoundingClientRect().bottom - cut.top;
  return () => {
    body.style.clipPath = `inset(0 0 ${inset}px 0)`;
  };
}

function removeSheet(release = true) {
  els.body.style.removeProperty('clip-path');
  els.lessonView.querySelectorAll('.st-sheet').forEach((sheet) => sheet.remove());
  els.dock.classList.remove('has-sheet');
  if (release) {
    els.dock.style.removeProperty('min-height');
    els.lessonView.classList.remove('is-tight');
  }
}

/**
 * The sheet never covers the question: when it is taller than the dock, the dock grows to its height
 * at once (the tap's frame) and the stage gives up that room. Scene objects, work line and narration
 * glide to their new places (FLIP), so nothing jumps.
 */
function reserveDock(height) {
  const base = els.dock.offsetHeight;
  if (height <= base + 0.5) return;
  const objects = [...els.scene.querySelectorAll('[data-obj]')];
  const targets = [...objects, els.work, els.narr];
  const before = targets.map((el) => el.getBoundingClientRect());
  // Grow as far as the layout allows: the narration stays below the top bar and the scene inside the
  // stage (small phones, landscape). Past that the sheet may cover the body, never the title.
  // Boxes are measured where they rest, not where a running entrance or glide shows them.
  const fits = () => {
    const stage = els.stage.getBoundingClientRect();
    const inside = [...objects, els.work].every((el) => {
      const rect = restingRect(el);
      return !rect.height || (rect.top >= stage.top - 0.5 && rect.bottom <= stage.bottom + 0.5);
    });
    return inside && restingRect(els.narr).top >= els.top.getBoundingClientRect().bottom - 0.5 &&
      els.dock.getBoundingClientRect().bottom <= els.lessonView.getBoundingClientRect().bottom + 0.5;
  };
  const search = () => {
    let low = 0;
    let high = height - base;
    els.dock.style.minHeight = `${Math.ceil(height)}px`;
    if (fits()) return true;
    for (let pass = 0; pass < 6; pass++) {
      const mid = (low + high) / 2;
      els.dock.style.minHeight = `${Math.ceil(base + mid)}px`;
      if (fits()) low = mid;
      else high = mid;
    }
    els.dock.style.minHeight = low > 0.5 ? `${Math.floor(base + low)}px` : '';
    return false;
  };
  // Still short of room: cells may go below their usual minimum (small phones only).
  if (!search()) {
    els.lessonView.classList.add('is-tight');
    search();
  }
  fitWorkCap();
  const stage = els.stage.getBoundingClientRect();
  targets.forEach((el, index) => {
    const now = el.getBoundingClientRect();
    const state = motion.stateOf(el);
    let scale = objects.includes(el) && now.width ? before[index].width / now.width : 1;
    const dx = before[index].left - now.left;
    let dy = before[index].top - now.top;
    // A scene object glides from where it stood, but never from outside the stage that just shrank.
    if (objects.includes(el)) ({dy, scale} = startInside(now, dy, scale, stage));
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scale - 1) < 0.005) return;
    motion.set(el, {x: state.x + dx, y: state.y + dy, scale: state.scale * scale});
    motion.to(el, {x: 0, y: 0, scale: 1}, 'move');
  });
}

/** An element's layout box without its spring offset (translation, and scale about its origin). */
function restingRect(el) {
  const rect = el.getBoundingClientRect();
  const state = motion.stateOf(el);
  const sx = state.scale * state.scaleX;
  const sy = state.scale * state.scaleY;
  if (!state.x && !state.y && sx === 1 && sy === 1) return rect;
  const [ox = 0, oy = 0] = getComputedStyle(el).transformOrigin.split(' ').map(parseFloat);
  const width = rect.width / (sx || 1);
  const height = rect.height / (sy || 1);
  const left = rect.left - state.x - ox * (1 - sx);
  const top = rect.top - state.y - oy * (1 - sy);
  return {left, top, width, height, right: left + width, bottom: top + height};
}

/** The sheet's height before it is shown (laid out once, invisible). */
function measureSheet(build) {
  const sheet = build();
  sheet.style.visibility = 'hidden';
  els.lessonView.appendChild(sheet);
  const height = sheet.offsetHeight;
  sheet.remove();
  return height;
}

function recordAnswer(result) {
  const log = storageGet(STORE.answers, []);
  log.push({lesson: currentLesson, step: lesson.index, result, at: Date.now()});
  storageSet(STORE.answers, log.slice(-500));
  // The lesson-end score counts the first answer of this run for every question.
  const runs = storageGet(STORE.run, {});
  const run = runs[currentLesson] || {};
  if (!(lesson.index in run)) run[lesson.index] = result;
  runs[currentLesson] = run;
  storageSet(STORE.run, runs);
}

function startRun(code) {
  const runs = storageGet(STORE.run, {});
  runs[code] = {};
  storageSet(STORE.run, runs);
  const picks = storageGet(STORE.picks, {});
  delete picks[code];
  storageSet(STORE.picks, picks);
  lesson.streak = 0;
}

function setKeyGlyph(button, name, animate = true) {
  const key = button?.querySelector('.st-option__key');
  if (!key) return;
  key.innerHTML = glyphSvg(name);
  if (animate) drawGlyphs(key);
}

function centerIn(layer, el) {
  const outer = layer.getBoundingClientRect();
  const inner = el.getBoundingClientRect();
  return {x: inner.left - outer.left + inner.width / 2, y: inner.top - outer.top + inner.height / 2};
}

/** Right: the answer swells once (one bounce), a check draws itself, a few sparks fly. */
function celebrateAnswer(el, anchor) {
  motion.to(el, {scale: 1}, 'land', {velocity: {scale: 0.9}});
  feelSlot('answerFx', () => burst(els.overlay, centerIn(els.overlay, anchor || el),
    {count: 10, speed: 0.5, life: 650, seed: hashText(`${currentLesson}:${lesson.index}`)}))();
  haptic(12);
}

/** Wrong: the answer shakes its head (a pushed, lightly damped spring). */
function rejectAnswer(el) {
  motion.to(el, {x: 0}, 'shake', {velocity: {x: 320}});
  haptic([24, 40, 24]);
}

/** An answer during the entry beat: land the beat on its end state so the reveal starts from it. */
function settleBeat() {
  if (motion.isActive('beat') || clock.busy('beat') || runnerBusy('beat')) finishChannel('beat');
}

function answerChoice(index) {
  const step = STEPS[lesson.index];
  if (lesson.answered !== null) return;
  settleBeat();
  lesson.answered = index;
  const option = step.options[index];
  const correct = Boolean(option.correct);
  markChoice(step, index, true);
  lesson.streak = correct ? lesson.streak + 1 : 0;
  const firstTry = !(lesson.index in (storageGet(STORE.run, {})[currentLesson] || {}));
  recordAnswer(correct ? 'correct' : option.tag);
  feelEmit('answer', {lesson: currentLesson, index: lesson.index, correct, firstTry, streak: lesson.streak});
  savePick({value: index, correct, verdict: verdictFor(correct)});
  swapUnclear();
  reveal(step, {...sheetFor(step, index, false), streak: lesson.streak});
}

function pressKey(key) {
  if (lesson.answered !== null) return;
  const before = lesson.keypadValue;
  if (key === '⌫') {
    lesson.keypadValue = lesson.keypadValue.slice(0, -1);
  } else if (key === '−') {
    lesson.keypadValue = lesson.keypadValue.startsWith('−') ? lesson.keypadValue.slice(1) : `−${lesson.keypadValue}`;
  } else if (lesson.keypadValue.replace('−', '').length < 4) {
    lesson.keypadValue += key;
  }
  byId('keypad-display').classList.toggle('is-empty', !lesson.keypadValue);
  const value = byId('keypad-value');
  value.textContent = lesson.keypadValue || 'Cevap';
  if (lesson.keypadValue.length > before.length) {
    motion.set(value, {y: -SHIFT.count});
    motion.to(value, {y: 0}, 'ui');
  }
}

function checkKeypad() {
  const step = STEPS[lesson.index];
  if (lesson.answered !== null || !lesson.keypadValue || lesson.keypadValue === '−') return;
  const value = Number(lesson.keypadValue.replace('−', '-'));
  const correct = value === step.answer;
  settleBeat();
  lesson.answered = value;
  const display = markKeypad(correct, value);
  if (correct) celebrateAnswer(display);
  else rejectAnswer(display);
  lesson.streak = correct ? lesson.streak + 1 : 0;
  const firstTry = !(lesson.index in (storageGet(STORE.run, {})[currentLesson] || {}));
  recordAnswer(correct ? 'correct' : 'wrong-value');
  feelEmit('answer', {lesson: currentLesson, index: lesson.index, correct, firstTry, streak: lesson.streak});
  savePick({value, correct, verdict: verdictFor(correct)});
  swapUnclear();
  reveal(step, {...sheetFor(step, value, false), streak: lesson.streak});
}

/**
 * "Bilmiyorum" (UC-1): the same path as an answer (the beat lands, the pick is saved, the reveal plays), with
 * result 'unknown': completed, not first-try right, the streak resets silently, and the step is flagged
 * "Anlamadım" (stored; it comes back once F30 and Pekiştir exist, Stage 3). No verdict, cue or reaction.
 */
function answerUnknown() {
  const step = STEPS[lesson.index];
  if (lesson.answered !== null || (step.kind !== 'choice' && step.kind !== 'keypad')) return;
  settleBeat();
  lesson.answered = 'unknown';
  markShown(step);
  lesson.streak = 0;
  recordAnswer('unknown');
  savePick({value: 'unknown', unknown: true});
  const marks = storageGet(STORE.unclear, {});
  marks[`${currentLesson}:${lesson.index}`] = true;
  storageSet(STORE.unclear, marks);
  swapUnclear();
  reveal(step, sheetFor(step, 'unknown', false));
}

/* ---------- Lesson end ---------- */

let justCompleted = null;

function nextLessonAfter(code) {
  const index = LESSON_ORDER.indexOf(code);
  return LESSON_ORDER[index + 1] || LESSON_ORDER[0];
}

function followingLesson(code) {
  return LESSON_ORDER[LESSON_ORDER.indexOf(code) + 1] || null;
}

function lessonScore() {
  const run = storageGet(STORE.run, {})[currentLesson] || {};
  const results = [];
  STEPS.forEach((step, index) => {
    if (step.kind !== 'choice' && step.kind !== 'keypad') return;
    // 'unknown' ("Bilmiyorum") is neither right nor a miss: a soft cell with no glyph (UC-1).
    results.push(index in run ? (run[index] === 'unknown' ? 'unknown' : run[index] === 'correct') : null);
  });
  return {results, correct: results.filter((result) => result === true).length, total: results.length};
}

function scoreTitle({correct, total}) {
  if (!total) return 'Ders bitti';
  if (correct === total) return 'Kusursuz, hepsi doğru';
  return correct / total >= 0.7 ? 'Ders tamam!' : 'Bitti; bir tur daha iyi gelir';
}

/** The answers as a matrix: one cell per question, filled in one by one, then the score counts up. */
function renderEndScene(score) {
  // The summary step's mascot carries over and glides to its place; it is never doubled.
  const kept = els.scene.querySelector('[data-obj="mascot"]');
  const mascotWrap = kept || document.createElement('div');
  if (!kept) {
    mascotWrap.className = 'st-obj';
    mascotWrap.dataset.obj = 'mascot';
    mascotWrap.innerHTML = mascotSvg('happy', 'st-mascot--done');
  }
  const nodes = [mascotWrap];
  const n = score.total;
  const rows = n <= 5 ? 1 : n <= 12 ? 2 : 3;
  const cols = Math.ceil(n / rows);
  if (n) {
    const mat = document.createElement('div');
    mat.className = 'st-obj st-mat';
    mat.dataset.obj = 'end:results';
    const cells = score.results.map((result, index) => `<span class="st-cell is-skipped" data-k="${index}">` +
      `${result === null ? '–' : ''}</span>`).join('') + '<span class="st-cell"></span>'.repeat(rows * cols - n);
    mat.innerHTML = '<span class="st-mat__name">Cevapların</span>' +
      `<div class="st-mat__grid" style="--cols:${cols}" role="img" aria-label="${n} sorudan ${score.correct} doğru">${cells}</div>`;
    nodes.push(mat);
  }
  sizeScene([[rows, cols + 3]]);  // the mascot takes about three cells of width
  swapScene(nodes, cols <= 3 ? 'solo' : null, {load: () => {
    mascotWrap.querySelector('.st-mascot').setAttribute('class', 'st-mascot st-mascot--done');
  }});
  const start = CHOREO.stagger * 6;
  score.results.forEach((result, index) => {
    clock.after(start + index * CHOREO.cellStagger, () => {
      const cell = els.scene.querySelector(`[data-k="${index}"]`);
      if (!cell || result === null) return;
      cell.classList.remove('is-skipped');
      if (result === 'unknown') cell.classList.add('is-unknown-answer');
      else {
        cell.classList.add(result ? 'is-result' : 'is-wrong');
        cell.innerHTML = glyphSvg(result ? 'check' : 'cross');
        drawGlyphs(cell);
      }
      motion.set(cell, {scale: 0.55});
      motion.to(cell, {scale: 1}, 'land');
    });
  });
  const countAt = start + n * CHOREO.cellStagger + CHOREO.stagger * 3;
  clock.after(countAt, () => {
    setWork([{html: n ? `<span data-count>0</span> / ${n} doğru` : 'Ders tamam', kind: 'sum', ref: 'score'}]);
    const counter = els.work.querySelector('[data-count]');
    const token = workToken('score');
    motion.set(token, {opacity: 0, y: SHIFT.scene});
    motion.to(token, {opacity: 1, y: 0}, 'move');
    const cheer = () => {
      const ratio = n ? score.correct / n : 1;
      cheerMascot(mascotWrap.querySelector('.st-mascot'), 0.8 + ratio * 0.6);
      if (ratio > 0) {
        const anchor = els.scene.querySelector('[data-obj="end:results"]') || mascotWrap;
        burst(els.fx, centerIn(els.fx, anchor), {
          count: ratio === 1 ? 30 : 18, speed: 0.85, life: 1300, glyphs: ['1', '0'], seed: hashText(currentLesson),
        });
      }
    };
    if (!counter) {
      cheer();
      return;
    }
    motion.bind(counter, (state, el) => {
      el.textContent = String(Math.round(state.count));
    }, {count: 0});
    motion.to(counter, {count: score.correct}, 'draw', {onArrive: cheer});
  });
}

function renderEndDock(following) {
  const dock = els.dock;
  dock.dataset.kind = 'done';
  dock.removeAttribute('data-group');
  dock.className = 'st-dock st-dock--nav';
  dock.innerHTML = following ?
    '<button type="button" class="st-btn" data-action="map" data-secondary>Harita</button>' +
    `<button type="button" class="st-btn st-btn--primary" data-action="next-lesson" data-primary>Sıradaki: ${following}</button>` :
    '<button type="button" class="st-btn" data-action="restart" data-secondary>Baştan</button>' +
    '<button type="button" class="st-btn st-btn--primary" data-action="map" data-primary>Haritaya dön</button>';
  enterDock(CHOREO.stagger * 4);
}

/** A real end moment: score of this run, what comes next, one celebration. */
function completeLesson() {
  stopMotion();
  const done = storageGet(STORE.done, {});
  done[currentLesson] = Date.now();
  storageSet(STORE.done, done);
  storageSet(STORE.progress, {lesson: nextLessonAfter(currentLesson), step: 0});
  justCompleted = currentLesson;
  removeSheet();
  lesson.complete = true;
  lesson.answered = null;
  const score = lessonScore();
  feelEmit('lesson:complete', {lesson: currentLesson, score});
  // The completion is saved; the end screen may wait for one more moment (the feel layer's secret question).
  feelSlot('beforeEnd', (resume) => resume())(() => showLessonEnd(score));
}

function showLessonEnd(score) {
  const following = followingLesson(currentLesson);
  syncTransport();
  els.stage.style.removeProperty('--work-lines');
  els.stage.style.removeProperty('--work-fold');
  els.work.classList.remove('is-fold-silent');
  els.stage.classList.remove('is-fold-side');
  setWork([]);
  renderProgress(1);
  rippleProgress(CHOREO.stagger * 2);
  const next = following ? ` Sıradaki: <b>${following} · ${lessonName(following)}</b>.` : ' Yeni dersler hazır oldukça haritada açılır.';
  const narration = {
    eyebrow: `${currentLesson} · Ders tamam`,
    title: scoreTitle(score),
    // The count lives in the scene, where it counts up; the words do not give it away first.
    body: (score.total ? 'Her kare bir soru: ilk denemendeki cevabın.' : '') + next,
    hideUnclear: true,
  };
  renderNarration(feelSlot('endNarration', (_, base) => base)(score, narration), 1);
  renderEndDock(following);
  feelSlot('endScene', renderEndScene)(score);
  syncBack();
  haptic([10, 60, 18]);
}

/* ---------- Navigation ---------- */

function stopMotion() {
  finishAll();
  clock.cancelAll();
  dropRunners();
  els.fx.replaceChildren();
}

function goStep(index, direction = 1, options = {}) {
  feelEmit('step:leave', {lesson: currentLesson, index: lesson.index});
  stopMotion();
  const fromIndex = lesson.index;
  lesson.index = Math.max(0, Math.min(STEPS.length - 1, index));
  lesson.keypadValue = '';
  lesson.complete = false;
  // Midpoint line: once per lesson, only when walking forward onto the midpoint of a lesson not yet completed.
  halfNote = direction > 0 && fromIndex === lesson.index - 1 && lesson.index === midpointOf() &&
    !halfShown.has(currentLesson) && !storageGet(STORE.done, {})[currentLesson];
  if (halfNote) halfShown.add(currentLesson);
  const step = STEPS[lesson.index];
  const isQuestion = step.kind === 'choice' || step.kind === 'keypad';
  // A question answered earlier in this run comes back read-only: marked, explained, Devam ready.
  const past = isQuestion ? pickAt(lesson.index) : null;
  lesson.answered = past ? past.value : null;
  const delay = options.delay || 0;
  removeSheet();
  renderProgress(direction, delay);
  renderNarration(step, direction, delay);
  renderDock(step, delay);
  syncBack();
  // Height for the work lines the step will show, reserved before the scene is fitted.
  workPlanEm = 0;
  planWork(step);
  // The old work leaves with the old scene: both fade where they stand in the same layout and frame.
  setWork([]);
  renderScene(step, direction, {delay});
  syncTransport();
  if (past) {
    // Land the entry beat at once, then replay the reveal over the restored answer.
    playBeat(step.beat);
    finishChannel('beat');
    useTempo('reveal');
    withChannel('reveal', () => clock.after(chromeDelay(CHOREO.beatDelay + delay), () => playBeat(step.reveal, 'reveal')));
    // Old picks may carry an old verdict text; the verdict and the words are recomputed from the pick.
    clock.after(delay, () => showSheet({...sheetFor(step, past.value, true), quiet: true}));
  } else if (step.beat) {
    useTempo('beat');
    withChannel('beat', () => clock.after(chromeDelay(CHOREO.beatDelay + delay), () => playBeat(step.beat)));
    softNext(step);
  }
  storageSet(STORE.progress, {lesson: currentLesson, step: lesson.index});
  feelEmit('step:enter', {lesson: currentLesson, index: lesson.index, step});
}

function replay() {
  const step = STEPS[lesson.index];
  stopMotion();
  loadMatrices(step);
  setWork([]);
  playBeat(step.beat);
  if (lesson.answered === null || !step.reveal) return;
  // After an answer the replay shows the whole story: the entry beat lands, the reveal plays.
  finishChannel('beat');
  playBeat(step.reveal, 'reveal');
}

function next() {
  if (lesson.answered !== null) {
    // Devam after an answer: the reveal lands on its end state and the lesson moves on in one tap.
    finishAll();
    clock.cancelAll();
  } else if (clock.busy('beat') || runnerBusy('beat')) {
    // İleri while an explanation still has cues to play: the first tap shows its end state.
    finishAll();
    clock.cancelAll();
    return;
  } else if (motion.isActive('beat')) {
    // Only settling motion left: land it and move on in the same tap.
    finishAll();
  }
  if (lesson.complete) return;
  if (lesson.index === STEPS.length - 1) {
    completeLesson();
    return;
  }
  goStep(lesson.index + 1, 1);
}

function back() {
  if (lesson.complete) goStep(STEPS.length - 1, -1);
  else if (lesson.index > 0) goStep(lesson.index - 1, -1);
}

/** Lesson data without clearing the stage, so the old scene can fade out while the new one rises. */
function loadLessonData(code) {
  const data = LESSONS[code];
  lesson.answered = null;
  currentLesson = code;
  MATRICES = data.matrices || {};
  STEPS = data.steps;
  LABELS = data.labels || {};
}

function startNextLesson() {
  const following = followingLesson(currentLesson);
  if (!following) return;
  loadLessonData(following);
  startRun(following);
  goStep(0, 1);
}

function restartLesson() {
  startRun(currentLesson);
  goStep(0, -1);
}

/* ---------- View transitions (shared-element morph on the engine's springs) ---------- */

const DEPTH_SCALE = 0.97;

function radiusOf(el) {
  return parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
}

/**
 * A surface that sits at `rest` and starts transformed onto `start` (FLIP). Its corner radius is
 * counter-scaled every frame so corners stay round while width and height scale differently.
 */
function createMorph(rest, restRadius, start, startRadius, tint) {
  const el = document.createElement('div');
  el.className = 'st-morph';
  el.style.left = `${rest.left}px`;
  el.style.top = `${rest.top}px`;
  el.style.width = `${rest.width}px`;
  el.style.height = `${rest.height}px`;
  let tintEl = null;
  if (tint) {
    tintEl = document.createElement('div');
    tintEl.className = 'st-morph__tint';
    el.appendChild(tintEl);
    motion.set(tintEl, {opacity: tint === 'out' ? 1 : 0});
  }
  // The surface dissolves in over its source, so the source's content never pops away.
  motion.set(el, {opacity: 0});
  motion.to(el, {opacity: 1}, 'fade');
  els.overlay.appendChild(el);
  const sx0 = start.width / rest.width;
  motion.bind(el, (state, node) => {
    const p = Math.abs(sx0 - 1) < 1e-3 ? 1 : Math.max(0, Math.min(1, 1 - (state.scaleX - 1) / (sx0 - 1)));
    const radius = startRadius + (restRadius - startRadius) * p;
    node.style.borderRadius = `${radius / Math.max(0.01, state.scaleX)}px / ${radius / Math.max(0.01, state.scaleY)}px`;
  }, {x: start.left - rest.left, y: start.top - rest.top, scaleX: sx0, scaleY: start.height / rest.height});
  return {el, tint: tintEl};
}

function settleMap(hidden) {
  els.mapView.hidden = hidden;
  els.mapView.inert = false;
  motion.set(els.mapView, {opacity: 1, scale: 1});
}

function settleLesson(hidden) {
  els.lessonView.hidden = hidden;
  els.lessonView.inert = false;
  motion.set(els.lessonView, {opacity: 1});
}

/** Map → lesson: the tapped tile (or button) grows into the stage; the map sinks back and fades. */
function playOpen(origin, animated) {
  if (!animated) {
    motion.set(els.lessonView, {opacity: 0});
    motion.to(els.lessonView, {opacity: 1}, 'fade');
    motion.to(els.mapView, {opacity: 0}, 'fade', {onArrive: () => settleMap(true)});
    return;
  }
  const from = origin.getBoundingClientRect();
  const to = els.stage.getBoundingClientRect();
  const morph = createMorph(to, radiusOf(els.stage), from, radiusOf(origin), origin.matches('.st-btn--primary') ? 'out' : null);
  motion.set(els.stage, {opacity: 0});
  motion.to(origin, {opacity: 0}, 'fade');
  motion.set(els.top, {opacity: 0});
  clock.after(CHOREO.stagger * 3, () => motion.to(els.top, {opacity: 1}, 'move'));
  // Narration and dock wait for the map to clear, so the two views never print over each other.
  [els.narr, els.dock].forEach((el) => {
    motion.set(el, {opacity: 0});
    clock.after(CHOREO.openDelay + CHOREO.stagger * 2, () => motion.to(el, {opacity: 1}, 'fade'));
  });
  motion.to(els.mapView, {opacity: 0, scale: DEPTH_SCALE}, 'page', {onArrive: () => {
    settleMap(true);
    motion.set(origin, {opacity: 1});
  }});
  if (morph.tint) motion.to(morph.tint, {opacity: 0}, 'page');
  motion.to(morph.el, {x: 0, y: 0, scaleX: 1, scaleY: 1}, 'page', {epsilon: 3, onArrive: () => {
    motion.set(els.stage, {opacity: 1});
    motion.to(morph.el, {opacity: 0}, 'fade', {onArrive: () => morph.el.remove()});
  }});
}

function tileFor(code) {
  return els.tiles.querySelector(`[data-lesson="${code}"]`);
}

/**
 * Pointer down on a lesson tile (or the continue button) lays the lesson view out invisibly, so the
 * first frame of the open morph does not stall on layout. A press that does not open reverts it.
 */
function prepareLesson(code) {
  if (!els.lessonView.hidden || !READY_LESSONS.has(code)) return;
  if (code !== currentLesson || !STEPS.length) useLesson(code);
  els.lessonView.classList.add('is-prepping');
  els.lessonView.inert = true;
  els.lessonView.hidden = false;
  if (els.progress.dataset.lesson !== currentLesson) buildProgress();
  clock.after(CHOREO.prepHold, unprepareLesson);
}

function unprepareLesson() {
  if (!els.lessonView.classList.contains('is-prepping')) return;
  els.lessonView.classList.remove('is-prepping');
  els.lessonView.hidden = true;
}

function lessonIsOpen() {
  return !els.lessonView.hidden && !els.lessonView.classList.contains('is-prepping');
}

function openLesson(stepIndex = 0, code = currentLesson, source = null) {
  const fromMap = !lessonIsOpen();
  // A prepared view stays laid out; it only becomes visible.
  els.lessonView.classList.remove('is-prepping');
  if (code !== currentLesson || !STEPS.length) useLesson(code);
  if (!fromMap) {
    goStep(stepIndex, 1);
    return;
  }
  stopMotion();
  if (stepIndex === 0) startRun(code);
  const origin = source || tileFor(code) || els.mapContinue;
  const animated = !reducedMotion.matches && !els.mapView.hidden && Boolean(origin?.isConnected);
  els.lessonView.hidden = false;
  els.lessonView.inert = false;
  els.mapView.inert = true;
  goStep(stepIndex, 1, {delay: animated ? CHOREO.openDelay : 0});
  playOpen(origin, animated);
  feelEmit('view', 'lesson');
}

/** Lesson → map: the stage shrinks back into its tile; a finished lesson stamps its check there. */
function openMap() {
  unprepareLesson();
  const fromLesson = !els.lessonView.hidden;
  stopMotion();
  const completed = justCompleted;
  justCompleted = null;
  if (shellBridge.embedded) {
    // New shell: the lesson fades out and the shell takes over. The v21 map stays hidden by CSS but
    // is marked visible, so the next open plays its shared-element morph from the shell's card.
    els.mapView.hidden = false;
    feelEmit('view', 'map');
    if (!fromLesson) return;
    els.lessonView.inert = true;
    motion.to(els.lessonView, {opacity: 0}, reducedMotion.matches ? 'fade' : 'leave', {onArrive: () => {
      settleLesson(true);
      shellBridge.exit(completed);
    }});
    return;
  }
  els.mapView.hidden = false;
  if (fromLesson && completed) activeUnit = unitOf(completed);
  renderMap({pendingStamp: completed});
  feelEmit('view', 'map');
  if (!fromLesson) return;
  els.lessonView.inert = true;
  const target = tileFor(currentLesson) || els.mapContinue;
  if (reducedMotion.matches) {
    motion.set(els.mapView, {opacity: 0});
    motion.to(els.mapView, {opacity: 1}, 'fade');
    motion.to(els.lessonView, {opacity: 0}, 'fade', {onArrive: () => settleLesson(true)});
    stampBadge(completed);
    return;
  }
  const to = target.getBoundingClientRect();
  const from = els.stage.getBoundingClientRect();
  const morph = createMorph(to, radiusOf(target), from, radiusOf(els.stage), target.matches('.st-btn--primary') ? 'in' : null);
  motion.set(target, {opacity: 0});
  motion.to(els.lessonView, {opacity: 0}, 'leave', {onArrive: () => settleLesson(true)});
  motion.set(els.mapView, {opacity: 0, scale: DEPTH_SCALE});
  motion.to(els.mapView, {scale: 1}, 'page');
  // The lesson clears out first; the map comes up behind the shrinking surface.
  clock.after(CHOREO.mapFadeDelay, () => motion.to(els.mapView, {opacity: 1}, 'page'));
  if (morph.tint) motion.to(morph.tint, {opacity: 1}, 'page');
  motion.to(morph.el, {x: 0, y: 0, scaleX: 1, scaleY: 1}, 'page', {epsilon: 2, onArrive: () => {
    motion.set(target, {opacity: 1, scale: PRESS_SCALE});
    motion.to(target, {scale: 1}, 'land');
    motion.to(morph.el, {opacity: 0}, 'fade', {onArrive: () => morph.el.remove()});
    stampBadge(completed);
  }});
}

/** The ready dot of a just-finished lesson grows into a check badge, drawn like a pen stroke. */
function stampBadge(code) {
  const tile = code && tileFor(code);
  if (!tile) return;
  tile.classList.add('is-done');
  tile.setAttribute('aria-label', `${code} ${lessonName(code)}, tamamlandı`);
  const badge = tile.querySelector('.st-tile__badge');
  motion.set(badge, {scale: 0.5});
  motion.to(badge, {scale: 1}, 'land');
  drawGlyphs(badge, CHOREO.stagger * 2);
  feelSlot('stampFx', () => burst(els.overlay, centerIn(els.overlay, badge),
    {count: 8, speed: 0.42, life: 560, kinds: ['ok', 'accent'], seed: hashText(code)}))(badge, code);
}

/* ---------- Map ---------- */

function savedProgress() {
  const saved = storageGet(STORE.progress, null);
  // First visit starts with the heaviest exam topic (determinants), not course order.
  const first = READY_LESSONS.has('B1') ? 'B1' : LESSON_ORDER[0];
  // H11: a done lesson that is not mid-way is never "next"; point at the first ready lesson still undone, in course order.
  // When every ready lesson is done the old pick stays (a revisit).
  const done = storageGet(STORE.done, {});
  const undone = LESSON_ORDER.find((code) => !done[code]);
  const pick = (lesson) => ({lesson: done[lesson] && undone ? undone : lesson, step: 0});
  if (!saved || !READY_LESSONS.has(saved.lesson)) return pick(first);
  // A saved step that no longer exists (the lesson got shorter) restarts the lesson at its first step.
  const inside = Number.isInteger(saved.step) && saved.step > 0 && saved.step < LESSONS[saved.lesson].steps.length;
  return inside ? saved : pick(saved.lesson);
}

let activeUnit = unitOf(savedProgress().lesson);

function unitIndex(id) {
  return UNITS.findIndex((unit) => unit.id === id);
}

function buildTabs() {
  els.tabs.innerHTML = '<span class="st-tabs__pill" aria-hidden="true"></span>' + UNITS.map((unit) =>
    `<button type="button" class="st-tab" role="tab" id="tab-${unit.id}" data-unit="${unit.id}">${unit.label}</button>`).join('');
  els.pill = els.tabs.querySelector('.st-tabs__pill');
}

function syncTabs() {
  els.tabs.querySelectorAll('.st-tab').forEach((tab) => {
    const selected = tab.dataset.unit === activeUnit;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
}

function tabStep() {
  const tabs = els.tabs.querySelectorAll('.st-tab');
  return tabs.length > 1 ? tabs[1].offsetLeft - tabs[0].offsetLeft : 0;
}

/** The selected-tab pill slides between tabs on the 'ui' spring and can carry a swipe's speed. */
function placePill(animated, velocity = 0) {
  const tab = els.tabs.querySelector(`[data-unit="${activeUnit}"]`);
  if (!tab || !els.pill) return;
  els.pill.style.width = `${tab.offsetWidth}px`;
  const x = tab.offsetLeft;
  if (animated) motion.to(els.pill, {x}, 'ui', {velocity: {x: velocity}});
  else motion.set(els.pill, {x});
}

/** The map's meta line: the exam's date (a date, not a countdown). The unit tabs already name the units. */
function unitMetaText() {
  return 'Vize 1 · 20 Kasım';
}

function renderTiles(pendingStamp) {
  const unit = UNITS.find((item) => item.id === activeUnit);
  const done = storageGet(STORE.done, {});
  const saved = savedProgress();
  noticeSerial++;
  els.unitMeta.textContent = unitMetaText();
  els.tiles.setAttribute('aria-labelledby', `tab-${unit.id}`);
  els.tiles.innerHTML = unit.lessons.map(([code, name]) => {
    if (!READY_LESSONS.has(code)) {
      return `<div class="st-tile is-locked" data-locked="${code}" aria-label="${code} ${name}, yakında">` +
        `<span class="st-tile__lock" aria-hidden="true">${glyphSvg('lock')}</span>` +
        `<span class="st-tile__code">${code}</span><span class="st-tile__name">${name}</span></div>`;
    }
    const isDone = Boolean(done[code]) && code !== pendingStamp;
    // The lesson in progress shows where it stopped.
    const inProgress = saved.lesson === code && saved.step > 0;
    const where = inProgress ? `<span class="st-tile__step">${saved.step + 1}/${LESSONS[code].steps.length}</span>` : '';
    return `<button type="button" class="st-tile is-ready${isDone ? ' is-done' : ''}${inProgress ? ' is-current' : ''}"` +
      ` data-lesson="${code}" aria-label="${code} ${name}${isDone ? ', tamamlandı' : ''}` +
      `${inProgress ? `, ${saved.step + 1}. adımda` : ''}">` +
      `<span class="st-tile__badge" aria-hidden="true">${glyphSvg('check')}</span>` +
      `<span class="st-tile__code">${code}${where}</span><span class="st-tile__name">${name}</span></button>`;
  }).join('');
}

/** A short line in place of the unit summary (e.g. a locked lesson was tapped), then back. */
let noticeSerial = 0;

function swapMeta(text) {
  els.unitMeta.textContent = text;
  motion.set(els.unitMeta, {opacity: 0, y: SHIFT.count});
  motion.to(els.unitMeta, {opacity: 1, y: 0}, 'move');
}

function showNotice(text) {
  const serial = ++noticeSerial;
  swapMeta(text);
  clock.after(CHOREO.noticeHold, () => {
    if (serial === noticeSerial) swapMeta(unitMetaText());
  });
}

function renderMap(options = {}) {
  // The exam line keeps its date from the markup ("Vize 1 · 20 Kas"): no day counts anywhere (Eren's rule).
  syncTabs();
  renderTiles(options.pendingStamp);
  // Information, not an alarm: the unit meta's own line, once per visit (UC-4).
  if (storageBlocked && !storageNoticeShown) {
    storageNoticeShown = true;
    els.unitMeta.textContent = 'Bu görünümde ilerleme kaydedilmiyor.';
  }
  const saved = savedProgress();
  // Everything done: the primary becomes a calm revisit ("Tekrar"), never "Başla" for a finished lesson.
  const revisit = Boolean(storageGet(STORE.done, {})[saved.lesson]);
  els.mapContinue.textContent = saved.step > 0 ?
    `${saved.lesson} · ${saved.step + 1}. adımdan devam et` : `${revisit ? 'Tekrar' : 'Başla'}: ${saved.lesson} · ${lessonName(saved.lesson)}`;
  placePill(false);
}

/** Outgoing tiles keep their place in a ghost layer and slide out against the travel direction. */
function ghostTiles(direction, velocity) {
  const host = els.mapView.getBoundingClientRect();
  // Measure every tile before moving any: moving one reflows the grid under the rest.
  const tiles = [...els.tiles.children].map((tile) => ({tile, rect: tile.getBoundingClientRect()}));
  tiles.forEach(({tile, rect}) => {
    tile.style.position = 'absolute';
    tile.style.left = `${rect.left - host.left}px`;
    tile.style.top = `${rect.top - host.top}px`;
    tile.style.width = `${rect.width}px`;
    tile.style.height = `${rect.height}px`;
    els.mapGhost.appendChild(tile);
    motion.set(tile, {x: 0, y: 0, scale: 1, opacity: 1});
    motion.to(tile, {x: -direction * SHIFT.tiles, opacity: 0}, 'move', {velocity: {x: velocity}, onArrive: () => tile.remove()});
  });
  motion.set(els.tiles, {x: 0});
}

/** Incoming tiles arrive column by column from the side the new unit lives on. */
function enterTiles(direction) {
  const tiles = [...els.tiles.children];
  const cols = getComputedStyle(els.tiles).gridTemplateColumns.split(' ').length;
  tiles.forEach((tile, index) => {
    const col = index % cols;
    const order = direction > 0 ? col : cols - 1 - col;
    motion.set(tile, {x: direction * SHIFT.tiles, opacity: 0});
    clock.after(CHOREO.tilesHead + order * CHOREO.stagger + Math.floor(index / cols) * CHOREO.stagger / 2, () => motion.to(tile, {x: 0, opacity: 1}, 'move'));
  });
}

function switchUnit(unitId, options = {}) {
  const from = unitIndex(activeUnit);
  const to = unitIndex(unitId);
  if (to < 0) return;
  if (from === to) {
    motion.to(els.tiles, {x: 0}, 'move', {velocity: {x: options.velocity || 0}});
    placePill(true);
    return;
  }
  const direction = Math.sign(to - from);
  ghostTiles(direction, options.velocity || 0);
  activeUnit = unitId;
  syncTabs();
  renderTiles();
  placePill(true, options.pillVelocity || 0);
  enterTiles(direction);
  motion.set(els.unitMeta, {opacity: 0, x: SHIFT.count * direction});
  motion.to(els.unitMeta, {opacity: 1, x: 0}, 'move');
}

/** Tiles appear in a wave that spreads from `origin` (the lesson to continue), by distance. */
function waveIn(items, origin, base) {
  const o = origin ? origin.getBoundingClientRect() : null;
  items.forEach((el) => {
    const r = el.getBoundingClientRect();
    const distance = o ? Math.hypot(r.left + r.width / 2 - o.left - o.width / 2, r.top + r.height / 2 - o.top - o.height / 2) : 0;
    motion.set(el, {opacity: 0, y: SHIFT.enter, scale: PRESS_SCALE});
    clock.after(base + Math.min(CHOREO.waveMax, distance / CHOREO.waveSpeed), () => motion.to(el, {opacity: 1, y: 0, scale: 1}, 'move'));
  });
}

/** Page load: header, title and tabs settle in order, tiles ripple out from "your" lesson, then the action. */
function playLoad() {
  [els.mapTop, els.mapHead, els.tabs].forEach((el, index) => {
    motion.set(el, {opacity: 0, y: SHIFT.enter});
    clock.after(index * CHOREO.stagger * 2, () => motion.to(el, {opacity: 1, y: 0}, 'move'));
  });
  waveIn([...els.tiles.children], tileFor(savedProgress().lesson) || els.tiles.firstElementChild, CHOREO.stagger * 5);
  motion.set(els.mapDock, {opacity: 0, y: SHIFT.dock});
  clock.after(CHOREO.stagger * 8, () => motion.to(els.mapDock, {opacity: 1, y: 0}, 'move'));
  const brandMascot = els.brand.querySelector('.st-mascot');
  clock.after(CHOREO.stagger * 12, () => cheerMascot(brandMascot, 0.8));
  clock.after(CHOREO.stagger * 30, () => blinkMascot(mascotParts(brandMascot).eyes));
}

/* ---------- Gestures and presses ---------- */

const PRESSABLE = '.st-btn, .st-option, .st-key, .st-tab, .st-icon-btn, .st-unclear, .st-tile, .st-map-chip, .st-me-cell, .st-me-sound';
let pressed = null;

function pressDepth() {
  return 1 - PRESS_SCALE;
}

/**
 * A press released before it was drawn (a tap shorter than a frame: down and up in one task) would
 * leave no trace at all, e.g. on the unit tab already selected (feel probe: no change for ~1.3 s).
 * It is drawn now at its depth, so the next frame always shows the tap, then it springs back.
 */
function releasePress() {
  if (!pressed) return;
  if (1 - motion.stateOf(pressed).scale < pressDepth(pressed) / 2) motion.set(pressed, {scale: 1 - pressDepth(pressed)});
  motion.to(pressed, {scale: 1}, 'ui');
  pressed = null;
}

/** Keyboard activation has no pointer: give it the same press, compressed into one pulse. */
function pulse(el) {
  motion.set(el, {scale: PRESS_SCALE});
  motion.to(el, {scale: 1}, 'ui');
}

document.addEventListener('pointerdown', (event) => {
  const el = event.target.closest(PRESSABLE);
  if (!el || el.disabled) return;
  if (el.dataset.lesson) prepareLesson(el.dataset.lesson);
  else if (el === els.mapContinue) prepareLesson(savedProgress().lesson);
  releasePress();
  pressed = el;
  motion.to(el, {scale: 1 - pressDepth(el)}, 'press');
});
document.addEventListener('pointerup', releasePress);
document.addEventListener('pointercancel', releasePress);

/** Swipe the tiles sideways to change unit; rubber-bands at the ends; a flick carries its speed. */
const RUBBER = 0.55;
const drag = {id: null, x0: 0, y0: 0, active: false, moved: false, samples: [], pill: 0};

function rubber(over, size) {
  return Math.sign(over) * (1 - 1 / (Math.abs(over) * RUBBER / size + 1)) * size;
}

els.tiles.addEventListener('pointerdown', (event) => {
  if (event.button > 0) return;
  Object.assign(drag, {id: event.pointerId, x0: event.clientX, y0: event.clientY, active: false, moved: false,
    samples: [[event.timeStamp, event.clientX]], pill: motion.stateOf(els.pill).x});
});
els.tiles.addEventListener('pointermove', (event) => {
  if (event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x0;
  const dy = event.clientY - drag.y0;
  if (!drag.active) {
    if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    drag.active = true;
    drag.moved = true;
    releasePress();
    unprepareLesson();
    try {
      els.tiles.setPointerCapture(event.pointerId);
    } catch (error) {
      // Capture is a nicety; the drag still works without it.
    }
  }
  const index = unitIndex(activeUnit);
  const blocked = (dx > 0 && index === 0) || (dx < 0 && index === UNITS.length - 1);
  const width = els.tiles.clientWidth || 1;
  const shown = blocked ? rubber(dx, width) : dx;
  motion.set(els.tiles, {x: shown});
  if (!blocked) motion.set(els.pill, {x: drag.pill - (shown / width) * tabStep()});
  drag.samples.push([event.timeStamp, event.clientX]);
  if (drag.samples.length > 8) drag.samples.shift();
});
function endDrag(event) {
  if (event.pointerId !== drag.id) return;
  drag.id = null;
  if (!drag.active) return;
  drag.active = false;
  const recent = drag.samples.filter(([t]) => event.timeStamp - t < 100);
  const [t0, x0] = recent[0] || [event.timeStamp, event.clientX];
  const velocity = event.timeStamp > t0 ? (event.clientX - x0) / (event.timeStamp - t0) : 0;
  const offset = motion.stateOf(els.tiles).x;
  const projected = offset + velocity * 180;
  const index = unitIndex(activeUnit);
  const target = Math.abs(projected) > els.tiles.clientWidth * 0.3 ? index - Math.sign(projected) : index;
  const unit = UNITS[Math.max(0, Math.min(UNITS.length - 1, target))];
  switchUnit(unit.id, {velocity: velocity * 1000, pillVelocity: (-velocity * 1000 / (els.tiles.clientWidth || 1)) * tabStep()});
}
els.tiles.addEventListener('pointerup', endDrag);
els.tiles.addEventListener('pointercancel', endDrag);
// A drag is not a tap: swallow the click that ends it.
els.tiles.addEventListener('click', (event) => {
  if (!drag.moved) return;
  drag.moved = false;
  event.stopPropagation();
  event.preventDefault();
}, true);

/* ---------- Events ---------- */

els.tabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-unit]');
  if (!tab) return;
  if (!event.detail) pulse(tab);
  switchUnit(tab.dataset.unit);
});
els.tabs.addEventListener('keydown', (event) => {
  const step = {ArrowRight: 1, ArrowLeft: -1}[event.key];
  if (!step) return;
  const unit = UNITS[unitIndex(activeUnit) + step];
  if (!unit) return;
  switchUnit(unit.id);
  byId(`tab-${unit.id}`).focus();
});
els.tiles.addEventListener('click', (event) => {
  const tile = event.target.closest('.st-tile');
  if (!tile) return;
  if (!tile.dataset.lesson) {
    // Not written yet: the tile shakes its head and the line under the title says so.
    motion.to(tile, {x: 0}, 'shake', {velocity: {x: LOCKED_SHAKE}});
    showNotice(`${tile.dataset.locked} · Bu ders yakında`);
    haptic(8);
    return;
  }
  if (!event.detail) pulse(tile);
  const saved = savedProgress();
  openLesson(saved.lesson === tile.dataset.lesson ? saved.step : 0, tile.dataset.lesson, tile);
});
els.mapContinue.addEventListener('click', () => {
  const saved = savedProgress();
  openLesson(saved.step, saved.lesson, els.mapContinue);
});
els.close.addEventListener('click', openMap);
els.back.addEventListener('click', (event) => {
  if (!event.detail) pulse(els.back);
  back();
});
els.replay.addEventListener('click', pressTransport);
// A tap on the stage gets an answer too: while a beat plays it pauses or resumes it through the
// transport (whose icon pulses); when the beat is done the replay icon pulses, showing where to replay.
els.stage.addEventListener('click', (event) => {
  if (event.target.closest('#replay')) return;
  if (els.replay.hidden) {
    // Nothing to play here (step 1, a question not yet answered, the summary): the card itself answers
    // the tap, as a pressed button does (an opacity dip under reduced motion).
    if (reducedMotion.matches) motion.set(els.stage, {opacity: ENTER_FLOOR * 2});
    else motion.set(els.stage, {scale: PRESS_SCALE});
    motion.to(els.stage, {scale: 1, opacity: 1}, 'ui');
    return;
  }
  // After a right answer the reveal is a worked example he may skip: a tap lands its end state and
  // stays on the step (Devam still advances), so a long chain is never lost by skipping it.
  const step = STEPS[lesson.index];
  const revealing = clock.busy('reveal') || motion.isActive('reveal') || runnerBusy('reveal');
  if (revealing && lesson.answered !== null && answeredRight(step)) {
    finishChannel('reveal');
    syncTransport();
    const icon = els.replay.querySelector('svg');
    motion.set(icon, {scale: 0.8});
    motion.to(icon, {scale: 1}, 'land');
    return;
  }
  if (activeRunner()) {
    pressTransport();
    return;
  }
  const icon = els.replay.querySelector('svg');
  motion.set(icon, {scale: 1.25});
  motion.to(icon, {scale: 1}, 'land');
});
els.unclear.addEventListener('click', () => {
  if (els.unclear.dataset.mode === 'unknown') {
    answerUnknown();
    return;
  }
  const marks = storageGet(STORE.unclear, {});
  const key = `${currentLesson}:${lesson.index}`;
  marks[key] = !marks[key];
  storageSet(STORE.unclear, marks);
  els.unclear.setAttribute('aria-pressed', String(marks[key]));
});
els.lessonView.addEventListener('click', (event) => {
  const target = event.target.closest('.st-dock button, .st-sheet button');
  if (!target || target.disabled) return;
  if (!event.detail) pulse(target);
  const action = target.dataset.action;
  if (target.dataset.option !== undefined) answerChoice(Number(target.dataset.option));
  else if (target.dataset.key) pressKey(target.dataset.key);
  else if (action === 'check') checkKeypad();
  else if (action === 'next') next();
  else if (action === 'back') back();
  else if (action === 'map') openMap();
  else if (action === 'next-lesson') startNextLesson();
  else if (action === 'restart') restartLesson();
});
document.addEventListener('keydown', (event) => {
  if (!lessonIsOpen() || els.lessonView.inert) return;
  if (event.key === 'ArrowRight') next();
  if (event.key === 'ArrowLeft') back();
  if (event.key === 'Escape') openMap();
});
window.addEventListener('resize', () => {
  placePill(false);
  if (lessonIsOpen()) flipScene(() => fitScene(lesson.complete ? null : STEPS[lesson.index]));
});

/* ---------- Boot ---------- */

els.brand.insertAdjacentHTML('afterbegin', mascotSvg('happy', 'st-mascot--brand'));
buildTabs();
useLesson(savedProgress().lesson);
renderMap();
{
  // Hide the map until the font is in (no reflow jump), then play the entrance once.
  [els.mapTop, els.mapHead, els.tabs, els.tiles, els.mapDock].forEach((el) => motion.set(el, {opacity: 0}));
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    motion.set(els.tiles, {opacity: 1});
    placePill(false);
    playLoad();
  };
  if (window.SATIR_QA) {
    start();
  } else {
    document.fonts?.ready.then(start);
    clock.after(CHOREO.fontWait, start);
  }
}

shellBridge.publish({
  units: UNITS,
  ready: LESSON_ORDER,
  steps: Object.fromEntries(LESSON_ORDER.map((code) => [code, LESSONS[code].steps.length])),
});

/* Test hooks for tools/design-qa.js (no effect on normal use). */
window.satir = {
  get steps() {
    return STEPS;
  },
  lessons: LESSON_ORDER,
  useLesson,
  openLesson,
  openMap,
  goStep,
  finish: finishAll,
  advance,
  answerChoice,
  pressKey,
  checkKeypad,
  motion,
  clock,
  /** Time scale per channel (design-qa scales its settle limit for teaching motion by it). */
  tempo: TEMPO,
  pace: TEACH_PACE,
  /** Tempo classes: the paces, a step's class ('beat' or 'reveal') and the log of beats played. */
  tempoClasses: TEMPO_CLASSES,
  tempoClass,
  tempoLog,
  haptics: () => hapticCalls,
  unknown: answerUnknown,
  /** Teaching runner: per-action trace, the calibrated times and the transport (pause/play/replay). */
  teach: teachStats,
  teachTimes: TEACH,
  transport: pressTransport,
  teaching: () => runners.size > 0,
  /** The current step's recorded answer (null when unanswered): a revisit replays its reveal by itself. */
  answered: () => lesson.answered,
  setUnit(unitId) {
    if (els.mapView.hidden) {
      activeUnit = unitId;
      renderMap();
    } else {
      switchUnit(unitId);
    }
  },
  complete: completeLesson,
};
feelEmit('boot', null);

