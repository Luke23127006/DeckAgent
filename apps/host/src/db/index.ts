import { SessionError } from './contracts.ts'

export { SessionDatabase } from './session-database.ts'
export { SqliteRunStore, summarizedNotice } from './run-store.ts'
export type { RunAdmitInput, RunStoreHooks } from './run-store.ts'
export { defaultWorkspaceId } from './sessions-schema.ts'
export { SessionError, isAttachmentPreparation } from './contracts.ts'
export type {
  ActivityRecord,
  ActivityStatus,
  ApprovalView,
  AttachmentPreparation,
  AttachmentRecord,
  ChatSummary,
  JsonValue,
  Message,
  ModelSelection,
  ProviderState,
  RequestEvent,
  RequestEventBody,
  RequestRecord,
  RequestStatus,
  ResearchSource,
  RuntimeBinding,
  SessionInfo,
  SourceRef,
  TerminalStatus,
  ToolCall,
} from './contracts.ts'

export function mapSessionFailure(error: unknown): { readonly status: number; readonly code: string } | undefined {
  if (!(error instanceof SessionError)) return undefined
  if (error.code === 'SESSION_NOT_FOUND') return { status: 404, code: 'SESSION_NOT_FOUND' }
  if (error.code === 'SESSION_CORRUPT') return { status: 409, code: 'CHAT_UNREADABLE' }
  if (error.code === 'DRAFT_TOO_LARGE') return { status: 413, code: 'DRAFT_TOO_LARGE' }
  return undefined
}
