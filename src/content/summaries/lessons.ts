import type { MatrixBlock } from '../lessons/types'
import type { Summary } from './types'

const m = (
  label: string,
  rows: readonly (readonly string[])[],
  delimiter: 'brackets' | 'bars' = 'brackets',
): MatrixBlock => ({
  kind: 'matrix',
  delimiter,
  rows,
  label,
})

const augmented = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
  augmentedAt: (rows[0]?.length ?? 1) - 1,
})

/**
 * One summary per lesson id (the lesson's `id`). A lesson without an entry simply has no summary page:
 * `summaryOf` returns undefined and the screens skip it, so new lessons can be added before their summary.
 */
export const summaries: Readonly<Record<string, Summary>> = {
  'm1-reading-a-matrix': {
    gist: 'Bir matrisi okumak: boyut ve eleman adresi.',
    points: [
      '$m \\times n$ matris: $m$ satır, $n$ sütun. Önce satır, sonra sütun.',
      '$a_{ij}$: $i.$ satır, $j.$ sütun.',
      'Satır yatay, sütun dikey.',
    ],
    trap: '$a_{ij}$ ile $a_{ji}$ genelde farklıdır. İlk indis hep satırdır.',
    example: {
      matrices: {
        A: m('A =', [
          ['2', '5', '-1'],
          ['0', '3', '4'],
        ]),
      },
      show: ['A'],
      line: '$a_{12} = 5$ (1. satır, 2. sütun); $a_{21} = 0$.',
      claims: [
        { kind: 'exprEntry', expr: 'A', row: 1, col: 2, equals: '5' },
        { kind: 'exprEntry', expr: 'A', row: 2, col: 1, equals: '0' },
      ],
    },
  },
  'm2-matrix-types': {
    gist: 'Matris türleri: sıfırların yeri matrise ad verir.',
    points: [
      'Satır $1 \\times n$, sütun $m \\times 1$, kare $n \\times n$.',
      'Köşegen: köşegen dışı $0$. Skaler: köşegen sabit ($\\lambda I$). Birim: köşegen $1$.',
      'Üst üçgen: köşegenin altı $0$. Alt üçgen: köşegenin üstü $0$.',
      'Birim ⊂ skaler ⊂ köşegen ⊂ kare.',
    ],
    trap: 'Hem üst hem alt üçgen olan matris köşegen matristir. Köşegen üzerindeki $0$ sorun değildir.',
    example: {
      matrices: {
        D: m('D =', [
          ['4', '0'],
          ['0', '4'],
        ]),
      },
      show: ['D'],
      line: '$D = 4I$: skaler, dolayısıyla köşegen ve kare.',
      claims: [
        { kind: 'property', expr: 'D', is: 'scalar' },
        { kind: 'property', expr: 'D', is: 'diagonal' },
      ],
    },
  },
  'm4-matrix-arithmetic': {
    gist: 'Eşitlik, toplama ve skalerle çarpma konum konum yapılır.',
    points: [
      'Eşit matris: aynı boyut, her konumda aynı eleman.',
      '$A + B$ ve $A - B$: yalnız aynı boyutta, eleman eleman.',
      '$kA$: her eleman $k$ ile çarpılır. $2A - 3B$ kutu kutu hesaplanır.',
      'Matris denklemi sayı denklemi gibi çözülür: $2X + A = 3B \\Rightarrow X = \\frac{1}{2}(3B - A)$.',
    ],
    trap: 'Boyutlar farklıysa toplam tanımsızdır. Önce boyuta bak.',
    example: {
      matrices: {
        A: m('A =', [
          ['1', '2'],
          ['0', '3'],
        ]),
        B: m('B =', [
          ['-1', '4'],
          ['5', '2'],
        ]),
      },
      show: ['A', 'B'],
      line: '$2A - B$ sağ üst: $2 \\cdot 2 - 4 = 0$.',
      claims: [{ kind: 'exprEntry', expr: '2A - B', row: 1, col: 2, equals: '0' }],
    },
  },
  'm5-matrix-product': {
    gist: 'Çarpım: satır çarpı sütun. Sıra önemlidir.',
    points: [
      '$(AB)_{ij}$: $A$’nın $i.$ satırı ile $B$’nin $j.$ sütununu çarp, topla.',
      '$(m \\times n)(n \\times p) = m \\times p$. İçteki sayılar eşit olmalı.',
      '$(AB)C = A(BC)$, $A(B + C) = AB + AC$, $AI = IA = A$.',
      '$A^2 = AA$. Kuvvetlerde kalıp ara.',
    ],
    trap: 'Genelde $AB \\neq BA$. $(A + B)^2$ içinde $2AB$ yok. $AB = 0$ iken $A$ ya da $B$ sıfır olmak zorunda değil; $AB = AC$ iken $B = C$ çıkmaz.',
    example: {
      matrices: {
        A: m('A =', [
          ['1', '1'],
          ['0', '1'],
        ]),
        B: m('B =', [
          ['1', '0'],
          ['1', '1'],
        ]),
      },
      show: ['A', 'B'],
      line: '$AB$ sol üst $2$, $BA$ sol üst $1$.',
      claims: [
        { kind: 'exprEntry', expr: 'AB', row: 1, col: 1, equals: '2' },
        { kind: 'exprEntry', expr: 'BA', row: 1, col: 1, equals: '1' },
      ],
    },
  },
  'm3-trace': {
    gist: 'İz: köşegenin toplamı, yalnız kare matriste.',
    points: [
      '$\\text{tr}(A) = a_{11} + a_{22} + \\cdots + a_{nn}$.',
      '$\\text{tr}(A \\pm B) = \\text{tr}(A) \\pm \\text{tr}(B)$, $\\text{tr}(kA) = k\\,\\text{tr}(A)$.',
      '$\\text{tr}(A^T) = \\text{tr}(A)$, $\\text{tr}(AB) = \\text{tr}(BA)$, $\\text{tr}(I_n) = n$.',
    ],
    trap: '$\\text{tr}(AB) \\neq \\text{tr}(A)\\,\\text{tr}(B)$. Sabit terim için $\\text{tr}(cI_n) = cn$: boyutla çarp.',
    example: {
      matrices: {
        A: m('A =', [
          ['2', '4'],
          ['-1', '5'],
        ]),
      },
      show: ['A'],
      line: '$\\text{tr}(A) = 2 + 5 = 7$.',
      claims: [{ kind: 'trace', expr: 'A', equals: '7' }],
    },
  },
  'm6-transpose': {
    gist: 'Transpoz: satırlar sütun olur.',
    points: [
      '$(A^T)_{ij} = a_{ji}$. $m \\times n$ matrisin transpozu $n \\times m$.',
      '$(A^T)^T = A$, $(A + B)^T = A^T + B^T$, $(kA)^T = kA^T$.',
      '$(AB)^T = B^TA^T$. Uzun çarpımda tüm sıra ters döner: $(ABC)^T = C^TB^TA^T$.',
    ],
    trap: '$(AB)^T = A^TB^T$ yazmak en sık hata.',
    example: {
      matrices: {
        A: m('A =', [
          ['1', '2', '3'],
          ['4', '5', '6'],
        ]),
      },
      show: ['A'],
      line: '$(A^T)_{31} = a_{13} = 3$.',
      claims: [{ kind: 'exprEntry', expr: 'A^T', row: 3, col: 1, equals: '3' }],
    },
  },
  'm7-symmetric-antisymmetric': {
    gist: 'Simetrik ve antisimetrik: transpozu al, kendisi mi eksi kendisi mi bak.',
    points: [
      'Simetrik: $A^T = A$, yani $a_{ij} = a_{ji}$.',
      'Antisimetrik: $A^T = -A$, yani $a_{ij} = -a_{ji}$ ve köşegen $0$.',
      '$A + A^T$, $AA^T$, $A^TA$ simetrik; $A - A^T$ antisimetrik.',
      '$A = \\frac{1}{2}(A + A^T) + \\frac{1}{2}(A - A^T)$, tek yolla.',
    ],
    trap: 'İki simetrik matrisin çarpımı $XY$ ancak $XY = YX$ ise simetriktir, çünkü $(XY)^T = YX$.',
    example: {
      matrices: {
        K: m('K =', [
          ['0', '2'],
          ['-2', '0'],
        ]),
      },
      show: ['K'],
      line: 'Köşegen $0$, çift $2$ ve $-2$: $K^T = -K$.',
      claims: [{ kind: 'property', expr: 'K', is: 'antisymmetric' }],
    },
  },
  'm8-power-classes': {
    gist: 'Kuvvetle tanımlanan sınıflar: periyodik, idempotent, nilpotent, involutive.',
    points: [
      'Periyodik: $A^{k+1} = A$; en küçük $k$ periyot.',
      'İdempotent: $A^2 = A$ (periyodu $1$). Her kuvveti $A$. $(A + I)^n = I + (2^n - 1)A$.',
      'Nilpotent: $A^p = 0$; en küçük $p$ indeks. $|A| = 0$ ve $I + A$ tersinir.',
      'Involutive: $A^2 = I$, yani $A^{-1} = A$.',
    ],
    trap: '$A^2 = A$ iken $A = I$ ya da $A = 0$ olmak zorunda değil. Nilpotent matris sıfır matris olmayabilir.',
    example: {
      matrices: {
        N: m('N =', [
          ['0', '1'],
          ['0', '0'],
        ]),
        P: m('P =', [
          ['1', '0'],
          ['0', '0'],
        ]),
      },
      show: ['N', 'P'],
      line: '$N^2 = 0$: nilpotent, indeks $2$. $P^2 = P$: idempotent.',
      claims: [
        { kind: 'property', expr: 'N', is: 'nilpotent', index: 2 },
        { kind: 'property', expr: 'P', is: 'idempotent' },
      ],
    },
  },
  'm9-orthogonal': {
    gist: 'Ortogonal matris: tersi transpozudur.',
    points: [
      '$A^TA = I$, yani $A^{-1} = A^T$. Sütunlar (ve satırlar) birim uzunlukta ve ikişer ikişer dik.',
      '$|A| = \\pm 1$. 2×2’de dönme $+1$, yansıma $-1$.',
      'Ortogonal çarpı ortogonal, ortogonalin transpozu ve tersi yine ortogonal.',
    ],
    trap: 'Sütunların dik olması yetmez; boyları $1$ da olmalı. $|A| = \\pm 1$ olması ortogonal olmayı göstermez.',
    example: {
      matrices: {
        Q: m('Q =', [
          ['0', '-1'],
          ['1', '0'],
        ]),
      },
      show: ['Q'],
      line: '$Q^TQ = I$ ve $|Q| = 1$: 90° dönme.',
      claims: [
        {
          kind: 'expr',
          expr: 'Q^TQ',
          equals: [
            ['1', '0'],
            ['0', '1'],
          ],
        },
        { kind: 'det', matrix: 'Q', equals: '1' },
      ],
    },
  },
  'm10-conjugate-hermitian': {
    gist: 'Eşlenik, eşlenik transpoz, Hermitian.',
    points: [
      '$\\overline{a + bi} = a - bi$. Gerçek elemanlar değişmez.',
      '$A^* = (\\bar{A})^T$: önce eşlenik, sonra transpoz.',
      'Hermitian: $A^* = A$ (köşegen gerçek). Ters Hermitian: $A^* = -A$ (köşegen saf sanal ya da $0$).',
      '$(AB)^* = B^*A^*$, $(kA)^* = \\bar{k}A^*$.',
    ],
    trap: 'Sadece transpoz almak yetmez, eşleniği de al. Skaler dışarı çıkarken eşlenik olur.',
    example: {
      matrices: {
        H: m('H =', [
          ['2', 'i'],
          ['-i', '3'],
        ]),
      },
      show: ['H'],
      line: 'Köşegen gerçek, $h_{12} = i$ ile $h_{21} = -i$ birbirinin eşleniği: $H^* = H$.',
      claims: [{ kind: 'complexProperty', matrix: 'H', is: 'hermitian' }],
    },
  },
  'r1-row-operations': {
    gist: 'Üç elemanter satır işlemi ve determinanta etkisi.',
    points: [
      '$R_i \\leftrightarrow R_j$, $R_i \\to kR_i$ ($k \\neq 0$), $R_i \\to R_i + kR_j$.',
      'Her işlem geri alınır; rank ve (genişletilmiş matriste) çözüm kümesi değişmez.',
      'Sütun işlemleri de rankı korur ama sistemde yalnız satır işlemi kullan.',
      'Determinant: yer değiştirme $-1$ ile, $kR_i$ $k$ ile çarpar, kat ekleme değiştirmez.',
      'Sıfırlama çarpanı: $R_3 \\to R_3 + kR_2$, $k = -\\dfrac{\\text{sıfırlanacak}}{\\text{pivot}}$.',
    ],
    trap: 'Bir satırı $0$ ile çarpmak elemanter işlem değildir. Satırı $k$ ile çarpınca determinant $k$ ile çarpılır.',
  },
  'r2-echelon-forms': {
    gist: 'Eşelon form ve indirgenmiş eşelon form.',
    points: [
      'Eşelon form: sıfır satırlar en altta, her pivot bir üstündekinin sağında, pivotların altı $0$.',
      'İndirgenmiş eşelon form: pivotlar $1$ ve pivot sütununda başka eleman $0$.',
      'Eşelon form tek değildir; indirgenmiş eşelon form tektir.',
      'Gauss: eşelon forma. Gauss-Jordan: indirgenmiş forma; çözüm doğrudan okunur.',
    ],
    trap: 'Eşelon formda pivotun $1$ olması gerekmez. Pivotlar sola kayıyorsa önce satırları değiştir.',
  },
  'r3-rank': {
    gist: 'Rank: eşelon formdaki pivot sayısı.',
    points: [
      '$\\text{rank}(A)$ = eşelon formda sıfır olmayan satır sayısı.',
      '$\\text{rank}(A) \\leq \\min(m, n)$, $\\text{rank}(A^T) = \\text{rank}(A)$ (satır rankı = sütun rankı).',
      '$n \\times n$: rank $n \\iff |A| \\neq 0 \\iff$ tersinir.',
    ],
    trap: 'Bir satır diğerlerinin kombinasyonuysa rank düşer; determinant $0$ olur, ters yoktur.',
    example: {
      matrices: {
        A: m('A =', [
          ['1', '2', '3'],
          ['2', '4', '6'],
          ['0', '1', '1'],
        ]),
      },
      show: ['A'],
      line: '$R_2 - 2R_1$ sıfır satır verir: rank $2$, tersi yok.',
      claims: [
        { kind: 'rank', matrix: 'A', equals: '2' },
        { kind: 'det', matrix: 'A', equals: '0' },
      ],
    },
  },
  'd1-determinant': {
    gist: 'Determinant: tersin var olup olmadığını söyleyen tek sayı.',
    points: [
      '2×2: $|A| = ad - bc$ (ana köşegen eksi diğer köşegen).',
      '3×3 Sarrus: ilk iki sütunu sağa yaz; sağa inen üç çarpım eksi sola inen üç çarpım. Yalnız 3×3.',
      '$|A| = 0 \\iff A$ singüler (tersi yok). $|A| \\neq 0 \\iff$ regüler.',
      '$|A|$ birim kare ya da küpün alan ya da hacim katsayısı; işaret yönü söyler.',
    ],
    trap: 'Sarrus 4×4’te çalışmaz. Parametreli sorularda $|A|$’yı sıfıra eşitleyip kökleri bul.',
    example: {
      matrices: {
        A: m(
          '|A| =',
          [
            ['3', '1'],
            ['4', '2'],
          ],
          'bars',
        ),
      },
      show: ['A'],
      line: '$|A| = 3 \\cdot 2 - 1 \\cdot 4 = 2 \\neq 0$: tersi var.',
      claims: [{ kind: 'det', matrix: 'A', equals: '2' }],
    },
  },
  'd2-cofactor-expansion': {
    gist: 'Minör, kofaktör ve Laplace açılımı.',
    points: [
      '$M_{ij}$: $i.$ satırı ve $j.$ sütunu sil, kalanın determinantı.',
      '$C_{ij} = (-1)^{i+j}M_{ij}$. İşaret düzeni sol üstten artıyla başlar: $+\\,-\\,+$.',
      'Laplace: bir satır ya da sütun boyunca $|A| = \\sum a_{ij}C_{ij}$. Hangisini seçersen aynı sonuç.',
      'En çok sıfır olan satırı ya da sütunu seç. Üçgensel matriste $|A|$ = köşegen çarpımı.',
    ],
    trap: 'Minörü bulup işareti unutmak. Açılıma başlamadan satırın işaret düzenini yaz.',
    example: {
      matrices: {
        A: m(
          '|A| =',
          [
            ['2', '0', '1'],
            ['3', '4', '-1'],
            ['1', '0', '5'],
          ],
          'bars',
        ),
      },
      show: ['A'],
      line: '2. sütundan aç: $|A| = 4\\,C_{22} = 4 \\cdot 9 = 36$.',
      claims: [
        { kind: 'cofactor', matrix: 'A', row: 2, col: 2, equals: '9' },
        { kind: 'det', matrix: 'A', equals: '36' },
      ],
    },
  },
  'd3-determinant-properties': {
    gist: 'Determinant özellikleri: sınav soruları hesap istemez.',
    points: [
      'İki satır yer değiştirir: $-1$ ile çarpılır. Bir satır $k$ ile çarpılır: $k$ ile çarpılır.',
      'Bir satıra başka satırın katı eklenir: değişmez. Sıfır ya da orantılı satır: $|A| = 0$.',
      '$|kA| = k^n|A|$ ($n$ matrisin boyutu). $|A^T| = |A|$.',
      '$|AB| = |A||B|$, $|A^{-1}| = \\dfrac{1}{|A|}$. Satır kuralları sütunlar için de geçerli.',
    ],
    trap: '$|kA| = k|A|$ değildir; 3×3 için $k^3$. $|A + B| = |A| + |B|$ da değildir.',
    example: {
      matrices: {
        A: m('A =', [
          ['1', '0', '0'],
          ['0', '2', '0'],
          ['0', '0', '1'],
        ]),
      },
      show: ['A'],
      line: '$|A| = 2$ ise 3×3 için $|2A| = 2^3 \\cdot 2 = 16$.',
      claims: [
        { kind: 'det', matrix: 'A', equals: '2' },
        { kind: 'detProduct', scalar: '2', factors: [{ matrix: 'A' }], equals: '16' },
      ],
    },
  },
  'd4-adjugate-inverse': {
    gist: 'Ek matris ve ters matris formülü.',
    points: [
      '$\\text{Ek}(A) = [C_{ij}]^T$: kofaktör matrisinin transpozu.',
      '$A \\cdot \\text{Ek}(A) = |A|\\,I$, bu yüzden $A^{-1} = \\dfrac{1}{|A|}\\text{Ek}(A)$ ($|A| \\neq 0$).',
      '$(A^{-1})_{ij} = \\dfrac{C_{ji}}{|A|}$: tek elemanı hızlı bulmak için.',
      '$|\\text{Ek}(A)| = |A|^{n-1}$, $|A^{-1}| = \\dfrac{1}{|A|}$.',
      '2×2: köşegeni değiştir, diğer ikisinin işaretini çevir, $|A|$’ya böl.',
    ],
    trap: 'Transpozu unutmak: $\\text{Ek}(A)$’nın $(1,2)$ elemanı $C_{21}$. Kontrol: $A \\cdot \\text{Ek}(A) = |A|I$.',
    example: {
      matrices: {
        A: m('A =', [
          ['1', '2', '0'],
          ['-1', '1', '2'],
          ['3', '0', '1'],
        ]),
        E: m('Ek(A) =', [
          ['1', '-2', '4'],
          ['7', '1', '-2'],
          ['-3', '6', '3'],
        ]),
      },
      show: ['A', 'E'],
      line: '$|A| = 15$, $(A^{-1})_{12} = \\dfrac{-2}{15}$.',
      claims: [
        { kind: 'det', matrix: 'A', equals: '15' },
        {
          kind: 'derived',
          of: 'adjugate',
          matrix: 'A',
          equals: [
            ['1', '-2', '4'],
            ['7', '1', '-2'],
            ['-3', '6', '3'],
          ],
        },
        { kind: 'derivedEntry', of: 'inverse', matrix: 'A', row: 1, col: 2, equals: '-2/15' },
      ],
    },
  },
  'm11-regular-singular': {
    gist: 'Regüler ve singüler: tersi var mı?',
    points: [
      'Regüler: tersi var. Singüler: tersi yok.',
      'Hepsi birbirine denk: regüler $\\iff |A| \\neq 0 \\iff$ rank $n \\iff Ax = 0$’ın yalnız aşikâr çözümü var.',
      '$AB$ regüler $\\iff$ $A$ ve $B$ regüler. Tek singüler çarpan çarpımı singüler yapar.',
    ],
    trap: 'Toplam için böyle bir kural yok: iki regülerin toplamı singüler olabilir.',
    example: {
      matrices: {
        B: m('B =', [
          ['1', '3'],
          ['2', '6'],
        ]),
      },
      show: ['B'],
      line: '2. sütun 1. sütunun $3$ katı: $|B| = 0$, singüler.',
      claims: [
        { kind: 'det', matrix: 'B', equals: '0' },
        { kind: 'property', expr: 'B', is: 'singular' },
      ],
    },
  },
  'r4-inverse': {
    gist: 'Ters matris: Gauss-Jordan ve özdeşlikler.',
    points: [
      '$[A \\mid I] \\to [I \\mid A^{-1}]$: önce köşegenin altını, sonra üstünü sıfırla, pivotları $1$ yap.',
      'Solda sıfır satır çıkarsa $|A| = 0$, ters yok.',
      '$(AB)^{-1} = B^{-1}A^{-1}$, $(A^T)^{-1} = (A^{-1})^T$, $(kA)^{-1} = \\frac{1}{k}A^{-1}$.',
      'Özdeşlikten ters: $I$’lı terimi yalnız bırak, $A$’yı parantez al; $2A^3 - 5A + 3I = 0 \\Rightarrow A^{-1} = \\frac{1}{3}(5I - 2A^2)$.',
    ],
    trap: 'Çarpımın tersinde sıra ters döner: $(AB)^{-1} = A^{-1}B^{-1}$ yanlış.',
    example: {
      matrices: {
        A: m('A =', [
          ['1', '2'],
          ['3', '7'],
        ]),
        I: m('A⁻¹ =', [
          ['7', '-2'],
          ['-3', '1'],
        ]),
      },
      show: ['A', 'I'],
      line: '$|A| = 1$, ters bir bakışta: köşegeni değiştir, diğer ikisinin işaretini çevir.',
      claims: [
        { kind: 'det', matrix: 'A', equals: '1' },
        {
          kind: 'derived',
          of: 'inverse',
          matrix: 'A',
          equals: [
            ['7', '-2'],
            ['-3', '1'],
          ],
        },
      ],
    },
  },
  's1-linear-systems': {
    gist: 'Doğrusal sistem: $[A \\mid b]$ eşelon forma, rankla oku.',
    points: [
      '$Ax = b \\to [A \\mid b]$ → satır işlemleri → eşelon form → sondan geri yerine koy.',
      '$r_A$: çizginin solundaki pivotlar. $r_B$: $[A \\mid b]$’deki pivotlar. $n$: bilinmeyen sayısı.',
      '$r_A < r_B$: çözüm yok. $r_A = r_B = n$: tek çözüm.',
      '$r_A = r_B < n$: sonsuz çözüm; $n - r_A$ serbest değişken.',
    ],
    trap: '$[0\\ 0\\ 0 \\mid 1]$ satırı $0 = 1$ demektir: çözüm yok.',
    example: {
      matrices: {
        U: augmented('$[A \\mid b]$ =', [
          ['1', '2', '-1', '3'],
          ['2', '5', '1', '7'],
          ['1', '3', '3', '4'],
        ]),
      },
      show: ['U'],
      line: '$r_A = r_B = 3 = n$: tek çözüm.',
      claims: [
        { kind: 'rank', matrix: 'U', columns: 3, equals: '3' },
        { kind: 'rank', matrix: 'U', equals: '3' },
        { kind: 'system', matrix: 'U', is: 'unique' },
      ],
    },
  },
  's2-parametric-systems': {
    gist: 'Parametreli sistem: önce determinant, sonra kritik değerler.',
    points: [
      'Kare sistemde $|A|$’yı $k$ cinsinden yaz, köklerini bul.',
      'Kök olmayan her $k$: tek çözüm.',
      'Her kökü ayrı ayrı yerine koy, $r_A$ ile $r_B$’yi karşılaştır: sonsuz çözüm ya da çözüm yok.',
    ],
    trap: '$|A| = 0$ “çözüm yok” demek değildir. Sağ tarafa bakmadan karar verme.',
    example: {
      matrices: {
        K: m('A =', [
          ['k', '1', '1'],
          ['1', 'k', '1'],
          ['1', '1', 'k'],
        ]),
      },
      show: ['K'],
      line: '$|A| = (k-1)^2(k+2)$: kritik değerler $k = 1$ ve $k = -2$.',
      claims: [
        { kind: 'detRoots', matrix: 'K', variable: 'k', roots: ['1', '-2'] },
        { kind: 'det', matrix: 'K', at: { k: '3' }, equals: '20' },
      ],
    },
  },
  's3-homogeneous-systems': {
    gist: 'Homojen sistem $Ax = 0$: aşikâr çözüm her zaman var.',
    points: [
      '$x = 0$ her zaman çözümdür (aşikâr, trivial). $r_A = r_B$ her zaman.',
      'Aşikâr olmayan çözüm $\\iff r_A < n$; kare ise $\\iff |A| = 0$.',
      'Bilinmeyen sayısı denklem sayısından fazlaysa her zaman sonsuz çözüm.',
      'Serbest değişken sayısı $n - r_A$.',
    ],
    trap: '“Çözüm yok” şıkkı homojen sistemde her zaman yanlıştır.',
    example: {
      matrices: {
        H: m('A =', [
          ['2', '3', '1'],
          ['1', '0', '3'],
          ['0', '1', '2'],
        ]),
      },
      show: ['H'],
      line: '$|A| = -11 \\neq 0$, rank $3$: yalnız aşikâr çözüm.',
      claims: [
        { kind: 'det', matrix: 'H', equals: '-11' },
        { kind: 'rank', matrix: 'H', equals: '3' },
      ],
    },
  },
  's4-cramer': {
    gist: 'Cramer kuralı: iki determinantla tek bilinmeyen.',
    points: [
      'Kare sistem, $|A| \\neq 0$: $x_i = \\dfrac{|A_i|}{|A|}$.',
      '$A_i$: $A$’nın $i.$ sütunu yerine $b$ yazılmış hali.',
      'Tek bilinmeyen soruluyorsa yalnız o determinantı hesapla.',
    ],
    trap: '$|A| = 0$ ise Cramer çalışmaz; ranklara bak: çözüm yok ya da sonsuz.',
    example: {
      matrices: {
        A: m('A =', [
          ['2', '1'],
          ['1', '-3'],
        ]),
        X: m('$A_x$ =', [
          ['5', '1'],
          ['-1', '-3'],
        ]),
        Y: m('$A_y$ =', [
          ['2', '5'],
          ['1', '-1'],
        ]),
      },
      show: ['A', 'X', 'Y'],
      line: '$b = (5, -1)$. $x = \\dfrac{-14}{-7} = 2$, $y = \\dfrac{-7}{-7} = 1$.',
      claims: [
        { kind: 'det', matrix: 'A', equals: '-7' },
        { kind: 'det', matrix: 'X', equals: '-14' },
        { kind: 'det', matrix: 'Y', equals: '-7' },
      ],
    },
  },
  'x1-big-connection': {
    gist: 'Kare matriste tek bir bilgi bütün listeyi söyler.',
    points: [
      'Regüler $\\iff |A| \\neq 0 \\iff$ rank $n \\iff$ indirgenince $I$.',
      'Regüler $\\iff Ax = 0$ yalnız aşikâr çözüm $\\iff Ax = b$ her $b$ için tek çözüm $\\iff A^{-1}$ var.',
      'Singüler: hepsi tersine döner. $|A| = 0$, rank $< n$, sıfır satır, $Ax = 0$ sonsuz çözüm.',
      'Şıkta bir halkayı bilince diğerlerini hesaplamadan ele.',
    ],
    trap: '$|A| = 0$ "çözüm yok" demez: $Ax = b$ çözümsüz ya da sonsuz olur, tek çözüm olmaz.',
    example: {
      matrices: {
        S: m('S =', [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ]),
      },
      show: ['S'],
      line: '$|S| = 0$, rank $2 < 3$: $S$ singüler, tersi yok, $Sx = 0$ sonsuz çözümlü.',
      claims: [
        { kind: 'det', matrix: 'S', equals: '0' },
        { kind: 'rank', matrix: 'S', equals: '2' },
      ],
    },
  },
  'x2-exam-tactics': {
    gist: 'Çoktan seçmelide şıklar da bilgidir: önce kısa yolu dene.',
    points: [
      'Çözüm sorulursa şıkları denkleme koy. Çarpımda önce tipleri yaz.',
      'Sıfır ya da orantılı satır: $|A| = 0$. Üçgenselde köşegen çarpımı.',
      'Açarken en çok sıfırlı satır ya da sütunu seç.',
      'Parametreli sistemde $|A| = 0$ köklerini bul, her kökü ayrı dene.',
      'Büyük Bağlantı ile aynı cümledeki şıkları ele.',
    ],
    trap: '$|kA| = k^n |A|$: $3 \\times 3$ matriste $|2A| = 8|A|$, $2|A|$ değil.',
    example: {
      matrices: {
        A: m('A =', [
          ['2', '0', '0'],
          ['0', '2', '0'],
          ['0', '0', '1'],
        ]),
      },
      show: ['A'],
      line: '$|A| = 4$ ise $|2A| = 2^3 \\cdot 4 = 32$.',
      claims: [
        { kind: 'det', matrix: 'A', equals: '4' },
        { kind: 'detProduct', scalar: '2', factors: [{ matrix: 'A' }], equals: '32' },
      ],
    },
  },
}

/** A lesson's summary, or undefined while it has none. */
export function summaryOf(lessonId: string): Summary | undefined {
  return summaries[lessonId]
}
