# Quality attributes

Đọc file này để biết yêu cầu chất lượng toàn hệ thống của DeckAgent: thời gian phản hồi, bảo mật, quyền riêng tư, toàn vẹn dữ liệu, hiển thị và độ tin cậy, mỗi yêu cầu có số đo và điểm đo.

## Tổng quan

Mỗi yêu cầu chất lượng là một quality attribute scenario gồm sáu phần [[1]](#ref-1). Yêu cầu chất lượng chỉ thuộc một use case nằm trong bảng rule của use case đó. ID trong file theo [Tiền tố ID](README.md#tiền-tố-id).

Thời gian trong file này đo end to end, từ thao tác của người dùng tới lúc người dùng thấy kết quả.

## Performance

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFR-001 | Người dùng | Người dùng gửi request | Vận hành bình thường | Chat | Hệ thống hiển thị dấu hiệu đã nhận request và bắt đầu làm request. Dấu hiệu này không chờ phản hồi của provider | 1 s, từ lúc người dùng gửi request tới lúc dấu hiệu đã nhận hiển thị | Product owner | Confirmed |
| NFR-002 | Người dùng | Người dùng xác nhận outline | Model đã chọn của chat. Outline có số slide mà người dùng đã thống nhất. Mạng bình thường, không giả lập lỗi. Thời gian chờ provider được ghi riêng | Deck canvas | Slide hoàn tất đầu tiên hiển thị trong deck canvas. Thời gian chờ gồm thời gian của provider | 60 s, từ lúc người dùng xác nhận outline tới lúc slide hoàn tất đầu tiên hiển thị trong deck canvas | Product owner | Dropped: thời gian phụ thuộc model và provider, và dự án không đo thời gian này |
| NFR-011 | Người dùng | Người dùng dừng request | Provider không gửi gì | Request đang chạy | Hệ thống hiển thị việc dừng đã có hiệu lực | 1 s, từ lúc người dùng dừng request tới lúc hệ thống hiển thị việc dừng đã có hiệu lực | Product owner | Confirmed |
| NFR-012 | Người dùng | Người dùng gửi một request tiếp theo rõ ràng [(OQ-053)](../open-questions.md#oq-053) | Model đã chọn của chat. Request tiếp theo đổi 1 slide. Mạng bình thường, không giả lập lỗi. Thời gian chờ provider được ghi riêng | Deck canvas | Slide đã đổi hiển thị trong deck canvas. Thời gian chờ gồm thời gian của provider | 30 s, từ lúc người dùng gửi request tiếp theo tới lúc slide đã đổi hiển thị trong deck canvas | Product owner | Dropped: thời gian phụ thuộc model và provider, và dự án không đo thời gian này |

## Security

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFR-003 | Model hoặc nội dung mà agent đọc, ví dụ chỉ dẫn ẩn trong file đính kèm hoặc trong thư mục dự án | Agent yêu cầu một bước ngoài phạm vi của chat | Hai chat có dấu đánh dấu riêng. Một thư mục nằm ngoài thư mục dự án. Một model service cố ý yêu cầu các bước bị cấm | Phạm vi mà agent truy cập trong một request | Agent chỉ truy cập phạm vi mà chat của agent truy cập được mà không cần hỏi, và mỗi bước người dùng đã duyệt một lần. Không nội dung nào mà agent đọc mở rộng phạm vi đó. Yêu cầu này giới hạn phạm vi truy cập, không hứa model bỏ qua chỉ dẫn ẩn | 0 lần truy cập dữ liệu của chat khác, và 0 lần sửa, chuyển hoặc xoá file của người dùng [[2]](#ref-2) LLM01:2025 mục 4, 6, 7; LLM06:2025 mục 1–7 [[3]](#ref-3) 5.3.2 (L1) | Product owner | Confirmed |
| NFR-004 | Model hoặc tài liệu | Nội dung do model viết hoặc lấy từ tài liệu chứa script | Nội dung deck chứa script | Nội dung hiển thị ở mọi nơi trong DeckAgent | Nội dung đó không chạy với quyền truy cập dữ liệu của DeckAgent, key hay mạng. Code do các phần tin cậy của DeckAgent chạy, ví dụ template của deck, không thuộc loại nội dung này. Việc tải font, ảnh hoặc tài nguyên khác mà slide cần không phải quyền truy cập này | Script không đọc được key hay dữ liệu của DeckAgent, và không mở được kết nối mạng nào ngoài việc tải font, ảnh và tài nguyên khác mà slide cần [[2]](#ref-2) LLM05:2025 mục 3, 6 [[3]](#ref-3) 3.2.1 (L1), 1.3.1 (L1), 3.4.3 (L2), 1.3.4 (L2), 1.3.5 (L2) | Product owner | Confirmed |
| NFR-006 | Người dùng | Người dùng lưu key | Một key mẫu đã lưu | Key đã lưu | Key chỉ tới các phần của DeckAgent gửi request tới provider hoặc dịch vụ bên ngoài của key đó. Key không bao giờ nằm trong nội dung model nhận, và không bao giờ xuất hiện trong cuộc hội thoại, deck, bản ghi lỗi hoặc file nằm ngoài nơi DeckAgent giữ key | 0 lần key mẫu xuất hiện trong nội dung gửi tới model, cuộc hội thoại, deck, bản ghi lỗi hoặc file nằm ngoài nơi giữ key [[3]](#ref-3) 16.2.5 (L2), 16.5.1 (L2) | Product owner | Confirmed |

## Privacy

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFR-007 | Người dùng | Người dùng gửi request có nội dung của người dùng | Ghi lại mọi kết nối ra ngoài trong lúc request chạy | Nội dung của người dùng | Nội dung của người dùng chỉ rời máy trong request gửi tới provider của model đã chọn hoặc tới dịch vụ bên ngoài mà người dùng đã thiết lập. Mọi kết nối ra ngoài khác không mang nội dung của người dùng. Tài liệu của dự án liệt kê mỗi loại kết nối ra ngoài cùng phạm vi và mục đích của nó | Chỉ request tới provider của model đã chọn hoặc tới dịch vụ bên ngoài mà người dùng đã thiết lập mang nội dung của người dùng. Tài liệu của dự án liệt kê mỗi loại kết nối ra ngoài đã ghi được | Product owner | Confirmed |

## Data integrity

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFR-008 | Máy của người dùng | DeckAgent kết thúc ngoài dự kiến | DeckAgent bị kill process sau lần lưu gần nhất | Trạng thái đã lưu của mỗi chat, deck của chat, và thiết lập provider và model | Trạng thái đã lưu gần nhất còn nguyên. Sau khi DeckAgent khởi động lại, mỗi chat mở ở trạng thái đã lưu gần nhất và nhận request mới. Không thay đổi dở dang nào của slide hiển thị như kết quả đã xong. Yêu cầu này không hứa kết quả hiển thị ngay trước lúc kết thúc đã được lưu, và không bao gồm draft của chat | Mỗi chat mở ở trạng thái đã lưu gần nhất và nhận request mới, và không slide nào có thay đổi dở dang hiển thị như kết quả đã xong | Product owner | Confirmed |

## Display integrity

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFR-009 | Hệ thống | Một slide hoàn tất | Deck ở ngôn ngữ người dùng đã chọn trong phỏng vấn. Kiểm với tiếng Việt, và với một ngôn ngữ khác ngôn ngữ người dùng viết | Slide hoàn tất trong deck canvas | Slide hiển thị đầy đủ. Chữ không bị cắt và không tràn ra ngoài slide, và không nội dung nào che nội dung khác đến mức không đọc được. Mỗi ảnh, font và tài nguyên khác mà slide dùng đều hiển thị, và ký tự hiển thị đúng theo ngôn ngữ của deck | Mỗi slide hoàn tất hiển thị đầy đủ, mỗi ảnh và font của slide hiển thị, và slide không có chữ bị cắt, chữ tràn ra ngoài slide, nội dung bị che, hay ký tự sai | Product owner | Confirmed |

## Reliability

| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFR-010 | Người dùng | Người dùng thêm file | File bị hỏng, sai loại, hoặc lớn hơn kích thước tối đa của một file đính kèm (BR-001.V3) | File đính kèm | File chỉ ảnh hưởng tới file đính kèm của chính nó, bất kể nội dung file. DeckAgent vẫn phản hồi trong lúc chuẩn bị file, và mỗi file đã thêm kết thúc ở trạng thái sẵn sàng hoặc bị từ chối | Mỗi file đã thêm kết thúc ở trạng thái sẵn sàng hoặc bị từ chối, và giao diện vẫn phản hồi trong lúc chuẩn bị file [[3]](#ref-3) 5.2.1 (L1), 5.2.2 (L1), 5.1.1 (L2) | Product owner | Confirmed |

## Gap analysis

Baseline độc lập của file này là SEI quality attribute scenario [[1]](#ref-1), OWASP Top 10 for LLM Applications 2025 [[2]](#ref-2) và OWASP ASVS 5.0.0 [[3]](#ref-3). ISO/IEC 25010 không được dùng, vì bản gốc của chuẩn chưa đọc được. Mức áp dụng: sáu phần của mỗi scenario và ba loại scenario, các mục LLM01, LLM02, LLM05 và LLM06, và các chương V1, V3, V5 và V16 của ASVS.

| ID | Gap | Baseline | Quyết định | Trạng thái |
| --- | --- | --- | --- | --- |
| GAP-01 | Bộ scenario chưa có growth scenario | SEI quality attribute scenario [[1]](#ref-1) | [Growth scenario (OQ-067)](../open-questions.md#oq-067) | Open |
| GAP-02 | Không rule nào giới hạn kích thước sau khi giải nén và số file bên trong một file nén | OWASP ASVS 5.0.0 mục 5.2.3 (L2) [[3]](#ref-3) | [Giới hạn của file nén (OQ-066)](../open-questions.md#oq-066) | Open |

## References

1. <a id="ref-1"></a>M. Barbacci và cộng sự, *Quality Attribute Workshops (QAWs), Third Edition*, CMU/SEI-2003-TR-016, Software Engineering Institute, 2003, mục 3.8. <https://www.sei.cmu.edu/library/quality-attribute-workshops-qaws-third-edition/>
2. <a id="ref-2"></a>OWASP, *OWASP Top 10 for LLM Applications 2025*. <https://genai.owasp.org/llm-top-10/>
3. <a id="ref-3"></a>OWASP, *Application Security Verification Standard 5.0.0*. <https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en>
