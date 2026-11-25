# Task 26: Refactor deck workflow, BriefCoordinator, and ConfirmationCoordinator

Read this file to split `deck-workflow.ts`, extract shared generation execution, rename `BriefService` and `ConfirmationService`, and replace all remaining `!` assertions in `features/deck/` (`FD2`, `FD5`, `FD7`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/features/deck/deck-workflow.ts` (812 lines)
- `apps/web/src/features/deck/brief-service.ts` (135 lines)
- `apps/web/src/features/deck/confirmation-service.ts` (141 lines)
- `apps/web/src/features/deck/failures.ts` (12 lines)
- `apps/web/src/features/deck/index.ts` (7 lines)
- `apps/web/src/index.ts` (lines 44-55 and lines 270-305)

**Files:**

- Create: `apps/web/src/features/deck/generation-execution.ts`
- Create: `apps/web/src/features/deck/deck-prompts.ts`
- Create: `apps/web/src/features/deck/deck-tool-session.ts`
- Create: `apps/web/src/features/deck/brief-coordinator.ts`
- Create: `apps/web/src/features/deck/confirmation-coordinator.ts`
- Remove: `apps/web/src/features/deck/brief-service.ts`
- Remove: `apps/web/src/features/deck/confirmation-service.ts`
- Change: `apps/web/src/features/deck/deck-workflow.ts`
- Change: `apps/web/src/features/deck/index.ts`
- Change: `apps/web/src/index.ts`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-26-refactor-deck-workflow-and-coordinators.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-26-refactor-deck-workflow-and-coordinators.md`

**Interfaces:**

- Produces:
  - `apps/web/src/features/deck/generation-execution.ts`: `executeGenerationRun(decks: DeckStore, prepared: PreparedRequest, sessionId: string, intentId: string, requestId: string, run: RequestRun): Promise<RuntimeOutcome>`
  - `apps/web/src/features/deck/deck-prompts.ts`: `emptyBriefDraft(): BriefDraft`, `deckToolResult`, `decodeDeckToolArgs`, `buildDeckToolSchemas`, `buildDeckInstructions`, `buildRecoveryInstructions`
  - `apps/web/src/features/deck/deck-tool-session.ts`: `createDeckToolSession(...)`
  - `apps/web/src/features/deck/index.ts`: exports `DeckWorkflowFailure`, `BriefCoordinator`, `ConfirmationCoordinator`, `DeckWorkflow`, `GenerationWorkflow`, `generationReport`, `WebImageResearch` (`7` exports)

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (keep `apps/web/src/features/deck/failures.ts` because the owner approved `FD8` as `no action`).
- Change any `DeckWorkflowFailure` code, HTTP behavior, or `DeckWorkflow` constructor signature.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 7 checks pass.

- [x] **Step 1: Create `generation-execution.ts` and `deck-prompts.ts` (`FD2`, `FD5`)**

1. Create `apps/web/src/features/deck/generation-execution.ts`:
   - Export `executeGenerationRun(decks: DeckStore, prepared: PreparedRequest, sessionId: string, intentId: string, requestId: string, run: RequestRun): Promise<RuntimeOutcome>`.
   - Move the shared `startGeneration -> prepared.start(grant, generationCapability) -> finishGeneration -> GENERATION_INCOMPLETE / GENERATION_FAILED` block from `confirmation-service.ts` lines 93-117 and `deck-workflow.ts` lines 107-130.
   - Keep the file under 45 lines.
2. Create `apps/web/src/features/deck/deck-prompts.ts`:
   - Export `emptyBriefDraft(): BriefDraft` (lines 21-27 of `deck-workflow.ts`).
   - Export `deckToolResult(value: unknown, isError?: boolean): ToolResult` (lines 47-50).
   - Export `decodeDeckToolArgs(args: unknown): unknown` (lines 51-81).
   - Export `buildDeckToolSchemas(action: NonNullable<AgentRequest['deck']>['action'], readOnly: boolean, restored: boolean, hasImageReview: boolean): readonly ToolSchema[]` (lines 28-46 and 301-324).
   - Export `buildDeckInstructions(context: unknown): string` (lines 281-300).
   - Export `buildRecoveryInstructions(instructions: string, recoveryJson: string): string` (line 692).
   - Keep every function in `deck-prompts.ts` under 70 lines.

- [x] **Step 2: Create `brief-coordinator.ts` and `confirmation-coordinator.ts`, and remove `*-service.ts` (`FD5`, `FD7`)**

1. Create `apps/web/src/features/deck/brief-coordinator.ts`:
   - Rename `BriefService` to `BriefCoordinator` (implements `BriefManagement`).
   - In `verify` (lines 34-47), bind `const source = item?.source` before the `if` guard, check `!source`, and compare `source.sourceId` and `source.version` inside `.some(...)` with zero `!` assertions.
   - In `interview`, call `emptyBriefDraft()` from `./deck-prompts.ts` instead of duplicating the literal.
   - Keep every method under 40 lines.
2. Create `apps/web/src/features/deck/confirmation-coordinator.ts`:
   - Rename `ConfirmationService` to `ConfirmationCoordinator`, typing `briefs: BriefCoordinator`.
   - Import `RequestPreparationFailure` from `../requests/index.ts` and `executeGenerationRun` from `./generation-execution.ts`.
   - Split `confirm` (currently 121 lines) into private methods:
     - `findExistingConfirmation(sessionId, target)` (lines 35-58)
     - `admitConfirmedGeneration(sessionId, target, old, submit)` (lines 59-121, delegating `prepared.start` to `executeGenerationRun`)
     - `rethrowConfirmationError(error): never` (lines 122-135, using `error instanceof RequestPreparationFailure` in place of `error.name === 'RequestPreparationFailure'`)
   - Keep every method under 65 lines.
3. Remove `apps/web/src/features/deck/brief-service.ts` and `apps/web/src/features/deck/confirmation-service.ts`.

- [x] **Step 3: Create `apps/web/src/features/deck/deck-tool-session.ts` (`FD2`, `FD7`)**

Move the mutable staging state, tool dispatch, error formatting, and recovery check out of `deck-workflow.ts` lines 225-653 into `apps/web/src/features/deck/deck-tool-session.ts`:
1. Export `createDeckToolSession(options)` returning `{ tools, state, runImageRecovery }`.
2. Split tool execution into focused private helpers, each under 70 lines:
   - `isSourceToolAllowed(name, initial, publicResearch)` (lines 325-330).
   - `executeImageTool(name, args, state, imageReview)` (lines 370-422).
   - `executeStageBrief(args, command, initial, sessionId, briefs, state)` (lines 423-510, splitting `assertBriefChoices(draft, initial, command)` under 60 lines).
   - `executeStageOutline(args, state, imageReview)` (lines 511-547).
   - `formatToolFailure(name, error, state, imageReview)` (lines 548-650, split into brief, outline, and image error formatters under 40 lines each).
   - `hasRecoverableImages(pendingImages)` (lines 665-677).
3. Bind `const baseTools = run.tools` before constructing `tools`, and call `baseTools.call(name, args)` with zero `!` assertions (replacing `run.tools!.call` at line 343).
4. Keep `deck-tool-session.ts` under 360 lines and every function under 75 lines.

- [x] **Step 4: Simplify `apps/web/src/features/deck/deck-workflow.ts` (`FD2`, `FD5`, `FD7`)**

Update `apps/web/src/features/deck/deck-workflow.ts`:
1. Import `type BriefCoordinator` from `./brief-coordinator.ts`, `executeGenerationRun` from `./generation-execution.ts`, `emptyBriefDraft` and `buildDeckInstructions` from `./deck-prompts.ts`, and `createDeckToolSession` from `./deck-tool-session.ts`.
2. Split `prepare(request)` into private methods `prepareContinuation(request)` (delegating `start` to `this.decks.continueGeneration` + `executeGenerationRun`) and `prepareDeckCommand(request, command)` (each under 65 lines).
3. Pass `command: NonNullable<AgentRequest['deck']>` explicitly into `private async start(request, command, initial, prepared, run, restored)` to remove `request.deck!` (line 197).
4. Extract private helpers (each under 70 lines):
   - `openImageReview(command, initial, previousOutline, run, restored)` (lines 200-260).
   - `buildWorkflowContext(command, initial, staged, outline, previousOutline, previousReviews, resumeImages, imageReview, sessionId)` (lines 261-280).
   - `commitProposal(request, command, staged, outline, restored, imageReview, run)` (lines 734-809). Bind `const restoreId = restored ? command.restoreOutlineId : undefined` before calling `prepareOutlineImages`, and use `restoreId` inside the resolver callback with zero `!` assertions (replacing line 768).
5. Keep `deck-workflow.ts` under 260 lines and every function under 75 lines.

- [x] **Step 5: Update `features/deck/index.ts` and `apps/web/src/index.ts` (`FD5`)**

1. In `apps/web/src/features/deck/index.ts`, export `BriefCoordinator` from `./brief-coordinator.ts` and `ConfirmationCoordinator` from `./confirmation-coordinator.ts` instead of `BriefService` and `ConfirmationService`.
2. In `apps/web/src/index.ts`, update lines 46-47 (`BriefCoordinator`, `ConfirmationCoordinator`), line 274 (`new BriefCoordinator(...)`), and line 278 (`new ConfirmationCoordinator(...)`).

- [x] **Step 6: Build, check boundaries, lint, format, check AST metrics, and run all deck suites**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/features/deck/ apps/web/src/index.ts
```

Run quantitative check across all of `apps/web/src/features/deck/`:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.path.startsWith('apps/web/src/features/deck/')).map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,smallNonBarrel:!f.isBarrel&&f.lines<30,as:f.typeAssertions.length,nn,services:f.serviceSymbols.length,exports:f.exportCount};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every file has `over400: false`, `longFn: 0`, `as: 0`, `nn: 0`, and `services: 0`. Only `failures.ts` has `smallNonBarrel: true`. `index.ts` has `exports: 7`.

Run all five deck-related suites:

```bash
corepack pnpm@11.28.5 test:brief-foundation && corepack pnpm@11.28.5 test:outline-workflow && corepack pnpm@11.28.5 test:deck-review && corepack pnpm@11.28.5 test:slide-pipeline && corepack pnpm@11.28.5 test:generation-publication
```

Expected: PASS. All five suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [x] **Step 7: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 6 as `- [x]` in this file. Update the Task 26 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-26-refactor-deck-workflow-and-coordinators.md`.
2. Create `docs/build/refactor/module-design/reports/task-26-refactor-deck-workflow-and-coordinators.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created, modified, and removed files.
   - Metrics table across all `apps/web/src/features/deck/` files (`lines`, `longFn`, `as`, `!`, `*Service`, `exports`).
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 26 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 7 as `- [x]` in this file.
5. Run `git status --short` and check that only the files listed in `Files` changed. Stage only those files, commit with a conventional commit message (example: `refactor(deck): split deck-workflow and rename coordinators`), and run `git push`.

**STOP** and send the Task 26 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)

