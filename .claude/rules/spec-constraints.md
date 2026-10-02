---
paths: ["docs/specification/02-constraints/**"]
---

# Spec: Constraint

Áp dụng khi tạo hoặc sửa file trong `docs/specification/02-constraints/`.

1. Trước khi làm, đọc `docs/specification/_COMMON_CRITERIA.md`, rồi `_CRITERIA.md` và `_TEMPLATE.md` trong `docs/specification/02-constraints/`.
2. Dùng đúng frontmatter của template. Giá trị enum (status, type) lấy từ `docs/specification/schema.json`, không tự đặt.
3. Chỉ ghi quan hệ ở phía nguồn theo `_COMMON_CRITERIA.md` mục 2. Không tạo field quan hệ chiều ngược.
4. Không ghi "Chưa chốt", "TBD" hay "định nghĩa sau" vào item có status thuộc mức active (Active, Changed).
5. Sau khi sửa, đối chiếu item với các tiêu chí tầng CI và Lint trong `_COMMON_CRITERIA.md` và `_CRITERIA.md`, rồi liệt kê tiêu chí nào chưa đạt.
