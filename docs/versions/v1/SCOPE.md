# V1 — Phạm vi

Đây là bản ghi phạm vi của V1: mục tiêu, tiêu chí thành công, các lựa chọn sản phẩm và những flow V1 nhận. Product Spec trong [`docs/spec/`](../../spec/) mô tả một sản phẩm lý tưởng: từng use case viết theo định dạng Main Flow First — một diagram Main Flow hoàn chỉnh đứng trước, mỗi Alternative Flow ở mục riêng của nó. Spec không chọn flow cho phiên bản nào và không đặt version. Việc V1 nhận hay giữ lại (Held) một flow không đổi nội dung của flow đó trong spec.

- Chỉ file này chọn flow cho V1. Một flow của V1 hoặc vào V1, hoặc nằm trong spec như lựa chọn giữ lại cho sau (Held).
- Flow giữ lại vẫn là một flow của sản phẩm lý tưởng trong spec, cùng với tương tác của nó trong diagram, các FR/NFR/BR nó trích và câu hỏi mở.
- Việc V1 nhận một flow không đổi nội dung của flow đó trong spec. Nội dung flow nằm trong use case; file này chỉ ghi mã flow, flow làm gì và vì sao giữ lại.
- Một flow nằm trong behavioral model mà không ở danh sách nào của file này thì chưa được cân nhắc cho version nào. Duyệt hết các flow của behavioral model là cách kiểm điều này.
- File này không dùng `Updated at` của spec: nó không phải một block của spec.

## Mục tiêu

- **Phát biểu:** Kiểm chứng sản phẩm đầu-cuối.
- **Nguồn:** owner.
- **Vì sao:** chưa ghi.
- **Goal:** "Enable users to create, preview, and refine a presentation through conversation with their chosen AI model, so the result reflects their instructions and improves toward their expectations through clarification and feedback." — owner, 11-10-2026.

## Tiêu chí thành công

Tiêu chí cấp sản phẩm, không phải acceptance test.

- **SC-1 · Instruction fidelity:** DeckAgent làm đúng các yêu cầu rõ ràng của người dùng khi tạo hoặc sửa deck.
- **SC-2 · Intent clarification:** DeckAgent giảm bất định khi yêu cầu thiếu, mơ hồ hoặc mâu thuẫn; và giúp người dùng thấy kết quả chưa đúng nhưng chưa nói được cần đổi gì.
- **SC-3 · Iterative convergence:** DeckAgent cải thiện deck qua phản hồi; giữ nguyên nội dung ngoài phần được yêu cầu; người dùng tự đánh giá kết quả có tiến gần kỳ vọng không.

## Lựa chọn sản phẩm

### Giao diện

- **Đã nhận:** Local Web là giao diện để tạo, xem trước và sửa deck trong V1. Người dùng chỉ mở nó từ máy đang chạy DeckAgent.
- **Đã cân nhắc:** giao diện terminal (TUI), giữ như một hướng của vision (P-3) và không chọn cho V1. Truy cập từ thiết bị khác trong cùng mạng, không chọn cho V1.
- **Nguồn:** owner; owner, 2026-10-13 (chỉ truy cập từ máy đang chạy DeckAgent).
- **Không nói:** agent runtime, server, architecture. Use case không chứa chi tiết giao diện (`spec/_STYLE.md` rule 11). Chất lượng của truy cập này do NFR-005 nói.

### Sửa nội dung

- **Đã nhận:** Trong V1 người dùng đổi nội dung và cấu trúc deck qua chat. Hệ thống thực hiện từng thay đổi từ yêu cầu của người dùng. Người dùng xem slide trong **deck canvas**. Sửa trực tiếp outline và sửa nhẹ trực tiếp trên slide không được chọn cho V1.
- **Đã cân nhắc:** sửa trực tiếp text của outline; sửa nhẹ trực tiếp trên slide (bold, italic, font). Cả hai không chọn cho V1; sửa trực tiếp slide ở lại như một năng lực về sau.
- **Vì sao:** hệ thống sửa nội dung từ ý định của người dùng, nên người dùng không phải tự ghép các thay đổi liên quan. Một yêu cầu không cho phép đổi nội dung ngoài phạm vi của nó.
- **Nguồn:** owner.
- **Không nói:** use case mô tả thay đổi nội dung như một **request** (UC-002; UC-001 Note 29). Một lựa chọn gợi ý gửi một instruction (UC-003 Note 23).

