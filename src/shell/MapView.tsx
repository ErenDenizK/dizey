import { useState } from 'react'
import { createPortal } from 'react-dom'
import { lessons } from '../content/lessons'
import type { Lesson } from '../content/lessons/types'
import { strings } from '../content/strings'
import { examItemTotal, unitOf, units } from '../content/units'
import { resumeIndex } from '../lesson/progress'
import { stateOf } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { ChevronRight } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { Sheet } from '../ui/Sheet'
import { Glyph } from './Glyph'
import { PressLink } from './PressLink'
import { overlayHostRef, stageRef } from './stage'

export function MapView() {
  const records = useLessonRecords()
  const [picked, setPicked] = useState<Lesson | null>(null)
  const [open, setOpen] = useState(false)

  return (
    <Screen title={strings.map.title}>
      <p className="dz-subhead sh-lead">{strings.map.subtitle}</p>
      {units.map((unit) => {
        const list = lessons.filter((lesson) => unitOf(lesson) === unit)
        if (!list.length) return null
        const done = list.filter((lesson) => stateOf(records[lesson.id]) === 'done').length
        return (
          <section key={unit.prefix} aria-labelledby={`unit-${unit.prefix}`}>
            <div className="sh-unit-head">
              <h2 id={`unit-${unit.prefix}`} className="dz-headline">
                {unit.label}
              </h2>
              <span className="dz-footnote">{strings.map.unitProgress(done, list.length)}</span>
            </div>
            <p className="dz-footnote sh-unit-weight">
              {strings.map.unitWeight(unit.examItems, examItemTotal)}
            </p>
            <div className="dz-list">
              {list.map((lesson) => {
                const state = stateOf(records[lesson.id])
                return (
                  <Pressable
                    key={lesson.id}
                    className="dz-row"
                    aria-label={`${lesson.node} ${lesson.title}, ${strings.map.state[state]}`}
                    onClick={() => {
                      setPicked(lesson)
                      setOpen(true)
                    }}
                  >
                    <Glyph state={state} />
                    <span className="dz-row-main sh-node">
                      <span className="dz-footnote sh-code">{lesson.node}</span>
                      <span>{lesson.title}</span>
                      <span className="dz-footnote">{strings.map.state[state]}</span>
                    </span>
                    <span className="dz-chevron">
                      <ChevronRight />
                    </span>
                  </Pressable>
                )
              })}
            </div>
          </section>
        )
      })}
      {overlayHostRef.current
        ? createPortal(
            <Sheet open={open} onClose={() => setOpen(false)} stage={stageRef} label={picked?.title ?? ''}>
              {picked ? <LessonCard lesson={picked} /> : null}
            </Sheet>,
            overlayHostRef.current,
          )
        : null}
    </Screen>
  )
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const records = useLessonRecords()
  const record = records[lesson.id]
  const state = stateOf(record)
  const total = lesson.steps.length
  const status =
    state === 'current' && record
      ? strings.sheet.resumeAt(resumeIndex(lesson, record) + 1, total)
      : strings.map.state[state]
  const action =
    state === 'done'
      ? strings.sheet.review(lesson.title)
      : state === 'current'
        ? strings.sheet.resume(lesson.title)
        : strings.sheet.enter(lesson.title)
  return (
    <div className="sh-sheet-body">
      <span className="dz-footnote sh-code">{lesson.node}</span>
      <h2 className="dz-title2">{lesson.title}</h2>
      <dl className="sh-facts">
        <div>
          <dt className="dz-footnote">{strings.sheet.status}</dt>
          <dd>{status}</dd>
        </div>
        <div>
          <dt className="dz-footnote">{strings.sheet.length}</dt>
          <dd>{strings.today.lessonSteps(total)}</dd>
        </div>
      </dl>
      <PressLink
        to="/lesson/$id"
        params={{ id: lesson.id }}
        className="dz-button"
        data-kind="primary"
        data-wide=""
        aria-label={action}
      >
        {action.split(':')[0]}
      </PressLink>
    </div>
  )
}
