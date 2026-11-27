import { useLayoutEffect } from 'react'
import { settingsText } from '../text.ts'

let guardNavigation: ((event: PopStateEvent) => void) | undefined

export function installSettingsNavigation(): void {
  // React Router can unmount a route inside its popstate listener. Register this listener before the router starts.
  window.addEventListener('popstate', event => guardNavigation?.(event), true)
}

function historyIndex(): number | undefined {
  const state: unknown = window.history.state
  return state && typeof state === 'object' && 'idx' in state && typeof state.idx === 'number' ? state.idx : undefined
}

export function useSettingsNavigation(dirty: boolean, busy: boolean): void {
  useLayoutEffect(() => {
    if (!dirty && !busy) return
    const index = historyIndex()
    let restoring = false
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    function popstate(event: PopStateEvent) {
      if (restoring) {
        restoring = false
        event.stopImmediatePropagation()
        return
      }
      const next = historyIndex()
      if (index === undefined || next === undefined || index === next) return
      if (!busy && window.confirm(settingsText.discard)) return
      event.stopImmediatePropagation()
      restoring = true
      window.history.go(index - next)
    }
    guardNavigation = popstate
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      if (guardNavigation === popstate) guardNavigation = undefined
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [dirty, busy])
}
