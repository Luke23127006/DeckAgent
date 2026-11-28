export { requiredSlideText } from '@deckagent/presentation-document'
import { parseFragment } from 'parse5'
import type { DefaultTreeAdapterMap } from 'parse5'
import { decodeSlideDocument, documentText, FormatError } from '@deckagent/presentation-document'
import type {
  FormatAdapter,
  FormatContext,
  FormatAsset,
  BuiltArtifact,
  SlideNode,
} from '@deckagent/presentation-document'
import { compileArtifact, materializeArtifact, htmlCapabilities } from './policy.ts'
import { controlledStarter, verifyControlledLayout } from './controlled-template.ts'
export { compileArtifact, materializeArtifact, htmlCapabilities } from './policy.ts'
export { inspectControlledLayout } from './layout-inspection.ts'
export { validateLegacySlideHtml } from './legacy-policy.ts'

const escapeHtml = (v: string) =>
  v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const normalize = (v: string) => v.replace(/\s+/g, ' ').trim()

const nodeText = (n: SlideNode): string =>
  n.kind === 'bullets'
    ? n.items.join(' ')
    : n.kind === 'columns'
      ? n.columns.flatMap(c => c.bullets).join(' ')
      : n.kind === 'metrics'
        ? n.items.flatMap(m => [m.value, m.label]).join(' ')
        : n.kind === 'image'
          ? (n.caption ?? '')
          : n.text

const css = `.da-slide{height:100%;display:flex;flex-direction:column;gap:20px}.da-slide h1{margin:0}.da-body{min-height:0;display:flex;flex-direction:column;gap:16px}.da-body p,.da-body ul,.da-body figure{margin:0}.da-columns,.da-image-text,.da-image-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px;align-items:start}.da-images{min-width:0;display:grid;gap:16px}.da-image-pair .da-images{grid-template-columns:repeat(2,minmax(0,1fr))}.da-image-pair{display:flex;flex-direction:column}.da-images img{display:block;width:100%;height:240px;object-fit:contain}.da-images figcaption{font-size:var(--type-caption)}.da-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.da-metrics strong{font-size:var(--type-heading)}.da-cover{justify-content:center}.da-section{justify-content:center}`

