# Task 08: Move the local application to apps/web

Read this file to learn the steps that move the local application to apps/web.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `apps/local-web/package.json`.
- `apps/local-web/tsconfig.json`.
- `apps/local-web/src/index.ts (lines 144-524)`.
- `apps/local-web/src/cli.ts`.
- `apps/local-web/src/opencode/resources.ts`.
- `scripts/build-workspace.mjs`.
- `scripts/package-opencode.mjs`.
- `tests/env-startup.test.mjs`.
- `tests/opencode-resources.test.mjs`.

**Files:**

- Move: every tracked file under apps/local-web/ to the same relative path under apps/web/.
- Change: package.json, pnpm-lock.yaml, tsconfig.json, .gitignore, scripts/build-workspace.mjs, scripts/package-opencode.mjs.
- Change: tests/*.test.mjs and tests/fixtures/b02-helpers.mjs, for application paths only.
- Change: apps/web/{PRODUCT,DESIGN}.md, for moved source paths only.
- Change: active non-archived docs with executable apps/local-web paths, for path replacements only. Exclude existing historical plans.

**Exact source moves:**

```text
apps/local-web/src/artifact-renderer.ts -> apps/web/src/artifact-renderer.ts
apps/local-web/src/attachment-service.ts -> apps/web/src/attachment-service.ts
apps/local-web/src/attachment-style.ts -> apps/web/src/attachment-style.ts
apps/local-web/src/brief-service.ts -> apps/web/src/brief-service.ts
apps/local-web/src/built-in-providers.ts -> apps/web/src/built-in-providers.ts
apps/local-web/src/cli.ts -> apps/web/src/cli.ts
apps/local-web/src/commons-images.ts -> apps/web/src/commons-images.ts
apps/local-web/src/confirmation-service.ts -> apps/web/src/confirmation-service.ts
apps/local-web/src/credential-store.ts -> apps/web/src/credential-store.ts
apps/local-web/src/deck-workflow.ts -> apps/web/src/deck-workflow.ts
apps/local-web/src/generation-report.ts -> apps/web/src/generation-report.ts
apps/local-web/src/generation-workflow.ts -> apps/web/src/generation-workflow.ts
apps/local-web/src/image-research.ts -> apps/web/src/image-research.ts
apps/local-web/src/image-source.ts -> apps/web/src/image-source.ts
apps/local-web/src/index.ts -> apps/web/src/index.ts
apps/local-web/src/managed-attachments.ts -> apps/web/src/managed-attachments.ts
apps/local-web/src/outline-style.ts -> apps/web/src/outline-style.ts
apps/local-web/src/provider-catalog.ts -> apps/web/src/provider-catalog.ts
apps/local-web/src/provider-settings.ts -> apps/web/src/provider-settings.ts
apps/local-web/src/public-image-reader.ts -> apps/web/src/public-image-reader.ts
apps/local-web/src/research-service.ts -> apps/web/src/research-service.ts
apps/local-web/src/research-style.ts -> apps/web/src/research-style.ts
apps/local-web/src/sample-slides.ts -> apps/web/src/sample-slides.ts
apps/local-web/src/source-tools.ts -> apps/web/src/source-tools.ts
apps/local-web/src/storage-root.ts -> apps/web/src/storage-root.ts
apps/local-web/src/tavily.ts -> apps/web/src/tavily.ts
apps/local-web/src/ui-assets.ts -> apps/web/src/ui-assets.ts
apps/local-web/src/web-state.ts -> apps/web/src/web-state.ts
apps/local-web/src/opencode/config.ts -> apps/web/src/opencode/config.ts
apps/local-web/src/opencode/events.ts -> apps/web/src/opencode/events.ts
apps/local-web/src/opencode/history.ts -> apps/web/src/opencode/history.ts
apps/local-web/src/opencode/mcp-bridge.ts -> apps/web/src/opencode/mcp-bridge.ts
apps/local-web/src/opencode/process.ts -> apps/web/src/opencode/process.ts
apps/local-web/src/opencode/provider.ts -> apps/web/src/opencode/provider.ts
apps/local-web/src/opencode/resources.ts -> apps/web/src/opencode/resources.ts
apps/local-web/src/opencode/runtime.ts -> apps/web/src/opencode/runtime.ts
```

**Interfaces:**

- Preserves: package name @deckagent/local-web and startLocalWeb(options?: LocalWebOptions).
- Preserves: CLI flags, script names, default storage path, localhost routes, token transfer, and resource discovery order.
- Produces: apps/web/lib/cli.js and apps/web/resources/opencode/.
- Keeps: @deckagent/browser-runtime as a separate package until Browser consolidation.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A directory move overwrites an existing apps/web file.
- A resource copy requires deleting an unchecked computed path.
- An old path occurs in executable configuration that the Files block does not include.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [x] **Step 1: Move the application**

Move tracked files with `git mv`.
Do not move `node_modules`, generated `lib`, or downloaded OpenCode resources.
Do not rename the package during this task.
Keep every source export and function body unchanged.

- [x] **Step 2: Update executable paths**

Change the root TypeScript reference from `apps/local-web` to `apps/web`.
Change both startup scripts to the new CLI path.
Change the packaging script's app root and its help text.
Update resource assertions, process-spawn paths, and fixture imports in tests.
Update the ignored resource directory.

Do not edit `docs/00-old/`.
Do not rewrite historical plans to describe the new layout.
For an active document, replace only a path that instructs a reader to run current code.

- [x] **Step 3: Refresh workspace metadata**

Run `corepack pnpm@11.28.5 install --lockfile-only --offline`.
Expected: exit code 0. The importer path changes without external version changes.

- [x] **Step 4: Check startup and packaging**

Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 test:env-startup`.
Run `corepack pnpm@11.28.5 test:opencode-resources`.
Run `corepack pnpm@11.28.5 test:local-foundation`.
Expected: build exits with code 0. Each suite prints `# fail 0`.
Run `rg -n "apps/local-web" package.json tsconfig.json scripts tests .gitignore`.
Expected: exit code 1 with no matches.
Do not add a compatibility directory that redirects to the new application.

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
