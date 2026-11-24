import type { BriefSourceRef, BriefView, DesignSnapshot } from './brief.ts'
import { isWireBriefDraft } from './brief-validation.ts'
import type {
  ConfirmationReceipt,
  ContentBlock,
  GenerationSnapshot,
  ImageAttempt,
  ImageCredit,
  ImageSelection,
  OutlineImageReview,
  OutlineProposal,
  WebImageIntent,
} from './deck.ts'
import type { ApprovalView, AttachmentView, RequestEvent, RequestStatus } from './requests.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.isWellFormed()
const id = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,100}$/.test(v)
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text)
const only = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).every(k => keys.includes(k))
const invalid = (): never => {
  throw new Error('INVALID_RESPONSE')
}

const statuses: readonly RequestStatus[] = [
  'active',
  'waiting_approval',
  'completed',
  'failed',
  'stopped',
  'interrupted',
]
const code = /^[A-Z][A-Z0-9_]{0,63}$/
const requestIdPattern = /^[\w-]{1,100}$/

function approvalView(value: unknown): ApprovalView {
  if (
    !object(value) ||
    typeof value.approvalId !== 'string' ||
    !/^[\w-]{1,100}$/.test(value.approvalId) ||
    typeof value.requestId !== 'string' ||
    !/^[\w-]{1,100}$/.test(value.requestId) ||
    value.operation !== 'read-file' ||
    typeof value.target !== 'string' ||
    !value.target ||
    value.target.length > 4096 ||
    typeof value.reason !== 'string' ||
    !value.reason ||
    value.reason.length > 500
  )
    return invalid()
  const state = value.state
  if (state !== 'pending' && state !== 'allowed' && state !== 'refused' && state !== 'cancelled') return invalid()
  return {
    approvalId: value.approvalId,
    requestId: value.requestId,
    operation: 'read-file',
    target: value.target,
    reason: value.reason,
    state,
  }
}

function status(value: unknown): RequestStatus {
  const found = statuses.find(item => item === value)
  if (!found) return invalid()
  return found
}

export function decodeAttachment(value: unknown): AttachmentView {
  if (
    !object(value) ||
    typeof value.attachmentId !== 'string' ||
    !/^att-[a-f0-9-]{36}$/.test(value.attachmentId) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    !['preparing', 'ready', 'rejected'].includes(String(value.state)) ||
    typeof value.byteSize !== 'number' ||
    !Number.isSafeInteger(value.byteSize) ||
    value.byteSize < 0 ||
    (value.detectedType !== undefined && typeof value.detectedType !== 'string') ||
    (value.rejectionCode !== undefined && (typeof value.rejectionCode !== 'string' || !code.test(value.rejectionCode)))
  )
    return invalid()
  const state = value.state
  if (state !== 'preparing' && state !== 'ready' && state !== 'rejected') return invalid()
  let source: AttachmentView['source']
  let preparation: AttachmentView['preparation']
  if (value.preparation !== undefined) {
    const prepared = value.preparation
    if (
      !object(prepared) ||
      typeof prepared.parserVersion !== 'string' ||
      !Array.isArray(prepared.capabilities) ||
      prepared.capabilities.some(item => typeof item !== 'string') ||
      (prepared.completeness !== 'complete' && prepared.completeness !== 'partial') ||
      !Array.isArray(prepared.omitted)
    )
      return invalid()
    const omitted = prepared.omitted.map((item: unknown) => {
      if (
        !object(item) ||
        typeof item.code !== 'string' ||
        !code.test(item.code) ||
        (item.entry !== undefined && typeof item.entry !== 'string')
      )
        return invalid()
      return { code: item.code, ...(typeof item.entry === 'string' ? { entry: item.entry } : {}) }
    })
    preparation = {
      parserVersion: prepared.parserVersion,
      capabilities: prepared.capabilities.map(item => String(item)),
      completeness: prepared.completeness,
      omitted,
    }
  }
  if (value.source !== undefined) {
    const item = value.source
    if (
      !object(item) ||
      typeof item.sourceId !== 'string' ||
      !item.sourceId ||
      typeof item.version !== 'number' ||
      !Number.isSafeInteger(item.version) ||
      item.version < 1 ||
      item.kind !== 'attachment' ||
      typeof item.label !== 'string'
    )
      return invalid()
    source = { sourceId: item.sourceId, version: item.version, kind: 'attachment', label: item.label }
  }
  return {
    attachmentId: value.attachmentId,
    name: value.name,
    state,
    byteSize: value.byteSize,
    ...(typeof value.detectedType === 'string' ? { detectedType: value.detectedType } : {}),
    ...(typeof value.rejectionCode === 'string' ? { rejectionCode: value.rejectionCode } : {}),
    ...(source ? { source } : {}),
    ...(preparation ? { preparation } : {}),
  }
}

