# MAT1320 Vize 1 topic map

Status: draft, 2026-10-30. Exam priorities: see `docs/research/past-exam-analysis.md`.

## Sources

Primary (used):
- Lecturer notes 1, "Matrislere Giriş ve Bazı Özel Matrisler", Dr. Eda Yıldız Yılmaz, 2026-27 Fall (90 slides).
- Lecturer notes 2, "Matrislerde Elemanter İşlemler, Eşelon Form, Rank, Ters Matris ve Determinantlar" (90 slides).
- Three whiteboard photos, 2026-10-27: adjoint inverse, systems with r_A / r_B, homogeneous systems, start of Cramer.

Format: multiple choice (Eren, 2026-10-30). Exam date not fixed yet (Eren, 2026-10-30): midterm week starts around
2026-11-15 and Linear Algebra is likely around 2026-11-18 to 2026-11-20. Plan for 2026-11-15; show no countdown to an
exact date until the date is confirmed.

## Nodes

Every node answers part of one question: is Ax = b solvable, and is the solution unique?

| ID | Topic | Prerequisites | Exam focus | Understanding focus | Typical error |
|---|---|---|---|---|---|
| M1 | Reading a matrix: size, a_ij | - | size and entry questions | data / model / transformation | swapping m×n and n×m |
| M2 | Basic types: row, column, zero, square, diagonal, scalar, identity, triangular | M1 | identity ⊂ scalar ⊂ diagonal ⊂ square | a matrix can be in several classes | treating classes as disjoint |
| M3 | Trace and properties | M2 | tr(A+Aᵀ), tr(AB) = tr(BA) | square only | trace of a non-square matrix |
| M4 | Equality, sum, difference, scalar multiple | M1 | solve 2A − 3B = 4C for entries | size check first | skipping the size check |
| M5 | Matrix product and powers | M4 | single entry of AB, A², A³ | product = applying a transformation; AB ≠ BA | AB = 0 ⇒ A = 0 or B = 0 |
| M6 | Transpose and properties | M5 | (AB)ᵀ = BᵀAᵀ | why the order reverses | keeping the order |
| M7 | Symmetric, antisymmetric | M6 | which expression is antisymmetric; A = S + K | antisymmetric diagonal is 0 | sign slips |
| M8 | Periodic, idempotent, nilpotent, involutory | M5 | derive from A² = A | projection, reflection | mixing definitions |
| M9 | Orthogonal | M6 | QᵀQ = I, det = ±1 | rotations and reflections keep length | forgetting Q⁻¹ = Qᵀ |
| M10 | Conjugate, A*, Hermitian, skew-Hermitian | M6 | definition checks, (AB)* = B*A* | complex generalization of symmetry | forgetting to conjugate |
| M11 | Regular and singular | M5 | does an inverse exist | information loss | - |
| R1 | Elementary row and column operations, equivalent matrices | M4 | effect of each operation | why row ops keep the solution set | forgetting the right-hand side; scaling by 0 |
| R2 | REF, RREF, Gauss, Gauss-Jordan | R1 | fast, tidy elimination | REF is not unique, RREF is | sign slips below the pivot |
| R3 | Rank ("rang") | R2 | count pivots | number of independent pieces of information; row rank = column rank | going to RREF when REF is enough |
| R4 | Inverse: [A \| I], 2×2 formula, inverse from a polynomial identity | R2, M11 | (Aᵀ − 4I)⁻¹; A⁻¹ from 2A³ − 5A + 3I = 0 | inverse = undo | order in (AB)⁻¹ |
| D1 | Determinant: 2×2, Sarrus, geometric meaning | M5 | fast 3×3 | area/volume scale, sign = orientation | Sarrus on 4×4 |
| D2 | Minor, cofactor, Laplace expansion | D1 | pick the row/column with most zeros | why the sign pattern exists | (−1)^(i+j) |
| D3 | Determinant properties | D2, R1 | effect of row ops; det(kA) = kⁿ det A; \|3AᵀBA⁻¹B⁻¹A\| style | det tests independence | k instead of kⁿ; lost sign on swap |
| D4 | Adjoint Ek(A) = [C_ij]ᵀ, A⁻¹ = Ek(A)/\|A\| | D2, R4 | Ek(A); A·Ek(A) = \|A\|I; \|A⁻¹\| = 1/\|A\| | where the inverse formula comes from | forgetting the transpose |
| S1 | Ax = b, augmented matrix, r_A and r_B | R3 | r_A = r_B ⇒ solvable; r_A = n ⇒ unique | three outcomes: one, none, infinitely many | free variable count n − r |
| S2 | Parametric (k) systems | S1, D3 | case table in k | planes intersecting | missing a case |
| S3 | Homogeneous systems | S1 | trivial solution always exists; non-trivial ⇔ r_A < n | solution set is a subspace | answering "no solution" |
| S4 | Cramer, X = A⁻¹B | D4, S1 | x_i = \|A_i\| / \|A\| | when (not) to use it | Cramer with \|A\| = 0 |
| X1 | Invertible matrix theorem ("Büyük Bağlantı Teoremi") | all | one statement eliminates many options | invertible ⇔ det ≠ 0 ⇔ rank = n ⇔ Ax = 0 only trivial ⇔ independent columns | - |
| X2 | Exam tactics (plug in options, size check, fast determinant routes, \|kA\| = kⁿ\|A\|, k-system tables, killing options with X1) | X1, S2 | work back from the options | - | - |

## Notation (lecturer's, adopt as is)

- |A| and det(A); Ek(A) for the adjoint; r_A (coefficient matrix rank), r_B (augmented matrix rank).
- R_i rows, C_i columns in elementary operations; C_ij also means cofactor. Disambiguate by context, do not rename.
- Turkish terms: "rang", "eşelon", "aşikar (trivial) çözüm". English term shown as a note at first use.

## Scope

No scope announcement from the lecturer (Eren, 2026-10-30). Working scope: syllabus weeks 1-6, the nodes above.
"Vektörler" (syllabus week 8) stays out; revisit if the lecturer announces otherwise.

## Open

- Exact exam date (Eren will tell us once it is announced).
