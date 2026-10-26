# Product spec migration — decisions record

Record of the product-spec sequence migration (`deckagent-product-spec-sequence-migration-plan.md`, 2026-10-25).
It holds the Active/Closed assignment rule that was applied and the known source conflicts that were
reviewed. It records no new product decision; only the owner can make one.

## Active/Closed assignment rule applied

- Every flow defined in the spec at the reference commit (`d8a6f2f`) is recorded as **Active**.
  Source reviewed: `docs/spec/03-use-cases/_CRITERIA.md` (pre-migration) said every step and
  alternative flow in the spec "describes the product as it should be", and each flow was kept
  deliberately, with evidence and recorded owner decisions in its Notes. That existing documented
  intent is the evidence for Active (plan: "explicit owner decisions and existing documented intent").
- No flow was set to **Closed**: no source records a flow that was considered and not selected for
  the ideal product. Flows that were considered and rejected were retired and removed from the
  behavioral model before the migration (for example UC-003 A1, A20, UC-001 A7, A21, UC-004 A4);
  their IDs stay retired and never reused. They are not Closed flows.
- No status was derived from V1 Accepted/Held/Not-considered. A held or not-considered V1 flow
  stays Active in the product, exactly as an accepted one. The owner's hypothetical remark that
  provider management might be Closed (UC-005) was not converted into a decision.
- Because every flow is Active, no use case carries a `## Closed flows` section, and no flow was
  left unlabeled in `## Decisions needed`. Pre-existing unresolved owner questions stay there,
  with their old question numbers, split into Settled and Unresolved.

## Reviewed source conflicts

| UC/flow | Question | Source reviewed | Outcome | Impact |
|---|---|---|---|---|
| UC-006 A1/A6 | Does the reopened-chat behavior contradict FR-048/FR-052 or the V1 chat choices? | `UC-006.md` (S1, A1, A6), `FR-048.md`, `FR-052.md`, `SCOPE.md` Chat/workspace section | Consistent: FR-048 covers the empty-list case (its AC-4/AC-5 equal A1), FR-052 covers the not-finished last request (its ACs equal A6), and "work running at close is not resumed" matches the V1 chat choices and owner decisions 2026-10-11/13 (UC-006 Notes 6 and 8) | None. No owner decision needed |
| UC-001 A14 | Does "type while the system works" conflict with UC-003 A14 or FR-014? | `UC-001.md` (A14), `UC-003.md` (A14), `FR-014.md` | Consistent since the owner decision of 2026-10-13 (UC-003 Note 35, FR-014 Notes): UC-001 A14 defers to UC-003 A14. The apparent conflict existed only while adding or removing unsent attachments was open | None. No owner decision needed |

Both conflicts were open questions in the pre-migration text that later owner decisions settled;
the migration preserved the settled state instead of reopening them.

## Owner decisions needed

None new from this migration. The unresolved questions that already existed stay visible as
`## Decisions needed` in their use cases (for example UC-001 questions 4 to 8 on A36 looks and
A37 presenter notes, UC-005 A6 key check, UC-007 basic-edit offers, UC-008 state keeping,
UC-009 question handling, UC-010 design-system sources, UC-011 variant placement, UC-006 question 2).
They are content questions, not Active/Closed status questions.
