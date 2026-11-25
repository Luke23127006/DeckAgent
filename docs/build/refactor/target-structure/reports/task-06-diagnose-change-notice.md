# Task 6: Diagnose the change notice and version report

Read this file to learn which tables have a version, which tables the user can change, and how the deck change notice works.

## Files changed

- `docs/build/refactor/target-structure/plan/task-06-diagnose-change-notice.md`: marked Steps 1 to 5 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 6 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index.
- `docs/build/refactor/target-structure/reports/task-06-diagnose-change-notice.md`: added this report.

No code, test, script or convention file changed.

## Commands run

All commands ran in Git Bash on Windows from the repository root, except the STE lint, which ran with `uv run python -I`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| Before Step 1 | `git status --short` | 0 | Empty output. |
| Before Step 1 | `wc -l` on the 11 `Read first` code files | 0 | Every count equals the count in the task file. The range `lines 160-183` for `deck-client.ts` is longer than the file (176 lines). The method `watch` is at lines 164-175, so the range does not change a result. |
| 1 | `git ls-files ... \| xargs grep -lE "\.(prepare\|exec)\(\s*['\`]" \| wc -l` | 0 | `23` |
| 1 | The same file list with `xargs grep -n "CREATE TABLE" \| wc -l` | 0 | `29` |
| 1 | The same file list with `xargs grep -n "CREATE TABLE"` | 0 | 29 lines in 4 files: `web-state.ts`, `deck/src/schema.ts`, `session/persistence/src/schema.ts`, `workspace/registry/src/schema.ts`. |
| 2 | `grep -rnE "(INSERT ... INTO\|UPDATE\|DELETE FROM) <name>"` over `apps/web/src` and `packages`, without `lib/`, tests and schema files | 0 | 80 lines with a write statement. Each table has at least one write site. |
| 2 | One `grep` for each table name with `SELECT`, `FROM` or `JOIN` | 0 | Read sites of the 29 tables. |
| 3 | `grep` for `notify`, `listeners`, `expectedVersion`, `_STALE`, `_CONFLICT`, `text/event-stream`, `event:` | 0 | Sites of the six facts. |
| 4 | `git status --short` | 0 | Only the four files of `Files`. No path under `apps/`, `packages/`, `e2e/`, `tests/`, `scripts/` or `docs/conventions/`. |
| 5 | `corepack pnpm@11.28.5 check:docs` | 0 | `0 error(s)` (see the end of this report for the full line). |
| 5 | `uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py` on this report | 0 | `0 violations` |

## Table classes

