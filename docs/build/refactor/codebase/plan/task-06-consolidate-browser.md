# Task 06: Put Browser code in the application

Read this file to learn the steps that put browser code in the application.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `packages/client/runtime/src/boot.ts (lines 1-1260)`.
- `packages/client/runtime/src/index.ts`.
- `packages/client/runtime/package.json`.
- `packages/client/runtime/tsconfig.json`.
- `apps/web/src/index.ts (asset loading block)`.
- `scripts/build-workspace.mjs`.
- `apps/web/src/ui-assets.ts`.

**Files:**

- Move: packages/client/runtime/src/*.ts to apps/web/src/browser/, with unchanged basenames.
- Create: apps/web/tsconfig.browser.json.
- Change: apps/web/tsconfig.json, package.json, and src/index.ts.
- Change: scripts/build-workspace.mjs, tsconfig.json, tsconfig.base.json, pnpm-lock.yaml.
- Change: tests/*.test.mjs and tests/fixtures/b02-helpers.mjs, for Browser imports only.
- Remove: packages/client/runtime/package.json and tsconfig.json after all consumers move.

**Exact source moves:**

```text
packages/client/runtime/src/attachment-view.ts -> apps/web/src/browser/attachment-view.ts
packages/client/runtime/src/boot.ts -> apps/web/src/browser/boot.ts
packages/client/runtime/src/bound-outline-decoder.ts -> apps/web/src/browser/bound-outline-decoder.ts
packages/client/runtime/src/brief-client.ts -> apps/web/src/browser/brief-client.ts
packages/client/runtime/src/brief-view.ts -> apps/web/src/browser/brief-view.ts
packages/client/runtime/src/confirmation-client.ts -> apps/web/src/browser/confirmation-client.ts
packages/client/runtime/src/conversation-view.ts -> apps/web/src/browser/conversation-view.ts
packages/client/runtime/src/deck-canvas.ts -> apps/web/src/browser/deck-canvas.ts
packages/client/runtime/src/deck-client.ts -> apps/web/src/browser/deck-client.ts
packages/client/runtime/src/deck-model.ts -> apps/web/src/browser/deck-model.ts
packages/client/runtime/src/deck-resizer.ts -> apps/web/src/browser/deck-resizer.ts
packages/client/runtime/src/deck-tab.ts -> apps/web/src/browser/deck-tab.ts
packages/client/runtime/src/deck-workflow-view.ts -> apps/web/src/browser/deck-workflow-view.ts
packages/client/runtime/src/dom.ts -> apps/web/src/browser/dom.ts
packages/client/runtime/src/host-client.ts -> apps/web/src/browser/host-client.ts
packages/client/runtime/src/image-review-client.ts -> apps/web/src/browser/image-review-client.ts
packages/client/runtime/src/index.ts -> apps/web/src/browser/index.ts
packages/client/runtime/src/layout.ts -> apps/web/src/browser/layout.ts
packages/client/runtime/src/management-client.ts -> apps/web/src/browser/management-client.ts
packages/client/runtime/src/message-content.ts -> apps/web/src/browser/message-content.ts
packages/client/runtime/src/model-picker.ts -> apps/web/src/browser/model-picker.ts
packages/client/runtime/src/motion.ts -> apps/web/src/browser/motion.ts
packages/client/runtime/src/outline-client.ts -> apps/web/src/browser/outline-client.ts
packages/client/runtime/src/outline-view.ts -> apps/web/src/browser/outline-view.ts
packages/client/runtime/src/request-feedback.ts -> apps/web/src/browser/request-feedback.ts
packages/client/runtime/src/research-view.ts -> apps/web/src/browser/research-view.ts
packages/client/runtime/src/settings-panel.ts -> apps/web/src/browser/settings-panel.ts
packages/client/runtime/src/theme.ts -> apps/web/src/browser/theme.ts
packages/client/runtime/src/workspace-view.ts -> apps/web/src/browser/workspace-view.ts
```

**Interfaces:**

- Preserves: all existing Browser classes and their method signatures.
- Produces: apps/web/lib/browser/index.js and apps/web/lib/browser/boot.js.
- Preserves: /client/boot.js and every current /client/*.js URL.
- Produces a Browser TypeScript project with DOM libraries and types: [].
- Keeps the application Node project separate from the Browser project.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- The Browser build needs a Node builtin, Session, Host API implementation, or Deck implementation.
- A public asset URL changes.
- A Node bundle absorbs Browser globals, or a Browser bundle absorbs credential code.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Move Browser sources**

Move each source file with its basename unchanged.
Do not split `boot.ts` during the move.
Replace imports from Host API and Deck with the wire package.
Use explicit wire-package exports for portable-document validation.

- [ ] **Step 2: Separate compilation targets**

Set the Browser project's `rootDir` to `src/browser`.
Set its `outDir` to `lib/browser-types`.
Use `lib: ["ES2024", "DOM", "DOM.Iterable"]` and `types: []`.
The Node project excludes `src/browser/**` and references the Browser project.

Bundle the Browser entries separately with `platform: "browser"`.
Emit `index.js` and `boot.js` into `apps/web/lib/browser/`.
Retain the existing anime.js and pure-contract bundling behavior.
Keep Node output in `apps/web/lib/`.
The Browser build must finish before the Host reads Browser assets.

- [ ] **Step 3: Update asset loading and consumers**

Resolve the Browser asset directory relative to the application module.
Do not use `import.meta.resolve('@deckagent/browser-runtime')`.
Serve the same asset paths and content types.
Change current tests to the new Browser output path.
Do not create application package exports solely for those tests.
Remove the old Browser workspace dependency, references, path alias, and importer.

- [ ] **Step 4: Check the two environments**

Run `corepack pnpm@11.28.5 install --lockfile-only --offline`.
Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 test:tools-browser`.
Run `corepack pnpm@11.28.5 test:browser-smoke`.
Expected: metadata and build commands exit with code 0. Suites print `# fail 0`.
Run `rg -n "@deckagent/(host-api|deck|session-persistence)|node:" apps/web/src/browser`.
Expected: exit code 1 with no matches.
Browser decoding still checks payloads before UI use.

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
