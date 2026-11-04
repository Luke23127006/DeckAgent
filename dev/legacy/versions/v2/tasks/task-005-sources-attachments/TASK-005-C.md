# TASK-005-C — Document parsing, file identity checks and attachment safety tests

**Task Group:** [TASK-005](README.md) · **Lane:** C · **Can start in parallel with:** TASK-005-A and TASK-005-B.  
**Entry condition:** G-004 PASS; Chat owner, private storage and permission policy are available.

## Expected result

Document parsing, file identity checks and attachment safety tests. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/05-business-rules/BR-001.md
- docs/spec/04-requirements/fr/FR-067.md
- docs/spec/04-requirements/fr/FR-082.md
- docs/spec/04-requirements/nfr/NFR-010.md
- DeepSeek docs/subsystems/attachment.md

Also read these existing/target implementation paths before editing:

- new packages/materials/parsers/**
- new packages/materials/file-reference/**
- packages/tools/filesystem/src/index.ts
- packages/tools/filesystem/src/workspace.ts
- tests/file-tools.test.mjs
- new tests/v2-document-ingestion.test.mjs

## Owned files (do not cross ownership)

- new packages/materials/parsers/**
- new packages/materials/file-reference/**
- packages/tools/filesystem/src/index.ts
- packages/tools/filesystem/src/workspace.ts
- tests/file-tools.test.mjs
- new tests/v2-document-ingestion.test.mjs

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Create documented test fixtures for TXT, MD, PDF, DOCX, PNG, JPEG and PPTX, plus damaged, password-protected and malformed samples.
2. Implement parser dispatch by verified content/type, not extension alone; return usable text/images or explicit partial/unsupported reason via S4.
3. Apply limits on bytes, decompression ratio, page count, extracted text, recursion and time. Any parsing failure must not execute embedded macros/scripts.
4. Keep source file reads mediated by Chat permission and Workspace identity. A reference that points to a replaced folder/file is rejected.
5. Images: pass authorized image content through the model adapter only if that selected model supports image input; otherwise show limitation without inventing visual analysis.
6. PPTX: extract presentation material as input; do not promise editable import or reproduce every animation.
7. Benchmark candidate 10 files/request and 20MiB/file limits on representative fixtures; record memory/time/failure evidence, but do not change BR-001 numbers directly.
8. Write negative tests for zip bombs, enormous extraction, path changes during read and a Chat attempting to use another Chat source ID.

## Acceptance checklist

- [ ] Seven types have tested parsing paths
- [ ] Damaged/protected inputs rejected
- [ ] Resource limits enforced
- [ ] File refs revalidated on use

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:tools-browser
pnpm test:outline-workflow
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-005 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
