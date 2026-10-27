# TASK-003-B — Models Settings UI and per-chat model/effort picker

**Task Group:** [TASK-003](README.md) · **Lane:** B · **Can start in parallel with:** TASK-003-A and TASK-003-C.  
**Entry condition:** G-002 PASS. Keep saved V1 provider configuration and model selection functional.

## Expected result

Models Settings UI and per-chat model/effort picker. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/03-use-cases/UC-005.md
- docs/spec/04-requirements/fr/FR-055.md
- docs/spec/04-requirements/fr/FR-081.md
- DeepSeek packages/client/ui-model-selection/README.md
- DeepSeek packages/client/ui-settings-models/README.md

Also read these existing/target implementation paths before editing:

- packages/client/runtime/src/model-picker.ts
- packages/client/runtime/src/settings-panel.ts
- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/management-client.ts
- client-owned stylesheets

## Owned files (do not cross ownership)

- packages/client/runtime/src/model-picker.ts
- packages/client/runtime/src/settings-panel.ts
- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/management-client.ts
- client-owned stylesheets

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Keep Settings → Models as the provider/model configuration surface and selected-model control in Composer.
2. Add per-added-model fields: display name, context window, max output, input modalities and reasoning options; mark missing values Unknown.
3. Add API protocol choice for custom model API, with the exact four protocols from BR-005 exposed through Host-provided options.
4. Show a reasoning chooser only when the selected model has confirmed reasoning options. Changing model clears incompatible earlier effort.
5. Allow choosing model and effort while the current request runs; the new choice applies only to later requests.
6. Keep unsaved edits local; cancelling or failed save does not change saved configuration or the selected model.
7. Use mocks for M1-M4 and build keyboard/empty/error tests; do not add invented catalog defaults to UI.

## Acceptance checklist

- [ ] Model effort UI is capability-aware
- [ ] Running request does not block selection
- [ ] Unknown fields not fabricated
- [ ] Failed save keeps draft

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:browser-smoke
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-003 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
