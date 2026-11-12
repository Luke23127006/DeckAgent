import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startLocalWeb } from '../../apps/local-web/lib/index.js'
import { HostClient } from '../../packages/client/runtime/lib/index.js'

export const fakeCli = resolve(fileURLToPath(new URL('./fake-opencode.mjs', import.meta.url)))

/** In-memory credential store for fast checks; the Windows store is checked separately. */
export class MemoryCredentials {
  persistent = true
  values = new Map()
  async save(secret) { const ref = `cred-${randomUUID()}`; this.values.set(ref, secret); return ref }
  async read(ref) { if (!this.values.has(ref)) throw new Error('CREDENTIAL_UNAVAILABLE'); return this.values.get(ref) }
  async remove(ref) { this.values.delete(ref) }
}

/** A local provider endpoint: `GET /v1/models` answers only the expected key; refusals echo the key like some providers do. */
export async function providerFixture(key) {
  const server = createServer((req, res) => {
    if (req.url !== '/v1/models' || req.method !== 'GET') { res.writeHead(404).end(); return }
    if (key && req.headers.authorization !== `Bearer ${key.current}`) {
      res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: `invalid key ${req.headers.authorization}` }))
      return
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: [{ id: 'model-a' }, { id: 'model-b' }, { id: 'model-c' }] }))
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/v1`,
    close: () => new Promise(done => { server.closeAllConnections(); server.close(done) }),
  }
}

export async function startApp(dir, extra = {}) {
  const log = join(dir, 'fake-opencode.log')
  const app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    home: dir,
    credentials: extra.credentials ?? new MemoryCredentials(),
    openCode: { executable: process.execPath, launcherArgs: [fakeCli, log], version: 'fake-1.0.0', timeoutMs: 30000, ...extra.openCode },
    ...extra.options,
  })
  const call = async (path, method = 'GET', body) => {
    const response = await fetch(`${app.origin}/api/${path}`, { method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, data: await response.json().catch(() => undefined) }
  }
  return { app, log, call, client: new HostClient(app.origin, app.token) }
}

export function runs(log) {
  if (!existsSync(log)) return []
  return readFileSync(log, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)).filter(entry => entry.command === 'run')
}

export async function finished(client, requestId) {
  const events = []
  for await (const event of client.watch(requestId)) events.push(event)
  return events
}

export async function waitFor(check, timeout = 10000) {
  const until = Date.now() + timeout
  while (Date.now() < until) {
    const value = await check()
    if (value) return value
    await new Promise(done => setTimeout(done, 25))
  }
  throw new Error('Timed out waiting')
}

/** Every file under `folder` whose bytes contain `needle`. */
export async function filesContaining(folder, needle) {
  const found = []
  for (const entry of await readdir(folder, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue
    const path = join(entry.parentPath ?? entry.path, entry.name)
    if ((await readFile(path)).includes(Buffer.from(needle))) found.push(path)
  }
  return found
}

export async function listTree(folder) {
  return (await readdir(folder, { recursive: true })).sort()
}
