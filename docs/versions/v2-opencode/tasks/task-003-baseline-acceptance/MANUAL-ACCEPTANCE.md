# Inherited behavior on OpenCode: manual acceptance

Status: owner-confirmed six-case smoke PASS on 2 November 2026.
The report covers outline before confirmation, two-slide generation, slide-two-only edit,
Chat isolation, Stop, and reload/restart from the chat checklist supplied to the owner.
No itemized results, browser version, exact manual SHA, selected model ID or API revision comparisons were supplied.
The broader matrix below is not accepted in full from that report. Historical results remain attributed separately.
Entry gate G-002 is still NOT VERIFIED. These checks can collect bounded evidence without closing G-003.

Start `pnpm.cmd start:opencode --fresh`. Keep the printed profile path for restart; do not use `--fresh` again for that profile.
Use disposable project files and an external text canary. Never select real private data for a permission test.
Record commit plus dirty source hashes, browser/version, Windows version, CLI hash, model/protocol, tester and date.

| Case | Action | Required observation |
| --- | --- | --- |
| Workspace identity | Add a disposable folder, create two Chats, remove the workspace after both become idle | Original files are unchanged; both histories remain readable under Ungrouped Chats |
| Missing source | Reopen after renaming the test project folder | Source reads fail clearly; saved history and slides remain readable |
| Clarification, Vietnamese | Ask `Tạo bài thuyết trình`, answer the question after reloading | Same pending question and request; unsent draft is kept; no slide exists before confirmation |
| Clarification, English | Ask an incomplete presentation request in a new Chat | Missing essentials are asked; supplying them proposes an outline |
| Confirmation | Request exactly two recycling slides without images or statistics; confirm the current outline | Outline first, no early slides, then exactly two published slides |
| Scoped edit | Ask `Chỉ sửa slide 2: hiển thị dòng chữ TEST_SLIDE_2.` | Slide 2 changes; slide 1 HTML and revision stay byte-for-byte equal through the API |
| Ambiguous scope | Ask `Make it better` | Clarification before any mutation; no revision changes |
| Existing scope limit | Use the earlier long edit prompt containing `thêm` and `không` | Record the inherited conservative refusal; do not claim this wording is supported |
| Permission once / deny | Read an external canary in separate new Chats; allow once, then deny another request | Exact target shown; once does not persist; denied content never appears in tool results |
| Continuing scope | Allow the exact external canary for one Chat; restart the same profile; read again | Saved grant belongs to that Chat only; another Chat still asks |
| Revoke | Revoke that grant, then send a new read | A new approval is required; previous results in history do not grant permission |
| Approval reload / stale reply | Reload while waiting; answer from another Chat or an older approval version | Original approval stays scoped; wrong or stale answer is rejected |
| Stop in approval | Stop the waiting read, then try an old approval response | Request ends cancelled; no read starts; old response cannot grant access |
| Concurrent Chats | Start work in two Chats; navigate and Stop only one | The other continues; drafts, approvals, activities and output remain separate |
| Stop in tool/publication | Stop during generation; capture revisions before Stop and after drain | Committed slides stay; no new tool starts or revision changes after Stop completes |
| Restart / crash | In a disposable profile, interrupt Host during approval and separately during work; restart | Interrupted records remain unconfirmed; no automatic inference, approval or publication replay |
| Reopen | Reload/restart and reopen the two-slide Chat | Saved outline/history/selection restored; no new inference starts |

For every mutation check, compare source hashes, unrelated Chat snapshots and non-target HTML/revisions.
Screenshots alone prove visible content, not revision, file or request identity.
Do not kill unrelated processes when testing interruption. Keep the old backend as the rollback path.

Report PASS / FAIL / NOT RUN per case. Model variation or provider failure is a recorded failed attempt, not acceptance.
Full G-003 also needs its dependency gates and the remaining automated interruption/publication cases in the handoff.
