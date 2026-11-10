---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "Test design — workspace theo thư mục và chat mới"
milestone: mvp
created: 08-11-2026
---

# Test design — workspace theo thư mục và chat mới

## At a glance

- **Dùng để làm gì:** **bản tổng hợp** của Test Design Specification ([test-strategy.md](../../../../../development/test-strategy.md) mục "Test design specification"). File này giữ **mục lục các technique** (mỗi technique một file evidence trong [techniques/](./techniques/)), **số coverage item**, và **gap, deviation đang mở**. **Lý do chọn technique** và **design input** nằm ở [testing-plan.md](../planning/testing-plan.md) mục 2; **scope ruling** ở [traceability-matrix.md](../traceability-matrix.md) mục "Items not tested"; **AC và measure** ở [acceptance-criteria.md](./acceptance-criteria.md).
- **Thiết kế trước STLC:** [pre-stlc-design.md](./pre-stlc-design.md) là **đầu vào** cho D1, D2, D3, D6; condition của nó được **nối tới basis item và test case** khi technique đó được thiết kế.
- **Status:** _D5 xong, 68 test case Ready · D1 đến D4, D6 đến D10 chưa bắt đầu · 0 gap đang mở_

## 1. Technique đã áp dụng

<!-- Một dòng cho mỗi design input của testing-plan.md mục 2.3. Không nhắc lại basis item, lý do hay criterion. Section mở khi cột "Chờ" của design input trống. -->

| Design input | Technique | File evidence | Coverage item (có test case / cần) | Trạng thái |
|---|---|---|---|---|
| D1 | State transition: vòng đời workspace và folder | — | — | chưa bắt đầu |
| D2 | Decision table: kết quả khi thêm hoặc chọn folder | — | — | chưa bắt đầu |
| D3 | Decision table: báo folder không đọc được hoặc bị thay | — | — | chưa bắt đầu |
| D4 | EP + BVA: đường dẫn folder | — | — | chưa bắt đầu |
| D5 | EP + BVA và decision table: tên workspace | [D5-workspace-name.md](./techniques/D5-workspace-name.md) | EP 37 Covered · BVA requirement 39 Covered; transformation 3 Covered; platform 4 (ngoài criterion) · DT 5 / 5 | xong |
| D6 | Invariant check | — | — | chưa bắt đầu |
| D7 | Use case testing | — | — | chưa bắt đầu |
| D8 | Threat-based | — | — | chưa bắt đầu |
| D9 | Decision table: thao tác theo client | — | — | chưa bắt đầu |
| D10 | Fault injection | — | — | chưa bắt đầu |

## 2. Gaps, deviations và rulings

<!-- Kind: gap (spec không trả lời), deviation (không áp dụng một technique hoặc coverage criterion mà risk level đòi), checklist (lỗi C1–C8), infra (lựa chọn về hạ tầng test). Outcome: kết quả như sự thật hiện tại, hoặc "pending". Một mục đã quyết được ghi vào file sở hữu nó (testing-plan.md, acceptance-criteria.md, file evidence, test-implementation.md, hoặc spec) và bỏ khỏi bảng, nên bảng chỉ giữ mục đang mở. -->

**Không có mục đang mở.** Candidate gap CG-1 đến CG-10 được kiểm trong technique **ghi ở cột "Candidate gap"** của [testing-plan.md](../planning/testing-plan.md) mục 2.3; D5 đã phủ CG-8, CG-9, CG-10.

