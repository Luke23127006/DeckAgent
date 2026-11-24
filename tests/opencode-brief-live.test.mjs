import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startLocalWeb } from '../apps/web/lib/index.js'
import { HostClient, BriefClient, OutlineClient } from '../apps/web/lib/browser/index.js'
import { MemoryCredentials, finished } from './fixtures/b02-helpers.mjs'
import { brief } from './fixtures/brief.mjs'

function toolData(value, predicate) {
  if (typeof value === 'string') {
    try {
      return toolData(JSON.parse(value), predicate)
    } catch {
      return undefined
    }
  }
  if (!value || typeof value !== 'object') return undefined
  if (predicate(value)) return value
  for (const child of Object.values(value)) {
    const found = toolData(child, predicate)
    if (found) return found
  }
}
test('real CLI receives the canonical Brief schema and repairs field errors before staging seven slides', {
  skip: process.env.DECKAGENT_OPENCODE_LIVE !== '1',
  timeout: 90000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'brief-native-repair-'))
  let app,
    requests = 0,
    fixtureError
  const bad = {
    ...brief(),
    topic: 'Effective study habits',
    audience: 'New students',
    purpose: 'Explain study habits',
    proposedSlideCount: 7,
    requestedFormat: 'HTML',
    durationMinutes: null,
    themeOverrides: null,
    template: { id: 'html-basic', version: 2 },
    sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
    answers: [{ topic: 'images', value: 'No images' }],
  }
  const outline = {
    overview: 'Study habits',
    revisionSuggestions: [],
    slides: Array.from({ length: 7 }, (_, i) => ({
      title: `Study habit ${i + 1}`,
      content: 'Explain',
      blocks: [{ kind: 'bullets', items: ['Explain'] }],
      sources: [],
    })),
  }
  const provider = createServer(async (req, res) => {
    if (req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json' }).end('{"data":[{"id":"local-model"}]}')
      return
    }
    try {
      let raw = ''
      for await (const chunk of req) raw += chunk
      const body = JSON.parse(raw),
        results = body.messages.filter(m => m.role === 'tool'),
        count = results.length
      requests++
      const schemaTool = body.tools.find(t => t.function.name === 'deckagent_stage_brief')
      assert.ok(schemaTool)
      const description = schemaTool.function.parameters.properties.json.description
      const schema = JSON.parse(description.slice(description.indexOf('{')))
      assert.equal(schema.properties.durationMinutes.type, 'number')
      assert.equal(schema.properties.generationFormat.const, 'html')
      assert.equal(schema.required.includes('durationMinutes'), false)
      let name, args
      if (count === 0) {
        name = 'stage_brief'
        args = bad
      } else if (count === 1) {
        const rejection = toolData(results.at(-1).content, v => v.code === 'BRIEF_INVALID')
        assert.ok(rejection)
        assert.deepEqual(
          new Set(rejection.issues.map(i => i.path)),
          new Set(['requestedFormat', 'durationMinutes', 'themeOverrides']),
        )
        assert.equal(rejection.repair.remaining, 2)
        const corrected = structuredClone(bad)
        // The simulated model reads the field issues and the user's explicit 10-minute answer.
        for (const issue of rejection.issues) {
          if (issue.path === 'requestedFormat') corrected.requestedFormat = 'html'
          else if (issue.path === 'durationMinutes') corrected.durationMinutes = 10
          else if (issue.path === 'themeOverrides') delete corrected.themeOverrides
          else throw new Error('Unexpected field issue')
        }
        name = 'stage_brief'
        args = corrected
      } else if (count === 2) {
        assert.equal(
          toolData(results.at(-1).content, v => typeof v.readyForOutline === 'boolean')?.readyForOutline,
          true,
        )
        name = 'stage_outline'
        args = outline
      }
      const delta = name
        ? {
            role: 'assistant',
            tool_calls: [
              {
                index: 0,
                id: `brief-call-${count}`,
                type: 'function',
                function: { name: `deckagent_${name}`, arguments: JSON.stringify({ json: JSON.stringify(args) }) },
              },
            ],
          }
        : { role: 'assistant', content: 'Seven-slide Outline staged. No slides have been created.' }
      const frame = (delta, finish_reason = null) =>
        `data: ${JSON.stringify({ id: 'brief-local', object: 'chat.completion.chunk', created: 1, model: 'local-model', choices: [{ index: 0, delta, finish_reason }] })}\n\n`
      res
        .writeHead(200, { 'content-type': 'text/event-stream' })
        .end(frame(delta) + frame({}, name ? 'tool_calls' : 'stop') + 'data: [DONE]\n\n')
    } catch (error) {
      fixtureError = error
      res
        .writeHead(500, { 'content-type': 'application/json' })
        .end('{"error":{"message":"Local Brief fixture failed"}}')
    }
  })
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve))
  t.after(async () => {
    await app?.close()
    provider.closeAllConnections()
    await new Promise(resolve => provider.close(resolve))
    await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
  })
  app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    home: dir,
    credentials: new MemoryCredentials(),
    openCode: { executable: process.env.DECKAGENT_OPENCODE, timeoutMs: 45000 },
  })
  const api = async (path, method = 'GET', value) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    assert.equal(response.ok, true, `HTTP ${response.status}`)
    return response.json()
  }
  await api('providers/local', 'PUT', {
    displayName: 'Local Brief fixture',
    protocol: 'chat-completions',
    baseUrl: `http://127.0.0.1:${provider.address().port}/v1`,
    key: 'brief-local-fixture-only',
    models: ['local-model'],
    new: true,
  })
  const chat = await api('sessions', 'POST', { selection: { provider: 'local', model: 'local-model' } })
  const request = await api('requests', 'POST', {
    sessionId: chat.sessionId,
    input:
      'Create exactly seven slides about study habits for new students, in English, for 10 minutes. Use HTML Basic v2, general knowledge and no images.',
    deck: {
      action: 'collect',
      expectedBriefVersion: 0,
      expectedOutline: null,
      sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
    },
  })
  const events = await finished(new HostClient(app.origin, app.token), request.requestId)
  assert.equal(fixtureError, undefined, fixtureError?.message)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events.at(-1)))
  const stored = await new BriefClient(app.origin, app.token).snapshot(chat.sessionId)
  assert.equal(stored.version, 1)
  assert.equal(stored.current.draft.durationMinutes, 10)
  assert.equal(stored.current.draft.requestedFormat, 'html')
  assert.equal(stored.current.draft.sources.publicResearch, false)
  const saved = await new OutlineClient(app.origin, app.token).snapshot(chat.sessionId)
  assert.equal(saved.proposals.length, 1)
  assert.equal(saved.proposals[0].slides.length, 7)
  assert.equal((await api(`sessions/${chat.sessionId}/deck`)).slides.length, 0)
  assert.equal(requests, 4)
  t.diagnostic(
    'Real OpenCode 1.19.5, loopback model fixture, one malformed Brief repaired in the same request; no cloud calls.',
  )
})
