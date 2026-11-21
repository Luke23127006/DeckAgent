import type { ContentBlock } from '@deckagent/design'
import { FormatError } from './contracts.ts'
import type { ContentOrigin, SlideDocument, SlideNode, ArtifactDescriptor } from './contracts.ts'
export { FormatError } from './contracts.ts'
export type {
  SourceReference,
  ContentOrigin,
  SlideNode,
  SlideDocument,
  ValidationIssue,
  FormatAsset,
  ArtifactDescriptor,
  FormatContext,
  BuiltArtifact,
  FormatAdapter,
} from './contracts.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown, limit = 8000): v is string =>
  typeof v === 'string' && !!v.trim() && v.length <= limit && v.isWellFormed() && !v.includes('\0')
const id = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,100}$/.test(v)
const only = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).every(k => keys.includes(k))
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.length <= 100 && v.every(s => text(s))
const fail = (path: string, expected: string): never => {
  throw new FormatError('SLIDE_DOCUMENT_INVALID', [
    { code: 'SLIDE_DOCUMENT_INVALID', path, message: 'Invalid portable content.', expected },
  ])
}

export function decodeContentOrigins(value: unknown): readonly ContentOrigin[] {
  const invalid = (): never => {
    throw new FormatError('PROVENANCE_INVALID')
  }
  if (!Array.isArray(value) || value.length > 100 || new TextEncoder().encode(JSON.stringify(value)).length > 65536)
    return invalid()
  for (const p of value) {
    if (
      !object(p) ||
      !only(p, ['text', 'kind', 'origin', 'source', 'label', 'location', 'quote']) ||
      !text(p.text) ||
      !['fact', 'wording', 'placeholder'].includes(String(p.kind)) ||
      !['material', 'research', 'general-knowledge', 'unknown'].includes(String(p.origin)) ||
      (p.kind === 'fact' && !['material', 'research'].includes(String(p.origin))) ||
      ['label', 'location', 'quote'].some(key => p[key] !== undefined && !text(p[key]))
    )
      return invalid()
    if (p.origin === 'material' || p.origin === 'research') {
      const ref = p.source
      if (
        !object(ref) ||
        !only(ref, ['sourceId', 'version', 'kind']) ||
        !id(ref.sourceId) ||
        !Number.isSafeInteger(ref.version) ||
        Number(ref.version) < 1 ||
        !['attachment', 'project-file', 'approved-file', 'research'].includes(String(ref.kind)) ||
        (p.origin === 'research') !== (ref.kind === 'research') ||
        !['label', 'location', 'quote'].every(key => text(p[key]))
      )
        return invalid()
    } else if (p.source !== undefined) return invalid()
  }
  return structuredClone(value) as ContentOrigin[]
}
export function decodeSlideDocument(value: unknown): SlideDocument {
  if (
    !object(value) ||
    !only(value, ['schemaVersion', 'slideId', 'title', 'layoutIntent', 'nodes', 'provenance', 'notes']) ||
    value.schemaVersion !== 1 ||
    !id(value.slideId) ||
    !text(value.title, 1000) ||
    !id(value.layoutIntent) ||
    !Array.isArray(value.nodes) ||
    value.nodes.length > 100 ||
    (value.notes !== undefined && !text(value.notes, 16000))
  )
    return fail('document', 'A versioned SlideDocument without native-format fields')
  if (new TextEncoder().encode(JSON.stringify(value)).length > 256 * 1024) return fail('document', 'At most 256 KiB')
  const seen = new Set<string>()
  for (const [index, node] of value.nodes.entries()) {
    const path = `nodes[${index}]`
    if (!object(node) || !id(node.id) || node.id === '__title' || seen.has(node.id))
      return fail(`${path}.id`, 'A unique non-reserved node ID')
    seen.add(node.id)
    const kind = node.kind
    if (
      ['subtitle', 'lead', 'text', 'source-note'].includes(String(kind)) &&
      only(node, ['id', 'kind', 'text']) &&
      text(node.text)
    )
      continue
    if (kind === 'bullets' && only(node, ['id', 'kind', 'items']) && strings(node.items)) continue
    if (
      kind === 'columns' &&
      only(node, ['id', 'kind', 'columns']) &&
      Array.isArray(node.columns) &&
      node.columns.length > 0 &&
      node.columns.length <= 6 &&
      node.columns.every(c => object(c) && only(c, ['bullets']) && strings(c.bullets))
    )
      continue
    if (
      kind === 'metrics' &&
      only(node, ['id', 'kind', 'items']) &&
      Array.isArray(node.items) &&
      node.items.length > 0 &&
      node.items.length <= 20 &&
      node.items.every(m => object(m) && only(m, ['value', 'label']) && text(m.value) && text(m.label))
    )
      continue
    if (
      kind === 'image' &&
      only(node, ['id', 'kind', 'assetId', 'caption']) &&
      id(node.assetId) &&
      (node.caption === undefined || text(node.caption))
    )
      continue
    return fail(path, 'A structured text, columns, metrics or prepared-image node')
  }
  const provenance = decodeContentOrigins(value.provenance)
  return {
    schemaVersion: 1,
    slideId: value.slideId,
    title: value.title,
    layoutIntent: value.layoutIntent,
    nodes: structuredClone(value.nodes) as SlideNode[],
    provenance,
    ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
  }
}
export function documentText(value: SlideDocument): readonly string[] {
  const d = decodeSlideDocument(value)
  return [
    d.title,
    ...d.nodes.flatMap(n =>
      n.kind === 'bullets'
        ? [...n.items]
        : n.kind === 'columns'
          ? n.columns.flatMap(c => [...c.bullets])
          : n.kind === 'metrics'
            ? n.items.flatMap(m => [m.value, m.label])
            : n.kind === 'image'
              ? n.caption
                ? [n.caption]
                : []
              : [n.text],
    ),
  ]
}

export function decodeArtifactDescriptor(value: unknown): ArtifactDescriptor {
  if (
    !object(value) ||
    !only(value, ['format', 'mediaType', 'extension', 'policyVersion', 'documentVersion', 'template']) ||
    !id(value.format) ||
    typeof value.extension !== 'string' ||
    !/^[a-z0-9]{1,10}$/.test(value.extension) ||
    typeof value.mediaType !== 'string' ||
    !/^[a-z][a-z0-9.+-]*\/[a-z][a-z0-9.+-]*$/.test(value.mediaType) ||
    !id(value.policyVersion) ||
    (value.documentVersion !== undefined && value.documentVersion !== 1) ||
    !object(value.template) ||
    !only(value.template, ['id', 'version']) ||
    !id(value.template.id) ||
    !Number.isSafeInteger(value.template.version) ||
    Number(value.template.version) < 1
  )
    throw new FormatError('ARTIFACT_DESCRIPTOR_INVALID')
  return structuredClone(value) as unknown as ArtifactDescriptor
}

export function requiredSlideText(slide: {
  readonly title: string
  readonly blocks?: readonly ContentBlock[]
}): string[] {
  return [
    slide.title,
    ...(slide.blocks ?? []).flatMap(b =>
      b.kind === 'web-image' && b.required === false
        ? []
        : b.kind === 'bullets'
          ? b.items
          : b.kind === 'columns'
            ? b.columns.flatMap(c => c.bullets)
            : b.kind === 'metrics'
              ? b.items.flatMap(m => [m.value, m.label])
              : 'text' in b
                ? [b.text]
                : b.caption
                  ? [b.caption]
                  : [],
    ),
  ]
}
