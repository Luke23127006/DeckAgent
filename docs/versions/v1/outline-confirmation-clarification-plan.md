# Kế hoạch sửa luồng hỏi làm rõ và xác nhận outline

Ngày: 23-10-2026. Trạng thái: **đã triển khai thử nghiệm local theo yêu cầu owner; chưa manual provider thật hoặc Gate acceptance**. Mục 1–8 giữ căn cứ và thiết kế lúc lập kế hoạch; trạng thái implementation hiện tại ở mục 9.

Baseline local: commit `4a2b7b4`, branch `feature/interactive-ui-alignment`. Commit UI đã có; push bị automatic approval review chặn, chưa được xác nhận trên remote. Kế hoạch này không coi bản UI là đã publish và không nâng Integration Gate.

## 1. Kết quả cần đạt

Người dùng có thể trả lời hoặc bỏ qua câu hỏi trước outline, duyệt outline bằng câu tự nhiên hoặc lựa chọn gợi ý. Hệ thống biết lúc nào phải chờ, lúc nào cần hỏi tiếp và lúc nào được tạo slide. Người dùng không cần nhớ một câu lệnh chính xác.

Hai tình huống hỏi khác nhau dùng chung cơ chế chờ:

- Trước outline: thiếu chủ đề hoặc thông tin làm thay đổi đáng kể nội dung.
- Khi duyệt outline: chưa rõ người dùng muốn xác nhận, sửa, hủy hoặc nhắc tới proposal nào.

Không biến mọi yêu cầu thành phỏng vấn. Đã đủ thông tin thì đề xuất outline ngay. Tên field, tool và endpoint dưới đây là **đề xuất kỹ thuật**, chưa phải contract được duyệt.

## 2. Căn cứ và khoảng trống hiện tại

