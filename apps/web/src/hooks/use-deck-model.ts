import type { DeckChange, DeckSnapshot, SlideContent } from '@deckagent/host-contracts'
import { useSyncExternalStore } from 'react'
import { readDeck, readSlide, watchDeck } from '../api/deck.ts'

export interface DeckViewState {
  readonly snapshot?: DeckSnapshot
  readonly selectedId?: string
  readonly html?: string
  readonly connection: 'connecting' | 'live' | 'reconnecting' | 'error'
}

/** The Host reads of the published deck. Tests give their own implementation. */
export interface DeckApi {
  snapshot(sessionId: string, signal?: AbortSignal): Promise<DeckSnapshot>
  content(sessionId: string, slideId: string, revision: number, signal?: AbortSignal): Promise<SlideContent>
  watch(sessionId: string, signal: AbortSignal): AsyncIterable<DeckChange>
}

export const hostDeckApi: DeckApi = { snapshot: readDeck, content: readSlide, watch: watchDeck }

/**
 * The published deck of the open chat. A chat generation and the revision checks protect both the metadata and the
 * HTML replies. The SSE stream only wakes the model: a retry always reads the current state, and never publishes again.
 */
export class DeckModel {
  private sessionId: string | undefined
  private control: AbortController | undefined
  private current: DeckViewState = { connection: 'connecting' }
  private readonly selections = new Map<string, string>()
  private readonly listeners = new Set<() => void>()
  private load = 0

  constructor(
    private readonly api: DeckApi,
    private readonly changed: (state: DeckViewState) => void = () => {},
  ) {}

  get state(): DeckViewState {
    return this.current
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  readonly getState = (): DeckViewState => this.current

  open(sessionId: string): void {
    if (this.sessionId === sessionId && !this.control?.signal.aborted) return
    this.close()
    this.sessionId = sessionId
    const control = new AbortController()
    this.control = control
    this.set({ connection: 'connecting' })
    this.follow(sessionId, control.signal).catch(() => {
      if (!control.signal.aborted) this.set({ ...this.current, connection: 'error' })
    })
  }

  async refresh(): Promise<void> {
    const sessionId = this.sessionId,
      signal = this.control?.signal
    if (!sessionId || !signal || signal.aborted) return
    const snapshot = await this.api.snapshot(sessionId, signal)
    if (signal.aborted || sessionId !== this.sessionId || snapshot.sessionId !== sessionId) return
    if (this.current.snapshot && snapshot.version < this.current.snapshot.version) return
    const selection = this.current.selectedId ?? this.selections.get(sessionId)
    const selectedId = snapshot.slides.find(s => s.slideId === selection)?.slideId ?? snapshot.slides[0]?.slideId
    const before = this.current.snapshot?.slides.find(s => s.slideId === this.current.selectedId)
    const after = snapshot.slides.find(s => s.slideId === selectedId)
    const html =
      before?.slideId === after?.slideId && before?.revision === after?.revision ? this.current.html : undefined
    this.set({
      snapshot,
      ...(selectedId ? { selectedId } : {}),
      ...(html !== undefined ? { html } : {}),
      connection: this.current.connection,
    })
    await this.readSelected(sessionId, signal)
  }

  select(slideId: string): void {
    const sessionId = this.sessionId
    const signal = this.control?.signal
    if (!sessionId || !signal || signal.aborted || !this.current.snapshot?.slides.some(s => s.slideId === slideId))
      return
    this.selections.set(sessionId, slideId)
    const { snapshot, connection } = this.current
    this.set({ ...(snapshot ? { snapshot } : {}), selectedId: slideId, connection })
    this.readSelected(sessionId, signal).catch(() => {
      if (!signal.aborted) this.set({ ...this.current, connection: 'error' })
    })
  }

  /** Selects the slide at `index`, when it exists. */
  go(index: number): void {
    const slide = this.current.snapshot?.slides[index]
    if (slide) this.select(slide.slideId)
  }

  /** Moves the selection by `offset` slides. */
  navigate(offset: number): void {
    const slides = this.current.snapshot?.slides
    if (!slides?.length) return
    this.go(slides.findIndex(s => s.slideId === this.current.selectedId) + offset)
  }

  close(): void {
    this.control?.abort()
    this.sessionId = undefined
    this.load++
  }

  private set(state: DeckViewState): void {
    this.current = state
    this.changed(state)
    for (const listener of this.listeners) listener()
  }

  private async readSelected(sessionId: string, signal: AbortSignal): Promise<void> {
    const selected = this.current.snapshot?.slides.find(s => s.slideId === this.current.selectedId)
    const load = ++this.load
    if (!selected?.revision || this.current.html !== undefined) return
    const content = await this.api.content(sessionId, selected.slideId, selected.revision, signal)
    if (signal.aborted || this.sessionId !== sessionId || load !== this.load) return
    this.set({ ...this.current, html: content.html })
  }

  private async follow(sessionId: string, signal: AbortSignal): Promise<void> {
    let retry = 500
    while (!signal.aborted) {
      try {
        await this.refresh()
        if (signal.aborted) return
        for await (const notice of this.api.watch(sessionId, signal)) {
          if (signal.aborted) return
          retry = 500
          this.set({ ...this.current, connection: 'live' })
          if (!this.current.snapshot || notice.version > this.current.snapshot.version) await this.refresh()
        }
      } catch (error) {
        if (signal.aborted) return
        if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
          this.set({ ...this.current, connection: 'error' })
          return
        }
      }
      this.set({ ...this.current, connection: 'reconnecting' })
      await new Promise<void>(resolve => {
        const done = () => {
          clearTimeout(timer)
          signal.removeEventListener('abort', done)
          resolve()
        }
        const timer = setTimeout(done, retry)
        signal.addEventListener('abort', done, { once: true })
      })
      retry = Math.min(retry * 2, 10000)
    }
  }
}

/** Renders the current state of a deck model, and renders again on each change. */
export function useDeckModel(model: DeckModel): DeckViewState {
  return useSyncExternalStore(model.subscribe, model.getState)
}
