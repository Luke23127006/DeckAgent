# DeckAgent — Parallel Implementation Plan for a Three-Person Team

**Ngày lập:** 19/10/2026  
**Phương pháp:** Tự xây Agent Harness + reuse Cordis\
**Tổ chức:** 3 thành viên, 7 task groups, 21 implementation tasks  
**Điểm xuất phát khi lập plan 19/10:** Repository chỉ có tài liệu. Hiện trạng implementation xem `PROGRESS.md`.\
**Mục tiêu gần nhất:** Demo UC-001 — tạo presentation qua hội thoại, xác nhận outline, tạo và hiển thị các slides hoàn thành.

## 1. Quyết định và cách đọc kế hoạch

**Chỉ dẫn chốt 20-10-2026:** Chỉ reuse Cordis và bộ dependencies/plugins vendor hiện có; Agent Harness do DeckAgent tự xây. Logic dùng chung đặt trong `packages/`, application wiring trong `apps/`. TASK-002-A và boot foundation được điều chỉnh theo chỉ dẫn này. Những đoạn còn mô tả reuse Host/API/Web hoặc các subsystems của DeepSeek ở nhóm sau là phương án cũ cần rà soát trước khi triển khai, không phải phê duyệt nhập Harness.

DeckAgent là ứng dụng Local Web có Agent Runtime, Tools, Session và Presentation Domain do dự án sở hữu. [Runtime contracts và handoff TASK-002-A](task-002-a-agent-runtime.md) mô tả interfaces hiện tại để 002-B/C phát triển độc lập.

Kế hoạch ưu tiên **một chuỗi kết quả có thể chạy và kiểm tra**:

```text
Repository có thể build
    -> Cordis có thể khởi động plugins
    -> Agent có thể gọi model và lưu Session
    -> Agent có thể dùng Tools; Browser có thể kết nối Host
    -> DeckAgent Web có Chat, Models, History và Right Sidebar
    -> Agent có thể publish một slide lên Deck Canvas
    -> UC-001 chạy từ prompt đến presentation
    -> Phục hồi, mở lại và chỉnh sửa deck
```

Mỗi `TASK-00X` là **một nhóm công việc**, không phải một Jira issue. Trong nhóm có ba issues `TASK-00X-A`, `TASK-00X-B` và `TASK-00X-C` được thiết kế để **bắt đầu song song**. Ba issues chỉ cần hoàn thành trước **Integration Gate** của nhóm. Một task hoàn thành sớm có thể chuẩn bị việc độc lập của nhóm kế tiếp, nhưng chưa được coi baseline tiếp theo là ổn định khi Gate hiện tại chưa đạt.

**Điều kiện để song song thực sự:** Nhóm phải thống nhất các interfaces, thư mục sở hữu và fixtures tối thiểu ngay khi mở task group. Những dependencies chưa hoàn thành phải được thay bằng mocks hoặc fixtures; không được đợi người khác viết xong rồi mới bắt đầu.

### Các mốc giá trị

| Mốc | Sau nhóm | Sản phẩm dùng được |
| --- | --- | --- |
| M1 — Foundation | TASK-001 | Repository mới build được; Cordis đăng ký, chạy và tháo plugin được. |
| M2 — Working Agent | TASK-002 | Agent gọi model thật, hoàn tất lượt hội thoại và lưu Session. |
| M3 — Agent + Browser | TASK-003 | Browser giao tiếp với Host; Agent sử dụng File Tool tạo file. |
| M4 — DeckAgent Web | TASK-004 | Chat, Models, History và Right Sidebar hoạt động trong Local Web. |
| M5 — Slide Pipeline | TASK-005 | Agent publish HTML slide; Deck Canvas nhận và hiển thị revision đã lưu. |
| **M6 — UC-001 Demo** | **TASK-006** | **Outline → Confirm → Generate → Progressive Canvas → Final Response.** |
| M7 — V1 Extension Baseline | TASK-007 | Stop/recovery, mở lại deck và chỉnh sửa slide theo phạm vi được kiểm chứng. |

**Phạm vi của M6:** Đây là *working vertical slice* để demo, chưa đồng nghĩa toàn bộ alternative flows của UC-001 hoặc toàn bộ V1 đã hoàn tất. V1 còn những yêu cầu như tạo ảnh mới; cơ chế thực hiện chưa được chốt. Không được tự động đổi scope của V1 để khớp với demo.

