import { createRef } from 'react'

/** The screen behind sheets: it recedes when a sheet rises to its large detent. */
export const stageRef = createRef<HTMLDivElement>()

/** Where sheets mount: above the tab panes and the tab bar, inside the app frame. */
export const overlayHostRef = createRef<HTMLDivElement>()

/** The tab a full-screen route was opened from; closing it returns there. */
export const returnTab: { current: '/' | '/exam' | '/me' } = { current: '/' }

/**
 * The card a full-screen route was opened from, if any: the route grows out of it and shrinks back
 * into it (set by the card's tap, cleared when the route closes).
 */
export const morphFrom: { current: HTMLElement | null } = { current: null }
