# Writing documents

These rules apply to every Markdown file in the repository, and to every GitHub issue, pull request and comment body, whoever writes it: a person, an agent or a skill. A folder can add its own rules, such as `docs/spec/_STYLE.md` for the spec and `docs/research/_STYLE.md` for research notes.

## Two kinds of document

1. **A living document says what is true now.** Edit it in place. It holds no change log, no "changed vs", "merged from", "renamed from" or "retired", and no `updated` date. Living documents are the spec (`docs/spec/`), `docs/development/`, `docs/agents/`, `docs/tooling/`, `README.md`, every `AGENTS.md`, `CLAUDE.md`, `.agents/skills/` and `.github/`.
2. **A record keeps its history, because the history is its content.** Records are decision records (`docs/adr/`), research notes (`docs/research/`; add a new item rather than rewrite an old one) and meeting notes.
3. **The history of a living document goes in the commit message**, and in `CHANGELOG.md` when a reader of the repository needs it.

## Content

4. **Write the outcome, not the conversation.** Write only what the reader of the document acts on. A decision is written as its result, as a current fact, or as `pending` while it is open. Never write who decided or when ("the PO confirmed …", "approved on …"). Never keep a section that only records a review, an exchange or a check that changed nothing. That trail lives in the issue and in git; link the issue when a reader needs the reason. Exceptions: meeting notes record a meeting, and a date that is data stays (the date of a research observation, of an eval run, of a decision record).
5. **A status states work that happened**, never what is merely allowed.
6. **Link, don't restate.** One fact lives in one home. A plan cites requirement IDs and never copies the requirement text.
7. **Keep the section order of the template.** A template fixes its headings; a document made from it keeps them, in that order.
8. **Keep a document to about one page.** Split it or link out when it grows. A spec file follows the length of the behavior it describes.

## Form

9. **No hard wrap.** Write each paragraph, list item or comment sentence on one line, however long. Break a line only where the structure needs it: a new paragraph, list item, table row, heading or code line. Readers use soft wrap (for example VS Code word wrap); a break in the middle of a sentence makes the text harder to read, and GitHub shows it as a real line break.
10. **Every cross-reference is a clickable Markdown link**, never a bare `#N` or a plain path. The exception is a GitHub issue or pull request body, where `#N` links by itself. Derive the base URL from `git remote get-url origin`.

    | Reference | Format |
    |---|---|
    | An issue, from a file in the repository | `[#N](https://github.com/{owner}/{repo}/issues/N)` |
    | A file, from an issue body | `[docs/research/topic.md](https://github.com/{owner}/{repo}/blob/main/docs/research/topic.md)` |
    | An issue, from an issue body | `#N` |

11. **Never leave a bare ID.** Say what the item is in words first, and put the ID in parentheses or brackets after it: "the rule for workspace names (BR-020)", not "BR-020". A spec citation after the words it supports, such as `[BR-018]`, follows this rule.
