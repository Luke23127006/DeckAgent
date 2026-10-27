# TASK-001-C — Private work roots, filesystem isolation and regression fixtures

**Task Group:** [TASK-001](README.md) · **Lane:** C · **Can start in parallel with:** TASK-001-A and TASK-001-B.  
**Entry condition:** V1 Local Web starts, SessionStore / DeckService persistence works, and no V2 schema change has been applied.

## Expected result

Private work roots, filesystem isolation and regression fixtures. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/04-requirements/nfr/NFR-003.md
- docs/spec/04-requirements/fr/FR-084.md
- packages/presentation/tools/src/ (find actual publish tool path)
- apps/local-web/src/web-request.ts (read only)

Also read these existing/target implementation paths before editing:

- packages/tools/filesystem/src/workspace.ts
- packages/tools/filesystem/src/index.ts
- tests/file-tools.test.mjs
- tests/publish-slide.test.mjs
- new tests/v2-workspace-isolation.test.mjs

## Owned files (do not cross ownership)

- packages/tools/filesystem/src/workspace.ts
- packages/tools/filesystem/src/index.ts
- tests/file-tools.test.mjs
- tests/publish-slide.test.mjs
- new tests/v2-workspace-isolation.test.mjs

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Create fixtures for two Chats in the same Workspace and a separate source folder; record hashes before each simulated request.
2. Refactor filesystem tool grants to distinguish read-only project data from exclusive-create workRoot. Never allow `write_file` to create in sourceRoot.
3. Keep existing path normalization/symlink checks; add test cases for traversal, symlink and hardlink escape, and races between validation and open.
4. Provide reusable helpers to A for validating granted source reads and private work writes. A wires them through `web-request.ts`.
5. Confirm `write_file` and `publish_slide` read the same private workRoot via A-owned request options. Do not change the public slide format.
6. Add negative tests: one Chat cannot discover/read another Chat work files; removing Workspace does not grant old folder access.
7. Exercise folder rename/move/missing cases; no content appears inside registered folder, including hidden `.deckagent`.
8. Run existing file-tool/slide-pipeline tests with updated fixture paths; give A the failing tests and required glue, not concurrent patches to A-owned files.

## Acceptance checklist

- [ ] No project-folder writes
- [ ] No cross-chat tool access
- [ ] Symlink/traversal escapes rejected
- [ ] Slide publisher reads Chat work root

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:tools-browser
pnpm test:slide-pipeline
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-001 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
