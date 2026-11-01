import { useLayoutEffect, useRef } from 'react'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { playSound } from '../sound/player'
import type { Badge } from './badges'
import { Emblem } from './Emblem'

const REVEAL_CHANNEL = 'badge-reveal'
/** Brackets start this far open, in emblem units (the seal gap of every other seal). */
const GAP = 16
/** The tile lands first; the brackets close on it a beat later, like the answers seal. */
const REVEAL_MS = { tileFrom: 60, closeAfter: 260, wordsAfter: 140 } as const

/**
 * The moment a rozet is earned: its tile lands, the brackets close on it (the seal sound), then its name and
 * the can-do sentence rise. `onClosed` fires when the brackets meet, for the duo to react.
 */
export function BadgeReveal({
  badge,
  art,
  onClosed,
  quiet = false,
  kicker = strings.badges.newOne,
}: {
  badge: Badge
  art?: string | undefined
  onClosed?: (() => void) | undefined
  /** No sound (the lab replays it on demand with sound; tests stay silent). */
  quiet?: boolean
  /** The line above the name: "Yeni rozet" at the moment it is earned, "Rozet" on the shelf. */
  kicker?: string
}) {
  const root = useRef<HTMLDivElement>(null)
  const text = strings.badges.items[badge.id]

  // biome-ignore lint/correctness/useExhaustiveDependencies: plays once per badge (the parent keys it)
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const tile = el.querySelector<SVGGElement>('.emblem__tile')
    const left = el.querySelector<SVGPathElement>('.emblem__br--l')
    const right = el.querySelector<SVGPathElement>('.emblem__br--r')
    const words = [...el.querySelectorAll<HTMLElement>('[data-enter]')]
    if (!tile || !left || !right) return
    engine.set(tile, { scale: 0.6, opacity: 0 })
    engine.set(left, { x: -GAP, opacity: 0 })
    engine.set(right, { x: GAP, opacity: 0 })
    for (const word of words) engine.set(word, { y: 10, opacity: 0 })
    engine.withChannel(REVEAL_CHANNEL, () => {
      engine.after(REVEAL_MS.tileFrom, () => engine.to(tile, { scale: 1, opacity: 1 }, 'land'))
      engine.after(REVEAL_MS.tileFrom + REVEAL_MS.closeAfter, () => {
        engine.to(left, { x: 0, opacity: 1 }, 'move')
        engine.to(right, { x: 0, opacity: 1 }, 'move', {
          onArrive: () => {
            if (!quiet) playSound('seal')
            onClosed?.()
            for (const [at, word] of words.entries()) {
              engine.after(REVEAL_MS.wordsAfter * at, () => engine.to(word, { y: 0, opacity: 1 }, 'move'))
            }
          },
        })
      })
    })
    return () => {
      engine.cancelCues(REVEAL_CHANNEL)
      engine.finishChannel(REVEAL_CHANNEL)
    }
  }, [badge.id])

  return (
    <div
      ref={root}
      className="badge-reveal"
      role="img"
      aria-label={`${kicker}: ${text.name}. ${text.line}`}
    >
      <Emblem badge={badge} art={art} className="badge-reveal__emblem" />
      <p className="badge-reveal__kicker" data-enter="">
        {kicker} · {text.name}
      </p>
      <p className="badge-reveal__line" data-enter="">
        {text.line}
      </p>
    </div>
  )
}

/** Lands a running reveal at once (a tap on the scene). */
export function landReveal() {
  engine.finishChannel(REVEAL_CHANNEL)
}
