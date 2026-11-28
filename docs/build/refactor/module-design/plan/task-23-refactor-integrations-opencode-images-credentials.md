# Task 23: Refactor integrations OpenCode, images, and credentials

Read this file to split long functions in `apps/web/src/integrations/`, replace all assertions, move `ProviderRunSettings` out of `features/`, and remove unused integration exports (`IN2`-`IN8`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/integrations/providers/provider-catalog.ts` (lines 1-30)
- `apps/web/src/integrations/providers/index.ts` (2 lines)
- `apps/web/src/features/providers/provider-settings.ts` (lines 1-35)
- `apps/web/src/features/providers/index.ts` (3 lines)
- `apps/web/src/integrations/opencode/contracts.ts` (32 lines)
- `apps/web/src/integrations/opencode/config.ts` (175 lines)
- `apps/web/src/integrations/opencode/provider.ts` (66 lines)
- `apps/web/src/integrations/opencode/resources.ts` (38 lines)
- `apps/web/src/integrations/opencode/process.ts` (156 lines)
- `apps/web/src/integrations/opencode/mcp-bridge.ts` (150 lines)
- `apps/web/src/integrations/opencode/runtime.ts` (469 lines)
- `apps/web/src/integrations/opencode/index.ts` (6 lines)
- `apps/web/src/integrations/images/commons-images.ts` (190 lines)
- `apps/web/src/integrations/images/public-image-reader.ts` (188 lines)
- `apps/web/src/integrations/images/image-source.ts` (73 lines)
- `apps/web/src/integrations/credentials/index.ts` (7 lines)
- `apps/web/tests/opencode-adapter.test.mjs` (lines 1-45)

**Files:**

- Change: `apps/web/src/integrations/providers/provider-catalog.ts`
- Change: `apps/web/src/integrations/providers/index.ts`
- Change: `apps/web/src/features/providers/provider-settings.ts`
- Change: `apps/web/src/features/providers/index.ts`
- Create: `apps/web/src/integrations/opencode/stream-tracker.ts`
- Change: `apps/web/src/integrations/opencode/contracts.ts`
- Change: `apps/web/src/integrations/opencode/config.ts`
- Change: `apps/web/src/integrations/opencode/provider.ts`
- Change: `apps/web/src/integrations/opencode/resources.ts`
- Change: `apps/web/src/integrations/opencode/process.ts`
- Change: `apps/web/src/integrations/opencode/mcp-bridge.ts`
- Change: `apps/web/src/integrations/opencode/runtime.ts`
- Change: `apps/web/src/integrations/opencode/index.ts`
- Change: `apps/web/src/integrations/images/commons-images.ts`
- Change: `apps/web/src/integrations/images/public-image-reader.ts`
- Change: `apps/web/src/integrations/images/image-source.ts`
- Change: `apps/web/src/integrations/credentials/index.ts`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-23-refactor-integrations-opencode-images-credentials.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-23-refactor-integrations-opencode-images-credentials.md`

**Interfaces:**

- Produces:
  - `apps/web/src/integrations/providers/index.ts`: adds `export type { ProviderEndpoint, ProviderRunSettings } from './provider-catalog.ts'`
  - `apps/web/src/integrations/opencode/stream-tracker.ts`: `createAttemptTimer(timeoutMs: number, run: RequestRun)`, `createStreamTracker(run: RequestRun, abortLocal: () => void)`, `classifyAttemptOutcome(...)`
  - `apps/web/src/integrations/opencode/index.ts`: exports `pinnedVersion`, `OpenCodeError`, `type OpenCodeExecutor`, `openToolBridge`, `OpenCodeRuntime`, `findExecutable`, `type OpenCodeOptions` (`7` exports)
  - `apps/web/src/integrations/credentials/index.ts`: exports `CredentialError`, `ProtectedFileCredentialStore`, `defaultCredentialStore`, `type CredentialStore` (`4` exports)

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not touch `artifact-renderer.ts` or any test file in this task).
- Remove `pinnedVersion` or `openToolBridge` from `opencode/index.ts`, or rename `events.ts`, `config.ts`, `history.ts`, `provider.ts`, or `process.ts`.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 7 checks pass.

- [x] **Step 1: Move `ProviderRunSettings` into `integrations/providers/` (`IN6`)**

1. In `apps/web/src/integrations/providers/provider-catalog.ts`, add `ProviderRunSettings` right after `ProviderEndpoint`:

