# Task 48: Move file tools and source tools into apps/host/src/tools

Read this file to learn the steps of Task 48, which moves `packages/tools/filesystem/` and `apps/host/src/features/sources/` into `apps/host/src/tools/` and removes `@deckagent/file-tools`.

**Type:** Move or rename

After this task, `apps/host/src/tools/` holds `policy/`, `sources/`, `executors/` and `index.ts`. `packages/tools/filesystem/` and `apps/host/src/features/sources/` no longer exist. No file in `apps/host/src/tools/executors/` imports a module, `node:fs`, `node:sqlite`, Express or `@deckagent/session-persistence`. Targeted `.oxlintrc.json` rules enforce this boundary with negative fixtures. The HTTP contract stays unchanged.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/ste-vi/SKILL.md`
- `packages/tools/filesystem/package.json`, `src/index.ts`, `src/contracts.ts`, `src/source-access.ts`, `src/attachment-contracts.ts`, `src/attachment-parser.ts`, `src/attachment-extraction.ts`, `src/parser-worker.ts`
- `apps/host/src/features/sources/source-tools.ts` and `index.ts`
- `apps/host/src/server.ts`, `apps/host/src/local-transport.ts`, `apps/host/package.json`, `apps/host/tsconfig.json`
- `package.json`, `tsconfig.json`, `scripts/build-workspace.mjs`, `scripts/check-boundaries.mjs`
- `.oxlintrc.json`, `tests/oxlint-boundaries.test.mjs`, `docs/conventions/project-structure.md`

**Files:**

- Create: `apps/host/src/tools/executors/ports.ts`, `apps/host/src/tools/index.ts`
- Move into `apps/host/src/tools/policy/`: `packages/tools/filesystem/src/contracts.ts`, `source-access.ts`
- Move into `apps/host/src/tools/sources/`: `packages/tools/filesystem/src/attachment-contracts.ts`, `attachment-extraction.ts`, `attachment-parser.ts`, `parser-worker.ts`
- Move into `apps/host/src/tools/executors/`: `apps/host/src/features/sources/source-tools.ts`
- Move into `apps/host/tests/`: `packages/tools/filesystem/tests/source-access.test.mjs`, `attachment-parser.test.mjs`, `fixtures/attachment-fixtures.mjs` and all files in `fixtures/attachments/`
- Remove: `packages/tools/`, `apps/host/src/features/sources/`
- Change: `apps/host/src/server.ts`, `apps/host/src/local-transport.ts`, `apps/host/package.json`, `apps/host/tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `scripts/build-workspace.mjs`, `scripts/check-boundaries.mjs`, `.oxlintrc.json`, `docs/conventions/project-structure.md`
- Test: `tests/oxlint-boundaries.test.mjs`, `apps/host/tests/fixtures/b02-helpers.mjs`, `apps/host/tests/source-access.test.mjs`, `apps/host/tests/attachment-parser.test.mjs`, `apps/host/tests/brief-host.test.mjs`, `apps/host/tests/commons-images.test.mjs`, `apps/host/tests/image-research.test.mjs`, `apps/host/tests/research-image-generation.test.mjs`, `e2e/artifact-rendering.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/image-recovery-http.test.mjs`, `e2e/layout-review-browser.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/opencode-source-live.test.mjs`, `e2e/portable-generation-http.test.mjs`, `e2e/portable-generation.test.mjs`

**Interfaces:**

- Produces, in `apps/host/src/tools/executors/ports.ts`:
  - `ToolWorkspaceLookup`: `{ readonly get: (id: string) => Promise<{ readonly folderStatus: string; readonly folder?: string | null }>; readonly folders: () => readonly string[] }`
  - `ToolAttachmentReader`: `{ prepared(sessionId: string, attachmentId: string, signal: AbortSignal): Promise<ParsedAttachment>; read(sessionId: string, attachmentId: string, signal: AbortSignal): Promise<Uint8Array> }`
  - `ToolResearchSession`: `{ readonly revision: string; search(query: string, requestId: string, sessionId: string, signal: AbortSignal): Promise<readonly unknown[]> }`
  - `ToolAttachmentRecord`, `ToolResearchSource`, `ToolSourceCatalogueItem` and `ToolSessionStore` matching the methods that `source-tools.ts` calls (`getInfo`, `attachments.sent`, `attachments.get`, `requests.sourceCatalogue`, `requests.researchSources`, `requests.recordSourceRead`).
