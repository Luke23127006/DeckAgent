# DeckAgent — Implementation Plan
## Build New Application with Selective DeepSeek Harness Reuse

**Ngày lập:** 19/10/2026  
**Trạng thái:** Đề xuất triển khai; chưa xác nhận bằng build thử trên DeckAgent mới  
**Phạm vi:** Local Web V1, ưu tiên demo UC-001  
**Source tham chiếu:** [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)

## 1. Tóm tắt

**Xây DeckAgent thành một ứng dụng mới, tái sử dụng các DeepSeek modules có giá trị và phát triển riêng Presentation Domain.** Dùng Cordis để lắp ghép Agent Runtime, Session, Tools, Model Settings, Web Client và các capabilities cần thiết. Không viết lại những phần đã hoạt động tốt.

**Thứ tự đề xuất:** kiểm chứng DeepSeek Web baseline → tạo DeckAgent application composition → thu hẹp chức năng bằng cấu hình → xây Deck Canvas → xây Deck State và đường dữ liệu Host–Client → xây Outline Confirmation → nối Agent với Slide Publication → hoàn thiện demo UC-001 → kiểm thử, mở rộng các use cases và loại bỏ code dư thừa.

Đường đi này ưu tiên một ứng dụng **có thể chạy và kiểm thử sớm**, nhưng vẫn giữ rõ phần kế thừa và phần do DeckAgent phát triển. Các quyết định về tập packages, độ phù hợp của Right Sidebar và chi phí tích hợp cần được đánh giá bằng kết quả chạy thực tế.

## 2. Kết quả cần đạt

### 2.1. Hành vi của DeckAgent

DeckAgent là ứng dụng Local Web cho phép người dùng tạo, xem và chỉnh sửa presentations qua hội thoại. Các hành vi liên quan trực tiếp đến kế hoạch:

- Mỗi chat gắn với một deck. Người dùng có thể mở lại chat và deck sau khi đóng ứng dụng.
- Người dùng gửi yêu cầu và tài liệu; Agent tạo **outline proposal** trước khi tạo slides.
- Outline nằm trong Conversation. Người dùng xem tổng quan và mở hoặc thu gọn chi tiết của từng slide mà không cần gửi request.
- Người dùng có thể yêu cầu sửa hoặc xác nhận outline qua hội thoại. Xác nhận một outline là **request mới**, chỉ áp dụng cho **current outline**.
- **Không tạo hoặc công bố slide trước khi outline được xác nhận.**
- Sau xác nhận, **Deck Canvas** xuất hiện trong Right Sidebar. Canvas cho thấy slide đã hoàn thành và slide đang chờ.
- Agent tạo từng slide; Canvas hiển thị ngay sau khi slide được công bố thành công. Slide mới không tự thay đổi slide người dùng đang xem.
- Khi Agent bị dừng hoặc lỗi, các slides đã công bố vẫn tồn tại. Reload trang không làm mất deck hoặc dừng Agent đang chạy. Host restart không bắt buộc tiếp tục run dang dở.
- Khi hoàn thành, Agent nêu kết quả, các giả định, placeholder và những điều chưa kiểm chứng.
- V1 chỉnh sửa qua chat, không yêu cầu chỉnh sửa trực tiếp trên Canvas; V1 chưa bao gồm export.

### 2.2. Demo và V1 hoàn chỉnh là hai mốc khác nhau

**Demo UC-001** là một *vertical slice* thực sự: request → outline → confirmation → HTML slides → công bố từng slide → Canvas → final response. Các slides phải do Agent tạo ra, không phải dữ liệu mẫu.

**V1 hoàn chỉnh** còn bao gồm các alternative flows, lỗi, attachments, hình ảnh, các UCs khác và tiêu chí chất lượng. Cơ chế tạo hình ảnh mới chưa được xác định đầy đủ. Không coi demo main flow là bằng chứng toàn bộ V1 đã hoàn thành.

### 2.3. Mục tiêu kỹ thuật

- Giữ nguyên Agent Runtime và cơ chế nền nếu extension APIs đáp ứng yêu cầu.
- Giới hạn thay đổi trực tiếp vào code kế thừa.
- Đưa các presentation capabilities vào những thành phần DeckAgent có trách nhiệm rõ ràng.
- Có kết quả kiểm thử để xác định các technical improvements, thay vì chọn đóng góp chỉ từ giả thuyết.

