# TASK-007-B — Context meter, compact interaction and final UI alignment

**Task Group:** [TASK-007](README.md) · **Lane:** B · **Can start in parallel with:** TASK-007-A and TASK-007-C.  
**Entry condition:** G-006 PASS; selected model metadata and durable Session/Deck/Attachment storage exist.

## Expected result

Context meter, compact interaction and final UI alignment. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/03-use-cases/UC-015.md
- docs/spec/04-requirements/fr/FR-078.md
- docs/spec/04-requirements/fr/FR-079.md
- DeepSeek packages/client/ui-conversation/src/client/skeleton/ContextMeter.tsx

Also read these existing/target implementation paths before editing:

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/conversation-view.ts
- packages/client/runtime/src/management-client.ts
- packages/client/runtime/src/host-client.ts
- new packages/client/runtime/src/context-meter.ts
- client-owned stylesheets

## Owned files (do not cross ownership)

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/conversation-view.ts
- packages/client/runtime/src/management-client.ts
- packages/client/runtime/src/host-client.ts
- new packages/client/runtime/src/context-meter.ts
- client-owned stylesheets

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Place a compact Context Usage meter below Composer; clicking opens used/window breakdown only where C1 has valid data.
2. Label provider-reported usage versus DeckAgent estimate; show Unknown when no reliable usage or window exists.
3. At the percentage defined in `BR-010`, suggest Compact without triggering it automatically.
4. Offer a deliberate Compact action and explain that later model work uses a summary; the action itself is confirmation, no second dialog required.
5. Hide/disable compact during an active or awaiting request with a clear reason. Never queue an automatic compact for later.
6. After success, show the checkpoint location in Conversation while keeping all prior messages readable.
7. After failure, keep the draft, messages and old context state; show retry only when user chooses it.
8. Run UI integration smoke: Chat switching, permissions, attachments, Web Search, Model picker and Deck Canvas remain reachable.

## Acceptance checklist

- [ ] Composer meter accurately labeled
- [ ] Manual-only Compact
- [ ] Threshold suggestion not automatic
- [ ] History visible after compact

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:browser-smoke
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-007 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
