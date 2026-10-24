# Kế hoạch chuyển UI theo Interactive Prototype V1

Cập nhật: 23-10-2026. Trạng thái: **đã triển khai UI candidate P1–P4 và một phần P5; dừng tại mốc review của owner**. Mục 1–7 giữ snapshot khảo sát và kế hoạch; kết quả implementation, giới hạn và cách check ở mục 8.

## 1. Mục tiêu và baseline

Chuyển giao diện Local Web sang bố cục, màu sắc, nội dung và cách tương tác của [DeckAgent V1 Interactive Prototype.html](../design/UX-design/DeckAgent%20V1%20Interactive%20Prototype.html). Đối chiếu cả hành vi; không coi mọi tình huống mô phỏng là tính năng runtime đã có.

- Checkout khảo sát: `E:\Final_Project\Test\DeckAgent`, branch `main`, HEAD `789b5927531d7b11a5f635c40c314b90e7334a7c`; working tree sạch lúc bắt đầu.
- [Checklist căn chỉnh trước](ui-prototype-alignment-todo.md) tham chiếu **DeckAgent V1 UX Prototype.html**, khác file Interactive được chỉ định lần này. Nhóm 1–4 đã làm của checklist đó không chứng minh đã khớp mục tiêu mới.
- Đã đọc HTML/CSS/JavaScript và chạy selftest của **đúng file Interactive**: **165 PASS / 0 FAIL**. Đây là test mô phỏng, không chứng minh runtime hỗ trợ các luồng ấy.
- Đã chạy app qua fixture trên data/workspace tạm, chụp và xem UI ở **1600×1000**: welcome, outline, deck, Settings và lỗi provider. Không dùng chat/key của người dùng, không gọi model thật.
- [README thiết kế](../design/UX-design/README.md) xác định Product Spec quyết định hành vi. README hiện chưa liệt kê file Interactive; kế hoạch này ghi rõ file mục tiêu thay vì suy ra từ tên “prototype”.

**Kết luận:** nền tảng outline/confirmation/publication/recovery hiện tại có thể tái sử dụng. Khác biệt hình thức còn lớn; một số khác biệt tương tác sửa được trong client, còn attachments, clarification và thay cấu trúc deck cần công việc chức năng và contract riêng. Không thể đạt đầy đủ mọi hành vi của prototype chỉ bằng CSS.

## 2. Bảng đối chiếu giao diện

“Khớp một phần” nghĩa là đã có cấu trúc tương ứng, còn khác vị trí, hình thức hoặc tương tác. Cột chuyển đổi là đề xuất của đợt này.

| Khu vực | Interactive Prototype | UI hiện tại | Đánh giá và chuyển đổi |
| --- | --- | --- | --- |
| Màu và chữ | Trắng/xám, chữ đậm vừa, Sans; wordmark/model dùng Mono; viền rõ, ít bóng | Tông xanh lá, nền ngà, nhiều chữ xanh; welcome Georgia 30px | **Khác.** Dùng bảng màu của prototype cho shell, bỏ serif và bóng không có trong mẫu; chuẩn hóa cỡ chữ, border/radius. Không áp `filter:grayscale` lên iframe slide thật vì sẽ làm sai màu nội dung deck |
| Khung tổng thể | Rail 236px, chat phủ phần còn lại; header 52px; deck mặc định 400px, kéo divider | Rail 230px/175px theo breakpoint; chat `max-width:1000px`, căn giữa; header ít nhất 64px; deck khởi tạo 520px | **Khác.** Bỏ khoảng trống hai bên chat khi không có deck, khớp kích thước desktop, divider nhìn thấy; lưu lựa chọn kéo panel như hiện tại |
| Sidebar | `+ Chat mới`, `Gần đây` thu gọn được; mỗi chat một dòng ellipsis, selected xám | Nút New chat có khung; HISTORY; mỗi item có title, timestamp, trạng thái slide và có thể nhiều dòng | **Khác.** Đổi thành danh sách một dòng và có collapse; metadata phụ chuyển sang tooltip/chi tiết, không xóa dữ liệu; giữ selected/active guard |
| Welcome | Card nét đứt nhỏ giữa chat, “Hãy mô tả deck bạn muốn” và giải thích outline trước | Heading serif lớn, tiếng Anh, không có card | **Khác.** Khớp card/copy/spacing. Câu mời đính kèm chỉ xuất hiện khi intake thật đã có |
| Header chat | Tên chat đơn giản trên thanh trắng | Title + trạng thái nhỏ, Open deck và menu ⋯ | **Khớp một phần.** Khớp chiều cao/type/spacing; các hành động phục hồi/xem deck giữ ở menu phụ khi cần |
| User/assistant messages | Bubble xám gọn; user bên phải, assistant bên trái; label theo nội dung | Có đúng hai phía nhưng card rộng, padding lớn, role label You/DeckAgent | **Khớp một phần.** Thu gọn bubble, line height, khoảng cách; giữ text escaping và DOM ổn định |
| Composer | Textarea trên; `+` bên trái dưới, model + Send/Stop bên phải dưới | Model select + Create presentation bên trái, Send/Stop bên phải; không có attachment control | **Khác.** Chuyển model sang phải, khớp độ cao/radius; chỉ một Send chính. Chức năng attachment được theo dõi riêng, không dựng nút giả hoạt động |
| Menu model | Popover phía trên composer, provider tabs cuộn ngang, + provider, bánh răng, selected mark | Native select với optgroup và Add or manage models… | **Khác.** Xây menu client dùng dữ liệu Settings thật, giữ đường tới Settings; Escape/click outside/focus return và điều hướng bàn phím |
| Mức suy luận | Menu Thấp/Vừa/Cao; source ghi rõ tên mức là placeholder | Không có contract điều khiển effort từ UI | **Chưa có.** Không giả rằng đổi mức đã ảnh hưởng request; chỉ triển khai khi có mapping/capability được chốt |
| Outline | Bubble tóm tắt; card chọn Xác nhận/Hủy ngay trên composer | Overview/details và Confirm/Cancel/Revise nằm trong message card | **Khớp nghĩa, khác bố cục.** Đưa suggested actions xuống dock; giữ details có thể mở/đóng và confirmed read-only theo yêu cầu đã có. Dock nhắm đúng ID/version hiện tại |
| Deck | Canvas ngay dưới header, navigation ngay dưới canvas, thumbnail dạng hình chữ nhật nhỏ có hai thanh minh họa | Stage giãn và căn giữa theo chiều dọc; navigation/strip sát đáy; strip là nút text 136px | **Khác.** Đưa stage lên trên, navigation/strip theo ngay sau; thumbnail sơ đồ nhỏ giống mẫu, số và trạng thái bên dưới. Không cần API render thumbnail thật để khớp mẫu này |
| Settings | Trang trong workspace, rail vẫn hiện, header quay lại, ba nhóm bước; footer Hủy/Lưu | Modal 760px, backdrop làm mờ; provider cards + form dài | **Khác lớn.** Đổi thành trang với footer cố định và model editor/catalog gọn. Giữ services/validation/key storage hiện tại |
| Thêm provider nhanh | Wizard từ dấu + trong menu model, có bước chọn provider/kết nối/model | Tất cả trong modal Settings | **Chưa có presentation flow tương ứng.** Dùng chung form/state với trang Settings, gọi API đang có; không nhân đôi quy tắc validation |
| Activity và lỗi/dừng | Prototype ưu tiên status/notice và card câu hỏi; có bảng mô phỏng riêng | Activity thật thu gọn theo request; lỗi/recovery nằm trong details | **Khác có chủ đích ở dữ liệu.** Giữ Activity thật nhưng đổi style/copy; lỗi/dừng có notice ngắn nhìn thấy ngay, detail vẫn mở được. Bảng mô phỏng không đưa vào app |
| Màn hình hẹp | Prototype đặt `min-width:860px` | App có responsive dưới 720px, chat/deck xếp dọc | **Khác.** Desktop là chuẩn so ảnh; giữ khả năng dùng màn hình hẹp, ghi đây là adaptation thay vì sao chép overflow 860px |

