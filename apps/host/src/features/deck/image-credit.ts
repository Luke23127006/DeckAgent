import type { ImageCredit } from '@deckagent/deck'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

const reference = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : object(value) && typeof value['@id'] === 'string' ? value['@id'] : undefined

function licenseFromLink(link: string): ImageCredit['license'] | undefined {
  if (/^https:\/\/creativecommons\.org\/licenses\/by\/[1-4]\.\d\/?$/.test(link)) return 'CC BY'
  if (/^https:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/?$/.test(link)) return 'CC0'
  if (/^https:\/\/creativecommons\.org\/publicdomain\/mark\/1\.0\/?$/.test(link)) return 'public-domain'
  return undefined
}

function authorOf(item: Record<string, unknown>): string {
  if (typeof item.creator === 'string') return item.creator
  if (object(item.creator) && typeof item.creator.name === 'string') return item.creator.name
  if (typeof item.author === 'string') return item.author
  if (object(item.author) && typeof item.author.name === 'string') return item.author.name
  return ''
}

/** A scanned JSON-LD object establishes a licence only when it describes this exact image. */
function extractImageObjectCredit(
  item: Record<string, unknown>,
  imageUrl: string,
  sourceUrl: string,
  rejected?: (code: string) => void,
): ImageCredit | undefined {
  const type = item['@type']
  const isImageObject = type === 'ImageObject' || (Array.isArray(type) && type.includes('ImageObject'))
  const link = reference(item.license)
  if (
    !isImageObject ||
    (reference(item.contentUrl) !== imageUrl && reference(item.url) !== imageUrl) ||
    link === undefined
  )
    return undefined
  const license = licenseFromLink(link)
  const author = authorOf(item)
  if (!license) rejected?.('RESEARCH_IMAGE_LICENSE_UNSUPPORTED')
  else if (license === 'CC BY' && !author.trim()) rejected?.('RESEARCH_IMAGE_AUTHOR_REQUIRED')
  if (!license || (!author.trim() && license === 'CC BY')) return undefined
  return {
    url: sourceUrl,
    license,
    licenseUrl: link,
    unknownLicense: false,
    author: author.slice(0, 1000) || 'Public domain',
    retrievedAt: new Date().toISOString(),
    evidence: 'image-metadata',
  }
}

/** Only image-specific, matching ImageObject metadata can establish a broad-web licence. */
export function imagePageCredit(
  html: string,
  imageUrl: string,
  sourceUrl: string,
  rejected?: (code: string) => void,
): ImageCredit | undefined {
  const items: unknown[] = []
  for (const match of html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi,
  )) {
    const raw = match[1]
    if (!raw) continue
    try {
      items.push(JSON.parse(raw))
    } catch {
      /* Malformed metadata gives no licence. */
    }
  }
  let count = 0
  const visit = (item: unknown, depth: number): ImageCredit | undefined => {
    if (++count > 500 || depth > 10) return undefined
    if (Array.isArray(item)) {
      for (const child of item) {
        const credit = visit(child, depth + 1)
        if (credit) return credit
      }
      return undefined
    }
    if (!object(item)) return undefined
    const credit = extractImageObjectCredit(item, imageUrl, sourceUrl, rejected)
    if (credit) return credit
    for (const child of Object.values(item)) {
      const credit = visit(child, depth + 1)
      if (credit) return credit
    }
    return undefined
  }
  return visit(items, 0)
}
