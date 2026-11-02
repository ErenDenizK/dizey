import { useId, useLayoutEffect, useRef } from 'react'
import { engine } from '../engine/driver'

/**
 * Mırtis's one short line. Put it inside a Perch, next to the cat: it sits to the left of her head and points at it.
 * It comes in after she has risen (`delay`, ms) on the engine, a scale and an opacity spring from the cat's side, and
 * it leaves with her, because it rides her lift behind the card's edge. It is hidden from assistive tech: the line is
 * appended to the verdict's own label, which is the one place a screen reader hears it.
 */
export function Bubble({ line, delay = 0 }: { line: string; delay?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const channel = `bubble-${useId()}`

  // biome-ignore lint/correctness/useExhaustiveDependencies: delay and channel are read once, when the bubble mounts
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    engine.set(el, { opacity: 0, scale: 0.7 })
    engine.withChannel(channel, () =>
      engine.after(delay, () => {
        engine.withChannel(channel, () => {
          engine.to(el, { opacity: 1 }, 'fade')
          engine.to(el, { scale: 1 }, 'land', { effect: engine.reducedMotion })
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
