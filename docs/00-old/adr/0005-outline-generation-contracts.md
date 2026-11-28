---
status: accepted
---

# Outline review and generation contracts

Keep Host authority over the complete Brief → Outline → confirmation → generation flow. The [accepted review](https://github.com/Luke23127006/DeckAgent/issues/92) supplies the context; the [source contracts](0001-source-request-contracts.md) remain in force. No dependent implementation is enabled by this record alone.

## User actions and ownership

Use an explicit Create deck entry while preserving generic chat. Interview asks only for missing topics and stores answers, assumptions and unresolved needs. Skipping does not grant model-knowledge or public-research access. An unknown topic prevents an Outline. Unsupported formats or essential image needs require a choice rather than a silent substitution.

Use the confirmation button bound to the displayed Outline and Brief as the initial execution channel. Chat agreement directs the user to that action and does not start generation. Mixed agreement/change is a revision. Pure questions do not change a proposal; unclear intent requires clarification. There is no production Outline cancellation action. A revision creates a new current proposal and reports the full Brief/slide diff, including unrequested changes.

| Contract | Owner and required information |
|---|---|
| BriefSnapshot | Deck domain: Chat, ID/version, interview answers, requirements, assumptions, sources/material references, image policy, proposed slide count, format and visual choices/overrides |
| OutlineProposal | Deck domain: ID/version, immutable Brief ID/version, originating request, overview, stable planned slide IDs, content blocks/source references, revision suggestions and full diff |
| ConfirmationReceipt | Deck domain: confirmation ID, exact Outline/Brief target, snapshot fingerprint, Deck ID and generation intent ID |
| GenerationIntent | Deck domain: durable confirmation-to-attempt/request linkage and idempotent receipts; never a bearer grant |
| DeckSnapshot | Format/visual snapshot, generation start, ordered planned slides, revisions, generation state and last-good artifact references |

Host creates IDs. Valid references to earlier slides of the same Chat preserve identity through revisions/reordering; new slides receive new IDs. Position is not identity. History anchors use request IDs rather than treating a conversation array index as business identity.

Deck domain owns Brief and Outline in its database. Session persistence keeps Chat/request/history. Design owns visual contracts; presentation tools call public domain APIs. No second Deck repository or Agent Loop is introduced.

## Phase and transport

Workflow phases are collecting Brief, reviewing Outline, confirmed, generating, generated and generation incomplete. They are independent of RequestStatus. Freeze exact versions, source choices, visual snapshot and allowed slide scope at admission. Resume guards include those identities; each request receives fresh grants and tokens.

Public research selected in a confirmed Brief authorizes that generation request's choice, not an inherited interview token. Other generic chat does not inherit research permission. External file reads still require each-step approval; Tavily remains free-only and request-budgeted.

Keep legacy request inputs valid and add a Create deck intent. Host decides phase. Brief/Outline reads return versioned snapshots; review writes carry expected targets. The Host confirmation endpoint receives confirmation ID, Outline ID/version and Brief ID/version, never an arbitrary model plan. Identical retries return a receipt; changed payload under one ID conflicts.

MCP payloads use validated JSON strings within the existing schema transport. Brief/Outline proposal tools exist only in their allowed phase. Generation exposes plan reads and scoped stage/publish operations. There is no model confirmation, cancellation, shell or general filesystem-write tool.

## Commit and restart

Preflight runtime/model/source/busy state, then confirm Outline, create pending Deck and persist GenerationIntent in one Deck transaction. Session admission is a separate step with unique intent/attempt linkage. Admission failure keeps committed confirmation and permits idempotent scheduling retry without confirming the Outline again.

Immediately before CLI work, Host checks the request is still active and locks format/effective visual snapshot while recording generation start. After that point Stop/failure keeps the lock, even with zero published slides. Startup reconciles stored receipts and marks old active work interrupted; it never reruns CLI or reuses grants automatically.

Do not put business commits in the runtime's existing post-terminal native-binding callback. Host validates and commits staged Brief/Outline changes before reporting business success. A crash between a domain commit and Session terminal keeps the committed result and its request receipt; UI reports interruption with saved results. There is no atomic transaction across the two databases. Fault-injection tests must establish each window, rather than suppress commit errors.
