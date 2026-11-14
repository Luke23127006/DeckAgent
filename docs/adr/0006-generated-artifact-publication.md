---
status: accepted
---

# Generated artifacts and publication

Use Host-owned staging and immutable publication with the [review/generation contracts](0005-outline-generation-contracts.md). The [accepted decision](https://github.com/Luke23127006/DeckAgent/issues/92) limits image use to prepared attachments and preserves the read-only project policy. This defines the implementation contract, not a claim that its runtime checks already pass.

## Source and asset contract

Model HTML source is bounded at 256 KiB per slide. The MCP bridge retains its 64 KiB request bound. Stage text chunks of at most 8 KiB UTF-8 with sequence/final metadata, measuring the complete envelope too. Host supplies opaque stage IDs, next sequence and final digest. Identical chunk retries are idempotent; different bytes at one sequence conflict. Initial guards allow 64 chunks per stage and two open stages per request. Partial chunks are never Preview content.

Use prepared PNG/JPEG attachments, copied as immutable normalized PNG assets in Application Storage. Each asset retains the 256 KiB prepared-image bound; initial combined image bytes are at most 1 MiB per slide. The standard image-text layout uses one image; a fallback with more images still has to fit layout and byte guards. Preserve attachment/source version and digest. An exceeded bound is an actionable error, not permission to cut content.

No image search/generation service, automatic OCR or model switch is introduced. A model that cannot accept image input must report that limitation. Essential image requirements cannot silently become placeholders without the user's choice.

HTML refers to logical assets instead of model-supplied base64 or paths. Preview reads authenticated revision/asset IDs and materializes only validated image data URLs. Parent and opaque iframe CSP must allow that exact image mechanism without enabling slide HTTP/file access. The source byte bound excludes trusted image materialization; actual renderer behavior and memory still need checks.

## Publish boundary

Publish takes stage ID, planned slide ID, expected revision and publication ID. Host checks active request, phase, Chat/Deck, confirmed plan, scope and immutable visual snapshot. Model arguments never choose the grant. The publication digest covers source, assets, provenance, visual identity and expected revision.

Write and validate durable source/assets first; then commit revision/current pointer/receipt in one metadata transaction. Emit success only after commit. An identical retry returns the same receipt, conflicting input fails, and failed staging/commit leaves last-good pointers unchanged. Recovery removes only unreferenced staged artifacts and never deletes a published revision.

Code creates the document wrapper and theme stylesheet. Model supplies content/layout under parsed HTML/CSS validation, allowlists and rendered checks. Reject active code, navigation, embeds, imports, network references and non-managed assets. The old regex is not a complete proof; sandbox/CSP remain required. Model-chosen colours/fonts use effective theme values, while valid explicit user overrides are retained. Code does not repair content silently; known missing requirements, unreadability or other blocking faults leave the slide unfinished.

## Persistence and verification

Deck DB migration retains v1/v2 proposals and HTML revisions. Session schema v7 data remains readable; new linkage columns/tables require a new version if added. Missing legacy Brief/theme metadata stays explicitly missing instead of being fabricated. Older binaries refuse unsupported versions; downgrade is not promised.

Update public types, decoders, fixed error allowlists, activity projections and tests together. Keep domain errors actionable without exposing paths, keys or provider errors. Verify stale/duplicate/mixed confirmation, crash windows, chunk conflict/partial source, Stop/late publication, foreign grants, theme/source checks, real HTML/CSS/CSP/image negatives, restart and no project writes. A full deck smoke and real provider generation remain required; this decision is not runtime evidence.

The [reassessment issue](https://github.com/Luke23127006/DeckAgent/issues/102) keeps the review of initial staging/layout/asset bounds after real rendered output. Changes need a recorded reason, compatibility rules and matching checks. Historical artifacts keep their original manifest and visual snapshots; changing today's limits does not silently rewrite them.