### Xuất file

- **Đã nhận:** V1 không có export. Hành trình V1 kết thúc khi người dùng xem lại deck trong Local Web.
- **Đã cân nhắc:** đưa export vào V1, không chọn.
- **Vì sao:** tạo, xem trước và tinh chỉnh đủ để chứng minh mục tiêu V1.
- **Nguồn:** owner.
- **Không nói:** UC-004 vẫn ở trong behavioral model như một năng lực về sau, chưa gán version.

### Chat và workspace

- **Đã nhận:** Trong V1 người dùng bắt đầu **chat** mới cho deck khác, xem các chat trước và mở lại một chat cùng conversation và deck của nó.
  - Chat trước và deck đã lưu vẫn còn sau khi đóng rồi mở lại DeckAgent. Việc đang chạy lúc đóng không được tiếp tục.
  - Khi DeckAgent đang chạy, reload hoặc đóng Local Web không dừng request đang hoạt động.
  - V1 có một workspace mặc định. Người dùng không chọn folder và không cấu hình workspace trước khi chat.
  - Người dùng không bắt đầu chat mới hoặc mở chat trước khi request hiện tại đang hoạt động. Request đang chờ câu trả lời vẫn được tính là hoạt động.
  - Một chat giữ một deck. Deck mới bắt đầu ở chat mới.
  - Request text chưa gửi ở lại với đúng chat của nó khi DeckAgent chạy. Attachment chưa gửi bị bỏ khi người dùng đổi chat. Không hứa gì cho phần chưa gửi sau khi DeckAgent kết thúc.
  - Chat, conversation và deck của chúng được giữ không giới hạn thời gian (BR-004).
  - Cập nhật Ideal Product 2026-10-25 (D1, D4): spec cho phép đổi chat hoặc workspace khi request đang chạy và công việc cũ tiếp tục (UC-012 Note 8, UC-006 Note 10, UC-013), và thêm workspace theo folder với default workspace (UC-013). V1 giữ nguyên hai giới hạn trên: một workspace mặc định và không đổi chat khi request đang hoạt động. Danh sách flow V1 nhận không đổi.
- **Đã cân nhắc:** chỉ một chat (option A), không chọn; workspace theo folder (option C), một lựa chọn về sau chưa gán version (UC-012 Note 2); một chat chứa nhiều deck, không chọn cho V1.
- **Nguồn:** owner; owner, 2026-10-13 (reload hoặc đóng giao diện); owner, 2026-10-13 (một deck cho mỗi chat, request text và attachment chưa gửi, lịch sử giữ không giới hạn).
- **Vì sao:** người dùng bắt đầu việc deck mới mà không phải chọn folder hay quản lý workspace.
- **Không nói:** storage, thư mục làm việc, runtime. UC-012 và UC-006 mô tả hành vi. UC-003 A13 và UC-001 A13 mô tả reload. Không thêm cách xóa chat hay deck. Không hứa giữ dữ liệu người dùng chủ động xóa, hay dữ liệu mất khi ổ đĩa hỏng.

### Models

- **Đã nhận:** Trong V1 người dùng thiết lập model bằng key hoặc model service của mình (Vision P-1).
  - Người dùng lưu được nhiều **provider configuration**. Mỗi cái kết nối tới một **built-in provider** hoặc một **custom model API**. Hai custom model API dùng chung một **API protocol** được.
  - Không hai provider configuration đã lưu có cùng **provider ID**. Provider ID không đổi sau khi lưu. Muốn dùng provider khác thì thêm provider configuration.
  - Người dùng đổi được key hoặc thông tin xác thực khác của provider configuration đã lưu; đổi được **display name**, và **base URL** ở nơi provider cho phép. Display name không rỗng và không trùng.
  - Người dùng thêm model vào từng provider configuration, từ **model catalog** của provider hoặc bằng **model ID**. Người dùng xóa được **added model** và khôi phục **default models** sau khi xác nhận.
  - Người dùng xóa được provider configuration, trừ khi một request đang hoạt động dùng nó.
  - Mỗi chat có **selected model** riêng; người dùng chọn trong các **selectable model** của mọi provider configuration.
  - Người dùng thiết lập provider configuration và model trong phần Models của settings. Phần này gồm built-in provider, custom model API, model catalog và các provider configuration đã lưu.
