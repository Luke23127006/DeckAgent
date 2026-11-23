# Task 12: Move tests to the owners of their behavior

Read this file to learn the steps that move tests to the owners of their behavior.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `package.json`.
- `tests/fixtures/b02-helpers.mjs`.
- `tests/fixtures/brief.mjs`.
- `tests/fixtures/attachment-fixtures.mjs`.
- `tests/attachment-storage.test.mjs`.
- `tests/browser-runtime.test.mjs`.
- `tests/opencode-adapter.test.mjs`.
- `.github/workflows/workspace.yml`.
- `.agents/skills/tdd/SKILL.md`.

**Files:**

- Move: each test file in the Placement table.
- Move: tests/fixtures/{b02-helpers,fake-opencode}.mjs to apps/web/tests/fixtures/, with unchanged basenames.
- Move: tests/fixtures/brief.mjs and deck-v1.sql to packages/presentation/deck/tests/fixtures/.
- Move: tests/fixtures/attachment-fixtures.mjs and attachments/ to packages/tools/filesystem/tests/fixtures/.
- Create: apps/web/tests/fixtures/browser-driver.mjs.
- Change: package.json, apps/web/package.json, pnpm-lock.yaml.
- Change: moved tests and fixtures, for imports, data paths, and run instructions only.
- Change: apps/web/src/index.ts and browser/index.ts, only to remove exports with no remaining production consumer.
- Change: scripts/build-workspace.mjs, only to remove the unused Browser index bundle.

**Interfaces:**

- Preserves: existing root test:* script names, test bodies, expected values, test counts, and declared skip conditions.
- Produces: a Browser test driver exporting HostClient, ManagementClient, DeckClient, BriefClient, OutlineClient, and ConfirmationClient from their application-owned transport modules.
- Produces: the application package root export for startLocalWeb. The CLI uses that same public entry.
- Within an owner, tests can import that owner's compiled modules. Between package owners, tests use package exports.
- Mixed files in e2e retain their cases together. This task does not relabel those cases as isolated unit tests.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A test changes its assertions or skip condition.
- A fixture relocation changes which bytes a test reads.
- A public production export is necessary only to preserve a private test import.
- A test file has no Placement row.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Move the existing tests**

Apply every row. A row with the same source and destination requires no move.

