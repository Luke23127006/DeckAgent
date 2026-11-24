# Task 12: Narrow the OpenCode runtime boundary

Read this file to learn the steps that narrow the opencode runtime boundary.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `apps/web/src/integrations/opencode/runtime.ts (lines 1-508)`.
- `apps/web/src/features/providers/provider-settings.ts (ProviderRunSettings and runSettings)`.
- `packages/session/persistence/src/contracts.ts (RuntimeBinding)`.
- `packages/session/persistence/src/requests.ts (list, get, binding, bind, unbind)`.
- `apps/web/src/features/deck/deck-workflow.ts (lines 89-194)`.
- `tests/opencode-adapter.test.mjs`.
- `tests/model-requests.test.mjs`.
- `.agents/skills/codebase-design/SKILL.md`.
- `.agents/skills/tdd/SKILL.md`.

**Files:**

- Create: apps/web/src/integrations/opencode/contracts.ts.
- Create: apps/web/src/features/requests/prepare-runtime.ts and index.ts.
- Change: apps/web/src/integrations/opencode/{runtime,index}.ts.
- Change: apps/web/src/index.ts and local-transport.ts.
- Test: tests/model-requests.test.mjs and tests/opencode-adapter.test.mjs, for constructor and import changes only.

**Interfaces:**

- Produces: RuntimeSessionAccess with read(sessionId): Promise<readonly Message[]>, requests(sessionId): readonly RequestRecord[], request(requestId): RequestRecord | undefined, binding(sessionId): RuntimeBinding | undefined, bind(binding: RuntimeBinding): void, and unbind(sessionId): void.
- Produces: OpenCodeExecutor.execute(request: AgentRequest, settings: ProviderRunSettings, run: RequestRun): Promise<RuntimeOutcome>.
- Produces: OpenCodeExecutor.ensureAvailable(): Promise<void>. Keep version and executable checks inside this operation.
- Produces: RuntimePreparationDependencies with exactly the sessions, providers, and runtime dependencies listed below.
- OpenCodeRuntime implements OpenCodeExecutor. Preserve initialize() and availability().
- Its constructor accepts executable: string | undefined, runtimeRoot: string, sessions: RuntimeSessionAccess, and options: OpenCodeOptions = {}.
- Produces: RequestPreparationFailure with readonly code and optional safe detail. It contains no HTTP status.
- Produces: createRequestRuntime(dependencies: RuntimePreparationDependencies): RequestRuntime.
- Its prepare(request: AgentRequest): Promise<PreparedRequest> performs application admission preparation.
- createRequestRuntime dependencies: sessions: SqliteSessionStore, providers: Pick<ProviderStore, 'providerSettings' | 'selectable' | 'runSettings'>, runtime: OpenCodeExecutor.
- Keeps: RuntimeOutcome as evidence. Request Lifecycle remains the terminal-status authority.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A runtime binding change replays tools or resumes another chat.
- RuntimeSessionAccess exposes a database, draft mutation, approval mutation, or publication operation.
- A provider snapshot changes after request admission.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Extract preparation policy**

Move chat existence, readable-history, selectable-model, and provider-snapshot checks into `features/requests/prepare-runtime.ts`.
Retain all current failure codes.
Capture ProviderRunSettings before returning PreparedRequest.
The closure for `start` passes that captured snapshot to the executor.
Call ensureAvailable() before returning PreparedRequest.
Keep runtime availability failures separate from model-selection failures.
Export ProviderRunSettings through the providers feature entry.
Import that public contract, not its private implementation file.
In startup, pass the prepared RequestRuntime to DeckWorkflow and GenerationWorkflow.
Changing or removing provider settings cannot change an admitted snapshot.
Extend mapApplicationFailure in local-transport.ts for RequestPreparationFailure.
Keep SESSION_NOT_FOUND at 404 and SESSION_UNAVAILABLE at 500.
Keep CHAT_UNREADABLE and NO_SELECTABLE_MODEL at 409.
Keep runtime availability errors at 503.
The integration reports runtime failures with codes and safe detail only.

- [ ] **Step 2: Narrow persistence access**

Declare RuntimeSessionAccess in the integration contract.
Wire its operations through public Session operations in startup.
The runtime receives this contract instead of SqliteSessionStore.
Keep native-session binding as Session-owned durable data.
Do not put native session IDs in wire DTOs.

- [ ] **Step 3: Preserve runtime recovery**

Keep the current resume guards: chat, provider, model, context, and last completed request.
Keep the existing retry only when the failed resume reports no work.
Do not broaden that retry to failed mutations.
Return the binding commit callback as runtime evidence.
Request Lifecycle invokes that callback after a saved completed request.

Keep version checking, isolated folders, process cancellation, event parsing, and output limits in the integration.
Translate integration failures without HTTP status numbers.

- [ ] **Step 4: Check runtime isolation**

Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 test:model-requests`.
Run `corepack pnpm@11.28.5 test:source-permissions`.
Run `corepack pnpm@11.28.5 test:opencode-resources`.
Expected: build exits with code 0. Suites print `# fail 0`.
Use the fake CLI fixtures. Do not make paid provider calls.
Check source imports no longer name SqliteSessionStore or HttpError inside the OpenCode integration.

- [ ] **Final step: Report and stop**

Send this report in the conversation:

- Files changed, including moves.
- Commands run, exit codes, and the last 20 output lines.
- Test and skip counts.
- Items that a decision table sends to the report.
- Existing failures and unresolved decisions.
- What the commands do not prove.

Mark steps complete only after their Expected results occur.
Do not start another task until the task owner accepts this report.

## References

1. <a id="ref-1"></a>[Project Structure](../../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Coding Guidelines](../../../../conventions/code.md)
3. <a id="ref-3"></a>[Testware](../../../../conventions/testware.md)
