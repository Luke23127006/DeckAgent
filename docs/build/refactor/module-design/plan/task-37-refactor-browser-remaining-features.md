# Task 37: Refactor browser chats, requests, attachments, workspaces, and research

Read this file to split `conversation-view.ts`, `workspace-view.ts`, and `research-view.ts`, replace regex matching in `offersSettings`, drop 4 unused internal exports, and remove 15 `!` assertions (`BF3` to `BF7`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/browser/features/chats/conversation-view.ts` (519 lines)
- `apps/web/src/browser/features/chats/message-content.ts` (104 lines)
- `apps/web/src/browser/features/requests/request-feedback.ts` (279 lines)
- `apps/web/src/browser/features/attachments/attachment-view.ts` (78 lines)
- `apps/web/src/browser/features/workspaces/workspace-view.ts` (285 lines)
- `apps/web/src/browser/features/research/research-view.ts` (158 lines)

**Files:**

- Create: `apps/web/src/browser/features/chats/request-row.ts`
- Change: `apps/web/src/browser/features/chats/conversation-view.ts`
- Change: `apps/web/src/browser/features/chats/message-content.ts`
- Change: `apps/web/src/browser/features/requests/request-feedback.ts`
- Change: `apps/web/src/browser/features/attachments/attachment-view.ts`
- Change: `apps/web/src/browser/features/workspaces/workspace-view.ts`
- Change: `apps/web/src/browser/features/research/research-view.ts`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-37-refactor-browser-remaining-features.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-37-refactor-browser-remaining-features.md`

**Interfaces:**

- Produces:
  - `apps/web/src/browser/features/chats/request-row.ts`: internal `RequestRow`, `RequestRowHooks`, `createRequestRow`, `updateRequestActions`, `updateRequestActivities`, `updateApprovalCard`, and `updateRequestRow`.
  - All six feature barrels (`chats/index.ts`, `requests/index.ts`, `attachments/index.ts`, `workspaces/index.ts`, `research/index.ts`) keep their exact public exports unchanged.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not touch any `index.ts` barrel or `boot.ts`).
- Change any Vietnamese UI string, CSS class name, inline `<style>` block, or `offersSettings` result for any known or unknown code.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 6 checks pass.

- [ ] **Step 1: Extract `chats/request-row.ts` and shrink `conversation-view.ts` (`BF3`, `BF7`)**

1. Create `apps/web/src/browser/features/chats/request-row.ts` (under 260 lines, every function under 65 lines):
   - Move `ActivityRow`, `outcomes`, `activityNames`, `RequestRow`, request row creation (`conversation-view.ts` lines 207-256), request updates (`lines 266-358`), and approval card rendering (`lines 360-402`).
   - Export `RequestRow`, `RequestRowHooks`, `createRequestRow`, `updateRequestActions`, `updateRequestActivities`, `updateApprovalCard`, and `updateRequestRow`.
2. Update `apps/web/src/browser/features/chats/conversation-view.ts` (under 300 lines, every function under 75 lines):
   - Delegate `requestRow`, `updateRequest`, and `updateApproval` to `./request-row.ts`.
   - Replace line 486 (`ids.at(-1)!`) with:

```ts
const lastId = ids.at(-1)
const newest = lastId === undefined ? undefined : this.rows.get(lastId)
```

   - Replace line 516 (`this.container.lastElementChild!.remove()`) with:

```ts
while (this.container.children.length > nodes.length) {
  const tail = this.container.lastElementChild
  if (!tail) break
  tail.remove()
}
```

- [ ] **Step 2: Remove all 12 `!` assertions in `chats/message-content.ts` (`BF7`)**

In `apps/web/src/browser/features/chats/message-content.ts` (keep every function under 75 lines):

1. Replace the three raw regex helpers (lines 36-38) with typed parsers:
   - `parseFence(line: string): { readonly marker: string } | null`
   - `parseHeading(line: string): { readonly level: number; readonly text: string } | null`
   - `parseListItem(line: string): { readonly ordered: boolean; readonly start?: string; readonly text: string } | null`
2. In `messageContent`:
   - Bind `const line = lines[index++]` and check `if (line === undefined) break`.
   - Inside the fence loop, bind `const next = lines[index++]` and check `if (next === undefined) break`. Compare `closing.marker[0] === code.marker[0] && closing.marker.length >= code.marker.length && next.trim() === closing.marker`.
   - For headings, use `title.level <= 2 ? 'h2' : 'h3'` and `inline(node, title.text)`.
   - For lists, set `start` when `item.start !== undefined`, render `current.text`, and peek with `const peek = lines[index]; const next = peek !== undefined ? parseListItem(peek) : null`.
   - For paragraphs, bind `const next = lines[index]` and break when `next === undefined || !next.trim() || parseHeading(next) || parseFence(next) || parseListItem(next)`.

