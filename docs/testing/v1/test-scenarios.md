# V1 Test Scenarios and Requirements Coverage

## Status and source baseline

- Parent task: **Test Planning**. The task owner will add the Jira link, create the PR and arrange review; no issue key is inferred here.
- Working branch: `docs/v1-test-planning`; intended base: `main`.
- Spec baseline: local `main` commit `796a039529392d0a83602423ef0df522b523c547`, inspected on 16-10-2026. Remote `main` was checked and matched this commit on 16-10-2026.
- Status: **v0.1 for review** — priority scenarios and AC coverage for QA-02 / QA-03.
- Planning update: 17-10-2026. The baseline remains the source revision recorded above.
- Source of expected behavior: [Product Spec](../../spec/). The spec was not changed.
- Scenarios are planned, not executed. No detailed test cases, implemented fixtures, automated tests or execution results are delivered. No application behavior has been verified.

This file delivers the scenario catalogue and coverage matrix together. The companion [Test Plan v0.1](test-plan.md) defines methods, conditions and evidence. An inventoried requirement is not automatically covered; a mapped scenario is not an executed test.

Navigation: [scope rules](#how-scope-and-status-were-derived), [gaps](#gap-and-dependency-register), [totals](#inventory-totals), [UC flows](#selected-uc-flows-and-requirement-origins), [AC matrix](#ac-coverage-matrix), [BR values](#business-rule-value-inventory), [NFR measurements](#nfr-scope-and-measurement-inventory), [future priorities](#future-test-case-prioritization-and-coverage-review), [scenarios](#priority-functional-scenarios).

## How scope and status were derived

1. Read the V1 decisions in [Versions](../../spec/00-current-scope/VERSIONS.md).
2. Select only the flows in each use case's `versions.V1.add`, following the [use case selection and traceability rules](../../spec/03-use-cases/_CRITERIA.md). `MF` selects every main-flow step; alternatives are selected individually.
3. Follow each selected block's `Reqs`. For `none`, follow the explicitly included use case's step. Keep `FR-?` as a gap; do not create a requirement for it.
4. Inventory every AC in each referenced FR, preserving its `Check` and approval status. An AC without an override inherits the FR status, following the [FR approval rules](../../spec/04-requirements/fr/_CRITERIA.md).
5. Record the BR and NFR dependencies of those blocks and FRs. Include NFR-005 and NFR-014 from V1's product-wide list. A reference from an unselected flow or the vision alone does not select an NFR; see the [NFR scope and target rules](../../spec/04-requirements/nfr/_CRITERIA.md).

The tables are a snapshot of this baseline, not a second authority for version scope. Recompute them when the source baseline changes. Numbers such as four slides or model labels P, M1 and D1 in AC examples are fixture descriptions, not new limits or approved provider/model IDs.

### Coverage states

| State | Meaning at scenario-planning level |
|---|---|
| Scenario defined | A scenario explicitly checks this AC. This does not mean executed or passed. |
| No scenario yet | No scenario has been written. The confirmed behavior can be planned; consult dependencies before choosing concrete data or claiming execution readiness. |
| Blocked | The AC's expected behavior is still proposed and cannot be made a mandatory acceptance check. The approval gap is named. |

Coverage and readiness are separate. A confirmed AC with a pending limit can still be described symbolically, using "the approved limit"; its boundary data and official execution remain blocked until that value is decided. Rows without a defined scenario remain `No scenario yet` and carry a gap reference. The matrix does not claim that they are ready to run. Proposed NFR statements or targets and pending targets cannot support official Pass/Fail conclusions.

FR source mappings below show which selected UC blocks cite an FR. They do **not** claim that every AC of that FR checks every listed block. Each scenario selects specific flows and ACs; future test cases must retain inherited Given/When/Then preconditions.

## Gap and dependency register

Gap IDs below belong to this planning document, not to Product Spec. "Owner" means the product owner must resolve or approve the source decision; implementation evidence alone does not approve it. These gaps do not prevent documenting the plan; affected execution or approval remains conditional.

| ID | Source and affected area | Missing information or issue | Planning treatment / resolution needed |
|---|---|---|---|
| GAP-01 | UC-006/A4, opening a chat with no slides; FR-051 | `Reqs` is `FR-051, FR-?`. The source does not identify the remaining FR. | Inventory the five existing FR-051 ACs, but do not mark the whole flow mapped. Spec owner to identify the missing response coverage and resolve the marker. Do not invent an AC. |
| GAP-02 | FR-006/AC-3, outline with points but no nonblank titles | `proposed default`: whether such an outline counts as empty. | Block this AC as mandatory acceptance behavior pending owner approval. Other empty-outline ACs remain available for planning. |
| GAP-03 | FR-032/AC-3, preserving subject, position and facts during a tone change | `proposed default`. Its rationale also says full deck regeneration is outside V1, while UC-002/A2 is selected and describes replacing all existing slides. | Block this AC pending owner approval. Ask the spec owner to reconcile the rationale; do not remove selected UC-002/A2 or treat the proposed rationale as a scope rule. |
| GAP-04 | BR-001/V-2 and V-3; FR-017/AC-1, AC-4 to AC-7; NFR-010 | Attachment count and per-file size values are pending; size unit is not set. AC-4 and AC-5 inherit the oversize case; AC-6 uses an oversized rejected file. | Keep limits symbolic. Exact boundary fixtures and complete checks of those conditions need approved values. Protected/damaged/unsupported-type behavior can be planned independently. Owner decision informed by technical evidence. |
| GAP-05 | BR-002/V-1; FR-015/AC-7 to AC-9 | Maximum request length, unit and boundary inclusion are not set. AC-9 nevertheless expects sending at exactly the maximum. | Do not choose a length or infer an approved boundary convention. Owner to reconcile the exact-boundary AC with BR-002. Other send/empty-request conditions remain available. |
| GAP-06 | BR-003/V-1; FR-022/AC-4; NFR-009/M-3 | Default design system, including its colors, fonts and rules, is not chosen. | Exact design-conformance checking awaits the approved system. Plan resource-display checks separately; do not impose a visual design. Owner decision required. |
| GAP-07 | BR-005/V-4; FR-039/AC-6; custom-API fixtures in FR-041, FR-042 and FR-061 | Supported custom API protocols are not named. | Plan behavior with symbolic protocol R; do not claim compatibility with any named protocol. Research and owner approval are needed for concrete integration fixtures. |
| GAP-08 | BR-005/V-5; FR-041/AC-6 and AC-7; FR-062/AC-1 to AC-5; FR-065/AC-4 | Which built-in providers have default models, and their release-specific model IDs, are pending. | Plan list-replacement, cancellation and selection behavior using the AC's symbolic lists. Concrete release/default-list checks need approved values. A provider catalogue is not the default list. |
| GAP-09 | BR-005/V-6 and BR-008/V-3; FR-061/AC-7 and AC-8 | Stable built-in provider IDs are not set, so the concrete reserved-ID set is unavailable. | Use symbolic IDQ only. Owner to approve IDs after implementation evidence. Do not derive IDs from display names. |
| GAP-10 | BR-006/V-1; FR-039/AC-3, FR-041/AC-1 and AC-2, FR-043, FR-045 | Provider-specific required settings and allowed changes, including built-in base URL changes, await checks. | Preserve conditions such as "P needs a key". Do not assume all providers allow a new base URL or that a key alone completes setup. Technical research followed by owner decision. |
| GAP-11 | BR-006, Not specified | How custom API authentication needs are known; whether a saved custom API's protocol can change. | No expected behavior for these open choices. Owner decision needed before adding scenarios for them. Existing confirmed custom-API behavior remains in scope. |
| GAP-12 | FR-041, Not specified; UC-005 open question on key validation | Whether saving checks the key with the provider. UC-005/A6 is not selected. | Do not add save-time key rejection as mandatory V1 coverage. Runtime access-refusal checks remain selected. Owner to resolve the setup question. |
| GAP-13 | FR-019, Not specified | Which failure causes prevent sending another request. | Keep AC-5's stated usage-limit scenario; do not generalize it to every failure or promise eventual success. Owner to resolve additional failure-dependent sending behavior. |
| GAP-14 | FR-010 and UC-001/A34; FR-024 and UC-001/S6, A42 | Unresolved BR markers for facts added without a source and disclosure of content not from the user's material. | Record the missing rule definitions, but retain the already confirmed placeholder and disclosure ACs. Do not invent extra rules or block those explicit outcomes. Spec owner to resolve the markers. |
| GAP-15 | FR-066; V1 Images | New-image technology and capability detection are undecided. | Keep confirmed success/failure outcomes in the inventory. Execution needs a valid image path and reproducible failure conditions. Do not choose another provider/service or confuse a missing implementation with missing expected behavior. Architecture research; owner approval for any additional service. |
| GAP-16 | NFR-001 and NFR-002 | Statements are proposed; M-1 targets are pending. | Neither is an approved timing gate. Owner approval and evidence are needed. FR checks for visible status and completed slides remain separate. |
| GAP-17 | NFR-009/M-1, M-2; NFR-010/M-2; NFR-011/M-1; NFR-012/M-1, M-2 | Quantitative targets and acceptance rules remain pending. | Future measurements may collect evidence under named conditions, but cannot declare compliance against an invented target. Owner decisions informed by prototype measurements. |
| GAP-18 | NFR-013/M-4 and Not specified | Accessibility standard, conformance level, screen readers and browsers are undecided. | Standard-conformance Pass/Fail is blocked. Keyboard and screen-reader behavior already has targets; environment selection is still needed. Owner decision required. |
| GAP-19 | NFR-014/M-2 and Not specified; NFR-001, NFR-002, NFR-011 and NFR-012, Not specified | Windows flow measurement M-2 is proposed; supported Windows/hardware/browser and relevant model/environment ranges are not specified. | Do not claim universal platform coverage or use proposed M-2 as a gate. Named test environments need agreement; existing FRs are not made optional by M-2's status. |
| GAP-20 | NFR-006, Not specified | Whether other programs of the same user can read a saved key. | Do not add an unapproved local-process protection claim. Existing key-context, destination and recording checks remain confirmed. Owner decision required. |
| GAP-21 | NFR-009, Not specified | Committed languages beyond Vietnamese and English as the first languages checked. | Plan the stated initial language checks. Do not infer a full supported-language list. Owner decision needed for wider commitments. |
| GAP-22 | NFR-008/M-1 and M-2 | Verification requires observing the last saved state; how it is exposed and when saving happens are architecture matters. | Execution dependency, not an approval gap in the preservation target. Engineering must provide evidence of the saved state; do not use the last displayed state as a substitute or invent a maximum acceptable loss. |
| GAP-23 | UC-001/A13 at S4; FR-068 | Reload while an outline awaits confirmation is selected, but FR-068's ACs cover building, a completed edit after closing the interface, and a request waiting for an answer. None explicitly exercises an idle, unconfirmed outline reload. | Candidate traceability gap for spec-owner review. FR-051/AC-1 covers reopening an earlier chat, which is not automatically the same event. Preserve the UC behavior without inventing an AC or declaring the full branch covered. |

### Resolution boundaries

- Pending test data and targets are dependencies for later concrete checks, not permission to replace source values. Dependencies can propagate through an AC's `Given: state after AC-n`.
- Existing source examples remain examples. Future controlled fixtures may use symbolic values, but cannot establish an official product limit, provider ID, protocol, design system or release default.
- `No scenario yet` rows without a listed gap are not certified executable: environment, observation points and data requirements will be assessed in QA-01/QA-02.
- The gap register records explicit missing information and the two identified consistency/traceability concerns. It is not a full semantic audit of every UC response against every AC.
- Per the task owner, Jira linking, PR creation and review submission are handled by the owner after this documentation handoff.

## Future test case prioritization and coverage review

1. Convert P0 scenarios into executable cases and data first. Establish state snapshots, a controllable provider and safe observation of outgoing calls before relying on failure-path results.
2. Expand the remaining confirmed ACs for outline options, clarification choices, refinement closing messages, provider/model catalogue operations, deletion/default restoration, and new-chat model-selection history. They remain `No scenario yet`, not implicitly covered by a nearby scenario.
3. Resolve GAP-04 to GAP-10 before concrete boundary/default/protocol fixtures. Resolve GAP-02 and GAP-03 before treating the proposed ACs as mandatory. Review GAP-01 and GAP-23 with the spec owner; existing AC coverage cannot close those UC traceability holes.
4. Add detailed NFR campaigns from the Test Plan, preserving every source measurement condition. Pending targets stay evidence-only. A confirmed target still needs a runnable environment and observation method.
5. At each spec change, compare selected flows, ACs, approval status and dependencies with this baseline. Update scenarios and matrix together. Review uncovered rows by risk before increasing coverage counts.

Completion of this planning iteration means reviewable scope, scenarios, traceability and explicit gaps. It does not require 100% scenario coverage or any executed test. P0/P1 sequencing and the operational conditions are planning proposals for team review.

## Inventory totals

| Item | Count |
|---|---:|
| Selected use cases / main flows | 6 |
| Selected main-flow steps | 26 |
| Selected alternative flows | 56 |
| Distinct FRs | 66 |
| ACs: deterministic | 239 |
| ACs: judged | 125 |
| ACs: confirmed | 362 |
| ACs: proposed default | 2 |
| Scenario defined | 147 |
| No scenario yet (dependencies still apply) | 215 |
| Blocked (unapproved AC behavior) | 2 |
| Referenced BRs | 7 |
| In-scope NFRs | 14 |

Counts are distinct FRs/ACs, not the sum of repeated UC references. The unresolved `FR-?` is a separate gap and is not an invented 365th AC. No execution or pass rate is reported.

## Selected UC flows and requirement origins

Each row names a selected step or alternative. `MF` covers all listed S steps. Shared UC-003 behavior is inventoried once; inclusion does not select its unselected alternatives. Real FR links lead to the authoritative requirements.

### UC-001 - Generate initial draft deck

Source: [UC-001](../../spec/03-use-cases/UC-001.md). V1 selection: `MF, A9, A10, A11, A13, A14, A18, A19, A22, A23, A24, A32, A33, A34, A39, A42`.

| Flow/step | Behavior | Direct Reqs / included trace |
|---|---|---|
| S1 | Provide the material | `none` - included UC-003/S1: FR-015 |
| S2 | Send the request | `none` - included UC-003/S2: FR-012, FR-013, FR-018 |
| S3 | Wait for the outline | [FR-001](../../spec/04-requirements/fr/FR-001.md), [FR-003](../../spec/04-requirements/fr/FR-003.md), [FR-004](../../spec/04-requirements/fr/FR-004.md), [FR-005](../../spec/04-requirements/fr/FR-005.md), [FR-008](../../spec/04-requirements/fr/FR-008.md) |
| S4 | Confirm the outline | [FR-003](../../spec/04-requirements/fr/FR-003.md) |
| S5 | Watch the deck build | [FR-022](../../spec/04-requirements/fr/FR-022.md), [FR-023](../../spec/04-requirements/fr/FR-023.md) |
| S6 | Review the draft | [FR-023](../../spec/04-requirements/fr/FR-023.md), [FR-024](../../spec/04-requirements/fr/FR-024.md) |
| A9 | File with nothing usable | [FR-008](../../spec/04-requirements/fr/FR-008.md), [FR-009](../../spec/04-requirements/fr/FR-009.md), [FR-021](../../spec/04-requirements/fr/FR-021.md) |
| A32 | Ask before drafting the outline | [FR-008](../../spec/04-requirements/fr/FR-008.md), [FR-020](../../spec/04-requirements/fr/FR-020.md), [FR-021](../../spec/04-requirements/fr/FR-021.md) |
| A33 | Material does not agree with itself | [FR-011](../../spec/04-requirements/fr/FR-011.md), [FR-037](../../spec/04-requirements/fr/FR-037.md) |
| A34 | Material lacks a needed fact | [FR-010](../../spec/04-requirements/fr/FR-010.md) |
| A13 | Reload or come back | [FR-068](../../spec/04-requirements/fr/FR-068.md) |
| A22 | Cancel the outline | [FR-004](../../spec/04-requirements/fr/FR-004.md), [FR-012](../../spec/04-requirements/fr/FR-012.md) |
| A23 | Send a new instruction for the outline | [FR-001](../../spec/04-requirements/fr/FR-001.md), [FR-005](../../spec/04-requirements/fr/FR-005.md), [FR-012](../../spec/04-requirements/fr/FR-012.md) |
| A24 | Empty outline | [FR-005](../../spec/04-requirements/fr/FR-005.md), [FR-006](../../spec/04-requirements/fr/FR-006.md) |
| A39 | Ask what the user means for the outline | [FR-007](../../spec/04-requirements/fr/FR-007.md), [FR-012](../../spec/04-requirements/fr/FR-012.md), [FR-020](../../spec/04-requirements/fr/FR-020.md) |
| A10 | Stop while building slides | [FR-018](../../spec/04-requirements/fr/FR-018.md), [FR-025](../../spec/04-requirements/fr/FR-025.md), [FR-026](../../spec/04-requirements/fr/FR-026.md), [FR-028](../../spec/04-requirements/fr/FR-028.md) |
| A11 | Model call fails | [FR-019](../../spec/04-requirements/fr/FR-019.md), [FR-025](../../spec/04-requirements/fr/FR-025.md), [FR-026](../../spec/04-requirements/fr/FR-026.md), [FR-028](../../spec/04-requirements/fr/FR-028.md) |
| A14 | Type while the system works | [FR-014](../../spec/04-requirements/fr/FR-014.md) |
| A18 | Model access refused | [FR-019](../../spec/04-requirements/fr/FR-019.md), [FR-025](../../spec/04-requirements/fr/FR-025.md), [FR-028](../../spec/04-requirements/fr/FR-028.md), [FR-043](../../spec/04-requirements/fr/FR-043.md) |
| A19 | Usage limit reached | [FR-019](../../spec/04-requirements/fr/FR-019.md), [FR-025](../../spec/04-requirements/fr/FR-025.md), [FR-026](../../spec/04-requirements/fr/FR-026.md), [FR-028](../../spec/04-requirements/fr/FR-028.md) |
| A42 | Use images on the slides | [FR-066](../../spec/04-requirements/fr/FR-066.md), [FR-024](../../spec/04-requirements/fr/FR-024.md) |

Not selected for V1 in this UC: A5 (Choose a custom design system); A29 (Give an earlier deck as the pattern); A35 (Set up a new design system); A30 (Draft the outline from a pattern); A12 (Connection lost); A36 (Choose a look before the slides are built); A37 (Ask for presenter notes).

### UC-002 - Change my draft deck with a follow-up request

Source: [UC-002](../../spec/03-use-cases/UC-002.md). V1 selection: `MF, A1, A2, A3, A4, A5, A6, A7, A10, A11, A12`.

| Flow/step | Behavior | Direct Reqs / included trace |
|---|---|---|
| S1 | Describe the change | `none` - included UC-003/S1: FR-015 |
| S2 | Send the request | `none` - included UC-003/S2: FR-012, FR-013, FR-018 |
| S3 | Watch the change apply | [FR-027](../../spec/04-requirements/fr/FR-027.md), [FR-028](../../spec/04-requirements/fr/FR-028.md), [FR-029](../../spec/04-requirements/fr/FR-029.md) |
| S4 | Review the result | [FR-029](../../spec/04-requirements/fr/FR-029.md) |
| A1 | Scope of the change is unclear | [FR-020](../../spec/04-requirements/fr/FR-020.md), [FR-030](../../spec/04-requirements/fr/FR-030.md), [FR-031](../../spec/04-requirements/fr/FR-031.md) |
| A2 | Apply the change to every slide | [FR-032](../../spec/04-requirements/fr/FR-032.md) |
| A3 | Apply the change to new slides only | [FR-033](../../spec/04-requirements/fr/FR-033.md) |
| A4 | Keep the instruction for later | [FR-034](../../spec/04-requirements/fr/FR-034.md) |
| A6 | Ask what to change | [FR-020](../../spec/04-requirements/fr/FR-020.md), [FR-030](../../spec/04-requirements/fr/FR-030.md), [FR-035](../../spec/04-requirements/fr/FR-035.md) |
| A10 | Offer directions for unclear feedback | [FR-020](../../spec/04-requirements/fr/FR-020.md), [FR-030](../../spec/04-requirements/fr/FR-030.md), [FR-035](../../spec/04-requirements/fr/FR-035.md) |
| A5 | Request names a slide the system cannot match | [FR-036](../../spec/04-requirements/fr/FR-036.md) |
| A7 | Stop while changing slides | [FR-018](../../spec/04-requirements/fr/FR-018.md), [FR-025](../../spec/04-requirements/fr/FR-025.md), [FR-026](../../spec/04-requirements/fr/FR-026.md) |
| A11 | Work fails while changing slides | [FR-019](../../spec/04-requirements/fr/FR-019.md), [FR-025](../../spec/04-requirements/fr/FR-025.md), [FR-026](../../spec/04-requirements/fr/FR-026.md) |
| A12 | Use images on the changed slides | [FR-066](../../spec/04-requirements/fr/FR-066.md) |

Not selected for V1 in this UC: A8 (Change the look of the deck); A9 (Change presenter notes).

### UC-003 - Send a request to the system and wait for its work

Source: [UC-003](../../spec/03-use-cases/UC-003.md). V1 selection: `MF, A3, A6, A8, A11, A13, A14, A17, A18, A19, A27, A28, A31, A38, A40, A41, A43`.

| Flow/step | Behavior | Direct Reqs / included trace |
|---|---|---|
| S1 | Prepare the request | [FR-015](../../spec/04-requirements/fr/FR-015.md) |
| S2 | Send the request | [FR-012](../../spec/04-requirements/fr/FR-012.md), [FR-013](../../spec/04-requirements/fr/FR-013.md), [FR-018](../../spec/04-requirements/fr/FR-018.md) |
| S3 | Wait while the system works | [FR-012](../../spec/04-requirements/fr/FR-012.md), [FR-042](../../spec/04-requirements/fr/FR-042.md) |
| S4 | See that the work is done | [FR-012](../../spec/04-requirements/fr/FR-012.md) |
| A3 | Attach files or photos | [FR-015](../../spec/04-requirements/fr/FR-015.md), [FR-016](../../spec/04-requirements/fr/FR-016.md) |
| A6 | Send an empty request | [FR-015](../../spec/04-requirements/fr/FR-015.md) |
| A8 | Reject an attached file | [FR-015](../../spec/04-requirements/fr/FR-015.md), [FR-017](../../spec/04-requirements/fr/FR-017.md) |
| A27 | Choose a different model | [FR-017](../../spec/04-requirements/fr/FR-017.md), [FR-042](../../spec/04-requirements/fr/FR-042.md), [FR-055](../../spec/04-requirements/fr/FR-055.md) |
| A28 | Open the model setup dashboard | [FR-038](../../spec/04-requirements/fr/FR-038.md) |
| A41 | Selected model removed | [FR-065](../../spec/04-requirements/fr/FR-065.md) |
| A17 | No selectable model | [FR-046](../../spec/04-requirements/fr/FR-046.md) |
| A40 | Selected model not selectable | [FR-056](../../spec/04-requirements/fr/FR-056.md) |
| A11 | Work cannot finish | [FR-019](../../spec/04-requirements/fr/FR-019.md), [FR-025](../../spec/04-requirements/fr/FR-025.md), [FR-026](../../spec/04-requirements/fr/FR-026.md), [FR-047](../../spec/04-requirements/fr/FR-047.md) |
| A13 | Reload or come back | [FR-068](../../spec/04-requirements/fr/FR-068.md) |
| A14 | Type while the system works | [FR-014](../../spec/04-requirements/fr/FR-014.md), [FR-016](../../spec/04-requirements/fr/FR-016.md), [FR-017](../../spec/04-requirements/fr/FR-017.md), [FR-020](../../spec/04-requirements/fr/FR-020.md) |
| A18 | Model access refused | [FR-019](../../spec/04-requirements/fr/FR-019.md), [FR-043](../../spec/04-requirements/fr/FR-043.md) |
| A19 | Usage limit reached | [FR-019](../../spec/04-requirements/fr/FR-019.md) |
| A31 | Stop the work | [FR-018](../../spec/04-requirements/fr/FR-018.md) |
| A38 | Wait for the user's answer | [FR-020](../../spec/04-requirements/fr/FR-020.md) |
| A43 | Use the material only in part | [FR-067](../../spec/04-requirements/fr/FR-067.md), [FR-020](../../spec/04-requirements/fr/FR-020.md) |

Not selected for V1 in this UC: A2 (Speak the request); A4 (Pick material from a connector); A15 (Voice input cannot start); A16 (Voice input ends early); A25 (Choose a skill); A26 (Open the skills dashboard); A12 (Connection lost).

### UC-005 - Set up my providers and models with my own keys

Source: [UC-005](../../spec/03-use-cases/UC-005.md). V1 selection: `MF, A1, A2, A4, A5, A7, A8, A9, A10, A11, A12, A13`.

| Flow/step | Behavior | Direct Reqs / included trace |
|---|---|---|
| S1 | Open the model setup | [FR-038](../../spec/04-requirements/fr/FR-038.md), [FR-039](../../spec/04-requirements/fr/FR-039.md), [FR-040](../../spec/04-requirements/fr/FR-040.md), [FR-041](../../spec/04-requirements/fr/FR-041.md) |
| S2 | Choose a provider | [FR-039](../../spec/04-requirements/fr/FR-039.md), [FR-061](../../spec/04-requirements/fr/FR-061.md) |
| S3 | Give the connection details and a name | [FR-040](../../spec/04-requirements/fr/FR-040.md), [FR-041](../../spec/04-requirements/fr/FR-041.md), [FR-057](../../spec/04-requirements/fr/FR-057.md), [FR-061](../../spec/04-requirements/fr/FR-061.md) |
| S4 | Save the setup | [FR-041](../../spec/04-requirements/fr/FR-041.md), [FR-061](../../spec/04-requirements/fr/FR-061.md) |
| S6 | Add models | [FR-058](../../spec/04-requirements/fr/FR-058.md) |
| S5 | Go back to the chat | [FR-038](../../spec/04-requirements/fr/FR-038.md), [FR-055](../../spec/04-requirements/fr/FR-055.md), [FR-065](../../spec/04-requirements/fr/FR-065.md) |
| A1 | Change a provider configuration | [FR-040](../../spec/04-requirements/fr/FR-040.md), [FR-042](../../spec/04-requirements/fr/FR-042.md), [FR-043](../../spec/04-requirements/fr/FR-043.md), [FR-057](../../spec/04-requirements/fr/FR-057.md), [FR-061](../../spec/04-requirements/fr/FR-061.md) |
| A2 | Remove an added model | [FR-059](../../spec/04-requirements/fr/FR-059.md) |
| A4 | Leave the model setup | [FR-038](../../spec/04-requirements/fr/FR-038.md), [FR-044](../../spec/04-requirements/fr/FR-044.md), [FR-065](../../spec/04-requirements/fr/FR-065.md) |
| A8 | Add models to a saved provider configuration | [FR-058](../../spec/04-requirements/fr/FR-058.md) |
| A10 | Display name not valid | [FR-057](../../spec/04-requirements/fr/FR-057.md) |
| A11 | Delete a provider configuration | [FR-063](../../spec/04-requirements/fr/FR-063.md) |
| A12 | Provider configuration in use | [FR-064](../../spec/04-requirements/fr/FR-064.md) |
| A13 | Restore the default models | [FR-062](../../spec/04-requirements/fr/FR-062.md) |
| A5 | Required setup missing | [FR-045](../../spec/04-requirements/fr/FR-045.md) |
| A9 | Provider ID already saved | [FR-061](../../spec/04-requirements/fr/FR-061.md) |
| A7 | Model catalog not available | [FR-058](../../spec/04-requirements/fr/FR-058.md) |

Not selected for V1 in this UC: A3 (Provider not offered); A6 (Key refused at setup).

### UC-006 - Reopen an earlier chat to carry on with its deck

Source: [UC-006](../../spec/03-use-cases/UC-006.md). V1 selection: `MF, A1, A3, A4, A6`.

| Flow/step | Behavior | Direct Reqs / included trace |
|---|---|---|
| S1 | Ask for earlier work | [FR-048](../../spec/04-requirements/fr/FR-048.md), [FR-054](../../spec/04-requirements/fr/FR-054.md) |
| S2 | Choose a chat | [FR-049](../../spec/04-requirements/fr/FR-049.md) |
| S3 | See the work again | [FR-042](../../spec/04-requirements/fr/FR-042.md), [FR-046](../../spec/04-requirements/fr/FR-046.md), [FR-049](../../spec/04-requirements/fr/FR-049.md), [FR-056](../../spec/04-requirements/fr/FR-056.md), [FR-065](../../spec/04-requirements/fr/FR-065.md) |
| A1 | No earlier work | [FR-048](../../spec/04-requirements/fr/FR-048.md) |
| A3 | Chat cannot be opened | [FR-050](../../spec/04-requirements/fr/FR-050.md) |
| A4 | Chat has no slides yet | [FR-051](../../spec/04-requirements/fr/FR-051.md); `FR-?` - GAP-01 |
| A6 | Work ended before it finished | [FR-052](../../spec/04-requirements/fr/FR-052.md) |

Not selected for V1 in this UC: A2 (Look for a chat by its words); A5 (Work still running in the chat).

### UC-012 - Start a new chat for another deck

Source: [UC-012](../../spec/03-use-cases/UC-012.md). V1 selection: `MF`.

| Flow/step | Behavior | Direct Reqs / included trace |
|---|---|---|
| S1 | Ask for a new chat | [FR-053](../../spec/04-requirements/fr/FR-053.md), [FR-054](../../spec/04-requirements/fr/FR-054.md) |
| S2 | Get the new chat | [FR-053](../../spec/04-requirements/fr/FR-053.md) |
| S3 | Start the new work | [FR-046](../../spec/04-requirements/fr/FR-046.md), [FR-053](../../spec/04-requirements/fr/FR-053.md), [FR-056](../../spec/04-requirements/fr/FR-056.md) |

### Entire use cases outside V1

These files have no selected V1 flow. Their existence, `next` links and research evidence do not make them required V1 tests.

- [UC-004](../../spec/03-use-cases/UC-004.md) - Export the deck to a file.
- [UC-007](../../spec/03-use-cases/UC-007.md) - Fix my deck by hand without asking the model.
- [UC-008](../../spec/03-use-cases/UC-008.md) - Go back to an earlier state of my deck.
- [UC-009](../../spec/03-use-cases/UC-009.md) - Ask about my deck without changing it.
- [UC-010](../../spec/03-use-cases/UC-010.md) - Set up a design system for my decks.
- [UC-011](../../spec/03-use-cases/UC-011.md) - Make another deck from my deck for a different use.

## Priority functional scenarios

These are scenario-level checks, not detailed test cases or execution results. P0 targets loss of work, incorrect scope, request lifecycle, privacy and the core user journey; P1 extends those journeys. Priority is a QA proposal for sequencing, not a new product requirement.

Each independent variant starts from its stated input state. Referenced source ACs supply the precise fixture details, inherited preconditions and assertions; the summaries below preserve their intent. The matrix retains the source check classification even where an AC mixes visible state and semantic meaning. Record deterministic and judged observations separately according to the [Test Plan](test-plan.md).

### TS-001 - Propose an outline before building

- **Priority:** P0.
- **Input / preconditions:** A chat has no deck and enough material to propose an outline. Preserve the initial proposal for comparison.
- **Action / variants:** Send the initial request; read the response. In separate continuations, leave the outline unconfirmed and ask for a revised outline without confirming it.
- **Expected outcome:** An outline proposal appears, as the latest unconfirmed outline response, with no slide and no deck canvas. The response says slides wait for confirmation. Neither waiting nor requesting a revision starts slide building.
- **UC / flow:** UC-001/S3.
- **FR / AC:** FR-001/AC-1; FR-001/AC-2; FR-001/AC-3.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-002 - Revise and confirm the current outline

- **Priority:** P0.
- **Input / preconditions:** Proposal A has four slides about a hospital pilot, including slide 2 on the pilot. No outline is confirmed and no slide exists.
- **Action / variants:** Send "add a slide on costs"; separately reset and send "Looks good, but add costs". Inspect revised proposal B before any slide is built. Confirm B in separate runs by typed confirmation and by its suggested confirmation option.
- **Expected outcome:** The edit-containing reply is not confirmation. A remains in the conversation and B includes costs while preserving the meaning of every unaffected planned slide, including slide 2 on pilot results. Each confirmation starts a new request and builds the planned slides of B, not A.
- **UC / flow:** UC-001/S3; UC-001/S4; UC-001/A23.
- **FR / AC:** FR-005/AC-1; FR-005/AC-2; FR-005/AC-3; FR-003/AC-2; FR-003/AC-3; FR-003/AC-4.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-003 - Cancel an outline and start a different topic

- **Priority:** P1.
- **Input / preconditions:** A and revised B are unconfirmed outline proposals for a hospital pilot; no slides exist.
- **Action / variants:** Cancel the outline, read the response, then send a new request for a staff-survey talk.
- **Expected outcome:** A and B remain in the conversation, unconfirmed. Cancellation is recorded as a user message, shows no deck canvas, builds no slides and creates no replacement outline; its response says it was cancelled. The later request produces a new staff-survey outline without reviving the pilot proposal.
- **UC / flow:** UC-001/A22.
- **FR / AC:** FR-004/AC-2; FR-004/AC-4; FR-004/AC-6; FR-004/AC-7.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-004 - Reject confirmation of an empty outline

- **Priority:** P1.
- **Input / preconditions:** An unconfirmed outline has planned slides.
- **Action / variants:** Ask to remove every planned slide, then type a confirmation of the empty outline.
- **Expected outcome:** The empty outline is not offered for confirmation and removing all slides is not treated as an error. Typed confirmation builds no slides, changes no deck and creates no replacement outline. The response explains that the outline needs revision.
- **UC / flow:** UC-001/A24.
- **FR / AC:** FR-006/AC-1; FR-006/AC-2; FR-006/AC-4.
- **Dependencies:** GAP-02: a points-only outline with blank titles is excluded from this scenario; its proposed definition is not approved.

### TS-005 - Ask for the missing topic and handle a skipped answer

- **Priority:** P0.
- **Input / preconditions:** A chat has no deck. The request supplies neither a topic nor material from which a topic can be established.
- **Action / variants:** Send the request, read the topic question, then skip that question.
- **Expected outcome:** No outline or slide is produced. The question asks for the topic. Skipping does not invent a topic: the request remains active and stoppable, and the system asks for the topic again.
- **UC / flow:** UC-001/A32.
- **FR / AC:** FR-021/AC-1; FR-021/AC-3; FR-021/AC-8; FR-021/AC-9.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-006 - Resolve conflicting material without silently choosing a fact

- **Priority:** P0.
- **Input / preconditions:** Survey material says satisfaction rose by 12% in the text and 15% in the results table. Neither is identified as authoritative.
- **Action / variants:** Request an outline and inspect its treatment of the conflict. In independent branches, tell the system to use 15% from the results table, or confirm while the conflict remains unresolved.
- **Expected outcome:** The response identifies both values and where they came from; it does not silently settle the conflict. An explicit choice of 15% settles the revised outline. Confirmation without that choice keeps the conflict unresolved in slides rather than asserting 12%, 15% or an invented replacement.
- **UC / flow:** UC-001/A33.
- **FR / AC:** FR-011/AC-1; FR-011/AC-2; FR-011/AC-3; FR-037/AC-1; FR-037/AC-2; FR-037/AC-3; FR-037/AC-4.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-007 - Use placeholders for missing user-specific facts

- **Priority:** P0.
- **Input / preconditions:** The requested pilot outline needs cost savings and the number of sites, but the material supplies neither. The system has asked nothing about these facts.
- **Action / variants:** Request the outline and read its response.
- **Expected outcome:** The system uses placeholders for both missing facts without inventing values. The response identifies both omissions.
- **UC / flow:** UC-001/A34.
- **FR / AC:** FR-010/AC-1; FR-010/AC-2.
- **Dependencies:** GAP-14: unresolved business-rule markers do not invalidate these confirmed outcomes.

### TS-008 - Build and reveal the confirmed draft

- **Priority:** P0.
- **Input / preconditions:** The confirmed outline has four slides in order: "Why we ran the pilot", "What we did", "Results", "Costs"; its Results content includes fewer errors and faster handover. A controlled provider can expose completion of each slide separately.
- **Action / variants:** Build the deck. Observe before completion, view slide 1 while slide 3 becomes ready, and inspect the completed deck.
- **Expected outcome:** From the start the deck canvas shows work in progress and that slides remain to be built. The first finished slide is available before all slides finish, and later completion does not move the user away from slide 1. The result has four slides with the confirmed titles, order and content, including the two results; completion shows every draft slide and removes both the working state and the indication that more slides are still to come.
- **UC / flow:** UC-001/S5; UC-001/S6.
- **FR / AC:** FR-022/AC-2; FR-022/AC-3; FR-022/AC-6; FR-022/AC-7; FR-023/AC-1; FR-023/AC-2; FR-023/AC-3; FR-023/AC-5.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-009 - Refine a named slide across multiple requests

- **Priority:** P0.
- **Input / preconditions:** A five-slide pilot deck has slide 3 titled Results with three points. Slide 1 lists that original title in its overview. Snapshot every slide.
- **Action / variants:** Rename slide 3 to "What we learned", then send another request to make slide 3 shorter.
- **Expected outcome:** The rename preserves the meaning of its three points. The later shortening retains the new title and still describes the pilot. No outline or scope question is introduced for the clear instruction. Slides 1, 2, 4 and 5 remain unchanged, including the now-outdated overview title on slide 1.
- **UC / flow:** UC-002/S3.
- **FR / AC:** FR-027/AC-1; FR-027/AC-2; FR-027/AC-3; FR-027/AC-7; FR-027/AC-9.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-010 - Apply an explicitly deck-wide tone change

- **Priority:** P0.
- **Input / preconditions:** A five-slide deck has an informal tone, with recorded subject, position and facts.
- **Action / variants:** Ask to make the whole deck formal.
- **Expected outcome:** All five slides become more formal while retaining subject, position and facts. No new outline or scope question appears and the deck still has five slides.
- **UC / flow:** UC-002/S3.
- **FR / AC:** FR-027/AC-4; FR-027/AC-5.
- **Dependencies:** This checks confirmed FR-027/AC-5. It does not approve FR-032/AC-3 (GAP-03), which remains blocked in the matrix.

### TS-011 - Insert a slide at the requested position or at the end

- **Priority:** P1.
- **Input / preconditions:** A deck contains five slides. Reset to the same snapshot for each variant.
- **Action / variants:** Request a costs slide after slide 2; separately, request a costs slide without naming a position.
- **Expected outcome:** Each result has six slides. The named-position variant inserts costs at position 3 and shifts the old slides 3 to 5 without changing them. The unspecified-position variant appends costs at position 6. All five original slides retain their content and relative order.
- **UC / flow:** UC-002/S3.
- **FR / AC:** FR-027/AC-6; FR-027/AC-12.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-012 - Reject invalid or contradictory slide references

- **Priority:** P0.
- **Input / preconditions:** A deck has five slides, with Results on slide 3 and Costs on slide 4. Preserve the conversation and deck snapshots.
- **Action / variants:** In independent runs request changes to slides 2 and 9, or name both slide 3 and the title Costs as one target. After the invalid-number run, send a corrected new request for slides 2 and 4.
- **Expected outcome:** An invalid reference ends the request without any partial edit or automatic retry. The response explains that slide 9 is absent from a five-slide deck, or that number 3 and title Costs point to different slides, and does not choose a conflicting target for the user. The correction is a new message; the original remains once, unchanged. No way to take back or edit the original message is offered. Slides 1, 3 and 5 remain unchanged after the corrected request.
- **UC / flow:** UC-002/A5.
- **FR / AC:** FR-036/AC-1; FR-036/AC-2; FR-036/AC-3; FR-036/AC-4; FR-036/AC-5.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-013 - Keep one active request and preserve the next draft

- **Priority:** P0.
- **Input / preconditions:** A request with sent notes.docx is active. Another request text is being drafted, with chart.png and budget.pdf being prepared.
- **Action / variants:** Try sending while work is active and try an earlier suggested option; remove budget.pdf from the next draft. In separate runs finish or stop the active request, then send the retained draft.
- **Expected outcome:** No second request starts while one is active. The unsent draft remains available, and editing its attachments does not alter the inputs of the active request. After finish or stop, sending creates a new request from the retained draft.
- **UC / flow:** UC-003/A14.
- **FR / AC:** FR-014/AC-1; FR-014/AC-2; FR-014/AC-3; FR-014/AC-4.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-014 - Show real progress even when the provider is silent

- **Priority:** P0.
- **Input / preconditions:** A request text and ready notes.docx are in the request area. The provider can pause output while the current phase is drafting.
- **Action / variants:** Send, observe the active request during silence, allow completion, then send a follow-up asking to add costs.
- **Expected outcome:** Sending clears the request area and records the received message. Status and elapsed time remain visible without altering it. The phase is understandable and does not advance without evidence during silence, while elapsed time continues. Completion ends the working state; the follow-up is a new message and earlier messages remain unchanged.
- **UC / flow:** UC-003/S2; UC-003/S3; UC-003/S4.
- **FR / AC:** FR-012/AC-1; FR-012/AC-2; FR-012/AC-3; FR-012/AC-4; FR-012/AC-5; FR-012/AC-6.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-015 - Stop and fail during first-draft building

- **Priority:** P0.
- **Input / preconditions:** A confirmed outline has four planned slides. Slides 1 and 2 are finished and slide 3 is in progress.
- **Action / variants:** Reset and run each interruption: user Stop, model error, and provider quota exhaustion. Inspect the retained deck and response.
- **Expected outcome:** Only the two finished slides remain, unchanged, with the confirmed outline retained and no incomplete slide or replacement outline. The response reports two finished slides and does not call the draft ready. No empty slide is shown without explaining why it is empty.
- **UC / flow:** UC-001/A10; UC-001/A11; UC-001/A19.
- **FR / AC:** FR-025/AC-1; FR-025/AC-2; FR-025/AC-3; FR-026/AC-1.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-016 - Preserve completed edits after interruption

- **Priority:** P0.
- **Input / preconditions:** A five-slide deck is being changed on slides 2, 3 and 4. Slide 2 is finished and slide 3 is in progress.
- **Action / variants:** In separate runs stop the request or cause a model error.
- **Expected outcome:** Slide 2 retains its completed change; slides 3 and 4 retain their previous versions, and slides 1 and 5 remain unchanged. The deck still has five slides. The stop response reports one completed slide change. The failure response correctly names slide 2 as changed and slides 3 and 4 as not changed.
- **UC / flow:** UC-002/A7; UC-002/A11.
- **FR / AC:** FR-025/AC-4; FR-026/AC-2; FR-026/AC-3.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-017 - Stop while waiting for an answer

- **Priority:** P0.
- **Input / preconditions:** The active request is waiting for the user to answer an audience question.
- **Action / variants:** Stop the request, then send "go on" as a new instruction.
- **Expected outcome:** The system no longer waits for an answer and shows an interruption notice. The old request and question remain unchanged in the conversation. The later instruction is a new user message, not an answer added to the stopped request; the old message remains once.
- **UC / flow:** UC-003/A31; UC-003/A38.
- **FR / AC:** FR-018/AC-4.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-018 - Report provider failure without retrying or switching

- **Priority:** P0.
- **Input / preconditions:** An active request uses a saved provider and selected model. Controlled variants expose an unreachable provider, a revoked key, quota exhaustion, and refusal of manually added M9. Keep another provider available in the M9 run.
- **Action / variants:** Cause each failure independently and read the response. After the quota run, explicitly send a shorter request.
- **Expected outcome:** Each failure ends work, preserves the original message and causes no automatic rerun. Explanations identify unreachability, where to correct the key, the user account quota, or lack of access to M9 as applicable. M9 refusal changes no saved configuration or selection and sends no replacement request to another model/provider. The shorter quota follow-up is a new message, with the old one still present once; success of that new work is not promised.
- **UC / flow:** UC-003/A11; UC-003/A18; UC-003/A19.
- **FR / AC:** FR-019/AC-1; FR-019/AC-2; FR-019/AC-3; FR-019/AC-4; FR-019/AC-5; FR-019/AC-6; FR-019/AC-7.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-019 - Reject unreadable or unsupported attachments

- **Priority:** P0.
- **Input / preconditions:** Use separate protected, damaged and unsupported-format files. Choose the unsupported format outside the confirmed BR-001 list, not by assuming a pending size limit.
- **Action / variants:** Add each file to a request.
- **Expected outcome:** Each file is rejected before sending, and its rejection explains the applicable reason.
- **UC / flow:** UC-003/A8.
- **FR / AC:** FR-017/AC-2; FR-017/AC-3.
- **Dependencies:** GAP-04: count and size boundaries are deliberately left without scenarios. Protected/damaged files and unsupported types do not establish those limits.

### TS-020 - Open model setup without losing the draft

- **Priority:** P0.
- **Input / preconditions:** The current chat has unsent text and a ready notes.docx attachment. Use a complete configuration for the save branch.
- **Action / variants:** Open model setup. In separate runs save and return, or leave without saving and return.
- **Expected outcome:** Opening setup starts no request and adds no conversation text. In both return paths, the original request text and ready attachment remain unchanged.
- **UC / flow:** UC-005/S1; UC-005/S5; UC-005/A4.
- **FR / AC:** FR-038/AC-1; FR-038/AC-2; FR-038/AC-3.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-021 - Block sending without usable model setup

- **Priority:** P0.
- **Input / preconditions:** The request area contains text and ready notes.docx. Variant A has no saved provider configuration; variant B has only saved Work AI with no added model.
- **Action / variants:** Try to send in each variant.
- **Expected outcome:** No work or new chat message starts, and the draft is retained. The first response guides the user to set up a provider/model. The second explains that no model is added, points to model setup and does not falsely claim that no provider is configured. Neither attempt saves a provider configuration by itself.
- **UC / flow:** UC-003/A17.
- **FR / AC:** FR-046/AC-1; FR-046/AC-2; FR-046/AC-4; FR-046/AC-5.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-022 - Protect an active request from model or key changes

- **Priority:** P0.
- **Input / preconditions:** R1 uses M1 and K1. M2 is selectable. Outbound calls can be observed without retaining credential values. Reset for each variant.
- **Action / variants:** Send with M1/K1. During active work switch to M2; separately switch while R1 waits for an answer and then answer; separately save K2 while R1 is active. After R1 ends, send another request.
- **Expected outcome:** R1 uses its original M1/K1 throughout, including after a question answer. Configuration changes do not stop, restart or replay R1. The next request uses M2 after the model-change variants, or M1/K2 after the saved-key variant.
- **UC / flow:** UC-005/A1; UC-006/S3.
- **FR / AC:** FR-042/AC-1; FR-042/AC-4; FR-042/AC-5; FR-042/AC-9.
- **Dependencies:** GAP-10: choose an approved provider configuration that requires a key; fixtures are symbolic until its required settings are established.

### TS-023 - Keep unsaved credentials out of requests and persistence

- **Priority:** P0.
- **Input / preconditions:** Use independent initial-setup and saved-K1 configurations. K2 is a synthetic replacement credential.
- **Action / variants:** Leave an initial configuration unsaved; separately edit K1 to K2 and leave unsaved, including a restart variant. In a separate run save K2 and leave setup.
- **Expected outcome:** Unsaved initial setup is unavailable for work. Existing requests after an abandoned edit use K1, including after restart, with the original provider still the only saved configuration and no request ever using unsaved K2. Saving K2 does not start work by itself; only a subsequent explicit request uses K2.
- **UC / flow:** UC-005/A4.
- **FR / AC:** FR-044/AC-1; FR-044/AC-2; FR-044/AC-3; FR-044/AC-4.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-024 - Hide saved credentials in setup and conversation

- **Priority:** P0.
- **Input / preconditions:** Synthetic K1 and K2 have distinctive prefixes and suffixes. Use a controlled access-refusal response that could expose a credential.
- **Action / variants:** Save K1, reopen setup, run the refusal case, replace K1 with saved K2, and reopen setup again.
- **Expected outcome:** Setup indicates that a key is saved but shows neither whole credentials nor their prefixes/suffixes. Conversation and error responses do not reveal the saved key. Reopening after replacement exposes neither old nor new key.
- **UC / flow:** UC-005/S3; UC-005/A1.
- **FR / AC:** FR-040/AC-1; FR-040/AC-2; FR-040/AC-3.
- **Dependencies:** Use synthetic markers; evidence must redact secrets. This UI scenario does not claim full NFR-006 coverage of storage, logs or destinations.

### TS-025 - Recover after removing the selected model

- **Priority:** P0.
- **Input / preconditions:** R1 has ended; selected M1 was removed and M2 remains available. The request area holds a new draft and attachment.
- **Action / variants:** Try to send, read the response, explicitly select M2, and send again.
- **Expected outcome:** The first attempt starts no work, preserves the draft and shows R1 once. It neither selects M2 automatically nor opens settings automatically. The response explains that the model was removed and another must be chosen. The explicit later send uses M2 and the saved key.
- **UC / flow:** UC-003/A40; UC-006/S3.
- **FR / AC:** FR-056/AC-1; FR-056/AC-2; FR-056/AC-3.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-026 - List and reopen saved chats after restart

- **Priority:** P0.
- **Input / preconditions:** Before a restart, X has four messages and five pilot-results slides; Y has an unconfirmed staff-survey outline with no slides. Z has three slides, unsent "draft notes" and ready notes.docx, with no active request. Restore that current-draft setup after restart where needed; draft persistence across process restart is not assumed.
- **Action / variants:** List earlier work, open X, return to Z, and independently reopen X after a restart. In X send "make slide 2 shorter".
- **Expected outcome:** The list includes X and Y with last-change information, meaningful topic names and correct slide-presence indicators. Merely listing preserves Z and its draft. Opening X starts no work, restores the four messages in order and the five unchanged slides, including after restart. Returning preserves Z's conversation/deck. The explicit refinement is a new message in X; it does not change Z.
- **UC / flow:** UC-006/S1; UC-006/S2; UC-006/S3.
- **FR / AC:** FR-048/AC-1; FR-048/AC-2; FR-048/AC-3; FR-049/AC-1; FR-049/AC-2; FR-049/AC-3; FR-049/AC-4.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-027 - Keep unsent text local and discard unsent attachments on switching

- **Priority:** P0.
- **Input / preconditions:** Z has unsent "draft notes", ready chart.png from a local file, and an earlier sent notes.docx. X has an empty request area. DeckAgent stays running.
- **Action / variants:** Open X and return to Z, then add chart.png again.
- **Expected outcome:** The unsent text does not appear in X or become a message; it returns unchanged in Z. The unsent chart attachment does not return automatically, but its original file is unchanged and it can be added again. Sent notes.docx stays with its original request.
- **UC / flow:** UC-006/S2.
- **FR / AC:** FR-049/AC-5; FR-049/AC-6.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-028 - Isolate a new chat from earlier content

- **Priority:** P0.
- **Input / preconditions:** X has a hospital-pilot conversation, five slides, unsent "draft notes" and ready chart.png. No request is active. A selectable model is available for the new chat.
- **Action / variants:** Start a new chat, inspect it, return to X while DeckAgent stays running, and send a staff-survey request in the new chat.
- **Expected outcome:** The new chat starts with an empty conversation, deck and request area and no automatic request. X keeps its conversation, five slides and unsent text; its unsent attachment is removed but its original file remains unchanged. The staff-survey request receives an outline before slides and imports no pilot content from X.
- **UC / flow:** UC-012/S1; UC-012/S2; UC-012/S3.
- **FR / AC:** FR-053/AC-1; FR-053/AC-2; FR-053/AC-3; FR-053/AC-4; FR-053/AC-11; FR-053/AC-12.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-029 - Prevent chat switching during an active request

- **Priority:** P0.
- **Input / preconditions:** X is current and earlier Y exists. Use working and waiting-for-answer variants, then separate finished, stopped and failed variants.
- **Action / variants:** Try to start a new chat while working; try to open Y while waiting for an answer. Open Y after each of the three terminal outcomes.
- **Expected outcome:** Active work stays in X without starting a new chat. A waiting request stays active in X with its question pending. After finish, Stop or failure, opening Y succeeds.
- **UC / flow:** UC-006/S1; UC-012/S1.
- **FR / AC:** FR-054/AC-1; FR-054/AC-2; FR-054/AC-3.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-030 - Reopen interrupted work without automatic resumption

- **Priority:** P0.
- **Input / preconditions:** X has a confirmed four-slide outline and two completed, saved slides. End DeckAgent itself while slide 3 is being built, then restart it.
- **Action / variants:** Open X, read the status, then explicitly send "build the remaining slides".
- **Expected outcome:** Only the two finished slides appear; no unfinished slide, automatic request or working indicator appears. The old request is present once. The response says work did not finish and does not promise more slides. The later instruction starts a new request and preserves the old message.
- **UC / flow:** UC-006/A6.
- **FR / AC:** FR-052/AC-1; FR-052/AC-2; FR-052/AC-3.
- **Dependencies:** GAP-22: establish saved state before termination. This scenario is distinct from reloading only the Local Web interface and from the NFR crash campaign.

### TS-031 - Report a missing saved chat without harming other chats

- **Priority:** P0.
- **Input / preconditions:** Earlier X and Y exist; X's saved data is missing. Current Z has three slides and a captured conversation and request area. Use a disposable test workspace.
- **Action / variants:** Try to open X; read the response and then open Y.
- **Expected outcome:** Z remains current and unchanged after the failed attempt. The response names the missing saved data as the reason X cannot open. Y can still open with its previous conversation and slides; no repair behavior is assumed.
- **UC / flow:** UC-006/A3.
- **FR / AC:** FR-050/AC-1; FR-050/AC-2.
- **Dependencies:** No additional product decision identified; the environment and evidence conditions in the Test Plan still apply.

### TS-032 - Keep work running across interface reload or closure

- **Priority:** P0.
- **Input / preconditions:** Keep the DeckAgent process alive. Variants: four-slide build with slides 1 and 2 finished and slide 3 active; five-slide deck editing slides 2 and 3; audience clarification waiting for an answer.
- **Action / variants:** Reload during the build. Separately close the interface during editing and reopen after work ends. Separately reload while waiting, then answer.
- **Expected outcome:** Reload preserves conversation and shows finished slides plus any newly finished ones, current work and no false interruption; the request appears once and is not resent. Reopening after editing shows changed slides 2 and 3, completion and ability to send. Reloading a question preserves the wait and the reply joins the same request.
- **UC / flow:** UC-001/A13; UC-003/A13.
- **FR / AC:** FR-068/AC-1; FR-068/AC-2; FR-068/AC-3.
- **Dependencies:** GAP-23: idle unconfirmed-outline reload remains a traceability gap, not covered by these ACs.

### TS-033 - Use an attached image and handle required-image failure

- **Priority:** P0.
- **Input / preconditions:** Success variant: new ward talk, attached ward.jpg and confirmed ward slide. Failure variants: five-slide deck with selected Work AI/M1, another saved Home AI, and either every image attempt failing or no valid image-making path.
- **Action / variants:** Build the attached-photo deck. Independently request a new ward illustration on slide 2 under each failure condition, and request a gallery slide at the end when image attempts fail.
- **Expected outcome:** The ward slide uses ward.jpg without asking which kind of image. Required-image failure leaves slide 2 unchanged with no substitute and reports unfinished work; a missing valid path says the image was not made. No selection change or transfer to another provider/service occurs. The failed gallery request leaves all five slides unchanged.
- **UC / flow:** UC-001/A42; UC-002/A12.
- **FR / AC:** FR-066/AC-1; FR-066/AC-5; FR-066/AC-6; FR-066/AC-11.
- **Dependencies:** GAP-15: execution needs an implemented image path and controlled failure/capability conditions; no particular technology or extra service is approved here.

### TS-034 - Disclose partial material and ask when the missing part is essential

- **Priority:** P0.
- **Input / preconditions:** Independent fixtures: report.pdf has 20 pages with pages 12 to 20 unreadable and pilot results only there; a five-slide chat has more prior material than work can take at once; book.pdf has unreadable chapter 3.
- **Action / variants:** Request a report-based outline; separately add cost results after slide 4 in the long chat; separately request a talk specifically on chapter 3.
- **Expected outcome:** The report response names report.pdf and partial use without claiming full use. The long-chat completion admits not using all earlier material. Missing chapter 3 prevents an outline and keeps the request waiting; the question identifies the unused chapter and asks for it again or a changed request.
- **UC / flow:** UC-003/A43.
- **FR / AC:** FR-067/AC-1; FR-067/AC-2; FR-067/AC-3; FR-067/AC-4.
- **Dependencies:** Use controlled truncation/read failures; this does not invent a context-window capacity or attachment-size limit.

### TS-035 - Stop takes effect without later automatic work

- **Priority:** P0.
- **Input / preconditions:** An active request for a pilot-results talk. The provider can keep returning output after Stop to exercise late responses.
- **Action / variants:** Find and use Stop, observe when it takes effect, then send "go on with the remaining work". Record the finite observation interval without treating it as a product time limit.
- **Expected outcome:** Stop is available. After it takes effect, the system shows no active work and adds no response content, slide or slide change for that request. The original message remains unchanged and is never automatically resent or resumed. The notice says interrupted, not failed. The explicit later instruction is a new message and new work; the old request appears once.
- **UC / flow:** UC-003/S2; UC-003/A31.
- **FR / AC:** FR-018/AC-1; FR-018/AC-2; FR-018/AC-3; FR-018/AC-5.
- **Dependencies:** Stop latency remains pending (GAP-17); do not invent a numeric deadline. Late-output injection is an environment requirement.

### TS-036 - Save complete setup and recover from a missing required key

- **Priority:** P0.
- **Input / preconditions:** No provider configuration is saved. Use a provider P whose approved required settings include a key, with synthetic K1 and display name Work AI.
- **Action / variants:** Save complete setup. Independently reset, attempt to save without the key, read the response, then supply K1 and save.
- **Expected outcome:** Complete setup appears as saved with provider P and name Work AI, and the response says it is saved. Missing-key setup is not saved, retains the provider and name, and identifies the missing key. Completing that setup allows saving.
- **UC / flow:** UC-005/S3; UC-005/S4; UC-005/A5.
- **FR / AC:** FR-041/AC-1; FR-041/AC-2; FR-045/AC-1; FR-045/AC-2; FR-045/AC-3.
- **Dependencies:** GAP-10 blocks concrete provider-specific execution until required settings are approved. This scenario defines confirmed conditional behavior. It assumes neither save-time credential validation nor a default model list (GAP-08, GAP-12).

### TS-037 - Clarify scope before a deck-wide change

- **Priority:** P0.
- **Input / preconditions:** A five-slide deck, no active request, and no conversation context that establishes which slides a tone change should reach.
- **Action / variants:** Send "make it more formal" and inspect the question before answering; choose the option for every slide. Independently reset and send "make it more formal and add a slide on costs" to inspect the available options.
- **Expected outcome:** No slide changes while scope is unresolved. The question explains the ambiguity and offers every slide or keeping the instruction without changing slides now. New-slides-only is offered only in the variant requesting a new costs slide. Choosing every slide in the first variant produces five more-formal slides without another question or outline proposal.
- **UC / flow:** UC-002/A1; UC-002/A2.
- **FR / AC:** FR-030/AC-1; FR-031/AC-1; FR-031/AC-2; FR-032/AC-1; FR-032/AC-2.
- **Dependencies:** FR-032/AC-3 remains proposed (GAP-03). This scenario does not claim its subject/fact-preservation criterion or cover the other choice outcomes.

## AC coverage matrix

Each FR heading gives its source UC/flow map. Each row identifies one AC, its original title, check type, effective approval and scenario coverage. Titles are navigation aids; source Given/When/Then remains authoritative. Concrete fixture review must also follow inherited AC preconditions.

### FR-001 - Outline before any slide

Source: [FR-001](../../spec/04-requirements/fr/FR-001.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/S3; UC-001/A23.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Outline proposal shown, no slide | deterministic | confirmed | TS-001 | Scenario defined |
| AC-2 | Says that slides wait for confirmation | judged | confirmed | TS-001 | Scenario defined |
| AC-3 | No slide before confirmation | deterministic | confirmed | TS-001 | Scenario defined |

### FR-003 - Confirm the current outline

Source: [FR-003](../../spec/04-requirements/fr/FR-003.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/S3; UC-001/S4.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Confirmation is offered | deterministic | confirmed | - | No scenario yet |
| AC-2 | Confirm the current outline, not an earlier one | deterministic | confirmed | TS-002 | Scenario defined |
| AC-3 | Suggested option has the same result | deterministic | confirmed | TS-002 | Scenario defined |
| AC-4 | Positive message with a change is not a confirmation | deterministic | confirmed | TS-002 | Scenario defined |
| AC-5 | Confirmed outline stays fixed | deterministic | confirmed | - | No scenario yet |
| AC-6 | Slides are prepared from the confirmed outline | judged | confirmed | - | No scenario yet |
| AC-7 | Confirmation given as an answer | deterministic | confirmed | - | No scenario yet |

### FR-004 - Cancel the outline

Source: [FR-004](../../spec/04-requirements/fr/FR-004.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/S3; UC-001/A22.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Cancellation is offered | deterministic | confirmed | - | No scenario yet |
| AC-2 | Cancel keeps every proposal and builds nothing | deterministic | confirmed | TS-003 | Scenario defined |
| AC-3 | Suggested option has the same result | deterministic | confirmed | - | No scenario yet |
| AC-4 | Notice says the user cancelled | judged | confirmed | TS-003 | Scenario defined |
| AC-5 | Cancellation given as an answer | deterministic | confirmed | - | No scenario yet |
| AC-6 | New request after a cancel gets a new outline | deterministic | confirmed | TS-003 | Scenario defined |
| AC-7 | The new outline follows the new request | judged | confirmed | TS-003 | Scenario defined |

### FR-005 - Revise the outline or use an earlier proposal

Source: [FR-005](../../spec/04-requirements/fr/FR-005.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/S3; UC-001/A23; UC-001/A24.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Revision is a new response | deterministic | confirmed | TS-002 | Scenario defined |
| AC-2 | Revision follows the instruction | judged | confirmed | TS-002 | Scenario defined |
| AC-3 | Revision keeps what the instruction does not concern | judged | confirmed | TS-002 | Scenario defined |
| AC-5 | Use an earlier proposal again | judged | confirmed | - | No scenario yet |
| AC-6 | Revision given as an answer | deterministic | confirmed | - | No scenario yet |

### FR-006 - Refuse to confirm an empty current outline

Source: [FR-006](../../spec/04-requirements/fr/FR-006.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A24.

Dependency review: GAP-02: AC-3 needs approval.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | No confirmation offered, no error message | deterministic | confirmed | TS-004 | Scenario defined |
| AC-2 | Typed confirmation confirms nothing | deterministic | confirmed | TS-004 | Scenario defined |
| AC-3 | No planned slide has a title | deterministic | proposed default | - | Blocked - GAP-02 |
| AC-4 | Reply explains and points to a revision | judged | confirmed | TS-004 | Scenario defined |

### FR-007 - Ask what the user means for the outline

Source: [FR-007](../../spec/04-requirements/fr/FR-007.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A39.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Unclear confirmation is not acted on | deterministic | confirmed | - | No scenario yet |
| AC-2 | Question about the intent is focused | judged | confirmed | - | No scenario yet |
| AC-3 | Unclear earlier reference changes nothing | deterministic | confirmed | - | No scenario yet |
| AC-4 | Question about the earlier proposal is focused | judged | confirmed | - | No scenario yet |
| AC-5 | Answer in the user's own words | judged | confirmed | - | No scenario yet |
| AC-6 | Clear message gets no question | deterministic | confirmed | - | No scenario yet |

### FR-008 - Draft the outline from the request and the material

Source: [FR-008](../../spec/04-requirements/fr/FR-008.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/S3; UC-001/A9; UC-001/A32.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Topic and purpose follow the request | judged | confirmed | - | No scenario yet |
| AC-2 | Stated audience shapes the outline | judged | confirmed | - | No scenario yet |
| AC-3 | Stated emphasis shapes the outline | judged | confirmed | - | No scenario yet |
| AC-4 | Requested number of slides | deterministic | confirmed | - | No scenario yet |
| AC-5 | Relevant material is used | judged | confirmed | - | No scenario yet |
| AC-6 | Figures keep the meaning of the material | judged | confirmed | - | No scenario yet |
| AC-7 | Answers shape the outline | judged | confirmed | - | No scenario yet |
| AC-8 | Skipped question leads to a stated assumption | judged | confirmed | - | No scenario yet |
| AC-9 | Material only, when the user asks | judged | confirmed | - | No scenario yet |
| AC-10 | Instructions in the material | judged | confirmed | - | No scenario yet |
| AC-11 | The language the user asks for | judged | confirmed | - | No scenario yet |
| AC-12 | No language named | judged | confirmed | - | No scenario yet |

### FR-009 - Draft without a file that has nothing usable

Source: [FR-009](../../spec/04-requirements/fr/FR-009.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A9.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | File is named | deterministic | confirmed | - | No scenario yet |
| AC-2 | Reason given, no content claimed | judged | confirmed | - | No scenario yet |
| AC-3 | Outline drafted from the rest | judged | confirmed | - | No scenario yet |

### FR-010 - Mark facts the material does not give

Source: [FR-010](../../spec/04-requirements/fr/FR-010.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A34.

Dependency review: GAP-14: missing content/figures BR; explicit placeholder ACs remain confirmed.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Missing figures become placeholders | judged | confirmed | TS-007 | Scenario defined |
| AC-2 | Each missing fact is named | judged | confirmed | TS-007 | Scenario defined |
| AC-3 | General knowledge is not a missing fact | judged | confirmed | - | No scenario yet |

### FR-011 - Disclose material that does not agree with itself

Source: [FR-011](../../spec/04-requirements/fr/FR-011.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A33.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Disagreement is named | judged | confirmed | TS-006 | Scenario defined |
| AC-2 | Each part is located in plain words | judged | confirmed | TS-006 | Scenario defined |
| AC-3 | No silent choice | judged | confirmed | TS-006 | Scenario defined |

### FR-012 - Send a request and show its work until it ends

Source: [FR-012](../../spec/04-requirements/fr/FR-012.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A22; UC-001/A23; UC-001/A39; UC-003/S2; UC-003/S3; UC-003/S4.

Referenced rules/qualities: [NFR-001](../../spec/04-requirements/nfr/NFR-001.md).

Dependency review: GAP-16: NFR-001 timing is not approved; visible-status ACs remain confirmed.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Sent request moves into the conversation | deterministic | confirmed | TS-014 | Scenario defined |
| AC-2 | Status while the system works | deterministic | confirmed | TS-014 | Scenario defined |
| AC-3 | Status says what the system does | judged | confirmed | TS-014 | Scenario defined |
| AC-4 | End of the work | deterministic | confirmed | TS-014 | Scenario defined |
| AC-5 | Next request is separate | deterministic | confirmed | TS-014 | Scenario defined |
| AC-6 | Status follows the work | judged | confirmed | TS-014 | Scenario defined |

### FR-013 - Send an instruction through a suggested option

Source: [FR-013](../../spec/04-requirements/fr/FR-013.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/S2.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Option sends its instruction at once | deterministic | confirmed | - | No scenario yet |
| AC-2 | Unsent text and attachments stay | deterministic | confirmed | - | No scenario yet |
| AC-3 | Same instruction as the typed one | deterministic | confirmed | - | No scenario yet |
| AC-4 | Option that no longer fits is not accepted | deterministic | confirmed | - | No scenario yet |
| AC-5 | Way of sending does not change the meaning | judged | confirmed | - | No scenario yet |
| AC-6 | The user is told the option no longer applies | judged | confirmed | - | No scenario yet |

### FR-014 - One active request at a time

Source: [FR-014](../../spec/04-requirements/fr/FR-014.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A14; UC-003/A14.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Draft kept, no second request | deterministic | confirmed | TS-013 | Scenario defined |
| AC-2 | No new request through a suggested option | deterministic | confirmed | TS-013 | Scenario defined |
| AC-3 | Draft can be sent after the work ends | deterministic | confirmed | TS-013 | Scenario defined |
| AC-4 | Attachments for the next request | deterministic | confirmed | TS-013 | Scenario defined |

### FR-015 - When a request can be sent

Source: [FR-015](../../spec/04-requirements/fr/FR-015.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/S1; UC-003/A3; UC-003/A6; UC-003/A8.

Referenced rules/qualities: [BR-002](../../spec/05-business-rules/BR-002.md).

Dependency review: GAP-05: AC-7 to AC-9 need approved length and boundary data; AC-8 inherits AC-7.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Empty request cannot be sent | deterministic | confirmed | - | No scenario yet |
| AC-2 | Text alone can be sent | deterministic | confirmed | - | No scenario yet |
| AC-3 | Attachment alone can be sent | deterministic | confirmed | - | No scenario yet |
| AC-4 | Text of only spaces counts as no text | deterministic | confirmed | - | No scenario yet |
| AC-5 | Attachment being prepared blocks sending | deterministic | confirmed | - | No scenario yet |
| AC-6 | Rejected attachment blocks sending | deterministic | confirmed | - | No scenario yet |
| AC-7 | Request text over the maximum length | deterministic | confirmed | - | No scenario yet |
| AC-8 | The user is told the text is too long | judged | confirmed | - | No scenario yet |
| AC-9 | Attachments do not count toward the length | deterministic | confirmed | - | No scenario yet |

### FR-016 - Show each attachment and its state

Source: [FR-016](../../spec/04-requirements/fr/FR-016.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/A3; UC-003/A14.

Referenced rules/qualities: [NFR-004](../../spec/04-requirements/nfr/NFR-004.md).

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Each added file is an attachment | deterministic | confirmed | - | No scenario yet |
| AC-2 | Being prepared, then ready | deterministic | confirmed | - | No scenario yet |
| AC-3 | Remove an attachment | deterministic | confirmed | - | No scenario yet |
| AC-4 | Preview, or say that none is available | deterministic | confirmed | - | No scenario yet |

### FR-017 - Reject an attachment the system cannot use

Source: [FR-017](../../spec/04-requirements/fr/FR-017.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/A8; UC-003/A27; UC-003/A14.

Referenced rules/qualities: [BR-001](../../spec/05-business-rules/BR-001.md), [NFR-010](../../spec/04-requirements/nfr/NFR-010.md).

Dependency review: GAP-04: AC-1 and AC-7 need size/count values. AC-4 and AC-5 inherit the oversized-file condition; AC-6 also uses an oversized file.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | File that breaks the attachment rule | deterministic | confirmed | - | No scenario yet |
| AC-2 | Protected or damaged file | deterministic | confirmed | TS-019 | Scenario defined |
| AC-3 | Type the system does not accept | deterministic | confirmed | TS-019 | Scenario defined |
| AC-4 | Reason names the cause | judged | confirmed | - | No scenario yet |
| AC-5 | Rejected attachment stays until removed | deterministic | confirmed | - | No scenario yet |
| AC-6 | Choosing a model changes no attachment | deterministic | confirmed | - | No scenario yet |
| AC-7 | Earlier attachments do not count again | deterministic | confirmed | - | No scenario yet |

### FR-018 - Stop a request

Source: [FR-018](../../spec/04-requirements/fr/FR-018.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A10; UC-002/A7; UC-003/S2; UC-003/A31.

Referenced rules/qualities: [NFR-011](../../spec/04-requirements/nfr/NFR-011.md).

Dependency review: GAP-17: no approved NFR-011 time threshold; do not time-limit these functional outcomes.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Stop is offered while the system works | deterministic | confirmed | TS-035 | Scenario defined |
| AC-2 | Stop ends the work on the request | deterministic | confirmed | TS-035 | Scenario defined |
| AC-3 | Notice says the response was interrupted | judged | confirmed | TS-035 | Scenario defined |
| AC-4 | Stop while the system waits for an answer | deterministic | confirmed | TS-017 | Scenario defined |
| AC-5 | New request after a stop is new work | deterministic | confirmed | TS-035 | Scenario defined |

### FR-019 - Report a request that cannot finish

Source: [FR-019](../../spec/04-requirements/fr/FR-019.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A11; UC-001/A18; UC-001/A19; UC-002/A11; UC-003/A11; UC-003/A18; UC-003/A19.

Dependency review: GAP-13: do not generalize AC-5 to every failure cause.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Failure ends the work | deterministic | confirmed | TS-018 | Scenario defined |
| AC-2 | Known reason is given | judged | confirmed | TS-018 | Scenario defined |
| AC-3 | Refused key | judged | confirmed | TS-018 | Scenario defined |
| AC-4 | Usage limit reached | judged | confirmed | TS-018 | Scenario defined |
| AC-5 | New request after a failure | deterministic | confirmed | TS-018 | Scenario defined |
| AC-6 | A refused model stays set up | deterministic | confirmed | TS-018 | Scenario defined |
| AC-7 | A refused model is reported | judged | confirmed | TS-018 | Scenario defined |

### FR-020 - Wait for the user's answer within the request

Source: [FR-020](../../spec/04-requirements/fr/FR-020.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A32; UC-001/A39; UC-002/A1; UC-002/A6; UC-002/A10; UC-003/A14; UC-003/A38; UC-003/A43.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Waiting is shown | deterministic | confirmed | - | No scenario yet |
| AC-2 | Typed reply joins the request | deterministic | confirmed | - | No scenario yet |
| AC-3 | Reply through a suggested option | deterministic | confirmed | - | No scenario yet |
| AC-4 | Settled answer gets no further question | judged | confirmed | - | No scenario yet |
| AC-5 | Reply that settles nothing stays in the request | deterministic | confirmed | - | No scenario yet |
| AC-6 | Open meaning is not chosen for the user | judged | confirmed | - | No scenario yet |

### FR-021 - Ask before drafting the first outline

Source: [FR-021](../../spec/04-requirements/fr/FR-021.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A9; UC-001/A32.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Unknown topic: question, no outline | deterministic | confirmed | TS-005 | Scenario defined |
| AC-2 | Unknown topic after a file with nothing usable | deterministic | confirmed | - | No scenario yet |
| AC-3 | The question asks for the topic | judged | confirmed | TS-005 | Scenario defined |
| AC-4 | Clear request gets no needless question | judged | confirmed | - | No scenario yet |
| AC-5 | Nothing already given is asked | judged | confirmed | - | No scenario yet |
| AC-6 | Offered answers, own answer and skip | deterministic | confirmed | - | No scenario yet |
| AC-7 | Skipped question leads to the outline | deterministic | confirmed | - | No scenario yet |
| AC-8 | Skipped topic question: no outline | deterministic | confirmed | TS-005 | Scenario defined |
| AC-9 | The system asks for the topic again | judged | confirmed | TS-005 | Scenario defined |

### FR-022 - Build the slides from the confirmed outline

Source: [FR-022](../../spec/04-requirements/fr/FR-022.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/S5.

Referenced rules/qualities: [BR-003](../../spec/05-business-rules/BR-003.md).

Dependency review: GAP-06: AC-4 needs the approved default design system.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Slides follow the confirmed proposal | judged | confirmed | - | No scenario yet |
| AC-2 | Each slide covers its planned slide | judged | confirmed | TS-008 | Scenario defined |
| AC-3 | One slide for each planned slide | deterministic | confirmed | TS-008 | Scenario defined |
| AC-4 | Default design system | deterministic | confirmed | - | No scenario yet |
| AC-5 | A placeholder keeps its missing status | judged | confirmed | - | No scenario yet |
| AC-6 | Slides in the order of the outline | judged | confirmed | TS-008 | Scenario defined |
| AC-7 | Planned titles become slide titles | deterministic | confirmed | TS-008 | Scenario defined |
| AC-8 | Slides in the language of the outline | judged | confirmed | - | No scenario yet |

### FR-023 - Show the deck while the slides are built

Source: [FR-023](../../spec/04-requirements/fr/FR-023.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/S5; UC-001/S6.

Referenced rules/qualities: [NFR-004](../../spec/04-requirements/nfr/NFR-004.md), [NFR-009](../../spec/04-requirements/nfr/NFR-009.md), [NFR-013](../../spec/04-requirements/nfr/NFR-013.md).

Dependency review: GAP-06, GAP-17, GAP-18 and GAP-21 affect related NFR checks, not approval of these ACs.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Deck canvas shows that work started | deterministic | confirmed | TS-008 | Scenario defined |
| AC-2 | A finished slide shows before the others are done | deterministic | confirmed | TS-008 | Scenario defined |
| AC-3 | The slide the user looks at stays the same | deterministic | confirmed | TS-008 | Scenario defined |
| AC-4 | No slide added by hand meanwhile | deterministic | confirmed | - | No scenario yet |
| AC-5 | Full draft deck at the end | deterministic | confirmed | TS-008 | Scenario defined |

### FR-024 - Closing message of the first draft

Source: [FR-024](../../spec/04-requirements/fr/FR-024.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/S6; UC-001/A42.

Dependency review: GAP-14: missing disclosure BR; explicit closing-message outcomes remain confirmed.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Closing message follows the last slide | deterministic | confirmed | - | No scenario yet |
| AC-2 | What was made for each slide | judged | confirmed | - | No scenario yet |
| AC-3 | Assumptions are named | judged | confirmed | - | No scenario yet |
| AC-4 | Placeholder text is named | judged | confirmed | - | No scenario yet |
| AC-5 | Content not from the material is named | judged | confirmed | - | No scenario yet |
| AC-6 | What was not checked is named | judged | confirmed | - | No scenario yet |
| AC-8 | Message says the draft is ready | judged | confirmed | - | No scenario yet |

### FR-025 - Keep finished slides when the work on slides ends early

Source: [FR-025](../../spec/04-requirements/fr/FR-025.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A10; UC-001/A11; UC-001/A18; UC-001/A19; UC-002/A7; UC-002/A11; UC-003/A11.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | First draft keeps its finished slides | deterministic | confirmed | TS-015 | Scenario defined |
| AC-2 | No empty slide without a reason | judged | confirmed | TS-015 | Scenario defined |
| AC-3 | Unfinished draft is not called finished | judged | confirmed | TS-015 | Scenario defined |
| AC-4 | Unfinished change does not replace a slide | deterministic | confirmed | TS-016 | Scenario defined |
| AC-5 | Unfinished new slide is not shown | deterministic | confirmed | - | No scenario yet |
| AC-6 | The user is told the slides can disagree | judged | confirmed | - | No scenario yet |

### FR-026 - Say how far the work on slides got

Source: [FR-026](../../spec/04-requirements/fr/FR-026.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A10; UC-001/A11; UC-001/A19; UC-002/A7; UC-002/A11; UC-003/A11.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Number of slides finished in a first draft | deterministic | confirmed | TS-015 | Scenario defined |
| AC-2 | Number of slides changed after a stop | deterministic | confirmed | TS-016 | Scenario defined |
| AC-3 | Which slides changed after a failure | deterministic | confirmed | TS-016 | Scenario defined |
| AC-4 | New slides count as changed | deterministic | confirmed | - | No scenario yet |
| AC-5 | Count not known | judged | confirmed | - | No scenario yet |

### FR-027 - Change the deck within the requested scope

Source: [FR-027](../../spec/04-requirements/fr/FR-027.md). Statement: **confirmed**. Selected blocks citing this FR: UC-002/S3.

Referenced rules/qualities: [NFR-012](../../spec/04-requirements/nfr/NFR-012.md).

Dependency review: GAP-17: NFR-012 has no approved time threshold.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Named slide changes in place | deterministic | confirmed | TS-009 | Scenario defined |
| AC-2 | Changed slide follows the instruction | judged | confirmed | TS-009 | Scenario defined |
| AC-3 | Content the instruction does not concern stays | judged | confirmed | TS-009 | Scenario defined |
| AC-4 | Whole-deck change without a question | deterministic | confirmed | TS-010 | Scenario defined |
| AC-5 | Whole-deck change follows the instruction | judged | confirmed | TS-010 | Scenario defined |
| AC-6 | New slide at the named place | deterministic | confirmed | TS-011 | Scenario defined |
| AC-7 | Slides outside the scope stay, even when the deck then disagrees | deterministic | confirmed | TS-009 | Scenario defined |
| AC-8 | Material given earlier is used | judged | confirmed | - | No scenario yet |
| AC-9 | The next request starts from the current deck | judged | confirmed | TS-009 | Scenario defined |
| AC-10 | The confirmed outline informs a later change | judged | confirmed | - | No scenario yet |
| AC-11 | A large change stays in this deck | deterministic | confirmed | - | No scenario yet |
| AC-12 | New slide with no place named | deterministic | confirmed | TS-011 | Scenario defined |

### FR-028 - Carry on a first draft that stopped or failed

Source: [FR-028](../../spec/04-requirements/fr/FR-028.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A10; UC-001/A11; UC-001/A18; UC-001/A19; UC-002/S3.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | No second outline after a stop or a failure | deterministic | confirmed | - | No scenario yet |
| AC-2 | Remaining slides follow the confirmed outline | judged | confirmed | - | No scenario yet |
| AC-3 | No slide was finished | deterministic | confirmed | - | No scenario yet |

### FR-029 - Report the change made to the deck

Source: [FR-029](../../spec/04-requirements/fr/FR-029.md). Statement: **confirmed**. Selected blocks citing this FR: UC-002/S3; UC-002/S4.

Referenced rules/qualities: [NFR-009](../../spec/04-requirements/nfr/NFR-009.md).

Dependency review: GAP-17 and GAP-21: display targets and wider language commitments remain open.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Slides being changed are named | judged | confirmed | - | No scenario yet |
| AC-2 | Changed slides are shown | deterministic | confirmed | - | No scenario yet |
| AC-3 | Closing message names the changed slides | deterministic | confirmed | - | No scenario yet |
| AC-4 | Closing message says what changed | judged | confirmed | - | No scenario yet |
| AC-5 | Added slide is named | judged | confirmed | - | No scenario yet |
| AC-6 | Message says nothing else changed | judged | confirmed | - | No scenario yet |

### FR-030 - Change no slide while a change to the deck is unclear

Source: [FR-030](../../spec/04-requirements/fr/FR-030.md). Statement: **confirmed**. Selected blocks citing this FR: UC-002/A1; UC-002/A6; UC-002/A10.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Unclear scope changes nothing | deterministic | confirmed | TS-037 | Scenario defined |
| AC-2 | Unclear feedback changes nothing | deterministic | confirmed | - | No scenario yet |
| AC-3 | Reply that settles nothing changes nothing | deterministic | confirmed | - | No scenario yet |
| AC-4 | Clear reply leads to the change | deterministic | confirmed | - | No scenario yet |

### FR-031 - Ask which slides an unclear change reaches

Source: [FR-031](../../spec/04-requirements/fr/FR-031.md). Statement: **confirmed**. Selected blocks citing this FR: UC-002/A1.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Two outcomes for an unclear scope | judged | confirmed | TS-037 | Scenario defined |
| AC-2 | Third outcome when a new slide is asked for | judged | confirmed | TS-037 | Scenario defined |

### FR-032 - Apply an unclear change to every slide

Source: [FR-032](../../spec/04-requirements/fr/FR-032.md). Statement: **confirmed**. Selected blocks citing this FR: UC-002/A2.

Dependency review: GAP-03: AC-3 needs approval and its rationale needs reconciliation with UC-002/A2.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | No further question, no slide lost | deterministic | confirmed | TS-037 | Scenario defined |
| AC-2 | Every slide follows the instruction | judged | confirmed | TS-037 | Scenario defined |
| AC-3 | A tone change keeps what it does not ask to change | judged | proposed default | - | Blocked - GAP-03 |
| AC-4 | New slide uses the same instruction | judged | confirmed | - | No scenario yet |

### FR-033 - Apply an unclear change to new slides only

Source: [FR-033](../../spec/04-requirements/fr/FR-033.md). Statement: **confirmed**. Selected blocks citing this FR: UC-002/A3.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Existing slides stay | deterministic | confirmed | - | No scenario yet |
| AC-2 | New slide follows the instruction | judged | confirmed | - | No scenario yet |

### FR-034 - Keep an unclear instruction for later slides

Source: [FR-034](../../spec/04-requirements/fr/FR-034.md). Statement: **confirmed**. Selected blocks citing this FR: UC-002/A4.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Nothing changes now | deterministic | confirmed | - | No scenario yet |
| AC-2 | System says it kept the instruction | judged | confirmed | - | No scenario yet |
| AC-3 | A later slide follows the kept instruction | judged | confirmed | - | No scenario yet |
| AC-4 | Existing slides stay | deterministic | confirmed | - | No scenario yet |
| AC-5 | A change to an existing slide does not take the kept instruction | judged | confirmed | - | No scenario yet |
| AC-6 | A withdrawn instruction no longer applies | judged | confirmed | - | No scenario yet |

### FR-035 - Clarify feedback that does not say what to change

Source: [FR-035](../../spec/04-requirements/fr/FR-035.md). Statement: **confirmed**. Selected blocks citing this FR: UC-002/A6; UC-002/A10.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Directions fit the slide and the conversation | judged | confirmed | - | No scenario yet |
| AC-2 | Choose a direction or explain more | deterministic | confirmed | - | No scenario yet |
| AC-3 | Chosen direction leads the change | judged | confirmed | - | No scenario yet |
| AC-4 | Explanation leads the change | judged | confirmed | - | No scenario yet |
| AC-5 | Fallback question | judged | confirmed | - | No scenario yet |

### FR-036 - Refuse a slide reference that does not match the deck

Source: [FR-036](../../spec/04-requirements/fr/FR-036.md). Statement: **confirmed**. Selected blocks citing this FR: UC-002/A5.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Slide not in the deck changes nothing | deterministic | confirmed | TS-012 | Scenario defined |
| AC-2 | Message names the mismatch and the size of the deck | judged | confirmed | TS-012 | Scenario defined |
| AC-3 | Number and title that disagree change nothing | deterministic | confirmed | TS-012 | Scenario defined |
| AC-4 | No slide is chosen for the user | judged | confirmed | TS-012 | Scenario defined |
| AC-5 | Corrected reference in a new request | deterministic | confirmed | TS-012 | Scenario defined |

### FR-037 - Keep a disputed point open in the outline

Source: [FR-037](../../spec/04-requirements/fr/FR-037.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A33.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | No part is called correct | judged | confirmed | TS-006 | Scenario defined |
| AC-2 | Disputed point is marked as open | judged | confirmed | TS-006 | Scenario defined |
| AC-3 | The user's decision settles the point | judged | confirmed | TS-006 | Scenario defined |
| AC-4 | An open point stays unresolved on the slide | judged | confirmed | TS-006 | Scenario defined |

### FR-038 - Keep the chat while the model setup is open

Source: [FR-038](../../spec/04-requirements/fr/FR-038.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/A28; UC-005/S1; UC-005/S5; UC-005/A4.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Opening the setup changes nothing in the chat | deterministic | confirmed | TS-020 | Scenario defined |
| AC-2 | Back to the chat after saving | deterministic | confirmed | TS-020 | Scenario defined |
| AC-3 | Back to the chat without saving | deterministic | confirmed | TS-020 | Scenario defined |

### FR-039 - Show the model setup and what a provider needs

Source: [FR-039](../../spec/04-requirements/fr/FR-039.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/S1; UC-005/S2.

Referenced rules/qualities: [BR-005](../../spec/05-business-rules/BR-005.md), [BR-006](../../spec/05-business-rules/BR-006.md), [BR-008](../../spec/05-business-rules/BR-008.md).

Dependency review: GAP-10: AC-3 needs provider requirements. GAP-07: AC-6 needs the supported-protocol list.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Nothing saved yet | deterministic | confirmed | - | No scenario yet |
| AC-2 | Each saved provider configuration | deterministic | confirmed | - | No scenario yet |
| AC-3 | Needs of a chosen provider | deterministic | confirmed | - | No scenario yet |
| AC-4 | Whose key, and where requests go | judged | confirmed | - | No scenario yet |
| AC-5 | Providers to choose from | deterministic | confirmed | - | No scenario yet |
| AC-6 | A custom model API | deterministic | confirmed | - | No scenario yet |

### FR-040 - Never show any part of a saved key

Source: [FR-040](../../spec/04-requirements/fr/FR-040.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/S1; UC-005/S3; UC-005/A1.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | No part of a saved key is shown | deterministic | confirmed | TS-024 | Scenario defined |
| AC-2 | Key never in the conversation | deterministic | confirmed | TS-024 | Scenario defined |
| AC-3 | Replacing a key shows neither key | deterministic | confirmed | TS-024 | Scenario defined |

### FR-041 - Save a provider configuration

Source: [FR-041](../../spec/04-requirements/fr/FR-041.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/S1; UC-005/S3; UC-005/S4.

Referenced rules/qualities: [BR-005](../../spec/05-business-rules/BR-005.md), [BR-006](../../spec/05-business-rules/BR-006.md).

Dependency review: GAP-07, GAP-08, GAP-10 and GAP-12: provider/protocol fixtures, release defaults and save-time key checking. AC-7 inherits AC-6.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | The provider configuration is saved | deterministic | confirmed | TS-036 | Scenario defined |
| AC-2 | The user is told | judged | confirmed | TS-036 | Scenario defined |
| AC-4 | A custom model API is saved | deterministic | confirmed | - | No scenario yet |
| AC-5 | Another provider is kept apart | deterministic | confirmed | - | No scenario yet |
| AC-6 | A built-in provider starts with its default models | deterministic | confirmed | - | No scenario yet |
| AC-7 | A new release changes no added model | deterministic | confirmed | - | No scenario yet |

### FR-042 - Run each request with the selected model of its chat

Source: [FR-042](../../spec/04-requirements/fr/FR-042.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/S3; UC-003/A27; UC-005/A1; UC-006/S3.

Dependency review: GAP-07 and GAP-10: valid provider/protocol/base-URL fixtures are needed; request snapshot behavior is confirmed.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | The request goes to the selected model | deterministic | confirmed | TS-022 | Scenario defined |
| AC-2 | Each kind of work uses the selected model | deterministic | confirmed | - | No scenario yet |
| AC-3 | A replaced key is used next | deterministic | confirmed | - | No scenario yet |
| AC-4 | A choice during a request applies to the next request | deterministic | confirmed | TS-022 | Scenario defined |
| AC-5 | An answer keeps the model of its request | deterministic | confirmed | TS-022 | Scenario defined |
| AC-6 | Confirming the outline starts a request with the current choice | deterministic | confirmed | - | No scenario yet |
| AC-7 | Each chat keeps its own selected model | deterministic | confirmed | - | No scenario yet |
| AC-8 | The same model ID in two provider configurations | deterministic | confirmed | - | No scenario yet |
| AC-9 | A new key during an active request | deterministic | confirmed | TS-022 | Scenario defined |
| AC-10 | A new base URL while the system waits for an answer | deterministic | confirmed | - | No scenario yet |

### FR-043 - Change the key or the base URL of a provider configuration

Source: [FR-043](../../spec/04-requirements/fr/FR-043.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A18; UC-003/A18; UC-005/A1.

Referenced rules/qualities: [BR-006](../../spec/05-business-rules/BR-006.md).

Dependency review: GAP-10: AC-6 needs a provider that permits base URL changes; do not assume every built-in provider allows it.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | The provider configuration stays | deterministic | confirmed | - | No scenario yet |
| AC-2 | The user is told | judged | confirmed | - | No scenario yet |
| AC-3 | Replacing the key sends nothing | deterministic | confirmed | - | No scenario yet |
| AC-4 | New request after the key is replaced | deterministic | confirmed | - | No scenario yet |
| AC-5 | Added models stay after a new key | deterministic | confirmed | - | No scenario yet |
| AC-6 | A new base URL | deterministic | confirmed | - | No scenario yet |

### FR-044 - Leave the model setup without unsaved changes

Source: [FR-044](../../spec/04-requirements/fr/FR-044.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/A4.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Nothing is saved | deterministic | confirmed | TS-023 | Scenario defined |
| AC-2 | The earlier configuration stays | deterministic | confirmed | TS-023 | Scenario defined |
| AC-3 | The unsaved key is not kept | deterministic | confirmed | TS-023 | Scenario defined |
| AC-4 | A saved change stays | deterministic | confirmed | TS-023 | Scenario defined |
| AC-5 | An unsaved display name is not kept | deterministic | confirmed | - | No scenario yet |
| AC-6 | Unsaved model changes are not kept | deterministic | confirmed | - | No scenario yet |

### FR-045 - Refuse to save a setup that lacks what the provider needs

Source: [FR-045](../../spec/04-requirements/fr/FR-045.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/A5.

Referenced rules/qualities: [BR-006](../../spec/05-business-rules/BR-006.md).

Dependency review: GAP-10: choose a provider with the stated required key; other required settings need provider-specific evidence.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Nothing is saved | deterministic | confirmed | TS-036 | Scenario defined |
| AC-2 | What is missing is named | judged | confirmed | TS-036 | Scenario defined |
| AC-3 | Completing the setup | deterministic | confirmed | TS-036 | Scenario defined |

### FR-046 - Send no request when no model is selectable

Source: [FR-046](../../spec/04-requirements/fr/FR-046.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/A17; UC-006/S3; UC-012/S3.

Referenced rules/qualities: [BR-005](../../spec/05-business-rules/BR-005.md).

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | The request stays unsent | deterministic | confirmed | TS-021 | Scenario defined |
| AC-2 | The user is told what is needed | judged | confirmed | TS-021 | Scenario defined |
| AC-3 | The kept request can be sent later | deterministic | confirmed | - | No scenario yet |
| AC-4 | A provider configuration with no added model | deterministic | confirmed | TS-021 | Scenario defined |
| AC-5 | The response tells the cases apart | judged | confirmed | TS-021 | Scenario defined |

### FR-047 - Report an outline that was not drafted

Source: [FR-047](../../spec/04-requirements/fr/FR-047.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/A11.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Earlier proposals stay after a failed revision | deterministic | confirmed | - | No scenario yet |
| AC-2 | Failed revision is reported | judged | confirmed | - | No scenario yet |
| AC-3 | Failed first outline is reported | judged | confirmed | - | No scenario yet |
| AC-4 | An unfinished proposal is not the current outline | deterministic | confirmed | - | No scenario yet |
| AC-5 | No unfinished proposal to confirm | judged | confirmed | - | No scenario yet |

### FR-048 - Show the earlier chats

Source: [FR-048](../../spec/04-requirements/fr/FR-048.md). Statement: **confirmed**. Selected blocks citing this FR: UC-006/S1; UC-006/A1.

Referenced rules/qualities: [BR-004](../../spec/05-business-rules/BR-004.md).

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Earlier chats from before a restart | deterministic | confirmed | TS-026 | Scenario defined |
| AC-2 | Each chat is named from its content | judged | confirmed | TS-026 | Scenario defined |
| AC-3 | The current chat stays as it was | deterministic | confirmed | TS-026 | Scenario defined |
| AC-4 | No earlier chat | deterministic | confirmed | - | No scenario yet |
| AC-5 | The user is told there is none | judged | confirmed | - | No scenario yet |

### FR-049 - Open an earlier chat

Source: [FR-049](../../spec/04-requirements/fr/FR-049.md). Statement: **confirmed**. Selected blocks citing this FR: UC-006/S2; UC-006/S3.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | The chat opens as it was left | deterministic | confirmed | TS-026 | Scenario defined |
| AC-2 | Also after a restart | deterministic | confirmed | TS-026 | Scenario defined |
| AC-3 | The chat the user left stays | deterministic | confirmed | TS-026 | Scenario defined |
| AC-4 | A new request in the opened chat | deterministic | confirmed | TS-026 | Scenario defined |
| AC-5 | Unsent text stays with its chat | deterministic | confirmed | TS-027 | Scenario defined |
| AC-6 | Unsent attachments do not come back | deterministic | confirmed | TS-027 | Scenario defined |

### FR-050 - Report a chat that cannot be opened

Source: [FR-050](../../spec/04-requirements/fr/FR-050.md). Statement: **confirmed**. Selected blocks citing this FR: UC-006/A3.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Other chats stay as they were | deterministic | confirmed | TS-031 | Scenario defined |
| AC-2 | The user is told why | judged | confirmed | TS-031 | Scenario defined |

### FR-051 - Open a chat that has no slides yet

Source: [FR-051](../../spec/04-requirements/fr/FR-051.md). Statement: **confirmed**. Selected blocks citing this FR: UC-006/A4.

Dependency review: GAP-01: these ACs do not resolve the remaining FR-? in UC-006/A4.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | An outline still waits for confirmation | deterministic | confirmed | - | No scenario yet |
| AC-2 | The user is told there are no slides | judged | confirmed | - | No scenario yet |
| AC-3 | Confirmed outline and no slide | deterministic | confirmed | - | No scenario yet |
| AC-4 | No outline | deterministic | confirmed | - | No scenario yet |
| AC-5 | The earlier request is not resumed | judged | confirmed | - | No scenario yet |

### FR-052 - Open a chat whose last request did not finish

Source: [FR-052](../../spec/04-requirements/fr/FR-052.md). Statement: **confirmed**. Selected blocks citing this FR: UC-006/A6.

Referenced rules/qualities: [NFR-008](../../spec/04-requirements/nfr/NFR-008.md).

Dependency review: GAP-22: execution needs an observable saved state; do not substitute the last displayed state.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Finished slides, no work | deterministic | confirmed | TS-030 | Scenario defined |
| AC-2 | The user is told the work did not finish | judged | confirmed | TS-030 | Scenario defined |
| AC-3 | A new request goes on | deterministic | confirmed | TS-030 | Scenario defined |

### FR-053 - Start a new chat

Source: [FR-053](../../spec/04-requirements/fr/FR-053.md). Statement: **confirmed**. Selected blocks citing this FR: UC-012/S1; UC-012/S2; UC-012/S3.

Referenced rules/qualities: [BR-005](../../spec/05-business-rules/BR-005.md).

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | The new chat is empty | deterministic | confirmed | TS-028 | Scenario defined |
| AC-2 | The earlier chat stays | deterministic | confirmed | TS-028 | Scenario defined |
| AC-3 | A first draft starts in the new chat | deterministic | confirmed | TS-028 | Scenario defined |
| AC-4 | Nothing comes from the earlier chat | judged | confirmed | TS-028 | Scenario defined |
| AC-5 | The new chat starts with the latest selected model | deterministic | confirmed | - | No scenario yet |
| AC-6 | The new chat keeps its own selected model | deterministic | confirmed | - | No scenario yet |
| AC-7 | An earlier selection counts | deterministic | confirmed | - | No scenario yet |
| AC-8 | No earlier selection is selectable | deterministic | confirmed | - | No scenario yet |
| AC-9 | A selection from a deleted provider configuration does not count | deterministic | confirmed | - | No scenario yet |
| AC-10 | A model added again does not count | deterministic | confirmed | - | No scenario yet |
| AC-11 | Unsent text stays with the earlier chat | deterministic | confirmed | TS-028 | Scenario defined |
| AC-12 | Unsent attachments do not move or come back | deterministic | confirmed | TS-028 | Scenario defined |

### FR-054 - No change of chat while a request is active

Source: [FR-054](../../spec/04-requirements/fr/FR-054.md). Statement: **confirmed**. Selected blocks citing this FR: UC-006/S1; UC-012/S1.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | No new chat while the system works | deterministic | confirmed | TS-029 | Scenario defined |
| AC-2 | No earlier chat while the system waits for an answer | deterministic | confirmed | TS-029 | Scenario defined |
| AC-3 | Chats can change after the request ends | deterministic | confirmed | TS-029 | Scenario defined |

### FR-055 - Choose the selected model of a chat

Source: [FR-055](../../spec/04-requirements/fr/FR-055.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/A27; UC-005/S5.

Referenced rules/qualities: [BR-005](../../spec/05-business-rules/BR-005.md).

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Selectable models, grouped and named | deterministic | confirmed | - | No scenario yet |
| AC-2 | The choice belongs to the chat | deterministic | confirmed | - | No scenario yet |
| AC-3 | Choosing while a request is active | deterministic | confirmed | - | No scenario yet |
| AC-4 | A model of another provider configuration | deterministic | confirmed | - | No scenario yet |

### FR-056 - Send no request without a selectable selected model

Source: [FR-056](../../spec/04-requirements/fr/FR-056.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/A40; UC-006/S3; UC-012/S3.

Referenced rules/qualities: [BR-005](../../spec/05-business-rules/BR-005.md).

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | The selected model was removed | deterministic | confirmed | TS-025 | Scenario defined |
| AC-2 | The user is told what to do | judged | confirmed | TS-025 | Scenario defined |
| AC-3 | Sending after a choice | deterministic | confirmed | TS-025 | Scenario defined |
| AC-4 | A new chat with no model selected before | deterministic | confirmed | - | No scenario yet |
| AC-6 | The provider configuration of the selected model was deleted | deterministic | confirmed | - | No scenario yet |

### FR-057 - Keep a valid display name apart from the provider ID

Source: [FR-057](../../spec/04-requirements/fr/FR-057.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/S3; UC-005/A1; UC-005/A10.

Referenced rules/qualities: [BR-008](../../spec/05-business-rules/BR-008.md).

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | The name does not set the provider | deterministic | confirmed | - | No scenario yet |
| AC-2 | Changing the name changes nothing else | deterministic | confirmed | - | No scenario yet |
| AC-3 | An empty display name is not saved | deterministic | confirmed | - | No scenario yet |
| AC-4 | A display name in use is not saved | deterministic | confirmed | - | No scenario yet |
| AC-5 | The other input stays | deterministic | confirmed | - | No scenario yet |
| AC-6 | The reason is given | judged | confirmed | - | No scenario yet |
| AC-7 | A display name of whitespace only is empty | deterministic | confirmed | - | No scenario yet |
| AC-8 | Capital letters and outer whitespace do not make a new name | deterministic | confirmed | - | No scenario yet |

### FR-058 - Add models to a provider configuration

Source: [FR-058](../../spec/04-requirements/fr/FR-058.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/S6; UC-005/A8; UC-005/A7.

Referenced rules/qualities: [BR-005](../../spec/05-business-rules/BR-005.md).

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Add models from the model catalog | deterministic | confirmed | - | No scenario yet |
| AC-2 | Add a model ID by hand, with no check first | deterministic | confirmed | - | No scenario yet |
| AC-3 | Model catalog not available | deterministic | confirmed | - | No scenario yet |
| AC-4 | The missing model catalog is reported | judged | confirmed | - | No scenario yet |
| AC-5 | The same model ID in two provider configurations | deterministic | confirmed | - | No scenario yet |
| AC-6 | Getting the model catalog changes nothing | deterministic | confirmed | - | No scenario yet |

### FR-059 - Remove an added model

Source: [FR-059](../../spec/04-requirements/fr/FR-059.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/A2.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Only that added model goes | deterministic | confirmed | - | No scenario yet |
| AC-2 | Nothing changes at the provider | deterministic | confirmed | - | No scenario yet |
| AC-3 | A chat that selected the removed model | deterministic | confirmed | - | No scenario yet |
| AC-4 | Adding the model again | deterministic | confirmed | - | No scenario yet |

### FR-061 - Keep each provider ID to one provider configuration that never changes it

Source: [FR-061](../../spec/04-requirements/fr/FR-061.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/S2; UC-005/S3; UC-005/S4; UC-005/A1; UC-005/A9.

Referenced rules/qualities: [BR-008](../../spec/05-business-rules/BR-008.md).

Dependency review: GAP-07: custom API fixtures need an approved protocol. GAP-09: AC-7 and AC-8 need reserved provider IDs.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | A configured built-in provider is not offered again | deterministic | confirmed | - | No scenario yet |
| AC-2 | The provider ID in use is named | judged | confirmed | - | No scenario yet |
| AC-3 | A custom provider ID in use | deterministic | confirmed | - | No scenario yet |
| AC-4 | Two custom model APIs share an API protocol | deterministic | confirmed | - | No scenario yet |
| AC-5 | The provider ID does not change | deterministic | confirmed | - | No scenario yet |
| AC-6 | A deleted provider can be added again | deterministic | confirmed | - | No scenario yet |
| AC-7 | A custom model API cannot take a built-in provider ID | deterministic | confirmed | - | No scenario yet |
| AC-8 | The reserved provider ID is named | judged | confirmed | - | No scenario yet |

### FR-062 - Restore the default models after the user confirms

Source: [FR-062](../../spec/04-requirements/fr/FR-062.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/A13.

Referenced rules/qualities: [BR-005](../../spec/05-business-rules/BR-005.md).

Dependency review: GAP-08: AC-1 to AC-5 need release defaults for concrete fixtures. AC-6 uses a custom provider with no defaults as stated in its Given.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Nothing changes before the confirmation | deterministic | confirmed | - | No scenario yet |
| AC-2 | Cancelling keeps the added models | deterministic | confirmed | - | No scenario yet |
| AC-3 | Confirming restores the default models | deterministic | confirmed | - | No scenario yet |
| AC-4 | No chat gets another model | deterministic | confirmed | - | No scenario yet |
| AC-5 | The user is warned | judged | confirmed | - | No scenario yet |
| AC-6 | A provider with no default models | deterministic | confirmed | - | No scenario yet |

### FR-063 - Delete a provider configuration

Source: [FR-063](../../spec/04-requirements/fr/FR-063.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/A11.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | The provider configuration and its models go | deterministic | confirmed | - | No scenario yet |
| AC-2 | Nothing changes at the provider | deterministic | confirmed | - | No scenario yet |
| AC-3 | Chats and decks stay | deterministic | confirmed | - | No scenario yet |
| AC-4 | Adding the provider again starts a new provider configuration | deterministic | confirmed | - | No scenario yet |
| AC-5 | The user is told | judged | confirmed | - | No scenario yet |

### FR-064 - Keep a provider configuration that an active request uses

Source: [FR-064](../../spec/04-requirements/fr/FR-064.md). Statement: **confirmed**. Selected blocks citing this FR: UC-005/A12.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Not deleted while the system works | deterministic | confirmed | - | No scenario yet |
| AC-2 | Not deleted while the system waits for an answer | deterministic | confirmed | - | No scenario yet |
| AC-3 | The reason is given | judged | confirmed | - | No scenario yet |
| AC-4 | Deletion after the request ends | deterministic | confirmed | - | No scenario yet |
| AC-5 | Another provider configuration can be deleted | deterministic | confirmed | - | No scenario yet |

### FR-065 - Show that the selected model of a chat was removed

Source: [FR-065](../../spec/04-requirements/fr/FR-065.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/A41; UC-005/S5; UC-005/A4; UC-006/S3.

Referenced rules/qualities: [BR-005](../../spec/05-business-rules/BR-005.md).

Dependency review: GAP-08: AC-4 needs a concrete default-list fixture.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Back to the chat after a removal | deterministic | confirmed | - | No scenario yet |
| AC-2 | The user is told at once | judged | confirmed | - | No scenario yet |
| AC-3 | Reopening a chat after a deletion | deterministic | confirmed | - | No scenario yet |
| AC-4 | After a restore of default models | deterministic | confirmed | - | No scenario yet |
| AC-5 | The only selectable model is not chosen | deterministic | confirmed | - | No scenario yet |
| AC-6 | Choosing a model ends the state | deterministic | confirmed | - | No scenario yet |

### FR-066 - Use attached images and new images on slides

Source: [FR-066](../../spec/04-requirements/fr/FR-066.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A42; UC-002/A12.

Referenced rules/qualities: [NFR-007](../../spec/04-requirements/nfr/NFR-007.md), [NFR-009](../../spec/04-requirements/nfr/NFR-009.md).

Dependency review: GAP-15: image implementation and reproducible failure paths are execution dependencies; confirmed outcomes stay in scope.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Attached image on the slide the request names | deterministic | confirmed | TS-033 | Scenario defined |
| AC-2 | New image on request | deterministic | confirmed | - | No scenario yet |
| AC-3 | New image fits the request | judged | confirmed | - | No scenario yet |
| AC-4 | Request that rules out new images | deterministic | confirmed | - | No scenario yet |
| AC-5 | Making the image the user asked for fails | deterministic | confirmed | TS-033 | Scenario defined |
| AC-6 | No valid way to make the image the user asked for | judged | confirmed | TS-033 | Scenario defined |
| AC-7 | Unclear kind of image that changes the result | deterministic | confirmed | - | No scenario yet |
| AC-8 | The options name the two kinds of image | judged | confirmed | - | No scenario yet |
| AC-9 | An image the system chose to add is left out | deterministic | confirmed | - | No scenario yet |
| AC-10 | The closing message names the image not made | judged | confirmed | - | No scenario yet |
| AC-11 | The result cannot do without the image | deterministic | confirmed | TS-033 | Scenario defined |

### FR-067 - Say when material is used only in part

Source: [FR-067](../../spec/04-requirements/fr/FR-067.md). Statement: **confirmed**. Selected blocks citing this FR: UC-003/A43.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | File read in part | judged | confirmed | TS-034 | Scenario defined |
| AC-2 | Earlier material more than the work takes | judged | confirmed | TS-034 | Scenario defined |
| AC-3 | Missing part that changes the result | deterministic | confirmed | TS-034 | Scenario defined |
| AC-4 | The question asks for the missing part | judged | confirmed | TS-034 | Scenario defined |

### FR-068 - Keep the work going when the interface is reloaded or closed

Source: [FR-068](../../spec/04-requirements/fr/FR-068.md). Statement: **confirmed**. Selected blocks citing this FR: UC-001/A13; UC-003/A13.

Dependency review: GAP-23: no AC here explicitly checks reloading an idle, unconfirmed outline.

| AC | Acceptance condition | Check | Approval | Scenario IDs | Coverage |
|---|---|---|---|---|---|
| AC-1 | Reload while slides are built | deterministic | confirmed | TS-032 | Scenario defined |
| AC-2 | Closed and opened again | deterministic | confirmed | TS-032 | Scenario defined |
| AC-3 | A question still waits | deterministic | confirmed | TS-032 | Scenario defined |

## Business-rule value inventory

These are all seven resolved BRs referenced by selected blocks or their FRs. Values without an override inherit the confirmed rule status. Consult the source for exact values; this inventory supplies no limit. GAP-14 tracks unresolved BR markers separately.

### BR-001 - Attachments the system accepts

Source: [BR-001](../../spec/05-business-rules/BR-001.md). Referenced by: FR-017, UC-003/A3, UC-003/A8.

| Value | Meaning | Status | Dependency |
|---|---|---|---|
| V-1 | Accepted file types | confirmed | - |
| V-2 | Number of new attachments in one request | pending | GAP-04 |
| V-3 | Size of one attachment | pending | GAP-04 |

### BR-002 - Maximum request length

Source: [BR-002](../../spec/05-business-rules/BR-002.md). Referenced by: FR-015, UC-003/S1.

| Value | Meaning | Status | Dependency |
|---|---|---|---|
| V-1 | Maximum length of the request text | pending | GAP-05 |

### BR-003 - Default design system

Source: [BR-003](../../spec/05-business-rules/BR-003.md). Referenced by: FR-022, UC-001/S5.

| Value | Meaning | Status | Dependency |
|---|---|---|---|
| V-1 | Default design system | pending | GAP-06 |

### BR-004 - Chats kept as earlier work

Source: [BR-004](../../spec/05-business-rules/BR-004.md). Referenced by: FR-048, UC-006/S1.

| Value | Meaning | Status | Dependency |
|---|---|---|---|
| V-1 | Which chats are kept | confirmed | - |
| V-2 | How long chats are kept | confirmed | - |

### BR-005 - Providers, added models and selectable models

Source: [BR-005](../../spec/05-business-rules/BR-005.md). Referenced by: FR-039, FR-041, FR-046, FR-053, FR-055, FR-056, FR-058, FR-062, FR-065, UC-003/A17, UC-003/A27, UC-003/A40, UC-005/A13, UC-005/S2, UC-005/S3, UC-005/S4, UC-005/S5, UC-005/S6, UC-012/S2.

| Value | Meaning | Status | Dependency |
|---|---|---|---|
| V-1 | Built-in providers offered | confirmed | - |
| V-2 | Models the user can add | confirmed | - |
| V-3 | Selectable models | confirmed | - |
| V-4 | API protocols of a custom model API | pending | GAP-07 |
| V-5 | Default models of a built-in provider | pending | GAP-08 |
| V-6 | Provider ID of each built-in provider | pending | GAP-09 |

### BR-006 - What each provider needs for setup

Source: [BR-006](../../spec/05-business-rules/BR-006.md). Referenced by: FR-039, FR-041, FR-043, FR-045, UC-005/A1, UC-005/A5, UC-005/S2, UC-005/S3.

| Value | Meaning | Status | Dependency |
|---|---|---|---|
| V-1 | What each built-in provider needs | pending | GAP-10 |
| V-2 | What a custom model API needs | confirmed | GAP-07, GAP-11 |
| V-3 | Settings the user can change after saving | confirmed | GAP-10, GAP-11 |

### BR-008 - Provider IDs and display names of provider configurations

Source: [BR-008](../../spec/05-business-rules/BR-008.md). Referenced by: FR-039, FR-057, FR-061, UC-005/A10, UC-005/A11, UC-005/A9, UC-005/S2.

| Value | Meaning | Status | Dependency |
|---|---|---|---|
| V-1 | Provider configurations per provider ID | confirmed | - |
| V-2 | Valid display name | confirmed | - |
| V-3 | Provider IDs reserved for built-in providers | confirmed | GAP-09 (set members pending in BR-005) |

## NFR scope and measurement inventory

This register is separate from FR/AC scenario coverage. It records scope and approval, not executed measurements. Source Conditions, Measure, Method, Target and Met when must be read together in QA-01. A confirmed target can still depend on an environment or value that is not yet agreed.

### NFR-001 - Feedback after sending a request

Source: [NFR-001](../../spec/04-requirements/nfr/NFR-001.md). Statement: **proposed**. Scope origins: FR-012, UC-003/S2.

Dependencies: GAP-16, GAP-19.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Time to the first sign of work | pending | No official Pass/Fail: target not set |

### NFR-002 - Wait for the first slides

Source: [NFR-002](../../spec/04-requirements/nfr/NFR-002.md). Statement: **proposed**. Scope origins: UC-001/S5.

Dependencies: GAP-16, GAP-19.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Time to the first finished slide | pending | No official Pass/Fail: target not set |

### NFR-003 - Agent action boundary

Source: [NFR-003](../../spec/04-requirements/nfr/NFR-003.md). Statement: **confirmed**. Scope origins: UC-003/S3.

Dependencies: None identified in this inventory.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | No reach beyond the request | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-2 | Original files stay as they were | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |

### NFR-004 - Shown content does not run as code

Source: [NFR-004](../../spec/04-requirements/nfr/NFR-004.md). Statement: **confirmed**. Scope origins: FR-016, FR-023.

Dependencies: None identified in this inventory.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Content that holds code | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |

### NFR-005 - Access only from the computer that runs DeckAgent

Source: [NFR-005](../../spec/04-requirements/nfr/NFR-005.md). Statement: **confirmed**. Scope origins: V1 product-wide list.

Dependencies: None identified in this inventory.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Another device on the same network | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-2 | Another website in the same browser | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |

### NFR-006 - Key kept out of the work and its records

Source: [NFR-006](../../spec/04-requirements/nfr/NFR-006.md). Statement: **confirmed**. Scope origins: UC-003/S3.

Dependencies: GAP-20.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Not in what the model receives | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-2 | Sent only to its own base URL | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-3 | Not in data that DeckAgent writes | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |

### NFR-007 - Where user content goes

Source: [NFR-007](../../spec/04-requirements/nfr/NFR-007.md). Statement: **confirmed**. Scope origins: FR-066, UC-003/S3.

Dependencies: GAP-15 (no additional service is approved).

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | User content goes only to the provider | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-2 | Other connections are listed and carry no content | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |

### NFR-008 - Saved state after an unexpected end

Source: [NFR-008](../../spec/04-requirements/nfr/NFR-008.md). Statement: **confirmed**. Scope origins: FR-052.

Dependencies: GAP-22.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Chats and decks at their last saved state | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-2 | Model setup at its last saved state | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |

### NFR-009 - Slide display integrity

Source: [NFR-009](../../spec/04-requirements/nfr/NFR-009.md). Statement: **confirmed**. Scope origins: FR-023, FR-029, FR-066.

Dependencies: GAP-06, GAP-17, GAP-21.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Text inside the slide | pending | No official Pass/Fail: target not set |
| M-2 | No content hidden by other content | pending | No official Pass/Fail: target not set |
| M-3 | Resources show | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-4 | Characters of the languages checked first | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |

### NFR-010 - Robust intake of added files

Source: [NFR-010](../../spec/04-requirements/nfr/NFR-010.md). Statement: **confirmed**. Scope origins: FR-017.

Dependencies: GAP-04, GAP-17.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Hostile and extreme files | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-2 | Time to a final state | pending | No official Pass/Fail: target not set |

### NFR-011 - Stop takes effect soon

Source: [NFR-011](../../spec/04-requirements/nfr/NFR-011.md). Statement: **confirmed**. Scope origins: FR-018.

Dependencies: GAP-17, GAP-19.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Time to the sign of the stop | pending | No official Pass/Fail: target not set |

### NFR-012 - Wait for a change to the deck

Source: [NFR-012](../../spec/04-requirements/nfr/NFR-012.md). Statement: **confirmed**. Scope origins: FR-027.

Dependencies: GAP-17, GAP-19.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Change to one named slide | pending | No official Pass/Fail: target not set |
| M-2 | Change to the whole deck | pending | No official Pass/Fail: target not set |

### NFR-013 - Keyboard and screen reader use, slide text included

Source: [NFR-013](../../spec/04-requirements/nfr/NFR-013.md). Statement: **confirmed**. Scope origins: FR-023.

Dependencies: GAP-18.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Keyboard alone | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-2 | Screen reader | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-3 | Text of slides | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-4 | Conformance to a standard | pending | No official Pass/Fail: target not set |

### NFR-014 - Build from source and run on Windows

Source: [NFR-014](../../spec/04-requirements/nfr/NFR-014.md). Statement: **confirmed**. Scope origins: V1 product-wide list.

Dependencies: GAP-19.

| Measurement | Meaning | Target status | Planning disposition |
|---|---|---|---|
| M-1 | Build and start from source on Windows | confirmed | Confirmed target; campaign method in Test Plan; detailed measurement cases still needed |
| M-2 | Selected flows on Windows | proposed | No official Pass/Fail: target not approved |

Measurement totals: **19 confirmed**, **9 pending**, **1 proposed**. These counts do not imply complete NFR coverage.

## Inventory verification

- Enumerated every V1-selected step and alternative at the stated baseline, including four `Reqs: none` invocations through UC-003.
- Resolved all 66 real FR IDs, all 364 AC IDs and their check/approval fields. Kept UC-006/A4's unresolved marker separate.
- Recorded seven resolved BR dependencies and 14 in-scope NFRs, including the two product-wide entries.
- Listed unselected alternatives and use cases separately. Scenario mappings account only for confirmed ACs; no execution results are claimed.
- Checked local Markdown links and formatting. These checks validate inventory structure, not application behavior or full semantic coverage.
- Final document checks: 37 scenario IDs with required fields; 147 distinct confirmed ACs mapped, 215 without scenarios and 2 proposed-default ACs blocked. Checked each scenario's selected flow and referenced FR, all 364 source AC titles/check types/approval statuses, and 329 local Markdown links across the two deliverables.
- Reviewed scenario summaries against source preconditions and outcomes, including the distinction between no added model and no selected model, interface reload versus process exit, and confirmed versus proposed tone-preservation criteria. This is a planning review, not evidence that any application check passed.
