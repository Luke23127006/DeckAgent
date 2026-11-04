# TASK-005 — Durable Attachments, File References and Document Reading

**Outcome:** Allow request text, attachments and project-folder references as distinct, secure input types for the Agent.  
**Sequence:** task group 5 of 7. **Dependency:** G-004.  
**Read first:** `../../SCOPE.md`, `../../IMPLEMENTATION-PLAN.md`, repository `AGENTS.md` and `docs/AGENTS.md`.

## Scope and precondition

G-004 PASS; Chat owner, private storage and permission policy are available.

**Mapped requirements:** UC-003 A3/A8/A43/A44; FR-015/016/017/049/067/082/086; BR-001; NFR-003/004/010.

## Shared contract for A/B/C (freeze before coding)

**S1 — Attachment:** `{attachmentId, sessionId, requestId?, originalName, mediaType, sizeBytes, status: preparing|ready|rejected, reason?}`. Bytes live in application-owned durable storage; access checks use `sessionId`.

**S2 — Reference:** `{referenceId, sessionId, workspaceId?, relativePath, kind: file|folder, state}`. Do not upload/copy a source file merely because it is named. Validate Workspace identity and permission at actual read; reject a same-name file after folder repoint.

**S3 — Request:** extend `AgentRequest` with `attachmentIds?: string[]`, `references?: ReferenceInput[]`; allow text-empty when there is at least one ready attachment/reference. Keep existing outline action contract compatible.

**S4 — Parsing:** typed extraction output with usable content, partial-read notices, source identity and explicit unavailable reasons; no promise to preserve all PPTX editability.

These are **proposed V2 interfaces and semantics**, not declarations that the existing code already exports these names. At group kickoff, A records the final public names in this README and supplies small mock fixtures. B and C start immediately using those fixtures; they do not wait for A's full production implementation. Changes to this contract require an explicit cross-lane review.

## Parallel subtasks

| Subtask | Primary owner | Deliverable |
|---|---|---|
| [TASK-005-A](TASK-005-A.md) | A — Platform / Host | Durable attachment store, request references and authenticated upload API |
| [TASK-005-B](TASK-005-B.md) | B — Client / UX | Composer attachment rail and project-folder reference UX |
| [TASK-005-C](TASK-005-C.md) | C — Tools / Security / QA | Document parsing, file identity checks and attachment safety tests |

**File ownership:** A exclusively edits shared Host, application composition and request orchestration files; B exclusively edits client runtime/views; C exclusively edits filesystem/adapter/data-parser packages and listed test fixtures. If one lane needs another lane's file, create a handoff request, not a concurrent edit. No one directly edits another task's files during this group.

## Integration procedure

1. A publishes final contract names, sample JSON requests/responses and migration/error cases.
2. A/B/C build their assigned subtasks in parallel against the contract and shared fixtures; each reports tests and changed files.
3. A integrates Host/application changes; B integrates UI with real endpoints; C runs adversarial and end-to-end fixtures.
4. Re-run impacted tests and existing outline/slide regression cases.
5. Record G-005 PASS only with all required observations; else record FAIL/BLOCKED with cause and owner in `../../PROGRESS.md`.

## G-005 — Acceptance gate

- TXT, MD, PDF, DOCX, PNG, JPEG and PPTX are validated and ingested in mocked/document fixtures or reported as unsupported by a failing gate; never claim success based only on extension.
- A ready attachment can be sent without text; bad/protected/damaged files show rejection reason and block send.
- A reference does not consume attachment count and is revalidated when the Agent uses it. Missing/moved folder does not substitute a same-name file.
- Each Chat can access only its own durable attachments; no arbitrary-path browser reads.
- Candidate 10/request and 20 MiB/file limits get measured and documented, not installed as approved BR values without approval.

**Commands:** `pnpm build`, `pnpm test:tools-browser`, `pnpm test:local-web`, `pnpm test:outline-workflow`, `pnpm test:slide-pipeline`.

## Risks and non-goals

The current JSON body parser rejects empty text and caps the body at 20KiB; raw file bytes require a separate authenticated upload endpoint and bounded streaming. `read_file` only supports UTF-8/256KiB and must not be presented as PDF/DOCX/PPTX support.

No part of this group changes Deck Export, commits new UC-001 flow behavior, or expands product scope beyond [SCOPE.md](../../SCOPE.md).
