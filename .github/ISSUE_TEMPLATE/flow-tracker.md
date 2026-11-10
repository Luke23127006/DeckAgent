---
name: Flow tracker
about: Optional coordination issue for a build with several tasks in flight. It shows progress; it gates nothing.
title: "Flow tracker — "
labels: flow-tracker
---

## Scope

- **Milestone:** mvp
- **Build:** B-N, {name in words}
- **Use cases:** UC-XXX (steps and alternatives, or "all")
- **FRs and NFRs:** FR-NNN, NFR-NNN
- **Records:** dev/mvp/builds/UC-XXX-short-label/ (when the build keeps records)

## Tasks

<!-- One line per task in flight. Add a task when someone starts it; a task needs no issue to start. -->

- [ ] #N task title (owner)

## Blocked by

<!-- Only what must be merged before a task can proceed. Remove if none. -->

## Verification

- [ ] **CI green**
- [ ] **Eval run recorded** for each scored criterion
- [ ] **Manual checks done** (when a criterion is manual)
- [ ] **docs/architecture/ current** (when a boundary changed)
- [ ] **Build accepted** by the PO
