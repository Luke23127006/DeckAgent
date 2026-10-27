# DeckAgent V2 — Scope

**Planning baseline:** `docs/versions/v2` branch, commit `a417141f92bee1a5801e63f2bcfc6948922399d0` (27-10-2026).  
**Status:** flow-level selection remains proposed. The owner confirmed TASK-001 gates passed and requested TASK-002 on 27-10-2026. TASK-002 awaits manual acceptance; later groups and V2 activation remain pending.
**Source of behavior:** `docs/spec/`, which describes the ideal product and is not version-specific.

## Goal

Align the working V1 Local Web application with seven agreed product capability groups: Workspaces, Provider & Models, Chat Frame, Chat Lifecycle & History, Agent Permissions, Request Lifecycle & Activity Log, and Sources & Attachments. Add Web Research and manual Context Compaction through those groups. Keep the existing conversation-to-outline-to-slide vertical slice working. V2 is an implementation-alignment release, **not** an Agent Runtime rewrite or a new slide-design release.

## Success criteria

- **SC-1 — Workspace ownership.** Chats have stable identities and correct Workspace ownership. Removing or losing a project folder does not delete their conversations, outlines or decks. Internal data is stored in application-owned storage, not in the user's project folder.
- **SC-2 — Concurrent chat lifecycle.** A user can switch chats or Workspaces while a request in another chat runs or waits. The original request continues, and its status/history can be reopened without cross-chat interference.
- **SC-3 — Provider setup and request capture.** Supported provider configurations and per-model settings are selectable. A request retains the model, reasoning level, provider settings and permission it started with.
- **SC-4 — Materials and permissions.** Attachments and project-folder references have separate behavior. The agent reads only authorized material, never changes original project files, and cannot read another chat's private data.
- **SC-5 — Observable work.** Request status, activity detail, approval and failures are visible and durable, without treating a failed activity as an automatically failed request.
- **SC-6 — Public research and context.** Public search and fetch use a provider-independent capability under the approved-service and private-data rules. The user can see context usage and manually compact when possible.
- **SC-7 — Compatibility.** Already-working UC-001 outline confirmation, slide publishing, deck reopening, model calls and request recovery still pass their established regression checks.

## Product choices for V2

- **Interface:** Local Web; extend the existing sidebar, composer, conversation and deck canvas. DeepSeek Harness is a reference for UI placement and interaction, not a requirement to import its React components.
- **Storage:** application-owned home storage (proposed default `~/.deckagent/`, resolved safely per supported platform). Workspace project folders are user-owned sources; DeckAgent does not create `.deckagent/` within them.
- **Permissions:** use the two approved named presets in `BR-009`: Workspace Access (default) and Provided Materials Only. Step approvals can be once or limited to an explicitly named scope in the same Chat until revoked. There is no blanket Full Access mode.
- **Provider/model:** `BR-005` is authoritative for built-in provider IDs and accepted custom API protocols. Unknown model capabilities remain unknown. Release default model IDs remain pending provider compatibility evidence; do not invent them.
- **Attachments:** `BR-001` is authoritative for file types. The candidate limits **10 new attachments per request and 20 MiB per file** are validation inputs, **not product rule values** until measured and approved; `BR-001` still says `not set` for both.
- **References:** project-folder references are not attachments. They do not consume attachment count and are checked again when the file is actually read. Referenced content is not silently copied into permanent attachment storage.
- **Public research:** separate `web_search` and `web_fetch` capabilities and provider adapters, similar to DeepSeek. No external research provider is considered approved merely because code supports it. When none is approved/configured, no outside research connection occurs (`FR-088`). Never send private material to public research (`FR-090`).
- **Context:** manual compaction only. Suggest compaction when a known/estimated context percentage reaches the value in `BR-010`; never invent a context number or compact automatically.
- **External boundaries:** do not broaden the Agent's file or network access through UI convenience, source text, file content, model output or permission prompts.

## Proposed Accepted flows

Flow names and IDs below were read from the use-case files on the stated branch. Acceptance is **for V2 delivery**, not a claim that these flows are currently implemented.