Nguồn implementation chính: [UI styles](../../apps/local-web/src/ui-assets.ts), [UI composition](../../packages/client/runtime/src/boot.ts), [Outline view](../../packages/client/runtime/src/outline-view.ts), [Deck canvas](../../packages/client/runtime/src/deck-canvas.ts), [Settings](../../packages/client/runtime/src/settings-panel.ts), [Outline styles](../../apps/local-web/src/outline-style.ts).

## 3. Expected behavior: giống và chưa giống

Các kết luận “đã có” dưới đây dựa trên source và các fixture checks nêu ở mục 7; không đồng nghĩa đã nghiệm thu model thật. Các trường hợp chưa có được giới hạn trong Local Web/Host/contracts đã khảo sát.

| Hành vi | Prototype mong đợi | Hiện tại và bằng chứng | Hướng xử lý |
| --- | --- | --- | --- |
| Gửi yêu cầu tạo deck | Gửi từ một composer rồi đề xuất outline; chưa tạo slide trước confirm | **Đã có nền tảng.** Send thường cũng có tool propose_outline; Create presentation là preset bổ sung. Có test Send → schema-valid proposal | Dùng một Send chính; bỏ nút phụ khỏi bố cục chính sau regression xác nhận presentation vẫn đi đúng flow, không ép mọi chat thường thành tạo deck |
| Xác nhận outline | Request đề xuất kết thúc; confirm là request mới rồi tạo slides | **Giống.** Host nhận structured action và tạo deck; browser/workflow tests PASS | Giữ Host ownership, chỉ đổi nơi hiển thị actions |
| Đề xuất cũ/đã hủy | Đọc lại được, không dùng stale option để confirm | **Giống nền tảng.** Current/version guard; confirmed/cancelled/superseded có phân biệt | Dock chỉ hiện actions của proposal current; stale click giải thích rõ; không cấp lại action cho lịch sử |
| Gõ xác nhận | Prototype nhận prefix `ok`, `đồng ý`, `xác nhận`… | **Khác và prototype có rủi ro.** Runtime dùng allowlist toàn câu; `OK nhưng sửa…` không được tự confirm | Giữ nguyên tắc an toàn runtime. Có thể bổ sung alias tiếng Việt toàn câu như “xác nhận outline”, “hủy outline” bằng test; không sao chép regex prefix |
| Outline rỗng | Cho xem trạng thái nhưng không confirm | **Khác mô hình dữ liệu.** Proposal runtime đòi ít nhất một slide; không có current outline rỗng hợp lệ | Hiển thị không tạo được đề xuất/đề nghị bổ sung nội dung; nếu cần lưu draft rỗng phải đổi contract riêng |
| Details outline | Mẫu Interactive chủ yếu tóm tắt, confirmed gọn | **Hiện tại nhiều chi tiết hơn.** Có expand/collapse, giữ focus qua polling | Giữ chức năng đọc chi tiết, mặc định gọn để không chiếm toàn chat |
| Header sau confirm | Không tiếp tục báo chờ xác nhận | **Sai hiện tại, đã thấy trên ảnh deck 2/2.** `controls()` chỉ kiểm tra `currentId`; snapshot vẫn giữ currentId khi proposal confirmed | Tính trạng thái từ proposal có `status=current` và request thật; confirmed/completed không báo chờ. Thêm regression confirm/cancel/reload |
| Enter/Shift+Enter | Enter gửi, Shift+Enter xuống dòng; không gửi khi đang composition IME | **Khác.** Textarea hiện chỉ có input listener; Enter xuống dòng | Bổ sung key handler và IME guard; chạy cùng đường Send, không tạo request thứ hai khi busy |
| Rỗng/quá dài/thiếu model | Không gửi nội dung không hợp lệ; giữ draft, giải thích đúng tình huống | **Khớp một phần.** `required` chặn chuỗi rỗng nhưng nút chưa phản ánh trim; whitespace/độ dài bị Host reject; không selectable thì nút disabled và có setup text | Đồng bộ client validation với Host. Hiện Host giới hạn 16000 code units; đây là giới hạn implementation, BR-002 chưa chốt giá trị sản phẩm. Không lấy simulator limit làm spec |
| Model theo từng chat | Chọn không chạy Agent; đổi khi busy chỉ áp dụng lượt sau | **Giống.** Capture provider/model/key và persisted selection; management/browser checks PASS | Giữ logic, thêm banner trong popover khi đang có request |
| Model cho chat mới | Kế thừa lựa chọn gần nhất còn selectable; nếu bị xóa thì lùi lựa chọn trước | **Chưa giống.** `newChat()` gọi create không selection; probe chọn model rồi POST chat mới trả `selection=null`, `selectable=false`. UC-012 S2 cũng yêu cầu kế thừa | Bổ sung recency có thứ tự, kiểm tra lại tính selectable ở Host. Không suy ra recency từ thời gian gửi message |
| Bấm Chat mới khi đã ở chat trống | Không sinh thêm chat trống | **Khác.** Client hiện luôn create; ảnh fixture có nhiều New chat | Chặn tạo lặp ở client; history chỉ hiện chat đang mở và các chat có nội dung phù hợp; không tự xóa records cũ |
| Đổi chat trong lúc chạy | Bị chặn và được hướng dẫn đợi/Stop | **Giống guard, thiếu giải thích tại chỗ.** Current UI disable navigation | Thêm hint như mẫu; không bỏ Session admission lock |
| Draft khi chuyển chat | Chữ nháp ở lại chat cũ; chat mới trống | **Giống trong cùng trang.** Có Map theo session, browser checks PASS | Giữ; kiểm tra thêm khi vào/ra Settings |
| Reload khi Host còn chạy | Cùng chat/request; không phát lại công việc | **Giống cho history/request/deck.** Browser có reload/restart checks. **Draft chưa giống đầy đủ:** draft chỉ nằm trong Map, reload thật mất; prototype reload mô phỏng giữ state | Ghi rõ reload thật khác `reloadUI()` mô phỏng. Đề xuất giữ draft theo session trong sessionStorage cho reload cùng tab; nếu cần đóng/mở tab vẫn giữ thì cần quyết định lưu ở Host theo UC-003 A13 |
| Stop/lỗi/restart Host | Giữ phần đã publish, bản đang sửa dở giữ revision cũ; không tự tiếp tục | **Giống nền tảng.** Recovery/edit tests PASS, interrupted status unknown có persisted details | Đưa summary ra notice nhìn thấy; không đổi thành rollback hay auto retry |
| Tạo dần và xem deck | Slide hoàn tất xuất hiện dần; đang xem slide khác không tự nhảy | **Giống publication/selection.** SSE/receipt/browser checks PASS | Giữ, đổi style; tiến độ dựa trên publication, không đếm draft hay lời model |
| Pending/building | Prototype có todo/building/done; chưa có slide hoàn tất thì chưa chọn canvas; chọn thumbnail pending vẫn được | **Khớp một phần.** App có pending/published, tự chọn slide đầu kể cả pending; không có persisted trạng thái building theo slide | Giữ pending placeholder có giải thích; chỉ hiện “đang tạo slide N” khi có evidence đúng slide. Không suy ra từ timer hoặc tool khác |
| Previous/Next | Dừng ở đầu/cuối, nút tương ứng disabled | **Khác.** App dùng modulo quay vòng | Đổi sang bounded navigation, không thay selection khi publish. Prototype vẫn cho bấm thumbnail pending; không vô hiệu hóa pending theo suy đoán |
| Sửa slide rõ phạm vi | Ví dụ “Rút gọn slide 3” sửa ngay, slide khác giữ nguyên | **Khớp một phần.** `editingScope` chấp nhận “Sửa slide 3…”, nhưng probe “Rút gọn slide 3” trả scope rỗng | Mở rộng grammar có kiểm soát cho động từ thường dùng; tests cho số/title không khớp, range, phủ định và câu có nhiều tham chiếu. Host vẫn sở hữu quyền publish |
| Yêu cầu mơ hồ | Card lựa chọn/nhập trả lời; cùng request tiếp tục, có skip/stale handling | **Chưa có lifecycle tương ứng.** Model có thể hỏi bằng text nhưng turn kết thúc; request contract không có question/answer identity, active request không nhận thêm input | Tính năng riêng: Host/runtime cần question state, answer endpoint, cancellation/recovery và persistence. Không làm giả bằng một card chỉ gửi request mới |
| Giữ chỉ dẫn cho slide sau | Lựa chọn giữ chỉ dẫn, chưa đổi deck; có thể thay/rút lại | **Chưa có structured lifecycle.** Có history trong context nhưng chưa phải cam kết lưu/áp dụng instruction được quản lý | Cần behavior/contract của chỉ dẫn và scope; không tuyên bố history text tương đương đã có tính năng |
| Thêm slide sau slide N | Thêm slide, cập nhật thứ tự nhưng giữ selection theo identity | **Chưa hỗ trợ.** Confirmed plan cố định số/order; scope từ chối add/insert; generation/edit instructions cấm đổi cấu trúc | Nhánh tính năng deck mutation riêng với stable IDs/order/revisions, Host/tool/API/DB/client cùng cập nhật. Không ghép vào sửa CSS |
| Attachments | Nhận txt/md/pdf/docx/png/jpg/jpeg/pptx; prepare/ready/error/retry/preview; có thể gửi chỉ file | **Chưa có intake từ browser.** AgentRequest chỉ input/presentation/outline fields; read_file workspace không phải upload | Cần intake/storage/extraction/limits/security/cancel; không hứa đọc được file từ chip mô phỏng hoặc suy lỗi theo tên file như simulator |
| Tạo ảnh | Lỗi ảnh bắt buộc/tùy chọn ảnh hưởng kết quả khác nhau | **Chưa có pipeline tương ứng.** Published slides hiện chỉ static safe HTML/CSS, không external images | Đề xuất thiết kế asset pipeline và chính sách phục vụ ảnh riêng; giữ sandbox/CSP hiện tại |
| Model catalog/manual IDs | Lấy catalog hoặc thêm ID bằng tay; catalog không chứng minh quyền truy cập | **Giống phần chính.** API/Settings có sẵn, catalog chỉ tải cho cấu hình đã lưu | Tái sử dụng API; wizard lưu connection rồi mới tải catalog, báo rõ cấu hình đã lưu dù chưa thêm model |
| Đóng Settings có draft | Cảnh báo bỏ thay đổi chưa lưu; chat draft không mất | **Chưa giống.** Close/ESC không dirty guard; mở lại refresh xóa form chưa lưu | Thêm dirty baseline/confirm discard cho Back/Cancel/ESC và đổi provider; không hiển thị lại key đã lưu |
| Xóa provider/model | Giữ history/deck; không tự chọn model thay; chặn xóa provider đang dùng | **Có nền tảng.** Provider delete có confirm hiện tại; prototype ghi bước xác nhận delete còn là quyết định mở | Giữ confirm đang có; chỉ thay bố cục/copy. Test model bị xóa trong chat và request snapshot |
| Restore defaults/IDs/protocols | Có controls và `[default model ID]`, `[API protocol chờ quyết định]` | **Không phải giá trị đã duyệt.** BR-005 V-4/V-5/V-6 vẫn pending trong spec; runtime có compatibility protocols/IDs | Giữ các giá trị runtime đang dùng; không đổi sang placeholder, không tự invent defaults. Chờ quyết định sản phẩm trước Restore defaults |

