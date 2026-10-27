# TASK-004-C — Tool-boundary filesystem permission enforcement

**Task Group:** [TASK-004](README.md) · **Lane:** C · **Can start in parallel with:** TASK-004-A and TASK-004-B.  
**Entry condition:** G-003 PASS; per-Chat work/source roots and per-Chat request state exist.

## Expected result

Tool-boundary filesystem permission enforcement. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/04-requirements/nfr/NFR-003.md
- docs/spec/04-requirements/fr/FR-084.md
- packages/agent/runtime/src/tool-registry.ts (locate public tool seam)
- DeepSeek docs/subsystems/approval.md

Also read these existing/target implementation paths before editing:

- packages/tools/filesystem/src/index.ts
- packages/tools/filesystem/src/workspace.ts
- new packages/tools/filesystem/src/policy-access.ts
- tests/file-tools.test.mjs
- new tests/v2-permission-isolation.test.mjs

## Owned files (do not cross ownership)

- packages/tools/filesystem/src/index.ts
- packages/tools/filesystem/src/workspace.ts
- new packages/tools/filesystem/src/policy-access.ts
- tests/file-tools.test.mjs
- new tests/v2-permission-isolation.test.mjs

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Consume P2 request-scoped authorization as an injected dependency of tool execution; do not read raw client permission flags.
2. For every file read, canonicalize and authorize the final file target, not only the caller-provided string; re-check the authorized target at actual use.
3. Write operations allowed for DeckAgent internal Chat workRoot only; disallow original project folder writes, attachments and other Chat data regardless of approval.
4. Test symlink/hardlink/traversal and file replacement attacks; fail closed when target identity cannot be verified.
5. When a read requires approval, return a structured approval-required signal to A; do not perform the read before answer.
6. Test Allow once, deny, missing answer, continuing grant and revocation. A denied step must not be silently retried with the same rejected action.
7. Keep slide publish working with private drafts and unchanged project files; publish a negative access matrix.
8. Request A-owned composition changes through the P2 interface and do not edit `web-request.ts` directly.

## Acceptance checklist

- [ ] Authorization runs at file tool boundary
- [ ] No unauthorized read/write
- [ ] Revocation takes effect
- [ ] Slide draft still works

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:tools-browser
pnpm test:slide-pipeline
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-004 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
