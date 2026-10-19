# So sánh UC-001 — Generate Initial Draft Deck (Tạo bản presentation đầu tiên) của DeckAgent với UC tương tự trong DeepSeek Harness.

## UC-001 flows list

V1 (branch `research/deepseek-harness` ) gồm 6 main flows và 15 alternative flows.

* **Main flow:** S1 Provide the material → S2 Send the request → S3 Wait for the outline → S4 Confirm the outline → S5 Watch the deck build → S6 Review the draft.
* **Làm rõ nội dung:** A32 Ask before drafting the outline, A33 Material does not agree with itself, A34 Material lacks a needed fact.
* **Kiểm soát outline:** A22 Cancel the outline, A23 Send a new instruction for the outline, A24 Empty outline, A39 Ask what the user means for the outline.
* **Tạo slides:** A42 Use images on the slides, A9 File with nothing usable.
* **Dừng và xử lý lỗi:** A10 Stop while building slides, A11 Model call fails, A18 Model access refused, A19 Usage limit reached.
* **Trong khi đang chạy:** A13 Reload or come back, A14 Type while the system works.

## Sự khác biệt về UC flow

### Before Generation

1. Phase này gồm các flow của UC-001: S1, S2, A32, A33, A34, S3.

2. So với DeepSeek Harness:

| DeckAgent yêu cầu | DeepSeek có gì? |
| --- | --- |
| S1 — Nhận yêu cầu và tài liệu | Có cơ chế nhận user messages; chưa xác minh đầy đủ attachment flow |
| S2 — Gửi yêu cầu cho Agent | Có Agent Inbox, Agent Loop và model requests |
| A32 — Hỏi lại khi yêu cầu thiếu thông tin quan trọng | Có cơ chế gửi/nhận nhiều lượt hội thoại; chưa xác nhận cơ chế hỏi đáp đặc thù |
| A33 — Phát hiện dữ liệu mâu thuẫn | Chưa xác nhận hành vi kiểm tra mâu thuẫn |
| A34 — Dùng placeholder khi thiếu dữ kiện | Chưa xác nhận quy tắc placeholder |
| S3 — Tạo outline để người dùng xem trước | Có khả năng model trả lời; chưa thấy contract outline của DeckAgent |

3. DeepSeek đã tách 2 việc:
        
    3.1. Agent Loop quyết định cách model được gọi, tools được thực thi và kết quả được lưu.
    3.2. Agent Behavior phụ thuộc vào instructions, tools và các quy tắc mà ứng dụng cung cấp.

    => Agent Loop chính là Bộ điều phối (Driver) trong [Sequence Diagram về Agent Lifecycle của DeepSeek Harness ](docs\research\tech\deepseek-harness\images\Agent Turn & Step Lifecycle - Action-Based Diagram.png)

4. A32 — Hỏi lại khi yêu cầu thiếu thông tin quan trọng
    4.1. Câu hỏi tự đặt ra: Làm sao để biết là **thiếu thông tin quan trọng** và **agent hỏi lại như nào để bổ sung phần bị thiếu**?
    4.2. Với luồng này, hành vi "nhận câu trả lời mới" và "giữ lịch sữ để tiếp tục" đã có cơ chế, nhưng có các câu hỏi sau:

    - "Hiển thị câu hỏi clarification" có cơ chế ko?
    - "Giữ trạng thái request đang chờ" cơ cơ chế ko? (Agent Status của DeepSeek Harness có 2 trạng thái là idle và running, không có kiểu waiting_for_user).
    - Có cần update Agent Loop không?
    => Trả lời: Có `ask_user_question` và userQuestions Service, có 2 thành phần là [dsh-tool-ask-user](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/interaction/tool-ask-user/README.md?utm_source=chatgpt.com) và [dsh-user-questions](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/docs/subsystems/user-questions.md?utm_source=chatgpt.com). Chúng bao gồm cách hành vi:

    - Đặt một câu hỏi hay nhiều câu hỏi.
    - Đưa ra những câu trả lời gợi ý.
    - Người dùng tự nhập câu trả lời.
    - Người dùng bỏ qua một câu hỏi.
    - Chờ người dùng trả lời.
    - Đưa câu trả lời trở lại model.
    => Trong DeckAgent, với flow quản lý outline, ta có thể reuse như sau.