## 3. Những phát hiện từ DeepSeek ảnh hưởng đến thứ tự triển khai

**Application Composition.** DeepSeek dùng Cordis plugins, profiles và bundle patches. `dsh-base` cung cấp các capabilities nền; `dsh-web-app` bổ sung Web Host và Web Client. Cấu hình được ghép theo các lớp. Một patch có thể thay thế toàn bộ config của một row, không chỉ sửa một trường.

**Web Client có nhiều lớp.** Các capabilities Web phụ thuộc vào Host Service → Remote/API → Client Model → UI Adapter/Slots → React. Chat và Right Sidebar không chỉ là các React components có thể copy độc lập.

**Right Sidebar có extension points.** Sidebar hỗ trợ tabs theo Session, resize, fullscreen và khôi phục bố cục. Một plugin có thể đăng ký Deck Tab mà không phải thay toàn bộ Main Workspace.

**File Preview khác Deck Canvas.** HTML Preview xem một file, nhưng không quản lý outline, thứ tự slides, slide identity hay revisions. DeckAgent cần một Deck State riêng.

**Tool execution có thể reuse.** Agent dùng File Tools để tạo HTML. `present` của DeepSeek chỉ công bố đường dẫn file; nó không thay cho công cụ công bố một slide revision chính thức.

**Storage không tự thay thế Client Model.** Storage Domain lưu được metadata và phát thay đổi trong Host. Browser vẫn cần API để lấy snapshot chính thức, nhận cập nhật và khôi phục khi reconnect.

**Hệ quả:** Bắt đầu từ application composition đủ khả năng chạy Web, sau đó bổ sung các phần presentation theo đường dữ liệu và dependency thực tế. Không chọn thứ tự chỉ dựa trên tên thư mục trong repository.

## 4. Các bước implementation

Mỗi bước ghi rõ **mục đích**, **phần tái sử dụng**, **phần cần thay đổi hoặc xây mới**, **điểm cần chú ý** và **điều kiện hoàn thành**. Đây là thứ tự đề xuất để giảm rủi ro tích hợp; không phải cam kết về thời gian.

### Bước 1 — Xác lập DeepSeek Web baseline

**Mục đích:** Có một hệ thống tham chiếu hoạt động để đối chiếu behavior và nhận biết lỗi phát sinh từ việc tích hợp DeckAgent.

**Tái sử dụng:** Source, build setup và Web profile chính thức của DeepSeek Harness.

**Thực hiện:**

1. Chọn một upstream commit cố định. Lưu commit ID và môi trường chạy.
2. Chạy DeepSeek Web nguyên trạng.
3. Kiểm tra các capabilities dự định giữ: model configuration, Chat, Agent Tools, File Preview, Right Sidebar, Session History và reload/restart.
4. Ghi rõ kết quả của mỗi lần kiểm thử và những giới hạn đã quan sát.

**Điểm cần chú ý:** Hệ thống DeepSeek còn có application entrypoints, build scripts, `vendor/` và các dependencies ngoài `packages/`. Tập source cần cho DeckAgent phải dựa trên cơ chế build thực tế. Giữ một bản upstream nguyên vẹn để đối chiếu.

**Hoàn thành khi:** Có DeepSeek Web baseline chạy được, một tập smoke tests ngắn và commit ID để truy vết.

### Bước 2 — Tạo DeckAgent application composition

**Mục đích:** Chạy DeckAgent như một ứng dụng riêng bằng những capabilities DeepSeek cần thiết, trước khi thêm presentation logic.

**Tái sử dụng:** Cordis, `dsh-base`, Web composition, Agent Runtime, LLM adapters, Sessions, Tools, API Gateway, Conversation, Model Settings và các dependencies tương ứng.

**Thực hiện:**

1. Tạo DeckAgent application/profile riêng, xác định cách đưa source hoặc packages kế thừa vào project.
2. Dùng cách boot/profile của DeepSeek Web làm nền; cấu hình các Cordis plugins cần thiết.
3. Mang theo những dependencies bắt buộc để build và chạy, thay vì lựa chọn packages theo tên thư mục.
4. Giữ tên và public contracts của các modules kế thừa trong giai đoạn đầu. Đặt code mới của DeckAgent trong phần riêng.
5. Kiểm tra một request thật với model đã cấu hình, File Tools và Session Persistence.

