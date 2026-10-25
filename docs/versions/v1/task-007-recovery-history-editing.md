# TASK-007 — Dừng, mở lại chat và sửa slide theo phạm vi

Cập nhật: 22-10-2026. Candidate trên `feature/task-007-recovery-history-editing`, tạo từ dev `6efd4df8887912b9cda8133c2276c0619f08c245`; chưa commit/push/PR. Đây là handoff implementation và checklist nghiệm thu theo [parallel plan](deckagent-parallel-team-implementation-plan.md), không thay đổi scope plan. Trạng thái tổng hợp ở [PROGRESS.md](PROGRESS.md).

## Hành vi đã triển khai

- **A — Stop/recovery:** nút Stop gửi abort cho đúng request. Host giữ Session lock qua execution, disposal và finalization. Giữ publication đã commit; draft chưa publish không xuất hiện. Khi lỗi/dừng, Host ghi số slides thực sự thay đổi và số slides trong scope chưa thay đổi, cùng số planned slides còn pending. Restart không tự replay công việc; request/activity dang dở giữ trạng thái unknown.
- **B — History:** chặn History/New chat khi request hiện tại active. Đọc conversation, activities, requests và outline trước khi chuyển current chat; đọc lỗi giữ chat/draft hiện tại. Deck Model hiện có khôi phục đúng Session và selection trong cùng phiên trang. Model và conversation lưu bền; unsent text giữ theo chat trong bộ nhớ trang.
- **C — Editing:** sau confirmation, follow-up dùng instructions editing riêng, không đề xuất outline mới. Tool `read_slide` đọc HTML/revision hiện tại từ Deck Service. `publish_slide` kiểm tra Host-owned slide allowlist trước khi đọc draft. Vẫn dùng optimistic revision guard, immutable revisions và idempotent receipts hiện có. Model kết thúc mà chưa publish đủ slides được yêu cầu: Host trả `EDIT_INCOMPLETE`.

## Contracts và file ownership

| Phần | Điểm nối / files |
| --- | --- |
| Stop | `packages/host/api/src/request-controller.ts`, `index.ts`; client `host-client.ts`, `boot.ts` |
| History | `packages/client/runtime/src/boot.ts`, `conversation-view.ts`; tái sử dụng Session/Web/Deck stores |
| Editing scope/instructions | `apps/local-web/src/editing-workflow.ts`; composition `apps/local-web/src/index.ts` |
| Tools | `packages/tools/presentation/src/index.ts`: optional `allowedSlideIds` cho publish; export `registerReadSlide` |
| Verification | `tests/recovery-editing.test.mjs`, browser smoke, killed-Host fixture và Web management tests |

- `POST /api/requests/:requestId/stop`: cùng authentication/origin policy với API hiện tại; trả snapshot hiện có. Gọi lặp hoặc request đã terminal không chạy lại gì; ID không tồn tại trả 404. Snapshot có thể vẫn running trong khi cleanup, chỉ terminal mới xác nhận đã kết thúc.
- Scope được resolve một lần dưới Session admission lock, không nhận quyền từ model. Đợt tạo đầu tiên được cấp planned IDs; follow-up chỉ được cấp target IDs resolve từ request. Thiếu/không rõ scope: không được publish slide nào.
- Resolver chỉ nhận target clause đầu câu, sau động từ như `Sửa`, `Edit`, `Update`, `Publish`; hỗ trợ số, danh sách/khoảng số và tên chính xác trong dấu nháy. Ví dụ `Sửa slide 2 theo màu slide 1` chỉ cấp slide 2; tham chiếu sau target clause không tự cấp quyền ghi.
- Ví dụ hợp lệ: `Sửa slide 2: đổi tiêu đề thành Tổng kết`, `Edit slides 1 and 3: simplify the wording`, `Sửa slide "Details": rút gọn nội dung`, `Edit all slides: use a blue background`, `Tiếp tục` cho các planned slides chưa publish.
- Tên trùng/không khớp, số ngoài deck, số và tên mâu thuẫn, thêm/xóa/chèn hoặc yêu cầu có ngoại lệ/phủ định: không cấp quyền. Grammar bảo thủ có thể từ chối cả yêu cầu hợp lệ; không phải bộ hiểu ngôn ngữ tự nhiên tổng quát.
- Không thêm database/schema/package/dependency mới. API Stop và tool đọc slide là bổ sung tương thích; workflow follow-up đổi từ generate-all sang scoped editing. Step budget tối đa theo scope: đọc/write/publish từng slide, cộng phần kết thúc.

