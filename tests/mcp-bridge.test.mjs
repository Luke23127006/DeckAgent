import assert from 'node:assert/strict'
import test from 'node:test'
import * as local from '../apps/local-web/lib/index.js'

const tools = { context: 'fixture', manifest: '{}', schemas: [{ name: 'read_source', description: 'Read a source',
  inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false } }],
  async call(name, args) { return { isError: false, content: [{ type: 'text', text: `${name}:${args.path}` }] } } }

test('request MCP exposes only its tools, authenticates every call and rejects direct unlisted calls and revoked tokens', async t => {
  const abort = new AbortController()
  const bridge = await local.openToolBridge({ tools, signal: abort.signal })
  t.after(() => bridge.close())
  const rpc = (method, params, token = bridge.token) => fetch(bridge.url, { method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })
  assert.equal((await rpc('tools/list', {}, 'wrong')).status, 403)
  assert.deepEqual((await (await rpc('tools/list', {})).json()).result.tools.map(item => item.name), ['read_source'])
  const result = await (await rpc('tools/call', { name: 'read_source', arguments: { path: 'notes.txt' } })).json()
  assert.equal(result.result.content[0].text, 'read_source:notes.txt')
  const denied = await (await rpc('tools/call', { name: 'write_file', arguments: {} })).json()
  assert.equal(denied.result.isError, true)
  assert.equal(denied.result.content[0].text, 'TOOL_NOT_ALLOWED')
  const other = await local.openToolBridge({ tools, signal: new AbortController().signal })
  t.after(() => other.close())
  assert.equal((await fetch(other.url, { method: 'POST', headers: { authorization: `Bearer ${bridge.token}` } })).status, 403)
  abort.abort()
  assert.equal((await rpc('tools/list', {})).status, 403)
})