Nguồn behavior: [Host request contract](../../packages/host/api/src/contracts.ts), [request validation](../../packages/host/api/src/index.ts), [outline routing/instructions](../../apps/local-web/src/outline-workflow.ts), [editing scope](../../apps/local-web/src/editing-workflow.ts), [Web state](../../apps/local-web/src/web-state.ts), [feedback/recovery projection](../../packages/client/runtime/src/request-feedback.ts), [UC-012 — chat mới và model kế thừa](../spec/03-use-cases/UC-012.md), [UC-003 — gửi, chờ trả lời và reload](../spec/03-use-cases/UC-003.md), [BR-002 — giới hạn độ dài còn pending](../spec/05-business-rules/BR-002.md), [BR-005 — provider/defaults/protocols](../spec/05-business-rules/BR-005.md).

## 4. Trình tự chuyển đổi đề xuất

Mỗi bước có đầu ra kiểm tra độc lập. Chưa đánh dấu các bước implementation là Done.

| Bước | Phạm vi và files dự kiến | Điều kiện hoàn tất |
| --- | --- | --- |
| P0 — chuẩn tham chiếu | Tài liệu này + ảnh baseline; khi thực hiện cập nhật link trong checklist cũ/README thiết kế | Mọi người dùng đúng Interactive; khác biệt đã được phân loại; baseline audit đã có, chưa phải acceptance |
| P1 — shell và visual | `apps/local-web/src/ui-assets.ts`, `outline-style.ts`; `packages/client/runtime/src/boot.ts` | Tông xám, typography, desktop full width, rail/header/welcome/chat bubbles giống mẫu; copy UI tiếng Việt; recent collapse hoạt động; màn hình hẹp vẫn dùng được |
| P2 — composer/model/outline dock | `boot.ts`, `outline-view.ts`, `conversation-view.ts`; đề xuất module client nhỏ `model-picker.ts`/`outline-actions.ts` nếu cần; giữ trong package client hiện tại | Model popover/tabs/gear; Enter/IME/trim validation; actions nằm trên composer, giữ draft, stale guard; header không báo chờ sau confirm/cancel. Không thêm production dependency |
| P3 — trang Settings và wizard | `settings-panel.ts`, UI styles và chỗ mount trong `boot.ts`; `management-client.ts` chỉ nếu cần | Back/Hủy/Lưu nhìn thấy, catalog/manual chips, dirty guard, key clearing; wizard dùng services thật, hoàn tất hay hủy đều quay đúng chat/draft/model; không reload app để đổi trang |
| P4 — deck và notices | `deck-canvas.ts`, `request-feedback.ts`, `conversation-view.ts`, UI styles | Canvas top, thumbnail sơ đồ, bounded Previous/Next, progress/pending/recovery chính xác; giữ fullscreen trong menu phụ, resize, focus, CSP và saved revisions |
| P5 — khoảng lệch behavior nhỏ | `boot.ts`, `editing-workflow.ts`, `outline-workflow.ts`; WebState/storage chỉ sau khi chốt recency/draft ownership | Chat mới không tạo lặp; kế thừa model đúng thứ tự; draft reload theo phạm vi đã chốt; alias confirm toàn câu; hỗ trợ “Rút gọn slide N” với negative tests. Không đổi count/order của deck |
| P6 — chức năng vượt UI | Contracts/Host/runtime/intake/deck/tools/storage/client và tài liệu liên quan theo từng tính năng | Clarification cùng request, attachments, retained instructions, ảnh, thêm slide có design và acceptance riêng. Chỉ triển khai phần phụ thuộc khi quyết định boundary đã được duyệt |
| P7 — nghiệm thu | Focused tests, screenshot cùng viewport, cập nhật handoff/PROGRESS và checklist | Ghi expected/actual theo state và khác biệt còn chấp nhận; manual thật và integrated evidence riêng; không nâng Gate chỉ vì screenshot/tests fixture PASS |