**Điểm cần chú ý:**

- `dsh-base` là bundle cấu hình, không phải một thư viện độc lập để import.
- Plugin được mount ở Host chưa chắc tool đã được cấp vào đúng Agent Preset.
- Cần giữ đúng permission/sandbox boundary. Không mount hai file providers tranh cùng một service.
- Cần kiểm tra package exports, generated APIs và build scripts khi mang source sang một application mới.
- Không thay Agent Loop chỉ để khởi động ứng dụng.

**Hoàn thành khi:** DeckAgent Web có thể chat với model, dùng File Tools và mở lại một Session sau restart.

**Điểm ra quyết định:** Nếu phải viết lại phần lớn Web boot, transport hoặc Session binding mới chạy được, cần cân nhắc giữ thêm upstream Web assembly thay vì cố tối giản source bằng mọi giá.

### Bước 3 — Thu hẹp Product Surface bằng composition

**Mục đích:** Giữ các capabilities phục vụ DeckAgent, đồng thời bỏ những chức năng không cần khỏi giao diện.

**Tái sử dụng:** Model Settings, Session History, Conversation, Workspace Service, filesystem permission và Cordis composition.

**Thực hiện:**

1. Xác định các UI capabilities cần cho Local Web V1.
2. Tắt hoặc loại khỏi composition các giao diện ngoài phạm vi.
3. Giữ service nền khi vẫn là dependency của các capabilities khác.
4. Cấu hình một default workspace; người dùng không phải chọn workspace trước khi tạo chat.
5. Kiểm tra lại Chat, Models, Files, History và Right Sidebar sau từng nhóm thay đổi.

**Điểm cần chú ý:** Plugin Manager/Marketplace UI không phải Cordis Plugin System. Có thể loại giao diện quản lý plugins nhưng vẫn phải giữ Cordis. Tương tự, không cần loại Workspace Service chỉ vì V1 dùng một workspace mặc định.

**Hoàn thành khi:** DeckAgent có giao diện nền phù hợp sản phẩm, và các capabilities cần cho UC-001 vẫn chạy.

### Bước 4 — Xây Deck Canvas trong Right Sidebar

**Mục đích:** Kiểm chứng sớm quyết định dùng Right Sidebar làm nơi xem slides.

**Tái sử dụng:** Right Sidebar tab registry, UI Slots, Docking, resize, fullscreen, Session binding và các kỹ thuật render HTML an toàn.

**Xây mới:** Deck Tab với slide viewer, slide navigation, slide đang được chọn và trạng thái đang chờ/đã hoàn thành.

**Thực hiện:**

1. Đăng ký một Deck Tab qua extension API của Right Sidebar.
2. Dùng một deck HTML mẫu để kiểm tra UI, chưa nối Agent.
3. Kiểm tra slide 16:9 trong các kích thước panel khác nhau.
4. Kiểm tra fullscreen, chuyển tab, chuyển Session và reload.
5. Tách việc render Canvas khỏi dữ liệu mẫu để sau này nối Client Model.

**Điểm cần chú ý:** Không ép generic File Preview làm nơi quản lý toàn bộ deck. Resize không được làm slide biến dạng hoặc cắt nội dung. Canvas không được liên tục chiếm focus của Chat hoặc tự thay slide người dùng đang xem.

**Hoàn thành khi:** Người dùng xem và điều hướng nhiều slides mẫu ổn định trong Right Sidebar.

**Điểm ra quyết định:** Nếu Sidebar không đáp ứng được kích thước hoặc lifecycle của Canvas sau khi thử thực tế, ghi rõ giới hạn và đánh giá một Main Workspace riêng. Không đổi kiến trúc chỉ do giả định.

### Bước 5 — Xây Deck Domain và Host–Client data flow

**Mục đích:** Có nguồn dữ liệu chính thức cho deck, tách khỏi File Tools và trạng thái UI.

**Tái sử dụng:** Storage Domain, API Gateway và cách DeepSeek xây Host Controller/Client Model.

**Xây mới:** Deck Service, cấu trúc deck/outline/slide, API đọc và cập nhật, Deck Client Model.

**Thực hiện:**