## 2. Phân công sở hữu dài hạn

| Thành viên | Phần chịu trách nhiệm chính | Nguyên tắc phối hợp |
| --- | --- | --- |
| **A — Platform / Host** | Root workspace, Cordis composition, Host Services, Deck Domain, API contracts và Persistence. | Sở hữu các cấu hình tích hợp chung và hợp nhất packages vào application. |
| **B — Web / UX** | Web Client, Conversation, Model Settings UI, Outline UI, Deck Canvas và Client Models. | Làm việc qua Host API; không truy cập trực tiếp Host internals. |
| **C — Agent / Tools / Integration** | Agent capabilities, File Tools, `publish_slide`, generation workflow, integration tests và test scenarios. | Làm việc qua Tools và Deck Service contracts; không sửa Agent Loop nếu plugin đã đủ. |

Vai trò trên là ownership, không phải ranh giới kiến thức. Mọi thành viên đều phải hiểu luồng end-to-end. Chủ sở hữu một module chịu trách nhiệm sửa lỗi cuối cùng, nhưng người khác có thể viết tests và review.

### Quy tắc tránh chồng chéo

1. **Một file cấu hình chung có một người merge.** A là integration owner của root manifests, lockfile, Cordis composition và application wiring. B và C đề xuất thay đổi qua commit riêng, không tự ý sửa cùng file trên nhiều branches.
2. **Contracts trước, implementation sau.** Ở đầu mỗi task group, thống nhất input/output của các services cần dùng chung. B và C có thể dùng mocks để phát triển độc lập.
3. **Một người sở hữu mỗi package được sửa trực tiếp.** Khi phải thay đổi code được kế thừa từ DeepSeek, ghi nhận lý do và giao một chủ sở hữu; ưu tiên extension APIs trước.
4. **Cùng một upstream commit.** Source và manifests của các DeepSeek packages phải lấy từ cùng một commit; không chọn package từ nhiều versions mà chưa kiểm chứng compatibility.
5. **Không chặn nhau vì task hoàn thành sớm.** Có thể chuẩn bị unit tests, UI mocks hoặc tài liệu integration của nhóm tiếp theo; chỉ merge thay đổi phụ thuộc baseline mới sau khi Gate hiện tại đạt.
6. **Một task chỉ được coi hoàn thành khi có bằng chứng.** Mỗi issue có phạm vi code, test/smoke scenario, kết quả và những giới hạn còn lại.

## 3. TASK-001 — Repository and Cordis Foundation

**Giá trị được tạo:** Từ một repository chỉ có tài liệu thành một source workspace có thể build và chạy các Cordis plugins. Đây là nền tảng cho mọi packages tiếp theo.

**Điều kiện đầu nhóm:** Chốt upstream commit, Node/pnpm version theo DeepSeek source, cấu trúc thư mục dự kiến và ownership của các file chung.

| Issue | Owner | Công việc độc lập và kết quả giao |
| --- | --- | --- |
| **TASK-001-A — Establish DeckAgent Workspace** | A | Thiết lập monorepo, package manager, TypeScript/build settings, scripts tối thiểu và nơi đặt application/packages. Giữ nguyên tài liệu trong `docs/`. Bàn giao root build chạy được với một fixture package. |
| **TASK-001-B — Bring Cordis Boot Dependencies** | B | Giữ Cordis và bộ vendor dependencies/plugins đã pin, package identities và source provenance. Application boot do DeckAgent tự viết bằng Cordis; `app-boot` và utilities của Harness đã được loại khỏi hướng triển khai sau chỉ dẫn 20-10. |
| **TASK-001-C — Create Foundation Smoke Tests** | C | Viết plugin fixture có service registration, dependency injection, lifecycle và cleanup. Tạo smoke test chạy độc lập với app chính, cùng checklist cho Windows và build. |

**Tích hợp:** A liên kết tập packages của B vào workspace và chạy fixture của C. Các task không sửa cùng file root; những yêu cầu thay đổi root config được B/C ghi rõ để A áp dụng.

**Gate 001 — PASS khi:** cài dependencies, build và khởi động được; Cordis load một plugin, resolve service dependency và cleanup khi unload; không có missing-module errors chưa giải thích được.

