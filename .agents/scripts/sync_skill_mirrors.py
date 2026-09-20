#!/usr/bin/env python3
"""Synchronize repository-owned skills into tool-specific discovery folders."""

from __future__ import annotations

import argparse
import filecmp
import shutil
import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
CANONICAL_ROOT = REPOSITORY_ROOT / ".agents" / "skills"
MIRROR_ROOTS = (
    REPOSITORY_ROOT / ".claude" / "skills",
    REPOSITORY_ROOT / ".codex" / "skills",
)


def skill_names(root: Path) -> set[str]:
    if not root.exists():
        return set()
    return {
        path.name
        for path in root.iterdir()
        if path.is_dir() and (path / "SKILL.md").is_file()
    }


def files_below(root: Path) -> set[Path]:
    return {
        path.relative_to(root)
        for path in root.rglob("*")
        if path.is_file()
    }


def directory_matches(source: Path, mirror: Path) -> bool:
    if not mirror.is_dir() or files_below(source) != files_below(mirror):
        return False
    return all(
        filecmp.cmp(source / relative, mirror / relative, shallow=False)
        for relative in files_below(source)
    )


def ensure_inside_repository(path: Path) -> None:
    path.resolve().relative_to(REPOSITORY_ROOT)


def unknown_mirror_skills(canonical: set[str]) -> list[str]:
    errors: list[str] = []
    for mirror_root in MIRROR_ROOTS:
        for name in sorted(skill_names(mirror_root) - canonical):
            errors.append(
                f"{mirror_root.relative_to(REPOSITORY_ROOT)}/{name} exists only in a mirror; "
                "promote it to .agents/skills before syncing"
            )
    return errors


def check(canonical: set[str]) -> list[str]:
    errors = unknown_mirror_skills(canonical)
    for mirror_root in MIRROR_ROOTS:
        for name in sorted(canonical):
            source = CANONICAL_ROOT / name
            mirror = mirror_root / name
            if not directory_matches(source, mirror):
                errors.append(
                    f"{mirror.relative_to(REPOSITORY_ROOT)} differs from "
                    f"{source.relative_to(REPOSITORY_ROOT)}"
                )
    return errors


def sync(canonical: set[str]) -> None:
    errors = unknown_mirror_skills(canonical)
    if errors:
        raise RuntimeError("\n".join(errors))

    for mirror_root in MIRROR_ROOTS:
        ensure_inside_repository(mirror_root)
        mirror_root.mkdir(parents=True, exist_ok=True)
        for name in sorted(canonical):
            source = CANONICAL_ROOT / name
            destination = mirror_root / name
            ensure_inside_repository(destination)
            if destination.exists():
                shutil.rmtree(destination)
            shutil.copytree(source, destination)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Mirror .agents/skills into .claude/skills and .codex/skills."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="report drift without changing files",
    )
    args = parser.parse_args()

    canonical = skill_names(CANONICAL_ROOT)
    if not canonical:
        print("No canonical skills found in .agents/skills", file=sys.stderr)
        return 1

    if not args.check:
        try:
            sync(canonical)
        except RuntimeError as error:
            print(error, file=sys.stderr)
            return 1

    errors = check(canonical)
    if errors:
        print("Skill mirror validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    action = "Validated" if args.check else "Synchronized"
    mirrors = ", ".join(
        str(path.relative_to(REPOSITORY_ROOT)) for path in MIRROR_ROOTS
    )
    print(f"{action} {len(canonical)} skills across {mirrors}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
