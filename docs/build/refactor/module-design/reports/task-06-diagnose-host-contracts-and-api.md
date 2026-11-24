# Task 6: Host Contracts and Host API Diagnosis Report

Read this file to review the read-only deep-module diagnosis of `packages/host/contracts/` and `packages/host/api/`, the classified findings, and the owner decisions that Revision 2b uses [[1]](#ref-1) [[2]](#ref-2).

## Scope and commands run

Task 6 changed no source, test, or convention file. Only the checkboxes of the task file changed. The three `node -e` commands of the task were run as scratch scripts because of bash escaping. The logic is identical.

| Step | Command | Exit code | Result |
| --- | --- | --- | --- |
| 1 | File, line, and importer measurement over `scripts/scan-module-design.mjs --json` | `0` | `fileCount` 15, `totalLines` 3067. Importers: 28 files of `@deckagent/host-contracts`, 24 files of `@deckagent/host-api` |
| 2 | Symbol usage of every `host-contracts` root export | `0` | `exportCount` 65 |
| 3 | Symbol usage of every `host-api` root export | `0` | `exportCount` 56 |
| 5 | `git status --short` | `0` | Only the task file was modified |

## Export audit

**`@deckagent/host-contracts` (65 exports: 8 runtime, 57 type)**

- 18 exports with no production importer by name: `ArtifactDescriptor`, `ContentOrigin`, `SlideDocument`, `CatalogRef`, `DesignSnapshot`, `InterviewTopic`, `ThemeValues`, `ContentBlock`, `DeckSlide`, `GenerationSnapshot`, `ImageAttempt`, `ImageSelection`, `ImageSourceCheck`, `LayoutIssue`, `OutlineChanges`, `OutlineImageReview`, `OutlineTarget`, `WebImageIntent`. Most are nested parts of a parent type that callers do use.
- 5 exports used only by `host-api`: `BriefSnapshot`, `WorkspaceFolderStatus`, `ActivityStatus`, `RequestEventBody`, `TerminalStatus`.
- 16 exports used only by the browser: `decodeArtifactDescriptor`, `decodeContentOrigins`, `decodeSlideDocument`, `decodeAttachment`, `decodeBoundProposal`, `decodeBriefView`, `decodeGeneration`, `requestEvent`, and 8 DTO types.

**`@deckagent/host-api` (56 exports)**

- 18 types declared by `host-api`, 32 pass-through type re-exports (26 from `host-contracts`, 4 from `@deckagent/deck`, 2 from `session-persistence`), and 6 other exports (`HttpErrorDetail`, `HttpError`, `RequestController`, `RequestFailure`, `requestTextLimit`, `startHost`).
- 21 exports with no production importer: `DeckRequest`, `BriefRecord`, `BriefSnapshot`, `ApprovalStep`, `ApprovalView`, `ToolContext`, `ActivityStatus`, `HistoryMessage`, `HostOptions`, `RequestEvent`, `RequestEventBody`, `RequestStatus`, `StoredActivity`, `StoredRequest`, `WebPreferences`, `WebSession`, `WorkspaceFolderStatus`, `WorkspaceList`, `WorkspaceView`, `RequestController`, `requestTextLimit`.
- `RequestController` is imported only by the package's own test `packages/host/api/tests/request-failure.test.mjs`. `requestTextLimit` has no importer outside `packages/host/api/src/index.ts` (line 69).

## Four deep-module answers

1. **Interface width.** A `host-contracts` caller sees 8 functions and 57 types. A `host-api` caller sees 56 symbols, and 32 of them only forward other packages' types. `BriefDraft`, `BriefRecord`, `BriefSnapshot`, `BriefSourceRef`, `DeckChange`, `OutlineProposal`, and `OutlineSnapshot` exist in both `host-contracts` and `@deckagent/deck`. `host-api` publishes the `deck` copy of the brief types (`packages/host/api/src/contracts.ts` line 19) while `BriefView` uses the `host-contracts` copy.
2. **Deletion test.**

   | File | Result |
   | --- | --- |
   | `http-error.ts` (12 lines) | Keep. Four files in the package and two web files use it. Deletion creates an import cycle between `index.ts`, `multipart.ts`, and `deck-routes.ts` |
   | `request-failure.ts` (6 lines) | Keep. It is the HTTP-independent error of Request Lifecycle (`docs/conventions/project-structure.md` line 108) and has its own test |
   | `deck-routes.ts` (45 lines) | Keep, but connect it. Folding it into `index.ts` moves 45 lines into the 349-line `route` function. It repeats the SSE pattern of `index.ts` lines 582-634 (64-stream cap, 15000 ms heartbeat, `x-accel-buffering` header) |
   | `tool-contracts.ts` (44 lines) | Keep the declarations. Lines 2-3 (`ApprovalView`, `ApprovalStep` re-exports) can be deleted |
   | `brief-validation.ts` (111 lines) | Keep. One caller, but it uses zod while `validation.ts` uses hand-written checks |

3. **Locality.**
   - Scenario A (optional boolean on a chat request): 2 files. `packages/host/contracts/src/requests.ts` lines 9-18 and `packages/host/api/src/index.ts` lines 107-113 and 214-222. The request decoder lives in `host-api`, while response decoders live in `host-contracts`.
   - Scenario B (new endpoint for an existing management feature): 2 to 4 files. `packages/host/api/src/contracts.ts` lines 182-211, the `route` function in `packages/host/api/src/index.ts` lines 439-553, and, when a new DTO is needed, `management.ts`, `index.ts` of `host-contracts`, and the re-export list at `host-api` `index.ts` lines 12-61.
   - Co-change `contracts.ts <-> index.ts` (18 commits) and `contracts.ts <-> request-controller.ts` (11 commits): inferred from code structure, not from commit diffs. Each new type in `contracts.ts` must be listed again in `index.ts` lines 12-61. `index.ts <-> request-controller.ts` (12 commits): `body()` builds the `AgentRequest` for the controller, and the SSE code uses `controller.subscribe` and `controller.events`.
4. **Action classification and convention fit.** See the finding table. `request-controller.ts` contains no HTTP keyword or status code (grep result: 0 matches). `contracts.ts` mixes lifecycle ports with transport ports and imports `HttpErrorDetail` (line 49). `WebManagement`, `BriefManagement`, `AttachmentManagement`, and `WorkspaceManagement` each have one production adapter (`apps/web/src/index.ts` lines 279-317). `RequestRuntime` has two adapters (production and test fake).

## Classified findings and owner decisions

Dependency categories use `.agents/skills/codebase-design/DEEPENING.md`.

| ID | Location | Signal | Dependency | Action | Decision |
| --- | --- | --- | --- | --- | --- |
| F1 | `packages/host/api/src/index.ts` lines 4, 284-314 | Transport imports `DeckError` and `deckFailureMessage`, and hardcodes four outline codes to 409 and `DECK_CONTENT_NOT_FOUND` to 404 | In-process | Focused refactor (split responsibility): move the Deck failure mapping to `mapApplicationFailure` (`contracts.ts` line 115) | Approved for Revision 2b |
| F2 | `packages/host/api/src/index.ts` lines 12-65, `contracts.ts` lines 19-46 | 32 pass-through types, 15 with no production importer, 4 brief types duplicated | In-process | Focused refactor (narrow export surface) | Approved for Revision 2b |
| F3 | `packages/host/api/src/index.ts` lines 96-223 (`body`, 128 lines) | Chat request shape, Deck action validation, and object building mixed | In-process | Focused refactor (split responsibility): extract the request decoder | Approved for Revision 2b |
| F4 | `packages/host/api/src/index.ts` line 219 | `value.publicResearch as boolean`; the check at line 113 does not narrow the type | In-process | Focused refactor (replace type assertion with boundary guard) | Approved for Revision 2b |
| F5 | `packages/host/api/src/index.ts` lines 257-678 (`startHost` 455 lines, `route` 349 lines, 24 non-null assertions) | One closure holds headers, auth, all routes, SSE, and history projection | In-process | Focused refactor (split responsibility); share the SSE helper with `deck-routes.ts` | Approved for Revision 2b |
| F6 | `packages/host/contracts/src/validation.ts` lines 599-692 (`decodeBoundProposal`, 94 lines; file 766 lines) | Long function, and four decoder groups in one file | In-process | Focused refactor (split responsibility); unify validation style with `brief-validation.ts` | Approved for Revision 2b |
| F7 | `packages/host/contracts/src/index.ts` lines 1-6 | Re-export of three `presentation-document` decoders and three types; only `deck-client.ts` uses them | In-process | Focused refactor (narrow export surface); check that the browser build stays free of Node-only modules | Approved for Revision 2b |
| F8 | `packages/host/contracts/src/index.ts` | 18 exports with no importer by name | In-process | Focused refactor (narrow export surface), after `tsc -b` confirms declaration emit | Approved for Revision 2b |
| F9 | `packages/host/api/src/index.ts` lines 64, 69 | `requestTextLimit` has no importer; `RequestController` has only an in-package test importer | In-process | Focused refactor (narrow export surface); check against Testware | Approved for Revision 2b |
| F10 | `packages/host/api/src/contracts.ts` | Lifecycle ports and transport ports in one file | In-process | Focused refactor (split responsibility) | Approved for Revision 2b |
| F11 | `packages/host/api/src/contracts.ts` lines 182-224 | Management interfaces with one production adapter | Remote but owned | No action | Approved as proposed |
| F12 | `http-error.ts`, `request-failure.ts` | Files under 30 lines that protect a real seam | In-process | No action | Approved |
| F13 | `packages/host/api/src/multipart.ts` lines 7-117 (`receiveAttachment`, 112 lines) | Over 80 lines, but one state machine whose shared state and error order protect upload limits | True external (busboy) | No action | Approved |
| F14 | `packages/host/api/src/index.ts` lines 635-676 | `HostMessage` to `HistoryMessage` mapper has a real reason; the attachment field copy changes nothing | In-process | No action for the role mapping; the attachment copy goes to the report | Approved |
| F15 | `docs/conventions/project-structure.md`, section "Dependency rules → Runtime", row "Local Host transport" | The row does not say whether `host/api` may import `@deckagent/deck`. `contracts.ts` imports 5 types and `index.ts` imports runtime values | In-process | Convention update: `host/api` imports only type-level reader ports of a domain, never its runtime | Approved by owner |
| F16 | `docs/conventions/project-structure.md`, section `packages/`, rows `host/api/` and `host/contracts/` | Both rows claim validation; the place of the request-payload decoder is not defined | In-process | Convention update: define where the request-payload decoder lives | Approved by owner |

## Items sent to the report

- Brief and outline types exist in both `host-contracts` and `@deckagent/deck`. This is an ownership question for Slice 2B.
- `validation.ts` uses hand-written checks, `brief-validation.ts` uses zod, and both define similar helpers (`object` and `record`, `text`).
- `packages/host/api/src/index.ts` has 24 non-null assertions. `docs/conventions/code.md` line 22 forbids them, but no tool blocks them, and the scanner counts only `as`.
- `ApprovalStep` passes through three re-export layers (`session-persistence`, `tool-contracts.ts`, `contracts.ts`, `index.ts`) and no importer uses it.
- The seam with `session/persistence` (`RequestStore`, `store.approvals`) belongs to Task 7.

## What the commands do not prove

- Static inspection and regex symbol counts work at file level. A file that contains `@deckagent/host-api` and a matching word counts as a user. The counts can understate unused exports. Run `tsc -b` before narrowing any export.
- No runtime test ran, so the report does not prove behavioral equivalence after a refactor.
- The co-change explanations come from code structure, not from the diffs of single commits.

## References

1. <a id="ref-1"></a>[Task 6: Diagnose host/contracts and host/api module design](../plan/task-06-diagnose-host-contracts-and-api.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
