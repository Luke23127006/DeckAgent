import type { StepApproval } from '@deckagent/host-api'

export function stepApproval(value: unknown): StepApproval {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_RESPONSE')
  const item = value as Record<string, unknown>
  if (
    typeof item.approvalId !== 'string' ||
    typeof item.requestId !== 'string' ||
    typeof item.sessionId !== 'string' ||
    typeof item.version !== 'number' ||
    !Number.isSafeInteger(item.version) ||
    item.version < 1 ||
    item.action !== 'read' ||
    typeof item.target !== 'string' ||
    !item.target ||
    typeof item.reason !== 'string' ||
    typeof item.continuing !== 'boolean'
  )
    throw new Error('INVALID_RESPONSE')
  return {
    approvalId: item.approvalId,
    requestId: item.requestId,
    sessionId: item.sessionId,
    version: item.version,
    action: 'read',
    target: item.target,
    reason: item.reason,
    continuing: item.continuing,
  }
}
