import { useEffect, useRef } from 'react'
import './fonts.css'
import './v21.css'
import './additions.css'
import markup from './v21-markup.html?raw'

let booted = false

/**
 * Mounts the kept v21 app (course map + lesson layer) exactly as it was. Its script reads the DOM
 * at load time, so the markup goes in first and the script is imported once, after it.
 */
export function LegacyApp() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (booted || !host.current) return
    booted = true
    host.current.innerHTML = markup
    void import('./v21.js')
  }, [])
  return <div ref={host} className="v21-host" />
}
