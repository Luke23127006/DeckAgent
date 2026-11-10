# Repository Structure & Code Ownership — DeckAgent Rebuild

**Status:** Selected boundaries for Dev implementation; not a full file-by-file design.  
**Baseline:** `clean-main` @ `a0d204a613d0decab2d627a9d5868d9c9e162b9e`  
**Applies to:** B01–B08 in [`../implementation-plan.md`](../implementation-plan.md)

## 1. Decision

Giữ monorepo hiện tại và **selectively rebuild**. Chốt nơi sở hữu code ở mức `app / package / domain`; không thiết kế trước mọi function/class. Module mới **không** được import custom Cordis Agent Loop để tiết kiệm công migrate.

```
DeckAgent/
├── apps/
│   └── local-web/                # Local Host composition, CLI entrypoint, browser UI assets
│       └── src/
│           ├── opencode/        # OpenCode CLI adapter (port SELECTIVELY from POC)
│           └── ...              # Host wiring, provider settings, app-specific state
├── packages/
│   ├── host/api/                # HTTP boundary, request admission, UI API contracts
│   ├── client/runtime/          # Browser client transport + UI behavior
│   ├── session/persistence/     # Product Chat/history persistence; NO Agent Loop
│   ├── workspace/registry/      # NEW B01: Workspace + canonical folder reference/policy
│   ├── presentation/deck/      # Outline/Deck/Slide state, revision/publish contracts
│   ├── presentation/design/    # NEW B04: built-in theme + template contracts; B07 expands
│   ├── tools/filesystem/        # Authorized source/attachment reads, path guards
│   └── tools/presentation/      # MCP-facing Deck/Outline tool handlers
├── tests/                       # Developer unit/integration fixtures/checks
└── docs/build/rebuild/
    ├── adr/
    ├── architecture/
    ├── builds/
    └── implementation-plan.md
```

New directories are **authorized targets**, not a command to create empty placeholders. Add a package only in the build that needs it. Actual files inside each area may change, but moving a responsibility across ownership boundaries requires recording the change in this document and any affected build file.

## 2. Ownership matrix

| Concern | Single owner | Allowed collaborators | Not allowed |
|---|---|---|---|
| Process startup/shutdown, dependency composition | `apps/local-web/` | Host API + repositories via interfaces | UI controls raw DB, OpenCode reads product DB directly |
| Workspace folder registration, stable IDs, access policy | `packages/workspace/registry/` | `apps/local-web/` wires UI and persistence | Put Chat files in source folder; another Workspace registry in `web-state.ts` |
| Chat ID, messages and draft persistence | `packages/session/persistence/` | Host API, UI projection | Use native OpenCode session ID as Chat ID |
| Provider registry and credential retrieval | `apps/local-web/src/provider-settings.ts` and local secret adapter | Host/CLI per-run config | Store key in conversation, event JSON, Deck or generated files |
| Request admission, lifecycle and event persistence | `packages/host/api/` contract + app-owned storage adapter | `apps/local-web/` runtime callbacks | Let OpenCode decide product terminal state or confirmation |
| Native CLI process, JSON parser, native session binding | `apps/local-web/src/opencode/` | Host/API + session persistence via contracts | Import custom Agent Loop; introduce separate OpenCode server/backend |
| Outline, confirmed deck, slides, revision/source refs | `packages/presentation/deck/` | Presentation tools, Host Preview | Direct UI/model file writes to published source |
| Theme roles, built-in templates, layout matching | `packages/presentation/design/` | Deck snapshot, UI Design System screens | Duplicate theme schema in prompt/UI/Deck |
| Filesystem read grants and path checks | `packages/tools/filesystem/` | MCP bridge calls via Host | Direct native tool unrestricted access to project folder |
| Agent-facing publish/read/outline tools | `packages/tools/presentation/` | DeckService is final authority | Tool mutates Deck DB bypassing service |
| Browser rendering/interaction | `packages/client/runtime/` + existing `apps/local-web/src/ui-assets.ts` | Host HTTP only | Import `node:fs`, SQLite or credentials into browser |

**One ownership rule:** Logic belongs to the domain owner even when UI/adapter calls it. An API route only parses/authorizes/delegates; it is not a second DeckService or Workspace Registry.

