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
  const progress = element('small', '0/0 slides published', 'deck-progress')
  progress.setAttribute('aria-live', 'polite')
  const headingText = element('div', undefined, 'deck-heading')
  headingText.append(title, progress)
  const heading = element('header')
  heading.append(
    headingText,
    button('Close deck', () => {
      container.hidden = true
    }),
  )
  const state = element('p', '', 'deck-connection')
  state.setAttribute('role', 'status')
  const slides = element('nav', undefined, 'deck-slide-list')
  slides.setAttribute('aria-label', 'Slides')
  const slideButtons = new Map<string, HTMLButtonElement>()
  const frame = element('iframe')
  frame.title = 'Published slide'
  frame.setAttribute('sandbox', '')
  frame.referrerPolicy = 'no-referrer'
  frame.hidden = true
  const stage = element('div', undefined, 'deck-stage')
  const placeholder = element('div', undefined, 'deck-placeholder')
  placeholder.setAttribute('role', 'status')
  stage.append(frame, placeholder)
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
      slideButtons.clear()
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
    const published = snapshot.slides.filter(slide => slide.status === 'published').length
    progress.textContent = `${published}/${snapshot.slides.length} slides published`
    for (const [id, item] of slideButtons) if (!snapshot.slides.some(slide => slide.slideId === id)) {
      item.remove()
      slideButtons.delete(id)
    }
    for (const [index, slide] of snapshot.slides.entries()) {
      let item = slideButtons.get(slide.slideId)
      if (!item) {
        item = button('', () => model.select(slide.slideId))
        slideButtons.set(slide.slideId, item)
      }
      const text = `${slide.order + 1}. ${slide.title} · ${slide.status === 'pending' ? 'Pending' : `Revision ${slide.revision}`}`
      if (item.textContent !== text) item.textContent = text
      item.title = text
      item.dataset.status = slide.status
      item.setAttribute('aria-current', String(slide.slideId === value.selectedId))
      if (slides.children[index] !== item) slides.insertBefore(item, slides.children[index] ?? null)
    }
    const selected = snapshot.slides.find(s => s.slideId === value.selectedId)
    caption.textContent = selected
      ? `Slide ${selected.order + 1} of ${snapshot.slides.length} · ${selected.status === 'pending' ? 'Pending publication' : `Revision ${selected.revision}`}`
      : 'No confirmed deck in this chat'
    placeholder.hidden = value.html !== undefined
    placeholder.textContent = selected?.status === 'pending'
      ? 'This slide has not been published. Finished content will appear here.'
      : value.connection === 'error' ? 'Unable to load this published revision. Reconnect to try again.'
        : 'Loading published revision…'
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
  controls.setAttribute('aria-label', 'Slide navigation')
  controls.append(
    button('Previous', () => navigate(-1)),
    caption,
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
  const footer = element('footer', undefined, 'deck-footer')
  footer.append(element('p', 'View only. To change a slide, send a request in chat.'), state)
  panel.append(heading, stage, controls, slides, footer)
  container.append(panel)
  return model
}
