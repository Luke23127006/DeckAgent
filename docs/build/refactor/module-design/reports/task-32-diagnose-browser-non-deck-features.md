# Task 32: Non-Deck Browser UI Features Diagnosis Report

Read this file to review the deep-module diagnosis of the six non-deck folders in `apps/web/src/browser/features/` and the classified finding table for owner approval [[1]](#ref-1) [[2]](#ref-2).

## Scope and commands run

Task 32 changed no production code, test files, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `scripts/scan-module-design.mjs --json` + TypeScript AST non-null count | `0` | `fileCount: 14`, `totalLines: 2206`, `over400Count: 2`, `longFnTotal: 5`, `assertionTotal: 1`, `nonNullTotal: 21`, `serviceTotal: 0` |
| 2 | Export usage audit across the 6 non-deck feature barrels | `0` | `barrelCount: 6`, `totalBarrelExports: 9`, every barrel export has `1` or `2` `prod` matches and `0` `tests` matches |
| 2b | Exact `rg` call-site verification excluding `lib/` and `node_modules/` | `0` | Found `1` prod caller for `8` barrel exports, `2` prod callers for `failureFeedback`, and `0` external callers for `4` internal exports (`attachmentReason`, `workspaceFailure`, `folderNotice`, `WorkspaceControls`) |
| 4 | `git status --short` | `0` | Zero changes under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` |

## File metrics summary

| File | Lines | Barrel | Exports | Functions over 80 lines | `as` count | `!` count | Role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/browser/features/attachments/index.ts` | 1 | Yes | 1 | 0 | 0 | 0 | Public barrel for draft attachment view |
| `apps/web/src/browser/features/attachments/attachment-view.ts` | 78 | No | 2 | 0 | 0 | 0 | `AttachmentDraftView` file picker, draft rows, and `attachmentReason` copy map |
| `apps/web/src/browser/features/chats/index.ts` | 1 | Yes | 1 | 0 | 0 | 0 | Public barrel for conversation timeline |
| `apps/web/src/browser/features/chats/conversation-view.ts` | 519 | No | 1 | 1 | 0 | 2 | `ConversationView` history, live request stream, approvals, activities, summary boundary, and outline dock |
| `apps/web/src/browser/features/chats/message-content.ts` | 104 | No | 1 | 0 | 0 | 12 | Text-only Markdown subset renderer (`messageContent`) |
| `apps/web/src/browser/features/providers/index.ts` | 2 | Yes | 2 | 0 | 0 | 0 | Public barrel for provider settings and model picker |
| `apps/web/src/browser/features/providers/model-picker.ts` | 172 | No | 1 | 1 | 1 | 1 | Accessible `modelPicker` popover over native `<select>` |
| `apps/web/src/browser/features/providers/settings-panel.ts` | 604 | No | 1 | 1 | 0 | 5 | `settingsPanel` popup and 3-step provider wizard modal |
| `apps/web/src/browser/features/requests/index.ts` | 1 | Yes | 3 | 0 | 0 | 0 | Public barrel for request status and failure copy |
| `apps/web/src/browser/features/requests/request-feedback.ts` | 279 | No | 3 | 0 | 0 | 0 | Request status labels, 68 `errors` entries, `failureFeedback`, `offersSettings`, and `requestFeedback` |
| `apps/web/src/browser/features/research/index.ts` | 1 | Yes | 1 | 0 | 0 | 0 | Public barrel for public research UI |
| `apps/web/src/browser/features/research/research-view.ts` | 158 | No | 1 | 1 | 0 | 0 | Per-chat research toggle, Tavily key settings modal, and saved receipt viewer |
| `apps/web/src/browser/features/workspaces/index.ts` | 1 | Yes | 1 | 0 | 0 | 0 | Public barrel for workspace controls |
| `apps/web/src/browser/features/workspaces/workspace-view.ts` | 285 | No | 4 | 1 | 0 | 1 | Workspace selector, add/rename/relink/remove modal, folder notices, and inline styles |

## Export audit

All 9 barrel exports across the 6 feature folders have production callers in `apps/web/src/browser/boot.ts` or `apps/web/src/browser/features/chats/conversation-view.ts`, with `0` test callers.

### Barrel exports across 6 folders (9 exports)

| Barrel | Export | Kind | Source | Prod callers outside folder | Test callers | Audit note |
| --- | --- | --- | --- | --- | --- | --- |
| `attachments/index.ts` | `AttachmentDraftView` | class | `attachment-view.ts:19` | 1 (`boot.ts:33,199,963`) | 0 | Keep |
| `chats/index.ts` | `ConversationView` | class | `conversation-view.ts:82` | 1 (`boot.ts:28,106`) | 0 | Keep |
| `providers/index.ts` | `modelPicker` | function | `model-picker.ts:5` | 1 (`boot.ts:26,776`) | 0 | Keep |
| `providers/index.ts` | `settingsPanel` | function | `settings-panel.ts:6` | 1 (`boot.ts:26,731`) | 0 | Keep |
| `requests/index.ts` | `failureFeedback` | function | `request-feedback.ts:229` | 2 (`boot.ts:29,39,397`, `conversation-view.ts:15,275`) | 0 | Keep |
| `requests/index.ts` | `offersSettings` | function | `request-feedback.ts:239` | 1 (`conversation-view.ts:15,303`) | 0 | Keep |
| `requests/index.ts` | `requestFeedback` | function | `request-feedback.ts:244` | 1 (`conversation-view.ts:15,272`) | 0 | Keep |
| `research/index.ts` | `researchView` | function | `research-view.ts:15` | 1 (`boot.ts:34,200,888`) | 0 | Keep |
| `workspaces/index.ts` | `workspaceView` | function | `workspace-view.ts:67` | 1 (`boot.ts:32,732`) | 0 | Keep |

### Internal non-barrel exports (5 exports)

| File | Export | Kind | Callers outside declaring file | Self calls | Audit note |
| --- | --- | --- | --- | --- | --- |
| `attachments/attachment-view.ts:14` | `attachmentReason` | function | 0 | 1 (`attachment-view.ts:57`) | Drop `export` modifier |
| `chats/message-content.ts:40` | `messageContent` | function | 1 (`chats/conversation-view.ts:13,293,431`) | 0 | Keep as folder-internal module export |
| `workspaces/workspace-view.ts:15` | `workspaceFailure` | function | 0 | 1 (`workspace-view.ts:166`) | Drop `export` modifier |
| `workspaces/workspace-view.ts:49` | `folderNotice` | function | 0 | 1 (`workspace-view.ts:131`) | Drop `export` modifier |
| `workspaces/workspace-view.ts:57` | `WorkspaceControls` | interface | 0 | 1 (`workspace-view.ts:71` return type) | Inline return type on `workspaceView` and remove export |

## Type assertions and non-null assertions

The scope holds `1` non-`as const` type assertion and `21` non-null assertions. Two `as const` literals in `settings-panel.ts:46,236` comply with Coding Guidelines [[3]](#ref-3).

| # | Kind | Location | Expression | Proposed guard |
| --- | --- | --- | --- | --- |
| 1 | `as` | `model-picker.ts:129` | `document.activeElement as HTMLButtonElement` | Bind `const activeEl = document.activeElement` and check `if (!(activeEl instanceof HTMLButtonElement)) return` before `items.indexOf(activeEl)` |
| 2 | `!` | `model-picker.ts:156` | `select.selectedOptions[0]!.textContent` | Bind `const selectedOption = select.selectedOptions[0]` and read `selectedOption.textContent ?? 'Chọn model'` when `selectedOption?.value` is truthy |
| 3 | `!` | `settings-panel.ts:251` | `value!.id` | Check `const isBuiltIn = value !== undefined && builtIns.some(template => template.id === value.id)` and assign `isBuiltIn ? value.id : ''` |
| 4 | `!` | `settings-panel.ts:538` | `connection.querySelector('h3')!.textContent` | Keep the direct `connectionHeading` reference from `settings-dom.ts` instead of querying `connection` |
| 5 | `!` | `settings-panel.ts:539` | `modelSection.querySelector('h3')!.textContent` | Keep the direct `modelHeading` reference from `settings-dom.ts` instead of querying `modelSection` |
| 6 | `!` | `settings-panel.ts:577` | `labels[span.textContent ?? '']!` | Replace post-hoc label loop with a `localizedField(ariaLabel, visibleLabel, input)` helper inside `settings-dom.ts` |
| 7 | `!` | `settings-panel.ts:579` | `credentials.querySelector('p')!.textContent` | Set the Vietnamese `<p>` copy directly when building `credentials` in `settings-dom.ts` |
| 8 | `!` | `conversation-view.ts:486` | `this.rows.get(ids.at(-1)!)` | Bind `const lastId = ids.at(-1)` and check `lastId === undefined ? undefined : this.rows.get(lastId)` |
| 9 | `!` | `conversation-view.ts:516` | `this.container.lastElementChild!.remove()` | Guard loop with `const tail = this.container.lastElementChild` and `if (!tail) break` |
| 10 | `!` | `message-content.ts:45` | `lines[index++]!` | Bind `const line = lines[index++]` and `if (line === undefined) break` |
| 11 | `!` | `message-content.ts:51` | `lines[index++]!` | Bind `const next = lines[index++]` and `if (next === undefined) break` |
| 12 | `!` | `message-content.ts:55` | `closing[1]![0]` | Extract typed `parseFence(line)` returning `{ marker: string } \| null` |
| 13 | `!` | `message-content.ts:55` | `code[1]![0]` | Eliminated by `parseFence(line)` returning `{ marker: string } \| null` |
| 14 | `!` | `message-content.ts:56` | `closing[1]!.length` | Eliminated by `parseFence(line)` using `closing.marker.length` |
| 15 | `!` | `message-content.ts:56` | `code[1]!.length` | Eliminated by `parseFence(line)` using `code.marker.length` |
| 16 | `!` | `message-content.ts:69` | `title[1]!.length` | Extract typed `parseHeading(line)` returning `{ level: number; text: string } \| null` |
| 17 | `!` | `message-content.ts:70` | `title[2]!` | Eliminated by `parseHeading(line)` using `title.text` |
| 18 | `!` | `message-content.ts:78` | `item[2]!` | Extract typed `parseListItem(line)` returning `{ ordered: boolean; start?: string; text: string } \| null` |
| 19 | `!` | `message-content.ts:82` | `current[3]!` | Eliminated by `parseListItem(line)` using `current.text` |
| 20 | `!` | `message-content.ts:84` | `listItem(lines[index]!)` | Bind `const peek = lines[index]` and evaluate `peek !== undefined ? parseListItem(peek) : null` |
| 21 | `!` | `message-content.ts:94` | `lines[index]!` | Bind `const next = lines[index]` and guard `next === undefined` before checking `!next.trim()` |
| 22 | `!` | `workspace-view.ts:80` | `selected.folder!` | Bind `const folder = selected?.folder` before `if (selected && folder)` so closure captures narrowed `string` |

## Long-function split map

Five functions across five files exceed 80 lines. Inspection of `settings-panel.ts` (`604` lines) showed that it holds no research settings tabs (which live in `research-view.ts`) and no separate client-side key test endpoint (`client.save` runs server-side key verification).

### `apps/web/src/browser/features/providers/settings-panel.ts` (604 lines) and `model-picker.ts` (172 lines)

`settingsPanel` (`6-604`, `599` lines) mixes modal shell setup, dead DOM construction (`381,477-478` and `394-402,456-465`), provider CRUD, model catalog discovery, error copy mapping (`saveFailure`), and 3-step wizard state. `modelPicker` (`5-172`, `168` lines) mixes popover DOM construction, tab/option rendering, and keyboard/pointer listeners.

| Target file | Extracted function or module | Owned responsibility and source ranges | Target budget (lines) |
| --- | --- | --- | --- |
| `apps/web/src/browser/features/providers/provider-errors.ts` | `saveFailure` | Map `ManagementError` codes (`PROVIDER_*`, `CREDENTIAL_*`, `AUTH_REQUIRED`, `CATALOG_UNAVAILABLE`) to Vietnamese messages (`260-293`) | 40–50 |
| `apps/web/src/browser/features/providers/settings-dom.ts` | `createSettingsDom` + `localizedField` | Build dialog shell, `providerStep`, `connection`, `credentials`, `modelSection`, `footer`, and `nav` with direct heading refs and English `aria-label` plus Vietnamese `<span>` labels (`12-62, 373-406, 451-512, 563-583`, dropping dead `381,477-478` and `394-402`) | 140–170 |
| `apps/web/src/browser/features/providers/provider-model-draft.ts` | `createModelDraftController` | Own `loadCatalog`, `addCatalog`, `addManualModel`, `renderModels`, and model list parsing (`63-87, 407-450`) | 75–95 |
| `apps/web/src/browser/features/providers/settings-panel.ts` | `settingsPanel` + file-local `fill`, `refresh`, `perform`, `renderStep`, `requestClose` | Wire `ManagementClient` CRUD, `canDiscard`, submit handler, wizard transitions, and scrim/cancel close (`6-11, 98-258, 294-372, 513-561, 584-603`) | 220–260 |
| `apps/web/src/browser/features/providers/model-picker.ts` | `createPickerDom`, `renderPickerOptions`, `attachPickerEvents` | Split DOM setup (`6-43`), tab/option rendering (`60-100`), and keyboard/pointer/resize listeners (`101-144`) from `modelPicker` (`5-172`) | 165–185 |

### `apps/web/src/browser/features/chats/conversation-view.ts` (519 lines)

`ConversationView.updateRequest` (`266-358`, `93` lines) mixes status/diagnostic/live-reply updates, retry/settings action reconciliation, and tool/model activity row rendering. Moving `RequestRow` creation and updates into an internal sibling file drops `conversation-view.ts` below 400 lines.

| Target file | Extracted function or module | Owned responsibility and source ranges | Target budget (lines) |
| --- | --- | --- | --- |
| `apps/web/src/browser/features/chats/request-row.ts` | `RequestRow`, `createRequestRow`, `updateRequestActions`, `updateRequestActivities`, `updateApprovalCard`, `updateRequestRow` | Own `outcomes` and `activityNames` tables (`23-55`), `RequestRow` DOM (`207-256`), request state/feedback/actions/activities (`258-358`), and approval cards (`360-402`) | 210–250 |
| `apps/web/src/browser/features/chats/conversation-view.ts` | `ConversationView` | Own history, request/activity/outline caches, `message()` with attachment badges, `boundary()`, `render()`, and DOM child reconciliation (`82-205, 404-519`) | 260–290 |

### `apps/web/src/browser/features/workspaces/workspace-view.ts` (285 lines) and `research/research-view.ts` (158 lines)

`workspaceView` (`67-285`, `219` lines) mixes DOM/style construction, list rendering, async command error handling, and 3-mode dialog setup. `researchView` (`15-158`, `144` lines) mixes composer toggle wiring, key settings modal actions, and saved source receipt rendering.

| Target file | Extracted helpers (file-local) | Owned responsibility and source ranges | Target budget (lines) |
| --- | --- | --- | --- |
| `apps/web/src/browser/features/workspaces/workspace-view.ts` | `createWorkspaceDom`, `renderWorkspaceList`, `runWorkspaceChange`, `openWorkspaceDialog` | Separate container/dialog/style DOM (`72-106, 254-273`), option/notice rendering (`112-135`), async `change` error/refresh wrapper (`146-180`), and `add`/`rename`/`relink` dialog mode setup (`181-201`), leaving `workspaceView` under 70 lines | 280–300 |
| `apps/web/src/browser/features/research/research-view.ts` | `createResearchDialog`, `renderResearchSources`, `createResearchControls` | Separate dialog DOM/actions/cancel-close listeners (`36-45, 67-112`), saved source receipt rendering (`118-139`), and composer checkbox/info setup (`21-35, 113-117`), leaving `researchView` under 65 lines | 155–175 |

## Deep-module diagnosis

### 1. Interface width

- The 6 feature barrels export **9** symbols total (`attachments`: `1`, `chats`: `1`, `providers`: `2`, `requests`: `3`, `research`: `1`, `workspaces`: `1`). All 9 have production callers (`boot.ts` uses `8`, `conversation-view.ts` uses `3`), with `0` dead or test-only barrel exports.
- Four internal exports never leave their folder (`attachmentReason` at `attachment-view.ts:14`, `workspaceFailure` at `workspace-view.ts:15`, `folderNotice` at `workspace-view.ts:49`, `WorkspaceControls` at `workspace-view.ts:57`). Inside `chats/`, only `conversation-view.ts:13` imports `messageContent` (`message-content.ts:40`).
- Cross-feature browser dependencies are minimal and acyclic: `chats/conversation-view.ts` imports `OutlineView` and `OutlineAction` from `../deck/index.ts` (`11-12`), plus `failureFeedback`, `offersSettings`, and `requestFeedback` from `../requests/index.ts` (`15`). `conversation-view.ts`, `settings-panel.ts`, `research-view.ts`, and `workspace-view.ts` import `../../transport/index.ts`.

### 2. Deletion test

- **4 unused internal exports (`attachmentReason`, `workspaceFailure`, `folderNotice`, `WorkspaceControls`):** Fail the deletion test as exports. Removing `export` (and inlining the return type of `workspaceView`) narrows file exports with zero caller impact.
- **Dead DOM construction in `settings-panel.ts` (`381,477-478` and `394-402,456-465`):** Fails the deletion test. `381` appends `field('Provider type', kind)` to `connection`, then `477-478` removes it. `394-402` appends English children to `modelSection`, then `456-465` replaces all children. Removing the overwritten lines simplifies setup without changing DOM output.
- **Repeated dialog/busy patterns across `settings-panel.ts`, `research-view.ts`, and `workspace-view.ts`:** Pass the deletion test against merging into a shared `DialogShell`. `settings-panel.ts` owns `canDiscard()` unsaved checks, scrim clicks, and 3 wizard steps. `research-view.ts` shares one `perform` across key settings and receipt fetches. `workspace-view.ts` switches `add`/`rename`/`relink` modes and routes errors to inline or modal alerts. A shared wrapper across these three features would create a shallow abstraction with parameterized hooks, conflicting with Coding Guidelines [[3]](#ref-3).
- **`offersSettings` (`request-feedback.ts:239-241`) and 6 feature barrels (`index.ts`):** Pass the deletion test. Removing `offersSettings` pushes the `/cài đặt model/i` check into `conversation-view.ts:303`, leaking `request-feedback.ts` copy rules across features. Removing the 1–2 line barrels violates `check:boundaries` (`browser-feature-private-import`) [[4]](#ref-4).

### 3. Locality

- **Scenario A (add one new provider connection field in settings and check it before saving):**
  - **1 file** in scope changes: `apps/web/src/browser/features/providers/settings-panel.ts` (outside scope, `@deckagent/host-contracts` and `transport/management-client.ts` change to send and type the field).
  - Inside `settings-panel.ts`, 6 ranges change together: field creation (`26-62`), `snapshot()` (`107-117`), `fill()` (`124-160`), `form` submit (`321-364`), `connection` assembly (`378-386`) and `renderStep()` (`532-561`), plus `labels` (`563-578`). Extracting `settings-dom.ts` concentrates DOM and label wiring into one module.
- **Scenario B (add one new request failure code with Vietnamese user copy and a button that opens Settings):**
  - **1 file** in scope changes: `apps/web/src/browser/features/requests/request-feedback.ts` (`errors` table at `3-226`).
  - Neither `conversation-view.ts` (`272, 275, 303-304`) nor `boot.ts` (`39, 397`) changes, because `ConversationView.updateRequest` checks `offersSettings(errorCode)`. However, `offersSettings` (`239-241`) relies on matching `/cài đặt model/i` inside the Vietnamese `detail` string, so rephrasing `detail` without `'Cài đặt model'` would silently hide the button.

### 4. Action classification and convention fit

Dependency categories follow Deepening [[5]](#ref-5):

- **In-process:** `attachment-view.ts`, `message-content.ts`, `conversation-view.ts` (DOM/history/request-row reconciliation), `model-picker.ts`, `request-feedback.ts`, `settings-panel.ts` (DOM/draft/wizard state), `research-view.ts` (choice map/DOM), `workspace-view.ts` (DOM/notice/dialog state).
- **Remote but owned:** `settings-panel.ts` (`ManagementClient.settings`, `save`, `remove`, `catalog`), `research-view.ts` (`ManagementClient.saveResearch`, `removeResearch`, `researchSources`), `workspace-view.ts` (`ManagementClient` workspace CRUD), plus `conversation-view.ts` remote action hooks (`approve`, `previewOutlineImage`) wired by `boot.ts`.

Convention fit against Project Structure [[4]](#ref-4) and Coding Guidelines [[3]](#ref-3):

- No convention in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper or awkward ownership across these six features.
- Unlike `transport/image-review-client.ts` (addressed in Task 30 `BB9`), `requests/request-feedback.ts` and `workspaces/workspace-view.ts` already keep user-facing Vietnamese error tables inside `browser/features/`, matching `docs/conventions/code.md` (`### Biểu diễn` line 94).
- Removing the 4 unused internal exports and all `1` `as` and `21` `!` assertions directly enforces `docs/conventions/code.md` (`## TypeScript` line 22) and `docs/conventions/project-structure.md` (`### Package và feature` lines 139, 142).

## Classified findings and owner decisions

| ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| BF1 | `apps/web/src/browser/features/providers/settings-panel.ts:1-604` | File over 400 lines (`604`), 1 function over 80 lines (`settingsPanel` `6-604`), and dead DOM construction (`381,477-478`, `394-402,456-465`) | Remote but owned + In-process | `focused refactor (split responsibility or narrow export surface)`: extract `provider-errors.ts`, `settings-dom.ts`, and `provider-model-draft.ts`, drop overwritten DOM lines, and keep `settings-panel.ts` under 280 lines with all functions under 80 lines | Zero external caller impact (`settingsPanel` signature unchanged) | Approved for Revision 5b |
| BF2 | `apps/web/src/browser/features/providers/model-picker.ts:5-172` | Function over 80 lines (`modelPicker` `5-172`, `168` lines) mixing DOM setup, option rendering, and listeners | In-process | `focused refactor (split responsibility or narrow export surface)`: extract file-local `createPickerDom`, `renderPickerOptions`, and `attachPickerEvents` inside `model-picker.ts` | Zero caller impact | Approved for Revision 5b |
| BF3 | `apps/web/src/browser/features/chats/conversation-view.ts:1-519` | File over 400 lines (`519`) and 1 function over 80 lines (`ConversationView.updateRequest` `266-358`, `93` lines) | In-process | `focused refactor (split responsibility or narrow export surface)`: extract internal `request-row.ts` (`RequestRow`, actions, activities, approval cards) so `conversation-view.ts` stays under 300 lines and all functions stay under 80 lines | Zero external caller impact (`ConversationView` API unchanged) | Approved for Revision 5b |
| BF4 | `apps/web/src/browser/features/workspaces/workspace-view.ts:67-285`, `research/research-view.ts:15-158` | Two functions over 80 lines (`workspaceView` `219` lines, `researchView` `144` lines) mixing DOM, async locking, and modal flows | Remote but owned + In-process | `focused refactor (split responsibility or narrow export surface)`: extract file-local helpers inside `workspace-view.ts` (`createWorkspaceDom`, `renderWorkspaceList`, `runWorkspaceChange`, `openWorkspaceDialog`) and `research-view.ts` (`createResearchDialog`, `renderResearchSources`, `createResearchControls`) under 80 lines | Zero caller impact | Approved for Revision 5b |
| BF5 | `attachments/attachment-view.ts:14`, `workspaces/workspace-view.ts:15,49,57` | Four internal exports never leave their folder (`attachmentReason`, `workspaceFailure`, `folderNotice`, `WorkspaceControls`) | In-process | `focused refactor (merge or remove)`: remove `export` from `attachmentReason`, `workspaceFailure`, and `folderNotice`, and inline the return type on `workspaceView` instead of exporting `WorkspaceControls` | Zero caller impact (barrels export only `AttachmentDraftView` and `workspaceView`) | Approved for Revision 5b |
| BF6 | `model-picker.ts:129,156`, `settings-panel.ts:251,538,539,577,579`, `workspace-view.ts:80` | 1 non-`as const` type assertion (`model-picker.ts:129`) and 7 `!` assertions forbidden by `docs/conventions/code.md` line 22 | In-process | `focused refactor (add boundary guard)`: add `instanceof HTMLButtonElement` (`129`), `selectedOptions[0]` local (`156`), `value !== undefined` (`251`), direct DOM refs (`538,539,577,579`), and `const folder = selected?.folder` (`80`) | Zero caller impact | Approved for Revision 5b |
| BF7 | `conversation-view.ts:486,516`, `message-content.ts:45,51,55,56,69,70,78,82,84,94` | 14 `!` assertions (`2` in `conversation-view.ts`, `12` in `message-content.ts`) forbidden by `docs/conventions/code.md` line 22 | In-process | `focused refactor (add boundary guard)`: bind `lastId` (`486`) and check `lastElementChild` (`516`) in `conversation-view.ts`, and add typed `parseFence`, `parseHeading`, `parseListItem`, and `lines[index]` guards in `message-content.ts` | Zero caller impact | Approved for Revision 5b |
| BF8 | `request-feedback.ts`, `attachment-view.ts`, `message-content.ts`, 6 `index.ts` barrels, 3 feature dialogs | Real UI invariants (`68` error entries, safe Markdown subset, draft row copy), boundary-enforced barrels, and distinct feature modal workflows | In-process | `no action`: folding core feature modules widens `boot.ts` and `conversation-view.ts`, and sharing a generic `DialogShell` across `providers`, `research`, and `workspaces` creates a shallow abstraction | None | Approved |

## Items sent to the report

- **Scope clarifications in `settings-panel.ts`:** `settings-panel.ts` has no research settings tab (handled in `research-view.ts`) and no standalone client-side key test UI (key checks happen inside `client.save`).
- **Fragile string match in `offersSettings` (`request-feedback.ts:239-241`):** `offersSettings` checks `/cài đặt model/i` against `failureFeedback(code).detail`. Owner approved replacing that regex with an explicit flag in `errors` during Revision 5b without changing behavior, keeping `RESEARCH_KEY_UNAVAILABLE` and `RESEARCH_KEY_REJECTED` (`Cài đặt tìm kiếm`) excluded.
- **Distinct attachment error tables:** `attachment-view.ts:4-12` (`reasons`) maps compact per-row draft rejections, while `request-feedback.ts:88-99` maps request-level failures for overlapping codes (`ATTACHMENT_*`, `PARSING_LIMIT_EXCEEDED`, `UPLOAD_CANCELLED`, `HOST_BUSY`). Both tables earn their keep for separate UI surfaces, though new attachment codes must update both.
- **Inline `<style>` block in `workspace-view.ts:257-273`:** `workspace-view.ts` injects global CSS classes (`.workspace-controls`, `.chat-group-heading`, `.chat-search`, `.requests-unavailable`) dynamically inside `workspaceView`. Keeping it in `createWorkspaceDom` preserves behavior while keeping `workspaceView` short.
- **Retained `as const` literals:** `settings-panel.ts:46,236` keep two `as const` expressions allowed by Coding Guidelines [[3]](#ref-3).

## What the commands do not prove

- Static AST inspection and symbol counts do not run `apps/web/tests/web-management.test.mjs`, `e2e/local-web.test.mjs`, or `e2e/browser-smoke.test.mjs`. They do not prove behavioral parity after a refactor.
- Symbol searches outside `lib/` do not run `tsc -b` or `check:boundaries` to check declaration emit after dropping `WorkspaceControls` or splitting internal modules.

## References

1. <a id="ref-1"></a>[Task 32: Diagnose non-deck browser UI features](../plan/task-32-diagnose-browser-non-deck-features.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../../conventions/code.md)
4. <a id="ref-4"></a>[Project Structure](../../../../conventions/project-structure.md)
5. <a id="ref-5"></a>[Deepening](../../../../../.agents/skills/codebase-design/DEEPENING.md)
