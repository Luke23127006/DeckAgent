# Task 38: Remove `layout.ts` and split browser `boot.ts` into shell modules

Read this file to remove dead `layout.ts`, split `boot.ts` into four internal shell modules under 300 lines, and remove all assertions (`BB1`, `BB4`, `BB7`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/browser/layout.ts` (16 lines)
- `apps/web/src/browser/boot.ts` (lines 1-650 and lines 651-1263)

**Files:**

- Remove: `apps/web/src/browser/layout.ts`
- Create: `apps/web/src/browser/shell-dom.ts`
- Create: `apps/web/src/browser/draft-sync.ts`
- Create: `apps/web/src/browser/chat-navigation.ts`
- Create: `apps/web/src/browser/request-runner.ts`
- Change: `apps/web/src/browser/boot.ts`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-38-refactor-browser-boot-and-shell.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-38-refactor-browser-boot-and-shell.md`

**Interfaces:**

- Produces:
  - `apps/web/src/browser/shell-dom.ts`: internal `createShellDom` mounting shell regions, rail collapse, mobile recents toggle, account menu, search bar, and `ResizeObserver`.
  - `apps/web/src/browser/draft-sync.ts`: internal `createDraftSync` owning draft state, debounced save/flush, attachment upload/remove/preview, focus sync, and the `500` ms `attachmentTimer`.
  - `apps/web/src/browser/chat-navigation.ts`: internal `createChatNavigation` owning `refresh`, `showHistory`, `showActivities`, `showOutlines`, `open`, `newChat`, `renderModels`, `renderChats`, `switchingBlocked`, and `findChats`.
  - `apps/web/src/browser/request-runner.ts`: internal `sendBlocked` and `createRequestRunner` owning `follow`, `stopActiveRequest`, `submitRequest`, `confirmOutline`, `confirmTarget`, and the `750` ms active-request poll timer.
  - `apps/web/src/browser/boot.ts`: keeps the bundle entrypoint (`scripts/build-workspace.mjs` line 77 unchanged) with zero exports.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not touch `dom.ts`, `motion.ts`, `theme.ts`, `scripts/build-workspace.mjs`, or any test file).
- Change any Vietnamese UI string, DOM selector, CSS class, `localStorage` or `sessionStorage` key, timer interval (`200`, `250`, `500`, `750`), or `requestLimit` (`16000`).
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 7 checks pass.

- [x] **Step 1: Remove `layout.ts` and create `shell-dom.ts` (`BB1`, `BB4`, `BB7`)**

1. Remove `apps/web/src/browser/layout.ts`.
2. Create `apps/web/src/browser/shell-dom.ts` (under 290 lines, every function under 70 lines):
   - Query `const root = document.querySelector<HTMLElement>('#app')` and throw `new Error('APP_ROOT_MISSING')` when `!root`, removing the `!` assertion at `boot.ts:58`.
   - Build all shell regions (`navigation`, `chats`, `conversation`, `heading`, `title`, `headerState`, `welcome`, `welcomeTitle`, `welcomeDetail`, `model`, `status`, `messages`, `outlineDock`, `form`, `input`, `submit`, `stopRequest`, `deck`, `publishedDeck`, `unavailable`, `newChatButton`, `navigationHint`, `recents`, `navTop`, `accountMenu`, `accountTrigger`, `search`, `searchInput`, `openDeck`, `retryGeneration`, `reconnect`, `composerActions`).
   - Own `setNavigation` (`deckagent-nav` in `localStorage`), `foldRecents` (`max-width:720px`), `openAccountMenu`, `closeAccountMenu`, `fitInput`, and the `ResizeObserver` updating `--navigation-height` (returning `dispose()` to disconnect it).
   - In the `document` `pointerdown` listener (`boot.ts:879-886`), guard `const target = event.target; if (!(target instanceof Node)) return` before `!accountMenu.contains(target) && !accountTrigger.contains(target)`, removing both `as Node` assertions.

- [x] **Step 2: Create `draft-sync.ts` (`BB4`)**

Create `apps/web/src/browser/draft-sync.ts` (under 240 lines, every function under 65 lines) exporting `createDraftSync(options)`:

1. Move `drafts`, `draftStates`, `draftWork`, `pendingDrafts`, `attachmentBusy`, `enqueueDraft`, `receiveDraft`, `saveDraft`, `flushDraft`, `readDraft`, `uploadAttachments`, `removeAttachment`, `previewAttachment`, and `closePreview` (`boot.ts` lines 195-231 and 258-391).
2. Move the `500` ms `attachmentTimer` (`boot.ts` lines 1191-1210) and the `window` `focus` draft sync listener (`boot.ts` lines 1232-1249).
3. Expose `dispose()` to clear `attachmentTimer`, remove the `focus` listener, and call `closePreview()`.

- [x] **Step 3: Create `chat-navigation.ts` (`BB4`)**

Create `apps/web/src/browser/chat-navigation.ts` (under 280 lines, every function under 70 lines) exporting `createChatNavigation(options)`:

1. Move `describeHistory`, `remember`, `renderModels`, `chatButton`, `renderChats`, `refresh`, `showHistory`, `showActivities`, `showOutlines`, `open`, `newChat`, `findChats`, and `switchingBlocked` (`boot.ts` lines 240-249, 302-308, 471-573, 651-730, 746-772, 782-784).
2. Keep `open` loading all five resources before mutating `current` so a failed open leaves the old chat intact.
3. Expose `dispose()` to clear `searchTimer`.

- [x] **Step 4: Create `request-runner.ts` (`BB4`, `BB7`)**

Create `apps/web/src/browser/request-runner.ts` (under 290 lines, every function under 75 lines) exporting `sendBlocked` and `createRequestRunner(options)`:

1. Move `sendBlocked`, `follow`, `stopActiveRequest` (`boot.ts:153-170`), `submitRequest` (`boot.ts:1035-1096`), `confirmOutline` (`boot.ts:1097-1131`), `confirmTarget` (`boot.ts:1132-1168`), and the `750` ms active-request poll `timer` (`boot.ts:1169-1190`).
2. In `submitRequest` (replacing the four `!` assertions at `boot.ts:1071,1075`):

```ts
const draft = draftSync.getDraftState(id)
const draftRevision = draft?.revision
const attachmentIds = draft?.attachmentIds ?? []
const consumesDraft = draftRevision !== undefined && (!continueDeck || draft?.text === text)
const accepted = await client.send({
  sessionId: id,
  input: text,
  ...(continueDeck ? { continueDeck: true as const } : {}),
  publicResearch,
  ...(command ? { deck: command } : {}),
  ...(!consumesDraft ? {} : { draftRevision, attachmentIds }),
})
if (consumesDraft)
  draftSync.receiveDraft(
    { sessionId: id, text: '', revision: draftRevision + 1, attachmentIds: [], attachments: [] },
    true,
  )
```

3. Expose `abortWatch()` and `dispose()` (clearing `timer` and aborting `watch`).

- [x] **Step 5: Shrink `boot.ts` under 280 lines (`BB4`, `BB7`)**

Refactor `apps/web/src/browser/boot.ts` (under 280 lines, every function under 75 lines, zero `as`, zero `!`):

1. Read `token`, instantiate the six transport clients, and call `createShellDom`.
2. Mount `mountDeckTab`, `mountDeckCanvas`, `DeckWorkflowView`, `ConversationView`, `settingsPanel`, `workspaceView`, `modelPicker`, `researchView`, `AttachmentDraftView`, `themeControl`, and `initMotion`.
3. Wire `createDraftSync`, `createChatNavigation`, `createRequestRunner`, `controls()`, `run()`, `model` `change` listener, `reconnect` button, `pagehide` and `pageshow` listeners, and the initial startup sequence (`refresh` then open remembered chat or `newChat`).

- [x] **Step 6: Build, check boundaries, lint, format, measure AST metrics, and run suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/browser/boot.ts apps/web/src/browser/shell-dom.ts apps/web/src/browser/draft-sync.ts apps/web/src/browser/chat-navigation.ts apps/web/src/browser/request-runner.ts
```

Run quantitative AST check across all of `apps/web/src/browser/`:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.area==='apps/web/src/browser/'); let nn=0; for(const f of files){const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf);} console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((a,f)=>a+f.lines,0),over400:files.filter(f=>f.lines>400).map(f=>f.path),longFn:files.flatMap(f=>f.longFunctions.map(fn=>f.path+':'+fn.name)),smallNonBarrel:files.filter(f=>!f.isBarrel&&f.lines<30).map(f=>f.path),asCount:files.reduce((a,f)=>a+f.typeAssertions.length,0),nonNullCount:nn,serviceCount:files.reduce((a,f)=>a+f.serviceSymbols.length,0)},null,2));"
```

Expected: PASS. Output shows `over400: []`, `longFn: []`, `smallNonBarrel: ["apps/web/src/browser/dom.ts"]`, `asCount: 0`, `nonNullCount: 0`, and `serviceCount: 0`.

Run browser runtime, local web, and browser smoke suites (outside the sandbox on Windows only when Chromium sandbox restrictions block `test:browser-smoke`):

```bash
corepack pnpm@11.28.5 test:tools-browser && corepack pnpm@11.28.5 test:local-web && corepack pnpm@11.28.5 test:browser-smoke
```

Expected: PASS. All three suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [x] **Step 7: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 6 as `- [x]` in this file. Change the Task 38 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-38-refactor-browser-boot-and-shell.md`.
2. Create `docs/build/refactor/module-design/reports/task-38-refactor-browser-boot-and-shell.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created, changed, and removed files.
   - AST metrics summary for `apps/web/src/browser/` root files and total browser area counts.
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 38 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 7 as `- [x]` in this file.
5. Run `git status --short` and check that only the files in `Files` changed. Stage only those files, commit with `refactor(browser): remove layout.ts and split boot.ts into shell modules`, and run `git push`.

**STOP** and send the Task 38 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
