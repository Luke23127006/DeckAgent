# TASK-005 — Persistent slide publication with SSE and snapshots

Updated: 21-10-2026. Local implementation on `feature/task-005-slide-pipeline`, base
`d28871b96e569664373e4a1b5b977ffc42a486c2`. No commit, PR or integrated Gate acceptance yet.

## Scope and decisions

Task owner authorized TASK-005 with SSE + snapshots and confirmed-plan fixtures.
The pipeline is Agent → workspace draft → `publish_slide` → Deck Service → authenticated
API → Canvas. TASK-006 still owns conversational outline proposal and confirmation.
No model tool or HTTP endpoint can confirm a plan. Ordinary chats without a confirmed
plan have no `publish_slide` in their Agent allowlist.

Host composition imports `confirmedDecks` fixtures at startup. The optional
`--confirmed-deck` CLI argument is an explicit operator-controlled test/manual input,
not a confirmation workflow for the product. Importing an identical plan is idempotent;
changing a previously confirmed plan fails instead of rewriting it. Existing Session
model selection is preserved when restarting with a fixture.

## Contracts and ownership

`@deckagent/deck` (`packages/presentation/deck`) owns metadata, revisions and HTML.
One deck maps to one Session; currently `deckId === sessionId`. IDs contain 1–100 ASCII
letters, digits, underscores or hyphens. A confirmed plan has an `outlineId` and an
ordered list of unique `slideId`/title pairs (1–100 slides). Array order is authoritative;
snapshot `order` is zero-based. Model arguments cannot change order or create identities.

`DeckService.confirm(sessionId, plan)` is the trusted Host seam for a future confirmation
workflow. `snapshot`, `content` and `subscribe` form the read contract. `publish` takes
`outlineId`, `slideId`, `expectedRevision`, `publicationId` and HTML. The presentation
tool exposes those primitive fields with a workspace `path` in place of HTML and binds
Session from Host, never from model arguments.

- An absent deck has snapshot version 0, no outline and no slides.
- A confirmed plan starts at version 1; planned slides are pending with revision 0.
- Every new successful publication increments that slide's revision and deck version.
  Published HTML is immutable and addressed by Session + slide ID + revision.
- Snapshot contains metadata only. Pending is the public representation of a planned
  slide without published content. Workspace drafts never appear in the snapshot/content API.
- One SQLite transaction stores HTML, current revision, deck version and publication
  receipt. `decks.sqlite` lives under the existing Host data directory, outside the
  Agent workspace. Session/settings databases keep their existing schemas.
- Retrying the same publication ID with identical input returns its original receipt,
  even after restart. Reusing that ID with different input fails. A new attempt with
  a stale `expectedRevision` fails; no last-writer-wins overwrite occurs.
- Service errors distinguish unconfirmed plan, wrong outline, missing slide/content,
  revision conflict, publication-ID conflict, invalid input, unsafe HTML and storage/schema
  failure. The Tool Registry retains its existing safe generic `TOOL_FAILED` projection;
  raw exceptions are not exposed. Successful tool output is a JSON receipt, without HTML.
- Cancellation before commit stops publication. A caller interrupted after a commit can
  have an unknown outcome; it must inspect the snapshot or retry the identical publication
  ID. Cancelling/disconnecting a browser subscription never cancels Agent work.

The Host is the single process owning publication and change notifications. Multiple
independent Host writers sharing a data directory are outside this implementation's contract.

## HTTP and SSE

All routes reuse the loopback Host's Bearer authentication, origin checks, no-store
policy and safe errors. Credentials never enter route/query parameters.

| Method / route under `/api/sessions/:sessionId/deck` | Result |
| --- | --- |
| `GET` | Full `DeckSnapshot`: Session/deck/outline IDs, version and ordered slide metadata |
| `GET /events` | SSE `deck-changed` with `{sessionId, deckId, version}` |
| `GET /slides/:slideId/revisions/:revision` | JSON `{sessionId, slideId, revision, html}` for a published immutable revision |

SSE subscribes before reading the initial version. Each connection immediately receives
a current-version notice, including version 0; this covers a commit between an earlier
snapshot request and stream connection. Subsequent notices follow commit. No persistent
event replay or `Last-Event-ID` protocol is needed because reconnect reads a full snapshot.
Streams share the Host's limit of 64, send 15-second heartbeats and release subscriptions
on close. A slow stream is ended on backpressure; reconnect recovers current state.

