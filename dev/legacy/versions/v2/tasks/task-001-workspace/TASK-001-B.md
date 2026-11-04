# TASK-001-B — Workspace picker, grouped Chats and folder-state UI

**Task Group:** [TASK-001](README.md) · **Lane:** B · **Can start in parallel with:** TASK-001-A and TASK-001-C.  
**Entry condition:** V1 Local Web starts, SessionStore / DeckService persistence works, and no V2 schema change has been applied.

## Expected result

Workspace picker, grouped Chats and folder-state UI. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/03-use-cases/UC-013.md
- docs/spec/03-use-cases/UC-012.md
- docs/spec/04-requirements/fr/FR-074.md
- packages/client/runtime/src/model-picker.ts
- DeepSeek packages/client/ui-workspace/README.md

Also read these existing/target implementation paths before editing:

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/management-client.ts
- new packages/client/runtime/src/workspace-view.ts (proposed)
- client-owned stylesheets associated with Workspace UI

## Owned files (do not cross ownership)

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/management-client.ts
- new packages/client/runtime/src/workspace-view.ts (proposed)
- client-owned stylesheets associated with Workspace UI

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Keep existing `chat-navigation`, Conversation and Deck Canvas; add Workspace group headers above Chats in Left Sidebar (do not replace the whole client).
2. Use W1/W2 fixture responses to implement Workspace list, Add Workspace with folder picker, current Workspace indicator and New Chat in that Workspace.
3. Provide Workspace row actions to remove or change folder; show why blocked when a Chat request is running or awaiting user.
4. Place ungrouped Chats in a visible Ungrouped section after Workspace removal; do not silently move them to Default Workspace.
5. Show a missing-folder state without blocking conversation/history/deck viewing. For reference chips, mark unavailable where folder identity changed.
6. Keep active Chat selection and unsent request text scoped to `sessionId`; preserve existing deck navigation behavior.
7. Implement loading/error/empty cases; use `ManagementClient` only, not direct database or filesystem access.
8. Add browser smoke cases for grouping and navigation with mocked W1/W2 snapshots; request API changes through A rather than editing Host files.

## Acceptance checklist

- [ ] Workspace and Chat ownership visible
- [ ] removed Workspace Chats reachable as Ungrouped
- [ ] missing-folder state explained
- [ ] no regression to Deck Canvas or draft text

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:browser-smoke
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-001 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
