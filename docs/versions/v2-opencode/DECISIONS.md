# V2 OpenCode ? Decisions and open choices

| Choice | Authority / state | Consequence / decision owner |
|---|---|---|
| Replace custom inference loop and Cordis with OpenCode | Team decision supplied by owner, 2 November 2026 | A carries out staged replacement; no second agent loop |
| Thesis proposal controls product scope | Owner instruction and approved PDF | Product owner resolves ambiguities; old version exclusions are historical |
| App data remains separate from project folders | Accepted ADR 0001 | Preserve workspace/source/private-runtime boundaries |
| CLI adapter with request-local MCP, retaining Host and DeckService | POC verified; bounded opt-in port authorized by owner and implemented; permanent production design remains proposed | Public contracts stay unchanged; A records production ADR before extending shared contracts |
| Fresh OpenCode session per send; DeckAgent owns durable history | POC behavior; proposed production default | TASK-002 proves continuity, cost, context limits and crash semantics; native resume is not required |
| Existing public AgentHandle/ToolRegistry contracts remain initially | Proposed smallest migration seam | Do not move packages just to rename runtime; TASK-009 resolves residual imports and package exports |
| Four existing provider protocols retain behavior | Task 002 wire mappings implemented; native Gemini live-qualified; other live cases pending | Explicit option limits and known signature incompatibility are in the task compatibility matrix; no silent option loss or model substitution |
| Windows x64 1.19.5 is the reproduction pin | POC fact, not final release platform/version selection | TASK-001 reproduces it; TASK-009 decides installation, update, license and OS matrix |
| Deny native tools, expose phase-specific MCP tools only | POC verified at application level | Model-visible allowlist plus Host execution checks; never label it an OS sandbox |
| Direct editor representation and save contract | Owner accepted controlled HTML patches on 4 November 2026; ADR 0006 | Existing HTML/revisions remain canonical; bounded text/layout patches through DeckService, no automatic legacy conversion |
| Image route and export format | Product/technical selection pending | TASK-007 owner selects one sufficient image route and export format, then verifies fidelity |
| External Skills host and packaging format | Proposal pending | TASK-008 selects at least one compatible host outside the DeckAgent UI |
| General public research | Deferred from this version | No forced dependency on old V2 TASK-006; ADR 0002 remains proposed |

ADR 0003 (Host step approval) is still marked proposed despite implementation.
Keep the implemented semantics; do not turn this plan into retrospective ADR approval.
Future accepted cross-component decisions belong in `docs/adr/`, with owners and compatibility consequences.
Those files were outside the original documentation-only change. The opt-in port keeps existing public interfaces.
An unresolved production choice blocks its affected implementation, not independent preparation.

## Target execution path

Existing Web client -> Host RequestController -> presentation workflow -> OpenCodeAgentHandle -> pinned OpenCode CLI -> selected model.
OpenCode calls a request-local MCP bridge -> ToolRegistry -> existing file/presentation handlers -> DeckService -> existing snapshots and canvas.

Host owns confirmation, approval, request admission, activity projection and Stop finalization.
DeckAgent SessionStore owns readable conversation history; OpenCode IDs identify executions, not application Chat identities.
CLI JSON events feed the current activity contract. Token-by-token UI streaming is not a new requirement.
The bridge rechecks the current phase allowlist and cancellation at execution. Arguments and publication revisions keep existing validation.
Native plugins, inherited project configuration and extra agents cannot widen this tool surface.

## Transition and retirement

Keep the old backend as an explicit selectable rollback path during TASK-001?003. Never silently retry a failed request on another backend.
Only TASK-009 can change the default and remove legacy runtime/Cordis consumers after parity and rollback tests.
Retain reusable contracts, ToolRegistry, credential/catalog logic and storage even when their current package contains legacy loop code.
Do not delete the whole `packages/agent/runtime` or `packages/llm/providers` directory by name.
