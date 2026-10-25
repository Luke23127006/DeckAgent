# Versions

Each version of DeckAgent has one folder here. A version folder holds its scope, its
implementation plan, its tasks, its progress and its handoffs.

A version folder is a record of one version. It is not a plan for the next one. When a
version ends, its folder stays as it was. Its files do not move into the next version.

## Layout

```
docs/versions/
├── README.md          ← this file
└── v1/                ← the scope, the plan and the progress of V1
    ├── SCOPE.md       ← what V1 takes from the spec: goal, choices and flows
    ├── PROGRESS.md
    ├── task-*.md
    └── *-plan.md
```

A new version adds a folder beside the ones that exist: `docs/versions/v2/`, then
`docs/versions/v3/`, and so on. It brings its own scope file. No file changes outside
that folder.

## Which version is active

The version list below is the one place that says which version is active. This file
repeats no scope; each version folder holds its own scope file.

1. V1

## Scope and the spec

`docs/spec/` describes one ideal product. It holds no version and selects no flow. Flows in
the use cases carry the product-design statuses **Active** and **Closed**
(`docs/spec/03-use-cases/_CRITERIA.md`); which of the Active flows a version builds, holds or
has not considered is decided only in the scope file of that version.

- The scope file of a version (`v1/SCOPE.md`) is the record of what that version takes:
  its goal, its success criteria, its product choices and the flows it accepts.
- A flow is either accepted by a version, held for later, or not considered yet. Its
  behavior stays in the use case under `docs/spec/03-use-cases/` in every case.
- Changing what a version takes changes only its scope file. Changing a behavior changes
  the spec file, and the scope file keeps naming the flow.

## Rules

- Put a new implementation plan, task or handoff in the folder of its version.
- Do not copy a finished task into the next version. Name the new task for the work
  that the new version needs.
- `PROGRESS.md` belongs to its own version folder. Read the one in the active version.
- State the version of a file when a file outside `docs/versions/` points to it, for
  example `docs/versions/v1/PROGRESS.md`.
