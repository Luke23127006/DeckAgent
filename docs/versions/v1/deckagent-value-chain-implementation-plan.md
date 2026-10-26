# DeckAgent — Implementation Plan
## Xây codebase bằng cách tái sử dụng có chọn lọc DeepSeek Harness

**Ngày:** 19/10/2026  
**Trạng thái:** Kế hoạch kỹ thuật dựa trên phân tích source và hành vi sản phẩm; chưa xác nhận bằng một bản build DeckAgent mới.  
**Định hướng:** New application + source-level reuse + incremental dependency expansion.

## Quyết định đề xuất

DeckAgent nên được hình thành bằng **những baseline nhỏ, chạy được và có thể mở rộng**. Mỗi baseline dùng lại một tập packages DeepSeek cùng các dependencies thực sự cần thiết, rồi bổ sung capabilities của DeckAgent thông qua Cordis.

Không chọn packages chỉ theo thư mục. Không cần chuyển toàn bộ Web App vào từ đầu. Cũng không đặt mục tiêu tạo một framework tối giản hoàn hảo rồi mới phát triển sản phẩm.

**Chuỗi giá trị cần đạt:**

```text
Upstream có thể đối chiếu
    ↓
Codebase DeckAgent có thể build và khởi động
    ↓
Agent có thể gọi model và tools
    ↓
Agent có filesystem an toàn, session bền vững và model configuration
    ↓
Người dùng có thể làm việc với Agent qua Local Web
    ↓
Người dùng có thể xem một deck trong Canvas
    ↓
Canvas nhận slides đã hoàn thành từ Deck Service
    ↓
UC-001 tạo presentation từ outline đã xác nhận
    ↓
UC-002 / UC-006 và các tình huống lỗi hoạt động
    ↓
Có dữ liệu thực tế để xác định và đo technical improvements
```

Các mốc trung gian không phải mục đích tự thân. Giá trị của mỗi mốc là **loại bỏ một rủi ro cụ thể và tạo điều kiện cho công việc kế tiếp**.

### Phạm vi sản phẩm dùng để định hướng kế hoạch

DeckAgent V1 là ứng dụng **Local Web**, ưu tiên **Windows**. Người dùng chọn model của riêng mình, tạo và chỉnh sửa presentation qua hội thoại, xem slide trong Deck Canvas, không chỉnh slide trực tiếp và chưa xuất file presentation. Có **một default workspace**, **một deck trên mỗi chat**, và chat/deck phải còn sau khi tắt rồi mở ứng dụng. Reload trình duyệt trong lúc Host còn chạy không được tự dừng request; restart Host không bắt buộc tiếp tục request đang chạy.

Điểm khác biệt quan trọng nhất của **UC-001** là hai request riêng biệt: request đầu tiên tạo **outline proposal** rồi kết thúc; người dùng xác nhận **current outline** bằng request tiếp theo. Không xây slide trước khi xác nhận. Sau xác nhận, các slide hoàn thành xuất hiện dần trong Canvas, còn slide đang được xem không tự thay đổi. Cuối request, Agent giải thích những gì đã tạo và những giới hạn của kết quả.

V1 còn có sửa deck theo phạm vi chỉ định (**UC-002**), mở lại công việc cũ (**UC-006**), hoạt động hội thoại chung (**UC-003**) và hình ảnh. **Tạo ảnh mới là yêu cầu V1 nhưng chưa có phương án kỹ thuật được chốt**. Vì vậy, demo luồng chính UC-001 và hoàn thành toàn bộ V1 là hai mốc khác nhau.

---

## 1. Điều source DeepSeek cho biết về cách triển khai

DeepSeek Harness được xây trên **Cordis**. Agent Loop, Session, LLM, Tools và cả các phần Web đều tham gia hệ thống plugin/service. Các **profiles** và **bundles** quyết định plugin nào được kích hoạt; `dsh-base` cung cấp nhiều cấu hình nền, còn `dsh-web-app` bổ sung phần Web. Chúng là **composition layers**, không phải thư viện nghiệp vụ có thể dùng như một class riêng.

