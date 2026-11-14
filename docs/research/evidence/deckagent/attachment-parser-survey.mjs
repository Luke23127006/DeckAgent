// Research harness only: no product admission code or approved limits.
// Install the pinned candidates in a separate directory, then pass that directory.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { cpus, platform, release } from 'node:os'

const root = resolve(process.argv[2])
const require = createRequire(join(root, 'package.json'))
const MiB = 1024 * 1024
const trial = { expandedBytes: 64 * MiB, entryBytes: 16 * MiB, entries: 200, pages: 200, pixels: 16_000_000 }
const fail = code => { throw Object.assign(new Error(code), { code }) }
const fixtures = join(root, 'fixtures')

function unpack(bytes) {
  const { Unzip, UnzipInflate } = require('fflate')
  const files = new Map()
  let count = 0
  let expanded = 0
  const unzip = new Unzip(file => {
    if (++count > trial.entries) fail('ENTRY_COUNT')
    if (/^[\\/]|^[a-z]:|[\\:]|(^|\/)\.\.(\/|$)/i.test(file.name)) fail('UNSAFE_PATH')
    if (files.has(file.name)) fail('DUPLICATE_ENTRY')
    if (file.originalSize > trial.entryBytes) fail('ENTRY_BYTES')
    const chunks = []
    let size = 0
    files.set(file.name, null)
    file.ondata = (error, data, final) => {
      if (error) {
        if (typeof error.code === 'string') throw error
        fail('BAD_ZIP')
      }
      size += data.length
      expanded += data.length
      if (size > trial.entryBytes || expanded > trial.expandedBytes) fail('EXPANSION_BYTES')
      chunks.push(data)
      if (final) files.set(file.name, Buffer.concat(chunks))
    }
    file.start()
  })
  unzip.register(UnzipInflate)
  // Small compressed chunks bound overshoot of the emitted-byte check.
  try {
    for (let offset = 0; offset < bytes.length; offset += 256)
      unzip.push(bytes.subarray(offset, offset + 256), offset + 256 >= bytes.length)
  } catch (error) {
    if (typeof error.code === 'string') throw error
    fail('BAD_ZIP')
  }
  if ([...files.values()].some(value => value === null)) fail('BAD_ZIP')
  return files
}

function xmlText(bytes) {
  const { XMLParser, XMLValidator } = require('fast-xml-parser')
  const xml = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) fail('DTD_DENIED')
  if (XMLValidator.validate(xml) !== true) fail('BAD_XML')
  const parsed = new XMLParser({ preserveOrder: true, ignoreAttributes: false, processEntities: true }).parse(xml)
  const text = []
  function visit(nodes) {
    for (const node of nodes) for (const [key, value] of Object.entries(node)) {
      if ((key === 'w:t' || key === 'a:t') && Array.isArray(value))
        text.push(value.map(item => item['#text'] ?? '').join(''))
      else if (Array.isArray(value)) visit(value)
    }
  }
  visit(parsed)
  return text
}

async function unpackStrict(bytes, signal, cancelAfterWrite = false) {
  const { ZipReader, Uint8ArrayReader } = require('@zip.js/zip.js')
  const reader = new ZipReader(new Uint8ArrayReader(bytes), { checkSignature: true, strictness: 'strict', useWebWorkers: false })
  const files = new Map()
  let expanded = 0
  let count = 0
  const cancel = new AbortController()
  signal = signal ? AbortSignal.any([signal, cancel.signal]) : cancel.signal
  try {
    for await (const entry of reader.getEntriesGenerator()) {
      if (++count > trial.entries) fail('ENTRY_COUNT')
      if (/^[\\/]|^[a-z]:|[\\:]|(^|\/)\.\.(\/|$)/i.test(entry.filename)) fail('UNSAFE_PATH')
      if (entry.encrypted) fail('ENCRYPTED_ZIP')
      if (((entry.externalFileAttributes >>> 16) & 0xf000) === 0xa000) fail('SYMLINK_ZIP')
      if (files.has(entry.filename)) fail('DUPLICATE_ENTRY')
      if (entry.uncompressedSize > trial.entryBytes) fail('ENTRY_BYTES')
      if (entry.directory) continue
      const chunks = []
      let size = 0
      await entry.getData(new WritableStream({ write(data) {
        size += data.length
        expanded += data.length
        if (size > trial.entryBytes || expanded > trial.expandedBytes) fail('EXPANSION_BYTES')
        chunks.push(data)
        if (cancelAfterWrite) cancel.abort()
      } }), { ...(signal ? { signal } : {}) })
      files.set(entry.filename, Buffer.concat(chunks))
    }
    return files
  } finally { await reader.close() }
}

