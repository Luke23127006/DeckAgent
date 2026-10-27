# TASK-004-A — Permission domain, persisted grants and approval lifecycle

**Task Group:** [TASK-004](README.md) · **Lane:** A · **Can start in parallel with:** TASK-004-B and TASK-004-C.  
**Entry condition:** G-003 PASS; per-Chat work/source roots and per-Chat request state exist.

## Expected result

Permission domain, persisted grants and approval lifecycle. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/05-business-rules/BR-009.md
- docs/spec/04-requirements/fr/FR-075.md
- docs/spec/04-requirements/fr/FR-076.md
- docs/spec/04-requirements/fr/FR-077.md
- DeepSeek docs/subsystems/permission-presets.md

Also read these existing/target implementation paths before editing:

- new packages/security/permissions/**
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- packages/host/api/src/request-controller.ts
- apps/local-web/src/web-state.ts
- apps/local-web/src/index.ts
- apps/local-web/src/web-request.ts

## Owned files (do not cross ownership)

- new packages/security/permissions/**
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- packages/host/api/src/request-controller.ts
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

1. Create session-scoped Permission domain with exact two preset IDs and default Workspace Access; no Full Access choice.
2. Store per-Chat selected preset and continuing grants with explicit normalized scope and revocation; preserve them across restart.
3. At request start, capture the exact effective permission snapshot and approved continuing grants. Later changes cannot mutate an active request.
4. Add a typed approval request separate from a clarification question, including approvalId, requestId, sessionId, action, target and reason.
5. Extend RequestController to suspend the targeted tool call until a valid versioned approval answer; stale/mismatched/duplicate answers must not replay work.
6. Ensure user denial/no answer has the FR-076 behavior; no approval ever expands permission to another Chat or original project-file writes.
7. Provide P1-P4 fixtures to B/C. Bind C's tool enforcement to A's policy; never rely on model prompt as enforcement.
8. Add Host behavior tests for grant lifecycle, revocation and request-time snapshot.

## Acceptance checklist

- [ ] Durable per-Chat presets and grants
- [ ] Versioned approval cannot replay
- [ ] Approval/clarification distinct
- [ ] Snapshot stable

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:tools-browser
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-004 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