Ở cấp package, chỉ đọc `dependencies` là không đủ. Một package có thể yêu cầu `peerDependencies`, các services thông qua Cordis `inject`, browser dependencies qua `dsh.client.inject`, hoặc các file sinh ra từ build. Ví dụ:

- `core/agent-loop` dùng Agent, LLM, Session, Session Persistence, Session Projection, System Prompt và Tools.
- `core/tools` còn cần những capabilities như Approval, Sandbox, Sandbox Policy và Working Directory.
- `client/ui-conversation` nối với Session Controller, File Upload, UI Session, Workspace, Settings, Layout và Renderer.
- `client/ui-sidebar-right` dùng Conversation, Session Controller, Resources, Layout, UI Session và Shortcuts.

**Kết luận thực thi:** đơn vị reuse là **một nhóm dependency đủ để chạy một hành vi**, không phải một thư mục hoặc một package đơn lẻ.

DeepSeek Web Client còn có một nguyên tắc có ích cho DeckAgent: **Host state → Remote API → Client Model → UI → React**. Host là nguồn dữ liệu chính thức; component không trực tiếp giữ trạng thái lâu dài của nghiệp vụ. Đây sẽ là ranh giới cho Deck State và Canvas.

Nguồn chính: [DeepSeek Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md), [Base composition](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml), [Web composition](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/cordis.patch.yml), [Web Client architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web-client.md).

---

## 2. Hình thành codebase theo chuỗi giá trị

### Chặng A — Từ source upstream đến một DeckAgent có thể khởi động

**Giá trị tạo ra:** Nhóm có một nền tảng chạy được, biết chính xác những thành phần nào do DeepSeek cung cấp và có thể phát hiện lỗi tích hợp trước khi viết nghiệp vụ presentation.

Đầu tiên, khóa một commit upstream và giữ một snapshot nguyên bản làm nơi đối chiếu. Chạy thử DeepSeek trên môi trường đích, đặc biệt là Windows, để phân biệt lỗi có sẵn của upstream với lỗi do DeckAgent tích hợp. Lưu các thông tin về Node, pnpm, build artifacts, native dependencies, lệnh khởi động và effective Cordis composition.

Từ snapshot đó, tạo repository/application DeckAgent mới. Chuyển các phần **workspace/build/boot tối thiểu** cần để một plugin Cordis được nạp và hoạt động. Các nguồn nên xem ngay là root `package.json`, `pnpm-workspace.yaml`, `vendor` liên quan, Cordis loader/group/include và `packages/boot/app-boot`; dùng `apps/cli` làm bản tham chiếu cho profile-based boot.

Một plugin thử nghiệm phải đăng ký được service, nhận dependency, hoạt động và tự giải phóng khi tắt. Đây là bài kiểm tra cho cơ chế composition — chưa phải kiểm tra Agent.

**Điểm phải quyết định ở đây:** giữ lại bao nhiêu phần boot/profile của DeepSeek? Nếu việc dựng một launcher hoàn toàn riêng buộc phải viết lại nhiều logic profile, loader, diagnostics hoặc build, nên reuse thêm `app-boot`/launcher cần thiết. Không nên dành thời gian viết lại phần này chỉ để giảm số lượng packages kế thừa.

**Khi chặng A hoàn tất**, có thể đưa một plugin mới vào DeckAgent và biết nó được khởi động bằng cơ chế nào. Đây là nền tảng để đưa Agent Runtime vào mà không làm việc trong một codebase chưa build được.

### Chặng B — Từ Cordis đến một Agent thực thi công việc

**Giá trị tạo ra:** DeckAgent có năng lực AI thật, không chỉ là một ứng dụng tải model qua HTTP.

Tiếp theo, hình thành **một Agent Runtime tối thiểu có thể gọi tool**. Lần theo các contracts trong `packages/core/agent`, `agent-loop`, `session`, `scope`, `system-prompt`, `tools`, `packages/llm/llm` và một provider implementation. Đưa vào các providers phục vụ những interfaces/services bắt buộc qua dependency graph thực tế.

