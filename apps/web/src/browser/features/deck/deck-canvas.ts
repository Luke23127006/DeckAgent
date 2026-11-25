import type { DeckSnapshot } from '@deckagent/host-contracts'
import type { DeckClient } from '../../transport/index.ts'
import { button, element } from '../../dom.ts'
import { DeckModel } from './deck-model.ts'
import type { DeckViewState } from './deck-model.ts'
import { mountDeckResizer } from './deck-resizer.ts'
import { createPreviewQueue, SLIDE_CSP } from './deck-preview-queue.ts'
import type { PreviewQueue } from './deck-preview-queue.ts'
import { attachPresentationControls } from './deck-presentation.ts'

/** Published HTML lays out at this viewport; every viewer scales the same canvas without reflow. */
const PREVIEW_WIDTH = 1280

const connectionLabels: Readonly<Record<DeckViewState['connection'], string>> = {
  connecting: 'Đang kết nối',
  live: 'Đã kết nối',
  reconnecting: 'Đang kết nối lại — hiển thị bản đã lưu gần nhất',
  error: 'Không tải được deck. Hãy kết nối lại.',
}

const generationLabels = {
  pending: ' · Đã xác nhận, chưa xếp lịch',
  admitted: ' · Đang tạo',
  generating: ' · Đang tạo',
  generated: ' · Hoàn tất',
  incomplete: ' · Chưa hoàn tất, không tự chạy tiếp',
} as const

interface SlideButtonRefs {
  readonly button: HTMLButtonElement
  readonly label: HTMLElement
  readonly index: HTMLElement
  readonly thumbnail: HTMLElement
}

interface CanvasState {
  rendered: string
  lastSession: string
  lastSelected: string
  appeared: boolean
}

function canvasButton(text: string): HTMLButtonElement {
  const control = element('button', text)
  control.type = 'button'
  return control
}

function createCanvasControls() {
  const caption = element('p', 'Chat này chưa có deck đã xác nhận', 'slide-caption')
  caption.setAttribute('aria-live', 'polite')
  const counter = element('span', '0 / 0', 'deck-counter')
  counter.setAttribute('aria-hidden', 'true')
  const previous = canvasButton('Trước')
  previous.classList.add('deck-prev')
  previous.disabled = true
  const next = canvasButton('Sau')
  next.classList.add('deck-next')
  next.disabled = true
  const restart = canvasButton('Về đầu')
  restart.classList.add('deck-restart')
  restart.title = 'Về slide đầu tiên (R)'
  const restartKey = element('kbd', 'R')
  restartKey.setAttribute('aria-hidden', 'true')
  restart.append(restartKey)
  restart.disabled = true
  const exit = canvasButton('Thoát')
  exit.classList.add('deck-exit')
  exit.hidden = true
  const divider = element('span', undefined, 'deck-divider')
  divider.setAttribute('aria-hidden', 'true')
  const controls = element('nav', undefined, 'deck-controls')
  controls.setAttribute('aria-label', 'Điều hướng slide')
  controls.append(previous, counter, next, divider, restart, exit, caption)
  return { controls, caption, counter, previous, next, restart, exit }
}