/** Only the documented event shapes; anything else is a broken stream, never rendered. */
export function requestEvent(value: unknown): RequestEvent {
  if (
    !object(value) ||
    typeof value.requestId !== 'string' ||
    !requestIdPattern.test(value.requestId) ||
    typeof value.sequence !== 'number' ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 1 ||
    typeof value.timestamp !== 'string'
  )
    return invalid()
  const base = { requestId: value.requestId, sequence: value.sequence, timestamp: value.timestamp }
  if (value.kind === 'status') {
    if (value.errorCode !== undefined && (typeof value.errorCode !== 'string' || !code.test(value.errorCode)))
      return invalid()
    return {
      ...base,
      kind: 'status',
      status: status(value.status),
      ...(typeof value.errorCode === 'string' ? { errorCode: value.errorCode } : {}),
    }
  }
  if (
    value.kind === 'activity' &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    (value.type === 'model' || value.type === 'tool') &&
    ['running', 'completed', 'failed', 'stopped'].includes(String(value.status))
  ) {
    const activityStatus = (['running', 'completed', 'failed', 'stopped'] as const).find(s => s === value.status)
    if (!activityStatus) return invalid()
    return {
      ...base,
      kind: 'activity',
      id: value.id,
      label: value.label,
      type: value.type,
      status: activityStatus,
    }
  }
  if (value.kind === 'text' && typeof value.part === 'string' && typeof value.text === 'string')
    return { ...base, kind: 'text', part: value.part, text: value.text }
  if (value.kind === 'notice' && typeof value.code === 'string' && code.test(value.code))
    return { ...base, kind: 'notice', code: value.code }
  if (value.kind === 'approval') {
    const approval = approvalView(value.approval)
    if (approval.requestId !== value.requestId) return invalid()
    return { ...base, kind: 'approval', approval }
  }
  return invalid()
}

const reference = (v: unknown) =>
  object(v) && only(v, ['id', 'version']) && text(v.id) && integer(v.version) && v.version > 0

const briefSource = (v: unknown): v is BriefSourceRef =>
  object(v) &&
  only(v, ['sourceId', 'version', 'kind']) &&
  typeof v.sourceId === 'string' &&
  /^src-[a-f0-9-]{36}$/.test(v.sourceId) &&
  integer(v.version) &&
  v.version > 0 &&
  ['attachment', 'project-file', 'approved-file', 'research'].some(k => k === v.kind)

const colors = [
  'color.background',
  'color.surface',
  'color.text',
  'color.muted',
  'color.accent',
  'color.onAccent',
  'color.border',
]
const fonts = ['font.heading', 'font.body']
const numbers = ['type.display', 'type.heading', 'type.body', 'type.caption', 'space.unit', 'type.lineHeight']

function theme(v: unknown, partial = false): boolean {
  if (!object(v) || !only(v, [...colors, ...fonts, ...numbers])) return false
  if (!partial && Object.keys(v).length !== colors.length + fonts.length + numbers.length) return false
  return Object.entries(v).every(([k, value]) =>
    colors.includes(k)
      ? typeof value === 'string' && /^#[a-f0-9]{6}$/i.test(value)
      : fonts.includes(k)
        ? text(value)
        : typeof value === 'number' && Number.isFinite(value) && value > 0,
  )
}

