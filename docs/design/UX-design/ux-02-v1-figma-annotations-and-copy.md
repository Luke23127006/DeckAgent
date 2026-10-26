# UX-02 — Annotation và ví dụ nội dung cho UI States V1

> Bản làm việc để đặt annotation lên page `02 - UI States` của file Figma `DeckAgent V1 - UX Foundation`. [State inventory](ux-02-v1-state-inventory.md) xác định trạng thái; [bảng chuyển trạng thái](ux-02-v1-transition-matrix.xlsx) là checklist case. Tài liệu này chỉ chuẩn bị nội dung cho Figma, không thay thế Product Spec hoặc bàn giao thiết kế trên Figma.

## 1. Cách dùng trong Figma

- Mỗi mục dưới đây là **một annotation có thể gắn vào một hoặc nhiều state frame**. ID `AN-xx` chỉ để tìm annotation, không phải trạng thái sản phẩm hay nhãn hiển thị cho người dùng.
- Dòng **Cần thể hiện** mô tả hành vi phải kiểm tra. Dòng **Ví dụ nội dung** là **đề xuất câu chữ**, chưa được Owner duyệt. Các ví dụ viết bằng tiếng Việt để review; Product Spec chưa chốt ngôn ngữ UI.
- Text trong `{ngoặc nhọn}` là dữ liệu của case, không phải giá trị cố định. Khi không biết một dữ liệu, UI phải dùng nhánh “không xác định được”, không điền một số hay nguyên nhân đoán trước.
- Đặt điều kiện, phản hồi, hành động và UC/FR cạnh state frame. Gắn annotation vào vùng tương ứng trong [Foundation HTML](DeckAgent%20V1%20UX%20Foundation.html); không dùng tài liệu này để chốt vị trí, hình thức hoặc kiến trúc.
- `R/C/D/M/H` là ID của [state inventory](ux-02-v1-state-inventory.md). Chỉ các flow mà [V1 Scope](../../versions/v1/SCOPE.md) nhận, trong UC-001, UC-002, UC-003, UC-005, UC-006 và UC-012, được dùng.

## 2. Request area và attachment

### AN-01 — Request rỗng hoặc text quá dài

- **Khi:** Request area không có text có nghĩa và không có attachment; hoặc request text vượt giới hạn.
- **Cần thể hiện:** Request rỗng không được gửi và không hiện lỗi “request rỗng”. Text quá dài giữ nguyên để sửa, báo lý do và chặn gửi. Chỉ request text tính vào giới hạn; nội dung attachment không tính.
- **Ví dụ nội dung đề xuất:** `Nội dung yêu cầu quá dài. Hãy rút ngắn nội dung rồi gửi lại.` Không đặt `{giới_hạn}` lên UI khi [BR-002](../../spec/05-business-rules/BR-002.md) còn `pending`.
- **Nguồn:** UC-003 S1/A6; FR-015; BR-002. Trạng thái C1/C5.

### AN-02 — Attachment đang chuẩn bị, sẵn sàng, hoặc không có preview

- **Khi:** Người dùng thêm file vào request area và mở preview.
- **Cần thể hiện:** Mỗi attachment có tên hoặc preview, loại file và trạng thái `đang chuẩn bị`/`sẵn sàng`/`bị từ chối`. File đang chuẩn bị chặn gửi. File sẵn sàng có thể gửi một mình, không cần request text. Với loại không có preview, nói rõ là không có preview; file vẫn ở request area.
- **Ví dụ nội dung đề xuất:** `{file_name} · Đang chuẩn bị`; `{file_name} · Sẵn sàng`; `Không có bản xem trước cho loại file này.`
- **Nguồn:** UC-003 A3; FR-015, FR-016. Trạng thái C2/C3.

### AN-03 — Attachment bị từ chối

