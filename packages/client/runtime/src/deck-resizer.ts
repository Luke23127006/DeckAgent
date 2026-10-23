import { element } from './dom.ts'

/** Shared right-panel divider. Width persistence stays with each panel's existing layout owner. */
export function mountDeckResizer(container: HTMLElement, initial: number, save: (width: number) => void): void {
  const divider = element('div', undefined, 'deck-resizer')
  divider.setAttribute('role', 'separator')
  divider.setAttribute('aria-label', 'Resize presentation')
  divider.setAttribute('aria-orientation', 'vertical')
  divider.title = 'Drag to resize presentation; use Left and Right arrow keys'
  let preferred = initial
  let drag: { pointer: number; start: number; width: number; overlay: HTMLElement; control: AbortController } | undefined
  const bounds = () => {
    const navigation = document.querySelector('.chat-navigation')?.getBoundingClientRect().width ?? 0
    const maximum = Math.max(1, Math.floor(Math.min(1000, innerWidth - navigation - 320,
      Number.parseFloat(getComputedStyle(container).maxWidth) || 1000)))
    return { minimum: Math.min(320, maximum), maximum }
  }
  const render = () => {
    const { minimum, maximum } = bounds()
    const width = Math.round(Math.max(minimum, Math.min(maximum, preferred)))
    container.style.width = `${width}px`
    divider.tabIndex = innerWidth <= 720 ? -1 : 0
    divider.setAttribute('aria-valuemin', String(minimum))
    divider.setAttribute('aria-valuemax', String(maximum))
    divider.setAttribute('aria-valuenow', String(width))
    divider.setAttribute('aria-valuetext', `${width} pixels`)
  }
  const resize = (width: number) => {
    const { minimum, maximum } = bounds()
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
  divider.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || innerWidth <= 720 || drag) return
    event.preventDefault()
    divider.focus()
    const overlay = element('div', undefined, 'deck-resize-overlay')
    const control = new AbortController()
    drag = { pointer: event.pointerId, start: event.clientX, width: container.getBoundingClientRect().width, overlay, control }
    document.body.classList.add('deck-resizing')
    document.body.append(overlay)
    // Track on the fixed overlay/window: native capture can be lost across opaque iframe widgets.
    // Window capture also handles a pointer released over the iframe/overlay boundary.
    window.addEventListener('pointermove', move => {
      if (drag?.pointer !== move.pointerId) return
      if (!move.buttons) { finish(); return }
      resize(drag.width + drag.start - move.clientX)
    }, { capture: true, signal: control.signal })
    window.addEventListener('pointerup', release => {
      if (drag?.pointer !== release.pointerId) return
      // The final move may be coalesced or omitted; commit the actual release position before saving.
      resize(drag.width + drag.start - release.clientX)
      finish()
    }, { capture: true, signal: control.signal })
    window.addEventListener('pointercancel', finish, { capture: true, signal: control.signal })
    window.addEventListener('blur', finish, { signal: control.signal })
  })
  divider.addEventListener('keydown', event => {
    if (innerWidth <= 720) return
    const current = container.getBoundingClientRect().width
    const { minimum, maximum } = bounds()
    const step = event.shiftKey ? 64 : 16
    const width = event.key === 'ArrowLeft' ? current + step : event.key === 'ArrowRight' ? current - step
      : event.key === 'Home' ? minimum : event.key === 'End' ? maximum : undefined
    if (width === undefined) return
    event.preventDefault()
    resize(width)
    save(preferred)
  })
  window.addEventListener('resize', () => { finish(); render() })
  window.addEventListener('pagehide', finish)
  container.append(divider)
  render()
  requestAnimationFrame(render)
}
