# TASK-002-A — Provider capture and history contract

Owner: Codex, lane A and integrator. Status: PASS for implementation and automated lane checks.
Group G-002 remains NOT VERIFIED; this does not claim full release/provider acceptance.
Group: [Restore provider and session compatibility](README.md). Entry dependency: G-001.

## Deliverable

Extend Gemini-only capture through validated mappings. Specify history projection, tool-pair persistence, continuation and execution identity. Preserve schemas unless a separately reviewed compatibility need requires change.

## File ownership

apps/local-web/src/provider-settings.ts; apps/local-web/src/provider-generation-options.ts;
apps/local-web/src/opencode/{agent,provider,history,config}.ts; root scripts and runtime guide.
Public agent/session contracts and persistence schema were retained without changes.

Placement is the existing app-local adapter seam. No package boundary or schema change was needed.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Copied legacy profile round trip; settings changes during a request; crash between tool call/result; no duplicate continuation input or replay.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-002 also needs [integrated scenarios](README.md).
