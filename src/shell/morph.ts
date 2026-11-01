import { engine } from '../engine/driver'

/**
 * Shared-element helpers: a surface that opens out of a smaller card (or closes back into it) is clipped
 * with an inset that springs from the card's rectangle to its own, while a copy of the card fades out over it.
 */

export function insets(surface: HTMLElement, card: HTMLElement) {
  const outer = surface.getBoundingClientRect()
  const inner = card.getBoundingClientRect()
  return {
    t: inner.top - outer.top,
    l: inner.left - outer.left,
    r: outer.right - inner.right,
    b: outer.bottom - inner.bottom,
    rad: Number.parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0,
  }
}

const px = (n: number | undefined) => `${(n ?? 0).toFixed(2)}px`

export function clipWith(el: HTMLElement) {
  engine.bind(el, (v) => {
    el.style.clipPath = `inset(${px(v.t)} ${px(v.r)} ${px(v.b)} ${px(v.l)} round ${px(v.rad)})`
  })
}

/**
 * A copy of the card, drawn where the card is, so the growth starts from what was tapped: it fades
 * as the surface opens while the route fades in after it, so there is never an empty frame and
 * never two layers of text at full strength (the same choreography as src/ui Morph).
 */
export function faceOf(surface: HTMLElement, card: HTMLElement) {
  const face = card.cloneNode(true) as HTMLElement
  const outer = surface.getBoundingClientRect()
  const inner = card.getBoundingClientRect()
  face.removeAttribute('href')
  face.removeAttribute('data-testid')
  face.setAttribute('aria-hidden', 'true')
  Object.assign(face.style, {
    position: 'absolute',
    margin: '0',
    top: `${inner.top - outer.top}px`,
    left: `${inner.left - outer.left}px`,
    width: `${inner.width}px`,
    height: `${inner.height}px`,
    zIndex: '1',
    pointerEvents: 'none',
    visibility: 'visible',
    transform: '',
  })
  surface.append(face)
  return face
}
