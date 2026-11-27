import type { WebSession } from '@deckagent/host-contracts'
import { useChatSearch, useChats } from '../hooks/use-chats.ts'
import { useWorkspaces } from '../hooks/use-workspaces.ts'
import { chatListText } from '../text.ts'

/** The state of the open chat that the legacy conversation screen owns until Phase 5. */
export interface OpenChatState {
  readonly currentSessionId: string | undefined
  /** An open or a send in progress blocks switching (UC-003 A13). */
  readonly locked: boolean
  /** The chats with draft text that the conversation screen has not saved yet. */
  readonly draftIds: readonly string[]
}

function slidesText(chat: WebSession): string {
  if (!chat.readable) return chatListText.unreadable
  if (chat.hasSlides === undefined) return chatListText.slidesUnknown
  return chat.hasSlides ? chatListText.hasSlides : chatListText.noSlides
}

function chatName(chat: WebSession): string {
  if (!chat.readable) return chatListText.unreadableName
  if (!chat.messageCount) return chatListText.newChat
  return chat.title ?? chatListText.untitled
}

function ChatButton(props: {
  readonly chat: WebSession
  readonly current: boolean
  readonly disabled: boolean
  readonly onOpen: (chat: WebSession) => void
}) {
  const { chat } = props
  const date = new Date(chat.updatedAt)
  const updated = Number.isNaN(date.getTime()) ? chatListText.unknownTime : date.toLocaleString('vi-VN')
  const slides = slidesText(chat)
  const name = chatName(chat)
  return (
    <button
      type="button"
      title={`${name} · ${updated} · ${slides}`}
      data-session-id={chat.sessionId}
      data-unreadable={chat.readable ? undefined : 'true'}
      aria-current={props.current ? 'true' : 'false'}
      disabled={props.disabled}
      onClick={() => props.onOpen(chat)}
    >
      <strong>{name}</strong>
      <time dateTime={chat.updatedAt}>{updated}</time>
      <small>{`${slides}${chat.activeRequestId ? chatListText.working : ''}`}</small>
    </button>
  )
}

/**
 * The chats of the workspace in use, then the ungrouped chats (UC-006 S1). With search words, only the chats that
 * hold the words (FR-134). Each chat keeps its place when opened; a new chat has the newest time, so it lists first.
 */
export function ChatList(props: {
  readonly words: string
  readonly open: OpenChatState
  readonly onOpen: (chat: WebSession) => void
}) {
  const { words, open } = props
  const chats = useChats()
  const found = useChatSearch(words)
  const workspaces = useWorkspaces()
  const selectedId = workspaces.data?.selectedId ?? 'default'
  const foundIds = words && found.data ? new Set(found.data.map(chat => chat.sessionId)) : undefined
  const listed = (chat: WebSession) =>
    chat.sessionId === open.currentSessionId ||
    !!chat.messageCount ||
    !!chat.selection ||
    !!chat.hasSlides ||
    !chat.readable ||
    !!chat.hasDraft ||
    open.draftIds.includes(chat.sessionId)
  const visible = (chats.data ?? [])
    .filter(chat => (foundIds ? foundIds.has(chat.sessionId) : listed(chat)))
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.sessionId.localeCompare(b.sessionId))
  const grouped = visible.filter(chat => chat.workspaceId === selectedId)
  const ungrouped = visible.filter(chat => chat.workspaceId === null)
  const button = (chat: WebSession) => (
    <ChatButton
      key={chat.sessionId}
      chat={chat}
      current={chat.sessionId === open.currentSessionId}
      disabled={open.locked}
      onOpen={props.onOpen}
    />
  )
  if (!grouped.length && !ungrouped.length) return <p>{foundIds ? chatListText.noMatch : chatListText.empty}</p>
  return (
    <>
      {grouped.map(button)}
      {ungrouped.length > 0 && (
        <>
          <h3 className="chat-group-heading mt-2.5 mb-1 text-xs opacity-80">{chatListText.ungrouped}</h3>
          {ungrouped.map(button)}
        </>
      )}
    </>
  )
}