**Điểm cần chú ý:** Repo DeepSeek dùng `vendor/`, workspace packages, generated artifacts và boot scripts. Danh sách đưa vào phải theo dependency closure thật, không chỉ theo thư mục `packages/core`. Chưa cần Web Client hoặc Agent Runtime tại Gate này.

## 4. TASK-002 — Working Agent and Durable Session

**Giá trị được tạo:** Một Agent có thể nhận request, gọi model thật, tạo kết quả và giữ lịch sử sau khi Host restart.

**Đầu vào:** Cordis foundation ở Gate 001.

| Issue | Owner | Công việc độc lập và kết quả giao |
| --- | --- | --- |
| **TASK-002-A — Compose Agent Runtime** | A | Tự viết Runtime, model/storage contracts, prompt builder, Memory Session Store, Tool Registry và Cordis plugin trong `packages/agent/runtime`; `apps/agent-runtime` boot. Model fixture và no-op tool chứng minh loop trong tests; fake demo trong app đã bỏ ở 002-C. |
| **TASK-002-B — Enable Model Providers and Credentials** | B | Viết provider adapter theo `ModelAdapter` của DeckAgent; cấu hình credentials ngoài history/logs. Kiểm tra provider/model/config truyền đúng và lỗi cấu hình rõ. UI model selection để TASK-004. |
| **TASK-002-C — Enable Session Persistence** | C | Triển khai durable backend theo `SessionStore` của DeckAgent; thống nhất metadata/định dạng lưu với A khi cần mở rộng contract. Kiểm tra conversation được lưu, khôi phục và đọc lại sau restart. |

**Tích hợp:** Các tasks dùng contracts do DeckAgent định nghĩa. A ghép composition; B cung cấp `agentModel`, C cung cấp `agentSessions` thay Memory Store. Không nhập hoặc sửa Agent Loop của DeepSeek. Chi tiết APIs, scope và giới hạn ở [Runtime handoff](task-002-a-agent-runtime.md).

Implementation C dùng [SQLite Session Persistence](task-002-c-session-persistence.md),
metadata provider/model và CLI mở lại theo ID. Scope một Host local; không coi
batch transactions là cơ chế recovery hoặc khóa Agent turn giữa nhiều Hosts.

**Gate 002 — PASS khi:** Một request gọi model thật và hoàn tất; Session chứa user/assistant events; restart Host vẫn đọc lại được lịch sử. Không cần Web UI.

**Điểm cần chú ý:** Runtime chỉ phụ thuộc interfaces model/storage và Tool Registry của DeckAgent; Cordis quản lý composition/lifecycle. Memory Store không chứng minh persistence hoặc restart. File Tools, permissions và sandbox đầy đủ thuộc TASK-003. Build thành công không thay cho kiểm thử Runtime và Gate 002.

## 5. TASK-003 — Tool Execution and Host–Browser Communication

**Giá trị được tạo:** Agent có thể thao tác với files; browser có đường truyền để gửi request và nhận kết quả Agent.

**Đầu vào:** Agent có thể chạy từ Gate 002. Đầu nhóm thống nhất các service/API contracts cần để kết nối Host và Browser.

| Issue | Owner | Công việc độc lập và kết quả giao |
| --- | --- | --- |
| **TASK-003-A — Enable File Tools and Safety** | A | Tích hợp Filesystem Tools, Working Directory, Sandbox, approval/permission policy và các providers cần thiết. Chứng minh Agent tạo được một HTML file trong workspace và không ghi ngoài phạm vi cho phép. |
| **TASK-003-B — Establish Host API** | B | Tích hợp Web Host, Connection/API Gateway và Session Controller của DeepSeek. Bàn giao API/stream có thể gửi request, theo dõi progress và đọc Session. Chủ động kiểm tra đường sinh typed contracts. |
| **TASK-003-C — Establish Browser Runtime** | C | Tích hợp browser module boot, client connection, UI Slots, Renderer và Layout foundation. Dùng API mock/test server theo contract đã chốt; chưa cần Chat UI hoàn chỉnh. |

**Tích hợp:** B/C thống nhất Host–Client contracts ngay đầu nhóm; không thay đổi wire protocol riêng. A chịu trách nhiệm ghép các capabilities vào application composition; B/C kiểm thử một round-trip thật.

**Gate 003 — PASS khi:** Browser gửi được Agent request, nhận được phản hồi/trạng thái; Agent dùng File Tool tạo HTML file thật; sandbox policy được kiểm tra bằng một trường hợp bị từ chối.

