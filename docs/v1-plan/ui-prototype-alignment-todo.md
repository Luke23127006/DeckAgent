# UI/UX — Checklist đối chiếu prototype V1

Cập nhật: 22-10-2026. Nhóm 1–3 đã triển khai và kiểm tra tự động; manual acceptance còn `NOT_VERIFIED`. Nhóm 4–5 chưa triển khai. `[x]` bên dưới ghi nhận implementation có evidence, không thay cho nghiệm thu manual hoặc Integration Gate.

Tham chiếu: [UX Prototype](../design/UX-design/DeckAgent%20V1%20UX%20Prototype.html). [README thiết kế](../design/UX-design/README.md) xác định prototype là mô phỏng; Product Spec vẫn quyết định hành vi. Checklist này theo dõi các chỉnh sửa đã đề xuất, không tự mở rộng scope implementation plan hoặc thay trạng thái Integration Gates trong [PROGRESS.md](PROGRESS.md).

## 1. Composer, header và chat mới — ưu tiên cao

- [x] **Gom model selector vào composer:** nằm dưới textarea, cùng hàng controls; giữ selection/request capture hiện có, không đổi Host contract.
- [x] **Thu gọn hành động composer:** Send `↑` chuyển thành Stop `■` ở cùng vị trí, có accessible label/tooltip; Create presentation giữ dưới dạng nút phụ. Chrome kiểm tra Create presentation → outline → confirm và Stop.
- [x] **Giảm chiều cao composer:** textarea tự giãn từ 58 đến 150px; vẫn soạn draft khi chạy. Chrome kiểm tra textarea gọn và composer trong viewport 900×600.
- [x] **Header theo chat và trạng thái:** lấy yêu cầu user đầu tiên trong history đã lưu, thu gọn tối đa 64 ký tự, fallback `New chat`; thêm trạng thái ngắn. Đây là tên dẫn xuất từ dữ liệu thật, không phải title do model tạo; không thêm schema/metadata. Chrome kiểm tra gửi/reload/History đúng title.
- [x] **Dọn hành động phụ ở header:** sample deck nằm trong Developer tools thu gọn ở navigation; Open deck chỉ hiện khi chat có confirmed deck; reconnect nằm trong menu `⋯`. Đường truy cập sample/reconnect và fullscreen vẫn được browser smoke kiểm tra.
- [x] **Welcome state:** xuất hiện khi chat trống, ẩn khi gửi hoặc có history; Chrome kiểm tra chat mới, gửi request và quay lại History/draft.

Files: client `boot.ts`, `apps/local-web/src/ui-assets.ts` và composition CSS trong `apps/local-web/src/index.ts`; cập nhật `tests/browser-smoke.test.mjs`. Build/lint PASS; Chrome smoke **3/3 PASS, 0 skipped**, thêm rerun focused browser **1/1 PASS** sau khi chờ repaint để chụp screenshot. Đã xem ảnh fixture chat/outline trong `.local-only/ui-group-1-*.png`; không gọi model thật. Chưa commit/push.

### Manual check nhóm 1

- [ ] Restart Host rồi reload; chat mới có welcome, model selector ở dưới textarea, composer gọn và không có model field riêng phía trên conversation.
- [ ] Chọn model, gõ nhiều dòng: textarea tăng chiều cao có giới hạn; Send vẫn nhìn thấy khi thu nhỏ cửa sổ, khi mở/kéo Presentation và khi history dài.
- [ ] Gửi request: welcome ẩn, header lấy nội dung yêu cầu đầu tiên, trạng thái Working; Send đổi thành Stop. Vẫn gõ được draft kế tiếp; nhấn Stop xong Send trở lại.
- [ ] Đổi model khi request đang chạy: request cũ giữ model đã capture; lần gửi sau mới dùng model vừa chọn. Không gửi request vì chỉ chọn model.
- [ ] Create presentation vẫn tạo outline để review/confirm; sau confirm có thể đóng và mở lại deck từ header.
- [ ] Mở `⋯` → Reconnect / read history; mở Developer tools → Open sample deck. Không có request mới từ các thao tác viewing này.
- [ ] New chat rồi History/reload: header không lẫn tên chat, đúng model/conversation, draft trong cùng trang giữ nguyên; không xuất hiện lại welcome trên chat có history.
- [ ] Tab tới model, Create presentation, Send/Stop và menu: focus rõ; tên nút và tooltip dễ hiểu. Ghi lỗi/expected/actual trước khi đánh dấu manual PASS.

## 2. Presentation — ưu tiên cao

