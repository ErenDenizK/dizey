import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Chrome } from './chrome'
import { Screen } from './Screen'

const variants: Chrome[] = ['scene', 'masthead']

describe.each(variants)('Screen chrome "%s"', (chrome) => {
  it('renders exactly one h1 on a tab screen', () => {
    const html = renderToStaticMarkup(
      <Screen title="Bugün" chrome={chrome}>
        <p>content</p>
      </Screen>,
    )
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).not.toContain('dz-icon-button--float')
  })

  it('renders exactly one h1 and a back control on a second-level screen', () => {
    const html = renderToStaticMarkup(
      <Screen title="Ayarlar" chrome={chrome} back={() => {}} backLabel="Sen’e dön" parent="Sen" pushed>
        <p>content</p>
      </Screen>,
    )
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toMatch(chrome === 'scene' ? /data-testid="screen-done"/ : /data-testid="screen-back"/)
    expect(html).not.toContain('dz-float-back')
  })
})
