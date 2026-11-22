# DeckAgent Rebuild — Dev Implementation Plan

**Status:** Dev roadmap + build execution guides; no code implemented by these documents.  
**Date:** 2026-11-10  
**Product baseline:** `clean-main` @ `a0d204a613d0decab2d627a9d5868d9c9e162b9e`  
**OpenCode POC:** `feat/v2-opencode` @ `5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37`  
**OpenDesign evidence:** `nexu-io/open-design` @ `aae63c89dd5787c258f47f2742bb79572330bf5c`

## 1. Purpose

**Đây là plan giao cho Dev/coding agents, không phải Testing Plan của tester.** Dev cần xây DeckAgent local-first, clone/install/run, dùng Local Web UI + `opencode run` và đúng các product behaviors. Dev chịu trách nhiệm code quality, unit tests, integration tests và basic runtime smoke để **khẳng định implementation sẵn sàng bàn giao**. Tester có test strategy, test design và verification riêng; không cần phối hợp hai lane trong tài liệu này.

Scope: 9 active UCs từ `clean-main/docs/spec/`: UC-001, UC-002, UC-003, UC-005, UC-006, UC-009, UC-010, UC-012, UC-013. Những UC/FR ở `docs/spec/05-backlog/` (ví dụ export) **không tự thành MVP scope**. Mỗi requirement reference chỉ dẫn về source spec; build notes không thay thế câu chữ trong spec.

**Product authority:** Specs → Architecture Decisions (`adr/`) → architecture contracts → build tasks. Existing code/OpenDesign/POC chỉ là reference để reuse. Dev **không** tự thay product behavior, mở rộng scope hoặc sửa test cho khớp code sai.

## 2. Những gì đã chốt trước khi code

- **Runtime:** OpenCode CLI `opencode run`; không maintain Cordis/custom Agent Loop trong new production path; không dựng hosted backend hoặc OpenCode server như lựa chọn song song.
- **State:** DeckAgent SQLite + application-managed files; project folder chỉ là source read-only (ADR-0001).
- **History:** Chat ID và history thuộc DeckAgent; native session resume có guard (ADR-0002).
- **Permissions:** Request-scoped MCP + Host authorization; native tools không được bypass Host (ADR-0003).
- **Lifecycle:** Host controls Request status/events/Stop/restart recovery (ADR-0004).
- **Deck:** Host publish/revision authority; only finished revisions visible (ADR-0005).
- **Models:** BYOK with separate credential store, per-request settings snapshot (ADR-0006).
- **Visual:** Design System ≠ Template; HTML default; snapshot theme; limited template catalog at start (ADR-0007).
- **Code placement:** [`architecture/repository-structure.md`](architecture/repository-structure.md) quyết định ownership/dependency. Chỉ đổi boundary khi có evidence.

## 3. Build Roadmap

| Build | Dev deliverable có thể chạy/demo | Main UC | Upstream dependency | Status |
|---|---|---|---|---|
| [B01](builds/B01.md) Local Foundation | Local Host/Web UI, Workspace, Chat, local persistence/reopen | UC-013, UC-012, UC-006 (không có active run) | Baseline | Implemented — Pending Independent Testing |
| [B02](builds/B02.md) Models & Requests | Provider/model, CLI requests, native session, events, Stop/reconnect | UC-005, UC-003 core | B01 IDs/storage/Host API | Implemented, including FR-079; checked with a fake OpenCode CLI — real CLI smoke not run, BR-006 V-1 not set |
| [B03](builds/B03.md) Sources & Tool Boundary | Attachments, protected folder reads, MCP tools, step approval | UC-003 + UC-001 inputs | B01 storage, B02 CLI/MCP contract | Detailed |
| [B04](builds/B04.md) Outline → First HTML Deck | Interview, brief/outline, confirmation, first published HTML deck | UC-001 main path | B02+B03 + visual contract | Detailed; blocked values listed |
| [B05](builds/B05.md) Complete Generation | Multi-slide, progressive publish, recover, sources/images, quality gates | UC-001 remaining | B04 Deck/Preview contracts | Detailed |
| [B06](builds/B06.md) Editing & Q&A | Scoped follow-up edits and read-only deck Q&A | UC-002, UC-009 | B05 publish/history/source contracts | Detailed |
| [B07](builds/B07.md) Design System | Custom DS creation/edit/preview and independent deck themes | UC-010 | B04 theme/template contracts | **Draft** |
| [B08](builds/B08.md) MVP Integration | Clean clone/install/run, remove dead runtime, integrate all active UCs | Cross-build | B01–B07 | Detailed at integration level |

**Dependencies are feature-level, not a forced waterfall:** B02 CLI adapter and B03 attachment/file work may run in parallel after shared Host contracts. B07 may start after B04 schema stabilizes while B05/B06 proceed. B08 is integration + distribution, not a backlog bucket for missing functionality.

## 4. Giao task cho coding agent

Every `Bxx-IMP-xx` includes: outcome, affected owner/modules, inputs/contract, instructions, constraints and developer verification. Dev must complete **one cohesive task** before changing a new domain. Within a task, coding agent may choose small implementation details, but it may **not** change Spec/ADR/package owner to avoid a failing check.

**Execution rule for each task:**