- Produces, in `apps/host/src/tools/index.ts`: exports `createSourceAccess`, `SourceError`, `AttachmentParser`, `isParsedAttachment`, `attachmentLimits`, `attachmentParserVersion`, `prepareSourceTools`, `SourceToolFailure` and their public types (`SourceAccess`, `SourceAccessOptions`, `SourceRead`, `SourceReadPlan`, `AttachmentLocation`, `AttachmentPart`, `ParsedAttachment`, `AttachmentParseInput`, `SourceToolOptions`, `ToolSessionStore`, `ToolWorkspaceLookup`, `ToolAttachmentReader`, `ToolResearchSession`).

**STOP when:** `corepack pnpm@11.28.5 install --offline` fails or tries to download a package, or the build reports an error outside the tables `Mapping` and `Move rules`.

**Forbidden:** import any file from `apps/host/src/modules/`, `node:fs`, `node:sqlite`, `express` or `@deckagent/session-persistence` inside `apps/host/src/tools/executors/`. Change any HTTP route path, status code or JSON body.

## Mapping

| Old | New |
| --- | --- |
| `packages/tools/filesystem/src/contracts.ts`, `source-access.ts` | `apps/host/src/tools/policy/contracts.ts`, `source-access.ts` |
| `packages/tools/filesystem/src/attachment-contracts.ts`, `attachment-extraction.ts`, `attachment-parser.ts`, `parser-worker.ts` | `apps/host/src/tools/sources/` (same file names) |
| `apps/host/src/features/sources/source-tools.ts` | `apps/host/src/tools/executors/source-tools.ts` |
| `packages/tools/filesystem/tests/source-access.test.mjs`, `attachment-parser.test.mjs` | `apps/host/tests/` (same file names) |
| `packages/tools/filesystem/tests/fixtures/**` | `apps/host/tests/fixtures/**` (same relative paths) |

## Move rules

