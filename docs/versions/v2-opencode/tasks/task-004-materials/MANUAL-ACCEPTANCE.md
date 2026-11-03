# Material input: manual acceptance

Status: owner-confirmed smoke cases 1–4 PASS on 3 November 2026. Reference/permission case 5 needs retest;
remaining manual cases are unconfirmed. No exact manual SHA/browser/model details were supplied. G-004 remains NOT VERIFIED.
Use an isolated profile and disposable source files. Never use real private documents for negative tests.

```powershell
pnpm.cmd start:opencode --fresh --material-max-bytes 1048576 --material-max-count 3
```

These are explicit smoke-test bounds: 1 MiB/file, three new attachments/request. They are not product defaults.
The launcher prints the profile path. Restart with `--data-dir "<previous Test profile path>"` and the same bounds.
Omitting `--fresh` alone uses the default profile; it does not reopen the last fresh profile.
For image cases, use protocol Gemini and add `image` to the selected model's input modalities in Settings.
Unknown capabilities, other protocols and the legacy backend refuse image requests; no model is substituted.

| Case | Action | Expected result |
| --- | --- | --- |
| Source facts | Attach a small TXT/MD/PDF/DOCX/PPTX containing a unique fact not included in the prompt. Ask for exactly two slides in Vietnamese, then English in another Chat. | Outline uses actual source facts, waits for confirmation, then publishes exactly two slides |
| Attachment-only | Attach ready `notes.txt`, leave request text empty and Send | Filename appears in conversation; request can read the supplied material |
| Rejected input | Attach a damaged PDF/PNG or a protected PDF | Visible reason; draft stays; Send is blocked until removal |
| Interrupted upload | Reload while a file is still being prepared | File remains as an interrupted/rejected placeholder; it is not silently discarded or marked ready |
| Draft isolation | Prepare attachments and text, switch Chat, then return and reload | IDs, preparation state and text stay in their own Chat; file bytes are not kept in tab storage |
| Reference | In a disposable project folder, name `notes.md` without sending | Reference shown separately; no inference or file-content read starts |
| Approval | With Provided Materials Only, send that reference | Exact file approval required; Deny prevents content read; naming did not grant permission |
| Folder | Name a folder in Workspace Access; request its materials | Direct names only at first; reading an exact child uses the same file boundary. Provided Materials Only asks for an exact file, never grants the whole folder |
| Changed source | Remove/replace a named file or repoint/remove its workspace, then send | Reference becomes unavailable; draft stays; no same-name substitution |
| Vision | Upload PNG/JPEG with a visible fact not in its filename or prompt; ask what it shows | Declared image-capable Gemini receives and interprets the supplied images, or reports an explicit model limitation |
| Restart | Reopen the same profile and Chat after Host restart | Sent labels/history and attachments remain; no inference or publication replays |
| Stop | Stop a request while reading/parsing material | Request drains and ends cancelled; no new tool or slide revision appears after Stop completes |

Compare source hashes and unrelated Chat histories/deck revisions. Confirming visible slides alone does not prove byte/revision equality.
Record browser/version, model/protocol, commit/dirty source hashes, date and per-case PASS/FAIL/NOT RUN.

Repeatable automated commands:

```powershell
pnpm.cmd test:materials
pnpm.cmd test:materials:browser
pnpm.cmd test:materials:cli
pnpm.cmd test:materials:live
node scripts/benchmark-materials.mjs --output .local-only/material-measurements.json
```

The live command uses environment/optional `.env` credentials and incurs provider usage. Never send keys in chat.
Fixtures and a successful smoke do not approve production attachment limits or close G-003.