**Mốc có thể review sớm:** sau P1–P4, giao diện của những chức năng đang có sẽ gần mẫu rõ rệt. Các vị trí chưa có backend phải được ghi là chưa hỗ trợ; không coi mốc này là đầy đủ behavior parity. P5 sửa các lệch tương tác đã tái hiện. P6 là điều kiện nếu yêu cầu cuối cùng là hỗ trợ toàn bộ trải nghiệm mẫu.

Không copy nguyên HTML prototype vào app: file đó tự giữ `S`, seed chats/providers, dùng timer và đổi mảng slides trực tiếp. Runtime cần tiếp tục đọc dữ liệu Host, public APIs và immutable publication receipts.

## 5. Lựa chọn và phần cần chốt khi triển khai

Các lựa chọn dưới đây là **đề xuất**, không phải quy tắc kiến trúc đã phê duyệt. P1–P4 không cần chờ quyết định của các tính năng P6.

| Điểm | Các phương án và tác động | Đề xuất |
| --- | --- | --- |
| Model recency cho chat mới | Client giữ thứ tự trong tab: nhỏ, không đổi schema, nhưng không đủ khi mở tab khác/restart. Host lưu thứ tự lựa chọn: đúng xuyên UI/restart, phải xác định metadata/migration và xóa model | Chốt Host làm nguồn recency nếu cần đầy đủ UC-012; tái dùng optional selection của create API, không đoán thứ tự từ `updatedAt` vì gửi message cũng cập nhật thời gian |
| Draft qua reload/đóng tab | sessionStorage phục hồi reload cùng tab nhưng không chia sẻ tab mới. Host lưu draft theo chat đáp ứng vòng đời dài hơn, cần API/storage và tách khỏi sent history | Chốt yêu cầu đóng/mở UI từ UC-003 A13 trước khi cam kết phạm vi. Có thể giao reload cùng tab trước, ghi giới hạn rõ |
| Attachment control và welcome copy | Hiện nút enabled mà không có intake sẽ hứa sai; ẩn thì còn khác ảnh mẫu | Mốc visual dùng copy chỉ mô tả khả năng thật, ẩn hoặc disable có giải thích; muốn nút hoạt động giống mẫu phải làm intake P6 |
| Effort/defaults/giới hạn request | Prototype chứa giá trị chưa chốt; tự dùng sẽ thay behavior/config | Giữ protocol/IDs/16000 của implementation như compatibility hiện tại; chốt sản phẩm riêng cho defaults, effort mapping và giới hạn BR-002 |
| Clarification | Gửi câu trả lời bằng request mới làm UI gần mẫu nhưng sai “cùng request”. Thêm waiting/question/answer contract đúng nghĩa nhưng đụng runtime/lifecycle/recovery | Dùng contract cùng request sau thiết kế; không gọi request mới là continuation của request cũ |
| Font | System fallback triển khai đơn giản nhưng khác metrics. Bundle IBM Plex có thể khớp hơn, cần nguồn/license và asset hợp lệ | Đo ảnh trước; nếu cần đúng font, bundle hợp lệ và offline, không thêm dependency runtime hay bắt app phụ thuộc Google Fonts |

