# Task 37: Require expectedRevision with Zod decoders on draft and attachment writes report

Read this file to learn how the decoders check the draft save and attachment remove bodies, and the result of each check.

## Files changed

Changed:

- `packages/host/contracts/src/attachment-validation.ts`: new file. It defines the interface `DraftSaveBody`, the schema `draftSaveBodySchema` (`strictObject` with `text`, `expectedRevision` and the optional `attachmentIds`), the schema `attachmentRemoveBodySchema`, the function `decodeDraftSaveBody` and the function `decodeAttachmentRemoveBody`. Each decoder throws `RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')` on a bad value. The schema gives no limit to `text`.
- `packages/host/contracts/src/index.ts`: exports `decodeAttachmentRemoveBody`, `decodeDraftSaveBody` and `DraftSaveBody`.
- `packages/host/contracts/tests/validation.test.mjs`: imports the two decoders and adds the test `draft save and attachment remove decoders require expectedRevision and keep draft length checks for the store`.
- `apps/host/src/modules/attachments/attachments.routes.ts`: adds the function `parseBody`, which turns `RequestValidationError` into `HttpError(400, error.code)` and drops the inline check of `expectedRevision`. `PUT /api/sessions/:sessionId/draft` calls `parseBody(decodeDraftSaveBody, await readJson(req))` and passes the body to `attachments.save`. `DELETE /api/sessions/:sessionId/attachments/:attachmentId` calls `parseBody(decodeAttachmentRemoveBody, await readJson(req))` and passes `body.expectedRevision` to `attachments.remove`.
- `apps/host/src/modules/attachments/attachments.service.ts`: the member `save` of `AttachmentOperations` and of `AttachmentCoordinator` takes `DraftSaveBody` in place of `unknown`. The method checks `await this.chat(id)`, then `input.expectedRevision !== current.revision` (`DRAFT_CONFLICT`), then each `attachmentIds` member (`ATTACHMENT_NOT_FOUND`), then cancels the removed items, saves the draft and discards the unsent files.
- `apps/web/src/browser/transport/management-client.ts`: `saveDraftState` takes `expectedRevision: number` and always sends `{ text, expectedRevision }`.
- `apps/web/src/browser/draft-sync.ts`: imports `ManagementError`. In `flushDraft`, the code reads `const revision = this.draftStates.get(id)?.revision`, throws `new ManagementError('DRAFT_CONFLICT')` when the value is `undefined`, and passes `revision` to `saveDraftState`.
- `e2e/attachment-admission.test.mjs`: adds the test `draft save and attachment removal require a non-negative integer expectedRevision`.
- `e2e/local-foundation.test.mjs`: five `PUT` to `/draft` send `expectedRevision`. The test keeps the `16001`-character case (`413 DRAFT_TOO_LARGE`) and the `extra: 1` case (`400 INVALID_REQUEST`).
- `e2e/model-requests.test.mjs`: the `PUT` to `/draft` on the bare chat sends `expectedRevision: 0`.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 37 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-37-require-draft-expected-revision.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `CHANGELOG.md`: records the two decoders and the required `expectedRevision`.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^\| 36 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the row of Task 36. |
| 2 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 2 | `node --test packages/host/contracts/tests/validation.test.mjs e2e/attachment-admission.test.mjs` | 1 | `# pass 7`, `# fail 2`. |
| 3 | `git grep -n -E "/draft', 'PUT'\|/draft\`, 'PUT'" -- e2e apps/host/tests` | 0 | 15 lines. Each line has a numeric `expectedRevision` or is the negative test of Step 2. |
| 3 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 3 | `node --test packages/host/contracts/tests/validation.test.mjs e2e/attachment-admission.test.mjs e2e/local-foundation.test.mjs` | 0 | `# pass 30`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 build` and then `node --test packages/host/contracts/tests/validation.test.mjs e2e/attachment-admission.test.mjs` | 0 and 1 | `# pass 14`, `# fail 2`. |
| 5 | `corepack pnpm@11.28.5 exec biome format --write <the ten code and test files>` | 0 | `Formatted 7 files in 32ms. Fixed 1 file.` |
| 5 | The same `biome format` command without `--write` | 0 | `Checked 7 files in 26ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 5 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 5 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 5 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 243 file(s) checked, 0 error(s) in 0 file(s)`. |
| 6 | The nineteen suite commands of the table below | 0 | Each suite gives `# fail 0`. |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 244 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this report>` | 0 | `0 violations (0 hard, baseline 0)`. |

The command `biome format` reports `Formatted 7 files` because `biome.json` limits `files.includes` to `apps`, `packages`, `scripts` and `tests`, and the three `e2e` files are outside those folders. The output `No fixes applied` holds for all files.

## Suites

| Suite | Command | Exit code | Pass and fail |
| --- | --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 22`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | `# pass 11`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 54`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | 0 | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | 0 | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | 0 | `# pass 31`, `# fail 0` |
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
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 17`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | `# pass 2`, `# fail 0` |

## Items for the report

- The `git grep` check of Step 3 matches 15 lines. One line is the negative test of Step 2: `const res = await api(...)` passes the variable `body`. That variable holds a payload with no `expectedRevision`, a negative value or a string value, and the test needs the reply `400 INVALID_REQUEST`. The other 14 lines send a numeric `expectedRevision`.
- The interface `DraftSaveBody` keeps `attachmentIds?: readonly string[]`. Zod gives the type `string[] | undefined` to the optional key, and `exactOptionalPropertyTypes` rejects this type. The decoder builds its return value with a conditional spread instead of a cast.
- `python` is not on this machine. The STE lint command ran as `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py`.

## Retries

1. Step 2, the first `build` after the new tests: the wrapper reported exit code 1 while the pipeline `| Select-Object -Last 15` printed no error. The next run of the same command wrote its full output to a file and gave exit code 0 with no line that contains `error`. The cause is the output pipeline of the first shell call, not a defect in the code. No file changed.
2. Step 3, the first `build` after the code changes: the TypeScript compiler gave `TS2375` on the return value of `decodeDraftSaveBody`, because `exactOptionalPropertyTypes` is `true`. The fix builds the return value with a conditional spread. No expected value changed.
3. Step 4, the break: the optional `expectedRevision` also makes the return value `number | undefined`, so the build stops. I added `?? 0` to the return value to keep the build green, ran the two test files, and then reverted both lines.

No STOP condition occurred.

## What the commands do not prove

- The Browser still shows the generic draft save failure text on `DRAFT_CONFLICT` inside `flushDraft`. Task 38 fixes it.
- No test covers `flushDraft` when `draftStates` has no entry for the chat. The new code throws `ManagementError('DRAFT_CONFLICT')` in that case.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
