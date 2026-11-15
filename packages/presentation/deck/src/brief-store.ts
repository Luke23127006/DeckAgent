import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { decodeDesignSnapshot, resolveDesign } from '@deckagent/design'
import { DeckError, validId } from './contracts.ts'
import type { BriefDraft, BriefRecord, BriefSnapshot, BriefSourceRef, InterviewTopic } from './contracts.ts'

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.isWellFormed()
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text)
const only = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).every(k => keys.includes(k))
const topics: readonly InterviewTopic[] = [
  'topic',
  'audience',
  'duration',
  'purpose',
  'sources',
  'language',
  'images',
  'format',
  'template',
  'design-system',
]

/** Strict JSON contract; sources are references, never grants. App composition verifies their owning Chat. */
export function validateBriefDraft(value: unknown): BriefDraft {
  const invalid = (): never => {
    throw new DeckError('BRIEF_INVALID')
  }
  if (
    !record(value) ||
    !only(value, [
      'topic',
      'audience',
      'durationMinutes',
      'purpose',
      'language',
      'requirements',
      'answers',
      'assumptions',
      'sources',
      'images',
      'proposedSlideCount',
      'requestedFormat',
      'generationFormat',
      'template',
      'designSystem',
      'themeOverrides',
    ])
  )
    return invalid()
  try {
    if (Buffer.byteLength(JSON.stringify(value)) > 128 * 1024) return invalid()
  } catch {
    return invalid()
  }
  for (const key of ['topic', 'audience', 'purpose', 'language', 'requestedFormat'])
    if (value[key] !== undefined && !text(value[key])) return invalid()
  if (
    value.durationMinutes !== undefined &&
    (typeof value.durationMinutes !== 'number' || !Number.isFinite(value.durationMinutes) || value.durationMinutes <= 0)
  )
    return invalid()
  if (
    value.proposedSlideCount !== undefined &&
    (!Number.isSafeInteger(value.proposedSlideCount) || Number(value.proposedSlideCount) < 1)
  )
    return invalid()
  if (
    !strings(value.requirements) ||
    !strings(value.assumptions) ||
    !Array.isArray(value.answers) ||
    value.answers.some(
      a => !record(a) || !only(a, ['topic', 'value']) || !topics.some(t => t === a.topic) || !text(a.value),
    )
  )
    return invalid()
  if (new Set(value.answers.map(a => a.topic)).size !== value.answers.length) return invalid()
  const sources = value.sources,
    images = value.images
  if (
    !record(sources) ||
    !only(sources, ['material', 'modelKnowledge', 'publicResearch', 'refs']) ||
    ['material', 'modelKnowledge', 'publicResearch'].some(k => typeof sources[k] !== 'boolean') ||
    !Array.isArray(sources.refs)
  )
    return invalid()
  const sourceKinds: readonly BriefSourceRef['kind'][] = ['attachment', 'project-file', 'approved-file', 'research']
  for (const ref of sources.refs)
    if (
      !record(ref) ||
      !only(ref, ['sourceId', 'version', 'kind']) ||
      typeof ref.sourceId !== 'string' ||
      !/^src-[a-f0-9-]{36}$/.test(ref.sourceId) ||
      !Number.isSafeInteger(ref.version) ||
      Number(ref.version) < 1 ||
      !sourceKinds.some(k => k === ref.kind) ||
      (ref.kind !== 'research' && !sources.material) ||
      (ref.kind === 'research' && !sources.material && !sources.publicResearch)
    )
      return invalid()
  if (new Set(sources.refs.map(ref => `${ref.sourceId}:${ref.version}:${ref.kind}`)).size !== sources.refs.length)
    return invalid()
  const imageModes: readonly BriefDraft['images']['mode'][] = ['none', 'attachments', 'unavailable']
  if (
    !record(images) ||
    !only(images, ['mode', 'attachmentIds', 'unmetRequirements']) ||
    !imageModes.some(m => m === images.mode) ||
    !Array.isArray(images.attachmentIds) ||
    images.attachmentIds.some(id => typeof id !== 'string' || !/^att-[a-f0-9-]{36}$/.test(id)) ||
    new Set(images.attachmentIds).size !== images.attachmentIds.length ||
    !strings(images.unmetRequirements)
  )
    return invalid()
  if (
    (images.mode !== 'attachments' && images.attachmentIds.length > 0) ||
    (images.mode === 'attachments' && !sources.material) ||
    (images.mode === 'unavailable' && !images.unmetRequirements.length)
  )
    return invalid()
  if (value.generationFormat !== undefined && value.generationFormat !== 'html') return invalid()
  if (value.requestedFormat !== undefined && value.requestedFormat !== 'html' && value.generationFormat !== undefined)
    return invalid()
  // Selection is validated even while incomplete; defaults are not silently written into the Brief.
  const visual = resolveDesign({
    ...(value.generationFormat !== undefined ? { format: value.generationFormat } : {}),
    ...(value.template !== undefined ? { template: value.template } : {}),
    ...(value.designSystem !== undefined ? { designSystem: value.designSystem } : {}),
    ...(value.themeOverrides !== undefined ? { overrides: value.themeOverrides } : {}),
  })
  const optionalText = (key: 'topic' | 'audience' | 'purpose' | 'language' | 'requestedFormat') =>
    typeof value[key] === 'string' ? { [key]: value[key] } : {}
  return {
    ...optionalText('topic'),
    ...optionalText('audience'),
    ...optionalText('purpose'),
    ...optionalText('language'),
    ...optionalText('requestedFormat'),
    ...(typeof value.durationMinutes === 'number' ? { durationMinutes: value.durationMinutes } : {}),
    ...(typeof value.proposedSlideCount === 'number' ? { proposedSlideCount: value.proposedSlideCount } : {}),
    ...(value.generationFormat === 'html' ? { generationFormat: 'html' as const } : {}),
    ...(value.template !== undefined ? { template: visual.template } : {}),
    ...(value.designSystem !== undefined ? { designSystem: visual.designSystem } : {}),
    ...(record(value.themeOverrides)
      ? {
          themeOverrides: Object.fromEntries(
            Object.keys(value.themeOverrides).map(k => [k, visual.theme[k as keyof typeof visual.theme]]),
          ),
        }
      : {}),
    requirements: [...value.requirements],
    assumptions: [...value.assumptions],
    answers: value.answers.map(a => ({ topic: topics.find(t => t === a.topic) ?? invalid(), value: String(a.value) })),
    sources: {
      material: sources.material === true,
      modelKnowledge: sources.modelKnowledge === true,
      publicResearch: sources.publicResearch === true,
      refs: sources.refs.map(r => ({
        sourceId: String(r.sourceId),
        version: Number(r.version),
        kind: sourceKinds.find(k => k === r.kind) ?? invalid(),
      })),
    },
    images: {
      mode: imageModes.find(m => m === images.mode) ?? invalid(),
      attachmentIds: images.attachmentIds.map(String),
      unmetRequirements: [...images.unmetRequirements],
    },
  }
}

