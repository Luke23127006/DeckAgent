---
name: commit
description: Generate and create git commits with clear, conventional commit messages. Use when the user wants to commit changes, save work, or asks for a commit message.
allowed-tools: Bash(git:*), Read, Grep, Edit
user-invocable: true
---

# Git Commit Skill

## Overview

Create **well-structured git commits** with **conventional commit messages** that **clearly describe the changes**.

## Instructions

When committing changes, follow these steps:

1. **Check the current state** - Run these commands in parallel:
   - `git status` to see staged and unstaged changes
   - `git diff --cached` to see what's staged
   - `git diff` to see unstaged changes
   - `git log --oneline -5` to see recent commit style

2. **Stage changes if needed** - If there are unstaged changes the user wants to commit, stage them with `git add`

3. **Analyze the changes** - Review what's being committed:
   - What files are affected?
   - What's the nature of the change (fix, feature, refactor, docs, etc.)?
   - What's the primary purpose?

4. **Update CHANGELOG.md** - Keep the file **under 50 lines**:
   - Read `CHANGELOG.md`. If there is no `## [Unreleased]` section, create one at the top, after the header.
   - Remove entries that no longer have value **before** you add the new entry. The file states what a reader needs now; git keeps the history. Remove an entry when any of these is true:
     - a report, an ADR or a file in `docs/` already gives the detail
     - the entry records a plan step, a task number or a process
     - a later entry makes the change unreachable or irrelevant
     - the entry is older than the current build and no reader acts on it
   - Merge entries on the same subject into one bullet.
   - Add the new entry under the matching category: `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Security`.
   - Each entry is one bullet on one line. Do not use sub-bullets. When an entry is still valuable but long, keep its subject and its effect only.
   - Count the lines (`wc -l CHANGELOG.md`, or `(Get-Content CHANGELOG.md).Count` in PowerShell). If the count is 50 or more, remove more entries from the lowest value up until the count is 49 or less. The newest entry stays.
   - Stage the file with `git add CHANGELOG.md`.

5. **Generate a commit message** following this format:
   ```
   <type>: <short description>

   <optional body explaining what and why>
   ```
   **Never add a `Co-Authored-By` trailer** or **any attribution to Claude or any other AI agent** or model (AGENTS.md "GitHub conventions"). Types:
   - `feat`: New feature
   - `fix`: Bug fix
   - `refactor`: Code restructuring without behavior change
   - `docs`: Documentation changes
   - `style`: Formatting, whitespace
   - `test`: Adding or updating tests
   - `chore`: Maintenance tasks, dependencies
6. **Create the commit** using a HEREDOC for proper formatting:
   ```bash
   git commit -m "$(cat <<'EOF'
   type: short description
   Optional longer description.
   EOF
   )"
   ```

7. **Verify success** - Run `git status` to confirm the commit was created

## Guidelines

- **`CHANGELOG.md` stays under 50 lines.** Remove low-value entries instead of letting the file grow; a new entry earns its line by replacing one that no longer matters
- Keep the **first line under 72 characters**
- Use **imperative mood** ("add feature" not "added feature")
- Focus on **WHY** the change was made, **not just WHAT** changed
- **Don't include file lists** in the message - git tracks that
- **Match the style of recent commits** in the repo when possible

## Safety

- **Never use `--force`** or destructive commands
- **Never skip hooks** with `--no-verify` unless explicitly asked
- **Never amend commits that have been pushed**
- If there are **no changes to commit**, **inform the user**
