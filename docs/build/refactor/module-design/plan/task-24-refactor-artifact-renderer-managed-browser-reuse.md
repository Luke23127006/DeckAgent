# Task 24: Refactor artifact-renderer for managed browser reuse

Read this file to replace per-render cold Chromium spawns in `apps/web/src/integrations/rendering/artifact-renderer.ts` with managed incognito browser reuse, wire `close()` in `apps/web/src/index.ts`, and check reuse and cleanup (`IN1`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/integrations/rendering/artifact-renderer.ts` (272 lines)
- `apps/web/src/integrations/rendering/index.ts` (1 line)
- `apps/web/src/index.ts` (lines 115-155 and lines 344-403)
- `e2e/artifact-rendering.test.mjs` (lines 1-90 and lines 190-218)

**Files:**

- Create: `apps/web/src/integrations/rendering/dom-validation.ts`
- Create: `apps/web/src/integrations/rendering/cdp-browser.ts`
- Change: `apps/web/src/integrations/rendering/artifact-renderer.ts`
- Change: `apps/web/src/integrations/rendering/index.ts`
- Change: `apps/web/src/index.ts`
- Change: `e2e/artifact-rendering.test.mjs`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-24-refactor-artifact-renderer-managed-browser-reuse.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-24-refactor-artifact-renderer-managed-browser-reuse.md`

**Interfaces:**

- Produces:
  - `apps/web/src/integrations/rendering/index.ts`: `artifactRenderer(root: string, options?: { readonly idleMs?: number }): ArtifactRenderer` and `export interface ArtifactRenderer { render(html: string, requiredText: readonly string[], caller: AbortSignal): Promise<void>; close(): Promise<void> }`
  - `apps/web/src/integrations/rendering/dom-validation.ts`: `buildValidationExpression(requiredText: readonly string[]): string`, `assertValidationReport(report: unknown): void`
  - `apps/web/src/integrations/rendering/cdp-browser.ts`: `CdpConnection`, `ManagedBrowser`, `launchManagedBrowser(root: string, signal: AbortSignal): Promise<ManagedBrowser>`, `disposeManagedBrowser(browser: ManagedBrowser, root: string): Promise<void>`

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files`.
- Change `openCode.timeoutMs` in `e2e/portable-generation-http.test.mjs` or `apps/web/tests/fixtures/b02-helpers.mjs`.
- Relax the `root` symlink check, `Network.setBlockedURLs` deny list, `1280x720` viewport, `15000` ms per-render timeout, or `2`-render concurrency cap.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 7 checks pass.

- [ ] **Step 1: Add a failing reuse and shutdown cleanup test in `e2e/artifact-rendering.test.mjs`**

Add `readdir` to the `node:fs/promises` import on line 3 of `e2e/artifact-rendering.test.mjs`. Append this test at the end of `e2e/artifact-rendering.test.mjs`:

```js
test('managed local renderer reuses one profile directory across renders and removes it on app close', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'artifact-reuse-'))
  let entriesDuringRun = []
  const runtime = {
    async prepare() {
      return {
        selection: { provider: 'fixture', model: 'model' },
        async start(run) {
          const cap = run.presentation
          const slideId = cap.plan().outline.slides[0].slideId
          for (let revision = 0; revision < 2; revision++) {
            const stage = cap.begin(slideId, 'title-body')
            cap.append(stage.stageId, {
              sequence: 0,
              text: `<h1>Purpose</h1><ul><li>Explain ${revision}</li></ul>`,
              final: true,
            })
            await cap.publish({
              stageId: stage.stageId,
              slideId,
              publicationId: `reuse-${revision}`,
              expectedRevision: revision,
            })
          }
          entriesDuringRun = await readdir(join(dir, 'data', 'files', 'runtime', 'artifact-check'))
          return { status: 'completed' }
        },
      }
    },
  }
  const f = await startApp(dir, { options: { generationRuntime: runtime } })
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const id = (await f.call('sessions', 'POST', {})).data.sessionId
  const decks = new DeckStore(join(dir, 'data', 'db', 'decks.sqlite'))
  const draft = brief()
  draft.sources.material = false
  draft.sources.modelKnowledge = true
  draft.proposedSlideCount = 1
  draft.purpose = 'Explain'
  draft.answers = [{ topic: 'images', value: 'None' }]
  const b = decks.saveBrief(id, { expectedVersion: 0, draft })
  const p = decks.proposeBoundOutline(id, {
    requestId: 'reuse-review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: 1 },
    draft: {
      overview: 'Reuse plan',
      revisionSuggestions: [],
      slides: [
        { title: 'Purpose', content: 'Explain', blocks: [{ kind: 'bullets', items: ['Explain'] }], sources: [] },
      ],
    },
  })
  decks.close()
  await new ConfirmationClient(f.app.origin, f.app.token).confirm(id, {
    confirmationId: 'reuse-confirm',
    outlineId: p.outlineId,
    outlineVersion: 1,
    briefId: b.briefId,
    briefVersion: 1,
  })
  await waitFor(
    async () => (await new DeckClient(f.app.origin, f.app.token).snapshot(id)).generation.state === 'generated',
  )
  assert.equal(entriesDuringRun.filter(name => name.startsWith('render-')).length, 1)
  await f.app.close()
  const entriesAfterClose = await readdir(join(dir, 'data', 'files', 'runtime', 'artifact-check'))
  assert.deepEqual(entriesAfterClose, [])
})
```

Run:

```bash
node --test e2e/artifact-rendering.test.mjs
```

Expected: FAIL. The new test fails because cold spawns remove the profile immediately (`entriesDuringRun` has `0` entries instead of `1`).

- [ ] **Step 2: Create `apps/web/src/integrations/rendering/dom-validation.ts`**

Move the DOM inspection script and validation check out of `artifact-renderer.ts`:
1. Export `buildValidationExpression(requiredText: readonly string[]): string` containing the exact script from `artifact-renderer.ts` lines 182-218 (calling `inspectControlledLayout.toString()`).
2. Export `assertValidationReport(report: unknown): void` checking `report.exceptionDetails`, `report.result.value.code`, and the exact six `allowedCodes` from `artifact-renderer.ts` lines 220-254.
3. Keep every function in `dom-validation.ts` under 75 lines, with zero `as` and zero `!`.

- [ ] **Step 3: Create `apps/web/src/integrations/rendering/cdp-browser.ts`**

Create the browser process and multiplexed CDP WebSocket helper (every function under 75 lines, zero `as`, zero `!`):
1. Keep `executable()`, `rendererEnvironment()`, and `verifySafeRoot(root: string)` matching the exact logic from `artifact-renderer.ts` lines 10-59 and 112-121.
2. Add `connectBrowser(url: string, onDisconnect: () => void): Promise<CdpConnection>`:
   - Opens one browser-level `WebSocket(url)`.
   - Exposes `call(method: string, params?: Record<string, unknown>, options?: { readonly sessionId?: string; readonly signal?: AbortSignal }): Promise<unknown>` and `close(): void`.
   - Sends `JSON.stringify({ id, ...(options?.sessionId ? { sessionId: options.sessionId } : {}), method, params: params ?? {} })`.
   - When `options?.signal` aborts, rejects only that pending call with `options.signal.reason` (or `DeckError('ARTIFACT_RENDERER_FAILED')`), removes the waiter, and leaves the browser socket open.
   - When the WebSocket closes or errors, rejects all pending waiters with `new DeckError('ARTIFACT_RENDERER_FAILED')` and calls `onDisconnect()`.
3. Export `launchManagedBrowser(root: string, signal: AbortSignal, onExit: () => void): Promise<ManagedBrowser>`:
   - Checks `root`, creates one `render-*` temp directory under `root`, and spawns Chrome/Edge with the exact flags and `rendererEnvironment()`.
   - Polls `DevToolsActivePort` every `25` ms until `port` matches `/^\d{1,5}$/` (throwing `ARTIFACT_RENDERER_FAILED` if `child.exitCode !== null` or aborted).
   - Requests `http://127.0.0.1:${port}/json/version` with `signal` and checks that `webSocketDebuggerUrl` starts with `ws://127.0.0.1:${port}/devtools/browser/`.
   - Connects via `connectBrowser` and registers `child.once('exit', onExit)`.
   - On any start failure, kills `child`, removes `folder` under the checked `root`, and throws `DeckError('ARTIFACT_RENDERER_FAILED')` (or rethrows `DeckError`).