`dsh-base/cordis.patch.yml` là bản đối chiếu quan trọng: nó cho biết DeepSeek lắp các services thành một runtime như thế nào. Không nhất thiết mount mọi row ngay, nhưng những dịch vụ bắt buộc phải có implementation cụ thể, thay vì chỉ mang theo package definitions.

Kịch bản đầu tiên: người dùng gửi một câu hỏi, Agent gọi model, model gọi một tool đơn giản, tool trả kết quả, Agent hoàn thành turn. Nếu chỉ có response từ model mà không có tool call đi qua Tool Pipeline, chặng này chưa hoàn thành.

Sau khi vòng chạy đó thành công, phát triển runtime đến mức đủ dùng cho DeckAgent:

- **File Tools và Working Directory:** Agent có thể tạo và đọc HTML drafts trong default workspace.
- **Sandbox và Permissions:** các thao tác bị cấm phải được chặn; ưu tiên cơ chế filesystem an toàn có sẵn. Trên Windows phải kiểm tra đường chạy PowerShell/sandbox tương ứng.
- **Session Persistence:** conversation tồn tại sau Host restart, không chỉ lưu trong bộ nhớ.
- **Model configuration và credentials:** model/provider được chọn có thể dùng thật; không để secrets đi vào log hoặc nội dung slide.
- **Attachment handling:** chuẩn bị đường nhận và đọc tài liệu/ảnh người dùng cho các bước tiếp theo.

Những thành phần này được bổ sung theo nhu cầu của hành vi tiếp theo, nhưng phải được kiểm tra cùng nhau. Ví dụ, File Tools có thể đã đăng ký ở Host nhưng chưa xuất hiện trong **Agent Preset/scope**; đó là lỗi composition, không phải lý do để sửa Agent Loop.

**Khi chặng B hoàn tất**, Agent có thể nhận request, sử dụng tool để tạo file, tuân thủ quyền truy cập và khôi phục conversation. Nó đã đủ khả năng làm backend cho UC-001.

**Đây là điểm dừng của công việc về Agent infrastructure cho demo.** Các khả năng như multi-agent orchestration hoặc custom Agent Loop chỉ được mở rộng khi có use case hoặc lỗi thực tế yêu cầu.

### Chặng C — Từ Agent Runtime đến một Local Web có thể sử dụng

**Giá trị tạo ra:** Người dùng tương tác với DeckAgent mà không cần terminal; nhóm không phải xây lại Chat, Session History và Model Settings.

Đưa Host đến browser theo từng nhóm phụ thuộc:

```text
Host Agent / Session services
           ↓
Web Server + API Gateway + Controllers
           ↓
Browser Connection + Client Modules + Client Models
           ↓
UI Slots + Renderer + Layout + Session/Workspace adapters
           ↓
Conversation + Chat/Composer + Settings + History
           ↓
Right Sidebar + Dockkit
```

Ở phía Host, ưu tiên reuse Session Controller, Settings/Workspace Controllers, API Gateway và các streams đã có. Ở phía Client, giữ lại browser boot và generated API contracts thay vì chỉ copy React components.

Sau khi có chat hoạt động, kiểm tra **model selection, elapsed/status, activities, stop, reload, history và khả năng quay lại một chat cũ**. Đối chiếu từng behavior với yêu cầu DeckAgent; chỉ sửa behavior thật sự khác.

Cấu hình sản phẩm theo V1: một workspace ngầm định, một chat tương ứng một deck; không mở Marketplace/Plugin Manager UI nếu không cần. Tuy nhiên, đừng nhầm phần quản lý plugin trên giao diện với **Cordis Plugin System**; các backend services vẫn có thể cần thiết dù không có UI.

