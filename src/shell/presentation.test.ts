import { describe, expect, it } from 'vitest'
import { presentationOf, SHEET_ROUTES, SHEETS_ON } from './presentation'

describe('presentationOf', () => {
  it('shows settings and the exam as sheets', () => {
    expect(SHEETS_ON).toBe(true)
    expect(presentationOf('/settings')).toBe('sheet')
    expect(presentationOf('/settings/')).toBe('sheet')
    expect(presentationOf('/exam')).toBe('sheet')
    expect(presentationOf('/exam/summer-2024')).toBe('sheet')
  })

  it('keeps lessons, tabs and lookalike prefixes as pushes', () => {
    expect(presentationOf('/lesson/d1-determinant')).toBe('push')
    expect(presentationOf('/')).toBe('push')
    expect(presentationOf('/me')).toBe('push')
    expect(presentationOf('/examples')).toBe('push')
    expect(presentationOf('/settingsx')).toBe('push')
  })

  it('lists the routes in one constant', () => {
    expect(SHEET_ROUTES).toEqual(['/settings', '/exam'])
  })
})
