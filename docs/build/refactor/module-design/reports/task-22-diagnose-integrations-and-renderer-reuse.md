# Task 22: Integrations and Renderer Reuse Diagnosis Report

Read this file to review the deep-module diagnosis of `apps/web/src/integrations/`, the browser reuse evaluation for `artifact-renderer.ts`, and the classified findings for Slice 2C owner approval [[1]](#ref-1) [[2]](#ref-2).

## Commands run

Task 22 ran read-only commands without changing production code, test files, or convention documents [[1]](#ref-1).

| Command | Exit code | Key output |
| --- | --- | --- |
| Live metrics, AST assertions, and renderer importers script (Step 1) | `0` | `fileCount: 22`, `totalLines: 2526`, `longFnTotal: 10`, `assertionTotal: 4`, `nonNullTotal: 10`, `rendererImporters: ["apps/web/src/index.ts"]` |
| Integration barrel export reference audit script (Step 2) | `0` | `barrelCount: 6`, `totalBarrelExports: 30` (`24` with production callers, `4` unused externally, `2` test-only) |
| `git status --short` (Step 4) | `0` | Empty output before report edits. Zero changes in `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` |

## Export audit (6 barrels, 30 exports)

The six integration barrels expose 30 symbols in total. Four symbols have zero external references, and two symbols have test-only references.

| Barrel | Export | Production refs | Test refs | Status |
| --- | --- | --- | --- | --- |
| `credentials/index.ts` | `CredentialError` | `1` | `0` | Used |
| `credentials/index.ts` | `ProtectedFileCredentialStore` | `1` | `0` | Used |
| `credentials/index.ts` | `UnavailableCredentialStore` | `0` | `0` | Unused externally (instantiated only inside `credential-store.ts:150`) |
| `credentials/index.ts` | `defaultCredentialStore` | `1` | `2` | Used |
| `credentials/index.ts` | `CredentialStore` (type) | `3` | `0` | Used |
| `images/index.ts` | `CommonsImages` | `2` | `1` | Used |
| `images/index.ts` | `CommonsCandidate` (type) | `1` | `0` | Used |
| `images/index.ts` | `ImageReadError` | `1` | `0` | Used |
| `images/index.ts` | `PublicImageReader` | `2` | `1` | Used |
| `images/index.ts` | `ImageLookup` (type) | `1` | `0` | Used |
| `images/index.ts` | `ImageSourceError` | `1` | `0` | Used |
| `images/index.ts` | `imageSource` | `1` | `0` | Used |
| `opencode/index.ts` | `pinnedVersion` | `0` | `3` | Test-only barrel export (`opencode-adapter.test.mjs:10` imports from `config.js`) |
| `opencode/index.ts` | `OpenCodeError` | `1` | `0` | Used |
| `opencode/index.ts` | `OpenCodeErrorCode` (type) | `0` | `0` | Unused externally |
| `opencode/index.ts` | `OpenCodeErrorDetail` (type) | `0` | `0` | Unused externally |
| `opencode/index.ts` | `OpenCodeExecutor` (type) | `1` | `0` | Used |
| `opencode/index.ts` | `RuntimeSessionAccess` (type) | `0` | `0` | Unused externally (`apps/web/src/index.ts` passes a structural literal) |
| `opencode/index.ts` | `openToolBridge` | `0` | `1` | Test-only barrel export (`mcp-bridge.test.mjs:27,49`) |
| `opencode/index.ts` | `OpenCodeRuntime` | `1` | `0` | Used |
| `opencode/index.ts` | `findExecutable` | `1` | `0` | Used |
| `opencode/index.ts` | `OpenCodeOptions` (type) | `1` | `0` | Used |
| `providers/index.ts` | `ProviderCheckError` | `1` | `0` | Used |
| `providers/index.ts` | `listModels` | `1` | `0` | Used |
| `providers/index.ts` | `validBaseUrl` | `2` | `0` | Used |
| `providers/index.ts` | `ProviderEndpoint` (type) | `1` | `0` | Used |
| `rendering/index.ts` | `artifactRenderer` | `1` | `0` | Used (`apps/web/src/index.ts:122`) |
| `research/index.ts` | `TavilyClient` | `2` | `2` | Used |
| `research/index.ts` | `TavilyError` | `1` | `0` | Used |
| `research/index.ts` | `ImageSearchCandidate` (type) | `2` | `0` | Used |

## Type assertions and non-null assertions (4 `as`, 10 `!`)

Every assertion in `apps/web/src/integrations/` sits at an external data, regex, DNS, HTTP, or process-stream boundary and can be replaced with an explicit guard [[3]](#ref-3).

| Kind | Location | Code | Proposed boundary guard |
| --- | --- | --- | --- |
| `as` | `images/commons-images.ts:101` | `info.extmetadata[key].value as string` | Bind `const ext = info.extmetadata` and `const entry = object(ext) ? ext[key] : undefined`, then return `object(entry) && typeof entry.value === 'string' ? entry.value : ''` |
| `as` | `opencode/config.ts:170` | `(agent[name] as Record<string, unknown>).disable === true` | Bind `const entry = agent[name]` before checking `record(entry) && entry.disable === true` |
| `as` | `opencode/resources.ts:12` | `(error as NodeJS.ErrnoException).code !== 'ENOENT'` | Add a local predicate `hasCode(error)` checking `typeof error === 'object' && error !== null && 'code' in error`, then check `!hasCode(error) || error.code !== 'ENOENT'` |
| `as` | `opencode/resources.ts:20` | `const entry = value as Record<string, unknown>` | Use a `record(value)` type predicate before property reads so TypeScript narrows `value` without `as` |
| `!` | `images/image-source.ts:30` | `!match[2]!.startsWith('pexels-photo-')` | Bind `const id = match?.[1]` and `const slug = match?.[2]`, then guard `if (id && slug && ...)` |
| `!` | `images/public-image-reader.ts:108` | `hostname: addresses[0]!.address` | Bind `const target = addresses[0]` and guard `if (!target || addresses.some(...)) throw fail()` |
| `!` | `images/public-image-reader.ts:122` | `status: incoming.statusCode!` | Bind `const status = incoming.statusCode ?? 0` and pass `status` into `new Response(null, { status, headers: responseHeaders })` |
| `!` | `images/public-image-reader.ts:150` | `new URL(response.headers.get('location')!, url).href` | Bind `const location = response.headers.get('location')` and guard `if (hops >= 2 || !location) throw fail()` |
| `!` | `opencode/process.ts:124` | `child.stdout!.setEncoding('utf8')` | Destructure `{ stdin, stdout: out, stderr } = child` after `spawn` and fail with `startFailed: true` if any stream is absent |
| `!` | `opencode/process.ts:125` | `child.stdout!.on('data', ...)` | Use narrowed `out` from the stream guard above |
| `!` | `opencode/process.ts:147` | `child.stderr!.resume()` | Use narrowed `stderr` from the stream guard above |
| `!` | `opencode/process.ts:148` | `child.stdin!.on('error', () => {})` | Use narrowed `stdin` from the stream guard above |
| `!` | `opencode/process.ts:154` | `child.stdin!.end(options.input ?? '')` | Use narrowed `stdin` from the stream guard above |
| `!` | `opencode/runtime.ts:196` | `resumable ? binding!.nativeSessionId : undefined` | Compute `const resumeSessionId = binding && ... ? binding.nativeSessionId : undefined` and pass `resumeSessionId` directly |

## Browser reuse evaluation for `artifact-renderer.ts`

**Recommendation:** `focused refactor (managed browser reuse)` (`IN1`).

### Evidence from cold spawn

`apps/web/src/integrations/rendering/artifact-renderer.ts` (`272` lines) spawns one fresh headless Chrome or Edge process per render call (lines `122-162`). It polls `DevToolsActivePort` every `25` ms, opens a page target via `PUT /json/new?about:blank`, and calls `Network.setBlockedURLs` (lines `169-172`). It then injects HTML via `Page.setDocumentContent` (line `181`), evaluates the DOM script plus `inspectControlledLayout` (lines `182-219`), and cleans up in `finally` (lines `258-270`).

Task 3 measured that one 7-slide deck triggers `14` cold browser spawns (`validate_slide` and `publish_slide` per slide), consuming `35.5` to `39.5` seconds on Windows [[4]](#ref-4). `apps/web/src/index.ts` is the sole importer of `artifactRenderer` (line `122`) and already runs an explicit shutdown chain for `commonsImages`, `images`, `inputs`, `catalog`, `decks`, `web`, `sessions`, and `registry` (lines `350-401`).

### Managed browser reuse contract

Reusing one managed browser process per renderer instance preserves every existing security and failure invariant while removing `13` of `14` cold spawns per 7-slide deck:

1. **Lazy startup and root symlink guard:** Check `root` with the same `lstat` and `realpath` guard (lines `112-119`), then create one `render-*` profile directory under `root`. Launch one browser with the same flags and sanitized `rendererEnvironment()` (lines `27-59`, `122-139`). Read `DevToolsActivePort` (or `/json/version`) and open a browser-level CDP WebSocket matched to `ws://127.0.0.1:${port}/devtools/browser/`.
2. **Per-render incognito isolation:** For each render, call `Target.createBrowserContext({ disposeOnDetach: true })`, `Target.createTarget({ url: 'about:blank', browserContextId })`, and `Target.attachToTarget({ targetId, flatten: true })`. Send `Emulation.setDeviceMetricsOverride` (`1280x720`), `Network.enable`, and `Network.setBlockedURLs` (`['http://*', 'https://*', 'file://*', 'ftp://*', 'ws://*', 'wss://*']`) on that `sessionId` before `Page.setDocumentContent`.
3. **Deterministic per-render cleanup:** In `finally`, always call `Target.closeTarget({ targetId })` and `Target.disposeBrowserContext({ browserContextId })`, then decrement `running--`.
4. **Concurrency cap and per-render timeout:** Keep the existing `running >= 2` (`ARTIFACT_RENDERER_BUSY`) cap and `AbortSignal.any([caller, AbortSignal.timeout(15000)])` deadline.
5. **Crash and hang recovery:** If the child exits or the browser WebSocket closes, reject all pending CDP calls with `ARTIFACT_RENDERER_FAILED`. Clear the cached handle, kill any lingering child, and remove the temp profile. The next render spawns a fresh browser. If `Target.closeTarget` or `Target.disposeBrowserContext` fails after an abort or timeout, recycle the browser process so a stuck tab cannot poison later renders.
6. **Explicit `close()` wired into `apps/web/src/index.ts`:** Return `{ render, close }` from `artifactRenderer(root)`. Wire `renderCheck: (html, requiredText, signal) => renderer.render(html, requiredText, signal)` at `apps/web/src/index.ts:122`, and call `await renderer.close()` in both `close()` (lines `354-376`) and the startup `catch` block (lines `380-401`).
7. **Idle recycle timer (agent-proposed value for owner approval):**
   - **Current code:** Closes the browser immediately after every render (0 ms idle lifetime).
   - **Agent-proposed value:** `60_000` ms (`timer.unref()`) idle shutdown when `running === 0`.
   - **Reason:** Keeps the browser warm across all `14` checks of a 7-slide deck generation while releasing browser memory during idle periods between decks. The owner may approve `60_000` ms, pick another duration, or omit idle recycling and rely solely on `close()`.

### Impact on `e2e/portable-generation-http.test.mjs`

Managed reuse reduces `e2e/portable-generation-http.test.mjs` from `28` cold browser launches (`14` each for template `v2` and `v3`) to `2` cold launches (`1` per `startApp` instance) plus `28` isolated incognito targets. Keep `openCode: { timeoutMs: 120000 }` in `e2e/portable-generation-http.test.mjs:20` as a safe CI margin, and keep the `30000` ms default in `apps/web/tests/fixtures/b02-helpers.mjs` unchanged.

## Deep-module diagnosis

### 1. Interface width

The six integration barrels export `30` symbols (`credentials`: `5`, `images`: `7`, `opencode`: `10`, `providers`: `4`, `rendering`: `1`, `research`: `3`).

- **Unused exports (`4`):** `UnavailableCredentialStore` (`credentials/index.ts:4`), `OpenCodeErrorCode`, `OpenCodeErrorDetail`, and `RuntimeSessionAccess` (`opencode/index.ts:3`).
- **Test-only barrel exports (`2`):** `pinnedVersion` (`opencode/index.ts:1`) and `openToolBridge` (`opencode/index.ts:4`). In addition, `apps/web/tests/opencode-adapter.test.mjs:6-19` imports five internal files directly (`events.js`, `config.js`, `history.js`, `provider.js`, `process.js`).
- **Feature-to-integration dependency direction:** `research/tavily.ts` has zero imports and defines its own `TavilyError` (lines `1-6`). It does **not** import `ResearchFailure` from `features/research/`. However, four files in `opencode/` (`config.ts:3`, `contracts.ts:4`, `provider.ts:3`, `runtime.ts:9`) import `type { ProviderRunSettings } from '../../features/providers/index.ts'`. That reverses the `features/` to `integrations/` direction defined in Project Structure [[5]](#ref-5). Moving the runtime provider-settings contract into `integrations/opencode/contracts.ts` (or `integrations/providers/provider-catalog.ts`) restores one-way dependencies.

### 2. Deletion test

- **`opencode/contracts.ts` (`32` lines):** Owns `OpenCodeError`, `OpenCodeExecutor`, and `RuntimeSessionAccess`. Folding it into `runtime.ts` (`469` lines) would enlarge an already oversized file. Keep the file, and remove the three unused type re-exports from `opencode/index.ts` (`IN5`, `IN9`).
- **`opencode/history.ts` (`39` lines):** Owns `seedPrompt()` (ADR-0002 safe conversation quoting without replaying tool records). Keeping it separate isolates a security invariant from process orchestration (`IN9`).
- **`opencode/resources.ts` (`38` lines):** Owns `resourceExecutable()` (manifest and SHA-256 verification for bundled `opencode.exe` with no silent fallback). Keeping it separate isolates release-binary integrity (`IN9`), while fixing its two `as` assertions (`IN4`).
- **`images/image-source.ts` (`73` lines):** Owns `ImageSourceError` and `imageSource()` (publisher-controlled Pexels and Wikimedia Commons URL extraction). Keeping it separate isolates attribution integrity (`IN9`), while fixing its one `!` assertion (`IN7`).
- **`UnavailableCredentialStore` barrel export (`credentials/index.ts:4`):** Zero external callers. Removing the export lowers surface width without touching any caller (`IN8`).
- **Duplicate 1-line `record()` / `object()` helpers (`6` files):** Present in `artifact-renderer.ts:8`, `commons-images.ts:6`, `provider-catalog.ts:36`, `tavily.ts:18`, `opencode/config.ts:32`, and `opencode/events.ts:40` (plus inline in `opencode/resources.ts:19`). Extracting a cross-integration `shared` helper would couple unrelated adapters and conflict with Project Structure [[5]](#ref-5). Keep local 1-line guards across integration folders (`IN11`).

### 3. Locality

- **Scenario A (Add one new OpenCode runtime stream event type and forward it to the request listener):** `2` files in `apps/web/src/integrations/` change together:
  1. `apps/web/src/integrations/opencode/events.ts` (lines `5-29` `OpenCodeEvent` union, lines `47-104` `parseEvent`).
  2. `apps/web/src/integrations/opencode/runtime.ts` (lines `346-438` `onLine` handler inside `attempt()`).
  (If the forwarded event adds a new `RuntimeEvent` variant, `packages/host/api/src/lifecycle/contracts.ts` also updates at the Host seam.)
  Locality is tight (`2` files), but `onLine` is currently embedded inside the `249`-line `attempt()` method. Extracting the stream and FR-079 summary state machine out of `attempt()` keeps the `2`-file locality while making event changes isolated (`IN2`).
- **Scenario B (Add one new DOM visibility rule or lifecycle hook `close()` to `artifact-renderer.ts` and wire it in `apps/web/src/index.ts`):**
  - A new DOM visibility rule changes `1` integration file: `apps/web/src/integrations/rendering/artifact-renderer.ts` (lines `182-218` DOM script and lines `228-235` allowed `codes`).
  - Adding a `close()` lifecycle hook changes `2` integration files plus `1` root wiring file: `apps/web/src/integrations/rendering/artifact-renderer.ts` (lines `102-272`), `apps/web/src/integrations/rendering/index.ts` (line `1`, if exporting a renderer type), and `apps/web/src/index.ts` (lines `122`, `354-376`, `380-401`).
  Locality is high and confined to the rendering seam (`IN1`).

### 4. Action classification and convention fit

No rule in Project Structure [[5]](#ref-5) or Coding Guidelines [[3]](#ref-3) forces a shallow wrapper or awkward ownership in `apps/web/src/integrations/`. The Runtime dependency table in [Project Structure](../../../../conventions/project-structure.md#runtime) states that integrations depend on runtime contracts, protocol contracts, and needed capabilities. That rule supports removing the upward `opencode/` import from `features/providers/` (`IN6`). Task 22 requires no convention update.

## Classified finding table

Every finding below applies the Task 22 decision table [[1]](#ref-1) and tags its dependency using Deepening [[6]](#ref-6).

| ID | Location (`file:line`) | Signal | Dependency category | Proposed action | Caller impact |
| --- | --- | --- | --- | --- | --- |
| `IN1` | `apps/web/src/integrations/rendering/artifact-renderer.ts:102-272`, `apps/web/src/index.ts:122,354-401` | Cold spawn per render (`14` spawns/7-slide deck). `artifactRenderer` (`171` lines) and inner callback (`169` lines) mix browser lifecycle, CDP setup, and DOM validation | `Local-substitutable` | `focused refactor (managed browser reuse)` + split DOM script/validation and CDP session helpers under `80` lines. Return `{ render, close }` and wire `close()` in `apps/web/src/index.ts` | Single caller `apps/web/src/index.ts` updated for `render` and `close()` |
| `IN2` | `apps/web/src/integrations/opencode/runtime.ts:220-468` | File over `400` lines (`469` lines). `attempt` (`249` lines) and `onLine` (`93` lines) mix config audit, approval-pausable timer, FR-079 compaction/stream state machine, and outcome classification | `Local-substitutable` | `focused refactor (split responsibility or narrow export surface)` — extract private stream/compaction state tracker and approval-pausable timer inside `opencode/` so `runtime.ts` drops under `400` lines and every function drops under `80` lines | None (internal to `opencode/`) |
| `IN3` | `apps/web/src/integrations/opencode/mcp-bridge.ts:17-150`, `apps/web/src/integrations/opencode/process.ts:63-156` | `4` functions over `80` lines (`openToolBridge` `134`, HTTP callback `94`, `runProcess` `94`, Promise executor `88`) mixing HTTP/MCP framing and stdio line framing | `Local-substitutable` | `focused refactor (split responsibility or narrow export surface)` — extract private helpers (`readJsonBody`, `createToolServer`, line-framing helper) inside each file so all functions stay under `80` lines | None (internal to `opencode/`) |
| `IN4` | `apps/web/src/integrations/opencode/config.ts:170`, `resources.ts:12,20`, `process.ts:124,125,147,148,154`, `runtime.ts:196` | `3` type assertions (`as`) and `6` non-null assertions (`!`) without boundary guards | `In-process` / `Local-substitutable` | `focused refactor (replace assertion with boundary guard)` — apply the guards listed in the assertion table above | None |
| `IN5` | `apps/web/src/integrations/opencode/index.ts:1-6` | `3` unused external type exports (`OpenCodeErrorCode`, `OpenCodeErrorDetail`, `RuntimeSessionAccess`) and `2` test-only barrel exports (`pinnedVersion`, `openToolBridge`) | `In-process` | `focused refactor (merge or remove)` — remove the `3` unused exports in Slice 2C. Keep `pinnedVersion` and `openToolBridge` tracked for Phase 4 Testware alignment | Zero production callers affected. Tests remain green |
| `IN6` | `apps/web/src/integrations/opencode/config.ts:3`, `contracts.ts:4`, `provider.ts:3`, `runtime.ts:9` | Reverse dependency direction: `integrations/opencode/` imports `type ProviderRunSettings` from `features/providers/index.ts` | `In-process` | `focused refactor (split responsibility or narrow export surface)` — define the runtime provider-settings contract in `integrations/opencode/contracts.ts` (or `integrations/providers/provider-catalog.ts`) so `integrations/` does not import `features/` | `features/providers/` satisfies the contract structurally or re-exports it |
| `IN7` | `apps/web/src/integrations/images/commons-images.ts:59-143,101`, `public-image-reader.ts:65-187,108,122,150`, `image-source.ts:30` | `2` functions over `80` lines (`CommonsImages.candidates` `85`, `PublicImageReader.load` `123`), `1` type assertion (`as`), and `4` non-null assertions (`!`) | `True external` | `focused refactor (split responsibility or narrow export surface)` + `focused refactor (replace assertion with boundary guard)` — extract private Commons candidate parser and pinned-HTTPS/bounded-body helpers, and replace all `5` assertions | None (internal to `images/`) |
| `IN8` | `apps/web/src/integrations/credentials/index.ts:4` | Unused barrel export `UnavailableCredentialStore` (`0` production refs, `0` test refs) | `Local-substitutable` | `focused refactor (merge or remove)` — remove `UnavailableCredentialStore` from `credentials/index.ts` | None |
| `IN9` | `apps/web/src/integrations/opencode/contracts.ts`, `history.ts`, `resources.ts`, `images/image-source.ts` | Small files (`32` to `73` lines) that isolate protocol contracts, ADR-0002 prompt seeding, binary SHA-256 verification, and publisher attribution rules | `In-process` / `Local-substitutable` | `no action` — keep all `4` files as focused security and contract modules (fix assertions inside `resources.ts` and `image-source.ts` under `IN4` and `IN7`) | None |
| `IN10` | `apps/web/src/integrations/credentials/credential-store.ts`, `providers/provider-catalog.ts`, `research/tavily.ts` | Single-owner external adapters under `220` lines, `0` functions over `80` lines, `0` assertions, explicit timeouts and body caps, no feature imports | `Local-substitutable` / `True external` | `no action` — keep current module shapes and error contracts | None |
| `IN11` | `artifact-renderer.ts:8`, `commons-images.ts:6`, `provider-catalog.ts:36`, `tavily.ts:18`, `opencode/config.ts:32`, `opencode/events.ts:40` | Duplicate 1-line `record()` / `object()` unknown-object guards across `6` files | `In-process` | `no action` — keep local 1-line guards instead of introducing a cross-integration `shared` helper forbidden by Project Structure [[5]](#ref-5) | None |

## Report-only observations

No finding fell through to the unmatched decision-table row. Two low-priority observations belong in the report for future hygiene:

1. `apps/web/src/integrations/research/tavily.ts:2` types `TavilyError.code` as `string` rather than a closed union of its six emitted codes (`RESEARCH_UNAVAILABLE`, `SOURCE_ARGUMENTS_INVALID`, `RESEARCH_KEY_REJECTED`, `RESEARCH_QUOTA_EXHAUSTED`, `RESEARCH_RESPONSE_TOO_LARGE`, `RESEARCH_FREE_ONLY`). Narrowing it is safe but optional.
2. `apps/web/tests/opencode-adapter.test.mjs:6-19` imports five private `opencode/` modules directly from `lib/types/integrations/opencode/*.js`. Keep this in mind during Phase 4 Testware alignment so internal file splits in `IN2` and `IN3` do not break existing test imports unexpectedly.

## What the commands do not prove

Static inspection and symbol counts do not run OpenCode, image-reader, or headless browser tests. They do not measure live browser reuse latency, Chromium incognito context teardown behavior on Windows, or CI runner memory usage under managed browser reuse.

## References

1. <a id="ref-1"></a>[Task 22: Diagnose apps/web/src/integrations and renderer browser reuse](../plan/task-22-diagnose-integrations-and-renderer-reuse.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../../conventions/code.md)
4. <a id="ref-4"></a>[Task 3: Portable Generation HTTP Timeout Diagnosis Report](task-03-investigate-timeout-failure.md)
5. <a id="ref-5"></a>[Project Structure](../../../../conventions/project-structure.md)
6. <a id="ref-6"></a>[Deepening](../../../../../.agents/skills/codebase-design/DEEPENING.md)
