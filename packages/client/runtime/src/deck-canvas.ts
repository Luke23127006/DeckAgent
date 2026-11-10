import type { DeckClient } from './deck-client.ts'
import { DeckModel } from './deck-model.ts'
import { button, element } from './dom.ts'
import { mountDeckResizer } from './deck-resizer.ts'

/** Slides carry no fixed size. A preview lays one out at this viewport, then CSS scales it down. */
const PREVIEW_WIDTH = 1280
const PREVIEW_CONCURRENCY = 3
const IDLE_MS = 2500
// Published content never joins the application DOM. Empty sandbox => opaque origin.
// srcdoc inherits Host CSP; its leading CSP further disallows every network source.
const SLIDE_CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">`

/** Canvas layout: a filmstrip of real slide previews beside a letterboxed stage, with a presentation mode
 * that fills the screen. Only the stage reads from DeckModel; previews use the same public client.
 */
export function mountDeckCanvas(container: HTMLElement, client: DeckClient, reveal: () => void): DeckModel {
  const panel = element('section', undefined, 'deck-panel')
  panel.setAttribute('aria-label', 'Bộ slide')
  panel.tabIndex = -1
  panel.dataset.presenting = 'false'
  panel.dataset.idle = 'false'
  const title = element('h2', 'Bộ slide')
  const progress = element('small', '0/0 slide đã lưu', 'deck-progress')
  progress.setAttribute('aria-live', 'polite')
  const headingText = element('div', undefined, 'deck-heading')
  headingText.append(title, progress)
  const heading = element('header')
  const present = button('Trình chiếu', () => togglePresentation())
  present.classList.add('deck-present')
  present.disabled = true
  const actions = element('div', undefined, 'deck-actions')
  actions.append(
    present,
    button('Đóng', () => {
      container.hidden = true
    }),
  )
  heading.append(headingText, actions)
  const state = element('p', '', 'deck-connection')
  state.hidden = true
  state.setAttribute('role', 'status')
  const slides = element('nav', undefined, 'deck-slide-list')
  slides.setAttribute('aria-label', 'Danh sách slide')
  const slideButtons = new Map<string, HTMLButtonElement>()
  const frame = element('iframe')
  frame.title = 'Slide đã lưu'
  frame.setAttribute('sandbox', '')
  frame.referrerPolicy = 'no-referrer'
  frame.hidden = true
  const stage = element('div', undefined, 'deck-stage')
  const placeholder = element('div', undefined, 'deck-placeholder')
  placeholder.setAttribute('role', 'status')
  stage.append(frame, placeholder)
  const caption = element('p', 'Chat này chưa có deck đã xác nhận', 'slide-caption')
  caption.setAttribute('aria-live', 'polite')
  const counter = element('span', '0 / 0', 'deck-counter')
  counter.setAttribute('aria-hidden', 'true')
  const previous = button('Trước', () => navigate(-1))
  const next = button('Sau', () => navigate(1))
  const restart = button('Về đầu', () => go(0))
  const restartKey = element('kbd', 'R')
  restartKey.setAttribute('aria-hidden', 'true')
  restart.append(restartKey)
  restart.classList.add('deck-restart')
  restart.title = 'Về slide đầu tiên (R)'
  const exit = button('Thoát', () => {
    document.exitFullscreen().catch(() => {})
  })
  exit.classList.add('deck-exit')
  exit.hidden = true
  previous.classList.add('deck-prev')
  next.classList.add('deck-next')
  previous.disabled = true
  next.disabled = true
  restart.disabled = true

  // Previews: one request per visible published slide, a few at a time, cached by revision.
  let previewControl = new AbortController()
  const previews = new Map<string, string>()
  const loading = new Set<string>()
  const waiting: Array<() => void> = []
  let active = 0
  const pump = () => {
    while (active < PREVIEW_CONCURRENCY && waiting.length) {
      active++
      waiting.shift()?.()
    }
  }
  const fetchPreview = (sessionId: string, slideId: string, revision: number) =>
    new Promise<string>((resolve, reject) => {
      const signal = previewControl.signal
      waiting.push(() => {
        client
          .content(sessionId, slideId, revision, signal)
          .then(content => resolve(content.html), reject)
          .finally(() => {
            active--
            pump()
          })
      })
      pump()
    })
  const visible = new WeakSet<HTMLElement>()
  const paintPreview = (item: HTMLElement, key: string, html: string) => {
    const thumbnail = item.querySelector('.thumbnail')
    if (!thumbnail) return
    let preview = thumbnail.querySelector('iframe')
    if (!preview) {
      preview = element('iframe')
      preview.setAttribute('sandbox', '')
      preview.setAttribute('aria-hidden', 'true')
      preview.tabIndex = -1
      preview.referrerPolicy = 'no-referrer'
      thumbnail.append(preview)
    }
    preview.srcdoc = `${SLIDE_CSP}${html}`
    item.dataset.preview = key
    thumbnail.classList.add('has-preview')
  }
  const ensurePreview = (item: HTMLElement) => {
    const snapshot = model.state.snapshot
    const slide = snapshot?.slides.find(entry => entry.slideId === item.dataset.slideId)
    if (!snapshot || !slide || slide.status !== 'published' || !visible.has(item)) return
    const key = `${snapshot.sessionId}/${slide.slideId}/${slide.revision}`
    if (item.dataset.preview === key) return
    const cached = previews.get(key)
    if (cached !== undefined) {
      paintPreview(item, key, cached)
      return
    }
    if (loading.has(key)) return
    loading.add(key)
    fetchPreview(snapshot.sessionId, slide.slideId, slide.revision).then(
      html => {
        loading.delete(key)
        previews.set(key, html)
        ensurePreview(item)
      },
      // A preview is decorative: the slide number and title stay usable without it.
      () => loading.delete(key),
    )
  }
  const observer =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(
          entries => {
            for (const entry of entries) {
              const item = entry.target as HTMLElement
              if (entry.isIntersecting) {
                visible.add(item)
                ensurePreview(item)
              } else visible.delete(item)
            }
          },
          { root: slides, rootMargin: '160px' },
        )
      : undefined
  const rescale = () => {
    // offsetWidth ignores the entrance transform that motion.ts puts on new tiles.
    const width = slides.querySelector<HTMLElement>('.thumbnail')?.offsetWidth
    if (width) slides.style.setProperty('--preview-scale', String(width / PREVIEW_WIDTH))
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(rescale).observe(slides)

  let rendered = '',
    lastSession = '',
    lastSelected = '',
    appeared = false
  const model = new DeckModel(client, value => {
    if (!value.snapshot) {
      rendered = ''
      frame.removeAttribute('srcdoc')
      frame.hidden = true
      slides.replaceChildren()
      slideButtons.clear()
      caption.textContent = 'Đang tải deck'
      counter.textContent = '0 / 0'
      previous.disabled = true
      next.disabled = true
      restart.disabled = true
      present.disabled = true
      container.hidden = true
      appeared = false
      return
    }
    const snapshot = value.snapshot
    if (lastSession !== snapshot.sessionId) {
      lastSession = snapshot.sessionId
      appeared = false
      previewControl.abort()
      previewControl = new AbortController()
      previews.clear()
      loading.clear()
      waiting.length = 0
      slides.scrollTop = 0
      slides.scrollLeft = 0
      lastSelected = ''
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
    // A healthy connection needs no line; show the state only when the user must know about it.
    state.hidden = value.connection === 'live'
    title.textContent = 'Bộ slide'
    const published = snapshot.slides.filter(slide => slide.status === 'published').length
    progress.textContent = `${published}/${snapshot.slides.length} slide đã lưu`
    for (const [id, item] of slideButtons)
      if (!snapshot.slides.some(slide => slide.slideId === id)) {
        observer?.unobserve(item)
        item.remove()
        slideButtons.delete(id)
      }
    for (const [index, slide] of snapshot.slides.entries()) {
      let item = slideButtons.get(slide.slideId)
      if (!item) {
        item = button('', () => model.select(slide.slideId))
        item.dataset.slideId = slide.slideId
        const thumbnail = element('span', undefined, 'thumbnail')
        thumbnail.setAttribute('aria-hidden', 'true')
        thumbnail.append(element('i'), element('i'))
        const number = element('span', '', 'thumbnail-index')
        number.setAttribute('aria-hidden', 'true')
        item.append(number, thumbnail, element('span', '', 'thumbnail-label'))
        slideButtons.set(slide.slideId, item)
        if (observer) observer.observe(item)
        else visible.add(item)
      }
      const text = `${slide.order + 1}. ${slide.title} · ${slide.status === 'pending' ? 'Chưa tạo xong' : `Bản ${slide.revision}`}`
      const label = item.querySelector('.thumbnail-label')!
      const short = `${slide.order + 1} · ${slide.status === 'pending' ? 'chưa tới' : 'xong'}`
      if (label.textContent !== short) label.textContent = short
      const number = item.querySelector('.thumbnail-index')!
      if (number.textContent !== String(slide.order + 1)) number.textContent = String(slide.order + 1)
      item.title = text
      item.setAttribute('aria-label', text)
      item.dataset.status = slide.status
      item.setAttribute('aria-current', String(slide.slideId === value.selectedId))
      if (slides.children[index] !== item) slides.insertBefore(item, slides.children[index] ?? null)
      ensurePreview(item)
    }
    rescale()
    const selected = snapshot.slides.find(s => s.slideId === value.selectedId)
    const selectedIndex = snapshot.slides.findIndex(slide => slide.slideId === value.selectedId)
    if (selected && selected.slideId !== lastSelected) {
      lastSelected = selected.slideId
      slideButtons.get(selected.slideId)?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
    }
    previous.disabled = selectedIndex <= 0
    next.disabled = selectedIndex < 0 || selectedIndex >= snapshot.slides.length - 1
    restart.disabled = selectedIndex <= 0
    present.disabled = !snapshot.slides.length
    const position = `${selectedIndex + 1} / ${snapshot.slides.length}`
    if (counter.textContent !== position) counter.textContent = position
    caption.textContent = selected
      ? `Slide ${selected.order + 1}/${snapshot.slides.length} · ${selected.status === 'pending' ? 'Chưa tạo xong' : `Bản ${selected.revision}`}`
      : 'Chat này chưa có deck đã xác nhận'
    placeholder.hidden = value.html !== undefined
    placeholder.textContent =
      selected?.status === 'pending'
        ? 'Slide này chưa được tạo xong. Nội dung hoàn tất sẽ hiện ở đây sau khi được lưu.'
        : value.connection === 'error'
          ? 'Không tải được bản slide đã lưu. Hãy kết nối lại.'
          : 'Đang tải bản slide đã lưu…'
    const key = value.html === undefined ? '' : `${snapshot.sessionId}/${selected?.slideId}/${selected?.revision}`
    if (key !== rendered) {
      rendered = key
      frame.hidden = !key
      if (key) frame.srcdoc = `${SLIDE_CSP}${value.html}`
      else frame.removeAttribute('srcdoc')
    }
  })
  const go = (index: number) => {
    const slide = model.state.snapshot?.slides[index]
    if (slide) model.select(slide.slideId)
  }
  const navigate = (offset: number) => {
    const snapshot = model.state.snapshot
    if (!snapshot?.slides.length) return
    go(snapshot.slides.findIndex(s => s.slideId === model.state.selectedId) + offset)
  }

  // Presentation mode: the panel itself goes fullscreen (CSS keys on :fullscreen); JS only fades the chrome.
  const presenting = () => document.fullscreenElement === panel
  let idle: ReturnType<typeof setTimeout> | undefined
  const wake = () => {
    clearTimeout(idle)
    panel.dataset.idle = 'false'
    if (presenting()) idle = setTimeout(() => (panel.dataset.idle = 'true'), IDLE_MS)
  }
  function togglePresentation() {
    const work = presenting() ? document.exitFullscreen() : panel.requestFullscreen()
    work.catch(() => {
      state.textContent = 'Trình duyệt không hỗ trợ trình chiếu toàn màn hình'
      state.hidden = false
    })
  }
  document.addEventListener('fullscreenchange', () => {
    const on = presenting()
    panel.dataset.presenting = String(on)
    exit.hidden = !on
    if (on) panel.focus({ preventScroll: true })
    wake()
  })
  for (const type of ['pointermove', 'pointerdown', 'touchstart']) panel.addEventListener(type, wake, { passive: true })
  // The handler lives on the panel, not the window: the composer keeps its own keys.
  panel.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLTextAreaElement) return
    const snapshot = model.state.snapshot
    if (!snapshot?.slides.length) return
    const index = snapshot.slides.findIndex(s => s.slideId === model.state.selectedId)
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
        target = snapshot.slides.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    go(Math.max(0, Math.min(snapshot.slides.length - 1, target)))
    wake()
  })
  // The slide iframe is inert while presenting (CSS), so clicks land on the stage: left third back, rest forward.
  stage.addEventListener('click', event => {
    if (!presenting()) return
    const box = stage.getBoundingClientRect()
    navigate(event.clientX - box.left < box.width * 0.3 ? -1 : 1)
  })

  const controls = element('nav', undefined, 'deck-controls')
  controls.setAttribute('aria-label', 'Điều hướng slide')
  const divider = () => {
    const mark = element('span', undefined, 'deck-divider')
    mark.setAttribute('aria-hidden', 'true')
    return mark
  }
  controls.append(previous, counter, next, divider(), restart, exit, caption)
  const viewer = element('div', undefined, 'deck-viewer')
  viewer.append(stage, controls)
  const workspace = element('div', undefined, 'deck-workspace')
  workspace.append(viewer, slides)
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
  panel.append(heading, state, workspace)
  container.append(panel)
  return model
}
