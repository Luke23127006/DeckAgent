# TASK-001 — Application Storage and Workspace Foundation

**Outcome:** Give each Chat a stable Workspace relationship, keep internal data outside project folders, isolate Agent work, and migrate legacy V1 data safely.  
**Sequence:** task group 1 of 7. **Dependency:** V1 baseline.  
**Read first:** `../../SCOPE.md`, `../../IMPLEMENTATION-PLAN.md`, repository `AGENTS.md` and `docs/AGENTS.md`.

## Scope and precondition

V1 Local Web starts, SessionStore / DeckService persistence works, and no V2 schema change has been applied.

**Mapped requirements:** UC-013 MF/A1/A2/A3/A4/A5/A6; UC-012 MF; UC-006 A7; FR-053/071/072/073/074/077/082/083/084; NFR-003.

## Shared contract for A/B/C (freeze before coding)

**W1 — Workspace:** `{ id: string, name: string, projectFolder?: string, state: 'available'|'missing' }`; a stable `id` never derives from the folder path. Default Workspace has no project folder and is not removable. A canonical path already registered is rejected.

**W2 — Chat ownership:** `WebSession.workspaceId?: string`. Missing `workspaceId` means ungrouped (for example a removed Workspace), **not** the default Workspace. `createSession` accepts a valid `workspaceId` or uses the selected default.

**W3 — Work roots:** `sourceRoot?: string` (read-only user project), `workRoot: string` (private per Chat/Request), and `attachmentRoot` (Chat-owned data). Slides' `write_file` and `publish_slide` both use `workRoot`; reading a project folder must not grant write permission.

**W4 — Migration:** explicit legacy source location + backup, staged copy/verify, idempotent marker and rollback; do not scan arbitrary disks or overwrite an existing application profile.

These are **proposed V2 interfaces and semantics**, not declarations that the existing code already exports these names. At group kickoff, A records the final public names in this README and supplies small mock fixtures. B and C start immediately using those fixtures; they do not wait for A's full production implementation. Changes to this contract require an explicit cross-lane review.

## Parallel subtasks

| Subtask | Primary owner | Deliverable |
|---|---|---|
| [TASK-001-A](TASK-001-A.md) | A — Platform / Host | Workspace registry, application storage and migration |
| [TASK-001-B](TASK-001-B.md) | B — Client / UX | Workspace picker, grouped Chats and folder-state UI |
| [TASK-001-C](TASK-001-C.md) | C — Tools / Security / QA | Private work roots, filesystem isolation and regression fixtures |

**File ownership:** A exclusively edits shared Host, application composition and request orchestration files; B exclusively edits client runtime/views; C exclusively edits filesystem/adapter/data-parser packages and listed test fixtures. If one lane needs another lane's file, create a handoff request, not a concurrent edit. No one directly edits another task's files during this group.

## Integration procedure

1. A publishes final contract names, sample JSON requests/responses and migration/error cases.
2. A/B/C build their assigned subtasks in parallel against the contract and shared fixtures; each reports tests and changed files.
3. A integrates Host/application changes; B integrates UI with real endpoints; C runs adversarial and end-to-end fixtures.
4. Re-run impacted tests and existing outline/slide regression cases.
5. Record G-001 PASS only with all required observations; else record FAIL/BLOCKED with cause and owner in `../../PROGRESS.md`.

## G-001 — Acceptance gate

- Create two Workspaces with different canonical folders; duplicate folder is rejected; reopen keeps IDs and Chat assignments.
- Removing a Workspace leaves Chats ungrouped and their messages, attachments, deck and outline unchanged. Missing or moved folder blocks source reads but keeps saved work.
- A project folder's file list and hashes stay unchanged after outline/slide build/preview; Chat X cannot use Chat Y's internal work root.
- A legacy database migrates without dropping Session IDs, providers, activity or deck references; injected failure leaves original bytes recoverable.
- V1 outline confirmation and slide publish still work through the new root.

**Commands:** `pnpm build`, `pnpm typecheck`, `pnpm test:session-persistence`, `pnpm test:local-web`, `pnpm test:slide-pipeline`, `pnpm test:tools-browser`.

## Risks and non-goals

SQLite schema versions in `packages/session/persistence/src/schema.ts` and `apps/local-web/src/web-state.ts` both currently reject unknown versions. Preserve application IDs, upgrade transactionally, test with old fixtures. Do not read any other Chat by constructing an arbitrary Session ID.

No part of this group changes Deck Export, commits new UC-001 flow behavior, or expands product scope beyond [SCOPE.md](../../SCOPE.md).
