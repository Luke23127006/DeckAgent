# TASK-003-A — Request model/effort contracts and Responses API adapter

**Task Group:** [TASK-003](README.md) · **Lane:** A · **Can start in parallel with:** TASK-003-B and TASK-003-C.  
**Entry condition:** G-002 PASS. Keep saved V1 provider configuration and model selection functional.

## Expected result

Request model/effort contracts and Responses API adapter. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/05-business-rules/BR-005.md
- docs/spec/04-requirements/fr/FR-042.md
- docs/spec/04-requirements/fr/FR-055.md
- docs/spec/04-requirements/fr/FR-081.md
- tests/model-providers.test.mjs

Also read these existing/target implementation paths before editing:

- packages/agent/runtime/src/contracts.ts
- packages/llm/providers/src/index.ts
- packages/llm/providers/src/ (protocol adapters)/**
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/web-request.ts

## Owned files (do not cross ownership)

- packages/agent/runtime/src/contracts.ts
- packages/llm/providers/src/index.ts
- packages/llm/providers/src/ (protocol adapters)/**
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/web-request.ts

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Update `ModelSelection` to allow optional per-model reasoningLevel while keeping old two-field data valid.
2. Add a protocol variant for OpenAI Responses at the ProviderSettings/adapter boundary without changing existing protocol IDs.
3. Implement an OpenAI Responses adapter that converts DeckAgent messages/tool schema to supported request fields and parses streamed/tool outputs back to runtime events.
4. Keep provider key/baseURL settings outside model-visible prompt and logs; preserve existing network/certificate error classification.
5. Capture model, effort, provider key, endpoint and metadata once at start of request; reuse snapshot through clarification/reply.
6. Validate unsupported effort/protocol combinations before starting model work; no silent mapping to another provider option.
7. Publish M1-M4 JSON fixtures for C metadata implementation and B model picker. Update adapter tests with mocked HTTP service.

## Acceptance checklist

- [ ] Responses protocol uses correct request/response shapes
- [ ] Old selections deserialize
- [ ] Running request keeps model snapshot
- [ ] Invalid effort fails clearly

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:model-providers
pnpm test:agent-runtime
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-003 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