- **Khi:** File sai loại, vượt quy tắc attachment, được bảo vệ, hỏng hoặc không đọc được **ngay lúc thêm**.
- **Cần thể hiện:** Gắn lý do cụ thể với chính attachment. Giữ file bị từ chối cho đến khi user xóa; giữ text và file khác. Một file bị từ chối chặn gửi cả request. Đổi selected model không làm file chuyển sang trạng thái khác.
- **Ví dụ nội dung đề xuất:** `{file_name} không được nhận: loại file này chưa được hỗ trợ.` / `{file_name} không đọc được vì file bị bảo vệ.` / `{file_name} vượt dung lượng cho phép.` Kèm hành động `Xóa file`.
- **Ghi chú:** Các loại được nhận là TXT, MD, PDF, DOCX, PNG, JPEG, PPTX. Số file tối đa cho **mỗi request** và dung lượng tối đa cho **mỗi file** còn `pending`; không tự ghi con số.
- **Nguồn:** UC-003 A8; FR-015, FR-017; BR-001. Trạng thái C4.

### AN-04 — Draft kế tiếp khi request đang active

- **Khi:** User soạn text hoặc thêm/xóa unsent attachment trong lúc request khác chạy hoặc chờ câu trả lời.
- **Cần thể hiện:** Draft mới nằm trong request area; sent request và sent attachments vẫn trong conversation. Không cho gửi request thứ hai khi request trước còn active. Nội dung được gửi để **trả lời câu hỏi đang chờ** thuộc request hiện tại; cần phân biệt rõ với draft cho request kế tiếp.
- **Ví dụ nội dung đề xuất:** `Bạn có thể soạn yêu cầu tiếp theo. Hãy đợi yêu cầu hiện tại kết thúc trước khi gửi.` Với câu hỏi active: `Câu trả lời này sẽ tiếp tục yêu cầu hiện tại.`
- **Nguồn:** UC-003 A14/A38; FR-014, FR-020. Trạng thái R2/R3/R5 cùng C6.

### AN-05 — Suggested option được chọn hoặc đã cũ

- **Khi:** User chọn một suggested option; hoặc chọn option của proposal/trạng thái không còn hiện hành.
- **Cần thể hiện:** Option còn hợp lệ gửi instruction **ngay**; text và attachment chưa gửi trong request area vẫn nguyên. Option trả lời câu hỏi active tham gia request đó. Option đã cũ không thực thi, không đổi chat/deck và phải nói vì sao.
- **Ví dụ nội dung đề xuất:** Với option cũ: `Lựa chọn này không còn áp dụng vì outline hiện tại đã thay đổi. Hãy chọn lựa chọn của outline hiện tại.`
- **Nguồn:** UC-003 S2/A38; UC-001 A23; FR-013, FR-020. Trạng thái R3/R4, C2.

## 3. Request lifecycle, outline và deck

### AN-06 — Request đang chạy

- **Khi:** Request đã gửi và hệ thống đang làm việc.
- **Cần thể hiện:** Sent request nằm trong conversation; status message nêu việc đang làm và thời gian đã trôi. Có Stop. Không tự đổi chat; user có thể chọn model khác cho request sau, còn request hiện tại giữ model và settings lúc bắt đầu. Không ghi thời gian hứa hẹn hoàn tất.
- **Ví dụ nội dung đề xuất:** `Đang chuẩn bị outline… · Đã chạy {elapsed_time}` hoặc `Đang tạo slide {slide_number}… · Đã chạy {elapsed_time}`.
- **Nguồn:** UC-003 S2/S3/A27/A31; UC-001 S3/S5; FR-012, FR-018, FR-042, FR-054; NFR-001/NFR-002 `proposed` hoặc target `not set`. Trạng thái R2/R5.

### AN-07 — Chờ câu trả lời trong request active

- **Khi:** Một câu trả lời có thể đổi kết quả đáng kể; hệ thống hỏi và tạm chờ.
- **Cần thể hiện:** Nói rõ đang chờ, không trình bày như đang chạy. Cho câu trả lời tự viết, suggested option hoặc skip **khi câu hỏi đó cho phép**. Câu trả lời ở cùng request; Stop vẫn khả dụng; đổi chat vẫn bị chặn. Nếu topic của deck đầu còn chưa biết, skip không cho draft outline. Nếu câu trả lời vẫn mơ hồ đáng kể, hỏi tiếp.
- **Ví dụ nội dung đề xuất:** `Bạn muốn trình bày deck này cho ai? Bạn có thể trả lời bằng lời của mình.` Với topic chưa biết: `Mình cần biết chủ đề trước khi đề xuất outline.`
- **Nguồn:** UC-003 A38; UC-001 A32; FR-020, FR-021, FR-054. Trạng thái R3.

