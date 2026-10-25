# DeckAgent V1 UX Foundation

Thư mục này chứa bản HTML nền và các tài liệu của UX-02. Product Spec trong [`docs/spec`](../../spec/) vẫn là nguồn quyết định hành vi V1.

| File | Vai trò |
|---|---|
| [DeckAgent V1 UX Foundation.html](DeckAgent%20V1%20UX%20Foundation.html) | Bản HTML low-fidelity chứa wireframes và các frame UI States. |
| [DeckAgent V1 UX Prototype.html](DeckAgent%20V1%20UX%20Prototype.html) | Prototype tương tác để thử các trạng thái và chuyển trạng thái. Đây là mô phỏng UI, không chạy Agent Runtime. |
| [DeckAgent V1 Interactive Prototype.html](DeckAgent%20V1%20Interactive%20Prototype.html) | Mẫu tương tác được owner chọn để chuyển UI Local Web ngày 23-10-2026. Có selftest bằng `?selftest&speed=fast`; các dữ liệu/timer vẫn là mô phỏng. Đối chiếu implementation và phần chưa hỗ trợ trong [plan và handoff UI](../../versions/v1/interactive-ui-migration-plan.md). |
| [ux-02-v1-state-inventory.md](ux-02-v1-state-inventory.md) | Điều kiện, thông tin, hành động và sơ đồ cho 35 state R/C/D/M/H. |
| [ux-02-v1-transition-matrix.xlsx](ux-02-v1-transition-matrix.xlsx) | Danh sách case theo sự kiện → trạng thái trước/sau cho Frontend và UI Testing. |
| [ux-02-v1-figma-annotations-and-copy.md](ux-02-v1-figma-annotations-and-copy.md) | Annotation và ví dụ nội dung cho các state. |

Chạy kiểm tra tương tác của prototype từ gốc repository bằng `node tests/ux-02-prototype.test.cjs`.

Lệnh trên kiểm tra **UX Prototype**, không phải file **Interactive Prototype** hoặc app thật. Kiểm tra app bằng `pnpm.cmd test:browser-smoke`; xem giới hạn fixture/manual trong handoff UI.
