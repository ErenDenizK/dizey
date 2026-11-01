import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

const channel = process.env.E2E_CHANNEL ?? 'production'
const prefix = channel === 'production' ? '' : `${channel}:`

/** Opens the app past the first-launch install guide (covered by its own test). */
async function openApp(page: Page, path = './') {
  await page.addInitScript((key) => localStorage.setItem(key, '1'), `${prefix}dizey.onboarding.safari`)
  await page.goto(path)
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).toBeVisible()
}

/** The tab screen on show (the other tab panes stay mounted but inert). */
const screen = (page: Page) => page.locator('.sh-pane:not([inert])')
const pushed = (page: Page) => page.locator('.sh-overlay')
const tab = (page: Page, name: string) => page.getByRole('navigation').getByRole('button', { name })

test('Harita offers the first lesson on the path', async ({ page }) => {
  await openApp(page, './map')
  await expect(screen(page).getByRole('heading', { name: 'Harita', level: 1 })).toBeVisible()
  await expect(screen(page).getByTestId('continue-card')).toHaveAttribute('aria-label', /^Başla: 1\.1 /)
  await expect(screen(page).getByText('Vize 1 · 15 Kasım civarı')).toBeVisible()
})

test('the path groups lessons into chapters and Sen shows version and commit', async ({ page }) => {
  await openApp(page, './map')
  await expect(screen(page).getByRole('heading', { name: 'Determinant', exact: true })).toBeVisible()
  await expect(screen(page).getByText(/sınavda 13 \/ 34 soru/)).toBeVisible()
  await tab(page, 'Sen').click()
  await page.getByTestId('open-settings').click()
  await expect(page.getByTestId('app-version')).toContainText(/Sürüm \d+\.\d+\.\d+ · ([0-9a-f]{7}|unknown)/)
  if (channel !== 'production') await expect(page.getByTestId('app-version')).toContainText(channel)
})

