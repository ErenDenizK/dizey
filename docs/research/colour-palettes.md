# Three radical dark palettes (2026-11-01)

Eren asked (2026-11-01 12:47Z) for three radically different, memorable, non-generic dark palettes on the token
system, each critiqued for its strongest and weakest traits, before badge art is generated around the winner.

## Sources

- impeccable "Color & Contrast" reference (agent skill, read as data):
  https://cdn.jsdelivr.net/npm/@nqlib/nqui@0.6.3/docs/nqui-skills/impeccable/reference/color-and-contrast.md
- "Why the 60-30-10 rule is ruining your UI designs" (transcript summary):
  https://sozai.app/transcript/60-30-10-rule-ruining-ui-designs/index.md
- Our own limits: `eren-palette-preference` (no glare, neutral grounds, muted roles), decision 0004, tokens.test.ts.

## Findings

- Generic dark UI comes from defaults: pure grey or black grounds, a blue (250) or orange (60) accent picked
  because it is safe, and the accent smeared everywhere. Memorable palettes pick a ground hue with a reason and
  tint every neutral toward it (chroma 0.005-0.03), then keep one accent rare.
- Dark mode needs wider lightness steps between layers and slightly desaturated accents; contrast minimums stay.
- For us the hard constraint is meaning: green = correct, red = wrong, and row and column colours must never be
  read as each other or as the action colour. That leaves the action, row and column to share three of
  amber, cyan, blue, violet and lime; a palette's identity lives in its ground and in that assignment.

## What we built

`src/styles/palettes.ts` turns the base palette (Kehribar) by a few numbers per palette: ground hue and chroma,
ink hue and chroma, and a hue and chroma factor per role family. Lightness never moves, so every contrast pair
keeps the base's ladder; tokens.test.ts runs all contrast checks on every palette and fails if the generated
block in tokens.css is stale. The app picks a palette from Profil > Renk paleti (setting `colours`, absent means
Kehribar), applied before first paint via `<html data-palette>`.

| Palette | Ground | Action | Row / column |
| --- | --- | --- | --- |
| Kehribar (base) | warm charcoal 80 | honey 76 | blue 248 / plum 322 |
| Kara tahta | slate green 172 | chalk yellow 100 | chalk blue 238 / chalk pink 338 |
| Gece mürekkebi | deep indigo 272 | aqua 196 | amber 72 / orchid 318 |
| Patlıcan | aubergine 336 | acid lime 124 | cyan 212 / amber 62 |

## Critique

- **Kara tahta.** Strongest: it means something; a math app on a chalkboard is the one palette nobody would call
  generic, and the chalk inks are the calmest to read. Weakest: the green ground sits near the "correct" green,
  so verdict tints are a little quieter; it can read as nostalgic or school-like rather than premium.
- **Gece mürekkebi.** Strongest: the most "expensive" and focused; amber rows on indigo glow like lamplight and
  the aqua action is impossible to miss. Weakest: navy plus cyan is the closest to the tech-app default, and the
  aqua action sits 46 degrees from the green verdict, so "act here" and "correct" are cousins.
- **Patlıcan.** Strongest: the most unforgettable; lime on aubergine is a signature nobody else owns and it
  photographs well for badges. Weakest: the loudest, furthest from Eren's "neutral, not bright" note; the purple
  ground tints every grey, which can tire over a long study session.

## Taken / rejected

- Taken: tinted neutrals per palette, one rare accent, role hues reassigned per palette, contrast tests per palette.
- Rejected: changing lightness per palette (would break the tested ladder), a pure-black OLED palette (generic,
  and smearing on scroll on iPhone OLED), a red or orange accent (collides with the wrong-answer red).
