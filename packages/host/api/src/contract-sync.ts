import type {
  ActivityStatus as HostActivityStatus,
  ApprovalView as HostApprovalView,
  ModelSelection as HostModelSelection,
  RequestEvent as HostRequestEvent,
  RequestEventBody as HostRequestEventBody,
  RequestStatus as HostRequestStatus,
  StoredActivity,
  StoredRequest,
  TerminalStatus as HostTerminalStatus,
} from '@deckagent/host-contracts'
import type {
  ActivityStatus as PersistedActivityStatus,
  ApprovalView as PersistedApprovalView,
  ModelSelection as PersistedModelSelection,
  RequestEvent as PersistedRequestEvent,
  RequestEventBody as PersistedRequestEventBody,
  RequestRecord,
  RequestStatus as PersistedRequestStatus,
  SqliteSessionStore,
  TerminalStatus as PersistedTerminalStatus,
} from '@deckagent/session-persistence'

type PersistedActivityRecord = ReturnType<SqliteSessionStore['requests']['activities']>[number]

type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never

type AllSynced = AssertEqual<HostModelSelection, PersistedModelSelection> &
  AssertEqual<HostRequestStatus, PersistedRequestStatus> &
  AssertEqual<HostActivityStatus, PersistedActivityStatus> &
  AssertEqual<HostTerminalStatus, PersistedTerminalStatus> &
  AssertEqual<HostRequestEventBody, PersistedRequestEventBody> &
  AssertEqual<HostApprovalView, PersistedApprovalView> &
  AssertEqual<HostRequestEvent, PersistedRequestEvent> &
  AssertEqual<StoredRequest, RequestRecord> &
  AssertEqual<StoredActivity, PersistedActivityRecord>

export type ContractSyncVerified = [AllSynced] extends [true] ? ([true] extends [AllSynced] ? true : never) : never
