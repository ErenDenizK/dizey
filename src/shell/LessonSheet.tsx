import { useEffect, useRef } from 'react'
import { strings } from '../content/strings'
import { fade, slideSheet } from './motion'
import { lessonName, lessonState, unitOf } from './progress'
import { startLesson, useShell } from './store'

/** Bottom sheet for one lesson: what it is, where you are in it, and the way in. */
export function LessonSheet({ code, onClose }: { code: string | null; onClose: () => void }) {
  const { catalog, done, resume } = useShell()
  const go = useRef<HTMLButtonElement>(null)
  // The last lesson stays rendered while the sheet slides away.
  const last = useRef(code)
  if (code) last.current = code
  const shown = last.current
  const open = Boolean(code && catalog)
  const sheet = useRef<HTMLDivElement>(null)
  const scrim = useRef<HTMLButtonElement>(null)
  const openRef = useRef(open)

  useEffect(() => {
    openRef.current = open
    if (!sheet.current || !scrim.current) return
    // A closing sheet that is reopened before it lands must stay visible.
    const isClosed = () => !openRef.current
    slideSheet(sheet.current, open, isClosed)
    fade(scrim.current, open, isClosed)
  }, [open])

  useEffect(() => {
    if (!open) return
    go.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!shown || !catalog) return null
  const name = lessonName(catalog, shown)
  const state = lessonState(shown, catalog, done, resume)
  const total = catalog.steps[shown] ?? 0
  const status =
    state === 'current' && resume ? strings.sheet.resumeAt(resume.step + 1, total) : strings.map.state[state]
  const action =
    state === 'current'
      ? strings.sheet.resume(name)
      : state === 'done'
        ? strings.sheet.review(name)
        : strings.sheet.enter(name)

  return (
    <>
      <button
        ref={scrim}
        type="button"
        className="sh-scrim"
        aria-label={strings.sheet.close}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <div
        ref={sheet}
        className="sh-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sh-sheet-title"
        inert={!open}
      >
        <div className="sh-grab" />
        <div>
          <p className="sh-sub">
            {shown} · {unitOf(catalog, shown)?.label}
          </p>
          <h3 id="sh-sheet-title">{name}</h3>
        </div>
        <dl className="sh-kv">
          <dt>{strings.sheet.status}</dt>
          <dd>{status}</dd>
          <dt>{strings.sheet.length}</dt>
          <dd>{strings.today.lessonSteps(total)}</dd>
        </dl>
        <button
          ref={go}
          type="button"
          className="sh-btn sh-btn--primary"
          onClick={(event) => {
            const origin = event.currentTarget
            onClose()
            startLesson(shown, origin)
          }}
        >
          {action}
        </button>
      </div>
    </>
  )
}
