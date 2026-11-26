# Build

Đọc file này để biết các plan triển khai của DeckAgent nằm ở đâu.

| File | Nội dung |
| --- | --- |
| [refactor/rules/plan/README.md](refactor/rules/plan/README.md) | Refactor 01: check tài liệu, hook khi sửa file, quét comment, đo oxlint |
| [refactor/UCs/plan/README.md](refactor/UCs/plan/README.md) | Refactor: chuyển spec cũ trong `docs/00-old/spec/` sang use case trong `docs/UCs/` |
| [refactor/boundaries/plan/README.md](refactor/boundaries/plan/README.md) | Boundary refactor: contracts, ownership, application structure, tests, and dependency checks |
| [refactor/module-design/README.md](refactor/module-design/README.md) | Module design refactor: codebase measurements, deep-module direction, and divide-and-conquer diagnosis |
| [refactor/module-design/plan/README.md](refactor/module-design/plan/README.md) | Module design implementation plan (Revision 1: Phase 1 scan, triage, and timeout investigation) |
| [refactor/target-structure/README.md](refactor/target-structure/README.md) | Target structure refactor: Express Host, domain modules, agent core ports, and React Browser |
| [refactor/target-structure/plan/README.md](refactor/target-structure/plan/README.md) | Target structure implementation plan (Revision 1: Phase 1 conventions, tech stack, and agent core contract diagnosis. Revision 1b: agent core contracts and Phase 1 exit check. Revision 2: Phase 2 diagnosis of routes, shared HTTP behavior, Host package and test baseline. Revision 2b: Phase 2 structure decisions, HTTP edge tests, move of the Node code into `apps/host/`, and Express 5 measurement. Revision 2c: Express routing, folder-level import rules and the Phase 2 exit check. Revision 3: Phase 3 diagnosis of the workspaces module. Revision 3b: move of the workspaces module into `apps/host/src/modules/` and the folder-level rules for modules. Revision 3c: change notice contracts, Host `ChangeFeed`, workspaces schema 2 with `version` and `expectedVersion`, and Browser `/api/changes` plus `WORKSPACES_STALE` handling. Revision 3d: Phase 3 diagnosis of the chats module. Revision 3e: move of the chats module, the chats version and notices, and the Browser refresh of the chat list. Revision 3f: Phase 3 diagnosis of the providers module. Revision 3g: providers module move, providers version, notices and stale check. Revision 3h: attachments and draft module move, session change route, draft notices, Zod validation and Browser notice sync) |
