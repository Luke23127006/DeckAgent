import assert from 'node:assert/strict'
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { OpenCodeAgentHandle } from '../apps/local-web/lib/types/opencode/agent.js'
import { MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { openWireFixture, replyWire } from './fixtures/opencode-wire.mjs'
import { documentFixtures } from './fixtures/material-documents.mjs'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { setTimeout as delay } from 'node:timers/promises'

const enabled = process.env.DECKAGENT_OPENCODE_CLI_TESTS === '1'

test('OpenCode file reference with redundant matching path still asks approval; another path stays denied', {
  skip: !enabled,
  timeout: 90000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-reference-path-'))
  const source = join(root, 'source')
  await mkdir(source)
  await writeFile(join(source, 'notes.txt'), 'AUTHORIZED_FIXTURE_FACT')
  await writeFile(join(source, 'other.txt'), 'OTHER_PRIVATE_FIXTURE')
  let materialId,
    requestedPath = 'notes.txt'
  const fixture = await openWireFixture('gemini', (body, res) => {
    const response = body.contents?.at(-1)?.parts?.some(part => part.functionResponse || part.function_response)
    replyWire(
      res,
      'gemini',
      response
        ? { text: 'Fixture finished' }
        : { call: { name: 'deckagent_read_material', arguments: { materialId, path: requestedPath } } },
    )
  })
  const previous = process.env.DECKAGENT_MATERIAL_REFERENCE_KEY
  process.env.DECKAGENT_MATERIAL_REFERENCE_KEY = 'NOT_A_CREDENTIAL'
  const selection = { provider: 'fixture', model: 'reference' }
  const app = await startLocalWeb({
    dataDir: join(root, 'data'),
    materials: { maxFileBytes: 1024, maxAttachments: 2 },
    selection,
    connections: [
      { id: 'fixture', protocol: 'gemini', baseUrl: fixture.baseUrl, apiKeyEnv: 'DECKAGENT_MATERIAL_REFERENCE_KEY' },
    ],
    openCode: {
      executable: resolve(
        process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
          '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
      ),
    },
  })
  t.after(async () => {
    await app.close()
    await fixture.close()
    if (previous === undefined) delete process.env.DECKAGENT_MATERIAL_REFERENCE_KEY
    else process.env.DECKAGENT_MATERIAL_REFERENCE_KEY = previous
    await rm(root, { recursive: true, force: true })
  })
  const api = async (path, method, value) => {
    const result = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    assert.ok(result.ok, `Host HTTP ${result.status}`)
    return result.json()
  }
  const workspace = await api('workspaces', 'POST', { projectFolder: source })
  const chat = await api('sessions', 'POST', { selection, workspaceId: workspace.id })
  const sessionId = chat.sessionId
  await api(`sessions/${sessionId}/permissions`, 'PUT', { preset: 'provided-materials-only' })
  const reference = await api(`sessions/${sessionId}/references`, 'POST', { path: 'notes.txt' })
  materialId = reference.materialId
  const client = new HostClient(app.origin, app.token)
  const finish = async id => {
    let final
    for await (const value of client.watch(id)) final = value
    assert.equal(final.status, 'completed', final.result?.error?.code)
  }
  for (const decision of ['deny', 'once']) {
    const request = await client.send({ sessionId, input: 'Read the supplied reference', referenceIds: [materialId] })
    let approval
    for (let i = 0; i < 600; i++) {
      const snapshot = await client.snapshot(request.requestId)
      if (snapshot.approval) {
        approval = snapshot.approval
        break
      }
      assert.equal(snapshot.status, 'running', 'Matching file path must reach approval instead of MATERIAL_UNAVAILABLE')
      await delay(25)
    }
    assert.ok(approval)
    assert.equal(approval.target, await import('node:fs/promises').then(fs => fs.realpath(join(source, 'notes.txt'))))
    await api(`requests/${request.requestId}/approval`, 'POST', {
      sessionId,
      approvalId: approval.approvalId,
      version: approval.version,
      replyId: decision,
      decision,
    })
    await finish(request.requestId)
    const tool = (await client.history(sessionId)).filter(message => message.role === 'tool').at(-1)
    assert.equal(tool.isError, decision === 'deny')
    assert.equal(tool.content.includes('AUTHORIZED_FIXTURE_FACT'), decision === 'once')
    if (decision === 'deny') assert.match(tool.content, /PERMISSION_DENIED/)
  }
  requestedPath = 'other.txt'
  const rejected = await client.send({
    sessionId,
    input: 'Read without widening the referenced ID',
    referenceIds: [materialId],
  })
  await finish(rejected.requestId)
  const history = await client.history(sessionId)
  assert.equal(history.filter(message => message.role === 'tool').at(-1).isError, true)
  assert.equal(
    history.some(message => message.content.includes('OTHER_PRIVATE_FIXTURE')),
    false,
  )
  assert.equal(await readFile(join(source, 'notes.txt'), 'utf8'), 'AUTHORIZED_FIXTURE_FACT')
})
test('pinned OpenCode sends only Host-selected PNG/JPEG bytes and retains the MCP-only tool list', {
  skip: !enabled,
  timeout: 60000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-material-images-'))
  const fixture = await openWireFixture('gemini', (_body, res) => replyWire(res, 'gemini', { text: 'IMAGE_COMPLETE' }))
  const tools = new ToolRegistry()
  tools.register({
    name: 'probe',
    description: 'Probe',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      return 'probe'
    },
  })
  const files = documentFixtures()
  const images = [
    { bytes: files['red.png'], mediaType: 'image/png' },
    { bytes: files['red.jpeg'], mediaType: 'image/jpeg' },
  ]
  const options = {
    root,
    executable: resolve(
      process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
        '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
    ),
    sessionId: 'images',
    sessions: new MemorySessionStore(),
    tools,
    allowed: ['probe'],
    systemPrompt: 'Use only supplied materials.',
    maxSteps: 4,
    provider: {
      protocol: 'gemini',
      baseUrl: fixture.baseUrl,
      model: 'fixture-image',
      key: 'NOT_A_CREDENTIAL',
      imageInput: true,
    },
    images,
  }
  t.after(async () => {
    await fixture.close()
    await rm(root, { recursive: true, force: true })
  })
  await assert.rejects(OpenCodeAgentHandle.open({ ...options, provider: { ...options.provider, imageInput: false } }), {
    code: 'MATERIAL_IMAGE_INPUT_UNVERIFIED',
  })
  const agent = await OpenCodeAgentHandle.open(options)
  t.after(() => agent.dispose())
  const result = await agent.send('Describe the supplied images.')
  assert.equal(result.status, 'completed', result.error?.code)
  const parts = fixture.requests.flatMap(req => req.body.contents ?? []).flatMap(content => content.parts ?? [])
  const data = parts.map(part => part.inlineData ?? part.inline_data).filter(Boolean)
  assert.equal(data.length, 2)
  const sha = bytes => createHash('sha256').update(bytes).digest('hex')
  assert.deepEqual(
    data.map(part => sha(Buffer.from(part.data, 'base64'))).sort(),
    images.map(image => sha(image.bytes)).sort(),
  )
  for (const request of fixture.requests)
    assert.deepEqual(
      (request.body.tools ?? []).flatMap(tool => tool.functionDeclarations ?? []).map(tool => tool.name),
      ['deckagent_probe'],
    )
})
