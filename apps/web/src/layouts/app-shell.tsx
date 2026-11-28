import { useRef } from 'react'
import { Outlet } from 'react-router'
import { useChangeFeed } from '../hooks/use-change-feed.ts'
import { useHostConnection } from '../hooks/use-host-connection.ts'
import { useBackdrop } from '../hooks/use-preferences.ts'

/** The route frame: one full-height page under the Host connection and its change feed, over the backdrop. */
export function AppShell() {
  const connection = useHostConnection()
  const backdrop = useRef<HTMLCanvasElement>(null)
  useChangeFeed({ enabled: connection.token.length > 0 })
  useBackdrop(backdrop)
  return (
    <>
      <canvas ref={backdrop} id="backdrop" aria-hidden="true" />
      <div className="h-dvh w-full">
        <Outlet />
      </div>
    </>
  )
}
