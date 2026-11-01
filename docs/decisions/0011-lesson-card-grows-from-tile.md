# 0011: A lesson's card grows out of its tile

- Status: accepted (Eren asked for a better lesson card, 2026-11-01 13:19Z; built and shown, his review pending)
- Date: 2026-11-01
- Ledger items: Eren 2026-11-01 13:19Z ("drawer mı, pop-up mı, kart büyüyüp daha büyük bir karta dönüşebilir mi?")

## Context

Tapping a lesson tile on Dersler opened the generic bottom sheet. It worked, but it said nothing about where it came
from: the tile stayed in place, a grey panel slid up from the screen edge, and the lesson then rose from below
again. Eren asked whether a drawer is right, or a pop-up, or a card that grows. The current lesson's tile already
grows straight into the lesson (Shell `growFrom`), so the path had two different spatial models.

## Options

| Option | For | Against |
| --- | --- | --- |
| Restyle the bottom sheet | Least change; detents and drag already work | Still unrelated to the tile; same as every other sheet |
| Centred pop-up | Familiar | Far from the thumb; a modal box with no origin |
| The tile lifts and opens into a floating card in the thumb's reach; the lesson grows out of the card and shrinks back into the tile | One object at three sizes (tile, card, lesson); matches the existing tile-to-lesson growth; button stays low | New component; transitions need care (clip, crossfade) |

## Decision

The third option. `src/shell/LessonPeek.tsx` opens a card out of the tapped tile with a clip-path inset spring
(`src/shell/morph.ts`, shared with Shell's route growth) while a copy of the tile fades out over it. A tap outside,
a drag down or Escape folds it back into the tile. The card's button grows the lesson out of the card, and closing
the lesson shrinks it back into the tile. The card shows the lesson's place in its chapter, its state, the opening
question, its shape as a bracketed row vector (one entry per step, questions taller, finished steps filled), and
the chapter's exam weight worded as the chapter's, not the lesson's.

## Consequences

- Easier: one spatial story on the path; the lesson card is no longer tied to the sheet's detents.
- Harder: the tile must stay measurable while the card is open (it is hidden, not removed).
- Watch: the card sits over the tab bar while open (the scrim dims it); crossfade frames show two faint layers
  by design. If the path's tiles gain transforms again, the clone of the tile takes its on-screen rectangle.
