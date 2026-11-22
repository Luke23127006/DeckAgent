---
name: test-technique-scenario
description: Use when you select scenario or use case testing for a test condition. Use also when a business flow has many steps with alternative and exception paths (sign up, checkout, password reset). Gives the rules to build a flow model with main, alternative and exception flows, and the checks for the model. Also gives the coverage criterion (each flow) and how to derive test cases.
---

# Scenario and Use Case Testing

A scenario model shows a business flow as a sequence of steps between an actor and the test object. It finds defects in how the steps work together, which tests of single functions do not find.

ISTQB CTFL v4.0.1 does not include use case testing as a technique. The model and the coverage criterion below come from earlier ISTQB syllabi and common practice. Record this when a project needs a syllabus source.

## Build the model

1. **Name the actor and the goal.** For example, "A visitor creates an account".
2. **Write the preconditions and the postconditions.** A postcondition is a state that you can check after the flow: for the main flow and for each other flow.
3. **Write the main flow.** It is the most common path to the goal. Number each step. Each step is one action by the actor or one response by the test object.
4. **Write the alternative flows.** An alternative flow is a different path that still reaches the goal, for example "sign up with Google instead of email". Give the step where it starts and the step where it joins the main flow again.
5. **Write the exception flows.** An exception flow ends without the goal, for example "the email is already registered" or "the network fails at step 4". Give the step where it starts and the end state.
6. **Take each flow from the source.** Mark each step with its source.

## Check the model

- Each alternative and exception flow in the source is in the model.
- Each step that can fail has an exception flow, or the source says that it cannot fail. Ask about: invalid input, timeout, external service failure, concurrent change, the actor leaves and comes back, a repeated submit.
- Each flow has a postcondition that you can observe.
- The model and the source do not disagree. A flow in the model with no source is a test basis defect. Report it.

## Coverage criterion and coverage items

- Coverage item: each flow (main, each alternative, each exception).
- Coverage: flows exercised ÷ all flows.

For high risk, you can also cover each combination of alternative flows that can occur together. Record this as a stronger criterion in the test plan.

## Derive test cases

- One test case for each flow. The test case follows the steps of the flow from the precondition.
- Check the postcondition at the end, not only the last screen. For example, check that the account exists in a state that allows sign in.
- For exception flows, also check that the test object leaves no partial result: no half-created record, no charge, no sent email.
- Use concrete data in each step. Use `test-technique-equivalence-partitioning-bva` for the input values of a step.

## Anti-patterns

- Only the main flow ("happy path") is tested.
- An exception flow is tested, but the test does not check the state after the failure.
- Steps that are too large, for example "user completes checkout", so that nobody can see where the flow failed.

## Sources

- ISTQB CTFL Syllabus v3.1, §4.2.5 Use Case Testing (not in v4.0.1).
- ISTQB CTFL Syllabus v4.0.1, §4.5 Collaboration-based Test Approaches (acceptance criteria as test conditions).
