# Code review criteria

These criteria define how every DeckAgent reviewer (human or coding agent) judges a
change. [Coding conventions](./coding-conventions.md) describe how code is written;
[repository structure](./repository-structure.md) describes where code lives. This
file is the canonical review standard — do not copy individual criteria into other
documents.

A criterion applies to the change under review, not retroactively to untouched legacy
code.

## Levels

| Level | Meaning | Review behavior |
| --- | --- | --- |
| **MUST** | Correctness, security, shared contracts, architectural invariants, or verification. | Blocking: fix before merge unless the criterion states an exception. |
| **SHOULD** | The default rule. | Review required; an exception is acceptable when the author explains the benefit and the trade-off. |
| **MAY** | A non-blocking recommendation. | The author decides, as long as `MUST` criteria still hold. |

A `SHOULD` deviation becomes blocking only when the reviewer names a concrete
correctness or maintainability impact that the accepted trade-off does not justify.

## Review comment severity

- **Blocker** — correctness/security issue or `MUST` violation; resolve before merge.
- **Major** — design or maintainability issue with clear impact; fix it or record why the trade-off is accepted.
- **Suggestion** — non-blocking improvement.
- **Nit** — small style detail.

A finding states: (1) file and location, (2) the `CQC` ID, (3) the specific behavior
or problem, (4) its impact, and (5) the recommended change. Avoid generic labels such
as "not SOLID" or "needs refactor".

## Criteria

### CQC-001 — Names express responsibility · SHOULD

A name states the thing's main purpose and distinguishes it from neighboring symbols.
When behavior changes, update names that no longer match. Flag a name that cannot be
understood without reading the body. Exception: a rename is out of scope and the
mismatch is recorded (for example the package/directory drift in
`repository-structure.md`).

### CQC-002 — A function has one clear purpose · SHOULD

A function does one thing, discoverable from its name. If a reader must describe it
as "it does A, and also B", split it or rename it. Decompose only when it makes the
flow clearer. Exception: a small orchestrator may coordinate several steps that share
one reason to change (see CQC-007).

### CQC-003 — Comments explain why and stay accurate · SHOULD

Comments explain *why* (invariants, ordering, concurrency, protocol constraints,
security, workarounds), not *what*. A comment that only restates the code is noise; a
comment whose claim no longer matches the behavior is a defect.

### CQC-004 — Complexity thresholds are review triggers, not limits · SHOULD

| Trigger | Value | Action |
| --- | --- | --- |
| Function length | > 50 logical lines | Review readability |
| Function length | > 80 logical lines | Explain why kept whole, or refactor |
| Cyclomatic complexity | > 15 | Review branch logic |
| Nesting depth | > 4 | Consider reducing nesting |
| Pull request authored code | > 400 lines | Consider splitting |

Generated or vendored code is out of scope. Do not configure these as blocking CI
rules before a lint baseline exists.

### CQC-005 — Non-obvious behavior is visible or documented · SHOULD

Behavior not clear from a name or signature — failure modes, ownership, ordering,
cancellation semantics, and observable side effects (mutation, I/O, network,
disposal) — is made visible at the call site (through the name, return type, or an
injected dependency) or documented where it is declared. A function that looks pure
but mutates shared state or performs I/O is flagged. The documentation requirement
applies only at public boundaries.

### CQC-006 — Dependency boundaries hold · MUST

No circular dependencies, no importing another package's private implementation, no
bypassing a public contract to reach internals. A change to a shared contract updates
its consumers and tests in the same change. Exception: none for DeckAgent-owned code;
vendored upstream source is not refactored to meet these rules, but its integration
must still satisfy the recorded security, dependency-compatibility, and license
requirements.

### CQC-007 — SOLID is verified with questions, not labels · SHOULD

Instead of asserting "this is SOLID", answer these questions against the change:

- **Single responsibility:** more than one *reason to change*? Technical steps serving
  one reason are not a violation.
