import { readSettings, type Settings, saveSettings } from '../progress/settings'
import type { PaletteId } from './palettes'

/** The learner's palette, as the id tokens.css knows; absent in settings means Kehribar. */
export const paletteOf = (settings: Settings): PaletteId => settings.colours ?? 'kehribar'

/** Lays the palette over the whole app and tints the browser chrome to its ground. */
export function applyPalette(id: PaletteId) {
  const root = document.documentElement
  if (id === 'kehribar') delete root.dataset.palette
  else root.dataset.palette = id
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || meta.content
}

export function choosePalette(id: PaletteId) {
  const { colours: _, ...rest } = readSettings()
  saveSettings(id === 'kehribar' ? rest : { ...rest, colours: id })
  applyPalette(id)
}

/** Before the first paint: the saved palette, so the app never flashes the base colours. */
export function installPalette() {
  applyPalette(paletteOf(readSettings()))
}
