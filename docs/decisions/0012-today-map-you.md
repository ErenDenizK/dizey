# 0012: Three tabs by the study loop: Bugün, Harita, Sen

- Status: accepted (Eren chose option B, 2026-11-01 15:18Z)
- Date: 2026-11-01
- Ledger items: Eren 2026-11-01 12:47Z, 13:19Z, 15:11Z, 15:18Z
- Supersedes: the tab list of 0007 (the path stays; the Sınav tab goes)
- Proposal page: https://claude.ai/artifact/CcrJnqc1WwNJoceQwjfu2H

## Context

The tabs were split by content type (lessons, exams, profile). The Sınav tab held two hour-long rehearsals that are
useless until every lesson is done; the mistake log sat at the bottom of Profil; Profil was two thirds settings. The
top of Dersler showed numbers (a title, "0 / 23", a thin bar) and no sense of today. Eren asked for a skeleton that
makes Dizey feel like an app: what to do now, a game-like map, and a real profile.

## Options

| Option | For | Against |
| --- | --- | --- |
| A: Dersler · Pratik · Profil | Least change | Dersler does two jobs; Pratik is empty in the first weeks |
| B: Bugün · Harita · Sen | Each tab one job; tests live in the learning path; a daily reason to open | Most change; Bugün must not grow into a second lesson list |
| C: one flow, no tabs | Most focused | Character, badges and moments get squeezed; does not scale past Midterm 1 |

## Decision

B. Tabs: **Bugün** (`/`), **Harita** (`/map`), **Sen** (`/me`). Settings are a pushed screen (`/settings`, decision
in the Settings PR). The exam hub and rehearsals stay as routes (`/exam`, `/exam/run`, `/exam/result`) but are
reached from the map's final gate and from Bugün, not from a tab.

Tests live in three layers: inside each lesson (existing questions); after each chapter, a chapter-test cell drawn as
the augmented column [A | b] of the chapter matrix (6 questions from the bank whose `node` belongs to the chapter,
untimed, no locks); at the end of the map, the full Vize rehearsal as the final gate. A chapter with fewer than 6
bank questions shows its cell in a "hazırlanıyor" state that explains why on tap.

Bugün rules: one lesson card at most (the next one), at most four blocks, an empty block is never shown.

## Consequences

- Placeholders: content that does not exist yet shows as "hazırlanıyor"; questions are written once placement is fixed.
- Stored data does not change shape: exam history and mistake records stay; new test kinds get new set ids.
- `/` changes meaning from the path to Bugün; `/map` stops redirecting and becomes the path.
- Watch: Bugün growing into a list; the rehearsal being one tap further away (Bugün shows it in the last 7 days).

## Build notes (for implementers)

- Character slot: `CompanionSlot` with a stable root element (a future companion layer measures its rect), rendering
  `Duo` from src/character/Duo.tsx. Size with a CSS width class (viewBox -4 -6 86 80). No CSS transitions on it.
  Bugün: about 40 px, alive, mood happy, `ref.react('happy')` once on mount. Sen: about 108 px; mood neutral with no
  lesson done, happy with some, proud after a finished chapter; `react(...)` when Sen opens after new progress.
- Bugün "Devam et" card: sets `morphFrom.current` like path tiles and carries `data-lesson=<id>` so the lesson's close
  can find a fold target if the card re-renders (Shell `visibleCard()`; owned with the Stage Show thread).