**Điểm cần chú ý:** DeepSeek Web Client có boot graph, generated Remote descriptors, typed Client Models và UI Slots. Không thể coi việc import một React component là đã tích hợp xong capability. Windows là nền tảng ưu tiên, nên kiểm tra sớm quyền ghi file và shell behavior trên Windows.

## 6. TASK-004 — Usable DeckAgent Local Web

**Giá trị được tạo:** Một ứng dụng Local Web có giao diện thực để sử dụng Agent và có vị trí cho Deck Canvas.

**Đầu vào:** Host/Browser communication hoạt động tại Gate 003.

| Issue | Owner | Công việc độc lập và kết quả giao |
| --- | --- | --- |
| **TASK-004-A — Compose DeckAgent Web Host** | A | Lắp ghép Web profile/Agent Presets, một default workspace, settings và Session lifecycle. Tận dụng cấu hình Providers của DeepSeek. Tắt những UI features ngoài scope nếu không phá service dependencies. |
| **TASK-004-B — Assemble Conversation and Settings UI** | B | Tích hợp Chat, Composer, Model Selection/Settings, Session History, Status và Activity Log có sẵn. Kiểm tra các hành vi được yêu cầu bởi DeckAgent thay vì giả định upstream đã đáp ứng tất cả. |
| **TASK-004-C — Enable Right Sidebar and Sample Deck Tab** | C | Đưa Right Sidebar/Dockkit vào Web UI; đăng ký một custom Deck Tab hiển thị HTML slides mẫu, navigation, resize và fullscreen. Không phụ thuộc Deck Service ở nhóm này. |

**Tích hợp:** B sở hữu Conversation UI; C sở hữu Right Sidebar/Deck Tab. Mọi thay đổi ở shared Layout phải qua một chủ sở hữu đã chốt trước. A chịu trách nhiệm wiring. C có thể dùng sample slides tĩnh.

**Gate 004 — PASS khi:** User mở Local Web, chọn model, chat với Agent, xem Session History và mở Deck Tab chứa slides mẫu. Những tính năng ngoài scope không xuất hiện trong trải nghiệm chính.

**Điểm cần chú ý:** DeckAgent V1 có một default workspace, một deck cho mỗi chat, và các provider configurations riêng. Các yêu cầu này cần được kiểm tra; việc reuse UI/Host của DeepSeek không tự chứng minh đã đáp ứng. Right Sidebar chỉ lưu layout state; không thay cho durable Deck Storage.

**Điểm dừng infrastructure:** Sau Gate 004, không tiếp tục thu nhỏ source tree hoặc refactor boot system nếu không chặn UC-001. Chuyển ngay sang Presentation Domain.

## 7. TASK-005 — Persistent Slide Publication Pipeline

**Giá trị được tạo:** Agent có thể công bố một slide hoàn chỉnh, lưu trên Host và hiển thị trong Deck Canvas. Đây là foundation cho cả UC-001 và UC-002.

**Đầu vào:** Web App có custom Deck Tab từ Gate 004.

**Contract phải chốt trước khi ba tasks bắt đầu:** Session–Deck mapping, outline/slide identifiers, slide order, revision, `draft`/`published` status, content reference và kết quả/error của thao tác publish. Contracts phải đủ nhỏ để B và C dùng mocks ngay.

| Issue | Owner | Công việc độc lập và kết quả giao |
| --- | --- | --- |
| **TASK-005-A — Implement Authoritative Deck Service** | A | Xây Deck State trên Host: deck gắn với Session, slide identities, order, immutable revisions, metadata và persistent content. Expose Host API, snapshot sau reconnect và cập nhật state theo trình tự. |
| **TASK-005-B — Connect Deck Client Model to Canvas** | B | Xây client-side model nhận Deck snapshots/updates và cập nhật Deck Tab. Hiển thị pending/published slides, cho người dùng chọn slide và không tự đổi selection khi có slide mới. Dùng mock Deck API trong lúc A triển khai. |
| **TASK-005-C — Implement `publish_slide` Tool** | C | Đăng ký tool vào đúng Agent scope/preset. Tool đọc HTML draft trong workspace, kiểm tra identity, source/safety và gọi Deck Service để publish finished revision. Dùng fake Deck Service trong tests. |

**Tích hợp:** A cung cấp contract và persistence; B nối Client Model; C nối model-callable Tool. End-to-end test sử dụng **Agent → File Draft → publish_slide → Deck Service → API → Deck Canvas**.

