# 0010: A living vector character, and rozetler with illustrated art

- Status: accepted
- Date: 2026-11-01
- Ledger items: Eren 2026-11-01 11:58Z (characterisation, ChatGPT image, badges back, seals and gizli an status)

## Context

Eren asked for the app's soul: a character (the old Satır and Sütun duo, Köşeli, or a new one), an evaluation of
ChatGPT image generation (frame-by-frame animation, or moving parts of an image with code), and the badges that the
old project dropped because their design was poor. The old badges were 18 metal-rimmed medallions with tiny scenes
and tiny faces (old `work/rewards-v2/badges`): busy and unreadable at the 40 to 44 px they were shown at. Eren's
standing reward rule (2026-10-27): rewards mark diligence and practice, never a perfect score.

## Options

| Option | For | Against |
| --- | --- | --- |
| Character as ChatGPT frames (sprite sheet) | rich rendering | identity drifts between frames; heavy; cannot follow springs, gaze or tokens; every new expression is a new batch |
| ChatGPT image cut into parts, moved by code | rich look, some motion | the parts never meet cleanly at new angles; still raster; brittle for a minimal character |
| Vector character on a spring rig | crisp at every size, tiny, reacts to the engine (moods blend, hops land), token colours | the look is only as rich as the drawing |
| Badges drawn in vector only | consistent, light | flatter than illustrated art |
| Badge art from ChatGPT inside a code frame | illustrated richness where it pays (a still image), the frame and motion stay ours | needs Eren's account; nine images must match |

## Decision

The duo stays the character and is drawn in vector from a spring rig (src/character): six moods (the old happy,
proud, console, neutral plus curious and wow), blinks, gaze, hop and lean, a top-left gloss, rim shade, cheeks and
contact shadows. ChatGPT image is used for content, not animation: the illustrated inside of each rozet. A rozet is
an enamel tile between the app's brackets; the code owns the frame, the light and the moment (the brackets close on
it with the `seal` sound). Until art exists, each tile has a drawn vector scene; `public/badges/<id>.webp` replaces it.
Nine rozetler, all earned by work done (a lesson finished with any score, a mistake fixed, a rehearsal finished).
Earned state is derived from progress; only the first-shown time is stored (`dizey.badges`). Profil shows only what
is earned, never an empty slot.

## Consequences

- New rozetler need a rule over existing progress data and a scene; a rule must never read first-try correctness.
- The prompt pack for the art lives in the Claude Doc "Dizey rozet sanatı: ChatGPT görsel prompt paketi".
- Still missing: chapter (unit) seals and their ceremony, the Profil matrix closing, the gizli an and its sezgi mührü.
