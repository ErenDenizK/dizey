# 0003: Feedback and motivation, including wrong-answer counts

- Status: proposed (awaiting Eren's choice)
- Date: 2026-10-30
- Ledger items: plan step 3; Eren's open question "should wrong-answer counts be shown?"

## Context

Eren asked whether the app should show how many answers were wrong. Feedback that pulls attention to the self
(scores, counters) can lower performance, while task-specific feedback raises it; before an exam, an honest score
is needed to break the illusion of competence. Evidence: `docs/research/learning-science.md`. Daily streaks are
already ruled out by Eren; badges are allowed.

## Options

| Option | For | Against |
| --- | --- | --- |
| Always show counts and percent scores | Fully transparent | Self-focused feedback; a running counter during learning discourages and adds nothing actionable |
| Never show counts, not even in mock exams | No discouragement | Hides real readiness before the exam |
| No counter while learning; step-specific feedback; error log; real score in mock exams; opt-in stats | Feedback stays on the task; honesty where it matters | Two kinds of screens to design |

## Decision

Proposed: the third option. In lessons, right/wrong is shown immediately and a wrong answer shows the step and the
error type, with no running counter or lives. The end of a lesson lists skills that settled and skills sent to the
error log. An error closes when the same skill is answered right on a later review; the log shows open errors and a
"fixed" count. Mock exams show the real score, per-item mistakes and time. A stats screen with all raw data is
opt-in. Badges reward mastery (for example, five delayed reviews in a row right on determinant properties), not
visits. The main progress indicator is the readiness map: how many of the 24 Midterm 1 nodes are exam-ready.

## Consequences

- Easier: feedback copy is written per error type, which the distractor design needs anyway.
- Harder: the error log needs skill-level tracking and review scheduling from the first version.
- Watch: whether Eren feels progress without a score; revisit after his first week of use.