## 6. Acceptance và regression

Đối chiếu cùng viewport desktop **1600×1000** và **1280×800**, cộng **900×600** cho composer; kiểm tra narrow **390×844** như adaptation của app. Dùng cùng nội dung fixture cho cặp screenshot khi nghiệm thu; ảnh khảo sát hiện tại có nội dung/số slides khác nhau nên chỉ dùng để so shell/layout, không chấm pixel toàn trang.

| State/case | Expected sau chuyển đổi |
| --- | --- |
| Chat mới/History nhiều chats | Rail và welcome giống mẫu, chat title một dòng, recent thu gọn; chat mới đang trống không sinh record lặp; không có chức năng search/rename/delete chat tự thêm |
| Composer valid/invalid | Chữ trắng/rỗng không gửi; Enter đúng một request; Shift+Enter xuống dòng; Enter khi IME không gửi; validation giữ draft; thiếu model hướng dẫn rõ |
| Model picker + request active | Tab provider cuộn được; chọn model không gọi Agent; request cũ giữ capture; chọn sau dùng model mới; xóa model không tự chọn model thay |
| Outline current/stale/confirmed/cancelled | Card gọn, actions trong dock; bấm xem không request; click option không gửi draft; confirm là request mới, đúng version; no publication trước confirm; header hết báo chờ khi đã confirm/hủy |
| Generation 0/N → 1/N → N/N | Chỉ publication hợp lệ làm tăng count; pending không lộ HTML slide cũ; selection không nhảy khi slide khác publish; không tạo nhãn building giả |
| Deck navigation | Canvas/controls/thumbnail đúng bố cục; Previous đầu và Next cuối disabled; pending thumbnail vẫn chọn được với placeholder; resize/keyboard/fullscreen không làm request/mutation |
| Scoped edit | “Rút gọn slide 3” được xử lý sau khi mở rộng grammar; sai title/số/phủ định không cấp scope nhầm; slide ngoài scope giữ nguyên revision; chưa hỗ trợ thêm slide thì giải thích, không giả thành công |
| Stop/provider error/restart | Summary nhìn thấy, có phần đã lưu/chưa xong; details đọc được; không tự retry/resume, không tự đổi model, không lộ raw provider exception/key |
| Settings page/wizard | Vào/ra không mất chat/draft/model; Back/ESC có dirty guard; key luôn được xóa khỏi input đúng lúc; catalog lỗi vẫn thêm ID tay; cấu hình đã lưu không bị báo là chưa lưu chỉ vì bỏ bước model |
| Reload/History | History, proposal, confirmed deck và revision đúng Session; xem lại không gọi Agent; draft chỉ được hứa giữ theo phạm vi thực đã implement |
| Accessibility | Focus rõ, order hợp lý, menu đóng trả focus; live status không đọc timer mỗi giây; reduced motion; không mất focus/expansion qua polling; không kẹt cuộn trên màn hình nhỏ |

