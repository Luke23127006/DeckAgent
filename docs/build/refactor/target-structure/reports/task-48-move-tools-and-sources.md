# Task 48: Move file tools and source tools into apps/host/src/tools report

Read this file to learn the changes and check results for Task 48.

## Files changed

- `apps/host/src/tools/policy/contracts.ts`, `source-access.ts`: moved from `packages/tools/filesystem/src/`.
- `apps/host/src/tools/sources/attachment-contracts.ts`, `attachment-extraction.ts`, `attachment-parser.ts`, `parser-worker.ts`: moved from `packages/tools/filesystem/src/`.
- `apps/host/src/tools/executors/source-tools.ts`: moved from `apps/host/src/features/sources/`. It now uses narrow ports and local helpers.
- `apps/host/src/tools/executors/ports.ts`: new. It holds `ToolSessionStore`, `ToolWorkspaceLookup`, `ToolAttachmentReader`, `ToolResearchSession` and the record types.
- `apps/host/src/tools/index.ts`: new. It exports the policy, source, executor and port types.
- `apps/host/src/server.ts`: imports `AttachmentParser`, `attachmentLimits` and `prepareSourceTools` from `./tools/index.ts`.
- `apps/host/src/local-transport.ts`: imports `SourceToolFailure` from `./tools/index.ts`.
- `apps/host/package.json`: adds `@zip.js/zip.js` 2.24.0, `fast-xml-parser` 5.12.0, `pdfjs-dist` 6.5.438 and `sharp` 0.35.5. It removes `@deckagent/file-tools`.
- `package.json`: removes `@deckagent/file-tools`. `test:source-permissions` and `test:attachments` point to `apps/host/tests/`.
- `apps/host/tsconfig.json`, `tsconfig.json`: remove the `packages/tools/filesystem` project reference.
- `pnpm-lock.yaml`: synced offline.
- `scripts/build-workspace.mjs`: the Host names its three bundles, so `parser-worker.js` stays beside `lib/server.js`.
- `scripts/check-boundaries.mjs`: removes `packages/tools/filesystem` from `DOMAIN_DIRECTORIES`.
- `.oxlintrc.json`: replaces `@deckagent/file-tools` with the tools paths and adds the executor override.
- `docs/conventions/project-structure.md`: removes the old folder row and moves the executor rule to `Chặn bởi`.
- `tests/oxlint-boundaries.test.mjs`: the deck service case uses `../../tools/index.ts`. Two executor cases are new.
- `apps/host/tests/fixtures/b02-helpers.mjs`: exports `AttachmentParser`.
- `apps/host/tests/source-access.test.mjs`, `attachment-parser.test.mjs`: moved from `packages/tools/filesystem/tests/`. They import `../lib/types/tools/index.js`.
- `apps/host/tests/fixtures/attachment-fixtures.mjs` and `apps/host/tests/fixtures/attachments/**`: moved from `packages/tools/filesystem/tests/fixtures/`.
- `apps/host/tests/brief-host.test.mjs`, `commons-images.test.mjs`, `image-research.test.mjs`, `research-image-generation.test.mjs`: point to the new fixture folder and the tools entry.
- `e2e/attachment-storage.test.mjs`, `local-foundation.test.mjs`: point to `b02-helpers.mjs` and the built tools entry.
- `e2e/artifact-rendering.test.mjs`, `browser-smoke.test.mjs`, `image-recovery-http.test.mjs`, `layout-review-browser.test.mjs`, `opencode-source-live.test.mjs`, `portable-generation-http.test.mjs`, `portable-generation.test.mjs`: point to the new fixture folder.
- `packages/presentation/deck/tests/artifact-publication.test.mjs`, `packages/presentation/html/tests/html-template-v3.test.mjs`, `packages/presentation/html/tests/layout-quality.test.mjs`: point to the new fixture folder.
- Removed: `packages/tools/filesystem/package.json`, `tsconfig.json`, `src/index.ts`, `apps/host/src/features/sources/index.ts`, and the old `lib/` and `node_modules/` folders.
- This task file, the plan index, the report index and `CHANGELOG.md` record the result.

## Moved files

| Old path | New path | Symbols |
| --- | --- | --- |
| `packages/tools/filesystem/src/contracts.ts` | `apps/host/src/tools/policy/contracts.ts` | `SourceRead`, `SourceReadPlan`, `SourceAccess`, `SourceAccessOptions`, `SourceError` |
| `packages/tools/filesystem/src/source-access.ts` | `apps/host/src/tools/policy/source-access.ts` | `createSourceAccess` |
| `packages/tools/filesystem/src/attachment-contracts.ts` | `apps/host/src/tools/sources/attachment-contracts.ts` | `attachmentLimits`, `attachmentParserVersion`, `AttachmentLocation`, `AttachmentPart`, `ParsedAttachment`, `AttachmentParseInput` |
| `packages/tools/filesystem/src/attachment-extraction.ts` | `apps/host/src/tools/sources/attachment-extraction.ts` | `extractAttachment` |
| `packages/tools/filesystem/src/attachment-parser.ts` | `apps/host/src/tools/sources/attachment-parser.ts` | `AttachmentParser`, `isParsedAttachment` |
| `packages/tools/filesystem/src/parser-worker.ts` | `apps/host/src/tools/sources/parser-worker.ts` | the parser worker entry |
| `apps/host/src/features/sources/source-tools.ts` | `apps/host/src/tools/executors/source-tools.ts` | `SourceToolFailure`, `SourceToolOptions`, `prepareSourceTools` |
| `packages/tools/filesystem/tests/source-access.test.mjs` | `apps/host/tests/source-access.test.mjs` | 3 tests of read plans, links and approvals |
| `packages/tools/filesystem/tests/attachment-parser.test.mjs` | `apps/host/tests/attachment-parser.test.mjs` | 9 tests of text, archive, PDF, Office and image preparation |
| `packages/tools/filesystem/tests/fixtures/attachment-fixtures.mjs` | `apps/host/tests/fixtures/attachment-fixtures.mjs` | `noisyAttachmentPng`, `attachmentZip` |
| `packages/tools/filesystem/tests/fixtures/attachments/**` | `apps/host/tests/fixtures/attachments/**` | 12 binary fixtures and their `README.md` |

