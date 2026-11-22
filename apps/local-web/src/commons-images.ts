import { createHash, randomUUID } from 'node:crypto'
import { AttachmentParser } from '@deckagent/file-tools'
import { DeckError } from '@deckagent/deck'
import type { ImageCredit, PreparedResearchImage } from '@deckagent/deck'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const safeUrl = (value: unknown, host: string): string | undefined => {
  try {
    const url = new URL(String(value))
    return url.protocol === 'https:' && url.hostname === host && !url.port && !url.username && !url.password
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

async function limited(response: Response, max: number): Promise<Buffer> {
  if (!response.ok || !response.body || Number(response.headers.get('content-length') ?? 0) > max) {
    await response.body?.cancel().catch(() => {})
    throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
  }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let count = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      count += value.length
      if (count > max) throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
      chunks.push(value)
    }
    return Buffer.concat(chunks)
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export interface CommonsCandidate {
  readonly originalUrl?: string
  readonly imageUrl: string
  readonly sourceUrl: string
  readonly title: string
  readonly description: string
  readonly credit: ImageCredit
}

/** Fixed public metadata/upload hosts only; no provider key, arbitrary URL, redirect or model switch. */
export class CommonsImages {
  private readonly parser = new AttachmentParser()
  constructor(private readonly request: typeof fetch = fetch) {}
  close(): Promise<void> {
    return this.parser.close()
  }

  async candidates(query: string, signal: AbortSignal, title?: string): Promise<readonly CommonsCandidate[]> {
    if ((!query.trim() && !title) || query.length > 500) throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
    const operation = AbortSignal.any([signal, AbortSignal.timeout(20000)])
    const headers = {
      'User-Agent': 'DeckAgent/0.0.0 (https://github.com/Luke23127006/DeckAgent)',
      Accept: 'application/json',
    }
    const url = new URL('https://commons.wikimedia.org/w/api.php')
    url.search = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `${query} filetype:bitmap`,
      gsrnamespace: '6',
      gsrlimit: '5',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|size',
      iiurlwidth: '1024',
      format: 'json',
      formatversion: '2',
    }).toString()
    if (title) {
      for (const key of ['generator', 'gsrsearch', 'gsrnamespace', 'gsrlimit']) url.searchParams.delete(key)
      url.searchParams.set('titles', title)
    }
    try {
      const metadata: unknown = JSON.parse(
        (
          await limited(await this.request(url.href, { headers, signal: operation, redirect: 'error' }), 1024 * 1024)
        ).toString('utf8'),
      )
      const pages =
        object(metadata) && object(metadata.query) && Array.isArray(metadata.query.pages) ? metadata.query.pages : []
      const candidates: CommonsCandidate[] = []
      for (const page of pages.slice(0, 5)) {
        if (!object(page) || !Array.isArray(page.imageinfo) || !object(page.imageinfo[0])) continue
        const info = page.imageinfo[0]
        const image =
          safeUrl(info.thumburl ?? info.url, 'upload.wikimedia.org') ?? safeUrl(info.thumburl, 'thumb.wikimedia.org')
        const source = safeUrl(info.descriptionurl, 'commons.wikimedia.org')
        if (!image || !source || !object(info.extmetadata)) continue
        const value = (key: string) =>
          object(info.extmetadata) && object(info.extmetadata[key]) && typeof info.extmetadata[key].value === 'string'
            ? (info.extmetadata[key].value as string)
            : ''
        const name = value('LicenseShortName').trim()
        const link = value('LicenseUrl')
        if (name && !/^CC0$|^public domain$|^CC BY [1-4]\.\d(?: [A-Z-]+)?$/i.test(name)) continue
        let license: ImageCredit['license']
        if (name === 'CC0' || /^https:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/?$/.test(link))
          license = 'CC0'
        else if (/^public domain$/i.test(name) || (!name && value('Copyrighted') === 'False')) license = 'public-domain'
        else if (
          /^CC BY (?:[1-4]\.\d)(?: [A-Z-]+)?$/.test(name) &&
          /^https:\/\/creativecommons\.org\/licenses\/by\/[1-4]\.\d\/?$/.test(link)
        )
          license = 'CC BY'
        else if (!name && !link) license = 'unknown'
        else continue
        candidates.push({
          imageUrl: image,
          sourceUrl: source,
          ...(safeUrl(info.url, 'upload.wikimedia.org') ? { originalUrl: String(info.url) } : {}),
          title: typeof page.title === 'string' ? page.title.slice(0, 300) : query,
          description: value('ImageDescription')
            .replace(/<[^>]*>/g, '')
            .slice(0, 1500),
          credit: {
            url: source,
            author:
              value('Artist')
                .replace(/<[^>]*>/g, '')
                .slice(0, 1000) || 'Chưa rõ tác giả',
            license,
            licenseUrl: link,
            unknownLicense: license === 'unknown',
            retrievedAt: new Date().toISOString(),
          },
        })
      }
      return candidates
    } catch {
      signal.throwIfAborted()
    }
    throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
  }
  async prepare(candidate: CommonsCandidate, signal: AbortSignal): Promise<PreparedResearchImage> {
    const operation = AbortSignal.any([signal, AbortSignal.timeout(20000)])
    if (!(safeUrl(candidate.imageUrl, 'upload.wikimedia.org') ?? safeUrl(candidate.imageUrl, 'thumb.wikimedia.org')))
      throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
    const response = await this.request(candidate.imageUrl, {
      signal: operation,
      redirect: 'error',
      headers: { Accept: 'image/png,image/jpeg' },
    })
    const type = response.headers.get('content-type')?.split(';')[0]
    if (type !== 'image/png' && type !== 'image/jpeg') {
      await response.body?.cancel().catch(() => {})
      throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
    }
    const bytes = await limited(response, 8 * 1024 * 1024)
    const parsed = await this.parser.parse({
      name: type === 'image/png' ? 'commons.png' : 'commons.jpg',
      bytes,
      signal: operation,
    })
    const image = parsed.parts.find(p => p.type === 'image')
    if (!image || image.type !== 'image') throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
    operation.throwIfAborted()
    const normalized = Buffer.from(image.data, 'base64')
    return {
      bytes: normalized,
      source: { sourceId: `src-${randomUUID()}`, version: 1, kind: 'research' },
      originalDigest: hash(bytes),
      parsedDigest: hash(normalized),
      credit: candidate.credit,
    }
  }
  /** Compatibility for pinned legacy generation only. Reviewed plans use explicit candidate selection. */
  async find(query: string, signal: AbortSignal): Promise<PreparedResearchImage> {
    const candidates = [...(await this.candidates(query, signal))].toSorted(
      (a, b) => Number(a.credit.unknownLicense) - Number(b.credit.unknownLicense),
    )
    for (const candidate of candidates) {
      try {
        return await this.prepare(candidate, signal)
      } catch {
        signal.throwIfAborted()
      }
    }
    throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
  }
}
