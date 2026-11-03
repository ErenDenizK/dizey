# Lecturer notes check: do our 23 lessons say what she says?

- Date: 2026-11-03
- Asked by: parent thread, for the last days before Vize 1 (Fri 20 Nov 2026): compare every existing lesson with the
  lecturer's slides and board photos and fix what differs.

## 1. Question

For MAT1320 Vize 1 the lecturer's definitions, notation and conventions are canonical (Eren's own word choices
singüler, rank, eşelon form and involutive override her wording). Where do our lessons differ from her, and which
differences could cost a mark?

## 2. Sources opened (raw course material, project files, not committed)

- Slides, Dr. Eda Yıldız Yılmaz, 2026-2027 Güz: "Matrislere Giriş ve Bazı Özel Matrisler" (90 slides) and
  "Matrislerde Elemanter İşlemler, Eşelon Form, Rank, Ters, Determinant" (90 slides). Read as text; the exercise
  matrices were checked against the text extraction.
- Board photos `tahta-fotograflari/` (read as images): `01-ek-matris-ters` (Ek(A) = [C_ij]ᵀ, A⁻¹ = Ek(A)·1/|A|,
  |A⁻¹| = 1/|A|, the 3×3 example with |A| = 15), `02-sistemler-rank-esalon` (augmented matrices, r_A and r_B, free
  variables, the "indirgenmiş forma getirilebilir" step, the start of homogeneous systems), `03-homojen-cramer` (Ax = 0,
  aşikâr (trivial) solution, "r_A = r_B her zaman doğru", "r_A = n olup olmadığına bakılır", Cramer written as the next
  heading but not yet on the board), and the three `orijinal-tahta-*` originals (same boards).
- Our lessons: the 23 files in `src/content/lessons/`, read as the text a student sees (titles, bodies, solutions,
  summaries), with the claims already recomputed by `lessons.test.ts`.

Not covered by anything we hold: the lecturer's treatment of Sarrus, Cramer's rule, parametric systems and the
Büyük Bağlantı Teoremi beyond one slide (slide 82). Those lessons were checked against past exams
(`past-exam-analysis.md`) only.

## 3. Method

Each lesson's definitions, theorem statements, notation, terminology and examples were set against the same topic in
the slides and boards. The lecturer's own worked examples were recomputed (all correct): the slide 78-79 determinant
by row operations (|A| = 1), the board's 3×3 inverse (|A| = 15, Ek(A) = [[1, −2, 4], [7, 1, −2], [−3, 6, 3]]; it is
now also the d4 summary example and is verified by the summary test), the board's three systems (unique (2, −1, 3);
rank 2 with one free variable; the trivial-solution system), and the slide 2×2 inverse.

Classes: (1) mathematical error, (2) definition, convention or notation differs, (3) she covers something we do not
teach, (4) we teach something outside her scope, (5) style only.

## 4. Findings

Counts: class 1: 0; class 2: 3 differences, all fixed (M3, R1, S3), plus six places where she and we agree and the
table says so (M8, M9, R2, D2, D4, S1); class 3: 8 (M1, M4, M5, M10, R1 column operations, R2 method names, R3, R4), of
which 1 became a lesson sentence (R3), 4 are covered by the new summaries and formula sheet (M5, R1, R2, R4) and 3
are left (M1, M4, M10); class 4: 6 (M2 triangular, M3 tr(AB) = tr(BA), D1 Sarrus, D4 |Ek(A)|, S2, S4), kept because
past exams ask them; class 5: 5 (spellings and term choices).

