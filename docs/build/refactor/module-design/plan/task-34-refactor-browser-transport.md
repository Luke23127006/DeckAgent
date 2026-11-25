# Task 34: Refactor browser transport clients, HTTP helpers, and assertions

Read this file to remove pass-through decoder wrappers, extract internal HTTP/SSE helpers and management decoders, and remove assertions in `apps/web/src/browser/transport/` (`BB2`, `BB5`, `BB6`, `BB8`, `BB12`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/browser/transport/index.ts` (8 lines)
- `apps/web/src/browser/transport/bound-outline-decoder.ts` (1 line)
- `apps/web/src/browser/transport/management-client.ts` (564 lines)
- `apps/web/src/browser/transport/host-client.ts` (309 lines)
- `apps/web/src/browser/transport/deck-client.ts` (183 lines)
- `apps/web/src/browser/transport/outline-client.ts` (109 lines)
- `apps/web/src/browser/transport/brief-client.ts` (119 lines)
- `apps/web/src/browser/transport/confirmation-client.ts` (122 lines)
- `apps/web/tests/fixtures/browser-driver.mjs` (13 lines)
- `apps/web/tests/brief-client.test.mjs` (69 lines)

**Files:**

- Remove: `apps/web/src/browser/transport/bound-outline-decoder.ts`
- Create: `apps/web/src/browser/transport/http.ts`
- Create: `apps/web/src/browser/transport/management-decoders.ts`
- Change: `apps/web/src/browser/transport/management-client.ts`
- Change: `apps/web/src/browser/transport/host-client.ts`
- Change: `apps/web/src/browser/transport/deck-client.ts`
- Change: `apps/web/src/browser/transport/outline-client.ts`
- Change: `apps/web/src/browser/transport/brief-client.ts`
- Change: `apps/web/src/browser/transport/confirmation-client.ts`
- Change: `apps/web/src/browser/transport/index.ts`
- Change: `apps/web/tests/fixtures/browser-driver.mjs`
- Change: `apps/web/tests/brief-client.test.mjs`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-34-refactor-browser-transport.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-34-refactor-browser-transport.md`

**Interfaces:**

- Produces:
  - `apps/web/src/browser/transport/http.ts`: internal helpers `isRecord`, `fetchAuthorized`, `readJsonError`, and `readSseFrames`.
  - `apps/web/src/browser/transport/management-decoders.ts`: internal decoders `decodeSettings`, `decodeSession`, `decodeWorkspaceList`, `decodeResearchSources`, `decodeTheme`, `decodeActivities`, `decodeRequests`, `decodeDraft`, `decodeCatalog`, and `decodePreviewText`.
  - `apps/web/src/browser/transport/index.ts`: exports `HostClient`, `HostRequestError`, `isActive`, `ManagementClient`, `ManagementError`, `DeckClient`, `OutlineClient`, `BriefClient`, `ConfirmationClient`, and temporary `imageFailure` until the deck feature task moves it.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not remove `image-review-client.ts` or change `outline-view.ts` in this task).
- Change any HTTP route, status code mapping, `401` fallback, timeout duration, or error code string.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 6 checks pass.

- [ ] **Step 1: Create internal `apps/web/src/browser/transport/http.ts` (`BB5`, `BB12`)**

Create `apps/web/src/browser/transport/http.ts` with four internal exports, keeping every function under 55 lines and the file under 120 lines:

