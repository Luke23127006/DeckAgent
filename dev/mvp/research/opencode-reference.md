# Code mẫu trên nhánh feat/v2-opencode

Question: **code mẫu trên nhánh `feat/v2-opencode` có vấn đề gì**, và nó **giúp được gì, không giúp được gì** khi **viết mới code MVP**? Đọc ngày **08-11-2026** ở **commit ghim `5bd9c17`** (commit cuối của nhánh, ngày 05-11-2026). Nguồn: **tài liệu của nhánh** ([docs/versions/v2-opencode/](https://github.com/Luke23127006/DeckAgent/tree/5bd9c17/docs/versions/v2-opencode)), **8 ADR** ([docs/adr/](https://github.com/Luke23127006/DeckAgent/tree/5bd9c17/docs/adr)), **code** trong `apps/` và `packages/`, thư mục `tests/`, và `git log`. **Chỉ đọc, không chạy code.** Mọi đường dẫn code dưới đây là **ở commit `5bd9c17`**. WORKFLOW coi code này là **tham khảo, không phải sản phẩm**: code MVP **viết mới**, và chỉ đọc code mẫu **ở một commit đã ghim**.

1. **Code mẫu là gì?**
   - Observation: nhánh **dựng trên app legacy** (`apps/`, `packages/`, `vendor/`) rồi **thêm một đường chạy qua OpenCode**. Đường này **chỉ bật khi được chọn**, bằng cờ `--opencode-executable` ([cli.ts:67](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/cli.ts#L67)) hoặc lệnh `pnpm.cmd start:opencode`.
   - Observation: **runtime mặc định vẫn là Cordis**, framework plugin mà runtime cũ dựng trên. Tài liệu ghi "**Only TASK-009 can change the default**" ([DECISIONS.md](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/docs/versions/v2-opencode/DECISIONS.md)). Nhóm task đó (**đổi mặc định sang OpenCode và gỡ Cordis**) **chưa bắt đầu**.
   - Observation: kể cả khi bật OpenCode, mỗi request **vẫn tạo một context Cordis** ([web-request.ts:187](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/web-request.ts#L187)).
   - Observation: **luồng một request**: Web client → Host `RequestController` → workflow trình bày → `OpenCodeAgentHandle` → **OpenCode CLI 1.19.5** → model. OpenCode gọi lại **MCP bridge** → `ToolRegistry` → `DeckService`. **MCP** là **giao thức để agent gọi tool** do một server bên ngoài cung cấp.
   - Observation: **scope của nhánh lấy từ đề cương luận văn**, một file PDF **chỉ có trên máy** (`.local-only/`), **không theo spec MVP** ([SCOPE.md](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/docs/versions/v2-opencode/SCOPE.md)).
   - => Đây là **app legacy có thêm một đường chạy OpenCode**, **không phải bản dựng lại trên OpenCode**.

2. **Code gồm những phần nào?** Số dòng là **ước lượng**: đếm bằng `Measure-Object -Line`, cách này bỏ qua dòng trống.

   | Phần | Làm gì | Cỡ | Chạm OpenCode? |
   |---|---|---|---|
   | `apps/local-web` | **Sản phẩm chính**: ghép Host, agent, tool và các store SQLite | ~5.400 dòng | **Có**: thư mục `src/opencode/` |
   | `packages/client/runtime` | **UI trình duyệt**, TypeScript thuần, **không framework** | ~4.800 dòng | Không |
   | `packages/host/api` | **Host HTTP/SSE** chạy trên máy (loopback), `RequestController`, duyệt bước | ~1.300 dòng | Không |
   | `packages/presentation/deck` | `DeckService`: **lưu slide dạng HTML** theo revision, outline, patch | ~1.100 dòng | Không |
   | `packages/llm/providers` | **Adapter 4 giao thức provider**, danh mục model, **mã hoá key bằng DPAPI** | ~700 dòng | **Không**: chỉ runtime cũ dùng |
   | `packages/agent/runtime` | **Vòng lặp agent cũ**, `ToolRegistry`, hợp đồng dùng chung, plugin Cordis | ~500 dòng | Gián tiếp: OpenCode **dùng lại hợp đồng** |
   | `packages/session/persistence` | **Lưu hội thoại** vào SQLite | ~250 dòng | Gián tiếp |
   | `packages/tools/*` | Tool **đọc/ghi file** và **tool trình bày** (`publish_slide`, `patch_slide`, ...) | ~500 dòng | Qua MCP bridge |

   - **DPAPI** là **dịch vụ mã hoá của Windows**: chỉ **đúng tài khoản Windows đó** mới giải mã được.

3. **Mỗi nhóm task đang ở đâu?** Tóm từ [PROGRESS.md](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/docs/versions/v2-opencode/PROGRESS.md) và `HANDOFF.md` của từng nhóm. Mỗi nhóm có **một mốc nghiệm thu**: mốc chỉ PASS khi có **bằng chứng đủ**.

   | Nhóm task | Đã code? | Mốc nghiệm thu | Lỗi hoặc giới hạn đã ghi |
   |---|---|---|---|
   | **Chuyển sang adapter OpenCode** | Có | **PASS** | Lỗi **regex chặn câu tiếng Việt**; **cài mới chưa kiểm** |
   | **Giữ provider và session chạy được** | Có | NOT VERIFIED | **Chỉ Gemini được chạy thật**; 3 giao thức còn lại **thiếu key để thử** |
   | **Nghiệm thu lại hành vi cũ trên OpenCode** | Chỉ test | NOT VERIFIED | Một lần chạy thật **`OPENCODE_FAILED` không rõ nguyên nhân** |
   | **Đưa tài liệu nguồn vào deck** | Có, phải bật | NOT VERIFIED | Lần chạy thật mới nhất **`OPENCODE_FAILED`**; **giới hạn file chưa chốt** |
   | **Đo context và tóm tắt bằng tay** | Có, phải bật | NOT VERIFIED | Lần chạy thật đầy đủ **`OPENCODE_FAILED` trước khi tới bước tóm tắt** |
   | **Sửa slide bằng tay** | Có | NOT VERIFIED | Mong **1 revision mới**, ra **2**; **không ghi nguyên nhân** |
   | **Ảnh từ Internet và xuất PDF** | Có | NOT VERIFIED | Lần chạy đầu **hết giờ** vì regex chặn chữ "insert" |
   | **Skill chạy ngoài app** | Có | NOT VERIFIED | Lần chạy đầu **hết giờ**, **không rõ nguyên nhân** |
   | **Đổi mặc định sang OpenCode, gỡ Cordis** | Không | NOT VERIFIED | Chưa bắt đầu |
   | **Đánh giá luận văn và bàn giao** | Không | NOT VERIFIED | Chưa bắt đầu |

   - => **Chỉ 1 trên 10 mốc PASS**. **Phần lớn chức năng đã code** nhưng **chưa được nghiệm thu**.

4. **Vấn đề 1: chữ PASS dựa vào đâu?**
   - Observation: mốc PASS duy nhất dựa trên **một câu chat của owner**: "**ok đã pass smoke test, đánh dấu là hoàn thành đi**". Handoff ghi: "**The owner did not supply itemized manual outcomes, browser version or an exact manual candidate SHA.**"
   - Observation: các lần **smoke test** (chạy thử nhanh các ca chính) của **mọi nhóm** đều ghi **thiếu commit đã test, thiếu trình duyệt, thiếu kết quả từng ca**. Smoke test của nhóm **"skill chạy ngoài app"** do **chính agent chạy**, ghi rõ là "**not owner UX acceptance**".
   - => **Không biết chắc** commit nào đã được test bằng tay. **Một PASS ở đây không chứng minh** hành vi đúng ở commit `5bd9c17`.

5. **Vấn đề 2: lỗi khi chạy với model thật chưa rõ nguyên nhân.**
   - Observation: **3 lần `OPENCODE_FAILED` không rõ nguyên nhân**:
     - ở **bước outline đầu tiên**, sau 150 giây, "**no provider status**";
     - ở bước **dựng slide sau khi xác nhận**, khi làm từ tài liệu nguồn;
     - ở **bước outline đầu tiên** của ca đo context.
   - Observation: **1 lần ra 2 revision** thay vì 1 khi sửa slide. **2 lần hết giờ**: một lần **do regex**, một lần **không rõ nguyên nhân**.
   - Observation: các lỗi **đã biết nguyên nhân**:
     - **Gemini trả HTTP 503**, do provider tạm ngừng; sau đó nhãn lỗi được sửa thành `PROVIDER_TIMEOUT`;
     - endpoint **OpenAI-compatible của Google** trả **HTTP 400** vì thiếu `thought_signature` → **chặn Gemini 3 trên đường này**;
     - **HTTP 400** do `store=false`, **đã sửa**.
   - Inference: **luồng tạo deck từ đầu tới cuối chưa ổn định** trên OpenCode. Nguyên nhân có thể nằm ở **adapter**, ở **OpenCode** hoặc ở **provider**; tài liệu **không tách được**.
   - => Đây đúng là **rủi ro walking skeleton phải dọn**: phải **chạy ổn trên máy mình** trước khi làm build nào.

6. **Vấn đề 3: logic nghiệp vụ sai hoặc khác spec.**
   - Observation: **regex chặn phạm vi sửa** ([editing-workflow.ts:4-8](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/editing-workflow.ts#L4-L8)) **chặn mọi tin nhắn** chứa một trong các chữ `thêm`, `không`, `xóa`, `chèn`, `hoặc`, `add`, `not`, `or`, ... ở **bất kỳ đâu**:
     ```
     /\b(?:except|excluding|not|don't|do not|add|insert|remove|delete|or)\b|ngoại trừ|trừ slide|không|thêm|chèn|xóa|hoặc/u
     ```
     => Câu bình thường như "**sửa slide 2, không đổi màu**" **bị chặn**. Đây là **lỗi đã ghi nhận, chưa sửa**. Nhóm task "ảnh và PDF" còn **né nó trong prompt test** thay vì sửa.
   - Observation: phạm vi sửa chỉ được nhận khi tin nhắn có **dạng cố định**: **động từ + "toàn bộ"**, **số slide hoặc khoảng số**, hoặc **tiêu đề trong ngoặc kép**. Mọi trường hợp khác giao cho model, **trừ khi regex trên đã chặn**.
     - => Khác spec: spec để **hệ thống hiểu phạm vi** và **hỏi lại một câu khi mơ hồ**.
   - Observation: **xác nhận outline** chỉ nhận khi **cả tin nhắn** khớp **đúng một câu trong danh sách** như `xác nhận`, `xác nhận dàn ý`, `confirm outline` ([outline-workflow.ts:5-38](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/outline-workflow.ts#L5-L38)). Ngoài ra có **nút trên UI** và **tool `review_outline`** để model **đề xuất** cho Host kiểm.
     - => **An toàn**: không xác nhận nhầm. Nhưng câu như "**ok làm đi**" **không xác nhận được qua chat**. Đây là **dữ liệu cho câu hỏi mở số 7**: **ai đọc câu trả lời là "xác nhận" hay "xin sửa"**.
   - Observation: **lưu provider không kiểm key với provider** ([provider-settings.ts:184-222](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/provider-settings.ts#L184-L222)): key được **mã hoá và lưu ngay**.
     - => **Thiếu** hành vi "**chỉ lưu khi provider chấp nhận key**" (FR-041).
   - Observation: tool activity **từng dùng ID sai quy ước** của client. Đã **sửa cho lần chạy mới**, nhưng **activity cũ đã lưu không được chuyển**.

7. **Vấn đề 4: kiến trúc.**
   - Observation: **hai runtime cùng sống**. Code OpenCode **dùng lại hợp đồng** của runtime cũ (`AgentHandle`, `ToolRegistry`, `SessionStore`). Còn **5 chỗ phụ thuộc Cordis**, kể cả chính `apps/local-web`.
   - Observation: **mỗi lần gửi tạo một session OpenCode mới**. **Toàn bộ lịch sử** được **chuyển thành JSON và nhét vào prompt** ([history.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/history.ts)), giới hạn 4 MB. **OpenCode chỉ là bộ chạy một lượt**; **DeckAgent tự giữ lịch sử**.
     - Inference: **chi phí và độ dài prompt tăng theo hội thoại**. Mọi tính năng session của OpenCode **không được dùng**.
   - Observation: **tự tóm tắt hội thoại của OpenCode bị tắt** (`compaction {auto:false, prune:false}`). Thay vào đó là **tóm tắt bằng tay** của DeckAgent.
   - Observation: **chỉ chạy trên Windows**: kiểm **SHA-256 của file `opencode.exe` Windows 1.19.5**, mã hoá key bằng **DPAPI**, dừng bằng `taskkill`. **Chỉ Gemini** được chạy thật.
   - => Nhiều lựa chọn ở đây **là quyết định thiết kế của nhánh**, **không phải sự thật về OpenCode**. Ví dụ "**một session mới mỗi lần gửi**" né được câu hỏi "OpenCode lưu session thế nào", nhưng **không trả lời** câu đó.

8. **Vấn đề 5: lệch scope so với spec MVP.** So từng vùng, theo spec ở `dev/mvp/spec/`:

   | Vùng | Spec MVP | Code mẫu | Kết luận |
   |---|---|---|---|
   | **Design system, template, định dạng deck** | Có use case **thiết lập design system**; người dùng **chọn định dạng và template** trong phỏng vấn | **Không có**. SCOPE.md **loại "a separate design-system feature"** | **missing** |
   | **Cách model làm slide** | Model **viết mã nguồn trong khuôn template**; code **kiểm màu và font ngoài theme** (DEC-005) | Model **viết HTML/CSS tự do**; code **chỉ chặn thẻ nguy hiểm** và giới hạn 256 KiB ([html-policy.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/presentation/deck/src/html-policy.ts)) | **differ** |
   | **Phạm vi agent tự dùng** | **Cố định**, do code đặt | **2 preset** người dùng chọn | **differ** |
   | **Xin phép một bước** | Chỉ **cho một lần** hoặc **từ chối** | Thêm **cấp quyền lâu dài cho một file**, thu hồi được | **differ** |
   | **Tóm tắt hội thoại** | **Hệ thống tự làm** khi vượt context; người dùng **không có lệnh** | **Chỉ bằng tay**, có **đồng hồ** gợi ý ở 85% | **differ** |
   | **Phỏng vấn** | **Danh sách chủ đề cố định**, hỏi trong một tin nhắn | "**Ask no fixed questionnaire**", tối đa 6 lựa chọn | **differ** |
   | **Câu hỏi của hệ thống** | **Kết thúc request**; câu trả lời là **request mới** | **Giữ trong cùng request**, trạng thái `awaiting_user` | **differ** |
   | **Huỷ outline** | **Không có** | Có lệnh "**hủy dàn ý**" | **differ** |
   | **Brief đi kèm outline** (định dạng, template, nguồn) | Có | Outline chỉ có **tổng quan + danh sách slide** | **missing** |
   | **Thêm slide khi sửa deck** | Được | Prompt cấm "**change slide count/order**" | **differ** |
   | **Kiểm key trước khi lưu** | Có | Không | **missing** |
   | **Dịch vụ ngoài** (tìm kiếm, tạo ảnh) | Có | **Không**; tìm kiếm web **hoãn** | **missing** |
   | **File ZIP đính kèm** | Được nhận | **Bị từ chối** | **differ** |
   | **Ghi chú người trình bày**, **nguồn của từng nội dung**, **tìm chat theo chữ**, **đánh dấu một phần slide** | Có | **Không** | **missing** |
   | **Workspace** (mặc định, thêm, đổi thư mục, xoá, thư mục mất) | Có | **Gần như khớp** | **match** |
   | **Việc chạy tiếp khi đóng UI**; **sau restart báo chưa xong**, không chạy lại | Có | Có | **match** |

   - Observation: những thứ code mẫu **có mà MVP để trong backlog hoặc không có**:
     - **xuất PDF** (backlog: **xuất deck ra file**);
     - **sửa slide bằng tay** (backlog);
     - **đồng hồ context** (backlog);
     - **sửa tay thông số model** (backlog);
     - **nhập ảnh từ URL Internet**, **skill chạy ngoài app**, **nhập dữ liệu legacy** (không có trong MVP).
   - => **4 trên 8 nhóm task đã code** (đo context, sửa tay, ảnh và PDF, skill ngoài app) nằm ở **phần MVP không build** hoặc **làm khác spec**.

9. **Vấn đề 6: quy trình làm ra code.**
   - Observation: từ commit `4511be5` (**thêm implementation plan**) tới `5bd9c17` có **8 commit**, **175 file**, **+21.499 / −498 dòng**. Tài liệu ghi **Codex là người làm duy nhất** của mọi lane.
   - Observation: số file test tăng **từ 33 lên 70**, do **chính người viết code** viết.
   - Observation: **không có test nào do PO duyệt trước**. Kiểm format **lỗi ở 4 file**. **Cài từ checkout mới chưa kiểm**.
   - => Đúng cái WORKFLOW muốn tránh: **người viết code tự viết test cho mình**. **Test xanh ở đây** chỉ cho biết **code khớp với ý người viết**, **không cho biết khớp spec**.

10. **Vấn đề 7: UI.** Observation: UI là **TypeScript thuần, không framework**; riêng `boot.ts` đã **787 dòng**. PO đánh giá **UI xấu**. => **Không dùng làm nền UI**; chỉ đọc để biết **UI cần những trạng thái nào** (đang chạy, bị dừng, chờ duyệt, file đính kèm).

11. **Code mẫu giúp được gì?** Mỗi điểm dưới đây là **cách làm đáng đọc**, **không phải code để chép**:
    - **Chạy OpenCode an toàn** → **walking skeleton** và **gửi yêu cầu và chờ** ([opencode/agent.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/agent.ts), [opencode/config.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/config.ts), [opencode/process.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/process.ts)):
      - **cấu hình truyền qua biến môi trường** `OPENCODE_CONFIG_CONTENT`, không cần file;
      - **mỗi lần chạy có thư mục HOME riêng**;
      - **tắt** cấu hình của project, tự cập nhật và plugin mặc định;
      - **quyền `'*': 'deny'`**, **chỉ mở** các tool `deckagent_*`;
      - **kiểm phiên bản** OpenCode;
      - **bỏ stderr** vì có thể **lộ key**;
      - **dừng cả cây tiến trình** khi Stop.
    - **MCP bridge theo phase** → **gửi yêu cầu** và **outline** ([opencode/mcp-bridge.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/mcp-bridge.ts), [web-request.ts:294-309](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/web-request.ts#L294-L309)):
      - server HTTP **chỉ nghe trên máy**, có **token riêng mỗi request**;
      - **phase outline** chỉ thấy tool **đọc file và đề xuất outline**;
      - **phase dựng slide** mới thấy `publish_slide`.
      - => Đây là **cách cụ thể** để **giới hạn model bằng code**, đúng tinh thần **ranh giới model / code** của MVP.
    - **Thứ tự publish một slide** → **dựng slide** và **sửa deck** ([deck/src/index.ts:193-270](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/presentation/deck/src/index.ts#L193-L270)):
      - kiểm HTML trước;
      - ghi **trong một transaction**;
      - từ chối khi **revision đã đổi**;
      - một `publicationId` **chỉ áp một lần**, nên **không sinh slide trùng** khi gửi lặp.
    - **Hiển thị slide cô lập** → **nội dung hiển thị không chạm được dữ liệu, key hay mạng** (NFR-004):
      - `iframe` có **`sandbox` rỗng**, nội dung qua `srcdoc`;
      - **CSP** `default-src 'none'; img-src data:`;
      - xem [deck-canvas.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/client/runtime/src/deck-canvas.ts).
    - **Workspace** → **build workspace**: **gần như khớp spec** ([workspace-registry.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/workspace-registry.ts)), và **ADR tách dữ liệu app khỏi thư mục dự án** ([ADR 0001](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/docs/adr/0001-application-storage-and-workspace-boundary.md)).
    - **Provider** → **dịch vụ và key**:
      - ánh xạ **4 giao thức** sang SDK mà OpenCode dùng ([opencode/provider.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/provider.ts));
      - **danh sách provider có sẵn** khớp spec;
      - **danh mục model** với **đường nhập ID bằng tay**;
      - **ma trận tương thích** ghi rõ **giao thức nào đã chạy thật** ([COMPATIBILITY.md](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/docs/versions/v2-opencode/tasks/task-002-provider-session-parity/COMPATIBILITY.md)).
    - **Restart** → **mở lại chat cũ** ([web-state.ts:63-72](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/web-state.ts#L63-L72)): request đang chạy được **đánh dấu `unknown`**, "**No work is replayed**". **Khớp spec**: báo **chưa xong**, **không tự chạy lại**.
    - **Đọc 7 định dạng tài liệu** trong **worker riêng** → **file đính kèm** của build gửi yêu cầu ([materials/](https://github.com/Luke23127006/DeckAgent/tree/5bd9c17/apps/local-web/src/materials)).
    - **Patch slide theo ID của node**, gồm chữ và một **tập giá trị layout đóng** → nhánh **đổi kích thước, khoảng cách, vị trí** của **sửa deck** ([slide-edit.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/presentation/deck/src/slide-edit.ts)).
    - **Các ca lỗi đã gặp** → **đầu vào cho regression test**. WORKFLOW cho phép dùng chúng, nhưng **không tính là test đã duyệt**:
      - câu tiếng Việt có "**thêm**" hay "**không**";
      - **Gemini 503**;
      - **thiếu `thought_signature`**;
      - **`store=false`**;
      - **2 revision thay vì 1**;
      - **hết giờ**.

12. **Code mẫu giúp gì cho 4 câu hỏi runtime đang mở?** **Chỉ là bằng chứng để kiểm lại**, **không phải câu trả lời**:
    - **OpenCode có giữ key và danh mục model không?** Code mẫu **tự giữ key** (DPAPI) và **tự giữ danh mục**. Mỗi lần chạy nó **truyền key vào cấu hình OpenCode**.
      - => Code mẫu **không dùng** chỗ giữ key của OpenCode, nên **câu hỏi vẫn mở**.
    - **Cấu hình có giới hạn được phạm vi agent không?** Có bằng chứng ở **mức ứng dụng**: `'*': 'deny'` **tắt mọi tool gốc**, kể cả bash; chỉ **tool MCP của DeckAgent** được mở. Tài liệu nhắc nhiều lần "**not an OS sandbox**".
      - => Muốn **đọc thư mục dự án mà không ghi** thì code mẫu **tự làm trong tool của mình**, **không nhờ OpenCode**.
    - **OpenCode lưu session thế nào?** Code mẫu **không dùng** session của OpenCode: **mỗi lần gửi một session mới**, ID **chỉ ghi để tra cứu**. => **Câu hỏi vẫn mở**.
    - **Hội thoại ra sao sau khi OpenCode tóm tắt?** Code mẫu **tắt tóm tắt của OpenCode**. => **Câu hỏi vẫn mở**. Spec MVP muốn **hệ thống tự tóm tắt** khi vượt context, nên **phải đo trực tiếp**.

13. **Code mẫu không giúp được gì?**
    - **Không làm nền để fork**: nó kéo theo **legacy, Cordis và phần ngoài scope MVP**; **chỉ một mốc** được nghiệm thu.
    - **Test của nó không phải test đã duyệt**: viết **bởi chính người viết code**, **theo scope luận văn**.
    - **Không quyết thay sản phẩm**: chỗ code mẫu **khác spec** (mục 8) được **PO phán từng dòng** ở Phase 1. **Spec thắng code.**
    - **Không chứng minh chất lượng deck**: model viết **HTML tự do**; **không có theme hay template** để so.
    - **Không giúp phần design system**, và **không giúp UI**.

14. **Đọc gì cho build nào?** Proposal: mỗi build **ghi commit `5bd9c17`** vào **bảng đối chiếu hành vi với spec** ở Phase 1. Thứ tự build theo [mvp-build-order.md](mvp-build-order.md).

    | Build | Nên đọc | Không chép |
    |---|---|---|
    | **Walking skeleton** | `apps/local-web/src/opencode/` (`agent.ts`, `config.ts`, `process.ts`, `mcp-bridge.ts`), `scripts/start-opencode.mjs` | **Phần kiểm SHA chỉ cho Windows** |
    | **Workspace và chat mới** | `workspace-registry.ts`, `web-state.ts`, `packages/session/persistence/`, ADR 0001 | Chat mới **lấy model gần nhất từ `sessionStorage` của tab** ([boot.ts:130-133](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/client/runtime/src/boot.ts#L130-L133)): **mất khi đóng tab** |
    | **Dịch vụ và key** | `provider-settings.ts`, `built-in-providers.ts`, `opencode/provider.ts`, `packages/llm/providers/`, COMPATIBILITY.md | **Lưu key không kiểm**; **sửa tay thông số model** (backlog) |
    | **Gửi yêu cầu và chờ** | `packages/host/api/src/request-controller.ts`, `web-request.ts`, `web-state.ts`, `materials/` | **Preset quyền**, **quyền lâu dài**, **tóm tắt bằng tay**, **giữ câu hỏi trong cùng request** |
    | **Bản nháp deck: phần outline** | `outline-workflow.ts`, `outline-interaction.ts`, `tools/presentation/src/propose-outline.ts` | **Lệnh huỷ outline**, **phỏng vấn không cố định** |
    | **Bản nháp deck: phần slide** | `deck/src/index.ts` (publish), `html-policy.ts`, `deck-canvas.ts` | **HTML tự do không theme** |
    | **Mở lại chat cũ** | `web-state.ts:63-72`, `persistence/src/index.ts` | — |
    | **Sửa deck và hỏi về deck** | `slide-edit.ts`, `patch-slide.ts`, ADR 0006 | **Regex chặn phạm vi**; **cấm thêm slide** |
    | **Thiết lập design system** | **Không có gì** | — |

15. **Giới hạn của lần đọc này.**
    - **Không chạy code**, **không chạy test**. Mọi trạng thái PASS hay FAIL là **theo tài liệu của nhánh**.
    - Phần lớn code được đọc qua **trích đoạn**. Mục 6 và các ý về **regex, xác nhận outline, html-policy, quyền `'*': 'deny'`, lưu provider** được **đọc lại trực tiếp** ở `5bd9c17`.
    - **Đề cương luận văn**, nguồn scope của nhánh, **không có trong repo**, nên **không đọc được**.
    - Nhánh **có thể đi tiếp** sau `5bd9c17`. Khi đó **PO quyết** có **đọc lại** hay không.