**Gate 005 — PASS khi:** Agent công bố được một HTML slide; Canvas hiển thị đúng revision; một bản nháp chưa publish không xuất hiện; reload trang hoặc restart Host vẫn đọc lại slide đã lưu.

**Điểm cần chú ý:** `storage-domain` phù hợp lưu metadata có kiểm tra schema nhưng không tự tạo browser synchronization. Đường Host API/Client Model phải cung cấp snapshot sau reconnect. DeepSeek `present` là file-reference tool, không thay cho một Deck Service có slide IDs, revisions và confirmation rules. HTML phải được render trong sandbox có chính sách rõ ràng.

## 8. TASK-006 — UC-001: Outline to Presentation Demo

**Giá trị được tạo:** Người dùng có thể tạo một presentation thật qua hội thoại và xem các slides xuất hiện khi hoàn thành. Đây là **demo milestone ưu tiên cao nhất**.

**Đầu vào:** Slide Publication Pipeline từ Gate 005.

**Contract đầu nhóm:** Outline Proposal có identity/version, overview, planned slides, current proposal, confirmed outline và các transitions được phép. Confirmation phải nhắm đúng *current outline*; Host không cho publish trước confirmation.

| Issue | Owner | Công việc độc lập và kết quả giao |
| --- | --- | --- |
| **TASK-006-A — Implement Outline State and Confirmation Guard** | A | Lưu outline proposals/current outline; kiểm soát xác nhận và trạng thái read-only sau xác nhận. Chặn stale confirmation và chặn công bố slides khi chưa xác nhận. |
| **TASK-006-B — Implement Outline Conversation UI** | B | Hiển thị outline overview, chi tiết planned slide mở/đóng được, các suggested actions để confirm/cancel/revise. Hiển thị confirmed outline trong khi tạo slides. UI dùng mock Outline API trước khi nối Host. |
| **TASK-006-C — Implement Agent Presentation Workflow** | C | Xây instructions/tool usage để Agent đề xuất outline trong lượt đầu, chờ người dùng xác nhận, rồi dùng confirmed outline tạo nhiều HTML slides và gọi `publish_slide` lần lượt. Thực hiện báo cáo kết thúc theo UC-001. |

**Tích hợp:** Confirmation là một request mới sau khi outline proposal response đã kết thúc. Host là nguồn xác nhận trạng thái, không chỉ dựa vào prompt. Không bê nguyên Plan Mode approval lifecycle của DeepSeek sang Outline Workflow.

**Gate 006 — PASS khi:** Demo từ prompt thật thực hiện đầy đủ: gửi yêu cầu → nhận outline → xem planned slides → xác nhận → Canvas mở → slide hoàn thành được công bố dần → Agent đưa final response. Canvas không tự chuyển slide đang xem. Chạy thêm test cho stale confirmation và no-publish-before-confirm.

**Giới hạn cần ghi rõ trong demo:** Các alternative flows chưa được triển khai, generation of new images và những trường hợp model failure phức tạp phải được liệt kê là chưa hoàn tất nếu thực sự chưa có. Không gọi working vertical slice là hoàn thành 100% UC-001 hoặc V1.

## 9. TASK-007 — Recovery, History and Editing

**Giá trị được tạo:** DeckAgent chuyển từ một demo tạo lần đầu sang một ứng dụng có thể tiếp tục sử dụng: dừng an toàn, xem lại công việc cũ và chỉnh sửa slide mà không tái tạo cả deck.

**Đầu vào:** UC-001 chạy được từ Gate 006, dữ liệu deck có stable IDs và revisions.

| Issue | Owner | Công việc độc lập và kết quả giao |
| --- | --- | --- |
| **TASK-007-A — Complete Failure and Recovery Semantics** | A | Xử lý stop, model/tool failure, reload và Host restart. Giữ published revisions, không hiển thị HTML draft lỗi; phục hồi unfinished deck state. Kiểm tra Host restart không tự chạy lại request cũ. |
| **TASK-007-B — Connect Chat History and Deck History (UC-006)** | B | Mở lại chat với conversation, activities, selected model và deck đúng Session. Xác nhận thao tác mở history không gửi request mới và không thay đổi deck. |
| **TASK-007-C — Implement Scoped Slide Editing (UC-002)** | C | Cho Agent đọc slide revision hiện tại, chỉnh sửa những slides nằm trong request scope, publish revisions mới; giữ các slides ngoài scope nguyên vẹn. Không tạo outline mới cho follow-up editing. |

