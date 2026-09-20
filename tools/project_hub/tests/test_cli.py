from __future__ import annotations

from project_hub import cli
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
