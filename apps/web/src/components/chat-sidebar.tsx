import type { WebSession } from '@deckagent/host-contracts'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChatList } from './chat-list.tsx'
import type { OpenChatState } from './chat-list.tsx'
import { ChatSearch } from './chat-search.tsx'
import { WorkspaceControls } from './workspace-controls.tsx'

/** The places in the legacy navigation where React renders. The legacy shell places them in order. */
export interface ChatSidebarSlots {
  readonly workspaces: HTMLElement
  readonly search: HTMLElement
  readonly chats: HTMLElement
}

/**
 * The workspace controls, the chat search and the chat list. They render into the legacy navigation until the app
 * shell owns the sidebar; the conversation screen stays legacy until Phase 5.
 */
export function ChatSidebar(props: {
  readonly slots: ChatSidebarSlots
  readonly open: OpenChatState
  readonly busy: boolean
  readonly onOpen: (chat: WebSession) => void
}) {
  const { slots } = props
  const [words, setWords] = useState('')
  return (
    <>
      {createPortal(<WorkspaceControls busy={props.busy} />, slots.workspaces)}
      {createPortal(<ChatSearch onWords={setWords} />, slots.search)}
      {createPortal(<ChatList words={words} open={props.open} onOpen={props.onOpen} />, slots.chats)}
    </>
  )
}
