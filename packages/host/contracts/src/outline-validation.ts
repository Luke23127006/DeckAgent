import { z } from 'zod'
import type { BriefSourceRef } from './brief.ts'
import { decodeBriefView } from './brief-validation.ts'
import type { ContentBlock, OutlineImageReview, OutlineProposal } from './deck.ts'
import {
  attachmentId,
  briefSourceSchema,
  entityId,
  invalidResponse,
  nonEmptyText,
  nonNegativeInt,
  positiveInt,
  sha256Hex,
} from './validation-primitives.ts'

const shortString = z
  .string()
  .max(2048)
  .refine(s => s.isWellFormed())

const httpsUrl = shortString.refine(s => {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' && !u.username && !u.password
  } catch {
    return false
  }
})

const imageCreditSchema = z
  .object({
    url: httpsUrl,
    author: shortString,
    license: z.enum(['public-domain', 'CC0', 'CC BY', 'Pexels', 'unknown']),
    licenseUrl: shortString,
    retrievedAt: shortString,
    unknownLicense: z.boolean(),
    evidence: z.enum(['image-metadata', 'pexels-cdn']).optional(),
    downloadUrl: httpsUrl.optional(),
  })
  .refine(c => c.unknownLicense === (c.license === 'unknown'))

const imageAttemptSchema = z.object({
  candidateId: shortString,
  imageUrl: httpsUrl,
  code: shortString,
  checks: z
    .array(
      z.object({
        sourceUrl: httpsUrl,
        code: shortString,
        httpStatus: z.number().int().min(100).max(599).optional(),
      }),
    )
    .max(3),
})

const imageSelectionSchema = z.object({
  imageUrl: httpsUrl,
  query: shortString,
  description: shortString,
  reason: shortString,
  evidence: z.literal('metadata'),
  policy: z.enum(['web-images-v1', 'web-images-v2']),
  provider: z.enum(['tavily', 'commons']),
})

const imageReviewSchema = z
  .array(
    z.object({
      needId: z.string().regex(/^need-[a-f0-9]{64}$/),
      slideIndex: nonNegativeInt,
      blockIndex: nonNegativeInt,
      required: z.boolean(),
      status: z.enum(['prepared', 'unavailable']),
      digest: sha256Hex.optional(),
      failure: shortString.optional(),
      attempts: z.array(imageAttemptSchema).max(4).optional(),
      credit: imageCreditSchema.optional(),
      selection: imageSelectionSchema.optional(),
    }),
  )
  .max(32)

const imageIntentSchema = z.strictObject({
  subject: nonEmptyText.refine(s => s.length <= 500),
  role: nonEmptyText.refine(s => s.length <= 500),
  mustInclude: z.array(nonEmptyText.refine(s => s.length <= 300)).max(10),
  mustAvoid: z.array(nonEmptyText.refine(s => s.length <= 300)).max(10),
  aspect: z.enum(['landscape', 'portrait', 'square', 'any']),
})

const contentBlockSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('subtitle'), text: nonEmptyText }),
  z.strictObject({ kind: z.literal('lead'), text: nonEmptyText }),
  z.strictObject({ kind: z.literal('text'), text: nonEmptyText }),
  z.strictObject({ kind: z.literal('source-note'), text: nonEmptyText }),
  z.strictObject({ kind: z.literal('bullets'), items: z.array(nonEmptyText).min(1) }),
  z.strictObject({
    kind: z.literal('web-image'),
    query: nonEmptyText.refine(s => s.length <= 500),
    caption: nonEmptyText.optional(),
    required: z.boolean().optional(),
    intent: imageIntentSchema.optional(),
    provider: z.enum(['tavily', 'commons']).optional(),
    replace: z.boolean().optional(),
  }),
  z.strictObject({
    kind: z.literal('image'),
    attachmentId,
    caption: nonEmptyText.optional(),
  }),
  z.strictObject({
    kind: z.literal('columns'),
    columns: z.array(z.strictObject({ bullets: z.array(nonEmptyText).min(1) })).min(1),
  }),
  z.strictObject({
    kind: z.literal('metrics'),
    items: z.array(z.strictObject({ value: nonEmptyText, label: nonEmptyText })).min(1),
  }),
])