1. `export function isRecord(value: unknown): value is Record<string, unknown>` checking `!!value && typeof value === 'object' && !Array.isArray(value)`.
2. `export function fetchAuthorized(origin: string, token: string, path: string, init: RequestInit = {}): Promise<Response>` calling `fetch` with `${origin}${path}`, `credentials: 'omit'`, `redirect: 'error'`, and `headers: { ...init.headers, authorization: 'Bearer ' + token }`.
3. `export async function readJsonError(response: Response, allowedCodes: readonly string[], fallbackCode: string, options?: { readonly includeDetail?: boolean; readonly fallback401?: boolean }): Promise<{ readonly code: string; readonly detail: Readonly<Record<string, string | boolean>> }>`. Parse JSON safely with `.catch(() => undefined)` and match `error.code` against `allowedCodes`. Copy only `string | boolean` entries from `error.detail` when `options?.includeDetail` is true and a known code matched. Return `AUTH_REQUIRED` on status `401` only when `options?.fallback401` is true and no allowed code matched.
4. `export async function* readSseFrames(response: Response, options: { readonly maxBufferBytes: number; readonly lostError: string; readonly invalidError: string; readonly eventName: string; readonly matchMode: 'line' | 'prefix' }): AsyncGenerator<string>`. Check `response.body` and `content-type` starting with `text/event-stream`, normalize `\r\n`, and throw `options.invalidError` when buffer exceeds `options.maxBufferBytes`. Throw `options.lostError` when `part.done` ends the stream. Yield joined `data: ` lines for frames matching `event: ${options.eventName}` (`'line'` equality or `'prefix'` match), and cancel and release the reader in `finally`.

- [ ] **Step 2: Create `apps/web/src/browser/transport/management-decoders.ts` and shrink `management-client.ts` (`BB5`, `BB8`)**

1. Create `apps/web/src/browser/transport/management-decoders.ts` (under 280 lines, every function under 60 lines) holding all response decoders moved from `management-client.ts`:
   - `decodeSettings`, `decodeSession`, `decodeWorkspaceList`, `decodeResearchSources`, `decodeTheme`, `decodeActivities`, `decodeRequests`, `decodeDraft`, `decodeCatalog`, and `decodePreviewText`.
   - In `decodeWorkspaceList` (replacing `management-client.ts` lines 133 and 141), bind `const folderStatus = workspaceStatuses.find(status => status === item.folderStatus)` and call `invalid()` when `!folderStatus`. Remove the duplicate `.some(...)` check and the `!` assertion.
2. In `apps/web/src/browser/transport/management-client.ts` (under 260 lines, every function under 55 lines):
   - Keep `ManagementError`, `allowedCodes`, and `ManagementClient` public signatures unchanged, except remove the two unused methods `draft(id)` (lines 344-348) and `saveDraft(id, text)` (lines 426-428).
   - Delegate `request` and `attachmentRequest` to `fetchAuthorized` and `readJsonError` from `./http.ts`. Pass `includeDetail: true` and `fallback401: false` for `request`, and pass `includeDetail: false` and `fallback401: false` for `attachmentRequest`.
   - Delegate every response check to `./management-decoders.ts`.

- [ ] **Step 3: Remove assertions and pass-throughs across the five sibling clients (`BB2`, `BB6`, `BB8`)**

1. Remove `apps/web/src/browser/transport/bound-outline-decoder.ts`.
2. In `apps/web/src/browser/transport/deck-client.ts`:
   - Add file-local `decodeImageCredits(value: unknown): readonly ImageCredit[]` (checking `IMAGE_LICENSES = ['public-domain', 'CC0', 'CC BY', 'Pexels', 'unknown'] as const`, matching `license` via `.find(...)` and calling `invalid()` when missing, narrowing `evidence` and `downloadUrl`, and returning typed `ImageCredit` objects with zero `as` assertions) and `decodeStringArray(value: unknown): readonly string[]`.
   - Replace lines 98-122 and lines 140-143 so `content()` uses `decodeImageCredits` and `decodeStringArray` with zero `as` assertions.
   - Use `fetchAuthorized` and `readSseFrames` (`maxBufferBytes: 65536`, `lostError: 'DECK_CONNECTION_LOST'`, `invalidError: 'INVALID_DECK_RESPONSE'`, `eventName: 'deck-changed'`, `matchMode: 'prefix'`) from `./http.ts`.
3. In `apps/web/src/browser/transport/outline-client.ts`:
   - Replace line 87 `(index > 0 && p.version <= proposals[index - 1]!.version)` with `const previous = index > 0 ? proposals[index - 1] : undefined` and check `previous !== undefined && p.version <= previous.version` with zero `!` assertions.
   - Use `fetchAuthorized` and `isRecord` from `./http.ts`, keeping `AbortSignal.timeout(15000)` and `401 -> AUTH_REQUIRED` unchanged.