Cần kiểm tra kỹ phần Models: DeepSeek có sẵn settings và adapters, nhưng V1 DeckAgent yêu cầu **nhiều provider configurations, custom model APIs, lựa chọn model theo chat và tính ổn định của model trong mỗi request**. Không tuyên bố reuse đạt yêu cầu cho đến khi kiểm thử những hành vi đó.

**Khi chặng C hoàn tất**, nhóm đã có một **DeckAgent Web Baseline**: người dùng có thể gửi request cho Agent, dùng tools, xem hoạt động, chọn model và xem lại lịch sử. Từ đây, việc tiếp tục xây các modules chung chỉ hợp lý nếu chúng chặn UC-001.

---

## 3. Biến Agent thành một hệ thống tạo presentation

Ở điểm này, DeckAgent đã có Agent và Web UI. Ba phần còn thiếu không được coi là một việc duy nhất:

1. **Deck Canvas**: cách người dùng xem nhiều slides.
2. **Deck Domain**: nơi lưu dữ liệu deck chính thức.
3. **Publication Workflow**: điều kiện để một draft của Agent trở thành slide hoàn thành.

Tách ba phần này cho phép thử từng ranh giới bằng dữ liệu đơn giản trước khi giao toàn bộ cho Agent.

### Chặng D — Đưa một deck mẫu lên Right Sidebar

**Giá trị tạo ra:** Quyết định tận dụng Right Sidebar được xác nhận bằng trải nghiệm thật trước khi phụ thuộc vào luồng Agent.

Dùng extension APIs của `ui-sidebar-right` và UI Slots để đăng ký một custom `Deck` tab. `ui-plan/src/client/index.ts` là ví dụ hữu ích về cách khai báo tab type, body và điều hướng tới một resource. Trình xem deck cần hiển thị HTML slides theo tỷ lệ 16:9, cho chuyển slide, hiện thumbnails hoặc danh sách slides và có trạng thái chờ/hoàn thành.

Ở giai đoạn này, dùng slides mẫu. Kiểm tra resize, fullscreen, đóng/mở lại tab, chiều rộng nhỏ và việc giữ slide đang xem khi dữ liệu thay đổi. HTML cần chạy trong môi trường có isolation thích hợp; không để tài liệu sinh ra tự do thực thi quyền của ứng dụng.

**Điểm quyết định:** tiếp tục dùng Right Sidebar nếu đáp ứng việc xem, điều hướng và mở rộng deck. Chỉ xem xét Custom Main Workspace khi có giới hạn đo được, chẳng hạn diện tích, navigation hoặc lifecycle không đáp ứng nhu cầu. Không thay layout chỉ vì sở thích kiến trúc.

**Khi chặng D hoàn tất**, DeckAgent đã có bề mặt hiển thị presentation. Nó chưa phụ thuộc vào cách model tạo HTML.

### Chặng E — Biến Canvas thành một cửa sổ của Deck State chính thức

**Giá trị tạo ra:** Deck tồn tại ngoài Agent turn và ngoài bộ nhớ trình duyệt. Các bước về sau có thể phát triển hoặc sửa slide mà không mất dữ liệu.

Thiết kế Deck Domain ở Host, có thể dựa trên `storage/storage-domain`. Cần quản lý ít nhất:

- liên kết **Session ↔ Deck** (một deck mỗi chat);
- outline proposal hiện tại và confirmed outline;
- stable slide IDs, slide order, revision;
- trạng thái pending/published/failed phù hợp;
- content reference hoặc bản HTML đã công bố;
- trạng thái tạo deck để phục hồi sau lỗi.

Nội dung HTML lớn và metadata có thể nằm ở các nơi lưu khác nhau, nhưng **revision không được trỏ tới nội dung chưa được lưu thành công**. Không lấy việc file trong workspace vừa thay đổi làm bằng chứng rằng slide đã hoàn thành.

Đường kết nối lên UI cần đúng với Web Client của DeepSeek: **Host Deck Service → Remote API → Client Deck Model → Deck Tab**. `domain/changed` là event trong Host, không phải một giao thức đồng bộ browser. Do đó, Client phải đọc được snapshot đầy đủ khi kết nối/reconnect và theo dõi cập nhật sau đó.

