import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { DeckModel } from '../packages/client/runtime/lib/index.js'

const slide = (slideId, revision) => ({
  slideId,
  title: slideId,
  order: 0,
  revision,
  status: revision ? 'published' : 'pending',
})
const snapshot = (sessionId, version, slides) => ({
  sessionId,
  deckId: sessionId,
  outlineId: 'outline',
  version,
  slides: slides.map((s, order) => ({ ...s, order })),
})
async function until(check) {
  for (let i = 0; i < 100; i++) {
    if (check()) return
    await delay(10)
  }
  assert.fail('Model did not settle')
}

test('client model keeps selection, rejects old snapshots and ignores responses from a previous Session', async t => {
  let value = snapshot('one', 1, [slide('a', 1), slide('b', 0)])
  let release
  const blocked = new Promise(resolve => {
    release = resolve
  })
  const states = []
  const api = {
    async snapshot(id) {
      if (id === 'slow') return blocked
      return structuredClone(value)
    },
    async content(id, slideId, revision) {
      return { sessionId: id, slideId, revision, html: `<h1>${id}-${slideId}-${revision}</h1>` }
    },
    async *watch(id, signal) {
      yield { sessionId: id, deckId: id, version: 1 }
      await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
    },
  }
  const model = new DeckModel(api, state => states.push(state))
  t.after(() => model.close())
  model.open('one')
  await until(() => model.state.html?.includes('one-a-1'))
  model.select('b')
  assert.equal(model.state.html, undefined, 'pending slide has no draft content')
  value = snapshot('one', 2, [slide('a', 1), slide('b', 1), slide('c', 1)])
  await model.refresh()
  assert.equal(model.state.selectedId, 'b')
  assert.match(model.state.html, /one-b-1/)
  value = snapshot('one', 1, [slide('a', 1)])
  await model.refresh()
  assert.equal(model.state.snapshot.version, 2)
  assert.equal(model.state.selectedId, 'b')
  model.open('slow')
  value = snapshot('two', 1, [slide('x', 1)])
  model.open('two')
  await until(() => model.state.html?.includes('two-x-1'))
  release(snapshot('slow', 99, [slide('wrong', 1)]))
  await delay(20)
  assert.equal(model.state.snapshot.sessionId, 'two')
  assert.match(model.state.html, /two-x-1/)
  assert.ok(states.length > 2)
})

test('lost SSE reconnects through a fresh snapshot without replaying Agent work', async t => {
  let connections = 0
  const model = new DeckModel(
    {
      async snapshot(id) {
        return snapshot(id, connections ? 2 : 1, [slide('a', connections ? 1 : 0)])
      },
      async content(id, slideId, revision) {
        return { sessionId: id, slideId, revision, html: '<h1>Recovered</h1>' }
      },
      async *watch(id, signal) {
        connections++
        yield { sessionId: id, deckId: id, version: connections === 1 ? 1 : 2 }
        if (connections === 1) throw new Error('Connection lost')
        await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
      },
    },
    () => {},
  )
  t.after(() => model.close())
  model.open('chat')
  await until(() => model.state.connection === 'reconnecting')
  await until(() => model.state.html === '<h1>Recovered</h1>' && model.state.connection === 'live')
  assert.equal(model.state.snapshot.version, 2)
  assert.equal(connections, 2)
})