test('the tab bar is Bugün, Harita, Sen and a fresh start leads into the first lesson and back', async ({
  page,
}) => {
  await openApp(page)
  const buttons = page.getByRole('navigation', { name: 'Bölümler' }).getByRole('button')
  await expect(buttons).toHaveText(['Bugün', 'Harita', 'Sen'])
  await expect(screen(page).getByRole('heading', { level: 1 })).toHaveText(
    /^(Günaydın|İyi günler|İyi akşamlar|İyi geceler)$/,
  )
  const next = screen(page).getByTestId('today-next')
  await expect(next).toContainText('Başla')
  await expect(next).toContainText('1.1')
  await next.click()
  await expect(page).toHaveURL(/\/lesson\//)
  await expect(page.getByTestId('lesson-player')).toBeVisible()
  await page.getByRole('link', { name: 'Dersten çık' }).click()
  await expect(page.getByTestId('lesson-player')).toHaveCount(0)
  await expect(page).not.toHaveURL(/\/lesson\//)
  await expect(screen(page).getByTestId('today-next')).toBeVisible()
})

test('a tile opens its card, a tap outside folds it back, and the lesson grows out of the card and returns', async ({
  page,
}) => {
  await openApp(page, './map')
  // By data attribute: a tile hidden while its card is open leaves the accessibility tree, and it becomes the continue card once its lesson is opened.
  const tile = screen(page).locator('.pa-tile[data-lesson="m3-trace"]')
  const card = page.getByTestId('lesson-peek')
  await tile.click()
  await expect(card).toBeVisible()
  await expect(card.getByRole('link', { name: /^Derse gir/ })).toBeVisible()
  await expect(tile).toHaveCSS('visibility', 'hidden')
  // Tap outside (the scrim above the card): the card folds into its tile.
  await page.mouse.click(195, 60)
  await expect(card).toHaveCount(0)
  await expect(tile).toBeVisible()
  await tile.click()
  await card.getByRole('link', { name: /^Derse gir/ }).click()
  await expect(page).toHaveURL(/\/lesson\//)
  await expect(page.getByTestId('lesson-player')).toBeVisible()
  await page.getByTestId('lesson-player').getByRole('link', { name: 'Dersten çık' }).click()
  await expect(page.getByTestId('lesson-player')).toHaveCount(0)
  await expect(page).not.toHaveURL(/\/lesson\//)
  await expect(tile).toBeVisible()
  await expect(card).toHaveCount(0)
})

test('a lesson opens from its tile card and hides the tab bar', async ({ page }) => {
  await openApp(page, './map')
  await screen(page)
    .getByRole('button', { name: /^3\.1 / })
    .click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toContainText('14 adım')
  await sheet.getByRole('link', { name: /^Derse gir/ }).click()
  await expect(page.getByTestId('lesson-player')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Bölümler' })).not.toBeInViewport()
})

test('a lesson plays, checks answers and resumes where it was left', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './lesson/d1-determinant')
  const player = page.getByTestId('lesson-player')
  await expect(player).toBeVisible()
  const next = player.getByRole('button', { name: 'İleri' })
  while (!(await player.getByRole('group').count())) await next.click()
  // A wrong option names the mistake and stays disabled; the right one unlocks İleri.
  const options = player.getByRole('group').getByRole('button')
  await options.filter({ hasText: '26' }).click()
  await expect(player.getByRole('status')).toContainText('Tekrar dene.')
  await options.filter({ hasText: /^b/ }).click()
  await expect(player.getByRole('status')).toContainText('Doğru')
  await next.click()
  const step = await player.getByRole('progressbar').getAttribute('aria-valuenow')
  await page.reload()
  await expect(page.getByTestId('lesson-player').getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    step ?? '',
  )
  await page.getByRole('link', { name: 'Dersten çık' }).click()
  await expect(screen(page).getByTestId('today-next')).toContainText('Devam et')
  await expect(screen(page).getByTestId('today-next')).toContainText('3.1')
})

test('finishing a lesson shows its answers seal and offers the next lesson', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './lesson/r2-echelon-forms?step=summary')
  await page.getByTestId('lesson-player').getByRole('button', { name: 'Dersi bitir' }).click()
  const end = page.getByTestId('lesson-end')
  await expect(end).toContainText('Ders tamam')
  await expect(end.getByRole('img', { name: /3 sorunun cevapları/ })).toBeVisible()
  await end.getByRole('button', { name: /Sıradaki · 2\.3/ }).click()
  await expect(page).toHaveURL(/lesson\/r3-rank/)
  await expect(page.getByTestId('lesson-player').getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  )
})

test('the question of the day is answered in a sheet, stays answered and a wrong one joins Tekrar', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page)
  const card = screen(page).getByTestId('today-daily')
  await expect(card).toContainText('Günün sorusu')
  await card.click()
  const sheet = page.getByTestId('question-sheet')
  await expect(sheet).toBeVisible()
  await expect(page.getByTestId('question-check')).toBeDisabled()
  await sheet.getByTestId('question-option-a').click()
  await page.getByTestId('question-check').click()
  const result = sheet.getByTestId('question-result')
  await expect(result).toContainText('Çözüm')
  const right = (await result.getAttribute('data-correct')) === 'true'
  await sheet.getByRole('button', { name: 'Tamam' }).click()
  await expect(sheet).toHaveCount(0)
  const verdict = right ? 'Bugünkü soru: doğru' : 'Bugünkü soru: yanlış'
  await expect(card).toContainText(verdict)
  // Answered stays answered across a reload, and the day shows on the week strip.
  await page.reload()
  await expect(screen(page).getByTestId('today-daily')).toContainText(verdict)
  await expect(screen(page).getByTestId('today-week')).toBeVisible()
  await expect(screen(page).getByTestId('today-review')).toHaveCount(right ? 0 : 1)
})

