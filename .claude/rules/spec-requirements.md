---
paths: ["docs/specification/06-requirements/**"]
---

# Spec: Requirement

Áp dụng khi tạo hoặc sửa file trong `docs/specification/06-requirements/`.

1. Trước khi làm, đọc `docs/specification/_COMMON_CRITERIA.md`, rồi `_CRITERIA.md` và `_TEMPLATE.md` trong `docs/specification/06-requirements/`.
2. Dùng đúng frontmatter của template. Giá trị enum (status, type, scope, verification, area) lấy từ `docs/specification/schema.json`, không tự đặt.
3. Chỉ ghi quan hệ ở phía nguồn theo `_COMMON_CRITERIA.md` mục 2. Không tạo field quan hệ chiều ngược.
4. Không ghi "Chưa chốt", "TBD" hay "định nghĩa sau" vào item có status thuộc mức active (Active).
5. Sau khi sửa, đối chiếu item với các tiêu chí tầng CI và Lint trong `_COMMON_CRITERIA.md` và `_CRITERIA.md`, rồi liệt kê tiêu chí nào chưa đạt.