- **Đã cân nhắc:** một model đang dùng, thiết lập bằng key của người dùng (owner, 2026-10-11); một provider configuration với mọi model key đó dùng được (owner, 2026-10-12); hai provider configuration cho cùng một provider, và đổi provider (owner, 2026-10-12). Hai điều sau bị thay thế trong cùng ngày. Không điều nào giữ cho V1. Model chạy trên máy người dùng (owner, 2026-10-13): V1 không hứa, không cài và không kiểm thử; một model tương thích dùng được như custom model API, không kiểm thử và không hứa. Nó không phải một tính năng riêng.
- **Nguồn:** owner, 2026-10-12; owner, 2026-10-13 (không hứa model chạy trên máy người dùng).
- **Vì sao:** chưa ghi.
- **Không nói:** không đặt tổng số provider configuration. Cách tổ chức settings là hướng owner chọn, không phải thiết kế giao diện; use case vẫn không chứa chi tiết giao diện. UC-005 và UC-003 mô tả hành vi. V1 đặt bốn built-in provider lên trước (BR-005). Custom model API vẫn thuộc V1. Storage chưa cố định.
- Cập nhật Ideal Product 2026-10-25 (D5): mỗi added model có model settings (context window, max output tokens, input types) và reasoning levels riêng, và người dùng chọn reasoning level cho chat (UC-005 Note 15, UC-003 A27, FR-042, FR-055, BR-005 V-7, V-8). V1 không nhận phần này; behavior Models của V1 vẫn như các dòng trên.

### Hình ảnh

- **Đã nhận:** Trong V1 agent dùng được ảnh từ attachment của người dùng trên slide, và tạo được ảnh mới cho slide.
  - Cách tạo ảnh mới chưa chốt: công nghệ, model hay service riêng, model hoặc provider nào, và có phải mọi model đều tạo được hay không.
  - DeckAgent không thêm image service, không tìm ảnh và không lấy ảnh từ internet.
  - DeckAgent không đổi selected model và không chuyển việc sang provider khác để tạo ảnh.
  - Yêu cầu rõ ràng về ảnh đính kèm hoặc ảnh mới được thực hiện. Khi yêu cầu không nói và lựa chọn làm thay đổi kết quả nhiều, hệ thống hỏi.
  - Ảnh mới mà người dùng yêu cầu, hoặc kết quả không thể thiếu, mà không tạo được: công việc không hoàn tất được. Ảnh mới do agent tự thêm mà không tạo được thì bỏ ra, và tin nhắn kết thúc nói rõ.
  - Dùng ảnh từ attachment không phê duyệt loại file nào. BR-001 đặt các loại được nhận.
- **Đã cân nhắc:** agent tìm ảnh trên internet, không chọn; người dùng sửa trực tiếp slide hoặc dán ảnh cho agent, lựa chọn về sau, không chọn cho V1.
- **Nguồn:** owner, 2026-10-13.
- **Vì sao:** chưa ghi.
- **Không nói:** UC-001 A42, UC-002 A12 và FR-066 mô tả hành vi. UC-001 Note 38 giữ lựa chọn ảnh và ảnh không tạo được. Nội dung người dùng chỉ đi tới service khác provider của selected model sau khi owner duyệt (NFR-007). Cách tạo ảnh là việc của architecture research.

### Ngôn ngữ nội dung

- **Đã nhận:** DeckAgent viết nội dung deck bằng ngôn ngữ người dùng yêu cầu. Khi ngôn ngữ chưa rõ, áp dụng quy tắc làm rõ.
  - Request không nêu ngôn ngữ và request text rõ ràng dùng một ngôn ngữ: DeckAgent dùng ngôn ngữ đó.
  - Ngôn ngữ của attachment không vượt qua một request rõ ràng.
  - Tiếng Việt và tiếng Anh được kiểm trước.
  - Đây không phải danh sách ngôn ngữ DeckAgent cam kết.
