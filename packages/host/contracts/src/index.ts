export type {
  BriefDraft,
  BriefRecord,
  BriefSnapshot,
  BriefSourceRef,
  BriefView,
  InterviewState,
} from './brief.ts'
export type {
  ConfirmationReceipt,
  ConfirmationTarget,
  DeckChange,
  DeckSnapshot,
  ImageCredit,
  OutlineProposal,
  OutlineSnapshot,
  SlideContent,
} from './deck.ts'
export type {
  ProviderProtocol,
  ProviderSettings,
  ProviderTemplate,
  WebPreferences,
  WebSession,
  WebSettings,
  WorkspaceFolderStatus,
  WorkspaceList,
  WorkspaceView,
  ChatDraft,
} from './management.ts'
export { providerProtocols } from './management.ts'
export { decodeSettings, decodePreferences, decodeCatalog, decodeSettingsSaved } from './settings-validation.ts'
export { decodeChat, decodeChatList, decodeWorkspaceList } from './chat-list-validation.ts'
export {
  decodeAttachmentUpload,
  decodeChatDraft,
  decodeHistory,
  decodePreviewText,
  decodeRequestSnapshot,
  decodeResearchSources,
  decodeStoredActivities,
  decodeStoredRequests,
  type ResearchSource,
} from './conversation-validation.ts'
export type {
  ActivityStatus,
  AgentRequest,
  ApprovalView,
  AttachmentView,
  ConfirmationResult,
  DeckRequest,
  HistoryMessage,
  ModelSelection,
  RequestEvent,
  RequestEventBody,
  RequestSnapshot,
  RequestStatus,
  StoredActivity,
  StoredRequest,
  TerminalStatus,
} from './requests.ts'
export {
  decodeAgentRequest,
  decodeApprovalDecisionBody,
  decodeApprovalView,
  decodeAttachment,
  requestEvent,
  RequestValidationError,
  type RequestValidationCode,
} from './request-validation.ts'
export { decodeChatCreateBody, decodeChatSearchBody, decodeModelSelection } from './chat-validation.ts'
export {
  decodeAttachmentRemoveBody,
  decodeDraftSaveBody,
  type DraftSaveBody,
} from './attachment-validation.ts'
export { decodeBriefView } from './brief-validation.ts'
export { decodeBoundProposal } from './outline-validation.ts'
export { decodeGeneration } from './generation-validation.ts'
export {
  decodeConfirmationResult,
  decodeDeckChange,
  decodeDeckSnapshot,
  decodeInterview,
  decodeOutlineSnapshot,
  decodeSlideContent,
  type InterviewView,
} from './deck-validation.ts'
export { decodeChangeNotice, type ChangeNotice, type ChangeTopic, type PublishChange } from './changes.ts'
export {
  decodeProviderRemoveBody,
  decodeProviderSaveBody,
} from './provider-validation.ts'
export {
  decodeWorkspaceAddBody,
  decodeWorkspaceRelinkBody,
  decodeWorkspaceRemoveBody,
  decodeWorkspaceRenameBody,
  decodeWorkspaceSelectBody,
} from './workspace-validation.ts'
export {
  decodePreferencesSaveBody,
  decodeResearchSaveBody,
  decodeResearchRemoveBody,
  type ResearchSaveBody,
  type PreferencesSaveBody,
} from './preferences-validation.ts'
