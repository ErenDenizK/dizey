import type { FormulaGroup } from './types'

/**
 * The formula sheet: every Vize 1 formula and rule, grouped by chapter (the path's chapters), in the lecturer's
 * notation (|A|, Ek(A), r_A and r_B, R_i, C_i). A formula with a `law` is an identity formulas.test.ts checks on
 * concrete matrices; the rest are definitions or conditions.
 */
export const formulaGroups: readonly FormulaGroup[] = [
  {
    id: 'matrices',
    title: 'Matrisler',
    formulas: [
      { tex: '$a_{ij}$', note: '$i.$ satır, $j.$ sütun. $m \\times n$: $m$ satır, $n$ sütun.' },
      { tex: '$(m \\times n)(n \\times p) = m \\times p$', note: 'İçteki sayılar eşit olmalı.' },
      { tex: '$(AB)_{ij} = \\sum_k a_{ik}b_{kj}$', note: '$A$’nın $i.$ satırı çarpı $B$’nin $j.$ sütunu.' },
      { tex: '$AB \\neq BA$', note: 'Genelde. $AB = 0$ iken $A = 0$ ya da $B = 0$ gerekmez.' },
      { tex: '$(A + B)^T = A^T + B^T$', law: 'sum-transpose' },
      { tex: '$(kA)^T = kA^T$', law: 'scalar-transpose' },
      { tex: '$(AB)^T = B^TA^T$', note: 'Sıra ters döner.', law: 'product-transpose' },
      { tex: '$\\text{tr}(A) = a_{11} + \\cdots + a_{nn}$', note: 'Yalnız kare matris.' },
      {
        tex: '$\\text{tr}(AB) = \\text{tr}(BA)$',
        note: '$\\text{tr}(A)\\,\\text{tr}(B)$ değil.',
        law: 'trace-product',
      },
      {
        tex: '$\\text{tr}(A^T) = \\text{tr}(A)$',
        note: '$\\text{tr}(kA) = k\\,\\text{tr}(A)$, $\\text{tr}(I_n) = n$.',
        law: 'trace-transpose',
      },
      { tex: 'Simetrik: $A^T = A$', note: 'Antisimetrik: $A^T = -A$, köşegen $0$.' },
      { tex: 'İdempotent: $A^2 = A$', note: '$(A + I)^n = I + (2^n - 1)A$.', law: 'idempotent-power' },
      { tex: 'Involutive: $A^2 = I$', note: 'Yani $A^{-1} = A$.', law: 'involutory-inverse' },
      { tex: 'Nilpotent: $A^p = 0$', note: 'En küçük $p$ indeks. $|A| = 0$.' },
      { tex: 'Periyodik: $A^{k+1} = A$', note: 'En küçük $k$ periyot.' },
      { tex: 'Ortogonal: $A^TA = I$', note: '$A^{-1} = A^T$.', law: 'orthogonal-inverse' },
      { tex: 'Ortogonal: $|A| = \\pm 1$', law: 'orthogonal-det' },
      { tex: '$A^* = (\\bar{A})^T$', note: 'Hermitian: $A^* = A$. Ters Hermitian: $A^* = -A$.' },
      { tex: '$(AB)^* = B^*A^*$', law: 'conjugate-product' },
    ],
  },
  {
    id: 'row-operations',
    title: 'Satır işlemleri, eşelon form, rank',
    formulas: [
      {
        tex: '$R_i \\leftrightarrow R_j$, $R_i \\to kR_i$ ($k \\neq 0$), $R_i \\to R_i + kR_j$',
        note: 'Sütun işlemleri $C_i$ aynı biçimde; sütun işlemi de rankı korur.',
      },
      { tex: 'Eşelon form', note: 'Sıfır satırlar altta, pivotlar sağa kayar, pivotun altı $0$.' },
      { tex: 'İndirgenmiş eşelon form', note: 'Pivotlar $1$, pivot sütununda başka eleman $0$. Tektir.' },
      { tex: '$\\text{rank}(A)$ = pivot sayısı', note: 'Eşelon formdaki sıfır olmayan satır.' },
      { tex: '$\\text{rank}(A) \\leq \\min(m, n)$', law: 'rank-bound' },
      { tex: '$\\text{rank}(A^T) = \\text{rank}(A)$', law: 'rank-transpose' },
      { tex: '$\\text{rank}(A) = n \\iff |A| \\neq 0$', note: '$A$ $n \\times n$ ise tersinir.' },
    ],
  },
  {
    id: 'determinants',
    title: 'Determinant',
    formulas: [
      { tex: '$\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc$' },
      {
        tex: 'Sarrus (yalnız 3×3)',
        note: 'Sağa inen üç çarpımın toplamı eksi sola inen üç çarpımın toplamı.',
      },
      { tex: '$M_{ij}$', note: '$i.$ satır ve $j.$ sütun silinince kalanın determinantı.' },
      { tex: '$C_{ij} = (-1)^{i+j}M_{ij}$', note: 'İşaret: $+\\,-\\,+$ ile başlayan satranç tahtası.' },
      {
        tex: '$|A| = \\sum_j a_{ij}C_{ij}$',
        note: 'Herhangi bir satır ya da sütun boyunca.',
        law: 'laplace',
      },
      { tex: 'Üçgensel: $|A| = a_{11}a_{22}\\cdots a_{nn}$', law: 'triangular-det' },
      { tex: '$R_i \\leftrightarrow R_j$: $|B| = -|A|$', law: 'swap-det' },
      { tex: '$R_i \\to kR_i$: $|B| = k|A|$', law: 'scale-det' },
      { tex: '$R_i \\to R_i + kR_j$: $|B| = |A|$', law: 'add-det' },
      { tex: 'Sıfır ya da orantılı satır: $|A| = 0$' },
      { tex: '$|kA| = k^n|A|$', note: '$n$ matrisin boyutu.', law: 'scalar-det' },
      { tex: '$|A^T| = |A|$', law: 'transpose-det' },
      { tex: '$|AB| = |A||B|$', law: 'product-det' },
      { tex: '$|A^{-1}| = \\dfrac{1}{|A|}$', law: 'inverse-det' },
    ],
  },
  {
    id: 'inverse',
    title: 'Ek matris ve ters matris',
    formulas: [
      { tex: '$\\text{Ek}(A) = [C_{ij}]^T$', note: 'Kofaktör matrisinin transpozu.' },
      { tex: '$A \\cdot \\text{Ek}(A) = |A|\\,I$', law: 'adjugate-identity' },
      {
        tex: '$A^{-1} = \\dfrac{1}{|A|}\\text{Ek}(A)$',
        note: '$|A| \\neq 0$. $(A^{-1})_{ij} = C_{ji}/|A|$.',
        law: 'inverse-formula',
      },
      { tex: '$|\\text{Ek}(A)| = |A|^{n-1}$', law: 'adjugate-det' },
      {
        tex: '$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}^{-1} = \\dfrac{1}{ad - bc}\\begin{bmatrix} d & -b \\\\ -c & a \\end{bmatrix}$',
        law: 'inverse-2x2',
      },
      {
        tex: '$[A \\mid I] \\to [I \\mid A^{-1}]$',
        note: 'Solda sıfır satır çıkarsa ters yok.',
        law: 'gauss-jordan-inverse',
      },
      { tex: '$(AB)^{-1} = B^{-1}A^{-1}$', law: 'inverse-product' },
      { tex: '$(A^T)^{-1} = (A^{-1})^T$', law: 'inverse-transpose' },
      { tex: '$(kA)^{-1} = \\frac{1}{k}A^{-1}$', law: 'inverse-scalar' },
      {
        tex: 'Regüler $\\iff |A| \\neq 0 \\iff$ rank $n$',
        note: 'Singüler: $|A| = 0$, tersi yok. $AB$ regüler $\\iff$ ikisi de regüler.',
      },
    ],
  },
  {
    id: 'systems',
    title: 'Denklem sistemleri',
    formulas: [
      { tex: '$Ax = b \\to [A \\mid b]$', note: 'Satır işlemleriyle eşelon forma getir.' },
      { tex: '$r_A < r_B$', note: 'Çözüm yok.' },
      { tex: '$r_A = r_B = n$', note: 'Tek çözüm.' },
      { tex: '$r_A = r_B < n$', note: 'Sonsuz çözüm; $n - r_A$ serbest değişken.', law: 'free-variables' },
      { tex: '$x = A^{-1}b$', note: '$A$ kare ve regüler.', law: 'inverse-solution' },
      {
        tex: '$x_i = \\dfrac{|A_i|}{|A|}$',
        note: '$A_i$: $i.$ sütun yerine $b$. $|A| \\neq 0$.',
        law: 'cramer',
      },
      {
        tex: '$Ax = 0$',
        note: '$x = 0$ aşikâr çözüm her zaman var. Başka çözüm $\\iff r_A < n$ ($|A| = 0$).',
      },
      {
        tex: 'Bilinmeyen sayısı $>$ denklem sayısı',
        note: 'Homojen sistemde sonsuz çözüm.',
        law: 'homogeneous-wide',
      },
      {
        tex: 'Parametreli sistem',
        note: '$|A| = 0$ köklerini bul; her kökü ayrı yerine koyup $r_A$, $r_B$ karşılaştır.',
      },
    ],
  },
  {
    id: 'big-connection',
    title: 'Büyük Bağlantı Teoremi',
    formulas: [
      {
        tex: '$A$ regüler $\\iff |A| \\neq 0 \\iff$ rank $n \\iff A \\to I$',
        note: '$n \\times n$ $A$ için hepsi aynı cümle: biri doğruysa hepsi doğru.',
        law: 'big-connection',
      },
      {
        tex: '$\\iff Ax = 0$ yalnız $x = 0$ $\\iff Ax = b$ her $b$ için tek çözüm $\\iff A^{-1}$ var',
        note: 'Regüler tarafın devamı.',
      },
      {
        tex: '$A$ singüler $\\iff |A| = 0 \\iff$ rank $< n \\iff$ sıfır satır',
        note: 'Hepsi birden tersine döner: $Ax = 0$ sonsuz çözüm, $A^{-1}$ yok.',
      },
      {
        tex: '$Ax = b$, $|A| = 0$: çözümsüz ya da sonsuz',
        note: '"Tek çözüm yok" der, "çözüm yok" demez.',
      },
    ],
  },
]
