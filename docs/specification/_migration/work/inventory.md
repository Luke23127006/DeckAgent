# Kiểm kê (sinh bởi tools/spec/migrate_sheet.py)

## Số item theo loại × status

| Loại | Tab | Status | Số item |
|---|---|---|---|
| actors | Actors | Active | 3 |
| **actors** | | **Tổng** | **3** |
| constraints | Constraints | Active | 3 |
| constraints | Constraints | Retired | 4 |
| **constraints** | | **Tổng** | **7** |
| assumptions | Assumptions | Open | 22 |
| assumptions | Assumptions | Retired | 1 |
| assumptions | Assumptions | Supported | 1 |
| **assumptions** | | **Tổng** | **24** |
| use-cases | Use Cases | Active | 8 |
| use-cases | Use Cases | Deprecated | 1 |
| use-cases | Use Cases | Draft | 6 |
| use-cases | Use Cases | Proposed | 9 |
| **use-cases** | | **Tổng** | **24** |
| business-rules | Business Rules | Active | 13 |
| business-rules | Business Rules | Draft | 1 |
| business-rules | Business Rules | Proposed | 4 |
| **business-rules** | | **Tổng** | **18** |
| requirements | Requirements | Active | 28 |
| requirements | Requirements | Draft | 5 |
| requirements | Requirements | Proposed | 21 |
| **requirements** | | **Tổng** | **54** |
| decisions | Decisions | Active | 23 |
| decisions | Decisions | Superseded | 3 |
| **decisions** | | **Tổng** | **26** |
| **glossary** | Operating Rules | GL-xxx | **25** |

## Đối chiếu số hàng

| Tab | Hàng có giá trị ở cột ID | Hàng khớp mẫu ID (= item) | Hàng bị bỏ (không phải ID) |
|---|---|---|---|
| Actors | 3 | 3 | — |
| Constraints | 7 | 7 | — |
| Assumptions | 24 | 24 | — |
| Use Cases | 24 | 24 | — |
| Business Rules | 18 | 18 | — |
| Requirements | 54 | 54 | — |
| Decisions | 26 | 26 | — |
| Operating Rules (GL-) | — | 25 | — |

ID trùng: không có

## Khoảng trống trong dãy ID

- actors: max ACT-003; không trống
- constraints: max C-007; không trống
- assumptions: max A-029; trống: A-024, A-025, A-026, A-027, A-028
- use-cases: max UC-025; trống: UC-006
- business-rules: max BR-018; không trống
- requirements: max R-054; không trống
- decisions: max D-030; trống: D-019, D-020, D-021, D-022

## Giá trị không có trong enum của schema.json

| Loại | ID | Cột | Giá trị | Ghi chú |
|---|---|---|---|---|
| requirements | R-041 | Type | Constraint | type không có trong schema → blocker DOI_LOAI |
| requirements | R-027 | Area | CI | area không có trong schema |
| requirements | R-032 | Area | Infra | area không có trong schema |
| requirements | R-035 | Area | Infra | area không có trong schema |
| requirements | R-037 | Area | Infra | area không có trong schema |
| requirements | R-041 | Area | Schedule | area không có trong schema |
| requirements | R-042 | Area | Infra | area không có trong schema |
| requirements | R-051 | Area | Infra | area không có trong schema |
| requirements | R-053 | Area | Infra | area không có trong schema |
