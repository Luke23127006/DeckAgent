# TASK-006-C — Search/Fetch adapters, network security and egress tests

**Task Group:** [TASK-006](README.md) · **Lane:** C · **Can start in parallel with:** TASK-006-A and TASK-006-B.  
**Entry condition:** G-005 PASS; permission policy and scoped materials exist. No external research provider is automatically approved.

## Expected result

Search/Fetch adapters, network security and egress tests. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/04-requirements/fr/FR-090.md
- docs/spec/04-requirements/nfr/NFR-007.md
- DeepSeek packages/web/web-search-deepseek/README.md
- DeepSeek packages/web/web-deepseek-api/README.md

Also read these existing/target implementation paths before editing:

- new packages/research/providers/**
- new packages/research/web-security/**
- new tests/v2-public-research-security.test.mjs
- new tests/v2-web-providers.test.mjs

## Owned files (do not cross ownership)

- new packages/research/providers/**
- new packages/research/web-security/**
- new tests/v2-public-research-security.test.mjs
- new tests/v2-web-providers.test.mjs

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Implement a mocked provider first, using normalized R1/R2 interface. Implement one real-provider adapter only as disabled-by-default candidate pending explicit approval.
2. Never read raw user prompt, deck, attachment bytes or private file contents to construct search query. R3 uses public query terms only.
3. For HTTP fetch, reject non-HTTP(S), loopback/private/link-local/multicast/metadata IPs; validate DNS answers and each redirect hop.
4. Protect against SSRF by rechecking destination after DNS resolution and binding the network request to the validated address where supported.
5. Limit fetch response bytes, redirects, content types, time and decompression; treat fetched pages as untrusted instructions.
6. Add fake-HTTP tests for blocked hosts, redirects, DNS rebinding, secret-bearing queries and missing approval. Assert no network call occurs.
7. Test provider error mapping, source metadata, timeouts and explicit-retry behavior; no silent fallback to another provider.
8. Give A adapter registration instructions and security evidence; do not modify A-owned runtime composition.

## Acceptance checklist

- [ ] Adapter replacement does not change Agent
- [ ] Private URLs blocked
- [ ] No private query egress
- [ ] Mock test coverage for provider errors

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:tools-browser
pnpm test:agent-runtime
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-006 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