async function extract(name, bytes) {
  if (name.startsWith('strict-')) {
    const files = await unpackStrict(bytes, name === 'strict-cancel.zip' ? AbortSignal.abort() : undefined, name === 'strict-inflight-cancel.zip')
    return { entries: [...files].map(([path, data]) => ({ path, bytes: data.length })) }
  }
  if (/\.(txt|md)$/.test(name)) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (text.includes('\0')) fail('BINARY_TEXT')
    return { text, locations: [{ kind: 'lines', start: 1, end: text.split('\n').length }] }
  }
  if (/\.pdf$/.test(name)) {
    const { getDocument } = await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href)
    const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, disableFontFace: true, useWasm: false, stopAtErrors: true, verbosity: 0 })
    try {
      const pdf = await task.promise
      if (pdf.numPages > trial.pages) fail('PAGE_COUNT')
      const pages = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        pages.push({ page: i, text: content.items.filter(item => 'str' in item).map(item => item.str).join(' ') })
        page.cleanup()
      }
      return { pages }
    } finally { await task.destroy() }
  }
  if (/\.(docx|pptx)$/.test(name)) {
    const files = unpack(bytes)
    const paths = name.endsWith('.docx') ? ['word/document.xml'] : [...files.keys()].filter(key => /^ppt\/slides\/slide\d+\.xml$/.test(key)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    return { parts: paths.map(path => ({ path, text: xmlText(files.get(path) ?? fail('MISSING_PART')) })) }
  }
  if (/\.(png|jpg)$/.test(name)) {
    const sharp = require('sharp')
    const image = sharp(bytes, { failOn: 'warning', limitInputPixels: trial.pixels })
    const metadata = await image.metadata()
    const preview = await image.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
    return { format: metadata.format, width: metadata.width, height: metadata.height, previewBytes: preview.length }
  }
  const files = unpack(bytes)
  return { entries: [...files].map(([path, data]) => ({ path, bytes: data.length })) }
}

const cases = [
  ['utf8.txt', value => assert.equal(value.text, 'Tiếng Việt 😀\nsecond line')],
  ['utf8.md', value => assert.equal(value.locations[0].end, 2)],
  ['large.txt', value => assert.equal(Buffer.byteLength(value.text), 20 * MiB)],
  ['invalid-utf8.txt', 'TypeError'],
  ['binary.txt', 'BINARY_TEXT'],
  ['plain.pdf', value => { assert.equal(value.pages.length, 3); assert.match(value.pages[1].text, /Page 2 evidence/); }],
  ['large.pdf', value => assert.equal(value.pages.length, 200)],
  ['over-pages.pdf', 'PAGE_COUNT'],
  ['scan.pdf', value => assert.equal(value.pages[0].text, '')],
  ['bad.pdf', 'InvalidPDFException'],
  ['encrypted.pdf', 'PasswordException'],
  ['sample.docx', value => assert.deepEqual(value.parts[0].text, ['Tiếng Việt & test', 'Cell A', 'Cell B'])],
  ['sample.pptx', value => assert.equal(value.parts[1].text[0], 'Slide two')],
  ['generated.docx', value => assert.deepEqual(value.parts[0].text, ['Tiếng Việt & test', 'Cell A', 'Cell B'])],
  ['generated.pptx', value => assert.equal(value.parts[1].text[0], 'Slide two')],
  ['bad-xml.docx', 'BAD_XML'],
  ['entities.docx', 'DTD_DENIED'],
  ['sample.png', value => assert.equal(value.width, 1920)],
  ['sample.jpg', value => assert.equal(value.format, 'jpeg')],
  ['16mp.png', value => assert.equal(value.width * value.height, trial.pixels)],
  ['photo16mp.jpg', value => assert.equal(value.width * value.height, trial.pixels)],
  ['over-pixels.png', 'Error'],
  ['truncated.png', 'Error'],
  ['truncated.jpg', 'Error'],
  ['safe.zip', value => assert.equal(value.entries.length, 2)],
  ['nested.zip', value => assert.equal(value.entries[0].path, 'inner.zip')],
  ['traversal.zip', 'UNSAFE_PATH'],
  ['over-entries.zip', 'ENTRY_COUNT'],
  ['over-entry.zip', 'ENTRY_BYTES'],
  ['over-total.zip', 'EXPANSION_BYTES'],
  ['broken.zip', 'BAD_ZIP'],
  // Observations of missing library checks, not a claim that these files are safe.
  ['bad-crc.zip', value => assert.equal(value.entries.length, 1)],
  ['missing-directory.zip', value => assert.equal(value.entries.length, 1)],
  ['strict-safe.zip', value => assert.equal(value.entries.length, 2)],
  ['strict-bad-crc.zip', 'Error'],
  ['strict-missing-directory.zip', 'Error'],
  ['strict-over-total.zip', 'EXPANSION_BYTES'],
  ['strict-over-entry.zip', 'ENTRY_BYTES'],
  ['strict-over-entries.zip', 'ENTRY_COUNT'],
  ['strict-traversal.zip', 'Error'],
  ['strict-generated.docx', value => assert.ok(value.entries.some(entry => entry.path === 'word/document.xml'))],
  ['strict-cancel.zip', 'AbortError'],
  ['strict-inflight-cancel.zip', 'AbortError'],
  ['strict-encrypted.zip', 'ENCRYPTED_ZIP'],
  ['strict-symlink.zip', 'SYMLINK_ZIP'],
  ['strict-underreported.zip', 'Error'],
  ['strict-at-total.zip', value => assert.equal(value.entries.length, 4)],
]

