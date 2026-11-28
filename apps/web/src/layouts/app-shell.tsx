import { Outlet } from 'react-router'
import { useChangeFeed } from '../hooks/use-change-feed.ts'
import { useHostConnection } from '../hooks/use-host-connection.ts'

/** The route frame: one full-height page under the Host connection and its change feed. */
export function AppShell() {
  const connection = useHostConnection()
  useChangeFeed({ enabled: connection.token.length > 0 })
  return (
    <div className="h-dvh w-full">
      <Outlet />
    </div>
  )
}
