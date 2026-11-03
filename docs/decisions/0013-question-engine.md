# 0013: Question engine that verifies itself

- Status: accepted
- Date: 2026-11-01
- Ledger items: none yet (requested in the project thread: more Vize 1 style practice, determinants first)

## Context

The bank has 45 hand-written items, 6 on determinants, while past exams spent 13 of 34 items on determinants.
Writing more by hand is slow and each item risks a wrong number. A generated item is only worth having if it is
provably correct, every wrong option is a real student mistake with honest Turkish feedback, and it is
comfortable on a phone (Eren: solvable mentally or with little scratch work, fits 375 px).

## Options

| Option | For | Against |
| --- | --- | --- |
| Hand-write more items | Natural phrasing | Slow, numbers checked one by one |
| Generate on the fly in the app | Endless variety | Attempts and mistakes key on ids; unverifiable at runtime |
| **Seeded families, committed items, independent verifier** | Stable ids, each item reviewed and recomputed in CI, variety from fuzz | Families are code to maintain; Turkish phrasing is templated |

## Decision

`src/content/questions/engine/` holds a seeded PRNG, the `Family` contract and an assembler that lays out options
a to e deterministically and re-draws ugly or colliding drafts. Families live in `generated/determinant.ts`
(`d3-scalar`, `d3-row-ops`, `d2-numeric`, `d4-adjugate`, `d3-singular-param`) with Turkish text. A fixed seed per
item gives ids `v1-gen-<family>-NN`, source `dizey-generated`. `engine/verify.ts` shares no code with the
generators: it parses what is displayed (matrix entries, the TeX expression, option texts), recomputes by
Leibniz or cofactors, concrete matrices that are multiplied, inverted and adjugated, letter substitution and
interpolation, and re-evaluates every named mistake. Phone-fit limits are checked on every item and every fuzz
seed. `generated/lock.json` fingerprints each committed item; a changed or missing locked id fails the test, and
new ids are added only with `pnpm lock:questions`. "Sınavda böyle sorulur" skips generated items, because it
claims a real exam question.

## Consequences

- Cheap, checked practice volume on the topic that carries most of the exam; more families can follow the same shape.
- The mixed exam rehearsal and chapter tests now include generated items next to real ones; the printed 2024 paper does not.
- A family change that alters a committed item fails the lock test: add a new seed or id instead.
- Watch: Turkish is templated, so phrasing needs Eren's ear; the verifier's mistake models are the specification of each errorType.

## Update: families for the other Vize 1 chapters

The engine now covers every chapter, not only determinants. Families are grouped by file under `generated/`:
`matrices.ts` (m1-entries, m1-rule, m1-count, m2-types, m4-combo, m6-transpose, m10-hermitian),
`row-operations.ts` (r1-ops-entry, r3-rank-prop, r3-rank-k), `determinant-basics.ts` (d1-sarrus, d1-two-param) and
`systems.ts` (s2-k-system, s2-b-param). `generated/all.ts` is the one list the bank, the tests and the lock read.
Each file has its own independent analysers under `engine/verify-*.ts`. All answers are numbers or k-sets, so
`OptionValue` did not change. Systems with a parameter are shown as `A` and `b` (two matrices) because a 3x4
augmented matrix breaks the phone rules. A plain "rank of this 3x3" item is not generated: the true rank has
only three possible values, so four honest wrong options cannot exist; rank is asked through k instead.
