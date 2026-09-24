from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from project_hub.errors import ConfigError

SPREADSHEET_ID_ENV = "PROJECT_HUB_SPREADSHEET_ID"
PLACEHOLDER_IDS = {
    "",
    "REPLACE_WITH_GOOGLE_SPREADSHEET_ID",
    "replace-with-google-spreadsheet-id",
}


@dataclass(frozen=True)
class ColumnSpec:
    source: str
    name: str
    required: bool = False
    header_required: bool = True
    references: tuple[str, ...] = ()
    allowed_values: tuple[str, ...] = ()
    no_self_reference: bool = False


@dataclass(frozen=True)
class RowRule:
    kind: str
    fields: tuple[str, ...]


@dataclass(frozen=True)
class TableSpec:
    key: str
    sheet: str
    filename: str
    id_pattern: str
    columns: tuple[ColumnSpec, ...]
    row_rules: tuple[RowRule, ...] = ()
    id_column_name: str = "id"
    header_row: int | None = None
    unknown_columns: str = "error"
    drop_id_only_rows: bool = True
    has_id: bool = True

    @property
    def source_headers(self) -> tuple[str, ...]:
        return tuple(column.source for column in self.columns)

    @property
    def headers(self) -> tuple[str, ...]:
        return tuple(column.name for column in self.columns)

    @property
    def id_column(self) -> ColumnSpec:
        if not self.has_id:
            raise ConfigError(
                f"Table {self.key!r} has no stable ID column (hasId=false); "
                "rows are identified positionally, not by ID"
            )
        for column in self.columns:
            if column.name == self.id_column_name:
                return column
        raise ConfigError(
            f"Table {self.key!r} does not define configured ID column {self.id_column_name!r}"
        )


@dataclass(frozen=True)
class ProjectConfig:
    path: Path
    schema_version: int
    spreadsheet_id: str
    snapshot_dir: Path
    tables: tuple[TableSpec, ...]

    @property
    def table_map(self) -> dict[str, TableSpec]:
        return {table.key: table for table in self.tables}


def find_config(start: Path | None = None) -> Path:
    current = (start or Path.cwd()).resolve()
    for directory in (current, *current.parents):
        candidate = directory / "config" / "project-hub.json"
        if candidate.is_file():
            return candidate
    raise ConfigError(
        "Could not find config/project-hub.json from the current directory. Use --config PATH."
    )