The client subscribes with authenticated `fetch`, validates response data and reads
snapshots on initial load, newer notices and reconnect. Connection retry starts at 500 ms
and backs off to 10 seconds. There is no periodic Deck polling. Ordinary HTTP reads have
15-second deadlines. A restarted Host issues a new token: reopen the browser through Host
startup rather than reusing an old authenticated URL.

## Canvas and HTML policy

`DeckModel` rejects older versions and late responses from a previous Session. Changing
slides discards outdated content loads. Publishing another slide does not change the
user's selection. Selections are retained while switching chats in the current page;
reload defaults to the first planned slide, without claiming TASK-007 history restoration.

The real Canvas has pending/published navigation, resize, fullscreen and connection status.
`Open deck` accesses the current Session's deck; TASK-004 sample controls/assets remain
available separately. Pending slides have no rendered HTML.

The initial policy accepts static HTML/CSS, at most 256 KiB, with no scripts, navigation
links, event attributes, frames, embeds, forms or resource attributes. It intentionally
does not support external assets, images, fonts or slide JavaScript. Rejection checks
are not an HTML sanitizer. Rendering isolation is an empty iframe sandbox (opaque origin)
plus a leading CSP that denies network sources, forms and base URLs. HTML is fetched with
Bearer authentication and assigned only to `srcdoc`, never the application DOM.

Host CSP now permits inline styles so static CSS in inherited `srcdoc` documents can render;
inline scripts remain forbidden. The slide's own CSP is more restrictive than Host CSP.
Workspace files are still never served as public static assets. More permissive slide
assets/scripts require a separate policy decision and tests.

## Manual check with a real model

Use a separate data directory. No credentials belong in the fixture or commands:

```powershell
pnpm.cmd build
pnpm.cmd start:local-web --data-dir .deckagent/task-005-manual --workspace .deckagent/task-005-manual/workspace --confirmed-deck config/deck.confirmed.example.json
```

Use a Node version supported by `package.json`; the repository-local executable is
`trash/task-002-a/node.exe` on the current machine. Do not assume the global pnpm shim
uses that executable merely because PATH was changed.

1. Open Models & settings and configure/select an available model. In History, open
   Session `task-005-demo` (the button title exposes its Session ID). Select the model
   for that Session if it was created without a CLI selection.
2. Its confirmed fixture has `intro` and `summary` pending. Ask:
   “Use write_file to create intro-v1.html containing a static HTML/CSS introduction.
   Then call publish_slide for outline task-005-confirmed-outline, slide intro,
   expectedRevision 0, publicationId intro-first. Do not publish summary.”
3. Check intro Revision 1 appears without refreshing; summary stays pending. Check tool
   activity and successful receipt. A file creation by itself is not publication.
4. Publish summary with a different draft/publication ID while intro is selected.
   Check intro stays selected. Navigate to summary, resize and enter/leave fullscreen.
5. Reload; select the same Session if needed. Published content must remain. Stop Host
   cleanly, restart with the same arguments, reopen its browser and select that Session.
   Both revisions must remain. Do not delete SQLite WAL/SHM files.
6. On repeat runs, use the current revision and a new draft/publication ID; existing
   workspace files cannot be overwritten. An identical retry must keep its original ID.

Record revision, Session, provider/model, checks and actual results without keys.
These are instructions, not evidence that a real-model manual run passed.

## Verification and continuation

Focused commands: `pnpm test:slide-pipeline`, `pnpm test:tools-browser`,
`pnpm test:local-web`, `pnpm test:env-startup`, `pnpm test:browser-smoke`, plus build/lint.
Tests use temporary databases/workspaces and local model/HTTP fixtures. Browser checks
exercise actual sandboxed HTML/CSS, SSE-driven updates, navigation, selection and
reload/Host restart. CI includes `test:slide-pipeline`; run URL/SHA must be recorded after
integration. Current local evidence and remaining failures/limits are in `PROGRESS.md`.

Local verification in this session: frozen offline install (existing dependency cache,
scripts disabled), build and lint PASS; 29/29 focused Node tests and 2/2 real-browser tests
PASS, no skipped tests. Desktop screenshot 1600×1000 was visually inspected. Browser
regression exposed overlapping History reconnect and send: Host finished the request but
the changed Session generation discarded its UI response. Composer now waits for
Session opening/reconnect, and the original failing browser flow passes. No temporary
debug instrumentation remains. Real-model manual and hosted CI have not run.

Gate 004 is still `NOT_VERIFIED` in the current dashboard. Gate 005 remains
`NOT_VERIFIED` until the required integrated-dev acceptance is recorded. No implementation
plan or product specification was changed. Next group can build its outline workflow
against the trusted confirmation seam instead of adding another store/publication path.
