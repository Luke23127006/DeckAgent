import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import type { DeckModel } from './use-deck-model.ts'

const idleMs = 2500
const wakeEvents = ['pointermove', 'pointerdown', 'touchstart'] as const

function keyTarget(key: string, index: number, last: number): number | undefined {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
      return index + 1
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      return index - 1
    case 'Home':
    case 'r':
    case 'R':
      return 0
    case 'End':
      return last
    default:
      return undefined
  }
}

/**
 * The presentation mode of the published deck: `panel` fills the screen. The keys move between slides, a click on the
 * left third of `stage` goes back and a click on the rest goes forward. The controls fade when the pointer rests.
 */
export function usePresentation(
  panel: RefObject<HTMLElement | null>,
  stage: RefObject<HTMLElement | null>,
  model: DeckModel,
  onChange: () => void,
): {
  readonly presenting: boolean
  readonly idle: boolean
  readonly toggle: () => Promise<void>
} {
  const [presenting, setPresenting] = useState(false)
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    const node = panel.current
    const slideStage = stage.current
    if (!node || !slideStage) return

    const isPresenting = () => document.fullscreenElement === node
    let timer: ReturnType<typeof setTimeout> | undefined
    const wake = () => {
      clearTimeout(timer)
      setIdle(false)
      if (isPresenting()) timer = setTimeout(() => setIdle(true), idleMs)
    }
    const onFullscreen = () => {
      const on = isPresenting()
      setPresenting(on)
      onChange()
      if (on) node.focus({ preventScroll: true })
      wake()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLTextAreaElement) return
      // Space on a focused button keeps its own meaning.
      if (event.key === ' ' && event.target instanceof HTMLButtonElement) return

      const slides = model.state.snapshot?.slides
      if (!slides?.length) return

      const index = slides.findIndex(slide => slide.slideId === model.state.selectedId)
      const target = keyTarget(event.key, index, slides.length - 1)
      if (target === undefined) return

      event.preventDefault()
      model.go(Math.max(0, Math.min(slides.length - 1, target)))
      wake()
    }
    // The slide iframe is inert while presenting (CSS), so a click lands on the stage.
    const onStageClick = (event: MouseEvent) => {
      if (!isPresenting()) return
      const box = slideStage.getBoundingClientRect()
      model.navigate(event.clientX - box.left < box.width * 0.3 ? -1 : 1)
    }
    document.addEventListener('fullscreenchange', onFullscreen)

    for (const type of wakeEvents) node.addEventListener(type, wake, { passive: true })

    node.addEventListener('keydown', onKey)
    slideStage.addEventListener('click', onStageClick)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('fullscreenchange', onFullscreen)
      for (const type of wakeEvents) node.removeEventListener(type, wake)
      node.removeEventListener('keydown', onKey)
      slideStage.removeEventListener('click', onStageClick)
    }
  }, [panel, stage, model, onChange])

  const toggle = () => {
    const node = panel.current
    if (!node) return Promise.resolve()
    return document.fullscreenElement === node ? document.exitFullscreen() : node.requestFullscreen()
  }
  return { presenting, idle, toggle }
}
