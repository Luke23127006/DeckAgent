import { existsSync, lstatSync, unlinkSync } from 'node:fs'
import type { DatabaseSync } from 'node:sqlite'
import { decodeArtifactDescriptor, decodeSlideDocument } from '@deckagent/presentation-document'
import type { ArtifactDescriptor, FormatAdapter, SlideDocument } from '@deckagent/presentation-document'
import { DeckError, isRecord, validId } from './errors.ts'
import type { ContentProvenance, ImageCredit } from './generation-contracts.ts'
import {
  ArtifactFileStore,
  isManagedArtifactName,
  isValidImageCredit,
  parseJsonObject,
  parsePreparedRecord,
  validateProvenance,
} from './artifact-fs.ts'

/** Reads published artifact metadata and bytes, and removes managed files that no row references. */
export class ArtifactReadback {
  constructor(
    private readonly db: DatabaseSync,
    private readonly files: ArtifactFileStore,
    private readonly formats: ReadonlyMap<string, FormatAdapter>,
  ) {}

  provenance(row: Record<string, unknown>): readonly ContentProvenance[] {
    const manifest = parseJsonObject(row.manifest)
    return manifest.provenance === undefined ? [] : validateProvenance(manifest.provenance)
  }

  notes(row: Record<string, unknown>): string | undefined {
    const manifest = parseJsonObject(row.manifest)
    const notes = manifest.notes
    if (notes === undefined) return undefined
    if (typeof notes !== 'string' || notes.length > 16000) throw new DeckError('ARTIFACT_CORRUPT')
    return notes
  }

  imageMetadata(row: Record<string, unknown>): {
    imageCredits: ImageCredit[]
    imageOmissions: string[]
  } {
    const manifest = parseJsonObject(row.manifest)
    const rawAssets = manifest.assets
    if (!Array.isArray(rawAssets)) throw new DeckError('ARTIFACT_CORRUPT')

    const assets: readonly unknown[] = rawAssets
    const imageCredits: ImageCredit[] = []
    for (const asset of assets) {
      if (!isRecord(asset) || asset.credit === undefined) continue
      if (!isValidImageCredit(asset.credit)) throw new DeckError('ARTIFACT_CORRUPT')
      imageCredits.push(asset.credit)
    }

    return { imageCredits, imageOmissions: this.imageOmissions(manifest.imageOmissions) }
  }

  private imageOmissions(value: unknown): string[] {
    if (value === undefined) return []
    if (!Array.isArray(value)) throw new DeckError('ARTIFACT_CORRUPT')
    const omissions: readonly unknown[] = value
    const result: string[] = []
    for (const omission of omissions) {
      if (typeof omission !== 'string') throw new DeckError('ARTIFACT_CORRUPT')
      result.push(omission)
    }
    return result
  }

  metadata(row: Record<string, unknown>): { document?: SlideDocument; artifact?: ArtifactDescriptor } {
    const manifest = parseJsonObject(row.manifest)
    const document = manifest.document ? decodeSlideDocument(manifest.document) : undefined
    const artifact = manifest.artifact ? decodeArtifactDescriptor(manifest.artifact) : undefined
    if (
      (document &&
        (artifact?.documentVersion !== document.schemaVersion ||
          (row.slide_id !== undefined && document.slideId !== row.slide_id))) ||
      (artifact?.documentVersion && !document)
    )
      throw new DeckError('ARTIFACT_CORRUPT')
    return { ...(document ? { document } : {}), ...(artifact ? { artifact } : {}) }
  }

  content(row: Record<string, unknown>): string {
    const manifest = parseJsonObject(row.manifest)
    const rawAssets = manifest.assets
    if (!Array.isArray(rawAssets)) throw new DeckError('ARTIFACT_CORRUPT')

    const assets: readonly unknown[] = rawAssets
    const files = assets.map(asset => {
      if (!isRecord(asset) || !validId(asset.assetId) || typeof asset.digest !== 'string')
        throw new DeckError('ARTIFACT_CORRUPT')
      return { assetId: asset.assetId, bytes: this.files.read(`${asset.assetId}.png`, asset.digest, 256 * 1024) }
    })
    const descriptor = this.metadata(row).artifact
    const bytes = this.files.read(
      `${String(row.artifact_id)}.${descriptor?.extension ?? 'html'}`,
      String(row.digest),
      2 * 1024 * 1024,
    )
    const format = this.formats.get(descriptor?.format ?? 'html')
    if (!format) throw new DeckError('FORMAT_UNAVAILABLE')

    const preview = format.read(
      bytes,
      files.map(a => ({ ...a, byteSize: a.bytes.length })),
    )
    if (typeof preview !== 'string') throw new DeckError('ARTIFACT_PREVIEW_UNAVAILABLE')

    return preview
  }

  native(row: Record<string, unknown>): {
    bytes: Uint8Array
    descriptor: ArtifactDescriptor
    document?: SlideDocument
  } {
    const metadata = this.metadata(row)
    const descriptor = metadata.artifact ?? this.legacyDescriptor(row)
    return {
      bytes: this.files.read(`${String(row.artifact_id)}.${descriptor.extension}`, String(row.digest), 2 * 1024 * 1024),
      descriptor,
      ...(metadata.document ? { document: metadata.document } : {}),
    }
  }

  private legacyDescriptor(row: Record<string, unknown>): ArtifactDescriptor {
    const manifest = parseJsonObject(row.manifest)
    const design = manifest.design
    if (!isRecord(design) || !isRecord(design.template)) throw new DeckError('ARTIFACT_CORRUPT')
    return decodeArtifactDescriptor({
      format: 'html',
      mediaType: 'text/html',
      extension: 'html',
      policyVersion: 'b04-artifact-v1',
      template: design.template,
    })
  }

  recover(): void {
    const root = this.files.root
    if (!root) return

    const keep = new Set<string>()

    for (const row of this.db.prepare('SELECT payload FROM prepared_images').all()) {
      const record = parsePreparedRecord(row.payload)
      if (record.asset) keep.add(`${record.asset.assetId}.png`)
    }

    for (const row of this.db.prepare('SELECT artifact_id,manifest FROM artifact_revisions').all()) {
      keep.add(`${String(row.artifact_id)}.${this.metadata(row).artifact?.extension ?? 'html'}`)
      const manifest = parseJsonObject(row.manifest)
      const rawAssets = manifest.assets
      if (!Array.isArray(rawAssets)) throw new DeckError('ARTIFACT_CORRUPT')
      const assets: readonly unknown[] = rawAssets
      for (const asset of assets) {
        if (!isRecord(asset) || typeof asset.assetId !== 'string') throw new DeckError('ARTIFACT_CORRUPT')
        keep.add(`${asset.assetId}.png`)
      }
    }

    for (const name of this.files.listFiles()) {
      if (keep.has(name) || !isManagedArtifactName(name)) continue
      const path = this.files.path(name)
      if (!lstatSync(path).isSymbolicLink() && existsSync(path)) unlinkSync(path)
    }
  }
}
