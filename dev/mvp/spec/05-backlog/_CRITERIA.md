# Gate: Backlog

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Kinds it holds: use cases
(`../02-use-cases/`), flows of a use case, FRs and NFRs (`../03-requirements/`) and
business rules (`../04-business-rules/`).

## 1. What a backlog item is, and is not

**A backlog item is a behavior of the spec that the PO left for later.** It is not in the
spec, and it is not dropped. It records what the behavior is, why it waits, and
what the last review found, so a later review does not start again.

| State | Where | Meaning |
|---|---|---|
| Spec | `../02-use-cases/`, `../03-requirements/`, `../04-business-rules/` | A behavior chosen for the MVP. A build takes its scope from here only |
| Backlog | this folder | A behavior left for later, with the reason. No build takes it |
| Removed | the "Removed ... IDs" list in the `_CRITERIA.md` of its kind | A behavior dropped or merged. Never reconsidered under its ID |

| If the content is... | Then it belongs |
|---|---|
| A behavior the PO wants in the MVP | The spec, not here |
| A behavior the PO does not want, with no reason to look again | The removed list of its kind |
| Repository work, such as tooling, refactoring or cleanup | Not in the spec. A GitHub Issue |
| An open question about a behavior of the spec | The `Open questions` or `Undecided` section of that file |

### Rules

- **No build takes a backlog item.** To build it, the PO promotes it to the spec first
  (dev/mvp/WORKFLOW.md "Spec rules", rule 3).
- **The spec never cites a backlog item.** A spec file names it only in a Note line,
  in words, with the ID last: "Going back to an earlier state is in the backlog (UC-008)."
- **A parked use case takes its own requirements with it.** An FR, NFR or BR that only
  this use case would cite is described inside the same item, not in a file of its own.
  A requirement that a spec block cites stays in the spec.
- **A parked flow belongs to one use case.** The use case keeps the flow ID free; its
  `Notes` names the parked flow.

### IDs and files

- An item keeps the spec ID of its kind: `UC-xxx`, `FR-xxx`, `NFR-xxx` or `BR-xxx`. A flow
  is `UC-xxx-Ay`. The file name is the ID: `UC-008.md`, `FR-062.md`, `UC-005-A18.md`.
- The frontmatter `id` equals the file name.
- A new item takes the next free number of its kind: after the highest ID in the folder of
  that kind, in this folder and in the removed list of that kind.
- **Promote:** move the item to the folder of its kind, rewrite it per that `_TEMPLATE.md`,
  keep the ID, and update the citing blocks in the same change. The backlog file is
  deleted. A flow returns to its use case under the same flow ID.
- **Drop:** record the ID in the removed list of its kind, "dropped from the backlog", with
  the date and the reason. The backlog file is deleted.

## 2. Criteria

| ID | Criterion | Prevents | Check |
|---|---|---|---|
| BLG-01 | The item is one behavior of one kind: a use case, a flow, an FR, an NFR or a BR | A bag of loose ideas under one ID | Review |
| BLG-02 | The file follows `_TEMPLATE.md`: frontmatter `id`, `kind`, `title`, `parked`; the sections in order | An item that cannot be compared or promoted | Lint (fields, order) |
| BLG-03 | `Why parked` and `Decided` name the PO ruling and its date. `Reconsider when` is a condition someone can observe, or "Not set by the PO" | A parked item nobody can bring back | Review |
| BLG-04 | No target file cites the item in a Steps table, an FR column, a `[BR-xxx]` or an `[NFR-xxx]`. Only a Note line names it | A target behavior that depends on something not chosen | CI (references) |
| BLG-05 | The ID is unique across this folder, the folder of its kind and the removed list of its kind | Two meanings for one ID | CI (unique) |
| BLG-06 | A claim about another product has a `dev/mvp/research/` link or an `[assumed]` tag | A guess read as a fact | Review |
