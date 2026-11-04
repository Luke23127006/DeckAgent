# TASK-002-A — Per-chat Host lifecycle and durable request projection

**Task Group:** [TASK-002](README.md) · **Lane:** A · **Can start in parallel with:** TASK-002-B and TASK-002-C.  
**Entry condition:** G-001 PASS and stable `workspaceId`/`sessionId` ownership. Do not change deck-generation semantics.

## Expected result

Per-chat Host lifecycle and durable request projection. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/03-use-cases/UC-006.md
- docs/spec/04-requirements/fr/FR-054.md
- docs/spec/04-requirements/fr/FR-070.md
- tests/host-api.test.mjs

Also read these existing/target implementation paths before editing:

- packages/host/api/src/request-controller.ts
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/web-state.ts
- apps/local-web/src/index.ts
- apps/local-web/src/web-request.ts

## Owned files (do not cross ownership)

- packages/host/api/src/request-controller.ts
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/web-state.ts
- apps/local-web/src/index.ts
- apps/local-web/src/web-request.ts

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Read current Session-keyed RequestController and persisted requests/activities before editing; preserve one active request per Chat, not one per application.
2. Extend management snapshots with stable per-Chat active/waiting/completed state and a generation/sequence guard for SSE reconnection.
3. Keep `submit`, `reply`, `stop` tied to exact IDs. A late reply or stop must never apply to a different Chat.
4. Keep Host restart behavior: persist interrupted state as unknown, do not restart Agent work automatically.
5. Allow concurrent requests across different Chats while maintaining per-Session exclusion and correct recovery notices.
6. Preserve all existing event persistence and request model capture; do not replace the request architecture with DeepSeek Event Sourcing.
7. Implement Host/API test cases with simultaneous Chat X and Y and stale replies; publish L1/L2 examples for B/C.

## Acceptance checklist

- [ ] Independent Chat requests
- [ ] Reconnection obtains consistent state
- [ ] Stop/reply cannot target other Chat
- [ ] No auto-resume

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:tools-browser
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-002 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
