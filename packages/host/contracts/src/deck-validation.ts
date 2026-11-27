import { decodeArtifactDescriptor, decodeContentOrigins, decodeSlideDocument } from '@deckagent/presentation-document'
import type { BriefView, InterviewState } from './brief.ts'
import { decodeBriefView } from './brief-validation.ts'
import type {
  ConfirmationReceipt,
  ConfirmationTarget,
  DeckChange,
  DeckSnapshot,
  ImageCredit,
  OutlineProposal,
  OutlineSnapshot,
  SlideContent,
} from './deck.ts'
import { decodeGeneration } from './generation-validation.ts'
import { decodeBoundProposal } from './outline-validation.ts'
import type { ConfirmationResult } from './requests.ts'
import { invalidResponse } from './validation-primitives.ts'

// The deck payloads that the Browser reads. Each decoder throws `INVALID_RESPONSE`, also when a nested decoder of the
// document package or of the generation refuses the value.

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function id(value: unknown): value is string {
  return typeof value === 'string' && /^[\w-]{1,100}$/.test(value)
}
function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}
function positive(value: unknown): value is number {
  return integer(value) && value > 0
}
function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && !!value.trim() && value.length <= max
}
function wellFormed(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim() && value.isWellFormed()
}

function guarded<T>(decode: () => T): T {
  try {
    return decode()
  } catch {
    return invalidResponse()
  }
}

/** Decodes the deck change of `GET /api/sessions/:sessionId/deck/events`. A notice holds no HTML. */
export function decodeDeckChange(value: unknown, sessionId: string): DeckChange {
  if (!record(value) || value.sessionId !== sessionId || value.deckId !== sessionId || !integer(value.version))
    return invalidResponse()
  return { sessionId, deckId: sessionId, version: value.version }
}

/** Decodes the deck metadata of `GET /api/sessions/:sessionId/deck`. HTML is read for each slide revision. */
export function decodeDeckSnapshot(value: unknown, sessionId: string): DeckSnapshot {
  const base = decodeDeckChange(value, sessionId)
  if (
    !record(value) ||
    (value.outlineId !== null && !id(value.outlineId)) ||
    !Array.isArray(value.slides) ||
    (value.generation === undefined && value.slides.length > 100)
  )
    return invalidResponse()
  const slides = value.slides.map((slide: unknown, position: number) => {
    if (
      !record(slide) ||
      !id(slide.slideId) ||
      typeof slide.title !== 'string' ||
      !slide.title.trim() ||
      (value.generation === undefined && slide.title.length > 300) ||
      slide.order !== position ||
      !integer(slide.revision) ||
      slide.status !== (slide.revision ? 'published' : 'pending')
    )
      return invalidResponse()
    return {
      slideId: slide.slideId,
      title: slide.title,
      order: position,
      revision: slide.revision,
      status: slide.revision ? ('published' as const) : ('pending' as const),
    }
  })
  if (
    new Set(slides.map(slide => slide.slideId)).size !== slides.length ||
    (base.version === 0 ? value.outlineId !== null || slides.length > 0 : value.outlineId === null || !slides.length)
  )
    return invalidResponse()
  const generation =
    value.generation === undefined ? undefined : guarded(() => decodeGeneration(value.generation, sessionId))
  if (generation && generation.receipt.outlineId !== value.outlineId) return invalidResponse()
  return { ...base, outlineId: value.outlineId, slides, ...(generation ? { generation } : {}) }
}

const imageLicenses = ['public-domain', 'CC0', 'CC BY', 'Pexels', 'unknown'] as const

function decodeImageCredits(value: unknown): readonly ImageCredit[] {
  if (!Array.isArray(value) || value.length > 100) return invalidResponse()
  return value.map(item => {
    if (
      !record(item) ||
      typeof item.url !== 'string' ||
      !item.url.startsWith('https://') ||
      typeof item.author !== 'string' ||
      typeof item.licenseUrl !== 'string' ||
      (item.evidence !== undefined && item.evidence !== 'image-metadata' && item.evidence !== 'pexels-cdn') ||
      (item.downloadUrl !== undefined &&
        (typeof item.downloadUrl !== 'string' || !item.downloadUrl.startsWith('https://'))) ||
      typeof item.retrievedAt !== 'string' ||
      typeof item.unknownLicense !== 'boolean'
    )
      return invalidResponse()
    const license = imageLicenses.find(known => known === item.license)
    if (!license || item.unknownLicense !== (license === 'unknown')) return invalidResponse()
    return {
      url: item.url,
      author: item.author,
      licenseUrl: item.licenseUrl,
      license,
      ...(item.evidence === 'image-metadata' || item.evidence === 'pexels-cdn' ? { evidence: item.evidence } : {}),
      ...(typeof item.downloadUrl === 'string' ? { downloadUrl: item.downloadUrl } : {}),
      unknownLicense: item.unknownLicense,
      retrievedAt: item.retrievedAt,
    }
  })
}

