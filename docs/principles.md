# Principles

Every working rule adopted for Dizey, with its reason. A rule enters this file only through `.claude/skills/principle-adoption`. Retired rules stay at the bottom with the reason they were retired.

Levels: **firm** (Eren said so explicitly; only Eren changes it) · **active** (adopted after weighing) · **trial** (applied until its review point, then measured).

Source IDs refer to items in the prompt ledger (Claude Doc "Dizey Prompt Defteri").

## Active

| ID | Principle | Level | Why | Scope | Source | Review |
| --- | --- | --- | --- | --- | --- | --- |
| PR-01 | Nothing from the old project is a default; only raw course material may be consulted. | firm | The old system produced reactive, unfounded rules; reusing them reimports its failures. | Everything | P2.2, P4.13, P4.17 | Never |
| PR-02 | All technical artifacts are in English; UI text and lessons in Turkish; conversation with Eren in Turkish. | firm | Eren wants a professional, standard codebase; the product's users read Turkish. | Code, docs in repo, skills, git | P3.4, P4.1 | Never |
| PR-03 | No statement becomes a rule before its root cause, counterexamples and scope are weighed. | firm | One complaint ("this tab bar is ugly") must not become a wrong ban ("no tab bars"). | All principles, including Claude's own | P5.4 | Never |
| PR-04 | Plans are ordered steps with dependencies, not calendars; independent steps run in parallel. | firm | Date-based plans made earlier work run far below potential. | Planning | P7.4, P7.5 | Never |
| PR-05 | Every merged PR leaves the app stable, usable and forward compatible. | active | Eren uses builds from day one; a broken build breaks his study. | Production | P4.4 | After first 5 PRs |
| PR-06 | Every message from Eren is itemised in the ledger in the same turn, and every item is routed. | active | Dictated prompts are long; unrouted items get lost. | All sessions | P1.13, P5.6 | Next consolidation |
| PR-07 | Nobody pushes to `main`; every change lands through a PR. Claude may merge its own PRs once checks pass; merged branches are deleted. | firm | Clean history and a reviewable record of every change; Eren delegated merging. | Git | P5.1, P8 | Never |
| PR-08 | Commits are authored by Eren and carry the Claude co-author trailer; AI involvement is never hidden. | firm | The work counts on Eren's profile honestly. | Git | P4.9 | Never |
| PR-09 | Opus is the default model; Sonnet only after a measured side-by-side; heavy spend is announced first. | active | Errors cost more than tokens at this stage; Eren wants control over spend. | All sessions | P4.14 | Next consolidation |
| PR-10 | Install a tool only when there is a need for it, after reading its source and getting Eren's OK. | active | Tools are a means; installs carry security and context costs. | Skills, plugins, packages | P7.2 | Next consolidation |

## Candidates under review

| ID | Candidate | Source | Status |
| --- | --- | --- | --- |
| C-01 | Every visual and writing choice needs a reason from Dizey's own world; "everyone does it" is not a reason. | R1 (AI patterns research) | Waiting for Eren |
| C-02 | Research GitHub first for methods, tools and others' mistakes; record what we took and rejected. | P5.11 | Waiting for Eren |

## Retired

None yet.