| Item | Rule |
| --- | --- |
| `apps/host/src/tools/sources/*.ts` | Change `./contracts.ts` to `../policy/contracts.ts`. Keep `new URL('./parser-worker.js', import.meta.url)` in `attachment-parser.ts`. |
| `apps/host/src/tools/executors/source-tools.ts` | Replace `@deckagent/file-tools` with `../policy/contracts.ts`, `../policy/source-access.ts` and `../sources/attachment-contracts.ts`. Replace imports from `../../modules/*`, `@deckagent/session-persistence` and `../../web-state.ts` with local `isRecord`, `errorCodeOf` and narrow ports in `./ports.ts`. |
| `apps/host/src/server.ts`, `local-transport.ts` | Import `AttachmentParser`, `attachmentLimits`, `prepareSourceTools` and `SourceToolFailure` from `./tools/index.ts`. |
| `apps/host/package.json`, `package.json`, `tsconfig.json`, `apps/host/tsconfig.json` | Move `@zip.js/zip.js`, `fast-xml-parser`, `pdfjs-dist` and `sharp` (exact versions) from `packages/tools/filesystem/package.json` into `apps/host/package.json`. Remove `@deckagent/file-tools` and `packages/tools/filesystem` references. Point `test:source-permissions` and `test:attachments` in `package.json` to `apps/host/tests/source-access.test.mjs` and `apps/host/tests/attachment-parser.test.mjs`. |
| `scripts/build-workspace.mjs` | Remove `'@deckagent/file-tools'` from `extraEntries`. Add `'lib/types/tools/sources/parser-worker.js'` to `extraEntries['@deckagent/host']`. |
| `scripts/check-boundaries.mjs` | Remove `'packages/tools/filesystem'` from `DOMAIN_DIRECTORIES`. |
| `.oxlintrc.json` | Replace `@deckagent/file-tools` with `../tools/**` in the `http/**` override and with `../../tools/**` and `../../../tools/**` in every `modules/**` override. Remove `@deckagent/file-tools` from `browser/**` and `contracts/**`. Add an override for `**/apps/host/src/tools/executors/**/*.{ts,tsx,mts,cts,js,mjs,cjs}` that blocks private package imports plus `../../modules/**`, `../../http/**`, `../../local-transport.ts`, `node:fs`, `node:fs/*`, `node:sqlite`, `express`, `express/*` and `@deckagent/session-persistence` with message `Tool executors must not import modules, HTTP, SQL or node:fs directly. Read files through tools/policy/.`. |
| Test imports and fixtures | Export `AttachmentParser` from `apps/host/tests/fixtures/b02-helpers.mjs`. Point `source-access.test.mjs`, `attachment-parser.test.mjs`, `commons-images.test.mjs`, `image-research.test.mjs` and `e2e/local-foundation.test.mjs` to `apps/host/lib/types/tools/index.js`. Point `e2e/attachment-storage.test.mjs` to `b02-helpers.mjs`. Point every `packages/tools/filesystem/tests/fixtures/attachments/` URL to `apps/host/tests/fixtures/attachments/` (or `./fixtures/attachments/` inside `apps/host/tests/`). |
| `tests/oxlint-boundaries.test.mjs` | In the `deck.service.ts` test, replace `@deckagent/file-tools` with `../../tools/index.ts`. Add two tests: `apps/host/src/tools/executors/source-tools.ts` rejects `node:fs/promises`, `../../modules/workspaces/index.ts` and `@deckagent/session-persistence`, and accepts `../policy/source-access.ts` and `../sources/attachment-contracts.ts`. |
| `docs/conventions/project-structure.md` | Remove the `packages/tools/filesystem/` row from `## Trong lúc chuyển`. Move the `Tool executor không tự cấp capability` rule to the `Chặn bởi` column (`oxlint` (`no-restricted-imports`) cho `apps/host/src/tools/executors/`). |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 47 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Move files, remove the old package and change wiring**

Run `git mv` for every row in `Mapping`. Run `git rm` on `packages/tools/filesystem/package.json`, `packages/tools/filesystem/tsconfig.json`, `packages/tools/filesystem/src/index.ts` and `apps/host/src/features/sources/index.ts`. Remove `packages/tools/` and `apps/host/src/features/sources/` completely so no old `lib/` stays on disk. Apply all rows of `Move rules`.

- [ ] **Step 3: Sync the lockfile offline**

Run: `corepack pnpm@11.28.5 install --offline`

Expected: PASS. Exit code 0.

- [ ] **Step 4: Check that no old path or forbidden import stays**

Run: `git grep --untracked -n -E "@deckagent/file-tools|packages/tools/filesystem|features/sources" -- apps packages e2e tests scripts package.json tsconfig.json .oxlintrc.json`

Expected: PASS. Only `scripts/scan-module-design.mjs`, `tests/scan-module-design.test.mjs` and `tests/check-boundaries.test.mjs` match, or no line.

Run: `git grep --untracked -n -E "\.\./\.\./modules/|node:fs|node:sqlite|@deckagent/session-persistence" -- apps/host/src/tools/executors`

Expected: PASS. No line.

- [ ] **Step 5: Format, build and check**

Remove `apps/host/lib` first. Do the step `Format, build and check` of the Task protocol. Run `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`.

Expected: PASS. Output contains `# fail 0`.

- [ ] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Moved files` with the columns `Old path | New path | Symbols`.

- What the commands do not prove: `prepareSourceTools` still receives `ToolContext` from `@deckagent/host-api` until Revision 4b moves the run lifecycle.
- `CHANGELOG.md` line: ``- Move file tools and source tools into `apps/host/src/tools/` (`policy/`, `sources/`, `executors/`), remove `@deckagent/file-tools` and enforce executor boundaries with oxlint. Task 48 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: move file tools and source tools into apps/host/src/tools`