## Verification đã chạy

Windows, Node 22.19.0 local, pnpm 11.28.5:

- `pnpm.cmd build`: PASS.
- `pnpm.cmd lint`: PASS, không warning lint.
- `pnpm.cmd test:recovery-editing`: **13/13 PASS, 0 skipped** sau lần siết resolver cuối cùng; workflow YAML parse và xác nhận step recovery/editing PASS bằng parser đã có trong dependency tree, không cài thêm dependency.
- Bộ kết hợp recovery/editing, Web Session/management, outline workflow, slide pipeline, Host API và Chrome smoke: **29/29 PASS, 0 skipped**. Sau đó thêm test `EDIT_INCOMPLETE` và mở rộng browser History deck/model; chạy lại recovery/editing + browser: **9/9 PASS, 0 skipped**. Tổng cộng 30 test cases khác nhau đã PASS trên candidate.
- Tests gồm model cố publish ngoài scope; Stop giữ lock đến finalization; đọc HTML hiện tại; sửa đúng revision; giữ slides khác; stop/model failure giữa edits; killed Host giữ published slide và pending state, không replay; History không gửi request, đúng model/deck/selection và giữ current chat khi load lỗi; UI Stop thực tế trong Chrome.
- Regression ban đầu mất câu `draft is not ready` đã được sửa; assertion TASK-006 được giữ nguyên. SQLite ExperimentalWarning có sẵn; không ảnh hưởng kết quả.
- CI thêm `pnpm test:recovery-editing` và evidence summary; Chrome coverage dùng browser step hiện có. Hosted CI, manual model thật, PR/merge: `NOT_VERIFIED`.

## Manual acceptance checklist

Chạy với Node được hỗ trợ và data directory riêng. Nếu cần, chạy build trước:

```powershell
pnpm.cmd build
pnpm.cmd start:local-web --data-dir .deckagent/task-007-manual --workspace .deckagent/task-007-manual/workspace
```

1. **Tạo baseline:** trong Settings chọn model dùng được; tạo presentation 3 slides qua proposal → confirm. Chờ hoàn tất; ghi title/revision/nội dung của cả 3 slides. Không dùng fixture `--confirmed-deck` cho nghiệm thu model thật.
2. **Sửa một slide:** gửi `Sửa slide 2: đổi tiêu đề hiển thị thành Kết quả mới, giữ nội dung còn lại`. Không có outline mới; slide 2 tăng revision. Slides 1/3 giữ nguyên revision và nội dung; đang xem slide 1 thì Canvas vẫn giữ selection đó. Danh sách title metadata có thể vẫn là tên trong plan; kiểm tra heading trong HTML và revision.
3. **Scope bảo thủ:** gửi `Edit slide 2 to match the colors of slide 1`. Chỉ slide 2 được đổi. Thử `Edit slide 99` hoặc yêu cầu mâu thuẫn `Edit slide 1 "<tên slide 2>"`: không slide nào được publish.

   **Điều chỉnh Presentation:** kéo ranh giới trái của panel sang trái để mở rộng, sang phải để thu hẹp. Không còn thanh Deck width ở cuối panel. Có thể Tab đến separator rồi dùng phím trái/phải (Shift để đổi nhanh), Home/End cho giới hạn. Width được giữ sau reload; không đổi slide đang chọn hoặc gửi request. Trên màn hình hẹp, panel xếp dưới chat và ẩn divider; fullscreen vẫn dùng như trước. Áp dụng cả sample deck.