Lệnh hiện có dùng theo phần đã thay đổi: `pnpm.cmd build`, `pnpm.cmd lint`, `pnpm.cmd test:browser-smoke`, `pnpm.cmd test:local-web`, `pnpm.cmd test:outline-workflow`, `pnpm.cmd test:recovery-editing`, `pnpm.cmd test:slide-pipeline`. Dùng Node thỏa engine trong package.json. Chỉ chạy nhóm liên quan tới mỗi slice; không chạy toàn suite sau mọi chỉnh CSS.

`node tests/ux-02-prototype.test.cjs` hiện đọc **UX Prototype cũ**, không kiểm tra file Interactive hoặc app. Selftest đúng file Interactive là query `?selftest&speed=fast`; chỉ là nguồn đối chiếu behavior mô phỏng. Khi thêm tests app, kiểm tra behavior qua API/browser và counter request thực, không chỉ kiểm tra class/câu chữ.

## 7. Evidence khảo sát và giới hạn

- Build/typecheck/bundle: **PASS**. Lần đầu pnpm shim chọn Node 22.17.1 và cảnh báo engine; đã chạy lại qua Node **22.19.0** + Corepack pnpm **11.28.5**, không còn cảnh báo đó.
- Focused runtime checks: **19/19 PASS** từ `outline-workflow.test.mjs` (8), `recovery-editing.test.mjs` (6), `web-management.test.mjs` (5).
- Browser smoke: lần đầu trong sandbox **3 FAIL — Browser closed**; chạy lại ngoài sandbox **3/3 PASS, 0 skipped**. Không chỉnh test/source để né failure.
- Interactive prototype: **165 PASS / 0 FAIL** qua selftest trong Chrome headless; đã xem ảnh prototype welcome/outline/deck/model menu/Settings và ảnh app tương ứng.
- Probes trực tiếp: chat mới sau khi chọn model vẫn không có selection; `editingScope('Rút gọn slide 3')=[]`, `editingScope('Sửa slide 3: rút gọn nội dung')=['c']` trong fixture, yêu cầu vừa sửa vừa thêm bị từ chối; mismatched title bị từ chối đúng; “Tiếp tục” nhắm pending đúng.
- Dùng codebase-memory Tier 2, index riêng checkout này. Coverage báo `metadata_changed` cho source, tests/docs bị excluded/not_tracked; đã đọc source và tìm kiếm trực tiếp cho các kết luận. Graph không được dùng để chứng minh một tính năng vắng mặt.
- Không sửa production source, tests, schema hay contracts trong đợt lập plan. Không chạy live model, remote CI hoặc user manual acceptance; không thay trạng thái Gates.

