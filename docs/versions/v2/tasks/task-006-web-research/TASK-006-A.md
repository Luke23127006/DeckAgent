# TASK-006-A — Web capability seam, tool registration and request-local research lifecycle

**Task Group:** [TASK-006](README.md) · **Lane:** A · **Can start in parallel with:** TASK-006-B and TASK-006-C.  
**Entry condition:** G-005 PASS; permission policy and scoped materials exist. No external research provider is automatically approved.

## Expected result

Web capability seam, tool registration and request-local research lifecycle. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/04-requirements/fr/FR-088.md
- docs/spec/04-requirements/fr/FR-089.md
- docs/spec/04-requirements/fr/FR-090.md
- DeepSeek docs/subsystems/web.md
- DeepSeek packages/web/web/README.md

Also read these existing/target implementation paths before editing:

- new packages/research/web-core/**
- apps/local-web/src/web-request.ts
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/index.ts
- packages/host/api/src/request-controller.ts

## Owned files (do not cross ownership)

- new packages/research/web-core/**
- apps/local-web/src/web-request.ts
- packages/host/api/src/contracts.ts
- packages/host/api/src/index.ts
- apps/local-web/src/index.ts
- packages/host/api/src/request-controller.ts

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Compare DeepSeek `ctx.web` contract with DeckAgent ToolRegistry/ModelAdapter; document direct-reuse or thin-adapter decision and pin versions for any import.
2. Define R1/R2 provider-neutral search/fetch API, typed error taxonomy and source result structure, including source URI and verified timestamps when supplied.
3. Register `web_search` and `web_fetch` only when the request permission and configured approved-service policy allow it.
4. Inject R3 policy before any provider network call. Reject unsafe query/URL rather than trusting prompt instructions.
5. Persist source references used by research in request activities without falsely labeling unverified facts as verified.
6. Implement same-request retry via user decision as R4. A failed operation does not automatically repeat or restart outline generation.
7. Wire C's provider adapters behind R1/R2; no hard-coded Tavily or DeepSeek-only behavior in the Agent.
8. Publish request/response fixtures and failure codes for B/C; test no-provider behavior without outbound network.

## Acceptance checklist

- [ ] Search/fetch are separate capabilities
- [ ] No-provider path sends nothing
- [ ] No auto retry
- [ ] Request-owned source refs recorded

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:agent-runtime
pnpm test:tools-browser
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-006 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
