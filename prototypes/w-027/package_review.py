"""Build the standalone W-027 review ZIP; no dependencies or Project Hub access."""
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent
FILES = [
    "REVIEW.html", "HANDOFF.md", "FEEDBACK.md", "README.md",
    "index.html", "styles.css", "app.js", "state.js", "fixtures.js",
    "storyboards.html", "storyboards.css", "package_review.py",
    "tests/state.test.cjs", "tests/browser_smoke.py", "tests/phase2_smoke.py",
    "review/verification.md",
]
# Curated screenshots only. Do not recursively collect workspace files or archives.
FILES += [str(path.relative_to(ROOT)).replace("\\", "/") for path in sorted((ROOT / "review").glob("*.png"))]


def build():
    payload = {}
    for name in FILES:
        path = (ROOT / name).resolve(strict=True)
        if not path.is_relative_to(ROOT):
            raise ValueError(f"File escapes prototype: {name}")
        payload[name] = path.read_bytes()
    manifest = "".join(f"{sha256(data).hexdigest()}  {name}\n" for name, data in sorted(payload.items()))
    payload["MANIFEST.sha256"] = manifest.encode("utf-8")
    output = ROOT / "artifacts"
    output.mkdir(exist_ok=True)
    archive = output / "deckagent-w027-v0-review.zip"
    with ZipFile(archive, "w", compression=ZIP_DEFLATED) as bundle:
        for name, data in sorted(payload.items()):
            # Fixed timestamp and explicit payload make the same content reproducible.
            entry = ZipInfo(f"deckagent-w027-v0/{name}", (2026, 9, 28, 0, 0, 0))
            entry.compress_type = ZIP_DEFLATED
            bundle.writestr(entry, data)
    digest = sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix(".zip.sha256").write_text(f"{digest}  {archive.name}\n", encoding="utf-8")
    print(f"Built {archive.name}: {len(payload)} files, {archive.stat().st_size} bytes")
    print(f"SHA256 {digest}")


if __name__ == "__main__":
    build()