4. **Stop giữa edits:** gửi `Edit all slides: đổi nền thành màu xanh nhạt`. Khi một revision mới xuất hiện nhưng còn slides chưa đổi, nhấn Stop. Chờ Stopped; History/New chat bị chặn đến lúc đó. Giữ revisions đã hoàn thành; các slides chưa hoàn thành vẫn hiển thị revision cũ, không HTML dang dở. Nếu model quá nhanh, dùng deck nhiều slides hơn hoặc lặp lại bằng một yêu cầu mới.
5. **History:** gõ draft chưa gửi, mở New chat sau khi request terminal, rồi mở lại chat cũ. Conversation/activities/model/deck đúng chat, draft text trở lại trong cùng trang; không xuất hiện request mới, không revision nào đổi. Reload kiểm tra saved history/deck; không yêu cầu unsent text hoặc selection sống qua reload.
6. **Reload khi chạy:** gửi một edit, reload khi đang chạy. Host vẫn chạy; kết nối lại cùng request, không gửi thêm request. Có thể Stop từ UI sau reconnect.
7. **Restart Host:** khi công việc đang chạy, đóng Host rồi chạy lại cùng command và data directory. Mở chat cũ: giữ slides/revisions đã publish, báo công việc bị gián đoạn hoặc trạng thái chưa xác nhận; không tự gọi model. Gửi `Tiếp tục` nếu deck còn pending slides, hoặc yêu cầu sửa slide cụ thể cho edit chưa hoàn tất. Đây là request mới, không replay request cũ và không confirm lại outline.

Ghi revision candidate, OS/Node/browser, provider/model, Session/request IDs nếu có, từng expected/actual và lỗi. Không ghi key/token. Chỉ đóng Gate 007 sau khi đối chiếu dependency Gate 006 và acceptance trên dev đã tích hợp.

## Giới hạn còn lại

### Manual blocker publish HTML — 22-10-2026

User gặp `write_file` completed nhưng `publish_slide` failed liên tục sau confirmation; cả ba slides pending. Kiểm tra read-only data `.deckagent/task-007-manual`: publication IDs/outline/slide targets hợp lệ, expectedRevision 0, draft tồn tại. Draft chứa `<meta charset>`, bị HTML policy cấm. Replay cùng HTML: bản gốc `DECK_UNSAFE_HTML`, bỏ riêng meta thì PASS. Không sửa Session, Deck hoặc draft thật trong quá trình kiểm tra.

Đã bổ sung instructions/tool description cấm meta kể cả charset/viewport và yêu cầu ghi draft mới sau rejection. Runtime bổ sung public `ToolFailure` chỉ nhận tập mã cố định, Registry luôn dùng thông báo tự định nghĩa, không dùng raw exception message. Publish map các lỗi HTML/scope/revision/identity đã biết sang diagnostics này; unknown errors và RuntimeError giả mạo vẫn thành `TOOL_FAILED`. Kết quả lỗi vẫn `isError=true` nên activity không bị ghi nhầm completed. Không nới HTML policy hay thay schema/tool arguments; consumer không biết codes mới vẫn có thể dựa vào `isError` như trước.

Regression test trước sửa FAIL vì chỉ nhận `TOOL_FAILED`; sau sửa nhận `SLIDE_UNSAFE_HTML` cùng hướng dẫn bỏ meta, tạo corrected draft ở path mới và publish thành công, file cũ giữ nguyên. Build/lint và **50/50 tests PASS**, gồm publish regression, runtime/error-redaction, outline workflow và recovery/editing. Không gọi model thật; không khẳng định các lỗi `PROVIDER_HTTP` ở lượt trước đã được sửa.

Để retest: Stop request đang chạy, đóng Host, khởi động lại bằng command ở checklist để nạp build mới. Mở đúng chat đã có confirmed outline và gửi **`Tiếp tục`**. Không confirm lại hoặc tự xóa data/drafts. Expected: tạo drafts ở request paths mới, publish slides từ pending thành revision 1; nếu HTML sai, model nhận diagnostics cụ thể để sửa. Ghi lại kết quả manual trước khi đóng Gate.

### Phạm vi chưa hoàn tất

- Chưa có full clarification lifecycle giữ request mở chờ câu trả lời như các alternatives của UC-002/003. Resolver không hiểu yêu cầu thì không cấp quyền publish; phản hồi model có thể yêu cầu người dùng làm rõ trong lượt sau. Không claim đã hoàn thành toàn bộ UC-002.
- Chưa thêm/xóa/chèn/reorder slides, undo hay tự retry/replay. Không có lưu selection/unsent text qua reload/Host restart. Không mở rộng attachments, tạo ảnh hoặc resources ngoài policy HTML hiện tại.
- Kiểm thử tự động dùng model fixtures; chất lượng hiểu yêu cầu và HTML của model thật cần manual acceptance. Gate 007 vẫn `NOT_VERIFIED`.
