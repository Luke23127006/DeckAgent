import type {
  ActivityStatus as HostActivityStatus,
  ApprovalView as HostApprovalView,
  BriefDraft as HostBriefDraft,
  BriefRecord as HostBriefRecord,
  BriefSnapshot as HostBriefSnapshot,
  BriefSourceRef as HostBriefSourceRef,
  ConfirmationReceipt as HostConfirmationReceipt,
  ConfirmationTarget as HostConfirmationTarget,
  DeckChange as HostDeckChange,
  DeckSnapshot as HostDeckSnapshot,
  ImageCredit as HostImageCredit,
  InterviewState as HostInterviewState,
  ModelSelection as HostModelSelection,
  OutlineProposal as HostOutlineProposal,
  OutlineSnapshot as HostOutlineSnapshot,
  RequestEvent as HostRequestEvent,
  RequestEventBody as HostRequestEventBody,
  RequestStatus as HostRequestStatus,
  SlideContent as HostSlideContent,
  StoredActivity,
  StoredRequest,
  TerminalStatus as HostTerminalStatus,
} from '@deckagent/host-contracts'
import type {
  BriefDraft as DeckBriefDraft,
  BriefSourceRef as DeckBriefSourceRef,
  ConfirmationReceipt as DeckConfirmationReceipt,
  DeckChange as DeckDeckChange,
  DeckReader,
  DeckStore,
  ImageCredit as DeckImageCredit,
  InterviewState as DeckInterviewState,
  OutlineReader,
} from '@deckagent/deck'
import type {
  ActivityRecord as PersistedActivityRecord,
  ActivityStatus as PersistedActivityStatus,
  ApprovalView as PersistedApprovalView,
  ModelSelection as PersistedModelSelection,
  RequestEvent as PersistedRequestEvent,
  RequestEventBody as PersistedRequestEventBody,
  RequestRecord,
  RequestStatus as PersistedRequestStatus,
  TerminalStatus as PersistedTerminalStatus,
} from './db/index.ts'

type PersistedStoredRequest = Omit<RequestRecord, 'owner'> & { readonly sessionId: string }

type DeckDeckSnapshot = ReturnType<DeckReader['snapshot']>
type DeckSlideContent = ReturnType<DeckReader['content']>
type DeckOutlineSnapshot = ReturnType<OutlineReader['outlineSnapshot']>
type DeckOutlineProposal = DeckOutlineSnapshot['proposals'][number]
type DeckBriefRecord = NonNullable<DeckOutlineProposal['brief']>
type DeckBriefSnapshot = ReturnType<DeckStore['briefSnapshot']>
type DeckConfirmationTarget = Pick<
  DeckConfirmationReceipt,
  'confirmationId' | 'outlineId' | 'outlineVersion' | 'briefId' | 'briefVersion'
>
type HostContentBlock = NonNullable<HostOutlineProposal['slides'][number]['blocks']>[number]
type DeckContentBlock = NonNullable<DeckOutlineProposal['slides'][number]['blocks']>[number]
type HostWebImageIntent = NonNullable<Extract<HostContentBlock, { kind: 'web-image' }>['intent']>
type DeckWebImageIntent = NonNullable<Extract<DeckContentBlock, { kind: 'web-image' }>['intent']>
type HostLayoutIssue = NonNullable<HostOutlineProposal['layoutIssues']>[number]
type DeckLayoutIssue = NonNullable<DeckOutlineProposal['layoutIssues']>[number]

type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never

type AllSynced = AssertEqual<HostModelSelection, PersistedModelSelection> &
  AssertEqual<HostRequestStatus, PersistedRequestStatus> &
  AssertEqual<HostActivityStatus, PersistedActivityStatus> &
  AssertEqual<HostTerminalStatus, PersistedTerminalStatus> &
  AssertEqual<HostRequestEventBody, PersistedRequestEventBody> &
  AssertEqual<HostApprovalView, PersistedApprovalView> &
  AssertEqual<HostRequestEvent, PersistedRequestEvent> &
  AssertEqual<StoredRequest, PersistedStoredRequest> &
  AssertEqual<StoredActivity, PersistedActivityRecord> &
  AssertEqual<HostBriefDraft, DeckBriefDraft> &
  AssertEqual<HostBriefRecord, DeckBriefRecord> &
  AssertEqual<HostBriefSnapshot, DeckBriefSnapshot> &
  AssertEqual<HostBriefSourceRef, DeckBriefSourceRef> &
  AssertEqual<HostConfirmationReceipt, DeckConfirmationReceipt> &
  AssertEqual<HostConfirmationTarget, DeckConfirmationTarget> &
  AssertEqual<HostDeckChange, DeckDeckChange> &
  AssertEqual<HostDeckSnapshot, DeckDeckSnapshot> &
  AssertEqual<HostImageCredit, DeckImageCredit> &
  AssertEqual<HostInterviewState, DeckInterviewState> &
  AssertEqual<HostOutlineProposal, DeckOutlineProposal> &
  AssertEqual<HostOutlineSnapshot, DeckOutlineSnapshot> &
  AssertEqual<HostSlideContent, DeckSlideContent> &
  AssertEqual<HostContentBlock, DeckContentBlock> &
  AssertEqual<HostWebImageIntent, DeckWebImageIntent> &
  AssertEqual<HostLayoutIssue, DeckLayoutIssue>

export type ContractSyncVerified = [AllSynced] extends [true] ? ([true] extends [AllSynced] ? true : never) : never