test('Bugün shows no week strip before any study', async ({ page }) => {
  await openApp(page)
  await expect(screen(page).getByTestId('today-next')).toBeVisible()
  await expect(screen(page).getByTestId('today-week')).toHaveCount(0)
})

test('a lesson end offers one exam question on its topic', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './lesson/r2-echelon-forms?step=summary')
  await page.getByTestId('lesson-player').getByRole('button', { name: 'Dersi bitir' }).click()
  const asked = page.getByTestId('lesson-exam-asked')
  await expect(asked).toContainText('Sınavda böyle sorulur')
  await asked.click()
  const sheet = page.getByTestId('question-sheet')
  await expect(sheet).toBeVisible()
  await sheet.getByTestId('question-option-a').click()
  await page.getByTestId('question-check').click()
  await expect(sheet.getByTestId('question-result')).toContainText('Çözüm')
  await sheet.getByRole('button', { name: 'Tamam' }).click()
  await expect(sheet).toHaveCount(0)
})

test('the gizli an follows Bitir: a wrong pick is neutral, the right one earns the sezgi mührü', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './lesson/d1-determinant?step=summary')
  const player = page.getByTestId('lesson-player')
  await player.getByRole('button', { name: 'Dersi bitir' }).click()
  await expect(page.getByTestId('lesson-end')).toHaveCount(0)
  await expect(player).toContainText('Gizli an · not tutulmaz')
  await expect(player.getByRole('button', { name: 'Gizli soruyu geç' })).toBeVisible()
  // A wrong pick is struck out and disabled, says why, and does not end anything.
  const options = player.getByRole('group').getByRole('button')
  await options.filter({ hasText: '28' }).click()
  await expect(options.filter({ hasText: '28' })).toBeDisabled()
  await expect(options.filter({ hasText: '28' })).toHaveAttribute('data-state', 'miss')
  await expect(player).toContainText('Yalnız sağa inenleri topladın')
  await expect(page.getByTestId('lesson-end')).toHaveCount(0)
  await options.filter({ hasText: /^b/ }).click()
  await expect(player.getByRole('status')).toContainText('Doğru')
  await player.getByRole('button', { name: 'İleri' }).click()
  const end = page.getByTestId('lesson-end')
  await expect(end).toContainText('Gizli anı çözdün: sezgi mührü senin.')
  // The solved moment is stored and the badge follows.
  expect(await page.evaluate((k) => localStorage.getItem(k), `${prefix}dizey.moments`)).toBe(
    '{"d1-determinant":"solved"}',
  )
})

test('a wrong first try lands in the mistake log and leaves it when fixed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './lesson/d1-determinant')
  const player = page.getByTestId('lesson-player')
  const next = player.getByRole('button', { name: 'İleri' })
  while (!(await player.getByRole('group').count())) await next.click()
  await player.getByRole('group').getByRole('button').filter({ hasText: '26' }).click()
  await page.getByRole('link', { name: 'Dersten çık' }).click()
  await tab(page, 'Sen').click()
  const log = screen(page).getByRole('region', { name: /Hata defteri/ })
  await log.getByTestId('mistake-row').click()
  await expect(log).toContainText('İki çarpımı topladın')
  // Back to that step: a right first try on this visit clears it.
  await log.getByRole('link').first().click()
  await page
    .getByTestId('lesson-player')
    .getByRole('group')
    .getByRole('button')
    .filter({ hasText: /^b/ })
    .click()
  await page.getByRole('link', { name: 'Dersten çık' }).click()
  // An empty log is not shown at all.
  await expect(screen(page).getByRole('region', { name: /Hata defteri/ })).toHaveCount(0)
})

