# Skill router

Load the task and acceptance criteria, root `AGENTS.md`, closest contextual rules,
then affected code, tests, contracts and recorded decisions before this router.
Select one relevant skill for the current phase; read supporting references only
when needed. Change skills when the phase changes.

Task requirements and approved project decisions take precedence over root rules,
contextual rules, this router, skill instructions, and agent judgment, in that order.
Skills do not approve architecture choices or expand task authorization.

## Three context layers

- **Global rules:** root `AGENTS.md`, read for every task; mandatory scope,
  contract, architecture, verification and secret constraints.
- **Contextual rules:** the closest applicable nested `AGENTS.md`, read before
  editing that code area. These extend global rules. Add one only when the area
  has a stable responsibility and recurring local constraints; none exists yet.
- **Skills:** optional specialised workflows selected by the task below. Load
  the relevant `SKILL.md` body and only needed references, not the whole pack.
  Available skill names/descriptions alone do not mean their full bodies were loaded.

If instructions conflict with a recorded contract or decision, surface the
conflict before changing that contract. Missing architecture is not permission
to invent permanent boundaries.

| Task trigger | Required inputs | Skill | Expected outcome |
| --- | --- | --- | --- |
| Ambiguous product term or concept | Requirements, relevant terminology, recorded decisions | [domain-modeling](../../.agents/skills/domain-modeling/SKILL.md) | Shared terminology; important unresolved decisions explicitly proposed |
| Interface or design seam needs work | Affected code, tests, contracts, decisions | [codebase-design](../../.agents/skills/codebase-design/SKILL.md) | Small design proposal or implementation seam with assumptions stated |
| Building or changing testable behavior | Acceptance criteria, affected code, existing tests | [tdd](../../.agents/skills/tdd/SKILL.md) | Observable tests and the smallest change that satisfies them |
| Reproducible defect, regression, failed export or slow path | Reproduction steps, safe logs, test output or artifact | [diagnosing-bugs](../../.agents/skills/diagnosing-bugs/SKILL.md) | Evidence-based diagnosis and an authorized fix with regression coverage where feasible |
| Reviewing workspace changes, a commit, or a branch range | Requested review target, task context, relevant contracts and tests | [open-code-review-delegate](../../.agents/skills/open-code-review-delegate/SKILL.md) | Complete file accounting and severity-ranked findings with repository evidence |
| Mermaid embedded in repository Markdown | Target document, authoritative content, renderer constraints | [mermaid-markdown](../../.agents/skills/mermaid-markdown/SKILL.md) | Portable, semantically accurate Mermaid in the target Markdown file |
| Standalone Mermaid source or rendered artifact | Authoritative content, requested format and viewing context | [mermaid-diagram](../../.agents/skills/mermaid-diagram/SKILL.md) | Verified Mermaid source and requested rendered outputs |
| Targeted Project Hub comparison | Current validated snapshot, stable IDs, relevant GitHub artifact | [project-hub-review](../../.agents/skills/project-hub-review/SKILL.md) | Alignment findings with stable IDs and repository evidence |
| Broad Project Hub consistency audit | Current validated snapshot and audit scope | [project-hub-audit](../../.agents/skills/project-hub-audit/SKILL.md) | Read-only findings for contradictions, relation gaps, and missing evidence |

No specialised workflow is needed for routine edits. Do not load all skills by
default or invent product concepts, module rules, or architecture during setup.

## Inventory and maintenance

[Manifest](../../.agents/skill-manifest.json) records the source, license,
source commit, compatibility review and local adaptations. After a reviewed edit
to canonical skills, record the adaptation in the manifest and review the diff.
Upstream updates require a fresh source/license/dependency review before changing
the recorded commit.

Edit only `.agents/skills/`. Then run
`python .agents/scripts/sync_skill_mirrors.py` to regenerate the committed
`.claude/skills/` and `.codex/skills/` mirrors. Run the same command with
`--check` in validation or CI to detect drift. The synchronizer refuses to
remove a skill that exists only in a mirror; promote that skill into
`.agents/skills/` first, or use `--prune` after intentionally removing its
canonical copy. It also refuses to replace or prune a mirror with tracked,
untracked, or ignored local changes. Restore or promote those changes first;
use `--force` only to discard them explicitly.

Keep instructions, references, scripts, and assets used by only one skill inside
that skill's `.agents/skills/<name>/` directory. Put a procedure in
`docs/agents/workflows/` when it is repository-owned and shared by multiple skills,
agent adapters, or roles, or when it needs a stable repository-level link independent
of the generated skill mirrors. In that case, keep `SKILL.md` as the concise
entrypoint and link it to the shared procedure.

The four initial engineering skills come from `mattpocock/skills`. The four
repository-local Mermaid and Project Hub skills were promoted from the existing
Claude configuration into the canonical collection. The OpenCodeReview delegation
skill comes from `alibaba/open-code-review` and is adapted to the repository-local,
pinned npm tooling. The supplied `ComposioHQ/awesome-claude-skills` catalog was
consulted, but no skill from that catalog was adopted. The manifest records
reconsideration conditions for `pptx`, `research`, and `webapp-testing`. The optional
debugging shell template needs Bash (for example Git Bash or WSL); native commands
or a manual reproduction can be used when Bash is unavailable. OpenCodeReview is a
development dependency only; no DeckAgent product runtime dependency was added.

Before adopting another external skill, review its entrypoint, bundled resources,
scripts, dependencies and license against a concrete DeckAgent task and `AGENTS.md`.
Record a Keep / Adjust / Reject decision with reasons. Copy only approved skills,
record the source commit, retain the license, and add a router
entry only when its trigger and outcome are clear. Do not install entire packs.

For task acceptance checks, see [W-012–W-014 verification](verification.md).
