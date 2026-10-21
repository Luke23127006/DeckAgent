# TASK-006 — Outline review and presentation generation

Updated: 21-10-2026. Local A/B/C implementation on
`feature/task-006-outline-workflow`, based on TASK-005 commit
`7bb0685a84c0c1be15e0f48b0518d7596c152d10`. Implementation and the tool-argument
instruction fix were pushed as `4e13984` to `origin/feature/task-006-outline-workflow`
at the task owner's request. No PR or merge into `dev` yet.
Gate 005 and Gate 006 remain `NOT_VERIFIED`; local checks do not replace acceptance
on integrated `dev` or a real-model demo.

A follow-up after `4e449d1` assigns request-specific draft paths to avoid collisions
in the shared workspace. That fix was pushed as `068996f` on the same branch at the
task owner's request; current verification and continuation are in `PROGRESS.md`.

## Behavior and ownership

The user enters a presentation request and chooses **Create presentation**. The
first request reads material and calls `propose_outline`. Its completed response
contains an overview and expandable planned-slide details. Expanding one/all slides
or collapsing them sends no Agent request and changes no proposal.

The user can confirm, cancel or ask for a revision through the conversation.
Confirmation is a new request after the proposal request ends. Host validates the
current proposal ID/version, creates the Deck atomically with confirmation, and
starts generation with the confirmed detailed content. Published slides use the
TASK-005 SSE/snapshot/Canvas pipeline. Selection does not change when another slide
is published. The confirmed outline remains readable and read-only in its original
response. Revisions append a new proposal response; cancelled and superseded
proposals remain in history with their original content.

- A: `packages/presentation/deck` owns outline state and Deck persistence;
  `packages/host/api` owns authenticated reads, admission and request completion.
- B: `packages/client/runtime` owns Outline client/view and conversation placement;
  `apps/local-web/src/outline-style.ts` adds only the outline/composer styles.
- C: `packages/tools/presentation` stages validated proposals; app-local
  `outline-workflow.ts` supplies phase instructions and conservative typed commands.
- `apps/local-web/src/index.ts` owns composition and resource disposal. Request
  setup stays together so the captured model, tools, phase and teardown have one owner.
  No new workspace package, external dependency, vendor change or Agent Loop change
  is needed.

## Contracts

`OutlineDraft` contains `overview` and an ordered list of `{title, content}`.
Content is a detailed plan: purpose/argument, key material, relevant figures,
assumptions, placeholders and unresolved points. It is rendered as plain text.
Limits are 1–100 slides, overview 4,000 characters, title 300 characters, content
8,000 characters per slide and serialized draft 128 KiB. A Session retains up to
100 completed proposals. These are implementation bounds, not new product scope.

Host adds a UUID `outlineId`, proposal `version`, `requestId`, `responseIndex` and
planned-slide IDs. `responseIndex` is the exact completed assistant response index
in public history, including tool rows but excluding system rows. IDs `slide-1`,
`slide-2`, etc. are scoped to the proposal; they do not promise identity across
outline revisions. After confirmation they become stable Deck slide IDs/order.

`OutlineSnapshot` has `sessionId`, `active`, independent transition `version`,
`currentId`, `confirmedId` and ordered proposals. Status is `current`, `superseded`,
`cancelled` or `confirmed`. The snapshot version increments for proposal, cancel and
confirm transitions; it is independent of Deck publication versions. Entering the
workflow can have `active: true`, version 0 and no proposal yet.

| Boundary | Contract |
| --- | --- |
| `GET /api/sessions/:sessionId/outline` | Authenticated full Outline snapshot; same origin/Bearer/no-store policy as existing APIs |
| `POST /api/requests` | Existing `{sessionId,input}` remains valid; optional `presentation: true` enters the controlled outline workflow |
| `outlineTarget` request field | Optional `{outlineId,version}` for a typed review request; rejects a stale displayed proposal |
| `outlineAction` request field | Optional `{type: 'confirm' \| 'cancel',outlineId,version}`; exact current target required |
| `HostOptions.openAgent` | Receives the admitted request as a third argument; existing two-argument implementations remain valid |
| `HostOptions.finishRequest` | Optional callback after handle disposal, before terminal snapshot and Session lock release |
| `propose_outline` | Model argument `proposal` is a JSON string; it stages one validated draft per request and cannot confirm |

The system prompt includes an executable argument-envelope example with escaped
inner JSON, matching the tool description/schema. The ordinary Send request path
has a regression test for this contract. Passing an object as `proposal`, or passing
the draft fields at the argument root, remains invalid; validation is not relaxed.
This addresses a reported `INVALID_TOOL_INPUT` failure on `propose_outline`.
The real provider's failed arguments were not captured; live retry after Host restart
is still required to confirm the reported run is resolved.

The Host binds Session/request/history references; none are model arguments. In the
controlled outline phase, only `read_file` and `propose_outline` are advertised or
allowed. `write_file` and `publish_slide` become available only after confirmation.
Ordinary chat/file requests retain their previous behavior; their prompt instructs
the Agent to propose an outline first when asked for a presentation. Use **Create
presentation** for the enforced outline preset. Existing TASK-005 confirmed fixtures
remain explicit trusted operator inputs and have no product confirmation endpoint.

Suggested confirm/cancel actions send canonical text plus a structured action.
Whole-message typed commands include `Confirm outline`, `Confirm`, `Xác nhận dàn ý`,
`Xác nhận`, `Cancel outline` and `Hủy dàn ý`; see `outlineCommand` for the complete
list. Other wording goes through the review conversation and cannot itself grant
confirmation. Positive text with a requested change is never matched by this
command parser. Ambiguous intent is left for clarification. This is a conservative
command set, not a claim of unrestricted natural-language intent recognition.

