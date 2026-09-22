from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from contextlib import suppress
from datetime import UTC, datetime
from pathlib import Path

from project_hub.auth import auth_status, authenticate, load_credentials, logout
from project_hub.config import (
    PLACEHOLDER_IDS,
    config_as_dict,
    load_config,
    require_spreadsheet_id,
)
from project_hub.errors import ProjectHubError, SnapshotError
from project_hub.google_sheets import build_service, fetch_metadata, fetch_project_hub
from project_hub.normalize import normalize_all
from project_hub.snapshot import (
    load_manifest,
    read_snapshot,
    verify_manifest,
    write_snapshot,
)
from project_hub.validation import (
    format_issues_json,
    format_issues_text,
    run_validation,
    structural_issue,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="project-hub",
        description="Read-only local snapshot tooling for a private Google Project Hub.",
    )
    parser.add_argument("--config", type=Path, help="Path to config/project-hub.json")
    subparsers = parser.add_subparsers(dest="command", required=True)

    auth_parser = subparsers.add_parser("auth", help="Authenticate this OS user with Google")
    auth_parser.add_argument("--client-secrets", type=Path, help="OAuth Desktop app JSON file")
    auth_parser.add_argument(
        "--no-browser", action="store_true", help="Print the OAuth URL instead of opening a browser"
    )
    auth_parser.add_argument("--login-hint", help="Google email hint; not persisted by this tool")
    auth_parser.add_argument(
        "--no-verify",
        action="store_true",
        help="Do not verify access to the configured spreadsheet",
    )

    subparsers.add_parser("sync", help="Fetch Google Sheets and update changed TSV tables")

    status_parser = subparsers.add_parser("status", help="Show auth and snapshot freshness")
    status_parser.add_argument(
        "--max-age-hours",
        type=float,
        default=24.0,
        help="Consider an older snapshot stale; use 0 to disable (default: 24)",
    )
    status_parser.add_argument(
        "--remote", action="store_true", help="Make a read-only API call to verify remote access"
    )
    status_parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")

    validate_parser = subparsers.add_parser(
        "validate", help="Validate the local snapshot deterministically"
    )
    validate_parser.add_argument("--format", choices=("text", "json"), default="text")

    logout_parser = subparsers.add_parser("logout", help="Remove this OS user's local token")
    logout_parser.add_argument(
        "--revoke", action="store_true", help="Revoke with Google before deleting the local token"
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    _configure_console_encoding()
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        config = load_config(args.config)
        if args.command == "auth":
            return _command_auth(config, args)
        if args.command == "sync":
            return _command_sync(config)
        if args.command == "status":
            return _command_status(config, args)
        if args.command == "validate":
            return _command_validate(config, args)
        if args.command == "logout":
            return _command_logout(args)
        parser.error(f"Unknown command: {args.command}")
    except ProjectHubError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    return 2


def _configure_console_encoding() -> None:
    """Keep non-ASCII Project Hub findings printable on Windows consoles."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            with suppress(OSError, ValueError):
                reconfigure(encoding="utf-8", errors="backslashreplace")


def _command_auth(config, args: argparse.Namespace) -> int:
    credentials = authenticate(
        client_file=args.client_secrets,
        open_browser=not args.no_browser,
        login_hint=args.login_hint,
    )
    print("Authentication succeeded with the read-only Google Sheets scope.")
    print(f"Token stored outside the repository: {auth_status()['tokenPath']}")
    if args.no_verify:
        return 0
    if config.spreadsheet_id in PLACEHOLDER_IDS:
        print("Remote verification skipped: configure spreadsheetId before sync.")
        return 0
    metadata = fetch_metadata(build_service(credentials), require_spreadsheet_id(config))
    title = metadata.get("properties", {}).get("title", "(untitled)")
    print(f"Remote read access verified: {title}")
    return 0


def _command_sync(config) -> int:
    spreadsheet_id = require_spreadsheet_id(config)
    credentials = load_credentials()
    remote = fetch_project_hub(build_service(credentials), spreadsheet_id, config.tables)
    tables = normalize_all(config.tables, remote.values_by_sheet)
    issues = run_validation(config, tables)
    print(f"Synced read-only Google spreadsheet: {remote.title or '(untitled)'}")
    print(f"Snapshot: {config.snapshot_dir}")
    if issues:
        # Invalid remote data must never overwrite a last-known-good snapshot:
        # skip publication entirely so callers relying on .project-hub/snapshot/
        # keep reading the previous validated state.
        print("Candidate snapshot not published: validation failed, previous snapshot preserved.")
    else:
        manifest = write_snapshot(config, tables)
        changed = manifest["changedTables"]
        removed = manifest["removedFiles"]
        print(
            "Changed tables: " + (", ".join(changed) if changed else "none (TSV files untouched)")
        )
        if removed:
            print("Removed stale files (no longer in config): " + ", ".join(removed))
    print(format_issues_text(issues))
    return 1 if issues else 0


def _command_validate(config, args: argparse.Namespace) -> int:
    tables, read_errors = read_snapshot(config)
    manifest_errors = verify_manifest(config)
    issues = [structural_issue(message) for message in (*read_errors, *manifest_errors)]
    issues.extend(
        issue
        for issue in run_validation(config, tables)
        if not (
            issue.code == "schema_mismatch" and issue.message.startswith("Missing logical table")
        )
    )
    output = format_issues_json(issues) if args.format == "json" else format_issues_text(issues)
    print(output)
    return 1 if issues else 0


def _command_status(config, args: argparse.Namespace) -> int:
    if args.max_age_hours < 0:
        raise SnapshotError("--max-age-hours cannot be negative")
    result = config_as_dict(config)
    result["auth"] = auth_status()
    result["snapshot"] = _snapshot_status(config, args.max_age_hours)
    result["remote"] = {"checked": False}
    healthy = bool(result["spreadsheetConfigured"])
    healthy = healthy and bool(result["auth"].get("authenticated"))
    healthy = healthy and bool(result["snapshot"].get("present"))
    healthy = healthy and not bool(result["snapshot"].get("stale"))

    if args.remote:
        spreadsheet_id = require_spreadsheet_id(config)
        credentials = load_credentials()
        metadata = fetch_metadata(build_service(credentials), spreadsheet_id)
        properties = metadata.get("properties", {})
        result["remote"] = {
            "checked": True,
            "accessible": True,
            "title": properties.get("title", ""),
            "locale": properties.get("locale", ""),
            "timeZone": properties.get("timeZone", ""),
        }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        _print_status_text(result)
    return 0 if healthy else 1


def _snapshot_status(config, max_age_hours: float) -> dict[str, object]:
    manifest = load_manifest(config.snapshot_dir)
    if manifest is None:
        return {"present": False, "path": str(config.snapshot_dir), "stale": True}
    synced_at = str(manifest.get("syncedAt", ""))
    age_hours: float | None = None
    stale = True
    try:
        synced = datetime.fromisoformat(synced_at.replace("Z", "+00:00"))
        if synced.tzinfo is None:
            synced = synced.replace(tzinfo=UTC)
        age_hours = max(0.0, (datetime.now(UTC) - synced.astimezone(UTC)).total_seconds() / 3600)
        stale = max_age_hours > 0 and age_hours > max_age_hours
    except ValueError:
        pass
    return {
        "present": True,
        "path": str(config.snapshot_dir),
        "syncedAt": synced_at,
        "ageHours": round(age_hours, 2) if age_hours is not None else None,
        "stale": stale,
        "changedTables": manifest.get("changedTables", []),
        "tableCount": len(manifest.get("tables", {})),
    }


def _print_status_text(result: dict[str, object]) -> None:
    auth = result["auth"]
    snapshot = result["snapshot"]
    remote = result["remote"]
    assert isinstance(auth, dict)
    assert isinstance(snapshot, dict)
    assert isinstance(remote, dict)
    print(f"Config: {result['schemaVersion']} ({len(result['tables'])} tables)")
    print(f"Spreadsheet configured: {'yes' if result['spreadsheetConfigured'] else 'NO'}")
    print(f"Authenticated: {'yes' if auth.get('authenticated') else 'NO'}")
    print(f"Token path: {auth.get('tokenPath')}")
    if snapshot.get("present"):
        state = "STALE" if snapshot.get("stale") else "fresh"
        print(
            f"Snapshot: {state}; synced {snapshot.get('syncedAt')}; "
            f"age {snapshot.get('ageHours')}h; path {snapshot.get('path')}"
        )
        changed = snapshot.get("changedTables") or []
        print(f"Last changed tables: {', '.join(changed) if changed else 'none'}")
    else:
        print(f"Snapshot: MISSING ({snapshot.get('path')})")
    if remote.get("checked"):
        print(f"Remote access: yes ({remote.get('title')})")


def _command_logout(args: argparse.Namespace) -> int:
    removed = logout(revoke=args.revoke)
    if removed:
        print("Google token revoked and removed." if args.revoke else "Local Google token removed.")
    else:
        print("No local Google token was present.")
    return 0
