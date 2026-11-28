# Task 38: Remove `layout.ts` and Split Browser `boot.ts` Into Shell Modules Report

Read this file to review the dead `layout.ts` removal, the `shell-dom.ts`, `draft-sync.ts`, `chat-navigation.ts`, and `request-runner.ts` extraction, the assertion removal, and the verification output [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/browser/shell-dom.ts` (257 lines) — `ShellDom` with the `#app` guard (`APP_ROOT_MISSING`), every shell region, the rail collapse preference (`deckagent-nav`), mobile recents folding (`max-width:720px`), account menu placement and outside-press closing, `fitInput`, and the `ResizeObserver` that sets `--navigation-height`.
- `apps/web/src/browser/draft-sync.ts` (239 lines) — `DraftSync` with the draft mirror, draft state, per-chat draft queue, debounced save, flush and read, attachment upload and removal, attachment preview, the `500` ms attachment timer, the `window` focus sync, and `dispose()`.
- `apps/web/src/browser/chat-navigation.ts` (326 lines) — `ChatNavigation` with `describeHistory`, `renderModels`, `renderChats`, `refresh`, `showHistory`, `showActivities`, `showOutlines`, `open`, `newChat`, `findChats`, `switchingBlocked`, `start`, and `dispose()` for the `200` ms search timer.
- `apps/web/src/browser/request-runner.ts` (377 lines) — `sendBlocked` and `RequestRunner` with `follow`, `stopActiveRequest`, `submitRequest`, `confirmOutline`, `confirmTarget`, the `750` ms active-request poll, `abortWatch()`, and `dispose()`.

Removed:

- `apps/web/src/browser/layout.ts` (16 lines) — `LayoutSlots` had no import or call site.

Modified:

- `apps/web/src/browser/boot.ts` (1,263 → 393 lines, 0 exports) — owns the six transport clients, the shell, the feature views, the `run` and `controls` reporting, the model change, retry, and reconnect wiring, the `pagehide` and `pageshow` hooks, and the startup call.
- `docs/build/refactor/module-design/plan/README.md` — Task 38 is `Done`.
- `docs/build/refactor/module-design/plan/task-38-refactor-browser-boot-and-shell.md` — Steps 1 to 7 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 38 row.

## Behaviour preservation

- Every Vietnamese UI string, DOM class name, `data-*` value, `localStorage` key (`deckagent-nav`), `sessionStorage` key (`deckagent-session`, `confirmation:*`), timer interval (`200`, `250`, `500`, `750`), and `requestLimit` (`16000`) moved without edits.
- `scripts/build-workspace.mjs` still builds `apps/web/lib/browser-types/boot.js`; `boot.ts` keeps zero exports.
- `open` still reads all five resources before changing `current`, so a failed open leaves the old chat intact.
- `submitRequest` keeps the accepted-only composer reset, the `continueDeck` payload, and the draft revision and attachment IDs. The four `!` assertions are replaced by the explicit `draftRevision` and `attachmentIds` values.
- The pointerdown listener now guards `event.target` with `instanceof Node` instead of two `as Node` assertions. The `#app` lookup throws `APP_ROOT_MISSING` instead of asserting.
- The module factories keep their view signatures and barrel exports unchanged.

## Line targets

All files stay under 400 lines, and every function is under the task limit for its file (maximum 63 lines in `chat-navigation.ts` and 58 lines in `request-runner.ts`). Three files exceed their task line targets:

| File | Target | Actual | Reason |
| --- | --- | --- | --- |
| `shell-dom.ts` | under 290 | 257 | Met |
| `draft-sync.ts` | under 240 | 239 | Met |
| `chat-navigation.ts` | under 280 | 326 | The option contract, the shared state fields, and the class scaffolding add 46 lines beyond the moved functions |
| `request-runner.ts` | under 290 | 377 | The option contract, the `finishFollow` split, and the `send` split keep every function under 75 lines but add 87 lines |
| `boot.ts` | under 280 | 393 | The six client instances, the eleven view mounts, and the option objects for the three factories add 113 lines |

`follow` was 80 lines in `boot.ts`; the task limit of 75 requires the `finishFollow` split. `submitRequest` was over 60 lines; the `send` split keeps it under 75. Both splits add signatures.

## Metrics

The AST sweep reads `scripts/scan-module-design.mjs --json` and counts non-null expressions with the TypeScript API.

| File | Lines | Over 400 | `as` | `!` | Exports |
| --- | --- | --- | --- | --- | --- |
| `boot.ts` | 393 | false | 0 | 0 | 0 |
| `chat-navigation.ts` | 326 | false | 0 | 0 | 3 |
| `dom.ts` | 24 | false | 0 | 0 | 3 |
| `draft-sync.ts` | 239 | false | 0 | 0 | 3 |
| `motion.ts` | 353 | false | 0 | 0 | 1 |
| `request-runner.ts` | 377 | false | 0 | 0 | 4 |
| `shell-dom.ts` | 257 | false | 0 | 0 | 2 |
| `theme.ts` | 77 | false | 0 | 0 | 1 |

Whole `apps/web/src/browser/` area:

| Measure | Value |
| --- | --- |
| Files | 46 |
| Total lines | 7,878 |
| Files over 400 lines | `[]` |
| Functions over 80 lines | `[]` |
| Non-barrel files under 30 lines | `["apps/web/src/browser/dom.ts"]` |
| Type assertions | 0 |
| Non-null assertions | 0 |
| `*Service` symbols | 0 |

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed; the browser entry is still `lib/browser-types/boot.js` |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | no diagnostics |
| `npx biome format --write apps/web/src/browser/boot.ts apps/web/src/browser/shell-dom.ts apps/web/src/browser/draft-sync.ts apps/web/src/browser/chat-navigation.ts apps/web/src/browser/request-runner.ts` | `0` | `Formatted 5 files`; the final check reported `No fixes applied` |
| Step 6 AST sweep on `apps/web/src/browser/` | `0` | `over400: []`, `longFn: []`, `smallNonBarrel: ["apps/web/src/browser/dom.ts"]`, `asCount: 0`, `nonNullCount: 0`, `serviceCount: 0` |
| `corepack pnpm@11.28.5 test:tools-browser` | `0` | `# tests 14`, `# pass 14`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:local-web` | `0` | `# tests 8`, `# pass 8`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:browser-smoke` | `1` | `# tests 13`, `# pass 12`, `# fail 1`; the failure is `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides` with `Explicit continuation did not finish the remaining slides` |
| `node --test --test-name-pattern "Create deck UI collects" e2e/browser-smoke.test.mjs` on `96ab0a2` + `bf24935` with `boot.ts` and `layout.ts` restored from HEAD | `1` | The same test fails with the same message and the same `{"status":"Đang gửi","progress":"1/3 slide đã lưu · Chưa hoàn tất, không tự chạy tiếp"}` output |
| `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs` reported `0 error(s)` |

The `test:browser-smoke` failure is the same owner-accepted host-timing flake recorded in the Slice 2C exit gate report. It reproduces without the Task 38 changes, so this task neither causes nor fixes it.

## What the commands do not prove

- The browser smoke suite does not pass. The failing continuation test reproduces on the pre-task tree, so the suite does not prove that continuation works after this refactor; it only proves that the refactor adds no new failure.
- `test:tools-browser` and `test:local-web` exercise the Host and management routes, not the shell DOM, the draft timer, the search timer, or the request poll. Their pass does not prove the moved listeners and timers behave as before at runtime.
- `lint` and `check:boundaries` enforce static rules only. They do not prove that the moved UI strings, selectors, storage keys, or CSS blocks are unchanged; the diff of those moved blocks does.
- The AST sweep counts lines, function spans, type assertions, and non-null assertions. It does not prove declaration emit for the exported classes and option interfaces.
- `check:docs` checks the document structure, the purpose line, relative links, and citations. It does not check that this report still matches a later rescan of the folder.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 38 Plan](../plan/task-38-refactor-browser-boot-and-shell.md)
