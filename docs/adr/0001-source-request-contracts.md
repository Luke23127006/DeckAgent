---
status: accepted
---

# Source, request and approval integration contracts

The Host needs to admit attachments, authorize reads and preserve approval state without giving the runtime control of product state. This decision extends the existing [storage direction](../build/rebuild/adr/0001-local-storage.md), [tool authorization direction](../build/rebuild/adr/0003-tools-permissions.md) and [request lifecycle direction](../build/rebuild/adr/0004-request-events-lifecycle.md). The integration contracts are accepted. Acceptance and implementation evidence are tracked in the [contract integration issue](https://github.com/Luke23127006/DeckAgent/issues/79).

## Ownership and identity

Keep the current package responsibilities. Persistence owns attachment metadata, source records, request input references and approval records. Managed files hold attachment bytes and bounded parsed content. Filesystem owns parsing and authorized reads; Host owns admission, grants and approval decisions; app composition wires them to the OpenCode bridge and browser client. No new package or dependency on the legacy Agent Runtime is proposed.

Keep `sessionId` as the existing API name for the product Chat ID. `attachmentId`, `sourceId`, `requestId` and `approvalId` are opaque Host-generated identifiers. An identifier, model argument or source reference never grants access. Every lookup checks the owning Chat and current request.

| Contract value | Required information and meaning |
|---|---|
| `AttachmentView` | `attachmentId`, original display name, detected type, byte size, `state: preparing / ready / rejected`, and safe rejection code when rejected. No managed path or extracted content. |
| `SourceRef` | `sourceId`, immutable version, kind (`attachment`, `project-file`, `approved-file`, `research`) and display label. The private record holds the owning Chat, origin, content fingerprint and available locations. |
| `SourceLocation` | A tagged text-line range, page, slide, image, archive-entry location or research-result section. Preserve entry names and parent source identity for archives; omit unknown locations rather than inventing them. |
| `SourceReadResult` | Source reference, bounded content parts with locations, and a completeness result (`complete`, `partial`, `unreadable`) with safe reasons for omitted material. Image parts remain typed image content; accepting an image does not imply OCR support. |
| `ApprovalView` | `approvalId`, `requestId`, operation, safe target description, reason and state (`pending`, `allowed`, `refused`, `cancelled`). No token, raw tool arguments or file content. |

An immutable version identifies the content actually read, not whatever later occupies the same path or URL. A changed source receives a new version. Keep origin, fingerprint and locations for attribution; do not claim that a fingerprint alone preserves unread source bytes. Missing content or locations remain explicitly unavailable. Research also records the actual URL/result identity and, when supplied, author and licence. Recording a source does not verify a claim or permit unsourced factual slide content.

## Draft, upload and admission

Extend `ChatDraft` with `attachmentIds` and a monotonic Host-lifetime `revision`. Draft text and membership remain shared Host memory, survive interface reload, and expire at Host stop as required by the [draft requirement](../spec/03-requirements/fr/FR-038.md). Attachment bytes may be staged on disk, but unsent uploads are not restored as a draft on restart. Sent attachments remain durable. Startup cleanup removes only managed staging data with no committed message/request reference.

Upload creates a draft attachment with `preparing` before content becomes available to the model. Validate type, approved limits and parsing capability before `ready`; an unusable file remains `rejected` until removed. Interrupted uploads become rejected while the Host lives. Never load a whole unbounded HTTP body or parse an unbounded archive. Numeric limits and OCR capabilities remain unset until a product decision establishes them.

| HTTP surface | Input and result |
|---|---|
| `GET/PUT /api/sessions/:sessionId/draft` | Read draft; conditional save of `{ text, attachmentIds, expectedRevision }` returns the next revision. Omitted attachment membership preserves existing membership for a legacy text save. |
| `POST /api/sessions/:sessionId/attachments` | Bounded multipart upload containing one file and expected draft revision. Host allocates identity, adds membership conditionally and returns attachment metadata plus draft revision; parsing continues through `preparing`. |
| `GET /api/sessions/:sessionId/attachments/:attachmentId` | Read safe state metadata after Chat ownership validation. |
| `GET /api/sessions/:sessionId/attachments/:attachmentId/preview` | Authenticated, bounded preview through an opaque ID; no static source-folder serving or raw managed paths. Never execute uploaded HTML/scripts. |
| `DELETE /api/sessions/:sessionId/attachments/:attachmentId` | Conditional draft removal with expected revision; cancel unfinished preparation. Reject removal of an attachment already sent as a message through this endpoint. |
| `POST /api/requests` | Existing `{ sessionId, input }` plus optional `attachmentIds` and `draftRevision`. `input: ""` is valid only with ready attachments. IDs refer to new attachments of this request, not historical attachments. |

Reject foreign, duplicate, missing, preparing or rejected attachment references before admission. Check all draft membership, including rejected attachments, so a client cannot send past an invalid draft by omitting an ID. A stale revision is a conflict, not permission to overwrite another interface's draft. A supplied draft revision and selected attachment membership must match the submitted draft.

For B03 clients, admission stores the user message, request and attachment associations together, then clears only the matching draft revision. A newer draft remains intact. Request input becomes immutable. A failed admission creates no message/request and keeps the draft. The bytes must already be durable before references commit; recovery must never delete a committed attachment. Removing a draft item does not delete historical source records.

The old text-only shape remains accepted for a Chat with no draft attachments. Its admission does not clear a newer draft. New B03 clients use revisions. Extend history projections with optional attachment metadata; historical messages without it remain valid. Attachment-only messages retain empty text and real attachment metadata, without fabricated user words; title fallback uses the attachment's display name.

## Grants, tools and native resume

Host admission resolves Chat to Workspace and captures the folder identity, authorized Chat storage, source catalogue, selected outside service and allowed read operations. Keep canonical paths, service secrets and bridge tokens private. Resolve and check path/folder identity again at each access; a path replacement never expands a grant. Default and ungrouped Chats have no project-folder grant.

Add a Host-created read capability to `RequestRun`, with validated tool listing, scoped dispatch and revocation. The runtime adapter receives this capability rather than global storage access. The existing signal and event callback remain; the Host continues to be the only product-status writer. Pure B03 read operations do not expose general filesystem mutation.

The request-local bridge authenticates its token before dispatch and checks tool name, schema, request state and grant again on every call. Source tools support bounded listing and reads so the agent can discover unnamed project files. Approved external targets may be requested as paths, but Host resolves the canonical target, permanent denies and exact operation before prompting. A refusal is returned as a safe tool result so authorized work can continue; it does not fail the whole request.

Use a new tool-boundary version for the new catalogue. Extend the existing resume context with a stable fingerprint of Workspace identity, source catalogue version, phase/read policy and selected service configuration version. Exclude request ID, tokens and one-step approvals from the fingerprint. A context change starts a fresh native session; a matching session still gets fresh grants, a new bridge and current source manifest. Earlier approval never carries over. Fresh-session seeding retains conversation and attachment/source references without embedding unrestricted bytes or credentials. The selected image/model transport must report unsupported content honestly.

Runtime configuration audits permit only the current Host bridge and allowed tools; arbitrary MCP servers, native filesystem/shell tools and plugins remain denied. No claim of an OS sandbox follows from these checks.

## Approval state and reconnect

Persist `pending` approval, `waiting_approval` status and ordered events in one transaction before exposing the prompt. Serialize approval-requiring operations within a request: no later tool step executes past the pending step. Reuse the existing one-active-request invariant, including `waiting_approval`.

Host-only store operations create an approval, decide it and settle it with a terminal request; runtime cannot append status events to achieve this. Add an `approval` event carrying `ApprovalView` to persisted events and client decoding. Add nullable `pendingApproval` to the snapshot. Snapshot and SSE share the same persisted sequence so reconnect does not invent or lose a decision.

`POST /api/requests/:requestId/approvals/:approvalId/decision` accepts `{ decision: "allow-once" | "refuse" }` under the existing Host authentication. Repeating the same committed decision returns that decision without re-execution. A conflicting decision is a conflict. A decision for a terminal request is rejected. A recorded allow authorizes only its original waiting invocation, not an invocation resubmitted by the model.

The private approval key binds operation, canonical target identity and normalized read arguments such as the requested range. Allow is consumed once immediately before the read, with path identity, permanent denies and cancellation checked again. A target replacement cancels the operation rather than using old approval. Refuse suppresses the same operation/target/arguments for that request; a genuinely different step can ask again. The final report records refused work even if the model omits it.

Stop first closes admission to new actions, settles approvals and request state, then aborts in-flight work and revokes the bridge. Checks after an asynchronous read prevent content from a cancelled operation being returned. Shutdown/restart cancels pending approvals and marks active requests interrupted without resuming work. Approval waiting pauses the adapter's model-work timeout; it never auto-allows or invents a refusal. Stop and shutdown remain effective while waiting.

## Errors, migration and compatibility

Use stable codes and safe structured details; original filenames and sanitized target descriptions are allowed, but credentials, raw parser/provider errors and managed paths are not. Host must distinguish these failures for UI actions:

| HTTP status | Codes and response |
|---|---|
| 400 | `INVALID_REQUEST`, `REQUEST_EMPTY`: correct the draft or input. |
| 404 | `ATTACHMENT_NOT_FOUND`, `SOURCE_NOT_FOUND`, `APPROVAL_NOT_FOUND`: same response for missing and foreign identifiers. |
| 409 | `DRAFT_CONFLICT`, `ATTACHMENT_NOT_READY`, `ATTACHMENT_REJECTED`, `APPROVAL_CONFLICT`, `REQUEST_CLOSED`, `SOURCE_CHANGED`: refresh or correct the current state. |
| 413 | Existing `REQUEST_TOO_LARGE`, `REQUEST_TEXT_TOO_LONG`; new `ATTACHMENT_TOO_LARGE`, `ATTACHMENT_COUNT_EXCEEDED`, `PARSING_LIMIT_EXCEEDED`: reduce the relevant input. |
| 415 / 422 | `ATTACHMENT_TYPE_UNSUPPORTED` / `ATTACHMENT_UNREADABLE`: choose supported, readable material; preserve the rest of the draft. |
| 403 | `SOURCE_ACCESS_DENIED`, `TOOL_NOT_ALLOWED`: approval cannot override a permanent deny. |
| 503 / 500 | `RESEARCH_UNAVAILABLE` / `ATTACHMENT_NOT_SAVED`: explain what failed and preserve the last saved state. |

Tool results use the same safe codes, not HTTP exceptions containing raw provider text. Approval refusal uses a distinct `STEP_REFUSED` result. Update the client's fixed error allowlist, message mapping, event parser and history/snapshot projections alongside Host producers. Attachment state carries rejection codes; a rejected file is not silently removed.

Persistence adds attachment/source versions, message/request associations and approval records through versioned transactions. The attachment storage increment moves schema v3 to v4; later persisted additions, including approval records, require a further schema version rather than changing an already shipped v4 schema in place. Existing message JSON and request event sequences remain readable; absent new fields mean no attachments. Interrupted old requests keep the existing recovery rule. Historical bindings with the old boundary fail the new context guard without deleting history. Test fresh databases and v1/v2/v3 upgrade chains. A v3 binary must refuse a v4 database without resetting it; document upgrade and backup rather than claiming downgrade support.

Roll out storage, API, client and runtime together before enabling attachment/approval controls. Keep the current B02 text transport guard until the request-length rule is decided; its 16,000 JavaScript code-unit limit and 20 KiB JSON envelope are existing technical bounds, not approved product limits. Upload has its own bounded transport. Do not carry the JSON limit into an accidental file-size rule.

## Alternatives and validation

Using absolute managed paths as model-visible identities makes authorization and cleanup depend on runtime behavior. Opaque references let the Host validate ownership. Persisting whole drafts across restart conflicts with their specified lifetime. Giving native OpenCode approvals control over product grants would lose Host decision authority and the two-answer approval contract.

Implementation verification requires producer/consumer tests for attachment-only and legacy text requests; revision races; file/DB failure and restart recovery; cross-Chat source isolation; source changes; approval duplicate/conflicting/late decisions; timeout while waiting; Stop during read; session resume with fresh grants; v3 migration; bounded parsing and unavailable research. Effective permissions still require real CLI tests. This decision record alone proves no runtime behavior.

Input sizes, text counting units, OCR, extraction coverage, parser resource values and research provider selection remain separate product decisions. They do not block agreeing the reference, ownership and approval contracts, but affected input/service behavior must remain disabled until decided.
