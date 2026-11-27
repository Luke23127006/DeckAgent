import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './layouts/app-shell.tsx'
import { ChatPage } from './pages/chat/chat-page.tsx'
import { HomePage } from './pages/home/home-page.tsx'
import { SettingsPage } from './pages/settings/settings-page.tsx'

/** The declarative route tree of the Browser. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/chats/:sessionId" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