function nodeHtml(n: SlideNode): string {
  const key = `data-node-id="${escapeHtml(n.id)}"`
  if (n.kind === 'image')
    return `<figure ${key}><img src="asset:${n.assetId}" alt="${escapeHtml(n.caption ?? 'Illustration')}">${n.caption ? `<figcaption>${escapeHtml(n.caption)}</figcaption>` : ''}</figure>`
  if (n.kind === 'bullets') return `<ul ${key}>${n.items.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
  if (n.kind === 'columns')
    return `<div ${key} class="da-columns">${n.columns.map(c => `<ul>${c.bullets.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`).join('')}</div>`
  if (n.kind === 'metrics')
    return `<div ${key} class="da-metrics">${n.items.map(m => `<div><strong>${escapeHtml(m.value)}</strong><p>${escapeHtml(m.label)}</p></div>`).join('')}</div>`
  return `<p ${key}>${escapeHtml(n.text)}</p>`
}

export type { HtmlTemplateBundle } from './contracts.ts'
import type { HtmlTemplateBundle } from './contracts.ts'

function starter(input: FormatContext, style = css): string {
  if (!input.document) return '<h1>Replace with the confirmed slide title</h1>'
  const d = decodeSlideDocument(input.document)
  const images = d.nodes.filter(n => n.kind === 'image'),
    words = d.nodes.filter(n => n.kind !== 'image')
  const content = images.length
    ? `<div class="${images.length > 1 ? 'da-image-pair' : 'da-image-text'}"><div class="da-body">${words.map(nodeHtml).join('')}</div><div class="da-images">${images.map(nodeHtml).join('')}</div></div>`
    : `<div class="da-body">${d.nodes.map(nodeHtml).join('')}</div>`
  return `<style>${style}</style><section class="da-slide da-${escapeHtml(input.layoutId)}"><h1 data-node-id="__title">${escapeHtml(d.title)}</h1>${content}</section>`
}

function verifyContent(source: string, input: FormatContext): void {
  if (!input.document) return
  const d = decodeSlideDocument(input.document),
    root = parseFragment(source)
  const found = new Map<string, string[]>()
  const bindings = new Map<string, DefaultTreeAdapterMap['element']>()
  const all: string[] = []
  const walk = (node: DefaultTreeAdapterMap['node'], binding?: string) => {
    if ('tagName' in node && node.tagName === 'style') return
    if ('attrs' in node) {
      const key = node.attrs.find(a => a.name === 'data-node-id')?.value
      if (key) {
        if (bindings.has(key) || (key !== '__title' && !d.nodes.some(n => n.id === key)))
          throw new FormatError('ARTIFACT_NODE_BINDING_INVALID', [
            {
              code: 'ARTIFACT_NODE_BINDING_INVALID',
              path: `document.${key.slice(0, 100)}`,
              message: 'Node bindings must be unique and declared.',
            },
          ])
        bindings.set(key, node)
        binding = key
      }
    }
    if ('value' in node && node.nodeName === '#text') {
      all.push(node.value)
      if (binding) found.set(binding, [...(found.get(binding) ?? []), node.value])
    }
    if ('childNodes' in node) for (const child of node.childNodes) walk(child, binding)
  }
  walk(root)
  for (const id of ['__title', ...d.nodes.map(n => n.id)])
    if (!bindings.has(id))
      throw new FormatError('ARTIFACT_REQUIRED_CONTENT_MISSING', [
        {
          code: 'ARTIFACT_REQUIRED_CONTENT_MISSING',
          path: `document.${id}`,
          message: 'The native representation is missing this content node.',
        },
      ])
  for (const n of d.nodes)
    if (n.kind === 'image') {
      let matched = false
      const image = (node: DefaultTreeAdapterMap['node']) => {
        if (
          'tagName' in node &&
          node.tagName === 'img' &&
          node.attrs.some(a => a.name === 'src' && a.value === `asset:${n.assetId}`)
        )
          matched = true
        if ('childNodes' in node) for (const child of node.childNodes) image(child)
      }
      image(bindings.get(n.id)!)
      if (!matched)
        throw new FormatError('ARTIFACT_ASSET_INVALID', [
          {
            code: 'ARTIFACT_ASSET_INVALID',
            path: `document.${n.id}`,
            message: 'The image node must use its recorded local asset.',
          },
        ])
    }
  for (const [id, text] of [['__title', d.title], ...d.nodes.map(n => [n.id, nodeText(n)] as const)]) {
    if (normalize((found.get(id!) ?? []).join(' ')) !== normalize(text!))
      throw new FormatError('ARTIFACT_REQUIRED_CONTENT_MISSING', [
        {
          code: 'ARTIFACT_REQUIRED_CONTENT_MISSING',
          path: `document.${id}`,
          message: 'The visible node content must match the portable document.',
          expected: 'Keep data-node-id and its recorded text; revise the document explicitly before changing content.',
        },
      ])
  }
  const tokens = (v: string) => normalize(v).split(' ').toSorted().join('\0')
  if (tokens(all.join(' ')) !== tokens(documentText(d).join(' ')))
    throw new FormatError('ARTIFACT_UNRECORDED_CONTENT', [
      {
        code: 'ARTIFACT_UNRECORDED_CONTENT',
        path: 'nativeSource',
        message: 'Native text differs from the recorded portable content.',
      },
    ])
}

export class HtmlFormatAdapter implements FormatAdapter {
  readonly id = 'html'
  constructor(private readonly template?: HtmlTemplateBundle) {}

  context(input: FormatContext) {
    const controlled =
      !this.template && input.design.template.id === 'html-basic' && input.design.template.version === 3
    return {
      starter: controlled ? controlledStarter(input) : starter(input, this.template?.style),
      rules: [
        ...(controlled
          ? [
              'HTML Basic v3 owns layout geometry. Use the exact starter structure and CSS. Change content through record_slide_content, then read_slide_draft; do not add wrappers, styles or inline geometry. Images use contain to preserve the full image.',
            ]
          : []),
        `Allowed HTML tags: ${htmlCapabilities.tags.join(', ')}.`,
        `Allowed attributes: ${htmlCapabilities.attributes.join(', ')}.`,
        `Allowed geometry properties: ${htmlCapabilities.geometry.join(', ')}.`,
        'Preserve data-node-id bindings and recorded content. Colours, fonts and type sizes use the supplied theme roles. Images are already local assets; preserve asset references.',
      ],
    }
  }

  build(source: string, input: FormatContext): BuiltArtifact {
    try {
      if (
        this.template
          ? input.design.template.id !== this.template.id || input.design.template.version !== this.template.version
          : input.design.template.id !== 'html-basic' || ![1, 2, 3].includes(input.design.template.version)
      )
        throw new FormatError('FORMAT_TEMPLATE_UNAVAILABLE')
      verifyContent(source, input)
      const html = compileArtifact(source, input.design, input.assets)
      if (!this.template && input.design.template.version === 3) verifyControlledLayout(source, input)
      return {
        bytes: new TextEncoder().encode(html),
        preview: materializeArtifact(html, input.assets),
        descriptor: {
          format: 'html',
          mediaType: 'text/html',
          extension: 'html',
          policyVersion:
            !this.template && input.design.template.version === 3
              ? 'html-layout-v3'
              : input.document
                ? 'html-document-v2'
                : 'b04-artifact-v1',
          template: input.design.template,
          ...(input.document ? { documentVersion: 1 as const } : {}),
        },
      }
    } catch (error) {
      if (error instanceof FormatError)
        throw new FormatError(
          error.code,
          error.issues.length
            ? error.issues
            : [
                {
                  code: error.code,
                  path: 'nativeSource',
                  message: 'The draft violates the supplied HTML policy.',
                  expected: 'Use the supplied starter and declared HTML/CSS capabilities.',
                },
              ],
        )
      throw error
    }
  }

  read(bytes: Uint8Array, assets: readonly FormatAsset[]): string {
    return materializeArtifact(new TextDecoder().decode(bytes), assets)
  }
}