## Commands run

Commands ran from `C:/Users/Duy/Desktop/DeckAgent` in PowerShell 5.1.
The package command prefix is `corepack pnpm@11.28.5`.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` before the move | 0 | No line |
| `git grep -n "^| 47 | Done"` | 0 | One line, the Task 47 row |
| `git mv` and `git rm` for every mapping row | 0 | 23 renames, 4 deletions |
| `install --offline` | 0 | `Done in 10.2s`. It removes `@deckagent/file-tools` from devDependencies |
| `git grep --untracked` for old paths | 0 | Only `scripts/scan-module-design.mjs`, `tests/scan-module-design.test.mjs` and `tests/check-boundaries.test.mjs` match |
| `git grep --untracked` for executor imports | 1 | No line |
| `exec biome format --write` on the changed code and tests | 0 | `Formatted 24 files`, `Fixed 14 files` |
| `exec biome format` on the same files | 0 | `No fixes applied` |
| First `build` | 1 | `TS2322` on `ToolSourceReadReceipt.location.start` |
| Second `build` | 0 | Host bundles complete |
| First `test:attachments` | 1 | 27 pass, 4 fail. The worker file is not beside `lib/server.js` |
| `build` after the entry name change | 0 | tsdown writes `lib/parser-worker.js` |
| Second `test:attachments` | 0 | 31 pass, 0 fail |
| `lint` | 0 | No error |
| First `check:boundaries` | 1 | One `private-package-import` at `e2e/local-foundation.test.mjs:443` |
| `check:docs` | 0 | 267 files, 0 error(s) |
| `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | 51 pass, 0 fail |
| Second `check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| Final `build`, `lint` and `check:boundaries` | 0 | Each command passed |

## Required suites

Every command below exited with code 0 and reported `# fail 0`.
The first full run failed in `test:generation-publication` and `test:layouts`.
Three presentation test files used three `..` segments for the new fixture folder.
The repair uses four `..` segments. I ran those two suites again. No other suite reads those files.

| Command | Pass | Fail |
| --- | --- | --- |
| `test:http-edge` | 12 | 0 |
| `test:tools-browser` | 24 | 0 |
| `test:local-web` | 11 | 0 |
| `test:local-foundation` | 57 | 0 |
| `test:model-requests` | 29 | 0 |
| `test:source-permissions` | 11 | 0 |
| `test:attachments` | 31 | 0 |
| `test:research` | 5 | 0 |
| `test:images` | 39 | 0 |
| `test:outline-workflow` | 6 | 0 |
| `test:brief-foundation` | 16 | 0 |
| `test:deck-review` | 21 | 0 |
| `test:generation-publication` | 72 | 0 |
| `test:slide-pipeline` | 9 | 0 |
| `test:session-persistence` | 7 | 0 |
| `test:opencode-resources` | 3 | 0 |
| `test:layouts` | 10 | 0 |
| `test:browser-smoke` | 22 | 0 |
| `test:env-startup` | 2 | 0 |

## Plan corrections and retries

The task file gives three instructions that do not hold against the current code. I applied the smallest change that keeps the named behaviour. A person must review these three items.

1. The Host worker entry does not land beside the server bundle.
   The Move rules add `lib/types/tools/sources/parser-worker.js` to `extraEntries['@deckagent/host']`.
   tsdown keeps the folder of the entry, so the file lands at `lib/tools/sources/parser-worker.js`.
   The bundle at `lib/server-*.js` forks `./parser-worker.js`, which resolves to `lib/parser-worker.js`.
   Four attachment tests failed with `rejected` instead of `ready`.
   `scripts/build-workspace.mjs` now names the three Host bundles in `namedEntries`, so tsdown writes `lib/parser-worker.js`.
   The source still keeps `new URL('./parser-worker.js', import.meta.url)`.
2. `e2e/local-foundation.test.mjs` cannot import `apps/host/lib/types/tools/index.js`.
   `check:boundaries` reports `private-package-import` for a relative import into the `lib/` folder of another workspace.
   The test now reads the built tools entry as text and checks that two retired names are absent.
   The check keeps its force on the tools entry and adds no boundary exception.
3. Two more lines of that test read the old package and feature files.
   They now read `apps/host/lib/types/tools/index.js` and `apps/host/src/tools/executors/source-tools.ts`.

Three presentation test files are outside the `Files` block. The Move rule "Point every fixture URL" covers them, and the `test:generation-publication` and `test:layouts` suites fail without the change.

No STOP condition remains. The first build, the first `test:attachments` run, the first `check:boundaries` run and the first suite run each failed once, and each failure has a correction above.

## Items outside the mapping

No item from the `Mapping` or `Move rules` tables needed a different path.
The three corrections above are the only changes outside those tables.

## What the commands do not prove

- `prepareSourceTools` still receives `ToolContext` from `@deckagent/host-api` until Revision 4b moves the run lifecycle.
- The oxlint fixtures show that the executor rule rejects the named imports. They do not show that the production code avoids `node:fs` at run time.
- No test reads `lib/parser-worker.js` by name. The attachment suites show that the fork works, not that the path is stable across bundler versions.

## Commit handoff

The task file commits and pushes this report.
The commit message is `refactor: move file tools and source tools into apps/host/src/tools`.
