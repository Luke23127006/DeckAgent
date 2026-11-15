# Brief storage and visual selection

The [visual decision](../adr/0004-initial-visual-catalog.md) owns catalog values and the [workflow decision](../adr/0005-outline-generation-contracts.md) owns confirmation and generation. This reference describes the storage and API foundation. Interview, structured Outline revision and generation admission require their own integrations.

## Ownership and persistence

The Design package exposes `listDesignSystems`, `listTemplates`, `resolveDesign`, `validateTheme`, `validateContentPlan`, `findCompatibleLayouts`, `resolveLayout` and `decodeDesignSnapshot` through `@deckagent/design`. It reads no project files and makes no network requests. Candidate capacities count Unicode code points. Allowing a custom layout does not validate its HTML, rendering or assets; publication must enforce those checks.

Catalog entries have immutable IDs and versions. Changed shipped values require a new version while existing versions remain readable. `resolveDesign` copies effective roles, rules, brand references, visual identities and viewport into a frozen snapshot with a SHA-256 fingerprint. `decodeDesignSnapshot` verifies stored values and the fingerprint rather than applying today's defaults. The fingerprint detects accidental changes; it is not an authorization credential. A Brief's snapshot is a proposal; confirmation and generation must bind and lock the exact reviewed snapshot.

`DeckService` owns current Brief heads and append-only Brief versions in `decks.sqlite`, schema v3. Migration accepts v1 and v2 without rewriting Deck HTML, Outline proposals or Chat history. Existing records receive no invented Brief. An older binary refuses the newer database; keep a backup if rollback is required. Session persistence continues to own sent attachments, source receipts, approvals and requests in its separate database.

An incomplete Brief may omit topic, duration, format and visual selections. Required source flags remain explicit; missing interview answers do not enable model knowledge or research. Unsupported requested formats remain `requestedFormat` without an HTML generation selection. Each successful write creates a new immutable version and retains the Brief ID. Writes require the current `expectedVersion`; stale writes conflict. A confirmed Deck makes Brief writes read-only, including legacy Decks.

## Authenticated API and consumers

`GET /api/sessions/:id/brief` returns the current `BriefView`; `GET /api/sessions/:id/brief/versions/:version` returns an immutable historical version with current lock and source-receipt status. `PUT /api/sessions/:id/brief` accepts `{ expectedVersion, draft }`. The Host rejects unknown Chats, active requests, foreign or unadmitted source references and unavailable versions. Image choices require ready, sent image attachments of that Chat and their selected source references. An unsent Composer attachment cannot enter a saved Brief.

Source status `recorded` means a matching receipt exists in the Chat, not that bytes are currently readable or an external read is approved. `unavailable` means the matching receipt is absent or superseded. GET does not read external files or alter historical Briefs. Every later content read must recheck source integrity, workspace boundaries and each-step approval. Saving `publicResearch` does not grant research to generic Chat requests or invoke Tavily.

The browser-safe `BriefClient` exposes `snapshot` and `save`; `decodeBriefView` rejects malformed and cross-Chat projections. Selection policy and fingerprint verification remain Host responsibilities. The shared contracts are exported through the Deck and Host package interfaces. There is no breaking change to generic Chat request inputs or existing Deck/Outline reads.

The runtime currently receives no Brief mutation tool and no Brief injection into generic Chat. Collecting/reviewing requests must eventually receive only their admitted Brief/source versions; generation must receive its confirmed snapshot and scoped slide plan. The workflow decision defines those phase boundaries. Stored source references never replace request-local grants.

Brief JSON has a 128 KiB technical validation bound; structured slide content has a separate 256 KiB bound. These protect parsing and persistence and do not set a product slide-count limit. Run `pnpm.cmd test:brief-foundation` after building for catalog, migration, restart, source ownership, API and client checks. These local fixtures do not establish rendered fit, generation locks or real-provider behavior.