4. Export `disposeManagedBrowser(browser: ManagedBrowser, root: string): Promise<void>`:
   - Attempts `browser.cdp.call('Browser.close', {}, { signal: AbortSignal.timeout(2000) }).catch(() => {})`, closes the socket, kills `browser.child` if `exitCode === null`, waits up to `2000` ms for exit, and removes `browser.folder` when `resolve(browser.folder).startsWith(resolve(root) + sep)` and `(await realpath(root).catch(() => null)) === resolve(root)` with `{ recursive: true, force: true, maxRetries: 3, retryDelay: 100 }`.

- [ ] **Step 4: Implement managed browser reuse in `artifact-renderer.ts` and update `rendering/index.ts`**

1. In `apps/web/src/integrations/rendering/artifact-renderer.ts`:
   - Keep a module-level `let activeRenders = 0` to preserve the process-wide concurrency cap (`if (activeRenders >= 2) throw new DeckError('ARTIFACT_RENDERER_BUSY')`).
   - Export `interface ArtifactRenderer { render(html: string, requiredText: readonly string[], caller: AbortSignal): Promise<void>; close(): Promise<void> }`.
   - Export `function artifactRenderer(root: string, options: { readonly idleMs?: number } = {}): ArtifactRenderer` with default `idleMs = 60_000`.
   - Maintain per-instance state: `browser: ManagedBrowser | undefined`, `launching: Promise<ManagedBrowser> | undefined`, `inFlight = 0`, `idleTimer: ReturnType<typeof setTimeout> | undefined`, `closed = false`, and `disposing: Promise<void> | undefined`.
   - Add private helpers (each under 70 lines):
     - `armIdleTimer()` / `clearIdleTimer()` using `setTimeout(() => { void recycle() }, idleMs)` with `timer.unref()` when `inFlight === 0 && idleMs > 0 && browser`.
     - `acquireBrowser(signal)`: deduplicates concurrent startup through `launching`, clears `idleTimer`, and clears cached state if `onExit` fires.
     - `runIsolatedRender(browser, html, requiredText, signal)`:
       1. Calls `Target.createBrowserContext({ disposeOnDetach: true })` and reads `browserContextId`.
       2. Calls `Target.createTarget({ url: 'about:blank', browserContextId })` and reads `targetId`.
       3. Calls `Target.attachToTarget({ targetId, flatten: true })` and reads `sessionId`.
       4. Sends `Emulation.setDeviceMetricsOverride` (`1280x720`, `deviceScaleFactor: 1`, `mobile: false`), `Network.enable`, `Network.setBlockedURLs` (`['http://*', 'https://*', 'file://*', 'ftp://*', 'ws://*', 'wss://*']`), `Page.getFrameTree`, `Page.setDocumentContent`, and `Runtime.evaluate` (`buildValidationExpression(requiredText)` with `awaitPromise: true, returnByValue: true`) using `{ sessionId, signal }`.
       5. Calls `assertValidationReport(report)`.
       6. In `finally`, always runs `Target.closeTarget({ targetId })` and `Target.disposeBrowserContext({ browserContextId })` with `AbortSignal.timeout(3000)`. If either cleanup call fails, returns `poisoned = true` so `render` calls `await recycle(browser)`.
     - `recycle(target?: ManagedBrowser)`: clears `idleTimer`, detaches `browser`, and calls `disposeManagedBrowser`.
     - `close()`: sets `closed = true`, waits for any in-flight `launching` promise to settle, and calls `recycle()`. Idempotent when called multiple times.
