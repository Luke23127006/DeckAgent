# Task 7: Enable role-file-symbol for chats and check Phase 2

Read this file to learn the steps of Task 7, which enables `role-file-symbol` for `chats` and runs the Phase 2 exit checks.

**Type:** Code (phase-exit task)

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `scripts/check-boundaries.mjs` (`ROLE_FILE_MODULES`)
- `tests/check-boundaries.test.mjs` (the test `checkBoundaries rejects role files without their role symbols in a listed module`)
- `package.json` (`scripts`)
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Change: `scripts/check-boundaries.mjs` (`ROLE_FILE_MODULES`)
- Test: `tests/check-boundaries.test.mjs`
- Fix (only if Step 5 finds a defect from Phase 2): files in `apps/host/` or `packages/host/contracts/`

**Interfaces:**
- Produces: `const ROLE_FILE_MODULES = ['chats']` in `scripts/check-boundaries.mjs`.

**STOP when:** A defect in Step 5 needs a design decision, requires an HTTP contract change, or stays failing after two fix attempts.

**Forbidden:** Do not change `apps/web/`, `packages/presentation/` or HTTP black-box test expectations.

- [x] **Step 1: Write the failing test**

In `tests/check-boundaries.test.mjs`, in the test `checkBoundaries rejects role files without their role symbols in a listed module`, add this assertion after the existing `assert.deepEqual(findings(files, {}, ['chats']), [...])` call:

```js
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/modules/chats/chat-text.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chat-text.ts', line: 2, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.routes.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.store.ts', line: 1, rule: 'role-file-symbol' },
  ])
```

- [x] **Step 2: Run the test and make sure that it fails**

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs`
Expected: FAIL. The test `checkBoundaries rejects role files without their role symbols in a listed module` fails because `ROLE_FILE_MODULES` is empty.

- [x] **Step 3: Add `chats` to `ROLE_FILE_MODULES` and run boundary checks**

In `scripts/check-boundaries.mjs`, change `const ROLE_FILE_MODULES = []` to `const ROLE_FILE_MODULES = ['chats']`.

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [x] **Step 4: Check that no old chat symbol stays in production code or host fixtures**

Run: `git grep -n -E "createChatOperations|ChatOperations|createWorkspaceChats|createChatRequestOperations|ChatRequestOperations|readChatSelection|createRequestRoutes|ChatWorkflowError|mapChatFailure|toStoredRequest|projectRequest|isValidMessage|SqliteSessionStore" -- apps/host/src/modules/chats apps/host/src/server.ts apps/host/src/modules/deck/confirmation-coordinator.ts apps/host/tests/fixtures`
Expected: exit code 1 and no line.

- [x] **Step 5: Run the Phase 2 exit checks and fix defects**

Run: `corepack pnpm@11.28.5 format:check && corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

Run all 19 non-live `test:*` scripts in `package.json`:

```bash
for s in test:local-foundation test:model-requests test:source-permissions test:attachments test:research test:images test:outline-workflow test:brief-foundation test:deck-review test:generation-publication test:slide-pipeline test:session-persistence test:tools-browser test:opencode-resources test:browser-smoke test:env-startup test:http-edge test:local-web test:layouts; do
  echo "=== $s ==="
  corepack pnpm@11.28.5 "$s" || exit 1
done
```

If any suite fails because of a Phase 2 defect, fix the defect in `apps/host/` or `packages/host/contracts/`, rebuild, and run the checks and all 19 suites again. Record every defect and fix in the report.

Expected: exit code 0, and `# fail 0` for each of the 19 suites. Record the table `Script | Exit code | Tests passed` in the report.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
