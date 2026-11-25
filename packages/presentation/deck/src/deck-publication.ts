import { createHash } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { FormatError } from '@deckagent/presentation-document'
import type { SlideDocument, ValidationIssue } from '@deckagent/presentation-document'
import type { ArtifactStorage, PreparedArtifact } from './artifact-store.ts'
import type { DeckSnapshot, PublishedSlide, PublishSlide } from './deck-contracts.ts'
import { DeckError, deckFailureMessage, isRecord, validId } from './errors.ts'
import type {
  ArtifactAsset,
  ArtifactPublication,
  ContentProvenance,
  DeckOptions,
  GenerationCapability,
  GenerationGrant,
  GenerationSnapshot,
  StageChunk,
  StageStatus,
} from './generation-contracts.ts'
import type { OutlineProposal } from './outline-contracts.ts'

/** Internal context that DeckStore exposes to publication and generation-capability helpers. */
export interface PublicationHost {
  readonly db: DatabaseSync
  readonly artifacts: ArtifactStorage
  readonly options: DeckOptions
  readonly publicationsInFlight: Map<string, Promise<PublishedSlide>>
  granted(grant: GenerationGrant): { generation: GenerationSnapshot; outline: OutlineProposal }
  snapshot(sessionId: string): DeckSnapshot
  hasGeneration(sessionId: string): boolean
  access<T>(operation: () => T): T
  asyncAccess<T>(operation: () => Promise<T>): Promise<T>
  transaction<T>(operation: () => T): T
  notify(sessionId: string, version: number): void
}

function readSavedPublicationReceipt(
  row: Record<string, unknown>,
  expectedFingerprint: string,
  sessionId: string,
  slideId: string,
  expectedRevision: number,
  strictLegacyFields: boolean,
): PublishedSlide {
  if (row.fingerprint !== expectedFingerprint) throw new DeckError('DECK_PUBLICATION_CONFLICT')
  const saved: unknown = JSON.parse(String(row.receipt))
  if (!isRecord(saved) || !Number.isSafeInteger(saved.version) || Number(saved.version) < 2)
    throw new DeckError('DECK_CORRUPT')
  if (
    strictLegacyFields &&
    (saved.sessionId !== sessionId ||
      saved.deckId !== sessionId ||
      saved.slideId !== slideId ||
      saved.revision !== expectedRevision + 1)
  )
    throw new DeckError('DECK_CORRUPT')
  return { sessionId, deckId: sessionId, slideId, revision: expectedRevision + 1, version: Number(saved.version) }
}

function validateArtifactPublicationInput(input: ArtifactPublication): void {
  if (
    !input ||
    Object.keys(input).some(key => !['stageId', 'slideId', 'expectedRevision', 'publicationId'].includes(key)) ||
    !validId(input.stageId) ||
    !validId(input.slideId) ||
    !validId(input.publicationId) ||
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision < 0
  )
    throw new DeckError('DECK_INVALID_PUBLICATION')
}

function commitPreparedArtifact(
  host: PublicationHost,
  grant: GenerationGrant,
  input: ArtifactPublication,
  artifact: PreparedArtifact,
  signal: AbortSignal,
): PublishedSlide {
  return host.access(() =>
    host.transaction(() => {
      host.granted(grant)
      signal.throwIfAborted()
      const concurrent = host.db
        .prepare('SELECT fingerprint,receipt FROM publications WHERE session_id=? AND publication_id=?')
        .get(grant.sessionId, input.publicationId)
      if (concurrent)
        return readSavedPublicationReceipt(
          concurrent,
          artifact.fingerprint,
          grant.sessionId,
          input.slideId,
          input.expectedRevision,
          false,
        )
      const row = host.db
        .prepare('SELECT revision FROM slides WHERE session_id=? AND slide_id=?')
        .get(grant.sessionId, input.slideId)
      if (!row || row.revision !== input.expectedRevision) throw new DeckError('DECK_CONFLICT')
      const deck = host.db.prepare('SELECT version FROM decks WHERE session_id=?').get(grant.sessionId)
      if (!deck) throw new DeckError('DECK_NOT_CONFIRMED')
      const version = Number(deck.version) + 1
      const revision = input.expectedRevision + 1
      const result = { sessionId: grant.sessionId, deckId: grant.sessionId, slideId: input.slideId, revision, version }
      host.db.prepare('INSERT INTO revisions VALUES(?,?,?,?)').run(grant.sessionId, input.slideId, revision, '')
      host.db
        .prepare('INSERT INTO artifact_revisions VALUES(?,?,?,?,?,?)')
        .run(grant.sessionId, input.slideId, revision, artifact.artifactId, artifact.digest, artifact.manifest)
      host.db
        .prepare('UPDATE slides SET revision=? WHERE session_id=? AND slide_id=?')
        .run(revision, grant.sessionId, input.slideId)
      host.db.prepare('UPDATE decks SET version=? WHERE session_id=?').run(version, grant.sessionId)
      host.db
        .prepare('INSERT INTO publications VALUES(?,?,?,?)')
        .run(grant.sessionId, input.publicationId, artifact.fingerprint, JSON.stringify(result))
      return result
    }),
  )
}

