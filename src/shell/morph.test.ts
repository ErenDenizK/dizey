import { expect, test } from 'vitest'
import { engine } from '../engine/driver'
import { holdTag, release } from './morph'

/** A stand-in for an element: just what the helpers touch. */
function fakeElement(extra: Record<string, unknown> = {}) {
  const attrs = new Set<string>()
  return {
    style: { transform: '', opacity: '' },
    isConnected: true,
    setAttribute: (name: string) => attrs.add(name),
    removeAttribute: (name: string) => attrs.delete(name),
    hasAttribute: (name: string) => attrs.has(name),
    querySelectorAll: () => [],
    ...extra,
  }
}

test('a close that ends without its aftermath still releases the held tag', () => {
  const tag = fakeElement()
  const tile = fakeElement({ parentElement: { querySelectorAll: () => [tag] } })
  holdTag(tag as unknown as HTMLElement)
  expect(tag.style.opacity).toBe('0')
  release(tile as unknown as HTMLElement)
  engine.advance(1000)
  expect(tag.style.opacity).toBe('1')
  expect(tag.hasAttribute('data-held')).toBe(false)
})