## 3. Dependency direction

```text
Browser UI -> Host API -> App composition -> Domain/Storage contracts
                                      -> OpenCode CLI adapter
                                      -> MCP tools -> Domain services
Domain services -> own persistence, filesystem adapter (only if needed)
```

- `packages/presentation/deck/`, `packages/workspace/registry/`, and `packages/session/persistence/` must **not** depend on UI, HTTP transport, OpenCode or Cordis.
- `packages/presentation/design/` provides theme/template contracts to Deck generation; it does not know UI or OpenCode.
- `packages/host/api/` defines interface and admission rules. It may depend on domain contracts, not implementation details of the OpenCode adapter.
- The adapter receives **scoped capabilities and snapshots** from Host; it does not gain access to global application storage.
- Tests may import public modules/fixtures. Production code cannot import `tests/`.
- No shared mutable global session/current-chat variable across requests. Each request carries `chatId`, `requestId`, allowed source roots, and immutable settings snapshot.

## 4. Legacy migration rules

| Legacy area | Strategy | Removal point |
|---|---|---|
| `apps/local-web/src/index.ts`, `cli.ts`, UI assets | Adapt existing local startup and UI; preserve working behavior | Keep; update composition progressively |
| `apps/local-web/src/web-state.ts` | Move Workspace/Chat domain logic to owners; keep UI projection/settings adapters as needed | Remove duplicated storage responsibilities in B01/B02 |
| `packages/session/persistence/` | Reuse SQLite patterns; decouple `@deckagent/agent-runtime` contracts | B01/B02 |
| `packages/presentation/deck/` | Reuse outline gates, publish/revision behavior; adapt artifact storage | B04/B05 |
| `packages/host/api/`, `packages/client/runtime/` | Adapt transport and visible status; avoid UI rewrite | B01–B06 |
| POC `feat/v2-opencode/apps/local-web/src/opencode/` | Selectively port process, parser, MCP bridge, provider mapping; replace legacy types | B02/B03 |
| `packages/agent/runtime/`, `packages/llm/providers/`, Cordis imports | Do **not** retain in new production execution path | Remove dead dependencies/code after replacement, finish in B08 |

**Do not:** delete legacy first and rebuild blindly; copy POC wholesale; keep a second runtime fallback; invent package names inside agents without checking owner; change baseline Specs to fit existing code.

## 5. File-level coordination for multiple Devs

- **B01 contracts first:** `Workspace`, `Chat`, storage API, UI transport. Host/frontend work may proceed in parallel only after data shapes are shared.
- **B02 + B03:** B02 owns CLI/process/session/events; B03 owns source access/MCP authorization. Agree on request-scoped tool contract; avoid both changing the same CLI entrypoint independently.
- **B04 + B07:** B04 owns minimal HTML theme/template contract; B07 expands custom Design System. B07 must not replace the theme schema without B04 compatibility.
- **B05 + B06:** B05 owns publication/revisions; B06 uses those public operations, never direct SQL/file editing.
- When two tasks must change the same file: assign **one integration owner**, merge through public contracts, and keep other changes in their own modules.

## 6. Developer verification (not the separate QA lane)

Every changed package gets relevant **unit tests** for domain rules and **integration tests** for boundaries it owns. Use temp Application Storage and fake/recorded OpenCode events where feasible; add real CLI smoke when that build introduces CLI behavior. Verify package dependency direction and no user-folder mutation. Keep existing test runner if possible (`node --test`, `pnpm typecheck`, `pnpm build`). Record exact commands/results in Dev handoff.

This document **does not prescribe** the tester's STLC, UC test cases, regression suite, or independent test sign-off. Dev can report **implementation complete** after its checks; that is not a claim that all product behaviors have passed independent testing.

## 7. Change policy

If a task cannot meet a spec or architecture constraint with the assigned owner, report: **blocking requirement → affected package/contract → evidence → smallest proposed change**. Do not silently add abstractions, an alternate runtime or a second owner. Update this document only for a real boundary change.

## References

- [Architecture overview](overview.md) · [Data ownership](data.md) · [Tool permissions](tools-permissions.md) · [Deck artifacts](deck-artifacts.md)
- [Implementation plan](../implementation-plan.md) · [B01](../builds/B01.md)