Classes follow the [Table decision table](../plan/task-06-diagnose-change-notice.md#table-decision-table). The first matching row decides the class.

**Reading of the first row.** The first row has two signals. This report uses them this way:

- The table has its own `version` column. This signal matches 8 tables.
- A statement that writes the table increases a `version` value. Only a statement on a table with its own `version` column does this. For example, `UPDATE decks SET version=version+1` is a write to `decks`, not to `slides`.

The same transaction that increases `decks.version` also writes other tables. These are `slides`, `revisions`, `publications`, `artifact_revisions`, `generation_intents` and `outline_details`. This report gives them the class of the second to fourth rows. Under the wider reading ("any table written in the transaction that increases the version"), these 6 tables would be `versioned`. The reviewer decides which reading the contract uses.

**Paths.** `deck/` means `packages/presentation/deck/src/`. `persist/` means `packages/session/persistence/src/`. `registry/` means `packages/workspace/registry/src/`. `routes/` means `packages/host/api/src/transport/`. `web/` means `apps/web/src/`. A `Read route` is a `GET` route unless the cell says another method.

| ID | Table | Schema | Write sites | Read route | Class | Record |
| --- | --- | --- | --- | --- | --- | --- |
| CN1 | `decks` | `deck/schema.ts:19` | `deck/deck-authoring.ts:290` (insert, version 1), `deck/deck-publication.ts:111`, `237` (set), `deck/generation-store.ts:179`, `195`, `213`, `231`, `243` (`version+1`) | `/api/sessions/:id/deck` (`routes/deck-routes.ts:19`) and `/deck/events` | versioned | Column `decks.version`. Notice `deck-changed` (`routes/deck-routes.ts:25`). |
| CN2 | `slides` | `deck/schema.ts:21` | `deck/deck-authoring.ts:291` (insert), `deck/deck-publication.ts:109`, `235` | `/api/sessions/:id/deck` (`deck/deck-reads.ts:34`) | user-visible-write | Write route: `POST /api/sessions/:id/deck/confirm` (`routes/session-routes.ts:94`) inserts the rows. The agent publish tools set `revision`. Same transaction as CN1 `version`. |
| CN3 | `revisions` | `deck/schema.ts:24` | `deck/deck-publication.ts:104`, `233` | `/api/sessions/:id/deck/slides/:slideId/revisions/:rev` (`deck/deck-reads.ts:90`) | user-visible-read | Only the agent publish tools write. Same transaction as CN1 `version`. |
| CN4 | `publications` | `deck/schema.ts:27` | `deck/deck-publication.ts:113`, `239` | none | internal | Owner `DeckStore`. It reads the rows at `deck/deck-publication.ts:84`, `133`, `218` to return the receipt of a retry. |
| CN5 | `outline_heads` | `deck/schema.ts:47` | `deck/outline-store.ts:156`, `177`, `202`, `212`, `deck/bound-outline.ts:173` | `/api/sessions/:id/outline` (`routes/session-routes.ts:147`) | versioned | Column `outline_heads.version`. `UPDATE ... version=version+1` at `deck/outline-store.ts:202`, `212`. No notice. |
| CN6 | `outline_proposals` | `deck/schema.ts:49` | `deck/outline-store.ts:174`, `210`, `deck/bound-outline.ts:159` | `/api/sessions/:id/outline` (`deck/outline-store.ts:61`) | versioned | Column `outline_proposals.version`. The value is `state.version + 1` at `deck/outline-store.ts:172`. No notice. |
| CN7 | `brief_heads` | `deck/schema.ts:57` | `deck/brief-store.ts:106` | `/api/sessions/:id/brief` (`routes/session-routes.ts:117`) | versioned | Column `brief_heads.version`. Write route `PUT /api/sessions/:id/brief` (`routes/session-routes.ts:122`) takes `expectedVersion`. No notice. |
| CN8 | `brief_versions` | `deck/schema.ts:58` | `deck/brief-store.ts:110` | `/api/sessions/:id/brief/versions/:n` (`routes/session-routes.ts:117`) | versioned | Column `brief_versions.version`. One row for each saved version. No notice. |
| CN9 | `outline_details` | `deck/schema.ts:64` | `deck/bound-outline.ts:167` | `/api/sessions/:id/outline` (`deck/outline-store.ts:65`) | user-visible-read | Only the agent writes, in the same transaction as CN5 `version`. |
| CN10 | `brief_request_receipts` | `deck/schema.ts:66` | `deck/deck-authoring.ts:223` | none | versioned | Column `brief_request_receipts.version` holds a Brief version for a request. No notice. No Browser read. The code reads it at `deck/deck-authoring.ts:188`. |
| CN11 | `generation_intents` | `deck/schema.ts:72` | `deck/generation-store.ts:148` (insert), `177`, `194`, `211`, `229`, `242` (update) | `/api/sessions/:id/deck` (`deck/deck-reads.ts:35`, field `generation`) | user-visible-write | Write route: `POST /api/sessions/:id/deck/confirm` (`routes/session-routes.ts:94`). Each update has a `decks.version+1` in the next statement. |
| CN12 | `artifact_revisions` | `deck/schema.ts:78` | `deck/deck-publication.ts:106` | `/api/sessions/:id/deck/slides/:slideId/revisions/:rev` (`deck/deck-reads.ts:94`, `142`) | user-visible-read | Only the agent publish tools write. Same transaction as CN1 `version`. |
| CN13 | `prepared_images` | `deck/schema.ts:86` | `deck/image-store.ts:183` | `/api/sessions/:id/outlines/:outlineId/images/:needId` (`routes/session-routes.ts:136`, table read at `deck/image-store.ts:202`) | user-visible-read | The Host writes the rows when it commits a Brief proposal. The Browser shows the image preview. |
| CN14 | `image_search_attempts` | `deck/schema.ts:91` | `deck/image-store.ts:74` | none | internal | Owner `DeckStore`. It reads the count at `deck/image-store.ts:68` and stops at 5 attempts for a request. |
| CN15 | `providers` | `web/web-state.ts:59` | `web/features/providers/provider-settings.ts:323` (tombstone), `367` | `/api/settings` (`routes/management-routes.ts:51`) | user-visible-write | Write route: `PUT` and `DELETE /api/providers/:id` (`routes/management-routes.ts:79-80`). The value is a JSON `payload`. No `version`. |
| CN16 | `preferences` | `web/web-state.ts:62` | `web/web-state.ts:86` (`theme`), `96` (`lastSelection`), `web/features/research/research-coordinator.ts:113`, `129` (`research`) | `/api/preferences` (`routes/management-routes.ts:67`) | user-visible-write | Write route: `PUT /api/preferences` and `PUT`, `DELETE /api/research` (`routes/management-routes.ts:55`). The `research` value holds a random `revision` (`research-coordinator.ts:115`, `131`). |
| CN17 | `sessions` | `persist/schema.ts:92` | `persist/index.ts:93`, `117`, `139`, `199`, `208`, `249`, `268`, `329` | `/api/sessions` (`routes/management-routes.ts:105`) | user-visible-write | Write route: `POST /api/sessions` (`routes/management-routes.ts:111`) and `PUT /api/sessions/:id/selection` (`routes/management-routes.ts:117`). The row has `updated_at` and no `version`. |
| CN18 | `messages` | `persist/schema.ts:97` | `persist/index.ts:262` | `/api/sessions/:id/history` (`routes/session-routes.ts:151`) | user-visible-read | Only the request lifecycle appends rows. Key `(session_id, sequence)`. |
| CN19 | `requests` | `persist/schema.ts:22` | `persist/requests.ts:109`, `285`, `persist/approvals.ts:47`, `69` | `/api/requests/:id` (`routes/request-routes.ts:93-96`) and `/api/sessions/:id/requests` (`routes/management-routes.ts:125`) | user-visible-write | Write route: `POST /api/requests` (`routes/request-routes.ts:64`) and `POST /api/requests/:id/stop`. Index `requests_one_active` at `persist/schema.ts:29`. No `version`. |
| CN20 | `request_events` | `persist/schema.ts:30` | `persist/requests.ts:298` | `/api/requests/:id/events` (`routes/request-routes.ts:101`) | user-visible-read | Column `sequence` increases for each event (`persist/requests.ts:293-296`). The SSE route sends it as the `id`. |
| CN21 | `runtime_bindings` | `persist/schema.ts:34` | `persist/runtime-bindings.ts:24`, `39` (delete) | none | internal | The runtime adapter reads it through `persist/runtime-bindings.ts:7`. |
| CN22 | `attachments` | `persist/schema.ts:43` | `persist/attachments.ts:63`, `125`, `146`, `151`, `169`, `209-210` (delete), `persist/requests.ts:118` | `/api/sessions/:id/attachments/:attachmentId` (`routes/session-routes.ts:57`) | user-visible-write | Write route: `POST` and `DELETE` on `/api/sessions/:id/attachments` (`routes/session-routes.ts:53`, `71`). `DELETE` takes `expectedRevision`, the revision of the draft, not a column of this table. |
| CN23 | `sources` | `persist/schema.ts:52` | `persist/attachments.ts:156` | none (code reads it at `persist/attachments.ts:76`) | versioned | Column `sources.version`. The insert always writes `1`. No notice. |
| CN24 | `request_approvals` | `persist/schema.ts:61` | `persist/approvals.ts:44`, `68`, `94` | `/api/requests/:id/events` (event kind `approval`, `persist/contracts.ts:95`) | user-visible-write | Write route: `POST /api/requests/:id/approvals/:approvalId/decision` (`routes/request-routes.ts:84`). |
| CN25 | `source_reads` | `persist/schema.ts:68` | `persist/request-sources.ts:54` | none (code reads it at `persist/request-sources.ts:10`, `47`) | versioned | Column `source_reads.version`. The code increases it for a changed fingerprint (`persist/request-sources.ts:50-52`). No notice. |
| CN26 | `request_research` | `persist/schema.ts:7` | `persist/requests.ts:114`, `persist/request-sources.ts:83` | none | internal | The Host reads `selected` and `attempts` at `persist/request-queries.ts:23` and `persist/request-sources.ts:80`, `97`. |
| CN27 | `research_sources` | `persist/schema.ts:11` | `persist/request-sources.ts:121` | `/api/sessions/:id/research-sources` (`routes/management-routes.ts:102`) | user-visible-read | Only the request lifecycle writes. |
| CN28 | `workspaces` | `registry/schema.ts:18` | `registry/registry.ts:132`, `146`, `163`, `191`, `208` | `/api/workspaces` (`routes/management-routes.ts:14`) | user-visible-write | Write route: `POST /api/workspaces`, `PUT` and `DELETE /api/workspaces/:id`, `PUT /api/workspaces/:id/folder` (`routes/management-routes.ts:18-38`). The row has `created_at` and `removed_at`, no `version`. |
| CN29 | `registry_state` | `registry/schema.ts:26` | `registry/registry.ts:261` | `/api/workspaces` (`registry/registry.ts:92` reads the `selected` key) | user-visible-write | Write route: `PUT /api/workspaces/selected` (`routes/management-routes.ts:22`). |

## Count of rows for each class

| Class | Rows | IDs |
| --- | --- | --- |
| versioned | 8 | CN1, CN5, CN6, CN7, CN8, CN10, CN23, CN25 |
| user-visible-write | 10 | CN2, CN11, CN15, CN16, CN17, CN19, CN22, CN24, CN28, CN29 |
| user-visible-read | 7 | CN3, CN9, CN12, CN13, CN18, CN20, CN27 |
| internal | 4 | CN4, CN14, CN21, CN26 |
| unclassified | 0 | none |
| Total | 29 | |

Only CN1 has a notice. The other 7 `versioned` tables have a `version` and no notice. Two of them, CN10 and CN23, have no Browser read. The `version` of CN23 is always `1` at insert.

## The six facts of Step 3

1. **`DeckChange`, version increase and listeners.**
   - `DeckChange` has three fields: `sessionId`, `deckId` and `version` (`deck/deck-contracts.ts:28-32`). `deckId` equals `sessionId` everywhere (`deck/deck-runtime.ts:61`).
   - The code sets the deck `version` to `1` at insert (`deck/deck-authoring.ts:290`). A slide publication sets it to `previous + 1` (`deck/deck-publication.ts:101`, `111` and `231`, `237`). Generation state changes use `version=version+1` (`deck/generation-store.ts:179`, `195`, `213`, `231`, `243`).
   - `DeckRuntime.notify(sessionId, version)` calls the listeners (`deck/deck-runtime.ts:58-67`). The code deletes a listener that throws. `DeckReads.subscribe` adds a listener to `host.listeners` (`deck/deck-reads.ts:124-138`).
   - The code calls `notify` after the commit (`deck/deck-publication.ts:155`, `245`, `deck/deck-generation.ts:99`, `107`, `117`, `132`). Three calls pass the literal `1` and not the stored `version`: `deck/deck-authoring.ts:61`, `deck/deck-authoring.ts:267` and `deck/deck-generation.ts:73`.
2. **SSE route.**
   - Path: `GET /api/sessions/:sessionId/deck/events` (`routes/deck-routes.ts:12`).
   - Event name: `deck-changed` (`routes/deck-routes.ts:25`).
   - The route subscribes first (`:27`), then reads the snapshot (`:29`), then opens the stream (`:30`), then sends one notice with the current `version` (`:31`). A deck that does not exist yet has `version` `0` (`deck/deck-reads.ts:41`).
   - The comment of the route says that a notice is an invalidation, not an event log, and that a reconnect starts at the current `version` (`routes/deck-routes.ts:7-8`).
3. **Browser reaction.** `DeckClient.watch` yields the parsed notice (`web/browser/transport/deck-client.ts:164-175`). `follow` in `web/browser/features/deck/deck-model.ts:106-112` compares `notice.version` with `snapshot.version`. When the notice is newer, or when no snapshot exists, it calls `refresh()` and reads the deck again. The notice data is not copied into the screen state. On a lost connection the loop waits from 500 ms up to 10 000 ms (`deck-model.ts:122-131`) and then calls `refresh()` again at the start of the loop (`deck-model.ts:106`).
4. **Deck write and an old `version`.** No deck write takes an expected deck `version`. A slide publication takes `expectedRevision` (the slide revision) and throws `DECK_CONFLICT` when it differs (`deck/deck-publication.ts:98`, `229`). Other stores take an expected value for their own `version`: `saveBrief` takes `expectedVersion` and throws `BRIEF_STALE` (`deck/brief-store.ts:85-90`). The Outline confirmation compares the Outline `version` and throws `OUTLINE_STALE` (`deck/outline-store.ts:185-196`).
5. **`MemoryDraftStore`.** The store keeps a `Map` of drafts in memory (`web/draft-store.ts:26`). Each draft has a `revision`. `save` throws `DRAFT_CONFLICT` when `expectedRevision !== current.revision` (`web/draft-store.ts:50-51`) and sets `revision` to `current.revision + 1` (`:60`). `set` reads the current revision and does not conflict (`:35-36`). `clear` returns `false` for an old revision (`:66-67`). The store has no listener and sends no notice. The Browser registers a `focus` listener and a 500 ms timer for attachments (`web/browser/draft-sync.ts:32-33`). The attachment routes compare the same revision: `DRAFT_CONFLICT` at `web/features/attachments/attachment-coordinator.ts:211` and `web/features/attachments/managed-attachments.ts:76`.
6. **Other SSE routes.** Only `openSseStream` writes a stream header (`routes/sse.ts:6`). Two routes call it: the deck route above and `GET /api/requests/:requestId/events` (`routes/request-routes.ts:38`). The request route sends the event name `request` with an `id` equal to the event `sequence` (`routes/request-routes.ts:26`) and starts after the `Last-Event-ID` cursor (`:17`). `openSseStream` allows 64 open streams and then throws `TOO_MANY_STREAMS` (`routes/sse.ts:5`). It sends a heartbeat comment every 15 000 ms (`:8-10`).

## Items with class `unclassified`

None. All 29 tables match a row of the decision table.

## What the commands do not prove

- The search finds tables from `CREATE TABLE` statements only. State in memory, for example `MemoryDraftStore`, is in this report only through fact 5. The tables of the `lib/` build folders are not counted.
- A write site is a statement in the form `INSERT`, `UPDATE` or `DELETE` with the table name. A statement that builds its text in a variable would not match. All 29 tables have at least one write site, so no table is missing.
- A read route is a `GET` route whose handler reaches a read of the table. The report does not prove that every column of the table reaches the Browser.
- The class of CN2, CN9, CN11 and CN12 to CN14 depends on the reading of the first row (see "Table classes"). The report does not prove which reading the contract needs.
- The `Write route` column names an HTTP route that reaches a write site. It does not list every path from that route to the table.
- The report does not show how a second Browser tab sees a change to a table other than CN1. Facts 3 and 5 show only the deck follower and the draft `focus` listener. `docs/open-questions.md` (row OQ-061) records this question.
