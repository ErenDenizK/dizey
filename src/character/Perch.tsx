import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react'
import { engine } from '../engine/driver'

/**
 * Where Mırtis lives (decision 0017, "Presence"): she perches on the top edge of the card she belongs to, her paws on
 * its border. She enters by rising from behind that edge and leaves by sinking behind it; the part below the edge line
 * is clipped, so she is never in midair and never fades.
 *
 * Put a Perch inside a `position: relative` card. It sits `right` px in from the card's right edge. The rise is an
 * engine spring with a small overshoot; under reduced motion it is the shorter, stiffer effect spring, never a cut.
 */
export function Perch({
  children,
  present = true,
  right = 16,
  delay = 0,
  onGone,
  className = '',
}: {
  children: ReactNode
  /** False sinks her behind the edge; the children unmount once she is out of sight. */
  present?: boolean
  /** Distance from the card's right edge, in px. */
  right?: number
  /** ms to wait before the rise, so she rises after whatever else is arriving with her card. */
  delay?: number
  onGone?: () => void
  className?: string
}) {
  const lift = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  const channel = `perch-${useId()}`
  const [mounted, setMounted] = useState(present)
  if (present && !mounted) setMounted(true)

  // biome-ignore lint/correctness/useExhaustiveDependencies: onGone, delay and channel are read when the effect runs; `mounted` re-runs this once the lift has mounted
  useLayoutEffect(() => {
    const el = lift.current
    if (!el) return
    const hidden = el.offsetHeight + 4
    if (first.current) {
      first.current = false
      if (!present) return
      engine.set(el, { y: hidden })
    }
    engine.withChannel(channel, () => {
      if (present) {
        const rise = () =>
          engine.withChannel(channel, () => engine.to(el, { y: 0 }, 'land', { effect: engine.reducedMotion }))
        if (delay > 0) engine.after(delay, rise)
        else rise()
      } else
        engine.to(el, { y: hidden }, 'leave', {
          onArrive: () => {
            setMounted(false)
            onGone?.()
          },
        })
    })
  }, [present, mounted])

  return mounted ? (
    <div className={`mt-perch ${className}`.trim()} style={{ right }} aria-hidden="true">
      <div ref={lift} className="mt-perch__lift">
        {children}
      </div>
    </div>
  ) : null
}
