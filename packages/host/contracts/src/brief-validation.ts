import { z } from 'zod'
import type { BriefDraft } from './brief.ts'

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

const text = z
  .string()
  .min(1)
  .refine(s => !!s.trim() && s.isWellFormed())
const texts = z.array(text)
const positive = z.number().positive()
const integer = z.number().int().positive()
const reference = z.strictObject({ id: text, version: integer })
const source = z.strictObject({
  sourceId: z.string().regex(/^src-[a-f0-9-]{36}$/),
  version: integer,
  kind: z.enum(['attachment', 'project-file', 'approved-file', 'research']),
})
const sources = z.strictObject({
  material: z.boolean(),
  modelKnowledge: z.boolean(),
  publicResearch: z.boolean(),
  refs: z.array(source),
})
const images = z.strictObject({
  mode: z.enum(['none', 'attachments', 'public-research', 'unavailable']),
  provider: z.enum(['tavily', 'commons']).optional(),
  attachmentIds: z.array(z.string().regex(/^att-[a-f0-9-]{36}$/)),
  unmetRequirements: texts,
})
const answers = z.array(z.strictObject({ topic: z.enum(briefTopics), value: text }))
const color = z.string().regex(/^#[a-fA-F0-9]{6}$/)
const overrides = z
  .strictObject({
    'color.background': color,
    'color.surface': color,
    'color.text': color,
    'color.muted': color,
    'color.accent': color,
    'color.onAccent': color,
    'color.border': color,
    'font.heading': text,
    'font.body': text,
    'type.display': positive,
    'type.heading': positive,
    'type.body': positive,
    'type.caption': positive,
    'space.unit': positive,
    'type.lineHeight': positive,
  })
  .partial()
const shape = z.strictObject({
  topic: text.optional(),
  audience: text.optional(),
  durationMinutes: positive.optional(),
  purpose: text.optional(),
  language: text.optional(),
  requestedFormat: text.optional(),
  presenterNotes: z.boolean().optional(),
  generationFormat: z.literal('html').optional(),
  template: reference.optional(),
  designSystem: reference.optional(),
  themeOverrides: overrides.optional(),
  proposedSlideCount: integer.optional(),
  requirements: texts,
  answers,
  assumptions: texts,
  sources,
  images,
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
