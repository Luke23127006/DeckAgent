import type { WebSession } from '@deckagent/host-contracts'
import { useLocation, useNavigate } from 'react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { mountLegacyBrowser } from '../browser/boot.ts'
import type { LegacyBrowser, LegacyNavigationState } from '../browser/boot.ts'
import { useHostConnection } from '../hooks/use-host-connection.ts'
import { useRefreshChatList } from '../hooks/use-chats.ts'
import { useWorkspaces } from '../hooks/use-workspaces.ts'
import { ChatSidebar } from './chat-sidebar.tsx'
import type { ChatSidebarSlots } from './chat-sidebar.tsx'

const initialNavigation: LegacyNavigationState = {
  currentSessionId: undefined,
  locked: true,
  busy: true,
  draftIds: [],
}

function createSlots(): ChatSidebarSlots {
  return {
    workspaces: document.createElement('div'),
    search: document.createElement('div'),
    chats: document.createElement('nav'),
  }
}

/**
 * Mounts the legacy screens into the `#app` element and removes them when React unmounts the page. React renders the
 * workspace controls and the chat list into slots of the legacy navigation, and the legacy screens open the chat.
 */
export function LegacyBrowserMount(props: {
  readonly initialSessionId?: string
  readonly onMissingSession?: () => void
}) {
  const { initialSessionId, onMissingSession } = props
  const navigate = useNavigate()
  const { hash } = useLocation()
  const containerRef = useRef<HTMLElement>(null)
  const legacyRef = useRef<LegacyBrowser>(undefined)
  const [slots] = useState(createSlots)
  const [navigation, setNavigation] = useState(initialNavigation)
  const connection = useHostConnection()
  const refreshChatList = useRefreshChatList()
  const workspaces = useWorkspaces()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const legacy = mountLegacyBrowser(container, {
      origin: connection.origin,
      token: connection.token,
      slots,
      ...(initialSessionId === undefined ? {} : { initialSessionId }),
      onOpenSettings: sessionId =>
        navigate({ pathname: '/settings', hash }, { state: { returnTo: sessionId ? '/chats/' + sessionId : '/' } }),
      ...(onMissingSession === undefined ? {} : { onMissingSession }),
      onNavigationChange: setNavigation,
      onChatsRefreshed: refreshChatList,
    })
    legacyRef.current = legacy
    return () => {
      legacyRef.current = undefined
      legacy.dispose()
    }
  }, [connection.origin, connection.token, initialSessionId, onMissingSession, navigate, hash, slots, refreshChatList])

  // The legacy screens need the workspace in use, because a new chat joins it.
  useEffect(() => {
    if (workspaces.data) legacyRef.current?.setWorkspaces(workspaces.data)
  }, [workspaces.data])

  const openChat = useCallback((chat: WebSession) => legacyRef.current?.openChat(chat), [])

  return (
    <>
      <main id="app" ref={containerRef} />
      <ChatSidebar slots={slots} open={navigation} busy={navigation.busy} onOpen={openChat} />
    </>
  )
}