- **Open/closed:** can a new variant be added without editing existing behavior?
- **Liskov substitution:** does the implementation honor the contract it implements?
- **Interface segregation:** does a consumer depend on methods it does not use?
- **Dependency inversion:** do high-level modules depend on abstractions rather than
  concrete providers or stores?

The finding must name a principle and the concrete behavior. Exception: do not force
classes, interfaces, factories, or inheritance to satisfy these principles — a plain
function with one responsibility that depends on an injected contract already
satisfies the relevant principle.

### CQC-008 — Error outcomes are distinguishable where behavior depends on it · SHOULD

When the difference changes behavior, distinguish expected failure, programmer error,
cancellation, and unexpected failure. Expected failures are encoded so callers can
react; programmer errors surface loudly; cancellation reports cancelled with an
unknown outcome where applicable; unexpected failures are wrapped at the trust
boundary. Exception: a domain need not adopt `RuntimeError`; it needs clear error
semantics at its own boundary.

### CQC-009 — No sensitive data in diagnostics or logs · MUST

Credentials and secrets never leak into error messages, logs, or other diagnostics.
Diagnostics carry only fixed, human-readable text or a safe code — never raw
exception bodies, request URLs, headers, or credentials; an exception `message` is
not assumed safe to publish. Normal tool output and intentionally persisted user
content follow their own contract and the same sensitive-data rules — they are not
limited to fixed text.

### CQC-010 — No swallowed rejections · MUST

Every async rejection is propagated, resolved to a handled error value, or
deliberately ignored with a stated reason and a known consequence. `void`-ing a
promise does not handle its rejection. Exception: teardown of a stream or body whose
cancel error cannot change the result, with the reason documented.

### CQC-011 — Cancellation reports the known outcome · MUST

Cancellation is a request, not a rollback. Distinguish the *request* to cancel, work
that *stopped* because of it, work that *completed* before cancellation was observed,
and work whose *outcome is unknown* because it was interrupted. Report the status
that matches the known outcome; a side effect may finish before cancellation is
handled.

### CQC-012 — Resource ownership and cleanup are correct · MUST

Each acquired resource has a clear owner and a cleanup path that runs safely on
success, failure, and cancellation. Repeated disposal is safe, cleanup order follows
resource dependencies, and a meaningful cleanup failure surfaces. `finally` is one
mechanism, not the only one.

### CQC-013 — State changes stay consistent · MUST

A multi-step state change is all-or-nothing where partial state would corrupt the
system, and required ordering is preserved. Interrupted turns record what is known
without fabricating a result.

### CQC-014 — The change is verified and compatibility impact is stated · MUST

Ship verification proportional to the risk and type of the change; where a path is
not covered by automated tests, state that limit. Prefer keeping contracts backward
compatible: when a change touches an API, schema, shared type, file format, or
configuration contract, state the compatibility impact and update the affected
producers, consumers, tests, and documentation together. A deliberate breaking change
needs an impact assessment, owner approval, and an update or migration path for every
consumer. Do not delete, disable, or weaken tests to make a change pass.

### CQC-015 — The pull request is a single concern · SHOULD

One pull request addresses one concern. Do not bundle unrelated features, refactors,
formatting, dependency upgrades, or shared-configuration changes; directly necessary
small changes are explained. Exception: a large mechanical change (a rename) may be
its own single concern despite touching many files.

### CQC-016 — No unnecessary abstractions · SHOULD

Do not introduce an interface, generic, factory, or layer that does not solve a
concrete, current problem. A new seam is justified by a real second implementation or
an agreed boundary, not by speculation. Exception: an owner-approved boundary may
justify an abstraction before the second consumer exists.

### CQC-017 — No harmful duplication · MAY

Extract only when two copies encode one rule that must change together; near-duplicate
code that will genuinely diverge stays separate. The target is divergence risk, not
zero duplication.

### CQC-018 — The change is testable · SHOULD

New behavior is reachable by a test without real credentials or cloud access where
feasible — dependencies are injectable so a test can substitute a double, a loopback
server, or a temporary store. Behavior that genuinely requires an external service
may be verified manually; state that limit. Exception: a thin process entry point may
be verified manually.
