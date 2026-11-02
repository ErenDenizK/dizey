# 0016: Bracket grammar, and a lighter Yol and Sen

- Status: accepted
- Date: 2026-11-02
- Ledger items: Eren 2026-11-02 (Yol too full, Sen sparse yet cluttered)
- Supersedes: none

## Context

Square brackets are the app's signature, and they had spread: a chapter number, an empty chapter-test node, the
stats matrix, the badge frames, a "?" slot for every hidden moment, bracketed rows inside a filled card. Yol stacked
three layers at the bottom (chips, the next-lesson card, the tab bar), showed amber twice and ran four line systems.
Sen had two alignments, three container grammars and 22 empty slots for a fresh user, and nothing on it led back to
learning.

## Decision

Brackets mean exactly one of three things, and nothing else wears them:

1. **Number**: a 1 x 1 bracket around a number (the chapter heading number, the chapter-test node).
2. **Slot**: a place where something can be earned (a badge frame, the "Sıradaki" target).
3. **Data**: the stats matrix.

Consequences: the "?" moment slots and the locked badge silhouettes are gone (a place that cannot be filled yet is
not drawn; Sıradaki shows the one slot you can fill next); Gizli anlar and Rozetler appear when there is something
to show. On Yol the dock is one card (the lesson, its one amber button, a hairline, then text links); the current
node is the brightest square, not amber; the paper is half as strong; the chapter-test node carries its number. On
Sen everything is left aligned, sections are a heading plus rows apart by hairlines, and no filled card remains.

## Consequences

Stored data is untouched. The earned/locked rules stay in `src/rewards/badges.ts`; Sıradaki reads them through
`src/rewards/next-badge.ts`. Guards: the Yol path-share test and the Sen empty-slot test in `e2e/app.spec.ts`.
