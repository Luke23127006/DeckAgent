"""Phase 2 review scenarios. Optional Python Playwright, no runtime dependency."""
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
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    page.set_default_timeout(5000)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto((root / "index.html").as_uri())

    def controls():
        if not page.locator("#scenario-controls").evaluate("el => el.open"):
            page.locator("#scenario-controls > summary").click()

    def reset():
        page.locator("#reset").click()
        page.locator("#confirm-reset").click()
        page.locator("#sample-brief").click()
        controls()

    def refine(key, outcome="pass"):
        controls()
        page.locator("#refinement-outcome").select_option(outcome)
        if key in ("vague", "conflict", "release", "targeted"):
            if not page.locator(".extra-examples").evaluate("el => el.open"):
                page.locator(".extra-examples summary").click()
        page.locator(f'[data-refine="{key}"]').click()
        page.locator("#refine-submit").click()

    def settled():
        expect(page.locator("#progress-dialog")).not_to_be_visible()

    # First-generation timeout: determinate empty state, inputs preserved, retry.
    reset()
    brief = page.locator("#brief").input_value()
    page.locator("#generation-outcome").select_option("timeout")
    page.locator("#generate").click()
    expect(page.locator("#failure-dialog")).to_be_visible()
    expect(page.locator("#failure-state")).to_contain_text("working: — · accepted: —")
    expect(page.locator("#brief")).to_have_value(brief)
    page.screenshot(path=str(shots / "06-generation-failure.png"), full_page=True)
    page.locator("#failure-retry").click()
    expect(page.locator("#workspace")).to_be_visible()
    expect(page.locator("#export-open")).to_be_disabled()

    # Failed generation validation never produces a working or accepted deck.
    for outcome in ("invalid-source", "invalid-layout"):
        reset()
        if outcome == "invalid-source":
            page.locator("#source-mode").select_option("paste")
            page.locator("#sample-source").click()
        page.locator("#generation-outcome").select_option(outcome)
        page.locator("#generate").click()
        expect(page.locator("#failure-dialog")).to_be_visible()
        expect(page.locator("#failure-state")).to_contain_text("candidate: — · working: — · accepted: —")
        page.locator("#failure-back").click()
        expect(page.locator("#brief")).to_have_value(brief)
        page.locator("#generate").click()
        expect(page.locator("#workspace")).to_be_visible()

    # All source alternatives; explicit return or continue, no silent source removal.
    for scenario in ("gap", "unreadable", "untrusted"):
        reset()
        page.locator("#source-scenario").select_option(scenario)
        page.locator("#source-mode").select_option("paste")
        page.locator("#sample-source").click()
        source = page.locator("#source-text").input_value()
        page.locator("#generate").click()
        expect(page.locator("#source-dialog")).to_be_visible()
        if scenario == "gap":
            page.screenshot(path=str(shots / "07-source-gap.png"), full_page=True)
            page.locator("#source-back").click()
            expect(page.locator("#source-text")).to_have_value(source)
            page.locator("#source-scenario").select_option("gap")
            page.locator("#generate").click()
        page.locator("#source-continue").click()
        expect(page.locator("#workspace")).to_be_visible()
        expect(page.locator("#source-status")).to_contain_text({"gap": "Source gap", "unreadable": "retry", "untrusted": "120 → 999"}[scenario])
        page.locator('#thumbnails [data-slide="2"]').click()
        expect(page.locator("#slide-stage")).to_contain_text("120")
        expect(page.locator("#slide-stage")).not_to_contain_text("999")

    reset()
    page.locator("#source-mode").select_option("file")
    page.locator("#source-file").set_input_files({"name": "scan-demo.pdf", "mimeType": "application/pdf", "buffer": b"MOCK metadata only, not a real PDF"})
    page.locator("#source-scenario").select_option("scan")
    page.locator("#generate").click()
    expect(page.locator("#source-dialog")).to_be_visible()
    expect(page.locator("#source-continue")).not_to_be_visible()
    page.locator("#source-back").click()
    page.locator("#source-mode").select_option("paste")
    page.locator("#sample-source").click()
    page.locator("#generate").click()
    expect(page.locator("#workspace")).to_be_visible()

    # Accepted v1, valid unaccepted v2: failure must preserve BOTH plus constraints.
    page.locator("#accept").click()
    accepted = page.locator("#version-tag").inner_text()
    refine("shorten")
    settled()
    working = page.locator("#version-tag").inner_text()
    constraints = page.locator("#constraint-list").inner_text()
    for outcome in ("timeout", "invalid-constraint", "invalid-layout"):
        refine("formal", outcome)
        expect(page.locator("#failure-dialog")).to_be_visible()
        expect(page.locator("#failure-state")).to_contain_text(f"working: {working} · accepted: {accepted}")
        expect(page.locator("#version-tag")).to_have_text(working)
        expect(page.locator("#constraint-list")).to_have_text(constraints, use_inner_text=True)
        expect(page.locator("#refine-request")).not_to_have_value("")
        if outcome == "invalid-constraint":
            page.screenshot(path=str(shots / "08-validation-failure.png"), full_page=True)
            page.set_viewport_size({"width": 390, "height": 844})
            page.screenshot(path=str(shots / "09-mobile-failure.png"), full_page=True)
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.set_viewport_size({"width": 1440, "height": 1100})
        page.locator("#failure-back").click()
    refine("formal", "timeout")
    expect(page.locator("#failure-dialog")).to_be_visible()
    page.locator("#failure-retry").click()
    settled()
    expect(page.locator("#constraint-list")).to_contain_text("4 slide")
    expect(page.locator("#constraint-list")).to_contain_text("Trang trọng")
    pending = page.locator("#version-tag").inner_text()

    # Export failure/invalid output cannot deliver a success receipt; retry pinned state.
    page.locator("#export-open").click()
    for fmt, outcome in (("PPTX", "timeout"), ("PDF", "invalid")):
        page.locator("#export-outcome").select_option(outcome)
        page.locator(f'[data-export="{fmt}"]').click()
        expect(page.locator("#export-retry")).to_be_visible()
        expect(page.locator("#download-receipt")).not_to_be_visible()
        expect(page.locator("#export-state")).to_contain_text(f"Xuất {accepted}")
        expect(page.locator("#version-tag")).to_have_text(pending)
        page.screenshot(path=str(shots / "10-export-failure.png"), full_page=True)
        page.locator("#export-retry").click()
        expect(page.locator("#download-receipt")).to_be_visible()
        with page.expect_download() as info:
            page.locator("#download-receipt").click()
        receipt = json.loads(Path(info.value.path()).read_text(encoding="utf-8"))
        assert receipt["deck"]["id"] == accepted and receipt["format"] == fmt
        assert len(receipt["deck"]["slides"]) == 6
    for fmt in ("PPTX", "PDF"):
        page.locator("#export-outcome").select_option("degradation")
        page.locator(f'[data-export="{fmt}"]').click()
        expect(page.locator("#export-continue")).to_be_visible()
        expect(page.locator("#download-receipt")).not_to_be_visible()
        page.locator("#export-continue").click()
        expect(page.locator("#download-receipt")).to_be_visible()
        expect(page.locator("#export-result")).to_contain_text("Lưu ý đã xác nhận")
    page.locator('[data-close="export-dialog"]').click()

    # Clarification, explicit constraint cancellation, and targeted best-effort disclosure.
    refine("vague")
    expect(page.locator("#refine-choice-dialog")).to_be_visible()
    page.locator("#refine-choice-confirm").click()
    settled()
    expect(page.locator("#slide-count")).to_have_text("4")
    refine("conflict")
    expect(page.locator("#refine-choice-dialog")).to_be_visible()
    page.locator("#refine-choice-back").click()
    expect(page.locator("#slide-count")).to_have_text("4")
    refine("conflict")
    page.locator("#refine-choice-confirm").click()
    settled()
    expect(page.locator("#slide-count")).to_have_text("5")
    refine("release")
    settled()
    expect(page.locator("#constraint-list")).not_to_contain_text("Độ dài")
    refine("targeted")
    expect(page.locator("#refine-choice-detail")).to_contain_text("không đảm bảo")
    page.locator("#refine-choice-confirm").click()
    settled()
    expect(page.locator("#change-summary")).to_contain_text("Best effort")
    expect(page.locator("#constraint-list")).not_to_contain_text("Độ dài")
    page.locator("#reject").click()
    expect(page.locator("#version-tag")).to_have_text(accepted)
    expect(page.locator("#constraint-list")).to_contain_text("6 slide")
    assert not errors, errors
    browser.close()
    print("PASS: source alternatives; generation/refinement timeout and validation rejection; state/constraint recovery; accepted export retry and degradation; clarification and best effort. No JS errors.")