| Lesson | Class | Finding | Outcome |
| --- | --- | --- | --- |
| M1 | 3 | "Satır/sütun matrisi", "kare", "dikdörtgen" terms: only "dikdörtgen matris" is missing. | Left: not an exam question; one word. |
| M2 | 4 | Upper/lower triangular and "hem alt hem üst üçgen = köşegen" are not on her slides (she uses "üçgensel" only for determinants). | Kept: needed by D2 (triangular determinant) and past exams. |
| M2 | 3 | She stresses the diagonal of a diagonal matrix may contain zeros. | Already in the summary trap; lesson text already says "dışı 0". |
| M3 | 2 | **Notation.** She and the exams write tr(A); our lesson wrote iz(A). | **Fixed:** lesson M3 and one question file now write tr(A); the lesson says "yazılışı tr(A)". |
| M3 | 4 | tr(AB) = tr(BA) is not on her slides (slide 22 lists linearity and tr(Aᵀ)). | Kept: 3 of 34 past items are trace items and that one is the classic trap. |
| M4 | 3 | Commutative, associative, distributive laws of matrix addition and scalar multiplication, 0A = 0, A − B = A + (−B). | Listed, not added: trivial and never asked. |
| M5 | 3 | Associativity and distributivity of the product, AI = IA = A, A0 = 0. | Associativity, distributivity and AI = A are now in the M5 summary; lesson steps unchanged. |
| M5 | 5 | She writes "A_{2×3}B_{2×2}"; we write "(3×2)(2×4)". | Same rule. |
| M6 | none | (Aᵀ)ᵀ, (A + B)ᵀ, (λA)ᵀ, (AB)ᵀ = BᵀAᵀ all match. | None. |
| M7 | 5 | She writes "anti simetrik"; Eren and we write "antisimetrik". | Kept (Eren's choice is a plain spelling). |
| M8 | 2 | **Periodic.** Her definition: A^{k+1} = A for a positive integer k; k = 1 gives the idempotent case. Ours matches (period = smallest k, idempotent has period 1). Her example diag(1, −1) has A³ = A, so period 2 and also involutive. | No change needed; confirmed. |
| M8 | 5 | She writes "involutory (involut)"; Eren's override is "involutive", which we use. | Kept. |
| M9 | 2 | Orthogonal: she defines it for real square matrices, QᵀQ = I, equivalently Q⁻¹ = Qᵀ; ours matches. | None. |
| M10 | 3 | Properties of the plain conjugate: conj(A + B), conj(λA), conj(AB) = Ā·B̄ (slide 69). The lesson teaches (AB)* = B*A* but not these three. | Listed: never asked in the past exams we hold. |
| M10 | 5 | She also says "ters Hermitian (skew-Hermitian)"; we use the same. | None. |
| M11 | 2 | Regular/singular definitions (inverse exists / does not) match. | None. |
| R1 | 2 | **Equivalence.** She separates "satırca denk" (A ∼r B, row operations only, preserves solutions) from general "denk" (row and column operations, preserves rank), and says column operations keep the rank but do not keep the variables of Ax = b. Our lesson wrote one "denk A ∼ B" for row operations only and never mentioned column operations. | **Fixed:** one sentence added to the R1 "Denk matrisler" step: column operations also keep the rank, but use only row operations on a system. Summary says the same. |
| R1 | 3 | Column operations Cᵢ ↔ Cⱼ, kCᵢ, Cᵢ + kCⱼ as named operations. | Named on the formula sheet; no lesson step. |
| R2 | 2 | **Echelon form.** Her REF: zero rows last, each pivot right of the one above, entries below a pivot zero; pivots need not be 1 (slide example has a pivot 5). RREF: pivots 1 and alone in their column. REF is not unique, RREF is. Ours matches word for word. Her board examples scale to 1 on the way, which is a habit, not a rule. | None; the summary states "pivotun 1 olması gerekmez" as a trap. |
| R2 | 3 | Gauss = REF, Gauss-Jordan = RREF as named methods (slides 31-32). | Both names now in the R2 summary. |
| R3 | 3 | She defines rank as the dimension of the row space (maximum independent rows), proves row rank = column rank, and names "tam rank" (rank = min(m, n)). We define by pivot count (consistent) and did not say row rank = column rank or "tam rank". | **Added** one sentence to R3 step "bounds": row rank = column rank, full rank. |
| R3 | 4 | Rank ⇔ |A| ≠ 0 for square matrices: she mentions it too (slide 48, 81); fine. | None. |
| D1 | 4 | **Sarrus** is not on her slides (she computes 3×3 by Laplace and row reduction). | Kept: past exams use it; flagged in the summary as "yalnız 3×3". |
| D1 | 3 | Geometric meaning: |det| > 1 enlarges, < 1 shrinks, det < 0 reverses orientation. The lesson has the area and the sign remark. | None. |
| D2 | 2 | Minor Mᵢⱼ, cofactor Cᵢⱼ = (−1)^{i+j}Mᵢⱼ, Laplace along any row or column, "choose the row with most zeros": all match, same letters. | None. |
| D3 | 3 | Row/column of zeros, equal or dependent rows give 0; |kA| = kⁿ|A|; |Aᵀ|, |AB|, |A⁻¹|; effect of each row operation: all in the lesson. | None. |
| D4 | 2 | **Ek(A).** Board: Ek(A) = [C_ij]ᵀ, A⁻¹ = Ek(A)·1/|A|, |A⁻¹| = 1/|A|, and "|A| = 0 ⇒ A⁻¹ yok; A⁻¹ varsa |A| ≠ 0". Ours uses the same symbol and formula. | None. |
| D4 | 4 | A·Ek(A) = |A|I and |Ek(A)| = |A|^{n-1} are not on the board. | Kept: standard exam items (adjugate determinant). |
| R4 | 3 | She also writes the solution x = A⁻¹b for Ax = b (slide 52) and the inverse properties (AB)⁻¹, (A⁻¹)⁻¹, (Aᵀ)⁻¹. R4 teaches the properties but not x = A⁻¹b. | Listed; x = A⁻¹b is on the formula sheet and checked there. |
| S1 | 2 | Notation r_A, r_B, "genişletilmiş matris", r_A = r_B ⇒ solution, r_A < n ⇒ n − r_A free variables: all match the board. | None. |
| S1 | 3 | The board's "eşelon formda" examples carry a 1 in every pivot position; ours too. | None. |
| S2 | 4 | Parametric systems are not on her slides or boards. | Kept: three past-exam items. |
| S3 | 2 | **Terms.** Board: "aşikar (trivial) çözüm"; "r_A = r_B her zaman doğru"; "r_A = n olup olmadığına bakılır". Ours said "aşikâr" without "trivial". | **Fixed:** "aşikâr (trivial) çözüm" in the lesson; "r_A = r_B her zaman" is in the S3 summary. |
| S3 | 5 | Spelling "aşikâr" (with the circumflex) against her "aşikar". | Kept; the circumflex is standard Turkish. |
| S4 | 4 | Cramer's rule: she wrote the heading on the last board but the formula is not on the photos. | Kept: standard form x_i = |A_i|/|A|, checked by the summary test. |
| all | 5 | Lecturer writes "rang"; Eren's term "rank" used everywhere (and "tekil" vs "singüler"). | Kept (Eren's override). |