1. Liên kết một Session với tối đa một deck.
2. Lưu outline proposal, confirmed outline, slide IDs, thứ tự, trạng thái và revision đã công bố.
3. Lưu nội dung slide và assets theo cách có thể khôi phục sau restart.
4. Cung cấp một snapshot chính thức từ Host và cơ chế cập nhật cho browser.
5. Khi reload/reconnect, đồng bộ lại dữ liệu để không mất hoặc nhân đôi slides.
6. Thay dữ liệu mẫu của Deck Tab bằng dữ liệu từ Deck Client Model.

**Điểm cần chú ý:**

- Không coi file HTML trong working directory là một slide đã công bố.
- Không lấy tên file làm slide identity; slide ID phải ổn định qua nhiều revisions.
- Không dùng React State hoặc localStorage của Sidebar làm nguồn dữ liệu chính thức.
- Thay đổi slide phải được lưu hoàn chỉnh trước khi thông báo cho Canvas.
- Một thông báo thay đổi riêng lẻ không thay thế được snapshot sau reconnect.

**Hoàn thành khi:** Deck từ Host hiển thị trong Canvas và vẫn xem được sau reload hoặc Host restart.

### Bước 6 — Xây Outline Proposal và Confirmation

**Mục đích:** Đáp ứng checkpoint của UC-001: người dùng xác nhận outline trước khi xây slides.

**Tái sử dụng:** Conversation, Agent Prompt Sections, Session History và một số patterns từ Plan Review/User Interaction.

**Xây mới hoặc điều chỉnh:** Outline representation, giao diện outline, current/confirmed state và điều kiện cho phép tạo slides.

**Thực hiện:**

1. Khi chat chưa có deck, Agent trả về một outline proposal, không tạo slides.
2. Conversation hiển thị tổng quan và chi tiết dự kiến của từng planned slide. Mở/thu gọn chi tiết không gửi request.
3. Người dùng xác nhận, hủy hoặc yêu cầu sửa bằng hội thoại.
4. Xác nhận được gửi dưới dạng request mới, chỉ dành cho current outline.
5. Host ghi confirmed outline ở trạng thái read-only.
6. Chỉ kích hoạt slide generation sau khi confirmation được ghi nhận.

**Điểm cần chú ý:** Plan Mode của DeepSeek có workflow và policy riêng, không mặc định có cùng lifecycle với UC-001. Prompt giúp hướng Agent nhưng không đủ để ngăn một tool công bố slide sớm; điều kiện confirmation phải được kiểm tra ở Host.

**Hoàn thành khi:** Outline được đề xuất, xem, sửa và xác nhận đúng. Không có slide được công bố trước confirmation.

### Bước 7 — Kết nối Agent với Slide Generation và Publication

**Mục đích:** Cho Agent tạo HTML slides thật và công bố từng slide qua Deck Service.

**Tái sử dụng:** Agent Loop, File Tools, Tool Registry/Execution, working directory và storage nền.

**Xây mới:** Deck-specific Agent instructions và công cụ `publish_slide`.

**Thực hiện:**

1. Cung cấp confirmed outline và trạng thái deck hiện tại cho Agent.
2. Agent tạo HTML/CSS trong working directory bằng những File Tools đã có.
3. Agent gọi `publish_slide` và xác định slide thuộc planned slide nào.
4. Tool kiểm tra quyền, Session, trạng thái confirmation, slide identity, file nguồn và giới hạn nội dung.
5. Deck Service lưu một revision hoàn chỉnh; chỉ khi thành công mới thông báo Canvas.
6. Canvas cập nhật slides hoàn thành mà không tự thay slide được chọn.

**Điểm cần chú ý:**

- Tool `present` của DeepSeek chỉ công bố đường dẫn file, không quản lý deck revision.
- HTML phải được render trong vùng cách ly phù hợp; không cấp quyền cho scripts tùy ý truy cập ứng dụng.
- Assets phải còn truy cập được sau restart, không chỉ nằm ở đường dẫn file tạm.
- Cần kiểm tra tool được đăng ký trong đúng Agent Preset và scope.
- Chưa cần phát triển một generation engine phức tạp nếu File Tools đã cho phép Agent tạo HTML đáp ứng demo.

**Hoàn thành khi:** Agent thực sự tạo và công bố ít nhất một HTML slide để Canvas nhận được từ Deck Service.

