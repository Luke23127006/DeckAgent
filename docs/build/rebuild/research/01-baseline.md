# DeckAgent — Rebuild Baseline

**Trạng thái:** Baseline tham chiếu đã xác định; chưa tạo Git tag, chưa chạy UI smoke test.

## 1. Baseline cố định

* Repository: `Luke23127006/DeckAgent`
* Branch nguồn: `clean-main`
* Commit được đọc: `a0d204a613d0decab2d627a9d5868d9c9e162b9e`
* Tham chiếu cố định: https://github.com/Luke23127006/DeckAgent/tree/a0d204a613d0decab2d627a9d5868d9c9e162b9e

Dùng **commit SHA**, không dùng vị trí HEAD có thể thay đổi của branch, khi nghiên cứu hoặc lấy lại code/UI. Không chỉnh sửa source cũ trong bước này.

## 2. Product baseline — Xây cái gì?

**Nguồn mục tiêu:** `docs/spec/` tại commit trên. Kiểm kê:

| Nhóm | Số tài liệu yêu cầu/nghiệp vụ | Vai trò |
|---|---:|---|
| `02-use-cases/` | 9 UC | Luồng người dùng và kết quả mong đợi |
| `03-requirements/fr/` | 96 FR | Hành vi chức năng |
| `03-requirements/nfr/` | 11 NFR | Ràng buộc phi chức năng |
| `04-business-rules/` | 16 BR | Quy tắc sản phẩm |
| `05-backlog/` | 11 tài liệu | Không tự động coi là phạm vi V1 |

`01-product-vision/` có `_CRITERIA.md` và `_TEMPLATE.md` , nhưng chưa có `VISION.md` trong tree đã đọc. `apps/local-web/PRODUCT.md` mô tả V1: tạo, xem và cải thiện presentation bằng hội thoại với model do người dùng chọn. Tài liệu đó là thông tin bổ trợ; khi có xung đột, cần ghi nhận và xử lý theo spec mới, không dùng code/UI cũ để tự đổi spec.

**Kết quả:** Một commit cụ thể và các nhóm yêu cầu rõ ràng, làm đầu vào cho mapping runtime capabilities và phân ranh giới ứng dụng.

## 3. UI baseline — Giữ cái gì?

**Nguồn thiết kế:**
* `apps/local-web/DESIGN.md` — design system, layout, theme, motion, responsive behavior và components.
* `apps/local-web/PRODUCT.md` — mục đích và giới hạn V1 của giao diện.
* `apps/local-web/src/ui-assets.ts` — style và assets giao diện.
* `packages/client/runtime/src/` — frontend đang triển khai.

**Các nhóm UI cần bảo tồn làm tham chiếu:**

| Nhóm UI | Điểm đọc code chính |
|---|---|
| Khung app, sidebar, chat, composer | `boot.ts` , `layout.ts` , `conversation-view.ts` |
| Model selection và settings | `model-picker.ts` , `settings-panel.ts` |
| Outline và clarification | `outline-view.ts` , `question-view.ts` , `user-question.ts` |
| Slide viewer, deck canvas và navigation | `deck-canvas.ts` , `deck-tab.ts` , `deck-resizer.ts` |
| Theme, animation và responsive | `theme.ts` , `motion.ts` , `apps/local-web/DESIGN.md` |
| Giao tiếp với Host cũ (chỉ để hiểu contracts) | `host-client.ts` , `management-client.ts` , `outline-client.ts` , `deck-client.ts` |

**Quy tắc:** Bảo tồn trải nghiệm và thiết kế UI, không cam kết giữ nguyên mọi file hay API. Khi UI hiện tại mâu thuẫn với `docs/spec` , spec mới quyết định hành vi; UI cần được điều chỉnh.

**Chưa xác minh:** Chưa chụp ảnh, quay luồng, chạy browser smoke test hay kiểm tra từng màn hình thực tế. Vì vậy baseline UI hiện là **source/design reference**, chưa phải visual regression baseline đã nghiệm thu.

## 4. Legacy baseline — Không mang điều gì sang mặc định?

Code Cordis/custom Agent Loop của `clean-main` là nguồn legacy, **không phải kiến trúc mục tiêu**. Không mặc định copy `packages/agent/runtime` , `apps/agent-runtime` , `apps/cordis-smoke` hoặc `vendor/` sang implementation mới.

Điều này **không** đồng nghĩa phải xóa mọi logic backend: workflow, data storage, tool validations và Deck behavior riêng của DeckAgent cần được phân loại dựa trên spec và OpenCode capabilities trong bước sau.

Branch `feat/v2-opencode` chỉ là tài liệu kỹ thuật/POC để đối chiếu, không phải implementation baseline được merge nguyên trạng.

## 5. Bàn giao sang bước 2 — Runtime Research

**Input đã có:**
1. Commit bất biến để đối chiếu spec và UI.
2. Danh mục nhóm yêu cầu V1 và backlog.
3. Danh sách tài liệu và code UI cần tham chiếu.
4. Ranh giới: không kế thừa Cordis/custom Agent Loop mặc định.

**Output bước 2 phải tạo:** Bảng mapping từng capability cần thiết của DeckAgent với `OpenCode provides / DeckAgent builds / Needs validation` , có dẫn chứng code/docs. Dùng OpenDesign để kiểm tra cách tích hợp trong sản phẩm thật; không giả định OpenDesign là khuôn kiến trúc bắt buộc.

**Việc còn thiếu để khóa baseline hoàn toàn:** Tạo tag/snapshot Git cho SHA trên (nếu muốn), chụp các trạng thái UI quan trọng, chạy smoke để xác nhận UI trên một môi trường ghi nhận cụ thể và xử lý thiếu `VISION.md` nếu spec thực sự yêu cầu tài liệu đó. Đây không phải điều kiện để bắt đầu nghiên cứu runtime, nhưng là điều kiện trước khi tuyên bố visual baseline đã được nghiệm thu.
