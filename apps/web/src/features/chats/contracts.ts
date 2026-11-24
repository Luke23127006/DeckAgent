import type { ModelSelection, WebSession } from '@deckagent/host-contracts'

export type ChatWorkflowErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'MODEL_NOT_SELECTABLE'
  | 'CHAT_UNREADABLE'
  | 'DRAFT_TOO_LARGE'

export type ChatWorkflowErrorDetail = Readonly<Record<string, string | boolean>>

export class ChatWorkflowError extends Error {
  constructor(
    readonly code: ChatWorkflowErrorCode,
    readonly detail?: ChatWorkflowErrorDetail,
  ) {
    super(code)
  }
}

export interface ChatOperations {
  create(selection?: ModelSelection): Promise<WebSession>
  selectModel(id: string, selection: ModelSelection): Promise<WebSession>
  list(): Promise<readonly WebSession[]>
  search(words: string): Promise<readonly WebSession[]>
}