test('Sen is a profile scene: duo, readiness map, badge wall, moments, mistakes and the gear', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openApp(page, './me')
  const sen = screen(page)
  await expect(sen.getByTestId('me-scene')).toBeVisible()
  await expect(sen.getByTestId('me-scene')).toContainText(/dersin hepsi seni bekliyor/)
  // Nothing settings-like lives here; the mistake row is hidden while the log is empty.
  await expect(sen.getByRole('switch')).toHaveCount(0)
  await expect(sen.getByTestId('mistake-row')).toHaveCount(0)
  await expect(sen.getByRole('heading', { name: /Rozetler/ })).toBeVisible()
  await expect(sen.getByTestId('moments-album')).toBeVisible()
  // A wrong first try in the first determinant lesson fills the log row and colours its map cell.
  await openApp(page, './lesson/d1-determinant')
  const player = page.getByTestId('lesson-player')
  const next = player.getByRole('button', { name: 'İleri' })
  while (!(await player.getByRole('group').count())) await next.click()
  await player.getByRole('group').getByRole('button').filter({ hasText: '26' }).click()
  await page.getByRole('link', { name: 'Dersten çık' }).click()
  await tab(page, 'Sen').click()
  await expect(sen.locator('[data-lesson="d1-determinant"]')).toHaveAttribute('data-level', 'bad')
  await expect(sen.getByTestId('mistake-row')).toContainText('1 açık hata')
  // A map cell opens its lesson.
  await sen.locator('[data-lesson="d1-determinant"]').click()
  await expect(page.getByTestId('lesson-player')).toBeVisible()
  await page.getByRole('link', { name: 'Dersten çık' }).click()
  await tab(page, 'Sen').click()
  // The gear still opens Settings.
  await page.getByTestId('open-settings').click()
  await expect(page.getByRole('heading', { name: 'Ayarlar', level: 1 })).toBeVisible()
})

test('the exam line counts down once a date is set', async ({ page }) => {
  await openApp(page, './settings')
  await page.getByLabel('Vize 1 tarihi').fill('2026-11-19')
  // Reaching the field scrolled the page, which tucks the back button away; scrolling up brings it back.
  await pushed(page)
    .locator('.dz-screen')
    .evaluate((s) => s.scrollTo(0, 0))
  await page.getByRole('button', { name: 'Sen’e dön' }).click()
  await tab(page, 'Harita').click()
  await expect(screen(page).getByText(/19 Kasım/)).toBeVisible()
})

test('every path tile shows its whole title at phone width', async ({ page }) => {
  await openApp(page, './map')
  const clipped = await screen(page)
    .locator('.pa-tile__title')
    .evaluateAll((titles) =>
      titles.filter((t) => t.scrollHeight > t.clientHeight + 1).map((t) => t.textContent),
    )
  expect(clipped).toEqual([])
})

test('scrolling Harita moves the path as one flat page', async ({ page }) => {
  await openApp(page, './map')
  const scroller = screen(page).locator('.dz-screen')
  await page.waitForTimeout(1500)
  const moved = await scroller.evaluate(async (s) => {
    s.scrollTop = 520
    s.dispatchEvent(new Event('scroll'))
    await new Promise((done) => setTimeout(done, 200))
    const pieces = [...s.querySelectorAll<HTMLElement>('.pa-summary, .pa-chapter__head, .pa-grid > li')]
    return pieces.filter(
      (el) => getComputedStyle(el).transform !== 'none' || getComputedStyle(el).opacity !== '1',
    ).length
  })
  // No piece of the path scales, shifts or fades on its own with the scroll.
  expect(moved).toBe(0)
})

test('the tab bar lens is a true pill, concentric with the bar', async ({ page }) => {
  await openApp(page)
  const lens = page.locator('.dz-tabbar-lens')
  await page.waitForTimeout(600)
  const style = await lens.evaluate((el: HTMLElement) => ({
    transform: getComputedStyle(el).transform,
    h: el.offsetHeight,
    w: el.offsetWidth,
  }))
  // Moved and sized without scaling, so its round ends stay circles.
  const m = style.transform === 'none' ? [1, 0, 0, 1] : style.transform.slice(7, -1).split(',').map(Number)
  expect(m[0]).toBeCloseTo(1, 3)
  expect(m[3]).toBeCloseTo(1, 3)
  expect(style.w).toBeGreaterThan(style.h)
})