Not in any lesson but in her slides, kept out on purpose: all vector-space topics, null space, engineering
applications (circuits, sensors, adjacency matrices), condition number. They are outside the Midterm 1 syllabus the
parent gave (vectors excluded) or not examinable.

## 5. What was changed

Class 2, fixed in the lesson files (claims and tests untouched):

1. M3 and `vize1-practice-b`: iz(A) → tr(A), with the lecturer's symbol introduced in the definition step.
2. R1 "Denk matrisler": column operations also preserve rank but are not used on systems.
3. S3: "aşikâr (trivial) çözüm", the pairing the board uses.

Class 3, one short addition: R3 "satır rankı = sütun rankı" and "tam rank". The summaries and the formula sheet carry M5
laws, column operations, Gauss and Gauss-Jordan, and x = A⁻¹b.

Everything else is left. The remaining class 3 items (M4 laws, M10 conjugate rules, "dikdörtgen") are either trivial
or have never been asked in the 34 items we hold; the class 4 items stay because past exams ask them.

## 6. Open questions

- The lecturer's exam may print tr(A) and "aşikar çözüm"; both now appear verbatim. If Eren hears her use "rang" or
  "tekil" in the exam, nothing needs to change in the app, but the questions are written with his terms.
- Sarrus, parametric systems and Cramer come from past exams, not from her notes. If she announces they are out of
  scope, the summaries and the formula sheet can drop them by deleting the entries (they are data, not code).