function isDesignSnapshot(v: unknown): v is DesignSnapshot {
  return (
    object(v) &&
    only(v, ['format', 'designSystem', 'template', 'theme', 'rules', 'brandAssets', 'viewport', 'fingerprint']) &&
    v.format === 'html' &&
    reference(v.designSystem) &&
    reference(v.template) &&
    theme(v.theme) &&
    strings(v.rules) &&
    Array.isArray(v.brandAssets) &&
    v.brandAssets.length === 0 &&
    object(v.viewport) &&
    only(v.viewport, ['width', 'height']) &&
    v.viewport.width === 1280 &&
    v.viewport.height === 720 &&
    typeof v.fingerprint === 'string' &&
    /^[a-f0-9]{64}$/.test(v.fingerprint)
  )
}

/** Browser-safe structural decoding; selection policy, source access and snapshot integrity belong to Host. */
export function decodeBriefView(v: unknown, sessionId: string): BriefView {
  if (
    !object(v) ||
    !only(v, ['sessionId', 'version', 'current', 'locked', 'sourceStates']) ||
    v.sessionId !== sessionId ||
    !integer(v.version) ||
    typeof v.locked !== 'boolean' ||
    !Array.isArray(v.sourceStates)
  )
    return invalid()
  const c = v.current
  if (c === null) {
    if (v.version !== 0 || v.sourceStates.length) return invalid()
    return { sessionId, version: 0, current: null, locked: v.locked, sourceStates: [] }
  }
  if (
    !object(c) ||
    !only(c, ['sessionId', 'briefId', 'version', 'createdAt', 'draft', 'design']) ||
    c.sessionId !== sessionId ||
    typeof c.briefId !== 'string' ||
    !/^brief-[a-f0-9-]{36}$/.test(c.briefId) ||
    c.version !== v.version ||
    !v.version ||
    typeof c.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(c.createdAt)) ||
    !isWireBriefDraft(c.draft) ||
    (c.design !== null && !isDesignSnapshot(c.design)) ||
    (c.draft.generationFormat === 'html') !== (c.design !== null)
  )
    return invalid()
  const refs = c.draft.sources.refs
  if (v.sourceStates.length !== refs.length) return invalid()
  const sourceStates = v.sourceStates.map((state: unknown, index) => {
    const ref = refs[index]
    if (
      !ref ||
      !object(state) ||
      !only(state, ['source', 'status']) ||
      !briefSource(state.source) ||
      !['recorded', 'unavailable'].some(k => k === state.status) ||
      state.source.sourceId !== ref.sourceId ||
      state.source.version !== ref.version ||
      state.source.kind !== ref.kind
    )
      return invalid()
    return {
      source: state.source,
      status: state.status === 'recorded' ? ('recorded' as const) : ('unavailable' as const),
    }
  })
  return {
    sessionId,
    version: v.version,
    locked: v.locked,
    current: {
      sessionId,
      briefId: c.briefId,
      version: v.version,
      createdAt: c.createdAt,
      draft: c.draft,
      design: c.design,
    },
    sourceStates,
  }
}

const shortString = (v: unknown): v is string => typeof v === 'string' && v.length <= 2048 && v.isWellFormed()
const httpsUrl = (v: unknown): v is string => {
  if (!shortString(v)) return false
  try {
    const u = new URL(v)
    return u.protocol === 'https:' && !u.username && !u.password
  } catch {
    return false
  }
}