4. In `apps/web/src/browser/transport/host-client.ts`:
   - Remove line 10 (`export { decodeAttachment, requestEvent } from '@deckagent/host-contracts'`).
   - Use `fetchAuthorized`, `readJsonError` (`includeDetail: true, fallback401: true`), and `readSseFrames` (`maxBufferBytes: 4 * 1024 * 1024`, `lostError: 'CONNECTION_LOST'`, `invalidError: 'INVALID_RESPONSE'`, `eventName: 'request'`, `matchMode: 'line'`) from `./http.ts`.
5. In `apps/web/src/browser/transport/brief-client.ts`:
   - Remove line 3 (`export { decodeBriefView } from '@deckagent/host-contracts'`).
   - Use `fetchAuthorized` and `isRecord` from `./http.ts`, keeping `AbortSignal.timeout(15000)` and `401 -> AUTH_REQUIRED` unchanged.
6. In `apps/web/src/browser/transport/confirmation-client.ts`:
   - Remove line 2 (`export { decodeGeneration } from '@deckagent/host-contracts'`).
   - Use `fetchAuthorized` and `isRecord` from `./http.ts`, keeping `AbortSignal.timeout(15000)`, `response.json()` behavior, and `401 -> AUTH_REQUIRED` unchanged.

- [ ] **Step 4: Narrow `transport/index.ts` and update test callers (`BB2`, `BB6`)**

1. Update `apps/web/src/browser/transport/index.ts` to export exactly ten symbols:

```ts
export { HostClient, HostRequestError, isActive } from './host-client.ts'
export { ManagementClient, ManagementError } from './management-client.ts'
export { DeckClient } from './deck-client.ts'
export { OutlineClient } from './outline-client.ts'
export { BriefClient } from './brief-client.ts'
export { ConfirmationClient } from './confirmation-client.ts'
export { imageFailure } from './image-review-client.ts'
```

2. Update `apps/web/tests/fixtures/browser-driver.mjs` to remove `decodeBriefView` (line 10) and `requestEvent` (line 12).
3. Update `apps/web/tests/brief-client.test.mjs` line 4 to import only `BriefClient` from `./fixtures/browser-driver.mjs` and add `import { decodeBriefView } from '@deckagent/host-contracts'`.

- [ ] **Step 5: Build, check boundaries, lint, format, measure AST metrics, and run transport suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/browser/transport/ apps/web/tests/fixtures/browser-driver.mjs apps/web/tests/brief-client.test.mjs
```

Run quantitative AST check on `apps/web/src/browser/transport/`:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.path.startsWith('apps/web/src/browser/transport/')).map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,as:f.typeAssertions.length,nn,exports:f.exportCount};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every file under `apps/web/src/browser/transport/` has `over400: false`, `longFn: 0`, `as: 0`, and `nn: 0`. `transport/index.ts` has `exports: 10`, and `bound-outline-decoder.ts` is absent.

Run transport and client test suites:

```bash
corepack pnpm@11.28.5 test:tools-browser && corepack pnpm@11.28.5 test:local-web && corepack pnpm@11.28.5 test:brief-foundation && corepack pnpm@11.28.5 test:outline-workflow && corepack pnpm@11.28.5 test:slide-pipeline
```

Expected: PASS. All five suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [ ] **Step 6: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 34 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-34-refactor-browser-transport.md`.
2. Create `docs/build/refactor/module-design/reports/task-34-refactor-browser-transport.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created, changed, and removed files.
   - AST metrics table for every file in `apps/web/src/browser/transport/`.
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 34 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 6 as `- [x]` in this file.
5. Run `git status --short` and check that only the files in `Files` changed. Stage only those files, commit with `refactor(browser): streamline transport clients, helpers, and guards`, and run `git push`.

**STOP** and send the Task 34 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
