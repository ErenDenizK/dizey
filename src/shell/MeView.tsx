import { useState } from 'react'
import { lessons } from '../content/lessons'
import { chapters, codeOfNode } from '../content/path'
import { questions } from '../content/questions'
import { strings } from '../content/strings'
import { RichText } from '../exam/Blocks'
import { useExam } from '../exam/store'
import { stateOf } from '../lesson/state'
import { useLessonRecords } from '../lesson/store'
import { openMistakes } from '../progress/mistakes'
import { BadgeShelf } from '../rewards/BadgeShelf'
import { GearIcon } from '../ui/icons'
import { Pressable } from '../ui/Pressable'
import { Screen } from '../ui/Screen'
import { PressLink } from './PressLink'
import { morphFrom } from './stage'
import './me.css'

export function MeView() {
  return (
    <Screen
      title={strings.me.title}
      action={
        <PressLink
          to="/settings"
          className="dz-icon-button dz-icon-button--float"
          aria-label={strings.settings.open}
          data-testid="open-settings"
          data-sound="open"
          onClick={(event) => {
            morphFrom.current = event.currentTarget
          }}
        >
          <GearIcon />
        </PressLink>
      }
    >
      <CourseMatrix />
      <BadgeShelf />
      <MistakeLog />
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
                    <span className="sh-mistake__code">{codeOfNode(mistake.node)}</span>
                    <span>
                      <b>
                        <RichText text={mistake.title} />
                      </b>
                      <RichText text={mistake.text} />
                    </span>
                  </PressLink>
                ) : (
                  <div className="sh-mistake">
                    <span className="sh-mistake__code">{codeOfNode(mistake.node)}</span>
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