- **Nguồn:** owner, 2026-10-13.
- **Vì sao:** chưa ghi.
- **Không nói:** FR-008 và FR-022 mô tả hành vi. NFR-009 kiểm ký tự tiếng Việt và tiếng Anh trước.

### Nền tảng

- **Đã nhận:** Windows đứng đầu cho DeckAgent.
  - Nhóm phát triển, chạy và kiểm DeckAgent trên Windows trước.
  - Architecture research ưu tiên lựa chọn chạy tốt trên Windows, tránh dependency làm DeckAgent khó chạy ở đó.
  - macOS và Linux chưa là mục tiêu.
  - Hướng này giữ nguyên cho giao diện terminal về sau.
- **Nguồn:** owner, 2026-10-13.
- **Vì sao:** chưa ghi.
- **Không nói:** không hứa gì cho mọi phiên bản Windows, thiết bị hay phần cứng. Không đặt danh sách nền tảng hay trình duyệt, và không yêu cầu việc chạy nhiều nền tảng. NFR-014 nói việc build và chạy trên Windows.

### Yêu cầu chất lượng cho cả version

- **Đã nhận:** V1 nhận các NFR cấp sản phẩm mà không FR và không System response nào của một flow trong V1 nói về hành vi chúng ràng buộc:
  - NFR-005
  - NFR-014
- **Nguồn:** owner, 2026-10-13: một NFR cấp sản phẩm mà không requirement hay flow nào trích được thì thuộc V1 qua danh sách này.
- **Không nói:** danh sách chỉ giữ ID. Một NFR được một block hay một FR của V1 trích thì không có trong danh sách.

## Flow V1 nhận

Mỗi dòng ghi flow nào vào V1 và nó làm gì. Nội dung của flow nằm trong use case; sửa hành vi thì sửa use case và các FR nó trích.

