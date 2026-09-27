"""Optional review check. Requires Python Playwright; no runtime dependency."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

sys.stdout.reconfigure(encoding="utf-8")
root = Path(__file__).resolve().parents[1]
shots = root / "review"
shots.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto((root / "index.html").as_uri())
    page.screenshot(path=str(shots / "01-start.png"), full_page=True)

    def generate():
        page.locator("#sample-brief").click()
        page.locator("#generate").click()
        expect(page.locator("#workspace")).to_be_visible()

    def refine(key):
        page.locator(f'[data-refine="{key}"]').click()
        page.locator("#refine-submit").click()
        expect(page.locator("#progress-dialog")).to_be_visible()
        expect(page.locator("#progress-dialog")).not_to_be_visible()

    def reset():
        page.locator("#reset").click()
        page.locator("#confirm-reset").click()

    generate()
    expect(page.locator("#export-open")).to_be_disabled()
    expect(page.locator("#thumbnails button")).to_have_count(6)
    page.locator("#next-slide").click()
    expect(page.locator("#position")).to_have_text("2 / 6")
    page.locator("#grid-view").click()
    expect(page.locator(".deck-grid-item")).to_have_count(6)
    page.locator('.deck-grid-item[data-slide="0"]').click()
    page.locator("#accept").click()
    refine("formal")
    expect(page.locator("#version-tag")).to_have_text("v2")
    page.screenshot(path=str(shots / "02-workspace.png"), full_page=True)

    # Export must retain accepted v1 while working v2 awaits review.
    page.locator("#export-open").click()
    expect(page.locator("#export-state")).to_contain_text("Xuất v1")
    for fmt in ("PPTX", "PDF"):
        page.locator(f'[data-export="{fmt}"]').click()
        expect(page.locator("#download-receipt")).to_be_visible()
        with page.expect_download() as download_info:
            page.locator("#download-receipt").click()
        receipt = json.loads(Path(download_info.value.path()).read_text(encoding="utf-8"))
        assert receipt["simulated"] and receipt["format"] == fmt
        assert receipt["deck"]["id"] == "v1"
    page.screenshot(path=str(shots / "03-export.png"), full_page=True)
    page.locator('[data-close="export-dialog"]').click()
    page.locator("#accept").click()
    refine("reorder")
    expect(page.locator("#constraint-list")).to_contain_text("Trang trọng")
    page.locator("#reject").click()
    expect(page.locator("#version-tag")).to_have_text("v2")
    for key in ("shorten", "audience", "polish", "add", "regenerate"):
        refine(key)
    expect(page.locator("#thumbnails button")).to_have_count(5)
    expect(page.locator("#constraint-list")).to_contain_text("5 slide")
    page.locator("#refine-request").fill("An unsupported custom request")
    page.locator("#refine-submit").click()
    expect(page.locator("#workspace-feedback")).to_contain_text("chưa có biến thể demo")

    # Source and clarification path, then reject before first acceptance.
    reset()
    page.locator("#brief").fill("Tạo báo cáo thử nghiệm Thư viện sẻ chia.")
    page.locator("#source-mode").select_option("paste")
    page.locator("#sample-source").click()
    page.locator("#generate").click()
    expect(page.locator("#clarify-dialog")).to_be_visible()
    page.locator("[data-audience]").first.click()
    page.locator('#clarify-form button[type="submit"]').click()
    expect(page.locator("#workspace")).to_be_visible()
    expect(page.locator("#provenance")).to_contain_text("Báo cáo nguồn mẫu")
    refine("shorten")
    page.locator("#reject").click()
    expect(page.locator("#version-tag")).to_have_text("v1")
    expect(page.locator("#thumbnails button")).to_have_count(6)
    expect(page.locator("#export-open")).to_be_disabled()

    page.set_viewport_size({"width": 390, "height": 844})
    page.screenshot(path=str(shots / "04-mobile-workspace.png"), full_page=True)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Mobile overflow"
    reset()
    page.screenshot(path=str(shots / "05-mobile-start.png"), full_page=True)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Mobile home overflow"
    assert not errors, errors
    browser.close()
    print("PASS: core flows, seven refinements, accepted export receipts, source/clarification, reject recovery, mobile width; no JS errors.")
