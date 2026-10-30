import { useEffect, useRef } from 'react'
import './fonts.css'
import './v21.css'
import './additions.css'
import markup from './v21-markup.html?raw'

let booted = false

/**
 * The kept v21 lesson layer, mounted once for the app's lifetime and shown above the shell while a
 * lesson is open. Its script reads the DOM at load time, so the markup goes in first and the script
 * is imported once, after it. The v21 course map stays in the DOM (the script expects it) but is
 * hidden: the shell replaces it.
 */
export function LessonLayer({ active }: { active: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (booted || !host.current) return
    booted = true
    host.current.innerHTML = markup
    void import('./v21.js')
  }, [])
  return <div ref={host} className="v21-host" data-active={active} inert={!active} />
}