```ts
export interface ProviderRunSettings {
  readonly provider: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  readonly model: string
  readonly key?: string
}
```

2. In `apps/web/src/integrations/providers/index.ts`, export `ProviderRunSettings` alongside `ProviderEndpoint`.
3. In `apps/web/src/features/providers/provider-settings.ts`, remove the local `ProviderRunSettings` interface (lines 21-28) and import `type { ProviderEndpoint, ProviderRunSettings }` from `../../integrations/providers/index.ts`.
4. In `apps/web/src/features/providers/index.ts`, remove `ProviderRunSettings` from line 3.
5. In `apps/web/src/integrations/opencode/config.ts`, `contracts.ts`, `provider.ts`, and `runtime.ts`, replace `../../features/providers/index.ts` with `../providers/index.ts`.

- [x] **Step 2: Replace `as` assertions in `opencode/config.ts` and `opencode/resources.ts`, and narrow `opencode/index.ts` (`IN4`, `IN5`)**

1. In `apps/web/src/integrations/opencode/config.ts` (lines 168-171), replace the `as Record<string, unknown>` cast:

```ts
Object.keys(agent).every(name => {
  if (name === 'deckagent') return true
  const entry = agent[name]
  return record(entry) && entry.disable === true
})
```

2. In `apps/web/src/integrations/opencode/resources.ts`, add two local type guards:

```ts
function hasCode(value: unknown): value is { readonly code?: unknown } {
  return typeof value === 'object' && value !== null && 'code' in value
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
```

   - Replace line 12 with `return { present: !hasCode(error) || error.code !== 'ENOENT' }`.
   - Replace lines 19-20 with `if (!record(value)) return { present: true }` and read `value.*` directly.
3. In `apps/web/src/integrations/opencode/index.ts`, remove `OpenCodeErrorCode`, `OpenCodeErrorDetail`, and `RuntimeSessionAccess` from line 3. Keep `OpenCodeExecutor`.

- [x] **Step 3: Split long functions and remove `!` assertions in `opencode/process.ts` and `opencode/mcp-bridge.ts` (`IN3`, `IN4`)**

1. In `apps/web/src/integrations/opencode/process.ts`:
   - Keep `ProcessResult`, `ProcessOptions`, and `runProcess` exported with identical signatures.
   - Extract private helper `createLineReader(options, onMalformed)` to hold JSON line framing, `maxLine`, and `maxOutputBytes` checks (under 50 lines).
   - Extract private helper `spawnCliProcess(executable, args, options)` (under 25 lines).
   - Inside `runProcess`, bind `const { stdin, stdout, stderr } = child`. If `!stdin || !stdout || !stderr`, call `finish({ startFailed: true, code: null, malformed: false, killed: false })` and return. Use `stdin`, `stdout`, and `stderr` with zero `!` assertions.
   - Keep every function in `process.ts` under 75 lines.
2. In `apps/web/src/integrations/opencode/mcp-bridge.ts`:
   - Keep `ToolBridge` and `openToolBridge` exported with identical signatures.
   - Extract private helpers `isAuthorized(req, expectedHost, token, active)`, `readJsonBody(req, res)`, `createToolServer(tools, active)`, and `forwardMcpRequest(req, res, expectedHost, body, server)` inside `mcp-bridge.ts`.
   - Keep every function in `mcp-bridge.ts` under 70 lines.

- [x] **Step 4: Extract `opencode/stream-tracker.ts` and simplify `opencode/runtime.ts` (`IN2`, `IN4`)**

1. Create `apps/web/src/integrations/opencode/stream-tracker.ts` (under 220 lines, every function under 75 lines) with:
   - `export interface AttemptResult { readonly outcome: RuntimeOutcome; readonly nativeSessionId?: string; readonly noWork: boolean }`.
   - `export function createAttemptTimer(timeoutMs: number, run: RequestRun)` returning `{ signal: AbortSignal; local: AbortController; timedOut(): boolean; cleanup(): void }`. Preserve the exact approval-wait pause and resume arithmetic from `runtime.ts` lines 247-269.
   - `export function createStreamTracker(run: RequestRun, abortLocal: () => void)` encapsulating `step_start`, `step_finish`, `text`, `tool`, and `error` FR-079 compaction logic from `runtime.ts` lines 292-445, split into private per-event helpers under 60 lines each. Expose `onLine(value: unknown): void`, `finalize(aborted: boolean, timedOut: boolean): Promise<void>`, and `classify(result: ProcessResult, runAborted: boolean, timedOut: boolean, localAborted: boolean): AttemptResult`.
