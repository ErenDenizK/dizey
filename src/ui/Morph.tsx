import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { engine } from '../engine/driver'

function insetsOf(surface: HTMLElement | null, card: HTMLElement | null) {
  if (!surface || !card) return { t: 0, r: 0, b: 0, l: 0, rad: 0 }
  const frame = surface.getBoundingClientRect()
  const rect = card.getBoundingClientRect()
  const rad = Number.parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0
  return {
    t: rect.top - frame.top,
    l: rect.left - frame.left,
    r: frame.right - rect.right,
    b: frame.bottom - rect.bottom,
    rad,
  }
}

/**
 * A card that grows into a full-screen stage and shrinks back into the same card (continuity:
 * the lesson comes out of the thing that was tapped and goes back into it).
 *
 * The surface is clipped, not scaled, so corners and text are never distorted. The card's own face
 * fades out over the first part of the growth while the stage content fades in after it, so there
 * is never an empty frame and never two layers of text on top of each other at full strength.
 */
export function Morph({
  open,
  from,
  face,
  onClosed,
  children,
}: {
  open: boolean
  from: RefObject<HTMLElement | null>
  /** What the card shows, drawn at the card's position so the growth starts from it. */
  face: ReactNode
  onClosed: () => void
  children: ReactNode
}) {
  const surface = useRef<HTMLDivElement>(null)
  const faceRef = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)
  const [origin, setOrigin] = useState({ top: 0, left: 0, width: 0 })
  const closedRef = useRef(onClosed)
  closedRef.current = onClosed
  if (open && !mounted) setMounted(true)

  useLayoutEffect(() => {
    const el = surface.current
    if (!mounted || !el) return
    engine.bind(el, (v) => {
      el.style.clipPath = `inset(${px(v.t)} ${px(v.r)} ${px(v.b)} ${px(v.l)} round ${px(v.rad)})`
    })
    const start = insetsOf(el, from.current)
    const card = from.current?.getBoundingClientRect()
    const frame = el.getBoundingClientRect()
    if (card) setOrigin({ top: card.top - frame.top, left: card.left - frame.left, width: card.width })
    engine.set(el, start)
    if (content.current) engine.set(content.current, { opacity: 0, y: 12 })
    if (faceRef.current) engine.set(faceRef.current, { opacity: 1 })
    if (from.current) from.current.style.visibility = 'hidden'
  }, [mounted, from])

  // biome-ignore lint/correctness/useExhaustiveDependencies: `from` is a ref; its element is read when the motion starts and ends.
  useEffect(() => {
    const el = surface.current
    if (!mounted || !el) return
    engine.withChannel('chrome', () => {
      if (open) {
        engine.to(el, { t: 0, r: 0, b: 0, l: 0, rad: 0 }, 'page', { launch: 0.4 })
        if (faceRef.current) engine.to(faceRef.current, { opacity: 0 }, 'fade')
        engine.after(90, () => {
          if (content.current) engine.to(content.current, { opacity: 1, y: 0 }, 'glide')
        })
      } else {
        if (content.current) engine.to(content.current, { opacity: 0 }, 'fade')
        if (faceRef.current) engine.to(faceRef.current, { opacity: 1 }, 'fade')
        engine.to(el, insetsOf(el, from.current), 'page', {
          onArrive: () => {
            if (from.current) from.current.style.visibility = ''
            setMounted(false)
            closedRef.current()
          },
        })
      }
    })
  }, [open, mounted])

  if (!mounted) return null
  return (
    <div ref={surface} className="dz-morph">
      <div
        ref={faceRef}
        style={{ position: 'absolute', top: origin.top, left: origin.left, width: origin.width }}
        aria-hidden="true"
      >
        {face}
      </div>
      <div ref={content} style={{ position: 'absolute', inset: 0 }}>
        {children}
      </div>
    </div>
  )
}

function px(n: number | undefined): string {
  return `${(n ?? 0).toFixed(2)}px`
}