### AN-08 — Follow-up chưa rõ phạm vi hoặc hướng sửa

- **Khi:** User yêu cầu đổi deck nhưng không rõ đổi những slide nào, hoặc chỉ nói có vấn đề mà chưa nêu điều cần đổi.
- **Cần thể hiện:** Chưa thay slide. Với phạm vi chưa rõ, cho `Áp dụng cho mọi slide` hoặc `Giữ chỉ dẫn để dùng về sau`; chỉ thêm `Chỉ áp dụng cho slide mới` khi request **có yêu cầu tạo slide mới**. `Áp dụng cho mọi slide` đổi mọi slide hiện có và áp dụng cho slide mới; `Chỉ áp dụng cho slide mới` không đổi slide cũ; `Giữ chỉ dẫn` kết thúc request, không tạo/đổi slide bây giờ và nói instruction sẽ dùng cho slide tạo sau. Với feedback mơ hồ, đưa hướng gợi ý từ deck/conversation nếu có; nếu không có, hỏi user mô tả thêm. Chờ câu trả lời thuộc cùng request.
- **Ví dụ nội dung đề xuất:** `Bạn muốn áp dụng thay đổi này cho mọi slide, hay giữ chỉ dẫn cho các slide tạo sau?` / `Mình chưa xác định được điều cần sửa. Bạn muốn thay đổi nội dung nào?`
- **Nguồn:** UC-002 A1–A4/A6/A10; FR-030–FR-035. Trạng thái R3 → R5 hoặc R6.

### AN-09 — Current outline chờ quyết định

- **Khi:** Proposal đã hoàn tất, chưa có confirmed outline và chưa tạo slide.
- **Cần thể hiện:** Current outline là proposal mới nhất; proposal trước không bị sửa. Outline hiển thị dạng overview: mỗi planned slide có số thứ tự, title và một mô tả ngắn. Mở từng slide hiện nội dung chi tiết (điểm chính, số liệu, placeholder, điểm chưa chốt nếu có). Có `Mở rộng tất cả` (Expand All) và `Thu gọn tất cả` (Collapse All); mở/thu gọn chỉ là thao tác xem: chỉ phần chi tiết đang hiện thay đổi, outline giữ nguyên, không tạo proposal mới, không gửi request và trạng thái chờ confirm không đổi. Đề xuất confirm/cancel; yêu cầu sửa tạo response proposal mới. Confirm current outline **không rỗng** khởi động request build slide mới. Chờ xác nhận outline khác với AN-07: request draft outline đã kết thúc, nên không có Stop cho request cũ và có thể đổi chat.
- **Ví dụ nội dung đề xuất:** `Đây là outline đề xuất. Chưa có slide nào được tạo. Bạn muốn xác nhận, yêu cầu sửa hay hủy outline này?` Mỗi dòng overview: `{slide_number}. {title} — {mô_tả_ngắn}`; mở rộng hiện các điểm: `{điểm_chính}` / `[Cần bổ sung: {fact_thiếu}]`. Điều khiển xem: `Mở rộng tất cả` / `Thu gọn tất cả`.
- **Nguồn:** UC-001 S3/S4/A22/A23; FR-001, FR-003–FR-005, FR-008, FR-054, FR-069. Trạng thái R4, D1.

### AN-09a — Ý định về current outline chưa rõ

