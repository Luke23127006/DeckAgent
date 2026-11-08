# Thứ tự build của MVP — proposal

Question: **build các use case của MVP theo thứ tự nào** để **xác suất sinh lỗi thấp nhất**? Viết ngày **08-11-2026** cho **Phase 0 bước 1** của [WORKFLOW](../WORKFLOW.md) (PO **chốt scope và thứ tự build**, ghi vào [README](../README.md)). Nguồn: **9 file use case**, **toàn bộ yêu cầu và luật** trong `dev/mvp/spec/`, [open-questions.md](open-questions.md), và phân tích code mẫu ở [opencode-reference.md](opencode-reference.md). **Đây là proposal**; **PO duyệt** thì README mới được điền.

1. **Scope đã chốt là gì?** PO chốt: **build toàn bộ spec MVP, trừ backlog**. Tính ra là **9 use case**, **93 yêu cầu chức năng** (FR), **11 yêu cầu phi chức năng** (NFR) và **14 luật nghiệp vụ** (BR):
   - **Workspace theo thư mục** (UC-013): người dùng **làm việc trong thư mục dự án** của mình; có **workspace mặc định** không cần thư mục.
   - **Chat mới cho một deck khác** (UC-012): mỗi chat **giữ tối đa một deck**; chat mới **mang theo model vừa dùng**.
   - **Thiết lập dịch vụ bằng key của mình** (UC-005): **provider, key, model**, và **dịch vụ ngoài** (tìm kiếm, tạo ảnh).
   - **Gửi yêu cầu và chờ hệ thống làm** (UC-003): phần **dùng chung cho mọi yêu cầu**, gồm **file đính kèm, activity, Stop, lỗi, xin phép, tự tóm tắt hội thoại**.
   - **Tạo bản nháp deck đầu tiên** (UC-001): **phỏng vấn → outline → người dùng xác nhận → dựng slide**.
   - **Mở lại chat cũ để làm tiếp** (UC-006).
   - **Sửa deck bằng yêu cầu tiếp theo** (UC-002).
   - **Hỏi về deck mà không sửa** (UC-009).
   - **Thiết lập design system** (UC-010): **theme, luật bằng lời và brand file** mà deck phải theo.
   - **Không build (backlog)**: **xuất deck ra file** (UC-004), **sửa deck bằng tay** (UC-007), **quay về trạng thái cũ của deck** (UC-008), **xuất một session** (UC-016), **đổi tên hoặc xoá chat** (UC-018), **làm tiếp deck đã xuất** (UC-019), **chạy model qua một coding-agent CLI có login riêng** (UC-005-A18), **khôi phục model mặc định** (FR-062), **hiện mức dùng context** (FR-078), **sửa tay thông số model** (FR-081), **xuất file ra nơi người dùng chọn** (FR-085).

2. **Lỗi trong dự án này sinh ra từ đâu?** Thứ tự build chỉ giảm được lỗi nếu **nhắm đúng nguồn lỗi**. Inference từ tình trạng dự án và từ code mẫu:
   - **Tích hợp runtime**: **4 câu hỏi về OpenCode còn mở**, gồm **giữ key**, **giới hạn phạm vi**, **lưu session** và **tóm tắt hội thoại**. Code mẫu cũng có **lỗi `OPENCODE_FAILED` chưa rõ nguyên nhân** (xem [opencode-reference.md](opencode-reference.md)).
   - **Model không tất định**: **cùng input cho output khác nhau**, nên **test CI phải thay model bằng fixture**, còn **chất lượng chấm bằng eval**.
   - **Người viết code không tự kiểm**: dev **ít cam kết** và **agent coding**. Lỗi lọt qua khi **ticket rộng** hoặc **test viết sau code**.
   - **Hiểu sai spec**: **118 mục** yêu cầu và luật; **một build ôm quá nhiều mục** thì **dễ sót**.
   - **Hợp đồng dùng chung đổi muộn**: ví dụ **vòng đời một yêu cầu** được **4 use case dùng**, và **cách lưu dữ liệu chat** được **mọi use case dùng**. Đổi muộn thì **sửa lan ra nhiều build**.

