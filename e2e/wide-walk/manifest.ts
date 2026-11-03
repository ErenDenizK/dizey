import { type Measure, prefix, type Walk } from './harness'

/**
 * The screen manifest: one entry for every screen and overlay of the app, each with the real taps that reach it.
 * A new screen is added here (lessons.md, "Widescreen 0.62.0 shipped broken"); the spec measures every entry at
 * every size. Entries run in order and some chain on the one before (a lesson step on the step before it).
 */
export type Entry = {
  id: string
  /** Reaches the screen by taps, from wherever the previous entry left the app. */
  reach: (w: Walk) => Promise<void>
  /** The element whose box is the screen's content column (a content box when the column is made of padding). */
  primary: string
  measure: Measure
  /** Measure the border box (a dialog) instead of the content box (a surface that centres its content with padding). */
  box?: 'content' | 'border'
  /** A centred dialog from 600 px: needs a scrim over the whole window, and closes on Escape and on an outside tap. */
  dialog?: boolean
  /** The design token of the surface's background (default --bg). */
  bg?: string
  /** An in-flow side column at expanded sizes. */
  side?: string
  /** Undoes what `reach` left behind in storage, run once the screen has been measured and closed. */
  after?: (w: Walk) => Promise<void>
  /** Also compared at 320 x 568. */
  small?: boolean
  /** Skipped on phones (it only exists wide). */
  wideOnly?: boolean
  /** Elements left out of the phone layout snapshot (anything that changes with the build). */
  mask?: string[]
}

const pane = '.sh-pane:not([inert])'
const peekTile = (id: string) => async (w: Walk) => {
  await w.scrollPane('top')
  await w.intoView(`${pane} .pa-tile[data-lesson="${id}"]`)
  if (!(await w.tap(`${pane} .pa-tile[data-lesson="${id}"]`))) throw new Error(`no tile ${id}`)
  await w.settle(700)
}