## Transitions, failures and compatibility

The same Session admission lock covers chat, revision, confirm and cancel. A busy
Session gets `SESSION_BUSY`; stale/wrong-version/cross-Session references get
`OUTLINE_STALE`. Repeated confirmation gets `OUTLINE_ALREADY_CONFIRMED` and does not
replay generation. Failed model selection/capture/handle setup does not confirm.
If confirmation committed but generation later fails or Host closes, the outline
stays confirmed; cancellation is not rollback. Read the saved state before retrying.

Proposals are staged in request-local memory. Only a successful response with a
nonempty final assistant message, followed by successful handle disposal, can become
current. Model failure/cancellation or an unfinished response discards the stage.
The successful request record is saved before the proposal is made confirmable.
A crash between those stores can leave completed text with no proposal; it cannot
grant confirmation to an unfinished proposal. No automatic recovery is claimed.

Database schema v2 migrates TASK-005 schema v1 in a transaction, preserving existing
Deck plans, content/revisions and publication receipts. Outline metadata lives in
the same `decks.sqlite`. Confirmation and initial Deck creation share one SQLite
transaction; notifications follow commit. Session/settings schemas do not change.
TASK-005 snapshot/content/SSE/publish contracts remain unchanged. Older application
versions reject schema v2; downgrade requires a separate data migration or backup.

Generation gets the confirmed detailed plan and current Deck revision metadata.
Host also includes a draft-path map in each generation request's system prompt:
`draft-<requestId>-<slideId>.html`, directly under the existing workspace root.
Each request uses new names, including a request continuing a confirmed Pending deck
after restart. These paths are generation instructions, not a new File Tool argument
or HTTP contract. The model passes the same path to `publish_slide` after a successful
write. Existing files stay protected by exclusive creation; no draft is overwritten
or deleted. A failed write must not lead to publishing an older file or repeating
identical failed arguments. A response ending does not schedule background retries.
The existing runtime plugin receives a bounded budget `max(8, 2 * slideCount + 5)`
(at most 205 model steps). Instructions require publication per finished slide and
a final per-slide summary, assumptions, placeholders, content beyond the supplied
material and unchecked claims. If the confirmation request ends while slides remain
pending, Host records `DECK_INCOMPLETE` and appends a correction instead of reporting
the request completed. Model prose quality still requires real-model acceptance.

Outline reads occur on Session open/reconnect, after request updates, and during
active-request polling. There is no new Outline SSE or idle multi-browser live-sync
promise. Client rejects older snapshots and responses for an old Session. Stale
actions are always checked again on Host.

## Verification and manual acceptance

Existing commands:

```powershell
pnpm.cmd build
pnpm.cmd lint
pnpm.cmd test:outline-workflow
pnpm.cmd test:slide-pipeline
pnpm.cmd test:tools-browser
pnpm.cmd test:local-web
pnpm.cmd test:env-startup
pnpm.cmd test:browser-smoke
```

Use the supported Node version from `package.json`. Current-machine verification
uses Node 22.19.0 at `trash/task-002-a/node.exe` and pnpm 11.28.5 through Corepack;
global PATH Node remains 22.17.1. Automated tests use temporary databases/workspaces,
loopback APIs and model fixtures. Actual results and sandbox/browser limits are in
`PROGRESS.md`; commands here are not hosted CI or real-model evidence.

For a real-model demo, use a separate data directory and no confirmed fixture:

```powershell
pnpm.cmd start:local-web --data-dir .deckagent/task-006-manual --workspace .deckagent/task-006-manual/workspace
```

1. Open Settings and configure/select an available model. Enter a concrete request,
   for example three slides about recycling for students, with supplied key points
   and an explicit language. Choose **Create presentation**.
2. Wait for request completion. Check overview and detailed planned slides in its
   assistant response, no new slide files/publications and no automatic Canvas opening.
   Expand/collapse individual/all details; check no new request/activity starts.
3. Choose **Revise outline**, describe a scoped change and send. Check a new response
   becomes current; the previous proposal remains unchanged and cannot confirm.
   In a second browser with an old snapshot, old confirm must fail without changing Deck.
4. Cancel a current outline. Check a separate completed request, preserved cancelled
   proposal and no Deck. Send a new request and check it creates a fresh proposal.
5. Confirm the new current proposal. Check a new request ID, confirmed read-only
   detail, automatic Canvas opening, pending slides then progressive publication.
   Select a slide while another publishes; selection must stay put.
6. Check the closing response covers each slide, assumptions/placeholders, material
   added by the model and unchecked facts. Check no pending slides are claimed ready.
7. Reload, then stop/restart Host with the same arguments and reopen its browser.
   Confirmed outline and published content must remain. Repeated confirm must not
   replay generation. Do not delete SQLite WAL/SHM files.

Record revision, environment, provider/model, Session ID, both request IDs,
expected/actual outcomes and failures without keys/tokens. Gate 006 additionally
requires Gate 005 PASS and integrated-dev evidence.

This implements the demo slice plus scoped revision/cancel safety. New images,
external assets, attachments intake, general intent understanding, question lifecycle,
complex provider failures and TASK-007 recovery/editing are not completed by this task.
Static HTML/CSS and sandbox restrictions from TASK-005 remain in effect. This is not
full UC-001 or V1 acceptance.
