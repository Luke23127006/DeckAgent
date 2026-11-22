---
name: test-estimation
description: Use when you estimate test effort or schedule for a test plan, a sprint or a release. Use also to explain or check an existing test estimate. Gives four estimation techniques - ratios, extrapolation, Wideband Delphi, three-point. Also gives how to break work into activities, state assumptions and uncertainty, and calibrate with actual effort.
---

# Test Estimation

An estimate is a prediction with uncertainty, not a promise. A useful estimate shows its technique, its assumptions and its range. Without them, nobody can check it or update it.

## Break the work into activities

Estimate each test activity separately. Use the activities that apply:

- Requirement analysis and review.
- Test planning.
- Test analysis and design: test conditions, models, test cases.
- Test implementation: scripts, test data, environment.
- Test execution: first runs, confirmation tests, regression runs.
- Defect reporting and analysis.
- Test completion: reports and handover.

Add separate lines for work that people often forget: environment setup, test data preparation, review of agent-written or generated tests, flaky test analysis, and meetings.

## Techniques

| Technique | How | Use when |
| --- | --- | --- |
| Ratios | Use a ratio from past projects, for example test effort to development effort | You have reliable data from similar projects in the same organization |
| Extrapolation | Measure the first part of the work, then extend the result to the rest | The work is repetitive, and you can measure an early sample |
| Wideband Delphi | Experts estimate alone, discuss the differences, and estimate again until the range is acceptable | No data exists. You need expert judgment with less bias. Planning Poker is a variant |
| Three-point | For each task: optimistic (a), most likely (m), pessimistic (b). E = (a + 4m + b) / 6. Standard deviation SD = (b − a) / 6 | The uncertainty is large, and you must show it |

Three-point example: a = 6 h, m = 9 h, b = 18 h. E = (6 + 36 + 18) / 6 = 10 h. SD = (18 − 6) / 6 = 2 h. Report "10 ± 2 hours".

## Steps

1. List the activities and the size of each, for example the number of test conditions, test cases or scripts. Size comes from the test approach.
2. Select a technique for each activity. You can use different techniques for different activities.
3. Write the assumptions: team skill, tool readiness, environment availability, the expected number of defects and retests, the stability of the test basis.
4. Calculate. Give a range or a standard deviation, not only one number.
5. Add a contingency for known risks. State the size of the contingency and the reason. Do not hide it inside the tasks.
6. Make the schedule: order by risk and by dependency. Show the critical path and the external dependencies (builds, environments, people).
7. After each cycle, compare actual effort with the estimate. Use the difference to calibrate the next estimate.

## Default output

| Activity | Size | Technique | a / m / b or value | Estimate | Assumptions |
| --- | --- | --- | --- | --- | --- |

Total, contingency with its reason, schedule, and the dependencies.

## Anti-patterns

- One number with no range and no assumptions.
- Fixed effort constants from the internet, used without calibration. Label any such value as an agent proposal.
- An estimate that leaves out retests and regression runs.
- The estimate is changed to fit a deadline without a change in scope or risk. Report the conflict instead.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §5.1.4 Estimation Techniques.
