# Task 28: Refactor web root composition, local transport, CLI, and web-state

Read this file to fold four root asset files into `ui-assets.ts`, split root functions under 80 lines, and remove root `!` assertions (`FA1`, `FA5`, `FA6`, `FA8`, `FA10`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/index.ts` (403 lines)
- `apps/web/src/local-transport.ts` (301 lines)
- `apps/web/src/cli.ts` (165 lines)
- `apps/web/src/web-state.ts` (135 lines)
- `apps/web/src/ui-assets.ts` (lines 1-30 and lines 190-213)
- `apps/web/src/attachment-style.ts` (7 lines)
- `apps/web/src/outline-style.ts` (16 lines)
- `apps/web/src/research-style.ts` (8 lines)
- `apps/web/src/sample-slides.ts` (29 lines)

**Files:**

- Remove: `apps/web/src/attachment-style.ts`
- Remove: `apps/web/src/outline-style.ts`
- Remove: `apps/web/src/research-style.ts`
- Remove: `apps/web/src/sample-slides.ts`
- Change: `apps/web/src/ui-assets.ts`
- Change: `apps/web/src/local-transport.ts`
- Change: `apps/web/src/index.ts`
- Change: `apps/web/src/cli.ts`
- Change: `apps/web/src/web-state.ts`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-28-refactor-web-root-and-local-transport.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-28-refactor-web-root-and-local-transport.md`

**Interfaces:**

- Produces:
  - `apps/web/src/ui-assets.ts`: `loadWebAssets(clientDir: string, getTheme: () => WebPreferences['theme']): Promise<Record<string, { contentType: string; body: string; sandboxed?: boolean }>>`
  - `apps/web/src/local-transport.ts`: `mapApplicationFailure`, `workspaceManagement`, `chatManagement`, `attachmentManagement`, `sessionReadManagement(store: SqliteSessionStore, research: ResearchCoordinator)`
  - `apps/web/src/index.ts`: preserves exact package root exports (`StorageError`, `resolveStorageRoot`, `type ProviderConnection`, `type LocalWebOptions`, `startLocalWeb`)

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not touch `packages/host/api/src/transport/multipart.ts`, `storage-root.ts`, `draft-store.ts`, or test files in this task).
- Remove `toAttachmentHttpError` from `attachmentManagement.upload`.
- Change any CSS content, HTML asset path, HTTP status code, or CLI flag.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 7 checks pass.

- [ ] **Step 1: Fold the four small asset files into `apps/web/src/ui-assets.ts` (`FA1`)**

1. Move `attachmentStyle`, `outlineStyle`, `researchStyle`, and `sampleAssets` verbatim from `attachment-style.ts`, `outline-style.ts`, `research-style.ts`, and `sample-slides.ts` into `apps/web/src/ui-assets.ts`.
2. In `apps/web/src/ui-assets.ts`, export `loadWebAssets(clientDir: string, getTheme: () => WebPreferences['theme'])` (combining `sampleAssets`, `'/'`, `'/theme.js'` getter, `'/style.css'` concatenation in the exact original order `style + outlineStyle + deckResizeStyle + composerStyle + presentationStyle + activityStyle + motionStyle + attachmentStyle + researchStyle`, plus the `/client/*.js` directory read from `index.ts` lines 240-271).
3. Remove `apps/web/src/attachment-style.ts`, `apps/web/src/outline-style.ts`, `apps/web/src/research-style.ts`, and `apps/web/src/sample-slides.ts`.
4. Keep `ui-assets.ts` under 310 lines and `loadWebAssets` under 45 lines.

- [ ] **Step 2: Simplify `apps/web/src/local-transport.ts` (`FA5`, `FA6`)**

1. Extract private helper `mapWorkspaceError(error: WorkspaceError): HttpFailureResponse` and `mapFailureEntry(code: string, detail: HttpErrorDetail | undefined, status: number): HttpFailureResponse`.
2. Table-drive the `{ code, detail }` feature error checks inside `mapApplicationFailure` so `mapApplicationFailure` drops under 65 lines while keeping every status code and detail payload identical.
3. In `attachmentManagement`:
   - Keep `upload: input => toAttachmentHttpError(service.upload(input))` (required because `packages/host/api/src/transport/multipart.ts` catches non-`HttpError` exceptions).
   - Remove the redundant `toAttachmentHttpError` wrapper from `get`, `remove`, and `preview` so they delegate directly to `service.get`, `service.remove`, and `service.preview`.
4. Export `sessionReadManagement(store: SqliteSessionStore, research: ResearchCoordinator)` returning:
   - `research: { save: value => research.save(value), remove: () => research.remove(), sources: async id => { await requireSession(store, id); return store.requests.researchSources(id) } }`
   - `activities: async id => { await requireSession(store, id); return store.requests.activities(id) }`
   - `requests: async id => { await requireSession(store, id); return store.requests.list(id) }`
   where `requireSession` checks `if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')`.
5. Keep every function in `local-transport.ts` under 70 lines.

- [ ] **Step 3: Decompose `apps/web/src/index.ts` under 400 lines and `startLocalWeb` under 80 lines (`FA5`)**

