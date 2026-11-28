# Task 39: Check Slice 2D and Phase 2 Exit Gate and Rescan Metrics Report

Read this file to review the static quality checks, the five root tool test files, the 18 non-live suites, the Slice 2D metric delta, and the eight-area Phase 2 Tier 1 summary [[1]](#ref-1) [[2]](#ref-2).

## Files changed

- `docs/build/refactor/module-design/plan/task-39-verify-slice-2d-exit.md` — Steps 1 to 5 are marked `- [x]`.
- `docs/build/refactor/module-design/plan/README.md` — the Task 39 row is `Done` and links this report.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 39 row.
- `docs/build/refactor/module-design/reports/task-39-verify-slice-2d-exit.md` — this report.
- `apps/web/src/browser/dom.ts` and `apps/web/src/browser/theme.ts` — the two files changed from `CRLF` to `LF` only, with owner approval on 2026-11-25. Both files were `i/lf w/crlf` before this task and are `i/lf w/lf` after `npx biome format --write`. Git records no content change, so the two files add no diff to the commit.

## Static quality checks

| Check | Command | Exit code | Result |
| --- | --- | --- | --- |
| Build | `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `scripts/build-workspace.mjs` completed; the browser entry is `lib/browser-types/boot.js` |
| Boundaries | `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| Lint | `corepack pnpm@11.28.5 lint` | `0` | no diagnostic |
| Docs | `corepack pnpm@11.28.5 check:docs` | `0` | `0 error(s)` |
| Format | `npx biome format apps/web/src/browser/ apps/web/tests/fixtures/browser-driver.mjs apps/web/tests/brief-client.test.mjs apps/web/tests/deck-model.test.mjs` | `0` | `Checked 49 files` and `No fixes applied`; `0` formatting diffs |

The first format run failed with two `CRLF` diffs in `apps/web/src/browser/dom.ts` and `apps/web/src/browser/theme.ts`. Both diffs changed only the line ending, and both files were unchanged since `b7bbb40`. The owner approved a format-only fix, and the second run reported `0` diffs.

## Root tool tests

The task runs the five files in one command; the per-file split below comes from five separate runs of the same files.

| Test file | Tests | Pass | Fail | Skipped | Exit code |
| --- | --- | --- | --- | --- | --- |
| `tests/check-boundaries.test.mjs` | `22` | `22` | `0` | `0` | `0` |
| `tests/check-docs.test.mjs` | `23` | `23` | `0` | `0` | `0` |
| `tests/oxlint-boundaries.test.mjs` | `13` | `13` | `0` | `0` | `0` |
| `tests/post-edit-hook.test.mjs` | `5` | `5` | `0` | `0` | `0` |
| `tests/scan-module-design.test.mjs` | `6` | `6` | `0` | `0` | `0` |
| **Total** | **`69`** | **`69`** | **`0`** | **`0`** | **`0`** |

The combined command `node --test tests/check-boundaries.test.mjs tests/check-docs.test.mjs tests/oxlint-boundaries.test.mjs tests/post-edit-hook.test.mjs tests/scan-module-design.test.mjs` also reported `# tests 69`, `# pass 69`, `# fail 0`, `# skipped 0`, and exit code `0`.

## Non-live suites

| Suite | Tests | Pass | Fail | Skipped | Exit code |
| --- | --- | --- | --- | --- | --- |
| `test:session-persistence` | `7` | `7` | `0` | `0` | `0` |
| `test:tools-browser` | `14` | `14` | `0` | `0` | `0` |
| `test:env-startup` | `2` | `2` | `0` | `0` | `0` |
| `test:local-web` | `8` | `8` | `0` | `0` | `0` |
| `test:local-foundation` | `43` | `43` | `0` | `0` | `0` |
| `test:model-requests` | `29` | `29` | `0` | `0` | `0` |
| `test:opencode-resources` | `3` | `3` | `0` | `0` | `0` |
| `test:source-permissions` | `11` | `11` | `0` | `0` | `0` |
| `test:attachments` | `29` | `29` | `0` | `0` | `0` |
| `test:research` | `5` | `5` | `0` | `0` | `0` |
| `test:brief-foundation` | `15` | `15` | `0` | `0` | `0` |
| `test:outline-workflow` | `6` | `6` | `0` | `0` | `0` |
| `test:deck-review` | `21` | `21` | `0` | `0` | `0` |
| `test:slide-pipeline` | `7` | `7` | `0` | `0` | `0` |
| `test:layouts` | `10` | `10` | `0` | `0` | `0` |
| `test:images` | `39` | `39` | `0` | `0` | `0` |
| `test:generation-publication` | `72` | `72` | `0` | `0` | `0` |
| `test:browser-smoke` | `13` | `13` | `0` | `0` | `0` |
| **Total** | **`334`** | **`334`** | **`0`** | **`0`** | **`0`** |

Two suites needed a second run:

- The first `test:env-startup` run wrote no output for 4 minutes with the spawned CLI still alive. The run was stopped, and the next run reported `2` tests, `2` pass, and exit code `0` in 4.7 seconds.
- The first `test:browser-smoke` run reported `13` tests, `12` pass, `1` fail, and exit code `1`. The failing test was `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides` with the message `Explicit continuation did not finish the remaining slides: {"status":"Đang gửi","progress":"1/3 slide đã lưu · Chưa hoàn tất, không tự chạy tiếp"}`. This is the host-timing flake recorded in the Slice 2C exit gate report and re-verified on the pre-task tree in the Task 38 report [[3]](#ref-3) [[4]](#ref-4). The next run reported `13` tests, `13` pass, `0` fail, and exit code `0`.

## Slice 2D metrics

The measurement reads `scripts/scan-module-design.mjs --json` and counts non-null expressions with the TypeScript API.

| Measure | Pre-Slice 2D baseline | After Task 39 | Target | Result |
| --- | --- | --- | --- | --- |
| Files | `36` | `46` | no target | Recorded |
| Lines | `6,762` | `7,878` | no target | Recorded |
| Files over 400 lines | `5` | `0` | `0` | Met |
| Functions over 80 lines | `11` | `0` | `0` | Met |
| Non-barrel files under 30 lines | `3` plus the 1-line `bound-outline-decoder.ts` | `1` (`apps/web/src/browser/dom.ts`, approved `BB10`) | `1` | Met |
| Type assertions (`as`) | `7` | `0` | `0` | Met |
| Non-null assertions (`!`) | `32` | `0` | `0` | Met |
| `*Service` symbols | `0` | `0` | `0` | Met |
| `apps/web/src/browser/transport/index.ts` exports | `15` | `9` | `9` | Met |
| `apps/web/src/browser/features/deck/index.ts` exports | no target | `6` | `6` (`4` runtime values, `2` types) | Met |

The `features/deck` barrel exports four runtime values (`DeckWorkflowView`, `mountDeckCanvas`, `mountDeckTab`, `OutlineView`) and two types (`DeckModel`, `OutlineAction`).

## Phase 2 Tier 1 summary

| Area | Files | Lines | Over 400 | Functions over 80 | `as` | `!` | `*Service` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `packages/session/persistence/` | `12` | `1,964` | `0` | `0` | `0` | `12` | `0` |
| `packages/host/contracts/` | `10` | `1,472` | `0` | `0` | `0` | `0` | `0` |
| `packages/host/api/` | `16` | `1,563` | `0` | `1` | `0` | `0` | `0` |
| `packages/presentation/deck/` | `24` | `4,568` | `0` | `0` | `0` | `0` | `0` |
| `apps/web/src/features/` | `29` | `4,358` | `0` | `0` | `0` | `0` | `0` |
| `apps/web/src/integrations/` | `25` | `2,923` | `0` | `0` | `0` | `0` | `0` |
| `apps/web/src/` | `7` | `1,471` | `0` | `0` | `0` | `0` | `0` |
| `apps/web/src/browser/` | `46` | `7,878` | `0` | `0` | `0` | `0` | `0` |

All eight areas report `0` files over 400 lines, `0` type assertions, and `0` `*Service` symbols. Two residuals keep two areas above the zero target for functions over 80 lines and non-null assertions. The owner accepted both as pre-existing exceptions on 2026-11-25:

1. `packages/host/api/src/transport/multipart.ts` line 7 defines `receiveAttachment` with `112` lines. Task 11 recorded this function as the one remaining function over 80 lines, and the Slice 2A exit gate accepted it [[5]](#ref-5) [[6]](#ref-6).
2. `packages/session/persistence/` keeps `12` non-null assertions (`index.ts` `8`, `schema.ts` `3`, `attachments.ts` `1`). The Phase 1 baseline was `15`. The approved Slice 2A scope removed the `4` type assertions and the `3` non-null assertions in `requests.ts` only, so these `12` assertions stay outside the Slice 2A decision [[7]](#ref-7).

## Exit gate

Slice 2D passed its exit gate: `build`, `check:boundaries`, `lint`, `check:docs`, and Biome on the Slice 2D paths exited with code `0`, the five root tool test files passed `69` of `69` tests, the 18 non-live suites passed `334` of `334` tests across the two runs, and every Slice 2D metric met its target. Phase 2 passed its exit gate with the two owner-accepted residuals above. Phase 3 (Revision 6) is ready to start after the owner approves this report.

## What the commands do not prove

- The two residuals above stay in the tree, so the Phase 2 Tier 1 target of `0` functions over 80 lines and `0` non-null assertions is not met in `packages/host/api/` and `packages/session/persistence/`.
- `test:browser-smoke` failed once in this task and passed on the next run. The pass shows the suite can complete, not that continuation is stable under host load.
- The suites measure behavior through their own test paths. They do not prove that the `apps/web/src/browser/` modules keep the moved UI strings, selectors, storage keys, and timers; only the code diff can show that.
- The static checks count lines, function spans, `as`, `!`, and `*Service`. They do not measure coupling, cohesion, or naming quality.
- `check:docs` checks structure, the purpose line, relative links, and citations. It does not check that this report matches a later rescan of the folders.
- The metric run reads the working tree, so it does not prove the committed tree has the same line endings; the `git status --short` check in the task plan does.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 39 Plan](../plan/task-39-verify-slice-2d-exit.md)
3. <a id="ref-3"></a>[Task 29: Check Slice 2C Exit Gate and Rescan Metrics Report](task-29-verify-slice-2c-exit.md)
4. <a id="ref-4"></a>[Task 38: Remove layout.ts and Split Browser boot.ts Into Shell Modules Report](task-38-refactor-browser-boot-and-shell.md)
5. <a id="ref-5"></a>[Task 11: Host API Refactor Report](task-11-refactor-host-api.md)
6. <a id="ref-6"></a>[Task 12: Check Slice 2A Exit Gate and Rescan Metrics Report](task-12-verify-slice-2a-exit.md)
7. <a id="ref-7"></a>[Task 7: Diagnose session/persistence Module Design and Host Seam Report](task-07-diagnose-session-persistence.md)
