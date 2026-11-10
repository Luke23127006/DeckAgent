---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Flow tracker — {scope}

**Optional local mirror** of a build's **GitHub flow tracker issue**, kept only when the team wants it offline. It shows progress; it **gates nothing**.

<!-- Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block. Every #N must be a clickable link:
     [#N](https://github.com/{owner}/{repo}/issues/N) — see dev/mvp/WORKFLOW.md "Linking convention". -->

## At a glance

- **Milestone:** mvp
- **Build:** B-N, {name in words}
- **Use cases:** UC-XXX (steps and alternatives, or "all")
- **FRs and NFRs:** FR-NNN, NFR-NNN

## Tasks

- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) task title (owner)

## Blocked by

<!-- Only what must be merged before a task can proceed. Remove if none. -->

## Verification

- [ ] CI green
- [ ] Eval run recorded for each scored criterion: [eval-runs/](./testing/execution/eval-runs/)
- [ ] Manual checks done (when a criterion is manual)
- [ ] `docs/architecture/` current (when a boundary changed); [as-built.md](./implementation/as-built.md) for a value flow
- [ ] Build accepted by the PO
