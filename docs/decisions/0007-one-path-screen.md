# 0007: Home and map become one path screen

- Status: accepted (Eren asked for it, 2026-10-31 20:10Z; built and shown, his review pending)
- Date: 2026-10-31
- Ledger items: work stream 1 of Eren's 2026-10-31 20:10Z message ("ana sayfa ve harita birleşsin, daha oyunsal")
- Supersedes: the Bugün and Harita sections of `docs/design/shell-screens.md`

## Context

Bugün showed one "next lesson" card and three rows; Harita listed the same lessons by unit. Two tabs said one thing
twice, neither felt like progress, and Eren asked for one more game-like block in the spirit of level maps
(Candy Crush, Duolingo) but original to Dizey. Constraints that stay: no locks (every lesson open), no streaks, no
running scores during learning (decision 0003), one primary action per screen, the old app's UI language
(decision 0006: "[Dersler] Profil", the docked "Başla: …" button, warm paper tiles).

## Options

| Option | For | Against |
| --- | --- | --- |
| Keep two tabs, restyle both | Least change | Still says the same thing twice; no sense of a journey |
| A winding level path of round nodes | Instantly reads as a game | A copy of other apps' look; nothing in it is about linear algebra |
| The course as a stack of matrices: each chapter a bracketed matrix, each lesson an entry, the path snaking through the entries row by row | Dizey means "matrix"; reads as a level map and as the subject at once; brackets can fill as progress | New pattern, needs measuring and drawing code |

## Decision

One tab, **Dersler**, replaces Bugün and Harita. The study order is cut into five chapters (`src/content/path.ts`,
tested to match the lesson order exactly; M11 moves next to R4 because it needs determinants). Each chapter is a
matrix with three columns: the path runs left to right, then right to left, so it never jumps. Walked segments are
solid green, the way ahead a quiet rail; the brackets fill green in proportion to the chapter. The lesson you are on
is the one dark, ringed tile with a "Kaldığın yer" / "Sıradaki" tag, and the docked button under the path always
opens it (and grows into the lesson). Any tile opens its card, so nothing is locked. A finished lesson's tile lands
with a settle and its segment draws in when you come back to the path. The finished-chapter sound
(`milestone`) now follows path chapters instead of letter units.

Tabs become Dersler, Sınav, Profil (the old app's "Profil" name). `/map` redirects to `/`.

## Consequences

- Easier: one place to see where you are and what is next; the progress shape matches the readiness map idea of
  decision 0003 without a score.
- Harder: the path is drawn from measured tile centres (ResizeObserver), so tile layout changes must keep the
  `.pa-tile` class.
- Watch: long titles are clamped to three lines on tiles (the full title is in the card); whether Eren wants the
  unit letter codes renamed now that chapters and letters differ (M11 lives in "Tersinirlik").
