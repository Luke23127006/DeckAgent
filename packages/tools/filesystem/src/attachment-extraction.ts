import { extname, posix } from 'node:path'
import { ZipReader, Uint8ArrayReader } from '@zip.js/zip.js'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { attachmentLimits as limits, attachmentParserVersion } from './attachment-contracts.ts'
import type { AttachmentLocation, AttachmentPart, ParsedAttachment } from './attachment-contracts.ts'
import { SourceError } from './contracts.ts'

interface Budget {
  entries: number
  expanded: number
  text: number
  readonly parts: AttachmentPart[]
  readonly omitted: { code: string; entry?: string }[]
  readonly capabilities: Set<string>
}

const media: Readonly<Record<string, string>> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.zip': 'application/zip',
}

function fail(code = 'ATTACHMENT_UNREADABLE'): never {
  throw new SourceError(code)
}
function unsafeArchive(): never {
  throw new SourceError('ARCHIVE_UNREADABLE')
}
function omission(budget: Budget, code: string, entry?: string): void {
  if (!budget.omitted.some(item => item.code === code && item.entry === entry))
    budget.omitted.push({ code, ...(entry === undefined ? {} : { entry }) })
}

function textPart(budget: Budget, text: string, location: AttachmentLocation): void {
  if (!text.trim()) return
  const bytes = Buffer.from(text)
  let end = Math.min(bytes.length, limits.textBytes - budget.text)
  while (end < bytes.length && end > 0 && (bytes[end]! & 0xc0) === 0x80) end--
  if (end < bytes.length) omission(budget, 'TEXT_LIMIT', location.entry)
  if (!end) return
  const content = bytes.subarray(0, end).toString('utf8')
  budget.text += end
  budget.parts.push({
    type: 'text',
    text: content,
    location: location.kind === 'lines' ? { ...location, start: 1, end: content.split('\n').length } : location,
  })
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function xml(bytes: Uint8Array | undefined): unknown[] {
  if (!bytes) fail()
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    fail()
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(text) || XMLValidator.validate(text) !== true) fail()
  const result: unknown = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    parseTagValue: false,
    processEntities: true,
  }).parse(text)
  if (!Array.isArray(result)) fail()
  return result
}

/** Depth is bounded independently of the parser, and visits preserve document order. */
function nodes(tree: unknown, tag: string): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = []
  const pending = [{ tree, depth: 0 }]
  while (pending.length) {
    const item = pending.pop()!
    if (item.depth > 256) fail('PARSING_LIMIT_EXCEEDED')
    if (Array.isArray(item.tree)) {
      for (let i = item.tree.length - 1; i >= 0; i--) pending.push({ tree: item.tree[i], depth: item.depth + 1 })
    } else if (record(item.tree)) {
      if (Object.hasOwn(item.tree, tag)) found.push(item.tree)
      for (const value of Object.values(item.tree).reverse())
        if (Array.isArray(value)) pending.push({ tree: value, depth: item.depth + 1 })
    }
  }
  return found
}

function runText(tree: unknown, tag: string): string {
  return nodes(tree, tag)
    .map(node =>
      nodes(node[tag], '#text')
        .map(item => String(item['#text']))
        .join(''),
    )
    .join('')
}

function attributes(node: Record<string, unknown>): Record<string, unknown> {
  return record(node[':@']) ? node[':@'] : {}
}

