import type { DeckSnapshot } from '@deckagent/host-contracts'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { DeckModel, DeckViewState } from '../hooks/use-deck-model.ts'
import { useDeckModel } from '../hooks/use-deck-model.ts'
import { usePanelResizer } from '../hooks/use-panel-resizer.ts'
import { usePresentation } from '../hooks/use-presentation.ts'
import { useSlidePreviews } from '../hooks/use-slide-previews.ts'
import type { SlidePreview } from '../hooks/use-slide-previews.ts'
import { deckText } from '../text.ts'
import { SlideFrame } from './slide-frame.tsx'

const text = deckText.canvas
/** Published HTML lays out at this viewport. Each view scales the same canvas without a new layout. */
const slideWidth = 1280
const slideHeight = 720
const widthKey = 'deckagent-canvas-width'

function savedWidth(): number {
  try {
    const saved = localStorage.getItem(widthKey)
    if (saved && Number(saved) >= 320 && Number(saved) <= 1000) return Number(saved)
  } catch {
    /* The width is optional. */
  }
  return 400
}

function saveWidth(width: number): void {
  try {
    localStorage.setItem(widthKey, String(width))
  } catch {
    /* The layout stays usable. */
  }
}

function placeholderText(state: DeckViewState, pending: boolean): string {
  if (pending) return text.pendingSlide
  return state.connection === 'error' ? text.loadFailed : text.loadingSlide
}

/** One button of the filmstrip. Its ref stays the same between renders, so the thumbnail observer keeps its node. */
function SlideButton(props: {
  readonly slide: DeckSnapshot['slides'][number]
  readonly selected: boolean
  readonly preview: SlidePreview | undefined
  readonly register: (slideId: string, node: HTMLElement | null) => void
  readonly onSelect: (slideId: string) => void
}) {
  const { slide, preview, register } = props
  const slideId = slide.slideId
  const ref = useCallback((node: HTMLButtonElement | null) => register(slideId, node), [register, slideId])

  const pending = slide.status === 'pending'
  const label = text.slideLabel(slide.order + 1, slide.title, text.slideState(pending, slide.revision))

  return (
    <button
      ref={ref}
      type="button"
      title={label}
      aria-label={label}
      aria-current={props.selected ? 'true' : 'false'}
      data-slide-id={slideId}
      data-status={slide.status}
      data-preview={preview?.key}
      onClick={() => props.onSelect(slideId)}
    >
      <span className="thumbnail-index" aria-hidden="true">
        {slide.order + 1}
      </span>
      <span className={preview ? 'thumbnail has-preview' : 'thumbnail'} aria-hidden="true">
        <i />
        <i />
        {preview && <SlideFrame html={preview.html} decorative />}
      </span>
      <span className="thumbnail-label">{text.slideShort(slide.order + 1, pending)}</span>
    </button>
  )
}

/**
 * The published deck of the open chat: a stage with the selected slide above a filmstrip of slide thumbnails, and a
 * presentation mode that fills the screen. The stage reads the deck model; the thumbnails read the same public routes.
 */
