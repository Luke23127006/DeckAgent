import type { DeckStore } from '@deckagent/deck'
import type { RequestAdmission } from '@deckagent/host-api'
import type {
  AgentRequest,
  BriefView,
  ConfirmationResult,
  DeckChange,
  DeckSnapshot,
  InterviewState,
  OutlineSnapshot,
  RequestSnapshot,
  SlideContent,
} from '@deckagent/host-contracts'
import type { BriefCoordinator } from './brief-coordinator.ts'
import type { ConfirmationCoordinator } from './confirmation-coordinator.ts'

export interface DeckOperations {
  confirm(
    sessionId: string,
    value: unknown,
    submit: (request: AgentRequest, options: RequestAdmission) => Promise<RequestSnapshot>,
  ): Promise<ConfirmationResult>
  interview(sessionId: string): Promise<{ readonly brief: BriefView; readonly state: InterviewState }>
  getBrief(sessionId: string, version?: number): Promise<BriefView>
  saveBrief(sessionId: string, value: unknown): Promise<BriefView>
  snapshot(sessionId: string): DeckSnapshot
  content(sessionId: string, slideId: string, revision: number): SlideContent
  subscribe(sessionId: string, listener: (change: DeckChange) => void): () => void
  outlineImagePreview(sessionId: string, outlineId: string, needId: string): Uint8Array
  outlineSnapshot(sessionId: string): OutlineSnapshot
}

export function createDeckOperations(
  decks: DeckStore,
  briefs: BriefCoordinator,
  confirmations: ConfirmationCoordinator,
): DeckOperations {
  return {
    confirm: (sessionId, value, submit) => confirmations.confirm(sessionId, value, submit),
    interview: sessionId => briefs.interview(sessionId),
    getBrief: (sessionId, version) => briefs.get(sessionId, version),
    saveBrief: (sessionId, value) => briefs.save(sessionId, value),
    snapshot: sessionId => decks.snapshot(sessionId),
    content: (sessionId, slideId, revision) => decks.content(sessionId, slideId, revision),
    subscribe: (sessionId, listener) => decks.subscribe(sessionId, listener),
    outlineImagePreview: (sessionId, outlineId, needId) => decks.outlineImagePreview(sessionId, outlineId, needId),
    outlineSnapshot: sessionId => decks.outlineSnapshot(sessionId),
  }
}
