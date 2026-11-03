import { createRequire } from 'node:module'
const require = createRequire(new URL('../../apps/local-web/package.json', import.meta.url))
const { zipSync, strToU8 } = require('fflate')
const { PNG } = require('pngjs')
const jpeg = require('jpeg-js')

export function pdfFixture(text = 'RECYCLE_FACT_42 Paper can be recycled.') {
  const stream = `BT /F1 18 Tf 40 100 Td (${text}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 180] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let result = '%PDF-1.4\n',
    offsets = [0]
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(result))
    result += `${i + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = Buffer.byteLength(result)
  result += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map(n => `${String(n).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(result)
}
export function documentFixtures() {
  const types =
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>'
  const docx = zipSync({
    '[Content_Types].xml': strToU8(types),
    'word/document.xml': strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>RECYCLE_FACT_42</w:t></w:r></w:p><w:p><w:r><w:t>Tái chế giấy</w:t></w:r></w:p></w:body></w:document>',
    ),
  })
  const pptx = zipSync({
    '[Content_Types].xml': strToU8(types),
    'ppt/presentation.xml': strToU8(
      '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="1" r:id="two"/><p:sldId id="2" r:id="one"/></p:sldIdLst></p:presentation>',
    ),
    'ppt/_rels/presentation.xml.rels': strToU8(
      '<Relationships><Relationship Id="one" Target="slides/slide1.xml"/><Relationship Id="two" Target="slides/slide2.xml"/></Relationships>',
    ),
    'ppt/slides/slide1.xml': strToU8('<p:sld><a:t>SECOND_FACT</a:t></p:sld>'),
    'ppt/slides/slide2.xml': strToU8('<p:sld><a:t>RECYCLE_FACT_42</a:t></p:sld>'),
  })
  const rgba = Buffer.from([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255])
  const png = PNG.sync.write({ width: 2, height: 2, data: rgba })
  const jpg = jpeg.encode({ width: 2, height: 2, data: rgba }, 90).data
  return {
    'notes.txt': Buffer.from('RECYCLE_FACT_42 · Tái chế giấy'),
    'notes.md': Buffer.from('# RECYCLE_FACT_42\nTái chế giấy'),
    'notes.pdf': pdfFixture(),
    'notes.docx': docx,
    'notes.pptx': pptx,
    'red.png': png,
    'red.jpeg': jpg,
  }
}
export const zip = entries =>
  zipSync(Object.fromEntries(Object.entries(entries).map(([name, text]) => [name, strToU8(text)])))
