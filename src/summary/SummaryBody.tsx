import { strings } from '../content/strings'
import type { Summary } from '../content/summaries'
import { Matrix, RichText } from '../exam/Blocks'
import './summary.css'

/**
 * One lesson's one-page summary: what it is about, the rules to remember, the classic exam trap and a tiny
 * example drawn with the same matrices as the lessons. The same body sits in a pushed page and in the sheet
 * opened from a lesson's end.
 */
export function SummaryBody({ summary }: { summary: Summary }) {
  const { example } = summary
  return (
    <div className="sm" data-testid="summary-body">
      <p className="dz-callout sm-gist">
        <RichText text={summary.gist} />
      </p>

      <section className="sm-group">
        <h2 className="dz-section-label sm-label">{strings.summary.rules}</h2>
        <ul className="sm-points">
          {summary.points.map((point) => (
            <li key={point} className="sm-point">
              <RichText text={point} />
            </li>
          ))}
        </ul>
      </section>

      <section className="sm-group">
        <h2 className="dz-section-label sm-label sm-label--trap">{strings.summary.trap}</h2>
        <p className="sm-trap">
          <RichText text={summary.trap} />
        </p>
      </section>

      {example ? (
        <section className="sm-group">
          <h2 className="dz-section-label sm-label">{strings.summary.example}</h2>
          <div className="sm-example">
            <div className="sm-example__mats">
              {example.show.map((name) => {
                const block = example.matrices[name]
                return block ? <Matrix key={name} block={block} /> : null
              })}
            </div>
            <p className="sm-example__line">
              <RichText text={example.line} />
            </p>
          </div>
        </section>
      ) : null}
    </div>
  )
}