Kiểm thử bằng một deck giả được tạo từ Host: thêm slide, cập nhật revision, đổi thứ tự, reload trình duyệt, restart Host, mở lại đúng chat. Nếu dữ liệu hoặc thứ tự không giữ được, chưa nên đưa Agent vào.

**Khi chặng E hoàn tất**, Deck Canvas hiển thị một tài liệu bền vững, không phải một danh sách file tạm hay state của React. Chính nền tảng này sẽ giảm chi phí cho UC-002 và UC-006.

### Chặng F — Cho Agent công bố một slide thật

**Giá trị tạo ra:** Hình thành đường đi đầu tiên từ model đến presentation mà người dùng nhìn thấy.

Giữ File Tools của DeepSeek để Agent tạo HTML draft trong workspace. Thêm một **model-callable `publish_slide` tool** cho DeckAgent. Tool xác minh Session/deck/slide identity, nguồn HTML, chính sách truy cập và việc ghi revision. Chỉ sau khi commit thành công, Deck Service mới báo slide đã published; Canvas nhận bản đã công bố qua Client Model.

Một lần chạy tối thiểu:

```text
User request
   → Agent creates HTML draft with File Tools
   → Agent calls publish_slide
   → Deck Service commits the slide revision
   → Deck Client Model updates
   → Deck Tab shows the finished slide
```

Kiểm thử cả trường hợp Agent dừng giữa lúc viết draft: Canvas không được nhận một slide lỗi hoặc nửa nội dung. Việc đăng ký tool ở Cordis Host chưa đủ; model phải nhìn thấy tool qua đúng Agent Preset/scope.

DeepSeek có tool `present` và generic file preview, nhưng chúng **không thay thế** Deck Domain với stable slide IDs, order và revisions.

**Khi chặng F hoàn tất**, DeckAgent đã tạo được một slide bằng Agent thật và có thể lặp lại quá trình đó cho nhiều slide. Phần còn thiếu của UC-001 chủ yếu là workflow và kiểm tra ràng buộc nghiệp vụ.

### Chặng G — Hoàn thành UC-001 theo đúng request boundaries

**Giá trị tạo ra:** Demo đầu tiên chứng minh DeckAgent làm được một nhiệm vụ sản phẩm hoàn chỉnh, không chỉ ghép được các packages.

Từ capabilities đã chạy, phát triển workflow:

1. Người dùng gửi yêu cầu tạo presentation và tài liệu liên quan.
2. Agent đề xuất **current outline** trong conversation: overview và nội dung dự kiến của từng slide, cho phép mở/đóng phần chi tiết.
3. Request đề xuất outline **kết thúc**. Chưa xây slide và chưa mở Canvas cho draft.
4. Người dùng có thể yêu cầu sửa outline qua conversation hoặc xác nhận. Confirmation thông thường là **một request mới**, chỉ áp dụng cho current outline.
5. Host lưu confirmed outline dưới dạng read-only. Agent tạo từng slide dựa trên bản đã xác nhận.
6. Canvas thể hiện những slide đã hoàn thành và còn chờ. Không tự đổi slide người dùng đang xem.
7. Agent kết thúc bằng thông báo những gì đã tạo, assumptions, placeholders và những thông tin chưa kiểm chứng.

DeepSeek `ui-plan` và Plan Review hữu ích về cơ chế hiển thị; **lifecycle Plan Mode không được coi là lifecycle của DeckAgent Outline**. Điều kiện xác nhận phiên bản outline hiện tại phải được kiểm tra ở Host, không chỉ được nhắc bằng prompt.

Để demo có giá trị, yêu cầu Agent tạo **một presentation nhiều slide từ prompt thật**. Kiểm tra bằng tình huống có outline phải sửa trước khi xác nhận. Phân biệt trạng thái generated HTML, published slide và pending slide. Hoàn thành demo khi luồng chính chạy xuyên suốt mà không sử dụng slide mock ở đầu ra.

