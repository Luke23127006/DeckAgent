from __future__ import annotations

import json
from pathlib import Path

import pytest

from project_hub.config import load_config
from project_hub.errors import ConfigError
from project_hub.normalize import normalize_all

REPO_CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "project-hub.json"


def test_new_logical_table_is_added_declaratively(tmp_path) -> None:
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    config_path = config_dir / "project-hub.json"
    config_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "spreadsheetId": "test-sheet",
                "snapshotDir": "../snapshot",
                "schemaDefaults": {
                    "headerRow": 2,
                    "idColumn": "id",
                    "unknownColumns": "ignore",
                    "dropIdOnlyRows": True,
                },
                "tables": {
                    "notes": {
                        "sheet": "Notes",
                        "file": "notes.tsv",
                        "idPattern": r"^N-\d{3,}$",
                        "columns": [
                            {"source": "ID", "name": "id", "required": True},
                            {"source": "Title", "name": "title", "required": True},
                            {
                                "source": "Related Requirements",
                                "name": "requirement_ids",
                                "headerRequired": False,
                            },
                        ],
                    }
                },
            }
        ),
        encoding="utf-8",
    )

    config = load_config(config_path)
    tables = normalize_all(
        config.tables,
        {"Notes": [["Project Hub"], ["Title", "ID"], ["One", "N-001"]]},
    )

    assert config.tables[0].header_row == 2
    assert config.tables[0].unknown_columns == "ignore"
    assert tables["notes"].headers == ("id", "title", "requirement_ids")
    assert tables["notes"].rows == ({"id": "N-001", "title": "One", "requirement_ids": ""},)


def _write_config(tmp_path: Path, tables: dict) -> Path:
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    config_path = config_dir / "project-hub.json"
    config_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "spreadsheetId": "test-sheet",
                "snapshotDir": "../snapshot",
                "schemaDefaults": {
                    "headerRow": 2,
                    "idColumn": "id",
                    "unknownColumns": "ignore",
                    "dropIdOnlyRows": True,
                },
                "tables": tables,
            }
        ),
        encoding="utf-8",
    )
    return config_path


def test_table_without_stable_id_is_declared_with_has_id_false(tmp_path: Path) -> None:
    config_path = _write_config(
        tmp_path,
        {
            "updates": {
                "sheet": "Updates",
                "file": "updates.tsv",
                "hasId": False,
                "columns": [
                    {"source": "Date", "name": "date", "required": True},
                    {"source": "Member", "name": "member", "required": True},
                ],
            }
        },
    )

    config = load_config(config_path)
    table = config.table_map["updates"]

    assert table.has_id is False
    assert table.id_pattern == ""
    with pytest.raises(ConfigError, match="hasId=false"):
        _ = table.id_column


def test_table_without_has_id_flag_still_requires_id_pattern(tmp_path: Path) -> None:
    config_path = _write_config(
        tmp_path,
        {
            "notes": {
                "sheet": "Notes",
                "file": "notes.tsv",
                "columns": [
                    {"source": "ID", "name": "id", "required": True},
                    {"source": "Title", "name": "title", "required": True},
                ],
            }
        },
    )

    with pytest.raises(ConfigError, match="idPattern"):
        load_config(config_path)


def test_has_id_must_be_a_json_boolean(tmp_path: Path) -> None:
    config_path = _write_config(
        tmp_path,
        {
            "updates": {
                "sheet": "Updates",
                "file": "updates.tsv",
                "hasId": "false",
                "columns": [
                    {"source": "Date", "name": "date", "required": True},
                ],
            }
        },
    )

    with pytest.raises(ConfigError, match="hasId must be a boolean"):
        load_config(config_path)


def test_column_cannot_reference_a_table_without_a_stable_id(tmp_path: Path) -> None:
    config_path = _write_config(
        tmp_path,
        {
            "updates": {
                "sheet": "Updates",
                "file": "updates.tsv",
                "hasId": False,
                "columns": [
                    {"source": "Date", "name": "date", "required": True},
                ],
            },
            "notes": {
                "sheet": "Notes",
                "file": "notes.tsv",
                "idPattern": r"^N-\d{3,}$",
                "columns": [
                    {"source": "ID", "name": "id", "required": True},
                    {"source": "Update", "name": "update_id", "references": ["updates"]},
                ],
            },
        },
    )

    with pytest.raises(ConfigError, match="hasId=false"):
        load_config(config_path)


def test_committed_project_hub_config_loads_and_declares_every_table() -> None:
    config = load_config(REPO_CONFIG_PATH)

    assert config.spreadsheet_id
    table_keys = {table.key for table in config.tables}
    assert table_keys == {
        "actors",
        "use_cases",
        "requirements",
        "constraints",
        "business_rules",
        "assumptions",
        "decisions",
        "learnings",
        "risks",
        "sprints",
        "work",
        "bugs",
        "updates",
        "documents",
    }
    sheets = {table.sheet for table in config.tables}
    assert len(sheets) == len(config.tables), "each table must map to a distinct source sheet"
    assert config.table_map["updates"].has_id is False
    assert config.table_map["work"].has_id is True
