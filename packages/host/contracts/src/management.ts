import type { AttachmentView, ModelSelection } from './requests.ts'

/** API protocols of BR-005 V-4. */
export type ProviderProtocol = 'chat-completions' | 'responses' | 'anthropic-messages' | 'gemini'

export interface ProviderSettings {
  readonly id: string
  readonly displayName: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  readonly models: readonly string[]
  /** Whether a key is saved. No part of a key is ever returned (FR-040). */
  readonly hasKey: boolean
  /** The saved key can be read on this computer and account. */
  readonly keyAvailable: boolean
  readonly builtIn: boolean
}

export interface WebSettings {
  readonly research?: {
    readonly provider: 'tavily'
    readonly configured: boolean
    readonly environmentKey: boolean
    readonly freeOnly: true
  }
  readonly providers: readonly ProviderSettings[]
  /** The version of the provider configurations; a provider write increases it once. */
  readonly providersVersion: number
  /** The credential store of this computer can keep keys. */
  readonly persistentKeys: boolean
  readonly builtIns: readonly ProviderTemplate[]
  /** Whether the Agent runtime can run requests, and why not. */
  readonly runtime: { readonly available: boolean; readonly reason?: string }
}

export interface ProviderTemplate {
  readonly id: string
  readonly displayName: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  /** What the user gives for this provider (BR-006). */
  readonly needs: readonly ('key' | 'baseUrl')[]
}

export interface WebSession {
  /** Derived from the first user message; absent on older Hosts. */
  readonly title?: string
  /** True only when at least one slide has a published revision. */
  readonly hasSlides?: boolean
  readonly sessionId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly messageCount: number
  readonly selection?: ModelSelection
  /** The selected model was removed; the chat has no selected model (FR-065). */
  readonly removedSelection?: ModelSelection
  readonly selectable: boolean
  readonly activeRequestId?: string
  /** Workspace of the chat; `null` for an ungrouped chat. */
  readonly workspaceId: string | null
  /** False when the saved work of the chat cannot be read; the chat stays listed (FR-050). */
  readonly readable: boolean
  /** True while the Host keeps a non-empty draft for the chat. */
  readonly hasDraft?: boolean
}

export type WorkspaceFolderStatus = 'none' | 'available' | 'unreadable' | 'different-folder'

/** Browser projection of a workspace. The folder path is shown to the user who chose it, on the local Host only. */
export interface WorkspaceView {
  readonly id: string
  readonly name: string
  readonly folder: string | null
  readonly isDefault: boolean
  readonly folderStatus: WorkspaceFolderStatus
}

export interface WorkspaceList {
  readonly workspaces: readonly WorkspaceView[]
  /** The workspace in use. */
  readonly selectedId: string
  readonly version: number
}

export interface ChatDraft {
  readonly sessionId: string
  readonly text: string
  readonly attachmentIds?: readonly string[]
  readonly revision?: number
  readonly attachments?: readonly AttachmentView[]
}

/** Interface preferences kept by the Host, so they survive a change of origin (the local port is random). */
export interface WebPreferences {
  readonly theme: 'light' | 'dark' | 'system'
}
