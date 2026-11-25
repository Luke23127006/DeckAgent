import type { DeckSnapshot } from '@deckagent/host-contracts'

const IDLE_MS = 2500
const WAKE_EVENTS = ['pointermove', 'pointerdown', 'touchstart'] as const

export interface PresentationOptions {
  readonly panel: HTMLElement
  readonly stage: HTMLElement
  readonly present: HTMLButtonElement
  readonly exit: HTMLButtonElement
  readonly state: HTMLElement
  readonly fitStage: () => void
  readonly snapshot: () => DeckSnapshot | undefined
  readonly selectedId: () => string | undefined
  readonly go: (index: number) => void
  readonly navigate: (offset: number) => void
}

function attachKeyNavigation(options: PresentationOptions, wake: () => void): void {
  options.panel.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLTextAreaElement) return
    const slides = options.snapshot()?.slides
    if (!slides?.length) return
    const index = slides.findIndex(s => s.slideId === options.selectedId())
    let target: number
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        target = index + 1
        break
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        target = index - 1
        break
      case ' ':
        // Space on a focused button keeps its own meaning.
        if (event.target instanceof HTMLButtonElement) return
        target = index + 1
        break
      case 'Home':
      case 'r':
      case 'R':
        target = 0
        break
      case 'End':
        target = slides.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    options.go(Math.max(0, Math.min(slides.length - 1, target)))
    wake()
  })
}

export function attachPresentationControls(options: PresentationOptions): void {
  const { panel, exit, state, fitStage } = options
  const presenting = () => document.fullscreenElement === panel
  let idle: ReturnType<typeof setTimeout> | undefined
  const wake = () => {
    clearTimeout(idle)
    panel.dataset.idle = 'false'
    if (presenting()) idle = setTimeout(() => (panel.dataset.idle = 'true'), IDLE_MS)
  }
  const togglePresentation = () => {
    const work = presenting() ? document.exitFullscreen() : panel.requestFullscreen()
    work.catch(() => {
      state.textContent = 'Trình duyệt không hỗ trợ trình chiếu toàn màn hình'
      state.hidden = false
    })
  }
  options.present.addEventListener('click', togglePresentation)
  document.addEventListener('fullscreenchange', () => {
    const on = presenting()
    panel.dataset.presenting = String(on)
    exit.hidden = !on
    fitStage()
    if (on) panel.focus({ preventScroll: true })
    wake()
  })
  for (const type of WAKE_EVENTS) panel.addEventListener(type, wake, { passive: true })
  attachKeyNavigation(options, wake)
  // The slide iframe is inert while presenting (CSS), so clicks land on the stage: left third back, rest forward.
  options.stage.addEventListener('click', event => {
    if (!presenting()) return
    const box = options.stage.getBoundingClientRect()
    options.navigate(event.clientX - box.left < box.width * 0.3 ? -1 : 1)
  })
}
