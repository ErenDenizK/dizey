/**
 * The top chrome of every screen, chosen in one place (Eren 2026-11-01: direction C "Sahne" is on trial and
 * may be rejected, so flipping this one constant must swap the whole app).
 *
 * - `scene`: tab screens have no visible title (the hero is the top; an `h1` stays for assistive tech);
 *   second-level screens get a header row with the title and a text "Bitti".
 * - `masthead`: one compact row, screen name left, one context slot right; second-level screens show
 *   "‹ parent" before the title. Solid background, a hairline under it once the page has scrolled.
 */
export type Chrome = 'scene' | 'masthead'

export const CHROME: Chrome = 'scene'
