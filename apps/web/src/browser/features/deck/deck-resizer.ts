import { element } from '../../dom.ts'

interface ResizerBounds {
  readonly minimum: number
  readonly maximum: number
}

interface ResizeSession {
  readonly pointer: number
  readonly start: number
  readonly width: number
  readonly overlay: HTMLElement
  readonly control: AbortController
}

interface ResizerState {
  readonly container: HTMLElement
  readonly divider: HTMLElement
  readonly save: (width: number) => void
  preferred: number
  drag: ResizeSession | undefined
}

function computeBounds(container: HTMLElement): ResizerBounds {
  const navigation = document.querySelector('.chat-navigation')?.getBoundingClientRect().width ?? 0
  const maximum = Math.max(
    1,
    Math.floor(
      Math.min(1000, innerWidth - navigation - 320, Number.parseFloat(getComputedStyle(container).maxWidth) || 1000),
    ),
  )
  return { minimum: Math.min(320, maximum), maximum }
}

function renderResizer(state: ResizerState): void {
  const { minimum, maximum } = computeBounds(state.container)
  const width = Math.round(Math.max(minimum, Math.min(maximum, state.preferred)))
  state.container.style.width = `${width}px`
  state.divider.tabIndex = innerWidth <= 720 ? -1 : 0
  state.divider.setAttribute('aria-valuemin', String(minimum))
  state.divider.setAttribute('aria-valuemax', String(maximum))
  state.divider.setAttribute('aria-valuenow', String(width))
  state.divider.setAttribute('aria-valuetext', `${width} pixels`)
}

function resizeResizer(state: ResizerState, width: number): void {
  const { minimum, maximum } = computeBounds(state.container)
  state.preferred = Math.round(Math.max(minimum, Math.min(maximum, width)))
  renderResizer(state)
}

function finishResize(state: ResizerState): void {
  if (!state.drag) return
  const active = state.drag
  state.drag = undefined
  active.control.abort()
  active.overlay.remove()
  document.body.classList.remove('deck-resizing')
  state.save(state.preferred)
}

function createResizerState(container: HTMLElement, initial: number, save: (width: number) => void): ResizerState {
  const divider = element('div', undefined, 'deck-resizer')
  divider.setAttribute('role', 'separator')
  divider.setAttribute('aria-label', 'Đổi kích thước bộ slide')
  divider.setAttribute('aria-orientation', 'vertical')
  divider.title = 'Drag to resize presentation; use Left and Right arrow keys'
  return { container, divider, save, preferred: initial, drag: undefined }
}

function attachPointerResize(state: ResizerState): void {
  const { divider, container } = state
  divider.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || innerWidth <= 720 || state.drag) return
    event.preventDefault()
    divider.focus()
    const overlay = element('div', undefined, 'deck-resize-overlay')
    const control = new AbortController()
    state.drag = {
      pointer: event.pointerId,
      start: event.clientX,
      width: container.getBoundingClientRect().width,
      overlay,
      control,
    }
    document.body.classList.add('deck-resizing')
    document.body.append(overlay)
    // Track on the fixed overlay/window: native capture can be lost across opaque iframe widgets.
    // Window capture also handles a pointer released over the iframe/overlay boundary.
    window.addEventListener(
      'pointermove',
      move => {
        if (state.drag?.pointer !== move.pointerId) return
        if (!move.buttons) {
          finishResize(state)
          return
        }
        resizeResizer(state, state.drag.width + state.drag.start - move.clientX)
      },
      { capture: true, signal: control.signal },
    )
    window.addEventListener(
      'pointerup',
      release => {
        if (state.drag?.pointer !== release.pointerId) return
        // The final move may be coalesced or omitted; commit the actual release position before saving.
        resizeResizer(state, state.drag.width + state.drag.start - release.clientX)
        finishResize(state)
      },
      { capture: true, signal: control.signal },
    )
    window.addEventListener('pointercancel', () => finishResize(state), { capture: true, signal: control.signal })
    window.addEventListener('blur', () => finishResize(state), { signal: control.signal })
  })
}

function attachKeyboardResize(state: ResizerState): void {
  state.divider.addEventListener('keydown', event => {
    if (innerWidth <= 720) return
    const current = state.container.getBoundingClientRect().width
    const { minimum, maximum } = computeBounds(state.container)
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
    resizeResizer(state, width)
    state.save(state.preferred)
  })
}

/** Shared right-panel divider. Width persistence stays with each panel's existing layout owner. */
export function mountDeckResizer(container: HTMLElement, initial: number, save: (width: number) => void): void {
  const state = createResizerState(container, initial, save)
  attachPointerResize(state)
  attachKeyboardResize(state)
  window.addEventListener('resize', () => {
    finishResize(state)
    renderResizer(state)
  })
  window.addEventListener('pagehide', () => finishResize(state))
  container.append(state.divider)
  renderResizer(state)
  requestAnimationFrame(() => renderResizer(state))
}