export function PublishedDeck(props: {
  readonly model: DeckModel
  readonly open: boolean
  readonly onClose: () => void
}) {
  const { model } = props
  const state = useDeckModel(model)
  const snapshot = state.snapshot
  const slides = snapshot?.slides ?? []
  const panel = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLElement>(null)
  const [initialWidth] = useState(savedWidth)
  const [failure, setFailure] = useState<{ readonly state: DeckViewState; readonly text: string }>()
  const { previews, register } = useSlidePreviews(list, snapshot)

  const fitStage = useCallback(() => {
    const node = stage.current
    if (!node) return
    const scale = Math.min(node.clientWidth / slideWidth, node.clientHeight / slideHeight)
    if (scale > 0) node.style.setProperty('--slide-scale', String(scale))
  }, [])
  const presentation = usePresentation(panel, stage, model, fitStage)
  const { container, divider } = usePanelResizer({
    initial: initialWidth,
    save: saveWidth,
    valueText: deckText.resizer.value,
  })

  const rescale = useCallback(() => {
    const node = list.current
    // offsetWidth ignores the entrance transform that the motion layer puts on a new thumbnail.
    const width = node?.querySelector<HTMLElement>('.thumbnail')?.offsetWidth
    if (node && width) node.style.setProperty('--preview-scale', String(width / slideWidth))
  }, [])

  useEffect(() => {
    if (typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(() => {
      fitStage()
      rescale()
    })
    if (stage.current) observer.observe(stage.current)
    if (list.current) observer.observe(list.current)
    return () => observer.disconnect()
  }, [fitStage, rescale])

  useLayoutEffect(rescale)

  // A new chat starts the filmstrip at its start.
  const sessionId = snapshot?.sessionId
  useLayoutEffect(() => {
    const node = list.current
    if (!node || sessionId === undefined) return
    node.scrollTop = 0
    node.scrollLeft = 0
  }, [sessionId])

  // A new selection, also the first selection of another chat, scrolls its button into view.
  const selectedId = state.selectedId
  const selection = sessionId && selectedId ? `${sessionId}/${selectedId}` : undefined
  useEffect(() => {
    if (!selection) return
    const id = selection.slice(selection.indexOf('/') + 1)
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    list.current
      ?.querySelector<HTMLElement>(`[data-slide-id="${id}"]`)
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [selection])

  const selectedIndex = slides.findIndex(slide => slide.slideId === selectedId)
  const selected = slides[selectedIndex]
  const published = slides.filter(slide => slide.status === 'published').length
  const generation = snapshot?.generation
  const html = snapshot ? state.html : undefined
  const caption = !snapshot
    ? text.loading
    : selected
      ? text.caption(
          selected.order + 1,
          slides.length,
          text.slideState(selected.status === 'pending', selected.revision),
        )
      : text.noDeck
  const notice = failure?.state === state ? failure.text : text.connection[state.connection]
  const present = () => presentation.toggle().catch(() => setFailure({ state, text: text.noFullscreen }))
  return (
    <aside ref={container} className="deck-sidebar published-deck-sidebar" hidden={!props.open}>
      <section
        ref={panel}
        className="deck-panel"
        aria-label={text.label}
        tabIndex={-1}
        data-presenting={String(presentation.presenting)}
        data-idle={String(presentation.idle)}
      >
        <header>
          <div className="deck-heading">
            <h2>{text.title}</h2>
            <small
              className="deck-progress"
              aria-live="polite"
              title={
                generation
                  ? text.design(
                      generation.design.template.id,
                      generation.design.designSystem.id,
                      generation.formatLocked,
                    )
                  : ''
              }
            >
              {text.progress(published, slides.length, generation ? text.generation[generation.state] : '')}
            </small>
          </div>
          <div className="deck-actions">
            <button type="button" className="deck-present" disabled={!slides.length} onClick={() => void present()}>
              {text.present}
            </button>
            <button type="button" onClick={props.onClose}>
              {text.close}
            </button>
          </div>
        </header>
        <p
          className="deck-connection"
          role="status"
          hidden={!snapshot || (state.connection === 'live' && failure?.state !== state)}
        >
          {snapshot ? notice : ''}
        </p>
        <div className="deck-workspace">
          <div className="deck-viewer">
            <div ref={stage} className="deck-stage">
              <SlideFrame title={text.frame} html={html} hidden={html === undefined} />
              <div className="deck-placeholder" role="status" hidden={html !== undefined}>
                {placeholderText(state, selected?.status === 'pending')}
              </div>
            </div>
            <nav className="deck-controls" aria-label={text.navigation}>
              <button
                type="button"
                className="deck-prev"
                disabled={selectedIndex <= 0}
                onClick={() => model.navigate(-1)}
              >
                {text.previous}
              </button>
              <span className="deck-counter" aria-hidden="true">
                {text.position(selectedIndex + 1, slides.length)}
              </span>
              <button
                type="button"
                className="deck-next"
                disabled={selectedIndex < 0 || selectedIndex >= slides.length - 1}
                onClick={() => model.navigate(1)}
              >
                {text.next}
              </button>
              <span className="deck-divider" aria-hidden="true" />
              <button
                type="button"
                className="deck-restart"
                title={text.restartTitle}
                disabled={selectedIndex <= 0}
                onClick={() => model.go(0)}
              >
                {text.restart}
                <kbd aria-hidden="true">{text.restartKey}</kbd>
              </button>
              <button
                type="button"
                className="deck-exit"
                hidden={!presentation.presenting}
                onClick={() => {
                  document.exitFullscreen().catch(() => {})
                }}
              >
                {text.exit}
              </button>
              <p className="slide-caption" aria-live="polite">
                {caption}
              </p>
            </nav>
          </div>
          <nav ref={list} className="deck-slide-list" aria-label={text.slides}>
            {slides.map(slide => (
              <SlideButton
                key={slide.slideId}
                slide={slide}
                selected={slide.slideId === selectedId}
                preview={previews.get(slide.slideId)}
                register={register}
                onSelect={slideId => model.select(slideId)}
              />
            ))}
          </nav>
        </div>
      </section>
      <div
        ref={divider}
        className="deck-resizer"
        role="separator"
        aria-label={deckText.resizer.label}
        aria-orientation="vertical"
        title={deckText.resizer.title}
      />
    </aside>
  )
}