/** Internal implementation; DeckService owns all transactions. */
export class BriefStorage {
  constructor(private readonly db: DatabaseSync) {}

  snapshot(sessionId: string): BriefSnapshot {
    const row = this.db
      .prepare(
        'SELECT v.* FROM brief_heads h JOIN brief_versions v ON v.brief_id=h.brief_id AND v.version=h.version WHERE h.session_id=?',
      )
      .get(sessionId)
    return {
      sessionId,
      version: row ? Number(row.version) : 0,
      current: row ? this.decode(row) : null,
      locked: !!this.db.prepare('SELECT 1 FROM decks WHERE session_id=?').get(sessionId),
    }
  }

  version(sessionId: string, briefId: string, version: number): BriefRecord {
    const row = this.db
      .prepare('SELECT * FROM brief_versions WHERE session_id=? AND brief_id=? AND version=?')
      .get(sessionId, briefId, version)
    if (!row) throw new DeckError('BRIEF_NOT_FOUND')
    return this.decode(row)
  }

  save(sessionId: string, input: { readonly expectedVersion: number; readonly draft: unknown }): BriefRecord {
    if (!validId(sessionId) || !input || !Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0)
      throw new DeckError('BRIEF_INVALID')
    const previous = this.snapshot(sessionId)
    if (previous.locked) throw new DeckError('BRIEF_LOCKED')
    if (previous.version !== input.expectedVersion) throw new DeckError('BRIEF_STALE')
    const draft = validateBriefDraft(input.draft)
    const briefId = previous.current?.briefId ?? `brief-${randomUUID()}`
    const version = previous.version + 1
    const createdAt = new Date().toISOString()
    const design =
      draft.generationFormat === 'html'
        ? resolveDesign({
            format: 'html',
            ...(draft.template ? { template: draft.template } : {}),
            ...(draft.designSystem ? { designSystem: draft.designSystem } : {}),
            ...(draft.themeOverrides ? { overrides: draft.themeOverrides } : {}),
          })
        : null
    this.db
      .prepare(
        'INSERT INTO brief_heads(session_id,brief_id,version) VALUES(?,?,?) ON CONFLICT(session_id) DO UPDATE SET version=excluded.version',
      )
      .run(sessionId, briefId, version)
    this.db
      .prepare('INSERT INTO brief_versions(brief_id,version,session_id,payload,design,created_at) VALUES(?,?,?,?,?,?)')
      .run(briefId, version, sessionId, JSON.stringify(draft), design ? JSON.stringify(design) : null, createdAt)
    return { sessionId, briefId, version, createdAt, draft, design }
  }

  private decode(row: Record<string, unknown>): BriefRecord {
    try {
      const draft = validateBriefDraft(JSON.parse(String(row.payload)))
      const design = row.design === null ? null : decodeDesignSnapshot(JSON.parse(String(row.design)))
      if ((draft.generationFormat === 'html') !== (design !== null)) throw new DeckError('DECK_CORRUPT')
      return {
        sessionId: String(row.session_id),
        briefId: String(row.brief_id),
        version: Number(row.version),
        createdAt: String(row.created_at),
        draft,
        design,
      }
    } catch {
      throw new DeckError('DECK_CORRUPT')
    }
  }
}
