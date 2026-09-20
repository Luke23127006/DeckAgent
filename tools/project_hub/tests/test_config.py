from __future__ import annotations

import json

from project_hub.config import load_config
from project_hub.normalize import normalize_all


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
