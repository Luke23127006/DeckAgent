import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { HtmlFormatAdapter } from '../packages/presentation/html/lib/index.js'
import { browserSession } from './lib/browser-session.mjs'
import { layoutFixtures } from './lib/layout-fixtures.mjs'

export async function renderLayoutGallery(output, options = {}) {
  const root = resolve(output)
  await mkdir(root, { recursive: true })
  const browser = await browserSession()
  try {
    const adapter = new HtmlFormatAdapter(),
      links = []
    for (const context of await layoutFixtures(options)) {
      const artifact = adapter.build(adapter.context(context).starter, context)
      await writeFile(join(root, `${context.name}.html`), artifact.preview)
      await browser.page(artifact.preview)
      const screenshot = await browser.call('Page.captureScreenshot', { format: 'png' })
      await writeFile(join(root, `${context.name}.png`), Buffer.from(screenshot.data, 'base64'))
      links.push(
        `<article><h2>${context.name}</h2><a href="${context.name}.html"><img src="${context.name}.png" alt="${context.name}"></a></article>`,
      )
    }
    const escapeHtml = value =>
      String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    const credits = (options.imageCredits ?? [])
      .map(c => `<li>${escapeHtml(c.author)} · ${escapeHtml(c.license)} · ${escapeHtml(c.url)}</li>`)
      .join('')
    await writeFile(
      join(root, 'index.html'),
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>HTML Basic v3 layout gallery</title><style>body{font-family:system-ui;margin:32px;background:#eee;color:#111}main{display:grid;gap:32px;grid-template-columns:repeat(auto-fit,minmax(480px,1fr))}img{width:100%;display:block}article{min-width:0}p{max-width:900px}li{overflow-wrap:anywhere}</style><h1>HTML Basic v3</h1><p>Seven controlled layouts with the unchanged DeckAgent Neutral theme. Reference images demonstrate composition; they do not establish automated image relevance. Open a slide to view its 1280×720 artifact.</p><main>${links.join('')}</main><footer><h2>Reference image credits</h2><ul>${credits || '<li>Generated colour fixtures used for geometry checks.</li>'}</ul></footer></html>`,
    )
  } finally {
    await browser.close()
  }
  return join(root, 'index.html')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const output = process.argv[2] ?? '.local/layout-gallery-v3'
  console.log(await renderLayoutGallery(output, { imagePaths: process.argv.slice(3, 5) }))
}