2. Update `apps/web/src/integrations/opencode/runtime.ts`:
   - In `execute` (line 196), compute `const resumeSessionId = resumable && binding ? binding.nativeSessionId : undefined` and pass `resumeSessionId` with zero `!` assertions.
   - Extract private method `auditConfiguration(executable, folders, env, signal, config, timedOut)` (lines 272-290).
   - Delegate timer setup, stream tracking, and outcome classification inside `attempt` to `createAttemptTimer` and `createStreamTracker`.
   - Keep `runtime.ts` under 300 lines and every function under 75 lines.

- [x] **Step 5: Split `images/` helpers, remove all `images/` assertions, and narrow `credentials/index.ts` (`IN7`, `IN8`)**

1. In `apps/web/src/integrations/images/commons-images.ts`:
   - Add private `extMetadataValue(ext: Record<string, unknown>, key: string): string` returning `object(entry) && typeof entry.value === 'string' ? entry.value : ''` (zero `as` assertions).
   - Extract private `buildSearchUrl(query: string, title?: string): URL` and `parseCandidatePage(page: unknown, fallbackTitle: string): CommonsCandidate | undefined` so `CommonsImages.candidates` drops under 60 lines.
2. In `apps/web/src/integrations/images/public-image-reader.ts`:
   - Extract private `parsePublicUrl(value: string): URL`, `resolvePublicAddress(hostname: string, signal: AbortSignal, resolve: ImageLookup): Promise<string>`, `fetchPinnedHttps(url: URL, address: string, hostname: string, headers: Record<string, string>, signal: AbortSignal): Promise<Response>`, and `readBoundedBody(response: Response, signal: AbortSignal, max: number): Promise<Buffer>`.
   - Replace `addresses[0]!.address` with `const target = addresses[0]; if (!target || addresses.some(...)) throw fail(); return target.address`.
   - Replace `incoming.statusCode!` with `const status = incoming.statusCode ?? 0`.
   - Replace `response.headers.get('location')!` with `const location = response.headers.get('location'); if (hops >= 2 || !location) throw fail(); return this.read(new URL(location, url).href, ...)`.
   - Keep every function in `public-image-reader.ts` under 70 lines.
3. In `apps/web/src/integrations/images/image-source.ts` (lines 29-31), bind `const id = match?.[1]` and `const slug = match?.[2]`, and guard `if (id && slug && (!slug.startsWith('pexels-photo-') || slug === \`pexels-photo-${id}\`))`. Remove `!`.
4. In `apps/web/src/integrations/credentials/index.ts`, remove `UnavailableCredentialStore`.

- [x] **Step 6: Build, check boundaries, lint, format, check AST metrics, and run integration suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/integrations/opencode/ apps/web/src/integrations/images/ apps/web/src/integrations/credentials/ apps/web/src/integrations/providers/ apps/web/src/features/providers/provider-settings.ts apps/web/src/features/providers/index.ts
```

Run quantitative check on `integrations/` (excluding `rendering/`):

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.area==='apps/web/src/integrations/'&&!f.path.includes('/rendering/')).map(f=>{const text=fs.readFileSync(f.path,'utf8'); const sf=ts.createSourceFile(f.path,text,ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,as:f.typeAssertions.length,nn,importsFeature:text.includes('features/')};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every file has `over400: false`, `longFn: 0`, `as: 0`, `nn: 0`, and `importsFeature: false`.

Run integration test suites:

```bash
corepack pnpm@11.28.5 test:model-requests && corepack pnpm@11.28.5 test:source-permissions && corepack pnpm@11.28.5 test:opencode-resources && corepack pnpm@11.28.5 test:images && corepack pnpm@11.28.5 test:research
```

Expected: PASS. All five suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [x] **Step 7: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 6 as `- [x]` in this file. Update the Task 23 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-23-refactor-integrations-opencode-images-credentials.md`.
2. Create `docs/build/refactor/module-design/reports/task-23-refactor-integrations-opencode-images-credentials.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created and modified files.
   - Metrics table for `integrations/` (excluding `rendering/`): `lines`, `longFn`, `as`, `!`, `importsFeature`.
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 23 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 7 as `- [x]` in this file.
5. Run `git status --short` and check that only the files listed in `Files` changed. Stage only those files, commit with a conventional commit message (example: `refactor(web): clean integrations opencode, images, and credentials seams`), and run `git push`.

**STOP** and send the Task 23 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
