import { parseFragment } from 'parse5'
import type { DefaultTreeAdapterMap } from 'parse5'
import { parse as parseCss, generate } from 'css-tree'
import { findCompatibleLayouts } from '@deckagent/design'
import { decodeSlideDocument, FormatError } from '@deckagent/presentation-document'
import type { FormatContext, SlideNode } from '@deckagent/presentation-document'

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const style = `
.da3-slide{height:100%;min-width:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:32px;overflow-wrap:anywhere}
.da3-slide h1{margin:0;max-width:100%;align-self:start}
.da3-slide p,.da3-slide ul,.da3-slide figure{margin:0}
.da3-slide ul{padding-left:28px;display:flex;flex-direction:column;gap:16px}
.da3-slide li{padding-left:4px}
.da3-composition{min-width:0;min-height:0}
.da3-words{min-width:0;display:flex;flex-direction:column;gap:24px;justify-content:center}
.da3-cover,.da3-section{display:flex;flex-direction:column;justify-content:center;gap:32px}
.da3-cover h1,.da3-section h1{max-width:1080px}
.da3-cover .da3-words,.da3-section .da3-words{max-width:1000px}
.da3-section .da3-lead{font-size:var(--type-heading);font-weight:600}
.da3-title-body .da3-words{max-width:1120px;justify-content:center;height:100%}
.da3-column-grid{height:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:48px;align-items:start;align-content:center}
.da3-column-grid ul{min-width:0}
.da3-metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;width:100%}
.da3-metric-grid.da3-count-1{grid-template-columns:minmax(0,1fr)}
.da3-metric-grid.da3-count-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.da3-metric{min-width:0;min-height:240px;padding:32px;background-color:var(--color-surface);border-width:1px;border-style:solid;border-color:var(--color-border);border-radius:16px;display:flex;flex-direction:column;justify-content:center;gap:20px}
.da3-metric strong{font-size:var(--type-heading);color:var(--color-accent);overflow-wrap:anywhere}
.da3-note{font-size:var(--type-caption);color:var(--color-muted)}
.da3-image-text .da3-composition{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);gap:40px}
.da3-media{min-width:0;min-height:0;height:100%;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:12px}
.da3-media img{display:block;width:100%;height:100%;min-height:0;object-fit:contain}
.da3-media figcaption{font-size:var(--type-caption);color:var(--color-muted);overflow-wrap:anywhere}
.da3-image-pair .da3-composition{display:grid;grid-template-rows:minmax(0,1fr) auto;gap:24px}
.da3-pair{min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:minmax(0,1fr) auto;gap:12px 32px}
.da3-pair>.da3-media{grid-row:1 / span 2;grid-template-rows:subgrid}
.da3-image-pair .da3-words ul{gap:8px}
`