test('settings live behind the gear in Sen: palette, back, and labs behind a long press', async ({
  page,
}) => {
  await openApp(page, './me')
  await expect(screen(page).getByRole('switch', { name: 'Sesler' })).toHaveCount(0)
  await page.getByTestId('open-settings').click()
  await expect(page.getByRole('heading', { name: 'Ayarlar', level: 1 })).toBeVisible()
  await expect(page.getByText('Görünüm', { exact: true })).toBeVisible()
  // The top fade must not cover the title at scroll 0, and must be there once the page has moved.
  const fadeOpacity = () =>
    pushed(page)
      .locator('.dz-edge-top')
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).opacity))
  await expect.poll(fadeOpacity).toBe(0)
  await page
    .locator('.dz-screen')
    .last()
    .evaluate((s) => s.scrollTo(0, 200))
  await expect.poll(fadeOpacity).toBeGreaterThan(0.5)
  await page
    .locator('.dz-screen')
    .last()
    .evaluate((s) => s.scrollTo(0, 0))
  await expect.poll(fadeOpacity).toBe(0)
  const before = await page.evaluate(() => document.documentElement.dataset.palette)
  const other = page.locator('[data-palette-preview="tahta"]')
  await other.click()
  await expect(other).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => document.documentElement.dataset.palette)).not.toBe(before)
  // Labs stay hidden until the version line is held.
  await expect(page.getByTestId('labs')).toHaveCount(0)
  const foot = page.getByTestId('version-foot')
  await foot.scrollIntoViewIfNeeded()
  const box = await foot.boundingBox()
  if (!box) throw new Error('no footer')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(800)
  await page.mouse.up()
  await expect(page.getByTestId('labs')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ses laboratuvarı' })).toBeVisible()
  await pushed(page)
    .locator('.dz-screen')
    .evaluate((s) => s.scrollTo(0, 0))
  await page.getByRole('button', { name: 'Sen’e dön' }).click()
  await expect(page).toHaveURL(/\/me$/)
  await expect(screen(page).getByRole('heading', { name: 'Sen', level: 1 })).toBeVisible()
})

test('the app is dark even when the phone is in light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await openApp(page, './me')
  await expect(screen(page).getByRole('button', { name: 'Koyu' })).toHaveCount(0)
  const ground = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)
  expect(ground).toBe('dark')
})

test('an exam rehearsal runs, survives a reload and shows its result', async ({ page }) => {
  await openApp(page, './exam')
  await pushed(page).getByTestId('exam-set-summer-2024').click()
  await page.getByTestId('exam-start').click()
  const run = page.getByTestId('exam-run')
  await expect(run.getByText(/^Soru 1 \/ \d+$/)).toBeVisible()
  const first = run.locator('.ex-opt').first()
  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'false')
  await first.click()
  await run.getByRole('button', { name: 'Sonraki' }).click()
  await expect(run.getByText(/^Soru 2 \/ \d+$/)).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('exam-run').getByText(/^Soru 2 \/ \d+$/)).toBeVisible()
  // Leaving keeps the attempt: the hub offers it back.
  await page.getByRole('link', { name: 'Provadan çık, sonra devam et' }).click()
  await expect(pushed(page).getByText('1 / 15 cevaplı', { exact: false })).toBeVisible()
  await pushed(page).getByRole('link', { name: 'Devam et' }).click()
  await expect(page.getByTestId('exam-run').getByText(/^Soru 2 \/ \d+$/)).toBeVisible()
  // Ending goes through the question map, which shows the blanks first.
  await page.getByRole('button', { name: /^Soru haritası/ }).click()
  await expect(page.getByText('14 soru boş.', { exact: false })).toBeVisible()
  await page.getByTestId('exam-finish').click()
  await expect(page.getByTestId('exam-score')).toContainText(/\d+ \/ \d+ doğru/)
  await expect(page.getByTestId('exam-score')).toContainText(/1 yanlış|0 yanlış/)
  await page.getByRole('button', { name: 'Bitti' }).click()
  await expect(pushed(page).getByRole('heading', { name: 'Geçmiş' })).toBeVisible()
  await pushed(page).getByRole('link', { name: 'Son prova sonucu' }).click()
  await expect(page.getByTestId('exam-score')).toBeVisible()
})

