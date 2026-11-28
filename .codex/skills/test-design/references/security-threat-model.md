# Security Testing: Threat Model and Security Checklist

Security tests must link to a threat to a real asset, or to an item of a security standard. A threat model finds the threats. A standard such as OWASP ASVS gives the checks that a mature product must pass. Use both: the threat model finds risks specific to this product, and the standard finds risks that the team did not think of.

ISTQB CTFL v4.0.1 does not define a model or coverage items for security testing. This skill uses common practice. A project can replace it.

## Build the threat model

1. **List the assets.** An asset is something that has value to protect: credentials, session tokens, personal data, money, API keys, the availability of a service.
2. **Draw the data flow.** Show the actors, the processes, the data stores, the data flows, and the trust boundaries. A trust boundary is where data passes between parts with different trust, for example browser to server, server to third-party API.
3. **Find threats with STRIDE.** For each element that crosses a trust boundary, ask:

   | Threat | Property it breaks | Example question |
   | --- | --- | --- |
   | Spoofing | Authentication | Can an attacker act as another user? |
   | Tampering | Integrity | Can an attacker change data in transit or at rest? |
   | Repudiation | Non-repudiation | Can a user deny an action because no log exists? |
   | Information disclosure | Confidentiality | Can an attacker read data that is not theirs? |
   | Denial of service | Availability | Can an attacker make the service unavailable? |
   | Elevation of privilege | Authorization | Can a user do an action that their role does not allow? |

4. **Write each threat** as: the asset, the attack path (entry point and steps), the impact, and the current control. A threat with no asset or no path is not specific enough to test.
5. **Rate each threat** with `references/risk-analysis.md`.

## Use a security standard as a checklist

- Select the standard, its version and its level from the test plan, for example OWASP ASVS 5.0 Level 1.
- Take the item IDs and their text from the original standard, not from a summary.
- Map each item to the requirement or the control that covers it. An item with no requirement is a gap. Report it to the requirement owner.
- Mark items that are out of scope, with the reason.

## Coverage items

- Each threat in the threat model.
- Each checklist item in scope.

Result: pass or fail for each item, with evidence, and the findings of any tools.

## Derive test cases

- For each threat, write a test that tries the attack path and checks that the control stops it. The expected result is the defined secure behavior, for example "returns 403 and writes an audit log entry".
- Test the negative cases: access to another user's resource by ID, an expired or changed token, a missing or wrong role, a replayed request.
- Use `references/equivalence-partitioning-bva.md` for limits such as rate limits, lockout counts and token lifetimes.
- Use tools (static analysis, dependency scan, dynamic scan) to add to the tests, not to replace them. Each tool finding needs analysis before you report it as a defect.
- Do not put real secrets or real personal data in tests or in evidence.

## Anti-patterns

- "Security tested" means only that a scanner ran.
- ASVS IDs or levels copied from a blog.
- Only the positive case is tested, for example "admin can delete" but not "user cannot delete".
- A threat model drawn once and never updated after a design change.

## Sources

- OWASP Application Security Verification Standard (ASVS), version selected by the project.
- Microsoft, The STRIDE Threat Model.
- OWASP Threat Modeling Cheat Sheet.
