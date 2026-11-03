import { useRouter } from '@tanstack/react-router'
import { strings } from '../content/strings'
import { formulaGroups } from '../content/summaries'
import { RichText } from '../exam/Blocks'
import { Screen } from '../ui/Screen'
import './summary.css'

/**
 * Formül kağıdı: every Vize 1 formula and rule on one scrollable page, grouped by chapter. Each line is the
 * formula large and its short reading under it; nothing opens or closes, so the page reads top to bottom.
 */
export function FormulaPage() {
  const router = useRouter()
  return (
    <Screen
      title={strings.summary.formulas.title}
      back={() => router.history.back()}
      backLabel={strings.chrome.back}
      parent={strings.summary.title}
      pushed
      measure="read"
    >
      <div className="sm" data-testid="formula-sheet">
        <p className="dz-subhead sm-gist">{strings.summary.formulas.sub}</p>
        {formulaGroups.map((group) => (
          <section key={group.id} className="sm-group" data-testid={`formula-group-${group.id}`}>
            <h2 className="dz-section-label sm-label">{group.title}</h2>
            <ul className="sm-points sm-formulas">
              {group.formulas.map((formula) => (
                <li key={formula.tex} className="sm-formula">
                  <span className="sm-formula__tex">
                    <RichText text={formula.tex} />
                  </span>
                  {formula.note ? (
                    <span className="dz-footnote sm-formula__note">
                      <RichText text={formula.note} />
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Screen>
  )
}
