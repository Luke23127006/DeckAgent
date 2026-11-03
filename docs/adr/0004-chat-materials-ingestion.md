---
status: accepted
---

# Chat-owned material ingestion and source references

## Verified starting point

Application storage is separate from project folders under accepted ADR 0001.
`AgentRequest` currently accepts text and outline actions only. The Host rejects empty text and unknown request fields.
Its JSON reader limits a body to 20 KiB, so that route cannot carry document uploads.
The Composer attachment action is disabled. No delivered attachment store or document parser was found.
The existing file tool reads bounded UTF-8; it does not parse PDF, Office documents or images.

The old sources/attachments design is a proposal, not an approved shared contract.
Attachment count and file size remain unset in the canonical business rule.
The pinned OpenCode 1.19.5 `run --help` lists `--file` for message attachments.
This confirms a CLI option exists; model-visible image delivery and isolation still need an actual wire/live test.

## Decision

Owner decision, 2 November 2026: select option A (separate material storage), confirmed in chat.
The following bounded implementation uses that storage and existing Host/MCP responsibilities.
Image delivery and exact resource/default limits remain qualification items, not accepted safety claims.

The bounded native-Gemini image path has since passed actual CLI wire checks for exact PNG/JPEG bytes
and the MCP-only tool list, plus a live image interpretation check. Other protocols and the legacy backend
remain explicitly unavailable for image requests. This is not a general multimodal compatibility claim.

Keep application composition and storage in `apps/local-web/src/materials/` initially.
Do not add a package or move existing package responsibilities.
Add a separate versioned `materials.sqlite` and application-owned blobs below the selected profile.
Keep current session, Web and deck schemas unchanged. Old profiles start with an empty material store.
Use staged uploads and atomic publication of bytes plus recoverable metadata transitions.
An interrupted upload is never ready. Startup recovery must not promote unverified bytes.
Older binaries ignore the extra store; they cannot use new material requests. Never replay them as text-only requests.

Add optional typed material operations to the Host composition contract, with authenticated routes:

| Operation | Proposed route / input | Result |
| --- | --- | --- |
| Upload | `POST /api/sessions/:id/attachments`, raw bounded stream and original-name metadata | Chat-owned ID, verified type, size, state and safe reason/warnings |
| List | `GET /api/sessions/:id/materials` | Only that Chat's material metadata; no Host paths |
| Remove unsent attachment | `DELETE /api/sessions/:id/attachments/:attachmentId` | Remove from preparation; keep sent request snapshots and bytes they still reference |
| Register reference | `POST /api/sessions/:id/references`, workspace-relative file/folder path | Reference ID, workspace/target identity and availability; no content copied |
| Send | Existing request route plus `attachmentIds` and `referenceIds` | Permit empty text only with valid ready material; reject wrong-Chat, unavailable or incomplete material |

All browser-supplied IDs are untrusted. Ownership and readiness checks happen again at admission.
The Host captures immutable request material identities before model work.
Sent material labels are durable request metadata; extracted content is not silently inserted as user instructions.
Per-Chat draft material IDs survive reload and stay separate from other Chats.
Reference naming grants no permission. A folder reference is not a recursive read grant or an attachment copy.

Use the existing ToolRegistry and request-local MCP seam for authorized text extraction.
The proposed `read_material` tool accepts a material ID, never an arbitrary Host path.
It returns source name/type, page or slide provenance, usable text and explicit partial/unavailable warnings.
Reference reads reuse current permission approval and filesystem identity checks at actual read.
References are checked against their captured workspace identity, including after repoint/replacement.
Parsed text and embedded instructions remain untrusted source data. No macros, scripts, external links or embedded objects execute.

For PNG/JPEG, validate bytes/dimensions before use. Do not claim visual interpretation from a file extension or text tool result.
First qualify OpenCode `--file` with Host-selected request-private image copies and the selected model's declared image capability.
Only those explicitly authorized images can enter that path. Browser paths cannot become CLI arguments.
Keep native tool denial, pure mode, executable pin and process-tree cancellation unchanged.
Unknown or text-only models receive an explicit limitation; no hidden vision service or OCR download is introduced.
Legacy runtime image input remains unavailable unless its shared message contract is separately extended and tested.
Seven-format acceptance cannot pass while a required image path is unverified.

Parser libraries, exact versions/licenses and archive/PDF worker resource bounds need a recorded review before installation.
Treat protected/corrupt files explicitly. Distinguish valid empty content from failed extraction.
Do not silently truncate usable content and report complete extraction.

## Resource policy requiring owner selection

Benchmark the historical candidates of 10 new attachments/request and 20 MiB/file in disposable fixtures.
These are test candidates, not approved product defaults. References do not consume attachment count.
Measure parser time, peak memory, archive expansion, page/slide/pixel bounds and cancellation.
Record independent technical safety bounds; do not present them as approved product limits.
Until values are selected, keep new material intake disabled by default or require explicit test configuration.

## Approval and compatibility requirements

The owner selected the separate-store approach after reviewing this proposal and its alternative of extending web.sqlite.
This does not approve a runtime-default switch or unmeasured product limits.
Image delivery must pass its qualification before enabled image requests can use it.
Update Host producers, validation, client consumers, request snapshots, recovery and tests together.
Use copied profiles to prove startup failure preserves existing data and old text requests still work.
Keep rejected/preparing material from sending; remove does not destroy material belonging to an earlier sent request.
