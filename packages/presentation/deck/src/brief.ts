import { z } from 'zod'
import type { ThemeValues } from '@deckagent/design'
import { DeckError, isRecord } from './errors.ts'
import type { BriefDraft } from './brief-contracts.ts'
import type { ValidationIssue } from '@deckagent/presentation-document'

export type { BriefDraft, BriefSourceRef, InterviewTopic } from './brief-contracts.ts'

export const briefContractVersion = 'brief-v1'

export const briefTopics = [
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
  .refine(s => !!s.trim() && s.isWellFormed(), 'Use nonempty, well-formed text.')

const texts = z.array(text)
const positive = z.number().positive()
const integer = z.number().int().positive()
const reference = z.strictObject({ id: text, version: integer })

const source = z.strictObject({
  sourceId: z.string().regex(/^src-[a-f0-9-]{36}$/),
  version: integer,
  kind: z.enum(['attachment', 'project-file', 'approved-file', 'research']),
})

const sources = z
  .strictObject({
    material: z.boolean(),
    modelKnowledge: z.boolean(),
    publicResearch: z.boolean(),
    refs: z.array(source),
  })
  .describe(
    'All flags are explicit Host-admitted choices. References never grant permission. Do not invent source IDs.',
  )

const images = z
  .strictObject({
    mode: z.enum(['none', 'attachments', 'public-research', 'unavailable']),
    provider: z.enum(['tavily', 'commons']).optional(),
    attachmentIds: z.array(z.string().regex(/^att-[a-f0-9-]{36}$/)),
    unmetRequirements: texts,
  })
  .describe(
    'Only attachments mode has attachmentIds, and requires material access. Unavailable mode retains a nonempty unmetRequirements list.',
  )

const answers = z
  .array(z.strictObject({ topic: z.enum(briefTopics), value: text }))
  .describe('One answer per topic. Do not invent missing answers; Interview supplies questions or explicit skip.')

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

const shape = z
  .strictObject({
    topic: text.optional(),
    audience: text.optional(),
    durationMinutes: positive.optional(),
    purpose: text.optional(),
    language: text.optional(),
    requestedFormat: text
      .optional()
      .describe(
        'Use canonical html when generationFormat is html. Preserve an unsupported request without selecting a generationFormat.',
      ),
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
  .describe(
    'Complete Brief object. All declared optional fields are omitted when unknown, never null. Do not fill missing answers or change source flags, template or theme to repair a schema error. Answers and source references are unique. The Host checks catalog availability separately.',
  )

function immutable<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) immutable(child)
    Object.freeze(value)
  }
  return value
}

/** The same structural schema used by the Host decoder is supplied to model tools. */
export const briefJsonSchema = immutable(z.toJSONSchema(shape, { io: 'input', target: 'draft-07' }))

const fieldPath = (parts: readonly PropertyKey[]) =>
  parts
    .map((p, i) => {
      if (typeof p === 'number') return `[${p}]`
      const key = String(p).slice(0, 80)
      return /^[\w-]+$/.test(key) ? `${i ? '.' : ''}${key}` : `[${JSON.stringify(key)}]`
    })
    .join('') || 'brief'

function collectCrossFieldIssues(value: Record<string, unknown>, add: (path: string, message: string) => void): void {
  if (
    value.generationFormat === 'html' &&
    typeof value.requestedFormat === 'string' &&
    value.requestedFormat !== 'html'
  )
    add(
      'requestedFormat',
      'With generationFormat html, use the canonical requestedFormat ID html. Preserve unsupported requests without generationFormat.',
    )
  const a = answers.safeParse(value.answers),
    s = sources.safeParse(value.sources),
    im = images.safeParse(value.images)
  if (a.success && new Set(a.data.map(v => v.topic)).size !== a.data.length)
    add('answers', 'Each Interview topic appears at most once.')
  if (s.success) {
    if (new Set(s.data.refs.map(r => `${r.sourceId}:${r.version}:${r.kind}`)).size !== s.data.refs.length)
      add('sources.refs', 'Each source identity, version and kind appears at most once.')
    s.data.refs.forEach((r, i) => {
      if (r.kind === 'research' ? !s.data.material && !s.data.publicResearch : !s.data.material)
        add(
          `sources.refs[${i}]`,
          'Reference only material or research allowed by the explicit source flags; a reference does not enable a flag.',
        )
    })
  }
  if (im.success) {
    if (new Set(im.data.attachmentIds).size !== im.data.attachmentIds.length)
      add('images.attachmentIds', 'Attachment IDs must be unique.')
    if (im.data.mode !== 'attachments' && im.data.attachmentIds.length)
      add('images.attachmentIds', 'Only attachments mode has attachment IDs.')
    if (im.data.mode === 'attachments' && s.success && !s.data.material)
      add(
        'images.mode',
        'Attachments mode requires the Host-admitted material choice; do not enable it to repair the payload.',
      )
    if (im.data.mode === 'unavailable' && !im.data.unmetRequirements.length)
      add('images.unmetRequirements', 'Record the unmet image requirement for unavailable mode.')
  }
}

