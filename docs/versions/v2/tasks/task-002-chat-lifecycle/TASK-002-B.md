# TASK-002-B — Unblocked Chat navigation and activity presentation

**Task Group:** [TASK-002](README.md) · **Lane:** B · **Can start in parallel with:** TASK-002-A and TASK-002-C.  
**Entry condition:** G-001 PASS and stable `workspaceId`/`sessionId` ownership. Do not change deck-generation semantics.

## Expected result

Unblocked Chat navigation and activity presentation. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/03-use-cases/UC-006.md
- docs/spec/03-use-cases/UC-003.md
- docs/spec/04-requirements/fr/FR-070.md
- DeepSeek packages/client/ui-chat/README.md

Also read these existing/target implementation paths before editing:

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/conversation-view.ts
- packages/client/runtime/src/host-client.ts
- packages/client/runtime/src/management-client.ts
- packages/client/runtime/src/question-view.ts
- client-owned stylesheets

## Owned files (do not cross ownership)

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/conversation-view.ts
- packages/client/runtime/src/host-client.ts
- packages/client/runtime/src/management-client.ts
- packages/client/runtime/src/question-view.ts
- client-owned stylesheets

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Locate `switchingBlocked()` in `boot.ts`; remove its global navigation prohibition while retaining the one-active-request-per-Chat send restriction.
2. Render running/awaiting/finished/unread indicators for Chat rows using L1; do not infer request success from disappearance of an SSE stream.
3. Key question UI, input drafts, selected model and request controls by `sessionId`; changing Chat must detach only the view subscription.
4. Reconnect to the selected Chat on return using Host request/activity snapshots, then follow fresh events without duplicate rows.
5. Keep Activity Log inside Conversation, with expandable detail, failure state and elapsed time; opening activity detail is read-only.
6. Preserve a user's unsent text when navigating away and back as required by the existing draft behavior.
7. Add component/browser tests for X->Y->X, awaiting reply and stop; UI must never call a cancel action on Chat switch.

## Acceptance checklist

- [ ] Live switch while request runs
- [ ] Correct Chat-specific indicators
- [ ] No draft leakage
- [ ] Activity detail read only

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:browser-smoke
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-002 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