2. In `apps/web/src/integrations/rendering/index.ts`, export `artifactRenderer` and `type ArtifactRenderer`.

- [ ] **Step 5: Wire `renderer.render` and `renderer.close()` in `apps/web/src/index.ts`**

In `apps/web/src/index.ts`:
1. Construct `const renderer = artifactRenderer(join(layout.files, 'runtime', 'artifact-check'))` right after `const commonsImages = ...` (line 93).
2. At line 122, pass `renderCheck: (html, requiredText, signal) => renderer.render(html, requiredText, signal)`.
3. Call `await renderer.close()` in `close()` (after `await host.close()`, around line 355) and in the startup `catch` block (around line 381).

- [ ] **Step 6: Build, check boundaries, lint, format, check AST metrics, and run rendering and generation suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/integrations/rendering/ apps/web/src/index.ts e2e/artifact-rendering.test.mjs
```

Run quantitative check on `apps/web/src/integrations/rendering/`:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.path.startsWith('apps/web/src/integrations/rendering/')).map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,as:f.typeAssertions.length,nn};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every file has `over400: false`, `longFn: 0`, `as: 0`, and `nn: 0`.

Run rendering and generation test suites (measure `portable-generation-http.test.mjs` duration too):

```bash
node --test e2e/artifact-rendering.test.mjs && node --test e2e/portable-generation-http.test.mjs && corepack pnpm@11.28.5 test:generation-publication
```

Expected: PASS. Every command exits with code `0`, `# fail 0`, and `# skipped 0`. Record the `e2e/portable-generation-http.test.mjs` `duration_ms` in the report.

- [ ] **Step 7: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 6 as `- [x]` in this file. Update the Task 24 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-24-refactor-artifact-renderer-managed-browser-reuse.md`.
2. Create `docs/build/refactor/module-design/reports/task-24-refactor-artifact-renderer-managed-browser-reuse.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created and modified files.
   - Metrics table for `integrations/rendering/`.
   - Verification table with fail-first proof, exit codes, test counts, and measured `e2e/portable-generation-http.test.mjs` duration compared to the Task 3 baseline (`35.5` to `39.5` seconds per deck).
   - What the commands do not prove.
3. Add a Task 24 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 7 as `- [x]` in this file.
5. Run `git status --short` and check that only the files listed in `Files` changed. Stage only those files, commit with a conventional commit message (example: `refactor(web): reuse managed headless browser in artifact-renderer`), and run `git push`.

**STOP** and send the Task 24 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