1. Read exact referenced specs + ADR/architecture + upstream public interfaces. Inspect files before editing.
2. Implement within the owning module; prefer reuse/adapt validated logic, not whole-file copy from legacy or POC.
3. Add/update **developer unit/integration tests** for changed contract and failure path. Run relevant existing checks.
4. Report changed files, tests/commands/results, known limitations, and handoff contract. A failed check must be reported as failed, not waived.

**No separate testing workstream in these files.** UC-based black-box testing, STLC, independent acceptance and tester's regression planning remain outside this Dev plan. Developer integration tests may still exercise a UC-relevant path, but their purpose is checking code integration, not claiming full product correctness.

## 5. Developer Done vs product verification

A build is **Dev Done** when its runnable outcome works; required domain invariants pass unit checks; relevant package/API/CLI integration checks pass; TypeScript/build/format checks applicable to changed code pass; no forbidden project-folder write, cross-chat leak or permission bypass is known; and the Dev handoff reports all run results. **Dev Done does not mean tester has verified the behavior.**

If a contract is unimplemented or an acceptance check fails, label the task `BLOCKED` or `PARTIAL` and retain the failed evidence. Do not report entire build as complete because the happy path works. No extra approval ceremony is required between small tasks; only interfaces/blockers must be communicated.

## 6. Ownership and work allocation

| Area | Dev ownership | Coordination |
|---|---|---|
| Local Host, UI wiring, Workspace, Chat | B01 | Stable `workspaceId`, `chatId`, read/write-free source folder |
| Provider, native CLI, Session, Request/Activity | B02 | Share request-scoped tool bridge interface with B03 |
| Source reads, attachments, MCP authorization | B03 | Share input/permission/tool contracts with B02 and B04 |
| Outline/Deck/Preview + visual defaults | B04–B05 | B07 consumes same theme/template contract |
| Scoped edit + Q&A | B06 | Use DeckService publish/read API, not direct SQL |
| Custom Design Systems | B07 | Parallel after B04 schema fixed; not a B05/B06 blocker |
| Packaging, cleanup, integration | B08 | One integration owner for overlapping entrypoint/dependency changes |

If multiple Devs work simultaneously, divide by **package ownership + frozen shared contracts**. Never let two agents independently rewrite `apps/local-web/src/index.ts` on separate branches without an integration owner. Merge code only after dependency contract can run with its caller; do not wait for all builds to finish to discover integration drift.

## 7. Gaps chốt tại build tương ứng

| Gap / source | Owner | Before enabling behavior |
|---|---|---|
| BR-006 built-in provider requirements; credential-at-rest OS design | B02 | Provider setup real keys cannot be released without validation, secret isolation and NFR-006 checks |
| BR-001 attachment count/size; BR-002 text limit | B03 (text admission contract shared B02) | Set rule values in product spec; reject before accepting real input |
| BR-003 default DS; BR-017 theme roles; BR-018 built-in/default template | B04 | Write final values into spec before code claims default/template behavior; B07 uses those values |
| Native CLI version/session behavior, cross-platform availability | B02; B08 distributions | Test pinned CLI and documented local startup; do not infer OS support from one POC |
| Agent Skills to deliver generation quality | B03–B06 | Treat skill/prompt as implementation input, version and test output contracts; no additional user-facing skill workflow |
| Other generation formats | Not automatically in B01–B08 | Only explicit available formats; BR-011 categories ≠ implemented capabilities |

If a required **product value** is not set, Dev must flag `BLOCKED: PRODUCT VALUE` on that task, supply choices/evidence, and avoid inventing a value. Other independent tasks can proceed. Technical internals that do not change architecture can be chosen and recorded in the build handoff.

## 8. Migration plan

- Selectively adapt `apps/local-web/`, `packages/host/api/`, `packages/client/runtime/`, `packages/session/persistence/`, `packages/presentation/deck/`.
- Selectively port OpenCode process/config/parser/MCP/provider code from `feat/v2-opencode`; remove dependencies on custom Agent Runtime before using it in new path.
- B01 creates clean composition and Workspace owner; B02 replaces runtime path; B03 enforces tool boundary; B04–B06 reuse Deck domain with adapted artifact storage; B07 expands visual catalog; B08 removes dead runtime packages/imports from production and cleans docs/scripts.
- Legacy code may remain **temporarily unreachable** during migration, but must not be retained as an alternate production runtime. Never delete whole packages without checking used imports/tests.

## 9. Current status and next action

Documentation exists for B01–B08. **No code, tests, deployments or GitHub branches have been changed by this planning work.** B07 remains Draft because product values and the complete custom-design flow require build evidence. Before Dev executes a build, confirm upstream shared contracts still match latest branch; update *implementation detail* in that build when code evidence differs.

**Start:** [`B01.md`](builds/B01.md) for Local Foundation. B02 can begin its isolated CLI parser/adapter preparation once the B01 host/ID contracts are stable; B03 can begin file-policy logic in parallel. Tester's plans are maintained separately.

## References

- [Product specs at baseline](https://github.com/Luke23127006/DeckAgent/tree/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec)
- [Behavior map](planning/01-behavior-map.md) · [Dependency analysis](planning/02-dependency-analysis.md)
- [Architecture overview](architecture/overview.md) · [Repository structure](architecture/repository-structure.md)
