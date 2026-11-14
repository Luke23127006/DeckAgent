import assert from 'node:assert/strict'
import test from 'node:test'
import * as files from '../packages/tools/filesystem/lib/index.js'
import { readFile } from 'node:fs/promises'
import { attachmentZip, noisyAttachmentPng } from './fixtures/attachment-fixtures.mjs'

test('preparation preserves UTF-8 source lines without interpreting Markdown', async () => {
  assert.equal(typeof files.AttachmentParser, 'function')
  const parser = new files.AttachmentParser()
  try {
    const result = await parser.parse({ name: 'notes.md', bytes: Buffer.from('# Tiếng Việt 😀\n<script>ignore</script>'), signal: new AbortController().signal })
    assert.equal(result.mediaType, 'text/markdown')
    assert.equal(result.completeness, 'complete')
    assert.equal(result.parts[0].text, '# Tiếng Việt 😀\n<script>ignore</script>')
    assert.deepEqual(result.parts[0].location, { kind: 'lines', start: 1, end: 2 })
    assert.ok(result.parserVersion)
  } finally { await parser.close() }
})

test('ZIP preparation keeps entry locations and rejects corrupted archives without exposing parser errors', async () => {
  const parser = new files.AttachmentParser()
  const parse = async name => parser.parse({ name, bytes: await readFile(new URL(`./fixtures/attachments/${name}`, import.meta.url)), signal: new AbortController().signal })
  try {
    const result = await parse('safe.zip')
    assert.equal(result.mediaType, 'application/zip')
    assert.equal(result.parts[0].location.entry, 'notes.txt')
    assert.match(result.parts[0].text, /Tiếng Việt/)
    await assert.rejects(parse('bad-crc.zip'), { code: 'ATTACHMENT_UNREADABLE' })
  } finally { await parser.close() }
})

test('PDF preparation attributes text to real pages and refuses image-only material without claiming OCR', async () => {
  const parser = new files.AttachmentParser()
  const parse = async name => parser.parse({ name, bytes: await readFile(new URL(`./fixtures/attachments/${name}`, import.meta.url)), signal: new AbortController().signal })
  try {
    const result = await parse('plain.pdf')
    assert.equal(result.parts[1].location.page, 2)
    assert.match(result.parts[1].text, /Page 2 evidence/)
    assert.equal(result.completeness, 'partial')
    assert.ok(result.omitted.some(item => item.code === 'VISUAL_CONTENT_NOT_EXTRACTED'))
    await assert.rejects(parse('scan.pdf'), { code: 'ATTACHMENT_UNREADABLE' })
  } finally { await parser.close() }
})

test('Office preparation reads generated table text and follows presentation slide relationships', async () => {
  const parser = new files.AttachmentParser()
  const parse = async name => parser.parse({ name, bytes: await readFile(new URL(`./fixtures/attachments/${name}`, import.meta.url)), signal: new AbortController().signal })
  try {
    const word = await parse('generated.docx')
    assert.match(word.parts[0].text, /Tiếng Việt & test\nCell A\nCell B/)
    assert.equal(word.parts[0].location.part, 'word/document.xml')
    const slides = await parse('generated.pptx')
    assert.equal(slides.parts[0].location.slide, 1)
    assert.equal(slides.parts[1].location.slide, 2)
    assert.match(slides.parts[1].text, /Slide two/)
    assert.equal(slides.completeness, 'partial')
  } finally { await parser.close() }
})

test('image preparation returns bounded typed pixels and refuses truncated or renamed image bytes', async () => {
  const parser = new files.AttachmentParser()
  const bytes = await readFile(new URL('./fixtures/attachments/sample.png', import.meta.url))
  try {
    const result = await parser.parse({ name: 'image.png', bytes, signal: new AbortController().signal })
    const part = result.parts[0]
    assert.equal(part.type, 'image')
    assert.equal(part.mimeType, 'image/png')
    assert.equal(part.width, 1600)
    assert.equal(part.height, 900)
    assert.equal(Buffer.from(part.data, 'base64').readUInt32BE(16), 1600)
    await assert.rejects(parser.parse({ name: 'image.jpg', bytes, signal: new AbortController().signal }), { code: 'ATTACHMENT_UNREADABLE' })
    await assert.rejects(parser.parse({ name: 'image.png', bytes: bytes.subarray(0, 60), signal: new AbortController().signal }), { code: 'ATTACHMENT_UNREADABLE' })
    const detailed = await parser.parse({ name: 'noise.png', bytes: noisyAttachmentPng(), signal: new AbortController().signal })
    assert.ok(Buffer.from(detailed.parts[0].data, 'base64').length <= 256 * 1024)
    assert.ok(detailed.parts[0].width < 1024)
    assert.ok(detailed.omitted.some(item => item.code === 'IMAGE_RESIZED'))
  } finally { await parser.close() }
})

