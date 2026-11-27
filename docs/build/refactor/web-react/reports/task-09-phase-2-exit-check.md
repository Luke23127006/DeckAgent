# Task 9 Report: Phase 2 exit check

Read this file to know which Phase 2 exit checks ran, their results, the one suite that stays red and what the checks do not prove.

**Status:** Done with an accepted flake. The static checks and 19 of 20 non-live suites pass. The suite `test:browser-smoke` fails in every run on the two host-timing flakes that earlier reports record. The user accepted the flake, so Step 4 ran and Phase 2 is `Done`.

## Files changed

- Change `.gitignore`: adds `/apps/web/dist/` next to `/apps/*/lib/`. The Vite build output is not a source file, and oxlint read it in Step 1.
- Change `docs/build/refactor/web-react/README.md`: the Phase 2 row of `Abstract phase plan` is `Done`, and the section `Phase 2: React shell` records the legacy mount.
- Change `docs/build/refactor/web-react/web-rules.md`: the row `Production build has no chunk from mocks/ or MSW` is `Exists`.
- Change `docs/conventions/project-structure.md`: the build check of `mocks/` and `msw` moves into `Chặn bởi` as the Vite plugin `forbidMocksInBuild` and its fixture.
- Change `docs/build/refactor/web-react/plan/task-09-phase-2-exit-check.md`: every step is `- [x]`.
- Change `docs/build/refactor/web-react/plan/README.md`: the Task 9 row is `Done` and links this report.
- Change `docs/build/refactor/web-react/reports/README.md`: adds the Task 9 row.
- Create `docs/build/refactor/web-react/reports/task-09-phase-2-exit-check.md`: this report.

## Commands

| Command | Exit code | Key output |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | 0 | `tsc -b` passed. Vite built `dist/index.html`, `dist/assets/index-B4zDWiWX.css` (67.05 kB) and `dist/assets/index-DGCoaXod.js` (613.77 kB) |
| `corepack pnpm@11.28.5 lint` (first run) | 1 | `eslint(no-underscore-dangle)`, `eslint(no-unused-expressions)` and `unicorn(no-thenable)` errors only in `apps/web/dist/assets/index-Bboz5cmW.js` |
| `corepack pnpm@11.28.5 lint` (after the `.gitignore` change) | 0 | no diagnostic |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 339 file(s) checked, 0 error(s) in 0 file(s)` |
| `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs tests/check-docs.test.mjs tests/vite-build-mocks.test.mjs` | 0 | `# tests 100`, `# pass 100`, `# fail 0` |
| `corepack pnpm@11.28.5 test:web` | 1 | `ERR_PNPM_BAD_PM_VERSION`, `Your current pnpm is v12.21.0` |
| `node "$LOCALAPPDATA/node/corepack/v1/pnpm/11.28.5/bin/pnpm.cjs" test:web` | 0 | `Test Files 4 passed (4)`, `Tests 6 passed (6)` |
| `corepack pnpm@11.28.5 test:browser-smoke` (Step 3 first run) | 1 | `# pass 0`, `# fail 2`. Both files stopped at import with `SyntaxError ... does not provide an export named 'SqliteAttachmentStore'` |
| `corepack pnpm@11.28.5 test:browser-smoke` (run alone, second run) | 1 | `# tests 22`, `# pass 21`, `# fail 1` |
| `node --test --test-concurrency=1 --test-name-pattern="Create deck UI collects missing answers" e2e/browser-smoke.test.mjs` | 1 | `Explicit continuation did not finish the remaining slides: {"status":"Đang gửi","progress":"1/3 slide đã lưu · Chưa hoàn tất, không tự chạy tiếp"}` |
| `corepack pnpm@11.28.5 test:browser-smoke` (third run) | 1 | `# tests 22`, `# pass 21`, `# fail 1` on `interactive composer: model choice, Send, live reply and Stop survive a reload; drafts stay per chat`, `Wizard did not return to chat` |
| `corepack pnpm@11.28.5 check:docs` (after Step 4) | 0 | `check-docs: 343 file(s) checked, 0 error(s) in 0 file(s)` |

## Suites

All scripts of `package.json` whose name starts with `test:`, except `test:research-live` and `test:opencode-live`.

