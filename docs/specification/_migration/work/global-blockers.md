# Blocker liên loại đã biết từ A1–A3 (ID tạm `G-xx`)

Subagent A4 **không tạo lại** các blocker này. Nếu item của mình bị ảnh hưởng, ghi `G-xx` vào cột Blocker.
Agent chính đánh số lại thành `BLK-xxx` ở A6.

| ID tạm | Loại | Nội dung | Item |
|---|---|---|---|
| G-01 | DOI_LOAI | R-041 có Type = `Constraint`, không có trong enum của Requirement (GR-14) | R-041 |
| G-02 | PHU_THUOC_DONG | Item Active dựa vào C-001 (Retired) | R-029, R-041, D-006, D-015, C-001 |
| G-03 | PHU_THUOC_DONG | Item Active dựa vào C-005 (Retired) | R-003, R-004, C-005 |
| G-04 | XOA_ITEM | C-006, C-007, D-011 là quy tắc "chưa chốt cơ chế / ngưỡng khi chưa có evidence": quy trình hay sản phẩm? Kéo theo GX-04 của D-011→C-006, R-030/R-032→C-007, và quan hệ của R-035, R-036, R-037; text trích D-011 ở ACT-002, UC-014, R-032, R-037 | C-006, C-007, D-011, R-030, R-032, R-035, R-036, R-037, ACT-002, UC-014 |
| G-05 | XOA_ITEM | D-010 (cách phân loại item trong spec): meta về spec hay quyết định sản phẩm? | D-010 |
| G-06 | XOA_ITEM | D-028 (khi nào tiêu chí chất lượng thành Hard Gate, gắn W-026/W-032): sản phẩm hay quy trình research? R-007, R-021, R-025, R-028 trích D-028 trong `source` hoặc text | D-028, R-007, R-021, R-025, R-028 |
| G-07 | PHU_THUOC_XOA | A-005 (giả định về chiến lược Testing, phân loại project) đang được 9 Requirement Active dựa vào | A-005, R-007, R-021, R-024, R-025, R-027, R-028, R-031, R-032, R-033 |
| G-08 | PHU_THUOC_DONG | R-041 (Active) dựa vào A-004 (Retired, phân loại project) và UC-005 (Deprecated) | R-041, A-004, UC-005 |
| G-09 | (rút lại) | Báo nhầm: R-041 chỉ nằm trong phần giải thích trong ngoặc của "Liên quan: UC-008 (…, R-041)". Script đã sửa, không có quan hệ sai loại. Item tham chiếu G-09 coi như không có blocker này | — |
| G-10 | PHU_THUOC_DONG | R-042 (Active) dựa vào UC-018 (Draft) qua `use_cases` | R-042, UC-018 |
| G-11 | SCHEMA | Area ngoài enum: `Infra` (R-032, R-035, R-037, R-042, R-051, R-053), `CI` (R-027), `Schedule` (R-041) | R-027, R-032, R-035, R-037, R-041, R-042, R-051, R-053 |

## Mâu thuẫn hai đầu đã tự xử lý (không thành blocker)

- UC-005 ghi Primary Actor = ACT-001 nhưng Related Use Cases của ACT-001 không có UC-005. Field `primary_actor` nằm ở phía Use Case theo hợp đồng quan hệ, nên giữ `UC-005.primary_actor = ACT-001`. UC-005 đã Deprecated nên việc ACT-001 bỏ UC-005 khỏi danh sách là nhất quán.
- D-030.Assumption chính có A-013 nhưng A-013.Used By không có D-030. Field `assumptions` nằm ở phía Decision và D-030 ghi rõ, nên giữ `D-030.assumptions` có A-013.