3. **Lý thuyết nói gì về thứ tự tích hợp?** **Tích hợp** ở đây là **ghép các phần đã viết thành hệ chạy được**. So sánh theo cùng tiêu chí:

   | Hướng | Cách làm | Lỗi thường sinh ở đâu | Hợp WORKFLOW? |
   |---|---|---|---|
   | **Big bang** | Viết **mọi phần riêng**, **ghép một lần** cuối | **Lỗi tích hợp dồn cuối kỳ**, **khó biết lỗi của phần nào** | **Không**: không có test nghiệm thu chạy được tới cuối |
   | **Bottom-up** | Làm **lớp nền trước** (lưu trữ, provider, tool), **lớp trên sau**; lớp dưới được test bằng **driver** (code giả gọi vào) | **Lỗi ghép nối lộ muộn**; dễ **làm thừa** thứ lớp trên không cần | **Kém**: test nghiệm thu viết **theo use case**, mà use case **chưa chạy được** tới cuối |
   | **Top-down** | Làm **UI và luồng trước**, lớp dưới là **stub** (code giả trả kết quả cố định) | **Stub che lỗi thật** của runtime và model; lỗi dồn vào lúc **thay stub** | **Một phần**: thấy luồng sớm, nhưng test **xanh trên stub** là **xanh giả** |
   | **Sandwich** | Làm **trên và dưới cùng lúc**, **gặp nhau ở giữa** | Lỗi **dồn ở tầng giữa**; cần đội **phối hợp chặt** | **Không hợp** đội **ít cam kết** |
   | **Risk-first** (mô hình xoắn ốc, Boehm 1988) | Làm phần **nhiều ẩn số nhất trước** | **Tránh làm lại hàng loạt**; nhưng **build đầu rất nặng** | **Hợp** nếu ẩn số được **dọn bằng spike**, **không dồn vào build đầu** |
   | **Walking skeleton + lát dọc** (Cockburn, *Crystal Clear* 2004; Freeman và Pryce, *Growing Object-Oriented Software, Guided by Tests* 2009) | Dựng **đường mỏng nhất chạy thật** qua **mọi lớp**, rồi **làm dày từng lát**; mỗi lát là **một use case xuyên mọi lớp** | **Rủi ro tích hợp bị loại từ đầu**; mỗi lát là **diff nhỏ** trên nền **đã khoá test**, lỗi **khoanh vùng ngay** | **Hợp nhất**: WORKFLOW **đã có walking skeleton** ở Phase 0 và **test nghiệm thu theo use case** |

   - => **Ít lỗi nhất** là **ghép ba hướng**: **walking skeleton** và **spike** ở Phase 0 để **dọn ẩn số kỹ thuật**; sau đó mỗi build là **một lát dọc**, xếp theo **thứ tự phụ thuộc**. Như vậy build nào cũng **chỉ dựa trên build đã khoá test**, test nghiệm thu **không phải stub hành vi chưa có**, và **lỗi mới nằm ở build mới nhất**.
   - **Spike** là **thử nghiệm nhỏ, có giới hạn thời gian**, để **trả lời một câu hỏi kỹ thuật**; **code của nó bỏ đi**.

