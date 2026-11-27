import { useEffect, useRef, useState } from 'react'
import { usePanelResizer } from '../hooks/use-panel-resizer.ts'
import { readSampleLayout, saveSampleLayout } from '../hooks/use-deck-screens.ts'
import { deckText } from '../text.ts'
import { SlideFrame } from './slide-frame.tsx'

const text = deckText.sample
const sampleCount = 3

/** The sample deck: three fixed slides that the Host serves. It has no chat, no deck and no saved revision. */
export function SampleDeck(props: { readonly open: boolean; readonly onOpenChange: (open: boolean) => void }) {
  const [initial] = useState(readSampleLayout)
  const [current, setCurrent] = useState(initial.current)
  const [failed, setFailed] = useState(false)
  const panel = useRef<HTMLElement>(null)
  const layout = useRef({ current: initial.current, width: initial.width, open: props.open })

  useEffect(() => {
    layout.current.current = current
    layout.current.open = props.open
    saveSampleLayout(layout.current)
  }, [current, props.open])

  const { container, divider } = usePanelResizer({
    initial: initial.width,
    save: width => {
      layout.current.width = width
      saveSampleLayout(layout.current)
    },
    valueText: deckText.resizer.value,
  })

  const go = (index: number) => {
    setFailed(false)
    setCurrent(index)
  }
  return (
    <aside ref={container} className="deck-sidebar" hidden={!props.open}>
      <section ref={panel} className="deck-panel" aria-label={text.label}>
        <header>
          <h2>{text.label}</h2>
          <button type="button" onClick={() => props.onOpenChange(false)}>
            {text.close}
          </button>
        </header>
        <SlideFrame title={text.frame} src={`/samples/${current + 1}.html`} />
        <p className="slide-caption" aria-live="polite">
          {failed ? text.noFullscreen : text.caption(current + 1)}
        </p>
        <nav className="deck-controls" aria-label={deckText.canvas.navigation}>
          <button type="button" className="deck-prev" onClick={() => go((current + sampleCount - 1) % sampleCount)}>
            {deckText.canvas.previous}
          </button>
          <button type="button" className="deck-next" onClick={() => go((current + 1) % sampleCount)}>
            {deckText.canvas.next}
          </button>
          <button
            type="button"
            onClick={() => {
              const node = panel.current
              if (!node) return
              const work = document.fullscreenElement ? document.exitFullscreen() : node.requestFullscreen()
              work.catch(() => setFailed(true))
            }}
          >
            {text.fullscreen}
          </button>
        </nav>
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
