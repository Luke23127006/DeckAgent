import type { ImageCredit } from '@deckagent/deck'
import type { ImageSearchCandidate } from './tavily.ts'

/** These identities come from publisher-controlled stock/file paths, never model licence claims. */
export function imageSource(candidate: ImageSearchCandidate): {
  readonly sourceUrl?: string
  readonly pexels?: ImageCredit
} {
  let image: URL
  try {
    image = new URL(candidate.imageUrl)
  } catch {
    return {}
  }
  if (image.protocol !== 'https:' || image.username || image.password || image.port) return {}
  if (image.hostname === 'images.pexels.com') {
    const match = /^\/photos\/([1-9]\d{0,11})\/([\w-]+)\.(?:jpe?g|png)$/.exec(image.pathname)
    if (match && (!match[2]!.startsWith('pexels-photo-') || match[2] === `pexels-photo-${match[1]}`)) {
      const sourceUrl = `https://www.pexels.com/photo/${match[1]}/`
      return {
        sourceUrl,
        pexels: {
          url: sourceUrl,
          author: 'Chưa rõ tác giả · Pexels',
          license: 'Pexels',
          licenseUrl: 'https://www.pexels.com/license/',
          unknownLicense: false,
          retrievedAt: new Date().toISOString(),
          evidence: 'pexels-cdn',
        },
      }
    }
  }
  if (image.hostname === 'upload.wikimedia.org' || image.hostname === 'thumb.wikimedia.org') {
    const parts = image.pathname.split('/').filter(Boolean)
    if (parts[0] === 'wikipedia' && parts[1] === 'commons') {
      const name = parts[2] === 'thumb' ? parts[5] : parts[4]
      if (name && /\.(?:jpe?g|png)$/i.test(name)) {
        try {
          return {
            sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(decodeURIComponent(name))}`,
          }
        } catch {
          return {}
        }
      }
    }
  }
  return candidate.sourceUrl ? { sourceUrl: candidate.sourceUrl } : {}
}