4. **Use case nào cần use case nào?** Dựng từ phần **điều kiện bắt đầu** ("Trigger and precondition") và **Notes** của từng use case. Mũi tên đọc là "**phải có trước**".

   ```mermaid
   flowchart TD
     WS["Workspace theo thư mục (UC-013)"]
     CHAT["Chat mới (UC-012)"]
     SVC["Dịch vụ và key (UC-005)"]
     REQ["Gửi yêu cầu và chờ (UC-003)"]
     DRAFT["Bản nháp deck đầu tiên (UC-001)"]
     REOPEN["Mở lại chat cũ (UC-006)"]
     CHANGE["Sửa deck (UC-002)"]
     ASK["Hỏi về deck (UC-009)"]
     DS["Thiết lập design system (UC-010)"]
     WS -->|"chat thuộc workspace đang dùng"| CHAT
     CHAT -->|"chọn model cho một chat"| SVC
     SVC -->|"không có model thì không gửi"| REQ
     WS -->|"agent đọc thư mục dự án"| REQ
     REQ -->|"bản nháp là một yêu cầu"| DRAFT
     REQ -->|"hiện yêu cầu đang chạy hoặc chưa xong"| REOPEN
     DRAFT -->|"hiện deck đã lưu"| REOPEN
     DRAFT -->|"cần outline hoặc deck"| CHANGE
     DRAFT -->|"cần deck có slide"| ASK
     SVC -->|"đọc brand file bằng một model"| DS
     DRAFT -.->|"deck dùng design system có sẵn trước"| DS
   ```

   - Observation: **chọn model cho một chat** (FR-055) và **báo model của chat đã bị xoá** (FR-065) đều **cần đã có chat**. => **Chat phải có trước dịch vụ và key**, **không ngược lại**.
   - Observation: **chat mới hiện model của lần chọn gần nhất** (UC-012 bước 2). Nếu **chưa từng chọn model**, chat mới **ghi là chưa có model** (UC-012 nhánh A1). => Build chat **test được trước** build dịch vụ: lúc đó **chỉ có nhánh "chưa có model"**; nhánh **có model** được **test lại ở build dịch vụ**.
   - Observation: **thiết lập design system** chỉ **cần một model** để **đọc brand file** (FR-135). Trước khi có nó, **tạo deck dùng design system có sẵn** (BR-003). => Nó **đứng cuối được** mà **không chặn ai**.

5. **Rủi ro nào được dọn ở đâu?** Mỗi rủi ro **dọn ở chỗ sớm nhất** có thể:
   - **OpenCode chạy thật** trên máy Windows, **từ UI qua runtime, tool tới renderer** → **walking skeleton** (Phase 0).
   - **Tỷ lệ model viết mã nguồn deck bị code từ chối**: theo quyết định **model viết mã nguồn deck trong khuôn template** (DEC-005), **code kiểm mỗi lần ghi** và **từ chối bản sai**. Nếu tỷ lệ từ chối cao thì **phải xem lại cách làm slide** → **spike ở Phase 0**: **1 template HTML, 1 theme**, một bản nháp và 3 yêu cầu sửa, **đếm số lần bị từ chối** (câu mở số 5).
   - **OpenCode có giữ key và danh mục model không** (câu mở số 1) → **Phase 1 của build dịch vụ và key**.
   - **Cấu hình OpenCode có giới hạn được phạm vi agent không**: **đọc** thư mục dự án, **không ghi** vào đó kể cả qua bash, **không đụng chat khác**, **hỏi người dùng** trước bước vượt phạm vi (câu mở số 2) → **Phase 1 của build gửi yêu cầu**.
   - **OpenCode lưu session thế nào**, **cái gì còn sau restart** (câu mở số 3) → **Phase 1 của build workspace và chat** (chọn chỗ lưu), **kiểm lại ở build mở lại chat**.
   - **Hội thoại ra sao sau khi OpenCode tóm tắt** (câu mở số 4) → **Phase 1 của build gửi yêu cầu**.
   - **Ai đọc câu trả lời là "xác nhận outline" hay "xin sửa"**: model, code hay một nút xác nhận riêng (câu mở số 7). Code legacy dùng **regex chặn cả câu tiếng Việt bình thường** → **implementation plan của build outline**.
   - **Model ghi nguồn cho từng nội dung cần nguồn** thế nào, và **code giữ bản ghi đó ở đâu** (câu mở số 6) → **Phase 1 của build dựng slide**.