function decodeStrings(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return invalidResponse()
  return value.map(item => (typeof item === 'string' ? item : invalidResponse()))
}

/** Decodes one saved slide revision of `GET /api/sessions/:sessionId/deck/slides/:slideId/revisions/:revision`. */
export function decodeSlideContent(value: unknown, sessionId: string, slideId: string, revision: number): SlideContent {
  if (
    !record(value) ||
    value.sessionId !== sessionId ||
    value.slideId !== slideId ||
    value.revision !== revision ||
    typeof value.html !== 'string' ||
    value.html.length > 4 * 1024 * 1024 ||
    (value.notes !== undefined && (typeof value.notes !== 'string' || value.notes.length > 16000))
  )
    return invalidResponse()
  const imageCredits = value.imageCredits === undefined ? undefined : decodeImageCredits(value.imageCredits)
  const imageOmissions = value.imageOmissions === undefined ? undefined : decodeStrings(value.imageOmissions)
  const document = value.document === undefined ? undefined : guarded(() => decodeSlideDocument(value.document))
  const artifact = value.artifact === undefined ? undefined : guarded(() => decodeArtifactDescriptor(value.artifact))
  if (
    document &&
    (document.slideId !== slideId ||
      artifact?.documentVersion !== document.schemaVersion ||
      document.notes !== value.notes)
  )
    return invalidResponse()
  if (artifact?.documentVersion && !document) return invalidResponse()
  const provenance = Array.isArray(value.provenance) ? guarded(() => decodeContentOrigins(value.provenance)) : undefined
  return {
    sessionId,
    slideId,
    revision,
    html: value.html,
    ...(document ? { document } : {}),
    ...(artifact ? { artifact } : {}),
    ...(imageCredits === undefined ? {} : { imageCredits }),
    ...(imageOmissions === undefined ? {} : { imageOmissions }),
    ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
    ...(provenance === undefined ? {} : { provenance }),
  }
}

function decodeProposal(value: unknown, sessionId: string): OutlineProposal {
  if (record(value) && value.brief !== undefined) return guarded(() => decodeBoundProposal(value, sessionId))
  if (
    !record(value) ||
    !id(value.outlineId) ||
    !id(value.requestId) ||
    !positive(value.version) ||
    !integer(value.responseIndex) ||
    !text(value.overview, 4000) ||
    !Array.isArray(value.slides) ||
    !value.slides.length ||
    value.slides.length > 100 ||
    (value.status !== 'current' &&
      value.status !== 'confirmed' &&
      value.status !== 'superseded' &&
      value.status !== 'cancelled')
  )
    return invalidResponse()
  const slides = value.slides.map((slide: unknown) => {
    if (!record(slide) || !id(slide.slideId) || !text(slide.title, 300) || !text(slide.content, 8000))
      return invalidResponse()
    return { slideId: slide.slideId, title: slide.title, content: slide.content }
  })
  if (new Set(slides.map(slide => slide.slideId)).size !== slides.length) return invalidResponse()
  return {
    outlineId: value.outlineId,
    requestId: value.requestId,
    version: value.version,
    responseIndex: value.responseIndex,
    overview: value.overview,
    status: value.status,
    slides,
  }
}

/** Decodes the Outline proposals of `GET /api/sessions/:sessionId/outline`. Outline versions do not follow deck versions. */
export function decodeOutlineSnapshot(value: unknown, sessionId: string): OutlineSnapshot {
  if (
    !record(value) ||
    value.sessionId !== sessionId ||
    typeof value.active !== 'boolean' ||
    !integer(value.version) ||
    (value.currentId !== null && !id(value.currentId)) ||
    (value.confirmedId !== null && !id(value.confirmedId)) ||
    !Array.isArray(value.proposals)
  )
    return invalidResponse()
  const proposals = value.proposals.map(proposal => decodeProposal(proposal, sessionId))
  const version = value.version
  if (
    new Set(proposals.map(p => p.outlineId)).size !== proposals.length ||
    new Set(proposals.map(p => p.requestId)).size !== proposals.length ||
    proposals.some((p, index) => {
      const previous = index > 0 ? proposals[index - 1] : undefined
      return (
        p.version > version ||
        (previous !== undefined && p.version <= previous.version) ||
        (p.status === 'current' && p.outlineId !== value.currentId) ||
        (p.status === 'confirmed' && p.outlineId !== value.confirmedId)
      )
    }) ||
    (value.currentId !== null &&
      !proposals.some(p => p.outlineId === value.currentId && ['current', 'confirmed'].includes(p.status))) ||
    (value.confirmedId !== null &&
      (value.confirmedId !== value.currentId ||
        !proposals.some(p => p.outlineId === value.confirmedId && p.status === 'confirmed'))) ||
    (!value.active &&
      (value.version !== 0 || proposals.length > 0 || value.currentId !== null || value.confirmedId !== null))
  )
    return invalidResponse()
  return {
    sessionId,
    active: value.active,
    version: value.version,
    currentId: value.currentId,
    confirmedId: value.confirmedId,
    proposals,
  }
}

