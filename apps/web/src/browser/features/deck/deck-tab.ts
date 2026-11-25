import { button, element } from '../../dom.ts'
import { mountDeckResizer } from './deck-resizer.ts'

interface SampleLayout {
  current: number
  width: string
}

function loadSampleLayout(container: HTMLElement): SampleLayout {
  const layout: SampleLayout = { current: 0, width: '520' }
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('deckagent-sample-layout') ?? 'null')
    if (!saved || typeof saved !== 'object') return layout
    if (
      'current' in saved &&
      typeof saved.current === 'number' &&
      Number.isInteger(saved.current) &&
      saved.current >= 0 &&
      saved.current < 3
    )
      layout.current = saved.current
    if (
      'width' in saved &&
      typeof saved.width === 'string' &&
      Number(saved.width) >= 320 &&
      Number(saved.width) <= 1000
    )
      layout.width = saved.width
    if ('open' in saved && saved.open === true) container.hidden = false
  } catch {
    /* Ignore invalid optional layout state. */
  }
  return layout
}

function saveSampleLayout(container: HTMLElement, layout: SampleLayout): void {
  try {
    localStorage.setItem(
      'deckagent-sample-layout',
      JSON.stringify({ current: layout.current, width: layout.width, open: !container.hidden }),
    )
  } catch {
    /* Layout persistence is optional; controls remain usable without browser storage. */
  }
}

/** Sample-only tab. It has no Session–Deck mapping or publication/storage responsibilities. */
export function mountDeckTab(container: HTMLElement): void {
  const layout = loadSampleLayout(container)
  const save = () => saveSampleLayout(container, layout)
  const panel = element('section', undefined, 'deck-panel')
  panel.setAttribute('aria-label', 'Deck mẫu')
  const heading = element('header')
  const close = button('Đóng deck', () => {
    container.hidden = true
    save()
  })
  heading.append(element('h2', 'Deck mẫu'), close)
  const frame = element('iframe')
  frame.title = 'Slide mẫu'
  frame.setAttribute('sandbox', '')
  frame.referrerPolicy = 'no-referrer'
  const caption = element('p', '', 'slide-caption')
  caption.setAttribute('aria-live', 'polite')
  const render = () => {
    frame.src = `/samples/${layout.current + 1}.html`
    caption.textContent = `Slide ${layout.current + 1}/3 · Nội dung mẫu`
    save()
  }
  const controls = element('nav', undefined, 'deck-controls')
  controls.setAttribute('aria-label', 'Điều hướng slide')
  const previous = button('Trước', () => {
    layout.current = (layout.current + 2) % 3
    render()
  })
  const next = button('Sau', () => {
    layout.current = (layout.current + 1) % 3
    render()
  })
  const fullscreen = button('Toàn màn hình', () => {
    const work = document.fullscreenElement ? document.exitFullscreen() : panel.requestFullscreen()
    work.catch(() => {
      caption.textContent = 'Trình duyệt không hỗ trợ toàn màn hình'
    })
  })
  previous.classList.add('deck-prev')
  next.classList.add('deck-next')
  controls.append(previous, next, fullscreen)
  mountDeckResizer(container, Number(layout.width), value => {
    layout.width = String(value)
    save()
  })
  panel.append(heading, frame, caption, controls)
  container.append(panel)
  render()
}