function createCanvasStage() {
  const frame = element('iframe')
  frame.title = 'Slide đã lưu'
  frame.setAttribute('sandbox', '')
  frame.referrerPolicy = 'no-referrer'
  frame.hidden = true
  const stage = element('div', undefined, 'deck-stage')
  const placeholder = element('div', undefined, 'deck-placeholder')
  placeholder.setAttribute('role', 'status')
  stage.append(frame, placeholder)
  const fitStage = () => {
    const scale = Math.min(stage.clientWidth / PREVIEW_WIDTH, stage.clientHeight / 720)
    if (scale > 0) stage.style.setProperty('--slide-scale', String(scale))
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(fitStage).observe(stage)
  return { stage, frame, placeholder, fitStage }
}

function createCanvasDom(container: HTMLElement) {
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
  const present = canvasButton('Trình chiếu')
  present.classList.add('deck-present')
  present.disabled = true
  const actions = element('div', undefined, 'deck-actions')
  actions.append(
    present,
    button('Đóng', () => {
      container.hidden = true
    }),
  )
  const heading = element('header')
  heading.append(headingText, actions)
  const state = element('p', '', 'deck-connection')
  state.hidden = true
  state.setAttribute('role', 'status')
  const slides = element('nav', undefined, 'deck-slide-list')
  slides.setAttribute('aria-label', 'Danh sách slide')
  const { stage, frame, placeholder, fitStage } = createCanvasStage()
  const { controls, caption, counter, previous, next, restart, exit } = createCanvasControls()
  const viewer = element('div', undefined, 'deck-viewer')
  viewer.append(stage, controls)
  const workspace = element('div', undefined, 'deck-workspace')
  workspace.append(viewer, slides)
  panel.append(heading, state, workspace)
  container.append(panel)
  const rescale = () => {
    // offsetWidth ignores the entrance transform that motion.ts puts on new tiles.
    const width = slides.querySelector<HTMLElement>('.thumbnail')?.offsetWidth
    if (width) slides.style.setProperty('--preview-scale', String(width / PREVIEW_WIDTH))
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(rescale).observe(slides)
  return {
    container,
    panel,
    title,
    progress,
    present,
    state,
    slides,
    stage,
    frame,
    placeholder,
    caption,
    counter,
    previous,
    next,
    restart,
    exit,
    fitStage,
    rescale,
    slideButtons: new Map<string, SlideButtonRefs>(),
  }
}

type CanvasDom = ReturnType<typeof createCanvasDom>

function reconcileSlideButtons(dom: CanvasDom, snapshot: DeckSnapshot, model: DeckModel, queue: PreviewQueue): void {
  for (const [id, refs] of dom.slideButtons)
    if (!snapshot.slides.some(slide => slide.slideId === id)) {
      queue.unobserve(refs.button)
      refs.button.remove()
      dom.slideButtons.delete(id)
    }
  for (const [index, slide] of snapshot.slides.entries()) {
    let refs = dom.slideButtons.get(slide.slideId)
    if (!refs) {
      const control = button('', () => model.select(slide.slideId))
      control.dataset.slideId = slide.slideId
      const thumbnail = element('span', undefined, 'thumbnail')
      thumbnail.setAttribute('aria-hidden', 'true')
      thumbnail.append(element('i'), element('i'))
      const number = element('span', '', 'thumbnail-index')
      number.setAttribute('aria-hidden', 'true')
      const label = element('span', '', 'thumbnail-label')
      control.append(number, thumbnail, label)
      queue.observe(control)
      refs = { button: control, label, index: number, thumbnail }
      dom.slideButtons.set(slide.slideId, refs)
    }
    const text = `${slide.order + 1}. ${slide.title} · ${slide.status === 'pending' ? 'Chưa tạo xong' : `Bản ${slide.revision}`}`
    refs.button.title = text
    refs.button.setAttribute('aria-label', text)
    refs.button.dataset.status = slide.status
    refs.button.setAttribute('aria-current', String(slide.slideId === model.state.selectedId))
    const short = `${slide.order + 1} · ${slide.status === 'pending' ? 'chưa tới' : 'xong'}`
    if (refs.label.textContent !== short) refs.label.textContent = short
    if (refs.index.textContent !== String(slide.order + 1)) refs.index.textContent = String(slide.order + 1)
    if (dom.slides.children[index] !== refs.button)
      dom.slides.insertBefore(refs.button, dom.slides.children[index] ?? null)
    queue.ensurePreview(refs.button)
  }
}

function applySelection(dom: CanvasDom, value: DeckViewState, snapshot: DeckSnapshot, state: CanvasState): void {
  const selected = snapshot.slides.find(s => s.slideId === value.selectedId)
  const selectedIndex = snapshot.slides.findIndex(slide => slide.slideId === value.selectedId)
  if (selected && selected.slideId !== state.lastSelected) {
    state.lastSelected = selected.slideId
    dom.slideButtons.get(selected.slideId)?.button.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }
  dom.previous.disabled = selectedIndex <= 0
  dom.next.disabled = selectedIndex < 0 || selectedIndex >= snapshot.slides.length - 1
  dom.restart.disabled = selectedIndex <= 0
  dom.present.disabled = !snapshot.slides.length
  const position = `${selectedIndex + 1} / ${snapshot.slides.length}`
  if (dom.counter.textContent !== position) dom.counter.textContent = position
  dom.caption.textContent = selected
    ? `Slide ${selected.order + 1}/${snapshot.slides.length} · ${selected.status === 'pending' ? 'Chưa tạo xong' : `Bản ${selected.revision}`}`
    : 'Chat này chưa có deck đã xác nhận'
  dom.placeholder.hidden = value.html !== undefined
  dom.placeholder.textContent =
    selected?.status === 'pending'
      ? 'Slide này chưa được tạo xong. Nội dung hoàn tất sẽ hiện ở đây sau khi được lưu.'
      : value.connection === 'error'
        ? 'Không tải được bản slide đã lưu. Hãy kết nối lại.'
        : 'Đang tải bản slide đã lưu…'
  const key = value.html === undefined ? '' : `${snapshot.sessionId}/${selected?.slideId}/${selected?.revision}`
  if (key !== state.rendered) {
    state.rendered = key
    dom.frame.hidden = !key
    if (key) dom.frame.srcdoc = `${SLIDE_CSP}${value.html}`
    else dom.frame.removeAttribute('srcdoc')
  }
}

function applyDeckState(
  value: DeckViewState,
  dom: CanvasDom,
  model: DeckModel,
  queue: PreviewQueue,
  state: CanvasState,
  reveal: () => void,
): void {
  const snapshot = value.snapshot
  if (!snapshot) {
    state.rendered = ''
    dom.frame.removeAttribute('srcdoc')
    dom.frame.hidden = true
    dom.slides.replaceChildren()
    dom.slideButtons.clear()
    dom.caption.textContent = 'Đang tải deck'
    dom.counter.textContent = '0 / 0'
    dom.previous.disabled = true
    dom.next.disabled = true
    dom.restart.disabled = true
    dom.present.disabled = true
    dom.container.hidden = true
    state.appeared = false
    return
  }
  if (state.lastSession !== snapshot.sessionId) {
    state.lastSession = snapshot.sessionId
    state.appeared = false
    queue.reset()
    dom.slides.scrollTop = 0
    dom.slides.scrollLeft = 0
    state.lastSelected = ''
  }
  if (snapshot.outlineId && !state.appeared) {
    state.appeared = true
    reveal()
    dom.container.hidden = false
  }
  dom.state.textContent = connectionLabels[value.connection]
  dom.state.hidden = value.connection === 'live'
  dom.title.textContent = 'Bộ slide'
  const published = snapshot.slides.filter(slide => slide.status === 'published').length
  const generation = snapshot.generation
  dom.progress.textContent = `${published}/${snapshot.slides.length} slide đã lưu${generation ? generationLabels[generation.state] : ''}`
  dom.progress.title = generation
    ? `HTML · ${generation.design.template.id} · ${generation.design.designSystem.id}${generation.formatLocked ? ' · Đã khóa' : ''}`
    : ''
  reconcileSlideButtons(dom, snapshot, model, queue)
  dom.rescale()
  applySelection(dom, value, snapshot, state)
}

function restoreCanvasWidth(): number {
  try {
    const saved = localStorage.getItem('deckagent-canvas-width')
    if (saved && Number(saved) >= 320 && Number(saved) <= 1000) return Number(saved)
  } catch {
    /* Optional layout only. */
  }
  return 400
}

/** Canvas layout: a filmstrip of real slide previews beside a letterboxed stage, with a presentation mode
 * that fills the screen. Only the stage reads from DeckModel; previews use the same public client.
 */
export function mountDeckCanvas(container: HTMLElement, client: DeckClient, reveal: () => void): DeckModel {
  const dom = createCanvasDom(container)
  const canvas: CanvasState = { rendered: '', lastSession: '', lastSelected: '', appeared: false }
  let model: DeckModel
  const queue = createPreviewQueue({
    root: dom.slides,
    snapshot: () => model.state.snapshot,
    load: (sessionId, slideId, revision, signal) =>
      client.content(sessionId, slideId, revision, signal).then(content => content.html),
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
  model = new DeckModel(client, value => applyDeckState(value, dom, model, queue, canvas, reveal))
  dom.previous.addEventListener('click', () => navigate(-1))
  dom.next.addEventListener('click', () => navigate(1))
  dom.restart.addEventListener('click', () => go(0))
  dom.exit.addEventListener('click', () => {
    document.exitFullscreen().catch(() => {})
  })
  attachPresentationControls({
    panel: dom.panel,
    stage: dom.stage,
    present: dom.present,
    exit: dom.exit,
    state: dom.state,
    fitStage: dom.fitStage,
    snapshot: () => model.state.snapshot,
    selectedId: () => model.state.selectedId,
    go,
    navigate,
  })
  mountDeckResizer(container, restoreCanvasWidth(), value => {
    try {
      localStorage.setItem('deckagent-canvas-width', String(value))
    } catch {
      /* Layout remains usable. */
    }
  })
  return model
}
