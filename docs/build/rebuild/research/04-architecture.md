# DeckAgent — Định hướng Architecture

**Trạng thái:** Đã chọn hướng kiến trúc  
**Baseline:** `clean-main` @ `a0d204a613d0decab2d627a9d5868d9c9e162b9e`

**Đầu vào:** `BASELINE.md` → `RUNTIME-RESEARCH.md` → `CODE-INVENTORY.md`

## 1. Định hướng sản phẩm và Runtime

DeckAgent là ứng dụng **open-source, local-first**. Người dùng clone repository, cài dependencies và chạy trên máy cá nhân. Team không vận hành hosted backend chung. **Local Web UI** hiện tại vẫn được giữ: local server chỉ phục vụ UI ngay trên máy người dùng, không phải dịch vụ web được host trên Internet.

`clean-main/docs/spec/` là **source of truth** cho product behaviors cần xây dựng. Thiết kế và tương tác UI trong `clean-main` là mốc để giữ lại. Các mục thuộc `docs/spec/05-backlog/` không tự động trở thành phạm vi V1.

**Runtime đã chọn: OpenCode CLI với `opencode run` .** DeckAgent khởi chạy OpenCode như một local subprocess và nhận kết quả/events. OpenCode chịu trách nhiệm Agent Loop và các lượt thực thi model/tool. DeckAgent không tự xây lại Agent Loop và không giữ Cordis trong kiến trúc đích.

Branch `feat/v2-opencode` chỉ là **implementation reference**, không phải nền code để bê nguyên sang. OpenDesign ( `nexu-io/open-design` ) là nguồn tham khảo cách tích hợp external agent CLI vào sản phẩm.

## 2. Kiến trúc mục tiêu

```text
Máy người dùng (clone → install → run)
  |
  v
DeckAgent Local Web UI
  |  Chat, chọn model, review outline, preview deck, feedback
  v
DeckAgent Local Application / Host
  |-- Product workflow, confirmation, permissions, Stop
  |-- Chat/request state; provider settings
  |-- Outline/deck state, revisions, local persistence
  |
  +--> OpenCode CLI Adapter
  |       |-- Khởi chạy/dừng `opencode run`
  |       |-- Gửi input, đọc events và errors
  |       |-- Liên kết DeckAgent request với OpenCode execution/session
  |       +--> OpenCode CLI (Agent Loop + model/tool turns)
  |
  +--> DeckAgent Tools
          |-- File access và product operations được cấp quyền
          +-- Outline/slide actions có workflow và revision checks

Local storage: dữ liệu sản phẩm của DeckAgent và runtime-native data
được quản lý theo phạm vi và vòng đời riêng.
```

Local HTTP server là một phần của ứng dụng chạy trên máy người dùng. Nó không thay đổi mô hình phân phối local-first.

## 3. Ranh giới trách nhiệm

| Thành phần | Trách nhiệm |
|---|---|
| **OpenCode CLI** | Agent Loop, model execution và native tool orchestration. |
| **DeckAgent Host** | Product workflow, approvals, permissions, tiếp nhận request, Stop và xử lý lỗi. |
| **DeckAgent domain/services** | Outline, deck, slide revisions và kiểm tra các thay đổi hợp lệ. |
| **DeckAgent storage** | Chat identity, product state, settings và presentation data được lưu trên máy. |
| **DeckAgent UI** | Giữ thiết kế/tương tác hiện tại, kết nối với contracts của implementation mới. |
| **OpenCode CLI Adapter** | Quản lý subprocess, chuyển events/results và kết nối runtime với DeckAgent. |

Prompt hoặc quyết định của OpenCode không thay thế business rules của DeckAgent. Mọi tool có tác động đến dữ liệu phải tuân theo permissions, confirmation state và revision checks do ứng dụng kiểm soát.

## 4. Giữ UI và xử lý Legacy Code

| Nguồn | Hướng xử lý |
|---|---|
| `docs/spec/` | **Keep:** nguồn chuẩn cho product behaviors; tách current scope và backlog. |
| `apps/local-web/DESIGN.md` , UI styles, `packages/client/runtime/` | **Preserve UI:** giữ thiết kế; **Adapt** phần implementation phụ thuộc Host/API cũ. |
| Deck, Session, Host và product tools | **Reuse/Adapt:** giữ logic sản phẩm còn giá trị, thay những contracts phụ thuộc Cordis/custom runtime. |
| `apps/local-web/src/index.ts` , `web-request.ts` | **Rebuild:** kết nối Host với OpenCode CLI theo kiến trúc mới. |
| Custom Agent Loop, Cordis integration, runtime-only packages | **Remove:** loại khỏi implementation mới sau khi đã xử lý shared dependencies. |
| `feat/v2-opencode` | **Reference:** tham khảo CLI execution, event mapping, tool integration và tests; không giữ kiến trúc hybrid. |

Commit `clean-main` là mốc khôi phục UI. Giữ UI không có nghĩa phải copy toàn bộ frontend code. Cũng không xóa shared contracts hay product logic chỉ vì hiện tại chúng nằm trong package runtime cũ.

## 5. Contracts cần đáp ứng

Implementation với OpenCode CLI phải làm rõ và kiểm chứng:

1. Cách start/stop `opencode run` và phản hồi khi process/runtime gặp lỗi.
2. Cách liên kết DeckAgent Chat/request với OpenCode execution/session và khôi phục application state sau restart.
3. Cách chuyển structured events thành Chat messages, activity log, tool outcomes và request status.
4. Cách truyền provider/model settings mà không lộ credentials trên UI hoặc logs.
5. Cách giới hạn tools theo permissions và kiểm tra confirmation/revision trước khi ghi dữ liệu.
6. Cách giữ UI interactions từ `clean-main` trong khi đáp ứng `docs/spec/` mới.

Đây là **integration contracts cần triển khai và test**, không phải danh sách phương án Runtime khác. Hướng đã chọn vẫn là CLI `opencode run` .

## 6. Đích đến của Build

Xây DeckAgent theo `docs/spec/` mới và tích hợp OpenCode CLI đã chọn. Giữ UI baseline trong suốt quá trình rebuild. Kiểm tra product behaviors và runtime integration trong quá trình implementation. Loại bỏ Cordis/custom Agent Loop cùng dependencies không còn dùng; giữ Git baseline để tham chiếu.

**Trạng thái cuối:** một Agent Runtime duy nhất là **OpenCode CLI**; DeckAgent sở hữu product logic và Local Web UI. Không có team-hosted backend, không duy trì song song custom Agent Loop trong production.

## References

* [`clean-main` baseline](https://github.com/Luke23127006/DeckAgent/tree/a0d204a613d0decab2d627a9d5868d9c9e162b9e)
* [`feat/v2-opencode` reference](https://github.com/Luke23127006/DeckAgent/tree/feat/v2-opencode)
* [OpenDesign — OpenCode CLI adapter](https://github.com/nexu-io/open-design/blob/main/apps/daemon/src/runtimes/defs/opencode.ts)
