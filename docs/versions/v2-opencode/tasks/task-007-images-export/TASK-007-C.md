# TASK-007-C — Image acquisition and artifact qualification

Owner: lane C, implemented by Codex. Status: IMPLEMENTED; owner basic smoke PASS; focused CLI/live checks PASS.
Group: [Deliver images and usable export](README.md). Entry dependency: G-003; G-006 before final artifact integration.

## Deliverable

Select approved service/route and pin dependencies. Specify outgoing data. Apply URL/redirect/private-address checks for Internet fetch, or credential/prompt boundaries for AI service. Validate asset format/dimensions/limits.

## File ownership

apps/local-web/src/image-assets/network.ts; presentation MCP tools; image/PDF tests.

Exact paths are recorded in [CONTRACT.md](CONTRACT.md). No arbitrary URL-fetch tool is exposed.
list_image_assets returns the captured Chat manifest. insert_image checks Host slide scope,
owned asset, expected revision, publication identity and cancellation before publication.

## Verification

Controlled egress plus approved live route; unavailable means no calls; no private material leaks; independent-viewer fidelity evidence.

PASS: public-address pinning, mixed/private DNS denial, redirect checks, format/byte limits,
late-DNS cancellation and disabled import. Real pinned CLI rejects wrong slide/asset/revision
and deduplicates insertion. Real Gemini calls the new MCP tool after a public HTTPS import.
PDF.js checks text/order/image operators and independent raster output.
Initial prompt failures and environment/fidelity limits remain in HANDOFF.md.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-007 also needs [integrated scenarios](README.md).

## Owner smoke confirmation

Owner confirmed the six-case basic smoke PASS in chat on 5 November 2026. This is an aggregate report; exact manual candidate SHA, browser/model versions and itemized artifacts were not supplied. Extended cancellation/isolation checks and G-003/G-006 remain open. G-007 stays NOT VERIFIED.
