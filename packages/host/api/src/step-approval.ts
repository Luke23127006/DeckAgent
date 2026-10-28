import type { StepApproval } from './contracts.ts'
import { HttpError } from './http-error.ts'

export function validateStepApproval(value: unknown): StepApproval {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'INVALID_APPROVAL')
  const item = value as Record<string, unknown>
  if (
    typeof item.approvalId !== 'string' ||
    !/^[\w-]{1,100}$/.test(item.approvalId) ||
    typeof item.requestId !== 'string' ||
    !/^[\w-]{1,100}$/.test(item.requestId) ||
    typeof item.sessionId !== 'string' ||
    !/^[\w-]{1,100}$/.test(item.sessionId) ||
    typeof item.version !== 'number' ||
    !Number.isSafeInteger(item.version) ||
    item.version < 1 ||
    item.action !== 'read' ||
    typeof item.target !== 'string' ||
    !item.target ||
    item.target.length > 4096 ||
    typeof item.reason !== 'string' ||
    item.reason.length > 500 ||
    typeof item.continuing !== 'boolean'
  )
    throw new HttpError(400, 'INVALID_APPROVAL')
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
