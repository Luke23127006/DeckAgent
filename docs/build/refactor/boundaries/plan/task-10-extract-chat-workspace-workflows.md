# Task 10: Extract chat and workspace workflows

Read this file to learn the steps that extract chat and workspace workflows.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `apps/web/src/index.ts (workspaceStatus, workspaceCall, chatCall, body, project, chat, and management blocks)`.
- `apps/web/src/web-state.ts`.
- `packages/session/persistence/src/index.ts (create, select, chats, search, ungroup, ungroupExcept)`.
- `packages/workspace/registry/src/registry.ts`.
- `tests/local-foundation.test.mjs`.
- `tests/web-management.test.mjs`.
- `.agents/skills/codebase-design/SKILL.md`.
- `.agents/skills/tdd/SKILL.md`.

**Files:**

- Create: apps/web/src/features/workspaces/{index,contracts}.ts.
- Create: apps/web/src/features/chats/{index,contracts}.ts.
- Create: apps/web/src/local-transport.ts.
- Change: apps/web/src/index.ts and web-state.ts.
- Change: packages/host/api/src/contracts.ts and index.ts, for application-failure mapping only.
- Test: tests/{local-foundation,web-management,web-session,chat-persistence,workspace-registry}.test.mjs, for imports only.

**Interfaces:**

- Produces: createWorkspaceOperations(registry: WorkspaceRegistry, sessions: SqliteSessionStore): WorkspaceOperations.
- WorkspaceOperations: list(): Promise<WorkspaceList>, add(folder: unknown): Promise<WorkspaceList>, select(id: string): Promise<WorkspaceList>, rename(id: string, name: unknown): Promise<WorkspaceList>, relink(id: string, folder: unknown): Promise<WorkspaceList>, remove(id: string): Promise<WorkspaceList>.
- Produces: createChatOperations(sessions: SqliteSessionStore, registry: WorkspaceRegistry, web: WebState, decks: DeckService, drafts: MemoryDraftStore): ChatOperations.
- ChatOperations: create(selection?: ModelSelection): Promise<WebSession>, selectModel(id: string, selection: ModelSelection): Promise<WebSession>, list(): Promise<readonly WebSession[]>, search(words: string): Promise<readonly WebSession[]>.
- Produces: WorkspaceWorkflowError with code 'WORKSPACE_REQUEST_ACTIVE'. It contains no HTTP status.
- Produces: ChatWorkflowError with readonly code and optional safe detail. Preserve current chat failure codes.
- Adds HostOptions.mapApplicationFailure?: (error: unknown) => HttpFailureResponse | undefined.
- HttpFailureResponse contains readonly status: number, readonly code: string, and optional safe detail.
- This callback and response type remain Host-only. They do not belong in host/contracts.
- Produces: mapApplicationFailure(error: unknown): HttpFailureResponse | undefined in local-transport.ts.
- Produces transport adapters: workspaceManagement(operations: WorkspaceOperations): WorkspaceManagement and chatManagement(operations: ChatOperations): Pick<WebManagement, 'sessions' | 'createSession' | 'selectModel' | 'searchSessions'>.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- Workspace removal and chat ungrouping need a new shared database transaction.
- A current-chat choice after workspace removal needs a product decision.
- A feature must import another feature's private source file.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [x] **Step 1: Extract workspace operations**

Move active-request checks and Registry/Session sequencing from startup into `features/workspaces/index.ts`.
Keep Registry mutation and Session mutation in their current order.
Preserve startup `ungroupExcept` reconciliation.
Do not claim cross-database atomicity.
A partial removal still relies on existing reconciliation.

The workflow checks every chat of the workspace before remove or relink.
It refuses an active request without stopping that request.
The Registry still owns folder policy and folder identity.

- [x] **Step 2: Extract chat operations**

Move chat creation, model selection, listing, search, and Browser projection from startup.
Retain the most recent selectable model rule.
Retain unreadable-chat records and ungrouped-chat visibility.
Do not move request execution into this feature.
Access Session and Deck only through their public operations.

- [x] **Step 3: Extract the transport adapters**

Move request-body shape checks and current HTTP error mapping to `local-transport.ts`.
Preserve the original status, code, safe detail, and route result.
The transport adapter calls the typed operation.
Host transport invokes mapApplicationFailure for application-operation failures.
The callback recognizes only the named owner failure classes.
Unknown exceptions retain the existing generic Host error response.
Startup supplies the callback from local-transport.ts.
This callback also covers failures propagated from runtime preparation.
Workflow files cannot import `HttpError`, `IncomingMessage`, or `ServerResponse`.
Entry point creates dependencies and installs the adapters.

Keep the current behavior for unresolved product questions.
Do not mark those questions as resolved.

- [x] **Step 4: Check workflow compatibility**

Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 test:local-foundation`.
Run `corepack pnpm@11.28.5 test:local-web`.
Expected: build exits with code 0. Suites print `# fail 0`.
Review workspace removal, relink refusal, lost-folder access, chat search, and removed-model tests.
The command results do not prove atomicity between separate databases.

- [x] **Final step: Report and stop**

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
