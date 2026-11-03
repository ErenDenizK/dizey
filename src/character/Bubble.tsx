import { useId, useLayoutEffect, useRef } from 'react'
import { engine } from '../engine/driver'

/**
 * Mırtis's one short line. Put it inside a Perch, next to the cat: it sits to the left of her head and points at it.
 * It comes in after she has risen (`delay`, ms) on the engine, a scale and an opacity spring from the cat's side, and
 * it leaves with her, because it rides her lift behind the card's edge. It is hidden from assistive tech: the line is
 * appended to the verdict's own label, which is the one place a screen reader hears it.
 */
export function Bubble({
  line,
  delay = 0,
  hold,
  onGone,
}: {
  line: string
  delay?: number
  /** ms after it has come in until it leaves again (a scale and an opacity spring); it stays put when absent. */
  hold?: number
  /** Told once the bubble has left (only with `hold`). */
  onGone?: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const channel = `bubble-${useId()}`

  // biome-ignore lint/correctness/useExhaustiveDependencies: delay, hold and channel are read once, when the bubble mounts
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    engine.set(el, { opacity: 0, scale: 0.7 })
    engine.withChannel(channel, () =>
      engine.after(delay, () => {
        engine.withChannel(channel, () => {
          engine.to(el, { opacity: 1 }, 'fade')
          engine.to(el, { scale: 1 }, 'land', { effect: engine.reducedMotion })
          if (hold === undefined) return
          engine.after(hold, () =>
            engine.withChannel(channel, () => {
              engine.to(el, { scale: 0.85 }, 'leave', { effect: engine.reducedMotion })
              engine.to(el, { opacity: 0 }, 'leave', { onArrive: () => onGone?.() })
            }),
          )
        })
      }),
    )
    return () => engine.cancelCues(channel)
  }, [])

  return (
    <div ref={box} className="mt-bubble" aria-hidden="true" data-testid="mirtis-bubble">
      {line}
    </div>
  )
}
