---
name: test-design
description: Use when you design, review or report tests. Examples - select a test technique for a test condition, analyze risks, estimate test effort, or classify a defect. Gives one reference file for each technique and activity. Techniques - decision table, equivalence partitioning and BVA, state transition, scenario, security threat model, performance workload. Also fuzz and property-based, white-box coverage and experience-based. Activities - risk analysis, estimation and defect classification.
---

# Test Design

This skill gives one reference file for each test technique and each test activity. Read only the reference file that matches your task. Paths in this skill and in the reference files are relative to the folder of this skill.

## Select the reference

| Use when | Read |
| --- | --- |
| A result depends on a combination of conditions (business rules, permissions, pricing, eligibility). Not for comparing options in a design decision | `references/decision-table.md` |
| A field, parameter or rule accepts a range, a set or a format of values | `references/equivalence-partitioning-bva.md` |
| The behavior depends on the previous state or on the history of events (sessions, status, workflows, retries, locks) | `references/state-transition.md` |
| A business flow has many steps with alternative and exception paths | `references/scenario.md` |
| A test condition is about authentication, session, access control, input handling, data protection or another threat to an asset | `references/security-threat-model.md` |
| A test condition is about response time, throughput, concurrency or resource use (load, stress, soak, spike, capacity, benchmark) | `references/performance-workload.md` |
| A rule must hold for all inputs, the input space is too large for examples, or you must find crashes from malformed input | `references/fuzz-property-based.md` |
| You must measure, read or improve statement or branch coverage | `references/white-box.md` |
| The test basis is weak, a standard checklist applies (OWASP ASVS, WCAG, heuristics), or you cannot model the area (error guessing, checklists, exploratory testing) | `references/experience-based.md` |
| You identify, assess or control product risks and project risks, or set test priority and coverage depth by risk level | `references/risk-analysis.md` |
| You estimate test effort or schedule, or check an existing estimate | `references/estimation.md` |
| You write, classify or triage a defect report, set severity and priority, or analyze root cause | `references/defect-classification.md` |

When a task matches two rows, read both files. For example, a state transition test with guards on numeric limits uses `references/state-transition.md` and `references/equivalence-partitioning-bva.md`.
