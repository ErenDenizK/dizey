import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { dayLabel } from '../content/exam'
import { strings } from '../content/strings'
import { type Backup, createBackup, parseBackup, readEntries, restoreEntries } from '../lib/backup/backup'
import { buildInfo } from '../lib/build-info'
import { versionLine } from '../lib/build-line'
import { appStorage } from '../lib/storage/app-storage'
import { readSettings, saveSettings, useSettings } from '../progress/settings'
import { haptic } from '../sound/haptics'
import { setMusicOn, setSoundInSilent, setSoundOn } from '../sound/player'
import { choosePalette, paletteOf } from '../styles/apply-palette'
import { PALETTE_IDS } from '../styles/palettes'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { Switch } from '../ui/Switch'
import { PressLink } from './PressLink'
import './me.css'

/** How long the version line is held to reveal the labs. */
const LABS_HOLD_MS = 600

/** Whether the labs have been revealed: for this session only, nothing is stored. */
let labsShown = false

/** Every setting in one pushed screen, opened from the gear in Profil. Back returns to Profil. */
export function SettingsView() {
  const navigate = useNavigate()
  const [labs, setLabs] = useState(labsShown)
  return (
    <Screen
      title={strings.settings.title}
      back={() => void navigate({ to: '/me' })}
      backLabel={strings.settings.back}
      parent={strings.me.title}
      pushed
    >
      <PaletteSetting />
      <h2 className="dz-section-label">{strings.settings.motion}</h2>
      <div className="dz-list">
        <CellRevealSetting />
      </div>
      <h2 className="dz-section-label">{strings.settings.audio}</h2>
      <div className="dz-list">
        <SoundSetting />
      </div>
      <h2 className="dz-section-label">{strings.settings.exam}</h2>
      <div className="dz-list">
        <ExamDateSetting />
      </div>
      <h2 className="dz-section-label">{strings.settings.data}</h2>
      <div className="dz-list">
        <BackupSettings />
      </div>
      {labs ? (
        <section aria-labelledby="labs" data-testid="labs">
          <h2 id="labs" className="dz-section-label">
            {strings.settings.labs}
          </h2>
          <div className="dz-list">
            <PressLink to="/lab/character" className="dz-row" data-sound="open">
              <Lead>
                <circle cx="7.5" cy="11.5" r="4" />
                <circle cx="12.5" cy="7.5" r="4" />
              </Lead>
              <span className="dz-row-main">{strings.settings.characterLab}</span>
              <span className="dz-chevron">
                <ChevronRight />
              </span>
            </PressLink>
            <PressLink to="/lab/sounds" className="dz-row" data-sound="open">
              <Lead>
                <path d="M4 12.5V8M7.5 15V5.5M11 13V7M14.5 11V9" />
              </Lead>
              <span className="dz-row-main">{strings.settings.soundLab}</span>
              <span className="dz-chevron">
                <ChevronRight />
              </span>
            </PressLink>
          </div>
        </section>
      ) : null}
      <VersionFoot
        onReveal={() => {
          labsShown = true
          setLabs(true)
          haptic()
        }}
      />
    </Screen>
  )
}

/** The mark and the version line. Holding it for 600 ms reveals the labs (no context menu, touch included). */
function VersionFoot({ onReveal }: { onReveal: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])
  useEffect(() => cancel, [cancel])
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a hidden long press; the labs are not a primary path
    <footer
      className="me-foot"
      data-testid="version-foot"
      onPointerDown={() => {
        cancel()
        timer.current = setTimeout(() => {
          timer.current = null
          onReveal()
        }, LABS_HOLD_MS)
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="me-foot__mark" aria-hidden="true">
        [<b>{strings.appName}</b>]
      </span>
      <span className="dz-footnote" data-testid="app-version">
        {versionLine()}
      </span>
    </footer>
  )
}

/** A setting's leading mark: a small tile in the row, like the lesson tiles. */
function Lead({ children }: { children: React.ReactNode }) {
  return (
    <span className="me-lead" aria-hidden="true">
      <svg viewBox="0 0 20 20" aria-hidden="true">
        {children}
      </svg>
    </span>
  )
}

function ExamDateSetting() {
  const settings = useSettings()
  return (
    <label className="dz-row me-date-row">
      <Lead>
        <rect x="3" y="4.5" width="14" height="12.5" rx="3" />
        <path d="M3 8.5h14M7 2.5v4M13 2.5v4" />
      </Lead>
      <span className="dz-row-main">{strings.settings.examDate}</span>
      {/* Trailing value and chevron, like every other row that opens something. The native picker opens
          from an invisible input laid over the whole row, so no locale placeholder (mm/dd/yyyy) shows. */}
      <span className="me-date" data-set={settings.examDate ? '' : undefined} aria-hidden="true">
        {settings.examDate ? dayLabel(settings.examDate) : strings.settings.examDatePick}
        <span className="dz-chevron">
          <ChevronRight />
        </span>
      </span>
      <input
        type="date"
        className="me-date__input"
        min="2026-11-01"
        max="2026-12-31"
        value={settings.examDate ?? ''}
        aria-label={strings.settings.examDate}
        onChange={(event) => {
          const value = event.currentTarget.value
          const { examDate: _cleared, ...rest } = settings
          saveSettings(value ? { ...rest, examDate: value } : rest)
        }}
      />
    </label>
  )
}

/**
 * The colour palettes in one row. Every swatch is drawn in its own palette's tokens (data-palette-preview), so
 * the learner sees all four at once; the choice applies to the whole app the moment it is tapped, and the chosen
 * swatch carries a ring.
 */