if (process.argv[3] === '--busy') {
  process.send('ready')
  while (true) { /* A synchronous parser that does not cooperate with AbortSignal. */ }
} else if (process.argv[3] === '--case') {
  const [name, expected] = cases[Number(process.argv[4])]
  const bytes = await readFile(join(fixtures, name))
  const start = performance.now()
  let outcome = 'ok'
  let errorMessage
  let verified = false
  try {
    const result = await extract(name, bytes)
    if (typeof expected !== 'function') fail('EXPECTED_REJECTION')
    expected(result)
    verified = true
  } catch (error) {
    outcome = typeof error.code === 'string' ? error.code : error.name
    if (outcome === 'Error') errorMessage = error.message.slice(0, 160)
    verified = typeof expected === 'string' && (outcome === expected || error.name === expected)
  }
  console.log(JSON.stringify({ name, inputBytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), outcome, ...(errorMessage ? { errorMessage } : {}), verified, milliseconds: +(performance.now() - start).toFixed(2), peakRssMiB: +(process.resourceUsage().maxRSS / 1024).toFixed(2) }))
  process.exitCode = verified ? 0 : 1
} else {
  await mkdir(fixtures, { recursive: true })
  const { zipSync, strToU8 } = require('fflate')
  const { PDFDocument, StandardFonts } = require('pdf-lib')
  const sharp = require('sharp')
  const { Document, Packer, Paragraph, Table, TableRow, TableCell } = require('docx')
  const PptxGenJS = require('pptxgenjs')
  const save = (name, value) => writeFile(join(fixtures, name), value)
  const zip = files => zipSync(Object.fromEntries(Object.entries(files).map(([name, value]) => [name, typeof value === 'string' ? strToU8(value) : value])), { level: 6, mtime: new Date('2026-01-01T00:00:00Z') })
  const text = 'Tiếng Việt 😀\nsecond line'
  await save('utf8.txt', text)
  await save('utf8.md', text)
  await save('large.txt', Buffer.alloc(20 * MiB, 65))
  await save('invalid-utf8.txt', Buffer.from([0xc3, 0x28]))
  await save('binary.txt', Buffer.from([65, 0, 66]))
  const image = await sharp({ create: { width: 1920, height: 1080, channels: 3, background: '#246789' } }).png().toBuffer()
  await save('sample.png', image)
  const jpeg = await sharp(image).jpeg().toBuffer()
  await save('sample.jpg', jpeg)
  await save('truncated.png', image.subarray(0, image.length - 40))
  await save('truncated.jpg', jpeg.subarray(0, Math.floor(jpeg.length / 2)))
  for (const [name, width] of [['16mp.png', 4000], ['over-pixels.png', 4001]])
    await save(name, await sharp({ create: { width, height: 4000, channels: 3, background: '#123456' } }).png().toBuffer())
  const noise = Buffer.alloc(4000 * 4000 * 3)
  let seed = 123456789
  for (let i = 0; i < noise.length; i++) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; noise[i] = seed & 255 }
  await save('photo16mp.jpg', await sharp(noise, { raw: { width: 4000, height: 4000, channels: 3 } }).jpeg({ quality: 85 }).toBuffer())
  for (const [name, count] of [['plain.pdf', 3], ['large.pdf', 200], ['over-pages.pdf', 201]]) {
    const pdf = await PDFDocument.create()
    pdf.setCreationDate(new Date('2026-01-01T00:00:00Z'))
    pdf.setModificationDate(new Date('2026-01-01T00:00:00Z'))
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    for (let i = 1; i <= count; i++) pdf.addPage().drawText(`Page ${i} evidence`, { x: 30, y: 700, font })
    await save(name, await pdf.save())
  }
  const scan = await PDFDocument.create()
  const embedded = await scan.embedPng(image)
  scan.addPage().drawImage(embedded, { x: 0, y: 0, width: 500, height: 300 })
  await save('scan.pdf', await scan.save())
  await save('bad.pdf', '%PDF-1.7\nnot a PDF')
  // A minimal encryption dictionary tests the password-required path, not cryptographic interoperability.
  const encryptedObjects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>',
    '<< /Filter /Standard /V 1 /R 2 /O <' + '00'.repeat(32) + '> /U <' + '00'.repeat(32) + '> /P -4 >>',
  ]
  let encrypted = '%PDF-1.4\n'
  const offsets = [0]
  for (const [index, object] of encryptedObjects.entries()) { offsets.push(Buffer.byteLength(encrypted)); encrypted += `${index + 1} 0 obj\n${object}\nendobj\n` }
  const xref = Buffer.byteLength(encrypted)
  encrypted += 'xref\n0 5\n0000000000 65535 f \n' + offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  encrypted += `trailer\n<< /Size 5 /Root 1 0 R /Encrypt 4 0 R /ID [<${'00'.repeat(16)}><${'00'.repeat(16)}>] >>\nstartxref\n${xref}\n%%EOF\n`
  await save('encrypted.pdf', encrypted)
  const types = '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>'
  const word = '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Tiếng Việt &amp; test</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Cell B</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>'
  await save('sample.docx', zip({ '[Content_Types].xml': types, 'word/document.xml': word }))
  await save('bad-xml.docx', zip({ 'word/document.xml': '<w:document><w:t>unclosed' }))
  await save('entities.docx', zip({ 'word/document.xml': '<!DOCTYPE x [<!ENTITY a "secret">]><x>&a;</x>' }))
  const slide = text => `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:cSld></p:sld>`
  await save('sample.pptx', zip({ '[Content_Types].xml': types, 'ppt/slides/slide2.xml': slide('Slide two'), 'ppt/slides/slide1.xml': slide('Slide one') }))
  const document = new Document({ sections: [{ children: [new Paragraph('Tiếng Việt & test'), new Table({ rows: [new TableRow({ children: ['Cell A', 'Cell B'].map(text => new TableCell({ children: [new Paragraph(text)] })) })] })] }] })
  await save('generated.docx', await Packer.toBuffer(document))
  const presentation = new PptxGenJS()
  presentation.addSlide().addText('Slide one', { x: 1, y: 1, w: 4, h: 1 })
  presentation.addSlide().addText('Slide two', { x: 1, y: 1, w: 4, h: 1 })
  await save('generated.pptx', await presentation.write({ outputType: 'nodebuffer' }))
  await save('safe.zip', zip({ 'notes.txt': text, 'slides/readme.md': '# test' }))
  await save('nested.zip', zip({ 'inner.zip': zip({ 'notes.txt': text }) }))
  await save('traversal.zip', zip({ '../escape.txt': 'outside' }))
  await save('over-entries.zip', zip(Object.fromEntries(Array.from({ length: 201 }, (_, i) => [`${i}.txt`, 'x']))))
  await save('over-entry.zip', zip({ 'large.txt': new Uint8Array(17 * MiB) }))
  await save('over-total.zip', zip(Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`${i}.txt`, new Uint8Array(14 * MiB)]))))
  const goodZip = zip({ 'notes.txt': 'hello'.repeat(100) })
  await save('broken.zip', goodZip.subarray(0, 40))
  const badCrc = Buffer.from(goodZip)
  badCrc[14] ^= 1
  const directoryOffset = badCrc.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]))
  badCrc[directoryOffset + 16] ^= 1
  await save('bad-crc.zip', badCrc)
  await save('missing-directory.zip', goodZip.subarray(0, directoryOffset))
  for (const name of ['safe.zip', 'bad-crc.zip', 'missing-directory.zip', 'over-total.zip', 'over-entry.zip', 'over-entries.zip', 'traversal.zip', 'generated.docx'])
    await save(`strict-${name}`, await readFile(join(fixtures, name)))
  await save('strict-cancel.zip', goodZip)
  await save('strict-inflight-cancel.zip', await readFile(join(fixtures, 'over-total.zip')))
  const { ZipWriter, Uint8ArrayWriter, Uint8ArrayReader } = require('@zip.js/zip.js')
  const encryptedWriter = new ZipWriter(new Uint8ArrayWriter(), { password: 'fixture-password-not-a-secret', useWebWorkers: false })
  await encryptedWriter.add('notes.txt', new Uint8ArrayReader(strToU8('fixture text')))
  await save('strict-encrypted.zip', await encryptedWriter.close())
  await save('strict-symlink.zip', zipSync({ 'link.txt': [strToU8('../outside.txt'), { attrs: 0xa1ff << 16, os: 3 }] }))
  const underreported = Buffer.from(goodZip)
  underreported.writeUInt32LE(1, 22)
  underreported.writeUInt32LE(1, directoryOffset + 24)
  await save('strict-underreported.zip', underreported)
  await save('strict-at-total.zip', zip(Object.fromEntries(Array.from({ length: 4 }, (_, i) => [`${i}.txt`, new Uint8Array(16 * MiB)]))))
  const results = []
  for (let index = 0; index < cases.length; index++) {
    for (let repetition = 0; repetition < 3; repetition++) {
      const result = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--max-old-space-size=256', fileURLToPath(import.meta.url), root, '--case', String(index)], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
        const timeout = setTimeout(() => child.kill(), 30_000)
        let out = ''; let err = ''
        child.stdout.on('data', chunk => { out += chunk })
        child.stderr.on('data', chunk => { err += chunk })
        child.on('error', reject)
        child.on('close', code => {
          clearTimeout(timeout)
          try { resolve({ ...JSON.parse(out.trim().split('\n').at(-1)), exitCode: code, warnings: err.trim() }) }
          catch { reject(new Error(`Survey child failed: ${cases[index][0]}: ${out} ${err}`)) }
        })
      })
      results.push({ repetition: repetition + 1, ...result })
    }
    console.log(`${cases[index][0]}: ${results.at(-1).outcome}, verified=${results.at(-1).verified}`)
  }
  const cancellation = []
  for (let i = 0; i < 3; i++) {
    cancellation.push(await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [fileURLToPath(import.meta.url), root, '--busy'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] })
      const timeout = setTimeout(() => { child.kill(); reject(new Error('Cancellation probe timed out')) }, 5000)
      let started
      child.on('message', () => { started = performance.now(); child.kill() })
      child.on('error', reject)
      child.on('close', () => {
        clearTimeout(timeout)
        if (started === undefined) reject(new Error('Cancellation probe did not start'))
        else resolve({ killToCloseMs: +(performance.now() - started).toFixed(2) })
      })
    }))
  }
  const versions = Object.fromEntries(['pdfjs-dist', 'fflate', 'fast-xml-parser', 'sharp', 'pdf-lib', 'docx', 'pptxgenjs', '@zip.js/zip.js'].map(name => [name, require(join(root, 'node_modules', name, 'package.json')).version]))
  const report = { checkedAt: new Date().toISOString(), platform: platform(), release: release(), cpu: cpus()[0].model, node: process.version, versions, trialLimits: trial, method: 'Three fresh child processes per fixture; timing includes parser import and extraction, excludes fixture file read and process startup. maxRSS is total child peak RSS, not a delta or a hard memory limit. sample.docx/pptx contain synthetic Office parts; generated.docx/pptx are emitted by document generators. ZIP acceptance cases expose missing integrity checks, not production-safe admission.', cancellation, results }
  await writeFile(join(root, 'results.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ verified: results.filter(item => item.verified).length, total: results.length, report: join(root, 'results.json') }))
  process.exitCode = results.every(item => item.verified) ? 0 : 1
}
