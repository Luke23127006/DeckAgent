# Versions

Each version of DeckAgent has one folder here. A version folder holds its implementation
plan, its tasks, its progress and its handoffs.

A version folder is a record of one version. It is not a plan for the next one. When a
version ends, its folder stays as it was. Its files do not move into the next version.

## Layout

```
docs/versions/
├── README.md          ← this file
└── v1/                ← the plan and the progress of V1
    ├── PROGRESS.md
    ├── task-*.md
    └── *-plan.md
```

A new version adds a folder beside the ones that exist: `docs/versions/v2/`, then
`docs/versions/v3/`, and so on. No file changes outside that folder.

## Which version is active

The active version is the last one in the version list in
[`docs/spec/00-current-scope/VERSIONS.md`](../spec/00-current-scope/VERSIONS.md).
This file does not repeat the version list. One place holds it.

That pointer moves to `docs/versions/` in a later change. Until then, `docs/spec/`
still defines the versions.

## Rules

- Put a new implementation plan, task or handoff in the folder of its version.
- Do not copy a finished task into the next version. Name the new task for the work
  that the new version needs.
- `PROGRESS.md` belongs to its own version folder. Read the one in the active version.
- State the version of a file when a file outside `docs/versions/` points to it, for
  example `docs/versions/v1/PROGRESS.md`.