function credit(v: unknown): ImageCredit {
  if (
    !object(v) ||
    !httpsUrl(v.url) ||
    !shortString(v.author) ||
    !shortString(v.licenseUrl) ||
    !shortString(v.retrievedAt)
  )
    return invalid()
  const license = (['public-domain', 'CC0', 'CC BY', 'Pexels', 'unknown'] as const).find(k => k === v.license)
  if (!license || v.unknownLicense !== (license === 'unknown')) return invalid()
  if (v.evidence !== undefined && v.evidence !== 'image-metadata' && v.evidence !== 'pexels-cdn') return invalid()
  if (v.downloadUrl !== undefined && !httpsUrl(v.downloadUrl)) return invalid()
  return {
    url: v.url,
    author: v.author,
    license,
    licenseUrl: v.licenseUrl,
    retrievedAt: v.retrievedAt,
    unknownLicense: license === 'unknown',
    ...(v.evidence === 'image-metadata' || v.evidence === 'pexels-cdn' ? { evidence: v.evidence } : {}),
    ...(typeof v.downloadUrl === 'string' ? { downloadUrl: v.downloadUrl } : {}),
  }
}

function attempts(value: unknown): readonly ImageAttempt[] {
  if (!Array.isArray(value) || value.length > 4) return invalid()
  return value.map(a => {
    if (
      !object(a) ||
      !shortString(a.candidateId) ||
      !httpsUrl(a.imageUrl) ||
      !shortString(a.code) ||
      !Array.isArray(a.checks) ||
      a.checks.length > 3
    )
      return invalid()
    return {
      candidateId: a.candidateId,
      imageUrl: a.imageUrl,
      code: a.code,
      checks: a.checks.map((c: unknown) => {
        if (
          !object(c) ||
          !httpsUrl(c.sourceUrl) ||
          !shortString(c.code) ||
          (c.httpStatus !== undefined &&
            (typeof c.httpStatus !== 'number' ||
              !Number.isInteger(c.httpStatus) ||
              c.httpStatus < 100 ||
              c.httpStatus > 599))
        )
          return invalid()
        return {
          sourceUrl: c.sourceUrl,
          code: c.code,
          ...(typeof c.httpStatus === 'number' ? { httpStatus: c.httpStatus } : {}),
        }
      }),
    }
  })
}

function selection(v: unknown): ImageSelection {
  if (
    !object(v) ||
    !httpsUrl(v.imageUrl) ||
    !shortString(v.query) ||
    !shortString(v.description) ||
    !shortString(v.reason) ||
    v.evidence !== 'metadata' ||
    (v.policy !== 'web-images-v1' && v.policy !== 'web-images-v2') ||
    (v.provider !== 'tavily' && v.provider !== 'commons')
  )
    return invalid()
  return {
    imageUrl: v.imageUrl,
    query: v.query,
    description: v.description,
    reason: v.reason,
    evidence: v.evidence,
    policy: v.policy,
    provider: v.provider,
  }
}

function decodeImageReview(v: unknown): readonly OutlineImageReview[] {
  if (!Array.isArray(v) || v.length > 32) return invalid()
  return v.map(item => {
    if (
      !object(item) ||
      typeof item.needId !== 'string' ||
      !/^need-[a-f0-9]{64}$/.test(item.needId) ||
      typeof item.slideIndex !== 'number' ||
      !Number.isSafeInteger(item.slideIndex) ||
      item.slideIndex < 0 ||
      typeof item.blockIndex !== 'number' ||
      !Number.isSafeInteger(item.blockIndex) ||
      item.blockIndex < 0 ||
      typeof item.required !== 'boolean' ||
      (item.status !== 'prepared' && item.status !== 'unavailable') ||
      (item.failure !== undefined && !shortString(item.failure)) ||
      (item.digest !== undefined && (typeof item.digest !== 'string' || !/^[a-f0-9]{64}$/.test(item.digest)))
    )
      return invalid()
    return {
      needId: item.needId,
      slideIndex: item.slideIndex,
      blockIndex: item.blockIndex,
      required: item.required,
      status: item.status,
      ...(typeof item.digest === 'string' ? { digest: item.digest } : {}),
      ...(typeof item.failure === 'string' ? { failure: item.failure } : {}),
      ...(item.attempts === undefined ? {} : { attempts: attempts(item.attempts) }),
      ...(item.credit === undefined ? {} : { credit: credit(item.credit) }),
      ...(item.selection === undefined ? {} : { selection: selection(item.selection) }),
    }
  })
}