function node(n: SlideNode): string {
  const key = `data-node-id="${escapeHtml(n.id)}"`
  switch (n.kind) {
    case 'image':
      return `<figure class="da3-media" ${key}><img src="asset:${escapeHtml(n.assetId)}" alt="${escapeHtml(n.caption ?? 'Illustration')}">${n.caption ? `<figcaption>${escapeHtml(n.caption)}</figcaption>` : ''}</figure>`
    case 'bullets':
      return `<ul ${key}>${n.items.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
    case 'columns':
      return `<div class="da3-column-grid" ${key}>${n.columns.map(c => `<ul>${c.bullets.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`).join('')}</div>`
    case 'metrics':
      return `<div class="da3-metric-grid da3-count-${n.items.length}" ${key}>${n.items.map(m => `<div class="da3-metric"><strong>${escapeHtml(m.value)}</strong><p>${escapeHtml(m.label)}</p></div>`).join('')}</div>`
    default:
      return `<p class="${n.kind === 'source-note' ? 'da3-note' : n.kind === 'lead' ? 'da3-lead' : 'da3-text'}" ${key}>${escapeHtml(n.text)}</p>`
  }
}

export function controlledStarter(input: FormatContext, validate = false): string {
  if (!input.document) throw new FormatError('SLIDE_DOCUMENT_REQUIRED')
  const d = decodeSlideDocument(input.document)
  const imageCount = d.nodes.filter(n => n.kind === 'image').length
  const expectedImages = input.layoutId === 'image-pair' ? 2 : input.layoutId === 'image-text' ? 1 : 0
  const plan = {
    title: d.title,
    blocks: d.nodes.map(n => {
      if (n.kind === 'image')
        return {
          kind: 'image',
          attachmentId: 'att-00000000-0000-4000-8000-000000000000',
          ...(n.caption ? { caption: n.caption } : {}),
        }
      const { id: _id, ...block } = n
      return block
    }),
  }
  // Required images are enforced by Deck before build. An explicitly optional omission keeps a bounded composition.
  for (let i = imageCount; i < expectedImages; i++)
    plan.blocks.push({ kind: 'image', attachmentId: 'att-00000000-0000-4000-8000-000000000000' })
  const visualLayout =
    expectedImages && imageCount < expectedImages ? (imageCount === 1 ? 'image-text' : 'title-body') : input.layoutId
  const layouts = ['cover', 'section', 'title-body', 'two-column', 'key-figures', 'image-text', 'image-pair']
  if (
    d.layoutIntent !== input.layoutId ||
    !layouts.includes(input.layoutId) ||
    (validate && !findCompatibleLayouts(plan, input.design.template).candidates.some(c => c.id === input.layoutId))
  )
    throw new FormatError('ARTIFACT_LAYOUT_CAPACITY', [
      {
        code: 'ARTIFACT_LAYOUT_CAPACITY',
        path: `layout.${input.layoutId}`,
        message: 'The recorded content does not fit this controlled layout.',
        expected:
          'Choose a compatible layout or revise the document explicitly while preserving required content. Never hide, truncate or shrink text.',
      },
    ])
  const words = d.nodes
    .filter(n => n.kind !== 'image')
    .map(node)
    .join('')
  const images = d.nodes
    .filter(n => n.kind === 'image')
    .map(node)
    .join('')
  let content: string
  switch (visualLayout) {
    case 'cover':
    case 'section':
      content = `<div class="da3-words">${words}</div>`
      break
    case 'title-body':
      content = `<div class="da3-composition"><div class="da3-words">${words}</div></div>`
      break
    case 'two-column':
      content = `<div class="da3-composition">${words}</div>`
      break
    case 'key-figures':
      content = `<div class="da3-composition da3-words">${words}</div>`
      break
    case 'image-text':
      content = `<div class="da3-composition"><div class="da3-words">${words}</div>${images}</div>`
      break
    default:
      content = `<div class="da3-composition"><div class="da3-pair">${images}</div><div class="da3-words">${words}</div></div>`
  }
  return `<style>${style}</style><section class="da3-slide da3-${visualLayout} da3-plan-${input.layoutId}"><h1 data-node-id="__title">${escapeHtml(d.title)}</h1>${content}</section>`
}

/** Ignore source formatting, but keep the exact template structure and geometry owned by this adapter. */
function signature(source: string): string {
  const tree = (n: DefaultTreeAdapterMap['node']): unknown => {
    if ('tagName' in n) {
      const attributes = n.attrs
        .map(a => [a.name, a.name === 'class' ? a.value.split(/\s+/).toSorted().join(' ') : a.value])
        .toSorted()
      if (n.tagName === 'style')
        return ['style', generate(parseCss(n.childNodes.map(c => ('value' in c ? c.value : '')).join('')))]
      return [n.tagName, attributes, n.childNodes.map(tree).filter(v => v !== null)]
    }
    if ('value' in n) return n.value.trim() ? n.value.replace(/\s+/g, ' ').trim() : null
    return 'childNodes' in n ? n.childNodes.map(tree).filter(v => v !== null) : null
  }
  return JSON.stringify(tree(parseFragment(source)))
}

export function verifyControlledLayout(source: string, input: FormatContext): void {
  const expected = controlledStarter(input, true)
  if (signature(source) !== signature(expected))
    throw new FormatError('ARTIFACT_LAYOUT_MISMATCH', [
      {
        code: 'ARTIFACT_LAYOUT_MISMATCH',
        path: 'nativeSource.layout',
        message: 'The native source changes the controlled template structure or geometry.',
        expected:
          'Use read_slide_draft to refresh the starter after recording content changes. Preserve its structure and CSS.',
      },
    ])
}
