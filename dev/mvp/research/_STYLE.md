# Research notes — style guide

**Read this file before writing** or editing any file in `dev/mvp/research/`. Also **read the existing notes** in the target file to **match its voice** before adding more.

## Structure

1. Use a **numbered list as the main structure**. Each number presents **one idea or one question**. **Continue the numbering** already in the file.

2. Use **bullets inside a numbered item** to list details. Use a **table only to compare** against the same criteria (e.g. results across several URLs). Use a **code block** for commands or short response snippets.

3. Write each item **on one line** and **bold its keywords** (AGENTS.md "Writing Markdown"). **No italics** and **no sub-headings** in ordinary text. **Keep existing headings** and metadata. Use **inline code** for URLs, commands, file names, headers, or technical values.

## Language

4. Write **clear, short, direct English**. **Keep familiar technical terms** as they are (request, response, headers, fetch, backend, hosting, retry, ...).

5. When you **introduce a new term**, **explain it immediately** in terms of **concrete behavior**. Example: "**Retry** means **sending the request again** after a failure." **Avoid vague phrasing** like "handle appropriately" or "ensure it works reliably".

## Reasoning

6. Explain **in order**: the **problem** to check → what was **tried** → what was **observed** → what it **means for the project**.

7. Use a **short question** to lead into what needs understanding, when it fits. Example: "Does **HTTP 200** mean the **chapter was fetched**?" — then explain right after.

8. Use `=>` to connect an **observation** to its **explanation, consequence, or conclusion**. Use it **only when the relationship is clear**, not after every sentence.

9. **Tie evidence to the claim** in the same item. Distinguish clearly:
   - **Observation:** a **measured fact** (status, header, response body).
   - **Inference:** what that result **might indicate**.
   - **Proposal:** what the project **should do** based on the result.

10. **Keep the phrasing close** to the existing notes, but **fix a term** if it is **technically wrong**. **Do not copy an imprecise claim** just to match the style.