export const manifest: Entry[] = [
  {
    id: 'yol',
    reach: async (w) => {
      await w.fresh('yol')
    },
    primary: `${pane} .ph-paper`,
    measure: 'stage',
    side: `${pane} .ph-dock`,
    small: true,
  },
  {
    id: 'yol-scrolled',
    reach: async (w) => w.scrollPane('end'),
    primary: `${pane} .ph-paper`,
    measure: 'stage',
    side: `${pane} .ph-dock`,
  },
  {
    id: 'peek-done',
    reach: peekTile('m1-reading-a-matrix'),
    primary: '[data-testid=lesson-peek]',
    measure: 'read',
    box: 'border',
    dialog: true,
  },
  {
    id: 'peek-current',
    reach: peekTile('m6-transpose'),
    primary: '[data-testid=lesson-peek]',
    measure: 'read',
    box: 'border',
    dialog: true,
  },
  {
    id: 'peek-locked',
    reach: peekTile('d1-determinant'),
    primary: '[data-testid=lesson-peek]',
    measure: 'read',
    box: 'border',
    dialog: true,
  },
  {
    id: 'daily-sheet',
    reach: async (w) => {
      await w.scrollPane('top')
      if (!(await w.tap('[data-testid=today-daily]'))) throw new Error('no daily')
      await w.settle(800)
    },
    primary: '.dz-sheet',
    measure: 'read',
    box: 'border',
    dialog: true,
  },
  {
    id: 'chapter-test-note',
    // Every chapter's test is ready now, so the sheet that can still open is the warning before a test would
    // replace a rehearsal in progress. A rehearsal is started from the hub, then a chapter test is tapped on Yol.
    reach: async (w) => {
      await w.fresh('yol')
      await w.intoView(`${pane} [data-testid=vize-gate]`)
      if (!(await w.tap(`${pane} [data-testid=vize-gate]`))) throw new Error('no gate')
      await w.page.waitForURL(/exam/, { timeout: 6000 })
      await w.settle(900)
      await w.tap('[data-testid^=exam-set-]')
      await w.settle(300)
      if (!(await w.tap('[data-testid=exam-start]'))) throw new Error('no start')
      await w.page.waitForURL(/run/, { timeout: 6000 })
      await w.fresh('yol')
      await w.intoView(`${pane} .pa-test`)
      if (!(await w.tap(`${pane} .pa-test`))) throw new Error('no chapter test')
      await w.settle(800)
    },
    // The rehearsal must not outlive the entry: the screens after it expect Yol and the hub without one.
    after: async (w) => {
      await w.page.evaluate((key) => localStorage.removeItem(key), `${prefix}dizey.exam.current`)
    },
    primary: '.dz-sheet',
    measure: 'read',
    box: 'border',
    dialog: true,
  },
  // A lesson, entered from the dock: it resumes on a keypad question, then plain steps and choices follow.
  {
    id: 'lesson-keypad',
    reach: async (w) => {
      await w.fresh('yol')
      if (!(await w.tap('[data-testid=today-next]'))) throw new Error('no next lesson')
      await w.settle(1400)
      if (!(await w.advanceUntil('keypad'))) throw new Error('no keypad step')
    },
    primary: '[data-testid=lesson-player]',
    measure: 'read',
    small: true,
  },
  {
    id: 'lesson-plain',
    reach: async (w) => {
      if (!(await w.advanceUntil('plain'))) throw new Error('no plain step')
    },
    primary: '[data-testid=lesson-player]',
    measure: 'read',
    small: true,
  },
  {
    id: 'lesson-choice',
    reach: async (w) => {
      if (!(await w.advanceUntil('choice'))) throw new Error('no choice step')
    },
    primary: '[data-testid=lesson-player]',
    measure: 'read',
    small: true,
  },
  {
    id: 'lesson-end',
    reach: async (w) => {
      if (!(await w.advanceUntil('end', 60))) throw new Error('lesson did not end')
      await w.settle(1400)
    },
    primary: '[data-testid=lesson-end]',
    measure: 'read',
  },
  // The summary sheet opens over the lesson end; the lesson end it belongs to is the entry just before.
  {
    id: 'lesson-summary-sheet',
    reach: async (w) => {
      if (!(await w.tap('[data-testid=lesson-summary-open]'))) throw new Error('no summary row')
      await w.settle(900)
    },
    primary: '.dz-sheet',
    measure: 'read',
    box: 'border',
    dialog: true,
  },
  {
    id: 'exam-home',
    reach: async (w) => {
      await w.fresh('yol')
      await w.intoView(`${pane} [data-testid=vize-gate]`)
      if (!(await w.tap(`${pane} [data-testid=vize-gate]`))) throw new Error('no gate')
      await w.page.waitForURL(/exam/, { timeout: 6000 })
      await w.settle(1300)
    },
    primary: '.exh',
    measure: 'read',
  },
  {
    id: 'exam-run',
    reach: async (w) => {
      await w.tap('[data-testid^=exam-set-]')
      await w.settle(300)
      if (!(await w.tap('[data-testid=exam-start]'))) throw new Error('no start')
      await w.page.waitForURL(/run/, { timeout: 6000 })
      await w.settle(1300)
    },
    primary: '.exr-frame',
    measure: 'read',
  },
  {
    id: 'exam-map-sheet',
    reach: async (w) => {
      if (!(await w.tap('.exr-paper'))) throw new Error('no paper')
      await w.settle(900)
    },
    primary: '.dz-sheet',
    measure: 'read',
    box: 'border',
    dialog: true,
  },
  {
    id: 'exam-result',
    reach: async (w) => {
      // Finishing lives in the question map.
      if (!(await w.tap('.exr-paper'))) throw new Error('no paper')
      await w.settle(900)
      if (!(await w.tap('[data-testid=exam-finish]'))) throw new Error('no finish')
      await w.page.waitForURL(/result/, { timeout: 6000 })
      await w.settle(1800)
    },
    primary: '[data-testid=exam-result]',
    measure: 'read',
  },
  {
    id: 'chapter-test-run',
    reach: async (w) => {
      await w.fresh('yol')
      await w.intoView(`${pane} .pa-test:not([data-state="preparing"])`)
      if (!(await w.tap(`${pane} .pa-test:not([data-state="preparing"])`))) throw new Error('no ready test')
      await w.page.waitForURL(/run/, { timeout: 6000 })
      await w.settle(1300)
    },
    primary: '.exr-frame',
    measure: 'read',
  },
  // Son tekrar: the summary list, one lesson's summary and the formula sheet, all reached from the exam hub.
  {
    id: 'summary-index',
    reach: async (w) => {
      await w.fresh('yol')
      await w.intoView(`${pane} [data-testid=vize-gate]`)
      if (!(await w.tap(`${pane} [data-testid=vize-gate]`))) throw new Error('no gate')
      await w.page.waitForURL(/exam/, { timeout: 6000 })
      await w.settle(1300)
      if (!(await w.tap('[data-testid=open-summaries]'))) throw new Error('no summaries row')
      await w.page.waitForURL(/summary/, { timeout: 6000 })
      await w.settle(1300)
    },
    primary: '[data-testid=summary-index]',
    measure: 'read',
  },
  {
    id: 'summary-lesson',
    reach: async (w) => {
      if (!(await w.tap('[data-testid=summary-row-r4-inverse]'))) throw new Error('no summary row')
      await w.page.waitForURL(/summary\/r4/, { timeout: 6000 })
      await w.settle(1300)
    },
    primary: '[data-testid=summary-body]',
    measure: 'read',
  },
  {
    id: 'formula-sheet',
    reach: async (w) => {
      if (!(await w.tap('[data-testid=screen-done]'))) throw new Error('no back')
      await w.settle(1300)
      if (!(await w.tap('[data-testid=open-formulas]'))) throw new Error('no formulas row')
      await w.page.waitForURL(/formulas/, { timeout: 6000 })
      await w.settle(1300)
    },
    primary: '[data-testid=formula-sheet]',
    measure: 'read',
  },
  {
    id: 'formula-sheet-middle',
    reach: async (w) => {
      await w.intoView('[data-testid=formula-group-determinants]')
    },
    primary: '[data-testid=formula-sheet]',
    measure: 'read',
  },
  {
    id: 'tekrar',
    reach: async (w) => {
      await w.fresh('yol')
      if (!(await w.tap('[data-testid=today-review]'))) throw new Error('no review')
      await w.settle(1600)
    },
    primary: '[data-testid=lesson-player]',
    measure: 'read',
  },
  {
    id: 'sen',
    reach: async (w) => {
      await w.fresh('sen')
    },
    primary: `${pane} .me-page`,
    measure: 'stage',
    side: `${pane} .me-aside`,
    small: true,
  },
  {
    id: 'sen-name-edit',
    reach: async (w) => {
      if (!(await w.tap('[data-testid=me-name]'))) throw new Error('no name')
      await w.settle(700)
    },
    primary: `${pane} .me-page`,
    measure: 'stage',
    side: `${pane} .me-aside`,
  },
  {
    id: 'sen-mistake-open',
    reach: async (w) => {
      await w.page.keyboard.type('x')
      await w.page.keyboard.press('Enter')
      await w.settle(500)
      if (!(await w.tap('[data-testid=mistake-group]'))) throw new Error('no mistake group')
      await w.settle(800)
      await w.intoView(`${pane} [data-testid=mistake-groups]`)
    },
    primary: `${pane} .me-page`,
    measure: 'stage',
    side: `${pane} .me-aside`,
  },
  {
    id: 'sen-badge-detail',
    reach: async (w) => {
      if (!(await w.tap('[data-testid=badge-earned]'))) throw new Error('no badge')
      await w.settle(1000)
    },
    primary: `${pane} .me-page`,
    measure: 'stage',
    side: `${pane} .me-aside`,
  },
  {
    id: 'sen-moments',
    reach: async (w) => {
      await w.intoView(`${pane} [data-testid=moments-album]`)
    },
    primary: `${pane} .me-page`,
    measure: 'stage',
    side: `${pane} .me-aside`,
  },
  {
    id: 'settings',
    reach: async (w) => {
      await w.fresh('sen')
      if (!(await w.tap('[data-testid=open-settings]'))) throw new Error('no gear')
      await w.page.waitForURL(/settings/, { timeout: 6000 })
      await w.settle(1500)
    },
    primary: '.sh-overlay .dz-screen',
    measure: 'page',
    mask: ['[data-testid=version-foot]', '[data-testid=app-version]'],
  },
  {
    id: 'lab-character',
    reach: async (w) => {
      await w.openLabs()
      if (!(await w.tap('a[href*="lab/character"]'))) throw new Error('no lab link')
      await w.page.waitForURL(/lab/, { timeout: 6000 })
      await w.settle(1500)
    },
    primary: '.dz-screen',
    measure: 'page',
  },
  {
    id: 'lab-sounds',
    reach: async (w) => {
      await w.openLabs()
      if (!(await w.tap('a[href*="lab/sounds"]'))) throw new Error('no sound lab link')
      await w.page.waitForURL(/sounds/, { timeout: 6000 })
      await w.settle(1500)
    },
    primary: '.dz-screen',
    measure: 'page',
  },
  {
    id: 'lab-motion',
    reach: async (w) => {
      await w.page.goto('./lab')
      await w.settle(1800)
    },
    primary: '.lab-pane .dz-screen',
    measure: 'page',
  },
]