test('preparation enforces shared archive budgets, rejects dangerous entries and reports omitted nested archives', async () => {
  const parser = new files.AttachmentParser()
  const parse = bytes => parser.parse({ name: 'sources.zip', bytes, signal: new AbortController().signal })
  try {
    const nested = attachmentZip([{ name: 'notes.txt', bytes: 'usable source' }, { name: 'inner.zip', bytes: 'not read recursively' }])
    const result = await parse(nested)
    assert.equal(result.completeness, 'partial')
    assert.deepEqual(result.omitted, [{ code: 'NESTED_ZIP_NOT_READ', entry: 'inner.zip' }])
    for (const entries of [
      [{ name: '../escape.txt', bytes: 'escape' }],
      [{ name: 'link.txt', bytes: 'outside.txt', attributes: 0xa1ff << 16 }],
      [{ name: 'same.txt', bytes: 'a' }, { name: 'SAME.txt', bytes: 'b' }],
    ]) await assert.rejects(parse(attachmentZip(entries)), { code: 'ATTACHMENT_UNREADABLE' })
    await assert.rejects(parse(attachmentZip([{ name: 'notes.txt', bytes: 'valid' }, { name: 'unsafe.docx', bytes: attachmentZip([{ name: '../outside.txt', bytes: 'unsafe container' }]) }])), { code: 'ATTACHMENT_UNREADABLE' })
    await assert.rejects(parse(attachmentZip(Array.from({ length: 201 }, (_, i) => ({ name: `${i}.txt`, bytes: 'x' })))), { code: 'PARSING_LIMIT_EXCEEDED' })
    await assert.rejects(parse(attachmentZip([{ name: 'large.txt', bytes: Buffer.alloc(16 * 1024 * 1024 + 1, 65) }])), { code: 'PARSING_LIMIT_EXCEEDED' })
    await assert.rejects(parse(attachmentZip(Array.from({ length: 5 }, (_, i) => ({ name: `${i}.txt`, bytes: Buffer.alloc(14 * 1024 * 1024, 65) })))), { code: 'PARSING_LIMIT_EXCEEDED' })
  } finally { await parser.close() }
})

test('Office XML refuses DTD and slide numbers follow presentation order instead of filename order', async () => {
  const parser = new files.AttachmentParser()
  const parse = (name, bytes) => parser.parse({ name, bytes, signal: new AbortController().signal })
  const types = kind => `<Types><Override ContentType="application/vnd.openxmlformats-officedocument.${kind}.main+xml"/></Types>`
  try {
    await assert.rejects(parse('bad.docx', attachmentZip([
      { name: '[Content_Types].xml', bytes: types('wordprocessingml.document') },
      { name: 'word/document.xml', bytes: '<!DOCTYPE x [<!ENTITY external SYSTEM "file:///not-read">]><w:document><w:p><w:r><w:t>&external;</w:t></w:r></w:p></w:document>' },
    ])), { code: 'ATTACHMENT_UNREADABLE' })
    const slide = text => `<p:sld><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:sld>`
    const result = await parse('order.pptx', attachmentZip([
      { name: '[Content_Types].xml', bytes: types('presentationml.presentation') },
      { name: 'ppt/presentation.xml', bytes: '<p:presentation><p:sldIdLst><p:sldId r:id="second"/><p:sldId r:id="first"/></p:sldIdLst></p:presentation>' },
      { name: 'ppt/_rels/presentation.xml.rels', bytes: '<Relationships><Relationship Id="first" Type="http://fixture/slide" Target="slides/slide1.xml"/><Relationship Id="second" Type="http://fixture/slide" Target="slides/slide2.xml"/></Relationships>' },
      { name: 'ppt/slides/slide1.xml', bytes: slide('Filename one, actual second') },
      { name: 'ppt/slides/slide2.xml', bytes: slide('Filename two, actual first') },
    ]))
    assert.equal(result.parts[0].text, 'Filename two, actual first')
    assert.equal(result.parts[0].location.slide, 1)
  } finally { await parser.close() }
})

test('text truncation is explicit, keeps valid Unicode and queued preparation can be cancelled and closed', async () => {
  const parser = new files.AttachmentParser()
  const bytes = Buffer.from('a'.repeat(2 * 1024 * 1024 - 1) + '😀 tail')
  const result = await parser.parse({ name: 'large.txt', bytes, signal: new AbortController().signal })
  assert.equal(result.completeness, 'partial')
  assert.equal(result.parts[0].text.endsWith('a'), true)
  assert.equal(result.parts[0].text.includes('\ufffd'), false)
  assert.ok(result.omitted.some(item => item.code === 'TEXT_LIMIT'))
  await assert.rejects(parser.parse({ name: 'large.txt', bytes: Buffer.alloc(20 * 1024 * 1024 + 1), signal: new AbortController().signal }), { code: 'ATTACHMENT_TOO_LARGE' })
  const abort = new AbortController()
  const pending = Array.from({ length: 6 }, () => parser.parse({ name: 'work.txt', bytes, signal: abort.signal }))
  const all = Promise.allSettled(pending)
  abort.abort()
  await parser.close()
  assert.ok((await all).every(item => item.status === 'rejected'))
  await assert.rejects(parser.parse({ name: 'closed.txt', bytes, signal: new AbortController().signal }), { code: 'PARSER_CLOSED' })
})

test('page and pixel budgets reject excess input, encrypted documents remain unreadable and JPEG stays typed', async () => {
  const parser = new files.AttachmentParser()
  const parse = async name => parser.parse({ name, bytes: await readFile(new URL(`./fixtures/attachments/${name}`, import.meta.url)), signal: new AbortController().signal })
  try {
    for (const name of ['over-pages.pdf', 'over-pixels.png']) await assert.rejects(parse(name), { code: 'PARSING_LIMIT_EXCEEDED' })
    for (const name of ['encrypted.pdf', 'strict-encrypted.zip']) await assert.rejects(parse(name), { code: 'ATTACHMENT_UNREADABLE' })
    const jpeg = await parse('sample.jpg')
    assert.equal(jpeg.mediaType, 'image/jpeg')
    assert.equal(jpeg.parts[0].mimeType, 'image/png')
    assert.equal(jpeg.parts[0].width, 1600)
  } finally { await parser.close() }
})
