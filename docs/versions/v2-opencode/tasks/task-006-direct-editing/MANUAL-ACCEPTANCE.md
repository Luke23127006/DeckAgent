# Direct editing smoke

Status: the three-step basic smoke is owner-confirmed PASS on 4 November 2026.
Covered: direct text/layout preview and save, reload, then an AI patch on slide two.
Confirmation is aggregate; no exact candidate/browser/model or manual HTML/revision
artifacts were supplied. Optional conflict/busy checks remain unconfirmed manually.
Automated/live evidence stays in HANDOFF.md. G-006 remains NOT VERIFIED because
extended acceptance and G-003 remain outstanding.

Restart the same isolated profile; do not use --fresh to reopen an existing deck:

```powershell
pnpm.cmd start:opencode --data-dir "<previous Test profile path>" --material-max-bytes 1048576 --material-max-count 3
```

Use its actual profile path. Open a disposable Chat with two published slides.
An outline-only or pending slide cannot be edited until it has a published revision.

1. Open slide two in Deck canvas. Select **Sửa trực tiếp** below the slide list.
   Scroll within the canvas when the controls are below the visible area.
2. Choose a plain-text block in **Khối văn bản**. Replace a distinctive line with
   `DIRECT_6`. Set font size 28 and center alignment for a heading or paragraph.
   Check draft preview; it changes before any published revision changes.
3. Select **Lưu slide**. Reopen/reload the same Chat and slide. Text/layout remain.
   Slide one remains unchanged. For stronger evidence compare its HTML/revision.
4. Ask the model: `Chỉ sửa slide 2: đổi DIRECT_6 thành AI_6 bằng read_slide và patch_slide. Giữ nguyên các phần còn lại.`
   Expect read_slide then patch_slide. The requested text changes; the direct
   layout and other content stay. Slide one HTML/revision stays identical.
5. Optional conflict check: edit a local block without saving, change that same
   slide from another tab, then save the old draft. Save is refused, the draft
   remains, and the newer revision is not overwritten. Explicitly discard the
   draft to load the new base. Save during a running/awaiting Chat is also refused.

Blank layout fields mean keep the current style. Values are pixel overrides,
not a full computed-style inspector. Complex inline/positioned CSS can limit a
layout property's visual effect; the preview is the check. Unsupported/malformed
HTML is not silently repaired. Text entry cannot insert HTML or raw CSS.

Unsaved editor drafts stay in memory while navigating Chats/slides. They are not
saved across a full page reload. Conflicts do not discard them. Explicit save
persists an immutable revision. Never test conflicts on irreplaceable source data.

Record candidate, browser, model/protocol and per-case results. No API keys in evidence.

```powershell
pnpm.cmd test:direct-editing
pnpm.cmd test:direct-editing:browser
pnpm.cmd test:direct-editing:cli
pnpm.cmd test:direct-editing:live
```

The first three commands use synthetic data and no cloud model. Browser checks need
Chrome/Edge; CLI checks need the existing pinned Windows executable. The live command
uses Gemini credentials from the environment/optional .env and incurs provider usage.