### Bước 8 — Tích hợp thành UC-001 end-to-end

**Mục đích:** Kết nối các capabilities thành một hành trình người dùng hoàn chỉnh.

**Luồng demo:**

1. Người dùng gửi yêu cầu tạo presentation.
2. Agent gửi outline proposal; người dùng xem, sửa hoặc xác nhận.
3. Sau xác nhận, Deck Tab mở và hiển thị tiến độ.
4. Agent tạo từng slide và gọi publication tool.
5. Deck Canvas hiển thị slides ngay khi chúng được công bố.
6. Người dùng xem slide đang chọn trong khi Agent tiếp tục làm việc.
7. Agent gửi kết quả cuối cùng, nêu rõ phần đã làm và những giới hạn.

**Kiểm thử bắt buộc cho vertical slice:**

- Deck có nhiều slides, được tạo từ request thật.
- Không công bố slide trước confirmation.
- Slide tương ứng với confirmed outline và có đúng thứ tự.
- Slide mới không làm mất trạng thái lựa chọn của người dùng.
- Reload không làm mất các slides đã công bố.
- Khi hoàn thành, có final response và deck có thể được mở lại.

**Hoàn thành khi:** Có demo UC-001 chạy trọn luồng chính. Các alternative flows chưa hoàn thành phải được ghi rõ thay vì coi là đã được bao phủ.

### Bước 9 — Reliability, mở rộng UCs và cleanup

**Mục đích:** Biến demo thành một implementation đáng tin cậy và tạo dữ liệu cho các nghiên cứu cải thiện.

**Tái sử dụng:** Session Persistence, Stop/Cancel, error handling, Conversation History, Attachments.

**Thực hiện:**

1. Kiểm tra stop giữa lúc tạo slide, model failure, tool failure và mất kết nối.
2. Giữ các slides đã công bố, không lộ các file/revisions chưa hoàn thành.
3. Sau Host restart, khôi phục outline/deck đã lưu nhưng không tự tiếp tục Agent run đang dang dở.
4. Cho follow-up request dùng confirmed outline và các slide đã tồn tại để tiếp tục phần chưa hoàn thành.
5. Mở rộng **UC-002**: đọc revision hiện tại, sửa đúng slides được yêu cầu, công bố revision mới và kiểm tra các slides ngoài scope không đổi.
6. Mở rộng **UC-006**: mở lại Session và lấy đúng deck tương ứng.
7. Đánh giá các alternative flows còn lại, đặc biệt là attachments và tạo ảnh mới.
8. Xóa những packages không còn cần sau khi kiểm tra dependency và regression.
9. Lưu các lỗi và giới hạn quan sát được để lựa chọn technical improvements.

**Điểm cần chú ý:** Có publication tool không tự giải quyết được yêu cầu giữ nguyên nội dung ngoài phạm vi sửa của UC-002. Session History cũng không tự khôi phục deck nếu chưa có liên kết chính thức giữa Session và Deck State.

**Hoàn thành khi:** Stop/failure không làm mất các slides hoàn thành, deck có thể khôi phục và mỗi UC mở rộng có kết quả kiểm thử riêng.

## 5. Ma trận reuse và thay đổi

| Capability | Hướng triển khai | Lý do |
|---|---|---|
| Cordis, Agent Runtime, LLM, Tool Pipeline | **Reuse** | Nền tảng execution đã có |
| Session Persistence, Permissions, Sandbox | **Reuse + configuration** | Giữ lifecycle, lịch sử và kiểm soát quyền |
| Model Providers, Model Settings | **Reuse** | Tránh làm lại chức năng đã phù hợp |
| Web Boot, Gateway, Client Modules | **Reuse** | Có dependency sâu trong Web Client |
| Chat, Composer, Session History | **Reuse + điều chỉnh nhỏ khi cần** | Gần với hành vi DeckAgent |
| Workspace infrastructure | **Reuse + giới hạn UI** | V1 dùng một default workspace |
| Right Sidebar | **Reuse + custom tab** | Có sẵn tab extension, resize và fullscreen |
| HTML File Preview | **Reuse kỹ thuật render phù hợp** | Là viewer của file, không phải Deck Domain |
| Plan Review | **Tham khảo một phần** | Lifecycle khác Outline Confirmation |
| Deck Service, Deck Client Model | **Xây mới** | DeckAgent cần dữ liệu presentation chính thức |
| Outline Workflow | **Xây/điều chỉnh riêng** | Chỉ được tạo slide sau xác nhận |
| Slide Publication | **Xây tool mới, dùng File Tools cũ** | Cần lưu slide ID, thứ tự và revision |
| Plugin Manager/Marketplace UI | **Tắt trước, xét xóa sau** | Ngoài phạm vi sản phẩm |
| Direct editing, PPTX export | **Không thuộc demo đầu tiên** | Không cần cho UC-001 main flow |