1. Remove the `HttpError` import from `apps/web/src/index.ts`.
2. Extract private helpers in `apps/web/src/index.ts`, each under 70 lines:
   - `closeResources(closers: readonly (() => Promise<void> | void)[]): Promise<void>`: runs every closer in order even when an earlier closer throws, rethrowing the first error after all closers finish.
   - `createPreparedImageReader(sessions: SqliteSessionStore, getAttachments: () => ManagedAttachments | undefined)`: moves lines 123-144 verbatim.
   - `openStorageLayer(layout, options, renderer, commonsImages, getAttachments)`: opens `WorkspaceRegistry` (checking `overlapsFolder`), `SqliteSessionStore`, `DeckStore`, and `WebState` with an explicit mutable callback `let isSelectable: (value: ModelSelection) => boolean = () => false` (no forward reference to `const catalog`), runs startup reconciliation and `confirmedDecks` bootstrap, and returns `{ registry, sessions, decks, web, bindSelectability }`.
   - `createRuntimeLayer(layout, options, store, state, catalog, commonsImages, attachments, credentials)`: creates `OpenCodeRuntime`, `createRequestRuntime`, `ResearchCoordinator`, `WebImageResearch`, `AttachmentCoordinator`, and one shared `generationRuntime = options.generationRuntime ?? new GenerationWorkflow(runtime, store)` (no duplicate `defaultCredentialStore` or `GenerationWorkflow` instances).
3. Update `startLocalWeb` to:
   - Register each opened resource closer into one `closers: (() => Promise<void> | void)[]` array (closing in reverse startup order: `host`, `renderer`, `commonsImages`, `images`, `inputs`, `catalog`, `presentation`, `state`, `store`, `workspaces`).
   - Load assets through `loadWebAssets(join(dirname(fileURLToPath(import.meta.url)), 'browser'), () => state.preferences().theme)`.
   - Wire `...sessionReadManagement(store, research)` into `startHost({ management })`.
   - Call `await closeResources(closers.toReversed())` in both `close()` and the startup `catch` block.
4. Keep `apps/web/src/index.ts` under 300 lines and every function under 75 lines.

- [ ] **Step 4: Split `apps/web/src/cli.ts` and remove `!` assertions in `cli.ts` and `web-state.ts` (`FA8`, `FA10`)**

1. In `apps/web/src/cli.ts`:
   - In `connection` (lines 15-52), bind `const protocol = protocols.find(item => item === value.protocol)` after `if (!object(value))` and check `!protocol` in the guard, returning `protocol` with zero `!` assertions.
   - Extract private helpers `loadConnections(provider, model, configPath)`, `loadConfirmedDecks(fixturePath)`, and `openBrowser(origin, token)` so `main` drops under 60 lines.
   - Keep every function in `cli.ts` under 65 lines.
2. In `apps/web/src/web-state.ts` (lines 45-62):
   - Replace line 45 with:

```ts
const ownerRow = this.db.prepare('PRAGMA application_id').get()
const versionRow = this.db.prepare('PRAGMA user_version').get()
if (!ownerRow || !versionRow) throw new WebStateError('SETTINGS_SCHEMA')
const owner = Number(ownerRow.application_id)
const version = Number(versionRow.user_version)
```

   - Replace line 61 with `if (this.db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok') throw new WebStateError('SETTINGS_STORAGE')`.
   - Check that `web-state.ts` has zero `!` assertions.

- [ ] **Step 5: Build, check boundaries, lint, format, check AST metrics, and run root and web suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/index.ts apps/web/src/local-transport.ts apps/web/src/cli.ts apps/web/src/web-state.ts apps/web/src/ui-assets.ts
```

Run quantitative check across `apps/web/src/` root:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.area==='apps/web/src/').map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,smallNonBarrel:!f.isBarrel&&f.lines<30,as:f.typeAssertions.length,nn,services:f.serviceSymbols.length};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every file in `apps/web/src/` root has `over400: false`, `longFn: 0`, `smallNonBarrel: false`, `as: 0`, `nn: 0`, and `services: 0`.

Run root and web suites:

```bash
corepack pnpm@11.28.5 test:tools-browser && corepack pnpm@11.28.5 test:local-web && corepack pnpm@11.28.5 test:local-foundation && corepack pnpm@11.28.5 test:env-startup && corepack pnpm@11.28.5 test:attachments && corepack pnpm@11.28.5 test:research
```

Expected: PASS. All six suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [ ] **Step 6: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 5 as `- [x]` in this file. Update the Task 28 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-28-refactor-web-root-and-local-transport.md`.
2. Create `docs/build/refactor/module-design/reports/task-28-refactor-web-root-and-local-transport.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of modified and removed files.
   - Metrics table for every file in `apps/web/src/` root (`lines`, `longFn`, `smallNonBarrel`, `as`, `!`, `*Service`).
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 28 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 6 as `- [x]` in this file.
5. Run `git status --short` and check that only the files listed in `Files` changed. Stage only those files, commit with a conventional commit message (example: `refactor(web): simplify root composition, transport, cli, and web-state`), and run `git push`.

**STOP** and send the Task 28 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
