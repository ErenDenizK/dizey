# Lessons learned

Short entries from our own mistakes, Eren's feedback and other projects' experience. A second entry with the same root cause turns into a principle candidate (see `.claude/skills/principle-adoption`).

| Date | What happened | Root cause | What changed | Source |
| --- | --- | --- | --- | --- |
| 2026-10-30 | The abandoned first attempt accumulated rules such as "never use a bottom tab bar" after a single complaint about one ugly tab bar. | A reaction to one bad instance was written down as a ban on the whole pattern. | Principle adoption now requires root cause, counterexamples and scope (PR-03). | Eren, P4.12 |
| 2026-10-30 | The first planning pass presented items from the old project (rules, design notes) as if they were current defaults. | Archive material was read as guidance instead of as data. | Old material is excluded by default (PR-01). | Eren, P2.1 |
| 2026-10-30 | Three design directions were proposed and all rejected; Eren pointed out no field research preceded them. | Proposals were generated from taste instead of from researched patterns and existing products. | Exhaustive top-down design research now precedes design work; candidate C-03. | Eren, P10.1 |
| 2026-10-30 | The blanket "nothing old" rule would have discarded the old in-lesson layer, which Eren rates above every new direction. | An absolute exclusion was applied without asking which parts Eren valued. | PR-01 now names the kept exception; future blanket rules ask "what inside this is worth keeping?" | Eren, P9.2 |
| 2026-10-30 | PR #1 was auto-closed by GitHub during a rebase onto the new `main`. | The rebased head was force-pushed while the PR still targeted a base with no shared history. | Retarget the PR's base first, then push the rebased branch. | Stack thread |
| 2026-10-30 | The first audit of the 2024 midterm passed items 13 and 16; building the question bank showed both are defective (inconsistent data; a second true statement). | The audit derived the intended answer and checked the key, but did not test the premises or whether other options are also correct. | Bank tests recompute every option, require exactly the keyed one to pass, and check that given data is consistent. | Curriculum thread |
