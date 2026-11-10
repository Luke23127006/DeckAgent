# Research notes: style guide

Read this file before you write or edit a research note in `docs/research/`. Also read the existing notes in the target file, and match their voice before you add more. The rules in `docs/development/writing-documents.md` apply as well.

## Files

1. Keep one file per product, named for the product (`open-design.md`, `opencode.md`). A question that spans several products is split: each product's observations go to that product's file. Never start a second file for a product; add numbered items to its file.
2. Put screenshots, recordings and sample files under `evidence/<product>/`, and link them from the product file. A file under `evidence/` is never a note.
3. Open the file with one paragraph: what the product is, the source (URL, commit or pages read), and the method (product run, docs read, source read). Give each item the date it was checked when it differs from the opening paragraph.

## Structure

4. Use a numbered list as the main structure. Each number presents one idea or one question. Continue the numbering already in the file.
5. Use bullets inside a numbered item to list details. Use a table only to compare items against the same criteria, for example results across several URLs. Use a code block for commands or short response snippets.
6. Write each item on one line. Use no bold, no italics and no sub-headings in ordinary text. Use inline code for URLs, commands, file names, headers and technical values.

## Content

7. Write what was observed and what it means, never the conversation around it. A note holds no "the PO asked", no review or ticket that prompted a check, no decision ID, no plan step and no "compacted from". The spec cites a research note; a research note does not cite the spec.
8. Write what was not found or not checked as its own line ("Not found: …", "Not checked: …"). A gap in coverage is an observation too.

## Language

9. Write clear, short, direct English. Keep familiar technical terms as they are (request, response, headers, fetch, backend, hosting, retry).
10. When you introduce a new term, explain it at once in terms of concrete behavior. Example: "Retry means sending the request again after a failure." Avoid vague phrases such as "handle appropriately" or "ensure it works reliably".

## Reasoning

11. Explain in this order: the problem to check, what was tried, what was observed, and what it means for the project.
12. Lead with a short question when it helps the reader see what needs understanding. Example: "Does HTTP 200 mean the chapter was fetched?" Then explain right after it.
13. Use `=>` to connect an observation to its explanation, consequence or conclusion. Use it only when the relation is clear, not after every sentence.
14. Tie evidence to the claim in the same item, and keep these three apart:
   - Observation: a measured fact (status, header, response body, what the screen showed).
   - Inference: what that result might indicate.
   - Proposal: what the project should do, based on the result.
15. Keep the phrasing close to the existing notes, but fix a term that is technically wrong. Do not copy an imprecise claim just to match the style.
