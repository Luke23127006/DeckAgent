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
  const title = element('h2', 'Deck canvas')
  const progress = element('small', '0/0 slide đã lưu', 'deck-progress')
  progress.setAttribute('aria-live', 'polite')
  const headingText = element('div', undefined, 'deck-heading')
  headingText.append(title, progress)
  const heading = element('header')
  heading.append(
    headingText,
    button('Đóng', () => {
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
  const caption = element('p', 'Chat này chưa có deck đã xác nhận', 'slide-caption')
  caption.setAttribute('aria-live', 'polite')
  const previous = button('◀ Trước', () => navigate(-1))
  const next = button('Sau ▶', () => navigate(1))
  previous.disabled = true
  next.disabled = true
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
      caption.textContent = 'Đang tải deck'
      previous.disabled = true
      next.disabled = true
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
        ? 'Đã kết nối'
        : value.connection === 'error'
          ? 'Không tải được deck. Hãy kết nối lại.'
          : value.connection === 'reconnecting'
            ? 'Đang kết nối lại — hiển thị bản đã lưu gần nhất'
            : 'Đang kết nối'
    title.textContent = 'Deck canvas'
    const published = snapshot.slides.filter(slide => slide.status === 'published').length
    progress.textContent = `${published}/${snapshot.slides.length} slide đã lưu`
    for (const [id, item] of slideButtons) if (!snapshot.slides.some(slide => slide.slideId === id)) {
      item.remove()
      slideButtons.delete(id)
    }
    for (const [index, slide] of snapshot.slides.entries()) {
      let item = slideButtons.get(slide.slideId)
      if (!item) {
        item = button('', () => model.select(slide.slideId))
        const thumbnail = element('span', undefined, 'thumbnail')
        thumbnail.setAttribute('aria-hidden', 'true')
        thumbnail.append(element('i'), element('i'))
        item.append(thumbnail, element('span', '', 'thumbnail-label'))
        slideButtons.set(slide.slideId, item)
      }
      const text = `${slide.order + 1}. ${slide.title} · ${slide.status === 'pending' ? 'Chưa tạo xong' : `Bản ${slide.revision}`}`
      const label = item.querySelector('.thumbnail-label')!
      const short = `${slide.order + 1} · ${slide.status === 'pending' ? 'chưa tới' : 'xong'}`
      if (label.textContent !== short) label.textContent = short
      item.title = text
      item.setAttribute('aria-label', text)
      item.dataset.status = slide.status
      item.setAttribute('aria-current', String(slide.slideId === value.selectedId))
      if (slides.children[index] !== item) slides.insertBefore(item, slides.children[index] ?? null)
    }
    const selected = snapshot.slides.find(s => s.slideId === value.selectedId)
    const selectedIndex = snapshot.slides.findIndex(slide => slide.slideId === value.selectedId)
    previous.disabled = selectedIndex <= 0
    next.disabled = selectedIndex < 0 || selectedIndex >= snapshot.slides.length - 1
    caption.textContent = selected
      ? `Slide ${selected.order + 1}/${snapshot.slides.length} · ${selected.status === 'pending' ? 'Chưa tạo xong' : `Bản ${selected.revision}`}`
      : 'Chat này chưa có deck đã xác nhận'
    placeholder.hidden = value.html !== undefined
    placeholder.textContent = selected?.status === 'pending'
      ? 'Slide này chưa được tạo xong. Nội dung hoàn tất sẽ hiện ở đây sau khi được lưu.'
      : value.connection === 'error' ? 'Không tải được bản slide đã lưu. Hãy kết nối lại.'
        : 'Đang tải bản slide đã lưu…'
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
    const slide = snapshot.slides[index + offset]
    if (slide) model.select(slide.slideId)
  }
  const controls = element('nav', undefined, 'deck-controls')
  controls.setAttribute('aria-label', 'Slide navigation')
  controls.append(
    previous,
    caption,
    next,
    button('Toàn màn hình', () => {
      const work = document.fullscreenElement ? document.exitFullscreen() : panel.requestFullscreen()
      work.catch(() => {
        state.textContent = 'Trình duyệt không hỗ trợ toàn màn hình'
      })
    }),
  )
  let width = 400
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
  footer.append(element('p', 'Chỉ xem. Để sửa slide, hãy gửi yêu cầu trong chat.'), state)
  panel.append(heading, stage, controls, slides, footer)
  container.append(panel)
  return model
}