**Tích hợp:** A quản lý durability; B quản lý restore UI; C quản lý editing. C dùng Deck Service API có sẵn thay vì tự viết storage riêng. Nhóm kiểm thử cả trường hợp edits bị gián đoạn.

**Gate 007 — PASS khi:** Những slides đã hoàn thành vẫn tồn tại sau lỗi/restart; mở lại chat hiển thị đúng deck mà không làm việc mới; sửa một slide không thay đổi các slides ngoài phạm vi yêu cầu.

**Lưu ý:** Đây chưa phải toàn bộ V1. Còn cần kiểm thử UC alternatives, model/provider rules, attachments và cơ chế tạo ảnh mới theo scope đã thiết kế.

## 10. Dependencies giữa các task groups

| Task Group | Cần kết quả từ | Tại sao |
| --- | --- | --- |
| TASK-001 | Không | Tạo nền tảng source workspace và plugin boot. |
| TASK-002 | Gate 001 | Agent Runtime cần Cordis và các source dependencies chạy được. |
| TASK-003 | Gate 002 | File Tools và Web APIs cần Agent/Session đã hoạt động. |
| TASK-004 | Gate 003 | Conversation và Sidebar cần Host–Browser communication. |
| TASK-005 | Gate 004 | Deck Client/Canvas cần nền Web hoạt động; Tool cần Agent đang chạy. |
| TASK-006 | Gate 005 | UC-001 cần stateful Deck Service và pipeline publish slides. |
| TASK-007 | Gate 006 | Recovery, reopening và editing cần deck thật cùng slide revisions. |

**Dependency trong cùng một group:** Chỉ phụ thuộc vào *contracts đã chốt*, không phụ thuộc implementation hoàn chỉnh của đồng đội. Nếu một task thực tế không thể chạy với mock, hãy ghi rõ blocker và tách một integration task nhỏ, thay vì gọi nó là song song.

### Quy trình cho từng nhóm

1. **Kickoff ngắn:** Chốt upstream revision, các interfaces cần dùng chung, file ownership, test fixtures và Integration Gate.
2. **Ba branches song song:** A/B/C triển khai theo phạm vi; mỗi người có unit tests/smoke tests độc lập.
3. **Review theo boundaries:** Mỗi PR chỉ thay đổi modules thuộc ownership của issue; phần composition chung do integration owner merge.
4. **Tích hợp và kiểm thử:** Kết nối mocks thành services thật, chạy build và end-to-end smoke scenario trên Windows khi có thể.
5. **Đóng Gate:** Ghi PASS/FAIL, bằng chứng, phần deferred. Chỉ sau đó cập nhật stable baseline cho nhóm kế tiếp.

### Quy tắc đặt Jira Issues

- Parent/Group: `TASK-001 — Repository and Cordis Foundation`.
- Child issues: `TASK-001-A`, `TASK-001-B`, `TASK-001-C` (mã logic; Jira vẫn tạo issue keys riêng).
- Mỗi child issue ghi một owner, scope code, đầu ra, test, dependencies và acceptance evidence.
- Group chỉ Done khi Integration Gate PASS; không dùng trạng thái Done của cả ba child issues làm bằng chứng tích hợp.

## 11. Rủi ro có thể làm thay đổi phân công

