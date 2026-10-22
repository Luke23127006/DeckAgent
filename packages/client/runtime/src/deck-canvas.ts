import type { DeckClient } from './deck-client.ts'
import { DeckModel } from './deck-model.ts'
import { button, element } from './dom.ts'
import { mountDeckResizer } from './deck-resizer.ts'

/** Published content never joins the application DOM. Empty sandbox => opaque origin.
 * srcdoc inherits Host CSP; its leading CSP further disallows every network source.
 */
export function mountDeckCanvas(container: HTMLElement, client: DeckClient, reveal: () => void): DeckModel {
  const panel = element('section', undefined, 'deck-panel')
  panel.setAttribute('aria-label', 'Presentation deck')
  const title = element('h2', 'Presentation')
  const heading = element('header')
  heading.append(
    title,
    button('Close deck', () => {
      container.hidden = true
    }),
  )
  const state = element('p', '', 'deck-connection')
  state.setAttribute('role', 'status')
  const slides = element('nav', undefined, 'deck-slide-list')
  slides.setAttribute('aria-label', 'Slides')
  const frame = element('iframe')
  frame.title = 'Published slide'
  frame.setAttribute('sandbox', '')
  frame.referrerPolicy = 'no-referrer'
  frame.hidden = true
  const caption = element('p', 'No confirmed deck in this chat', 'slide-caption')
  caption.setAttribute('aria-live', 'polite')
  let rendered = '',
    lastSession = '',
    appeared = false
  const model = new DeckModel(client, value => {
    if (!value.snapshot) {
      rendered = ''
      frame.removeAttribute('srcdoc')
      frame.hidden = true
      slides.replaceChildren()
      caption.textContent = 'Loading deck'
      container.hidden = true
      appeared = false
      return
    }
    const snapshot = value.snapshot
    if (lastSession !== snapshot.sessionId) {
      lastSession = snapshot.sessionId
      appeared = false
    }
    if (snapshot.outlineId && !appeared) {
      appeared = true
      reveal()
      container.hidden = false
    }
    state.textContent =
      value.connection === 'live'
        ? 'Connected'
        : value.connection === 'error'
          ? 'Unable to load deck. Reopen the connection.'
          : value.connection === 'reconnecting'
            ? 'Reconnecting — showing last saved state'
            : 'Connecting'
    title.textContent = snapshot.outlineId ? 'Presentation' : 'Deck'
    slides.replaceChildren(
      ...snapshot.slides.map(slide => {
        const item = button(
          `${slide.order + 1}. ${slide.title} · ${slide.status === 'pending' ? 'Pending' : `Revision ${slide.revision}`}`,
          () => model.select(slide.slideId),
        )
        item.setAttribute('aria-current', String(slide.slideId === value.selectedId))
        return item
      }),
    )
    const selected = snapshot.slides.find(s => s.slideId === value.selectedId)
    caption.textContent = selected
      ? `Slide ${selected.order + 1} of ${snapshot.slides.length} · ${selected.status === 'pending' ? 'Pending publication' : `Revision ${selected.revision}`}`
      : 'No confirmed deck in this chat'
    const key = value.html === undefined ? '' : `${snapshot.sessionId}/${selected?.slideId}/${selected?.revision}`
    if (key !== rendered) {
      rendered = key
      frame.hidden = !key
      if (key)
        frame.srcdoc = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">${value.html}`
      else frame.removeAttribute('srcdoc')
    }
  })
  const navigate = (offset: number) => {
    const snapshot = model.state.snapshot
    if (!snapshot?.slides.length) return
    const index = snapshot.slides.findIndex(s => s.slideId === model.state.selectedId)
    model.select(snapshot.slides[(index + offset + snapshot.slides.length) % snapshot.slides.length]!.slideId)
  }
  const controls = element('nav', undefined, 'deck-controls')
  controls.append(
    button('Previous', () => navigate(-1)),
    button('Next', () => navigate(1)),
    button('Fullscreen', () => {
      const work = document.fullscreenElement ? document.exitFullscreen() : panel.requestFullscreen()
      work.catch(() => {
        state.textContent = 'Fullscreen is unavailable in this browser'
      })
    }),
  )
  let width = 520
  try {
    const saved = localStorage.getItem('deckagent-canvas-width')
    if (saved && Number(saved) >= 320 && Number(saved) <= 1000) width = Number(saved)
  } catch {
    /* Optional layout only. */
  }
  mountDeckResizer(container, width, value => {
    try {
      localStorage.setItem('deckagent-canvas-width', String(value))
    } catch {
      /* Layout remains usable. */
    }
  })
  panel.append(heading, state, slides, frame, caption, controls)
  container.append(panel)
  return model
}
