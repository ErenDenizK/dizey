// Writes the site-wide 404.html for GitHub Pages. Pages serves it for any unknown path, so it sends
// deep links back to the right app (production or a PR preview) with the original path in ?p=;
// index.html restores the path before the router starts.
import { writeFileSync } from 'node:fs'

const [siteDir, repoBase = '/dizey/'] = process.argv.slice(2)
if (!siteDir) throw new Error('usage: node scripts/write-404.mjs <site-dir> [repo-base]')

const html = `<!doctype html>
<meta charset="utf-8">
<title>Dizey</title>
<script>
  const base = ${JSON.stringify(repoBase)}
  const path = location.pathname
  const preview = path.slice(base.length).match(/^pr-preview\\/pr-\\d+\\//)
  const appBase = base + (preview ? preview[0] : '')
  const rest = path.startsWith(appBase) ? path.slice(appBase.length) : ''
  const query = location.search ? '&' + location.search.slice(1) : ''
  location.replace(appBase + '?p=' + encodeURIComponent('/' + rest) + query + location.hash)
</script>
`
writeFileSync(`${siteDir}/404.html`, html)
