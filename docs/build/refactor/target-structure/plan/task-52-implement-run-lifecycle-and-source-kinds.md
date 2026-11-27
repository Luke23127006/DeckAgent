# Task 52: Implement runs/lifecycle RunController and sourceKinds in apps/host/src/tools

Read this file to learn the steps of Task 52, which implements `RunController` in `apps/host/src/runs/lifecycle/` and adds `sourceKinds` filtering and `createSourceToolsContribution` to `apps/host/src/tools/`.

**Type:** Code

After this task, `apps/host/src/runs/lifecycle/` owns owner-based run admission, serialization, event log writes, approvals, Stop, budget enforcement, multi-pass `RunPlan.next` and terminal settlement with zero `sessionId` fields. `apps/host/src/tools/` supports `RunGrants.sourceKinds` filtering and exports `createSourceToolsContribution` and `mapSourceToolFailure`. The existing Host runtime path stays unchanged until a later task cuts it over.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/architecture/10-agent-core.md` (the sections `Contract` and `Luồng của một run`)
- `apps/host/src/runs/ports.ts`, `apps/host/src/runs/preparation/index.ts`, `apps/host/src/runs/budget/index.ts`, `apps/host/src/runs/index.ts`
- `packages/host/api/src/lifecycle/request-controller.ts`
- `apps/host/src/runtimes/opencode/agent-runtime.ts`, `apps/host/src/runtimes/opencode/stream-tracker.ts`
- `apps/host/src/tools/executors/source-tools.ts`, `apps/host/src/tools/index.ts`

**Files:**

- Create: `apps/host/src/runs/lifecycle/run-controller.ts`, `apps/host/src/runs/lifecycle/index.ts`, `apps/host/tests/run-lifecycle.test.mjs`
- Change: `apps/host/src/runs/ports.ts`, `apps/host/src/runs/index.ts`, `apps/host/src/runtimes/opencode/agent-runtime.ts`, `apps/host/src/runtimes/opencode/stream-tracker.ts`, `apps/host/src/tools/executors/source-tools.ts`, `apps/host/src/tools/index.ts`, `package.json`

**Interfaces:**

- Produces, in `apps/host/src/runs/ports.ts`:
  - `summarizedNotice = 'CONVERSATION_SUMMARIZED'`
  - Extend `RuntimeAvailability` unavailable branch and `RunFailure` constructor with optional `readonly detail?: Readonly<Record<string, string | boolean>>`.
  - `RunLifecycleContext`: `{ readonly owner: RunOwner; readonly requestId: string; readonly signal: AbortSignal; emit(event: RunEvent): Promise<void> }`
  - `RunStartOptions`: `{ readonly attachmentIds?: readonly string[]; readonly draftRevision?: number; readonly onAdmitted?: () => void; readonly runtime?: AgentRuntime }`
  - `RunSnapshot`: `{ readonly requestId: string; readonly owner: RunOwner; readonly status: RequestStatus; readonly errorCode?: string; readonly text: string; readonly sequence: number; readonly pendingApproval?: ApprovalView | null }`
  - Extend `RunPlan` with optional `readonly skipRuntime?: boolean`, `beforeRun?(context: RunLifecycleContext): Promise<void>`, `finalize?(result: RunResult, context: RunLifecycleContext): Promise<RunResult>` and optional second parameter `context?: RunLifecycleContext` on `next?`.
- Produces, in `apps/host/src/runs/lifecycle/run-controller.ts` (re-exported by `lifecycle/index.ts` and `runs/index.ts`):
  - `RunControllerOptions`: `{ readonly store: RunStore; readonly runtime: AgentRuntime; readonly providers: ProviderResolver; readonly contributions?: readonly RunContribution[]; readonly budget?: RunBudgetLimits; readonly hasTools?: boolean }`
  - `RunController`: `start(plan: RunPlan, options?: RunStartOptions): Promise<RunSnapshot>`, `get(requestId: string): RunSnapshot`, `decide(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): ApprovalView`, `events(requestId: string, after: number): readonly RequestEvent[]`, `active(owner: RunOwner): string | undefined`, `stop(requestId: string): RunSnapshot`, `subscribe(listener: (event: RequestEvent) => void): () => void`, `close(): Promise<void>`.
- Produces, in `apps/host/src/tools/executors/source-tools.ts` (re-exported by `tools/index.ts`):
  - Extend `SourceToolOptions` with optional `readonly sourceKinds?: readonly SourceKind[]` (defaults to `['workspace-files', 'attachments', 'research']`).
  - `createSourceToolsContribution(options: SourceToolsContributionOptions): RunContribution` returning `{}` when `context.grants.sourceKinds.length === 0` or `context.owner.kind !== 'chat'`, and otherwise `{ tools: ToolSet }` filtered by `context.grants.sourceKinds` and `context.grants.publicResearch`.
  - `mapSourceToolFailure(error: unknown): { readonly status: number; readonly code: string; readonly detail?: Readonly<Record<string, string | boolean>> } | undefined` (`SOURCE_ARGUMENTS_INVALID: 400`, `TOOL_NOT_ALLOWED: 403`, `SESSION_NOT_FOUND: 404`, `ATTACHMENT_NOT_FOUND: 404`, fallback `500`).

**STOP when:** `git grep "sessionId:" apps/host/src/runs` prints a line, or any oxlint boundary rule rejects the new files.

**Forbidden:** import any module, Express, HTTP, SQLite, tool or concrete runtime inside `apps/host/src/runs/`. Change `apps/host/src/server.ts` or `packages/host/api/`.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 51 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write the failing tests in `apps/host/tests/run-lifecycle.test.mjs`**

Create `apps/host/tests/run-lifecycle.test.mjs` with an in-memory `RunStore` and fake `AgentRuntime` covering:

1. One active run per `RunOwner`: second `start` for the same owner throws `RunFailure('RUN_OWNER_BUSY')`, while a second owner runs in parallel. Closed controller throws `RunFailure('HOST_CLOSED')`. Pre-assigned `plan.requestId` belonging to another owner throws `RunFailure('GENERATION_LINK_CONFLICT')`.
2. Unavailable runtime rejects `start` with `RunFailure(code, detail)` before calling `store.admit`.
3. `Stop` saves `stopped`, refuses late `sink.emit` writes, and fires `closingText('stopped')`.
4. `createRunBudget` with `{ modelCalls: 1 }` aborts the run signal when `sink.usage({ modelCalls: 2 })` runs.
5. Multi-pass `RunPlan.next(result, ctx)` runs pass 2 inside the same `requestId`, calls `finalize(result, ctx)` once, and invokes `commit()` only after saved `completed`.
6. Tool execution serializes calls, emits `activity` (`running` then `completed`/`failed`), routes `approve` and `decide` with `onApprovalWait(true)` and `onApprovalWait(false)`, and turns a `SESSION_STORAGE` throw into `failed` with `REQUEST_NOT_SAVED`.
7. `createSourceToolsContribution` returns no tools for `sourceKinds: []`, only `read_attachment` for `['attachments']`, only `list_sources`, `read_source`, `read_external` for `['workspace-files']`, and `read_research` / `research_public` for `['research']` based on saved research sources and `grants.publicResearch`.

Add `apps/host/tests/run-lifecycle.test.mjs` to `test:model-requests` in `package.json`.

- [x] **Step 3: Run the new test and check that it fails**

Run: `node --test apps/host/tests/run-lifecycle.test.mjs`

Expected: FAIL. Module import fails because `apps/host/src/runs/lifecycle/` does not exist yet.

- [x] **Step 4: Implement `runs/ports.ts`, `runs/lifecycle/`, OpenCode availability detail and `tools/executors/source-tools.ts`**

1. Update `apps/host/src/runs/ports.ts` and `apps/host/src/runs/index.ts` with the interfaces above.
2. Create `apps/host/src/runs/lifecycle/run-controller.ts` and `apps/host/src/runs/lifecycle/index.ts`:
   - Key `admitting` and `busy` by `runOwnerKey(owner)`. Map `store.admit` error code `REQUEST_ACTIVE` or `RUN_OWNER_BUSY` to `RunFailure('RUN_OWNER_BUSY')`. Keep `releaseWait = 5000` ms and max 16 busy owners (`HOST_BUSY`).
   - Check `activeRuntime.availability()` and freeze `provider = await providers.resolve(plan.selection)` before `store.admit`.
   - After `store.admit`, invoke `options?.onAdmitted?.()` (on throw: `store.finish(requestId, 'failed', 'GENERATION_LINK_FAILED')` and throw `RunFailure('GENERATION_LINK_FAILED')`).
   - In the background run loop, execute `beforeRun`, `prepareRunInput` (wrapping `input.tools` in the serialized activity-emitting `toolCapability`), `createRunBudget` wired to `execution.abort.abort()`, `activeRuntime.run(input, sink)`, multi-pass `next`, `finalize`, `closingText` and `store.finish`.
3. Update `apps/host/src/runtimes/opencode/agent-runtime.ts` to return `{ available: false, code: 'RUNTIME_VERSION_UNSUPPORTED', detail: { version: this.options.version ?? pinnedVersion } }` from `availability()`. Update `apps/host/src/runtimes/opencode/stream-tracker.ts` to import `summarizedNotice` from `../../runs/ports.ts` instead of `@deckagent/session-persistence`.
4. Update `apps/host/src/tools/executors/source-tools.ts` and `apps/host/src/tools/index.ts` to filter `buildSourceSchemas` by `sourceKinds`, export `createSourceToolsContribution` (returning `ToolSet` using `ToolContext` from `../../runs/ports.ts` and checking `context.owner.kind === 'chat' && context.owner.id === sessionId`), and export `mapSourceToolFailure`.

- [x] **Step 5: Check that `runs/` has no `sessionId` and run `run-lifecycle.test.mjs`**

Run: `git grep --untracked -n "sessionId:" -- apps/host/src/runs`

Expected: PASS. No line.

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. Exit code 0.

Run: `node --test apps/host/tests/run-lifecycle.test.mjs`

Expected: PASS. Output contains `# fail 0`.

- [x] **Step 6: Format, build and check**

Do the step `Format, build and check` of the Task protocol. Run `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`.

Expected: PASS. Output contains `# fail 0`.

- [x] **Step 7: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 8: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: `apps/host/src/server.ts` still wires `RequestController` and `OpenCodeRuntime` until the cutover task switches it to `RunController` and `OpenCodeAgentRuntime`.
- `CHANGELOG.md` line: ``- Implement owner-based `RunController` in `apps/host/src/runs/lifecycle/` and add `sourceKinds` filtering and `createSourceToolsContribution` to `apps/host/src/tools/`. Task 52 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: implement RunController in apps/host/src/runs/lifecycle and sourceKinds in tools`
