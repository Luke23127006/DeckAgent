# Task 30: Browser Boot, Shell Utilities, and Transport Diagnosis Report

Read this file to review the deep-module diagnosis of `apps/web/src/browser/` root and `apps/web/src/browser/transport/` and the classified finding table for owner approval [[1]](#ref-1) [[2]](#ref-2).

## Scope and commands run

Task 30 made no changes to production code, test files, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `scripts/scan-module-design.mjs --json` + TypeScript AST non-null count | `0` | `fileCount: 14`, `totalLines: 3175`, `over400Count: 2`, `smallNonBarrelCount: 3`, `longFnTotal: 0`, `assertionTotal: 5`, `nonNullTotal: 7`, `serviceTotal: 0` |
| 2 | Export usage audit on `transport/index.ts` and root browser utilities | `0` | `entryCount: 5`, `transportExportCount: 15`, `LayoutSlots` (`0` prod / `0` tests), `imageFailure` (`0` tests) |
| 2b | Exact call-site and `browser-driver.mjs` consumer scan + co-change check | `0` | `coChangeCount: 0`. Five pass-through decoders in `transport/index.ts` have `0` external browser prod callers. `ManagementClient.draft` and `saveDraft` have `0` callers |
| 4 | `git status --short` | `0` | Zero changes under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` |

## File metrics summary

| File | Lines | Barrel | Exports | Functions over 80 lines | `as` count | `!` count | Role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/browser/boot.ts` | 1263 | No | 0 | 0 | 2 | 5 | Browser shell DOM, draft sync, chat switching, SSE request watching, confirmation, timers |
| `apps/web/src/browser/dom.ts` | 24 | No | 3 | 0 | 0 | 0 | Shared `element`, `button`, and `field` DOM builders |
| `apps/web/src/browser/layout.ts` | 16 | No | 1 | 0 | 0 | 0 | Unused `LayoutSlots` extension slot helper |
| `apps/web/src/browser/motion.ts` | 353 | No | 1 | 0 | 0 | 0 | `initMotion` DOM `MutationObserver` and `animejs` animation orchestrator |
| `apps/web/src/browser/theme.ts` | 77 | No | 1 | 0 | 0 | 0 | `themeControl` switch with View Transitions API and Host persistence rollback |
| `apps/web/src/browser/transport/index.ts` | 8 | Yes | 15 | 0 | 0 | 0 | Browser transport public barrel |
| `apps/web/src/browser/transport/bound-outline-decoder.ts` | 1 | Yes | 1 | 0 | 0 | 0 | One-line pass-through re-export of `decodeBoundProposal` |
| `apps/web/src/browser/transport/brief-client.ts` | 119 | No | 2 | 0 | 0 | 0 | `BriefClient` HTTP reads/saves, interview decode, and `decodeBriefView` pass-through |
| `apps/web/src/browser/transport/confirmation-client.ts` | 122 | No | 2 | 0 | 0 | 0 | `ConfirmationClient` deck confirmation POST and `decodeGeneration` pass-through |
| `apps/web/src/browser/transport/deck-client.ts` | 183 | No | 1 | 0 | 3 | 0 | `DeckClient` snapshot, slide HTML/provenance read, and `/deck/events` SSE |
| `apps/web/src/browser/transport/host-client.ts` | 309 | No | 5 | 0 | 0 | 0 | `HostClient`, `HostRequestError`, `isActive`, and pass-through decoders |
| `apps/web/src/browser/transport/image-review-client.ts` | 27 | No | 1 | 0 | 0 | 0 | Vietnamese `imageFailure` UI copy table (zero HTTP calls) |
| `apps/web/src/browser/transport/management-client.ts` | 564 | No | 2 | 0 | 0 | 1 | `ManagementClient` and `ManagementError` across 7 management domains |
| `apps/web/src/browser/transport/outline-client.ts` | 109 | No | 1 | 0 | 0 | 1 | `OutlineClient` snapshot fetch and outline invariant checks |

Why `boot.ts` reports `0` functions over 80 lines at `1263` lines: shell DOM setup, feature wiring, listeners, and timers run at module top level (`53-1263`). None of its nested helper functions exceeds 80 lines. Specifically, `follow` spans 72 lines (`578-650`), `controls` spans 69 lines (`402-470`), `submitRequest` spans 62 lines (`1035-1096`), and `open` spans 60 lines (`651-710`).

## Export audit

The Step 2 regex script counted occurrences inside `packages/host/contracts/` as `prod` and did not separate internal `transport/` imports from external callers. The tables below list exact external callers in `apps/web/src/browser/` and `apps/web/tests/` or `e2e/`.

### `apps/web/src/browser/transport/index.ts` (15 exports)

| Export | Kind | Source | Browser prod callers | Test callers (`apps/web/tests`, `e2e`) | Audit note |
| --- | --- | --- | --- | --- | --- |
| `HostClient` | class | `host-client.ts:151` | 1 (`boot.ts:19,54`) | 12 (`browser-driver.mjs:5` + 11 test files) | Keep |
| `HostRequestError` | class | `host-client.ts:99` | 1 (`boot.ts:20,626`) | 1 (`browser-driver.mjs:6` only) | Keep |
| `isActive` | function | `host-client.ts:57` | 2 (`boot.ts:23`, `conversation-view.ts:14`) | 1 (`browser-driver.mjs:11` only) | Keep |
| `decodeAttachment` | function | `host-client.ts:10` | 0 (internal `management-client.ts:1` imports `@deckagent/host-contracts`) | 0 (not in `browser-driver.mjs`) | Drop pass-through from `transport/index.ts` and `host-client.ts:10` |
| `requestEvent` | function | `host-client.ts:10` | 0 (internal `host-client.ts:292` only) | 1 (`browser-driver.mjs:12` re-exports, 0 test imports) | Drop pass-through from `transport/index.ts`, `host-client.ts:10`, and `browser-driver.mjs:12` |
| `ManagementClient` | class | `management-client.ts:210` | 5 (`boot.ts`, `theme.ts`, `settings-panel.ts`, `research-view.ts`, `workspace-view.ts`) | 5 (`browser-driver.mjs:7` + 4 test files) | Keep |
| `ManagementError` | class | `management-client.ts:148` | 2 (`settings-panel.ts:2`, `workspace-view.ts:3`) | 2 (`browser-driver.mjs:8` + `web-management.test.mjs`) | Keep |
| `DeckClient` | class | `deck-client.ts:25` | 3 (`boot.ts`, `deck-canvas.ts`, `deck-model.ts`) | 9 (`browser-driver.mjs:4` + 8 test files) | Keep |
| `OutlineClient` | class | `outline-client.ts:54` | 1 (`boot.ts:22,56`) | 6 (`browser-driver.mjs:9` + 5 test files) | Keep |
| `BriefClient` | class | `brief-client.ts:9` | 2 (`boot.ts:16,89`, `deck-workflow-view.ts:2`) | 7 (`browser-driver.mjs:2` + 6 test files) | Keep |
| `decodeBriefView` | function | `brief-client.ts:3` | 0 (internal `brief-client.ts:54,115` only) | 2 (`browser-driver.mjs:10` + `brief-client.test.mjs:4,67`) | Drop pass-through. Import directly from `@deckagent/host-contracts` in `brief-client.test.mjs` |
| `ConfirmationClient` | class | `confirmation-client.ts:43` | 1 (`boot.ts:17,86`) | 6 (`browser-driver.mjs:3` + 5 test files) | Keep |
| `decodeGeneration` | function | `confirmation-client.ts:2` | 0 (internal `deck-client.ts:2` imports `@deckagent/host-contracts`) | 0 (not in `browser-driver.mjs`) | Drop pass-through from `transport/index.ts` and `confirmation-client.ts:2` |
| `imageFailure` | function | `image-review-client.ts:1` | 1 (`features/deck/outline-view.ts:4,142,168,173`) | 0 | Move UI copy table to `features/deck/` and remove from `transport/` |
| `decodeBoundProposal` | function | `bound-outline-decoder.ts:1` | 0 (`outline-client.ts:1` imports `@deckagent/host-contracts`) | 0 | Remove `bound-outline-decoder.ts` and drop from `transport/index.ts` |

### Root utilities (`dom.ts`, `layout.ts`, `motion.ts`, `theme.ts`, 6 exports)

| File | Export | Browser prod callers | Test callers | Audit note |
| --- | --- | --- | --- | --- |
| `dom.ts` | `element` | 19 (`boot.ts`, `theme.ts`, and 6 feature folders) | 0 | Keep. Shared across shell and features |
| `dom.ts` | `button` | 15 (`boot.ts`, `theme.ts`, and 6 feature folders) | 0 (`button` HTML tag matched in 2 test files) | Keep. Shared across shell and features |
| `dom.ts` | `field` | 5 (`brief-view`, `outline-view`, `settings-panel`, `research-view`, `workspace-view`) | 0 (`field` property name matched in tests) | Keep. Shared across features |
| `layout.ts` | `LayoutSlots` | 0 | 0 | Unused dead class. Remove `layout.ts` |
| `motion.ts` | `initMotion` | 1 (`boot.ts:31,990`) | 0 | Keep. Hides `animejs` and `MutationObserver` state cleanly |
| `theme.ts` | `themeControl` | 1 (`boot.ts:30,897`) | 0 | Keep. Hides View Transitions API and `saveTheme` rollback |

## Deletion test audit

| Candidate | Lines | Effect of removal or folding | Verdict |
| --- | --- | --- | --- |
| `apps/web/src/browser/layout.ts` (`LayoutSlots`) | 16 | Zero callers exist across the repository. Removing it eliminates dead code with zero impact | Remove `layout.ts` |
| `apps/web/src/browser/transport/bound-outline-decoder.ts` (`decodeBoundProposal`) | 1 | `outline-client.ts:1` imports `decodeBoundProposal` from `@deckagent/host-contracts`. Zero external callers exist | Remove `bound-outline-decoder.ts` and drop export |
| `apps/web/src/browser/transport/image-review-client.ts` (`imageFailure`) | 27 | Performs zero HTTP calls. Holds Vietnamese UI copy used only by `features/deck/outline-view.ts` (`4,142,168,173`) | Move `imageFailure` into `features/deck/` and remove `image-review-client.ts` |
| `apps/web/src/browser/dom.ts` (`element`, `button`, `field`) | 24 | Imported by `boot.ts`, `theme.ts`, and 6 browser feature folders. Removing it duplicates `createElement` boilerplate across 19+ sites | Keep `dom.ts` as shared root utility |
| Duplicated JSON/auth fetch and SSE helpers across 6 transport clients | ~160 duplicated | Extracting private `transport/http.ts` removes 6 bearer/redirect/credentials blocks and 2 SSE parsers without changing any public client API | Optional internal deepening inside `transport/` |

## Type assertions and non-null assertions

### Type assertions (5)

| # | Location | Expression | Proposed replacement |
| --- | --- | --- | --- |
| 1 | `boot.ts:882` | `event.target as Node` | Bind `const target = event.target` and return unless `target instanceof Node` before `!accountMenu.contains(target)` |
| 2 | `boot.ts:883` | `event.target as Node` | Reuse the narrowed `target` local in `!accountTrigger.contains(target)` |
| 3 | `deck-client.ts:141` | `value.imageCredits as unknown` | Replace lines `98-117` and `140-142` with `decodeImageCredits(value.imageCredits)` returning a fresh `ImageCredit[]` |
| 4 | `deck-client.ts:141` | `... as readonly ImageCredit[]` | Eliminated by `decodeImageCredits(value.imageCredits)` |
| 5 | `deck-client.ts:143` | `value.imageOmissions as string[]` | Replace lines `118-122` and `143` with `decodeStringArray(value.imageOmissions)` returning `string[]` |

### Non-null assertions (7)

| # | Location | Expression | Proposed guard |
| --- | --- | --- | --- |
| 1 | `boot.ts:58` | `document.querySelector<HTMLElement>('#app')!` | Bind `const root = document.querySelector<HTMLElement>('#app')` and throw `APP_ROOT_MISSING` when null |
| 2 | `boot.ts:1071` | `draft!.revision` | Bind `const draftRevision = draft?.revision` and check `draftRevision !== undefined && (!continueDeck || draft?.text === text)` |
| 3 | `boot.ts:1071` | `draft!.attachmentIds ?? []` | Bind `const attachmentIds = draft?.attachmentIds ?? []` alongside `draftRevision` |
| 4 | `boot.ts:1075` | `draft!.revision! + 1` (outer) | Reuse `draftRevision + 1` inside `if (consumesDraft)` |
| 5 | `boot.ts:1075` | `draft!.revision! + 1` (inner) | Eliminated with #4 via `draftRevision + 1` |
| 6 | `management-client.ts:141` | `workspaceStatuses.find(...)!` | Bind `const folderStatus = workspaceStatuses.find(status => status === item.folderStatus)` and call `invalid()` when missing (drop line `133` `.some(...)`) |
| 7 | `outline-client.ts:87` | `proposals[index - 1]!.version` | Bind `const previous = index > 0 ? proposals[index - 1] : undefined` and check `previous !== undefined && p.version <= previous.version` |

## Proposed module splits

### `apps/web/src/browser/boot.ts` (1,263 lines)

`boot.ts` mixes 10 responsibilities in top-level scope:
- Client setup (`53-57`) and shell DOM construction (`58-86, 140-152, 739-745, 785-816, 838-928, 961-974, 986-995`)
- Feature UI wiring (`88-139, 175-183, 731-738, 776-780, 887-909, 963-967`) and draft/attachment sync (`195-391`)
- Shell control reconciliation (`402-537`) and chat navigation (`538-573, 651-730, 782-784`)
- SSE request watching (`153-174, 578-650`), submission (`975-1096`), confirmation (`929-936, 1097-1168`), and timers/lifecycle (`1169-1263`)

| Target file | Owned responsibility | Source line ranges | Target budget (lines) |
| --- | --- | --- | --- |
| `apps/web/src/browser/shell-dom.ts` | Build shell DOM regions, collapsible rail (`setNavigation`), mobile recents toggle, positioned `accountMenu`, search bar, and `ResizeObserver` | `58-86, 140-152, 175-179, 739-775, 785-886, 910-940, 961-995` | 220–260 |
| `apps/web/src/browser/draft-sync.ts` | Own `drafts`, `draftStates`, `draftWork`, `pendingDrafts`, `attachmentBusy`, debounced save/flush, upload/remove/preview dialog, focus sync, and `attachmentTimer` | `195-231, 251-391, 1191-1210, 1231-1249` | 180–220 |
| `apps/web/src/browser/chat-navigation.ts` | Own `refresh`, `showHistory`, `showActivities`, `showOutlines`, `open`, `newChat`, `renderModels`, `renderChats`, `chatButton`, `describeHistory`, and `switchingBlocked` | `240-249, 471-573, 651-730, 782-784` | 220–260 |
| `apps/web/src/browser/request-runner.ts` | Own `sendBlocked`, `follow` SSE loop, `stopRequest`, `submitRequest`, `confirmOutline`, `confirmTarget`, and 750ms active-request poll | `37-51, 153-174, 578-650, 929-936, 1035-1190` | 240–280 |
| `apps/web/src/browser/boot.ts` | Thin bootstrap entrypoint: read token, instantiate 6 clients and feature views, run `controls()`, attach `pagehide`/`pageshow`, and boot initial chat (`scripts/build-workspace.mjs:77` unchanged) | `1-36, 53-57, 87-139, 180-200, 392-470, 731-738, 887-909, 941-960, 996-1034, 1211-1263` | 220–280 |

### `apps/web/src/browser/transport/management-client.ts` (564 lines)

`management-client.ts` groups seven domain method families (`settings`/`research`/`preferences`, `sessions`, `drafts`, `attachments`, `workspaces`, `providers`, `activities`/`requests`). It also owns two fetch helpers (`216-238` and `364-381`), `ManagementError` (`148-207`), and inline response decoders (`18-145, 543-564`). Splitting `ManagementClient` into 5–6 public client classes would widen `transport/index.ts`, `boot.ts`, and 10+ tests without crossing a real boundary. Extracting private decoders and shared HTTP helpers keeps `ManagementClient` under 350 lines with zero caller churn.

| Target file | Owned responsibility | Source line ranges | Target budget (lines) |
| --- | --- | --- | --- |
| `apps/web/src/browser/transport/http.ts` | Internal bearer-auth `fetch` wrapper, JSON error parser (`allowedCodes` + `detail` + 401 mapping), and shared SSE frame reader (`HostClient` + `DeckClient`) | `management-client.ts:216-238, 364-381` (plus shared plumbing from sibling clients) | 90–120 |
| `apps/web/src/browser/transport/management-decoders.ts` | Internal response decoders (`settings`, `session`, `workspaceList`, `researchSources`, `activities`, `requests`, `decodeDraft`) | `18-145, 242-279, 295-314, 481-564` | 220–260 |
| `apps/web/src/browser/transport/management-client.ts` | Public `ManagementClient` facade and `ManagementError` | `147-215, 240-477` (minus moved decoders) | 220–280 |

## Deep-module diagnosis

### 1. Interface width

- `apps/web/src/browser/transport/index.ts` exports **15** symbols: **6** HTTP clients (`HostClient`, `ManagementClient`, `DeckClient`, `OutlineClient`, `BriefClient`, `ConfirmationClient` — constructed in `boot.ts` with `(location.origin, token)`), **2** errors, **1** status helper, **5** decoders, and **1** UI helper.
  - Error classes: `HostRequestError`, `ManagementError`. Status helper: `isActive`.
  - Pass-through decoders from `@deckagent/host-contracts`: `decodeAttachment`, `requestEvent`, `decodeBriefView`, `decodeGeneration`, `decodeBoundProposal`. UI copy helper: `imageFailure`.
- Root utilities (`dom.ts`, `layout.ts`, `motion.ts`, `theme.ts`) export **6** symbols: `element`, `button`, `field`, `LayoutSlots`, `initMotion`, and `themeControl`.
- Unused, pass-through, or misplaced exports:
  - **Unused (`0` prod, `0` tests):** `LayoutSlots` (`layout.ts:2`), `decodeBoundProposal` (`bound-outline-decoder.ts:1`), `decodeAttachment` (`host-client.ts:10`), `decodeGeneration` (`confirmation-client.ts:2`), and `requestEvent` (`host-client.ts:10`, re-exported by `browser-driver.mjs:12` with `0` test callers).
  - **Pass-through test leak (`0` prod, `1` test):** `decodeBriefView` (`brief-client.ts:3`) used only in `apps/web/tests/brief-client.test.mjs:67` via `browser-driver.mjs:10`.
  - **Misplaced UI copy table:** `imageFailure` (`image-review-client.ts:1`) imported only by `features/deck/outline-view.ts:4`.
  - **Unused methods inside `ManagementClient`:** `draft(id)` (`344-348`) and `saveDraft(id, text)` (`426-428`) have `0` callers across the repo.

### 2. Deletion test

- `layout.ts` (`16` lines): fails the deletion test. Zero callers exist, so removing it drops dead code.
- `transport/bound-outline-decoder.ts` (`1` line): fails the deletion test. `outline-client.ts:1` imports directly from `@deckagent/host-contracts`, so removing it drops a pure pass-through file.
- `transport/image-review-client.ts` (`27` lines): fails the deletion test inside `transport/`. Moving `imageFailure` into `apps/web/src/browser/features/deck/` places Vietnamese UI copy beside its sole consumer (`outline-view.ts`).
- `dom.ts` (`24` lines): passes the deletion test. Removing it duplicates `createElement` + `aria-label` wiring across `boot.ts`, `theme.ts`, and 6 browser features.
- Duplicated JSON/auth fetch helpers across the 6 transport clients: extracting internal `transport/http.ts` removes 6 `Bearer`/redirect/credentials blocks and 2 SSE parsers. All 6 domain client boundaries stay intact.

### 3. Locality

- **Scenario A (add one new HTTP management endpoint — request, response check, bearer auth error mapping — and show its state in the browser shell):**
  - **2 files** in scope change together: `transport/management-client.ts` (`allowedCodes` at `158-207`, new method and decoder inside `210-541`) and `boot.ts` (`refresh()` at `538-552`, `controls()` at `402-470`, shell DOM mounting at `58-183` and `841-995`). Notice `ManagementClient.request` (`216-238`) lacks a `response.status === 401` fallback when a response body omits `error.code`, unlike the other 5 clients.
- **Scenario B (add one new request stream event kind that updates both the active chat status and the deck workflow dock during an active run):**
  - **2 files** in scope plus **2 feature files** change:
    1. `transport/host-client.ts:262-308` (`watch` forwards `RequestEvent` checked by `@deckagent/host-contracts` `requestEvent`).
    2. `boot.ts:578-650` (`follow()` `event.kind` switch at `605-621` handles the new event kind and calls both `timeline` and `workflow`).
    3. `apps/web/src/browser/features/chats/conversation-view.ts` (consumer seam: updates active chat status in `ConversationView`).
    4. `apps/web/src/browser/features/deck/deck-workflow-view.ts` (consumer seam: exposes and updates workflow dock state during an active run).

### 4. Action classification and convention fit

Dependency categories follow `.agents/skills/codebase-design/DEEPENING.md` [[3]](#ref-3):

- **In-process:** `boot.ts` shell DOM/controls/draft state machine, `dom.ts`, `layout.ts`, `motion.ts`, `image-review-client.ts`, `bound-outline-decoder.ts`.
- **Remote but owned:** `HostClient`, `ManagementClient`, `DeckClient`, `OutlineClient`, `BriefClient`, `ConfirmationClient`, `theme.ts` (calls `ManagementClient.saveTheme`), and `boot.ts` HTTP/SSE orchestration against `@deckagent/host-api`.

Convention friction found in `docs/conventions/project-structure.md` (`### apps/web/` line 84) [[4]](#ref-4):

- Line 84 lists `error hiển thị cho Browser` under `src/browser/transport/` `Sở hữu`. Meanwhile, `docs/conventions/code.md` (`### Biểu diễn` line 94) assigns user-facing error text (`Thông báo lỗi hiển thị cho người dùng`) to `Browser` [[5]](#ref-5). That wording encouraged placing the Vietnamese UI copy table `imageFailure` inside `transport/image-review-client.ts`. Update line 84 so `src/browser/transport/` owns HTTP/SSE error mapping to typed client errors/codes (`HostRequestError`, `ManagementError`), and UI copy tables live in `src/browser/` or `src/browser/features/`.

## Classified findings and owner decisions

| ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| BB1 | `apps/web/src/browser/layout.ts:1-16` | Non-barrel file under 30 lines (16) and unused (`0` prod, `0` test callers) | In-process | `focused refactor (merge or remove)`: remove `layout.ts` | Zero caller impact | Approved for Revision 5b |
| BB2 | `apps/web/src/browser/transport/bound-outline-decoder.ts:1` | One-line pass-through wrapper (`0` external callers) | In-process | `focused refactor (merge or remove)`: remove `bound-outline-decoder.ts` and drop `decodeBoundProposal` from `transport/index.ts:8` | Zero caller impact (`outline-client.ts:1` imports `@deckagent/host-contracts`) | Approved for Revision 5b |
| BB3 | `apps/web/src/browser/transport/image-review-client.ts:1-27` | Non-barrel file under 30 lines (27) holding misplaced UI copy table (`imageFailure`) | In-process | `focused refactor (merge or remove)`: move `imageFailure` into `apps/web/src/browser/features/deck/`, remove `image-review-client.ts`, and drop `imageFailure` from `transport/index.ts:7` | Update 1 import in `apps/web/src/browser/features/deck/outline-view.ts:4` | Approved for Revision 5b |
| BB4 | `apps/web/src/browser/boot.ts:1-1263` | File over 400 lines (1,263) mixing 10 shell, draft, navigation, streaming, confirmation, and timer responsibilities | Remote but owned + In-process | `focused refactor (split responsibility or narrow export surface)`: extract `shell-dom.ts`, `draft-sync.ts`, `chat-navigation.ts`, and `request-runner.ts`, keeping `boot.ts` under 300 lines | Zero caller impact (`scripts/build-workspace.mjs:77` entry stays `lib/browser-types/boot.js`) | Approved for Revision 5b |
| BB5 | `apps/web/src/browser/transport/management-client.ts:1-564` | File over 400 lines (564) mixing 7 management endpoints, inline decoders, and duplicated fetch plumbing | Remote but owned | `focused refactor (split responsibility or narrow export surface)`: extract internal `management-decoders.ts` and shared `http.ts` so `management-client.ts` stays under 350 lines as one public facade | Zero external caller impact | Approved for Revision 5b |
| BB6 | `apps/web/src/browser/transport/index.ts:1-8` | Export surface leaks 5 pass-through `@deckagent/host-contracts` decoders (`decodeAttachment`, `requestEvent`, `decodeBriefView`, `decodeGeneration`, `decodeBoundProposal`) | In-process | `focused refactor (split responsibility or narrow export surface)`: drop pass-through exports from `transport/index.ts`, `host-client.ts:10`, `brief-client.ts:3`, `confirmation-client.ts:2`, and `browser-driver.mjs:10,12` | Update `apps/web/tests/brief-client.test.mjs:4,67` to import `decodeBriefView` from `@deckagent/host-contracts` | Approved for Revision 5b |
| BB7 | `apps/web/src/browser/boot.ts:58,882,883,1071,1075` | 2 `as` type assertions and 5 `!` non-null assertions forbidden by `docs/conventions/code.md` line 22 | In-process | `focused refactor (add boundary guard)`: add `#app` guard (`58`), `event.target instanceof Node` (`882-883`), and narrowed `draftRevision`/`attachmentIds` locals (`1071,1075`) | Zero caller impact | Approved for Revision 5b |
| BB8 | `apps/web/src/browser/transport/deck-client.ts:141,143`, `management-client.ts:141`, `outline-client.ts:87` | 3 `as` assertions (`deck-client.ts`) and 2 `!` assertions (`management-client.ts:141`, `outline-client.ts:87`) | Remote but owned | `focused refactor (add boundary guard)`: add `decodeImageCredits` and `decodeStringArray` in `deck-client.ts`, explicit `folderStatus` guard in `management-client.ts:141`, and `previous` guard in `outline-client.ts:87` | Zero caller impact | Approved for Revision 5b |
| BB9 | `docs/conventions/project-structure.md` (`### apps/web/` line 84) | `src/browser/transport/` wording (`error hiển thị cho Browser`) conflicts with `code.md` line 94 and caused misplaced UI copy (`image-review-client.ts`) | In-process | `convention update`: clarify `src/browser/transport/` maps HTTP/SSE errors to typed client codes/errors, while user-facing UI copy tables belong to `src/browser/` or `src/browser/features/` | Aligns conventions with `code.md` line 94 and `BB3` | Approved for Revision 5b |
| BB10 | `apps/web/src/browser/dom.ts:1-24` | Small non-barrel file (24 lines) shared across shell and 6 feature folders | In-process | `no action`: removing or folding `dom.ts` raises caller boilerplate across 19+ files and risks feature cycles | None | Approved |
| BB11 | `apps/web/src/browser/motion.ts:1-353`, `apps/web/src/browser/theme.ts:1-77` | Single-function boundaries hiding `animejs`/DOM observation (`motion.ts`) and View Transitions/`saveTheme` rollback (`theme.ts`) | In-process (`motion.ts`) + Remote but owned (`theme.ts`) | `no action`: each exposes 1 entrypoint and contains no assertions or long functions | None | Approved |
| BB12 | Six public client classes in `apps/web/src/browser/transport/` | Separate domain client classes (`HostClient`, `ManagementClient`, `DeckClient`, `OutlineClient`, `BriefClient`, `ConfirmationClient`) | Remote but owned | `no action` on merging the 6 public classes (merging widens feature-injected dependencies). Share private `http.ts` transport helpers internally under `BB5` | None | Approved |

## Items sent to the report

- **Unused `ManagementClient` methods (`management-client.ts:344-348, 426-428`):** `draft(id)` and `saveDraft(id, text)` have `0` callers across the repository (`boot.ts` uses `draftState` and `saveDraftState`). Owner must decide whether to remove them during the `BB5` refactor.
- **Inconsistent `401` handling in `ManagementClient` (`216-238, 364-381`):** Unlike the other five transport clients (which fall back to `AUTH_REQUIRED` on HTTP `401`), `ManagementClient` maps non-JSON `401` responses to `SETTINGS_REQUEST_FAILED`, and `attachmentRequest` drops `error.detail`.
- **Missing timeouts in `HostClient` and `ManagementClient`:** `BriefClient`, `ConfirmationClient`, `DeckClient`, and `OutlineClient` pass `AbortSignal.timeout(15000)`, while `HostClient` (non-SSE calls) and `ManagementClient` omit timeouts.

## What the commands do not prove

- Static AST inspection and symbol usage counts do not run `tsc -b`, browser bundle builds (`build-workspace.mjs`), or `e2e/browser-smoke.test.mjs`. They also do not run `browser-runtime.test.mjs`, `brief-client.test.mjs`, `deck-client.test.mjs`, `outline-client.test.mjs`, or `web-management.test.mjs` to prove behavioral parity.
- Regex usage counts in Step 2 matched text occurrences (`packages/host/contracts/` definitions and HTML element names) rather than resolved TypeScript bindings. Run `tsc -b` during Revision 5b before removing any export or method.

## References

1. <a id="ref-1"></a>[Task 30: Diagnose browser boot, shell utilities, and transport](../plan/task-30-diagnose-browser-boot-shell-and-transport.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
3. <a id="ref-3"></a>[Deepening](../../../../../.agents/skills/codebase-design/DEEPENING.md)
4. <a id="ref-4"></a>[Project Structure](../../../../conventions/project-structure.md)
5. <a id="ref-5"></a>[Coding Guidelines](../../../../conventions/code.md)
