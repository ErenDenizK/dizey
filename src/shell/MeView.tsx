import { useRef, useState } from 'react'
import { dayLabel } from '../content/exam'
import { lessons } from '../content/lessons'
import { chapters } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { RichText } from '../exam/Blocks'
import { useExam } from '../exam/store'
import { stateOf } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { type Backup, createBackup, parseBackup, readEntries, restoreEntries } from '../lib/backup/backup'
import { buildInfo } from '../lib/build-info'
import { versionLine } from '../lib/build-line'
import { appStorage } from '../lib/storage/app-storage'
import { openMistakes } from '../progress/mistakes'
import { saveSettings, useSettings } from '../progress/settings'
import { setSoundOn } from '../sound/player'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { Switch } from '../ui/Switch'
import { PressLink } from './PressLink'
import './me.css'

export function MeView() {
  return (
    <Screen title={strings.me.title}>
      <CourseMatrix />
      <MistakeLog />
      <h2 className="dz-section-label">{strings.me.settings}</h2>
      <div className="dz-list">
        <ThemeSetting />
        <SoundSetting />
        <ExamDateSetting />
      </div>
      <h2 className="dz-section-label">{strings.me.data}</h2>
      <div className="dz-list">
        <BackupSettings />
      </div>
      <footer className="me-foot">
        <span className="me-foot__mark" aria-hidden="true">
          [<b>{strings.appName}</b>]
        </span>
        <span className="dz-footnote" data-testid="app-version">
          {versionLine()}
        </span>
      </footer>
    </Screen>
  )
}

/**
 * The profile's head: the whole course as one matrix, a row per chapter and a cell per lesson, beside the
 * three numbers that matter before the exam. It is the same picture as the Dersler path, folded small.
 */
function CourseMatrix() {
  const records = useLessonRecords()
  const { outcomes, history } = useExam()
  const done = lessons.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
  const mistakes = openMistakes(lessons, records, questions, outcomes).length
  const best = history.reduce<(typeof history)[number] | null>(
    (top, entry) => (!top || entry.percent > top.percent ? entry : top),
    null,
  )
  const widest = Math.max(...chapters.map((chapter) => chapter.lessons.length))
  return (
    <section className="me-hero" aria-label={strings.me.matrix}>
      <div className="me-hero__matrix" style={{ '--cols': widest } as React.CSSProperties}>
        {chapters.map((chapter) => (
          <div key={chapter.id} className="me-hero__row" title={chapter.label}>
            {chapter.lessons.map((lesson) => (
              <i key={lesson.id} data-state={stateOf(records[lesson.id])} />
            ))}
          </div>
        ))}
      </div>
      <dl className="me-hero__stats">
        <div>
          <dt className="dz-footnote">{strings.me.statLessons}</dt>
          <dd className="num">
            {done}
            <small> / {lessons.length}</small>
          </dd>
        </div>
        <div>
          <dt className="dz-footnote">{strings.me.statMistakes}</dt>
          <dd className="num">{mistakes}</dd>
        </div>
        <div>
          <dt className="dz-footnote">{strings.me.statExam}</dt>
          <dd className="num">
            {best ? (
              <>
                {best.correct}
                <small> / {best.total}</small>
              </>
            ) : (
              <small>{strings.me.statExamNone}</small>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}

const MISTAKES_SHOWN = 3

function MistakeLog() {
  const records = useLessonRecords()
  const { outcomes } = useExam()
  const [all, setAll] = useState(false)
  const list = openMistakes(lessons, records, questions, outcomes)
  const shown = all ? list : list.slice(0, MISTAKES_SHOWN)
  return (
    <section aria-labelledby="mistakes">
      <h2 id="mistakes" className="dz-section-label">
        {strings.me.mistakes}
        {list.length ? ` · ${list.length}` : ''}
      </h2>
      {list.length ? (
        <>
          <ul className="dz-list sh-mistakes">
            {shown.map((mistake) => (
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
            {list.length > MISTAKES_SHOWN ? (
              <li>
                <Pressable className="me-more" aria-expanded={all} onClick={() => setAll(!all)}>
                  {all ? strings.me.mistakesLess : strings.me.mistakesMore(list.length - MISTAKES_SHOWN)}
                </Pressable>
              </li>
            ) : null}
          </ul>
          <p className="dz-footnote sh-hint">{strings.me.mistakesHint}</p>
        </>
      ) : (
        <p className="dz-card dz-subhead">{strings.me.mistakesEmpty}</p>
      )}
    </section>
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
    <label className="dz-row">
      <Lead>
        <rect x="3" y="4.5" width="14" height="12.5" rx="3" />
        <path d="M3 8.5h14M7 2.5v4M13 2.5v4" />
      </Lead>
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
    <div className="dz-row me-theme">
      <Lead>
        <circle cx="10" cy="10" r="6.5" />
        <path d="M10 3.5a6.5 6.5 0 0 0 0 13z" className="me-lead__fill" />
      </Lead>
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

function SoundSetting() {
  const settings = useSettings()
  return (
    <div className="dz-row">
      <Lead>
        <path d="M3.5 8v4h3l4 3.5v-11L6.5 8z" />
        <path d="M13.5 7.5a3.5 3.5 0 0 1 0 5M15.5 5.5a6.4 6.4 0 0 1 0 9" />
      </Lead>
      <span className="dz-row-main">
        {strings.me.sound}
        <small className="dz-footnote sh-row-sub">{strings.me.soundHint}</small>
      </span>
      <Switch checked={settings.sound !== false} onChange={setSoundOn} label={strings.me.sound} />
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
        <Lead>
          <path d="M10 3v9M6.5 6.5 10 3l3.5 3.5M4 11.5V15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5" />
        </Lead>
        <span className="dz-row-main">
          {strings.me.backup}
          <small className="dz-footnote sh-row-sub">{strings.me.backupHint}</small>
        </span>
        <span className="dz-chevron">
          <ChevronRight />
        </span>
      </Pressable>
      <Pressable className="dz-row" onClick={() => file.current?.click()}>
        <Lead>
          <path d="M10 12V3M6.5 8.5 10 12l3.5-3.5M4 11.5V15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5" />
        </Lead>
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
