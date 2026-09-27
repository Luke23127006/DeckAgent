# W-027 — Prototype V0: bàn giao Phase 4

Ngày bàn giao: **28/09/2026**. Owner của W-027 theo Project Hub: **Luân**. Artifact: **DeckAgent exploratory prototype V0**, supporting input cho product/Architecture research.

## Mở và chia sẻ

1. Mở [REVIEW.html](REVIEW.html): đây là trang bắt đầu cho buổi review, có launch links, agenda và coverage tám UC.
2. Chọn [interactive V1](index.html) hoặc [Later storyboards](storyboards.html). Không cần cài dependencies, build, backend hoặc account.
3. Nếu nhận ZIP: giải nén toàn bộ, giữ các file cạnh nhau, mở `deckagent-w027-v0/REVIEW.html`. Không mở HTML bên trong cửa sổ xem ZIP.
4. Có thể chạy static server **từ thư mục đã giải nén**: `python -B -m http.server 8027 --bind 127.0.0.1`, rồi mở `http://127.0.0.1:8027/REVIEW.html`. Ctrl+C để dừng.

Gói chia sẻ được tạo tại `artifacts/deckagent-w027-v0-review.zip`, cạnh nó có file SHA256 để đối chiếu. ZIP có runtime HTML/CSS/JS, tài liệu, ảnh review, optional tests và manifest; không chứa Project Hub snapshots, credentials, repository history hoặc production dependencies. Sources sản phẩm ngoài thư mục prototype chỉ được tham chiếu theo ID/path, không đóng kèm.

Tạo lại ZIP sau khi sửa artifact: từ repository root chạy `python -B prototypes/w-027/package_review.py`. Sau giải nén có thể chạy `python -B package_review.py` từ thư mục bundle. Không dùng ZIP cũ để bàn giao thay đổi mới.

## Đối chiếu Acceptance Criteria chính thức

Nguồn: **W-027**, `work.tsv` trong local snapshot `2026-09-27T06:17:21.304770Z`. Các nhãn AC1–AC5 dưới đây chỉ tách các mệnh đề của AC để kiểm tra; không phải ID requirement mới. W-027 không yêu cầu UI polish hoặc production code.

| Check | Mệnh đề W-027 | Evidence trong artifact | Kết quả |
| --- | --- | --- | --- |
| [x] AC1 | Toàn bộ UC có representation ở fidelity phù hợp | REVIEW.html coverage; README matrix; C1–C5/F1–F10 interactive; S1–S4 storyboard cho Later/deferred | Đủ UC-001–UC-008; fidelity choices vẫn là prototype proposals |
| [x] AC2 | Flow/state/failure quan trọng quan sát được | Candidate/working/accepted; repeated refinement; F1–F10; nhánh limitation/failure và gaps trong S1–S4; review/verification.md | Đã kiểm tra hành vi mô phỏng; Later recovery chưa đặc tả được đánh dấu open |
| [x] AC3 | Ambiguity được ghi lại | README A1–A11 và P3-Q01–P3-Q08; nhãn assumption trong UI; FEEDBACK.md | Đã ghi câu hỏi; chưa có quyết định hoặc phản hồi team được giả lập |
| [ ] AC4 | Artifact / Link trỏ tới prototype thật trước Done | REVIEW.html và ZIP thật đã được chuẩn bị. W-027 snapshot vẫn Ready, `artifact_link` trống | **Còn thao tác ghi link bàn giao vào Project Hub trước khi Done**; không sửa Sheet/snapshot trong task này |
| [x] AC5 | Không yêu cầu polish hoặc production code | Standalone vanilla HTML/CSS/JS, fixtures, static storyboards; không thêm dependency sản phẩm | Phù hợp Spike; không dùng V0 làm Architecture Decision |

**Kết luận:** công việc tạo prototype và chuẩn bị bàn giao Phase 1–4 đã có đủ artifact để review. Chưa tuyên bố task chính thức Done khi ô Artifact / Link còn trống. Các ambiguity mở là đầu ra cần có của Spike, không buộc phải giải hết để hoàn thành W-027. Buổi team review được khuyến nghị để thu feedback, không tự thêm một approval gate ngoài AC chính thức.

## Nội dung có thể dùng khi ghi Artifact / Link

- Entry trong repository: `prototypes/w-027/REVIEW.html`.
- Interactive artifact: `prototypes/w-027/index.html`.
- Later artifact: `prototypes/w-027/storyboards.html`.
- ZIP bàn giao: `prototypes/w-027/artifacts/deckagent-w027-v0-review.zip`.
- Guide/coverage: `prototypes/w-027/README.md`.