| Use case | Accepted V2 flows | Reason / boundary |
|---|---|---|
| `UC-003` Send a request | `MF`, `A3`, `A6`, `A8`, `A11`, `A12`, `A13`, `A14`, `A17`, `A18`, `A19`, `A27`, `A28`, `A31`, `A38`, `A40`, `A41`, `A43`, `A44`, `A45`, `A46`, `A48`, `A49` | Text/attachment/source input, model choice, request lifecycle, activity, permissions, context and public research. |
| `UC-005` Set up providers/models | `MF`, `A1`, `A2`, `A3`, `A4`, `A5`, `A6`, `A7`, `A8`, `A9`, `A10`, `A11`, `A12`, `A14` | Configuration, provider protocol, metadata and reasoning. `A13` is held until release default models can be named and tested. |
| `UC-006` Reopen earlier chat | `MF`, `A1`, `A2`, `A3`, `A4`, `A5`, `A6`, `A7`, `A8` | History, switching, unavailable data and failed saves. |
| `UC-012` Start new chat | `MF` | Chat belongs to current Workspace; no workspace required for default Chat. |
| `UC-013` Workspace | `MF`, `A1`, `A2`, `A3`, `A4`, `A5`, `A6` | Workspace registration, removal, missing/moved folder and active-request restrictions. |
| `UC-014` Permissions | `MF`, `A1`, `A2`, `A3` | Per-chat presets, explicit approval, continuing grants. |
| `UC-015` Context | `MF`, `A1`, `A2`, `A3` | Context metering, user-started compact and threshold suggestion. |

**Important scope conditions:**

1. `UC-003 A48/A49`: search/fetch infrastructure, privacy guards, safe failure and tested adapter behavior belong to V2. **Live outside research is blocked until a service is explicitly approved**; do not weaken `FR-088` to pass a gate.
2. `UC-005 A13` (restore default models) is **Held**, not silently treated as completed. The team can implement a versioned catalog mechanism, but the flow cannot be claimed while default IDs in `BR-005 V-5` remain unset.
3. Full success for `UC-003 A3/A8/A43` depends on tested TXT/MD/PDF/DOCX/PNG/JPEG/PPTX ingestion and measured safety limits; if evidence is missing, report the remaining gap instead of claiming acceptance.
4. A source reference and an attachment are not interchangeable; see `FR-082` and `BR-001`.

## Held / excluded flows and capabilities

| Area | Held or excluded | Why |
|---|---|---|
| `UC-003` alternate input | `A2`, `A4`, `A15`, `A16`, `A25`, `A26` | Voice input, third-party connectors and skill interactions are outside the seven implementation groups. |
| `UC-003` session export | `A47` | Session archive export (`UC-016`) is separate from Deck Export and is not part of this V2 scope. |
| `UC-005` default-model restore | `A13` | Await release-specific verified defaults (`BR-005 V-5`). |
| `UC-016` | Entire use case | Session export remains future scope. |
| `UC-004` | Entire use case | Deck Export (PDF/PPTX) remains future scope. |
| `UC-001` and slide-related design flows | No new flow selection | Do not add or redesign Outline/Slide Generation, Design System, Visual Styles, Deck Export or direct editing. Maintain existing functionality through regression tests. |
| Automatic compaction | Not selected | Only the user starts a compact (`UC-015`, `FR-079`). |
| Full-computer permission mode | Not selected | Contradicts the agreed permission boundaries (`BR-009`, `NFR-003`). |

Other ideal-product flows not named above are **Not Considered for V2** and remain in `docs/spec/`; that classification is not deletion or rejection of those behaviors.

## Version boundaries and release gate

V2 delivery is not complete merely because all three subtasks in each group have finished coding. Each group has a gate; final acceptance requires demonstration against the selected flows, security constraints and V1 regressions. No team member can mark an unapproved outside service, an unmeasured attachment limit or an unverified model capability as validated.

**Approval checkpoint:** Product Owner approves this exact flow table before the scope is recorded as accepted and V2 is made active in `docs/versions/README.md`. Until then, preserve the prior active-version record. Technical contracts are proposals until documented/accepted as required by `AGENTS.md`.
