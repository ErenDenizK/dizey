# Kept v21 lesson layer

Eren chose to keep the earlier app's in-lesson presentation, animation engine and sound system
(2026-10-30). This folder holds that app as it was in live version 21, split out of its single HTML file:

| File              | From the v21 HTML                                                                     |
| ----------------- | ------------------------------------------------------------------------------------- |
| `v21.css`         | the main `<style>` block (includes the embedded "Satir Math" and "Satir Ident" fonts) |
| `v21-markup.html` | the `<body>` markup (course map view, lesson view, overlay)                           |
| `v21.js`          | the one `<script>`: lesson content, sound, shell, engine                              |
| `fonts/`          | Onest, self-hosted instead of Google Fonts so the app works offline                   |

Changes from v21, and only these: storage goes through `storage.ts` (namespaced per deployment
channel), and Onest is loaded locally. Everything else is byte-for-byte.

Plan: the new shell (home, map, profile) replaces the v21 map; the lesson layer then moves piece by
piece into TypeScript (`src/engine/` already holds the clock and springs), each step under tests that
compare against this version. Until a piece has moved, fix bugs here and keep the diff small.

`window.satir` is the v21 test hook (open a lesson, advance, answer, finish); E2E uses it.