| Use case | Flow | Flow làm gì |
|---|---|---|
| UC-001 | MF | Người dùng đưa tài liệu, hệ thống dựng outline, người dùng xác nhận, hệ thống dựng slide, người dùng xem bản nháp |
| UC-001 | A9 | File không có gì dùng được; bản nháp đi tiếp với ghi chú |
| UC-001 | A10 | Người dùng dừng khi đang dựng slide |
| UC-001 | A11 | Lượt gọi model lỗi khi đang dựng slide |
| UC-001 | A12 | Mất kết nối khi đang chờ hoặc đang dựng slide |
| UC-001 | A13 | Reload hoặc quay lại khi request đang chạy |
| UC-001 | A18 | Provider từ chối quyền truy cập model |
| UC-001 | A19 | Tài khoản provider chạm giới hạn dùng |
| UC-001 | A22 | Người dùng hủy outline |
| UC-001 | A23 | Người dùng gửi instruction mới cho outline |
| UC-001 | A24 | Outline rỗng, không xác nhận được |
| UC-001 | A32 | Hệ thống hỏi trước khi dựng outline |
| UC-001 | A33 | Tài liệu mâu thuẫn với chính nó |
| UC-001 | A34 | Tài liệu thiếu một dữ kiện cần thiết |
| UC-001 | A39 | Hệ thống hỏi người dùng muốn gì ở outline |
| UC-001 | A42 | Dùng ảnh trên slide |
| UC-002 | MF | Người dùng mô tả thay đổi, hệ thống áp dụng, người dùng xem kết quả |
| UC-002 | A1 | Phạm vi thay đổi chưa rõ |
| UC-002 | A2 | Áp dụng thay đổi cho mọi slide |
| UC-002 | A3 | Chỉ áp dụng thay đổi cho slide mới |
| UC-002 | A4 | Giữ instruction cho lần sau |
| UC-002 | A5 | Request nêu một slide hệ thống không khớp được |
| UC-002 | A6 | Hệ thống hỏi cần đổi gì |
| UC-002 | A7 | Người dùng dừng khi đang đổi slide |
| UC-002 | A10 | Hệ thống gợi hướng khi phản hồi chưa rõ |
| UC-002 | A11 | Công việc lỗi khi đang đổi slide |
| UC-002 | A12 | Dùng ảnh trên slide được đổi |
| UC-003 | MF | Người dùng chuẩn bị, gửi request, chờ và thấy công việc xong |
| UC-003 | A3 | Đính kèm file hoặc ảnh |
| UC-003 | A6 | Gửi request rỗng |
| UC-003 | A8 | Từ chối một file đính kèm |
| UC-003 | A11 | Công việc không hoàn tất được |
| UC-003 | A12 | Mất kết nối |
| UC-003 | A13 | Reload hoặc quay lại |
| UC-003 | A14 | Gõ trong lúc hệ thống đang làm việc |
| UC-003 | A17 | Không có selectable model |
| UC-003 | A18 | Provider từ chối quyền truy cập model |
| UC-003 | A19 | Tài khoản provider chạm giới hạn dùng |
| UC-003 | A27 | Chọn model khác |
| UC-003 | A28 | Mở phần thiết lập model |
| UC-003 | A31 | Dừng công việc |
| UC-003 | A38 | Chờ câu trả lời của người dùng |
| UC-003 | A40 | Selected model không còn selectable |
| UC-003 | A41 | Selected model đã bị xóa |
| UC-003 | A43 | Chỉ dùng được một phần tài liệu |
| UC-005 | MF | Lưu một provider configuration và thêm model vào nó |
| UC-005 | A1 | Đổi một provider configuration |
| UC-005 | A2 | Xóa một added model |
| UC-005 | A3 | Provider không được cung cấp |
| UC-005 | A4 | Rời phần thiết lập model |
| UC-005 | A5 | Thiếu dữ liệu thiết lập bắt buộc |
| UC-005 | A6 | Key bị từ chối lúc thiết lập |
| UC-005 | A7 | Model catalog không lấy được |
| UC-005 | A8 | Thêm model vào provider configuration đã lưu |
| UC-005 | A9 | Provider ID đã được lưu |
| UC-005 | A10 | Display name không hợp lệ |
| UC-005 | A11 | Xóa một provider configuration |
| UC-005 | A12 | Provider configuration đang được dùng |
| UC-005 | A13 | Khôi phục default models |
| UC-006 | MF | Người dùng hỏi việc cũ, chọn một chat và thấy lại công việc |
| UC-012 | MF | Người dùng yêu cầu chat mới, nhận chat mới và bắt đầu việc mới |

## Flow chưa được cân nhắc

Những use case sau vẫn ở trong behavioral model và chưa flow nào của chúng được cân nhắc cho một version. Mọi flow của chúng là `MF` và mọi `Ax` ghi trong use case; chúng ở lại để cân nhắc về sau.

| Use case | Nội dung |
|---|---|
| UC-004 | Xuất deck thành file |
| UC-007 | Sửa trực tiếp nội dung deck (thêm, xóa, sao chép, di chuyển slide; sửa text) |
| UC-008 | Xem lại và quay về một trạng thái deck trước đó |
| UC-009 | Hỏi về nội dung của deck |
| UC-010 | Thiết lập design system |
| UC-011 | Tạo một **variant** của deck bằng ngôn ngữ hoặc mục đích khác |

## Flow giữ lại (Held)

Những flow này ở trong spec nhưng V1 không nhận. Chúng vẫn là flow của behavioral model, chờ được cân nhắc.

