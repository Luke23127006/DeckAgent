import type { DeckSnapshot } from '@deckagent/host-contracts'
import type { RefObject } from 'react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { readSlide } from '../api/deck.ts'

const concurrency = 3

/** The thumbnail HTML of one slide, with the revision key that it shows. */
export interface SlidePreview {
  readonly key: string
  readonly html: string
}

/** The previews of one chat. A preview of another chat is never shown. */
interface PreviewSet {
  readonly sessionId: string | undefined
  readonly bySlide: ReadonlyMap<string, SlidePreview>
}

type Load = (sessionId: string, slideId: string, revision: number, signal: AbortSignal) => Promise<string>

/**
 * Loads the thumbnails of the visible slide buttons, at most three at a time. The cache holds each read revision: a
 * saved revision does not change. A new chat drops the cache and the loads of the previous chat.
 */
class PreviewQueue {
  private snapshot: DeckSnapshot | undefined
  private control = new AbortController()
  private active = 0
  private readonly waiting: (() => void)[] = []
  private readonly cache = new Map<string, string>()
  private readonly loading = new Set<string>()
  private readonly visible = new Set<HTMLElement>()
  private readonly items = new Map<string, HTMLElement>()
  private observer: IntersectionObserver | undefined

  constructor(
    private readonly show: (sessionId: string, slideId: string, preview: SlidePreview) => void,
    private readonly load: Load,
  ) {}

  setSnapshot(snapshot: DeckSnapshot | undefined): void {
    if (snapshot?.sessionId !== this.snapshot?.sessionId) {
      this.control.abort()
      this.control = new AbortController()
      this.cache.clear()
      this.loading.clear()
      this.waiting.length = 0
    }
    this.snapshot = snapshot
    for (const item of this.items.values()) this.ensure(item)
  }

  observe(root: HTMLElement | null): () => void {
    if (typeof IntersectionObserver !== 'function') return () => {}
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!(entry.target instanceof HTMLElement)) continue
          if (entry.isIntersecting) {
            this.visible.add(entry.target)
            this.ensure(entry.target)
          } else this.visible.delete(entry.target)
        }
      },
      { root, rootMargin: '160px' },
    )
    this.observer = observer
    for (const item of this.items.values()) observer.observe(item)
    return () => {
      observer.disconnect()
      if (this.observer === observer) this.observer = undefined
    }
  }

  readonly register = (slideId: string, node: HTMLElement | null): void => {
    const previous = this.items.get(slideId)
    if (previous === node) return

    if (previous) {
      this.observer?.unobserve(previous)
      this.visible.delete(previous)
      this.items.delete(slideId)
    }

    if (!node) return

    this.items.set(slideId, node)

    if (this.observer) this.observer.observe(node)
    else if (typeof IntersectionObserver !== 'function') {
      this.visible.add(node)
      this.ensure(node)
    }
  }

  private ensure(item: HTMLElement): void {
    const snapshot = this.snapshot
    const slide = snapshot?.slides.find(entry => entry.slideId === item.dataset.slideId)
    if (!snapshot || !slide || slide.status !== 'published' || !this.visible.has(item)) return

    const key = `${snapshot.sessionId}/${slide.slideId}/${slide.revision}`

    const cached = this.cache.get(key)
    if (cached !== undefined) {
      this.show(snapshot.sessionId, slide.slideId, { key, html: cached })
      return
    }

    if (this.loading.has(key)) return

    this.loading.add(key)
    const signal = this.control.signal

    this.waiting.push(() => {
      this.load(snapshot.sessionId, slide.slideId, slide.revision, signal)
        .then(
          html => {
            if (signal.aborted) return
            this.cache.set(key, html)
            const node = this.items.get(slide.slideId)
            if (node) this.ensure(node)
          },
          // A preview is decorative: the slide number and the title stay usable without it.
          () => {},
        )
        .finally(() => {
          this.loading.delete(key)
          this.active--
          this.pump()
        })
    })

    this.pump()
  }

  private pump(): void {
    while (this.active < concurrency && this.waiting.length) {
      this.active++
      this.waiting.shift()?.()
    }
  }
}

const loadSlide: Load = (sessionId, slideId, revision, signal) =>
  readSlide(sessionId, slideId, revision, signal).then(content => content.html)

/**
 * The thumbnails of the slide list. A thumbnail loads only when its button is near the visible part of `root`, and at
 * most three loads run at a time. A thumbnail keeps the last HTML that it showed until the HTML of a newer revision is
 * read.
 */
export function useSlidePreviews(
  root: RefObject<HTMLElement | null>,
  snapshot: DeckSnapshot | undefined,
): {
  readonly previews: ReadonlyMap<string, SlidePreview>
  readonly register: (slideId: string, node: HTMLElement | null) => void
} {
  const [previews, setPreviews] = useState<PreviewSet>({ sessionId: undefined, bySlide: new Map() })
  const [queue] = useState(
    () =>
      new PreviewQueue((sessionId, slideId, preview) => {
        setPreviews(previous => {
          const base = previous.sessionId === sessionId ? previous.bySlide : new Map<string, SlidePreview>()
          if (base.get(slideId)?.key === preview.key) return previous
          const bySlide = new Map(base)
          bySlide.set(slideId, preview)
          return { sessionId, bySlide }
        })
      }, loadSlide),
  )

  useEffect(() => queue.observe(root.current), [queue, root])
  useLayoutEffect(() => queue.setSnapshot(snapshot), [queue, snapshot])

  const current = previews.sessionId === snapshot?.sessionId ? previews.bySlide : new Map<string, SlidePreview>()
  return { previews: current, register: queue.register }
}