6. **Proposal thứ tự.** **8 build** sau Phase 0, mỗi build là **một lát dọc**:

   | # | Build (use case) | Vì sao ở vị trí này | Rủi ro chính | Câu hỏi cần chốt trước | Code mẫu đáng đọc |
   |---|---|---|---|---|---|
   | **B0** | **Walking skeleton** và **spike tỷ lệ từ chối** (Phase 0) | **Dọn ẩn số kỹ thuật** trước mọi build | OpenCode **không chạy ổn** trên Windows; **cách làm slide không đứng vững** | — | **Cách gọi OpenCode CLI** và **MCP bridge** |
   | **B1** | **Workspace theo thư mục** (UC-013) và **chat mới** (UC-012) | **Không phụ thuộc ai**; **code tất định**, test **chỉ cần CI** → team **tập quy trình trên build dễ** | **Cách lưu dữ liệu chat** chọn sai thì **mọi build sau phải sửa** | **Tên workspace mới**, **có đổi tên được không**, **thêm lại cùng thư mục thì có lấy lại chat cũ không** (câu mở số 15) | **Workspace** và **lưu trữ**, ADR "tách dữ liệu app khỏi thư mục dự án" |
   | **B2** | **Thiết lập dịch vụ và key** (UC-005) | **Gửi yêu cầu cần model**; **chọn model cần chat** (B1) | **Key lộ** ra log hoặc ra model; **danh mục model** không có | **Giữ key ở đâu**, **provider cần gì ngoài key** (câu mở số 14, 17) | **Ma trận tương thích 4 giao thức provider** |
   | **B3** | **Gửi yêu cầu và chờ** (UC-003) | **Mọi yêu cầu sau đều đi qua đây**; khoá bằng test trước thì build sau **không phải sửa lại** | **Stop, lỗi, chạy song song**; **phạm vi của agent** | **Giới hạn file đính kèm**: số lượng, dung lượng, loại (câu mở số 13); **có cần nút thử lại không** (câu mở số 16) | **Vòng đời request**, **Stop**, **parser tài liệu**, **cấu hình quyền** |
   | **B4** | **Bản nháp deck đầu tiên** (UC-001), **phần outline**: phỏng vấn, outline, sửa outline, xác nhận, nguồn, tìm kiếm | **Giá trị lớn nhất**; mọi thứ nó cần **đã khoá test** | **Phân biệt "xác nhận" với "xin sửa"**; **hỏi lại khi mơ hồ** | **Định dạng nào có**, **template mặc định** của mỗi định dạng (câu mở số 9) | **Luồng outline và xác nhận** (**không chép regex**) |
   | **B5** | **Bản nháp deck đầu tiên** (UC-001), **phần slide**: dựng slide, hiện deck, ảnh, nguồn của nội dung | **Tách khỏi B4** vì use case này **lớn nhất**: gộp lại là **42 yêu cầu và luật**, gần **gấp đôi** build lớn thứ hai (24) | **Slide vỡ khung**, **nội dung model viết chạy được code** | **Design system có sẵn nào là mặc định** (câu mở số 8) | **Cách hiển thị deck** (iframe sandbox) |
   | **B6** | **Mở lại chat cũ** (UC-006) | **Khoá cách lưu sớm**, trước khi B7 **thêm trạng thái** | **Dữ liệu không đọc lại được** sau khi tắt bất ngờ | — | **Giữ dữ liệu qua restart** |
   | **B7** | **Sửa deck** (UC-002) và **hỏi về deck** (UC-009) | Hai use case **phân ranh với nhau**: tin nhắn chỉ hỏi thì **trả lời**, có đòi sửa thì **sửa**, đọc được cả hai kiểu thì **hỏi lại**. **Test ranh giới ở một build** thì **ít lỗi hơn tách đôi** | **Sửa lan ra ngoài phạm vi**; **trả lời mà vô tình sửa** | **Đổi template của deck đang có** chưa được spec (câu mở số 10) | **Sửa có phạm vi** (scoped edit) |
   | **B8** | **Thiết lập design system** (UC-010) | **Độc lập**, chỉ **mở rộng thứ đã có**; đứng cuối thì **không làm hỏng** luồng tạo deck đã khoá | **Đổi design system làm đổi deck cũ** | **Theme gồm giá trị gì**, chốt cùng template đầu tiên (câu mở số 8) | **Không có**: code mẫu **loại tính năng này** |

   - **Cái giá:** người dùng **thấy deck thật muộn** (ở B5), nhưng skeleton ở Phase 0 **đã chạy ra deck xấu từ đầu**.
   - **Cái giá về quy trình:** 8 build nghĩa là **8 vòng 6 phase**. WORKFLOW cho **gộp hoặc tách build** theo bước và nhánh của use case; mục 8 nêu **chỗ gộp được** nếu PO thấy nặng.

