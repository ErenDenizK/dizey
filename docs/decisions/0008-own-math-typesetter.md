# 0008: Our own math typesetter instead of KaTeX

- Status: accepted (Eren, 2026-10-31 21:57Z: "we use KaTeX and I don't like it; our own custom is better", the design must be one whole everywhere even if it needs custom work)
- Date: 2026-10-31
- Ledger items: Eren 2026-10-31 21:57Z (unified design, custom matrix drawing, no KaTeX look)
- Supersedes the "inline formulas" part of [0001](0001-tech-stack.md) (math display row). Matrices on the stage were already our own components.

## Context

The lesson stage draws matrices with our own bracket grid, but every formula in text, answers and work lines went
through KaTeX. KaTeX lays out with its own metrics, stretchy delimiters and fonts, so a matrix inside an answer
(`\begin{bmatrix}`) looked different from the same matrix on the stage, fractions had KaTeX's proportions, and the
app's math face only partly applied. Eren compared with the original app, which draws all math itself (no KaTeX
in the v21 file; one `st-math` span style everywhere), and found ours less unified.

Our content uses a small, closed TeX subset: about 35 commands (`\cdot`, `\frac`, `\text`, `\neq`, `\bar`,
`\begin{bmatrix}`, arrows, relations), all written by us and checked by tests.

## Options

| Option | For | Against |
| --- | --- | --- |
| Keep KaTeX, restyle harder | No new code. | Its fraction and delimiter layout stays its own; bmatrix can never be our grid; ~250 kB fonts. |
| Write formulas as structured blocks, no TeX | Fully typed content. | Rewrites every lesson string at once; slow, error-prone. |
| **Own typesetter for our TeX subset** | One look: the app's math face, our fraction and bar drawing, bmatrix drawn by the stage's own matrix grid. Small (one file), synchronous. Content stays as written. | We own layout edge cases; unknown commands must be caught. |

## Decision

`src/exam/math.ts` parses our TeX subset and writes HTML: stacked fractions, raised scripts, CSS bars and roots,
operator spacing (binary vs. unary minus), and matrices as `.ex-mat` grids, the same component styling the stage
uses. KaTeX and its CSS are removed. Unknown commands render in an error style, and tests walk every lesson and
question-bank string so an unsupported command fails CI instead of shipping.

## Consequences

- One visual language for math across lessons, answers and exam questions; smaller bundle (no KaTeX fonts).
- No MathML output: screen readers read the text content of the formula. Acceptable for now; revisit with an
  `aria-label` per formula if accessibility needs it.
- New TeX in content must use the supported subset; the test names the string that breaks.
