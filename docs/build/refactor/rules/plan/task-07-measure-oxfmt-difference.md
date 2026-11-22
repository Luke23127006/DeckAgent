# Task 7: Measure the difference between oxfmt and Biome

Read this file to learn the steps of Task 7, which counts the files that oxfmt formats in a different way than Biome.

This task is an investigation. It changes no file in the repository.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `biome.json`

**Files:**
- None.

**Interfaces:**
- Uses: nothing.
- Produces: the report. The next revision of this plan uses the report.

**STOP when:**
- A command fails because the network is not available.
- The output of a command does not have the form that `Expected` gives.
- The same step failed two times.

**Forbidden:**
- Change, create or delete a file in the repository. Write temporary files only below `/tmp/refactor-01/`.
- Run `oxfmt` or `biome format` with `--write`.
- Add a dependency to `package.json`.
- Commit or push.

- [x] **Step 1: Write the oxfmt configuration**

The configuration copies the formatter options of `biome.json`. The working tree uses CRLF line endings on Windows, so the configuration sets `endOfLine` to `crlf`.

Run:

```bash
mkdir -p /tmp/refactor-01 && cat > /tmp/refactor-01/oxfmtrc-crlf.json <<'EOF'
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "all",
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "quoteProps": "as-needed",
  "endOfLine": "crlf"
}
EOF
```

Expected: no output. The file `/tmp/refactor-01/oxfmtrc-crlf.json` exists.

- [x] **Step 2: List the files that Biome would change**

Run: `corepack pnpm@11.28.5 exec biome format --line-ending=crlf --max-diagnostics=none > /tmp/refactor-01/biome-format.txt 2>&1; grep -E ' format ━' /tmp/refactor-01/biome-format.txt | cut -d' ' -f1 | sed 's#[\]#/#g' | sort -u > /tmp/refactor-01/biome-files.txt; wc -l < /tmp/refactor-01/biome-files.txt; grep -E 'Checked|Found' /tmp/refactor-01/biome-format.txt`
Expected: a number, then a line `Checked <N> files` and a line `Found <M> errors`. Copy the output into the report.

- [x] **Step 3: List the files that oxfmt would change**

Run: `npx --yes oxfmt@0.79.0 -c /tmp/refactor-01/oxfmtrc-crlf.json --list-different 'apps/**/*.{ts,js,mjs,cjs}' 'packages/**/*.{ts,js,mjs,cjs}' 'scripts/**/*.{ts,js,mjs,cjs}' 'tests/**/*.{ts,js,mjs,cjs}' | sort -u > /tmp/refactor-01/oxfmt-files.txt; wc -l < /tmp/refactor-01/oxfmt-files.txt`
Expected: a number. Copy the number into the report.

- [x] **Step 4: Compare the two lists**

Run: `echo "both: $(comm -12 /tmp/refactor-01/biome-files.txt /tmp/refactor-01/oxfmt-files.txt | wc -l)"; echo "only biome: $(comm -23 /tmp/refactor-01/biome-files.txt /tmp/refactor-01/oxfmt-files.txt | wc -l)"; echo "only oxfmt: $(comm -13 /tmp/refactor-01/biome-files.txt /tmp/refactor-01/oxfmt-files.txt | wc -l)"`
Expected: three lines, `both: <N>`, `only biome: <N>` and `only oxfmt: <N>`. Copy the output into the report.

Run: `for f in $(comm -13 /tmp/refactor-01/biome-files.txt /tmp/refactor-01/oxfmt-files.txt | head -n 3); do echo "== $f"; npx --yes oxfmt@0.79.0 -c /tmp/refactor-01/oxfmtrc-crlf.json --stdin-filepath "$f" < "$f" | diff "$f" - | head -n 20; done`
Expected: up to three blocks. Each block starts with `== <path>` and shows up to 20 lines of `diff` output. Copy the output into the report.

- [x] **Step 5: Report and stop**

Send this report:
- The output of Step 2, Step 3 and Step 4.
- What the commands do not prove: the lists show only the files that differ, not the number of changed lines. The three sample diffs are not a sample of all differences. The CRLF setting matches the working tree on this computer, and a Linux CI checkout may use LF. The result does not show how Biome and oxfmt change after a new release.
