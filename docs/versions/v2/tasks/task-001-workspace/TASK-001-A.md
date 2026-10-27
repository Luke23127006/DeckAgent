# TASK-001-A — Workspace registry, application storage and migration

**Task Group:** [TASK-001](README.md) · **Lane:** A · **Can start in parallel with:** TASK-001-B and TASK-001-C.  
**Entry condition:** V1 Local Web starts, SessionStore / DeckService persistence works, and no V2 schema change has been applied.

## Expected result

Workspace registry, application storage and migration. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/03-use-cases/UC-013.md
- docs/spec/04-requirements/fr/FR-071.md
- docs/spec/04-requirements/fr/FR-073.md
- docs/spec/04-requirements/fr/FR-083.md
- docs/spec/04-requirements/fr/FR-084.md
- docs/adr/ (existing decisions, if present)

Also read these existing/target implementation paths before editing:

- apps/local-web/src/index.ts
- apps/local-web/src/cli.ts
- apps/local-web/src/web-state.ts
- packages/session/persistence/src/index.ts
- packages/session/persistence/src/schema.ts
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- new packages/workspace/registry/** (proposed)

## Owned files (do not cross ownership)

- apps/local-web/src/index.ts
- apps/local-web/src/cli.ts
- apps/local-web/src/web-state.ts
- packages/session/persistence/src/index.ts
- packages/session/persistence/src/schema.ts
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- new packages/workspace/registry/** (proposed)

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Inspect CLI defaults and `startLocalWeb`: `workspace` currently means shared Agent work root; `dataDir` is relative to process directory. Record current path behavior before changing it.
2. Introduce application-owned storage default resolved from the user profile; retain explicit `--data-dir` override. Keep application data distinct from user project roots and reject dangerous overlap.
3. Create persistent Workspace Registry with stable IDs, default Workspace, canonical-folder uniqueness and missing-folder state. No content is copied merely because a folder is registered.
4. Persist `workspaceId` for sessions; migrate existing V1 sessions into the stable default Workspace without changing `sessionId`. Do not assign removed Workspace Chats to Default.
5. Extend `WebManagement`, Host routing and `WebState` to list/add/remove/repoint Workspaces and create Chats under one Workspace. Validate every inbound ID and folder choice.
6. Implement explicit, idempotent legacy import: source location, backup, integrity check, staged install, final swap, failure rollback; preserve existing sessions, decks, activities, providers and credentials.
7. Pass sourceRoot/workRoot information to request composition using the agreed W3 contract. Do not edit `packages/tools/filesystem/src/*`; C owns tool enforcement.
8. Update session/schema and local-web tests for schema v1->v2 and restart, including migration interruption. Keep old fixtures for compatibility.

## Acceptance checklist

- [ ] Workspace registry survives restart
- [ ] default Workspace cannot be deleted
- [ ] missing project folder cannot remove Chat history
- [ ] schema migration preserves V1 data
- [ ] App Storage is outside project folder

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:session-persistence
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-001 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
