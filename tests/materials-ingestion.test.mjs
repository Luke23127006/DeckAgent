import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { extractMaterial } from '../apps/local-web/lib/types/materials/parser.js'
import { documentFixtures, zip, pdfFixture } from './fixtures/material-documents.mjs'

for (const [name, bytes] of Object.entries(documentFixtures()))
  test(`known-content extraction: ${name}`, { timeout: 20000 }, async () => {
    const result = await extractMaterial(name, bytes, new AbortController().signal)
    if (/\.(png|jpeg)$/.test(name)) {
      assert.equal(result.image, true)
      assert.equal(result.text, '', 'Decoded image is not a claim of model interpretation')
    } else {
      assert.match(result.text, /RECYCLE_FACT_42/)
      if (name.endsWith('.pdf')) assert.match(result.text, /\[Page 1\]/)
      if (name.endsWith('.pptx'))
        assert.ok(
          result.text.indexOf('RECYCLE_FACT_42') < result.text.indexOf('SECOND_FACT'),
          'Presentation order comes from relationships, not entry filenames',
        )
    }
  })
test('invalid formats, binary text, forged images and XML entities are rejected', async () => {
  for (const [name, bytes] of [
    ['bad.png', Buffer.from('not png')],
    ['bad.jpeg', Buffer.from('not jpeg')],
    ['bad.pdf', Buffer.from('not pdf')],
    ['bad.txt', Buffer.from([0, 1, 2])],
    ['bad.docx', Buffer.from('not zip')],
    ['bad.exe', Buffer.from('text')],
    [
      'entity.docx',
      zip({
        '[Content_Types].xml': '<Types/>',
        'word/document.xml':
          '<!DOCTYPE x [<!ENTITY e SYSTEM "file:///private">]><w:document><w:t>&e;</w:t></w:document>',
      }),
    ],
  ]) {
    await assert.rejects(extractMaterial(name, bytes, new AbortController().signal), /MATERIAL_/)
  }
})
test('text resource limit and pre-aborted parsing are explicit; valid empty text remains usable', async () => {
  await assert.rejects(
    extractMaterial('large.txt', Buffer.alloc(1024 * 1024 + 1, 65), new AbortController().signal),
    /MATERIAL_TEXT_LIMIT/,
  )
  await assert.rejects(extractMaterial('notes.txt', Buffer.from('text'), AbortSignal.abort()))
  const result = await extractMaterial('empty.txt', Buffer.alloc(0), new AbortController().signal)
  assert.deepEqual(result.warnings, ['NO_USABLE_TEXT'])
})
test('archive expansion is bounded before oversized content is accepted', async () => {
  const bytes = zip({ '[Content_Types].xml': '<Types/>', 'word/document.xml': 'x'.repeat(33 * 1024 * 1024) })
  await assert.rejects(extractMaterial('bomb.docx', bytes, new AbortController().signal), /MATERIAL_EXPANSION_LIMIT/)
})
test('truncated ZIP directory and changed central CRC cannot become ready documents', async () => {
  const bytes = Buffer.from(documentFixtures()['notes.docx'])
  await assert.rejects(
    extractMaterial('truncated.docx', bytes.subarray(0, bytes.length - 22), new AbortController().signal),
    /MATERIAL_/,
  )
  const changed = Buffer.from(bytes)
  const central = changed.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]))
  changed[central + 16] ^= 1
  await assert.rejects(extractMaterial('changed.docx', changed, new AbortController().signal), /MATERIAL_/)
})
test('active parser cancellation settles after worker termination without accepting content', async () => {
  const abort = new AbortController()
  const parsing = extractMaterial('notes.txt', Buffer.alloc(1024 * 1024, 65), abort.signal)
  const timer = setTimeout(() => abort.abort(), 1)
  try {
    await assert.rejects(parsing, /MATERIAL_CANCELLED/)
    assert.equal(abort.signal.aborted, true)
  } finally {
    clearTimeout(timer)
  }
})
test('password-protected PDF is explicit and a valid blank PDF reports no usable text', async () => {
  const protectedPdf = await readFile(new URL('./fixtures/material-protected.pdf', import.meta.url))
  await assert.rejects(extractMaterial('locked.pdf', protectedPdf, new AbortController().signal), /MATERIAL_PROTECTED/)
  const blank = await extractMaterial('blank.pdf', pdfFixture(''), new AbortController().signal)
  assert.ok(blank.warnings.includes('NO_USABLE_TEXT'))
})
