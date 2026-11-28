// Checks the published deck model of the chat screen: the selection, the order of snapshots and the reconnection.
// Runs in Vitest. The test gives the model its own deck reads; no Host runs.
// Run: corepack pnpm@11.28.5 test:web
// Expected values follow the deck routes of the Host: a snapshot holds no HTML and an SSE notice only wakes the model.
import type { DeckChange, DeckSnapshot, SlideContent } from '@deckagent/host-contracts'
import { expect, it, onTestFinished } from 'vitest'
import { DeckModel } from '../src/hooks/use-deck-model.ts'
import type { DeckApi, DeckViewState } from '../src/hooks/use-deck-model.ts'

const slide = (slideId: string, revision: number) => ({
  slideId,
  title: slideId,
  order: 0,
  revision,
  status: revision ? ('published' as const) : ('pending' as const),
})

function snapshot(sessionId: string, version: number, slides: ReturnType<typeof slide>[]): DeckSnapshot {
  return {
    sessionId,
    deckId: sessionId,
    outlineId: 'outline',
    version,
    slides: slides.map((entry, order) => ({ ...entry, order })),
  }
}

function content(sessionId: string, slideId: string, revision: number, html: string): SlideContent {
  return { sessionId, slideId, revision, html }
}

async function until(check: () => boolean): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if (check()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error('The model did not settle')
}

function waitForAbort(signal: AbortSignal): Promise<void> {
  return new Promise(resolve => signal.addEventListener('abort', () => resolve(), { once: true }))
}

it('keeps the selection, refuses an older snapshot and drops a reply of the previous chat', async () => {
  let value = snapshot('one', 1, [slide('a', 1), slide('b', 0)])
  let release: (value: DeckSnapshot) => void = () => {}
  const blocked = new Promise<DeckSnapshot>(resolve => {
    release = resolve
  })
  const states: DeckViewState[] = []
  const api: DeckApi = {
    snapshot: async id => (id === 'slow' ? blocked : structuredClone(value)),
    content: async (id, slideId, revision) => content(id, slideId, revision, `<h1>${id}-${slideId}-${revision}</h1>`),
    async *watch(id, signal): AsyncGenerator<DeckChange> {
      yield { sessionId: id, deckId: id, version: 1 }
      await waitForAbort(signal)
    },
  }
  const model = new DeckModel(api, state => states.push(state))
  onTestFinished(() => model.close())
  model.open('one')
  await until(() => !!model.state.html?.includes('one-a-1'))
  model.select('b')
  expect(model.state.html, 'a pending slide has no draft content').toBeUndefined()
  value = snapshot('one', 2, [slide('a', 1), slide('b', 1), slide('c', 1)])
  await model.refresh()
  expect(model.state.selectedId).toBe('b')
  expect(model.state.html).toMatch(/one-b-1/)
  value = snapshot('one', 1, [slide('a', 1)])
  await model.refresh()
  expect(model.state.snapshot?.version).toBe(2)
  expect(model.state.selectedId).toBe('b')
  model.open('slow')
  value = snapshot('two', 1, [slide('x', 1)])
  model.open('two')
  await until(() => !!model.state.html?.includes('two-x-1'))
  release(snapshot('slow', 99, [slide('wrong', 1)]))
  await new Promise(resolve => setTimeout(resolve, 20))
  expect(model.state.snapshot?.sessionId).toBe('two')
  expect(model.state.html).toMatch(/two-x-1/)
  expect(states.length).toBeGreaterThan(2)
})

it('reads a fresh snapshot after a lost SSE connection and does not run Agent work again', async () => {
  let connections = 0
  const model = new DeckModel({
    snapshot: async id => snapshot(id, connections ? 2 : 1, [slide('a', connections ? 1 : 0)]),
    content: async (id, slideId, revision) => content(id, slideId, revision, '<h1>Recovered</h1>'),
    async *watch(id, signal): AsyncGenerator<DeckChange> {
      connections++
      yield { sessionId: id, deckId: id, version: connections === 1 ? 1 : 2 }
      if (connections === 1) throw new Error('CONNECTION_LOST')
      await waitForAbort(signal)
    },
  })
  onTestFinished(() => model.close())
  model.open('chat')
  await until(() => model.state.connection === 'reconnecting')
  await until(() => model.state.html === '<h1>Recovered</h1>' && model.state.connection === 'live')
  expect(model.state.snapshot?.version).toBe(2)
  expect(connections).toBe(2)
})

it('moves the selection with go and navigate and stays inside the deck', async () => {
  const model = new DeckModel({
    snapshot: async id => snapshot(id, 1, [slide('a', 1), slide('b', 1), slide('c', 1)]),
    content: async (id, slideId, revision) => content(id, slideId, revision, slideId),
    async *watch(id, signal): AsyncGenerator<DeckChange> {
      yield { sessionId: id, deckId: id, version: 1 }
      await waitForAbort(signal)
    },
  })
  onTestFinished(() => model.close())
  model.open('chat')
  await until(() => model.state.html === 'a')
  model.navigate(1)
  expect(model.state.selectedId).toBe('b')
  model.go(2)
  expect(model.state.selectedId).toBe('c')
  model.navigate(1)
  expect(model.state.selectedId, 'the last slide has no next slide').toBe('c')
  model.go(-1)
  expect(model.state.selectedId).toBe('c')
})