**Đây là điểm dừng ưu tiên để có demo cho giảng viên.** Các alternative flows chưa đạt phải được ghi rõ; không đổi tên demo thành “V1 hoàn chỉnh”.

---

## 4. Dùng demo để phát triển V1 và tìm contributions

### Chặng H — Reliability và các use cases tiếp theo

**Giá trị tạo ra:** DeckAgent không chỉ tạo ra một deck lần đầu mà còn giữ và cải thiện công việc đã tạo.

Sau demo, bắt đầu từ các lỗi có thể mất dữ liệu: stop giữa quá trình tạo slide; tool/model failure; browser reload khi Host đang chạy; Host restart; mở lại chat cũ. Reuse cancellation, Session Persistence, History, Activity Log và error mechanisms của DeepSeek, nhưng thêm trạng thái lỗi và recovery của Deck Domain.

Từ các phần đã có, mở rộng hai use cases gần nhất:

- **UC-006 — Reopen earlier work:** mở lại conversation, model được chọn và đúng deck đã lưu; không gửi request mới, không sửa deck. Điều kiện hạn chế chuyển chat khi request còn active phải được kiểm tra theo V1.
- **UC-002 — Edit an existing deck:** dùng stable slide IDs và revisions để sửa đúng phạm vi yêu cầu. Slides ngoài phạm vi phải giữ nguyên. Request sửa rõ ràng không tạo outline mới; một yêu cầu chưa rõ phạm vi cần được làm rõ trước khi sửa.

Bổ sung đầy đủ attachment behavior và nghiên cứu riêng cơ chế **tạo ảnh mới**, vì V1 cần khả năng này nhưng chưa xác định được implementation tương thích với ràng buộc model/provider đã chọn.

Mỗi use case được đánh giá bằng **behavior thật**, không phải chỉ xác nhận rằng plugin hoặc API đã có.

### Chặng I — Từ lỗi quan sát được đến technical improvements

**Giá trị tạo ra:** Nhóm có dữ liệu để chọn đóng góp kỹ thuật thay vì đặt ra một improvement chưa có bằng chứng.

Giữ một tập prompts và tài liệu đầu vào cố định, lưu output decks cùng kết quả kiểm thử. Theo dõi các vấn đề như overflow, bố cục khó đọc, slide thiếu nhất quán, sai nội dung, thay đổi ngoài phạm vi trong multi-turn editing, độ ổn định khi stop/recovery và chi phí tích hợp.

Một hướng cải thiện chỉ nên được chọn khi có đủ bốn yếu tố: **vấn đề có thể tái hiện → nguyên nhân có thể khảo sát → giải pháp thay thế → phép đo trước/sau**. Ví dụ, nếu nhiều slides bị overflow, nhóm có thể thử một vòng render–inspect–revise rồi đo tỷ lệ lỗi. Ví dụ này là giả thuyết nghiên cứu, không phải kết luận về hạn chế hiện tại của DeepSeek.

Song song, loại các source packages không còn cần thiết. Bắt đầu bằng việc gỡ khỏi Cordis composition, sau đó kiểm tra dependency graph và regression trước khi xóa code. Không dùng số dòng source được xóa làm chỉ số đóng góp.

Ghi rõ provenance: upstream commit, packages kế thừa, packages đã sửa, modules do DeckAgent phát triển và kết quả kiểm thử. Việc chọn nguồn mở và hình thức repository **không tự quyết định** mức độ đóng góp học thuật; tiêu chí đó phải được làm rõ với giảng viên.

---

## 5. Các cổng quyết định để không sa vào infrastructure

Không cần hoàn thiện một lớp theo nghĩa tuyệt đối. Chỉ chuyển sang lớp tiếp theo khi hành vi đang kiểm chứng hoạt động và nền tảng đủ ổn định.

