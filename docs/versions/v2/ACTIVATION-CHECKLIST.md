# V2 planning review and activation checklist

This file is a release-planning handoff, **not** permission to start implementation or change application code.

## Review before activation

- [ ] Product Owner accepts the exact **Accepted / Held / Not Considered flow table** in `SCOPE.md`. The earlier agreement covered the seven feature groups, not every individual flow ID.
- [ ] Product Owner confirms V2 does not take Deck Export (`UC-004`) or new UC-001 slide/outline behavior. Existing V1 vertical slice remains a mandatory regression.
- [ ] A/B/C agree on per-group shared contracts and module ownership. A proposed API name is not treated as an existing export.
- [ ] External research service is explicitly approved before any real outbound search. A configured provider adapter alone does not count as approval.
- [ ] Default models (`BR-005 V-5`) and attachment limits (`BR-001 V-2/V-3`) remain unapproved until evidence and owner approval; do not silently set values in code or the BRs.
- [ ] The existing V1 team knows the integration boundaries before another team edits shared Host, Client or Session files.

## When accepted

1. Store this folder at `docs/versions/v2/` on the selected implementation branch; confirm the branch contains the source version used for planning.
2. Record the approved flow selection and any modifications in `SCOPE.md` in plain language. If the scope changes, update the master and affected task group READMEs before coding.
3. Update `docs/versions/README.md` **only when the Product Owner declares V2 active**. Add V2 to the version list after V1, retaining V1 as a historical record. Do not delete/rename V1 planning docs.
4. Create the 21 issues from the task files and label each `TASK-XXX-A/B/C`. The group README defines their shared gate; do not duplicate the plan into Issues and then let the copies diverge.
5. Open TASK-001 with A/B/C in parallel; require contract fixtures first and block TASK-002 integration until G-001 PASS.
6. Update `PROGRESS.md` with real evidence only; **no gate is passed by writing its Markdown file**.

## Source and verification

- Repository: `Luke23127006/DeckAgent`.
- Planning branch: `docs/versions/v2`.
- Inspected planning commit: `a417141f92bee1a5801e63f2bcfc6948922399d0`.
- This document pack was generated from read-only repository inspection. It has not been committed or pushed by the author. Source paths must be rechecked after any changes since that commit.
