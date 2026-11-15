# Interview and Outline review

The [workflow decision](../adr/0005-outline-generation-contracts.md) defines Host authority and phase boundaries. [Brief storage](brief-and-design.md) describes source-receipt semantics and the visual catalog. Generic Chat request inputs remain valid and do not enter this workflow.

## Request contract

`AgentRequest.deck` selects `collect`, `skip`, `revise`, `question`, `clarify` or `restore`, with `expectedBriefVersion` and `expectedOutline` (ID/version, or null). These are explicit user actions; message text does not become confirmation. `restore` names an earlier proposal in the same Chat. A known pure question or unclear message uses its read-only action and receives no stage tool. During a revision request the model can instead answer a question or ask for clarification without staging; the Host then states that the Outline and Brief stayed unchanged. Free-text intent accuracy and the end-user review controls still need their integration checks; callers must not label an ambiguous message as an authorized change automatically.

`sourceChoice` records the user's three explicit source flags. Without it, the Host keeps existing choices; supplied attachments permit material reads, and an explicit request research flag permits the corresponding choice. A model cannot turn a flag on or off. Network research still requires the request's own publicResearch flag and existing free-only checks. `formatChoice: html` permits replacing a previously unsupported requested format. `imageChoice` records a decision to use attachments or drop an unmet image need. The Host rejects silent replacements. Collecting retains recorded requirements; an explicit revision permits changing them and reports the full diff.

`GET /api/sessions/:id/interview` returns `{ brief, state }`. State groups the missing interview topics with suggestions, skip guidance and blockers. Known fields and earlier answers are not asked again. Skip writes assumptions for omitted optional topics and selects available visual defaults, while unknown topic, source choice, unsupported format and unmet essential image requirements stay unresolved. A source whose receipt is absent or superseded is reported without changing history.

## Runtime and commit

App composition wraps the existing OpenCode runtime for collecting/reviewing requests. Host-owned prompt version `b04-interview-v1` states extraction, clarification, conflict and placeholder rules. The frozen phase/Brief/Outline/source context is part of the native resume guard. Source content and conversation remain data. This is a policy prompt and validation boundary, not proof of semantic correctness from a real provider.

`stage_brief` and `stage_outline` accept validated JSON strings through the existing request-local MCP bridge. They stage memory only. Source reads still use existing Host capabilities and one-step approvals. Staging cannot confirm, cancel, create HTML or publish. An incomplete interview ends the current request with grouped questions; a later answer starts a new request. A complete Brief requires a staged Outline before business success. Skip can finish locally while blockers remain; when it makes the Brief complete, the existing runtime proposes the Outline.

After successful model completion the Host checks Stop, validates owning sources and atomically commits the Brief, optional Outline and request receipt in the Deck database before returning runtime success. The post-terminal callback retains only native-session binding. A failed or stopped run discards memory staging. A repeated identical domain commit returns the saved receipt; changed content under the same request ID conflicts. A Session terminal write can fail after the Deck commit: saved domain results remain readable and the request is not replayed. Full crash-window and generation reconciliation remain integration checks.

## Outline versions and compatibility

Every structured proposal carries its immutable Brief snapshot, request ID, conversation anchor, revision suggestions and content blocks/source references. Host creates Outline and new slide IDs; a valid reference to a slide of an earlier proposal in the same Chat retains identity through edits and reordering. Source references must belong to the bound Brief. The planned slide count must match that Brief when supplied. Each revision creates a new current proposal; previous proposals stay unchanged. Restoration copies the selected earlier content into a new proposal and Brief version rather than rewriting history.

The Host computes the full Brief field diff and added, removed, changed and reordered slide IDs. Browser decoders retain and validate the modern fields. Legacy proposals keep their original shape and IDs; migration does not invent Brief bindings. Legacy cancellation and confirmation APIs refuse modern proposals. Modern confirmation, generation admission and UI controls require their dedicated integrations. No Deck or slide artifact is created during review.

Run `pnpm.cmd test:deck-review` after building for interview policy, lifecycle, revision, restoration, immutable history, atomic receipt and client checks. Tests use a fake CLI and temporary databases, without provider accounts. They do not prove natural-language intent classification, research quality, real-provider extraction or rendered slide quality.
