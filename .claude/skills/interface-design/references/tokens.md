# Tokens

## Source of truth today

Eren (2026-10-30): nothing from the old app is used directly. The values below are **reference only**: study
their logic, then define new tokens from scratch in the motion and visual system thread, verify contrast and
feel, and only then replace the placeholders. Until that lands, the old values are what the running app uses.

The old lesson layer has a full token layer in `src/legacy/v21.css` (between `@tokens begin` and
`@tokens end`, then the role block): 12-step palettes (neutral, brand, accent, success, warning, danger, row,
column) for light and dark, semantic colour roles (`--color-bg`, `--color-ink`, `--color-action`,
`--color-row-*`, `--color-col-*`, `--color-ok-*`, `--color-bad-*`, ...), type scale (`--text-caption` 13 px to
`--text-display` 30 px, body 17 px), spacing (`--space-2xs` 2 px to `--space-xl` 24 px), radii, shadows,
strokes. `src/styles/app.css` holds placeholders only; replace them with the new token set, used by both lessons and
shell.

Motion tokens: `src/engine/constants.ts` today (ported starting values), to be re-derived and verified frame by
frame in the rebuild. Sound events: the kept sound system's event table.

## Three tiers

| Tier | Example | Rule |
| --- | --- | --- |
| Palette | `--row-9`, `--neutral-2` | Only inside the token layer |
| Role | `--color-ink`, `--color-row-fill`, `--color-bad-ink` | The only colour tokens components use; light/dark resolved here |
| Component | `--matrix-bracket-stroke` | Only when one component needs its own size or colour |

Math colours (row, column, pivot, selected, error) are a separate role group. The shell never uses them for
decoration, or their meaning in lessons weakens.

## Families

- Colour by role; every text/background pair has an automated contrast test in both themes.
- Type: few sizes and two or three weights; 17 px body.
- Spacing: one scale; inside-group spacing clearly smaller than between-group spacing.
- Radius: one system; card, button and matrix cell are separate steps.
- Motion: spring names in a `spring.*` namespace, read only by the engine. The sound event `land` and the
  spring `land` are different things; keep namespaces apart (`spring.land`, `sound.land`).
- Sound: event names and loudness tiers documented next to the motion tokens.

## Format

The W3C Design Tokens format reached its first stable version (2025.10): vendor-neutral JSON, aliases,
light/dark and accessibility variants without copying files, OKLCH and Display P3. When tokens move out of
v21.css, store them in that format and compile to CSS variables; choose the compiler (Style Dictionary,
Terrazzo) only after an install audit and Eren's OK.

## Known issue

Row blue (`--row-9`) and column purple (`--column-9`) are a colour-blind risk. Pair them with a second cue
(line style, label) before changing any value; the value change is Eren's call (pending in "Dizey Ders Sunumu:
Koruyacaklarımız").
