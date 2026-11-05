import { parse, defaultTreeAdapter } from 'parse5'
import type { DefaultTreeAdapterTypes } from 'parse5'
import { DeckError, validId } from './contracts.ts'
import type { InsertSlideImage } from './contracts.ts'

const assetIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
const escapeHtml = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
function imageNodes(html: string): readonly { assetId: string; offset: number }[] {
  if (!/<img\b|data-deckagent-asset\s*=/i.test(html)) return []
  let invalid = false
  const doc = parse(html, {
    sourceCodeLocationInfo: true,
    scriptingEnabled: false,
    onParseError(error) {
      if (error.code !== 'missing-doctype') invalid = true
    },
  })
  const stack: DefaultTreeAdapterTypes.Node[] = [doc],
    result: { assetId: string; offset: number }[] = []
  let count = 0
  while (stack.length) {
    const node = stack.pop()!
    if (++count > 20000) throw new DeckError('DECK_IMAGE_REFERENCE')
    if (defaultTreeAdapter.isElementNode(node)) {
      const asset = node.attrs.find(attr => attr.name === 'data-deckagent-asset')
      if (asset && (node.tagName !== 'img' || node.namespaceURI !== 'http://www.w3.org/1999/xhtml')) invalid = true
      if (node.tagName === 'img') {
        const loc = node.sourceCodeLocation
        if (
          !asset ||
          !assetIdPattern.test(asset.value) ||
          !loc ||
          node.attrs.some(
            attr =>
              ![
                'data-deckagent-asset',
                'alt',
                'width',
                'height',
                'style',
                'class',
                'id',
                'loading',
                'decoding',
              ].includes(attr.name),
          )
        )
          invalid = true
        else result.push({ assetId: asset.value, offset: loc.endOffset - (html[loc.endOffset - 2] === '/' ? 2 : 1) })
        if (result.length > 20) invalid = true
      }
    }
    if ('childNodes' in node) stack.push(...node.childNodes)
  }
  if (invalid) throw new DeckError('DECK_IMAGE_REFERENCE')
  return result
}
export function slideAssetIds(html: string): readonly string[] {
  return [...new Set(imageNodes(html).map(node => node.assetId))]
}
export function renderSlideAssets(html: string, values: ReadonlyMap<string, string>): string {
  const nodes = [...imageNodes(html)].sort((a, b) => b.offset - a.offset)
  if (
    html.length + nodes.reduce((sum, node) => sum + (values.get(node.assetId)?.length ?? 0) + 7, 0) >
    30 * 1024 * 1024
  )
    throw new DeckError('DECK_IMAGE_LIMIT')
  let result = html
  for (const node of nodes) {
    const data = values.get(node.assetId)
    if (!data || !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(data))
      throw new DeckError('DECK_ASSET_UNAVAILABLE')
    result = result.slice(0, node.offset) + ` src="${data}"` + result.slice(node.offset)
  }
  return result
}
export function parseImageInsert(value: unknown): InsertSlideImage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DeckError('DECK_IMAGE_REFERENCE')
  const v = value as Record<string, unknown>
  if (
    Object.keys(v).some(
      key => !['outlineId', 'slideId', 'expectedRevision', 'assetId', 'publicationId', 'alt'].includes(key),
    ) ||
    !validId(v.outlineId) ||
    !validId(v.slideId) ||
    !validId(v.publicationId) ||
    typeof v.expectedRevision !== 'number' ||
    !Number.isSafeInteger(v.expectedRevision) ||
    v.expectedRevision < 1 ||
    typeof v.assetId !== 'string' ||
    !assetIdPattern.test(v.assetId) ||
    typeof v.alt !== 'string' ||
    v.alt.length > 1000 ||
    v.alt.includes('\0')
  )
    throw new DeckError('DECK_IMAGE_REFERENCE')
  return {
    outlineId: v.outlineId,
    slideId: v.slideId,
    expectedRevision: v.expectedRevision,
    assetId: v.assetId,
    publicationId: v.publicationId,
    alt: v.alt,
  }
}
export function appendSlideImage(html: string, input: InsertSlideImage): string {
  let invalid = false
  const doc = parse(html, {
    sourceCodeLocationInfo: true,
    scriptingEnabled: false,
    onParseError(error) {
      if (error.code !== 'missing-doctype') invalid = true
    },
  })
  if (invalid) throw new DeckError('DECK_IMAGE_REFERENCE')
  const root = doc.childNodes.find(node => defaultTreeAdapter.isElementNode(node) && node.tagName === 'html')
  let offset = html.length
  if (root && defaultTreeAdapter.isElementNode(root)) {
    const body = root.childNodes.find(node => defaultTreeAdapter.isElementNode(node) && node.tagName === 'body')
    offset =
      body && defaultTreeAdapter.isElementNode(body) && body.sourceCodeLocation?.endTag
        ? body.sourceCodeLocation.endTag.startOffset
        : (root.sourceCodeLocation?.endTag?.startOffset ?? html.length)
  }
  const image = `<figure><img data-deckagent-asset="${input.assetId}" alt="${escapeHtml(input.alt)}" style="max-width:100%;max-height:240px;object-fit:contain"></figure>`
  return html.slice(0, offset) + image + html.slice(offset)
}
