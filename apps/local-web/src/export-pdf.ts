import { access } from 'node:fs/promises'
import { chromium } from 'playwright-core'
import type { Browser } from 'playwright-core'
import { PDFDocument } from 'pdf-lib'
import { HttpError } from '@deckagent/host-api'
import { slideAssetIds, renderSlideAssets } from '@deckagent/deck'
import type { FrozenDeck } from '@deckagent/deck'
import type { ImageAssetStore } from './image-assets/store.ts'

export async function displaySlide(assets: ImageAssetStore, id: string, html: string): Promise<string> {
  const values = new Map<string, string>()
  const ids = slideAssetIds(html)
  if (ids.reduce((total, asset) => total + assets.get(id, asset).sizeBytes, 0) > 20 * 1024 * 1024)
    throw new HttpError(413, 'IMAGE_LIMIT')
  for (const asset of ids) values.set(asset, await assets.dataUrl(id, asset))
  return renderSlideAssets(html, values)
}
async function browserPath(explicit?: string): Promise<string> {
  const paths = explicit
    ? [explicit]
    : [
        process.env.DECKAGENT_EXPORT_BROWSER,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        '/usr/bin/chromium',
      ].filter((value): value is string => !!value)
  for (const path of paths)
    try {
      await access(path)
      return path
    } catch {
      /* Next installed browser. */
    }
  throw new HttpError(409, 'EXPORT_UNAVAILABLE')
}
/** PDF owns no conversation or deck writes. A request captures its snapshot first. */
export class PdfExporter {
  private readonly shutdown = new AbortController()
  private active: Promise<Uint8Array> | undefined
  private closed = false
  constructor(
    private readonly executable?: string,
    private readonly onLaunched?: () => void,
  ) {}
  run(snapshot: FrozenDeck, assets: ImageAssetStore, signal: AbortSignal): Promise<Uint8Array> {
    if (this.closed) throw new HttpError(503, 'HOST_CLOSED')
    if (this.active) throw new HttpError(429, 'EXPORT_BUSY')
    const combined = AbortSignal.any([signal, this.shutdown.signal, AbortSignal.timeout(60000)])
    const work = this.render(snapshot, assets, combined)
    this.active = work
    void work.then(
      () => {
        if (this.active === work) this.active = undefined
      },
      () => {
        if (this.active === work) this.active = undefined
      },
    )
    return work
  }
  private async render(snapshot: FrozenDeck, assets: ImageAssetStore, signal: AbortSignal): Promise<Uint8Array> {
    let browser: Browser | undefined
    const stop = () => {
      void browser?.close().catch(() => {})
    }
    signal.addEventListener('abort', stop, { once: true })
    try {
      signal.throwIfAborted()
      const ids = [...new Set(snapshot.slides.flatMap(slide => slideAssetIds(slide.html)))]
      const infos = ids.map(id => assets.get(snapshot.sessionId, id))
      if (
        snapshot.slides.length > 100 ||
        infos.reduce((total, info) => total + info.width * info.height, 0) > 32000000 ||
        infos.reduce((total, info) => total + info.sizeBytes, 0) > 20 * 1024 * 1024
      )
        throw new HttpError(413, 'EXPORT_LIMIT')
      const htmls: string[] = []
      let total = 0
      for (const slide of snapshot.slides) {
        signal.throwIfAborted()
        const html = await displaySlide(assets, snapshot.sessionId, slide.html)
        total += Buffer.byteLength(html)
        if (total > 80 * 1024 * 1024) throw new HttpError(413, 'EXPORT_LIMIT')
        htmls.push(html)
      }
      const executablePath = await browserPath(this.executable)
      signal.throwIfAborted()
      const env: Record<string, string> = {}
      for (const key of ['SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'PATH'])
        if (process.env[key]) env[key] = process.env[key]!
      browser = await chromium.launch({ executablePath, headless: true, chromiumSandbox: true, env, timeout: 15000 })
      this.onLaunched?.()
      signal.throwIfAborted()
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        javaScriptEnabled: false,
        serviceWorkers: 'block',
        acceptDownloads: false,
      })
      await context.route('**/*', route => route.abort('blockedbyclient'))
      const pdf = await PDFDocument.create()
      for (const html of htmls) {
        signal.throwIfAborted()
        const page = await context.newPage()
        try {
          await page.emulateMedia({ media: 'screen' })
          await page.setContent(
            `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">${html}`,
            { waitUntil: 'load', timeout: 15000 },
          )
          const valid = await page.evaluate(async () => {
            await document.fonts.ready
            await Promise.all([...document.images].map(image => image.decode().catch(() => {})))
            return [...document.images].every(image => image.complete && image.naturalWidth > 0)
          })
          if (!valid) throw new HttpError(422, 'IMAGE_UNAVAILABLE')
          signal.throwIfAborted()
          const bytes = await page.pdf({
            width: '1280px',
            height: '720px',
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            printBackground: true,
            preferCSSPageSize: false,
          })
          const part = await PDFDocument.load(bytes)
          if (part.getPageCount() !== 1) throw new HttpError(422, 'EXPORT_LAYOUT_OVERFLOW')
          const [copy] = await pdf.copyPages(part, [0])
          pdf.addPage(copy!)
        } finally {
          await page.close().catch(() => {})
        }
      }
      signal.throwIfAborted()
      pdf.setTitle(`DeckAgent ${snapshot.sessionId} v${snapshot.version}`)
      pdf.setCreator('DeckAgent')
      pdf.setSubject(
        JSON.stringify({
          version: snapshot.version,
          slides: snapshot.slides.map(slide => ({ id: slide.slideId, revision: slide.revision })),
          sources: infos.map(info => info.sourceUrl),
        }),
      )
      const bytes = await pdf.save()
      if (bytes.length > 50 * 1024 * 1024) throw new HttpError(413, 'EXPORT_LIMIT')
      signal.throwIfAborted()
      return bytes
    } catch (error) {
      if (signal.aborted) throw new HttpError(409, 'EXPORT_CANCELLED')
      if (error instanceof HttpError) throw error
      throw new HttpError(422, 'EXPORT_FAILED')
    } finally {
      signal.removeEventListener('abort', stop)
      await browser?.close()
    }
  }
  async close() {
    this.closed = true
    this.shutdown.abort()
    await this.active?.catch(() => {})
  }
}
