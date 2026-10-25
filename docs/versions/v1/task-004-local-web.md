# TASK-004 — Bàn giao Local Web

Bản triển khai hiện tại nằm trên `feature/task-004-local-web`, dựa trên dev
`049fa77d50361e768b022384637ddde108224b8b` (Gate 003). Codex triển khai chung A/B/C
theo yêu cầu của người phụ trách task. PR/merge và nghiệm thu thủ công Gate 004 vẫn
`NOT_VERIFIED`. Phạm vi và tiêu chí Gate nằm trong
[kế hoạch triển khai song song](deckagent-parallel-team-implementation-plan.md#6-task-004--usable-deckagent-local-web).

## Phân công và các file liên quan

| Subtask | Phần triển khai và điểm tiếp tục |
| --- | --- |
| A — Host | `apps/local-web/src/index.ts`, `provider-settings.ts`, `web-state.ts`, `built-in-providers.ts`; hợp đồng và route quản lý trong `packages/host/api`. Phụ trách kết nối các thành phần dùng chung và tích hợp bố cục. |
| B — Hội thoại/Cài đặt | `packages/client/runtime/src/boot.ts`, `conversation-view.ts`, `management-client.ts`, `settings-panel.ts`; định dạng giao diện trong `apps/local-web/src/ui-assets.ts`. |
| C — Deck mẫu | `packages/client/runtime/src/deck-tab.ts`, `apps/local-web/src/sample-slides.ts`; kiểm thử trình duyệt trong `tests/browser-smoke.test.mjs`. Không phụ thuộc Deck Service. |

Các thay đổi hỗ trợ: bổ sung `SqliteSessionStore.select()`, hàm nhận sự kiện hoạt động
của Runtime, danh sách model từ provider, chuyển đổi lịch sử giữa các provider và
hàm dùng chung cho Windows DPAPI. Kho khóa CLI dùng cùng hàm mã hóa; định danh file
và thứ tự tìm nguồn thay thế vẫn tương thích. Không thay đổi thư viện chạy thực tế,
mã nguồn vendor, kế hoạch triển khai hoặc đặc tả sản phẩm.

## Hành vi và hợp đồng đã thống nhất

Người phụ trách đã đồng ý xử lý ba khoảng trống: chọn model theo chat và giữ cấu hình
riêng cho từng yêu cầu, sửa được cấu hình provider qua Settings, ghi hoạt động thực tế.
Ứng dụng dùng một workspace mặc định và bộ cấu hình Agent cố định với
`read_file`/`write_file`; phạm vi quyền và chính sách chỉ tạo file mới từ TASK-003 vẫn áp dụng.

### Quản lý model và thông tin xác thực

- Có thể đổi model khi đang chạy. Mỗi yêu cầu đã tiếp nhận giữ nguyên provider/model,
  cấu hình kết nối và key đến khi giải phóng tài nguyên; yêu cầu tiếp theo dùng lựa chọn
  mới. Đổi Settings hoặc model không tạo yêu cầu Agent.
- `SqliteSessionStore.select()` cập nhật lựa chọn trên Web mà không ghi lại lịch sử.
  `bind()` của CLI vẫn từ chối lựa chọn xung đột. Cấu trúc Session v1 không đổi;
  tránh để CLI và Web cùng thao tác một Session đồng thời.
- Model/provider bị xóa khiến lựa chọn cũ không khả dụng; Host từ chối gửi và không tự
  chọn thay thế. Không thể xóa provider khi yêu cầu còn giữ quyền sử dụng nó. Dấu xóa
  ngăn tham số khởi tạo CLI cũ khôi phục provider sau khởi động lại; có thể thêm lại qua Settings.
- Settings lưu key được mã hóa bằng Windows CurrentUser DPAPI trong `web.sqlite`.
  Phản hồi chỉ có `hasKey`/`keyAvailable`; key không giải mã được có thể thay qua Settings.
  Không có phương án lưu key dạng văn bản rõ trên hệ điều hành khác.
- Ô nhập key được xóa sau khi lưu/đóng. Đổi endpoint tùy chỉnh đang có key yêu cầu
  nhập key hoặc xóa key tường minh, tránh tự chuyển key sang endpoint mới.
- CLI `--provider`/`--model` có thể khởi tạo kết nối từ JSON và môi trường, gồm `.env`.
  Settings đã lưu trên Web được ưu tiên. Không có các tham số này, Web vẫn mở Settings
  mà không cần model/key. Hồ sơ từ trình hướng dẫn CLI là cách thiết lập riêng.
- Đổi provider/model giữ nguyên nội dung hội thoại. Lượt tool có chữ ký từ provider
  khác được chuyển thành ngữ cảnh văn bản, không mang chữ ký cũ hoặc chạy lại tool.
  Trạng thái giao thức khớp provider/model vẫn dùng định dạng gốc. Khả năng chuyển
  provider được kiểm tra bằng HTTP giả lập cục bộ, chưa xác minh trên mọi model thật.

### API Host bổ sung

Tất cả route giữ xác thực bearer, kiểm tra chính xác Host/Origin, không bật CORS,
không cho lưu bộ nhớ đệm và giới hạn nội dung JSON của yêu cầu ở 20 KiB.

| Route | Hành vi |
| --- | --- |
| `GET /api/settings` | Trả thông tin provider an toàn, mẫu cấu hình và khả năng lưu key. |
| `PUT /api/providers/:id` | Lưu tên, giao thức, URL gốc, model ID và key tùy chọn chỉ được ghi. Không truyền key thì giữ nguyên; key rỗng xóa key cho API tùy chỉnh. ID trên route định danh provider; giao thức đã lưu không thể đổi trong bản này. |
| `DELETE /api/providers/:id` | Xóa khi không có yêu cầu Agent đang dùng; giữ hội thoại. |
| `GET /api/providers/:id/catalog` | Tra cứu danh sách model khi được yêu cầu; không sinh văn bản hoặc tự thêm/chọn model. |
| `GET/POST /api/sessions` | Liệt kê thông tin lịch sử/yêu cầu đang chạy, hoặc tạo chat rỗng với lựa chọn model tùy chọn. |
| `PUT /api/sessions/:id/selection` | Chọn model cho yêu cầu tiếp theo. |
| `GET /api/sessions/:id/activities` | Trả hoạt động được lưu bền vững, có thứ tự; không chứa suy luận nội bộ hoặc thông tin xác thực. |
| `GET /api/sessions/:id/requests` | Trả trạng thái yêu cầu được lưu bền vững, model đã chốt và mốc `historyStart` tùy chọn trong lịch sử công khai; mã lỗi cố định và an toàn. |

Các route gửi yêu cầu/lịch sử/HTTP-SSE vẫn tương thích. `HostOptions.openAgent` nhận
thêm ID yêu cầu; hàm một tham số hiện có vẫn hoạt động. Luồng sự kiện vẫn truyền trạng
thái vòng đời, chưa truyền từng phần token. Hoạt động cập nhật riêng mỗi 750 ms khi
đang xem yêu cầu chạy.

### Hoạt động và hành vi trình duyệt

- Runtime `send(..., { onActivity })` chờ nơi lưu sự kiện tại các lần chuyển trạng thái
  thực tế của model/tool. Tool lỗi vẫn có thể đi cùng yêu cầu hoàn tất. Không tạo bản
  ghi giả cho công việc mới chỉ dự kiến.
- `web.sqlite` v1 quản lý provider, tóm tắt yêu cầu và hoạt động, có application ID riêng.
  Lịch sử Session vẫn ở `sessions.sqlite`. Cả hai file ngoài phạm vi quyền Agent.
  Cơ sở dữ liệu không được hỗ trợ được giữ nguyên và từ chối mở.
- Bản ghi đang chạy do Host bị buộc dừng chuyển thành `unknown` khi mở lại. Giao diện
  báo kết quả chưa xác nhận, không tự chạy công việc. Phần này bảo toàn tính đúng đắn
  của hoạt động, chưa gồm khôi phục Deck đầy đủ TASK-007 hoặc bảo đảm nhiều Host đồng thời.
- Hội thoại, ô soạn tin (Composer), model theo nhóm, Settings, History và chi tiết hoạt
  động dùng API Host. Tải lại lấy yêu cầu hiện tại từ Host; đọc lịch sử/mở chi tiết
  không gửi công việc. Mở Settings giữ bản nháp.
- Bố cục đã được chấp thuận: mỗi yêu cầu có một bản ghi Status/Activity mặc định thu gọn
  sau tin nhắn người dùng. Tóm tắt hiển thị trạng thái và số hoạt động thực tế; mở ra
  xem chi tiết. Không có footer Activity riêng. Nút DOM ổn định giữ trạng thái mở và
  focus qua cập nhật định kỳ; xem chi tiết không chạy công việc. Tải lại mặc định thu gọn.
- Dữ liệu yêu cầu mới có chỉ số `historyStart` tùy chọn, tính trước lượt gửi trong
  lịch sử không gồm tin nhắn hệ thống. Chỉ số đặt bản ghi đúng vị trí mà không đoán
  từ nội dung hoặc số yêu cầu. JSON cũ không có mốc vẫn đọc được và xuất hiện sau tin
  nhắn. Không ghi lại lịch sử Session hoặc đổi phiên bản cấu trúc dữ liệu; client cũ
  có thể bỏ qua trường bổ sung.
- Deck mẫu hỗ trợ chuyển slide, chỉnh độ rộng và toàn màn hình. Bố cục lưu cục bộ
  trong trình duyệt theo origin, không phải lưu Deck bền vững. HTML mẫu là tài nguyên
  tin cậy cố định trong iframe có origin tách biệt (`sandbox=""`), với CSP hạn chế riêng.
  Các route này không phục vụ HTML từ workspace.

## Giá trị sản phẩm chưa chốt và giới hạn

- BR-005 chưa chốt model ID mặc định và các giá trị provider/giao thức lâu dài.
  Bản triển khai dùng ID kết nối hiện có (`openai`, `anthropic`, `google`, `deepseek`)
  và giao thức đã triển khai để giữ tương thích; không sửa BR-005. Chưa tự đặt model
  mặc định hoặc đánh dấu Restore defaults hoàn tất.
- Mẫu provider dùng endpoint trong cấu hình mẫu hiện tại và giữ URL cố định. API tùy
  chỉnh có endpoint khai báo tường minh. Sửa endpoint có sẵn và danh sách model mặc định
  vẫn cần quyết định sản phẩm được ghi nhận trước khi xác nhận đủ UC-005.
- Model ID được lưu mà chưa thử quyền truy cập. Có danh sách model không bảo đảm
  quyền dùng hoặc hỗ trợ tool. Giới hạn: 100 model đã thêm/provider; danh sách tải về
  tối đa 10 trang, 1000 ID duy nhất và 1 MiB/trang. API tùy chỉnh không có danh sách
  tương thích có thể nhập ID thủ công.
- Các kiểm tra chưa chứng minh yêu cầu cloud thật, nghiệm thu đầy đủ UC-003/UC-005,
  tệp đính kèm, giao diện Stop, xuất bản Deck hoặc khôi phục đầy đủ TASK-007.

Phần tải danh sách model đã được đối chiếu tài liệu chính thức:
[API danh sách model OpenAI](https://developers.openai.com/api/reference/resources/models/methods/list),
[API danh sách model Anthropic](https://platform.claude.com/docs/en/api/models/list) và
[API model Gemini](https://ai.google.dev/api/models). Các tài liệu mô tả định dạng
trao đổi dữ liệu, không quyết định model mặc định của DeckAgent.

## Xác minh

Chạy từ thư mục gốc repository với Node 22.19+ và phiên bản pnpm đã ghim:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
pnpm.cmd lint
pnpm.cmd test:local-web
pnpm.cmd test:model-providers
pnpm.cmd test:browser-smoke
pnpm.cmd test:env-startup
```

`test:local-web` kiểm tra thiết lập rỗng, lưu bền bằng DPAPI, đổi model/key giữa lúc
chạy, lựa chọn bị xóa, tool lỗi/hủy và Host thực sự bị buộc dừng. Kiểm thử trình duyệt
kiểm tra gửi yêu cầu/tải lại/lịch sử trên DOM thực, ghi file được phép/bị từ chối,
Settings/giữ bản nháp và điều hướng/đổi kích thước/toàn màn hình/sandbox của Deck.
GitHub workflow có các kiểm tra mới bằng dữ liệu giả lập, không cần thông tin xác thực
cloud. Kết quả thực tế và giới hạn ở [PROGRESS.md](PROGRESS.md).

Đợt kiểm tra rộng ngày 21-10-2026 trên Windows x64, Node 22.19.0/pnpm 11.28.5:
bản sao 142 file nguồn, ban đầu không có node_modules/lib, đã cài ngoại tuyến với
lockfile cố định và build thành công. Bản triển khai sau sửa lỗi đạt 102/102 kiểm thử
Node (không bỏ qua), kiểm tra hồi quy UX với 64 bộ cấu hình, lint và actionlint.
Lỗi tranh chấp lúc khởi tạo và provider bị xóa nhưng xuất hiện lại từ cấu hình khởi tạo
đã được tái hiện và sửa trước lần chạy cuối. Log/ảnh dữ liệu giả lập là tài nguyên cục
bộ được Git bỏ qua, không phải bằng chứng CI trên GitHub. Nghiệm thu thủ công với model
thật và Gate 004 trên dev sau merge vẫn `NOT_VERIFIED`. Sau cập nhật Activity trong
hội thoại, build/lint và 10/10 kiểm thử tập trung trình duyệt/client/Web/Session PASS.
Kiểm tra trình duyệt gồm bản ghi đang chạy/hoàn tất thu gọn, vị trí sau tải lại, số hoạt
động, giữ trạng thái mở/focus qua cập nhật, không tạo thêm công việc Agent, chiều cao
chat và ô soạn tin hiển thị. Không chạy lại bộ kiểm thử rộng cho thay đổi giao diện này.

<a id="manual-acceptance-checklist--task-004"></a>

## Các bước kiểm thử thủ công — TASK-004

Dùng thư mục dữ liệu riêng đã được Git bỏ qua để giữ nguyên các phiên kiểm thử trước.
Không chạy hai Host cùng dùng thư mục này. Ghi lại kết quả `git rev-parse HEAD`,
branch, trạng thái thay đổi chưa commit, phiên bản Node/pnpm và chat ID;
không ghi API key hoặc URL chứa token xác thực.

```powershell
git rev-parse HEAD
git status --short
node --version
pnpm.cmd --version
pnpm.cmd build
pnpm.cmd start:local-web --data-dir .deckagent/task-004-manual --workspace .deckagent/task-004-manual/workspace
```

1. **Thiết lập lần đầu:** trình duyệt mở được dù chưa cấu hình model/key. Chưa thể gửi
   yêu cầu; mở Models & settings, chọn provider có sẵn, nhập key của bạn và thêm
   model ID bạn có quyền dùng, rồi lưu. Nếu dùng danh sách model từ provider:
   chọn provider đã lưu → Load model catalog → chọn model → Add selected models
   → Save provider. Kỳ vọng: key được xóa khỏi ô nhập và không hiển thị lại.
2. **Chat và công cụ file:** đóng Settings, chọn model cho chat rồi gửi:
   `Dùng write_file tạo task004-manual-001.html trong workspace, nội dung là <h1>DeckAgent TASK-004</h1>. Sau đó dùng read_file đọc lại và báo kết quả.`
   Kỳ vọng: yêu cầu hoàn tất, file tồn tại với đúng nội dung; hội thoại và bản ghi
   hoạt động thể hiện kết quả. Nếu file đã tồn tại, dùng tên mới. Đọc file độc lập bằng:
   `Get-Content -LiteralPath .deckagent/task-004-manual/workspace/task004-manual-001.html`.
3. **Settings và đổi model:** nhập bản nháp chưa gửi, mở/đóng Settings và kiểm tra bản
   nháp còn nguyên. Nếu đã cấu hình hai model dùng được, đổi model khi yêu cầu đang chạy.
   Kỳ vọng: yêu cầu hiện tại tiếp tục với model đã nhận lúc bắt đầu; lựa chọn mới áp dụng
   cho yêu cầu tiếp theo. Chỉ đổi model không tạo tin nhắn. Mở/thu gọn hoạt động không
   tạo yêu cầu mới. Mỗi yêu cầu có một dòng Status/Activity mặc định thu gọn sau tin nhắn
   người dùng, kèm số hoạt động; không có footer Activity riêng. Chi tiết đang mở vẫn
   mở qua các lần cập nhật; sau khi thu gọn vẫn đóng, kể cả khi yêu cầu hoàn tất.
4. **Lịch sử và tải lại:** tạo chat khác rồi mở chat đầu từ History. Nếu yêu cầu chạy
   đủ lâu, tải lại trang khi đang chạy. Kỳ vọng: đúng chat/model và trạng thái hiện tại
   được khôi phục, không gửi lại yêu cầu. Nếu yêu cầu kết thúc quá nhanh, chỉ ghi nhận
   đã kiểm tra khôi phục lịch sử hoàn tất, chưa kiểm tra tải lại giữa lúc chạy.
5. **Khởi động lại:** dừng Host bằng Ctrl+C, chạy lại cùng lệnh, dùng cửa sổ trình duyệt
   mới mở và chọn chat đầu từ History. Kỳ vọng: cấu hình provider, model đã chọn,
   tin nhắn và hoạt động còn nguyên. Mở lịch sử không gọi model.
6. **Deck mẫu:** Open sample deck → Next/Previous → chỉnh độ rộng Deck → Fullscreen
   → thoát toàn màn hình. Kỳ vọng: ba slide mẫu đọc được, điều hướng và bố cục dùng được,
   hội thoại không thay đổi. Tải lại giữ slide/độ rộng trên cùng origin.

<a id="inline-statusactivity-double-check"></a>

### Kiểm tra kỹ Status/Activity trong hội thoại

Sau khi build giao diện mới, dừng Host cũ bằng Ctrl+C rồi khởi động lại bằng lệnh
ở trên. Dùng tab trình duyệt mới mở và chat mới để kiểm tra vị trí bản ghi chính xác:
bản ghi cũ không có `historyStart` sẽ xuất hiện ở cuối lịch sử.

| Điểm kiểm tra | Kết quả mong đợi |
| --- | --- |
| Gửi một yêu cầu | Một dòng Working thu gọn xuất hiện ngay sau tin nhắn người dùng tương ứng. |
| Giữ thu gọn khi đang chạy | Trạng thái và số hoạt động thực tế vẫn cập nhật; không có footer Activity riêng chiếm chỗ chat. |
| Mở chi tiết khi đang chạy | Chi tiết cập nhật mà không tự thu gọn hoặc làm mất vị trí focus bàn phím. |
| Thu gọn rồi chờ hoàn tất | Bản ghi vẫn thu gọn; dòng tóm tắt chuyển sang trạng thái cuối của yêu cầu. |
| Gửi thêm một yêu cầu | Mỗi yêu cầu có bản ghi riêng; các bản ghi trước còn nguyên. |
| Quan sát tool lỗi, nếu có | Tool đó hiện lỗi kể cả khi toàn bộ yêu cầu sau đó hoàn tất. Yêu cầu hoàn tất không đồng nghĩa mọi tool đều thành công. |
| Tải lại hoặc mở lại History | Tin nhắn, trạng thái yêu cầu và hoạt động được khôi phục mà không gửi lại công việc. Bản ghi mặc định thu gọn sau khi tải lại. |
| Mở/thu gọn chi tiết nhiều lần | Thao tác không tạo thêm tin nhắn người dùng, yêu cầu Agent hoặc file trong workspace. |
| Mở Deck mẫu và đổi kích thước | Vùng chat vẫn cuộn được, ô soạn tin (Composer) vẫn hiển thị. |

Đánh dấu từng mục `PASS`, `FAIL` hoặc `NOT_VERIFIED`. Nếu yêu cầu kết thúc quá nhanh
để quan sát cập nhật định kỳ, giữ focus hoặc tải lại giữa lúc chạy, ghi những mục đó
là `NOT_VERIFIED`; kiểm tra lịch sử đã hoàn tất không thay thế được các mục này.
Với lỗi, ghi chat ID, kết quả mong đợi và thực tế; không ghi key hoặc URL chứa token.

Báo kết quả từng bước, revision đã kiểm tra và phần chưa xác minh. Để đóng Gate 004,
implementation còn cần được merge vào `dev`, kèm evidence CI/nghiệm thu trên baseline
tích hợp đó. Task owner chưa xác nhận checklist này PASS.
