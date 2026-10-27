# TASK-006-B — Web Research Settings and Activity UI

**Task Group:** [TASK-006](README.md) · **Lane:** B · **Can start in parallel with:** TASK-006-A and TASK-006-C.  
**Entry condition:** G-005 PASS; permission policy and scoped materials exist. No external research provider is automatically approved.

## Expected result

Web Research Settings and Activity UI. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/04-requirements/fr/FR-088.md
- docs/spec/04-requirements/fr/FR-089.md
- DeepSeek packages/client/ui-settings-web-search/README.md
- docs/spec/03-use-cases/UC-003.md

Also read these existing/target implementation paths before editing:

- packages/client/runtime/src/settings-panel.ts
- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/conversation-view.ts
- packages/client/runtime/src/management-client.ts
- new packages/client/runtime/src/web-research-settings.ts
- client-owned stylesheets

## Owned files (do not cross ownership)

- packages/client/runtime/src/settings-panel.ts
- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/conversation-view.ts
- packages/client/runtime/src/management-client.ts
- new packages/client/runtime/src/web-research-settings.ts
- client-owned stylesheets

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Add Settings → Tools → Web Research section, preserving current Settings → Models and without introducing DeepSeek React/Slots.
2. Show separate Search and Fetch provider selectors, credential presence (never key value), endpoint/config validation and disabled/unavailable state.
3. Label provider status honestly: installed/available is distinct from Product Owner approved and usable.
4. Expose source citations and search/fetch Activity details within Conversation; show what was obtained, what could not be verified and why.
5. When a research step fails and result is incomplete, show the user's explicit Continue/Retry choice in the same request, using R4 contract.
6. Keep unsent draft and selected Chat unchanged when the user views/edits research settings.
7. Use mocked R1/R2/R4 states for pending, empty results, denied, and partial research. Never show raw provider secrets in DOM or logs.

## Acceptance checklist

- [ ] Settings show provider/approval state
- [ ] Search activity has sources
- [ ] Explicit retry UX
- [ ] No key echo

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:browser-smoke
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-006 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