| Use case | Flow | Flow làm gì | Vì sao giữ lại |
|---|---|---|---|
| UC-001 | A5 | Chọn một design system có sẵn cho deck | Chưa cân nhắc cho version nào |
| UC-001 | A14 | Gõ request tiếp theo trong lúc hệ thống đang dựng slide | Chưa cân nhắc cho version nào |
| UC-001 | A29 | Đưa một deck cũ làm mẫu (pattern) | Chưa cân nhắc cho version nào |
| UC-001 | A30 | Dựng outline từ deck mẫu (pattern) | Chưa cân nhắc cho version nào |
| UC-001 | A35 | Thiết lập design system mới (đi sang UC-010) | UC-010 chưa gán version |
| UC-001 | A36 | Chọn look trước khi dựng slide | Chưa cân nhắc cho version nào |
| UC-001 | A37 | Yêu cầu ghi chú cho người thuyết trình | Chưa cân nhắc cho version nào |
| UC-002 | A8 | Đổi look của deck | Chưa cân nhắc cho version nào |
| UC-002 | A9 | Đổi ghi chú cho người thuyết trình | Chưa cân nhắc cho version nào |
| UC-003 | A2 | Nói request thay vì gõ | Chưa cân nhắc cho version nào |
| UC-003 | A4 | Lấy tài liệu từ một connector | Chưa cân nhắc cho version nào |
| UC-003 | A15 | Voice input không khởi động được | Chưa cân nhắc cho version nào |
| UC-003 | A16 | Voice input kết thúc sớm | Chưa cân nhắc cho version nào |
| UC-003 | A25 | Chọn một skill | UC-? (skills dashboard) chưa được viết |
| UC-003 | A26 | Mở skills dashboard | UC-? (skills dashboard) chưa được viết |
| UC-006 | A1 | Chưa có việc cũ nào | Chưa cân nhắc cho version nào |
| UC-006 | A2 | Tìm một chat theo từ ngữ | Chưa cân nhắc cho version nào |
| UC-006 | A3 | Chat không mở được | Chưa cân nhắc cho version nào |
| UC-006 | A4 | Chat chưa có slide nào | Chưa cân nhắc cho version nào |
| UC-006 | A5 | Công việc vẫn đang chạy trong chat | V1 không cho mở chat khi request đang hoạt động |
| UC-006 | A6 | Công việc đã kết thúc trước khi xong | Chưa cân nhắc cho version nào |

## Validation baseline

Bộ xác minh tối thiểu cho goal của V1. Đây là baseline ngắn, không phải test specification.

| Scenario | Tiêu chí chính | Mục đích |
|---|---|---|
| VS-01 | SC-1 | Bản nháp rõ ràng từ tài liệu nguồn |
| VS-02 | SC-1 | Yêu cầu sửa tiếp theo rõ ràng |
| VS-03 | SC-2 | Làm rõ ý định còn thiếu |
| VS-04 | SC-2 | Thiếu dữ kiện và tài liệu mâu thuẫn |
| VS-07 | SC-3 | Tinh chỉnh qua nhiều lượt |
| VS-08 (revised) | SC-2 | Làm rõ có hướng dẫn khi phản hồi chưa rõ |

- **VS-03:** kiểm hai điều tách biệt.
  - Hệ thống hỏi thông tin để làm rõ ý định người dùng.
  - Hệ thống nói ra các giả định nó đã đặt.
  - Thông tin làm rõ phải làm thay đổi outline hoặc deck kết quả.
- **VS-07:** kiểm ba điều.
  - Mỗi lần sửa theo phản hồi của người dùng.
  - Nội dung ngoài phản hồi giữ nguyên.
  - Kết quả tiến gần kỳ vọng theo đánh giá của người dùng. Tin nhắn kết thúc của hệ thống là không đủ chứng minh.
- **VS-08:** người dùng nói "Slide 3 doesn't look right."
  - DeckAgent dùng deck và conversation làm context.
  - Nó đưa các hướng cải thiện slide phù hợp.
  - Người dùng chọn một hướng hoặc nói thêm.
  - DeckAgent chỉ đổi deck khi hướng đã rõ.
  - Làm rõ cơ bản là đường lùi khi không có hướng nào đủ căn cứ. Chẩn đoán thiết kế không thuộc scenario này.
- **Giới hạn:**
  - Bộ này xác minh goal của V1 và ba tiêu chí thành công của nó.
  - Nó không thay acceptance test cho thiết lập model, dừng, lỗi hay nhập file.
  - Nó không chọn flow.
- **Đã cân nhắc, ngoài bộ:** VS-05 (các instruction xung đột), VS-06 (follow-up request chạm slide nó không nêu tên), VS-09 (đổi model sau một thay đổi tay).
- **Nguồn:** owner.
- **Vì sao:** chưa ghi.