test('a chapter test runs six questions untimed and returns to Harita with its score', async ({ page }) => {
  await openApp(page, './map')
  const cell = screen(page).getByTestId('chapter-test-matrices')
  await expect(cell).toContainText('6 soru')
  await cell.click()
  const run = page.getByTestId('exam-run')
  await expect(run.getByText('Soru 1 / 6')).toBeVisible()
  // No clock on an untimed test.
  await expect(run.locator('.exr-clock')).toHaveCount(0)
  for (let at = 1; at < 6; at++) {
    await run.locator('.ex-opt').first().click()
    await run.getByRole('button', { name: 'Sonraki' }).click()
    await expect(run.getByText(`Soru ${at + 1} / 6`)).toBeVisible()
  }
  await run.getByRole('button', { name: 'Bitir' }).click()
  await page.getByTestId('exam-finish').click()
  await expect(page.getByTestId('exam-score')).toContainText(/\d+ \/ 6 doğru/)
  await page.getByRole('button', { name: 'Haritaya dön' }).click()
  await expect(screen(page).getByRole('heading', { name: 'Harita', level: 1 })).toBeVisible()
  await expect(pushed(page)).toHaveCount(0)
  await expect(cell).toContainText(/\d\/6$/)
  // A chapter test is not a rehearsal: the exam hub keeps no history for it.
  await page.goto('./exam')
  await expect(pushed(page).getByRole('heading', { name: 'Geçmiş' })).toHaveCount(0)
})

test('a chapter whose questions are still being written explains itself', async ({ page }) => {
  await openApp(page, './map')
  const cell = screen(page).getByTestId('chapter-test-row-operations')
  await expect(cell).toContainText('hazırlanıyor')
  await cell.click()
  const note = page.getByTestId('chapter-test-note')
  await expect(note.getByRole('heading', { name: 'Sorular hazırlanıyor' })).toBeVisible()
  await expect(note).toContainText('şu an 2 var')
  await note.getByRole('button', { name: 'Tamam' }).click()
  await expect(note).toBeHidden()
})

test('the Vize provası gate at the end of the map opens the exam hub', async ({ page }) => {
  await openApp(page, './map')
  await screen(page).getByTestId('vize-gate').click()
  await expect(pushed(page).getByRole('heading', { name: 'Sınav', level: 1 })).toBeVisible()
  await expect(pushed(page).getByTestId('exam-set-summer-2024')).toBeVisible()
})

