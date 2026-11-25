# Task 27: Refactor non-deck application features

Read this file to fold small `failures.ts` and `contracts.ts` files, remove unused feature exports, split `source-tools.ts`, rename `AttachmentService` and `ResearchService`, and replace all non-deck feature assertions (`FA2`, `FA3`, `FA4`, `FA7`, `FA9`, `FA10`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/features/attachments/index.ts` (4 lines)
- `apps/web/src/features/attachments/failures.ts` (9 lines)
- `apps/web/src/features/attachments/attachment-service.ts` (lines 1-75)
- `apps/web/src/features/attachments/managed-attachments.ts` (lines 310-340)
- `apps/web/src/features/providers/index.ts` (3 lines)
- `apps/web/src/features/providers/failures.ts` (9 lines)
- `apps/web/src/features/providers/provider-settings.ts` (lines 1-110)
- `apps/web/src/features/research/index.ts` (2 lines)
- `apps/web/src/features/research/failures.ts` (9 lines)
- `apps/web/src/features/research/research-service.ts` (lines 1-45)
- `apps/web/src/features/sources/index.ts` (2 lines)
- `apps/web/src/features/sources/failures.ts` (9 lines)
- `apps/web/src/features/sources/source-tools.ts` (345 lines)
- `apps/web/src/features/chats/index.ts` (58 lines)
- `apps/web/src/features/chats/contracts.ts` (25 lines)
- `apps/web/src/features/workspaces/index.ts` (53 lines)
- `apps/web/src/features/workspaces/contracts.ts` (18 lines)
- `apps/web/src/features/requests/index.ts` (6 lines)
- `apps/web/src/features/deck/image-research.ts` (lines 1-30)
- `apps/web/src/index.ts` (lines 35-48 and lines 215-245)

**Files:**

- Create: `apps/web/src/features/attachments/attachment-coordinator.ts`
- Remove: `apps/web/src/features/attachments/attachment-service.ts`
- Remove: `apps/web/src/features/attachments/failures.ts`
- Change: `apps/web/src/features/attachments/managed-attachments.ts`
- Change: `apps/web/src/features/attachments/index.ts`
- Remove: `apps/web/src/features/providers/failures.ts`
- Change: `apps/web/src/features/providers/provider-settings.ts`
- Change: `apps/web/src/features/providers/index.ts`
- Create: `apps/web/src/features/research/research-coordinator.ts`
- Remove: `apps/web/src/features/research/research-service.ts`
- Remove: `apps/web/src/features/research/failures.ts`
- Change: `apps/web/src/features/research/index.ts`
- Remove: `apps/web/src/features/sources/failures.ts`
- Change: `apps/web/src/features/sources/source-tools.ts`
- Change: `apps/web/src/features/sources/index.ts`
- Remove: `apps/web/src/features/chats/contracts.ts`
- Change: `apps/web/src/features/chats/index.ts`
- Remove: `apps/web/src/features/workspaces/contracts.ts`
- Change: `apps/web/src/features/workspaces/index.ts`
- Change: `apps/web/src/features/requests/index.ts`
- Change: `apps/web/src/features/deck/image-research.ts`
- Change: `apps/web/src/index.ts`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-27-refactor-non-deck-features.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-27-refactor-non-deck-features.md`

**Interfaces:**

- Produces:
  - `apps/web/src/features/attachments/index.ts`: exports `AttachmentFailure`, `AttachmentCoordinator`, `ManagedAttachments` (`3` exports)
  - `apps/web/src/features/providers/index.ts`: exports `ProviderFailure`, `ProviderStore`, `protocols`, `type ProviderConnection`, `type ProviderStoreOptions` (`5` exports)
  - `apps/web/src/features/research/index.ts`: exports `ResearchFailure`, `ResearchCoordinator` (`2` exports)
  - `apps/web/src/features/sources/index.ts`: exports `SourceToolFailure`, `prepareSourceTools` (`2` exports)
  - `apps/web/src/features/chats/index.ts`: exports `ChatWorkflowError`, `createChatOperations`, `type ChatOperations`, `type ChatWorkflowErrorCode` (`4` exports)
  - `apps/web/src/features/workspaces/index.ts`: exports `WorkspaceWorkflowError`, `createWorkspaceOperations`, `type WorkspaceOperations` (`3` exports)
  - `apps/web/src/features/requests/index.ts`: exports `RequestPreparationFailure`, `createRequestRuntime`, `type RequestPreparationFailureCode` (`3` exports)

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not touch `local-transport.ts`, `cli.ts`, `web-state.ts`, `ui-assets.ts`, or test files in this task).
- Change any error code string or HTTP error behavior.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 7 checks pass.

