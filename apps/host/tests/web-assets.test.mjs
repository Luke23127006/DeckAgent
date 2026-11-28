// Checks that the Host serves the Vite build output from a fixed asset map: the SPA fallback for
// route paths, the 404 boundary for file paths and non-GET methods, the sandbox CSP for
// /samples/*.html, and the dynamic /theme.js script.
// Environment: the real startHost and the real loadWebDistAssets, with a temporary folder that
// stands in for apps/web/dist. fetch speaks to the loopback Host. No module is replaced.
// Run: corepack pnpm@11.28.5 build && node --test --test-reporter=tap apps/host/tests/web-assets.test.mjs
// Expected: all assertions pass. The task file is
// docs/build/refactor/web-react/plan/task-08-serve-web-dist-and-remove-load-web-assets.md.
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startHost } from '../lib/types/http/start-host.js'
import { loadWebDistAssets } from '../lib/types/http/web-assets.js'

test('loadWebDistAssets and Host SPA fallback enforce static, sandbox and 404 boundaries', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-web-assets-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  await mkdir(join(dir, 'assets'), { recursive: true })
  await mkdir(join(dir, 'samples'), { recursive: true })
  await writeFile(join(dir, 'index.html'), '<!doctype html><script type="module" src="/assets/app.js"></script>')
  await writeFile(join(dir, 'assets', 'app.js'), 'console.log("ok")')
  await writeFile(join(dir, 'samples', '2.html'), '<!doctype html><h1>Sample</h1>')

  let preferences = { theme: 'system', background: 'none' }
  const assets = await loadWebDistAssets(dir, () => preferences)
  const host = await startHost({ assets, spaFallback: true })
  t.after(() => host.close())

  assert.equal((await fetch(`${host.origin}/`)).status, 200)
  assert.match(await (await fetch(`${host.origin}/chats/chat-1`)).text(), /\/assets\/app\.js/)
  assert.match(await (await fetch(`${host.origin}/settings`)).text(), /\/assets\/app\.js/)
  assert.equal((await fetch(`${host.origin}/slide.html`)).status, 404)
  assert.equal((await fetch(`${host.origin}/assets/missing.js`)).status, 404)
  assert.equal((await fetch(`${host.origin}/`, { method: 'HEAD' })).status, 404)

  const sample = await fetch(`${host.origin}/samples/2.html`)
  assert.equal(sample.status, 200)
  assert.match(sample.headers.get('content-security-policy'), /^sandbox;/)

  assert.match(await (await fetch(`${host.origin}/theme.js`)).text(), /prefers-color-scheme:dark/)
  preferences = { theme: 'dark', background: 'none' }
  assert.equal(
    await (await fetch(`${host.origin}/theme.js`)).text(),
    "document.documentElement.classList.add('dark')",
    'The backdrop none sets no attribute',
  )
  preferences = { theme: 'light', background: 'koi' }
  assert.equal(
    await (await fetch(`${host.origin}/theme.js`)).text(),
    "document.documentElement.classList.remove('dark');document.documentElement.dataset.background='koi'",
  )
})
