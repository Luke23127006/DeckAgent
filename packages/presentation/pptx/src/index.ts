import PptxGenJS from 'pptxgenjs'
import JSZip from 'jszip'
import { decodeSlideDocument, FormatError } from '@deckagent/presentation-document'
import type { BuiltArtifact, FormatAdapter, FormatContext, SlideNode } from '@deckagent/presentation-document'

/** A native capability proof. Font substitution must be an explicit caller decision. */
export class PptxFormatAdapter implements FormatAdapter {
  readonly id = 'pptx'
  constructor(private readonly fonts: Readonly<Record<string, string>>) {}
  context(input: FormatContext) {
    return {
      starter: input.document ? JSON.stringify(input.document) : '',
      rules: [
        'Native PPTX consumes the portable document. Unsupported layouts and missing font mappings fail explicitly.',
      ],
    }
  }
  async build(_source: string, input: FormatContext): Promise<BuiltArtifact> {
    const d = decodeSlideDocument(input.document)
    if (
      !['cover', 'section', 'title-body', 'two-column', 'key-figures', 'image-text', 'image-pair'].includes(
        d.layoutIntent,
      )
    )
      throw new FormatError('FORMAT_CAPABILITY_UNSUPPORTED')
    const font = (role: 'font.body' | 'font.heading') => {
      const face = this.fonts[input.design.theme[role]]
      if (!face || !/^[\w -]{1,100}$/.test(face)) throw new FormatError('FORMAT_FONT_MAPPING_REQUIRED')
      return face
    }
    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_WIDE'
    const slide = pptx.addSlide()
    const theme = input.design.theme
    slide.background = { color: theme['color.background'].slice(1) }
    slide.addText(d.title, {
      x: 0.5,
      y: 0.4,
      w: 12.3,
      h: 0.65,
      fontFace: font('font.heading'),
      fontSize: theme['type.heading'] * 0.75,
      color: theme['color.text'].slice(1),
      margin: 0,
      breakLine: false,
    })
    const images = d.nodes.filter(n => n.kind === 'image')
    const words = d.nodes.filter(n => n.kind !== 'image')
    const lines = (n: SlideNode): string[] =>
      n.kind === 'bullets'
        ? [...n.items]
        : n.kind === 'columns'
          ? n.columns.flatMap(c => [...c.bullets])
          : n.kind === 'metrics'
            ? n.items.map(m => `${m.value} — ${m.label}`)
            : n.kind === 'image'
              ? []
              : [n.text]
    const text = words.flatMap(lines).join('\n')
    const width = images.length === 1 ? 5.7 : 12.3
    const height = images.length > 1 ? 1.5 : 5.4
    // Reject content the proof cannot lay out; it never shrinks or truncates it to fit.
    if (text.length > (images.length > 1 ? 350 : 1600) || words.flatMap(lines).length > 12 || images.length > 2)
      throw new FormatError('FORMAT_CAPACITY_EXCEEDED')
    if (text)
      slide.addText(text, {
        x: 0.5,
        y: 1.4,
        w: width,
        h: height,
        fontFace: font('font.body'),
        fontSize: theme['type.body'] * 0.75,
        color: theme['color.text'].slice(1),
        margin: 0,
        paraSpaceAfter: 12,
        breakLine: false,
      })
    for (const [i, node] of images.entries()) {
      const asset = input.assets.find(a => a.assetId === node.assetId)
      if (!asset) throw new FormatError('ARTIFACT_ASSET_UNAVAILABLE')
      if (asset.byteSize !== asset.bytes.length || asset.bytes.length > 256 * 1024)
        throw new FormatError('ARTIFACT_ASSET_INVALID')
      const data = `image/png;base64,${Buffer.from(asset.bytes).toString('base64')}`
      const x = images.length === 1 ? 6.8 : 0.5 + i * 6.3,
        y = images.length === 1 ? 1.4 : 3.2
      const png = Buffer.from(asset.bytes)
      if (png.length < 24 || !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        throw new FormatError('ARTIFACT_ASSET_INVALID')
      const iw = png.readUInt32BE(16),
        ih = png.readUInt32BE(20)
      if (!iw || !ih) throw new FormatError('ARTIFACT_ASSET_INVALID')
      const scale = Math.min(5.8 / iw, 3.1 / ih),
        w = iw * scale,
        h = ih * scale
      slide.addImage({ data, x: x + (5.8 - w) / 2, y: y + (3.1 - h) / 2, w, h })
      if (node.caption)
        slide.addText(node.caption, {
          x,
          y: y + 3.2,
          w: 5.8,
          h: 0.6,
          fontFace: font('font.body'),
          fontSize: theme['type.caption'] * 0.75,
          color: theme['color.muted'].slice(1),
          margin: 0,
        })
    }
    if (d.notes) slide.addNotes(d.notes)
    const bytes = await pptx.write({ outputType: 'uint8array', compression: true })
    if (!(bytes instanceof Uint8Array)) throw new FormatError('FORMAT_BUILD_FAILED')
    return {
      bytes,
      descriptor: {
        format: 'pptx',
        mediaType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        extension: 'pptx',
        policyVersion: 'pptx-proof-v1',
        documentVersion: 1,
        template: { id: 'native-basic-proof', version: 1 },
      },
    }
  }
  read(bytes: Uint8Array): Uint8Array {
    return bytes
  }
}

/** Inspect the proof's native objects, independent of a rendered screenshot. */
export async function inspectPptx(
  bytes: Uint8Array,
): Promise<{ slideXml: readonly string[]; notesXml: readonly string[]; imageCount: number }> {
  const zip = await JSZip.loadAsync(bytes)
  const entries = Object.values(zip.files)
  return {
    slideXml: await Promise.all(
      entries.filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f.name)).map(f => f.async('string')),
    ),
    notesXml: await Promise.all(
      entries.filter(f => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(f.name)).map(f => f.async('string')),
    ),
    imageCount: entries.filter(f => /^ppt\/media\/[^/]+\.png$/.test(f.name)).length,
  }
}