- [x] **Canvas là vùng chính:** danh sách đã chuyển xuống dải ngang bên dưới; Chrome kiểm tra deck 60 slides, strip cao tối đa 100px và canvas vẫn hiện phía trên.
- [x] **Header có tiến độ:** số published/tổng theo Deck snapshot; Chrome kiểm tra 0/3 → 1/3 → 2/3. Không dùng count để đánh dấu request completed.
- [x] **Pending placeholder:** khung 16:9 giải thích slide chưa publish; khi chọn pending, HTML của slide trước bị ẩn. Tách thông báo loading/error khi đọc published revision.
- [x] **Điều hướng dưới canvas:** Previous/Next, caption, Fullscreen và dải chọn có selected/pending/revision states. Giữ hành vi quay vòng ở đầu/cuối và cho chọn pending như implementation trước; không tự áp dụng việc disable pending/endpoints của prototype. Giữ button DOM ổn định để publication không làm mất focus.
- [x] **Hướng dẫn viewing:** footer hướng dẫn gửi request trong chat để sửa, cùng trạng thái kết nối; không có direct-edit controls.

Files: client `deck-canvas.ts`, CSS trong `ui-assets.ts`, composition CSS và browser smoke. Không đổi Deck Model/Host contracts, sandbox/CSP, source safety hoặc publication semantics. Build/lint PASS; Chrome smoke **3/3 PASS, 0 skipped**, gồm progress/placeholder, 60 slides, focus/selection, divider/keyboard, fullscreen, History, reload/Host restart và mobile. Đã xem screenshot fixture `.local-only/ui-group-2-presentation.png`. Sample deck không chuyển sang layout mới vì không có authoritative Deck snapshot/progress.

### Manual check nhóm 2

- [ ] Restart Host và reload, mở chat có deck: header có số published/tổng; canvas ở trên, nút điều hướng và dải chọn ở dưới, footer có hướng dẫn viewing.
- [ ] Tạo deck mới và confirm: thấy placeholder khi chưa có slide, count tăng theo từng publication. Không hiển thị draft HTML chưa publish; count không tự hứa công việc vẫn chạy sau stop/lỗi.
- [ ] Chọn một slide pending: thấy giải thích thay cho HTML cũ; khi slide đó publish thì nội dung hiện ra. Đang xem slide khác thì selection không tự nhảy.
- [ ] Previous/Next và dải chọn hoạt động, trạng thái selected/pending rõ; ở đầu/cuối vẫn quay vòng như trước. Tab/focus trên dải chọn không mất khi publication khác xuất hiện.
- [ ] Với nhiều slides hoặc panel hẹp: dải chọn cuộn ngang, canvas không bị danh sách đẩy xuống; tên đầy đủ xem qua tooltip/accessibility label từ text của nút.
- [ ] Kéo divider, fullscreen, reload và mở lại History: giữ nội dung/revision đúng chat; chỉ xem không tạo request hoặc sửa deck. Màn hình hẹp vẫn đọc/điều hướng được.

## 3. Conversation, Activity và kết quả — ưu tiên cao

- [x] **Giảm raw tool output:** ghép bằng tool-call ID và name vào đúng Activity; output là text thu gọn, không còn tool bubbles riêng. Legacy thiếu identity giữ trong mục thu gọn tại vị trí cũ và ghi không xác định được request; không đoán association hoặc xóa history.
- [x] **Trạng thái theo giai đoạn:** Preparing outline/Publishing slide/Reading published slide/Writing workspace draft/Waiting for model dựa trên Activity thực sự running. Mất kết nối không claim live progress. Không thêm timer vì chưa có timestamps đủ tin cậy.
- [x] **Phân biệt kết thúc lượt và đạt kết quả:** dùng `Turn finished`, thêm `review tool errors` khi có lỗi tool; chỉ đếm slide updates từ publish receipts thành công của đúng request, không từ model prose, file JSON hay tổng số slides của deck.
- [x] **Thông báo lỗi dễ hiểu:** dùng copy cố định cho các mã đã biết và fallback an toàn; code nằm trong chi tiết request, raw provider exceptions không được đưa ra UI. Scope error hướng dẫn yêu cầu rõ slide, không xin Host cấp quyền. Instructions cũng ghi không có manual approval flow này; chưa sửa grammar resolve scope.
- [x] **Thông báo stop/recovery gọn:** notice do Host tạo được nhận diện bằng persisted index và đưa vào Activity; nội dung đầy đủ vẫn đọc được sau reload. Summary dựa trên receipts đã lưu, không claim hoàn tất/consistency hoặc tự resume.

Files: client `conversation-view.ts`, `request-feedback.ts`, `boot.ts`, Host/client history projection, management request projection và Local Web finalization/WebState. CSS cho warning/error và output details; tests browser/public API/recovery đã mở rộng.

Contracts bổ sung tương thích: `HistoryMessage` có optional `toolCallId`, `name`, `isError`; `StoredRequest` có optional `noticeIndex` trỏ vào public history. Host tạo/validate dữ liệu và client validate trước dùng. Không expose tool arguments, provider state hoặc thêm database schema/dependency. Request metadata vẫn nằm trong JSON payload WebState hiện có; dữ liệu cũ thiếu fields vẫn đọc được. Recovery cũ không có provenance index giữ nguyên message thay vì tự nhận diện theo câu chữ.

