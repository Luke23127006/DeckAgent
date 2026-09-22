from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import tempfile
from contextlib import suppress
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from project_hub.config import ProjectConfig
from project_hub.errors import SnapshotError
from project_hub.normalize import NormalizedTable, normalize_cell

MANIFEST_FILENAME = "manifest.json"


def serialize_tsv(table: NormalizedTable) -> bytes:
    stream = io.StringIO(newline="")
    writer = csv.writer(stream, delimiter="\t", lineterminator="\n")
    writer.writerow(table.headers)
    for row in table.rows:
        writer.writerow([normalize_cell(row.get(header, "")) for header in table.headers])
    return stream.getvalue().encode("utf-8")


def content_hash(content: bytes) -> str:
    return f"sha256:{hashlib.sha256(content).hexdigest()}"


def _atomic_write(path: Path, content: bytes, mode: int = 0o600) -> None:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
        temporary_path = Path(temporary_name)
        try:
            with os.fdopen(descriptor, "wb") as handle:
                handle.write(content)
                handle.flush()
                os.fsync(handle.fileno())
            with suppress(OSError):
                os.chmod(temporary_path, mode)
            os.replace(temporary_path, path)
        finally:
            temporary_path.unlink(missing_ok=True)
    except OSError as exc:
        raise SnapshotError(f"Cannot write {path}: {exc}") from exc


def load_manifest(snapshot_dir: Path) -> dict[str, Any] | None:
    path = snapshot_dir / MANIFEST_FILENAME
    if not path.is_file():
        return None
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SnapshotError(f"Cannot read {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise SnapshotError(f"Manifest must be a JSON object: {path}")
    return value


def write_snapshot(
    config: ProjectConfig,
    tables: dict[str, NormalizedTable],
    *,
    now: datetime | None = None,
) -> dict[str, Any]:
    snapshot_dir = config.snapshot_dir
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    with suppress(OSError):
        os.chmod(snapshot_dir, 0o700)

    previous = load_manifest(snapshot_dir) or {}
    previous_tables = previous.get("tables", {})
    if not isinstance(previous_tables, dict):
        previous_tables = {}

    changed: list[str] = []
    manifest_tables: dict[str, dict[str, Any]] = {}
    for spec in config.tables:
        try:
            table = tables[spec.key]
        except KeyError as exc:
            raise SnapshotError(f"Missing normalized table: {spec.key}") from exc
        content = serialize_tsv(table)
        digest = content_hash(content)
        output_path = snapshot_dir / spec.filename
        old_entry = previous_tables.get(spec.key, {})
        old_hash = old_entry.get("hash") if isinstance(old_entry, dict) else None
        existing_hash = None
        if output_path.is_file():
            try:
                existing_hash = content_hash(output_path.read_bytes())
            except OSError as exc:
                raise SnapshotError(
                    f"Cannot read existing snapshot table {output_path}: {exc}"
                ) from exc
        if old_hash != digest or existing_hash != digest:
            _atomic_write(output_path, content)
            changed.append(spec.key)
        manifest_tables[spec.key] = {
            "file": spec.filename,
            "rows": len(table.rows),
            "hash": digest,
        }

    known_filenames = {spec.filename for spec in config.tables}
    removed: list[str] = []
    for existing in sorted(snapshot_dir.glob("*.tsv")):
        if existing.name not in known_filenames:
            try:
                existing.unlink()
            except OSError as exc:
                raise SnapshotError(f"Cannot remove stale snapshot file {existing}: {exc}") from exc
            removed.append(existing.name)

    synced_at = (now or datetime.now(UTC)).astimezone(UTC).isoformat().replace("+00:00", "Z")
    manifest = {
        "schemaVersion": config.schema_version,
        "syncedAt": synced_at,
        "changedTables": changed,
        "removedFiles": removed,
        "tables": manifest_tables,
    }
    manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    _atomic_write(snapshot_dir / MANIFEST_FILENAME, manifest_bytes)
    return manifest


def read_snapshot(config: ProjectConfig) -> tuple[dict[str, NormalizedTable], list[str]]:
    tables: dict[str, NormalizedTable] = {}
    errors: list[str] = []
    for spec in config.tables:
        path = config.snapshot_dir / spec.filename
        if not path.is_file():
            errors.append(f"Missing snapshot table: {path}")
            continue
        try:
            with path.open("r", encoding="utf-8", newline="") as handle:
                reader = csv.reader(handle, delimiter="\t")
                raw_rows = list(reader)
        except (OSError, csv.Error, UnicodeDecodeError) as exc:
            errors.append(f"Cannot read snapshot table {path}: {exc}")
            continue
        if not raw_rows:
            errors.append(f"Snapshot table is empty: {path}")
            continue
        headers = tuple(raw_rows[0])
        if headers != spec.headers:
            errors.append(
                f"Snapshot schema mismatch for {spec.key}: expected {list(spec.headers)!r}, "
                f"found {list(headers)!r}"
            )
            continue
        mapped_rows: list[dict[str, str]] = []
        for row_number, values in enumerate(raw_rows[1:], start=2):
            if len(values) != len(headers):
                errors.append(
                    f"Snapshot row width mismatch for {spec.key} line {row_number}: "
                    f"expected {len(headers)}, found {len(values)}"
                )
                continue
            mapped_rows.append(dict(zip(headers, values, strict=True)))
        tables[spec.key] = NormalizedTable(spec.key, headers, tuple(mapped_rows))
    return tables, errors


def verify_manifest(config: ProjectConfig) -> list[str]:
    errors: list[str] = []
    manifest = load_manifest(config.snapshot_dir)
    if manifest is None:
        return [f"Missing snapshot manifest: {config.snapshot_dir / MANIFEST_FILENAME}"]
    if manifest.get("schemaVersion") != config.schema_version:
        errors.append(
            "Manifest schemaVersion does not match config: "
            f"{manifest.get('schemaVersion')!r} != {config.schema_version!r}"
        )
    entries = manifest.get("tables")
    if not isinstance(entries, dict):
        return [*errors, "Manifest 'tables' must be an object"]
    for spec in config.tables:
        path = config.snapshot_dir / spec.filename
        entry = entries.get(spec.key)
        if not isinstance(entry, dict):
            errors.append(f"Manifest is missing table metadata for {spec.key}")
            continue
        if not path.is_file():
            continue
        actual = content_hash(path.read_bytes())
        if entry.get("hash") != actual:
            errors.append(
                f"Snapshot hash mismatch for {spec.key}: manifest={entry.get('hash')!r}, "
                f"actual={actual!r}"
            )
    return errors
