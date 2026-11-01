// Writes the colour palette blocks (src/styles/palettes.ts) into tokens.css between the palette markers.
// Run after changing a base colour token or a palette: node scripts/write-palettes.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { baseColourTokens, paletteCss, withPalettes } from '../src/styles/palettes.ts'

const file = new URL('../src/styles/tokens.css', import.meta.url)
const css = readFileSync(file, 'utf8')
const next = withPalettes(css, paletteCss(baseColourTokens(css)))
writeFileSync(file, next)
console.log(next === css ? 'palettes already up to date' : 'palettes written')
