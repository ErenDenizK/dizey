# Why the original's lessons read clearer than ours (v21 vs 0.17.0)

- Date: 2026-10-31
- Asked by: Eren: "the original's lessons felt much easier to understand; ours felt a bit chaotic, harder,
  more technical. The original told it in a more gamified way. Its lesson animations, e.g. how it explains a
  multiplication, are very good." Research team brief: open lessons in the original, step through them,
  inspect the animations frame by frame, compare with ours, find out why, fix.
- Earlier report this builds on: `old-vs-new-app.md` (layout, type and size gaps, mostly closed since 0.11-0.17).
  This one is about the **lesson content and its choreography**, which that report did not measure.

## 1. Question

Eren's sense is that our lessons are harder to follow. Is that true, and if so, is it the screen, the motion,
or the way the lessons are written?

## 2. Sources

- Original: the artifact Eren sent (claude.ai artifact "Dizey — Lineer Cebir", version `1793358497-ab44`).
  Spot checks (head, line 13 410, tail) show it is line for line the same file as `Dizey/live/Dizey-canli-v21.html`
  in project file `Dizey.zip`, so the local copy was used. Run from `file://` in an isolated headless Chromium,
  390 × 844 at 2×. Treated as data; no code copied.
- Ours: `main` at `f0de933` (0.17.0), `vite preview`.
- Lesson data: the original's 17 lessons were read from its content block (object literals only, evaluated in a
  sandboxed `vm` with no globals); ours from `src/content/lessons`. Same metric script for both.
- Recordings: one full walk-through per lesson (each step, then the right answer and its replay), video at 390 px,
  frames extracted with ffmpeg at 8 fps. Media in project files `screenshots/0.19.0/` (not committed).

## 3. Findings

### 3.1 The numbers (all lessons)

| Metric | Original (17 lessons, 315 steps) | Ours 0.17.0 (23 lessons, 181 steps) |
| --- | --- | --- |
| Share of steps that are questions | **54 %** (44-65 % per lesson) | **31 %** (17-38 %) |
| Longest run of explanation steps without a question | 1-3 | up to 5 |
| Average words in a step's text | **14.9** (max 27) | **30.2** (max 64) |
| Questions whose answer replays the working on the stage | **96 %** | 32 % |
| Explanation steps with an animation | 76 % | 36 % |
| Lessons that open with a question ("Soru") | 16 of 17 | 5 of 23 (13 open with "Tanım"/"Kural") |
| Inline formulas per step text | rare, plain words ("A'nın 1. satırı") | 2-7 per text; 90 of 181 step titles contain TeX |

So the feeling is real and measurable: our lessons say **twice as much per step**, ask **half as often**, and
**show the working a third as often**.

### 3.2 The same topic side by side: matrix product (original A3 vs our M5)

Frame-by-frame, original A3 step 3 "Satır, sütunla buluşur" (≈ 6 s):

1. `AB` is on the stage as four empty "?" slots; the top-left slot has a green ring.
2. Row 1 of A lights blue, column 1 of B lights purple.
3. The "2" lifts out of A as a filled blue chip and flies to the work line; then "1" from B (purple). "2·1" is written.
4. "3" and "4" fly the same way; "+ 3·4" is written.
5. "= 14" is written in green. In the next step the 14 sits in its slot and stays there.

The steps around it: a recall step, a hook ("where does this 14 come from?"), the watch step above, then
**"your turn" for the top-right entry**, then the rule is named, then your turn again, then the trap (BA), your
turn, summary. The product matrix fills one cell per step: one object the learner builds.

Our M5 step 1 "Satır çarpı sütun" at 0.17.0:

- The product `AB` is shown **already filled in** before anything is computed (the answer is spoiled).
- The animation highlights a row and a column and writes "2 + 0 + 0 = 2": the **products themselves are skipped**,
  which is exactly the thing being taught.
- The first example is 2×3 times 3×2 with zeros, so the first sums look like nothing happens.
- The text holds the rule in index notation `(AB)ij`, a worked example and the separate size rule: three ideas.
- The first question asks `(AB)₂₂` with no product matrix and no target on the stage.
- Steps 3-4 (AB ≠ BA, zero divisors) state numbers that are never on the stage ("XY's top-left is 3"), with a
  static picture and a 40-word paragraph.