Khi share, dùng link tới commit/PR/file hoặc vị trí ZIP thực tế mà team truy cập được. Các path trên là file đã có trong workspace; **chưa phải URL public hoặc artifact đã push**. Không dùng trang ảnh hoặc link tài liệu kế hoạch thay cho prototype thật. Lần bàn giao này không commit/push, publish hoặc cập nhật Project Hub.

## Cách điều phối buổi review

Agenda đề xuất 20–30 phút trên [REVIEW.html](REVIEW.html). Các bước chi tiết và trace UC/R/D nằm trong [README](README.md).

| Chặng | Scenario | Quan sát chính |
| --- | --- | --- |
| Creation/source | C1/C2; F1/F2a/F2b/F3/F4/F5 | Prompt, clarification, nguồn, source gap, failure khi chưa có deck |
| Refinement/review | C3/C5; F6/F7/F8 | Nhiều vòng; constraints; validation; Accept/Reject; best effort |
| Export | C4; F9/F10 | Đúng accepted state dù có pending draft; error, retry, format disclosure |
| Later/deferred | S1/S2/S3/S4 | Không nhầm source/working artifact/reference/asset; không promote capability vào V1 |

Mỗi lần Bắt đầu lại/reload làm mất phiên mock. Mở storyboard ở tab riêng để bảo toàn phiên V1 cũ. Refinement tự do không được AI xử lý; dùng câu gợi ý để chạy scenario. Mỗi lỗi do bộ chọn tạo chỉ xảy ra một lần; retry tiếp theo dựng sẵn thành công.

## Câu hỏi ưu tiên và input cho Architecture research

| Ưu tiên review | Câu hỏi local | Liên quan | Điều prototype giúp quan sát |
| --- | --- | --- | --- |
| Cao | A1/A2 — đích Reject, constraint lifetime | R-024/R-031; D-025; DOC-004 AC-04/AC-07 | User hiểu bản nào được khôi phục; lỗi kỹ thuật khác Reject ra sao |
| Cao | A3 — export khi có pending result | R-020/R-025/R-028; D-026; DOC-004 AC-05/AC-09 | Disclosure accepted version, retry không dùng pending state |
| Cao | A7/A8 — failure/validation/gaps | R-008/R-030–R-033; D-028; DOC-004 AC-08/AC-10/AC-20 | Cause/state/recovery có đủ rõ; thiếu evidence nào cần bổ sung |
| Vừa | A4/A5/A10 — clarification và workspace | R-002/R-013/R-029; D-025 | Lúc nào hỏi lại, warning locality có gây hiểu nhầm hay không |
| Vừa | A11 — degradation | R-026/R-027; D-026 | Cách thông báo, không xác nhận compatibility thực tế |
| Sau V1 | P3-Q01–P3-Q08 | UC-003/005/006/007; D-007/D-013/D-015/D-024; L-001/L-002 | Biên capability, role và những recovery semantics chưa có |

Không rút kết luận về validator, representation, state storage, export engine, agent pipeline hoặc framework production từ code demo. DOC-004 là tiêu chí/observability input; các reference-system research không được coi là Architecture Decision. W-027 là supporting input, không biến thành hard dependency của Architecture.

## Kết quả, giới hạn và chỉnh sửa tiếp

- Bằng chứng kiểm tra: [review/verification.md](review/verification.md).
- Feedback: [FEEDBACK.md](FEEDBACK.md); hiện chưa có kết quả review của team. Không ghi pass usability hoặc phê duyệt UI thay cho user testing.
- Mock không kiểm chứng AI quality, source extraction/security thật, artifact PPTX/PDF validity hoặc cross-application compatibility. File download là JSON receipt có nhãn simulated.
- Later chỉ có storyboard; các operation và failure semantics chưa rõ vẫn mở. V1 tiếp tục theo D-024–D-028.
- Muốn sửa layout: `index.html/styles.css`; mock variants: `fixtures.js`; interaction: `app.js`; state simulation: `state.js`; Later: `storyboards.html/storyboards.css`. Toàn bộ nằm trong thư mục prototype.

Baseline đối chiếu: branch `W-027`, HEAD đầu Phase 4 `3a457f3161dafd049a5b150951247179919c8592`, cùng các thay đổi prototype chưa commit từ Phase 3/4. Local Project Hub báo fresh và structural validation pass. Không live-sync Google Sheets trong lượt này; không sửa snapshot hoặc các thay đổi ngoài prototype.
