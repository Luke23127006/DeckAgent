import { z } from 'zod'
import type { BriefDraft, BriefView, DesignSnapshot } from './brief.ts'
import {
  attachmentId,
  briefSourceSchema,
  invalidResponse,
  isoTimestamp,
  nonEmptyText,
  nonNegativeInt,
  positiveInt,
  sha256Hex,
} from './validation-primitives.ts'

const briefTopics = [
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
] as const

const texts = z.array(nonEmptyText)
const positive = z.number().finite().positive()
const reference = z.strictObject({ id: nonEmptyText, version: positiveInt })

const sources = z.strictObject({
  material: z.boolean(),
  modelKnowledge: z.boolean(),
  publicResearch: z.boolean(),
  refs: z.array(briefSourceSchema),
})

const images = z.strictObject({
  mode: z.enum(['none', 'attachments', 'public-research', 'unavailable']),
  provider: z.enum(['tavily', 'commons']).optional(),
  attachmentIds: z.array(attachmentId),
  unmetRequirements: texts,
})

const answers = z.array(z.strictObject({ topic: z.enum(briefTopics), value: nonEmptyText }))
const color = z.string().regex(/^#[a-fA-F0-9]{6}$/)

const themeFields = {
  'color.background': color,
  'color.surface': color,
  'color.text': color,
  'color.muted': color,
  'color.accent': color,
  'color.onAccent': color,
  'color.border': color,
  'font.heading': nonEmptyText,
  'font.body': nonEmptyText,
  'type.display': positive,
  'type.heading': positive,
  'type.body': positive,
  'type.caption': positive,
  'space.unit': positive,
  'type.lineHeight': positive,
}

const overrides = z.strictObject(themeFields).partial()
const themeSchema = z.strictObject(themeFields)

const shape = z.strictObject({
  topic: nonEmptyText.optional(),
  audience: nonEmptyText.optional(),
  durationMinutes: positive.optional(),
  purpose: nonEmptyText.optional(),
  language: nonEmptyText.optional(),
  requestedFormat: nonEmptyText.optional(),
  presenterNotes: z.boolean().optional(),
  generationFormat: z.literal('html').optional(),
  template: reference.optional(),
  designSystem: reference.optional(),
  themeOverrides: overrides.optional(),
  proposedSlideCount: positiveInt.optional(),
  requirements: texts,
  answers,
  assumptions: texts,
  sources,
  images,
})

const designSnapshotSchema = z.strictObject({
  format: z.literal('html'),
  designSystem: reference,
  template: reference,
  theme: themeSchema,
  rules: texts,
  brandAssets: z.array(z.string()).length(0),
  viewport: z.strictObject({ width: z.literal(1280), height: z.literal(720) }),
  fingerprint: sha256Hex,
})

const briefId = z.string().regex(/^brief-[a-f0-9-]{36}$/)

const briefRecordSchema = z.strictObject({
  sessionId: nonEmptyText,
  briefId,
  version: positiveInt,
  createdAt: isoTimestamp,
  draft: z.custom<BriefDraft>(isWireBriefDraft),
  design: z.custom<DesignSnapshot>(isDesignSnapshot).nullable(),
})

const sourceStateSchema = z.strictObject({
  source: briefSourceSchema,
  status: z.enum(['recorded', 'unavailable']),
})

const briefViewSchema = z.strictObject({
  sessionId: nonEmptyText,
  version: nonNegativeInt,
  current: briefRecordSchema.nullable(),
  locked: z.boolean(),
  sourceStates: z.array(sourceStateSchema),
})

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Pure structural wire check matching the Brief schema without domain error dependencies. */
export function isWireBriefDraft(value: unknown): value is BriefDraft {
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).length > 128 * 1024) return false
  } catch {
    return false
  }
  const parsed = shape.safeParse(value)
  if (!parsed.success || !record(value)) return false
  if (
    value.generationFormat === 'html' &&
    typeof value.requestedFormat === 'string' &&
    value.requestedFormat !== 'html'
  )
    return false

  const a = parsed.data.answers
  const s = parsed.data.sources
  const im = parsed.data.images
  if (new Set(a.map(v => v.topic)).size !== a.length) return false
  if (new Set(s.refs.map(r => `${r.sourceId}:${r.version}:${r.kind}`)).size !== s.refs.length) return false
  if (s.refs.some(r => (r.kind === 'research' ? !s.material && !s.publicResearch : !s.material))) return false
  if (new Set(im.attachmentIds).size !== im.attachmentIds.length) return false
  if (im.mode !== 'attachments' && im.attachmentIds.length) return false
  if (im.mode === 'attachments' && !s.material) return false
  if (im.mode === 'unavailable' && !im.unmetRequirements.length) return false

  return true
}

export function isDesignSnapshot(value: unknown): value is DesignSnapshot {
  return designSnapshotSchema.safeParse(value).success
}

/** Browser-safe structural decoding; selection policy, source access and snapshot integrity belong to Host. */
export function decodeBriefView(value: unknown, sessionId: string): BriefView {
  const parsed = briefViewSchema.safeParse(value)
  if (!parsed.success || parsed.data.sessionId !== sessionId) return invalidResponse()

  const data = parsed.data

  const current = data.current
  if (current === null) {
    if (data.version !== 0 || data.sourceStates.length > 0) return invalidResponse()
    return { sessionId, version: 0, current: null, locked: data.locked, sourceStates: [] }
  }

  if (
    current.sessionId !== sessionId ||
    current.version !== data.version ||
    (current.draft.generationFormat === 'html') !== (current.design !== null)
  ) {
    return invalidResponse()
  }

  const refs = current.draft.sources.refs
  if (data.sourceStates.length !== refs.length) return invalidResponse()

  const matchesRefs = data.sourceStates.every((state, index) => {
    const ref = refs[index]
    return (
      ref !== undefined &&
      state.source.sourceId === ref.sourceId &&
      state.source.version === ref.version &&
      state.source.kind === ref.kind
    )
  })
  if (!matchesRefs) return invalidResponse()

  return {
    sessionId,
    version: data.version,
    locked: data.locked,
    current,
    sourceStates: data.sourceStates,
  }
}