Ảnh/script/probes nằm trong thư mục evidence cục bộ [.local-only/ui-prototype-audit](../../.local-only/ui-prototype-audit/), chưa được commit. Các cặp ảnh sau hỗ trợ review ngay tại checkout này; không coi thư mục này là artifact đã publish:

| Màn hình | Mẫu | Hiện tại |
| --- | --- | --- |
| Chat mới | [Prototype welcome](../../.local-only/ui-prototype-audit/prototype-welcome.png) | [App welcome](../../.local-only/ui-prototype-audit/current-welcome.png) |
| Outline | [Prototype outline](../../.local-only/ui-prototype-audit/prototype-outline.png) | [App outline](../../.local-only/ui-prototype-audit/current-outline.png) |
| Deck | [Prototype deck](../../.local-only/ui-prototype-audit/prototype-deck.png) | [App deck](../../.local-only/ui-prototype-audit/current-deck.png) |
| Settings | [Prototype settings](../../.local-only/ui-prototype-audit/prototype-settings.png) | [App settings](../../.local-only/ui-prototype-audit/current-settings.png) |

Evidence bổ sung: [model menu mục tiêu](../../.local-only/ui-prototype-audit/prototype-model.png), [notice lỗi hiện tại](../../.local-only/ui-prototype-audit/current-error.png), [selftest đúng prototype](../../.local-only/ui-prototype-audit/prototype-selftest.txt), [behavior probes](../../.local-only/ui-prototype-audit/behavior-probes.json).

Bước tiếp theo khi bắt đầu implementation: thống nhất mốc UI P1–P4 và behavior P5/P6, tạo feature branch theo workflow của repo, dùng bảng này làm acceptance; cập nhật evidence từng slice trong PROGRESS. Không ghi nhóm UI đã khớp hoàn toàn nếu còn các capability P6.

## 8. Handoff implementation — mốc review, 23-10-2026

Owner đã yêu cầu tiến hành sửa, sau đó cho phép chốt phần ổn định và dừng để review. Candidate nằm trên branch **`feature/interactive-ui-alignment`**, base `789b592`; owner yêu cầu commit/push thay đổi hiện có lên branch này để review trước khi triển khai clarification/confirm mới. Giữ tài liệu khảo sát có sẵn, không sửa schema/API hay thêm dependency. Đã build lại assets; Host đang chạy từ trước cần restart để nạp chúng.

### Đã làm trong đợt này

- Shell trắng/xám, rail 236px, header 52px, chat full width, welcome card nét đứt, bubble/composer gọn; UI copy chính và error/status đổi sang tiếng Việt. Nội dung message/model/slide đã lưu không bị viết lại hoặc ép màu xám.
- Sidebar `Gần đây` thu gọn được, title một dòng, selected xám. Metadata vẫn giữ trong DOM/tooltip; chat đang trống không tạo thêm chat trống khi bấm lặp.
- Model popover có provider tabs cuộn ngang, selected mark, + mở wizard và bánh răng mở Settings. Chọn model chỉ cập nhật selection; request đang chạy giữ capture. Native select giữ làm adapter nội bộ ẩn, không còn hiển thị song song với menu.
- Actions outline hiện trong dock trên composer, giữ ID/version và chữ nháp; proposal details vẫn mở/đóng được. Sau confirm/cancel, header không còn báo chờ xác nhận sai.
- Enter gửi, Shift+Enter xuống dòng, Enter khi IME không gửi. Chuỗi trắng không tạo request; giữ draft khi admission lỗi. Send rỗng hiển thị trạng thái vô hiệu hóa qua aria/style. Preset đề xuất outline và reconnect nằm trong menu ⋯.
- Settings là trang trong workspace có Back/Hủy/Lưu; provider selector gộp cấu hình đã lưu và lựa chọn thêm mới. Có dirty guard khi thoát/đổi provider, key clearing, model chips/manual ID/catalog và wizard ba bước dùng APIs thật. Lưu connection rồi mới thêm models; đóng wizard không tự chọn model hoặc chạy Agent.
- Deck mặc định 400px, canvas phía trên, navigation/thumbnail sơ đồ bên dưới. Previous/Next dừng tại đầu/cuối; pending vẫn chọn được và có placeholder. Giữ fullscreen, revisions, SSE, selection/focus và opaque iframe/CSP. Kéo divider dùng overlay, tắt pointer events của iframe trong lúc kéo để tránh mất drag qua canvas.
- Activity thật vẫn thu gọn theo request. Lỗi/dừng/unknown có notice ngắn nhìn thấy ngay; full recovery và raw tool output vẫn ở details.
- Draft và thứ tự model đã chọn được giữ **trong sessionStorage của cùng tab**. Chat mới kế thừa lựa chọn gần nhất còn selectable trong tab đó, có fallback lựa chọn trước khi model bị xóa. Đây chưa phải recency/draft do Host lưu xuyên tab hoặc xuyên vòng đời trình duyệt.
- Grammar nhận thêm “Rút gọn slide N”; câu có thêm slide, phủ định hoặc title/số không khớp vẫn không cấp scope nhầm. Nhận alias toàn câu “Xác nhận outline”/“Hủy outline”; không dùng prefix `OK…` để tự confirm.

Files implementation: `apps/local-web/src/{ui-assets,outline-style,outline-workflow,editing-workflow}.ts`; `packages/client/runtime/src/{boot,model-picker,settings-panel,outline-view,conversation-view,request-feedback,deck-canvas,deck-resizer,deck-tab}.ts`. Tests cập nhật trong `browser-smoke.test.mjs`, `outline-workflow.test.mjs`, `recovery-editing.test.mjs`.