/** No file is extracted onto disk. Actual decoded bytes share one budget across all containers. */
async function container(bytes: Uint8Array, budget: Budget): Promise<Map<string, Buffer>> {
  const reader = new ZipReader(new Uint8ArrayReader(bytes), {
    strictness: 'strict',
    checkSignature: true,
    useWebWorkers: false,
  })
  const files = new Map<string, Buffer>()
  const names = new Set<string>()
  try {
    for await (const entry of reader.getEntriesGenerator()) {
      if (++budget.entries > limits.entries || entry.uncompressedSize > limits.entryBytes)
        fail('PARSING_LIMIT_EXCEEDED')
      const name = entry.filename
      if (
        name.length > 512 ||
        /^[\\/]|^[a-z]:|[\\:]|(^|\/)\.{1,2}(\/|$)/i.test(name) ||
        [...name].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
      )
        unsafeArchive()
      const key = name.normalize('NFC').toLowerCase().replace(/\/$/, '')
      if (!key || names.has(key) || entry.encrypted || ((entry.externalFileAttributes >>> 16) & 0xf000) === 0xa000)
        unsafeArchive()
      names.add(key)
      if (entry.directory) continue
      const chunks: Uint8Array[] = []
      let size = 0
      await entry.getData(
        new WritableStream<Uint8Array>({
          write(chunk) {
            size += chunk.length
            budget.expanded += chunk.length
            if (size > limits.entryBytes || budget.expanded > limits.expandedBytes) fail('PARSING_LIMIT_EXCEEDED')
            chunks.push(chunk)
          },
        }),
      )
      files.set(name, Buffer.concat(chunks))
    }
    return files
  } catch (error) {
    if (error instanceof SourceError) throw error
    unsafeArchive()
  } finally {
    await reader.close()
  }
}

