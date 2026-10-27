# TASK-006 — Web Search and Fetch Capability with Privacy Policy

**Outcome:** Provide provider-independent public search and safe fetch while honoring owner-approved services and the private-content boundary.  
**Sequence:** task group 6 of 7. **Dependency:** G-005.  
**Read first:** `../../SCOPE.md`, `../../IMPLEMENTATION-PLAN.md`, repository `AGENTS.md` and `docs/AGENTS.md`.

## Scope and precondition

G-005 PASS; permission policy and scoped materials exist. No external research provider is automatically approved.

**Mapped requirements:** UC-003 A48/A49; FR-088/089/090; NFR-003/007.

## Shared contract for A/B/C (freeze before coding)

**R1 — Web service:** `search({query, limit, sourceRestrictions}, requestContext)` and `fetch({url}, requestContext)` return normalized `{title,url,snippet?,publishedAt?,retrievedAt?}` or typed error.

**R2 — Provider registry:** Search and Fetch providers configured independently, selected by stable adapter IDs; missing configuration produces `RESEARCH_UNAVAILABLE` without a network call.

**R3 — Egress policy:** accept only public-topic search terms from authorized source, never original private prompt/attachments/conversation/deck. Reject or generalize ambiguous queries *before* outgoing network requests. Public Fetch may not reach loopback/private/link-local/cloud metadata endpoints, including after redirects/DNS resolution.

**R4 — Retry:** failed research operation may retry only after user explicitly selects retry, in the same existing request; no automatic repeated search or silent provider fallback.

These are **proposed V2 interfaces and semantics**, not declarations that the existing code already exports these names. At group kickoff, A records the final public names in this README and supplies small mock fixtures. B and C start immediately using those fixtures; they do not wait for A's full production implementation. Changes to this contract require an explicit cross-lane review.

## Parallel subtasks

| Subtask | Primary owner | Deliverable |
|---|---|---|
| [TASK-006-A](TASK-006-A.md) | A — Platform / Host | Web capability seam, tool registration and request-local research lifecycle |
| [TASK-006-B](TASK-006-B.md) | B — Client / UX | Web Research Settings and Activity UI |
| [TASK-006-C](TASK-006-C.md) | C — Tools / Security / QA | Search/Fetch adapters, network security and egress tests |

**File ownership:** A exclusively edits shared Host, application composition and request orchestration files; B exclusively edits client runtime/views; C exclusively edits filesystem/adapter/data-parser packages and listed test fixtures. If one lane needs another lane's file, create a handoff request, not a concurrent edit. No one directly edits another task's files during this group.

## Integration procedure

1. A publishes final contract names, sample JSON requests/responses and migration/error cases.
2. A/B/C build their assigned subtasks in parallel against the contract and shared fixtures; each reports tests and changed files.
3. A integrates Host/application changes; B integrates UI with real endpoints; C runs adversarial and end-to-end fixtures.
4. Re-run impacted tests and existing outline/slide regression cases.
5. Record G-006 PASS only with all required observations; else record FAIL/BLOCKED with cause and owner in `../../PROGRESS.md`.

## G-006 — Acceptance gate

- Provider-independent `web_search`/`web_fetch` tools return normalized citations and typed failures in mock tests.
- With no approved/configured service, no network call occurs and request continues/waits according to FR-089.
- Private data and private-network URL attempts are rejected, including redirect/DNS rebind cases.
- Research retry occurs only after explicit user action and does not restart the whole request.
- A live provider adapter is marked available **only after separate Product Owner approval**; code presence is not approval.

**Commands:** `pnpm build`, `pnpm test:agent-runtime`, `pnpm test:tools-browser`, `pnpm test:local-web`, `security tests added for V2`.

## Risks and non-goals

DeepSeek Web Service is a good abstraction but may depend on its LLM contracts. Do not silently import packages. Do not enable `sendOriginalQuestion`, provider fallback, arbitrary HTTP fetch or credential leakage.

No part of this group changes Deck Export, commits new UC-001 flow behavior, or expands product scope beyond [SCOPE.md](../../SCOPE.md).
