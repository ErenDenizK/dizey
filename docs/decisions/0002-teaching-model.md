# 0002: Teaching model

- Status: proposed
- Date: 2026-10-30
- Ledger items: plan step 3 (Vize 1 curriculum and teaching model)

## Context

Dizey must get Eren through MAT1320 Midterm 1 and build real understanding at the same time. The exam is
multiple choice under time pressure (Eren, 2026-10-30; see `docs/research/past-exam-analysis.md`). The topic map is
`docs/curriculum/vize1-topic-map.md`; the evidence is `docs/research/learning-science.md`.

## Options

| Option | For | Against |
| --- | --- | --- |
| Two modes: "exam" drills and "understanding" lessons | Simple to build; fast exam drills | Understanding becomes optional and gets skipped under exam pressure; duplicated content |
| Understanding first, exam practice at the end | Strong concepts | Exam skills (speed, elimination, pattern recognition) come too late |
| One lesson flow carrying both layers, plus spaced and interleaved review | Each concept is learned with its exam form; review builds both | More content per node (error catalogues, variants) |

## Decision

One lesson flow per topic node carries both goals: why (with a visual), definition in the lecturer's notation with
an English term note at first use, a worked example with the reason for each step, faded examples where the learner
fills a growing share of steps (shortened when the learner is already accurate), an independent problem with
step-level error location, an exam-style item with elimination strategies taught as a skill, and an optional
computer science connection. Around lessons: spaced retrieval of new variants, interleaved mixed review, wrong
options that each encode a real error type and select the feedback, an optional confidence tap, a readiness map
(learned → retained → exam-ready, moved by delayed correct retrievals), and a timed mock exam in the real format.
"Predict first" (productive failure) is used only on a few key concepts.

## Consequences

- Easier: one content path to maintain; every review item trains both method choice and accuracy.
- Harder: each node needs an error catalogue, a variant generator and fading levels, not single fixed questions.
- The lesson data model must express steps, fading levels, distractor-to-error mapping and prerequisites.
- Watch: lesson length on a phone; whether fading adapts fast enough for a learner who already knows a topic.
