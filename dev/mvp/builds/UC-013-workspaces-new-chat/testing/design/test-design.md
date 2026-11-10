---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "Test design — workspace theo thư mục và chat mới"
milestone: mvp
created: 08-11-2026
---

# Test design — workspace theo thư mục và chat mới

## At a glance

- **Dùng để làm gì:** **bản tổng hợp** của Test Design Specification ([test-strategy.md](../../../../../development/test-strategy.md) mục "Test design specification"). File này giữ **mục lục các technique** (mỗi technique một file evidence trong [techniques/](./techniques/)), **số coverage item**, và **gap, deviation đang mở**. **Lý do chọn technique** và **design input** nằm ở [testing-plan.md](../planning/testing-plan.md) mục 2; **scope ruling** ở [traceability-matrix.md](../traceability-matrix.md) mục "Items not tested"; **AC và measure** ở [acceptance-criteria.md](./acceptance-criteria.md).
- **Thiết kế trước STLC:** [pre-stlc-design.md](./pre-stlc-design.md), **chỉ dùng ở bước reconciliation**.
- **Status:** _D5 có file evidence, chờ PO review · D1 đến D4, D6 đến D10 chưa bắt đầu · 10 gap và deviation `pending` (mục 2)_

## 1. Technique đã áp dụng

<!-- Một dòng cho mỗi design input của testing-plan.md mục 2.3. Không nhắc lại basis item, lý do hay criterion. Section mở khi cột "Chờ" của design input trống. -->

| Design input | Technique | File evidence | Coverage item (có test case / cần) | Trạng thái |
|---|---|---|---|---|
| D1 | State transition: vòng đời workspace và folder | — | — | chưa bắt đầu |
| D2 | Decision table: kết quả khi thêm hoặc chọn folder | — | — | chưa bắt đầu |
| D3 | Decision table: báo folder không đọc được hoặc bị thay | — | — | chưa bắt đầu |
| D4 | EP + BVA: đường dẫn folder | — | — | chưa bắt đầu |
| D5 | EP + BVA và decision table: tên workspace | [D5-workspace-name.md](./techniques/D5-workspace-name.md) | EP 36 Covered, 1 Blocked · BVA requirement 37 Covered, 2 Blocked; transformation 3 Blocked; platform 4 (ngoài criterion) · DT 5 / 5 | chờ review |
| D6 | Invariant check | — | — | chưa bắt đầu |
| D7 | Use case testing | — | — | chưa bắt đầu |
| D8 | Threat-based | — | — | chưa bắt đầu |
| D9 | Decision table: thao tác theo client | — | — | chưa bắt đầu |
| D10 | Fault injection | — | — | chưa bắt đầu |

## 2. Gaps, deviations và rulings

<!-- Kind: gap (spec không trả lời), deviation (không áp dụng một technique hoặc coverage criterion mà risk level đòi), checklist (lỗi C1–C8), infra (lựa chọn về hạ tầng test). Outcome: kết quả như sự thật hiện tại, hoặc "pending". Một mục đã quyết được ghi vào file sở hữu nó (testing-plan.md, acceptance-criteria.md, file evidence, test-implementation.md, hoặc spec) và bỏ khỏi bảng, nên bảng chỉ giữ mục đang mở. -->

| ID | Kind | What, đề xuất | Outcome |
|---|---|---|---|
| Z-18 | checklist | **FR-071 AC-12** đòi tên workspace **giống từng byte** tên folder NFD, **mâu thuẫn** với quy tắc **NFC** (AM-2). **Đề xuất:** sửa AC theo BR-020, **không đổi spec**. | pending |
| Z-19 | deviation | **FR-143** (từ chối thay đổi workspace và chat từ client không được phép) **chưa có AC** và **chưa có dòng** trong [traceability-matrix.md](../traceability-matrix.md). | pending |
| Z-20 | infra | Mục "Test driver and fixtures" của [test-implementation.md](../../implementation/test-implementation.md) **vẫn ghi `stat`** là positive control của `fsAudit`, **trái yêu cầu** của mechanism M3 ([test-analysis.md](../analysis/test-analysis.md) mục 3): positive control phải **phát hiện một thao tác đọc file bị cấm**. | pending |
| Z-22 | deviation | Một AC **chứa nhiều biến thể độc lập** (ví dụ FR-071 AC-2 có 7 dạng đường dẫn). Mỗi biến thể phải là **một test case riêng**, có **kết quả riêng**. | pending |
| Z-23 | deviation | Condition của [pre-stlc-design.md](./pre-stlc-design.md) **có mã** nhưng **chưa liên kết** tới **basis item** và **test case**; bảng ở mục 1 **chưa có số coverage item** cho các section đó. | pending |
| Z-24 | gap | Candidate gap **CG-1 đến CG-10** (BR-019, BR-020) ở test-analysis.md là **đầu vào** của Test Design: kiểm từng cái **bằng technique** đã ghi, **không tự chuyển** thành test case. | pending |
| Z-25 | deviation | **Use case testing**, **threat-based** (security, gồm FR-143) và **fault injection** (NFR-008 M-1) **chưa có section**. | pending |
| Z-26 | gap | **Tên folder chỉ gồm khoảng trắng** mà Windows cho phép (ví dụ một U+00A0), khi thêm workspace (K18 ở [D5-workspace-name.md](./techniques/D5-workspace-name.md)). V-1 của BR-020 định nghĩa tên rỗng là tên **không còn ký tự nào sau khi bỏ khoảng trắng**, mà **không nói nguồn**, nên đọc được là tên này **rỗng**. Statement của BR-020, V-3 và FR-071 cùng nói tên lấy từ folder **không bị bỏ khoảng trắng**, và FR-071 **không có nhánh từ chối** vì tên. **Đề xuất:** tên này **có 1 ký tự** và **được nhận**; **không sửa spec**. EC34 và TC42 của D5 **Blocked** đến khi có outcome. | pending |
| Z-27 | gap | **Tiêu chí phủ tập khoảng trắng** của V-3: tập là **mọi ký tự** mà `String.prototype.trim()` bỏ (25 ký tự trên Node 22.19, Unicode 16.0); V-3 nêu **bốn ký tự** làm ví dụ. **Đề xuất:** tập là **toàn bộ** ký tự `trim()` bỏ, mỗi class **một representative**, vì plan **không đánh dấu** V-3 là closed list. D5 đã thiết kế theo đề xuất này. | pending |
| Z-28 | gap | **Khi cắt tên folder dài hơn 100 code point, phần nào được giữ.** FR-071 nói tên "**bị cắt còn tên dài nhất**", BR-020 V-2 nói **100 code point sau NFC**; không câu nào nói giữ **phần đầu**. FR-071 AC-15 nháp đòi "**100 ký tự đầu**", nên AC đó **thêm một hành vi** spec chưa có (D5, EC23). **Đề xuất:** giữ **100 code point đầu** của dạng NFC, và thêm câu đó vào FR-071 hoặc BR-020 V-2; đây là **hành vi sản phẩm**, nên spec đổi trước khi test dùng giá trị chính xác. Test case **Blocked**: TC35, TC53, TC59, TC60, TC61, TC62. | pending |
