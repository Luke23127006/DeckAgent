# Specification của DeckAgent

Thư mục này chứa spec của DeckAgent dưới dạng file trong Git: mỗi item là một file Markdown có frontmatter, nằm trong folder theo loại.

| Folder | Loại item | Mẫu ID |
|---|---|---|
| `01-actors/` | Actor | `ACT-001` |
| `02-constraints/` | Constraint | `C-001` |
| `03-assumptions/` | Assumption | `A-001` |
| `04-use-cases/` | Use Case | `UC-001` |
| `05-business-rules/` | Business Rule | `BR-001` |
| `06-requirements/` | Requirement | `R-001` |
| `07-decisions/` | Decision | `D-001` |

Ngoài các folder trên:

| File | Nội dung |
|---|---|
| `_COMMON_CRITERIA.md` | Tiêu chí chung cho mọi loại item |
| `_SOURCES.md` | Nguồn của từng tiêu chí |
| `schema.json` | Cấu hình riêng của DeckAgent: status, enum, mẫu ID, field bắt buộc, quan hệ |
| `glossary.md` | Thuật ngữ và các từ không dùng |
| `_RETIRED_IDS.md` | ID đã nghỉ, không được dùng lại (GX-01) |
| `_PROVISIONAL.md` | Mọi ngưỡng tạm (`_COMMON_CRITERIA.md` mục 7); sinh bằng `python tools/spec/spec_backlog.py` |
| `_FILL_LATER.md` | Field và section còn để trống sau khi migrate từ Google Sheet |

## Thứ tự đọc

Khi viết hoặc sửa một item:

1. `_COMMON_CRITERIA.md`
2. `_CRITERIA.md` trong folder của loại item
3. `_TEMPLATE.md` trong folder đó

Giá trị enum (status, type, scope, area…) lấy từ `schema.json`, không tự đặt.

## Tạo item mới

1. Copy `_TEMPLATE.md` của folder thành file mới trong cùng folder.
2. Đặt ID bằng ID lớn nhất hiện có của loại đó cộng 1. Không dùng lại ID đã nghỉ.
3. Đặt tên file trùng ID, ví dụ `UC-012.md`.
4. Điền frontmatter theo template; xóa các section tùy chọn còn trống như template hướng dẫn.

## Quan hệ một chiều

Quan hệ giữa các item chỉ ghi ở **phía nguồn** theo bảng "Hợp đồng quan hệ" (`_COMMON_CRITERIA.md` mục 2). Không thêm field cho chiều ngược; danh sách chiều ngược do công cụ sinh.

## Việc chưa có

- Validator kiểm tiêu chí tầng CI và Lint. Hiện có script kiểm tạm `tools/spec/check_spec.py` cho một phần tiêu chí tầng CI.
- CI chạy validator trên PR, gồm Lint từ vựng (GX-07) mỗi khi PR sửa `docs/specification/**`.
- Nội dung còn để trống sau khi migrate từ Google Sheet: xem `_FILL_LATER.md`.
