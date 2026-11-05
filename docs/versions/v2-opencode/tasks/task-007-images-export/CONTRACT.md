# Image assets and PDF contract

Owner selected Internet images and PDF on 4 November 2026. Baseline: clean
`38892fa`, Task 006 committed. G-003/G-006 remain as recorded, without gate reset.
Decision: [image/PDF architecture](../../../../adr/0007-internet-image-assets-and-pdf-export.md).

## Shared behavior

- ImageAsset: Chat-owned ID, PNG/JPEG MIME, dimensions, hash and original/final
  source URL. No Host path or credentials in tool output.
- User-only URL import. Model tools list existing assets and insert an approved
  ID into a scoped slide. No arbitrary model-directed network fetch.
- DeckService accepts only owned asset markers; browser rendering uses data URLs
  in an optional displayHtml projection. Original HTML remains canonical.
- FrozenDeck: deck version, outline identity and ordered immutable slide revisions
  captured together. Exports use this snapshot despite concurrent later edits.
- PDF is a direct authenticated download. Cancel/disconnect/shutdown aborts and
  drains work. No model invocation, project write or partial-success artifact.
- Existing HTML edit/publication contracts remain; additive asset/preview/export
  methods update Host, client, tools, tests and documentation together.

## Proposed placement frozen before implementation

Single implementer across A/B/C lanes; no concurrent editors.

| Lane | Files | Responsibility |
| --- | --- | --- |
| A | packages/presentation/deck/src/contracts.ts, index.ts, image-assets.ts | Frozen snapshot, owned image markers and revision-aware image insertion |
| A | apps/local-web/src/image-assets/store.ts, network.ts; export-pdf.ts; index.ts | Asset bytes/metadata, constrained fetch, safe renderer, composition/cleanup |
| A | packages/host/api/src/contracts.ts, index.ts | Optional image/render/PDF operations and cancellation |
| B | packages/client/runtime/src/image-export.ts, deck-client.ts, deck-model.ts, deck-canvas.ts, slide-editor.ts | URL import, selected-slide insertion, preview hydration and download/cancel |
| C | packages/tools/presentation/src/insert-image.ts, index.ts; apps/local-web/src/web-request.ts | Chat asset manifest and scoped MCP insertion |
| C | tests/images-export.test.mjs, images-export-browser.test.mjs, images-export-live.test.mjs; synthetic fixtures | Egress, ownership, frozen output, independent PDF viewer and live evidence |
| A | manifests/lockfile, test commands and task docs | Pinned libraries and evidence |

No source-folder mutation, custom agent loop or production backend switch.

## Qualification

Start with frozen-revision and asset-ownership tests. Validate network denials,
redirects, checked-IP pinning, byte/format limits and failure/cancel cleanup.
Exercise real browser/PDF rendering and independent pdfjs inspection for text,
Vietnamese fonts, images, page count/order and direct edits. Compare canonical
HTML/revision hashes before/after failures and concurrent export edits. Keep real
Internet/model observations separate from fixtures and owner manual acceptance.

Renderer/library pins to review: playwright-core 1.56.1 (Apache-2.0), pdf-lib
1.17.1 (MIT). Only trusted renderer output enters the PDF merger. Installed browser
path is operator-controlled, not a browser/model argument. Existing image parser
workers provide decoded format and size validation; no OCR/image service added.