### 3.3 Why the original feels clearer and more "gamified"

1. **Question before rule.** It opens with a puzzle and names the rule only after the learner has seen and done it.
   Ours mostly defines first.
2. **Watch one, do one.** Every demonstration is followed at once by the same move on the next cell. Ours often
   explains 3-5 steps in a row.
3. **One persistent object.** The same two matrices stay for the whole idea; the result fills cell by cell. Ours
   brings new matrices almost every step (M5 used 10 matrices in 8 steps).
4. **The motion carries the arithmetic.** Numbers travel from the cells into the line, so the eye learns *which*
   numbers meet. Ours mostly lights cells and prints a finished sum.
5. **Short, plain words.** About 15 words per step, plain-language titles ("Sağ üst kutu kaç?"), formulas only
   when needed. Ours averages 30 words with formulas in sentences and titles.
6. **Every answer replays.** Right or wrong, the stage plays the solution. That is the reward loop that reads as
   "game".

What the original does worse (do not bring back): flying chips can overlap cells mid-flight, the stage is mostly
empty above and below a small scene, lessons run 18-21 steps, and some options carry English-style tags.

## 4. What we took, what we rejected, and why

Taken in this PR (rebuilt on our engine, no old code):

- A **product beat** (`kind: 'product'`): the row and column light, each pair of numbers flies into one work
  line, a values row appears when there are three or more terms, and the sum **lands in its cell** of the product
  matrix with one bounce. Tests check every entry against the math core.
- **Unknown entries** ("?" slots) and a **target mark** a question can show before any animation (`scene.marks`).
- `·` between matrices on the stage, and **matrix names above the brackets** (old stage labels) instead of
  "A = … B = … = AB =", which crowded the row and caused a double "=".
- A formula and the suffix after it ("A’nın") no longer wrap apart.
- **M5 rewritten in the original's rhythm**: 18 steps, 9 questions (50 %), every question replays its working,
  average text 13 words (max 19), opens with a question, one pair of matrices for the core idea, AB filled cell by cell.

Rejected: copying the original's wording or numbers (lesson content stays ours), its 4-option tag scheme, and
lesson length above ~18 steps.

## 5. Next steps (ordered)

1. Rewrite the other lessons with the same six rules, in study order, one PR per chapter, each with the
   before/after metrics of 3.1. Highest gain first: M1-M4, R1-R3 and M11 (question share ≤ 0.33, text ≥ 26 words).
2. More beats where the original had them: transpose (row turns into column), row operation applied to a row
   (row slides and the numbers change), read-an-entry.
3. Candidate principle (needs `principle-adoption`): "a lesson step holds one idea in ≤ 20 words; at most two
   explanation steps before a question; every question replays its working".

## 6. Open questions

None for Eren: he judges the result on the phone.

## 7. Progress: lessons converted

Same metric script as 3.1. "Replays" counts questions whose answer plays its working on the stage.

| Lesson | Steps | Questions | Replays | Words per step (avg / max) | Opens with |
| --- | --- | --- | --- | --- | --- |
| M1 before → after | 5 → 9 | 40 % → 44 % | 0/2 → 4/4 | 26 / 30 → 11 / 14 | Tanım → Soru |
| M2 before → after | 5 → 11 | 20 % → 36 % | 0/1 → 4/4 | 25.5 / 40 → 15 / 18 | Türler → Soru |
| M3 before → after | 6 → 11 | 33 % → 45 % | 0/2 → 5/5 | 29.8 / 44 → 13.5 / 22 | Tanım → Soru |
| M4 before → after | 6 → 12 | 33 % → 42 % | 0/2 → 5/5 | 29.3 / 55 → 13 / 17 | Tanım → Soru |
| M5 before → after | 8 → 18 | 38 % → 50 % | 0/3 → 9/9 | 29.7 / 50 → 12.8 / 19 | Kural → Soru |

New beats for these lessons: `combine` (sums and scalar multiples entry by entry: the same cell of each term
lights, its numbers fly into the line, the sum lands in its "?" slot) and `trace` (the diagonal lights and its
entries fly into one sum).
