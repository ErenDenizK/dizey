import { useEffect, useLayoutEffect, useRef } from 'react'
import { engine } from '../engine/driver'

const TRAVEL = 20
const STRETCH = 1.2

/**
 * On/off switch. A native `<input type="checkbox" switch>` sits on top and takes the tap, so the
 * control has native semantics and, on iOS 18+, the system haptic tick. The visible track and knob
 * are drawn by the engine: the knob widens while pressed (`tap`), travels with `snap`, and the track
 * colour follows as an effect (`fade`), never overshooting.
 */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  const root = useRef<HTMLSpanElement>(null)
  const knob = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)

  useLayoutEffect(() => {
    const r = root.current
    const k = knob.current
    if (!r || !k) return
    if (!placed.current) {
      placed.current = true
      engine.set(r, { '--on': checked ? 1 : 0 })
      engine.set(k, { x: checked ? TRAVEL : 0 })
      return
    }
    engine.withChannel('chrome', () => {
      engine.to(r, { '--on': checked ? 1 : 0 }, 'fade', { effect: true })
      engine.to(k, { x: checked ? TRAVEL : 0, scaleX: 1 }, 'snap')
    })
  }, [checked])

  useEffect(() => {
    const k = knob.current
    const input = root.current?.querySelector('input')
    if (!k || !input) return
    const down = () => engine.withChannel('chrome', () => engine.to(k, { scaleX: STRETCH }, 'tap'))
    const up = () => engine.withChannel('chrome', () => engine.to(k, { scaleX: 1 }, 'release'))
    input.addEventListener('pointerdown', down)
    input.addEventListener('pointerup', up)
    input.addEventListener('pointercancel', up)
    input.addEventListener('pointerleave', up)
    return () => {
      input.removeEventListener('pointerdown', down)
      input.removeEventListener('pointerup', up)
      input.removeEventListener('pointercancel', up)
      input.removeEventListener('pointerleave', up)
    }
  }, [])

  return (
    <span ref={root} className="dz-switch">
      <input
        type="checkbox"
        // @ts-expect-error: `switch` is a WebKit boolean attribute (Safari 17.4+), unknown to React's types.
        switch=""
        role="switch"
        checked={checked}
        aria-checked={checked}
        aria-label={label}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span className="dz-switch-track" aria-hidden="true" />
      <span ref={knob} className="dz-switch-knob" aria-hidden="true" />
    </span>
  )
}
