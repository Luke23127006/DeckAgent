# Báo cáo quan hệ (sinh bởi tools/spec/migrate_sheet.py)

- Cặp (ô, ID) trong các cột quan hệ của sheet (trước khi lật, gồm cả cột chiều ngược và `Căn cứ`): **957**
- Quan hệ sau khi lật và khử trùng (trong relations.json): **782**

| Field | direct | flipped | derived |
|---|---|---|---|
| addresses | 76 | 0 | 0 |
| assumptions | 24 | 73 | 0 |
| business_rules | 0 | 36 | 0 |
| constraints | 10 | 29 | 0 |
| depends_on | 41 | 0 | 0 |
| documents | 24 | 0 | 0 |
| extend | 13 | 0 | 0 |
| follows | 18 | 0 | 0 |
| include | 20 | 0 | 0 |
| primary_actor | 24 | 0 | 0 |
| related | 19 | 0 | 0 |
| shapes | 0 | 17 | 0 |
| source | 216 | 0 | 0 |
| split_from | 5 | 0 | 0 |
| supporting_actors | 0 | 0 | 10 |
| use_cases | 44 | 83 | 0 |

## Mâu thuẫn hai đầu (2)

| Loại | Item A | Item B | Chi tiết |
|---|---|---|---|
| actor-primary | UC-005 | ACT-001 | UC-005 ghi Primary Actor = ACT-001, nhưng Related Use Cases của ACT-001 không có UC-005 |
| d-a | D-030 | A-013 | D-030.Assumption chính có A-013, nhưng A-013.Used By không có D-030 |

## Tham chiếu gãy (0)

| Item | Cột | ID trỏ tới | Lý do |
|---|---|---|---|
| — | | | không có |

## Sai loại đích (0)

| Item | Cột | ID | Lý do |
|---|---|---|---|
| — | | | không có |

## Used By trỏ tới loại khác R/D (0)

- không có

## Primary Actor không đúng một (0)

- không có

## Nhãn Quan hệ UC không nhận ra

- không có

## GX-04: item Active dựa vào item hết hiệu lực (12)

| Nguồn (status) | Field | Đích (status) | Cột gốc |
|---|---|---|---|
| R-041 (Active) | use_cases | UC-005 (Deprecated) | Use Cases.Related Requirements |
| R-042 (Active) | use_cases | UC-018 (Draft) | Use Cases.Related Requirements |
| R-029 (Active) | constraints | C-001 (Retired) | Constraints.Related Requirements |
| R-041 (Active) | constraints | C-001 (Retired) | Constraints.Related Requirements |
| D-006 (Active) | constraints | C-001 (Retired) | Constraints.Related Decisions |
| D-015 (Active) | constraints | C-001 (Retired) | Constraints.Related Decisions |
| R-003 (Active) | constraints | C-005 (Retired) | Constraints.Related Requirements |
| R-004 (Active) | constraints | C-005 (Retired) | Constraints.Related Requirements |
| D-011 (Active) | constraints | C-006 (Retired) | Constraints.Related Decisions |
| R-030 (Active) | constraints | C-007 (Retired) | Constraints.Related Requirements |
| R-032 (Active) | constraints | C-007 (Retired) | Constraints.Related Requirements |
| R-041 (Active) | assumptions | A-004 (Retired) | Assumptions.Used By (IDs) |

## Áp lên item đã Closed (Lint cảnh báo) (0)

| Nguồn (status) | Field | Đích (status) |
|---|---|---|
| — | | không có |

## Level của Use Case (từ `Include` của UC khác)

| UC | level | Được include bởi |
|---|---|---|
| UC-001 | user-goal | — |
| UC-002 | user-goal | — |
| UC-003 | user-goal | — |
| UC-004 | user-goal | — |
| UC-005 | user-goal | — |
| UC-007 | user-goal | — |
| UC-008 | user-goal | — |
| UC-009 | user-goal | — |
| UC-010 | user-goal | — |
| UC-011 | user-goal | — |
| UC-012 | user-goal | — |
| UC-013 | user-goal | — |
| UC-014 | subfunction | UC-001, UC-002, UC-003, UC-004, UC-008, UC-023, UC-025 |
| UC-015 | subfunction | UC-001, UC-002, UC-003, UC-004, UC-007, UC-008, UC-012, UC-013, UC-017, UC-022, UC-023, UC-024, UC-025 |
| UC-016 | user-goal | — |
| UC-017 | user-goal | — |
| UC-018 | user-goal | — |
| UC-019 | user-goal | — |
| UC-020 | user-goal | — |
| UC-021 | user-goal | — |
| UC-022 | user-goal | — |
| UC-023 | user-goal | — |
| UC-024 | user-goal | — |
| UC-025 | user-goal | — |

## Cột bị bỏ

| Tab | Cột | Số ô có dữ liệu | Xử lý |
|---|---|---|---|
| Constraints | Impacts | 7 | bỏ |
| Assumptions | Impacts | 24 | bỏ |
| Assumptions | Related Work (IDs) | 15 | bỏ |
| Use Cases | Related Work | 9 | bỏ |
| Requirements | Related Work (IDs) | 32 | bỏ |
| Requirements | Related Tests | 0 | bỏ |
| Decisions | Related Work | 26 | bỏ |
| Actors | Related Use Cases | 3 | không ghi, dùng để suy ra/đối chiếu |
