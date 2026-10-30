# Motion tuning log

The motion values live in `src/engine/tokens.ts` (spec: `docs/design/motion-system.md`). Since 2026-10-30 they
are no longer the earlier app's values (decision 0004); the kept v21 layer still uses its own copies until its
rebuild. Eren asked (2026-10-30) that each is evaluated,
not accepted automatically: reviewed on iPhone screen recordings, and every change recorded here.

Fixed principles (not tuned): one virtual clock; a tap finishes running motion; cause first; one bounce
at a time; reading is still; input is never blocked; reduced motion is one switch.

| Date | Value | From | To | Evidence (recording, device) | Reason |
| --- | --- | --- | --- | --- | --- |
| 2026-10-30 | All springs | Ported k/ζ set (press 3800/1, ui 1400/0.9, move 700/0.9, page 300/0.9, land 400/0.6, ...) | Eight duration/bounce springs: tap 0.14/0, release 0.34/0.22, fade 0.22/0, snap 0.32/0.16, glide 0.42/0, page 0.5/0, settle 0.55/0.32, teach 0.72/0.08 | Frame-by-frame review in Chromium at 390 px (`scripts/motion-review.mjs`); iPhone pending | The ported values were Material's Android defaults (0.17-0.36 s); iOS screens read as ~0.5 s with no bounce (decision 0004) |
| 2026-10-30 | `settle` bounce | 0.26 | 0.32 | Computed overshoot table | 0.26 overshoots 3 %, invisible; 0.32 gives the intended ~6 % |
| 2026-10-30 | Launch for tap-started screen motion | none | 0.6 (push, pop, sheet open), 0.4 (card to stage) | Push recording: first two frames after the tap barely moved | A tap must move something on the next frame |
| 2026-10-30 | Settle threshold | Fixed 0.0005 for non-x/y properties | 1/10000 of the travel, capped at 0.1 px | The card-to-stage clip (700 px) took >1.3 s to "arrive", so the stage never closed | Thresholds must scale with the distance |
