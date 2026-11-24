# Task 06: Put the persistence contract in Session

Read this file to learn the steps that put the persistence contract in session.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `packages/host/api/src/contracts.ts (lines 115-166)`.
- `packages/session/persistence/src/contracts.ts (lines 85-178)`.
- `packages/session/persistence/src/requests.ts (lines 107-225)`.
- `packages/session/persistence/src/index.ts (lines 1-90)`.
- `apps/local-web/src/attachment-service.ts (lines 55-260)`.
- `packages/host/api/src/request-controller.ts (lines 1-180)`.
- `.agents/skills/codebase-design/SKILL.md`.

**Files:**

- Create: packages/session/persistence/src/request-store.ts.
- Change: packages/session/persistence/src/index.ts.
- Change: packages/host/api/src/contracts.ts, request-controller.ts, and tool-contracts.ts.
- Change: packages/host/api/package.json and tsconfig.json.
- Change: apps/local-web/src/attachment-service.ts, for the RequestStore import only.
- Change: pnpm-lock.yaml.
- Test: tests/request-lifecycle.test.mjs and tests/attachment-admission.test.mjs, for contract imports only.

**Interfaces:**

- Produces: RequestStore in @deckagent/session-persistence.
- Retains the existing RequestStore method signatures: admit, append, finish, get, events, text, activeFor, and optional approvals.
- Retains admit input draftRevision?: number. AttachmentService still checks draft revisions before durable admission.
- Uses Session-owned RequestRecord, RequestEvent, RequestEventBody, TerminalStatus, and ApprovalView.
- Produces an approval input shape in Session with key, operation: 'read-file', target, and reason. It grants no authority.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- The Session package needs an import from Host API, host/contracts, or application implementation.
- A transaction or the order of draft consumption changes.
- A storage representation needs a schema change.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [x] **Step 1: Move the persistence interface**

Create `request-store.ts` in Session.
Express `RequestStore` with Session-owned record and approval types.
Preserve the full structural contract, including optional approval storage.
Do not move execution maps, runtime invocation, or terminal-status policy into Session.

- [x] **Step 2: Change consumers**

Import `RequestStore` from the public Session package in RequestController and AttachmentService.
Remove the declaration from Host API.
Keep a named Host API type re-export only until its current production consumers move.
Add the direct workspace dependency and TypeScript project reference.
Update the lockfile offline without changing dependency versions.

- [x] **Step 3: Check data ownership**

Keep `RequestLog.admit` atomic across the message, request record, and attachment associations.
Keep `RequestLog.finish` as a durable operation.
Only Request Lifecycle selects the requested terminal status.
No consumer receives the Session database handle.

- [x] **Step 4: Check the boundary**

Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 test:model-requests`.
Run `corepack pnpm@11.28.5 test:attachments`.
Expected: build exits with code 0. Both suites print `# fail 0`.
Run `rg -n "@deckagent/(host-api|host-contracts)" packages/session/persistence/src`.
Expected: exit code 1 with no matches.
For this absence check, exit code 1 is PASS.

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
