---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Implementation plan — {scope}

<!-- Optional. Use it when several tasks or people build one slice and need a shared map of modules, steps and dependencies; an ordinary task needs no plan. Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, reference criteria and tests by id (don't restate them), keep under ~1 page.
     Developers decide internal modules. A row that changes a significant shared contract, a foundational technology or an important LLM boundary is a proposal for the PO (dev/mvp/WORKFLOW.md "Roles"); mark it. -->

## At a glance

- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **FRs in scope:** FR-NNN, FR-NNN
- **Decisions it relies on:** DEC-NNN
- **Open PO proposals:** none / the rows marked "proposal" below

## Module boundaries

<!-- One row per module this slice creates or changes (skill codebase-design). If it differs from docs/architecture/modules.md, say what changes. Mark "proposal" where a significant shared contract changes. -->

| Module | Path | Owns | Depends on (contract) |
|---|---|---|---|
| | | | |

## LLM boundary

<!-- One row per step of every value flow in scope. Default is "code": a step calls the model only to understand the request, interview the user, or write content.
     Prebuilt assets: themes, layouts, animations, format renderers. A change to an approved LLM boundary is a proposal for the PO. -->

| Step | Model or code | What the model receives | What the model decides | Prebuilt assets used |
|---|---|---|---|---|
| S1 | code | — | — | |
| S3 | model | | | |

## Steps

### Step 1 — name

- **What to build:** module, function, file path to create or change
- **Verified by:** the criteria or test cases it makes pass (link the design)
- **Depends on:** DEC-NNN; Step N, only when it must be merged first

### Step 2 — name

- **What to build:**
- **Verified by:**
- **Depends on:**

## Dependency diagram

```mermaid
graph LR
  S1[Step 1] --> S2[Step 2]
  S2 --> S3[Step 3]
```
