# Motion tuning log

The motion values in `src/engine/constants.ts` (and their copies in the kept v21 layer until it moves
over) are starting defaults carried from the earlier app. Eren asked (2026-10-30) that each is evaluated,
not accepted automatically: reviewed on iPhone screen recordings, and every change recorded here.

Fixed principles (not tuned): one virtual clock; a tap finishes running motion; cause first; one bounce
at a time; reading is still; input is never blocked; reduced motion is one switch.

| Date | Value | From | To | Evidence (recording, device) | Reason |
| --- | --- | --- | --- | --- | --- |