const layoutIssueSchema = z.object({
  code: z.literal('DESIGN_LAYOUT_INCOMPATIBLE'),
  slideIndex: nonNegativeInt,
  path: nonEmptyText.refine(s => s.length <= 500),
  message: nonEmptyText.refine(s => s.length <= 1000),
  expected: nonEmptyText.refine(s => s.length <= 1000),
  layoutId: z
    .enum(['cover', 'section', 'title-body', 'two-column', 'key-figures', 'image-text', 'image-pair'])
    .optional(),
  actual: z.number().int().refine(Number.isSafeInteger).optional(),
  limit: nonNegativeInt.optional(),
})

const proposalSlideSchema = z.object({
  slideId: entityId,
  title: nonEmptyText,
  content: nonEmptyText,
  blocks: z.array(z.unknown()),
  sources: z.array(z.unknown()),
})

const proposalHeaderSchema = z.object({
  outlineId: entityId,
  requestId: entityId,
  version: positiveInt,
  responseIndex: nonNegativeInt,
  overview: nonEmptyText,
  status: z.enum(['current', 'superseded', 'confirmed']),
  slides: z.array(z.unknown()).min(1),
  revisionSuggestions: z.array(nonEmptyText),
  brief: z.object({
    version: positiveInt,
    draft: z.object({
      sources: z.object({
        refs: z.array(z.unknown()),
      }),
    }),
  }),
  changes: z.object({
    orderChanged: z.boolean(),
    overviewChanged: z.boolean(),
    suggestionsChanged: z.boolean(),
    briefFields: z.array(nonEmptyText),
    added: z.array(nonEmptyText),
    removed: z.array(nonEmptyText),
    changed: z.array(nonEmptyText),
  }),
  previousOutlineId: entityId.optional(),
  restoredFrom: entityId.optional(),
  layoutIssues: z.unknown().optional(),
  imageReview: z.unknown().optional(),
})

function decodeOutlineSource(value: unknown): BriefSourceRef {
  const parsed = briefSourceSchema.safeParse(value)
  if (!parsed.success) return invalidResponse()
  return parsed.data
}

function decodeContentBlock(value: unknown): ContentBlock {
  const parsed = contentBlockSchema.safeParse(value)
  if (!parsed.success) return invalidResponse()
  const data = parsed.data
  if (data.kind === 'web-image') {
    return {
      kind: 'web-image',
      query: data.query,
      ...(data.caption !== undefined ? { caption: data.caption } : {}),
      ...(data.required !== undefined ? { required: data.required } : {}),
      ...(data.intent !== undefined ? { intent: data.intent } : {}),
      ...(data.provider !== undefined ? { provider: data.provider } : {}),
      ...(data.replace !== undefined ? { replace: data.replace } : {}),
    }
  }
  if (data.kind === 'image') {
    return {
      kind: 'image',
      attachmentId: data.attachmentId,
      ...(data.caption !== undefined ? { caption: data.caption } : {}),
    }
  }
  return data
}

function decodeImageReview(value: unknown): readonly OutlineImageReview[] {
  const parsed = imageReviewSchema.safeParse(value)
  if (!parsed.success) return invalidResponse()
  return parsed.data.map(item => ({
    needId: item.needId,
    slideIndex: item.slideIndex,
    blockIndex: item.blockIndex,
    required: item.required,
    status: item.status,
    ...(item.digest !== undefined ? { digest: item.digest } : {}),
    ...(item.failure !== undefined ? { failure: item.failure } : {}),
    ...(item.attempts !== undefined
      ? {
          attempts: item.attempts.map(attempt => ({
            candidateId: attempt.candidateId,
            imageUrl: attempt.imageUrl,
            code: attempt.code,
            checks: attempt.checks.map(check => ({
              sourceUrl: check.sourceUrl,
              code: check.code,
              ...(check.httpStatus !== undefined ? { httpStatus: check.httpStatus } : {}),
            })),
          })),
        }
      : {}),
    ...(item.credit !== undefined
      ? {
          credit: {
            url: item.credit.url,
            author: item.credit.author,
            license: item.credit.license,
            licenseUrl: item.credit.licenseUrl,
            retrievedAt: item.credit.retrievedAt,
            unknownLicense: item.credit.unknownLicense,
            ...(item.credit.evidence !== undefined ? { evidence: item.credit.evidence } : {}),
            ...(item.credit.downloadUrl !== undefined ? { downloadUrl: item.credit.downloadUrl } : {}),
          },
        }
      : {}),
    ...(item.selection !== undefined ? { selection: item.selection } : {}),
  }))
}

