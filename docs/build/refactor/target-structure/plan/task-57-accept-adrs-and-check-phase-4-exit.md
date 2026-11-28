# Task 57: Mark ADR-001 to ADR-004 Accepted and check the Phase 4 exit condition

Read this file to learn the steps of Task 57, which marks ADR-001 to ADR-004 `Accepted` and checks the Phase 4 exit criteria.

**Type:** Code

After this task, ADR-001 to ADR-004 carry status `Accepted`, and `docs/architecture/10-agent-core.md` matches the live Phase 4 paths and contracts. `docs/conventions/project-structure.md` removes the completed Phase 3 and Phase 4 transition rows, and the exit checks prove TS-04, TS-05, TS-09 and TS-13.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `docs/conventions/docs.md`
- `docs/conventions/architecture.md`
- `.agents/skills/ste-vi/SKILL.md`
- `docs/architecture/30-decisions.md`, `docs/architecture/10-agent-core.md`, `docs/conventions/project-structure.md`
- `docs/build/refactor/target-structure/README.md` (the Phase 4 `Done when` cell)
- `docs/build/refactor/target-structure/criteria.md` (TS-04, TS-05, TS-09, TS-13)

**Files:**

- Change: `docs/architecture/30-decisions.md`, `docs/architecture/10-agent-core.md`, `docs/conventions/project-structure.md`

**Interfaces:**

- None. This task changes documentation only and verifies the Phase 4 exit condition.

**STOP when:** Any Phase 4 exit grep finds a removed folder, a `sessionId:` field inside `apps/host/src/runs/`, or a remaining `Proposed` status on ADR-001 to ADR-004.

**Forbidden:** change any production code, test file, `package.json` or `.oxlintrc.json`. Change `docs/build/refactor/target-structure/README.md` or sibling research files.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 56 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Update `docs/architecture/30-decisions.md`**

1. Change `**Status:** Proposed` to `**Status:** Accepted` on ADR-001, ADR-002, ADR-003 and ADR-004.
2. In ADR-001: record that `SqliteRunStore` lives in `apps/host/src/db/run-store.ts` on `sessions.sqlite` (schema v9 with `(owner_kind, owner_id)` unique index and `owner_key` bindings). Also record that atomic admission across `requests`, `messages` and `attachments` runs inside one `SessionDatabase` transaction via `RunStoreHooks` wired in `apps/host/src/server.ts`.
3. In ADR-003: record that `apps/host/tests/deck-run-plan.test.mjs` checked all 16 combinations of `sourceKinds` equivalence and that `isSourceToolAllowed`, `sourceToolNames` and `executeRecoveryRun` no longer exist.
4. In ADR-004: record that Host-scoped topics stream on `GET /api/changes` and chat-scoped topics (`draft`, `brief`, `outline`, `deck`) stream on `GET /api/sessions/:sessionId/changes`.

- [x] **Step 3: Update `docs/architecture/10-agent-core.md`**

1. Update the opening status paragraph from `Proposed` to `Accepted` and state that Phase 4 implemented all four contracts.
2. Update every "Code hiện tại" table cell and code reference to the live Phase 4 paths (`apps/host/src/runs/lifecycle/run-controller.ts`, `apps/host/src/runs/preparation/index.ts`, `apps/host/src/runs/budget/index.ts`, `apps/host/src/runs/ports.ts`, `apps/host/src/runtimes/opencode/`, `apps/host/src/tools/executors/source-tools.ts`, `apps/host/src/db/run-store.ts`, `apps/host/src/modules/chats/`, `apps/host/src/modules/deck/`, `apps/host/src/http/change-feed.ts`).
3. Update `Rủi ro và điểm còn mở`: remove the resolved items (`RunStore` location, atomic admission, SSE routes, `sourceKinds` equivalence). Keep only items that remain open: live OpenCode 1.19.5 `tokens` output check, future skill format, and open product questions (`OQ-061`, `OQ-062`, `OQ-063`, `OQ-069`).

- [x] **Step 4: Update `docs/conventions/project-structure.md`**

1. In `## Trong lúc chuyển`: remove the completed rows for `packages/host/api/`, `apps/host/src/local-transport.ts`, `apps/host/src/features/<name>/` and `packages/session/persistence/`. Keep only the Phase 5 rows (`packages/host/contracts/`, `apps/web/src/browser/transport/`, `apps/web/src/browser/**`). Remove the three legacy-layout bullets about `packages/host/api/` and `contract-sync.ts` (note that `apps/host/src/contract-sync.ts` now owns compile-time sync checks).
2. In `## Enforcement`: update the rules for `db/` (`apps/host/src/db/` and `*.store.ts` boundary), `http/route-helpers.ts`, `runs/` (`oxlint` + `lifecycle-transport-import` on `apps/host/src/runs`), `runtimes/` and `tools/executors/`.
3. Update the `apps/host/` `src/db/` row in `## Cấu trúc đích` to state that `src/db/` owns database connections, migrations and `SqliteRunStore` (the SQL implementation of `RunStore`).

- [x] **Step 5: Check Phase 4 exit criteria**

Run: `git grep -n "Status:\*\* Proposed" -- docs/architecture/30-decisions.md`

Expected: PASS. No line.

Run: `git grep -n "sessionId:" -- apps/host/src/runs`

Expected: PASS. No line.

Run: `git ls-files packages/host/api packages/tools packages/session apps/host/src/features apps/host/src/integrations apps/host/src/local-transport.ts`

Expected: PASS. No line.

Run: `corepack pnpm@11.28.5 build; corepack pnpm@11.28.5 lint; corepack pnpm@11.28.5 check:boundaries; corepack pnpm@11.28.5 check:docs`

Expected: PASS. Each command exits with code 0, `0 violation(s)` and `0 error(s)`.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. Output contains `# fail 0`.

- [x] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Phase 4 exit criteria` with the columns `Criterion | Evidence | Status` covering TS-04, TS-05, TS-09, TS-13, ADR-001 to ADR-004 `Accepted`, and removal of `packages/host/api/`, `packages/tools/`, `packages/session/`, `apps/host/src/features/`, `apps/host/src/integrations/` and `apps/host/src/local-transport.ts`.

- What the commands do not prove: live provider suites (`test:opencode-live`, `test:research-live`) and real OpenCode 1.19.5 `tokens` output did not run. Phase 5 Browser React work has not started.
- `CHANGELOG.md` line: ``- Mark ADR-001 to ADR-004 Accepted, update architecture and Project Structure docs, and verify the Phase 4 exit condition. Task 57 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `docs: mark ADR-001 to ADR-004 Accepted and record Phase 4 exit check`