| Căn cứ | Hành vi / khoảng trống |
| --- | --- |
| [UC-001 A32](../spec/03-use-cases/UC-001.md#a32--ask-before-drafting-the-outline) | Hỏi tối thiểu, có lựa chọn và trả lời tự do; cho phép bỏ qua. Bỏ qua thì nêu giả định; chưa biết chủ đề thì hỏi lại, chưa dựng outline. |
| [UC-001 Notes 30–33](../spec/03-use-cases/UC-001.md) | Xác nhận proposal hiện tại; giữ proposal cũ; ý định mơ hồ cần hỏi lại. Các câu ví dụ thể hiện ý định, không phải từ khóa cố định. |
| [UC-003 A38 và Notes 22–24](../spec/03-use-cases/UC-003.md#a38--wait-for-the-users-answer) | Request vẫn mở khi chờ; câu trả lời không tạo request mới; không hiện đang làm việc trong lúc chờ; có thể dừng. Lựa chọn gợi ý tương đương câu gõ cùng ý định và giữ nguyên draft chưa gửi. |
| [Parser hiện tại](../../apps/local-web/src/outline-workflow.ts) | `outlineCommand` khớp toàn câu theo danh sách cố định; câu khác đi vào review nhưng chưa có kết quả nhận diện ý định để Host xử lý. |
| [RequestController](../../packages/host/api/src/request-controller.ts) | Một `submit` chạy `agent.send`, dispose, finalize rồi nhả lock. Chưa có bước chờ câu trả lời. |
| [Host contracts](../../packages/host/api/src/contracts.ts) | Request snapshot chưa có trạng thái chờ; chưa có contract trả lời câu hỏi đang mở. |
| [Local Web composition](../../apps/local-web/src/index.ts) | Host xác nhận trước khi generation; proposal chỉ được đưa thành current sau lượt thành công. Đây là các bảo đảm cần giữ. |
| [Web state](../../apps/local-web/src/web-state.ts), [Host client](../../packages/client/runtime/src/host-client.ts) | Persist/validate trạng thái và recovery hiện tại chưa nhận waiting; SSE/client xem trạng thái khác running là kết thúc. |

Đã dùng graph tìm symbol và kiểm tra coverage cho các implementation paths liên quan. Graph báo `metadata_changed`; đã đọc source hiện tại để đối chiếu. Không dùng graph để chứng minh không có tính năng ở toàn repo.

## 3. Hành vi sẽ triển khai

| Tình huống | Kết quả mong muốn |
| --- | --- |
| Yêu cầu rõ chủ đề, mục tiêu và phạm vi đủ dùng | Đề xuất outline, không hỏi thêm cho đủ một bộ câu hỏi. |
| Thiếu thông tin ảnh hưởng lớn | Hỏi có lựa chọn gợi ý và trả lời tự do; chuyển sang chờ. |
| Người dùng im lặng | Giữ chờ; không gọi model liên tục, không hết thời gian rồi tự chọn, không tự confirm. |
| Chủ động bỏ qua câu hỏi trước outline, chủ đề đã biết | Tiếp tục với giả định được ghi trong lời giới thiệu outline. |
| Chủ động bỏ qua nhưng chủ đề vẫn chưa biết | Hỏi lại chủ đề; chưa đề xuất outline. |
| Trả lời vẫn để ngỏ lựa chọn quan trọng | Hỏi tiếp trong cùng request; không tự chọn thay người dùng. |
| Đang chờ làm rõ ý định confirm và người dùng bỏ qua | Không coi là confirm; tiếp tục yêu cầu ý định rõ hoặc cho dừng. Quyền bỏ qua ở A32 không cấp quyền xác nhận ở A39. |
| “Ổn rồi, tạo slide theo outline này đi” | Nhận diện xác nhận toàn outline hiện tại; Host kiểm tra target rồi bắt đầu tạo slide. |
| “Ổn rồi, nhưng sửa slide 2 cho ngắn hơn” | Sửa thành proposal mới, chờ duyệt lại; chưa tạo slide. |
| “OK?”, “slide 2 ổn rồi” | Nếu ngữ cảnh còn mơ hồ về việc xác nhận toàn outline, hỏi lại; không tự confirm. |
| “Dùng bản trước” | Hỏi rõ bản nào nếu chưa rõ; trình bày lại thành proposal mới. Không âm thầm đổi current rồi confirm proposal cũ. |
| Chọn “Xác nhận outline và tạo slide” | Cùng kết quả với câu xác nhận rõ; giữ draft chưa gửi, dùng đúng ID/version hiển thị. |
| Confirm khi chưa có outline dùng được | Hướng dẫn cần outline có nội dung; không báo generation thất bại, không tự dựng outline mới. |
| Dừng khi chờ / khi đang chạy | Kết thúc theo kết quả thực; không tự tiếp tục từ câu trả lời gửi muộn. |
| Confirm đã commit rồi provider lỗi | Giữ confirmed và phần đã publish; yêu cầu tiếp tục không phải confirm lại. |

## 4. Phương án kỹ thuật đề xuất

### 4.1. Một request có thể gồm nhiều lượt xử lý

Đề xuất Host giữ **một requestId** xuyên các lần hỏi/trả lời. Mỗi lượt model vẫn được hoàn tất và đóng tài nguyên gọn; request cấp sản phẩm chỉ kết thúc khi công việc hoàn tất, lỗi hoặc bị dừng.

Trạng thái Host đề xuất: `running`, `awaiting_user`, `completed`, `failed`, `cancelled`; recovery durable tiếp tục có `unknown` cho công việc bị gián đoạn. `awaiting_user` là active, không phải terminal.

- Request chờ vẫn giữ quyền sở hữu Session. Chỉ endpoint trả lời đúng request/câu hỏi được tiếp tục; `submit` mới vẫn bị chặn. Stop hoạt động cả khi đang chờ.
- Chờ không giữ một HTTP provider stream hay một tool call chưa được trả kết quả. Kết quả control được validate/stage, lượt model hoàn tất và dispose thành công rồi Host mới công bố trạng thái chờ.
- Chỉ giữ context cần thiết để tiếp tục: request/model/config capture, phase, target và câu hỏi. Không ghi key hoặc model adapter vào SQLite. Model/config của request được capture một lần; thay selection/settings áp dụng cho request sau.
- Tách kết quả một lượt model với kết quả terminal của request. Không nhét `awaiting_user` vào `TurnResult` một cách máy móc hoặc finalize request sau mỗi câu hỏi.
- Activity IDs/sequence phải phân biệt các lượt trong cùng request, tránh `model-1` của lượt sau ghi đè lượt trước. History range phải bao gồm các câu trả lời và proposal đúng request.
- Request chờ không được bị cơ chế eviction coi như record đã xong. Giới hạn active requests hiện tại cần tính cả chờ; không tự hủy chỉ vì người dùng chưa trả lời.

So với việc giữ một tool promise chờ vô hạn, phương án này tách tài nguyên provider khỏi thời gian người dùng suy nghĩ và dễ kiểm tra Stop/cleanup hơn. Đổi lại phải bổ sung orchestration và snapshot/persistence cho request nhiều lượt.

### 4.2. Kết quả có cấu trúc từ model; Host thực hiện chuyển trạng thái

Đề xuất capability riêng cho hỏi làm rõ và báo ý định review, tái sử dụng ToolRegistry hiện tại. Không đọc JSON tùy ý từ lời nói assistant. Nội dung câu hỏi và choices do model tạo theo ngữ cảnh; Host cấp question ID/version, gắn request và validate giới hạn.

Trong review, kết quả đề xuất phân biệt `confirm`, `revise`, `cancel`, `clarify`, `other`. Host gắn kết quả với message người dùng vừa nhận và outline target đã capture trước lượt nhận diện. Model không được tự chọn Session, tự cấp request ID hoặc thay target bằng proposal mới nhất.

- Kết quả thiếu/sai schema, nhiều kết quả mâu thuẫn, lỗi model hoặc dispose thất bại: không commit confirm/cancel hay proposal mới.
- Lượt nhận diện chỉ có quyền review/read cần thiết, không có write/publish. Sau kết quả confirm hợp lệ, Host kiểm tra lại current/version, commit qua Deck Service rồi mở phase generation với tool allowlist tương ứng. Giữ cùng logical request và capture; không gọi `submit` lồng nhau.
- Lời assistant “đã xác nhận” không thay đổi state. Tool result là đề nghị, không trực tiếp mutate Deck Service. Không tạo public tool cho model tự xác nhận tùy ý.
- Context chứa tài liệu, câu trích dẫn “confirm outline”, lịch sử assistant hoặc tool output không được coi là lời xác nhận mới của người dùng. Bộ đánh giá phải có các trường hợp này.
- Với request tạo outline đầu tiên, cho phép kết quả là hỏi hoặc proposal; không ép `propose_outline` trong mọi trường hợp.

Host kiểm tra được nguồn message, quyền, phase và version; không thể dùng các kiểm tra đó để bảo đảm model luôn hiểu đúng ngữ nghĩa. Cần evaluation riêng và manual model thật trước acceptance, không dùng confidence score làm bằng chứng chắc chắn.

### 4.3. API, lưu trạng thái và UI

Đề xuất endpoint authenticated `POST /api/requests/:requestId/reply`, nhận question ID/version, reply ID và một trong: text, option ID hoặc skip. Kiểm tra Session/request binding; chống reply lặp; reject reply cũ, sai target, reply sau Stop/failure. Retry cùng reply ID và payload trả cùng receipt, không append history/gọi model hai lần; cùng ID khác payload bị reject.

Snapshot/SSE và `StoredRequest` có projection câu hỏi đang chờ và phase đủ để UI khôi phục. UI gửi nội dung theo trạng thái: chờ thì reply, sẵn sàng thì submit mới, đang chạy thì chặn gửi mới. Choice được ghi thành message người dùng, không trộn hoặc xóa draft chưa gửi; câu trả lời gõ thành công thì mới xóa đúng phần đã gửi.

- SSE server, HostClient parser/watch, boot follow và feedback cùng phân biệt active/terminal; nhận `awaiting_user` không ngắt theo dõi như completed.
- Reload khi Host còn sống: dựng lại câu hỏi và đúng request, không phát lại model work. Chuyển chat vẫn theo quy tắc một request active hiện có, chưa mở rộng UX navigation.
- Host restart: request running hoặc waiting chuyển `unknown`, giữ câu hỏi/history làm bằng chứng, vô hiệu lựa chọn cũ, không auto-resume. Người dùng gửi yêu cầu mới để tiếp tục theo recovery hiện có.
- Cập nhật durable payload reader và migration/backfill khi cần. Ưu tiên mở rộng WebState hiện có, không tạo thêm database; outline/revision/confirmation vẫn thuộc Deck Service.
- Duy trì các action ID/version và alias cũ như đường tương thích. Khi request đang chờ, câu gõ phải đi qua ngữ cảnh câu hỏi, không để parser toàn cục bắt nhầm “xác nhận” thành confirm outline.

Thay đổi status là thay đổi contract dù chỉ thêm enum: phải cập nhật đồng thời server/client/readers/tests. Client cũ không hỗ trợ waiting không được coi là tương thích; deployment local cần restart Host và reload assets đồng bộ. Không bật tính năng giữa các slice chưa tích hợp đủ.

## 5. Phạm vi file và trách nhiệm

| Phần | Files hiện có / file dự kiến | Trách nhiệm |
| --- | --- | --- |
| Request lifecycle/API | `packages/host/api/src/{contracts,index,request-controller}.ts` | Waiting, reply admission, lock, Stop, SSE và terminal finalization. |
| Runtime integration | `packages/agent/runtime/src/{contracts,agent-runtime}.ts` nếu cần | Control outcome nhỏ, lượt tiếp tục, input/history đúng một lần; giữ CLI hoạt động. Chốt seam trước khi sửa. |
| Composition | `apps/local-web/src/{index,outline-workflow,web-state}.ts`; module điều phối nhỏ nếu cần | Capture, phase, staging, chuyển quyền review → generation, persistence/recovery. |
| Presentation tools | `packages/tools/presentation/src/` và exports liên quan | Contract hỏi/báo ý định, schema validation và tool results; không tự confirm. |
| Browser | `packages/client/runtime/src/{host-client,boot,conversation-view,request-feedback,outline-view}.ts`; view câu hỏi nhỏ dự kiến | Render choices/free text/skip, reply routing, waiting feedback và giữ draft. |
| Kiểm tra | `tests/{host-api,agent-runtime,outline-workflow,outline-client,web-session,web-management,recovery-editing,browser-smoke}.test.mjs`; fixtures liên quan | Lifecycle, intent, races, recovery và UI thật. Chỉ chọn nhóm bị ảnh hưởng theo slice. |
| Handoff | Kế hoạch này, `task-006-outline-workflow.md`, `PROGRESS.md` | Contract cuối cùng, evidence thực và giới hạn; không nâng Gate thiếu acceptance. |

Không gồm attachment intake, thêm/xóa/reorder slide của deck đã confirmed, ảnh, defaults, hay mở rộng edit-scope parser. Sửa outline trước confirm vẫn được tạo proposal mới theo hành vi hiện có.

## 6. Thứ tự triển khai và điểm review

1. **Chốt contracts và fixtures:** xác định representation của control outcome, waiting/reply snapshot, quyền sở hữu capture và persistence. Viết các case mẫu ở mục 7. Review lựa chọn ở mục 8 trước khi đổi shared contracts.
2. **Làm waiting/reply tối thiểu:** Host lifecycle + projection/persistence + client parser cùng fixtures; kiểm chứng lock, reply idempotency, Stop và terminal finalization. Chưa bật model capability cho người dùng khi UI chưa nhận được câu hỏi.
3. **Nối hỏi làm rõ trước outline:** tool/control outcome + UI câu hỏi + skip; phân biệt đủ thông tin/thiếu chủ đề. Demo được toàn luồng hỏi → trả lời → outline trong cùng request.
4. **Nối review bằng ngôn ngữ tự nhiên:** model báo ý định, Host validate target và chuyển phase; giữ action trực tiếp. Hoàn thiện A39 khi câu trả lời còn mơ hồ. Đây là lúc thay sự phụ thuộc vào danh sách câu lệnh.
5. **Hoàn thiện recovery và acceptance:** reload/reconnect/restart, double submit, provider failure sau confirm, draft và model capture. Review diff, cập nhật contract/handoff, chạy manual model thật rồi mới xét Gate.

Các slice đi tuần tự vì cùng chạm lifecycle/contracts. Có thể commit theo slice để review; không publish feature hoạt động một phần. Chưa tạo branch implementation; tách từ UI baseline khi bắt đầu để reviewer phân biệt hai phạm vi.

## 7. Tiêu chí nghiệm thu và kiểm thử

| Nhóm | Case bắt buộc |
| --- | --- |
| Câu hỏi | Request rõ không bị hỏi thừa; request thiếu chủ đề được hỏi; free text/choice/skip; bỏ qua có chủ đề ghi giả định; thiếu chủ đề vẫn chưa có proposal; trả lời lạc đề hỏi tiếp. |
| Waiting | Im lặng không có provider call mới; đúng requestId qua nhiều lượt; không spinner khi chờ; giữ Session ownership; Stop và shutdown không treo. |
| Ý định | Confirm rõ bằng nhiều cách diễn đạt Anh/Việt; confirm + sửa là revise; đồng ý một slide chưa thành confirm toàn outline; mơ hồ hỏi lại; câu trích dẫn/tài liệu/assistant không cấp confirm. |
| Target | Stale/version mismatch, cross-Session, proposal chưa hoàn tất, proposal cũ, đã cancel, đã confirmed, chưa có outline; không tự đổi current để khớp ý định. |
| Races | Hai tab reply cùng câu hỏi, duplicate reply, ID trùng payload khác, Stop đua reply/confirm, failed admission/disposal/finalization; không duplicate history, confirmation hoặc generation. |
| Quyền | Nhận diện/hỏi chưa có write/publish; model không tự confirm; publication cần confirmed; provider lỗi sau commit vẫn giữ confirmed/revisions và cho tiếp tục đúng scope. |
| History/model | Mỗi reply chỉ lưu một lần; activity không ghi đè giữa lượt; request chờ giữ model/config ban đầu kể cả user đổi settings; không persist credentials vào request metadata. |
| Recovery/UI | Reload/reconnect không phát lại work; restart chuyển waiting thành unknown; lựa chọn cũ vô hiệu; buttons giữ draft; Enter/IME/mobile/Stop và outline dock không regress. |

Lệnh có sẵn dự kiến, chạy bằng Node đáp ứng engine của repo:

```powershell
pnpm.cmd run build
pnpm.cmd run lint
node --test tests/host-api.test.mjs tests/agent-runtime.test.mjs
pnpm.cmd run test:outline-workflow
pnpm.cmd run test:recovery-editing
pnpm.cmd run test:browser-smoke
git diff --check
```

Chạy focused cases theo slice; chỉ chạy các nhóm tích hợp đầy đủ khi contract/lifecycle đã nối xong. Bổ sung web-management test khi đổi persisted reader/model capture. Browser cần Chrome/Edge; báo riêng sandbox failures nếu có. Fake model kiểm tra state machine nhưng không chứng minh chất lượng nhận diện ý định. Manual dùng data/workspace riêng và provider thật, ghi input/expected/actual/model, không ghi key. Không tuyên bố hỗ trợ mọi câu tự nhiên hoặc Gate PASS chỉ từ fixture tests.

## 8. Lựa chọn kỹ thuật cần review trước implementation

| Lựa chọn | Đề xuất | Trade-off / phương án khác |
| --- | --- | --- |
| Cách chờ | Host request nhiều lượt, `awaiting_user`; đóng lượt provider khi hỏi | Thêm orchestration/persistence; giữ tool promise chờ thì ít chuyển phase hơn nhưng khó cleanup và giữ tài nguyên lâu. |
| Nhận diện confirm | Model trả kết quả có cấu trúc; Host gắn message/target và thực hiện | Hiểu câu linh hoạt hơn nhưng thêm latency và rủi ro phân loại sai. Chỉ dùng nút/alias đơn giản hơn nhưng vẫn thiếu hành vi natural-language của spec. |
| Nguồn state | Request/clarification ở WebState, outline/deck ở Deck Service | Tái dùng ownership hiện có; phải xử lý thứ tự ghi và recovery giữa store. Không chuyển ownership chỉ để thuận tiện. |
| Restart lúc chờ | Unknown, không auto-resume, cho request mới | Giữ recovery hiện có và không persist credentials; tự resume cần contract giữ capture qua restart riêng. |

Các lựa chọn này ảnh hưởng Host, runtime, tools và client, vì vậy là đề xuất cần task owner review theo root AGENTS.md, chưa phải quyết định kiến trúc được phê duyệt. Có thể chuẩn bị tests/contracts trong phạm vi kế hoạch; phần implementation phụ thuộc lựa chọn chỉ bắt đầu sau khi chốt.

## 9. Trạng thái bàn giao

- Owner đã yêu cầu triển khai thử sau khi nhận kế hoạch, rồi yêu cầu commit/push implementation lên branch mới `feature/outline-clarification-confirm` tại `origin` (`Luke23127006/DeckAgent`), base `4a2b7b4`. Chưa tạo PR; giữ `.local-only/` ngoài commit. Kiểm tra SHA trên remote sau push, không coi push là CI hoặc manual acceptance.
- Triển khai Host request nhiều lượt với `awaiting_user`, reply binding/idempotency/Stop; capture model/config được giữ trong bộ nhớ, mỗi model turn có runtime/context riêng được dispose trước khi chờ. `web-request.ts` giữ phần điều phối cùng capture/phase/staging để quyền chuyển review → generation ở một nơi; `index.ts` chỉ nối dependencies. Không tạo framework điều phối chung hoặc package mới.
- Công cụ `ask_clarification` nhận `question` là JSON string `{prompt,options,allowSkip}`; Host cho skip trước outline và tắt skip khi làm rõ ý định review. `review_outline` chỉ nhận `intent: confirm | cancel`, stage đề nghị cho Host; sửa dùng `propose_outline`, mơ hồ dùng câu hỏi. Host gắn message lượt hiện tại/target đã capture qua closure, model không truyền Session hoặc outline target. Nhiều decision tools trong một lượt làm request thất bại, không commit confirmation.
- Natural confirm phải hoàn tất nhận diện và dispose thành công; sau đó prepare generation, kiểm tra AbortSignal/current version và commit qua Deck Service. Runtime có `SendOptions.continuation` nội bộ để dùng history hiện có, không thêm một user message giả. Aliases/nút cũ giữ tương thích. Phần hiểu ngữ nghĩa thuộc model; Host guards không chứng minh model luôn phân loại đúng.
- API thử nghiệm: `POST /api/requests/:requestId/reply` nhận `{sessionId,questionId,version,replyId,answer}`; answer là `{type:'text',text}`, `{type:'option',index}` (index bắt đầu từ 0) hoặc `{type:'skip'}`. Cùng replyId/payload trả receipt cũ; cùng ID khác payload bị reject. Receipt cache giới hạn 128 trong bộ nhớ; reply của câu hỏi đã qua không bao giờ trở thành current lần nữa. Receipt không được phục hồi để replay sau restart.
- Snapshot và persisted request payload thêm `awaiting_user`/question; table và SQLite user_version không thay đổi vì cấu trúc bảng giữ nguyên. Readers, SSE terminal handling và client đã cập nhật đồng thời; bản cũ không hiểu trạng thái chờ, không coi rollback binary/client cũ là tương thích. Cần restart Host và reload client đồng bộ. Host restart chuyển running/waiting thành unknown và giữ câu hỏi để đối chiếu, không auto-resume hoặc giữ credentials trong request payload.
- UI có câu hỏi/options/free text/skip trong dock, giữ draft khi chọn option, gửi trả lời qua endpoint hiện tại thay vì submit mới; Stop/reload hoạt động. Câu hỏi có giới hạn chiều cao và cuộn; mobile chat trừ chiều cao navigation thực qua ResizeObserver, tránh composer tràn khi active hint xuất hiện.
- Evidence local: Node **24.19.0**, pnpm **11.28.5**, build/typecheck/bundle + lint PASS; integration **71/71**, final focused **31/31**, Chrome **5/5**, không skipped; tổng **83 cases khác nhau**, không cộng lặp các run. Host API và browser clarification test đã đỏ trước implementation, xanh sau; mobile geometry test đã bắt lỗi tràn rồi xanh sau sửa. Đã xem [ảnh mobile fixture](../../.local-only/outline-confirm-smoke-20261023/waiting-mobile.png). Tất cả dùng data/workspace tạm và fake model; chưa provider thật, hosted CI hoặc integrated acceptance.
- Thử bằng Host của checkout này sau restart/reload với cùng tham số data/workspace hiện có: thiếu chủ đề → câu hỏi; skip vẫn thiếu chủ đề → hỏi tiếp; trả lời → outline; đồng ý kèm sửa → proposal mới; ý định mơ hồ → hỏi tiếp; đồng ý tạo slide → confirmed/publication. Kiểm tra Stop lúc chờ và reload, không dùng kết quả giả lập để kết luận chất lượng provider thật.
- Chưa mở rộng clarification cho edit deck đã confirmed, attachments, thêm/xóa/reorder hoặc tự resume sau restart. Gates giữ nguyên đến khi có manual provider thật và acceptance theo baseline tích hợp.

## 10. Sửa lỗi tiếp tục sau confirm — 23-10-2026

Owner báo lượt confirm thành công nhưng model chỉ nói chờ Host, không tạo slide. Lượt sau yêu cầu “Xác nhận lại dàn ý 7 slide đã nêu và dựng toàn bộ slide” bị từ chối publish toàn bộ. Diagnosis chỉ đọc đã xác nhận outline/deck tồn tại và IDs đúng; parser follow-up cũ trả scope rỗng. `write_file` vẫn được quảng bá, trong khi publish guard chặn scope rỗng; completion guard chỉ chạy với scope có IDs nên có thể báo completed kèm toàn lỗi publish.

Owner yêu cầu sửa. Candidate sau `6e18b90` trên cùng branch, chưa commit/push:

- Giữ parser rõ ràng hiện có cho đường nhanh. Khi scope chưa rõ, mở phase interpretation chỉ có read tools, hỏi làm rõ và `resolve_slide_scope` nếu policy cho phép. Không quảng bá hoặc cho thực thi write_file/publish_slide ở phase này.
- `resolve_slide_scope` nhận `scope` là JSON string `{mode:'continue'|'edit',slideIds:string[]}`. Mode continue chỉ chọn các slide pending trong snapshot; mode edit chọn IDs hiện có theo yêu cầu. Host validate ID/dedup/mode và gắn snapshot version; sau model turn thành công/cleanup, kiểm tra version/status lại trước khi cấp quyền. Model không được tự thêm slide hoặc mở toàn deck nếu không có yêu cầu tương ứng.
- Các request có thêm/xóa/loại trừ/phủ định mà policy cũ chặn không được tool resolve để tự mở quyền; có thể hỏi lại. Trường hợp mơ hồ dùng câu hỏi không skip, reply vẫn trong cùng request; không gọi beginOutline hoặc confirm lại một deck đã confirmed. Đây là mở rộng clarification cho phạm vi follow-up hẹp; các mục chưa hỗ trợ ở mục 9 là snapshot trước bản sửa này.
- Chuyển sang slide work qua internal continuation để user message không bị ghi lặp, dùng cùng model capture và Session lock. Không tự broaden scope hoặc replay request đã lỗi.
- Prompt generation/slide work có phase marker và nói rõ Host đã confirm/authorize, các lời chờ Host trong history thuộc phase trước. Đây là hướng dẫn cho model, không bảo đảm mọi provider luôn gọi tool đúng; nếu không publish đủ thì publication/revision guards vẫn báo chưa hoàn tất.
- Nếu model cố ghi/publish khi chưa có scope, registry từ chối và request failed với `SLIDE_SCOPE_DENIED` dù model nói thành công. Nếu resolve thất bại rồi model kết thúc mà không có quyết định phục hồi, cũng failed. Model có thể sửa một resolve lỗi thành scope hợp lệ hoặc hỏi rõ trong lượt đó; không tự grant sau một JSON lỗi.
- Không đổi HTTP/storage schema/dependency. Các thay đổi nằm trong app composition/workflow và tool schema nội bộ; tool do Local Web sở hữu, quyền publish vẫn qua Deck Service như trước.

Verification dùng Node 24.19.0 + pnpm 11.28.5. Build/typecheck/bundle và lint PASS. Regression câu báo lỗi đã đỏ trước fix, xanh sau fix với 7/7 published; combined recovery/editing, outline workflow và management **32/32 PASS, 0 skipped**. Có cases invalid ID, duplicate ID, mode continue vào published slide, cấm ghi nháp trước scope, scope clarification cùng request và generation nhận marker Host đã confirm. Browser smoke được ghi kết quả cuối trong PROGRESS; chưa manual provider thật hoặc hosted acceptance.

Thử lại sau restart Host/reload client, giữ đúng data/workspace hiện tại. Gửi yêu cầu tiếp tục bằng câu tự nhiên; không cần thay bằng keyword cố định, không cần hủy/confirm lại outline. Host chỉ ghi/publish sau scope hợp lệ; phạm vi mơ hồ phải được hỏi rõ. Bản sửa không tự chạy lại lượt lỗi hoặc sửa dữ liệu người dùng trong quá trình kiểm thử.

## 11. Context generation riêng và một lần phục hồi — 23-10-2026

Sau bản sửa scope, owner tiếp tục báo provider thật kết thúc bằng lời “đang chờ Host” dù outline đã confirmed và Host đã restart đúng build. Log chứng minh không có write/publish; lý do nội bộ model bỏ qua hướng dẫn chưa được xác minh. Phương án được owner yêu cầu triển khai là cách ly context generation khỏi lời thoại xác nhận, kèm một lần phục hồi khi chưa có thao tác gây thay đổi.

- Runtime thêm option nội bộ `SendOptions.promptContext?: readonly Message[]`. Default không đổi: generic chat, CLI và caller cũ tiếp tục dùng đầy đủ history. Khi có context riêng, input thật vẫn được lưu như trước; provider nhận system prompt + context được Host cấp + những message/tool pairs phát sinh trong chính lượt đó. Context được clone ở boundary, không ghi vào SessionStore. Duplicate tool-call ID guard vẫn kiểm tra toàn bộ durable history.
- Local Web áp dụng cho initial generation hoặc scope chỉ gồm pending slides. Host task mang latest user request, user material và authorized IDs; approved content plan, snapshot revisions và draft paths vẫn ở system prompt. Những câu assistant “chờ Host”, review tool replies và provider metadata từ phase trước không nằm trong working context mới. Nội dung chat đầy đủ vẫn hiện trong History. Các chỉnh sửa slide đã published giữ context hội thoại như cũ để tránh mất ngữ cảnh feedback.
- Host task được đặt trong working prompt với nhãn rõ là internal execution context; không giả một tin nhắn người dùng mới trong conversation lưu bền. HTTP request không nhận option này, model không có cách tự cấp nó hoặc thay scope bằng task text.
- Sau một model turn completed nhưng chưa có bất kỳ write/publish attempt nào, snapshot version chưa thay đổi và AbortSignal còn active, Host được gọi model thêm **tối đa một lần** trong cùng request/agent/capture/scope. Context của lần phục hồi không chứa câu stall vừa sinh, có thông báo “Recovery attempt 1 of 1”. Không lặp vô hạn, không tự đổi model hoặc reconfirm outline.
- Bất kỳ write_file/publish_slide attempt nào, kể cả failed/unknown, đều chặn phục hồi tự động để tránh replay file hoặc publication. Provider failure/cancellation cũng không được phục hồi. Nếu một phần đã lưu, revision/progress được giữ và báo phần còn thiếu như trước. Activity IDs riêng cho mỗi attempt và tổng steps bao gồm cả hai lượt.
- Sau lần phục hồi vẫn kiểm tra publication/revision thực. Không đủ thì request failed với DECK_INCOMPLETE/EDIT_INCOMPLETE; lời model nói xong không thay kiểm tra đó. Stop trong lần phục hồi kết thúc cancelled, không có lần gọi thứ ba.

Evidence local: build/typecheck/bundle và lint PASS bằng Node 24.19.0 + pnpm 11.28.5; combined runtime/Host API/outline/recovery/management **78/78 PASS, 0 skipped** và Chrome **5/5 PASS**. Hai test context/history và stalled generation đã đỏ trước implementation, xanh sau. Có kiểm tra history giữ nguyên, current tool pairing, nguồn user material còn trong task, idle retry thành công, forever-stall chỉ hai attempts, không replay sau write/publish, provider failure và Stop. Browser run đầu bắt fixture Canvas chọn nhầm từ source material cũ; fixture đã đọc ID Host cấp thay vì keyword trong cả material, không hạ assertions publication/selection/restart. Rerun 5/5 PASS. Không dùng credentials hoặc dữ liệu thật để gọi provider trong tests; chưa có acceptance model thật/hosted CI. Gate status giữ nguyên.

Candidate sau `6e18b90` trên cùng branch, bao gồm cả scope fix mục 10. Owner đã yêu cầu commit/push lên `feature/outline-clarification-confirm` tại `origin` (`Luke23127006/DeckAgent`); kết quả push và SHA được xác minh riêng sau commit, chưa tạo PR. Cần restart Host/reload đúng checkout rồi thử với provider thật. Bản sửa tăng khả năng giao đúng task và phục hồi một lượt không thực hiện; không bảo đảm provider luôn gọi tool hoặc sinh đủ nội dung.
