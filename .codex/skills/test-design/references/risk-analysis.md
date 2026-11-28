# Risk Analysis for Testing

Risk-based testing uses risk to decide what to test, in which order, and how deeply. A risk is a possible event that has a negative effect. It has two attributes: likelihood (the probability that it occurs) and impact (the harm if it occurs). The risk level comes from both.

## Two kinds of risk

| Kind | What it threatens | Examples | Who acts |
| --- | --- | --- | --- |
| Product risk | The quality of the test object | Wrong calculation, data loss, slow response, security hole | Testing can reduce it |
| Project risk | The project and the test work | Late build, no test environment, key person absent, tool not ready | Project management acts. Testing reports it |

## Steps

1. **Identify risks.** Use many sources: requirements and their anomalies, the architecture, past defects, incidents, changed and complex code, integrations, regulations, and interviews with stakeholders. Use the quality characteristics of ISO/IEC 25010 as a checklist so that you do not miss non-functional risks.
2. **Write each risk as a statement:** "<what> may fail when <condition>, causing <impact>". Example: "Session renewal may fail when two tabs refresh at the same time, causing an unexpected sign out." A vague risk such as "login problems" cannot be tested.
3. **Assess likelihood.** Factors that increase it: new or changed code, complex logic, many integrations, and new technology. Also: defects found before in this area, low test coverage, and time pressure.
4. **Assess impact.** Factors: financial loss, security or data exposure, legal or regulatory effect, and the number of users affected. Also: damage to reputation, and whether a workaround is available.
5. **Calculate the risk level.** Use a scale that the team agrees on. A common scale is 1 to 5 for each attribute, and risk level = likelihood × impact (1 to 25). Bands, for example High / Medium / Low, are an agent proposal until the owner approves them. Record the scale with the register.
6. **Select a response for each risk.**
   - Mitigation by testing: give the test level, test type, technique and coverage depth.
   - Acceptance: the risk owner accepts it. Record the decision.
   - Transfer: another party takes it, for example a vendor.
   - Contingency plan: what to do if it occurs.
7. **Link risks to tests.** Each mitigated risk links to test conditions. Each high-risk test condition gets a stronger coverage criterion and an earlier place in the schedule.
8. **Monitor risks.** Assess the risks again when the test object changes, after a significant defect or incident, and at each milestone.

## Residual risk at test completion

A residual risk is the risk that remains after testing. Derive it from:

- Coverage gaps: risks with test conditions that were not tested, or were tested to a weaker criterion than planned.
- Unresolved defects: their effect on the related risk.

For each residual risk, give the evidence and a proposed treatment. The risk owner decides. Testing does not accept risks.

## Default output: risk register

| ID | Kind | Risk statement | Likelihood | Impact | Level | Response | Linked tests | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Anti-patterns

- Each risk is "High", so the ranking gives no information.
- A risk with a score but no response.
- A test type in the plan that no risk needs.
- The same words "probability" and "likelihood" with different meanings in one register. Use one term.
- The risk register is written once and not updated.

## Sources

- ISTQB CTFL Syllabus v4.0.1, §5.2 Risk Management (risk definition and attributes §5.2.1, project and product risks §5.2.2, product risk analysis §5.2.3, product risk control §5.2.4).