function block(v: unknown): ContentBlock {
  if (!object(v)) return invalid()
  if (
    ['subtitle', 'lead', 'text', 'source-note'].some(k => k === v.kind) &&
    text(v.text) &&
    only(v, ['kind', 'text'])
  ) {
    const kind = (['subtitle', 'lead', 'text', 'source-note'] as const).find(k => k === v.kind)
    if (!kind) return invalid()
    return { kind, text: v.text }
  }
  if (v.kind === 'bullets' && only(v, ['kind', 'items']) && strings(v.items) && v.items.length)
    return { kind: 'bullets', items: v.items }
  if (
    v.kind === 'web-image' &&
    only(v, ['kind', 'query', 'caption', 'required', 'intent', 'provider', 'replace']) &&
    text(v.query) &&
    v.query.length <= 500 &&
    (v.caption === undefined || text(v.caption)) &&
    (v.required === undefined || typeof v.required === 'boolean') &&
    (v.replace === undefined || typeof v.replace === 'boolean') &&
    (v.provider === undefined || v.provider === 'tavily' || v.provider === 'commons')
  )
    return {
      kind: 'web-image',
      query: v.query,
      ...(typeof v.caption === 'string' ? { caption: v.caption } : {}),
      ...(typeof v.required === 'boolean' ? { required: v.required } : {}),
      ...(typeof v.replace === 'boolean' ? { replace: v.replace } : {}),
      ...(v.provider === 'tavily' || v.provider === 'commons' ? { provider: v.provider } : {}),
      ...(v.intent === undefined ? {} : { intent: imageIntent(v.intent) }),
    }
  if (
    v.kind === 'image' &&
    only(v, ['kind', 'attachmentId', 'caption']) &&
    typeof v.attachmentId === 'string' &&
    /^att-[a-f0-9-]{36}$/.test(v.attachmentId) &&
    (v.caption === undefined || text(v.caption))
  )
    return {
      kind: 'image',
      attachmentId: v.attachmentId,
      ...(typeof v.caption === 'string' ? { caption: v.caption } : {}),
    }
  if (v.kind === 'columns' && only(v, ['kind', 'columns']) && Array.isArray(v.columns) && v.columns.length)
    return {
      kind: 'columns',
      columns: v.columns.map((c: unknown) => {
        if (!object(c) || !only(c, ['bullets']) || !strings(c.bullets) || !c.bullets.length) return invalid()
        return { bullets: c.bullets }
      }),
    }
  if (v.kind === 'metrics' && only(v, ['kind', 'items']) && Array.isArray(v.items) && v.items.length)
    return {
      kind: 'metrics',
      items: v.items.map((m: unknown) => {
        if (!object(m) || !only(m, ['value', 'label']) || !text(m.value) || !text(m.label)) return invalid()
        return { value: m.value, label: m.label }
      }),
    }
  return invalid()
}

function imageIntent(v: unknown): WebImageIntent {
  if (
    !object(v) ||
    !only(v, ['subject', 'role', 'mustInclude', 'mustAvoid', 'aspect']) ||
    !text(v.subject) ||
    v.subject.length > 500 ||
    !text(v.role) ||
    v.role.length > 500 ||
    !strings(v.mustInclude) ||
    v.mustInclude.length > 10 ||
    v.mustInclude.some(s => s.length > 300) ||
    !strings(v.mustAvoid) ||
    v.mustAvoid.length > 10 ||
    v.mustAvoid.some(s => s.length > 300)
  )
    return invalid()
  const aspect = (['landscape', 'portrait', 'square', 'any'] as const).find(k => k === v.aspect)
  if (!aspect) return invalid()
  return { subject: v.subject, role: v.role, mustInclude: v.mustInclude, mustAvoid: v.mustAvoid, aspect }
}

