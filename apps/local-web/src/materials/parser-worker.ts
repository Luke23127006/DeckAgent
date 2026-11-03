import { parentPort, workerData } from 'node:worker_threads'
import { extname, posix } from 'node:path'
import { Unzip, UnzipInflate } from 'fflate'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { PNG } from 'pngjs'
import jpeg from 'jpeg-js'
import { crc32 } from 'node:zlib'
import type { Extraction } from './parser.ts'

const TEXT_LIMIT = 1024 * 1024
const XML_LIMIT = 4 * 1024 * 1024
const EXPANDED_LIMIT = 32 * 1024 * 1024
function fail(code = 'MATERIAL_CORRUPT'): never {
  throw new Error(code)
}
function bounded(text: string): string {
  if (Buffer.byteLength(text) > TEXT_LIMIT) fail('MATERIAL_TEXT_LIMIT')
  return text
}
function xml(bytes: Uint8Array): Record<string, unknown> {
  if (bytes.length > XML_LIMIT) fail('MATERIAL_EXPANSION_LIMIT')
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  if (/<!DOCTYPE|<!ENTITY/i.test(text) || XMLValidator.validate(text) !== true) fail()
  return new XMLParser({ ignoreAttributes: false, parseTagValue: false, processEntities: true }).parse(text)
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function collect(value: unknown, key: string): string[] {
  if (Array.isArray(value)) return value.flatMap(v => collect(v, key))
  if (!object(value)) return []
  return Object.entries(value).flatMap(([k, v]) =>
    k === key
      ? (Array.isArray(v) ? v : [v]).map(item => (object(item) ? String(item['#text'] ?? '') : String(item)))
      : collect(v, key),
  )
}
function archive(bytes: Uint8Array): Map<string, Uint8Array> {
  const data = Buffer.from(bytes)
  let end = -1
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) {
    if (data.readUInt32LE(i) === 0x06054b50 && i + 22 + data.readUInt16LE(i + 20) === data.length) {
      end = i
      break
    }
  }
  if (
    end < 0 ||
    data.readUInt16LE(end + 4) ||
    data.readUInt16LE(end + 6) ||
    data.readUInt16LE(end + 8) !== data.readUInt16LE(end + 10)
  )
    fail()
  const count = data.readUInt16LE(end + 10),
    start = data.readUInt32LE(end + 16)
  if (!count || count > 1000 || start + data.readUInt32LE(end + 12) !== end) fail()
  const directory = new Map<string, { size: number; crc: number }>()
  let position = start,
    declared = 0
  for (let i = 0; i < count; i++) {
    if (position + 46 > end || data.readUInt32LE(position) !== 0x02014b50) fail()
    const flags = data.readUInt16LE(position + 8),
      method = data.readUInt16LE(position + 10)
    if (flags & 1) fail('MATERIAL_PROTECTED')
    if (method !== 0 && method !== 8) fail('MATERIAL_UNSUPPORTED_COMPRESSION')
    const compressed = data.readUInt32LE(position + 20),
      size = data.readUInt32LE(position + 24)
    const nameLength = data.readUInt16LE(position + 28),
      extraLength = data.readUInt16LE(position + 30),
      commentLength = data.readUInt16LE(position + 32)
    const name = data.subarray(position + 46, position + 46 + nameLength).toString('utf8')
    declared += size
    if (declared > EXPANDED_LIMIT || size / Math.max(1, compressed) > 1000) fail('MATERIAL_EXPANSION_LIMIT')
    if (directory.has(name)) fail()
    const local = data.readUInt32LE(position + 42)
    if (
      local + 30 > start ||
      data.readUInt32LE(local) !== 0x04034b50 ||
      data.readUInt16LE(local + 6) !== flags ||
      data.readUInt16LE(local + 8) !== method
    )
      fail()
    const localNameLength = data.readUInt16LE(local + 26),
      localExtraLength = data.readUInt16LE(local + 28)
    if (
      data.subarray(local + 30, local + 30 + localNameLength).toString('utf8') !== name ||
      local + 30 + localNameLength + localExtraLength + compressed > start
    )
      fail()
    directory.set(name, { size, crc: data.readUInt32LE(position + 16) })
    position += 46 + nameLength + extraLength + commentLength
    if (position > end) fail()
  }
  if (position !== end) fail()
  const files = new Map<string, Uint8Array>()
  let expanded = 0,
    entries = 0
  const unzip = new Unzip(file => {
    if (
      ++entries > 1000 ||
      file.name.includes('\\') ||
      file.name.startsWith('/') ||
      posix.normalize(file.name) !== file.name ||
      file.name.split('/').includes('..') ||
      files.has(file.name)
    )
      fail()
    const expected = directory.get(file.name)
    if (!expected) fail()
    if ((file.originalSize ?? 0) > EXPANDED_LIMIT) fail('MATERIAL_EXPANSION_LIMIT')
    const parts: Uint8Array[] = []
    let size = 0
    // Never extract entries onto disk, follow relationships or run embedded objects.
    file.ondata = (error, chunk, final) => {
      if (error) fail()
      expanded += chunk.length
      size += chunk.length
      if (expanded > EXPANDED_LIMIT) fail('MATERIAL_EXPANSION_LIMIT')
      parts.push(chunk)
      if (final) {
        const content = Buffer.concat(parts, size)
        if (size !== expected.size || crc32(content) !== expected.crc) fail()
        files.set(file.name, content)
      }
    }
    file.start()
  })
  unzip.register(UnzipInflate)
  for (let i = 0; i < bytes.length; i += 4096) unzip.push(bytes.subarray(i, i + 4096), i + 4096 >= bytes.length)
  if (files.size !== directory.size) fail()
  return files
}
async function parse(name: string, bytes: Uint8Array): Promise<Extraction> {
  const extension = extname(name).toLowerCase()
  const data = Buffer.from(bytes)
  if (extension === '.txt' || extension === '.md') {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    bounded(text)
    for (const character of text)
      if (character.charCodeAt(0) < 32 && ![9, 10, 13].includes(character.charCodeAt(0))) fail()
    return {
      mediaType: extension === '.md' ? 'text/markdown' : 'text/plain',
      text: bounded(text),
      warnings: text.trim() ? [] : ['NO_USABLE_TEXT'],
    }
  }
  if (extension === '.pdf') {
    if (data.subarray(0, 5).toString() !== '%PDF-') fail()
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const task = getDocument({
      data: Uint8Array.from(bytes),
      useWorkerFetch: false,
      useWasm: false,
      useSystemFonts: false,
      disableFontFace: true,
      stopAtErrors: true,
    })
    try {
      const document = await task.promise
      if (document.numPages > 100) fail('MATERIAL_PAGE_LIMIT')
      const pages: string[] = []
      let usable = false
      for (let i = 1; i <= document.numPages; i++) {
        const page = await document.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => ('str' in item ? item.str : '')).join(' ')
        usable ||= !!pageText.trim()
        pages.push(`[Page ${i}]\n${pageText}`)
        bounded(pages.join('\n'))
        page.cleanup()
      }
      const text = bounded(pages.join('\n'))
      return {
        mediaType: 'application/pdf',
        text,
        warnings: ['TEXT_ONLY_NO_VISUAL_LAYOUT_OR_OCR', ...(!usable ? ['NO_USABLE_TEXT'] : [])],
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'PasswordException') fail('MATERIAL_PROTECTED')
      throw error
    } finally {
      await task.destroy()
    }
  }
  if (extension === '.docx' || extension === '.pptx') {
    if (data.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1') fail('MATERIAL_PROTECTED_OR_LEGACY_OFFICE')
    if (data.readUInt32LE(0) !== 0x04034b50) fail()
    const files = archive(bytes)
    const part = (name: string) => {
      const bytes = files.get(name)
      if (!bytes) fail()
      return xml(bytes)
    }
    part('[Content_Types].xml')
    if (extension === '.docx') {
      const text = bounded(collect(part('word/document.xml'), 'w:t').join('\n'))
      return {
        mediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        text,
        warnings: ['TEXT_ONLY_MAIN_DOCUMENT; EMBEDDED_OBJECTS_AND_EXTERNAL_LINKS_NOT_READ'],
      }
    }
    const presentation = part('ppt/presentation.xml')
    const rels = part('ppt/_rels/presentation.xml.rels')
    const relationship = object(rels.Relationships) ? rels.Relationships.Relationship : undefined
    const list = Array.isArray(relationship) ? relationship : [relationship]
    const order: string[] = []
    const visit = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(visit)
        return
      }
      if (!object(value)) return
      for (const [key, item] of Object.entries(value)) {
        if (key === 'p:sldId')
          for (const slide of Array.isArray(item) ? item : [item]) {
            if (!object(slide)) fail()
            const rel = list.find(r => object(r) && r['@_Id'] === slide['@_r:id'])
            if (
              !object(rel) ||
              rel['@_TargetMode'] === 'External' ||
              typeof rel['@_Target'] !== 'string' ||
              !/^slides\/[^/]+\.xml$/.test(rel['@_Target'])
            )
              fail()
            order.push(`ppt/${rel['@_Target']}`)
          }
        else visit(item)
      }
    }
    visit(presentation)
    if (!order.length || order.length > 100 || new Set(order).size !== order.length) fail('MATERIAL_SLIDE_LIMIT')
    const text = bounded(
      order.map((name, index) => `[Slide ${index + 1}]\n${collect(part(name), 'a:t').join('\n')}`).join('\n'),
    )
    return {
      mediaType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      text,
      warnings: ['TEXT_ONLY_NO_NOTES_IMAGES_ANIMATIONS_OR_LAYOUT'],
    }
  }
  if (extension === '.png') {
    if (data.length < 24 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') fail()
    if (data.readUInt32BE(16) * data.readUInt32BE(20) > 16000000) fail('MATERIAL_IMAGE_LIMIT')
    PNG.sync.read(data, { checkCRC: true })
    return { mediaType: 'image/png', text: '', image: true, warnings: [] }
  }
  if (extension === '.jpg' || extension === '.jpeg') {
    jpeg.decode(data, { maxResolutionInMP: 16, maxMemoryUsageInMB: 96, tolerantDecoding: false })
    return { mediaType: 'image/jpeg', text: '', image: true, warnings: [] }
  }
  fail('MATERIAL_UNSUPPORTED_TYPE')
}
try {
  parentPort?.postMessage({ value: await parse(workerData.name, workerData.bytes) })
} catch (error) {
  const message =
    error instanceof Error && /maxResolutionInMP|maxMemoryUsageInMB/.test(error.message)
      ? 'MATERIAL_IMAGE_LIMIT'
      : error instanceof Error && /^MATERIAL_[A-Z_]+$/.test(error.message)
        ? error.message
        : 'MATERIAL_CORRUPT'
  parentPort?.postMessage({ error: message })
}
