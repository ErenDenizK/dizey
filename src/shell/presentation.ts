/**
 * How a second-level route is shown. Top-chrome direction C ("Sahne") presents these routes as a sheet over
 * the dimmed tab; everything else (lessons, rehearsal runs' own screens) stays a full-screen push.
 */
export type Presentation = 'push' | 'sheet'

/** Routes that open as a sheet, matched as path prefixes (`/exam` also covers `/exam/...`). */
export const SHEET_ROUTES = ['/settings', '/exam']

/** The one switch: false returns every route to a full-screen push (direction swap-back). */
export const SHEETS_ON = true

export function presentationOf(pathname: string): Presentation {
  if (!SHEETS_ON) return 'push'
  const path = pathname.replace(/\/+$/, '') || '/'
  return SHEET_ROUTES.some((route) => path === route || path.startsWith(`${route}/`)) ? 'sheet' : 'push'
}