function outlineSource(v: unknown): BriefSourceRef {
  if (
    !object(v) ||
    !only(v, ['sourceId', 'version', 'kind']) ||
    typeof v.sourceId !== 'string' ||
    !/^src-[a-f0-9-]{36}$/.test(v.sourceId) ||
    typeof v.version !== 'number' ||
    !Number.isSafeInteger(v.version) ||
    v.version < 1
  )
    return invalid()
  const kind = (['attachment', 'project-file', 'approved-file', 'research'] as const).find(k => k === v.kind)
  if (!kind) return invalid()
  return { sourceId: v.sourceId, version: v.version, kind }
}

function layoutIssues(value: unknown, slideCount: number): NonNullable<OutlineProposal['layoutIssues']> {
  if (!Array.isArray(value) || value.length > 32) return invalid()
  return value.map(v => {
    const layoutId = object(v)
      ? (['cover', 'section', 'title-body', 'two-column', 'key-figures', 'image-text', 'image-pair'] as const).find(
          item => item === v.layoutId,
        )
      : undefined
    if (
      !object(v) ||
      v.code !== 'DESIGN_LAYOUT_INCOMPATIBLE' ||
      typeof v.slideIndex !== 'number' ||
      !Number.isSafeInteger(v.slideIndex) ||
      v.slideIndex < 0 ||
      v.slideIndex >= slideCount ||
      !text(v.path) ||
      v.path.length > 500 ||
      !v.path.startsWith(`slides[${v.slideIndex}].`) ||
      !text(v.message) ||
      v.message.length > 1000 ||
      !text(v.expected) ||
      v.expected.length > 1000 ||
      (v.layoutId !== undefined && !layoutId) ||
      (v.actual === undefined) !== (v.limit === undefined) ||
      (v.actual !== undefined &&
        (typeof v.actual !== 'number' ||
          !Number.isSafeInteger(v.actual) ||
          typeof v.limit !== 'number' ||
          !Number.isSafeInteger(v.limit) ||
          v.limit < 0 ||
          v.actual <= v.limit))
    )
      return invalid()
    return {
      code: 'DESIGN_LAYOUT_INCOMPATIBLE' as const,
      slideIndex: v.slideIndex,
      path: v.path,
      message: v.message,
      expected: v.expected,
      ...(layoutId === undefined ? {} : { layoutId }),
      ...(typeof v.actual === 'number' && typeof v.limit === 'number' ? { actual: v.actual, limit: v.limit } : {}),
    }
  })
}

