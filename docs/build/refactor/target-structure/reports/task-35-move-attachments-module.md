# Task 35: Move the attachments module into apps/host/src/modules report

Read this file to learn how the attachment and draft code moved into `apps/host/src/modules/attachments/` and the result of each check.

## Files changed

Moved with `git mv`:

- `apps/host/src/draft-store.ts` to `apps/host/src/modules/attachments/draft.store.ts`.
- `apps/host/src/features/attachments/attachment-coordinator.ts` to `apps/host/src/modules/attachments/attachments.service.ts`.
- `apps/host/src/features/attachments/managed-attachments.ts` to `apps/host/src/modules/attachments/attachments.store.ts`.
- `apps/host/src/features/attachments/index.ts` to `apps/host/src/modules/attachments/index.ts`.

Added:

- `apps/host/src/modules/attachments/attachments.routes.ts`: the constant `WORD_ID` and the function `createAttachmentRoutes`.
- `apps/host/src/modules/attachments/attachments.errors.ts`: the constant `attachmentStatus` and the function `mapAttachmentFailure`.

Removed:

- The folder `apps/host/src/features/attachments/`. It has no file after the move.
- The interface `AttachmentManagement`, the member `HostOptions.attachments` and the member `WebManagement.drafts` in `packages/host/api/src/transport/contracts.ts`.
- The function `attachmentManagement`, the constant `attachmentStatus`, the `AttachmentFailure` entry of `featureFailures`, the `DraftError` branch and the function `toAttachmentHttpError` in `apps/host/src/local-transport.ts`.

Changed:

- `apps/host/src/modules/attachments/attachments.store.ts`: defines `AttachmentStorageError`, the ports `AttachmentRecordView`, `AttachmentLogPort` and `ParsedAttachmentData`, the guard `isParsedAttachmentData`, the constant `maxStoredBytes` and the function `rejectionCode`. The file imports no code from `@deckagent/session-persistence` or `@deckagent/file-tools`.
- `apps/host/src/modules/attachments/attachments.service.ts`: defines the ports `AttachmentSessionStore`, `AttachmentParserPort` and `AttachmentLimits`, the type `AttachmentUploadInput`, `AttachmentPreview`, `DraftAdmitInput` and `AttachmentOperations`. The class `AttachmentCoordinator` takes the five constructor arguments and has the method `admitDraft` in place of `requestStore`. The file imports no code from `@deckagent/session-persistence`, `@deckagent/file-tools`, `@deckagent/host-api` or Express.
- `apps/host/src/modules/attachments/index.ts`: the public exports of the module.
- `packages/host/api/src/transport/multipart.ts`: exports `AttachmentUploadTarget`, and `receiveAttachment` is generic in the reply type of `upload`. The outer `catch` rethrows the rejection of `upload(...)`.
- `packages/host/api/src/transport/session-routes.ts`: removes `registerAttachmentRoutes` and the `attachments` member of `HostOptions`.
- `packages/host/api/src/transport/management-routes.ts`: removes the two `drafts` routes.
- `packages/host/api/src/transport/contracts.ts`: adds `HostOptions.maxAttachments` and removes `AttachmentManagement` and `WebManagement.drafts`.
- `packages/host/api/src/index.ts`: exports `receiveAttachment` and the type `AttachmentUploadTarget`, and passes `options.maxAttachments ?? 0` to `registerRequestRoutes`.
- `apps/host/src/server.ts`: imports `AttachmentParser` and `attachmentLimits` from `@deckagent/file-tools`, gives the five constructor arguments to `AttachmentCoordinator`, wraps `sessions.requests` in `createHostOptions`, adds `maxAttachments: runtime.inputs.maxFiles`, adds `createAttachmentRoutes(runtime.inputs)` after `createProviderRoutes(runtime.providers)`, adds `mapAttachmentFailure(error)` before `mapApplicationFailure(error)` and removes the `drafts` member of `management`.
- `apps/host/src/features/sources/source-tools.ts`: imports the type `ManagedAttachments` from `../../modules/attachments/index.ts`.
- `apps/host/tests/draft-store.test.mjs`: imports `MemoryDraftStore` from `../lib/types/modules/attachments/index.js`.
- `apps/host/tests/fixtures/b02-helpers.mjs`: exports `ManagedAttachments`, `MemoryDraftStore` and `createAttachmentRoutes` from `../../lib/types/modules/attachments/index.js`.
- `e2e/attachment-admission.test.mjs`: test 1 gives `routes: [createAttachmentRoutes(...)]` and `maxAttachments: 10` in place of `attachments`.
- `AGENTS.md`: removes `multer` from the target library list and states that multipart keeps `busboy` 1.6.0.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 35 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-35-move-attachments-module.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `CHANGELOG.md`: records the move.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^\| 34 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the row of Task 34. |
| 2 | `git mv` for the four moved files, then `New-Item -ItemType Directory` for the module folder | 0 | Four `R` lines. |
| 3 | `git grep --untracked -n -E "features/attachments\|draft-store\.ts\|AttachmentManagement\|attachmentManagement" -- apps/host packages e2e scripts` | 1 | No line. |
| 3 | `git grep --untracked -n -E "@deckagent/session-persistence\|@deckagent/file-tools\|node:sqlite" -- apps/host/src/modules/attachments` | 1 | No line. |
| 3 | `git grep -n -E "AttachmentFailure\|attachmentStatus\|DraftError" -- apps/host/src/local-transport.ts` | 1 | No line. |
| 4 | `corepack pnpm@11.28.5 exec biome format --write <the changed files>` | 0 | `Formatted 16 files in 67ms. Fixed 3 files.` |
| 4 | The same `biome format` command without `--write` | 0 | `Checked 16 files in 43ms. No fixes applied.` |
| 4 | `Remove-Item -Recurse -Force apps\host\lib, packages\host\api\lib` | 0 | No line. |
| 4 | `corepack pnpm@11.28.5 build` | 1 | First run: five type errors in `multipart.ts`, `attachments.service.ts` and `server.ts`. See the retry section. |
| 4 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 4 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 4 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 4 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 241 file(s) checked, 0 error(s) in 0 file(s)`. |
| 5 | `corepack pnpm@11.28.5 test:browser-smoke` | 1 | First run: `# pass 16`, `# fail 1`. Second run: `# pass 17`, `# fail 0`. See the retry section. |
| 5 | The nineteen suite commands of the table below | 0 | Each suite gives `# fail 0`. |
| 6 | `git status --short` | 0 | The expected paths, each one under `apps/host/`, `packages/host/api/src/` or `e2e/attachment-admission.test.mjs`, and `AGENTS.md`. |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 242 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this report>` | 0 | `0 violations (0 hard, baseline 0)`. |

## Moved files

| Old path | New path | Symbols |
| --- | --- | --- |
| `apps/host/src/draft-store.ts` | `apps/host/src/modules/attachments/draft.store.ts` | `DraftSnapshot`, `DraftErrorCode`, `DraftError`, `MemoryDraftStore` |
| `apps/host/src/features/attachments/managed-attachments.ts` | `apps/host/src/modules/attachments/attachments.store.ts` | `AttachmentStorageError`, `AttachmentRecordView`, `AttachmentLogPort`, `AttachmentLocationData`, `AttachmentPartData`, `ParsedAttachmentData`, `isParsedAttachmentData`, `AttachmentUpload`, `ManagedAttachments` |
| `apps/host/src/features/attachments/attachment-coordinator.ts` | `apps/host/src/modules/attachments/attachments.service.ts` | `AttachmentFailure`, `AttachmentSessionStore`, `AttachmentParserPort`, `AttachmentLimits`, `AttachmentUploadInput`, `AttachmentPreview`, `DraftAdmitInput`, `AttachmentOperations`, `AttachmentCoordinator` |
| `apps/host/src/features/attachments/index.ts` | `apps/host/src/modules/attachments/index.ts` | the public exports of the module |
| The constant `attachmentStatus`, the `AttachmentFailure` entry, the `DraftError` branch and the function `attachmentManagement` in `local-transport.ts` | `apps/host/src/modules/attachments/attachments.errors.ts` | `attachmentStatus`, `mapAttachmentFailure` |
| `registerAttachmentRoutes` in `session-routes.ts` and the two `drafts` routes in `management-routes.ts` | `apps/host/src/modules/attachments/attachments.routes.ts` | `WORD_ID`, `createAttachmentRoutes` |
| `HostOptions.attachments`, `AttachmentManagement` and `WebManagement.drafts` in `contracts.ts` | Removed. `HostOptions.maxAttachments` feeds `registerRequestRoutes`. | `maxAttachments` |
| The body of `receiveAttachment` in `multipart.ts` | `packages/host/api/src/transport/multipart.ts` | `AttachmentUploadTarget`, `receiveAttachment` |

## Suites after the move

| Suite | Command | Exit code | Pass and fail |
| --- | --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 20`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | `# pass 11`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 54`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | 0 | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | 0 | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | 0 | `# pass 29`, `# fail 0` |
| test:research | `corepack pnpm@11.28.5 test:research` | 0 | `# pass 5`, `# fail 0` |
| test:images | `corepack pnpm@11.28.5 test:images` | 0 | `# pass 39`, `# fail 0` |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` | 0 | `# pass 6`, `# fail 0` |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` | 0 | `# pass 15`, `# fail 0` |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` | 0 | `# pass 21`, `# fail 0` |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` | 0 | `# pass 72`, `# fail 0` |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | `# pass 7`, `# fail 0` |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` | 0 | `# pass 7`, `# fail 0` |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` | 0 | `# pass 3`, `# fail 0` |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` | 0 | `# pass 10`, `# fail 0` |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 17`, `# fail 0` on the second and third run |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | `# pass 2`, `# fail 0` |

