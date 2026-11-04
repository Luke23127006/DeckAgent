# TASK-007-A — Context projection, manual compact API and durable checkpoint

**Task Group:** [TASK-007](README.md) · **Lane:** A · **Can start in parallel with:** TASK-007-B and TASK-007-C.  
**Entry condition:** G-006 PASS; selected model metadata and durable Session/Deck/Attachment storage exist.

## Expected result

Context projection, manual compact API and durable checkpoint. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/03-use-cases/UC-015.md
- docs/spec/04-requirements/fr/FR-078.md
- docs/spec/04-requirements/fr/FR-079.md
- DeepSeek packages/compaction/command-compact/README.md

Also read these existing/target implementation paths before editing:

- packages/agent/runtime/src/contracts.ts
- packages/agent/runtime/src/ (context projection modules)/**
- packages/session/persistence/src/index.ts
- packages/session/persistence/src/schema.ts
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/web-state.ts
- apps/local-web/src/web-request.ts

## Owned files (do not cross ownership)

- packages/agent/runtime/src/contracts.ts
- packages/agent/runtime/src/ (context projection modules)/**
- packages/session/persistence/src/index.ts
- packages/session/persistence/src/schema.ts
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/web-state.ts
- apps/local-web/src/web-request.ts

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Add C1 context projection from a known provider limit and measured/estimated usage, recording source and confidence explicitly.
2. Use `BR-010` for threshold behavior; missing metadata yields Unknown instead of a fabricated percentage.
3. Add a user-invoked compact endpoint scoped to Session; reject while a request is running or awaiting user; do not queue compact.
4. Create a separate persisted summary/checkpoint, retaining original Session messages, attachments, outline, deck and Activity records.
5. When building the next model request, use C3 summary projection for older span plus newer original messages. Never silently change user-visible history.
6. If the summarizing model fails or user cancels, preserve old checkpoint, old history and all saved work atomically.
7. Publish C1-C4 examples for B and C; test multiple compactions, restart and model change with unknown limits.
8. Run full Host/Runtime and Session persistence regressions; record any added API or schema compatibility migration.

## Acceptance checklist

- [ ] Manual compact only
- [ ] History never deleted
- [ ] Failure atomic
- [ ] Usage source labeled

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:agent-runtime
pnpm test:session-persistence
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-007 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