Bảng này phân loại theo **capability**, không phải danh sách chính xác các packages phải copy. Tập packages thực tế phải xuất phát từ dependency graph và kết quả build.

## 6. Milestones và điểm ra quyết định

| Milestone | Bước | Kết quả kiểm chứng | Quyết định tiếp theo |
|---|---|---|---|
| **A — Application Baseline** | 1–3 | DeckAgent chạy Chat, Models, Files, Sessions và Right Sidebar | Tiếp tục selective reuse nếu chi phí tích hợp hợp lý |
| **B — Canvas + Data** | 4–5 | Deck Tab hiển thị dữ liệu Host, có thể khôi phục sau reload | Xác nhận hướng Right Sidebar và Deck State |
| **C — Agent Publication** | 6–7 | Agent chỉ công bố sau confirmation; Canvas nhận slide thật | Nối luồng UC-001 hoàn chỉnh |
| **D — Working Demo** | 8 | UC-001 main flow hoạt động end-to-end | Bắt đầu mở rộng coverage |
| **E — Reliable V1 & Improvements** | 9 | Có kiểm thử lỗi, các UCs kế tiếp và dữ liệu chất lượng slides | Chọn những technical improvements đáng nghiên cứu |

**Ưu tiên trước demo:** mốc A → B → C → D. Không lấy việc xóa sạch packages kế thừa hoặc đạt toàn bộ V1 làm điều kiện bắt buộc để bắt đầu demo.

**Điểm phải đánh giá lại:** Nếu mốc A kéo theo việc viết lại quá nhiều infrastructure, cần điều chỉnh phạm vi source reuse. Nếu mốc B bộc lộ hạn chế UX nghiêm trọng của Sidebar, cần xem lại Canvas placement. Những quyết định này dựa trên kết quả chạy, không dựa vào dự đoán.

## 7. Rủi ro quan trọng

| Rủi ro | Hậu quả | Hướng kiểm soát |
|---|---|---|
| Dependency closure lớn | Khó tách một Web module độc lập | Giữ thêm dependencies cần thiết; chưa tối ưu số lượng package quá sớm |
| Composition sai scope | Agent không thấy tool dù package đã được nạp | Kiểm tra Host/Client/Agent Preset và service injection |
| Application boot gắn chặt với upstream | Tốn thời gian tái viết Web infrastructure | Reuse thêm profile và Web assembly đang hoạt động |
| Confirmation chỉ được nhắc trong prompt | Agent vẫn có thể publish sớm | Kiểm tra điều kiện ở Host/Tool |
| Deck State không chính thức | Mất slide hoặc hiển thị file nháp | Lưu bằng Deck Service và revision commit |
| Cập nhật Client không có snapshot | Reload/reconnect bị thiếu hoặc trùng dữ liệu | Snapshot + cơ chế đồng bộ thay đổi |
| HTML/asset không an toàn hoặc không bền | Rủi ro script, mất ảnh sau restart | Render cách ly, giới hạn nội dung, quản lý assets |
| Canvas chiếm focus | Gián đoạn thao tác Chat | Phân biệt sự kiện cập nhật data với thao tác navigation |
| Xóa packages quá sớm | Hỏng Session/Models/Tools | Vô hiệu hóa qua composition, sau đó regression tests |
| Nguồn gốc code không rõ | Khó trình bày đóng góp trong đồ án | Giữ upstream commit, phân biệt inherited/adapted/new |

## 8. Ghi nhận hiệu quả và cơ hội technical contributions

Trong quá trình triển khai, cần ghi lại bằng chứng ngắn cho mỗi capability:

- **Reuse:** packages/services nào được giữ; có phải sửa source kế thừa không.
- **Integration:** dependencies hoặc giới hạn extension API nào gây trở ngại.
- **Behavior coverage:** các acceptance tests nào pass, fail hoặc chưa triển khai.
- **Slide quality:** overflow, clipping, tính nhất quán bố cục, độ dễ đọc và tính phù hợp hình ảnh.
- **Editing reliability:** nội dung ngoài phạm vi được yêu cầu có được giữ nguyên không.
- **Recovery:** trong các ca lỗi, bao nhiêu slides hoàn thành còn dùng được.

Những số liệu này trước hết giúp nhóm chọn bước implementation tiếp theo. Sau khi có đủ dữ liệu, chúng có thể gợi ý đóng góp kỹ thuật như layout validation, generation feedback hoặc scope-preserving editing. Đây là **hướng nghiên cứu tiềm năng**, không phải contribution đã được chứng minh.

### Minh bạch về source kế thừa

Phân biệt rõ bốn nhóm: **inherited** (code DeepSeek), **adapted** (code kế thừa có chỉnh sửa), **new** (DeckAgent-specific code) và **evaluated** (kết quả kiểm thử). Ghi lại upstream commit và các thay đổi. Việc code kế thừa có đáp ứng quy định đồ án hay không phải được xác nhận với trường và giảng viên; cấu trúc repository không tự quyết định vấn đề này.

## 9. Quyết định triển khai hiện tại

**Có thể dùng ngay làm hướng thực hiện:**

- DeckAgent là application mới, dùng Cordis composition và selective DeepSeek source reuse.
- Giữ những modules đã giải quyết tốt Chat, Providers, Session, Filesystem và Web UI.
- Deck Canvas là custom tab trong Right Sidebar; chỉ đổi hướng nếu kiểm thử thực tế chỉ ra giới hạn đáng kể.
- Slides được tạo ban đầu bằng HTML/CSS. Agent dùng File Tools và một publication tool riêng.
- Deck Service là nguồn dữ liệu chính thức; Browser đọc qua Client Model.
- Ưu tiên UC-001 vertical slice rồi mới hoàn thiện alternative flows, các UCs khác và cleanup.

**Cần quyết định sau khi kiểm chứng:**

- Tập source packages tối thiểu để chạy DeckAgent Web.
- Mức độ phải giữ boot/profile machinery của DeepSeek.
- Có cần thay Right Sidebar bằng workspace riêng không.
- Giải pháp tạo ảnh mới cho phạm vi V1.
- Technical improvements nào có giá trị đo được.

## 10. Nguồn tham chiếu

Những liên kết dưới đây phục vụ kiểm chứng kỹ thuật và truy vết yêu cầu. **Toàn bộ mục tiêu, bước làm và điều kiện hoàn thành đã được nêu ngay trong tài liệu này**; không cần đọc tài liệu khác để hiểu kế hoạch.

### DeepSeek Harness

1. [Architecture — Cordis, Profiles, Bundles, Core Packages](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)
2. [Base Bundle](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/README.md)
3. [Base Composition](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml)
4. [Web App Bundle](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/README.md)
5. [Web App Composition](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/cordis.patch.yml)
6. [Web Client Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web-client.md)
7. [Right Sidebar](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-right/README.md)
8. [Document Preview](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-documentpreview/README.md)
9. [File Tools](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs/README.md)
10. [Storage Domain](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/storage/storage-domain/README.md)
11. [Session Persistence](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/persistence.md)
12. [Cordis Composition](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md)
13. [Plan Review](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plan/README.md)
14. [Present Tool](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/deliverables/tool-present/README.md)

### DeckAgent

1. [UC-001 — Generate Initial Draft Deck](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-001.md)
2. [UC-002 — Change Draft Deck](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-002.md)
3. [UC-003 — Request Lifecycle](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-003.md)
4. [V1 Scope](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/00-current-scope/VERSIONS.md)
5. [FR-069 — Outline Detail Viewing](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/04-requirements/fr/FR-069.md)
6. [FR-066 — Images](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/04-requirements/fr/FR-066.md)

**Mức độ xác nhận:** Cơ chế DeepSeek được rút ra từ tài liệu và source đã kiểm tra. Thứ tự implementation và các hướng reuse là đề xuất kỹ thuật. Tài liệu này chưa chứng minh rằng DeckAgent application mới đã build thành công.