- [ ] **Step 1: Refactor `features/attachments/` (`FA2`, `FA4`, `FA9`, `FA10`)**

1. Create `apps/web/src/features/attachments/attachment-coordinator.ts` from `attachment-service.ts`:
   - Move `export class AttachmentFailure` verbatim from `features/attachments/failures.ts` into `attachment-coordinator.ts`.
   - Rename `AttachmentService` to `AttachmentCoordinator`.
   - Drop the unused `export` keyword on `function attachmentView`.
2. Remove `apps/web/src/features/attachments/attachment-service.ts` and `apps/web/src/features/attachments/failures.ts`.
3. Update `apps/web/src/features/attachments/index.ts` to export `AttachmentFailure`, `AttachmentCoordinator` from `./attachment-coordinator.ts`, and `ManagedAttachments` from `./managed-attachments.ts`. Drop `AttachmentUpload`.
4. In `apps/web/src/features/attachments/managed-attachments.ts` (lines 329-338), replace both `match[1]!` assertions:

```ts
const match = /^(att-[a-f0-9-]{36})\.(part|bin|parsed|parsed-part)$/.exec(name)
const id = match?.[1]
if (match && id && fileId.test(id) && (!retained.has(id) || match[2] === 'part' || match[2] === 'parsed-part')) {
  await this.checkRoot()
  await unlink(join(this.root, name))
}
```

- [ ] **Step 2: Refactor `features/providers/` and `features/research/` (`FA2`, `FA9`, `FA10`)**

1. In `apps/web/src/features/providers/provider-settings.ts`:
   - Move `export class ProviderFailure` verbatim from `features/providers/failures.ts` into `provider-settings.ts` and remove `features/providers/failures.ts`.
   - Add local type predicate:

```ts
function isProviderProtocol(value: unknown): value is ProviderProtocol {
  return protocols.some(item => item === value)
}
```

   - In `parse` (lines 72-103), check `!isProviderProtocol(value.protocol)` in the guard and bind `const protocol = value.protocol` without `as ProviderProtocol`.
   - Update `apps/web/src/features/providers/index.ts` to export `ProviderFailure` from `./provider-settings.ts`.
2. Create `apps/web/src/features/research/research-coordinator.ts` from `research-service.ts`:
   - Move `export class ResearchFailure` verbatim from `features/research/failures.ts` into `research-coordinator.ts`.
   - Rename `ResearchService` to `ResearchCoordinator`.
3. Remove `apps/web/src/features/research/research-service.ts` and `apps/web/src/features/research/failures.ts`.
4. Update `apps/web/src/features/research/index.ts` to export `ResearchFailure` and `ResearchCoordinator` from `./research-coordinator.ts`.

- [ ] **Step 3: Refactor `features/sources/source-tools.ts` (`FA2`, `FA7`, `FA9`, `FA10`)**

1. Move `export class SourceToolFailure` verbatim from `features/sources/failures.ts` into `source-tools.ts` and remove `features/sources/failures.ts`.
2. Update `apps/web/src/features/sources/index.ts` to export `SourceToolFailure` and `prepareSourceTools` from `./source-tools.ts`.
3. Update `ResearchService` type import in `source-tools.ts` to `ResearchCoordinator`.
4. Import `record` from `../../web-state.ts` and replace `args as Record<string, unknown>` (lines 164-165) with `if (!record(args)) throw new SourceError('SOURCE_ARGUMENTS_INVALID')`.
5. Extract private helpers inside `source-tools.ts`, each under 75 lines:
   - `buildDeniedRoots(options, root)` (lines 68-73)
   - `buildSourceManifest(root, sourceCatalogue, researchSources, attachments, hasResearch)` (lines 102-122)
   - `buildSourceSchemas(hasResearchSources, hasResearch)` (lines 139-160)
   - `executeResearchTool(name, value, researchSources, research, sessionId, context)` (lines 166-209)
   - `loadPreparedAttachment(item, attachments, sessionId, signal)` (lines 229-255)
   - `readAttachmentPart(value, attachments, managed, sessionId, signal)` (lines 226-319). Replace `part.text[end - 1]!` (line 300) with `const prev = part.text[end - 1]; if (end < part.text.length && prev !== undefined && /[\uD800-\uDBFF]/.test(prev)) end--`.
   - `readFileSource(name, pathValue, access, store, context)` (lines 320-342)