async function publishArtifactFromStage(
  host: PublicationHost,
  grant: GenerationGrant,
  input: ArtifactPublication,
  signal: AbortSignal,
): Promise<PublishedSlide> {
  const { generation, outline } = host.access(() => host.granted(grant))
  signal.throwIfAborted()
  validateArtifactPublicationInput(input)
  const slide = outline.slides.find(s => s.slideId === input.slideId)
  if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
  const prior = host.access(() =>
    host.db
      .prepare('SELECT fingerprint,receipt FROM publications WHERE session_id=? AND publication_id=?')
      .get(grant.sessionId, input.publicationId),
  )
  if (prior)
    return readSavedPublicationReceipt(
      prior,
      host.artifacts.receiptFingerprint(grant, input, generation, slide),
      grant.sessionId,
      input.slideId,
      input.expectedRevision,
      false,
    )
  const artifact = await host.artifacts.prepare(
    grant,
    input,
    slide,
    generation,
    () => host.access(() => host.granted(grant)),
    signal,
  )
  const receipt = commitPreparedArtifact(host, grant, input, artifact, signal)
  host.artifacts.published(grant, input.stageId)
  host.notify(grant.sessionId, receipt.version)
  return receipt
}

export async function publishArtifact(
  host: PublicationHost,
  grant: GenerationGrant,
  input: ArtifactPublication,
  signal: AbortSignal = new AbortController().signal,
): Promise<PublishedSlide> {
  return host.asyncAccess(() => {
    host.granted(grant)
    const key = JSON.stringify([grant.intentId, grant.requestId, input])
    const old = host.publicationsInFlight.get(key)
    if (old) return old
    const work = (async () => {
      try {
        return await publishArtifactFromStage(host, grant, input, signal)
      } finally {
        host.publicationsInFlight.delete(key)
      }
    })()
    host.publicationsInFlight.set(key, work)
    return work
  })
}

function validateLegacyPublication(host: PublicationHost, sessionId: string, input: PublishSlide): void {
  if (
    !input ||
    !validId(input.slideId) ||
    !validId(input.outlineId) ||
    !validId(input.publicationId) ||
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision < 0
  )
    throw new DeckError('DECK_INVALID_PUBLICATION')
  if (!host.options.legacyHtmlPolicy) throw new DeckError('DECK_CONFIG')
  try {
    host.options.legacyHtmlPolicy(input.html)
  } catch (error) {
    if (error instanceof FormatError && error.code === 'DECK_UNSAFE_HTML') throw new DeckError('DECK_UNSAFE_HTML')
    throw error
  }
  if (host.hasGeneration(sessionId)) throw new DeckError('GENERATION_GRANT_REQUIRED')
}

export function publishLegacySlide(
  host: PublicationHost,
  sessionId: string,
  input: PublishSlide,
  signal?: AbortSignal,
): PublishedSlide {
  signal?.throwIfAborted()
  return host.access(() => {
    if (!validId(sessionId)) throw new DeckError('DECK_INVALID_ID')
    validateLegacyPublication(host, sessionId, input)
    const fingerprint = createHash('sha256')
      .update(JSON.stringify([input.outlineId, input.slideId, input.expectedRevision, input.html]))
      .digest('hex')
    let fresh = false
    const receipt = host.transaction(() => {
      const old = host.db
        .prepare('SELECT fingerprint,receipt FROM publications WHERE session_id=? AND publication_id=?')
        .get(sessionId, input.publicationId)
      if (old)
        return readSavedPublicationReceipt(old, fingerprint, sessionId, input.slideId, input.expectedRevision, true)
      const deck = host.db.prepare('SELECT outline_id,version FROM decks WHERE session_id=?').get(sessionId)
      if (!deck) throw new DeckError('DECK_NOT_CONFIRMED')
      if (deck.outline_id !== input.outlineId) throw new DeckError('DECK_OUTLINE_MISMATCH')
      const slide = host.db
        .prepare('SELECT revision FROM slides WHERE session_id=? AND slide_id=?')
        .get(sessionId, input.slideId)
      if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
      if (Number(slide.revision) !== input.expectedRevision) throw new DeckError('DECK_CONFLICT')
      const revision = input.expectedRevision + 1
      const version = Number(deck.version) + 1
      const result = { sessionId, deckId: sessionId, slideId: input.slideId, revision, version }
      host.db.prepare('INSERT INTO revisions VALUES(?,?,?,?)').run(sessionId, input.slideId, revision, input.html)
      host.db
        .prepare('UPDATE slides SET revision=? WHERE session_id=? AND slide_id=?')
        .run(revision, sessionId, input.slideId)
      host.db.prepare('UPDATE decks SET version=? WHERE session_id=?').run(version, sessionId)
      host.db
        .prepare('INSERT INTO publications VALUES(?,?,?,?)')
        .run(sessionId, input.publicationId, fingerprint, JSON.stringify(result))
      signal?.throwIfAborted()
      fresh = true
      return result
    })
    if (fresh) host.notify(sessionId, receipt.version)
    return receipt
  })
}

