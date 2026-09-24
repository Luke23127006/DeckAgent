from __future__ import annotations

from project_hub import cli
from project_hub.google_sheets import RemoteSpreadsheet
from project_hub.normalize import NormalizedTable
from project_hub.snapshot import write_snapshot


def _valid_tables():
    return {
        "requirements": NormalizedTable(
            "requirements",
            ("id", "requirement"),
            ({"id": "R-001", "requirement": "First"},),
        ),
        "work": NormalizedTable(
            "work",
            ("id", "title", "requirement_ids"),
            ({"id": "W-001", "title": "Build", "requirement_ids": "R-001"},),
        ),
    }


def test_validate_exit_codes(monkeypatch, small_config, capsys) -> None:
    monkeypatch.setattr(cli, "load_config", lambda _path=None: small_config)
    write_snapshot(small_config, _valid_tables())

    assert cli.main(["validate"]) == 0
    assert "Validation passed" in capsys.readouterr().out

    invalid = _valid_tables()
    invalid["work"] = NormalizedTable(
        "work",
        ("id", "title", "requirement_ids"),
        ({"id": "W-001", "title": "Build", "requirement_ids": "R-999"},),
    )
    write_snapshot(small_config, invalid)

    assert cli.main(["validate"]) == 1
    assert "broken_reference" in capsys.readouterr().out


def test_sync_does_not_publish_when_validation_fails(monkeypatch, small_config, capsys) -> None:
    monkeypatch.setattr(cli, "load_config", lambda _path=None: small_config)
    monkeypatch.setattr(cli, "load_credentials", lambda: object())
    monkeypatch.setattr(cli, "build_service", lambda credentials: object())

    good_values = {
        "Requirements": [["ID", "Requirement"], ["R-001", "First"]],
        "Work": [["ID", "Title", "Requirement"], ["W-001", "Build", "R-001"]],
    }
    monkeypatch.setattr(
        cli, "fetch_project_hub", lambda *a, **k: RemoteSpreadsheet("Test Sheet", good_values)
    )
    assert cli.main(["sync"]) == 0
    requirements_path = small_config.snapshot_dir / "requirements.tsv"
    work_path = small_config.snapshot_dir / "work.tsv"
    good_requirements_snapshot = requirements_path.read_text(encoding="utf-8")
    good_work_snapshot = work_path.read_text(encoding="utf-8")
    assert "R-001" in good_requirements_snapshot

    bad_values = {
        "Requirements": [["ID", "Requirement"], ["R-001", "First"]],
        "Work": [["ID", "Title", "Requirement"], ["W-001", "Build", "R-999"]],
    }
    monkeypatch.setattr(
        cli, "fetch_project_hub", lambda *a, **k: RemoteSpreadsheet("Test Sheet", bad_values)
    )
    capsys.readouterr()
    assert cli.main(["sync"]) == 1
    out = capsys.readouterr().out
    assert "not published" in out
    assert "broken_reference" in out

    # The previously published, valid snapshot must be left untouched byte-for-byte.
    assert requirements_path.read_text(encoding="utf-8") == good_requirements_snapshot
    assert work_path.read_text(encoding="utf-8") == good_work_snapshot
    assert "R-999" not in work_path.read_text(encoding="utf-8")


def test_console_streams_are_configured_for_utf8(monkeypatch) -> None:
    class Stream:
        def __init__(self):
            self.calls = []

        def reconfigure(self, **kwargs):
            self.calls.append(kwargs)

    stdout = Stream()
    stderr = Stream()
    monkeypatch.setattr(cli.sys, "stdout", stdout)
    monkeypatch.setattr(cli.sys, "stderr", stderr)

    cli._configure_console_encoding()

    expected = [{"encoding": "utf-8", "errors": "backslashreplace"}]
    assert stdout.calls == expected
    assert stderr.calls == expected


def test_sync_publishes_when_only_warnings(monkeypatch, small_config, capsys) -> None:
    monkeypatch.setattr(cli, "load_config", lambda _path=None: small_config)
    monkeypatch.setattr(cli, "load_credentials", lambda: object())
    monkeypatch.setattr(cli, "build_service", lambda credentials: object())
    values = {
        "Requirements": [["ID", "Requirement"], ["R-001", "First"]],
        "Work": [["ID", "Title", "Requirement"], ["W-001", "Build", "Many requirements, export"]],
    }
    monkeypatch.setattr(
        cli, "fetch_project_hub", lambda *a, **k: RemoteSpreadsheet("Test Sheet", values)
    )

    assert cli.main(["sync"]) == 0
    out = capsys.readouterr().out
    assert "not published" not in out
    assert "WARNING malformed_reference" in out
    assert "Validation passed with 1 warning(s)." in out
    work = (small_config.snapshot_dir / "work.tsv").read_text(encoding="utf-8")
    assert "Many requirements, export" in work

    assert cli.main(["validate"]) == 0