function normalizeBriefDraft(data: z.infer<typeof shape>): BriefDraft {
  const theme: Partial<ThemeValues> = {}
  if (data.themeOverrides)
    for (const [key, v] of Object.entries(data.themeOverrides)) if (v !== undefined) Object.assign(theme, { [key]: v })
  return {
    ...(data.topic !== undefined ? { topic: data.topic } : {}),
    ...(data.audience !== undefined ? { audience: data.audience } : {}),
    ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
    ...(data.purpose !== undefined ? { purpose: data.purpose } : {}),
    ...(data.language !== undefined ? { language: data.language } : {}),
    ...(data.requestedFormat !== undefined ? { requestedFormat: data.requestedFormat } : {}),
    ...(data.presenterNotes !== undefined ? { presenterNotes: data.presenterNotes } : {}),
    ...(data.generationFormat !== undefined ? { generationFormat: data.generationFormat } : {}),
    ...(data.template !== undefined ? { template: data.template } : {}),
    ...(data.designSystem !== undefined ? { designSystem: data.designSystem } : {}),
    ...(data.themeOverrides !== undefined ? { themeOverrides: theme } : {}),
    ...(data.proposedSlideCount !== undefined ? { proposedSlideCount: data.proposedSlideCount } : {}),
    requirements: data.requirements,
    answers: data.answers,
    assumptions: data.assumptions,
    sources: data.sources,
    images: {
      mode: data.images.mode,
      attachmentIds: data.images.attachmentIds,
      unmetRequirements: data.images.unmetRequirements,
      ...(data.images.provider === undefined ? {} : { provider: data.images.provider }),
    },
  }
}

/** Pure structural decoding. No defaults, coercion, catalog lookup, storage or source grants. */
export function decodeBriefDraft(value: unknown): BriefDraft {
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).length > 128 * 1024) throw new Error('size')
  } catch {
    throw new DeckError('BRIEF_INVALID', [
      {
        code: 'BRIEF_INVALID',
        path: 'brief',
        message: 'Brief must be JSON within 128 KiB.',
        expected: 'A serializable Brief object within 128 KiB.',
      },
    ])
  }
  const parsed = shape.safeParse(value)
  const issues: ValidationIssue[] = []
  const add = (path: string, message: string) =>
    issues.push({ code: 'BRIEF_INVALID', path, message, expected: message })
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      if (issue.code === 'unrecognized_keys')
        for (const key of issue.keys)
          add(
            fieldPath([...issue.path, key]),
            'Remove the unknown field; use only fields in the supplied Brief schema.',
          )
      else add(fieldPath(issue.path), `${issue.message} Optional fields must be omitted when unknown, not set to null.`)
    }
  if (isRecord(value)) collectCrossFieldIssues(value, add)
  if (issues.length || !parsed.success)
    throw new DeckError(
      'BRIEF_INVALID',
      issues.length > 64
        ? [
            ...issues.slice(0, 64),
            {
              code: 'BRIEF_INVALID',
              path: 'brief',
              message: 'More errors remain. Correct the listed fields and validate again.',
              expected: 'A Brief matching the supplied schema.',
            },
          ]
        : issues,
    )
  return normalizeBriefDraft(parsed.data)
}