| DeckAgent cần | Khả năng thích ứng |
| --- | --- |
| A32 — Hỏi trước khi tạo outline | Reuse `ask_user_question` |
| A32 — Cho phép bỏ qua câu hỏi | Reuse answer schema |
| A39 — Hỏi lại khi phản hồi về outline không rõ | Reuse `ask_user_question` |
| S4 — Xác nhận, hủy hoặc sửa outline | Reuse cơ chế hỏi đáp; cần custom outline behavior |
| UC-003 A38 — Chờ câu trả lời trong cùng request | Cần kiểm chứng semantics của Timed Mode |
| UC-001 A13 — Reload và quay lại trong khi chờ hoặc tạo slides | Có cơ chế reconnect và question recovery; cần kiểm chứng end-to-end |

> Còn câu hỏi: "Làm sao biết thông tin quan trọng?", idea sẽ là viết system instructions riêng mà khoan đã sửa Agent Loop.

6. S1 — Nhận yêu cầu và tài liệu
    6.1. Trong luồng này có 2 thứ: **Document Reading** và **Content Understanding (liên quan UC-9 - File không có nội dung sử dụng được và UC-32)**, 

    

    6.2. Ta sẽ reuse toàn bộ **Document Reading**, nhưng **Content Understanding** thì cần xem thêm 

    

    6.3. DeepSeek có cơ chế xử lý **UC-9 của Content Understanding** khi "Không tìm thấy file", "File ko phải văn bản tool đọc được", "Không có quyền truy cập", "File vượt giới hạn đọc", "Lỗi đọc dữ liệu".

    6.4. Nhưng ở **UC-32**, nó không có cơ chế để giúp cho Agent xử lí giống spec mô tả. Theo specification DeckAgent, Agent phải:

    - Chỉ ra hai thông tin không khớp và vị trí của chúng.
    - Không tự quyết định số liệu nào đúng.
    - Đánh dấu vấn đề là `unresolved` trong outline.
    - Nếu người dùng vẫn xác nhận outline mà không giải quyết mâu thuẫn, slide không được trình bày một giá trị là chính xác.

> Bài toán mới mở ra mà DeepSeek Harness không xử lí: "Phát hiện nội dung không hữu ích", "Phát hiện thông tin mâu thuẫn", "Placeholder và unresolved content" thì có thể cân nhắc các phần này như một contribution mới hay không?

7. UC-001 S3 — Wait for the outline
    7.1. Cái nãy tương tự với Plan Mode, đề xuất là reuse và update cơ chế Plan Mode của các Agent bình thường. Nhưng sự khác biệt ở chỗ, DeepSeek Plan Mode tạo ra Markdown Plan, còn DeckAgent tạo ra Outline trong response.

    Một số nhu cầu về Outline mà ChatGPT chỉ ra khá tốt như:

    - Outline gồm bao nhiêu slides.
    - Nội dung dự kiến của từng slide.
    - Những thông tin nào còn thiếu.
    - Những thông tin nào đang mâu thuẫn.
    - Outline nào được người dùng xác nhận.
    - Nội dung nào sẽ được dùng để tạo slides sau đó.
    7.2. ChatGPT không đề xuất reuse nguyên trạng exit_plan_mode. Chúng ta nên tận dụng các cơ chế lưu plan, hiển thị và nhận feedback, rồi thiết kế lại ranh giới giữa hai request cho phù hợp.

    Ngoài ra, Plan Mode dùng instructions để hướng dẫn model. Nó không tự ngăn model gọi những tools tạo slides. Nếu DeckAgent cần cấm tạo slides trước khi xác nhận, phải có enforcement ở tool hoặc workflow layer.

    => Không nên reuse toàn bộ Plan Mode của DeepSeek, tư duy chung chứ cơ chế về expected behavior ko chung.

    7.3. Outline nên là một artifact riêng được lưu bằng custom Session events, hay là một file JSON trong workspace? => Cả hai đều có thể triển khai trên DeepSeek Harness, nhưng có khác biệt:

    - Session events phù hợp để khôi phục workflow, current outline và confirmed outline.
    - File JSON phù hợp để Agent và slide-generation tools cùng đọc nội dung có cấu trúc.
    - Có thể kết hợp cả hai, nhưng cần xác định nơi nào là nguồn dữ liệu chính để tránh hai bản outline không đồng bộ.
    => ChatGPT đề xuất: Dùng Session-backed outline state làm nguồn dữ liệu chính; chỉ tạo file JSON khi công cụ tạo slides cần đọc trực tiếp từ filesystem. (ADR cần nghiên cứu)

    7.4. Kết quả nghiên cứu và đề xuất cho Before Generation

    => Kết quả nghiên cứu: DeepSeek Harness đã có đủ cơ chế nền để thử workflow Outline → Revision → Approval của DeckAgent mà không cần Outline Management riêng. Tuy nhiên, chưa có bằng chứng rằng chỉ cần System Prompt là Agent sẽ luôn thực hiện đúng cả ba hành vi.

    => Đề xuất: giữ System Prompt + Conversation History làm baseline để thử nghiệm; chưa dùng Plan Mode hoặc custom Session Events ngay.

    Ba hành vi cần kiểm chứng:

    | DeckAgent yêu cầu | DeepSeek đã hỗ trợ gì? | Kết luận |
    | --- | --- | --- |
    | UC-001 S3 — Wait for the outline: Agent tạo outline rồi kết thúc request | Agent có thể trả lời bằng text mà không gọi thêm tool, sau đó kết thúc turn | Có cơ chế nền |
    | UC-001 A23 — Send a new instruction for the outline: người dùng yêu cầu sửa bằng request mới | `followup()` tạo lượt xử lý mới; Session History giữ nội dung trước đó | Có cơ chế nền |
    | UC-001 S4 — Confirm the outline: người dùng xác nhận rồi Agent tạo slides | Model có thể diễn giải xác nhận và gọi slide-generation tools | Cần kiểm chứng behavior |

    Nguồn: [DeepSeek Agent Core](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/core.md?utm_source=chatgpt.com).

    Flow đề xuất:

    - Request 1 — User: "Create a presentation about DeckAgent." → Agent trả về outline; turn kết thúc, chưa tạo slides.
    - Request 2 — User: "Add a slide about architecture." → Agent trả về outline đã sửa; turn kết thúc, vẫn chưa tạo slides.
    - Request 3 — User: "Looks good. Generate it." → Agent bắt đầu gọi slide-generation tools.
    Không cần một `currentOutline` object để mô tả flow này; Agent có thể dựa vào conversation.

    System Prompt cần làm gì — instructions giả thuyết để thử, chưa phải configuration đã kiểm chứng:

```text
    When the user requests a new presentation:
    - First, produce an outline describing the planned slides.
    - Do not generate slides in the same request.
    - Wait for the user's next instruction.

    When the user requests changes to the outline:
    - Revise the outline using the conversation history.
    - Preserve parts the user did not ask to change.
    - Present the complete revised outline.
    - Do not generate slides.

    When the user clearly approves the outline:
    - Begin generating slides from the latest proposed outline.

    When the user's intent is ambiguous:
    - Ask whether they want to revise or approve the outline.
    - Do not generate slides until the intent is clear.
```

    Có cần Plan Mode không? => Không dùng Plan Mode làm điều kiện bắt buộc cho UC-001, vì semantics khác DeckAgent:

    - DeepSeek Plan Mode dùng `exit_plan_mode` để đưa plan ra review ngay trong tool execution.
    - DeckAgent yêu cầu request tạo outline kết thúc, sau đó người dùng xác nhận trong một request mới.
    - Plan Mode chỉ hướng dẫn hành vi bằng prompt; bản thân nó không khóa các tools.
    Nguồn: [DeepSeek Plan Mode](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/plan.md?utm_source=chatgpt.com). Plan Mode là cơ chế tham khảo tốt nhưng chưa chứng minh được lợi ích đủ rõ so với conversation workflow thông thường cho UC-001.

    Rủi ro kỹ thuật quan trọng nhất là intent interpretation. Ví dụ người dùng nói: "Outline ổn, nhưng thêm một slide về Technical Architecture." Nếu Agent bắt đầu tạo slides ngay, nó đã làm sai UC-001 A23. Đây là lỗi hiểu ý định, không phải lỗi persistence.

    | User response | Kết quả mong đợi |
    | --- | --- |
    | "Looks good. Generate it." | Bắt đầu tạo slides |
    | "Add a slide about architecture." | Sửa outline |
    | "Looks good, but add architecture." | Sửa outline, chưa tạo slides |
    | "Can you improve slide 3?" | Sửa outline |
    | "Okay." | Hỏi lại nếu không rõ người dùng đang xác nhận điều gì |
    | "Use the first outline instead." | Tạo response mới dựa trên outline đầu tiên |
    | "Cancel this outline." | Dừng workflow, không tạo slides |

    Nếu model thường xuyên phân loại sai những trường hợp này, mới cần nghiên cứu cơ chế kiểm soát ngoài System Prompt. DeepSeek có `tools/pre-execute` cho phép can thiệp trước khi tool thực thi, nhưng nó chỉ chặn tool call, không tự hiểu ý định của người dùng. [Nguồn: Tools Subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/tools.md?utm_source=chatgpt.com).

    Kết luận Before Generation:

    | Câu hỏi | Kết quả |
    | --- | --- |
    | Làm sao Agent tạo outline? | System Prompt + Agent Loop |
    | Làm sao Agent chỉnh sửa outline? | Conversation History + request mới |
    | Có cần Outline Management riêng không? | Chưa có yêu cầu đủ mạnh để đưa vào baseline |

    Before Generation dừng ở mức Architecture Research sơ bộ. Các vấn đề chưa được xác minh — độ ổn định khi sửa outline qua nhiều lượt, đọc attachments và xử lý thông tin mâu thuẫn — cần đưa vào danh sách PoC, không xem là đã giải quyết.

    Bước tiếp theo là Approval, nhưng chỉ nghiên cứu một câu hỏi cụ thể: khi người dùng xác nhận outline bằng một request mới, Agent làm sao chuyển từ hành vi đề xuất outline sang hành vi tạo slides, và cần cơ chế nào để tránh bắt đầu tạo slides khi người dùng chưa thực sự xác nhận? Câu hỏi này nối trực tiếp Before Generation với Generation mà không cần giả định outline là một component riêng.