- [ ] **Step 3: Replace regex matching in `requests/request-feedback.ts`**

In `apps/web/src/browser/features/requests/request-feedback.ts`:

1. Change the `errors` value type from `readonly [string, string]` to `readonly [string, string, boolean?]`.
2. Add `true` as the third tuple element on exactly the eight codes whose `detail` points to model settings:
   - `RUNTIME_FAILED`, `NO_SELECTABLE_MODEL`, `PROVIDER_KEY_UNAVAILABLE`, `PROVIDER_UNSUPPORTED`, `PROVIDER_MODEL_UNAVAILABLE`, `REQUEST_FAILED`, `PROVIDER_HTTP`, `PROVIDER_AUTH`.
   - Keep `RESEARCH_KEY_UNAVAILABLE` and `RESEARCH_KEY_REJECTED` without `true`.
3. Update `offersSettings(code?: string): boolean` to:

```ts
export function offersSettings(code?: string): boolean {
  if (typeof code === 'string' && Object.hasOwn(errors, code)) return errors[code]?.[2] === true
  return true
}
```

   Note: unknown or missing codes keep returning `true` because the fallback `detail` sends the user to model settings.

- [ ] **Step 4: Narrow internal exports and split `workspace-view.ts` and `research-view.ts` (`BF4`, `BF5`, `BF6`)**

1. In `apps/web/src/browser/features/attachments/attachment-view.ts` line 14, remove `export` from `function attachmentReason`.
2. In `apps/web/src/browser/features/workspaces/workspace-view.ts`:
   - Remove `export` from `function workspaceFailure` (line 15) and `function folderNotice` (line 49).
   - Remove `export interface WorkspaceControls` (lines 57-61) and inline the return type of `workspaceView` as `{ readonly node: HTMLElement; setBusy(value: boolean): void; update(list: WorkspaceList): void }`.
   - Replace line 80 (`selected.folder!`) with `const folder = selected?.folder; if (selected && folder) change(() => management.relinkWorkspace(selected.id, folder), false)`.
   - Extract file-local `createWorkspaceDom` (keeping the `<style>` block verbatim), `renderWorkspaceList`, `runWorkspaceChange`, and `openWorkspaceDialog` so every function is under 65 lines and `workspaceView` is under 65 lines.
3. In `apps/web/src/browser/features/research/research-view.ts`:
   - Extract file-local `createResearchDialog`, `renderResearchSources`, and `createResearchControls` so every function is under 65 lines and `researchView` is under 65 lines.

- [ ] **Step 5: Build, check boundaries, lint, format, measure AST metrics, and run suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/browser/features/chats/ apps/web/src/browser/features/requests/ apps/web/src/browser/features/attachments/ apps/web/src/browser/features/workspaces/ apps/web/src/browser/features/research/
```

Run quantitative AST check across all six non-deck `browser/features/` folders:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.path.startsWith('apps/web/src/browser/features/')&&!f.path.startsWith('apps/web/src/browser/features/deck/')).map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,smallNonBarrel:!f.isBarrel&&f.lines<30,as:f.typeAssertions.length,nn,exports:f.exportCount};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every file has `over400: false`, `longFn: 0`, `smallNonBarrel: false`, `as: 0`, and `nn: 0`. `attachment-view.ts` and `workspace-view.ts` each have `exports: 1`.

Run feature suites:

```bash
corepack pnpm@11.28.5 test:local-web && corepack pnpm@11.28.5 test:tools-browser && corepack pnpm@11.28.5 test:research
```

Expected: PASS. All three suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [ ] **Step 6: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 37 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-37-refactor-browser-remaining-features.md`.
2. Create `docs/build/refactor/module-design/reports/task-37-refactor-browser-remaining-features.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created and changed files.
   - AST metrics table for every file across the six non-deck browser feature folders.
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 37 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 6 as `- [x]` in this file.
5. Run `git status --short` and check that only the files in `Files` changed. Stage only those files, commit with `refactor(browser): split chats, workspaces, research, and remove assertions`, and run `git push`.

**STOP** and send the Task 37 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
