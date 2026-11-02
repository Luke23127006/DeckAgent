# Provider/session manual acceptance

Status: Gemini smoke PASS, confirmed by the owner on 2 November 2026.
The confirmation refers to the seven-case Gemini smoke checklist supplied in chat.
No itemized results, browser version or exact candidate SHA were supplied.
The extended cases below are not all covered by that smoke report.
Use Gemini for the available live checks. Other protocol families remain blocked.

## Start

Run from the repository root:

```powershell
pnpm.cmd start:opencode --fresh
```

This creates a separate profile without deleting previous profiles. Keep the printed profile path.
Credentials come from the local environment or `.env`. Never copy keys or the authenticated browser URL into results.
For persistence, stop Host and use the printed Node, OpenCode and profile paths in this command:

```powershell
& '<printed Node path>' --env-file-if-exists=.env --use-system-ca apps/local-web/lib/cli.js --provider google --model gemini-3.1-flash-lite --data-dir '<printed Test profile path>' --opencode-executable '<printed OpenCode path>'
```

Do not use `--fresh` again for that check.

## Cases

| Case | Action | Expected result |
|---|---|---|
| Saved selection | Select the configured Gemini model. Reload the page, then reopen Settings. | The same provider/model remains selected. Saved keys are never displayed. |
| Unknown metadata | Add a model ID without context/output metadata. Save and reopen Settings. Do not send work to an invented ID. | Missing metadata stays unset; the app does not invent limits. |
| Invalid save | On that model, set context window to 10 and maximum output to 20. Save. | A validation error appears. The edited values remain in the form. Reopening Settings shows the previously saved configuration. |
| Draft | Type `KEEP_TASK002_DRAFT` in Chat. Open Settings, return, then reload. | The draft and selected model remain. No request starts. |
| Legacy context | Send `Hãy nhớ mã CONTEXT_42. Chỉ trả lời: đã nhớ.` After completion, restart Host with the same profile and reopen the Chat. Send `Mã tôi vừa yêu cầu bạn nhớ là gì?` | Old messages remain; the reply includes CONTEXT_42. Reopening alone never starts inference. |
| Selection snapshot | With two valid configured model IDs, start work on the first and select the second while work runs. | The active request retains the first selection; the following request uses the second. Report BLOCKED if a second valid model is unavailable. |
| Reasoning choice | With a qualified model and confirmed reasoning metadata, select an effort, reload and send work. | Saved effort remains selected and maps to the configured API value. Responses live verification is BLOCKED without its credential/model pair. |

The automated compatibility browser test separately verifies unsupported-option rejection, retained draft,
saved selection after reload, and no admitted or replayed request. It uses a test-owned fixture profile.
Do not edit a user database to manufacture that scenario.

## Record the result

For each case, record PASS, FAIL or BLOCKED, the browser version, candidate commit plus dirty-source hashes,
and a short observation. Sanitized screenshots are optional. Never include credentials or private native runtime files.

Record any failures before retrying. Missing credentials, unknown model access and skipped tests are not PASS.
G-002 remains NOT VERIFIED until all required live families and manual cases have evidence.