async function extract(name: string, bytes: Uint8Array, budget: Budget, entry?: string): Promise<void> {
  const extension = extname(name).toLowerCase()
  const location = entry === undefined ? {} : { entry }
  if (extension === '.txt' || extension === '.md') {
    let text: string
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } catch {
      fail()
    }
    for (let index = 0; index < text.length; index++) {
      const code = text.charCodeAt(index)
      if (code < 32 && code !== 9 && code !== 10 && code !== 13) fail()
    }
    budget.capabilities.add('utf8-lines')
    textPart(budget, text, { kind: 'lines', ...location })
    return
  }
  if (extension === '.zip') {
    if (entry !== undefined) {
      omission(budget, 'NESTED_ZIP_NOT_READ', entry)
      return
    }
    const files = await container(bytes, budget)
    for (const [path, content] of files) {
      if (!media[extname(path).toLowerCase()]) {
        omission(budget, 'TYPE_NOT_READ', path)
        continue
      }
      try {
        await extract(path, content, budget, path)
      } catch (error) {
        if (error instanceof SourceError && error.code === 'ATTACHMENT_UNREADABLE')
          omission(budget, 'ENTRY_UNREADABLE', path)
        else throw error
      }
    }
    budget.capabilities.add('archive-entry-locations')
    return
  }
  if (extension === '.pdf') {
    if (!Buffer.from(bytes.subarray(0, 5)).equals(Buffer.from('%PDF-'))) fail()
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const task = getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: false,
      disableFontFace: true,
      useWasm: false,
      stopAtErrors: true,
      verbosity: 0,
    })
    try {
      const pdf = await task.promise
      if (pdf.numPages > limits.pages) fail('PARSING_LIMIT_EXCEEDED')
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        if (budget.text >= limits.textBytes) {
          omission(budget, 'TEXT_LIMIT', entry)
          break
        }
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        const text = content.items.map(item => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '')).join('')
        textPart(budget, text, { kind: 'page', page: pageNumber, ...location })
        page.cleanup()
      }
      budget.capabilities.add('pdf-text-pages')
      omission(budget, 'VISUAL_CONTENT_NOT_EXTRACTED', entry)
    } catch (error) {
      if (error instanceof SourceError) throw error
      fail()
    } finally {
      await task.destroy()
    }
    return
  }
  if (extension === '.docx' || extension === '.pptx') {
    const files = await container(bytes, budget)
    const types = xml(files.get('[Content_Types].xml'))
    const expected =
      extension === '.docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
        : 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml'
    if (!nodes(types, 'Override').some(node => attributes(node)['@_ContentType'] === expected)) fail()
    if (extension === '.docx') {
      const part = 'word/document.xml'
      const tree = xml(files.get(part))
      if (!nodes(tree, 'w:document').length) fail()
      const text = nodes(tree, 'w:p')
        .map(node => runText(node['w:p'], 'w:t'))
        .join('\n')
      textPart(budget, text, { kind: 'lines', part, ...location })
      budget.capabilities.add('docx-text-tables')
    } else {
      const tree = xml(files.get('ppt/presentation.xml'))
      if (!nodes(tree, 'p:presentation').length) fail()
      const relations = nodes(xml(files.get('ppt/_rels/presentation.xml.rels')), 'Relationship')
      const slides = nodes(tree, 'p:sldId')
      if (slides.length > limits.pages) fail('PARSING_LIMIT_EXCEEDED')
      for (const [index, slide] of slides.entries()) {
        const id = attributes(slide)['@_r:id']
        const relation = relations.find(node => attributes(node)['@_Id'] === id)
        if (!relation) fail()
        const attrs = attributes(relation)
        if (
          attrs['@_TargetMode'] === 'External' ||
          typeof attrs['@_Target'] !== 'string' ||
          !String(attrs['@_Type']).endsWith('/slide')
        )
          fail()
        const part = posix.normalize(posix.join('ppt', attrs['@_Target']))
        if (!part.startsWith('ppt/slides/')) fail()
        const slideTree = xml(files.get(part))
        if (!nodes(slideTree, 'p:sld').length) fail()
        const text = nodes(slideTree, 'a:p')
          .map(node => runText(node['a:p'], 'a:t'))
          .join('\n')
        textPart(budget, text, { kind: 'slide', slide: index + 1, part, ...location })
      }
      budget.capabilities.add('pptx-text-tables')
    }
    omission(budget, 'DOCUMENT_FEATURES_NOT_EXTRACTED', entry)
    return
  }
  if (extension === '.png' || extension === '.jpg' || extension === '.jpeg') {
    const expectedPng = extension === '.png'
    const signature = Buffer.from(bytes.subarray(0, expectedPng ? 8 : 3))
    if (!signature.equals(expectedPng ? Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) : Buffer.from([255, 216, 255])))
      fail()
    const { default: sharp } = await import('sharp')
    const image = sharp(bytes, { failOn: 'warning', limitInputPixels: limits.pixels })
    const metadata = await image.metadata().catch((error: unknown) => {
      if (error instanceof Error && /pixel limit/i.test(error.message)) fail('PARSING_LIMIT_EXCEEDED')
      throw error
    })
    if (metadata.format !== (expectedPng ? 'png' : 'jpeg')) fail()
    const encode = (side: number) =>
      image
        .clone()
        .rotate()
        .resize({ width: side, height: side, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer({ resolveWithObject: true })
    let output = await encode(limits.imageSide)
    while (output.data.length > limits.imageBytes) {
      const current = Math.max(output.info.width, output.info.height)
      if (current <= 64) fail('PARSING_LIMIT_EXCEEDED')
      output = await encode(Math.max(64, Math.floor(current * 0.75)))
    }
    budget.expanded += output.data.length
    if (budget.expanded > limits.expandedBytes) fail('PARSING_LIMIT_EXCEEDED')
    budget.parts.push({
      type: 'image',
      data: output.data.toString('base64'),
      mimeType: 'image/png',
      width: output.info.width,
      height: output.info.height,
      location: { kind: 'image', ...location },
    })
    budget.capabilities.add('normalized-image-no-ocr')
    if (metadata.pages && metadata.pages > 1) omission(budget, 'ANIMATION_NOT_READ', entry)
    if (output.info.width !== metadata.width || output.info.height !== metadata.height)
      omission(budget, 'IMAGE_RESIZED', entry)
    return
  }
  fail('ATTACHMENT_TYPE_UNSUPPORTED')
}

export async function extractAttachment(name: string, bytes: Uint8Array): Promise<ParsedAttachment> {
  const mediaType = media[extname(name).toLowerCase()]
  if (!mediaType) fail('ATTACHMENT_TYPE_UNSUPPORTED')
  if (!bytes.length) fail()
  const budget: Budget = { entries: 0, expanded: 0, text: 0, parts: [], omitted: [], capabilities: new Set() }
  try {
    await extract(name, bytes, budget)
  } catch (error) {
    if (error instanceof SourceError && error.code === 'ARCHIVE_UNREADABLE') fail()
    throw error
  }
  if (!budget.parts.length) fail()
  return {
    mediaType,
    parserVersion: attachmentParserVersion,
    capabilities: [...budget.capabilities],
    parts: budget.parts,
    omitted: budget.omitted,
    completeness: budget.omitted.length ? 'partial' : 'complete',
  }
}