function PaletteSetting() {
  const current = paletteOf(useSettings())
  return (
    <section aria-labelledby="palette">
      <h2 id="palette" className="dz-section-label">
        {strings.settings.appearance}
      </h2>
      <div className="me-palettes">
        {PALETTE_IDS.map((id) => (
          <Pressable
            key={id}
            className="me-palette"
            data-palette-preview={id}
            data-sound="select"
            aria-pressed={id === current}
            onClick={() => choosePalette(id)}
          >
            <span className="me-palette__chip" aria-hidden="true">
              <i className="me-palette__line" />
              <i className="me-palette__line me-palette__line--short" />
              <span className="me-palette__roles">
                <i data-role="ok" />
                <i data-role="bad" />
                <i data-role="action" />
              </span>
            </span>
            <span className="me-palette__name">{strings.settings.palettes[id]}</span>
          </Pressable>
        ))}
      </div>
    </section>
  )
}

function SoundSetting() {
  const settings = useSettings()
  const on = settings.sound !== false
  return (
    <>
      <div className="dz-row">
        <Lead>
          <path d="M3.5 8v4h3l4 3.5v-11L6.5 8z" />
          <path d="M13.5 7.5a3.5 3.5 0 0 1 0 5M15.5 5.5a6.4 6.4 0 0 1 0 9" />
        </Lead>
        <span className="dz-row-main">{strings.settings.sound}</span>
        <Switch checked={on} onChange={setSoundOn} label={strings.settings.sound} />
      </div>
      {on ? (
        <div className="dz-row">
          <Lead>
            <path d="M8 14.5V4.5l8-1.5v10" />
            <circle cx="6" cy="14.5" r="2" />
            <circle cx="14" cy="13" r="2" />
          </Lead>
          <span className="dz-row-main">{strings.settings.music}</span>
          <Switch checked={settings.music !== false} onChange={setMusicOn} label={strings.settings.music} />
        </div>
      ) : null}
      {on ? (
        <div className="dz-row">
          <Lead>
            <path d="M7 3.5h6a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 15V5A1.5 1.5 0 0 1 7 3.5z" />
            <path d="M5.5 6.5h-2M5.5 9h-2" />
          </Lead>
          <span className="dz-row-main">{strings.settings.soundInSilent}</span>
          <Switch
            checked={settings.soundInSilent === true}
            onChange={setSoundInSilent}
            label={strings.settings.soundInSilent}
          />
        </div>
      ) : null}
      <div className="dz-row">
        <Lead>
          <rect x="6.5" y="3.5" width="7" height="13" rx="2" />
          <path d="M3.5 7.5v5M16.5 7.5v5" />
        </Lead>
        <span className="dz-row-main">{strings.settings.haptics}</span>
        <Switch
          checked={settings.haptics !== false}
          onChange={(next) => {
            const { haptics: _, ...rest } = readSettings()
            saveSettings(next ? rest : { ...rest, haptics: false })
            if (next) haptic()
          }}
          label={strings.settings.haptics}
        />
      </div>
    </>
  )
}

function BackupSettings() {
  const file = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [error, setError] = useState(false)

  async function exportBackup() {
    const now = new Date()
    const backup = createBackup(readEntries(appStorage), buildInfo.channel, now)
    const name = strings.settings.backupFileName(now.toISOString().slice(0, 10))
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
      <Pressable className="dz-row" onClick={() => void exportBackup()}>
        <Lead>
          <path d="M10 3v9M6.5 6.5 10 3l3.5 3.5M4 11.5V15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5" />
        </Lead>
        <span className="dz-row-main">{strings.settings.backup}</span>
        <span className="dz-chevron">
          <ChevronRight />
        </span>
      </Pressable>
      <Pressable className="dz-row" onClick={() => file.current?.click()}>
        <Lead>
          <path d="M10 12V3M6.5 8.5 10 12l3.5-3.5M4 11.5V15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5" />
        </Lead>
        <span className="dz-row-main">{strings.settings.restore}</span>
        <span className="dz-chevron">
          <ChevronRight />
        </span>
      </Pressable>
      {error ? (
        <p className="sh-note" role="alert">
          {strings.settings.restoreInvalid}
        </p>
      ) : null}
      {pending ? (
        <div className="sh-note" role="alertdialog" aria-label={strings.settings.restore}>
          <p>
            {strings.settings.restoreConfirm(
              Object.keys(pending.entries).length,
              new Date(pending.exportedAt).toLocaleDateString('tr-TR'),
            )}
          </p>
          <div className="sh-note__actions">
            <Pressable className="dz-button" data-kind="secondary" onClick={() => setPending(null)}>
              {strings.settings.cancel}
            </Pressable>
            <Pressable
              className="dz-button"
              data-kind="primary"
              onClick={() => {
                restoreEntries(appStorage, pending)
                window.location.reload()
              }}
            >
              {strings.settings.restoreAction}
            </Pressable>
          </div>
        </div>
      ) : null}
    </>
  )
}

function CellRevealSetting() {
  const settings = useSettings()
  return (
    <div className="dz-row">
      <Lead>
        <rect x="3.5" y="3.5" width="5" height="5" rx="1" />
        <rect x="11.5" y="3.5" width="5" height="5" rx="1" />
        <rect x="3.5" y="11.5" width="5" height="5" rx="1" />
        <rect x="11.5" y="11.5" width="5" height="5" rx="1" />
      </Lead>
      <span className="dz-row-main">{strings.settings.cellReveal}</span>
      <Switch
        checked={settings.cellReveal === true}
        onChange={(next) => {
          const { cellReveal: _, ...rest } = readSettings()
          saveSettings(next ? { ...rest, cellReveal: true } : rest)
        }}
        label={strings.settings.cellReveal}
      />
    </div>
  )
}
