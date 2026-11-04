# TASK-002-C — Request lifecycle, Activity and recovery contract tests

**Task Group:** [TASK-002](README.md) · **Lane:** C · **Can start in parallel with:** TASK-002-A and TASK-002-B.  
**Entry condition:** G-001 PASS and stable `workspaceId`/`sessionId` ownership. Do not change deck-generation semantics.

## Expected result

Request lifecycle, Activity and recovery contract tests. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- packages/host/api/src/request-controller.ts (read only)
- packages/client/runtime/src/boot.ts (read only)
- docs/spec/04-requirements/fr/FR-054.md
- docs/spec/04-requirements/fr/FR-070.md

Also read these existing/target implementation paths before editing:

- tests/host-api.test.mjs
- tests/web-session.test.mjs
- tests/web-management.test.mjs
- tests/recovery-editing.test.mjs
- new tests/v2-concurrent-chat.test.mjs

## Owned files (do not cross ownership)

- tests/host-api.test.mjs
- tests/web-session.test.mjs
- tests/web-management.test.mjs
- tests/recovery-editing.test.mjs
- new tests/v2-concurrent-chat.test.mjs

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Build fixtures with two Session IDs and two independent long-running mocked Agent handles.
2. Write tests for one request per Chat and concurrent requests across Chats, including mixed completed/failed activity states.
3. Write stale reply/stop tests: X question version 1 cannot be answered by Y payload or replaced X version.
4. Write browser reload/Host restart cases with persisted unknown request statuses and no fabricated success.
5. Add Activity detail verification that persisted order, error code and historyStart/noticeIndex remain consistent.
6. Run existing regression-editing tests and preserve outline/slide state after stop or failed request.
7. Publish a compact test matrix for A and B, then execute full cross-lane tests at G-002; report any unmet FR instead of modifying owner files.

## Acceptance checklist

- [ ] Two-request concurrency verified
- [ ] Stale reply rejected
- [ ] Recovery status trustworthy
- [ ] Activity order stable

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:recovery-editing
pnpm test:local-web
pnpm test:tools-browser
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-002 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