- **Khi:** Tin nhắn về outline hiện tại không phân biệt được confirm, cancel, revise hoặc proposal cũ nào được nhắc tới.
- **Cần thể hiện:** Tin nhắn đã gửi bắt đầu request mới; current outline và các proposal cũ giữ nguyên. Hỏi một câu tập trung với option phù hợp; chờ câu trả lời trong **chính request đó** và vẫn cho Stop. Không confirm/cancel/revise trước khi rõ ý định. Câu trả lời confirm bắt đầu build; cancel kết thúc không tạo slide; revise hoặc dùng proposal cũ tạo proposal mới, không khôi phục chính xác bản cũ.
- **Ví dụ nội dung đề xuất:** `Bạn muốn xác nhận outline hiện tại, hủy, yêu cầu sửa hay dùng lại đề xuất trước?` Nếu không rõ proposal cũ nào: `Bạn muốn dùng đề xuất nào?`
- **Nguồn:** UC-001 A39/A23; FR-007, FR-020. Trạng thái R4 → R3 → R5/R4/R6.

### AN-10 — Outline rỗng, thiếu fact, hoặc material mâu thuẫn

- **Khi:** Current outline rỗng; hoặc outline có placeholder/fact còn mở theo material.
- **Cần thể hiện:** Outline rỗng không được offer confirm; typed confirmation được giải thích, không báo lỗi build. Fact riêng của user chưa có phải hiện placeholder. Hai phần material mâu thuẫn phải được nêu rõ và điểm đó vẫn mở; không chọn một bên thay user. File accepted nhưng không dùng được phải được nêu tên và lý do trong message cùng outline.
- **Ví dụ nội dung đề xuất:** `Outline này chưa có nội dung để xác nhận. Hãy yêu cầu sửa outline.` / `Số liệu ở phần A và bảng B không khớp; điểm này đang để mở.` / `[Cần bổ sung số liệu kết quả]`.
- **Nguồn:** UC-001 A9/A24/A33/A34; FR-006, FR-009–FR-011, FR-037. Trạng thái R4a/D6.

### AN-11 — Slide hoàn tất một phần khi đang tạo deck

- **Khi:** Confirmed outline đã có; một hoặc nhiều slide hoàn tất, các slide khác đang chờ.
- **Cần thể hiện:** Deck canvas chỉ hiện slide hoàn tất và phân biệt slide đã xong/chưa xong. Không hiện slide dở như slide hoàn tất. Khi có slide mới xong, không tự đổi slide user đang xem. Confirmed outline vẫn trong conversation, read-only, giữ overview và nội dung chi tiết; người dùng vẫn mở/thu gọn chi tiết của nó để đối chiếu. Thao tác đó không đổi outline và không ngắt việc tạo slide. Chưa gọi deck là hoàn tất và chưa hiện closing message hoàn tất.
- **Ví dụ nội dung đề xuất:** `Đã hoàn tất {completed_count} slide; các slide còn lại đang được tạo.` Dữ liệu này chỉ hiện khi xác định được từ tiến độ thực tế.
- **Nguồn:** UC-001 S4/S5; FR-023, FR-025, FR-069; NFR-002/NFR-012 target `not set`. Trạng thái D2/D3, R5.

### AN-12 — Hoàn tất deck đầu hoặc follow-up

- **Khi:** Tất cả việc của request đã xong.
- **Cần thể hiện:** Với deck đầu, closing message nêu từng slide đã làm, giả định, placeholder, nội dung không từ material user và điều chưa kiểm tra. Với follow-up, nêu từng slide đổi/thêm, điều đã đổi và khẳng định slide ngoài phạm vi không đổi. Không tạo outline mới cho follow-up rõ ràng. Confirmed outline vẫn trong conversation, read-only, mở/thu gọn chi tiết được.
- **Ví dụ nội dung đề xuất:** Deck đầu: `Bản nháp đã sẵn sàng. Slide {n}: {mô_tả}. Giả định: {giả_định}. Placeholder: {phần_cần_bổ_sung}. Nội dung bổ sung ngoài tài liệu của bạn: {nội_dung}. Chưa kiểm tra: {điều_chưa_kiểm_tra}.` Lặp phần mô tả cho từng slide. Follow-up: `Đã đổi slide {danh_sách}: {thay_đổi}. Các slide ngoài phạm vi yêu cầu không đổi.`
- **Ghi chú:** Quy tắc chi tiết cho disclosure nội dung ngoài material còn `BR-?`; ví dụ không đặt thêm tiêu chuẩn xác minh hoặc nguồn cho từng con số.
- **Nguồn:** UC-001 S6; UC-002 S4; FR-024, FR-027, FR-029, FR-069. Trạng thái R6/D4.

