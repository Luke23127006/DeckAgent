---
name: test-technique-experience-based
description: Use when you select error guessing, checklist-based testing or exploratory testing. Use also when the test basis is weak, a standard checklist applies (OWASP ASVS, WCAG, heuristics), or you cannot model an area. Gives how to build a fault list with evidence and how to use a versioned checklist. Also gives how to write exploratory charters and how to run and debrief a time-boxed session.
---

# Experience-based Testing: Error Guessing, Checklists, Exploratory Testing

These techniques use the knowledge of the tester about the product, the domain and typical failures. They find defects that formal techniques miss. They are not a replacement for formal techniques when a model is possible. Their coverage is weaker and harder to measure.

## Error guessing

**Model:** a list of errors, defects and failures that can occur, with the basis for each item. Make the list before you test.

Sources for the list:

- Defects found before in this product or in similar products.
- Typical errors of developers in this type of code.
- Typical failures of this type of system.

Example categories to check:

| Category | Examples |
| --- | --- |
| Input | empty, null, whitespace only, very long, Unicode, special characters, wrong type, leading zeros |
| Numbers | zero, negative, maximum value, overflow, rounding, division by zero, different decimal separators |
| Time | time zone, daylight saving change, end of month, leap year, clock skew, expiry at the exact second |
| Concurrency | double submit, two tabs, race between update and read, retry after timeout |
| State | back button, refresh, session expiry during a flow, resume after a crash |
| Integration | timeout, slow response, error response, wrong format, partial data, rate limit |

**Coverage item:** each item in the list. ISTQB does not define a coverage criterion for error guessing.

**Rule:** each item has a basis. "It might break" is not a basis.

## Checklist-based testing

**Model:** a checklist with a version. Use a standard when one exists (OWASP ASVS, WCAG, a usability heuristic set), or a checklist that the team maintains.

- Take item IDs and levels from the original checklist, not from a summary.
- Each item must be possible to check directly and independently. Split an item that is too general.
- Move an item that a tool can check to automation, and record the tool.

**Coverage item:** each checklist item in scope. **Result:** pass or fail for each item, with evidence.

## Exploratory testing

Use exploratory testing when the test basis is missing or weak, when time is short, or to add to formal tests.

**Charter.** Write a charter for each session before you start:

```
Explore <target>
with <resources: data, tools, heuristics>
to discover <information: risks, defects, questions>
```

Link each charter to the test conditions or the risks that it covers. Give it a time box, usually 45 to 90 minutes, and a tester.

**Session.**

1. Set up the data and the environment. Record the test object version.
2. Explore within the charter. Use heuristics to vary your actions, for example the error-guessing categories above.
3. Write notes during the session: what you did, what you saw, defects, questions, ideas for new tests.
4. Stop at the end of the time box.

**Debrief.** After each session, record:

- The areas covered, partly covered and not covered.
- The defects found, each with a defect report.
- The questions for the test basis owner.
- The new test cases or charters that you propose.

A defect that you can reproduce becomes a scripted regression test, if the risk makes it worth the cost.

## Anti-patterns

- Exploratory testing with no charter and no notes. Nobody can tell what was covered.
- "Ad hoc" testing reported as exploratory testing.
- A checklist item copied from a summary with a wrong ID or level.
- An error-guessing list with no basis for its items.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §4.4 Experience-based Test Techniques (error guessing §4.4.1, exploratory testing §4.4.2, checklist-based testing §4.4.3).
