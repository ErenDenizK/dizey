# Past-exam analysis: MAT1320 Midterm 1

## Question

What do real Midterm 1 exams ask, in what format, and how reliable are the answer keys we hold? Feeds topic
priorities in `docs/curriculum/vize1-topic-map.md`, distractor design (decision 0002) and the question bank.

## Sources (project files, uploaded by Eren 2026-10-30, not committed)

Real Midterm 1 papers (34 items):
- 2024 summer school midterm: 18 multiple-choice items, 5 options, phone photos (3 pages), no key.
- 2017 spring midterm (21.04.2017, 90 min): 5 open items, handwritten solutions.
- 2019 spring midterm (12.04.2019, 80 min): 4 open items, handwritten solutions with grading.
- 2019 fall midterm (08.11.2019, English section, 80 min): 7 open items, handwritten solutions.

Practice material: two keyed multiple-choice banks ("A": 10 items + twins; "B": 7 items + twins within Midterm 1
scope, plus vector-space items), one solved prep set (15 items), and a booklet compiled by an earlier side project.
The same archive also holds make-up and final papers (not Midterm 1) and unrelated courses; those were not used.

Method: every answer and every handwritten solution step that leads to a result was recomputed with SymPy. Booklet
transcriptions were compared against the original scans. The archive was checked for embedded instructions; none
were found.

## Findings

Topic frequency over the 34 real items (node IDs from the topic map; an item may touch two nodes, counted once
under its main node):

| Block | Items | Exams |
| --- | --- | --- |
| Determinant: cofactor, properties, adjoint (D2-D4) | 12 | all four |
| Special matrices (M7-M9) | 7 | all four |
| Inverse (R4) | 5 | 2024, 2017, 2019 fall |
| Matrix operations and product (M4-M5) | 4 | 2024, 2019 fall |
| Parametric systems (S2) | 3 | 2024, 2017, 2019 spring |
| Trace (M3) | 3 | 2024, 2019 fall |
| Homogeneous systems (S3) | 2 | 2024, 2017 |
| Cramer (S4), standalone rank/echelon (R2-R3), Hermitian (M10) | 0 | practice banks only |

- Format moved from 4-7 open items (2017, 2019) to 18 multiple-choice items (2024). This year's format is not
  confirmed.
- Most 2024 items are solvable in 1-3 minutes by properties rather than computation, above all determinant
  properties (D3). D3 is the top exam-line priority.
- Distractors already encode error types. Example, 2024 item 3 (|3AᵀBA⁻¹B⁻¹A|, answer 36): 4 = forgot the 3²,
  12 = used 3 instead of 3², 9 and 8 = partial products.

Independently derived key for the 2024 summer midterm: 1e, 2b, 3b, 4c, 7b, 8c, 9e, 11d, 12c, 13b, 15b, 16c, 17e, 18c.
Items 5, 6 and 14 are cut off in the photos; item 10 is defective (below).

Defects found:

| Source | Defect | Action |
| --- | --- | --- |
| 2024 summer, item 10 | With A antisymmetric, B symmetric, AB = BA, options a, b, c and e are all antisymmetric; only d is not. Likely intended "which is not antisymmetric" | Use only in corrected form |
| 2024 summer, items 5, 6, 14 | Cropped; item 6's answer depends on the cut statement (c or d) | Do not use until a full photo exists |
| Bank B, item 6 and its twin | Two options are numerically equal (B and E = −1; C and D = 2); key picks the Cramer form | Rewrite before use |
| Solved prep, "inverse is unique" proof | Boxed result reads B = I; correct is B = D | Fix if reused |
| Solved prep, solve with A⁻¹ | Ek(A) entry (3,1) written −2, correct 2; final answer (2, 0, −1) still right | Fix if reused |
| Bank B, items 8-11 | Vector spaces: outside Midterm 1 scope | Keep for Midterm 2 |

Everything else checked out: bank A (20 keyed answers), bank B (13 in-scope keyed answers), the handwritten solutions
of all three classic midterms, the booklet's transcriptions and its key.

## Taken

- Topic priorities: D3 first; then special matrices, inverse, parametric systems.
- Real exam items, corrected where listed above, as the seed of the question bank and of error-type distractors.
- Old-app screenshots: the math is correct; error-specific feedback matches decision 0003.

## Rejected

- The booklet's exam date and scope header as fact: still unverified.
- An in-lesson "3 in a row" streak message seen in old-app screenshots: conflicts with decision 0003.

## Open

- Full photos of 2024 items 5, 6, 14.
- This year's exam format and whether vectors are in scope.
