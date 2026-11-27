import { useLocation } from 'react-router'
import { ChatScreen } from '../../components/chat-screen.tsx'
import { appText } from '../../text.ts'

/** The home route: the shell plus a notice when a chat URL had no chat to open. */
export function HomePage() {
  const state: unknown = useLocation().state
  const missingChat =
    typeof state === 'object' && state !== null && 'missingChat' in state && state.missingChat === true
  return (
    <>
      {missingChat && <p role="status">{appText.missingChat}</p>}
      <ChatScreen />
    </>
  )
}
