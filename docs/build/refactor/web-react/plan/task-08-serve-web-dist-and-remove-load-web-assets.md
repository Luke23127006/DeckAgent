# Task 8: Serve apps/web/dist with SPA fallback and remove loadWebAssets

Read this file to learn the steps of Task 8, which serves the Vite build output from the Host with SPA fallback, updates `build-workspace.mjs` and removes `apps/web/src/index.ts`.

**Type:** Code

**Read first:**
- [Revision 2 Global Constraints](README.md#revision-2-global-constraints) and [Task protocol](README.md#task-protocol) in `README.md`
- `apps/host/src/http/contracts.ts`, `apps/host/src/http/app.ts` and `apps/host/src/server.ts`
- `apps/host/package.json` and `apps/web/package.json`
- `scripts/build-workspace.mjs`
- `apps/web/tsconfig.json`
- `apps/host/tests/web-management.test.mjs`, `e2e/local-web.test.mjs` and `e2e/browser-smoke.test.mjs`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

**Files:**
- Create: `apps/host/src/http/web-assets.ts`
- Change: `apps/host/src/http/contracts.ts`, `apps/host/src/http/app.ts`, `apps/host/src/server.ts`, `apps/host/package.json`, `scripts/build-workspace.mjs`, `apps/web/tsconfig.json`, `apps/web/package.json`, `apps/host/tests/web-management.test.mjs`, `e2e/local-web.test.mjs`, `e2e/browser-smoke.test.mjs`
- Remove: `apps/web/src/index.ts`
- Test: `apps/host/tests/web-assets.test.mjs`

**Interfaces:**
- Uses: `WebPreferences` from `@deckagent/host-contracts` and `HostOptions` from `./contracts.ts`.
- Produces:
  - `apps/host/src/http/web-assets.ts`: `export function themeBootstrap(theme: WebPreferences['theme']): string`, `export async function loadWebDistAssets(distDir: string, getTheme: () => WebPreferences['theme']): Promise<NonNullable<HostOptions['assets']>>`.
  - `apps/host/src/http/contracts.ts`: `HostOptions.spaFallback?: boolean` and `body: string | Buffer` on asset entries.

**STOP when:** Any `/api/*` test expectation in `e2e/http-edge.test.mjs` or `apps/host/tests/web-management.test.mjs` fails.

**Forbidden:** Do not change any `/api/*` path, status code or JSON body. Do not read arbitrary files from disk per HTTP request.

- [x] **Step 1: Write the failing test**

Create `apps/host/tests/web-assets.test.mjs` with a header comment that follows `docs/conventions/testware.md`:

```js
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startHost } from '../lib/types/http/start-host.js'
import { loadWebDistAssets, themeBootstrap } from '../lib/types/http/web-assets.js'

test('loadWebDistAssets and Host SPA fallback enforce static, sandbox and 404 boundaries', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-web-assets-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  await mkdir(join(dir, 'assets'), { recursive: true })
  await mkdir(join(dir, 'samples'), { recursive: true })
  await writeFile(join(dir, 'index.html'), '<!doctype html><script type="module" src="/assets/app.js"></script>')
  await writeFile(join(dir, 'assets', 'app.js'), 'console.log("ok")')
  await writeFile(join(dir, 'samples', '2.html'), '<!doctype html><h1>Sample</h1>')

  let theme = 'system'
  const assets = await loadWebDistAssets(dir, () => theme)
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
  theme = 'dark'
  assert.equal(await (await fetch(`${host.origin}/theme.js`)).text(), themeBootstrap('dark'))
  theme = 'light'
  assert.equal(await (await fetch(`${host.origin}/theme.js`)).text(), themeBootstrap('light'))
})
```

- [x] **Step 2: Run the test and make sure that it fails**

Run: `node --test --test-reporter=tap apps/host/tests/web-assets.test.mjs`
Expected: FAIL. The output reports that `web-assets.js` does not exist.

- [x] **Step 3: Implement `web-assets.ts`, SPA fallback, Host wiring and Vite build step**

1. Update `apps/host/src/http/contracts.ts`: change asset `body` type to `string | Buffer` and add `readonly spaFallback?: boolean` to `HostOptions`.
2. Create `apps/host/src/http/web-assets.ts`:
   - `themeBootstrap(theme)`: return `"document.documentElement.classList.add('dark')"` for `'dark'`, `"document.documentElement.classList.remove('dark')"` for `'light'`, and `"if(matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')"` for `'system'`.
   - `loadWebDistAssets(distDir, getTheme)`: recursively read files in `distDir`. Map `index.html` to `'/'` and other files to `'/' + posixRelativePath`. Set `contentType` from extension (`.html`, `.js`, `.mjs`, `.css`, `.svg`, `.png`, `.json`, `.ico`, `.woff2`). Set `sandboxed: true` on `/samples/*.html`. Add the dynamic getter entry `'/theme.js'` returning `themeBootstrap(getTheme())`.
3. Update `apps/host/src/http/app.ts`: in `serveAsset`, add `isSpaRoutePath(pathname)` that returns true only when `pathname` does not start with `/api/`, `/assets/` or `/samples/`, contains no `%`, and its last segment contains no `.`. When `req.method === 'GET'`, `options.spaFallback` is true, `isSpaRoutePath(pathname)` is true and `'/'` exists in `options.assets`, serve `options.assets['/']`.
4. Update `apps/host/src/server.ts`: replace `import { loadWebAssets } from '@deckagent/local-web'` with `import { loadWebDistAssets } from './http/web-assets.ts'`. Resolve `distDir` with `fileURLToPath(new URL('../../web/dist', import.meta.url))` and set `spaFallback: true` in `createHostOptions`.
5. Remove `"@deckagent/local-web": "workspace:*"` from `apps/host/package.json`.
6. Update `scripts/build-workspace.mjs`: when `pkg.name === '@deckagent/local-web'`, run Vite build with `spawnSync(process.execPath, [resolve(pkg.path, 'node_modules/vite/bin/vite.js'), 'build', '--configLoader', 'native'], { cwd: resolve(pkg.path), stdio: 'inherit' })`, fail on non-zero exit, and `continue` to skip `tsdown`.
7. Remove `apps/web/src/index.ts`. In `apps/web/tsconfig.json`, set `"types": ["vite/client"]` and `"emitDeclarationOnly": true`. In `apps/web/package.json`, remove `main`, `types` and `exports`.
8. Update the three deliberate Phase 2 assertions:
   - `apps/host/tests/web-management.test.mjs`: assert `/prefers-color-scheme:dark.*classList\.add\('dark'\)/` for `'system'` and `/classList\.add\('dark'\)/` for `'dark'`.
   - `e2e/local-web.test.mjs`: change `/\/client\/boot\.js/` to `/\/assets\/.*\.js/`.
   - `e2e/browser-smoke.test.mjs`: change `document.documentElement.dataset.theme === 'dark'` to `document.documentElement.classList.contains('dark')`.

- [x] **Step 4: Build and run related tests**

Run: `corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0.

Run: `node --test --test-reporter=tap apps/host/tests/web-assets.test.mjs apps/host/tests/web-management.test.mjs e2e/local-web.test.mjs e2e/http-edge.test.mjs`
Expected: PASS. The output contains `# fail 0`.

- [x] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
