import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { LegacyBrowserMount } from '../../components/legacy-browser-mount.tsx'

/** The chat route: opens the chat in the URL, or returns home with the missing-chat notice. */
export function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const onMissingSession = useCallback(() => navigate('/', { replace: true, state: { missingChat: true } }), [navigate])
  return <LegacyBrowserMount initialSessionId={sessionId ?? ''} onMissingSession={onMissingSession} />
}
