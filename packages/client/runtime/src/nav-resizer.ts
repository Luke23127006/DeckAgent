import { element } from './dom.ts'

const STORAGE_KEY = 'deckagent-nav-width'
/** Narrowest the sidebar gets when the user drags it. */
const MINIMUM = 200
/** Widest the sidebar gets: a quarter of the window, never less than its normal width. */
const SHARE = 0.25
const WIDE = 236
const NARROW = 206

function stored(): number | undefined {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(value) && value > 0 ? value : undefined
  } catch {
    return undefined // Optional layout preference.
  }
}

function remember(width: number | undefined): void {
  try {
    if (width === undefined) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, String(width))
  } catch {
    /* Optional layout preference. */
  }
}

/**
 * Divider on the right edge of the sidebar. Dragging it, or the arrow keys, sets the sidebar width between a
 * minimum and a quarter of the window. A double press goes back to the normal width. The choice is a
 * per-browser layout convenience, like the collapsed sidebar.
 */
export function mountNavResizer(navigation: HTMLElement, root: HTMLElement): void {
  const divider = element('div', undefined, 'nav-resizer')
  divider.setAttribute('role', 'separator')
  divider.setAttribute('aria-label', 'Đổi độ rộng thanh bên')
  divider.setAttribute('aria-orientation', 'vertical')
  divider.title = 'Kéo để đổi độ rộng, nhấp đúp để đặt lại'
  let preferred = stored()
  let drag: { pointer: number; start: number; width: number; control: AbortController } | undefined

  const normal = (): number => (innerWidth <= 1000 ? NARROW : WIDE)
  const bounds = (): { minimum: number; maximum: number } => {
    const maximum = Math.max(normal(), Math.floor(innerWidth * SHARE))
    return { minimum: Math.min(MINIMUM, maximum), maximum }
  }
  const usable = (): boolean => innerWidth > 720 && root.dataset.nav !== 'collapsed'

  function render(): void {
    const { minimum, maximum } = bounds()
    if (preferred === undefined) root.style.removeProperty('--nav-width')
    else root.style.setProperty('--nav-width', `${Math.round(Math.max(minimum, Math.min(maximum, preferred)))}px`)
    const width = Math.round(navigation.getBoundingClientRect().width)
    divider.tabIndex = usable() ? 0 : -1
    divider.setAttribute('aria-valuemin', String(minimum))
    divider.setAttribute('aria-valuemax', String(maximum))
    divider.setAttribute('aria-valuenow', String(width))
    divider.setAttribute('aria-valuetext', `${width} pixels`)
  }
  function resize(width: number | undefined): void {
    const { minimum, maximum } = bounds()
    preferred = width === undefined ? undefined : Math.round(Math.max(minimum, Math.min(maximum, width)))
    render()
  }
  /** The deck panel keeps room for the chat next to the sidebar, so it measures again. */
  function settle(): void {
    remember(preferred)
    window.dispatchEvent(new Event('resize'))
  }
  function finish(): void {
    if (!drag) return
    const active = drag
    drag = undefined
    active.control.abort()
    document.body.classList.remove('nav-resizing')
    settle()
  }

  divider.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || !usable() || drag) return
    event.preventDefault()
    divider.focus()
    const control = new AbortController()
    drag = { pointer: event.pointerId, start: event.clientX, width: navigation.getBoundingClientRect().width, control }
    document.body.classList.add('nav-resizing')
    // The window sees the pointer even over the deck iframe or after it leaves the divider.
    window.addEventListener(
      'pointermove',
      move => {
        if (drag?.pointer !== move.pointerId) return
        if (!move.buttons) {
          finish()
          return
        }
        resize(drag.width + move.clientX - drag.start)
      },
      { capture: true, signal: control.signal },
    )
    window.addEventListener(
      'pointerup',
      release => {
        if (drag?.pointer !== release.pointerId) return
        resize(drag.width + release.clientX - drag.start)
        finish()
      },
      { capture: true, signal: control.signal },
    )
    window.addEventListener('pointercancel', finish, { capture: true, signal: control.signal })
    window.addEventListener('blur', finish, { signal: control.signal })
  })
  divider.addEventListener('keydown', event => {
    if (!usable()) return
    const current = navigation.getBoundingClientRect().width
    const { minimum, maximum } = bounds()
    const step = event.shiftKey ? 64 : 16
    const width =
      event.key === 'ArrowRight'
        ? current + step
        : event.key === 'ArrowLeft'
          ? current - step
          : event.key === 'Home'
            ? minimum
            : event.key === 'End'
              ? maximum
              : undefined
    if (width === undefined) return
    event.preventDefault()
    resize(width)
    settle()
  })
  divider.addEventListener('dblclick', () => {
    if (!usable()) return
    resize(undefined)
    settle()
  })
  window.addEventListener('resize', () => {
    if (!drag) render()
  })
  window.addEventListener('pagehide', finish)
  // The sidebar is collapsed or expanded by `data-nav` on the root.
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-nav'] })
  navigation.after(divider)
  render()
  requestAnimationFrame(render)
}
