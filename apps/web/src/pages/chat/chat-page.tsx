import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ChatScreen } from '../../components/chat-screen.tsx'

/** The chat route: opens the chat in the URL, or returns home with the missing-chat notice. */
export function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const onMissingChat = useCallback(() => navigate('/', { replace: true, state: { missingChat: true } }), [navigate])
  return <ChatScreen key={sessionId} initialSessionId={sessionId ?? ''} onMissingChat={onMissingChat} />
}
