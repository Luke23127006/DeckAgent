---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "Traceability matrix — workspace theo thư mục và chat mới"
milestone: mvp
created: 08-11-2026
---

# Traceability matrix — workspace theo thư mục và chat mới

The build's **traceability spine**. **One row per in-scope FR and BR** in Phase 1; **one row per acceptance criterion** after Phase 2. **No phase gate closes** while a row **misses a link that phase produces** (dev/mvp/WORKFLOW.md "Traceability").

## At a glance

- **Requirement text:** statements in `dev/mvp/spec/`; acceptance criteria in [testing-plan.md](./testing-plan.md) (Phase 2)
- **Use cases:** **workspace theo thư mục** (UC-013) and **bắt đầu chat mới** (UC-012), **all steps and alternatives**
- **Research:** [research-checklist.md](./research-checklist.md)
- **Status:** _13 rows · 0 tested · 0 implemented · 0 verified_

## Matrix

| FR / AC | Tier | RQ | DEC | Test (ticket) | Test author | Impl (ticket / PR) | Verified |
|---|---|---|---|---|---|---|---|
| FR-071 · thêm và chuyển workspace | | RQ-1, RQ-3, RQ-4, RQ-8, RQ-9 | DEC-010, DEC-012 | | | | [ ] |
| FR-072 · workspace mặc định | | RQ-8 | DEC-011 | | | | [ ] |
| FR-073 · xoá workspace | | RQ-15 | DEC-011 | | | | [ ] |
| FR-074 · báo thư mục không đọc được | | RQ-5 | DEC-006 | | | | [ ] |
| FR-083 · chọn thư mục khác | | RQ-3, RQ-4, RQ-15 | DEC-010 | | | | [ ] |
| FR-142 · báo thư mục khác ở chỗ thư mục dự án | | RQ-4, RQ-5 | | | | | [ ] |
| FR-084 · không đổi file trong thư mục dự án | | RQ-2, RQ-3 | DEC-006, DEC-011 | | | | [ ] |
| FR-141 · đổi tên workspace | | RQ-7 | | | | | [ ] |
| FR-053 · bắt đầu chat mới | | RQ-14, RQ-15 | DEC-012 | | | | [ ] |
| FR-048 · hiện các chat cũ | | RQ-13 | | | | | [ ] |
| FR-038 · giữ bản nháp của chat | | RQ-12 | DEC-012 | | | | [ ] |
| BR-004 · chat nào được giữ | | RQ-2 | DEC-006, DEC-011 | | | | [ ] |
| BR-019 · thư mục không được làm thư mục dự án | | RQ-3 | | | | | [ ] |

## Moved to a later build

The PO ruled (RQ-15, [#56](https://github.com/Luke23127006/DeckAgent/issues/56)) that a behavior is **tested in the first build that can test it**. These parts **get no criterion in this build**; that build's testing plan **takes them**.

| Behavior | FR | Needs | Tested in |
|---|---|---|---|
| **No removal and no folder change** while a **request is active** in the workspace | FR-073, FR-083 | **Requests** | Build 3 |
| **Requests keep running** when the user **switches workspace** or **starts a new chat** | FR-071, FR-053 | **Requests** | Build 3 |
| A new chat takes the **model of the latest choice** | FR-053 | **Providers** | Build 2 |
| **Naming a chat** after its content: the **model adds a name** in its first answer, **code falls back** to the first words of the request (RQ-13, [#55](https://github.com/Luke23127006/DeckAgent/issues/55)) | FR-048 | **Requests** | Build 3 |

## Orphan check (run at every gate)

- [ ] **Every in-scope FR and NFR has a row** (Phase 1); **every AC and measure has a row and a tier** (after Phase 2).
- [ ] **Every row has at least one test** (after Phase 2).
- [ ] **No implementer is the test author** of the same row.
- [ ] **Every in-scope DEC is consumed** by at least one row (test or impl).
- [ ] **Every answered RQ leads to a DEC** or a row that uses its result.
- [ ] **No test or implementation ticket exists without a matrix row**.