/** Additive decoder; legacy proposals retain their original contract. */
export function decodeBoundProposal(v: Record<string, unknown>, sessionId: string): OutlineProposal {
  if (
    !id(v.outlineId) ||
    !id(v.requestId) ||
    typeof v.version !== 'number' ||
    !Number.isSafeInteger(v.version) ||
    v.version < 1 ||
    typeof v.responseIndex !== 'number' ||
    !Number.isSafeInteger(v.responseIndex) ||
    v.responseIndex < 0 ||
    !text(v.overview) ||
    !Array.isArray(v.slides) ||
    !v.slides.length ||
    !strings(v.revisionSuggestions) ||
    !object(v.brief) ||
    !object(v.brief.draft) ||
    !object(v.brief.draft.sources) ||
    !Array.isArray(v.brief.draft.sources.refs) ||
    !object(v.changes)
  )
    return invalid()
  const proposalStatus = (['current', 'superseded', 'confirmed'] as const).find(k => k === v.status)
  if (
    !proposalStatus ||
    typeof v.changes.orderChanged !== 'boolean' ||
    typeof v.changes.overviewChanged !== 'boolean' ||
    typeof v.changes.suggestionsChanged !== 'boolean' ||
    !strings(v.changes.briefFields) ||
    !strings(v.changes.added) ||
    !strings(v.changes.removed) ||
    !strings(v.changes.changed) ||
    (v.previousOutlineId !== undefined && !id(v.previousOutlineId)) ||
    (v.restoredFrom !== undefined && !id(v.restoredFrom))
  )
    return invalid()
  const brief = decodeBriefView(
    {
      sessionId,
      version: v.brief.version,
      current: v.brief,
      locked: false,
      sourceStates: v.brief.draft.sources.refs.map(src => ({ source: src, status: 'recorded' })),
    },
    sessionId,
  ).current
  if (!brief) return invalid()
  const slides = v.slides.map((s: unknown) => {
    if (
      !object(s) ||
      !id(s.slideId) ||
      !text(s.title) ||
      !text(s.content) ||
      !Array.isArray(s.blocks) ||
      !Array.isArray(s.sources)
    )
      return invalid()
    const sources = s.sources.map(outlineSource)
    if (
      sources.some(
        r =>
          !brief.draft.sources.refs.some(
            b => b.sourceId === r.sourceId && b.version === r.version && b.kind === r.kind,
          ),
      )
    )
      return invalid()
    return { slideId: s.slideId, title: s.title, content: s.content, blocks: s.blocks.map(block), sources }
  })
  if (new Set(slides.map(s => s.slideId)).size !== slides.length) return invalid()
  return {
    outlineId: v.outlineId,
    requestId: v.requestId,
    version: v.version,
    responseIndex: v.responseIndex,
    overview: v.overview,
    status: proposalStatus,
    slides,
    ...(v.layoutIssues === undefined ? {} : { layoutIssues: layoutIssues(v.layoutIssues, slides.length) }),
    ...(v.imageReview === undefined ? {} : { imageReview: decodeImageReview(v.imageReview) }),
    brief,
    revisionSuggestions: v.revisionSuggestions,
    changes: {
      overviewChanged: v.changes.overviewChanged,
      suggestionsChanged: v.changes.suggestionsChanged,
      briefFields: v.changes.briefFields,
      added: v.changes.added,
      removed: v.changes.removed,
      changed: v.changes.changed,
      orderChanged: v.changes.orderChanged,
    },
    ...(typeof v.previousOutlineId === 'string' ? { previousOutlineId: v.previousOutlineId } : {}),
    ...(typeof v.restoredFrom === 'string' ? { restoredFrom: v.restoredFrom } : {}),
  }
}

const invalidGeneration = (): never => {
  throw new Error('INVALID_GENERATION_RESPONSE')
}

function receipt(v: unknown, sessionId: string): ConfirmationReceipt {
  if (
    !object(v) ||
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
    return invalidGeneration()
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

export function decodeGeneration(v: unknown, sessionId: string): GenerationSnapshot {
  if (
    !object(v) ||
    v.format !== 'html' ||
    !isDesignSnapshot(v.design) ||
    !object(v.selection) ||
    typeof v.selection.provider !== 'string' ||
    !v.selection.provider ||
    typeof v.selection.model !== 'string' ||
    !v.selection.model ||
    typeof v.formatLocked !== 'boolean' ||
    (v.activeRequestId !== undefined && !id(v.activeRequestId)) ||
    (v.startedAt !== null && (typeof v.startedAt !== 'string' || !Number.isFinite(Date.parse(v.startedAt))))
  )
    return invalidGeneration()
  const r = receipt(v.receipt, sessionId)
  const state = (['pending', 'admitted', 'generating', 'generated', 'incomplete'] as const).find(s => s === v.state)
  if (
    !state ||
    r.fingerprint !== v.design.fingerprint ||
    v.formatLocked !== (v.startedAt !== null) ||
    (['pending', 'admitted'].includes(state) && v.startedAt !== null && !v.activeRequestId) ||
    (['generating', 'generated'].includes(state) && v.startedAt === null)
  )
    return invalidGeneration()
  return {
    receipt: r,
    ...(typeof v.activeRequestId === 'string' ? { activeRequestId: v.activeRequestId } : {}),
    state,
    format: 'html',
    design: v.design,
    formatLocked: v.formatLocked,
    startedAt: v.startedAt,
    selection: { provider: v.selection.provider, model: v.selection.model },
  }
}
