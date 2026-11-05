# Image and PDF manual acceptance

Status: Owner-confirmed basic smoke PASS, 5 November 2026. Use disposable Chats and public test images.
Record candidate, browser, model/protocol and per-case results. Never record provider keys.

The existing launcher builds and uses the pinned OpenCode executable.
Chrome or Edge must be installed for PDF export. No browser is downloaded automatically.

```powershell
pnpm.cmd start:opencode --fresh
```

Keep the printed profile path. Reopen it after restarting:

```powershell
pnpm.cmd start:opencode --data-dir "<printed profile path>"
```

## Fast smoke

1. Create and confirm a two-slide presentation. Wait until both slides are published.
   Example: `Tạo đúng 2 slide tiếng Việt về tái chế, dành cho người trưởng thành. Slide 1: Vì sao cần tái chế. Slide 2: Ba hành động có thể làm ngay. Đề xuất outline và chờ xác nhận.`
2. Select slide two. Open **Ảnh và xuất PDF** below the deck/editor controls.
   Enter `https://raw.githubusercontent.com/github/explore/main/topics/javascript/javascript.png`.
   Select **Thêm ảnh từ URL**. Expect a ready image and its source URL.
3. Select **Chèn vào slide đang chọn**. Expect the image at the end of slide two.
   Slide one stays unchanged. The deck still contains exactly two slides.
4. Use **Sửa trực tiếp** to change a heading to `Tái chế trực tiếp TEST_7`.
   Set font size 28 and center alignment, then save. The image remains visible.
5. Select **Xuất PDF**. Open the downloaded file in a PDF viewer outside DeckAgent.
   Expect two pages, correct order, Vietnamese accents, saved text/layout and the image.
   Unsaved editor drafts are excluded. Export does not call the model.
6. Reload, then restart the same profile. Reopen the same Chat.
   Expect the image, source and direct edit to remain. Export uses saved image bytes without refetching.

## Focused AI and negative checks

- Instead of direct insertion, import an image and send:
  `Chỉ sửa slide 2: dùng ảnh đã lưu bằng read_slide và insert_image. Giữ nguyên các phần còn lại.`
  Expect a successful insert_image activity. Slide-one HTML/revision stays identical.
  The inherited scope guard blocks chèn, thêm, không, insert and add in edit prompts.
- Try `https://127.0.0.1/image.png`. Expect rejection and no slide/revision change.
  Try a public non-image URL. Expect failure with the saved deck intact.
- During a slow import/export, use **Hủy tác vụ ảnh/PDF**. Expect no partial PDF download.
  Committed revisions stay unchanged. An image committed before Cancel remains in the library.
- Open another Chat. It cannot use the first Chat's image IDs.
- Inspect the published iframe: sandbox stays empty; images use data URLs, never the original Internet URL.

Visible comparison proves visible output only. Compare API HTML/revisions for stronger evidence.
Do not grant native tools or disable the Chromium sandbox to make a test pass.

## Repeatable automated checks

```powershell
pnpm.cmd build
pnpm.cmd test:images-export
pnpm.cmd test:images-export:browser
pnpm.cmd test:images-export:cli
pnpm.cmd test:images-export:live
```

The first three test commands use synthetic data and no cloud model.
Browser tests need installed Chrome/Edge. CLI tests need the existing pinned executable.
The live command loads optional .env, requires GEMINI_API_KEY, fetches one public image and incurs provider usage.
Default tests never turn on live calls. Skipped live tests do not count as PASS.

## Owner smoke confirmation

Owner confirmed the six-case basic smoke PASS in chat on 5 November 2026. This is an aggregate report; exact manual candidate SHA, browser/model versions and itemized artifacts were not supplied. Extended cancellation/isolation checks and G-003/G-006 remain open. G-007 stays NOT VERIFIED.
