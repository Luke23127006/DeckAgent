# TASK-007-C — V2 end-to-end gates, privacy and V1 regression evidence

**Task Group:** [TASK-007](README.md) · **Lane:** C · **Can start in parallel with:** TASK-007-A and TASK-007-B.  
**Entry condition:** G-006 PASS; selected model metadata and durable Session/Deck/Attachment storage exist.

## Expected result

V2 end-to-end gates, privacy and V1 regression evidence. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/versions/v2/SCOPE.md
- docs/versions/v2/IMPLEMENTATION-PLAN.md
- docs/spec/03-use-cases/UC-001.md
- docs/spec/03-use-cases/UC-015.md
- docs/spec/04-requirements/nfr/NFR-003.md

Also read these existing/target implementation paths before editing:

- new tests/v2-context-compact.test.mjs
- new tests/v2-end-to-end.test.mjs
- new tests/v2-migration-regression.test.mjs
- tests/recovery-editing.test.mjs
- tests/deck-pipeline.test.mjs
- docs/versions/v2/PROGRESS.md (only after gate evidence)

## Owned files (do not cross ownership)

- new tests/v2-context-compact.test.mjs
- new tests/v2-end-to-end.test.mjs
- new tests/v2-migration-regression.test.mjs
- tests/recovery-editing.test.mjs
- tests/deck-pipeline.test.mjs
- docs/versions/v2/PROGRESS.md (only after gate evidence)

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Create deterministic fixtures for long conversations, already-confirmed outline, published slides, attachments and permission grants.
2. Write compact success/failure/active-request/unknown-usage tests against C1-C4; assert original messages remain unchanged.
3. Run all group gates against actual integrated modules and record pass/fail evidence, including source-folder hashing and cross-chat access attempts.
4. Run complete V1 tests: outline drafting/confirming, slide publishing, deck reopening, request recovery and generic chat model call.
5. Perform legacy storage migration tests with injected failure and confirm original data remains recoverable.
6. Run Public Research egress cases with mocked URLs, redirects and private-content queries; do not make a live unapproved provider request.
7. Prepare FR/UC traceability table of selected flows with test IDs, screenshots or runtime evidence, and remaining blockers.
8. Update `PROGRESS.md` only with proven results; do not label gate PASS from source-file presence or a successful build alone.

## Acceptance checklist

- [ ] Every selected V2 flow has evidence or visible blocker
- [ ] Existing UC-001 regressions pass
- [ ] No unauthorized egress
- [ ] Migration safe on failure

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:agent-runtime
pnpm test:model-providers
pnpm test:session-persistence
pnpm test:tools-browser
pnpm test:local-web
pnpm test:outline-workflow
pnpm test:slide-pipeline
pnpm test:recovery-editing
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-007 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
