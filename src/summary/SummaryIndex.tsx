import { useNavigate } from '@tanstack/react-router'
import { chapters, pathCode, tileTitle } from '../content/path'
import { strings } from '../content/strings'
import { summaryOf } from '../content/summaries'
import { RichText } from '../exam/Blocks'
import { PressLink } from '../shell/PressLink'
import { ChevronRight } from '../ui/icons'
import { Screen } from '../ui/Screen'
import './summary.css'

/**
 * Son tekrar: the formula sheet first, then one row per lesson that has a summary, by chapter. A lesson that
 * has no summary yet is simply not listed.
 */
export function SummaryIndex() {
  const navigate = useNavigate()
  return (
    <Screen
      title={strings.summary.title}
      back={() => void navigate({ to: '/exam' })}
      backLabel={strings.summary.back}
      parent={strings.exam.title}
      pushed
      measure="read"
    >
      <div className="sm" data-testid="summary-index">
        <p className="dz-subhead sm-gist">{strings.summary.index.sub}</p>
        <section className="sm-group">
          <div className="dz-list">
            <PressLink to="/summary/formulas" className="dz-row sm-row" data-testid="open-formulas">
              <span className="dz-row-main">
                {strings.summary.formulas.title}
                <small className="dz-footnote sh-row-sub">{strings.summary.index.formulasSub}</small>
              </span>
              <ChevronRight />
            </PressLink>
          </div>
        </section>
        {chapters.map((chapter) => {
          const listed = chapter.lessons.filter((lesson) => summaryOf(lesson.id))
          if (!listed.length) return null
          return (
            <section key={chapter.id} className="sm-group">
              <h2 className="dz-section-label sm-label">{chapter.label}</h2>
              <div className="dz-list">
                {listed.map((lesson) => (
                  <PressLink
                    key={lesson.id}
                    to="/summary/$id"
                    params={{ id: lesson.id }}
                    className="dz-row sm-row"
                    data-testid={`summary-row-${lesson.id}`}
                  >
                    <span className="sm-row__code num">{pathCode(lesson)}</span>
                    <span className="dz-row-main">
                      {tileTitle(lesson)}
                      <small className="dz-footnote sh-row-sub">
                        <RichText text={summaryOf(lesson.id)?.gist ?? ''} />
                      </small>
                    </span>
                    <ChevronRight />
                  </PressLink>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </Screen>
  )
}
