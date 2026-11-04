import { createHash } from 'node:crypto'
import { parse, defaultTreeAdapter } from 'parse5'
import type { DefaultTreeAdapterTypes } from 'parse5'
import { DeckError, validId } from './contracts.ts'
import type { SlideEdit, SlideEditOperation, EditableSlide } from './contracts.ts'
import { validateSlideHtml } from './html-policy.ts'

const tags = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'li',
  'div',
  'span',
  'td',
  'th',
  'blockquote',
  'figcaption',
])
const fail = (): never => {
  throw new DeckError('DECK_INVALID_EDIT')
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
export const slideHash = (html: string) => createHash('sha256').update(html).digest('hex')

export function parseSlideEdit(value: unknown): SlideEdit {
  if (
    !object(value) ||
    Object.keys(value).some(
      key => !['outlineId', 'slideId', 'expectedRevision', 'baseHash', 'editId', 'operations'].includes(key),
    ) ||
    !validId(value.outlineId) ||
    !validId(value.slideId) ||
    !validId(value.editId) ||
    typeof value.baseHash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.baseHash) ||
    typeof value.expectedRevision !== 'number' ||
    !Number.isSafeInteger(value.expectedRevision) ||
    value.expectedRevision < 1 ||
    !Array.isArray(value.operations) ||
    !value.operations.length ||
    value.operations.length > 100
  )
    return fail()
  const operations: SlideEditOperation[] = value.operations.map(operation => {
    if (
      !object(operation) ||
      Object.keys(operation).some(key => !['nodeId', 'text', 'layout'].includes(key)) ||
      typeof operation.nodeId !== 'string' ||
      !/^n-\d{1,7}$/.test(operation.nodeId) ||
      (!('text' in operation) && !('layout' in operation))
    )
      return fail()
    if (
      'text' in operation &&
      (typeof operation.text !== 'string' || operation.text.length > 16000 || operation.text.includes('\0'))
    )
      return fail()
    let layout: SlideEditOperation['layout']
    if ('layout' in operation) {
      const l = operation.layout
      if (
        !object(l) ||
        !Object.keys(l).length ||
        Object.keys(l).some(key => !['fontSize', 'textAlign', 'marginTop', 'marginLeft'].includes(key))
      )
        return fail()
      for (const name of ['fontSize', 'marginTop', 'marginLeft'])
        if (
          name in l &&
          (typeof l[name] !== 'number' ||
            !Number.isInteger(l[name]) ||
            Number(l[name]) < (name === 'fontSize' ? 8 : -1000) ||
            Number(l[name]) > (name === 'fontSize' ? 144 : 1000))
        )
          return fail()
      if ('textAlign' in l && l.textAlign !== 'left' && l.textAlign !== 'center' && l.textAlign !== 'right')
        return fail()
      layout = {
        ...(typeof l.fontSize === 'number' ? { fontSize: l.fontSize } : {}),
        ...(l.textAlign === 'left' || l.textAlign === 'center' || l.textAlign === 'right'
          ? { textAlign: l.textAlign }
          : {}),
        ...(typeof l.marginTop === 'number' ? { marginTop: l.marginTop } : {}),
        ...(typeof l.marginLeft === 'number' ? { marginLeft: l.marginLeft } : {}),
      }
    }
    return {
      nodeId: operation.nodeId,
      ...(typeof operation.text === 'string' ? { text: operation.text } : {}),
      ...(layout ? { layout } : {}),
    }
  })
  if (new Set(operations.map(op => op.nodeId)).size !== operations.length) return fail()
  return {
    outlineId: value.outlineId,
    slideId: value.slideId,
    expectedRevision: value.expectedRevision,
    baseHash: value.baseHash,
    editId: value.editId,
    operations,
  }
}