6. Keep `prepareSourceTools`, `execute`, and every helper under 75 lines, with zero `as` and zero `!`.

- [ ] **Step 4: Fold `chats/contracts.ts` and `workspaces/contracts.ts`, and narrow `requests/index.ts` (`FA3`, `FA4`)**

1. Fold `apps/web/src/features/chats/contracts.ts` into `apps/web/src/features/chats/index.ts`:
   - Keep `export type ChatWorkflowErrorCode`, `export class ChatWorkflowError`, `export interface ChatOperations`, and `export function createChatOperations`.
   - Keep `type ChatWorkflowErrorDetail` internal (not exported).
   - Remove `apps/web/src/features/chats/contracts.ts`.
2. Fold `apps/web/src/features/workspaces/contracts.ts` into `apps/web/src/features/workspaces/index.ts`:
   - Keep `export class WorkspaceWorkflowError`, `export interface WorkspaceOperations`, and `export function createWorkspaceOperations`.
   - Keep `type WorkspaceWorkflowErrorCode` internal (not exported).
   - Remove `apps/web/src/features/workspaces/contracts.ts`.
3. In `apps/web/src/features/requests/index.ts`, remove `RequestPreparationFailureDetail` and `RuntimePreparationDependencies` from the `export type` block.

- [ ] **Step 5: Update callers of `AttachmentCoordinator` and `ResearchCoordinator` (`FA9`)**

1. In `apps/web/src/features/deck/image-research.ts`, update `type ResearchService` to `type ResearchCoordinator`.
2. In `apps/web/src/index.ts`, update imports and instantiations of `AttachmentService` to `AttachmentCoordinator` and `ResearchService` to `ResearchCoordinator`.

- [ ] **Step 6: Build, check boundaries, lint, format, check AST metrics, and run feature suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/features/ apps/web/src/index.ts
```

Run quantitative check across all of `apps/web/src/features/`:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.area==='apps/web/src/features/'); let nn=0; for(const f of files){const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf);} const small=files.filter(f=>!f.isBarrel&&f.lines<30).map(f=>f.path); console.log(JSON.stringify({fileCount:files.length,over400:files.filter(f=>f.lines>400).length,longFn:files.reduce((a,f)=>a+f.longFunctions.length,0),smallNonBarrel:small,as:files.reduce((a,f)=>a+f.typeAssertions.length,0),nn,services:files.reduce((a,f)=>a+f.serviceSymbols.length,0)},null,2));"
```

Expected: PASS. Output shows `over400: 0`, `longFn: 0`, `smallNonBarrel: ["apps/web/src/features/deck/failures.ts"]`, `as: 0`, `nn: 0`, and `services: 0`.

Run feature suites:

```bash
corepack pnpm@11.28.5 test:local-foundation && corepack pnpm@11.28.5 test:local-web && corepack pnpm@11.28.5 test:attachments && corepack pnpm@11.28.5 test:source-permissions && corepack pnpm@11.28.5 test:research && corepack pnpm@11.28.5 test:model-requests
```

Expected: PASS. All six suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [ ] **Step 7: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 6 as `- [x]` in this file. Update the Task 27 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-27-refactor-non-deck-features.md`.
2. Create `docs/build/refactor/module-design/reports/task-27-refactor-non-deck-features.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created, modified, and removed files.
   - Aggregate metrics table for `apps/web/src/features/` (`fileCount`, `over400`, `longFn`, `smallNonBarrel`, `as`, `!`, `*Service`).
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 27 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 7 as `- [x]` in this file.
5. Run `git status --short` and check that only the files listed in `Files` changed. Stage only those files, commit with a conventional commit message (example: `refactor(web): clean non-deck features and rename coordinators`), and run `git push`.

**STOP** and send the Task 27 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
