# TASK-007 — Handoff record

Checkpoint: 5 November 2026. Codex implemented A/B/C sequentially.
G-007 remains NOT VERIFIED. Owner manual acceptance and G-003/G-006 extended acceptance remain open.

| Item | Record |
|---|---|
| Candidate SHA / dirty changes | Clean base 38892faf3cade4bef172b4f1c0fc3bddc5417724; uncommitted changes on feat/v2-opencode |
| Named A / B / C / integrator | Codex, sequential implementation |
| Contract and exact file ownership | [CONTRACT.md](CONTRACT.md) |
| Producers/consumers and compatibility | See below |
| Automated commands/results/artifacts | PASS; [evidence.json](evidence.json) records final commands, hashes and counts |
| Live model/protocol/CLI/OS/Node/tester | Gemini gemini-3.1-flash-lite, native Gemini, OpenCode 1.19.5, Windows x64, Node 22.19.0, Codex |
| Manual and negative scenarios | Automated negative checks PASS; owner manual pending |
| Data/profile and preservation checks | Disposable temporary profiles, synthetic/public data only; no user source writes |
| Lane A / B / C | AWAITING MANUAL; focused automated/live checks PASS |
| Integration G-007 | NOT VERIFIED |
| Failures/limits/retest owner | Initial prompt failures retained; owner runs manual smoke |
| Next action / downstream consumer | [Manual acceptance](MANUAL-ACCEPTANCE.md); earlier gates remain open |
| GitHub Issue | Unpublished; authorization required |

Append dated results and retests without deleting failures. Never include credentials or private user material.

## Contracts and files

The owner selected Internet images and PDF. [ADR 0007](../../../../adr/0007-internet-image-assets-and-pdf-export.md)
records the decision. Public package boundaries stay unchanged.

| Producer / files | Consumers / effect |
| --- | --- |
| deck contracts.ts, image-assets.ts, index.ts | ImageAsset, InsertSlideImage, FrozenDeck, DeckImageEditor; ownership-aware publication, insertImage and freeze |
| app image-assets/network.ts, store.ts | User-only URL import, immutable bytes, assets.sqlite and provenance |
| app materials/parser.ts, parser-worker.ts | Existing decoded-image checks now return dimensions; attachment permissions unchanged |
| app export-pdf.ts | displaySlide projection and PdfExporter; no deck or conversation writes |
| Host contracts.ts, index.ts | Optional authenticated image/render/export operations; disconnect abort and idle-Chat insertion |
| app index.ts | Store/exporter composition, ownership, manifest capture and shutdown; context observation includes assets |
| app web-request.ts, outline-workflow.ts, editing-workflow.ts | Owned-image instructions and phase-authorized tools; confirmation/scope rules stay in force |
| tools/presentation insert-image.ts, index.ts; runtime tool-failure.ts | list_image_assets and scoped insert_image; safe static errors |
| client image-export.ts, deck-client.ts, deck-model.ts, deck-canvas.ts, slide-editor.ts | Import/source/select/insert/download/cancel; canonical HTML and optional displayHtml remain distinct |
| manifests, lockfile, scripts/test-opencode.mjs | Pinned dependencies and explicit offline/browser/CLI/live commands |
| tests/images-export*.test.mjs, image-network.test.mjs, context.test.mjs | New checks and updated context-state consumer |

Routes under `/api/sessions/:id`:

- GET `image-assets`: `{enabled,items}`. POST `{url}`: verified ImageAsset.
- POST `deck/slides/:slideId/images`: `{outlineId,slideId,expectedRevision,assetId,publicationId,alt}`; PublishedSlide receipt.
- POST `export-pdf` with `{}`: PDF attachment, x-deck-version and fixed safe filename.
- Content/editor/preview reads add optional displayHtml. Canonical html never stores hydrated data URLs.

MCP tools receive no paths or arbitrary fetch capability. insert_image accepts the insertion fields above.
The bridge exposes deckagent_insert_image. Host scope, asset ownership, revision and publication checks remain authoritative.
Unknown save outcomes reuse the publication ID. Stale saves do not overwrite newer slides.

## Resource and security limits

HTTPS port 443 only. No userinfo, sensitive credential query keys or private/reserved DNS answers.
Check every DNS answer and redirect; connect to the checked IP with the original TLS hostname.
Three redirects, 4096 URL characters, 5 MiB and 16 million decoded pixels per image.
No cookies, provider keys, prompt or project text are sent to image servers.
Only explicit user import starts acquisition. Agent tools use existing assets.