function decodeLayoutIssues(value: unknown, slideCount: number): NonNullable<OutlineProposal['layoutIssues']> {
  const parsed = z.array(layoutIssueSchema).max(32).safeParse(value)
  if (!parsed.success) return invalidResponse()
  return parsed.data.map(issue => {
    if (issue.slideIndex >= slideCount) return invalidResponse()
    if (!issue.path.startsWith(`slides[${issue.slideIndex}].`)) return invalidResponse()
    if ((issue.actual === undefined) !== (issue.limit === undefined)) return invalidResponse()
    if (issue.actual !== undefined && issue.limit !== undefined && issue.actual <= issue.limit) {
      return invalidResponse()
    }
    return {
      code: issue.code,
      slideIndex: issue.slideIndex,
      path: issue.path,
      message: issue.message,
      expected: issue.expected,
      ...(issue.layoutId !== undefined ? { layoutId: issue.layoutId } : {}),
      ...(issue.actual !== undefined && issue.limit !== undefined ? { actual: issue.actual, limit: issue.limit } : {}),
    }
  })
}

function decodeProposalSlide(
  value: unknown,
  allowedRefs: readonly BriefSourceRef[],
): OutlineProposal['slides'][number] {
  const parsed = proposalSlideSchema.safeParse(value)
  if (!parsed.success) return invalidResponse()
  const sources = parsed.data.sources.map(decodeOutlineSource)
  const hasInvalidSource = sources.some(
    r => !allowedRefs.some(b => b.sourceId === r.sourceId && b.version === r.version && b.kind === r.kind),
  )
  if (hasInvalidSource) return invalidResponse()
  return {
    slideId: parsed.data.slideId,
    title: parsed.data.title,
    content: parsed.data.content,
    blocks: parsed.data.blocks.map(decodeContentBlock),
    sources,
  }
}

/** Additive decoder; legacy proposals retain their original contract. */
export function decodeBoundProposal(value: Record<string, unknown>, sessionId: string): OutlineProposal {
  const parsed = proposalHeaderSchema.safeParse(value)
  if (!parsed.success) return invalidResponse()
  const data = parsed.data
  const brief = decodeBriefView(
    {
      sessionId,
      version: data.brief.version,
      current: value.brief,
      locked: false,
      sourceStates: data.brief.draft.sources.refs.map(src => ({ source: src, status: 'recorded' })),
    },
    sessionId,
  ).current
  if (!brief) return invalidResponse()
  const slides = data.slides.map(slide => decodeProposalSlide(slide, brief.draft.sources.refs))
  if (new Set(slides.map(s => s.slideId)).size !== slides.length) return invalidResponse()
  return {
    outlineId: data.outlineId,
    requestId: data.requestId,
    version: data.version,
    responseIndex: data.responseIndex,
    overview: data.overview,
    status: data.status,
    slides,
    ...(data.layoutIssues === undefined ? {} : { layoutIssues: decodeLayoutIssues(data.layoutIssues, slides.length) }),
    ...(data.imageReview === undefined ? {} : { imageReview: decodeImageReview(data.imageReview) }),
    brief,
    revisionSuggestions: data.revisionSuggestions,
    changes: data.changes,
    ...(data.previousOutlineId !== undefined ? { previousOutlineId: data.previousOutlineId } : {}),
    ...(data.restoredFrom !== undefined ? { restoredFrom: data.restoredFrom } : {}),
  }
}
