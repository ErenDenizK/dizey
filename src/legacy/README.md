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
channel), Onest is loaded locally, and the new shell embeds the layer through `bridge.ts` (v21
publishes its lesson catalog there, closing a lesson hands control back to the shell, and the v21
launch greeting is off). `LessonLayer.tsx` mounts it once, above the shell; the v21 course map stays
in the DOM but hidden.

Status (Eren, 2026-10-30): this wrapped layer is a temporary reference only. The lesson layer is to be
rebuilt from scratch in TypeScript, taking only the logic from here, on the new motion and visual
system, and verified frame by frame.

Until the rebuild replaces it, fix bugs here and keep the diff small.

`window.satir` is the v21 test hook (open a lesson, advance, answer, finish); E2E uses it.
