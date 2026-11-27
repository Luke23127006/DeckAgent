import { useLocation, useNavigate } from 'react-router'
import { useEffect, useRef } from 'react'
import { mountLegacyBrowser } from '../browser/boot.ts'
import { useHostConnection } from '../hooks/use-host-connection.ts'

/** Mounts the legacy screens into the `#app` element and removes them when React unmounts the page. */
export function LegacyBrowserMount(props: {
  readonly initialSessionId?: string
  readonly onMissingSession?: () => void
}) {
  const { initialSessionId, onMissingSession } = props
  const navigate = useNavigate()
  const { hash } = useLocation()
  const containerRef = useRef<HTMLElement>(null)
  const connection = useHostConnection()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    return mountLegacyBrowser(container, {
      origin: connection.origin,
      token: connection.token,
      ...(initialSessionId === undefined ? {} : { initialSessionId }),
      onOpenSettings: sessionId =>
        navigate({ pathname: '/settings', hash }, { state: { returnTo: sessionId ? '/chats/' + sessionId : '/' } }),
      ...(onMissingSession === undefined ? {} : { onMissingSession }),
    })
  }, [connection.origin, connection.token, initialSessionId, onMissingSession, navigate, hash])

  return <main id="app" ref={containerRef} />
}