test('first launch in iPhone Safari asks to install first', async ({ page, isMobile }, testInfo) => {
  test.skip(channel !== 'production' || testInfo.project.name !== 'iphone-webkit', 'production iPhone only')
  expect(isMobile).toBe(true)
  await page.goto('./')
  const guide = page.getByRole('dialog', { name: "Dizey'i ana ekrana ekle" })
  await expect(guide).toBeVisible()
  await guide.getByRole('button', { name: /Safari'de dene/ }).click()
  await expect(guide).toBeHidden()
  await page.reload()
  await expect(screen(page).getByTestId('today-next')).toBeVisible()
  await expect(guide).toBeHidden()
})

test('backup round-trips progress', async ({ page }) => {
  await openApp(page, './settings')
  const key = `${prefix}dizey.lessons`
  await page.evaluate((k) => localStorage.setItem(k, '{}'), key)
  const backup = {
    app: 'dizey',
    format: 1,
    exportedAt: '2026-10-30T12:00:00.000Z',
    channel,
    entries: { 'dizey.lessons': '{"d1-determinant":{"at":null,"doneAt":1,"answers":{}}}' },
  }
  await page.getByTestId('restore-file').setInputFiles({
    name: 'dizey-yedek.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })
  // Restoring reloads the page; wait for that load, not for the old page still on screen.
  const reloaded = page.waitForEvent('load')
  await page.getByRole('button', { name: 'Geri yükle', exact: true }).click()
  await reloaded
  await expect(page.getByTestId('app-version')).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    '{"d1-determinant":{"at":null,"doneAt":1,"answers":{}}}',
  )
})

test('a file that is not a backup is refused', async ({ page }) => {
  await openApp(page, './settings')
  await page.getByTestId('restore-file').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello":1}'),
  })
  await expect(page.getByRole('alert')).toHaveText('Bu dosya bir Dizey yedeği değil.')
})

for (const path of ['./', './map', './exam', './me', './settings']) {
  test(`no critical accessibility violations on ${path}`, async ({ page }) => {
    await openApp(page, path)
    const results = await new AxeBuilder({ page }).analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical')
    expect(critical.map((v) => v.id)).toEqual([])
  })
}

for (const colorScheme of ['dark'] as const) {
  test(`phone screenshots, ${colorScheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme })
    for (const [name, path] of [
      ['today', './'],
      ['path', './map'],
      ['exam', './exam'],
      ['me', './me'],
      ['settings', './settings'],
    ] as const) {
      await openApp(page, path)
      await page.waitForTimeout(400)
      await testInfo.attach(`${name}-${colorScheme}`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      })
    }
  })
}

test('only production registers a service worker', async ({ page }) => {
  await openApp(page)
  if (channel === 'production') {
    await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true), undefined, {
      timeout: 15_000,
    })
  } else {
    await page.waitForTimeout(1500)
  }
  const registrations = await page.evaluate(
    async () => (await navigator.serviceWorker.getRegistrations()).length,
  )
  expect(registrations > 0).toBe(channel === 'production')
})

test('preview progress is kept apart from production', async ({ page }) => {
  await openApp(page)
  const keys = await page.evaluate(() => Object.keys(localStorage))
  const appKeys = keys.filter((k) => k.includes('dizey'))
  expect(appKeys.length).toBeGreaterThan(0)
  if (channel === 'production') expect(appKeys.every((k) => !/^pr-\d+:/.test(k))).toBe(true)
  else expect(appKeys.every((k) => k.startsWith(`${channel}:`))).toBe(true)
})

test('unknown paths show the not-found view', async ({ page }) => {
  await openApp(page)
  await page.goto('./no-such-page')
  await expect(page.getByText('Bu sayfa yok.')).toBeVisible()
})

test.describe('motion and visual system lab', () => {
  test('tabs, sheet and switch respond', async ({ page }) => {
    await page.goto('./lab')
    await expect(page.getByRole('heading', { name: 'Bugün' })).toBeVisible()
    await page.getByRole('navigation').getByRole('button', { name: 'Harita' }).click()
    await expect(page.getByRole('heading', { name: 'Harita' })).toBeVisible()
    await page.getByRole('button', { name: /Laplace açılımı/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.getByRole('navigation').getByRole('button', { name: 'Ben' }).click()
    const sound = page.getByRole('switch', { name: 'Ses' })
    await sound.click()
    await expect(sound).toBeChecked()
  })

  test('has no serious accessibility violations', async ({ page }) => {
    await page.goto('./lab')
    await expect(page.getByRole('heading', { name: 'Bugün' })).toBeVisible()
    const results = await new AxeBuilder({ page })
      .include('.lab-pane:first-child')
      .include('.dz-tabbar')
      .analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious, JSON.stringify(serious.map((v) => [v.id, v.nodes.length]))).toEqual([])
  })
})

test.describe('small phone (375 x 667) reach', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('the daily question sheet keeps its action in view and the solution scrolls', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    // 5 Nov 2026 picks a tall question (a matrix stem with five options).
    await page.clock.setFixedTime(new Date('2026-11-05T10:00:00'))
    await openApp(page)
    await screen(page).getByTestId('today-daily').click()
    const sheet = page.getByTestId('question-sheet')
    const check = page.getByTestId('question-check')
    await expect(check).toBeVisible()
    const inView = async (id: string) => {
      const box = await page.getByTestId(id).boundingBox()
      return box !== null && box.y >= 0 && box.y + box.height <= 667
    }
    expect(await inView('question-check')).toBe(true)
    // The last option scrolls into view inside the sheet, above the pinned action.
    const last = page.getByTestId('question-option-e')
    await last.scrollIntoViewIfNeeded()
    const lastBox = await last.boundingBox()
    const checkBox = await check.boundingBox()
    expect(lastBox && checkBox && lastBox.y + lastBox.height <= checkBox.y).toBe(true)
    await last.click()
    await check.click()
    await expect(sheet.getByTestId('question-result')).toContainText('Çözüm')
    const done = sheet.getByRole('button', { name: 'Tamam' })
    expect(await done.boundingBox().then((box) => box !== null && box.y + box.height <= 667)).toBe(true)
    await done.click()
    await expect(sheet).toHaveCount(0)
  })

  test('the last option of a chapter test question scrolls fully above the action bar', async ({ page }) => {
    await openApp(page, './map')
    await screen(page).getByTestId('chapter-test-matrices').click()
    const run = page.getByTestId('exam-run')
    await expect(run.getByText('Soru 1 / 6')).toBeVisible()
    await run.locator('.ex-opt').last().scrollIntoViewIfNeeded()
    const last = await run.locator('.ex-opt').last().boundingBox()
    const dock = await run.locator('.exr-dock').boundingBox()
    expect(last && dock && last.y + last.height <= dock.y).toBe(true)
  })

  test('the lesson end hero keeps the whole duo inside its card', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page, './lesson/r2-echelon-forms?step=summary')
    await page.getByTestId('lesson-player').getByRole('button', { name: 'Dersi bitir' }).click()
    await expect(page.getByTestId('lesson-exam-asked')).toBeVisible()
    await page.waitForTimeout(1500)
    const hero = await page.locator('.ls-end__stage').boundingBox()
    const duo = await page.locator('.ls-duo').boundingBox()
    expect(hero && duo && duo.y >= hero.y && duo.y + duo.height <= hero.y + hero.height).toBe(true)
  })

  for (const [name, path] of [
    ['Bugün', './'],
    ['Harita', './map'],
    ['Sen', './me'],
  ] as const) {
    test(`${name} scrolls its last element clear of the tab bar`, async ({ page }) => {
      await openApp(page, path)
      const scroller = screen(page).locator('.dz-screen')
      const bottom = await scroller.evaluate((el) => {
        el.scrollTop = el.scrollHeight
        const kids = [...el.children].filter((kid) => kid.getBoundingClientRect().height > 0)
        return kids[kids.length - 1]?.getBoundingClientRect().bottom ?? 0
      })
      const bar = await page.getByRole('navigation', { name: 'Bölümler' }).boundingBox()
      expect(bar && bottom <= bar.y).toBe(true)
    })
  }

  test('a pushed screen floats its back button above the title without overlap', async ({ page }) => {
    await openApp(page, './settings')
    const title = page.getByRole('heading', { name: 'Ayarlar', level: 1 })
    // The screen arrives with motion: read the boxes once it has settled.
    await expect
      .poll(async () => {
        const back = await page.locator('.dz-float-back').boundingBox()
        const box = await title.boundingBox()
        return Boolean(back && box && back.y >= 8 && back.y + back.height <= box.y)
      })
      .toBe(true)
  })
})
