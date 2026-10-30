import { useRef, useState } from 'react'
import { dayLabel } from '../content/exam'
import { lessons } from '../content/lessons'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { RichText } from '../exam/Blocks'
import { useExam } from '../exam/store'
import { type LessonState, stateOf } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { type Backup, createBackup, parseBackup, readEntries, restoreEntries } from '../lib/backup/backup'
import { buildInfo } from '../lib/build-info'
import { versionLine } from '../lib/build-line'
import { appStorage } from '../lib/storage/app-storage'
import { openMistakes } from '../progress/mistakes'
import { saveSettings, useSettings } from '../progress/settings'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { Glyph } from './Glyph'
import { PressLink } from './PressLink'

export function MeView() {
  const records = useLessonRecords()
  const counts = { done: 0, current: 0, new: 0 }
  for (const lesson of lessons) counts[stateOf(records[lesson.id])]++

  return (
    <Screen title={strings.me.title}>
      <p className="dz-subhead sh-lead">{strings.me.subtitle}</p>
      <div className="dz-card sh-stats">
        <Stat state="done" value={counts.done} label={strings.me.statDone} />
        <Stat state="current" value={counts.current} label={strings.me.statOpen} />
        <Stat state="new" value={counts.new} label={strings.me.statNew} />
      </div>
      <MistakeLog />
      <h2 className="dz-section-label">{strings.me.settings}</h2>
      <div className="dz-list">
        <ExamDateSetting />
        <ThemeSetting />
      </div>
      <h2 className="dz-section-label">{strings.me.data}</h2>
      <div className="dz-list">
        <BackupSettings />
      </div>
      <p className="dz-footnote sh-version" data-testid="app-version">
        {versionLine()}
      </p>
    </Screen>
  )
}

function Stat({ state, value, label }: { state: LessonState; value: number; label: string }) {
  return (
    <div className="sh-stat">
      <Glyph state={state} />
      <b className="dz-title2 num">{value}</b>
      <span className="dz-footnote">{label}</span>
    </div>
  )
}

function MistakeLog() {
  const records = useLessonRecords()
  const { outcomes } = useExam()
  const list = openMistakes(lessons, records, questions, outcomes)
  return (
    <section aria-labelledby="mistakes">
      <h2 id="mistakes" className="dz-section-label">
        {strings.me.mistakes}
        {list.length ? ` · ${list.length}` : ''}
      </h2>
      {list.length ? (
        <>
          <ul className="dz-list sh-mistakes">
            {list.map((mistake) => (
              <li
                key={
                  mistake.source === 'lesson' ? `${mistake.lessonId}:${mistake.stepId}` : mistake.questionId
                }
              >
                {mistake.source === 'lesson' ? (
                  <PressLink
                    to="/lesson/$id"
                    params={{ id: mistake.lessonId }}
                    search={{ step: mistake.stepId }}
                    className="sh-mistake"
                  >
                    <span className="sh-mistake__code">{mistake.node}</span>
                    <span>
                      <b>
                        <RichText text={mistake.title} />
                      </b>
                      <RichText text={mistake.text} />
                    </span>
                  </PressLink>
                ) : (
                  <div className="sh-mistake">
                    <span className="sh-mistake__code">{mistake.node}</span>
                    <span>
                      <b>{strings.me.mistakeExam}</b>
                      <RichText text={mistake.text} />
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="dz-footnote sh-hint">{strings.me.mistakesHint}</p>
        </>
      ) : (
        <p className="dz-card dz-subhead">{strings.me.mistakesEmpty}</p>
      )}
    </section>
  )
}

function ExamDateSetting() {
  const settings = useSettings()
  return (
    <label className="dz-row">
      <span className="dz-row-main">
        {strings.me.examDate}
        <small className="dz-footnote sh-row-sub">
          {settings.examDate ? dayLabel(settings.examDate) : strings.me.examDateHint}
        </small>
      </span>
      <input
        type="date"
        className="sh-date"
        min="2026-11-01"
        max="2026-12-31"
        value={settings.examDate ?? ''}
        aria-label={strings.me.examDate}
        onChange={(event) => {
          const value = event.currentTarget.value
          const { examDate: _cleared, ...rest } = settings
          saveSettings(value ? { ...rest, examDate: value } : rest)
        }}
      />
    </label>
  )
}

function ThemeSetting() {
  const settings = useSettings()
  const value = settings.theme ?? 'system'
  return (
    <div className="dz-row">
      <span className="dz-row-main" id="theme-label">
        {strings.me.appearance}
      </span>
      <fieldset className="sh-segments" aria-labelledby="theme-label">
        {(['system', 'light', 'dark'] as const).map((option) => (
          <Pressable
            key={option}
            className="sh-segment"
            aria-pressed={value === option}
            onClick={() => {
              const { theme: _old, ...rest } = settings
              saveSettings(option === 'system' ? rest : { ...rest, theme: option })
            }}
          >
            {strings.me.appearanceOptions[option]}
          </Pressable>
        ))}
      </fieldset>
    </div>
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
      <Pressable className="dz-row" onClick={() => void exportBackup()}>
        <span className="dz-row-main">
          {strings.me.backup}
          <small className="dz-footnote sh-row-sub">{strings.me.backupHint}</small>
        </span>
        <span className="dz-chevron">
          <ChevronRight />
        </span>
      </Pressable>
      <Pressable className="dz-row" onClick={() => file.current?.click()}>
        <span className="dz-row-main">
          {strings.me.restore}
          <small className="dz-footnote sh-row-sub">{strings.me.restoreHint}</small>
        </span>
        <span className="dz-chevron">
          <ChevronRight />
        </span>
      </Pressable>
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
            <Pressable className="dz-button" data-kind="secondary" onClick={() => setPending(null)}>
              {strings.me.cancel}
            </Pressable>
            <Pressable
              className="dz-button"
              data-kind="primary"
              onClick={() => {
                restoreEntries(appStorage, pending)
                window.location.reload()
              }}
            >
              {strings.me.restoreAction}
            </Pressable>
          </div>
        </div>
      ) : null}
    </>
  )
}
