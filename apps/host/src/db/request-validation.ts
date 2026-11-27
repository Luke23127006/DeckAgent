import { DatabaseError } from './records.ts'
import type { ActivityStatus, RequestEventBody, RequestStatus, ResearchSource } from './records.ts'

const requestStatuses: readonly RequestStatus[] = [
  'active',
  'waiting_approval',
  'completed',
  'failed',
  'stopped',
  'interrupted',
]

const activityStatuses: readonly ActivityStatus[] = ['running', 'completed', 'failed', 'stopped']

export const requestCodePattern = /^[A-Z][A-Z0-9_]{0,63}$/
export const requestIdPattern = /^[\w.:-]{1,200}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasOnlyKeys(record: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(record).every(key => allowed.includes(key))
}

export function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === 'string' && requestStatuses.some(status => status === value)
}

export function isActivityStatus(value: unknown): value is ActivityStatus {
  return typeof value === 'string' && activityStatuses.some(status => status === value)
}

function isApprovalBody(value: Record<string, unknown>): boolean {
  if (!hasOnlyKeys(value, ['kind', 'approval']) || !isRecord(value.approval)) return false
  const approval = value.approval
  return (
    hasOnlyKeys(approval, ['approvalId', 'requestId', 'operation', 'target', 'reason', 'state']) &&
    typeof approval.approvalId === 'string' &&
    requestIdPattern.test(approval.approvalId) &&
    typeof approval.requestId === 'string' &&
    requestIdPattern.test(approval.requestId) &&
    approval.operation === 'read-file' &&
    typeof approval.target === 'string' &&
    approval.target.length > 0 &&
    approval.target.length <= 4096 &&
    typeof approval.reason === 'string' &&
    approval.reason.length > 0 &&
    approval.reason.length <= 500 &&
    ['pending', 'allowed', 'refused', 'cancelled'].includes(String(approval.state))
  )
}

/** Only the documented shapes are saved; anything else is refused instead of stored as an opaque blob. */
export function validateEvent(value: unknown): asserts value is RequestEventBody {
  let valid = false
  if (isRecord(value)) {
    if (value.kind === 'status') {
      valid =
        isRequestStatus(value.status) &&
        hasOnlyKeys(value, ['kind', 'status', 'errorCode']) &&
        (value.errorCode === undefined ||
          (typeof value.errorCode === 'string' && requestCodePattern.test(value.errorCode)))
    } else if (value.kind === 'activity') {
      valid =
        hasOnlyKeys(value, ['kind', 'id', 'label', 'type', 'status']) &&
        typeof value.id === 'string' &&
        requestIdPattern.test(value.id) &&
        typeof value.label === 'string' &&
        value.label.length > 0 &&
        value.label.length <= 100 &&
        (value.type === 'model' || value.type === 'tool') &&
        isActivityStatus(value.status)
    } else if (value.kind === 'text') {
      valid =
        hasOnlyKeys(value, ['kind', 'part', 'text']) &&
        typeof value.part === 'string' &&
        requestIdPattern.test(value.part) &&
        typeof value.text === 'string' &&
        value.text.length <= 1_000_000
    } else if (value.kind === 'notice') {
      valid =
        hasOnlyKeys(value, ['kind', 'code']) && typeof value.code === 'string' && requestCodePattern.test(value.code)
    } else if (value.kind === 'approval') {
      valid = isApprovalBody(value)
    }
  }
  if (!valid) throw new DatabaseError('REQUEST_EVENT', 'Request event does not match the supported format')
}

const researchSourceKeys = [
  'sourceId',
  'version',
  'kind',
  'provider',
  'query',
  'title',
  'url',
  'content',
  'partial',
  'fingerprint',
  'retrievedAt',
  'providerRequestId',
  'location',
] as const

export function parseResearchSource(raw: string): ResearchSource {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new DatabaseError('SESSION_CORRUPT', 'Stored research source does not match the supported format')
  }
  if (
    !isRecord(parsed) ||
    !hasOnlyKeys(parsed, researchSourceKeys) ||
    typeof parsed.sourceId !== 'string' ||
    parsed.version !== 1 ||
    parsed.kind !== 'research' ||
    parsed.provider !== 'tavily' ||
    typeof parsed.query !== 'string' ||
    typeof parsed.title !== 'string' ||
    typeof parsed.url !== 'string' ||
    typeof parsed.content !== 'string' ||
    parsed.partial !== true ||
    typeof parsed.fingerprint !== 'string' ||
    typeof parsed.retrievedAt !== 'string' ||
    (parsed.providerRequestId !== undefined && typeof parsed.providerRequestId !== 'string') ||
    !isRecord(parsed.location) ||
    !hasOnlyKeys(parsed.location, ['kind', 'start', 'end']) ||
    parsed.location.kind !== 'research-result' ||
    parsed.location.start !== 0 ||
    typeof parsed.location.end !== 'number' ||
    !Number.isSafeInteger(parsed.location.end) ||
    parsed.location.end < 0
  ) {
    throw new DatabaseError('SESSION_CORRUPT', 'Stored research source does not match the supported format')
  }
  return {
    sourceId: parsed.sourceId,
    version: 1,
    kind: 'research',
    provider: 'tavily',
    query: parsed.query,
    title: parsed.title,
    url: parsed.url,
    content: parsed.content,
    partial: true,
    fingerprint: parsed.fingerprint,
    retrievedAt: parsed.retrievedAt,
    ...(parsed.providerRequestId !== undefined ? { providerRequestId: parsed.providerRequestId } : {}),
    location: { kind: 'research-result', start: 0, end: parsed.location.end },
  }
}
