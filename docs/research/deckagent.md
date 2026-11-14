# DeckAgent attachment parsing

DeckAgent at [the source-tool baseline](https://github.com/Luke23127006/DeckAgent/commit/9b75129) was inspected on 13-11-2026. The [survey harness](evidence/deckagent/attachment-parser-survey.mjs) generated controlled files and ran parser candidates in separate Node 22.19.0 processes on Windows 10.0.26300, AMD Ryzen 7 7435HS. The [raw measurements](evidence/deckagent/attachment-parser-survey-results.json), [dependency manifest](evidence/deckagent/attachment-parser-survey-package.json) and [dependency lock](evidence/deckagent/attachment-parser-survey-package-lock.json) preserve this run. This is an extraction experiment, not product admission or a security certification.

1. The run checked 47 cases three times each. All 141 outcomes matched the assertions. Some assertions deliberately record unsafe acceptance by a library; this count does not mean every archive was rejected safely. Earlier harness runs exposed error-mapping mistakes, which were corrected before the recorded run.

2. TXT and MD retained Vietnamese text, emoji and line locations. Strict UTF-8 decoding rejected malformed bytes; a separate check rejected NUL-containing text. A 20 MiB ASCII input decoded in 21.71–22.99 ms with 80 MiB peak child RSS. Other character encodings were not tested.

3. The measurements below include parser import and extraction, but exclude file reading and child startup. Peak RSS is the whole child process, not extra memory attributable to a file. Files are synthetic; page count alone does not predict PDF cost.

   | Controlled input | Time across three runs | Maximum peak RSS |
   | --- | --- | --- |
   | Three-page text PDF | 246.77–255.46 ms | 82.55 MiB |
   | 200-page text PDF, 42,795 bytes | 336.42–411.65 ms | 88.91 MiB |
   | Generated DOCX with Vietnamese text and table cells | 31.48–34.27 ms | 52.86 MiB |
   | Generated two-slide PPTX | 22.97–23.73 ms | 42.64 MiB |
   | 16-megapixel solid PNG | 113.78–120.29 ms | 108.87 MiB |
   | 16-megapixel noise JPEG, 11,399,275 bytes | 268.88–273.50 ms | 128.52 MiB |
   | ZIP expanding to exactly 64 MiB through strict reader | 292.77–308.07 ms | 148.12 MiB |

4. PDF.js 6.5.438 returned text by page with `getTextContent`. The image-only PDF returned empty text, not OCR. A malformed PDF and a synthetic encryption dictionary entered the invalid-file and password-required paths. The trial wrapper rejected 201 pages before extraction. No PDF images were rendered. The [PDF.js API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html) describes text extraction separately from rendering.

5. The DOCX/PPTX prototype used fflate 0.8.3 and fast-xml-parser 5.12.0 to read XML text runs. It read generated Word table cells and PowerPoint slide text. DTD declarations were rejected before XML parsing. It did not reconstruct layout, page numbers, merged cells, headers, footers, notes, chart meaning or embedded images. Sorting slide filenames is a prototype shortcut; product extraction needs presentation relationships to retain the actual slide order.

6. Sharp 0.35.5 decoded PNG/JPEG and made previews no larger than 1,600 pixels per side. The 16,000,000-pixel input passed, the 16,004,000-pixel input failed, and truncated PNG/JPEG files failed with `failOn: warning`. This proves image decoding and resizing for these samples, not OCR or model vision. The [constructor options](https://sharp.pixelplumbing.com/api-constructor/) document pixel limits and decode failures.

7. The fflate streaming path accepted both an archive with changed CRC fields and one with its central directory removed. The wrapper stopped traversal, too many entries, large declared entries and excessive emitted bytes, but did not add integrity validation. Library streaming alone was insufficient for the intended admission policy. The [pinned source](https://github.com/101arrowz/fflate/blob/v0.8.3/src/index.ts) is the reference for this experiment.

8. Zip.js 2.24.0 with strictness and signature checks rejected the same CRC and missing-directory samples. A forged uncompressed size also failed. The trial wrapper rejected encrypted archives, symlinks, over 200 entries, over 16 MiB per entry and over 64 MiB emitted bytes. Exactly 64 MiB passed. A nested ZIP was only listed by the exploratory reader, not recursively read. These checks do not cover every ZIP feature. The [entry options](https://gildas-lormeau.github.io/zip.js/api/interfaces/EntryGetDataOptions.html) distinguish CRC, metadata and cancellation checks.

9. A pre-aborted signal and cancellation during a strict ZIP write both rejected. Killing a separate child stuck in synchronous work took 4.59–5.56 ms after its ready message. This supports isolating parsers from the Host event loop. `--max-old-space-size=256` limits V8 old space, not total RSS or native image allocations; the harness's 30-second watchdog was configured but no sample reached it.

10. The existing Host tool result is text-only. Image decoding does not establish an image path through MCP, OpenCode and the selected model. No real provider, OCR engine, multilingual PDF font corpus, complex Office corpus, upload/concurrency flow, archive fuzzing or OS memory sandbox was checked. The input count and proposed production thresholds still need a product decision and end-to-end tests.

11. To repeat the run, copy the saved manifest and lock to a separate temporary directory as `package.json` and `package-lock.json`, run `npm ci --ignore-scripts --no-audit --no-fund` there, then run `node docs/research/evidence/deckagent/attachment-parser-survey.mjs <temporary-directory>` from the repository with Node 22.19.0. It writes generated fixtures and `results.json` into that temporary directory. No parser dependency is added to the application.