Twenty assets per Chat, two concurrent imports, 20-second timeout. Files use generated IDs.
Failed imports remove only their own partial files. Ready unused assets remain; no automatic garbage collection.
One export at a time, 60 seconds total, 100 slides, 32 million unique image pixels and 20 MiB unique image bytes.
Projection limits: 30 MiB per slide, 80 MiB per deck. PDF limit: 50 MiB.

Installed Chromium keeps its sandbox enabled. Its environment excludes provider credentials.
Page JavaScript is disabled, network routes are blocked and CSP restricts resources.
There is no unsafe sandbox fallback or automatic browser download.
DECKAGENT_EXPORT_BROWSER can select an operator-installed executable.
PDF uses 1280 by 720 CSS pixels, one page per slide. Multi-page overflow fails explicitly.
Preview frames keep opaque sandboxing. Native OpenCode tools/plugins remain denied.
These controls do not establish a general OS sandbox or exhaustive adversarial-renderer proof.

## Verification

Focused domain/network/browser/PDF checks and pinned CLI checks pass.
The final affected batch had 90 PASS and one Windows teardown failure: Chrome locked its temporary Cookies file.
The existing editor browser case passed when rerun alone. Both logs remain; no assertions or tests were weakened.
See evidence.json for exact commands, counts, logs and candidate fingerprints.
The live sample downloaded a public PNG from raw.githubusercontent.com through production DNS/HTTPS checks.
Gemini called read_slide, list_image_assets and insert_image through OpenCode MCP.
Direct editing then changed a heading and layout. PDF and restart kept the image and unchanged slide-one HTML/revision.
The seeded outline does not requalify live outline generation or earlier source-to-deck failures.

PDF.js independently checked two ordered pages, Vietnamese direct-edit text and image operators.
The independently drawn PNG was viewed: accents, centered heading, existing text and the image are present.
The actual UI download button also passed. This does not prove arbitrary layout or font fidelity.
Negative checks cover private/mixed DNS, redirects, format/size, disabled import, ownership/scope/revision,
duplicate calls, corrupt bytes, cancelled-import cleanup, incomplete decks, missing browser and overflow.
Host tests cover authentication, destination injection and disconnect cancellation before PDF bytes are sent.
Actual renderer cancellation was observed after launch; close/drain completed without deck changes.
No exhaustive OS descendant-PID audit or memory-pressure/crash campaign was performed.

## Failures and limits

- Initial live prompt used blocked word insert and timed out waiting for clarification.
  The deterministic provider fixture also failed. Both logs remain.
  Corrected scoped prompts passed without changing permissions or the business rule.
  Avoid insert, add, not, không, chèn and thêm in model edit prompts. The direct insertion button is unaffected.
- Early PDF fixture failed Windows file-URL import and PDF.js cleanup API use; both test issues were corrected.
- The browser fixture initially expected NOT_FOUND for an unknown Chat. The client safely returned IMAGE_REQUEST_FAILED.
- Only Windows/Chrome/Gemini has live evidence. Other systems, browsers, providers and complex layouts remain unverified.
- No AI image generation, web search, model-directed URL fetching, PPTX or free-position image editing is added.
- Fonts use the installed browser/system set; unavailable fonts can substitute.
- A late OS DNS lookup can finish after cancellation; its answer cannot start an HTTP connection.
- Cancel after import commit does not delete the ready asset. Check the library before retrying.
- Insertion is a revision save; Cancel applies to import/export, not committed edits.
- Changing Chat aborts import/export. PDF excludes unsaved editor drafts.

## Dependencies and compatibility

playwright-core 1.56.1: Apache-2.0, Node >=18, no browser install hook.
pdf-lib 1.17.1: MIT. New transitives: @pdf-lib/standard-fonts 1.0.0 and @pdf-lib/upng 1.0.1 (MIT),
pako 1.0.11 (MIT AND Zlib), tslib 1.14.1 (0BSD). Installed metadata was inspected.
No new pnpm build-policy exception. Existing deprecated review-tool dependencies were not changed.
PDF.js and its optional native canvas already existed and provide independent inspection.

Existing session/web/deck/material schemas remain unchanged. assets.sqlite and image-assets are additive profile data.
No source files are written. Host extensions are optional for existing embeddings.
Old clients/binaries do not resolve image markers. Rollback must keep assets.sqlite and image-assets.
Legacy HTML remains readable; new image publications require owned markers.
Context observation now includes the asset manifest, preventing stale checkpoint promotion after imports.
No commit, push, Issue publication or default-runtime switch occurred.

## Owner smoke confirmation

Owner confirmed the six-case basic smoke PASS in chat on 5 November 2026. This is an aggregate report; exact manual candidate SHA, browser/model versions and itemized artifacts were not supplied. Extended cancellation/isolation checks and G-003/G-006 remain open. G-007 stays NOT VERIFIED.