7. **Phương án khác và vì sao không chọn.**
   - **Risk-first thuần**: build đầu là **tạo bản nháp deck**, key và workspace **làm sau**. Ưu: **thấy giá trị sớm nhất**. Nhược: build đầu **gánh cả ẩn số runtime lẫn quy trình mới**, và **phải stub** key, workspace, chat rồi **thay sau**, đúng **điểm yếu của top-down**. Phần rủi ro thì **B0 đã gánh** → **không chọn**.
   - **Bottom-up thuần**: làm **hết lưu trữ, provider, tool** rồi mới tới use case. Nhược: **không viết được test nghiệm thu theo use case** tới cuối, **trái WORKFLOW** → **không chọn**.
   - **Tách theo lớp** (một build cho backend, một build cho UI): mỗi build **không có use case nào chạy trọn**, nên **không có tiêu chí nghiệm thu** → **không chọn**.

8. **PO cần quyết gì.**
   - **Duyệt thứ tự** B0–B8, hoặc chỉnh.
   - **Skeleton làm ngay hay hoãn**: hoãn thì nó thành **ticket implementation đầu tiên của B1** và **chặn bước code của mọi build**. Proposal: **làm ngay, có giới hạn thời gian**, vì nó **trả lời bằng thực tế** phần lớn 4 câu hỏi runtime.
   - **Tách tạo bản nháp deck thành B4 và B5**, hay **giữ một build**. Proposal: **tách**, vì gộp lại nó có **42 yêu cầu và luật**, gần **gấp đôi** build lớn thứ hai. Sau khi tách, **mỗi build có 4 đến 24 mục** (đếm ở mục 10).
   - **Chỗ gộp được** nếu thấy 8 build nặng: **B6 vào B7** (mở lại chat chỉ có **3 yêu cầu riêng** và **1 yêu cầu phi chức năng**).
   - **Câu hỏi sản phẩm nào chốt trước build nào**: theo cột "Câu hỏi cần chốt trước" ở mục 6.

9. **Giới hạn của proposal này.**
   - **Bảng gán** ở mục 10 gán mỗi mục vào **build đầu tiên test được nó**. Mục **dùng xuyên nhiều build**, như **một chat chỉ một yêu cầu đang chạy** (FR-014) hay **phạm vi của agent** (FR-077), phải được **build sau giữ nguyên**; test đã khoá **tự bảo vệ** điều đó.
   - **Hai yêu cầu phi chức năng không use case nào trích**: **dữ liệu người dùng chỉ rời máy qua provider và dịch vụ đã thiết lập** (NFR-007) và **slide hiện trọn, không vỡ khung** (NFR-009). Chúng được **gán theo nghĩa**: B3 và B5.
   - Observation: [open-questions.md](open-questions.md) câu 18 và 19 nhắc tới **NFR-014** (môi trường build và chạy: Windows, phần cứng, trình duyệt), nhưng **spec không có file NFR-014**. => PO **thêm vào spec** hoặc **bỏ khỏi câu hỏi**.
   - **Số lượng yêu cầu** chỉ **đo độ lớn thô**: một yêu cầu có thể **nặng hơn hẳn yêu cầu khác**.
   - **Code mẫu không được chạy**; cột "Code mẫu đáng đọc" dựa trên **đọc tài liệu và code** ([opencode-reference.md](opencode-reference.md)).

