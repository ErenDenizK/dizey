import { det, matrix, system, text } from './blocks'
import type { Question } from './types'

/**
 * 2024 summer school Midterm 1, transcribed from Eren's photos and recomputed in
 * vize1-2024-summer.test.ts. Items 5, 6 and 14 are cut off in the photos and are left out.
 */

const exam = '2024-summer-midterm'

export const vize1Summer2024: readonly Question[] = [
  {
    id: 'v1-2024s-01',
    node: 'R4',
    alsoNodes: ['M6'],
    source: { exam, item: 1 },
    stem: [
      matrix(
        [
          ['7', '-5'],
          ['-1', '6'],
        ],
        'A =',
      ),
      text('olduğuna göre $(A^T - 4I_2)^{-1}$ matrisi aşağıdakilerden hangisine eşittir?'),
    ],
    options: [
      {
        key: 'a',
        content: [
          matrix([
            ['5', '3'],
            ['2', '1'],
          ]),
        ],
        feedback: 'Kontrol et: bu matrisi $A^T - 4I_2$ ile çarpınca birim matris çıkmıyor.',
      },
      {
        key: 'b',
        content: [
          matrix([
            ['-1', '3'],
            ['2', '-5'],
          ]),
        ],
        feedback: 'Kontrol et: bu matrisi $A^T - 4I_2$ ile çarpınca birim matris çıkmıyor.',
      },
      {
        key: 'c',
        content: [
          matrix([
            ['6', '-1'],
            ['-5', '7'],
          ]),
        ],
        feedback: 'Önce $A^T - 4I_2$ matrisini kur, sonra $2 \\times 2$ ters formülünü ona uygula.',
      },
      {
        key: 'd',
        content: [
          matrix([
            ['6', '-5'],
            ['-1', '5'],
          ]),
        ],
        feedback: 'Önce $A^T - 4I_2$ matrisini kur, sonra $2 \\times 2$ ters formülünü ona uygula.',
      },
      {
        key: 'e',
        content: [
          matrix([
            ['2', '1'],
            ['5', '3'],
          ]),
        ],
      },
    ],
    answer: 'e',
    explanation:
      '$A^T - 4I_2$ matrisinin satırları $(3, -1)$ ve $(-5, 2)$; determinantı $6 - 5 = 1$. $2 \\times 2$ formülü: köşegeni yer değiştir, diğer ikisinin işaretini değiştir, determinanta böl. Sonuç: satırları $(2, 1)$ ve $(5, 3)$.',
  },
  {
    id: 'v1-2024s-02',
    node: 'D3',
    source: {
      exam,
      item: 2,
      correction:
        'The original names both determinants A; the first is written |A| and the second is left unnamed.',
    },
    stem: [
      det(
        [
          ['a', 'b', 'c'],
          ['d', 'e', 'f'],
          ['g', 'h', 'i'],
        ],
        '|A| =',
      ),
      text('$= -5$ olduğuna göre'),
      det([
        ['2b', '2a', '2c'],
        ['-e+b', '-d+a', '-f+c'],
        ['h', 'g', 'i'],
      ]),
      text('determinantının değeri aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$5$')],
        errorType: 'missed-row-factor',
        feedback: '1. satırdaki $2$ çarpanı dışarı çıkar; ayrıca işaretleri yeniden say.',
      },
      { key: 'b', content: [text('$-10$')] },
      {
        key: 'c',
        content: [text('$-5$')],
        errorType: 'missed-row-factor',
        feedback: '1. satırdaki $2$ çarpanını unuttun: bir satırın ortak çarpanı determinantın dışına çıkar.',
      },
      {
        key: 'd',
        content: [text('$10$')],
        errorType: 'lost-sign',
        feedback:
          'Bir işaret kaçtı. $-1$ çarpanı iki yerden gelir: 2. satırdaki $-(e, d, f)$ ve 1. ile 2. sütunun yer değiştirmesi.',
      },
      {
        key: 'e',
        content: [text('$2$')],
        errorType: 'factor-only',
        feedback: 'Çarpanları buldun ama $|A| = -5$ ile çarpmayı unuttun.',
      },
    ],
    answer: 'b',
    explanation:
      '1. satırdan $2$ çıkar: $(b, a, c)$. 2. satırdan 1. satırı çıkar (değer değişmez): $(-e, -d, -f)$, buradan $-1$ çıkar. 1. ve 2. sütunu yer değiştir: bir işaret daha, kalan $|A|$. Toplam: $2 \\cdot (-1) \\cdot (-1) \\cdot |A| = 2 \\cdot (-5) = -10$.',
  },
  {
    id: 'v1-2024s-03',
    node: 'D3',
    source: { exam, item: 3 },
    stem: [
      text(
        '$A$ ve $B$ $2 \\times 2$ tipinden matrisler ve $|B| = 8$, $A^3 = B^2$ olduğuna göre $|3A^TBA^{-1}B^{-1}A|$ determinantının değeri aşağıdakilerden hangisidir?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [text('$4$')],
        errorType: 'dropped-scalar',
        feedback: '$3$ çarpanını unuttun: $2 \\times 2$ matriste $|3M| = 3^2|M| = 9|M|$.',
      },
      { key: 'b', content: [text('$36$')] },
      {
        key: 'c',
        content: [text('$9$')],
        errorType: 'over-cancelled',
        feedback:
          '$|A|$ tamamen sadeleşmez: $A^T$, $A^{-1}$ ve $A$ üç tane, ikisi birbirini götürür, bir $|A|$ kalır.',
      },
      {
        key: 'd',
        content: [text('$12$')],
        errorType: 'k-instead-of-k-power-n',
        feedback: '$|3M| = 3|M|$ değil: $n \\times n$ matriste $|kM| = k^n|M|$, burada $3^2 = 9$.',
      },
      {
        key: 'e',
        content: [text('$8$')],
        errorType: 'other',
        feedback: '$|B|$ ile $|B^{-1}|$ birbirini götürür; sonuçta $|B|$ kalmaz.',
      },
    ],
    answer: 'b',
    explanation:
      '$|3M| = 3^2|M|$. $|A^T| = |A|$, $|A^{-1}| = 1/|A|$, $|B^{-1}| = 1/|B|$, böylece sonuç $9|A|$. $A^3 = B^2$ ise $|A|^3 = |B|^2 = 64$, yani $|A| = 4$. Cevap $9 \\cdot 4 = 36$.',
  },
  {
    id: 'v1-2024s-04',
    node: 'M3',
    alsoNodes: ['M6'],
    source: {
      exam,
      item: 4,
      correction:
        'Options were printed as "İz A = ..."; rewritten as the value of İz(A + Aᵀ), which the stem asks for.',
    },
    stem: [
      text('$A$ bir $m \\times m$ tipinden matris ise $A + A^T$ matrisinin izi aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$0$')],
        errorType: 'symmetric-vs-antisymmetric',
        feedback: 'İzi sıfır olan ters simetrik matristir; $A + A^T$ ise simetrik, köşegeni $2a_{ii}$ olur.',
      },
      {
        key: 'b',
        content: [text('$a_{11} + a_{22} + \\cdots + a_{mm}$')],
        errorType: 'counted-once',
        feedback: '$A^T$ matrisinin köşegeni $A$ ile aynı; köşegen iki kez toplanır.',
      },
      { key: 'c', content: [text('$2(a_{11} + a_{22} + \\cdots + a_{mm})$')] },
      {
        key: 'd',
        content: [text('$m(a_{11} + a_{22} + \\cdots + a_{mm})$')],
        errorType: 'other',
        feedback:
          'İz toplamaya göre doğrusal: $\\text{İz}(A + A^T) = \\text{İz}A + \\text{İz}A^T$; $m$ çarpanı gelmez.',
      },
      {
        key: 'e',
        content: [text('Hiçbiri')],
        errorType: 'other',
        feedback: 'Seçeneklerden biri doğru: $\\text{İz}A^T = \\text{İz}A$.',
      },
    ],
    answer: 'c',
    explanation:
      '$\\text{İz}(A + A^T) = \\text{İz}A + \\text{İz}A^T$ ve transpoz köşegeni değiştirmez, yani sonuç $2\\,\\text{İz}A = 2(a_{11} + \\cdots + a_{mm})$.',
  },
  {
    id: 'v1-2024s-07',
    node: 'M8',
    source: { exam, item: 7 },
    stem: [
      text('$A^2 = A$ olduğuna göre aşağıdakilerden hangileri doğrudur?'),
      text('I. $A$ idempotent matristir.'),
      text('II. $A$ terslenebilir matristir.'),
      text('III. $A$ bir kare matristir.'),
    ],
    options: [
      {
        key: 'a',
        content: [text('I ve II')],
        errorType: 'idempotent-means-invertible',
        feedback: 'II yanlış: sıfır matris de $A^2 = A$ sağlar ama terslenemez.',
      },
      { key: 'b', content: [text('I ve III')] },
      {
        key: 'c',
        content: [text('II ve III')],
        errorType: 'idempotent-means-invertible',
        feedback: 'I tanımın kendisi; II yanlış, çünkü sıfır matris de $A^2 = A$ sağlar.',
      },
      {
        key: 'd',
        content: [text('Sadece I')],
        errorType: 'missed-square',
        feedback: 'III de doğru: $A^2 = A \\cdot A$ tanımlı olması için $A$ kare olmalı.',
      },
      {
        key: 'e',
        content: [text('Sadece II')],
        errorType: 'idempotent-means-invertible',
        feedback: 'I tanımın kendisi; II yanlış, çünkü sıfır matris de $A^2 = A$ sağlar.',
      },
    ],
    answer: 'b',
    explanation:
      '$A^2 = A$ idempotentin tanımı (I doğru). $A \\cdot A$ ancak $A$ kare ise tanımlı (III doğru). Sıfır matris ve $\\text{diag}(1, 0)$ idempotent ama terslenemez (II yanlış).',
  },
  {
    id: 'v1-2024s-08',
    node: 'S2',
    alsoNodes: ['D3'],
    source: { exam, item: 8 },
    stem: [
      text('Verilen'),
      system('2x - y + (k+2)z = 1', 'kx - y + 3z = 0', '-6x + 3y + 3z = -3'),
      text(
        'lineer denklem sisteminin sonsuz çözümünün olması için $k$’nın alacağı değer aşağıdakilerden hangisidir?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [text('$3$')],
        errorType: 'nonzero-determinant',
        feedback: '$k = 3$ için $|A| \\neq 0$: sistemin tek çözümü var.',
      },
      {
        key: 'b',
        content: [text('$9$')],
        errorType: 'nonzero-determinant',
        feedback: '$k = 9$ için $|A| \\neq 0$: sistemin tek çözümü var.',
      },
      { key: 'c', content: [text('$-3$')] },
      {
        key: 'd',
        content: [text('$\\frac{1}{3}$')],
        errorType: 'nonzero-determinant',
        feedback: '$k = \\frac{1}{3}$ için $|A| \\neq 0$: sistemin tek çözümü var.',
      },
      {
        key: 'e',
        content: [text('$-\\frac{1}{3}$')],
        errorType: 'nonzero-determinant',
        feedback: '$k = -\\frac{1}{3}$ için $|A| \\neq 0$: sistemin tek çözümü var.',
      },
    ],
    answer: 'c',
    explanation:
      '$|A| = 3(k - 2)(k + 3)$, sıfır olduğu yerler $k = 2$ ve $k = -3$. $k = 2$: $r_A = 2$, $r_B = 3$, çözüm yok. $k = -3$: $r_A = r_B = 2 < 3$, sonsuz çözüm. Sınavda: önce $|A| = 0$ yapan değerler, sonra her birinde $r_A$ ile $r_B$.',
  },
  {
    id: 'v1-2024s-09',
    node: 'D3',
    source: { exam, item: 9 },
    stem: [
      det([
        ['x', 'x', 'x', 'x'],
        ['y', 'y', 'y', '-y'],
        ['z', 'z', '-z', '-z'],
        ['t', '-t', '-t', '-t'],
      ]),
      text('determinantının değeri aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$0$')],
        errorType: 'assumed-proportional-rows',
        feedback:
          'Ortak çarpanlar çıkınca satırlar eşit değil; işaretler farklı olduğu için determinant sıfır olmaz.',
      },
      {
        key: 'b',
        content: [text('$4xyzt$')],
        errorType: 'dropped-pivot',
        feedback: 'Üçgen formda köşegende üç tane $-2$ var; çarpımları $-8$, satır değişimiyle $8$.',
      },
      {
        key: 'c',
        content: [text('$xyzt$')],
        errorType: 'other',
        feedback: 'Çarpanlar çıktıktan sonra kalan $\\pm 1$ determinantı $1$ değil, $8$.',
      },
      {
        key: 'd',
        content: [text('$2xyzt$')],
        errorType: 'dropped-pivot',
        feedback: 'Üçgen formda köşegende üç tane $-2$ var; çarpımları $-8$, satır değişimiyle $8$.',
      },
      { key: 'e', content: [text('$8xyzt$')] },
    ],
    answer: 'e',
    explanation:
      'Her satırdan ortak çarpanı çıkar: $xyzt$. Kalan satırlar $(1,1,1,1)$, $(1,1,1,-1)$, $(1,1,-1,-1)$, $(1,-1,-1,-1)$. Her satırdan 1. satırı çıkar, 2. ve 4. satırı yer değiştir: köşegen $1, -2, -2, -2$, çarpım $-8$, değişimle $8$. Sonuç $8xyzt$.',
  },
  {
    id: 'v1-2024s-10',
    node: 'M7',
    alsoNodes: ['M6'],
    source: {
      exam,
      item: 10,
      correction:
        'The original asks which option IS antisymmetric, but a, b, c and e all are. Reversed to "which is NOT antisymmetric", whose only answer is d.',
    },
    stem: [
      text(
        '$n \\times n$ tipindeki $A$ ve $B$ matrisleri çarpma işlemine göre değişmeli olsun. $A$ matrisi ters simetrik, $B$ matrisi sıfırdan farklı simetrik bir matris ise aşağıdakilerden hangisi ters simetrik değildir?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [text('$AB + A$')],
        errorType: 'missed-ab-antisymmetric',
        feedback: '$(AB)^T = B^TA^T = -BA = -AB$: $AB$ ters simetrik, $A$ da; toplamları da ters simetrik.',
      },
      {
        key: 'b',
        content: [text('$-AB + A$')],
        errorType: 'missed-ab-antisymmetric',
        feedback: '$AB$ ve $A$ ters simetrik; ters simetriklerin her doğrusal birleşimi ters simetrik.',
      },
      {
        key: 'c',
        content: [text('$BA + A^T$')],
        errorType: 'missed-ab-antisymmetric',
        feedback: '$BA = AB$ ters simetrik ve $A^T = -A$; toplamları ters simetrik.',
      },
      { key: 'd', content: [text('$AB + B$')] },
      {
        key: 'e',
        content: [text('$-AB + A^T$')],
        errorType: 'missed-ab-antisymmetric',
        feedback: '$AB$ ters simetrik ve $A^T = -A$; toplamları ters simetrik.',
      },
    ],
    answer: 'd',
    explanation:
      '$(AB)^T = B^TA^T = B(-A) = -BA = -AB$, yani $AB$ ters simetrik. $A$ ve $A^T = -A$ da ters simetrik, bunların toplamları da. $AB + B$ içinde simetrik $B$ var: $(AB + B)^T = -AB + B \\neq -(AB + B)$, çünkü $B \\neq 0$.',
  },
  {
    id: 'v1-2024s-11',
    node: 'M11',
    alsoNodes: ['D2', 'X1'],
    source: { exam, item: 11 },
    stem: [
      text('$k$’nın hangi değerleri için'),
      matrix(
        [
          ['k', '0', '2'],
          ['8', '0', 'k'],
          ['4', '1', '3'],
        ],
        'A =',
      ),
      text('matrisi terslenemez?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$\\mathbb{R} - \\{\\pm 4\\}$')],
        errorType: 'answered-the-complement',
        feedback: 'Bu küme $A$’nın terslenebilir olduğu değerler; soru terslenemez olanları soruyor.',
      },
      {
        key: 'b',
        content: [text('$\\mathbb{R} - \\{4\\}$')],
        errorType: 'answered-the-complement',
        feedback: 'Terslenemez demek $|A| = 0$ demek; $k^2 = 16$’nın iki kökü var: $4$ ve $-4$.',
      },
      {
        key: 'c',
        content: [text('Her $k \\in \\mathbb{R}$')],
        errorType: 'other',
        feedback: '$|A| = -(k^2 - 16)$; bu her $k$ için sıfır değil.',
      },
      { key: 'd', content: [text('$k = \\pm 4$')] },
      {
        key: 'e',
        content: [text('$\\mathbb{R} - \\{-4\\}$')],
        errorType: 'answered-the-complement',
        feedback: 'Terslenemez demek $|A| = 0$ demek; $k^2 = 16$’nın iki kökü var: $4$ ve $-4$.',
      },
    ],
    answer: 'd',
    explanation:
      '2. sütunda sıfırdan farklı tek eleman $a_{32} = 1$; o sütuna göre aç: $|A| = 1 \\cdot (-1)^{3+2}(k \\cdot k - 2 \\cdot 8) = -(k^2 - 16)$. Terslenemez $\\iff |A| = 0 \\iff k = \\pm 4$.',
  },
  {
    id: 'v1-2024s-12',
    node: 'M5',
    alsoNodes: ['R4'],
    source: { exam, item: 12 },
    stem: [
      matrix(
        [
          ['1', '1'],
          ['2', '3'],
        ],
        'A =',
      ),
      text('ve'),
      matrix(
        [
          ['0', '2', '1', '6'],
          ['-1', '6', '0', '13'],
        ],
        'AB =',
      ),
      text('ise $B$ matrisinin $b_{13}$ elemanı aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$0$')],
        feedback: '$B = A^{-1}(AB)$: $A^{-1}$’in 1. satırı ile $AB$’nin 3. sütununu çarp.',
      },
      {
        key: 'b',
        content: [text('$-2$')],
        errorType: 'wrong-row',
        feedback: 'Bu $b_{23}$: $A^{-1}$’in 2. satırını kullandın, 1. satır gerekiyor.',
      },
      { key: 'c', content: [text('$3$')] },
      {
        key: 'd',
        content: [text('$-1$')],
        feedback: '$B = A^{-1}(AB)$: $A^{-1}$’in 1. satırı ile $AB$’nin 3. sütununu çarp.',
      },
      {
        key: 'e',
        content: [text('$1$')],
        errorType: 'read-ab-as-b',
        feedback: 'Bu $AB$’nin $(1, 3)$ elemanı; önce soldan $A^{-1}$ ile çarpmak gerekiyor.',
      },
    ],
    answer: 'c',
    explanation:
      '$|A| = 1$, $A^{-1}$’in satırları $(3, -1)$ ve $(-2, 1)$. $B = A^{-1}(AB)$ olduğundan $b_{13} = 3 \\cdot 1 + (-1) \\cdot 0 = 3$. Bütün $B$’yi hesaplamaya gerek yok.',
  },
  {
    id: 'v1-2024s-13',
    node: 'R4',
    source: {
      exam,
      item: 13,
      correction:
        'The printed A² (rows (1/2, 3/2), (-7/2, 5/2)) fits no A with 2A³ − 5A + 3I = 0: A would be −3(2A² − 5I)⁻¹, whose square is different. Replaced by the square of A = [[0, 3/2], [1, −1]], which satisfies the identity. Same method, new numbers; options rebuilt from the same mistakes.',
    },
    stem: [
      text('Terslenebilir bir $A$ matrisi $2A^3 - 5A + 3I = 0$ eşitliğini sağlamaktadır.'),
      matrix(
        [
          ['3/2', '-3/2'],
          ['-1', '5/2'],
        ],
        'A² =',
      ),
      text('olduğuna göre $A^{-1}$ matrisi aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [
          matrix([
            ['2/3', '2/3'],
            ['1', '0'],
          ]),
        ],
        errorType: 'transposed',
        feedback: 'Bu doğru sonucun transpozu; $5I - 2A^2$ matrisini elemanları yerinde bırakarak böl.',
      },
      {
        key: 'b',
        content: [
          matrix([
            ['2/3', '1'],
            ['2/3', '0'],
          ]),
        ],
      },
      {
        key: 'c',
        content: [
          matrix([
            ['-2/3', '-1'],
            ['-2/3', '0'],
          ]),
        ],
        errorType: 'lost-sign',
        feedback:
          'İşaret: $A(2A^2 - 5I) = -3I$, yani $A^{-1} = -\\frac{1}{3}(2A^2 - 5I) = \\frac{1}{3}(5I - 2A^2)$.',
      },
      {
        key: 'd',
        content: [
          matrix([
            ['2', '3'],
            ['2', '0'],
          ]),
        ],
        errorType: 'dropped-scalar',
        feedback: '$\\frac{1}{3}$ çarpanını unuttun: $A \\cdot (5I - 2A^2) = 3I$, birim matris değil.',
      },
      {
        key: 'e',
        content: [
          matrix([
            ['0', '3/2'],
            ['1', '-1'],
          ]),
        ],
        errorType: 'other',
        feedback: 'Bu $A$’nın kendisi (karesi verilen $A^2$); tersi değil.',
      },
    ],
    answer: 'b',
    explanation:
      '$2A^3 - 5A = -3I$, yani $A(2A^2 - 5I) = -3I$ ve $A^{-1} = \\frac{1}{3}(5I - 2A^2)$. $2A^2$’nin satırları $(3, -3)$ ve $(-2, 5)$; $5I - 2A^2$’nin satırları $(2, 3)$ ve $(2, 0)$. $3$’e bölünce satırlar $(\\frac{2}{3}, 1)$ ve $(\\frac{2}{3}, 0)$. $A$’yı bulmaya gerek yok.',
  },
  {
    id: 'v1-2024s-15',
    node: 'D4',
    alsoNodes: ['D2'],
    source: { exam, item: 15 },
    stem: [
      matrix(
        [
          ['3', '-2', '1'],
          ['5', '6', '2'],
          ['1', '0', '-3'],
        ],
        'A =',
      ),
      text('matrisinin $\\text{Ek}(A)$ matrisi aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [
          matrix([
            ['-18', '17', '-6'],
            ['-6', '-10', '-2'],
            ['-10', '-1', '28'],
          ]),
        ],
        errorType: 'forgot-transpose',
        feedback:
          'Bu kofaktör matrisi $[C_{ij}]$; $\\text{Ek}(A)$ onun transpozu: $\\text{Ek}(A) = [C_{ij}]^T$.',
      },
      {
        key: 'b',
        content: [
          matrix([
            ['-18', '-6', '-10'],
            ['17', '-10', '-1'],
            ['-6', '-2', '28'],
          ]),
        ],
      },
      {
        key: 'c',
        content: [
          matrix([
            ['-18', '17', '-6'],
            ['-10', '-10', '-1'],
            ['-6', '-2', '28'],
          ]),
        ],
        feedback: 'Kontrol: $A \\cdot \\text{Ek}(A) = |A|\\,I$ olmalı; bu matrisle sağlanmıyor.',
      },
      {
        key: 'd',
        content: [
          matrix([
            ['-18', '-6', '-10'],
            ['17', '-10', '-2'],
            ['-6', '-1', '28'],
          ]),
        ],
        feedback: 'Kontrol: $A \\cdot \\text{Ek}(A) = |A|\\,I$ olmalı; bu matrisle sağlanmıyor.',
      },
      {
        key: 'e',
        content: [
          matrix([
            ['-6', '-18', '-10'],
            ['-10', '17', '-1'],
            ['-2', '6', '28'],
          ]),
        ],
        feedback: 'Kontrol: $A \\cdot \\text{Ek}(A) = |A|\\,I$ olmalı; bu matrisle sağlanmıyor.',
      },
    ],
    answer: 'b',
    explanation:
      'Kofaktörler: $C_{11} = -18$, $C_{12} = 17$, $C_{13} = -6$, $C_{21} = -6$, $C_{22} = -10$, $C_{23} = -2$, $C_{31} = -10$, $C_{32} = -1$, $C_{33} = 28$. $\\text{Ek}(A)$ bunların transpozu: $C_{ij}$, $(j, i)$ konumuna yazılır. Sınavda hızlı eleme: $a_{11}$’in kofaktörü $-18$, $\\text{Ek}(A)$’nın 2. satır 1. elemanı $C_{12} = 17$.',
  },
  {
    id: 'v1-2024s-16',
    node: 'D3',
    alsoNodes: ['M9'],
    source: {
      exam,
      item: 16,
      correction:
        'Printed statement I, |Aᵀ(A + B)Bᵀ| = |A + B|, is also always true: when |A||B| = -1, AᵀB is orthogonal with determinant -1, so it has eigenvalue -1 and |A + B| = 0. With II and III also true, no option fit. Statement I replaced by |ABᵀ| = 1, which fails for a rotation and a reflection; the answer stays c.',
    },
    stem: [
      text(
        '$A$ ve $B$ aynı tipten reel ortogonal matrisler olmak üzere aşağıdakilerden hangisi ya da hangileri her zaman doğrudur?',
      ),
      text('I. $|AB^T| = 1$'),
      text('II. $|A^T + B| = |A + B^T|$'),
      text('III. $|A^T + B^T| = |(A + B)^T|$'),
    ],
    options: [
      {
        key: 'a',
        content: [text('Yalnız I')],
        errorType: 'orthogonal-det-is-one',
        feedback:
          'Ortogonal matrisin determinantı $1$ veya $-1$; $A = I$, $B$ bir yansıma ise $|AB^T| = -1$.',
      },
      {
        key: 'b',
        content: [text('Yalnız II')],
        errorType: 'missed-transpose-rule',
        feedback: 'III de doğru: $A^T + B^T = (A + B)^T$ ve $|M^T| = |M|$.',
      },
      { key: 'c', content: [text('II ve III')] },
      {
        key: 'd',
        content: [text('I ve III')],
        errorType: 'orthogonal-det-is-one',
        feedback:
          'I her zaman doğru değil ($|A|$, $|B| \\in \\{1, -1\\}$); II ise $A^T + B = (A + B^T)^T$ olduğu için doğru.',
      },
      {
        key: 'e',
        content: [text('Yalnız III')],
        errorType: 'missed-transpose-rule',
        feedback: 'II de doğru: $A^T + B = (A + B^T)^T$ ve $|M^T| = |M|$.',
      },
    ],
    answer: 'c',
    explanation:
      'II: $A^T + B = (A + B^T)^T$ ve transpoz determinantı değiştirmez. III: $A^T + B^T = (A + B)^T$, aynı sebep. I: $|AB^T| = |A||B|$ ve ortogonal matrisin determinantı $\\pm 1$; işaretler farklıysa $-1$ olur.',
  },
  {
    id: 'v1-2024s-17',
    node: 'M5',
    alsoNodes: ['M4'],
    source: { exam, item: 17, correction: 'The original omits the name B before the column vector; added.' },
    stem: [
      matrix(
        [
          ['1', 'x', '3'],
          ['2', '-1', '1'],
        ],
        'A =',
      ),
      text('ve'),
      matrix([['2'], ['4'], ['y']], 'B ='),
      text('olsun. Eğer'),
      matrix([['12'], ['6']], 'AB ='),
      text('ise $x + y$’nin değeri aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$-2$')],
        errorType: 'answered-part',
        feedback: 'Bu sadece $x$; soru $x + y$’yi soruyor.',
      },
      {
        key: 'b',
        content: [text('$-\\frac{1}{2}$')],
        feedback:
          'Satır çarpı sütun: 2. satır $2 \\cdot 2 + (-1) \\cdot 4 + 1 \\cdot y = y$, buradan $y = 6$.',
      },
      {
        key: 'c',
        content: [text('$-4$')],
        feedback:
          'Satır çarpı sütun: 2. satır $2 \\cdot 2 + (-1) \\cdot 4 + 1 \\cdot y = y$, buradan $y = 6$.',
      },
      {
        key: 'd',
        content: [text('$\\frac{1}{2}$')],
        feedback:
          'Satır çarpı sütun: 2. satır $2 \\cdot 2 + (-1) \\cdot 4 + 1 \\cdot y = y$, buradan $y = 6$.',
      },
      { key: 'e', content: [text('$4$')] },
    ],
    answer: 'e',
    explanation:
      '2. satır: $4 - 4 + y = 6$, yani $y = 6$. 1. satır: $2 + 4x + 3y = 12$, yani $4x = -8$, $x = -2$. $x + y = 4$. 2. satırdan başlamak işi kısaltır: orada tek bilinmeyen var.',
  },
  {
    id: 'v1-2024s-18',
    node: 'S3',
    source: { exam, item: 18 },
    stem: [
      system('x + 2y + 3z = 0', 'x + 2y + z = 0'),
      text('homojen denklem sisteminin çözümü aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('Sadece aşikar (sıfır) çözüme sahiptir')],
        errorType: 'missed-free-variable',
        feedback: '2 denklem, 3 bilinmeyen: $r_A \\le 2 < 3$, yani aşikar olmayan çözümler var.',
      },
      {
        key: 'b',
        content: [text('$x = 3k$, $y = 2k$, $z = k$, $k \\in \\mathbb{R}$')],
        errorType: 'not-substituted',
        feedback: 'Yerine koy: 1. denklemde $3k + 4k + 3k = 10k$, sıfır değil.',
      },
      { key: 'c', content: [text('$x = -2k$, $y = k$, $z = 0$, $k \\in \\mathbb{R}$')] },
      {
        key: 'd',
        content: [text('$x = 2k$, $y = 3k$, $z = k$, $k \\in \\mathbb{R}$')],
        errorType: 'not-substituted',
        feedback: 'Yerine koy: 1. denklemde $2k + 6k + 3k = 11k$, sıfır değil.',
      },
      {
        key: 'e',
        content: [text('Sistemin çözümü yoktur')],
        errorType: 'homogeneous-has-no-solution',
        feedback: 'Homojen sistemin her zaman en az bir çözümü var: $x = y = z = 0$.',
      },
    ],
    answer: 'c',
    explanation:
      'İki denklemi çıkar: $2z = 0$, yani $z = 0$. Kalan $x + 2y = 0$: $y = k$ serbest, $x = -2k$. $r_A = 2 < 3$ olduğundan bir parametreli sonsuz çözüm. Sınavda en hızlısı: şıkları yerine koymak.',
  },
]
