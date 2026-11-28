import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'

interface Bounds {
  readonly minimum: number
  readonly maximum: number
}

interface Drag {
  readonly pointer: number
  readonly start: number
  readonly width: number
  readonly overlay: HTMLElement
  readonly control: AbortController
}

const compactWidth = 720

function bounds(container: HTMLElement): Bounds {
  const navigation = document.querySelector('.chat-navigation')?.getBoundingClientRect().width ?? 0
  const maximum = Math.max(
    1,
    Math.floor(
      Math.min(1000, innerWidth - navigation - 320, Number.parseFloat(getComputedStyle(container).maxWidth) || 1000),
    ),
  )
  return { minimum: Math.min(320, maximum), maximum }
}

interface ResizerOptions {
  readonly initial: number
  readonly save: (width: number) => void
  readonly valueText: (width: number) => string
}

/**
 * The divider on the left edge of a side panel. A drag or the arrow keys change the width of the panel; the width stays
 * between 320 pixels and the space that the conversation leaves free. `save` keeps the width after a drag or a key. The
 * narrow layout stacks the panel, so the divider does nothing there. The panel starts at `initial` once.
 */
export function usePanelResizer(options: ResizerOptions): {
  readonly container: RefObject<HTMLElement | null>
  readonly divider: RefObject<HTMLDivElement | null>
} {
  const container = useRef<HTMLElement>(null)
  const divider = useRef<HTMLDivElement>(null)
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  useEffect(() => {
    const panel = container.current
    const handle = divider.current
    if (!panel || !handle) return

    const save = (width: number) => latest.current.save(width)
    const valueText = (width: number) => latest.current.valueText(width)
    let preferred = latest.current.initial
    let drag: Drag | undefined
    const render = () => {
      const { minimum, maximum } = bounds(panel)
      const width = Math.round(Math.max(minimum, Math.min(maximum, preferred)))
      panel.style.width = `${width}px`
      handle.tabIndex = innerWidth <= compactWidth ? -1 : 0
      handle.setAttribute('aria-valuemin', String(minimum))
      handle.setAttribute('aria-valuemax', String(maximum))
      handle.setAttribute('aria-valuenow', String(width))
      handle.setAttribute('aria-valuetext', valueText(width))
    }
    const resize = (width: number) => {
      const { minimum, maximum } = bounds(panel)
      preferred = Math.round(Math.max(minimum, Math.min(maximum, width)))
      render()
    }
    const finish = () => {
      if (!drag) return
      const active = drag
      drag = undefined
      active.control.abort()
      active.overlay.remove()
      document.body.classList.remove('deck-resizing')
      save(preferred)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || innerWidth <= compactWidth || drag) return

      event.preventDefault()
      handle.focus()
      const overlay = document.createElement('div')
      overlay.className = 'deck-resize-overlay'
      const control = new AbortController()
      const session: Drag = {
        pointer: event.pointerId,
        start: event.clientX,
        width: panel.getBoundingClientRect().width,
        overlay,
        control,
      }
      drag = session
      document.body.classList.add('deck-resizing')
      document.body.append(overlay)

      // The window listens, not the divider: a pointer capture can be lost over the opaque iframe of a slide.
      window.addEventListener(
        'pointermove',
        move => {
          if (drag?.pointer !== move.pointerId) return
          if (!move.buttons) {
            finish()
            return
          }
          resize(session.width + session.start - move.clientX)
        },
        { capture: true, signal: control.signal },
      )

      window.addEventListener(
        'pointerup',
        release => {
          if (drag?.pointer !== release.pointerId) return
          // The last move can be merged or left out, so the release position sets the width before the save.
          resize(session.width + session.start - release.clientX)
          finish()
        },
        { capture: true, signal: control.signal },
      )

      window.addEventListener('pointercancel', finish, { capture: true, signal: control.signal })
      window.addEventListener('blur', finish, { signal: control.signal })
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (innerWidth <= compactWidth) return

      const current = panel.getBoundingClientRect().width
      const { minimum, maximum } = bounds(panel)
      const step = event.shiftKey ? 64 : 16
      const width =
        event.key === 'ArrowLeft'
          ? current + step
          : event.key === 'ArrowRight'
            ? current - step
            : event.key === 'Home'
              ? minimum
              : event.key === 'End'
                ? maximum
                : undefined
      if (width === undefined) return

      event.preventDefault()
      resize(width)
      save(preferred)
    }
    const onWindowResize = () => {
      finish()
      render()
    }
    handle.addEventListener('pointerdown', onPointerDown)
    handle.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onWindowResize)
    window.addEventListener('pagehide', finish)
    render()
    const frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      finish()
      handle.removeEventListener('pointerdown', onPointerDown)
      handle.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onWindowResize)
      window.removeEventListener('pagehide', finish)
    }
  }, [])
  return { container, divider }
}