### Verification và ảnh để review

- Kiểm tra lại trước commit/push: build + lint PASS bằng Node trên PATH **22.17.1**, pnpm **11.28.5** (engine warning: repo yêu cầu `^22.19.0 || >=24.0.0`). Combined focused run trong sandbox **21 PASS / 4 browser FAIL** (`Browser closed`/timeout); browser suite chạy lại ngoài sandbox **4/4 PASS, 0 skipped**. Tổng 25 cases khác nhau đã qua. Đây là evidence mới của lượt chuẩn bị push; các kết quả Node 22.19.0 dưới đây là evidence đã ghi ở lượt implementation.
- Node **22.19.0**, pnpm **11.28.5**, Windows; build/typecheck/bundle và Biome lint PASS.
- Combined focused run **25/25 PASS, 0 skipped**: browser 4, outline workflow 8, recovery/editing 6, management 5, outline client 1, deck client 1. Sau tinh chỉnh Settings/responsive, browser + management **9/9 PASS**. Regression mobile có test đỏ trước fix rồi xanh sau fix; không hạ assertion để cho qua.
- Final sau chỉnh draft fallback/copy: build + lint PASS; focused Chrome composer/Settings/wizard/mobile **1/1 PASS**. Không chạy lại toàn suite vì các nhóm khác không thay đổi.
- Đã kiểm tra ảnh desktop **1600×1000**, mobile **390×844**, composer **900×600** qua browser smoke. Đã sửa lỗi mobile flex làm chat rộng 0; preview đo không có horizontal overflow cho chat/Settings và model menu nằm trong viewport. Chưa chấm pixel hoặc xác nhận mọi kích thước trình duyệt/font.
- Lỗi gặp trong quá trình sửa: tests dùng copy/selector cũ được đổi theo UI mới; drag qua iframe mất sự kiện được điều tra bằng pointer trace rồi sửa overlay; ảnh mobile phát hiện layout co về 0 được thêm regression. Kết quả ở trên là các lần chạy sau sửa.
- Các tests đều dùng fake model và data/workspace tạm; chưa live model, manual owner, hosted CI hoặc merged acceptance. Gates giữ nguyên. Không đưa dữ liệu/key người dùng vào ảnh.

| State | Ảnh candidate |
| --- | --- |
| Chat mới | [Welcome sau sửa](../../.local-only/ui-prototype-audit/after-welcome.png) |
| Menu model | [Popover sau sửa](../../.local-only/ui-prototype-audit/after-model.png) |
| Outline | [Outline/dock sau sửa](../../.local-only/ui-prototype-audit/after-outline.png) |
| Deck | [Deck sau sửa](../../.local-only/ui-prototype-audit/after-deck.png) |
| Settings | [Trang Settings sau sửa](../../.local-only/ui-prototype-audit/after-settings.png) |
| Lỗi | [Notice sau sửa](../../.local-only/ui-prototype-audit/after-error.png) |
| Mobile | [Chat](../../.local-only/ui-prototype-audit/after-mobile.png), [model menu](../../.local-only/ui-prototype-audit/after-mobile-model.png), [Settings](../../.local-only/ui-prototype-audit/after-mobile-settings.png) |

Ảnh/scripts là evidence cục bộ chưa publish trong `.local-only/ui-prototype-audit/`. Một số ảnh dùng model/slide text tiếng Anh từ fixture; đây không phải UI labels chưa dịch. Font dùng system fallback, không tải font ngoài. UI chưa được gọi là giống tuyệt đối từng pixel.

### Phần còn lại và checklist owner

**Chưa triển khai:** attachment intake, clarification cùng request, giữ/rút chỉ dẫn có lifecycle riêng, tạo ảnh, thêm/xóa/reorder slides, effort mapping và Restore defaults. Nút + đính kèm hiện disabled, tooltip nói rõ chưa hỗ trợ. Không có backend giả hoặc tự nới publication scope cho các phần đó. Draft/model recency xuyên tab/restart vẫn cần chốt nguồn lưu trước khi làm tiếp.

1. Dừng Host cũ; dùng Node đáp ứng engine của repo, chạy `pnpm.cmd start:local-web` với **cùng data directory/workspace và tham số đang dùng**, rồi reload tab từ URL Host. Candidate đã build trong checkout này; nếu chuyển checkout/máy thì build trước.
2. Check chat mới, Gần đây, model menu và Settings so với file Interactive. Thử bỏ thay đổi chưa lưu, lưu provider/model, vào/ra Settings khi có draft.
3. Tạo outline, xem chi tiết, xác nhận từ dock. Check chữ nháp không bị gửi kèm option, header hết chờ confirm, slides xuất hiện dần và selection giữ nguyên.
4. Check Previous/Next đầu/cuối, pending, kéo divider, fullscreen và mobile. Thử Enter/Shift+Enter, Stop hoặc một lỗi provider; notice phải rõ và revisions đã lưu vẫn xem được.
5. Đổi chat/reload cùng tab, check draft/model; nhận xét phần spacing/font/copy hoặc tương tác cần tinh chỉnh. Chưa đánh dấu manual PASS trước khi owner thực sự chạy.

**Điểm tiếp tục:** xử lý phản hồi review trên candidate này trước. Chưa tự mở P6 hoặc thay boundary persistence/asset/runtime.