| Cổng | Bằng chứng cần có | Quyết định được mở khóa |
|---|---|---|
| **G1 — Boot** | DeckAgent build/boot được Cordis, inject service và unload plugin đúng | Có thể tích hợp Agent |
| **G2 — Agent** | Một turn thật: model → tool → kết quả; file access và session persistence hoạt động | Có backend cho Web và Slide Generation |
| **G3 — Web** | Chat, Models, History, Activity/Stop và Sidebar dùng được trên Local Web | Có thể phát triển trực tiếp trên product surface |
| **G4 — Viewer** | Deck Tab hiển thị nhiều slides, resize/fullscreen và giữ selection | Quyết định Right Sidebar có phù hợp |
| **G5 — Deck** | Host lưu deck; Browser nhận cập nhật; reload/restart khôi phục đúng | Có thể nối Agent với slide publication |
| **G6 — Publish** | Agent tạo và publish slide thật; draft lỗi không xuất hiện | Có thể hoàn thành Outline Workflow |
| **G7 — Demo** | Outline → confirmation → nhiều published slides → final response, từ model thật | Có bản demo UC-001 đáng đánh giá |
| **G8 — V1** | UC-002, UC-006 và các behavior V1 còn lại qua tests | Có baseline để làm improvement research |

**Quy tắc xử lý khi bị chặn:**

- Nếu phải kéo theo nhiều packages hơn dự kiến, **ưu tiên một dependency group lớn nhưng chạy đúng** hơn là mất thời gian tái tạo các interfaces đã có.
- Nếu Cordis mount plugin nhưng Agent không thấy tool, kiểm tra **scope/preset/service injection** trước khi sửa Agent Loop.
- Nếu UI trông đúng nhưng sai behavior, sửa ở **domain/workflow boundary**, không thay toàn bộ UI framework.
- Nếu một package của DeepSeek phải sửa sâu để DeckAgent hoạt động, ghi lý do và đánh giá extension point trước khi quyết định thay thế.
- Nếu việc cleanup không chặn demo, để sau G7.
- Nếu một cổng không vượt qua sau nhiều lần thử tích hợp, so sánh chi phí với **giữ lại nhiều phần composition gốc hơn**. Đây vẫn là source reuse, không nhất thiết đổi sang fork toàn bộ ứng dụng.

---

## 6. Dependency map dùng khi chọn packages

Danh sách này là **điểm bắt đầu để trace source**, không phải manifest cuối cùng. Chỉ chốt package inventory khi đã chạy được cổng tương ứng.

| Năng lực cần có | Nhóm source DeepSeek cần xem trước | Vì sao cần chung một dependency group |
|---|---|---|
| Build / plugin boot | Root workspace, `vendor`, `boot/app-boot`, Cordis loader/include/group, CLI/profile references | Boot có config, loader và package resolution riêng |
| Agent turn | `core/agent`, `agent-loop`, `session`, `scope`, `system-prompt`, `tools`, `llm/llm` | Turn cần message history, prompt, tool schemas và model call |
| Safe filesystem | `fs/*`, sandbox, policy, approval, working-directory, attachment services | Tool execution cần bảo vệ filesystem và nguồn dữ liệu |
| Durable chat | Session Persistence, Projection, Query/History, title packages | Conversation không thể chỉ nằm trong Agent memory |
| Browser Host | Web server/runtime, API Gateway, remote assembly, Session/Workspace/Settings Controllers | Browser cần API, stream, authentication và reconnect |
| Browser UI | Client modules/connection/store, UI Slots, Renderer, Layout, Session/Workspace adapters, Conversation | React UI phụ thuộc Client Models và browser boot |
| Preview | Right Sidebar, Dockkit, client resources, document-preview patterns, UI Plan example | Deck Tab cần tab registration, docking và navigation |
| Persistent deck | `storage/storage-domain` + backend, API Controller/Client Model patterns | Metadata cần durable commit và browser synchronization |
| Deck publication | File Tools, scoped Tool Registry, prompt sections | Agent phải có cách công bố slide chính thức |