## Items for the report

- No row of the tables `Mapping` and `Move rules` is missing. No row matches no item.
- The class `AttachmentCoordinator` publishes `maxBytes` and `maxFiles` as public read-only members, because `AttachmentOperations` and `HostOptions.maxAttachments` read them.
- The call `attachments.upload(...)` in `multipart.ts` has the type assertion `as Promise<T>`. The intersection type of the parameter makes TypeScript select the member of `AttachmentUploadTarget` first, and that member replies `Promise<unknown>`. The assertion keeps the generic reply of the second member.
- `python` is not on this machine. The STE lint command ran as `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py`.

## Retries

1. Step 4, the first `build`: five type errors. `multipart.ts` gave `TS2322` at the assignment to `work` and `TS18048` at `void work.catch(...)`. `attachments.service.ts` gave `TS2420` and `TS6133` because `maxBytes` and `maxFiles` were private. `server.ts` gave `TS2341` and `TS2345` for the same reason. The fix makes `maxBytes` and `maxFiles` public read-only members and adds the type assertion `as Promise<T>` in `multipart.ts`. No other file changed.
2. Step 5, `test:browser-smoke`: the first run gave `# pass 16`, `# fail 1`, as the eighteenth suite of the run. The run did not record the name of the failed test. The second run gave `# pass 17`, `# fail 0`, and the third run also gave `# pass 17`, `# fail 0`. This task changes no Browser code. The suite has 17 tests, and no other run of the suite failed.

No STOP condition occurred.

## What the commands do not prove

- No new test checks the route order or the error map order. The existing suites check the HTTP contract.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
- The check `git grep` proves that no old path or old name stays in the listed folders. It does not prove that a comment outside those folders has no old name.