const interviewTopics = [
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

/** The Brief of a chat and the questions that the Brief interview still asks. */
export interface InterviewView {
  readonly brief: BriefView
  readonly state: InterviewState
}

/** Decodes the Brief interview of `GET /api/sessions/:sessionId/interview`. */
export function decodeInterview(value: unknown, sessionId: string): InterviewView {
  if (!record(value) || !record(value.state)) return invalidResponse()
  const s = value.state
  if (
    !Array.isArray(s.questions) ||
    !Array.isArray(s.blockers) ||
    typeof s.readyForOutline !== 'boolean' ||
    typeof s.skipAllowed !== 'boolean' ||
    !wellFormed(s.notice)
  )
    return invalidResponse()
  const questions = s.questions.map((q: unknown) => {
    if (
      !record(q) ||
      !wellFormed(q.prompt) ||
      !Array.isArray(q.suggestions) ||
      !q.suggestions.every(wellFormed) ||
      typeof q.required !== 'boolean'
    )
      return invalidResponse()
    const topic = interviewTopics.find(known => known === q.topic)
    if (!topic) return invalidResponse()
    return { topic, prompt: q.prompt, suggestions: q.suggestions.filter(wellFormed), required: q.required }
  })
  const blockers = s.blockers.map((b: unknown) => {
    if (!record(b) || !wellFormed(b.code) || !wellFormed(b.message)) return invalidResponse()
    return { code: b.code, message: b.message }
  })
  if (
    (s.readyForOutline && (questions.length || blockers.length)) ||
    new Set(questions.map(q => q.topic)).size !== questions.length
  )
    return invalidResponse()
  return {
    brief: guarded(() => decodeBriefView(value.brief, sessionId)),
    state: { questions, blockers, readyForOutline: s.readyForOutline, skipAllowed: s.skipAllowed, notice: s.notice },
  }
}

function decodeReceipt(v: unknown, sessionId: string): ConfirmationReceipt {
  if (
    !record(v) ||
    v.sessionId !== sessionId ||
    v.deckId !== sessionId ||
    !id(v.confirmationId) ||
    !id(v.outlineId) ||
    !id(v.briefId) ||
    !id(v.intentId) ||
    !id(v.requestId) ||
    !positive(v.outlineVersion) ||
    !positive(v.briefVersion) ||
    typeof v.fingerprint !== 'string' ||
    !/^[a-f0-9]{64}$/.test(v.fingerprint) ||
    typeof v.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(v.createdAt))
  )
    return invalidResponse()
  return {
    sessionId,
    deckId: sessionId,
    confirmationId: v.confirmationId,
    outlineId: v.outlineId,
    briefId: v.briefId,
    intentId: v.intentId,
    requestId: v.requestId,
    outlineVersion: v.outlineVersion,
    briefVersion: v.briefVersion,
    fingerprint: v.fingerprint,
    createdAt: v.createdAt,
  }
}

const requestStatuses = ['active', 'waiting_approval', 'completed', 'failed', 'stopped', 'interrupted'] as const

/**
 * Decodes the reply of `POST /api/sessions/:sessionId/deck/confirm`. The receipt must name the confirmed target, so a
 * reply for another Outline or Brief version is refused.
 */
export function decodeConfirmationResult(
  value: unknown,
  sessionId: string,
  target: ConfirmationTarget,
): ConfirmationResult {
  if (!record(value) || !record(value.request)) return invalidResponse()
  const receipt = decodeReceipt(value.receipt, sessionId)
  const request = value.request
  const status = requestStatuses.find(known => known === request.status)
  if (
    !status ||
    request.sessionId !== sessionId ||
    request.requestId !== receipt.requestId ||
    typeof request.text !== 'string' ||
    !integer(request.sequence) ||
    (request.errorCode !== undefined &&
      (typeof request.errorCode !== 'string' || !/^[A-Z][A-Z0-9_]{0,63}$/.test(request.errorCode))) ||
    receipt.confirmationId !== target.confirmationId ||
    receipt.outlineId !== target.outlineId ||
    receipt.outlineVersion !== target.outlineVersion ||
    receipt.briefId !== target.briefId ||
    receipt.briefVersion !== target.briefVersion
  )
    return invalidResponse()
  return {
    receipt,
    request: {
      requestId: receipt.requestId,
      sessionId,
      status,
      text: request.text,
      sequence: request.sequence,
      ...(typeof request.errorCode === 'string' ? { errorCode: request.errorCode } : {}),
    },
  }
}
