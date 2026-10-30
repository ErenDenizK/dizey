---
name: principle-adoption
description: Use before turning anything into a lasting rule (an instruction from Eren, feedback, a research finding, or your own "from now on" idea), to weigh it and propose it at the right level instead of adopting it blindly.
---

# Principle adoption

The failure this prevents: a single reaction ("this tab bar looks bad") hardening into a wrong, permanent ban ("never use tab bars").

## Steps

1. **Root cause.** What is the real problem behind the statement? Write the principle at that level ("every component meets the design system's quality bar"), not at the level of the symptom ("no tab bars").
2. **Weigh from four angles.**
   - Why it could be right.
   - Where it would be wrong: at least one concrete counterexample.
   - Scope: this screen, this feature, or the whole product and process.
   - Outside experience: what others ran into (GitHub issues and discussions, official guidance).
3. **Check overlap.** Does an existing principle in `docs/principles.md` already cover it? Prefer sharpening an existing principle to adding a new one. Keep the list short.
4. **Pick a level.** trial (applied until a review point, then measured) · active · firm (only when Eren explicitly says it is non-negotiable; only Eren changes it).
5. **Propose.** Send Eren one paragraph in Turkish: the principle, why, the counterexample, the scope, the level. Record it under "Candidates under review" meanwhile.
6. **Adopt.** After his OK, add the row to `docs/principles.md` (ID, principle, level, why, scope, ledger source, review point) and update `CLAUDE.md` or the relevant skill if it changes behaviour. Mark the ledger item "ilke oldu".
7. **Review.** At its review point, or when it keeps needing exceptions, re-weigh it. Retired principles move to "Retired" with the reason; they are never deleted.

Firm statements from Eren ("kesinlikle", "asla") skip the waiting in step 5 but still get steps 1 to 4, so they are written at the right level and scope.
