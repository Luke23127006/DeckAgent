# TASK-003-C — Provider persistence, model catalog metadata and validation fixtures

**Task Group:** [TASK-003](README.md) · **Lane:** C · **Can start in parallel with:** TASK-003-A and TASK-003-B.  
**Entry condition:** G-002 PASS. Keep saved V1 provider configuration and model selection functional.

## Expected result

Provider persistence, model catalog metadata and validation fixtures. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/05-business-rules/BR-005.md
- docs/spec/05-business-rules/BR-006.md
- docs/spec/05-business-rules/BR-008.md
- apps/local-web/src/web-state.ts (read only)

Also read these existing/target implementation paths before editing:

- apps/local-web/src/provider-settings.ts
- apps/local-web/src/built-in-providers.ts
- tests/model-catalog.test.mjs
- tests/provider-switch.test.mjs
- new tests/v2-model-capabilities.test.mjs

## Owned files (do not cross ownership)

- apps/local-web/src/provider-settings.ts
- apps/local-web/src/built-in-providers.ts
- tests/model-catalog.test.mjs
- tests/provider-switch.test.mjs
- new tests/v2-model-capabilities.test.mjs

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Keep the four existing provider IDs (`openai`, `anthropic`, `google`, `deepseek`) stable when extending ProviderStore data.
2. Store optional model descriptors separately per provider/model and preserve manually entered unknown model IDs.
3. Make capability resolution explicit: verified provider metadata, accepted user edits and Unknown; never infer supported effort from provider name alone.
4. Keep ProviderStore `capture` behavior compatible with A's request snapshot; coordinate the agreed descriptor format before writing.
5. Keep default model list release-owned, separate from live provider catalog. Because BR-005 V-5 is not set, do not populate any guessed default IDs.
6. Add mocked provider tests for missing catalog, removed model, incompatible effort, valid and rejected custom API protocols.
7. Produce a provider/model compatibility evidence matrix with tested input/output/tool-call support. Report untested live-provider claims honestly.

## Acceptance checklist

- [ ] Provider IDs stable
- [ ] Unknown metadata preserved
- [ ] No invented release model defaults
- [ ] Catalog failure does not erase saved custom models

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:model-providers
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-003 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
