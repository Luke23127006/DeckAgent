import { button, element } from './dom.ts'
import { mountDeckResizer } from './deck-resizer.ts'

/** Sample-only tab. It has no Session–Deck mapping or publication/storage responsibilities. */
export function mountDeckTab(container: HTMLElement): void {
  const panel = element('section', undefined, 'deck-panel')
  panel.setAttribute('aria-label', 'Sample Deck')
  const heading = element('header')
  const close = button('Đóng deck', () => {
    container.hidden = true
    save()
  })
  heading.append(element('h2', 'Deck mẫu'), close)
  const frame = element('iframe')
  frame.title = 'Sample slide'
  frame.setAttribute('sandbox', '')
  frame.referrerPolicy = 'no-referrer'
  const caption = element('p', '', 'slide-caption')
  caption.setAttribute('aria-live', 'polite')
  let current = 0
  const render = () => {
    frame.src = `/samples/${current + 1}.html`
    caption.textContent = `Slide ${current + 1}/3 · Nội dung mẫu`
    save()
  }
  const controls = element('nav', undefined, 'deck-controls')
  controls.setAttribute('aria-label', 'Slide navigation')
  const previous = button('◀ Trước', () => {
    current = (current + 2) % 3
    render()
  })
  const next = button('Sau ▶', () => {
    current = (current + 1) % 3
    render()
  })
  const fullscreen = button('Toàn màn hình', () => {
    const work = document.fullscreenElement ? document.exitFullscreen() : panel.requestFullscreen()
    work.catch(() => {
      caption.textContent = 'Trình duyệt không hỗ trợ toàn màn hình'
    })
  })
  controls.append(previous, next, fullscreen)
  let width = '520'
  function save() {
    try {
      localStorage.setItem(
        'deckagent-sample-layout',
        JSON.stringify({ current, width, open: !container.hidden }),
      )
    } catch {
      /* Layout persistence is optional; controls remain usable without browser storage. */
    }
  }
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('deckagent-sample-layout') ?? 'null')
    if (
      saved &&
      typeof saved === 'object' &&
      'current' in saved &&
      typeof saved.current === 'number' &&
      Number.isInteger(saved.current) &&
      saved.current >= 0 &&
      saved.current < 3
    )
      current = saved.current
    if (
      saved &&
      typeof saved === 'object' &&
      'width' in saved &&
      typeof saved.width === 'string' &&
      Number(saved.width) >= 320 &&
      Number(saved.width) <= 1000
    )
      width = saved.width
    if (saved && typeof saved === 'object' && 'open' in saved && saved.open === true) container.hidden = false
  } catch {
    /* Ignore invalid optional layout state. */
  }
  mountDeckResizer(container, Number(width), value => { width = String(value); save() })
  panel.append(heading, frame, caption, controls)
  container.append(panel)
  render()
}