### AN-12a — Request kết thúc mà deck không đổi

- **Khi:** User chọn giữ instruction cho slide tạo sau, hoặc request follow-up gọi slide không tồn tại / số slide và title chỉ hai slide khác nhau.
- **Cần thể hiện:** Không báo như đã sửa deck. Với instruction giữ lại, nói không slide nào đổi hoặc được tạo bây giờ; instruction chỉ áp dụng cho slide tạo sau và có thể được thay/rút bằng request mới. Với tham chiếu sai, nêu phần không khớp và số slide hiện có; sent request vẫn trong conversation, không tự gửi lại hoặc sửa sent request. Cho user gửi request mới với tham chiếu đúng.
- **Ví dụ nội dung đề xuất:** `Đã giữ chỉ dẫn này cho các slide tạo sau. Chưa thay đổi hoặc tạo slide nào.` / `Không tìm thấy slide 9; deck hiện có 6 slide. Chưa thay đổi slide nào. Hãy gửi yêu cầu mới với tham chiếu đúng.`
- **Nguồn:** UC-002 A4/A5; FR-034, FR-036. Trạng thái R3/R5 → R6, D4 giữ nguyên.

### AN-12b — Chỉ dùng được một phần material

- **Khi:** Một phần file không đọc được, hoặc conversation và material vượt phần công việc có thể dùng cùng lúc.
- **Cần thể hiện:** Nói trong conversation rằng chỉ dùng một phần; nêu material và phần không dùng khi biết, không nhận đã dùng hết. Nếu thiếu phần quan trọng, chưa hiện outline proposal và hỏi user gửi lại phần đó hoặc đổi request trong R3. Nếu ít ảnh hưởng, tiếp tục request; khi hoàn tất vẫn nêu giới hạn sử dụng material.
- **Ví dụ nội dung đề xuất:** `Mình chỉ đọc được trang 1–11 của report.pdf; trang 12–20 chưa được dùng. Bạn có thể gửi lại phần kết quả thử nghiệm hoặc đổi yêu cầu?` / `Deck đã hoàn tất, nhưng mình không dùng hết material trước đó trong chat.`
- **Nguồn:** UC-003 A43; FR-067, FR-020. Trạng thái R2 → R3 hoặc tiếp tục R2/R6.

### AN-13 — Stop khi chưa có hoặc đã có slide hoàn tất

- **Khi:** User Stop request đang chạy hoặc đang chờ câu trả lời.
- **Cần thể hiện:** Notice nói response bị gián đoạn, không gọi là failure. Sent request còn trong conversation. Nếu Stop khi build/chỉnh deck, giữ confirmed outline và các slide/chỉnh sửa **đã hoàn tất**; slide đang đổi dở giữ bản hoàn tất trước đó. First draft: nêu số slide đã hoàn tất; follow-up: nêu số slide đã đổi, kể cả slide mới. Nói slide hoàn tất có thể không nhất quán. Không tự resume; request sau là request mới.
- **Ví dụ nội dung đề xuất:** `Đã dừng yêu cầu. {completed_count} slide đã hoàn tất; những slide còn lại chưa xong. Các slide đã hoàn tất có thể chưa nhất quán với nhau.` / `Đã dừng thay đổi. {changed_count} slide đã đổi, gồm cả slide mới. Slide đang đổi dở vẫn giữ bản trước.` Khi số thực tế không xác định được: `Đã dừng yêu cầu. Không xác định được số slide đã hoàn tất.` hoặc `Đã dừng thay đổi. Không xác định được số slide đã đổi.`
- **Nguồn:** UC-003 A31; UC-001 A10; UC-002 A7; FR-018, FR-025, FR-026. Trạng thái R7, D2/D3/D4.

