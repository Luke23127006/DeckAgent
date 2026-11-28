# Defect Reports and Classification

A defect report tells the developers what happened, so that they can reproduce the failure. It also tells the people who manage the work how important the defect is. Good classification lets a test report count and compare defects.

## Anomaly or defect

An anomaly is a difference between the actual result and the expected result. It is not always a product defect. Before you report a product defect, analyze the cause:

| Cause | Action |
| --- | --- |
| Product defect | Write a defect report |
| Test defect (wrong script, wrong expected result) | Fix the testware. Record it in the test log |
| Test data or environment problem | Fix the data or the environment. Record it. Run the test again |
| Test basis defect (the requirement is wrong or unclear) | Report it to the requirement owner |
| Not reproducible | Record the evidence and the attempts. Keep the report open for a defined time, then close it with a reason |

## Contents of a defect report

- A unique ID.
- A title: where it fails, what fails, and when. Example: "Sign-in page – shows 500 error when the email has a trailing space".
- The date, the reporter, and the organization.
- The test object and its version, and the environment.
- The context: the test case or charter, the test activity, the test technique, the test data.
- The steps to reproduce: minimal, numbered, from a known state, with exact data.
- The expected result, with its source, and the actual result.
- The evidence: logs, screenshots, trace, correlation ID, time with time zone. Remove secrets and personal data.
- The scope: what is affected and what is not.
- The severity and the priority (see below).
- The status.
- References: the requirement, the risk, related defects.

One report contains one defect. Before you write a new report, look for a duplicate.

## Severity and priority

These are two different scales. Do not mix them.

- **Severity** is the impact of the defect on the test object. A tester can propose it from the evidence.
- **Priority** is the urgency to fix it. The product owner or the person who decides the work sets it. It depends on business needs, the schedule and the risk.

Default severity scale, if the project has none:

| Severity | Meaning |
| --- | --- |
| Critical | Data loss, security breach, wrong money result, or a main function is unavailable, with no workaround |
| Major | A main function gives a wrong result, or a workaround is difficult |
| Minor | A function is wrong but a simple workaround exists, or a secondary function is affected |
| Trivial | Cosmetic, with no effect on function |

Example of the difference: a typo in the company name on the home page has trivial severity but high priority. A crash in a function that one internal user uses once a year can have major severity but low priority.

## Lifecycle

A common lifecycle: New → Open (accepted) → In progress → Fixed → Confirmation test passed → Closed. Other outcomes: Rejected (not a defect), Duplicate, Deferred, Reopened (the confirmation test failed). Each status change has a date and a person. Close a defect only after a confirmation test on a build that contains the fix.

## Root cause categories

After the fix, record where the defect was introduced and why. Use these to find process improvements:

- Where it was introduced: requirements, design, code, configuration, data, third-party component, test basis.
- Type: for example missing logic, wrong logic, wrong data handling, interface mismatch, timing or concurrency, configuration.
- Where it was found, and where it could have been found earlier.

## Defect metrics for reports

- Count by severity and by status at a cut-off time.
- Reopened defects: a sign of fix quality.
- Defect detection percentage: defects found by testing ÷ (defects found by testing + defects found after release). Use it only when you have data from after release.
- Defects by component or by risk area: shows where risk is high.

## Anti-patterns

- Severity set to Critical to get a faster fix.
- "It does not work" as the actual result.
- Steps that start from a state that nobody can reproduce.
- A report that blames a person.
- A defect closed without a confirmation test.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §5.5 Defect Management.
- IEEE Std 1044-2009, IEEE Standard Classification for Software Anomalies.
