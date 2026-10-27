# TASK-004-B — Permission selector and inline approval interaction

**Task Group:** [TASK-004](README.md) · **Lane:** B · **Can start in parallel with:** TASK-004-A and TASK-004-C.  
**Entry condition:** G-003 PASS; per-Chat work/source roots and per-Chat request state exist.

## Expected result

Permission selector and inline approval interaction. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/03-use-cases/UC-014.md
- docs/spec/04-requirements/fr/FR-076.md
- DeepSeek packages/client/ui-permission-presets/README.md
- DeepSeek packages/client/ui-approval/README.md

Also read these existing/target implementation paths before editing:

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/management-client.ts
- packages/client/runtime/src/question-view.ts (only if extending generic view safely)
- new packages/client/runtime/src/approval-view.ts
- new packages/client/runtime/src/permission-picker.ts
- client-owned stylesheets

## Owned files (do not cross ownership)

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/management-client.ts
- packages/client/runtime/src/question-view.ts (only if extending generic view safely)
- new packages/client/runtime/src/approval-view.ts
- new packages/client/runtime/src/permission-picker.ts
- client-owned stylesheets

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Place current Chat permission selector in Composer beside Model selection; place default permission for new Chats in Settings.
2. Show only Workspace Access and Provided Materials Only and describe their real read scope in plain language.
3. When Host publishes P3 approval, show the blocked action, exact target and reason in the current Chat; preserve conversation and unsent draft.
4. Offer Deny / Allow once / Allow this named scope for this Chat only where Host allows a continuing grant. Require explicit action for continuing approval.
5. Keep approval UI attached to the original Chat when user navigates elsewhere; show pending indicator in Left Sidebar.
6. Disable submission of stale approval after another Client/Host response or request termination. No optimistic permission change before Host confirms.
7. Let user review and revoke continuing grants in Chat permission details; show affected scope, not just an ambiguous permission name.
8. Add view/browser tests for refusal, pending, revoked grant and cross-Chat navigation.

## Acceptance checklist

- [ ] Permission UI in Composer
- [ ] Approval identifies specific step
- [ ] No optimistic hidden grant
- [ ] Revoke available

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:browser-smoke
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-004 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