### AN-14 — Failure và tiến độ không xác định được

- **Khi:** Request không thể hoàn tất vì lỗi; nguyên nhân hoặc phần đã làm có thể biết hay không biết.
- **Cần thể hiện:** Nói rõ request chưa hoàn tất; nêu nguyên nhân **khi biết**. Giữ sent request, confirmed outline và slide đã hoàn tất; không đưa outline dở thành proposal confirm được. Với follow-up, nêu slide đã/chưa đổi **khi biết**; nếu không biết, nói không xác định được. Không tự retry, không tự chọn model khác. Không để deck canvas trống mà không giải thích.
- **Ví dụ nội dung đề xuất:** `Yêu cầu chưa hoàn tất: {lý_do}. Slide {đã_đổi} đã đổi; slide {chưa_đổi} chưa đổi. Các slide đã đổi có thể chưa nhất quán.` / `Yêu cầu chưa hoàn tất. Không xác định được slide nào đã đổi; các slide hoàn tất vẫn được giữ.`
- **Ghi chú:** Spec chưa chốt nguyên nhân failure nào ngăn việc gửi request mới; không tự thêm quy tắc chặn gửi. Với first draft bị từ chối key, FR-026 không bắt buộc báo số slide.
- **Nguồn:** UC-003 A11; UC-001 A11; UC-002 A11; FR-019, FR-025, FR-026, FR-047. Trạng thái R8, D1/D2/D3/D4.

### AN-15 — Provider từ chối key/model hoặc đạt usage limit

- **Khi:** Provider trả về lý do access bị từ chối hoặc account đạt usage limit.
- **Cần thể hiện:** Tách lý do provider từ chối key với model không được phép, dựa trên lý do provider **thực sự trả về**. Lỗi key chỉ đường đến Models settings để user sửa cấu hình; không hiển thị key. Usage limit nêu rõ đây là giới hạn account. Giữ provider configuration, added models và selected model; không tự đổi hoặc xóa chúng.
- **Ví dụ nội dung đề xuất:** `Yêu cầu chưa hoàn tất: provider từ chối API key đã lưu. Bạn có thể cập nhật key trong Models settings.` / `Yêu cầu chưa hoàn tất: tài khoản đã đạt giới hạn sử dụng do provider báo.` / `Yêu cầu chưa hoàn tất: provider không cho phép dùng model đã chọn.`
- **Nguồn:** UC-003 A18/A19; UC-001 A18/A19; FR-019, FR-040, FR-043. Trạng thái R8/M3.

### AN-16 — Ảnh mới không tạo được

- **Khi:** Tạo ảnh mới thất bại trong first draft hoặc follow-up.
- **Cần thể hiện:** Ảnh user yêu cầu hoặc ảnh thiếu sẽ làm kết quả không đạt yêu cầu → request kết thúc theo failure, giữ phần đã hoàn tất và không thay bằng nội dung khác. Ảnh do hệ thống tự chọn và không bắt buộc → tiếp tục, closing message nêu ảnh dự kiến không tạo được. Lựa chọn ảnh mơ hồ và ảnh hưởng lớn → hỏi user trong cùng request trước khi tiếp tục.
- **Ví dụ nội dung đề xuất:** `Không tạo được ảnh cần cho slide {slide}. Yêu cầu chưa hoàn tất; phần đã xong vẫn được giữ.` / `Ảnh minh họa dự kiến cho slide {slide} không tạo được; các phần khác đã hoàn tất.`
- **Ghi chú:** Cách tạo ảnh mới là dependency Architecture; không vẽ hoặc mô tả nhà cung cấp ảnh cụ thể.
- **Nguồn:** UC-001 A42; UC-002 A12; FR-019, FR-020, FR-066. Trạng thái R3/R8 hoặc R5/R6.

## 4. Model và Models settings

### AN-17 — Không có model selectable, chưa chọn model, hoặc model bị xóa