Evidence: test đỏ được chạy trước từng slice tool-output, turn-finished wording và recovery folding; sau sửa build/lint PASS, combined focused run **32/32 PASS, 0 skipped**; final build/lint và focused browser/API/recovery **13/13 PASS, 0 skipped** sau rà soát. Coverage gồm public projection/legacy/invalid optional metadata, association đúng request, mở output không làm việc mới, phase thật, receipts theo request, JSON file giả receipt không được đếm, provider errors không lộ raw body, recovery provenance/reload, Stop/restart và outline regression. Đã xem screenshot fixture `.local-only/ui-group-3-provider-error.png`; chưa chạy manual model thật hoặc hosted CI. Các test đã có trong suites CI hiện hữu.

### Manual check nhóm 3

- [ ] Restart Host, reload và gửi request có gọi tool: conversation chỉ có user/reply chính và Activity gọn, không có Tool result/JSON thành bubble riêng.
- [ ] Mở Activity rồi mở tool detail: đọc được output đúng lần gọi; đóng lại chat gọn. Không xuất hiện request mới chỉ vì xem chi tiết; expansion/focus giữ qua polling.
- [ ] Sửa một slide bằng yêu cầu rõ scope: summary chỉ đếm updates của lượt đó, không đếm tổng deck. Nếu tool attempt lỗi, `Turn finished` vẫn kèm cảnh báo review tool errors; draft không bị tính là publication.
- [ ] Theo dõi lúc chạy: phase phù hợp Activity thật; mất kết nối có thông báo không còn cập nhật live, reconnect không chạy lại yêu cầu.
- [ ] Stop hoặc gặp lỗi khi tạo/sửa slides: summary dễ đọc, mở Saved recovery details thấy phần đã lưu/chưa hoàn tất. Reload/mở History vẫn đọc được thông tin và revisions; không tự tiếp tục.
- [ ] Nếu gặp provider lỗi, xem thông báo dễ hiểu và mã trong chi tiết; không lộ key/raw provider response. Scope bị từ chối không hướng dẫn xin quyền qua một flow không tồn tại.
- [ ] Đối chiếu chat cũ: dữ liệu thiếu identity/provenance có thể dùng fallback thu gọn hoặc giữ recovery message cũ; không mất dữ liệu, không gắn sang request khác.

## 4. History và Models settings — sau các nhóm trên

- [ ] **History dùng tên chat:** hiển thị tên theo nội dung thay cho model + message count; cần chốt nguồn tạo/lưu title và fallback.
- [ ] **History có thông tin phụ:** thời điểm cập nhật và có/chưa có slides từ dữ liệu thật; giữ selected state, empty state và active-request guard.
- [ ] **Settings rõ cấu trúc provider/model:** đối chiếu bố cục danh sách provider, phần chỉnh cấu hình và thao tác model với prototype; giữ các validation và security behavior hiện có.
- [ ] **Model selector có đường tới Settings:** giúp người dùng thêm/đổi cấu hình từ vị trí chọn model; không tự đổi selected model hoặc gửi request.

Điểm sửa dự kiến: client `settings-panel.ts`, `management-client.ts`, `boot.ts`; History có thể cần thay đổi contracts/metadata. Default model IDs và Restore defaults chưa chốt không được tự triển khai từ dữ liệu mẫu prototype.

## 5. Hoàn thiện trình bày và kiểm tra

- [ ] **Thống nhất copy tiếng Việt:** labels, empty/loading/error states và hướng dẫn; giữ nguyên model IDs, tool IDs và error codes khi cần tra cứu.
- [ ] **Thống nhất style:** spacing, typography, border, radius và màu theo prototype; không cần tải font ngoài chỉ để khớp hình.
- [ ] **Responsive và keyboard:** kiểm tra chat + deck ở màn hình rộng/hẹp, focus order, nhãn controls, divider, scroll và fullscreen.
- [ ] **Regression theo nhóm đã sửa:** kiểm tra bằng focused checks/Chrome smoke hiện có; gồm gửi/dừng, đổi model, outline confirm, progressive slides, giữ selection, History/reload và Settings.
- [ ] **Đối chiếu trực quan:** so screenshot app với prototype ở cùng viewport cho chat mới, outline, generation, deck hoàn thành và lỗi/dừng; chỉ dùng states app thực sự hỗ trợ.
- [ ] **Bàn giao:** ghi files thay đổi, checks và giới hạn; cập nhật progress liên quan. Manual acceptance chưa có thì ghi `NOT_VERIFIED`.

## Giữ theo quyết định hiện tại

- Divider kéo giữa chat và Presentation; không khôi phục Deck width slider.
- Activity mặc định thu gọn trong từng request, giữ expansion/focus khi cập nhật.
- Outline có expand/collapse detail, confirmed read-only và stale-confirmation guards.
- Host sở hữu scope, revisions và publication; UI không tự cấp quyền hoặc giả lập thành công.

## Chưa tự đưa vào đợt chỉnh UI

Attachments, full clarification lifecycle, tạo ảnh, thêm/xóa/reorder slides và các behavior chưa được triển khai không trở thành việc đã duyệt chỉ vì prototype có controls mô phỏng. Nếu một mục checklist cần behavior mới hoặc quyết định chưa chốt, ghi dependency/blocker trước khi triển khai phần đó.
