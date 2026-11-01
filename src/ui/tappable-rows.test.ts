import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * A tappable item (a pressable with a chevron: title, optional subtitle, chevron) looks the same on every screen:
 * its title is the row title (.dz-row-main, body size, medium) and its subtitle the row subtitle
 * (.dz-footnote.sh-row-sub). A card title role (title3 and up) on such an item reads bolder than the same item
 * one tab over, which is the menu inconsistency Eren reported (2026-10-31 23:28Z). The labs are dev tools and exempt.
 */
const root = new URL('../', import.meta.url).pathname
const SCREENS = ['exam', 'shell']

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

/** The JSX of each pressable that ends in a chevron, from its opening tag to the chevron. */
function tappableItems(source: string): string[] {
  const items: string[] = []
  for (const chevron of source.matchAll(/<ChevronRight\b/g)) {
    const before = source.slice(0, chevron.index)
    const open = Math.max(before.lastIndexOf('<Pressable'), before.lastIndexOf('<PressLink'))
    if (open >= 0) items.push(before.slice(open))
  }
  return items
}

const sources = SCREENS.flatMap((dir) => files(join(root, dir)))
  .filter((path) => path.endsWith('.tsx') && !path.includes('.test.'))
  .map((path) => [path.slice(root.length), readFileSync(path, 'utf8')] as const)
  .filter(([, source]) => tappableItems(source).length > 0)

describe('tappable items share one title and subtitle role', () => {
  it('finds tappable items to check', () => {
    expect(sources.length).toBeGreaterThan(0)
  })

  it.each(sources.map(([path, source]) => [path, source]))('%s', (_path, source) => {
    // An item whose content is built elsewhere (`{body}`) is checked where that content is written.
    const roles = /dz-(row-main|large-title|title\d|headline|footnote|subhead|caption)\b/
    for (const item of tappableItems(source).filter((jsx) => roles.test(jsx))) {
      expect(item, item).toMatch(/dz-row-main/)
      expect(item, item).not.toMatch(/dz-(large-title|title1|title2|title3|headline)\b/)
      if (/dz-(footnote|subhead|caption)\b/.test(item.replace(/dz-row-main[^"]*"/g, '')))
        expect(item, item).toMatch(/dz-footnote sh-row-sub/)
    }
  })
})