- **Khi:** User định gửi request mà không có model selectable; có model selectable nhưng chat chưa chọn; hoặc selected model đã bị xóa.
- **Cần thể hiện:** Ba nguyên nhân có lời giải thích khác nhau. Không có config hoặc config không có added model → chỉ nơi setup. Có model selectable nhưng chat chưa chọn → yêu cầu chọn model, không tự mở settings. Model đã chọn bị xóa → nêu model bị xóa khi chat hiển thị, không tự chọn model khác; thêm lại model cũng không khôi phục selection. Cả ba giữ text/attachments trong request area và không gửi request.
- **Ví dụ nội dung đề xuất:** `Chưa có provider configuration. Hãy thiết lập provider và thêm model trong Models settings.` / `Provider configuration đã lưu nhưng chưa có added model. Hãy thêm model trong Models settings.` / `Đã có model khả dụng. Hãy chọn một model cho chat này trước khi gửi.` / `Model {model_name} đã bị xóa khỏi danh sách đã thêm. Hãy chọn model khác cho chat này.`
- **Nguồn:** UC-003 A17/A40/A41; UC-005 A2/A11/A13; FR-046, FR-056, FR-059, FR-065. Trạng thái M1/M2/M4.

### AN-18 — Key đã lưu, thay key và lỗi validation trong settings

- **Khi:** Mở provider configuration đã lưu, thay key hoặc lưu cấu hình thiếu/sai dữ liệu.
- **Cần thể hiện:** Chỉ báo **có/không có key đã lưu**; không hiện toàn bộ key, prefix, suffix hoặc masked part lấy từ key. Lưu thiếu thông tin bắt buộc, display name trống/trùng, provider ID trùng hoặc reserved → nêu lý do cụ thể, không lưu thay đổi đó và giữ input user đã nhập theo UC tương ứng. Rời settings bỏ thay đổi chưa lưu, giữ thay đổi đã lưu; conversation/draft/attachments không đổi.
- **Ví dụ nội dung đề xuất:** `API key: Đã lưu` / `Thiếu thông tin bắt buộc: {tên_trường}.` / `Tên cấu hình này đã được dùng.` / `Provider ID này được giữ cho built-in provider.`
- **Ghi chú:** Trường bắt buộc của từng provider, default model IDs, built-in provider IDs và API protocols cho custom model API còn `pending`. Không dùng key giả có prefix/suffix trong ví dụ màn hình “đã lưu”.
- **Nguồn:** UC-005 MF/A1/A4/A5/A9/A10; FR-038, FR-040, FR-045, FR-057, FR-061; BR-005, BR-006, BR-008. Trạng thái M5/M6.

### AN-19 — Catalog lỗi, restore defaults và xóa config đang được dùng

- **Khi:** Không lấy được model catalog; user restore default models; hoặc muốn xóa provider configuration của active request.
- **Cần thể hiện:** Catalog lỗi vẫn cho nhập model ID thủ công. Chỉ built-in provider có default models mới có restore; phải nói rằng added models sẽ bị thay **trước khi** user xác nhận; hủy thì không đổi. Cố xóa config đang được request dùng, kể cả lúc chờ answer, phải bị chặn; request không Stop và không chuyển model.
- **Ví dụ nội dung đề xuất:** `Không lấy được danh sách model. Bạn vẫn có thể nhập model ID.` / `Khôi phục model mặc định sẽ thay danh sách model đã thêm. Bạn có muốn tiếp tục?` / `Không thể xóa cấu hình này khi một yêu cầu đang dùng nó.`
- **Nguồn:** UC-005 A7/A12/A13; FR-058, FR-062, FR-064. Trạng thái M5/M6.

## 5. Chat history, new chat và reload

### AN-20 — Đổi chat, draft và danh sách chat cũ

