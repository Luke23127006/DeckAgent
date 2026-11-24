import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startLocalWeb } from '../apps/web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { HostClient, ConfirmationClient, DeckClient } from '../apps/web/lib/browser/index.js'
import { MemoryCredentials, finished, filesContaining } from './fixtures/b02-helpers.mjs'
import { brief } from './fixtures/brief.mjs'

const executable = process.env.DECKAGENT_OPENCODE
const enabled = process.env.DECKAGENT_OPENCODE_LIVE === '1'
function stageResult(value) {
  if (typeof value === 'string') {
    try {
      return stageResult(JSON.parse(value))
    } catch {
      return undefined
    }
  }
  if (!value || typeof value !== 'object') return undefined
  if (typeof value.stageId === 'string' && typeof value.starter === 'string') return value
  for (const child of Object.values(value)) {
    const result = stageResult(child)
    if (result) return result
  }
}

// The CLI and renderer are real. The loopback provider is deterministic and costs nothing;
// it does not replace acceptance with the user's selected cloud model.
for (const portable of [false, true])
  test(`real CLI generation publishes three ${portable ? 'portable' : 'legacy'} slides through MCP beyond eight model steps`, {
    skip: !enabled,
    timeout: 180000,
  }, async t => {
    const dir = await mkdtemp(join(tmpdir(), 'deckagent-generation-live-'))
    const credentials = new MemoryCredentials()
    const key = 'local-generation-fixture-only'
    let app, plan, stageId, stageStarter
    let requests = 0
    const toolNames = new Set()
    const provider = createServer(async (req, res) => {
      if (req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'application/json' }).end('{"data":[{"id":"local-model"}]}')
        return
      }
      try {
        let raw = ''
        for await (const chunk of req) raw += chunk
        const body = JSON.parse(raw)
        requests++
        for (const tool of body.tools ?? []) toolNames.add(tool.function.name)
        const results = body.messages.filter(m => m.role === 'tool')
        const count = results.length
        const steps = portable ? 5 : 4
        const index = Math.floor(count / steps)
        const slide = plan.slides[index]
        let name, args
        if (slide) {
          if (count % steps === 0) {
            name = 'begin_slide'
            args = { slideId: slide.slideId, layoutId: 'title-body' }
          } else {
            if (count % steps === 1) {
              stageId = JSON.stringify(results.at(-1).content).match(/stage-[a-f0-9-]{36}/)?.[0]
              if (portable) stageStarter = stageResult(results.at(-1).content)?.starter
            }
            assert.ok(stageId, 'The real MCP result must return an opaque stage ID')
            if (count % steps === 1) {
              name = 'append_slide'
              args = {
                stageId,
                sequence: 0,
                text: portable ? stageStarter : `<h1>${slide.title}</h1><ul><li>Explain</li></ul>`,
                final: true,
              }
            } else if (count % steps === 2) {
              name = 'record_slide_provenance'
              args = {
                stageId,
                entries: [
                  { text: 'Explain', kind: 'wording' },
                  ...(portable ? [{ text: slide.title, kind: 'wording' }] : []),
                ],
              }
            } else if (portable && count % steps === 3) {
              name = 'validate_slide'
              args = { stageId, slideId: slide.slideId }
            } else {
              name = 'publish_slide'
              args = { stageId, slideId: slide.slideId, expectedRevision: 0, publicationId: `pub-${index}` }
            }
          }
        }
        const delta = name
          ? {
              role: 'assistant',
              tool_calls: [
                {
                  index: 0,
                  id: `call-${count}`,
                  type: 'function',
                  function: { name: `deckagent_${name}`, arguments: JSON.stringify({ json: JSON.stringify(args) }) },
                },
              ],
            }
          : { role: 'assistant', content: 'Three published slides; no external sources or images were used.' }
        const frame = (delta, finish_reason = null) =>
          `data: ${JSON.stringify({ id: 'generation-local', object: 'chat.completion.chunk', created: 1, model: 'local-model', choices: [{ index: 0, delta, finish_reason }] })}\n\n`
        res
          .writeHead(200, { 'content-type': 'text/event-stream' })
          .end(frame(delta) + frame({}, name ? 'tool_calls' : 'stop') + 'data: [DONE]\n\n')
      } catch {
        res.writeHead(500, { 'content-type': 'application/json' }).end('{"error":{"message":"Local fixture failed"}}')
      }
    })
    await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve))
    t.after(async () => {
      await app?.close()
      provider.closeAllConnections()
      await new Promise(resolve => provider.close(resolve))
      await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
    })
    app = await startLocalWeb({
      dataDir: join(dir, 'data'),
      home: dir,
      credentials,
      openCode: { executable, timeoutMs: 90000 },
    })
    const api = async (path, method = 'GET', value) => {
      const response = await fetch(`${app.origin}/api/${path}`, {
        method,
        headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
        ...(value === undefined ? {} : { body: JSON.stringify(value) }),
      })
      assert.equal(response.ok, true, `Host status ${response.status}`)
      return response.json()
    }
    await api('providers/local', 'PUT', {
      displayName: 'Local generation fixture',
      protocol: 'chat-completions',
      baseUrl: `http://127.0.0.1:${provider.address().port}/v1`,
      key,
      models: ['local-model'],
      new: true,
    })
    const chat = await api('sessions', 'POST', { selection: { provider: 'local', model: 'local-model' } })
    const decks = new DeckService(join(dir, 'data', 'db', 'decks.sqlite'))
    try {
      const draft = {
        ...brief(),
        template: { id: 'html-basic', version: portable ? 2 : 1 },
        purpose: 'Explain',
        proposedSlideCount: 3,
        answers: [{ topic: 'images', value: 'None' }],
        sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
      }
      const b = decks.saveBrief(chat.sessionId, { expectedVersion: 0, draft })
      plan = decks.proposeBoundOutline(chat.sessionId, {
        requestId: 'review',
        responseIndex: 1,
        expectedOutline: null,
        expectedBrief: { briefId: b.briefId, version: b.version },
        draft: {
          overview: 'Three slides',
          revisionSuggestions: [],
          slides: ['Purpose', 'Approach', 'Next steps'].map(title => ({
            title,
            content: 'Explain',
            blocks: [{ kind: 'bullets', items: ['Explain'] }],
            sources: [],
          })),
        },
      })
    } finally {
      decks.close()
    }
    const target = {
      confirmationId: 'real-cli-generation',
      outlineId: plan.outlineId,
      outlineVersion: plan.version,
      briefId: plan.brief.briefId,
      briefVersion: plan.brief.version,
    }
    const accepted = await new ConfirmationClient(app.origin, app.token).confirm(chat.sessionId, target)
    const events = await finished(new HostClient(app.origin, app.token), accepted.receipt.requestId)
    assert.equal(events.at(-1).status, 'completed', JSON.stringify(events.at(-1)))
    assert.ok(requests >= 13, 'The CLI must finish all three slides with provenance instead of stopping at eight steps')
    assert.deepEqual(
      [...toolNames].toSorted(),
      [
        'read_generation_plan',
        'begin_slide',
        'append_slide',
        'attach_slide_image',
        'discard_slide',
        'publish_slide',
        'record_slide_provenance',
        ...(portable ? ['read_slide_draft', 'record_slide_content', 'validate_slide'] : []),
      ]
        .map(name => `deckagent_${name}`)
        .toSorted(),
      'The real provider must see only the confirmed version-specific generation tools',
    )
    const state = await new DeckClient(app.origin, app.token).snapshot(chat.sessionId)
    assert.equal(state.generation.state, 'generated')
    assert.deepEqual(
      state.slides.map(s => s.revision),
      [1, 1, 1],
    )
    for (const slide of state.slides) {
      const saved = await new DeckClient(app.origin, app.token).content(chat.sessionId, slide.slideId, 1)
      assert.ok(saved.html.includes(slide.title) && saved.html.includes('Explain'))
      if (portable) assert.equal(saved.document.slideId, slide.slideId)
    }
    assert.equal(
      (await new ConfirmationClient(app.origin, app.token).confirm(chat.sessionId, target)).receipt.requestId,
      accepted.receipt.requestId,
    )
    await app.close()
    assert.deepEqual(
      await filesContaining(join(dir, 'data'), key),
      [],
      'The fixture credential must not leak into files',
    )
    app = await startLocalWeb({
      dataDir: join(dir, 'data'),
      home: dir,
      credentials,
      openCode: { executable, timeoutMs: 90000 },
    })
    assert.equal((await new DeckClient(app.origin, app.token).snapshot(chat.sessionId)).generation.state, 'generated')
    assert.equal(
      (await new ConfirmationClient(app.origin, app.token).confirm(chat.sessionId, target)).receipt.requestId,
      accepted.receipt.requestId,
    )
    assert.equal(requests, portable ? 16 : 13, 'Restart and confirmation retries must not replay the CLI')
    t.diagnostic(`CLI 1.19.5, ${requests} model requests, 3/3 published slides; local provider only`)
  })
