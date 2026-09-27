# W-027 V0 — Verification record

Lượt bàn giao Phase 4: **28/09/2026 (Asia/Saigon)**. Phạm vi: artifact prototype, không phải production acceptance hoặc user study. Baseline Git đầu lượt: `W-027` / `3a457f3161dafd049a5b150951247179919c8592`, cộng các file prototype Phase 3/4 chưa commit. Mã/hình đóng gói được định danh bằng `MANIFEST.sha256` trong ZIP.

## Kiểm tra đã thực hiện

| Kiểm tra | Cách chạy / evidence | Kết quả |
| --- | --- | --- |
| Local Project Hub | `./scripts/project-hub.ps1 status`, `validate` | Fresh; snapshot `2026-09-27T06:17:21.304770Z`; validation pass. Không sync hoặc sửa snapshot |
| State invariants | `node prototypes/w-027/tests/state.test.cjs` | **4/4 pass**: validation không auto-accept; fallback Reject trước first Accept; export/receipt isolation; failed candidate giữ working/accepted/constraints và reject destination |
| JavaScript syntax | `node --check` cho app.js, fixtures.js, state.js | Pass |
| Core walkthrough | `python -B prototypes/w-027/tests/browser_smoke.py` | Pass: C1–C5, bảy refinement mẫu, navigation, accepted export receipts, source/clarification, mobile width; không JS error |
| Failure/recovery walkthrough | `python -B prototypes/w-027/tests/phase2_smoke.py` | Pass: F1–F10, scan boundary/replacement, state retention, accepted export retry, degradation, clarification/constraints, best effort; không JS error |
| Review entry / Later | Chromium walkthrough từ REVIEW.html qua launch links và S1–S4 | Pass: bốn storyboard, mở tab riêng giữ accepted state, quay lại export đúng v1; desktop 1440px và mobile 390px không tràn ngang ở các trang đã kiểm tra |
| Keyboard / navigation | Kiểm tra Phase 3: Tab tới skip link, anchor và local links | Pass trong Chromium; không phải accessibility audit đầy đủ |
| ZIP portable check | Giải nén vào thư mục Temp và mở file:// ngoài repository | Pass: REVIEW launch, generation, refinement, accepted export failure/retry/download, bốn storyboards; không JS error hoặc HTTP request trong walkthrough |
| ZIP integrity / links | ZIP CRC, manifest SHA256, relative paths, HTML local links/anchors | Pass trên bundle kiểm tra. Bundle cuối được đóng lại sau khi cập nhật record này; đối chiếu payload với file hiện tại và runtime giữ nguyên so với bản đã smoke-test |

Các script Python Playwright chỉ phục vụ verification trên máy đã có Playwright/Chromium, không là dependency để chạy prototype. Không cài thêm package sản phẩm. Browser chỉ dùng dữ liệu fixture; không có real AI/network integration.

Phương thức launch đã kiểm tra: mở HTML trực tiếp qua `file://`, gồm bản trong repository và bản ZIP giải nén. Hướng dẫn static server là lựa chọn bổ sung. Không tuyên bố đã chạy trên mọi browser hoặc mọi hệ điều hành.

Ảnh entry: [desktop](18-review-start.png), [mobile](19-review-mobile.png). Ảnh flow/failure/Later từ các Phase trước nằm cùng thư mục; các ảnh C/F được cập nhật trong lần kiểm tra bàn giao này.

## Đối chiếu Project Hub

Áp dụng workflow `docs/agents/workflows/project-hub-review.md`: lookup W-027; mở các UC-001–UC-008 và requirements; tìm thêm Decisions, Assumptions, Constraints, Risks, Bugs, Updates, Documents ngoài direct links. W-027 không có primary requirement/decision links; nội dung UC và D-024–D-028 được dùng để mở rộng context.

| Kết luận | Evidence |
| --- | --- |
| Fidelity representation phù hợp scope Spike | W-027; C1–C5/F1–F10 interactive, S1–S4 static. V1/Core vs Later/Partial giữ theo UC notes và D-013/D-015/D-024/D-025 |
| State/constraint/export behavior có thể quan sát | R-020/R-024/R-031/R-032/R-033; D-025/D-026; state.js + walkthrough tests. Không suy ra production mechanism từ simulation |
| Giữ ranh giới source/import/reference/asset | D-007/D-024; storyboards role map, source selection một nguồn, scan deferred |
| Ambiguity còn mở, được ghi rõ | Reject trước first Accept và constraint restoration: README A1/A2; pending export: A3; Later semantics: P3-Q01–P3-Q08. Không âm thầm biến assumptions thành decisions |
| Wording R-018 cần tiếp tục phân biệt với scope hiện hành | R-018 còn optional/V1-quality wording; UC-006/L-001/L-002 giữ assets/visuals deferred. S3 chỉ minh họa boundary, không promote scope |
| Handoff hành chính còn lại | W-027 snapshot: Ready; Artifact / Link trống. Checklist HANDOFF.md AC4 còn mở, chưa có URL đã publish hoặc link được ghi vào Sheet |

DOC-001/DOC-002 PDF gốc chưa nằm trong artifact đã đọc ở các Phase trước; investigation dựa trên project_context.md, structured records hiện hành và technical docs accessible. Structural validation của Project Hub không chứng minh các tài liệu đồng nhất. Snapshot freshness không có nghĩa đã live-read lại Google Sheets.

## Giới hạn kết luận

- Pass của mock tests không chứng minh AI generation/refinement, parser, security boundary, validator, PPTX/PDF validity hoặc app compatibility thật.
- Later chỉ là storyboard; tests không chứng minh import/direct editing/assets/reference hoạt động.
- Không baseline thêm quality thresholds, export policy hoặc Architecture Decision. C-001, D-011 và D-024–D-028 vẫn là ràng buộc hiện hành.
- Chưa có team/user feedback; không tuyên bố UX đã được chấp nhận. FEEDBACK.md còn là template trống.
- Đã có prototype để team review; không xác nhận W-027 chính thức Done khi Artifact / Link chưa được ghi.