function stagingMethods(host: PublicationHost, grant: GenerationGrant, check: () => void) {
  return {
    document: (stageId: string, document: SlideDocument): void => {
      check()
      host.access(() => host.artifacts.setDocument(grant, stageId, document))
    },
    draft: (stageId: string): StageStatus => {
      check()
      return host.access(() => host.artifacts.draft(grant, stageId))
    },
    append: (stageId: string, chunk: StageChunk): StageStatus => {
      check()
      return host.access(() => {
        host.granted(grant)
        return host.artifacts.append(grant, stageId, chunk)
      })
    },
    provenance: (stageId: string, records: readonly ContentProvenance[], notes?: string): void => {
      check()
      host.artifacts.setProvenance(grant, stageId, records, notes)
    },
    discard: (stageId: string): void => {
      check()
      host.access(() => host.artifacts.discard(grant, stageId))
    },
  }
}

function assetMethods(host: PublicationHost, grant: GenerationGrant, check: () => void, signal: AbortSignal) {
  return {
    image: async (stageId: string, slideId: string, attachmentId: string): Promise<ArtifactAsset> => {
      check()
      const { outline } = host.access(() => host.granted(grant))
      const slide = outline.slides.find(s => s.slideId === slideId)
      if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
      return host.asyncAccess(() => host.artifacts.asset(grant, stageId, attachmentId, slide, check, signal))
    },
    researchImage: (stageId: string, slideId: string, query: string): Promise<ArtifactAsset> =>
      host.asyncAccess(() => {
        check()
        const { generation, outline } = host.granted(grant)
        if (outline.brief?.draft.images.mode !== 'public-research') throw new DeckError('IMAGE_CHOICE_REQUIRED')
        const slide = outline.slides.find(s => s.slideId === slideId)
        if (!slide || generation.state !== 'generating') throw new DeckError('DECK_SLIDE_NOT_FOUND')
        const limit = Math.max(
          1,
          outline.slides.flatMap(s => s.blocks ?? []).filter(b => b.kind === 'web-image').length * 2,
        )
        return host.artifacts.researchImage(grant, stageId, slide, query, limit, check, signal)
      }),
  }
}

function publicationMethods(host: PublicationHost, grant: GenerationGrant, check: () => void, signal: AbortSignal) {
  return {
    publish: async (input: ArtifactPublication): Promise<PublishedSlide> => {
      check()
      return publishArtifact(host, grant, input, signal)
    },
    validate: async (input: ArtifactPublication): Promise<readonly ValidationIssue[]> => {
      check()
      try {
        const { generation, outline } = host.access(() => host.granted(grant))
        const slide = outline.slides.find(s => s.slideId === input.slideId)
        if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
        const artifact = await host.artifacts.prepare(grant, input, slide, generation, check, signal, true)
        host.artifacts.removeValidationArtifact(artifact)
        return []
      } catch (error) {
        signal.throwIfAborted()
        if (error instanceof FormatError)
          return error.issues.length
            ? error.issues
            : [{ code: error.code, path: 'draft', message: deckFailureMessage(error.code) ?? error.code }]
        throw error
      }
    },
  }
}

function planningMethods(host: PublicationHost, grant: GenerationGrant, check: () => void) {
  return {
    plan: () => {
      check()
      return { ...host.access(() => host.granted(grant)), slides: host.snapshot(grant.sessionId).slides }
    },
    begin: (slideId: string, layoutId: string): StageStatus => {
      check()
      const { generation, outline } = host.access(() => host.granted(grant))
      if (
        generation.activeRequestId &&
        host.snapshot(grant.sessionId).slides.some(s => s.slideId === slideId && s.revision > 0)
      )
        throw new DeckError('SLIDE_REVISION_CONFLICT')
      const slide = outline.slides.find(s => s.slideId === slideId)
      if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
      return host.access(() => host.artifacts.begin(grant, slide, layoutId, generation))
    },
  }
}

export function createGenerationCapability(
  host: PublicationHost,
  grant: GenerationGrant,
  signal: AbortSignal,
): GenerationCapability {
  host.access(() => host.granted(grant))
  const check = (): void => {
    signal.throwIfAborted()
    host.access(() => host.granted(grant))
  }
  const staging = stagingMethods(host, grant, check)
  const assets = assetMethods(host, grant, check, signal)
  const publication = publicationMethods(host, grant, check, signal)
  const planning = planningMethods(host, grant, check)
  return Object.freeze({
    draft: staging.draft,
    document: staging.document,
    provenance: staging.provenance,
    discard: staging.discard,
    append: staging.append,
    image: assets.image,
    researchImage: assets.researchImage,
    validate: publication.validate,
    publish: publication.publish,
    plan: planning.plan,
    begin: planning.begin,
  })
}