| Rủi ro | Dấu hiệu | Cách phản ứng |
| --- | --- | --- |
| **Dependency closure lớn hơn dự kiến** | Mang một package vào nhưng phát sinh nhiều packages/build artifacts chưa có | Giữ nguyên một nhóm dependency đã chạy được từ upstream; bổ sung theo graph thay vì sửa imports tùy ý. |
| **Cordis composition mất ổn định** | Plugin mount nhưng service khác bị pending hoặc duplicate providers | So sánh với composed `dsh-base`/`dsh-web-app` profile; sửa cấu hình trước khi sửa internals. |
| **Generated API có nhiều file chung** | B và C phải regenerate cùng descriptors | Chốt contract và để một integration owner chạy generation/merge. |
| **Right Sidebar không đạt UX cần thiết** | Slide quá hẹp, resize/fullscreen gây lỗi hoặc selected slide không ổn định | Đo bằng deck mẫu thật tại TASK-004/005. Nếu extension APIs không đủ, quyết định chuyển Canvas layout trên bằng chứng. |
| **Agent không gọi `publish_slide` đúng scope** | Tool đã tồn tại nhưng model không nhìn thấy hoặc không có quyền | Kiểm tra Agent Preset, scoped tools và tool schemas trước khi thay Agent Loop. |
| **Quá nhiều shared-file edits** | Các PR liên tục xung đột root manifests hoặc composition | A giữ ownership root; B/C dùng package-level branches và yêu cầu integration patches. |
| **Lệch khối lượng giữa ba người** | Một issue chậm hơn nhưng task khác đã hoàn tất | Chia phần độc lập như mocks/tests/review; không chuyển một module đang thuộc ownership sang người khác mà chưa thống nhất. |
| **Demo sớm bị chậm bởi cleanup** | Đang xóa marketplace/plugins hoặc đổi tên packages khi UC-001 chưa chạy | Giữ các dependencies cần build; tắt UI không cần thiết. Chuyển cleanup sâu sang sau Gate 006. |

## 12. Sau demo: ưu tiên nghiên cứu và đóng góp kỹ thuật

Sau Gate 006, nhóm cần giữ kết quả kiểm thử để xác định những improvements có giá trị. Một số hướng cần đo trước khi chọn: chất lượng bố cục slides, overflow, tính nhất quán giữa slides, thời gian tạo, và khả năng chỉnh sửa đúng scope qua nhiều lượt.

Bằng chứng tối thiểu cho mỗi improvement gồm: scenario đầu vào, kết quả baseline, lỗi hoặc hạn chế quan sát được, thay đổi triển khai và kết quả đo lại. **Không chọn đóng góp chỉ vì một ý tưởng nghe có vẻ hay** khi chưa thấy hạn chế thực tế hoặc chưa có cách đánh giá.

Song song, cần ghi rõ ranh giới source kế thừa từ DeepSeek và source tự phát triển trong DeckAgent. Việc dùng một repository mới không thay đổi nguồn gốc của những packages đã sao chép. Yêu cầu học thuật về mức đóng góp và cách nộp source cần được xác nhận riêng với giảng viên.

## 13. References

### DeepSeek Harness — source và architecture

- [Architecture overview](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) — Cordis, profiles, bundles, Agent Runtime và application boot.
- [Core bundle](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/README.md) — tập plugin mặc định và dependency/configuration pattern.
- [Web App bundle](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/README.md) — Web profile, Chat, Models, Settings và History.
- [Web App composition](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/cordis.patch.yml) — các Host/UI plugin rows của Web.
- [App Boot](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md) — profile boot, patches và failure diagnostics.
- [Agent Loop](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-loop/README.md) — Agent requests, steps, tools và Session lifecycle.
- [Agent Loop dependency manifest](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-loop/package.json) — các peer dependencies của Agent Loop.
- [Core Tools dependency manifest](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/tools/package.json) — services liên quan đến Tool execution.
- [Web Client architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web-client.md) — Host → API → Client Model → Slots → React.
- [Right Sidebar](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-right/README.md) — tab registration, docking và session-scoped surface.
- [Plan UI example](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plan/src/client/index.ts) — cách đăng ký một tab và conversation extension.
- [Storage Domain](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/storage/storage-domain/README.md) — durable Host-side metadata.
- [File Tools](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs/README.md) — filesystem operations của Agent.

### DeckAgent — behavior sources

- [V1 Scope](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/00-current-scope/VERSIONS.md) — Local Web, Models, History, workspace, images và Windows-first.
- [UC-001 — First Draft](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-001.md) — Outline, confirmation và progressive slide generation.
- [UC-002 — Edit Slides](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-002.md) — editing scope và unchanged slides.
- [UC-003 — Request Lifecycle](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-003.md) — Chat, Stop, Status và Activity Log.
- [UC-006 — Reopen Chat](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-006.md) — reopen history và deck, không tạo request mới.

---

**Tình trạng tài liệu:** Đây là kế hoạch thực hiện và phân chia công việc dựa trên source và các behaviors hiện có. Những đề xuất về boundary, thứ tự task group và mock/integration strategy vẫn cần kiểm chứng khi bắt đầu build. Các kết luận chưa được thử trên DeckAgent không được xem là kết quả implementation đã xác nhận.