| Source | Destination |
| --- | --- |
| `tests/artifact-publication.test.mjs` | `packages/presentation/deck/tests/artifact-publication.test.mjs` |
| `tests/artifact-rendering.test.mjs` | `e2e/artifact-rendering.test.mjs` |
| `tests/attachment-admission.test.mjs` | `e2e/attachment-admission.test.mjs` |
| `tests/attachment-parser.test.mjs` | `packages/tools/filesystem/tests/attachment-parser.test.mjs` |
| `tests/attachment-storage.test.mjs` | `e2e/attachment-storage.test.mjs` |
| `tests/bound-outline.test.mjs` | `packages/presentation/deck/tests/bound-outline.test.mjs` |
| `tests/brief-client.test.mjs` | `apps/web/tests/brief-client.test.mjs` |
| `tests/brief-host.test.mjs` | `apps/web/tests/brief-host.test.mjs` |
| `tests/browser-runtime.test.mjs` | `apps/web/tests/browser-runtime.test.mjs` |
| `tests/browser-smoke.test.mjs` | `e2e/browser-smoke.test.mjs` |
| `tests/chat-persistence.test.mjs` | `packages/session/persistence/tests/chat-persistence.test.mjs` |
| `tests/check-docs.test.mjs` | `tests/check-docs.test.mjs` |
| `tests/commons-images.test.mjs` | `apps/web/tests/commons-images.test.mjs` |
| `tests/confirmation-host.test.mjs` | `e2e/confirmation-host.test.mjs` |
| `tests/deck-brief.test.mjs` | `packages/presentation/deck/tests/deck-brief.test.mjs` |
| `tests/deck-client.test.mjs` | `apps/web/tests/deck-client.test.mjs` |
| `tests/deck-model.test.mjs` | `apps/web/tests/deck-model.test.mjs` |
| `tests/deck-pipeline.test.mjs` | `e2e/deck-pipeline.test.mjs` |
| `tests/deck-service.test.mjs` | `packages/presentation/deck/tests/deck-service.test.mjs` |
| `tests/design-catalog.test.mjs` | `packages/presentation/design/tests/design-catalog.test.mjs` |
| `tests/env-startup.test.mjs` | `e2e/env-startup.test.mjs` |
| `tests/generation-bridge.test.mjs` | `e2e/generation-bridge.test.mjs` |
| `tests/generation-confirmation.test.mjs` | `packages/presentation/deck/tests/generation-confirmation.test.mjs` |
| `tests/generation-continuation-http.test.mjs` | `e2e/generation-continuation-http.test.mjs` |
| `tests/generation-continuation.test.mjs` | `packages/presentation/deck/tests/generation-continuation.test.mjs` |
| `tests/host-api.test.mjs` | `packages/host/api/tests/host-api.test.mjs` |
| `tests/html-template-v3.test.mjs` | `packages/presentation/html/tests/html-template-v3.test.mjs` |
| `tests/html-template.test.mjs` | `packages/presentation/html/tests/html-template.test.mjs` |
| `tests/image-recovery-http.test.mjs` | `e2e/image-recovery-http.test.mjs` |
| `tests/image-research.test.mjs` | `apps/web/tests/image-research.test.mjs` |
| `tests/interview-policy.test.mjs` | `packages/presentation/deck/tests/interview-policy.test.mjs` |
| `tests/interview-workflow.test.mjs` | `e2e/interview-workflow.test.mjs` |
| `tests/layout-quality.test.mjs` | `packages/presentation/html/tests/layout-quality.test.mjs` |
| `tests/layout-review-browser.test.mjs` | `e2e/layout-review-browser.test.mjs` |
| `tests/layout-review-http.test.mjs` | `e2e/layout-review-http.test.mjs` |
| `tests/layout-review.test.mjs` | `apps/web/tests/layout-review.test.mjs` |
| `tests/local-foundation.test.mjs` | `e2e/local-foundation.test.mjs` |
| `tests/local-web.test.mjs` | `e2e/local-web.test.mjs` |
| `tests/mcp-bridge.test.mjs` | `apps/web/tests/mcp-bridge.test.mjs` |
| `tests/model-requests.test.mjs` | `e2e/model-requests.test.mjs` |
| `tests/opencode-adapter.test.mjs` | `apps/web/tests/opencode-adapter.test.mjs` |
| `tests/opencode-brief-live.test.mjs` | `e2e/opencode-brief-live.test.mjs` |
| `tests/opencode-generation-live.test.mjs` | `e2e/opencode-generation-live.test.mjs` |
| `tests/opencode-live.test.mjs` | `e2e/opencode-live.test.mjs` |
| `tests/opencode-resources.test.mjs` | `apps/web/tests/opencode-resources.test.mjs` |
| `tests/opencode-source-live.test.mjs` | `e2e/opencode-source-live.test.mjs` |
| `tests/outline-client.test.mjs` | `apps/web/tests/outline-client.test.mjs` |
| `tests/outline-state.test.mjs` | `packages/presentation/deck/tests/outline-state.test.mjs` |
| `tests/portable-generation-http.test.mjs` | `e2e/portable-generation-http.test.mjs` |
| `tests/portable-generation.test.mjs` | `e2e/portable-generation.test.mjs` |
| `tests/post-edit-hook.test.mjs` | `tests/post-edit-hook.test.mjs` |
| `tests/request-lifecycle.test.mjs` | `e2e/request-lifecycle.test.mjs` |
| `tests/research-image-generation.test.mjs` | `apps/web/tests/research-image-generation.test.mjs` |
| `tests/research-live.test.mjs` | `e2e/research-live.test.mjs` |
| `tests/research.test.mjs` | `apps/web/tests/research.test.mjs` |
| `tests/session-persistence.test.mjs` | `packages/session/persistence/tests/session-persistence.test.mjs` |
| `tests/slide-document.test.mjs` | `packages/presentation/document/tests/slide-document.test.mjs` |
| `tests/source-access.test.mjs` | `packages/tools/filesystem/tests/source-access.test.mjs` |
| `tests/source-requests.test.mjs` | `e2e/source-requests.test.mjs` |
| `tests/step-approval.test.mjs` | `e2e/step-approval.test.mjs` |
| `tests/web-management.test.mjs` | `apps/web/tests/web-management.test.mjs` |
| `tests/web-session.test.mjs` | `apps/web/tests/web-session.test.mjs` |
| `tests/workspace-registry.test.mjs` | `packages/workspace/registry/tests/workspace-registry.test.mjs` |

Keep `packages/host/api/tests/request-failure.test.mjs` in place.
Mixed storage/application tests remain in e2e for this revision.
Do not split those files while moving them.

- [ ] **Step 2: Rebind fixtures and imports**

Move the fixture sets listed in Files.
Fix each fixture path relative to its new module URL.
Keep supplied fixture bytes unchanged.
Owner-local tests import owner-local compiled modules.
Cross-package imports use the public package name.

Use the Browser test driver from e2e.
The driver lives with Browser's application owner.
It imports `lib/browser-types/transport/` modules.
Do not add production exports to serve this driver.

Remove application re-exports used only by tests.
Application-owned integration tests import their own compiled implementation.
Remove the unused Browser root index only after all its consumers move.
Preserve `startLocalWeb` and the CLI public entry.

- [ ] **Step 3: Preserve verification commands**

Change root test scripts to the exact destinations in the table.
Keep each suite's previous file membership.
Add suite membership for the three developer-tool tests in the final verification command.
Keep the boundary fixture tests in the root tooling test directory.
Add `packages/host/api/tests/request-failure.test.mjs` to `test:model-requests`.
Keep root developer-tool tests under `tests/`.
Include `e2e/` in the root lint command.
Do not enable live suites in ordinary CI.

- [ ] **Step 4: Check test discovery**

Run `corepack pnpm@11.28.5 build`.
Run every non-live test script from the baseline report, one script at a time.
Run `corepack pnpm@11.28.5 test:tools-browser`.
Run `corepack pnpm@11.28.5 test:browser-smoke`.
Expected: build exits with code 0. Each suite prints `# fail 0`.
Compare test and skip counts with the baseline.
The new request-failure test adds one case to its owning suite.
Any other count difference is a STOP condition.

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
