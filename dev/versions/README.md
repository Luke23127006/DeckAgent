# Versions

One folder per version. Rules: WORKFLOW.md "Spec layers" and "Phase 0".

## At a glance

- **Active version:** none yet. Phase 0 sets it.
- Each version folder holds a full version spec, a `CHANGES.md` and its builds.
- A closed version's folder is a frozen record. Its spec is never edited.

## Layout

```
dev/versions/
├── README.md                    this file: the active version
└── vN/
    ├── spec/                    full spec of version N (IDs match dev/spec/)
    ├── CHANGES.md               Added / Changed / Removed vs v(N-1), by ID
    └── builds/
        ├── _light/
        │   └── traceability-matrix.md   rows of light builds
        └── UC-XXX-label/        one folder per build, created at Phase 1
            ├── traceability-matrix.md   spine: FR/AC → tier → RQ/DEC → test → impl → verified
            ├── research-checklist.md
            ├── testing-plan.md
            ├── implementation-plan.md
            ├── as-built.md              prediction, actual flow, drift
            ├── flow-tracker.md          local mirror of the GitHub issue
            └── eval-runs/YYYY-MM-DD.md
```

Templates for every build file are in `dev/templates/`.

## Versions

| Version | Status | Milestone |
|---|---|---|
| v1, v2 | Legacy releases, no version spec in this format. Plans in `dev/legacy/versions/` | — |
| v3 | First workflow version. Not started | — |
