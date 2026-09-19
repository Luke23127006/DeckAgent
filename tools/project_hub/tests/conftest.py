from __future__ import annotations

from pathlib import Path

import pytest

from project_hub.config import ColumnSpec, ProjectConfig, TableSpec


@pytest.fixture
def small_config(tmp_path: Path) -> ProjectConfig:
    requirements = TableSpec(
        key="requirements",
        sheet="Requirements",
        filename="requirements.tsv",
        id_pattern=r"^R-\d{3,}$",
        columns=(
            ColumnSpec("ID", "id", required=True),
            ColumnSpec("Requirement", "requirement", required=True),
        ),
    )
    work = TableSpec(
        key="work",
        sheet="Work",
        filename="work.tsv",
        id_pattern=r"^W-\d{3,}$",
        columns=(
            ColumnSpec("ID", "id", required=True),
            ColumnSpec("Title", "title", required=True),
            ColumnSpec("Requirement", "requirement_ids", references=("requirements",)),
        ),
    )
    return ProjectConfig(
        path=tmp_path / "config" / "project-hub.json",
        schema_version=1,
        spreadsheet_id="test-spreadsheet-id",
        snapshot_dir=tmp_path / "snapshot",
        tables=(requirements, work),
    )
