# TASK-005-A — Durable attachment store, request references and authenticated upload API

**Task Group:** [TASK-005](README.md) · **Lane:** A · **Can start in parallel with:** TASK-005-B and TASK-005-C.  
**Entry condition:** G-004 PASS; Chat owner, private storage and permission policy are available.

## Expected result

Durable attachment store, request references and authenticated upload API. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/03-use-cases/UC-003.md
- docs/spec/04-requirements/fr/FR-015.md
- docs/spec/04-requirements/fr/FR-049.md
- docs/spec/04-requirements/fr/FR-082.md
- docs/spec/05-business-rules/BR-001.md

Also read these existing/target implementation paths before editing:

- new packages/materials/attachment-store/**
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/index.ts
- apps/local-web/src/web-state.ts
- apps/local-web/src/web-request.ts

## Owned files (do not cross ownership)

- new packages/materials/attachment-store/**
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/index.ts
- apps/local-web/src/web-state.ts
- apps/local-web/src/web-request.ts

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Define S1/S2/S3 types and authoritative Session ownership checks for every attachment/referenced-file operation.
2. Implement a streamed, size-bounded authenticated upload endpoint; do not put raw file bytes into the existing 20KiB JSON request API.
3. Stage uploads, validate file identity/status, then atomically save durable bytes and metadata before linking into the request.
4. Keep private attachment storage under Application Storage with per-Chat permission; prevent client-supplied paths from selecting arbitrary host files.
5. Extend request validation so an empty text is accepted only with at least one ready attachment/reference; keep old text-only/presentation requests valid.
6. Persist source references as identity/path records without copying referenced user files; recheck folder identity, availability and grant at use.
7. Connect C's parser to Agent tool access through policy-authorized source IDs. Do not expose internal attachment root to the model.
8. Update Host and local-web tests for upload lifecycle, restart, orphan cleanup and wrong-session IDs.

## Acceptance checklist

- [ ] Durable per-Chat attachments
- [ ] Authenticated bounded uploads
- [ ] Reference not duplicated into attachment
- [ ] Empty-text material request accepted

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:tools-browser
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-005 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
