# Task 18: Check the structural refactor

Read this file to learn the steps that check the structural refactor.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `package.json`.
- `scripts/check-boundaries.mjs`.
- `scripts/build-workspace.mjs`.
- `apps/web/src/index.ts`.
- `packages/host/api/src/request-controller.ts`.
- `packages/presentation/deck/src/index.ts`.
- `docs/open-questions.md`.
- `.agents/skills/review-change/SKILL.md`.

**Files:**

- Change: this task file, for completion checkboxes only.
- Read application, package, test, workflow, and convention files without changing them.

**Interfaces:**

- Uses: the migrated root test scripts and check:boundaries.
- Produces: a report in the conversation, with separate structural, behavioral, and unresolved results.
- Produces no new API, feature, schema, or approval decision.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- The baseline has no comparable test count.
- A suite loses a test or gains an unexplained skip.
- A source boundary violation remains.
- A code repair is necessary. Return the finding to its owning implementation task.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Check the new structure**

Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 lint`.
Run `corepack pnpm@11.28.5 check:boundaries`.
Run `corepack pnpm@11.28.5 check:docs`.
Expected: all commands exit with code 0.
Boundary output contains `check-boundaries: 0 violation(s)`.
Document output contains `0 error(s)`.

- [ ] **Step 2: Run the affected regression suites**

Run each command separately:

```bash
corepack pnpm@11.28.5 test:session-persistence
corepack pnpm@11.28.5 test:tools-browser
corepack pnpm@11.28.5 test:env-startup
corepack pnpm@11.28.5 test:local-web
corepack pnpm@11.28.5 test:local-foundation
corepack pnpm@11.28.5 test:model-requests
corepack pnpm@11.28.5 test:opencode-resources
corepack pnpm@11.28.5 test:source-permissions
corepack pnpm@11.28.5 test:attachments
corepack pnpm@11.28.5 test:research
corepack pnpm@11.28.5 test:slide-pipeline
corepack pnpm@11.28.5 test:outline-workflow
corepack pnpm@11.28.5 test:brief-foundation
corepack pnpm@11.28.5 test:deck-review
corepack pnpm@11.28.5 test:generation-publication
corepack pnpm@11.28.5 test:layouts
corepack pnpm@11.28.5 test:images
corepack pnpm@11.28.5 test:browser-smoke
node --test --test-reporter=tap tests/check-docs.test.mjs tests/post-edit-hook.test.mjs tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs
```

Expected: each command exits with code 0 and prints `# fail 0`, except for the recorded baseline failure in `portable-generation-http.test.mjs` (test #60, `REQUEST_TIMEOUT`, which runs in `test:generation-publication` and `test:images`).
Report that pre-existing baseline failure separately without treating it as a refactor regression. Stop on any other failure.
Compare counts with the Wave 0 baseline table in `README.md` and the added tests (`test:layouts` and `test:images` are subsets of `test:deck-review` and `test:generation-publication`).
Use sequential suites to avoid shared-state interference.

- [ ] **Step 3: Review authority and compatibility**

Check that transport maps errors without selecting terminal status.
Check that runtime completion remains evidence for Request Lifecycle.
Check that publication still requires an issued grant and the active request.
Check that Session mutations use owner operations and existing transactions.
Check that Browser switching aborts observation without stopping Host work.
Check that package exports contain no newly exposed private test helper.
Keep stored data formats and template-version pins compatible.

Run the review-change workflow with its specified independent reviewer.
Provide the diff, conventions, actual command output, and fault evidence.
This review may report findings. It cannot edit implementation during review.

- [ ] **Step 4: Report the limits of completion**

Report only completed structural tasks as complete.
Report remaining boot decomposition and constant waits separately.
Report use-case gaps as deferred behavior work.
A local fake-provider run does not prove live-provider behavior.
A skipped browser test does not prove Browser behavior.
Do not claim that all new use cases work after structural refactoring.

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
