import { useRef, useState } from 'react'
import { strings } from '../content/strings'
import { versionLine } from '../legacy/build-line'
import { appStorage } from '../legacy/storage'
import { type Backup, createBackup, parseBackup, readEntries, restoreEntries } from '../lib/backup/backup'
import { buildInfo } from '../lib/build-info'
import { Glyph } from './Glyph'
import { lessonState } from './progress'
import { useShell } from './store'

type SatirSound = { readonly muted: boolean; setMuted(muted: boolean): Promise<unknown> }

function sound(): SatirSound | undefined {
  return (globalThis as { SatirSound?: SatirSound }).SatirSound
}

export function MeView() {
  const { catalog, done, resume } = useShell()
  const counts = { done: 0, current: 0, new: 0 }
  for (const code of catalog?.ready ?? []) {
    const state = catalog ? lessonState(code, catalog, done, resume) : 'new'
    if (state !== 'soon') counts[state]++
  }

  return (
    <div className="sh-view">
      <header>
        <h1 className="sh-title">{strings.me.title}</h1>
        <p className="sh-sub">{strings.me.subtitle}</p>
      </header>
      <div className="sh-card sh-stats">
        <Stat state="done" value={counts.done} label={strings.me.statDone} />
        <Stat state="current" value={counts.current} label={strings.me.statOpen} />
        <Stat state="new" value={counts.new} label={strings.me.statNew} />
      </div>
      <section>
        <h2 className="sh-label">{strings.me.examTitle}</h2>
        <div className="sh-card sh-empty">
          <b>{strings.me.examSoonTitle}</b>
          <p>{strings.me.examSoonBody}</p>
        </div>
      </section>
      <section>
        <h2 className="sh-label">{strings.me.settings}</h2>
        <div className="sh-card sh-settings">
          <SoundSetting />
          <div className="sh-set">
            <span>
              {strings.me.appearance}
              <small>{strings.me.appearanceHint}</small>
            </span>
            <span className="sh-muted">{strings.me.appearanceValue}</span>
          </div>
          <BackupSettings />
        </div>
      </section>
      <p className="sh-version" data-testid="app-version">
        {versionLine()}
      </p>
    </div>
  )
}

function Stat({ state, value, label }: { state: 'done' | 'current' | 'new'; value: number; label: string }) {
  return (
    <div className="sh-stat">
      <Glyph state={state} />
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

function SoundSetting() {
  const [on, setOn] = useState(() => sound()?.muted === false)
  return (
    <label className="sh-set">
      <span>
        {strings.me.sound}
        <small>{strings.me.soundHint}</small>
      </span>
      {/* The switch attribute renders the iOS switch and gives its haptic tick. */}
      <input
        type="checkbox"
        className="sh-toggle"
        {...{ switch: '' }}
        checked={on}
        onChange={(event) => {
          const next = event.currentTarget.checked
          setOn(next)
          // A tap counts as the gesture iOS needs to start audio.
          void sound()?.setMuted(!next)
        }}
      />
    </label>
  )
}

function BackupSettings() {
  const file = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [error, setError] = useState(false)

  async function exportBackup() {
    const now = new Date()
    const backup = createBackup(readEntries(appStorage), buildInfo.channel, now)
    const name = strings.me.backupFileName(now.toISOString().slice(0, 10))
    const blob = new File([JSON.stringify(backup, null, 2)], name, { type: 'application/json' })
    // iPhone: the share sheet ("Save to Files") is the reliable way out of an installed web app.
    if (navigator.canShare?.({ files: [blob] })) {
      try {
        await navigator.share({ files: [blob] })
        return
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      }
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function chooseFile(selected: File | undefined) {
    if (!selected) return
    const backup = parseBackup(await selected.text())
    setError(!backup)
    setPending(backup)
    if (file.current) file.current.value = ''
  }

  return (
    <>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        data-testid="restore-file"
        onChange={(event) => void chooseFile(event.currentTarget.files?.[0])}
      />
      <button type="button" className="sh-set sh-set--button" onClick={() => void exportBackup()}>
        <span>
          {strings.me.backup}
          <small>{strings.me.backupHint}</small>
        </span>
        <span className="sh-chev" aria-hidden="true">
          ›
        </span>
      </button>
      <button
        type="button"
        className="sh-set sh-set--button sh-set--last"
        onClick={() => file.current?.click()}
      >
        <span>
          {strings.me.restore}
          <small>{strings.me.restoreHint}</small>
        </span>
        <span className="sh-chev" aria-hidden="true">
          ›
        </span>
      </button>
      {error ? (
        <p className="sh-note" role="alert">
          {strings.me.restoreInvalid}
        </p>
      ) : null}
      {pending ? (
        <div className="sh-note" role="alertdialog" aria-label={strings.me.restore}>
          <p>
            {strings.me.restoreConfirm(
              Object.keys(pending.entries).length,
              new Date(pending.exportedAt).toLocaleDateString('tr-TR'),
            )}
          </p>
          <div className="sh-note__actions">
            <button type="button" className="sh-btn sh-btn--soft" onClick={() => setPending(null)}>
              {strings.me.cancel}
            </button>
            <button
              type="button"
              className="sh-btn sh-btn--primary"
              onClick={() => {
                restoreEntries(appStorage, pending)
                window.location.reload()
              }}
            >
              {strings.me.restoreAction}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
