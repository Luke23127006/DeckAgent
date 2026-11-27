import { useEffect, useRef } from 'react'
import { mountLegacyBrowser } from '../browser/boot.ts'
import { useHostConnection } from '../hooks/use-host-connection.ts'

/** Mounts the legacy screens into the `#app` element and removes them when React unmounts the page. */
export function LegacyBrowserMount(props: {
  readonly initialSessionId?: string
  readonly openSettings?: boolean
  readonly onMissingSession?: () => void
}) {
  const { initialSessionId, openSettings, onMissingSession } = props
  const containerRef = useRef<HTMLElement>(null)
  const connection = useHostConnection()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    return mountLegacyBrowser(container, {
      origin: connection.origin,
      token: connection.token,
      ...(initialSessionId === undefined ? {} : { initialSessionId }),
      ...(openSettings === undefined ? {} : { openSettings }),
      ...(onMissingSession === undefined ? {} : { onMissingSession }),
    })
  }, [connection.origin, connection.token, initialSessionId, openSettings, onMissingSession])

  return <main id="app" ref={containerRef} />
}