| Script | First run | Run alone |
| --- | --- | --- |
| `test:local-foundation` | pass (63) | not needed |
| `test:model-requests` | pass (57) | not needed |
| `test:source-permissions` | pass (11) | not needed |
| `test:attachments` | pass (32) | not needed |
| `test:research` | pass (5) | not needed |
| `test:images` | fail (`# pass 37`, `# fail 2`) | pass (39) |
| `test:outline-workflow` | pass (6) | not needed |
| `test:brief-foundation` | fail (`# pass 12`, `# fail 1`) | pass (16) |
| `test:deck-review` | fail (`# pass 13`, `# fail 2`) | pass (25) |
| `test:generation-publication` | fail (`# pass 54`, `# fail 7`) | pass (72) |
| `test:slide-pipeline` | fail (`# pass 7`, `# fail 1`) | pass (9) |
| `test:session-persistence` | fail (`# pass 0`, `# fail 1`) | pass (8) |
| `test:tools-browser` | fail (`# pass 19`, `# fail 2`) | pass (26) |
| `test:opencode-resources` | pass (3) | not needed |
| `test:browser-smoke` | fail (`# pass 0`, `# fail 2`) | fail in three runs (`# pass 21`, `# fail 1` in each run) |
| `test:env-startup` | pass (2) | not needed |
| `test:http-edge` | pass (12) | not needed |
| `test:local-web` | fail (`# pass 3`, `# fail 2`) | pass (14) |
| `test:web` | fail (`ERR_PNPM_BAD_PM_VERSION`) | pass through the 11.28.5 launcher (6 tests) |
| `test:layouts` | fail (`# pass 8`, `# fail 1`) | pass (10) |

## STOP and retry

- Step 1, retry 1: `lint` failed with about 4,000 errors, all in `apps/web/dist/assets/index-Bboz5cmW.js`. `build` now writes `apps/web/dist/`, and neither `.gitignore` nor the oxlint ignore list names that folder, so oxlint read the bundle. The Task 8 report already records this defect. The fix adds `/apps/web/dist/` to `.gitignore`, in the group of the build outputs `/packages/*/*/lib/` and `/apps/*/lib/`. oxlint skips gitignored files, so `lint` passed on the next run and no other file changed.
- Step 2, retry 1: `corepack pnpm@11.28.5 test:web` stops before Vitest starts. The script starts a bare `pnpm`, and the `pnpm` on `PATH` under corepack is the standalone 12.21.0 launcher, which refuses the `packageManager` pin. The same cause and workaround are in the Task 4 report. The run through the 11.28.5 launcher passed. No repository file changed for this cause.
- Step 3, first run: 9 suites failed because `apps/host/lib/types/modules/attachments/index.js` did not export `AttachmentFileStore` or `SqliteAttachmentStore`. Another workstream in the same tree committed the attachment rename at `a82bb6d` while the suites ran, so the emitted `lib/types/` was older than the source. A rebuild made the two suites, `test:local-foundation` and `test:model-requests`, pass again, and 8 of the 9 suites passed in their run alone.
- Step 3, `test:browser-smoke`, STOP: the suite fails in its run alone in three runs of 22 tests, each time on one test. Two runs fail on `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides` with `Explicit continuation did not finish the remaining slides` and the status `Đang gửi`. One run fails on `interactive composer: model choice, Send, live reply and Stop survive a reload; drafts stay per chat` with `Wizard did not return to chat`. These are the two host-timing flakes that `docs/build/refactor/target-structure/plan/README.md`, `docs/build/refactor/target-structure/reports/task-32-add-providers-version-and-notices.md`, `docs/build/refactor/target-structure/reports/task-38-connect-browser-to-draft-notices.md` and `docs/build/refactor/module-design/reports/task-39-verify-slice-2d-exit.md` record. They exist before Phase 2: `de7f0ab` with the Task 38 report is from 2026-11-26. Phase 2 changes no file on the continuation path; it changes `e2e/browser-smoke.test.mjs` only in the `.dark` assertion. The cause is outside the files of Phase 2, so the task stopped before Step 4. The user accepted the flake, and Step 4 then ran.

## What the commands do not prove

- The Phase 2 exit gate did not pass on its own. `test:browser-smoke` failed in three runs with these changes. Phase 2 is `Done` because the user accepted the flake, not because a run of the suite passed.
- The two failures prove a flake in the tested flow, not the absence of a defect. No run separated a defect in the continuation timing from machine load. The tree also ran under a second workstream that built and tested the same repository.
- The suites ran on a tree that another workstream edited and committed between the first sweep and the runs alone. The green results prove the final tree, not every intermediate state.
- `test:web` passed through the 11.28.5 launcher, not through the exact `pnpm test:web` script command.
- The Vite build leaves one 613.77 kB chunk and prints a chunk size warning. No chunk split is part of Phase 2.
- No person looked at the Browser. The suites use a headless browser, and no check compares the theme, the layout or the legacy screens with `apps/web/DESIGN.md`.
