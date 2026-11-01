import { describe, expect, it } from 'vitest'
import { presentationOf, SHEET_ROUTES, SHEETS_ON } from './presentation'

describe('presentationOf', () => {
  it('shows the exam as a sheet and settings as a push', () => {
    expect(SHEETS_ON).toBe(true)
    expect(presentationOf('/settings')).toBe('push')
    expect(presentationOf('/settings/')).toBe('push')
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
    expect(SHEET_ROUTES).toEqual(['/exam'])
  })
})
