import { useLayoutEffect, useRef } from 'react'
import { flight } from './flight'

/**
 * The layer hand-off flights happen in (src/character/flight.ts): fixed over the whole app frame, above a lesson
 * overlay, never taking a tap. Mount it once, in the shell.
 */
export function CatFlight() {
  const layer = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    flight.setLayer(layer.current)
    return () => {
      flight.finish()
      flight.setLayer(null)
    }
  }, [])
  return <div ref={layer} className="mt-flight" aria-hidden="true" />
}
