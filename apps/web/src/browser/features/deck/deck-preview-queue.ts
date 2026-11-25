import type { DeckSnapshot } from '@deckagent/host-contracts'
import { element } from '../../dom.ts'

const PREVIEW_CONCURRENCY = 3

// Published content never joins the application DOM. Empty sandbox => opaque origin.
// srcdoc inherits Host CSP; its leading CSP further disallows every network source.
export const SLIDE_CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">`

type PreviewLoader = (sessionId: string, slideId: string, revision: number, signal: AbortSignal) => Promise<string>

interface PreviewState {
  readonly root: HTMLElement
  readonly snapshot: () => DeckSnapshot | undefined
  readonly load: PreviewLoader
  readonly previews: Map<string, string>
  readonly loading: Set<string>
  readonly waiting: Array<() => void>
  readonly visible: WeakSet<HTMLElement>
  control: AbortController
  active: number
}

export interface PreviewQueue {
  readonly observe: (item: HTMLElement) => void
  readonly unobserve: (item: HTMLElement) => void
  readonly ensurePreview: (item: HTMLElement) => void
  readonly reset: () => void
}

function pump(state: PreviewState): void {
  while (state.active < PREVIEW_CONCURRENCY && state.waiting.length) {
    state.active++
    state.waiting.shift()?.()
  }
}

function fetchPreview(state: PreviewState, sessionId: string, slideId: string, revision: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const signal = state.control.signal
    state.waiting.push(() => {
      state
        .load(sessionId, slideId, revision, signal)
        .then(resolve, reject)
        .finally(() => {
          state.active--
          pump(state)
        })
    })
    pump(state)
  })
}

function paintPreview(item: HTMLElement, key: string, html: string): void {
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

function ensurePreview(state: PreviewState, item: HTMLElement): void {
  const snapshot = state.snapshot()
  const slide = snapshot?.slides.find(entry => entry.slideId === item.dataset.slideId)
  if (!snapshot || !slide || slide.status !== 'published' || !state.visible.has(item)) return
  const key = `${snapshot.sessionId}/${slide.slideId}/${slide.revision}`
  if (item.dataset.preview === key) return
  const cached = state.previews.get(key)
  if (cached !== undefined) {
    paintPreview(item, key, cached)
    return
  }
  if (state.loading.has(key)) return
  state.loading.add(key)
  fetchPreview(state, snapshot.sessionId, slide.slideId, slide.revision).then(
    html => {
      state.loading.delete(key)
      state.previews.set(key, html)
      ensurePreview(state, item)
    },
    // A preview is decorative: the slide number and title stay usable without it.
    () => state.loading.delete(key),
  )
}

function createObserver(state: PreviewState): IntersectionObserver | undefined {
  if (typeof IntersectionObserver !== 'function') return undefined
  return new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (!(entry.target instanceof HTMLElement)) continue
        const item = entry.target
        if (entry.isIntersecting) {
          state.visible.add(item)
          ensurePreview(state, item)
        } else state.visible.delete(item)
      }
    },
    { root: state.root, rootMargin: '160px' },
  )
}

export function createPreviewQueue(options: {
  readonly root: HTMLElement
  readonly snapshot: () => DeckSnapshot | undefined
  readonly load: PreviewLoader
}): PreviewQueue {
  const state: PreviewState = {
    root: options.root,
    snapshot: options.snapshot,
    load: options.load,
    previews: new Map(),
    loading: new Set(),
    waiting: [],
    visible: new WeakSet(),
    control: new AbortController(),
    active: 0,
  }
  const observer = createObserver(state)
  return {
    observe: item => {
      if (observer) observer.observe(item)
      else state.visible.add(item)
    },
    unobserve: item => observer?.unobserve(item),
    ensurePreview: item => ensurePreview(state, item),
    reset: () => {
      state.control.abort()
      state.control = new AbortController()
      state.previews.clear()
      state.loading.clear()
      state.waiting.length = 0
    },
  }
}