10. **Phụ lục: mỗi yêu cầu và luật thuộc build nào.** Gán vào **build đầu tiên test được nó**.

    | Build | Việc nó làm | ID |
    |---|---|---|
    | B1 | Thêm workspace và đổi workspace đang dùng | FR-071 |
    | B1 | Có workspace mặc định từ lần chạy đầu | FR-072 |
    | B1 | Xoá một workspace | FR-073 |
    | B1 | Báo thư mục dự án không đọc được | FR-074 |
    | B1 | Chọn thư mục khác cho một workspace | FR-083 |
    | B1 | Không đổi file nào trong thư mục dự án | FR-084 |
    | B1 | Bắt đầu chat mới | FR-053 |
    | B1 | Hiện các chat cũ | FR-048 |
    | B1 | Giữ bản nháp chưa gửi của chat | FR-038 |
    | B1 | Chat nào được giữ làm việc cũ | BR-004 |
    | B2 | Hiện phần thiết lập và provider cần gì | FR-039 |
    | B2 | Không bao giờ hiện lại key đã lưu | FR-040 |
    | B2 | Chỉ lưu provider khi provider chấp nhận key | FR-041 |
    | B2 | Đổi key hoặc base URL của provider | FR-043 |
    | B2 | Rời phần thiết lập không giữ thay đổi chưa lưu | FR-044 |
    | B2 | Không lưu khi thiếu thứ provider cần | FR-045 |
    | B2 | Chọn model cho một chat | FR-055 |
    | B2 | Thêm model vào provider | FR-058 |
    | B2 | Bỏ một model đã thêm | FR-059 |
    | B2 | Xoá cấu hình provider | FR-063 |
    | B2 | Báo model của chat đã bị xoá | FR-065 |
    | B2 | Thiết lập dịch vụ ngoài bằng key riêng | FR-133 |
    | B2 | Key chỉ tới phần gửi request tới đúng provider | NFR-006 |
    | B2 | Provider, model đã thêm và model chọn được | BR-005 |
    | B2 | Mỗi provider cần gì để thiết lập | BR-006 |
    | B2 | ID của cấu hình provider | BR-008 |
    | B2 | Các loại dịch vụ ngoài | BR-016 |
    | B3 | Gửi yêu cầu và hiện việc đang làm tới khi xong | FR-012 |
    | B3 | Gửi câu trả lời hoặc bản sửa được gợi ý | FR-013 |
    | B3 | Mỗi chat chỉ một yêu cầu đang chạy | FR-014 |
    | B3 | Khi nào một yêu cầu được gửi | FR-015 |
    | B3 | Hiện từng file đính kèm và trạng thái | FR-016 |
    | B3 | Từ chối file đính kèm không dùng được | FR-017 |
    | B3 | Dừng một yêu cầu | FR-018 |
    | B3 | Báo yêu cầu không xong | FR-019 |
    | B3 | Yêu cầu chạy với thiết lập lúc nó bắt đầu | FR-042 |
    | B3 | Không gửi khi không có model | FR-046 |
    | B3 | Nói rõ khi chỉ dùng một phần tài liệu | FR-067 |
    | B3 | Việc vẫn chạy khi đóng hoặc mất giao diện | FR-068 |
    | B3 | Hiện activity của một yêu cầu | FR-070 |
    | B3 | Hỏi trước bước vượt phạm vi của agent | FR-076 |
    | B3 | Agent tự dùng được gì mà không hỏi | FR-077 |
    | B3 | Tóm tắt hội thoại khi vượt context của model | FR-079 |
    | B3 | Báo việc không lưu được | FR-087 |
    | B3 | Phản hồi sớm sau khi gửi | NFR-001 |
    | B3 | Agent chỉ chạm tới phạm vi của chat | NFR-003 |
    | B3 | Dữ liệu người dùng chỉ rời máy qua dịch vụ đã thiết lập | NFR-007 |
    | B3 | File đính kèm hỏng không ảnh hưởng phần khác | NFR-010 |
    | B3 | Stop có hiệu lực sớm | NFR-011 |
    | B3 | File đính kèm được nhận | BR-001 |
    | B3 | Độ dài tối đa của yêu cầu | BR-002 |
    | B4 | Có outline trước mọi slide | FR-001 |
    | B4 | Xác nhận outline hiện tại | FR-003 |
    | B4 | Sửa outline hoặc dùng lại đề xuất cũ | FR-005 |
    | B4 | Hỏi lại khi ý về outline mơ hồ | FR-007 |
    | B4 | Soạn outline từ yêu cầu và tài liệu | FR-008 |
    | B4 | Bỏ qua file không có gì dùng được | FR-009 |
    | B4 | Đánh dấu dữ kiện tài liệu không cho | FR-010 |
    | B4 | Nói ra chỗ tài liệu tự mâu thuẫn | FR-011 |
    | B4 | Phỏng vấn trước outline đầu tiên | FR-021 |
    | B4 | Giữ điểm còn tranh cãi trong outline | FR-037 |
    | B4 | Xem outline dạng tổng quan và chi tiết | FR-069 |
    | B4 | Dùng tìm kiếm công khai làm nguồn | FR-088 |
    | B4 | Báo tìm kiếm không ra và đưa hướng đi tiếp | FR-089 |
    | B4 | Không đưa dữ liệu riêng vào tìm kiếm công khai | FR-090 |
    | B4 | Chọn định dạng deck trong phỏng vấn | FR-113 |
    | B4 | Chỉ đưa ra định dạng làm được ngay | FR-117 |
    | B4 | Xác nhận nguồn trước outline | FR-124 |
    | B4 | Gợi ý bản sửa kèm outline | FR-126 |
    | B4 | Nêu chỗ đổi trong outline đã sửa | FR-127 |
    | B4 | Trả lời câu hỏi, chỉ đổi đúng thứ được hỏi | FR-128 |
    | B4 | Chỉ gợi ý nguồn và ảnh làm được ngay | FR-129 |
    | B4 | Các nhóm định dạng và định dạng mặc định | BR-011 |
    | B4 | Chủ đề phỏng vấn và loại nguồn | BR-013 |
    | B4 | Nội dung nào cần nguồn | BR-015 |
    | B5 | Dựng slide từ outline đã xác nhận | FR-022 |
    | B5 | Hiện deck trong lúc dựng slide | FR-023 |
    | B5 | Tin nhắn kết thúc bản nháp đầu | FR-024 |
    | B5 | Giữ slide đã xong khi việc dừng sớm | FR-025 |
    | B5 | Dùng ảnh trên slide | FR-066 |
    | B5 | Thông điệp của slide rõ ràng | FR-091 |
    | B5 | Chưa xong slide khi còn lỗi đã biết | FR-092 |
    | B5 | Chọn design system cho deck | FR-093 |
    | B5 | Khoá định dạng của một deck | FR-116 |
    | B5 | Giấy phép và nguồn của ảnh tìm được | FR-125 |
    | B5 | Viết ghi chú người trình bày khi được yêu cầu | FR-130 |
    | B5 | Giữ và ghi nguồn cho nội dung cần nguồn | FR-138 |
    | B5 | Chờ slide đầu tiên | NFR-002 |
    | B5 | Nội dung hiển thị không chạm được gì | NFR-004 |
    | B5 | Slide hiện trọn, không vỡ khung | NFR-009 |
    | B5 | Design system mặc định | BR-003 |
    | B5 | Giấy phép của ảnh tìm được | BR-014 |
    | B5 | Template của mỗi định dạng | BR-018 |
    | B6 | Mở một chat cũ | FR-049 |
    | B6 | Báo chat không đọc được dữ liệu đã lưu | FR-050 |
    | B6 | Tìm chat cũ theo chữ | FR-134 |
    | B6 | Giữ trạng thái đã lưu sau khi tắt bất ngờ | NFR-008 |
    | B7 | Sửa deck đúng phạm vi yêu cầu | FR-027 |
    | B7 | Làm tiếp bản nháp đầu đã dừng sớm | FR-028 |
    | B7 | Báo thay đổi đã làm trên deck | FR-029 |
    | B7 | Hỏi trước khi sửa một yêu cầu mơ hồ | FR-031 |
    | B7 | Từ chối tham chiếu slide không khớp deck | FR-036 |
    | B7 | Đổi thiết kế của slide | FR-107 |
    | B7 | Nhắm yêu cầu vào phần đã đánh dấu của slide | FR-131 |
    | B7 | Dùng nguồn của brief cho yêu cầu tiếp theo | FR-132 |
    | B7 | Theo yêu cầu đi lệch một luật bằng lời | FR-136 |
    | B7 | Trả lời về deck, nói mỗi ý dựa vào đâu | FR-137 |
    | B7 | Nêu chỗ deck tự mâu thuẫn | FR-139 |
    | B7 | Hỏi câu hỏi nói về phần nào của deck | FR-140 |
    | B7 | Chờ thay đổi trên deck | NFR-012 |
    | B8 | Hiện design system đề xuất trước khi lưu | FR-096 |
    | B8 | Lưu design system làm từ cái khác | FR-097 |
    | B8 | Xoá design system tự tạo | FR-098 |
    | B8 | Lấy luật thiết kế từ brand file | FR-099 |
    | B8 | Đổi design system không đổi deck cũ | FR-106 |
    | B8 | Giữ nguyên design system có sẵn | FR-112 |
    | B8 | Đọc brand file bằng một model chọn được | FR-135 |
    | B8 | Một design system chứa gì | BR-017 |