### Approval

    Phạm vi: UC-001 S4 — Confirm the outline. Trạng thái: nghiên cứu sơ bộ; cơ chế nền đã đối chiếu tài liệu, hành vi xác nhận chưa kiểm chứng.

    1. Câu hỏi nghiên cứu
    Khi người dùng xác nhận outline bằng một request mới, Agent chuyển từ hành vi đề xuất outline sang hành vi tạo slides bằng cách nào, và cơ chế nào giữ ràng buộc không tạo slides trước xác nhận?

    2. Ràng buộc từ specification
    | Flow | Hành vi được quy định |
    | --- | --- |
    | S3 — Wait for the outline | Outline mới nhất là current outline. Agent nói rõ chưa có slide nào được tạo rồi kết thúc request. Confirm và Cancel được đưa ra dưới dạng suggested option. |
    | S4 — Confirm the outline | Người dùng gửi request mới; request đi qua UC-003 S2 đến S4 như mọi request khác. |
    | A23 — Send a new instruction for the outline | Agent trình bày proposal mới và không tạo slides. |
    | A22 — Cancel the outline | Outline bị hủy vẫn nằm trong conversation và không bao giờ được coi là đã xác nhận. |
    | A24 — Empty outline | Xác nhận outline rỗng không tạo slides; Agent nói outline cần nội dung và gợi ý sửa outline. |
    | A39 — Ask what the user means for the outline | Câu trả lời nằm trong chính request đang chạy, không mở request thứ hai. |

    Hệ quả cho Agent:

    - Approval là một lượt hội thoại mới, không phải trạng thái riêng trong Agent Loop.
    - Agent phân loại ý định của lượt mới dựa trên current outline trong conversation history.
    - Xác nhận và yêu cầu sửa có thể nằm trong cùng một câu. "Looks good, but add a slide on costs" là yêu cầu sửa.
    - Specification không đặt từ khóa xác nhận cố định. "Đồng ý, tạo slides đi" cũng là xác nhận.
    - Một suggested option đã hết hiệu lực không được chạy hành động cũ.

    3. Cơ chế DeepSeek Harness
    | Cơ chế | Vai trò | Giới hạn |
    | --- | --- | --- |
    | `agent.followup()` | Đưa request mới vào inbox và chạy thành turn mới với conversation history | Không trả về kết quả hay trạng thái kết thúc của lượt |
    | `ask_user_question` | Hỏi lại trong lượt đang chạy, chờ câu trả lời rồi đưa câu trả lời về model | Không tự quyết định khi nào cần hỏi |
    | Conversation History | Giữ các outline proposal, kể cả proposal đã hủy | Không đánh dấu proposal nào đã được xác nhận |
    | `tools/pre-execute` | Chạy trước thân tool; guard có thể deny và bỏ qua tool body | Không biết trạng thái xác nhận của outline |

    Nguồn: [Agent Core](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/core.md), [User Questions](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/user-questions.md), [Tool Execution Pipeline](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md).

    Ghi chú: A39 khớp với `ask_user_question` vì câu trả lời được đưa về đúng lượt đang chạy. S4 là lượt mới nên đi qua `agent.followup()` .

    4. Baseline đề xuất: System Prompt
    System Prompt ở phần Before Generation đã phủ request mới, request sửa outline, xác nhận rõ ràng và trường hợp mơ hồ. Approval bổ sung hai quy tắc:

```text
    When the outline is empty or has not been proposed:
    - Do not treat the message as an approval.

    When the user cancels the outline:
    - Do not generate slides.
    - Do not reuse that outline automatically.
```

    Trạng thái: giả thuyết. Chưa có bằng chứng System Prompt giữ được ràng buộc qua nhiều lượt và nhiều cách diễn đạt. Keyword matching không thay được việc diễn giải ý định.

    5. Kiểm soát ngoài System Prompt
    5.1. `tools/pre-execute`

    - Guard chạy trước thân tool và có thể deny tool call.
    - Guard không tự biết người dùng đã xác nhận outline hay chưa; cần một rule hoặc state do DeckAgent cung cấp.
    - Nếu slides được tạo bằng shell hoặc Python thay vì một tool riêng, chặn một tool không đủ.
    Kết luận: chưa đưa Approval Guard vào baseline. Ràng buộc "không tạo slides trước xác nhận" vẫn là điểm mở.

    5.2. Suggested options

    Ràng buộc này thuộc UI, không thuộc System Prompt:

    | Việc cần làm | Thành phần |
    | --- | --- |
    | Đưa ra Confirm/Cancel sau outline | Agent Behavior |
    | Hiển thị lựa chọn | Web UI |
    | Gửi request mới khi chọn Confirm | Web UI / Session Controller |
    | Từ chối suggested option đã hết hiệu lực | UI validation |
    | Hiểu request là xác nhận | Agent Behavior |

    Chưa xác minh DeepSeek Web UI có suggested option dạng này. Nếu không có, DeckAgent phải bổ sung UI behavior; không cần Outline Management subsystem.

    6. PoC đề xuất
    Điều kiện: model và tool configuration dự kiến của DeckAgent. Trạng thái: chưa chạy.

    | Input sau khi Agent đề xuất outline | Kết quả mong đợi |
    | --- | --- |
    | "Đồng ý, tạo slides đi." | Bắt đầu generation (S4) |
    | "Được, nhưng thêm một slide về Architecture." | Sửa outline, không tạo slides (A23) |
    | "Okay." nhưng ý định chưa rõ | Hỏi lại (A39) |
    | "Hủy outline này." | Không tạo slides (A22) |
    | "Tạo slides đi." khi chưa có outline | Không tạo slides; không coi là xác nhận |
    | "Tạo slides đi." khi outline rỗng | Không tạo slides; nói rằng outline cần nội dung (A24) |
    | Nhấn Confirm của một outline cũ | UI không gửi suggested option đã hết hiệu lực |

    7. Quyết định đề xuất
    | Thành phần | Hướng |
    | --- | --- |
    | Confirmation qua request mới | Reuse `agent.followup()` |
    | Diễn giải ý định xác nhận | System Prompt |
    | Hỏi lại khi mơ hồ | Reuse `ask_user_question` |
    | Giữ các outline cũ | Reuse Conversation History |
    | Suggested Confirm/Cancel | Kiểm tra, có thể extend Web UI |
    | Chặn slide generation | Chưa quyết định; phụ thuộc PoC |
    | Outline Management | Không đưa vào baseline |

    8. Kết luận và bước tiếp theo
    Kết quả:

    - DeepSeek Harness đã có cơ chế nhận request xác nhận mới và hỏi lại trong lượt.
    - Việc hiểu đúng ý định xác nhận và chỉ tạo slides sau xác nhận vẫn là hành vi DeckAgent phải định nghĩa và kiểm chứng.
    - Baseline đề xuất: System Prompt + Conversation History + `ask_user_question`.
    - Approval Guard và Outline Management chưa vào baseline.
    Điểm mở:

    - Độ tin cậy của việc diễn giải xác nhận qua nhiều lượt và nhiều cách diễn đạt.
    - Cách giữ ràng buộc không tạo slides trước xác nhận, kể cả khi slides được tạo bằng shell hoặc Python.
    Bước tiếp theo: UC-001 S5 — Watch the deck build. Câu hỏi nghiên cứu:

    > Sau khi người dùng xác nhận, DeepSeek Harness điều phối việc Agent tạo từng slide như thế nào, và DeckAgent có thể dùng những cơ chế nào để tạo, lưu, kiểm tra và hiển thị slides ngay khi chúng hoàn thành?
