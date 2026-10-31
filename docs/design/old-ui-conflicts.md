# Old UI vs our rules: open conflicts

Eren (2026-10-31 11:00Z): port the old UI faithfully; where it has usability or visibility problems, list them for
discussion instead of fixing them. Contrast is WCAG 2 ratio, measured on the
ported values in `src/styles/tokens.css`.

| # | Old behaviour | Rule it breaks | Options | Recommendation |
| --- | --- | --- | --- | --- |
| 1 | Muted text `#78746d` on paper: 4.3:1, on sunk panels 4.0:1 (light and dark) | Small text needs 4.5:1 | a) keep; b) darken a few percent (barely visible); c) use it only for 18 px+ text | b |
| 2 | "Doğru" green text on the green tint: 4.3:1 (light) | Same 4.5:1 rule | a) keep; b) darken the green text one step | b |
| 3 | Row blue and column purple are the only cue for row vs column | Colour must not be the only cue; blue and purple are close for some colour-blind users | a) keep; b) keep colours, add a second cue (tile shape or a small row/column marker); c) column becomes orange | b |
| 4 | Tile edges (row, column, result) are about 2:1 against the stage | Component edges 3:1 when they carry meaning | a) keep, the tinted fill already carries it; b) darken edges | a |
| 5 | Dark mode: "İleri" looks disabled while a beat plays | An active button must not look disabled | a) keep; b) keep the full colour during the beat | b |
| 6 | Number chips pass over matrix entries mid-flight | Moving elements must not hide content being read | a) keep; b) route chips above the matrix | b |

Touch targets of the old components (top bar icons, keypad keys, option rows) are measured when each component is
ported in plan step 2, and any below 44 px is added here.

## Eren's decisions (2026-10-31 11:27Z)

1. Done: muted ink darkened to 4.6:1 on every surface (light `oklch(0.528 …)`, dark `oklch(0.628 …)`).
2. Done: light-mode success ink darkened to 4.6:1 on the success tint (`oklch(0.497 …)`).
3. Accepted: keep blue and purple and add a second cue; designed with the tile component in plan step 2.
4. Accepted: edges stay as they are.
5. Accepted: the primary button keeps its full colour during a beat. The current player already does this (it never
   disables or dims the button while a beat plays); keep it that way when the dock is rebuilt.
6. Rejected: chips keep flying over the matrix entries, as in the old app.