- **Khi:** User xem history, mở chat cũ hoặc tạo chat mới khi không có request active.
- **Cần thể hiện:** History có tên từ nội dung, lần thay đổi gần nhất và có/không có slide; không có history thì nói rõ. Mở chat khác không gửi request. Unsent text ở lại chat cũ trong phiên DeckAgent đang chạy; unsent attachments rời request area và không tự quay lại. Sent attachments vẫn ở request đã gửi. Chat mới rỗng, chưa có deck; selected model ban đầu là lựa chọn gần nhất **còn selectable**, nếu có.
- **Ví dụ nội dung đề xuất:** `Chưa có chat cũ. Bạn có thể tạo chat mới.` / `{chat_name} · {last_changed} · {has_slides}`. Giá trị `{has_slides}` có thể là `Có slide` hoặc `Chưa có slide`.
- **Nguồn:** UC-006 MF/A1; UC-012 MF; FR-048, FR-049, FR-053. Trạng thái H1/H2/H3/H5.

### AN-21 — Đổi chat bị chặn hoặc không mở được chat

- **Khi:** User muốn đổi chat trong lúc request đang active; hoặc chọn một chat cũ không mở được.
- **Cần thể hiện:** Request active gồm cả lúc chờ câu trả lời. Không đổi chat, không đưa request chạy nền và không Stop request. Sau Completed/Stopped/Failed mới đổi được. Nếu chat cũ không mở được khi không có request active, giữ current chat và nói lý do **nếu biết**.
- **Ví dụ nội dung đề xuất:** Khi đang chạy: `Yêu cầu hiện tại vẫn đang chạy. Hãy đợi hoàn tất hoặc dừng yêu cầu trước khi đổi chat.` Khi chờ user: `Yêu cầu hiện tại đang chờ câu trả lời. Hãy trả lời hoặc dừng yêu cầu trước khi đổi chat.` Khi mở chat lỗi: `Không mở được chat này: {lý_do}. Chat hiện tại vẫn được giữ.`
- **Nguồn:** UC-006 S1/A3; UC-012 S1; FR-050, FR-054. Trạng thái H4/H6.

### AN-22 — Reload Local Web hoặc mở lại DeckAgent

- **Khi:** User reload/đóng rồi mở lại Local Web trong lúc DeckAgent **vẫn chạy**; hoặc DeckAgent đã dừng giữa request rồi được mở lại.
- **Cần thể hiện:** Hai nhánh phải khác nhau. DeckAgent còn chạy → hiện cùng chat, conversation, deck và tiến độ/câu hỏi hiện tại; không báo interrupted. DeckAgent đã dừng → request cuối không còn chạy; báo chưa hoàn tất, giữ phần đã xong, không tự tiếp tục. Chat cũ chưa có slide phải nói rõ; outline đang chờ confirm vẫn chờ.
- **Ví dụ nội dung đề xuất:** Nhánh còn chạy: `Đang tiếp tục yêu cầu hiện tại…` hoặc `Đang chờ câu trả lời của bạn.` Nhánh DeckAgent đã dừng: `Yêu cầu trước chưa hoàn tất. Phần đã hoàn tất vẫn được giữ; bạn có thể gửi yêu cầu mới.`
- **Nguồn:** UC-003 A13; UC-001 A13; UC-006 A4/A6; FR-051, FR-052, FR-068; NFR-008. Trạng thái H3/H7/H8.

## 6. Rà trước khi đưa lên page `02 - UI States`

- Gắn cả nhánh điều kiện và phản hồi tương ứng; không đưa một câu ví dụ chung vào hai nhánh có kết quả khác nhau.
- Kiểm ví dụ Stop/Failure bằng hai dữ kiện: số hoặc danh sách slide **thực sự biết**, và bản hoàn tất gần nhất của từng slide.
- Không biến `{giới_hạn}`, `pending`, `not set` hoặc ví dụ tên provider/model thành giá trị sản phẩm đã chốt.
- Với mỗi annotation trong Figma, đặt link UC/FR cạnh frame và liên kết tới case liên quan trong [bảng chuyển trạng thái](ux-02-v1-transition-matrix.xlsx). Ghi dependency Architecture cạnh các state cần dữ liệu chưa có.
- Kiểm khả năng dùng bằng bàn phím và khả năng screen reader nhận status message, notice, câu hỏi và text slide theo NFR-013; nội dung từ model/file chỉ hiển thị như nội dung theo NFR-004.