### Kiểm tra một dependency group như thế nào?

Đối với package được chọn, trace theo thứ tự:

**(1)** package manifests (`dependencies`, `peerDependencies`, exports);  
**(2)** Cordis `inject` và service providers;  
**(3)** bundle/profile `cordis.patch.yml`, kể cả Agent Preset scope;  
**(4)** `dsh.client.inject` và browser roster nếu có;  
**(5)** generated API, native modules và build/test artifacts.

Kết quả phải là **một tập packages được chứng minh bằng build và runtime test**, không phải một dependency graph chỉ vẽ trên giấy.

---

## 7. Cách quản lý tiến độ và bằng chứng

Không cần tạo tài liệu dài cho mỗi package. Chỉ giữ một **Baseline Log** ngắn cho từng cổng, gồm: upstream commit; nhóm source đã đưa vào; cấu hình Cordis; hành vi đã thử; kết quả; lỗi còn lại; quyết định reuse/extend/replace. Mỗi bản ghi phải giúp người khác tiếp tục tích hợp mà không phải nghiên cứu lại các dependency cũ.

Ưu tiên trong ngắn hạn:

1. **G1–G3:** đầu tư vừa đủ vào nền tảng để dùng được Agent trên Local Web.
2. **G4–G7:** tập trung vào Presentation Domain và demo UC-001.
3. **G8 và sau đó:** mở rộng UC, kiểm thử lỗi, chọn cải thiện kỹ thuật dựa trên kết quả.

Không cần hoãn demo để rút gọn source, đổi namespace packages, xây editor trực tiếp hoặc thêm export — các việc đó không tạo giá trị cho mốc UC-001.

**Điều kiện đổi kế hoạch:** một giả định reuse không vượt qua được cổng kiểm chứng, hoặc một behavior V1 không thể đáp ứng bằng extension API hiện có. Khi đó, thay đổi **phần nhỏ nhất đang chặn giá trị tiếp theo**. Tránh thay cả kiến trúc chỉ vì một capability gặp khó khăn.

---

## 8. References

### DeepSeek Harness

1. [Architecture: Cordis, profiles, bundles, Agent turn](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)
2. [Root package manifest](https://github.com/deepseek-ai/deepseek-harness/blob/master/package.json)
3. [pnpm workspace](https://github.com/deepseek-ai/deepseek-harness/blob/master/pnpm-workspace.yaml)
4. [App Boot](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md)
5. [Base bundle](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/README.md)
6. [Base Cordis composition](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml)
7. [Web bundle](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/README.md)
8. [Web Cordis composition](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/cordis.patch.yml)
9. [Agent Loop: lifecycle and persistence](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-loop/README.md)
10. [Agent Loop dependency manifest](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-loop/package.json)
11. [Tools dependency manifest](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/tools/package.json)
12. [Web Client architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web-client.md)
13. [Conversation dependency manifest](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/package.json)
14. [Right Sidebar](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-right/README.md)
15. [Right Sidebar tab registry](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-right/src/client/tab-registry.ts)
16. [UI Plan extension example](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plan/src/client/index.ts)
17. [Storage Domain](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/storage/storage-domain/README.md)

### DeckAgent — yêu cầu hành vi

18. [V1 scope and constraints](SCOPE.md)
19. [UC-001 — Create a first draft](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-001.md)
20. [UC-002 — Edit a deck](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-002.md)
21. [UC-003 — Send a request](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-003.md)
22. [UC-006 — Reopen earlier work](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-006.md)

---

*Phạm vi xác minh: cách tổ chức packages, dependencies và extension points được đối chiếu từ source DeepSeek; các hành vi sản phẩm được đối chiếu từ DeckAgent specifications. Thứ tự tích hợp và thời điểm dừng là đề xuất kỹ thuật. Chưa có bằng chứng từ một bản build DeckAgent mới chứng minh toàn bộ các giai đoạn sẽ thành công hoặc đạt một thời gian triển khai cụ thể.*
