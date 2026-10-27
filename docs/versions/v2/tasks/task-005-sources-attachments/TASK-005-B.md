# TASK-005-B — Composer attachment rail and project-folder reference UX

**Task Group:** [TASK-005](README.md) · **Lane:** B · **Can start in parallel with:** TASK-005-A and TASK-005-C.  
**Entry condition:** G-004 PASS; Chat owner, private storage and permission policy are available.

## Expected result

Composer attachment rail and project-folder reference UX. This task is complete only when its listed behavior and checks pass; writing source code alone is not completion.

## Exact read-first paths

- docs/spec/04-requirements/fr/FR-015.md
- docs/spec/04-requirements/fr/FR-016.md
- docs/spec/04-requirements/fr/FR-017.md
- docs/spec/04-requirements/fr/FR-082.md
- DeepSeek packages/client/ui-attachment/README.md

Also read these existing/target implementation paths before editing:

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/host-client.ts
- packages/client/runtime/src/management-client.ts
- new packages/client/runtime/src/attachments-view.ts
- new packages/client/runtime/src/reference-picker.ts
- client-owned stylesheets

## Owned files (do not cross ownership)

- packages/client/runtime/src/boot.ts
- packages/client/runtime/src/host-client.ts
- packages/client/runtime/src/management-client.ts
- new packages/client/runtime/src/attachments-view.ts
- new packages/client/runtime/src/reference-picker.ts
- client-owned stylesheets

New paths marked **proposed** must follow the repository's package naming and dependency rules. Never import from the private internals of another package; expose a public interface first. Do not edit another lane's paths even to apply a quick workaround.

## Preflight (execute in order)

1. Confirm `git branch --show-current` returns `docs/versions/v2` (or a feature branch based on its approved V2 plan). Check `git status --short` before editing; do not overwrite another person's working tree.
2. Read root `AGENTS.md`, `docs/AGENTS.md`, `docs/development/coding-conventions.md`, the linked V2 Scope and the group README. If a referenced path is absent, search its equivalent in this branch; do not create a fake replacement file solely to satisfy the plan.
3. Read the exact existing sources below before changing anything. Match the current public APIs; where this plan proposes a new API, implement the contract declared in the group README and record its final name.
4. Use the frozen fixture/contract so all three lanes can start independently. Do not edit other lanes' files; send a concrete request to their owner.


## Implementation steps (execute in order)

1. Enable the existing disabled attachment action in Composer and add drag/drop intake with a clearly bounded drop target.
2. Show a separate row/card for each attachment: name/thumbnail, type, preparing/ready/rejected state, rejection reason, remove and preview.
3. Show project-folder references as distinct chips in request area; never label reference upload as complete or imply a stored copy.
4. Use S1/S2 mock endpoints to upload and track status; send only durable attachment IDs and approved reference identities to Host.
5. Allow send with material but no text; block while any attachment is preparing or rejected, or reference state blocks sending.
6. Keep drafts scoped to Chat. A Chat switch must not attach unsubmitted files to another Chat; preserve/reject according to existing spec boundary.
7. For absent or changed Workspace folder, show reference unavailable with reason; keep sent reference labels in Chat history.
8. Add UI tests for rejected PNG/PDF, removed file, ready file-only request and drag/drop; do not modify A's Host route.

## Acceptance checklist

- [ ] Composer attachment rail works
- [ ] Separate reference picker/chips
- [ ] Valid send rules
- [ ] State and rejection reason visible

## Verification

Run the affected checks after implementation; do not run the whole repository suite merely to fix an unrelated tool issue:

```bash
pnpm build
pnpm test:browser-smoke
pnpm test:local-web
```

Tests must use isolated temporary data and deterministic fake providers. No real API key in fixtures, logs or handoff. Record every failed check and what it does *not* prove. If a script is unavailable on this branch, identify its actual equivalent; do not mark it passed without running it.

## Handoff to integrator

Report exactly: (1) changed/added paths, (2) final public interfaces and fixtures, (3) tests run + PASS/FAIL, (4) which acceptance items passed, (5) blocked items and owner, (6) V1 compatibility observations. Do not mark G-005 PASS yourself; [the group README](README.md) owns that combined decision.

**Out of scope:** feature behavior not named in `../../SCOPE.md`; all Deck Export and new Outline/Slide Generation behaviors; any unapproved external service, fabricated release-default model list, or unvalidated product attachment limit.
