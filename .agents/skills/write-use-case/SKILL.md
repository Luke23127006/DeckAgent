---
name: write-use-case
description: Write or update a use case file in docs/UCs/ or the quality attribute scenarios in docs/UCs/quality-attributes.md. Gives the method. Find the actors and goals. Write the main flow as a black box. Find the exception flows step by step. Write each rule with a measure and a source. Keep the IDs. Compare with an independent baseline for the gap analysis. Use when a feature area starts development, when its behavior changes, or when the user asks to write, migrate or review a use case. The format of the file is in docs/conventions/use-cases.md, and this skill does not repeat it.
---

# Write a use case

This skill gives the method. The format of the output is in the convention files. Read them first and follow them:

- `docs/conventions/use-cases.md`: sections, rule table, flow table, gap analysis, quality attribute scenario.
- `docs/conventions/docs.md`: title and purpose line, citations, IDs, sources of values.
- `docs/conventions/mermaid.md`: diagrams.

Also read the lessons in `LESSONS.md` with the scope `Documentation`, `Testing` or `General`.

## Steps

Copy this checklist. Mark each step when you complete it.

```
- [ ] 1. Sources collected, with the version of each
- [ ] 2. Existing IDs found
- [ ] 3. Actors, goals and scope written
- [ ] 4. Main flow of each use case written as a black box
- [ ] 5. Exception flows found step by step
- [ ] 6. Rules written with measure, source and status
- [ ] 7. Each fact passed the boundary test
- [ ] 8. Gap analysis against an independent baseline
- [ ] 9. pnpm check:docs passes and review-change has no open finding
- [ ] 10. Agent-proposed values reported to the user one by one
```

### 1. Collect the sources

Read the sources of the feature area. The sources are the section of `docs/UCs/sources/project-brief.md`, the file for the area in `docs/design/prototype/docs/requirements/`, and the prototype screen. Also read the questions in `docs/open-questions.md` and the ADRs in `docs/architecture/30-decisions.md`. Record the commit of each source that you read.

The prototype shows the interface, not the product behavior. A behavior that only the prototype shows gets the status `Inferred`, not `Confirmed`.

### 2. Find the existing IDs

Search `docs/testing/test-scopes/` and `docs/open-questions.md` for IDs of this area. A test case or a defect that points to an ID must keep pointing to the same behavior. Keep each existing ID and its meaning. Give a new rule the next number in its group. When one old rule says two things, keep the old ID for the first and give the second a new ID.

### 3. Write the actors, the goals and the scope

- An actor is a person or a system outside Crypto Force that has a goal or that the user sees. Examples: the guest, the signed-in user, the operator, the mailbox, Google, Binance.
- Each use case is one goal that the actor can finish in one session, for example "Reset password". A step of a goal (for example "type the email") is not a use case.
- Write what is out of scope, so that the reader does not look for it.

### 4. Write the main flow as a black box

Write the steps that the actor sees, from the trigger to the goal. The system is one participant: Crypto Force. Do not write the internal parts (API, database, library, endpoint). They belong to `docs/architecture/`. Draw the main flow as a `sequenceDiagram`, with the labels that `docs/conventions/mermaid.md` gives.

### 5. Find the exception flows step by step

Go through each step of the main flow. For each step, ask how it can fail:

- The input is empty, has a wrong format, is too long, or is at a limit.
- The system or an external system (mailbox, Google, Binance) does not answer or gives an error.
- The actor sends the request again, too many times, or after the limit.
- Time passes: a link, a session or a lock expires during the flow.
- The action was already done: a link opened again, an email already registered, an account already verified.
- A second browser, a second tab, or a scanner opens the link. A different account has a session in the browser.
- The actor leaves the flow and comes back (reload, back, close the window).

Each answer that changes what the actor sees is a row of the flow table. When an object has a lifecycle (a link, a session, a job), draw a `stateDiagram-v2` and check that each transition has a rule.

### 6. Write the rules

- A rule tells one thing that a test can check. Split a rule that says two things.
- A rule with a quantity gets a number, a unit and the point of measure. Example: "3.600 giây, từ lúc gửi email tới lúc mở link". Replace each vague word with a measure.
- Each value has a source. Do not make up a value. Sometimes the sources do not give a value that the flow needs. Then propose a value and record it as `docs/conventions/docs.md` gives for an agent-proposed value.
- Give each rule the status that the product owner gave it. Do not raise a status because the rule looks obvious.

### 7. Do the boundary test for each fact

Ask: can the user or a tester see this fact from outside the system? If yes, it stays in the use case. If no (a library, a table, a configuration, a middleware), move it to the file in `docs/architecture/`. Write the ID that it answers in that file. A fact must not be in two files.

### 8. Compare with an independent baseline

The spec, the prototype, the code and the tests have one origin. A comparison between them finds only where they differ, not what all of them omit. Choose a baseline from outside that origin:

- A standard of the domain. Use OWASP ASVS for authentication, session and input. Use WCAG for accessibility. Use the SEI quality attribute scenario for quality requirements.
- A set of use cases that a person or a subagent writes without reading the spec. Give the subagent only the goal of the area and the actors.

Take the item IDs and levels from the original text of the standard, not from a summary. For each item in scope, record one result. The result is full, partial, missing, or not applicable. Each item without a full result becomes a row of the gap table. For each row, make a new rule, record an accepted risk with the reason, or add an open question.

### 9. Check the result

Run `pnpm check:docs`. Fix each problem as its message says. Then run the skill `review-change`. It finds what the check cannot find, for example a rule that says two things or a fact in the wrong folder.

### 10. Report

In the reply to the user, list separately each value that you proposed, with its reason and the change from the source. The user approves each value one by one. Also list each ID that you added or split.

## Quality attribute scenarios

For `docs/UCs/quality-attributes.md`, write one scenario for each concern of the architectural drivers in the project brief. A quality attribute name alone ("the system must be scalable") is not a scenario. Give a specific example with a measure. Cover the three types of scenario that `docs/conventions/use-cases.md` gives. For each driver, ask three questions: how do users use it, how will it change, and what stress can break it?

## Sources of this method

- M. Barbacci et al., *Quality Attribute Workshops (QAWs), Third Edition*, CMU/SEI-2003-TR-016, §3.5 and §3.8: the six parts of a scenario and the three types of scenarios.
- OWASP ASVS 5.0: an example of an independent baseline for authentication and session.
- `LESSONS.md` LL-003 and LL-004: the baseline rule and the rule for agent-proposed values.