/** Only checks declaration boundaries; it does not normalize or interpret existing CSS. */
function closedStyle(text: string): boolean {
  let quote = '',
    comment = false,
    escaped = false,
    depth = 0
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    if (comment) {
      if (char === '*' && text[i + 1] === '/') {
        comment = false
        i++
      }
      continue
    }
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (quote) {
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '/' && text[i + 1] === '*') {
      comment = true
      i++
      continue
    }
    if (char === '(' || char === '[') depth++
    if (char === ')' || char === ']') {
      if (--depth < 0) return false
    }
    if (char === '{' || char === '}') return false
  }
  return !quote && !comment && !escaped && depth === 0
}
interface Target {
  readonly element: DefaultTreeAdapterTypes.Element
  readonly descriptor: EditableSlide['nodes'][number]
}
function targets(html: string): readonly Target[] {
  validateSlideHtml(html)
  let invalid = false
  const document = parse(html, {
    sourceCodeLocationInfo: true,
    scriptingEnabled: false,
    onParseError(error) {
      if (error.code !== 'missing-doctype') invalid = true
    },
  })
  if (invalid) return []
  const stack: { node: DefaultTreeAdapterTypes.Node; depth: number }[] = [{ node: document, depth: 0 }],
    result: Target[] = []
  let count = 0
  while (stack.length) {
    const item = stack.pop()!
    if (++count > 20000 || item.depth > 100) return []
    const node = item.node
    if (defaultTreeAdapter.isElementNode(node)) {
      if (
        node.namespaceURI !== 'http://www.w3.org/1999/xhtml' ||
        ['style', 'script', 'template', 'noscript'].includes(node.tagName)
      )
        continue
      const location = node.sourceCodeLocation
      if (
        tags.has(node.tagName) &&
        location?.startTag &&
        location.endTag &&
        node.childNodes.length &&
        node.childNodes.every(child => defaultTreeAdapter.isTextNode(child))
      ) {
        const text = node.childNodes.map(child => (defaultTreeAdapter.isTextNode(child) ? child.value : '')).join('')
        if (text.trim())
          result.push({
            element: node,
            descriptor: {
              nodeId: `n-${location.startOffset}`,
              tag: node.tagName,
              text,
              layoutEditable: closedStyle(node.attrs.find(attr => attr.name === 'style')?.value ?? ''),
            },
          })
        if (result.length > 1000) return []
      }
    }
    if ('childNodes' in node)
      for (let i = node.childNodes.length - 1; i >= 0; i--)
        stack.push({ node: node.childNodes[i]!, depth: item.depth + 1 })
  }
  return result
}
export function editableNodes(html: string): EditableSlide['nodes'] {
  return targets(html).map(target => target.descriptor)
}

export function patchSlideHtml(html: string, operations: readonly SlideEditOperation[]): string {
  const nodes = targets(html)
  const patches: { start: number; end: number; text: string }[] = []
  for (const operation of operations) {
    const target = nodes.find(target => target.descriptor.nodeId === operation.nodeId)
    const location = target?.element.sourceCodeLocation
    if (!target || !location?.startTag || !location.endTag) throw new DeckError('DECK_EDIT_UNSUPPORTED')
    if (operation.text !== undefined)
      patches.push({
        start: location.startTag.endOffset,
        end: location.endTag.startOffset,
        text: escapeHtml(operation.text),
      })
    if (operation.layout) {
      if (!target.descriptor.layoutEditable) throw new DeckError('DECK_EDIT_UNSUPPORTED')
      const l = operation.layout,
        declarations: string[] = []
      if (l.fontSize !== undefined) declarations.push(`font-size:${l.fontSize}px!important`)
      if (l.textAlign !== undefined) declarations.push(`text-align:${l.textAlign}!important`)
      if (l.marginTop !== undefined) declarations.push(`margin-top:${l.marginTop}px!important`)
      if (l.marginLeft !== undefined) declarations.push(`margin-left:${l.marginLeft}px!important`)
      const original = target.element.attrs.find(attr => attr.name === 'style')?.value ?? ''
      const attribute = location.attrs?.style
      const style = `style="${escapeHtml(`${original};${declarations.join(';')};`)}"`
      patches.push(
        attribute
          ? { start: attribute.startOffset, end: attribute.endOffset, text: style }
          : { start: location.startTag.endOffset - 1, end: location.startTag.endOffset - 1, text: ` ${style}` },
      )
    }
  }
  patches.sort((a, b) => a.start - b.start)
  for (let i = 1; i < patches.length; i++) if (patches[i - 1]!.end > patches[i]!.start) return fail()
  let result = html
  for (const patch of patches.reverse()) result = result.slice(0, patch.start) + patch.text + result.slice(patch.end)
  validateSlideHtml(result)
  return result
}