def load_config(path: Path | str | None = None) -> ProjectConfig:
    config_path = Path(path).resolve() if path else find_config()
    try:
        raw = json.loads(config_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ConfigError(f"Config file not found: {config_path}") from exc
    except json.JSONDecodeError as exc:
        raise ConfigError(f"Invalid JSON in {config_path}: {exc}") from exc

    if not isinstance(raw, dict):
        raise ConfigError("Project Hub config must be a JSON object")

    try:
        schema_version = int(raw["schemaVersion"])
        configured_id = str(raw.get("spreadsheetId", "")).strip()
        snapshot_value = str(raw.get("snapshotDir", ".project-hub/snapshot"))
        raw_tables = raw["tables"]
    except (KeyError, TypeError, ValueError) as exc:
        raise ConfigError(
            "Config requires integer schemaVersion, spreadsheetId, snapshotDir, and tables"
        ) from exc

    if schema_version < 1:
        raise ConfigError("schemaVersion must be a positive integer")
    if not isinstance(raw_tables, dict) or not raw_tables:
        raise ConfigError("Config 'tables' must be a non-empty object")

    schema_defaults = raw.get("schemaDefaults", {})
    if not isinstance(schema_defaults, dict):
        raise ConfigError("Config 'schemaDefaults' must be an object")

    spreadsheet_id = os.environ.get(SPREADSHEET_ID_ENV, configured_id).strip()
    repo_root = config_path.parent.parent
    snapshot_dir = Path(snapshot_value)
    if not snapshot_dir.is_absolute():
        snapshot_dir = (repo_root / snapshot_dir).resolve()

    tables: list[TableSpec] = []
    filenames: set[str] = set()
    sheets: set[str] = set()
    for key, table_raw in raw_tables.items():
        if not isinstance(table_raw, dict):
            raise ConfigError(f"Table {key!r} must be an object")
        try:
            sheet = str(table_raw["sheet"]).strip()
            filename = str(table_raw.get("file", f"{key}.tsv")).strip()
            columns_raw = table_raw["columns"]
        except KeyError as exc:
            raise ConfigError(f"Table {key!r} is missing {exc.args[0]!r}") from exc

        has_id_raw = table_raw.get("hasId", schema_defaults.get("hasId", True))
        if not isinstance(has_id_raw, bool):
            raise ConfigError(f"Table {key!r} hasId must be a boolean")
        has_id = has_id_raw
        id_pattern = str(table_raw.get("idPattern", "")).strip()
        if has_id and not id_pattern:
            raise ConfigError(f"Table {key!r} is missing 'idPattern' (required unless hasId=false)")

        if not sheet or not filename:
            raise ConfigError(f"Table {key!r} has an empty sheet or file")
        if Path(filename).name != filename or not filename.endswith(".tsv"):
            raise ConfigError(f"Table {key!r} file must be a plain .tsv filename")
        if has_id:
            try:
                re.compile(id_pattern)
            except re.error as exc:
                raise ConfigError(f"Table {key!r} has invalid idPattern: {exc}") from exc
        if filename in filenames:
            raise ConfigError(f"Duplicate snapshot filename: {filename}")
        if sheet in sheets:
            raise ConfigError(f"Duplicate source sheet mapping: {sheet}")
        filenames.add(filename)
        sheets.add(sheet)

        id_column_name = str(
            table_raw.get("idColumn", schema_defaults.get("idColumn", "id"))
        ).strip()
        header_row_raw = table_raw.get("headerRow", schema_defaults.get("headerRow"))
        if header_row_raw is None:
            header_row = None
        elif (
            isinstance(header_row_raw, bool)
            or not isinstance(header_row_raw, int)
            or header_row_raw < 1
        ):
            raise ConfigError(f"Table {key!r} headerRow must be a positive integer")
        else:
            header_row = header_row_raw
        unknown_columns = str(
            table_raw.get("unknownColumns", schema_defaults.get("unknownColumns", "error"))
        ).strip()
        if unknown_columns not in {"error", "ignore"}:
            raise ConfigError(f"Table {key!r} unknownColumns must be either 'error' or 'ignore'")
        drop_id_only_rows = table_raw.get(
            "dropIdOnlyRows", schema_defaults.get("dropIdOnlyRows", True)
        )
        if not isinstance(drop_id_only_rows, bool):
            raise ConfigError(f"Table {key!r} dropIdOnlyRows must be a boolean")
        if not id_column_name:
            raise ConfigError(f"Table {key!r} idColumn must not be empty")

        if not isinstance(columns_raw, list) or not columns_raw:
            raise ConfigError(f"Table {key!r} columns must be a non-empty array")
        columns: list[ColumnSpec] = []
        source_names: set[str] = set()
        canonical_names: set[str] = set()
        for column_raw in columns_raw:
            if not isinstance(column_raw, dict):
                raise ConfigError(f"Table {key!r} contains a non-object column")
            try:
                source = str(column_raw["source"]).strip()
                name = str(column_raw["name"]).strip()
            except KeyError as exc:
                raise ConfigError(f"Table {key!r} column is missing {exc.args[0]!r}") from exc
            if not source or not name:
                raise ConfigError(f"Table {key!r} has an empty source/name column mapping")
            if source in source_names or name in canonical_names:
                raise ConfigError(
                    f"Table {key!r} has duplicate column mapping for {source!r}/{name!r}"
                )
            source_names.add(source)
            canonical_names.add(name)
            columns.append(
                ColumnSpec(
                    source=source,
                    name=name,
                    required=bool(column_raw.get("required", False)),
                    header_required=bool(column_raw.get("headerRequired", True)),
                    references=tuple(str(value) for value in column_raw.get("references", [])),
                    allowed_values=tuple(
                        str(value) for value in column_raw.get("allowedValues", [])
                    ),
                    no_self_reference=bool(column_raw.get("noSelfReference", False)),
                )
            )

        if has_id:
            if id_column_name not in canonical_names:
                raise ConfigError(
                    f"Table {key!r} must map one column to configured ID name {id_column_name!r}"
                )
            id_column = next(column for column in columns if column.name == id_column_name)
            if not id_column.header_required:
                raise ConfigError(f"Table {key!r} ID header must be required")

        row_rules: list[RowRule] = []
        for rule_raw in table_raw.get("rowRules", []):
            if not isinstance(rule_raw, dict):
                raise ConfigError(f"Table {key!r} contains a non-object row rule")
            kind = str(rule_raw.get("kind", "")).strip()
            fields = tuple(str(value) for value in rule_raw.get("fields", []))
            if kind != "atLeastOne" or not fields:
                raise ConfigError(
                    f"Table {key!r} row rules support only non-empty kind='atLeastOne'"
                )
            unknown_fields = sorted(set(fields) - canonical_names)
            if unknown_fields:
                raise ConfigError(
                    f"Table {key!r} row rule uses unknown fields: {', '.join(unknown_fields)}"
                )
            row_rules.append(RowRule(kind=kind, fields=fields))

        tables.append(
            TableSpec(
                key=str(key),
                sheet=sheet,
                filename=filename,
                id_pattern=id_pattern,
                columns=tuple(columns),
                row_rules=tuple(row_rules),
                id_column_name=id_column_name,
                header_row=header_row,
                unknown_columns=unknown_columns,
                drop_id_only_rows=drop_id_only_rows,
                has_id=has_id,
            )
        )

    table_keys = {table.key for table in tables}
    table_map = {table.key: table for table in tables}
    for table in tables:
        for column in table.columns:
            unknown_targets = sorted(set(column.references) - table_keys)
            if unknown_targets:
                raise ConfigError(
                    f"Table {table.key!r} column {column.name!r} references unknown tables: "
                    f"{', '.join(unknown_targets)}"
                )
            id_less_targets = sorted(
                target for target in column.references if not table_map[target].has_id
            )
            if id_less_targets:
                raise ConfigError(
                    f"Table {table.key!r} column {column.name!r} references table(s) without a "
                    f"stable ID column (hasId=false): {', '.join(id_less_targets)}"
                )

    return ProjectConfig(
        path=config_path,
        schema_version=schema_version,
        spreadsheet_id=spreadsheet_id,
        snapshot_dir=snapshot_dir,
        tables=tuple(tables),
    )


def require_spreadsheet_id(config: ProjectConfig) -> str:
    if config.spreadsheet_id in PLACEHOLDER_IDS:
        raise ConfigError(
            "Google Spreadsheet ID is not configured. Replace the placeholder in "
            f"{config.path} or set {SPREADSHEET_ID_ENV}."
        )
    if "/" in config.spreadsheet_id or any(char.isspace() for char in config.spreadsheet_id):
        raise ConfigError(
            "spreadsheetId must be the ID from the Google Sheets URL, not the full URL"
        )
    return config.spreadsheet_id


def config_as_dict(config: ProjectConfig) -> dict[str, Any]:
    """Small diagnostic representation that intentionally excludes OAuth state."""
    return {
        "schemaVersion": config.schema_version,
        "spreadsheetConfigured": config.spreadsheet_id not in PLACEHOLDER_IDS,
        "snapshotDir": str(config.snapshot_dir),
        "tables": [table.key for table in config.tables],
    }
