# Task 47: Record the helmet decision and check the Phase 3 exit condition

Read this file to learn the steps of Task 47, which closes the `helmet` evaluation and checks every Phase 3 exit condition.

**Type:** Code

After this task, `AGENTS.md` records that Local Host keeps `setSecurityHeaders` in `apps/host/src/http/app.ts` and does not install `helmet`. `helmet` does not set `cache-control: no-store` and adds ten headers outside the tested HTTP contract. It also enables `upgrade-insecure-requests` by default, which breaks loopback HTTP. Every Phase 3 exit check passes. The report records that `packages/host/api/` keeps `lifecycle/`, `request-routes.ts`, `session-routes.ts` history and HTTP helpers until Phase 4 moves `lifecycle/` into `apps/host/src/runs/`.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/ste-vi/SKILL.md`
- `AGENTS.md` (the section `## Tech Stack`)
- `apps/host/src/http/app.ts` and `e2e/http-edge.test.mjs`

**Files:**

- Change: `AGENTS.md`

**Interfaces:**

- No code interface changes.

**STOP when:** any exit check fails or finds an unexpected file in `apps/host/src/features/`, `apps/host/src/integrations/` or `packages/host/api/src/transport/`.

**Forbidden:** install `helmet`. Change any production code or test file.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 46 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Record the helmet decision in AGENTS.md**

In `AGENTS.md` under `## Tech Stack`, replace the `helmet` bullet line:

- Old: ``- Thư viện đích đã chọn, chưa cài: `helmet` cho Local Host, React với Vite cho Browser, TanStack Query cho server state ở Browser. Phase cài thư viện nào thì chốt version của thư viện đó. Drizzle chưa được chọn.``
- New:
  - ``- Security headers của Local Host dùng `setSecurityHeaders` trong `apps/host/src/http/app.ts`. Không dùng `helmet`.``
  - ``- Thư viện đích đã chọn, chưa cài: React với Vite cho Browser, TanStack Query cho server state ở Browser. Phase cài thư viện nào thì chốt version của thư viện đó. Drizzle chưa được chọn.``

- [x] **Step 3: Check the Phase 3 exit conditions**

Run each command below and record its result in the report table `Phase 3 exit checks` (`Check | Command | Result`).

1. Check all six domain modules in `apps/host/src/modules/`:
   Run: `git ls-files apps/host/src/modules`
   Expected: PASS. Six module folders exist: `attachments`, `chats`, `deck`, `providers`, `research` and `workspaces`. Each module has `*.routes.ts`, `*.service.ts`, `*.errors.ts` and `index.ts`.
2. Check remaining old folders in `apps/host/src/features/` and `apps/host/src/integrations/`:
   Run: `git ls-files apps/host/src/features apps/host/src/integrations`
   Expected: PASS. Every line starts with `apps/host/src/features/requests/`, `apps/host/src/features/sources/` or `apps/host/src/integrations/opencode/`.
3. Check removal of `WebManagement`, `BriefManagement`, `deck-routes.ts` and `management-routes.ts`:
   Run: `git grep -n -E "WebManagement|BriefManagement|deck-routes|management-routes" -- apps packages`
   Expected: PASS. No line.
4. Check remaining files in `packages/host/api/src/`:
   Run: `git ls-files packages/host/api/src`
   Expected: PASS. Only `contract-sync.ts`, `index.ts`, `lifecycle/*`, `transport/contracts.ts`, `transport/http-error.ts`, `transport/http-io.ts`, `transport/multipart.ts`, `transport/request-routes.ts`, `transport/route-params.ts`, `transport/session-routes.ts` and `transport/sse.ts`.
5. Check all eight change topics wired in `apps/host/src/server.ts`:
   Run: `git grep -n "topic:" -- apps/host/src/server.ts`
   Expected: PASS. Contains all eight topics: `workspaces`, `chats`, `providers`, `preferences`, `draft`, `brief`, `outline` and `deck`.
6. Check zero hardcoded `notify(..., 1)` calls in `@deckagent/deck`:
   Run: `git grep -n "notify(.*, 1)" -- packages/presentation/deck/src`
   Expected: PASS. No line.
7. Run boundary and lint tests:
   Run: `corepack pnpm@11.28.5 build`, `corepack pnpm@11.28.5 lint`, `corepack pnpm@11.28.5 check:boundaries`, `corepack pnpm@11.28.5 check:docs`, `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`.
   Expected: PASS. Exit code 0, `0 violation(s)`, `0 error(s)`, `# fail 0`.

- [x] **Step 4: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Include the table `Phase 3 exit checks` and state explicitly that `packages/host/api/` stays as a Phase 4 shell for `lifecycle/`, `request-routes.ts`, `session-routes.ts` history and shared HTTP helpers until Phase 4 moves `lifecycle/` into `apps/host/src/runs/`.

- What the commands do not prove: `packages/host/api/` is not removed yet because its `lifecycle/` code belongs to Phase 4. `DECK_STALE` has no manual slide-edit HTTP route until canvas editing (UC-007) exists.
- `CHANGELOG.md` line: ``- Close the `helmet` evaluation (keep `setSecurityHeaders` in `apps/host/src/http/app.ts`) and verify all Phase 3 domain-module and change-notice exit checks. Task 47 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `docs: record helmet decision and Phase 3 exit check`
