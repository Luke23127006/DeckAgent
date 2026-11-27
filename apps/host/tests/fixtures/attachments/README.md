# Controlled attachment fixtures

These files contain synthetic text, flat-color images and generated documents, with no private material. The [survey harness](../../../docs/research/evidence/deckagent/attachment-parser-survey.mjs) and its [locked generators](../../../docs/research/evidence/deckagent/attachment-parser-survey-package-lock.json) create them. The [raw survey](../../../docs/research/evidence/deckagent/attachment-parser-survey-results.json) records fixture hashes.

`generated.docx` has Vietnamese text and a two-cell table. `generated.pptx` has two slides. `plain.pdf` has three text pages; `scan.pdf` contains an image with no text layer. `sample.png` is a 1920 × 1080 flat-color image. `safe.zip` has TXT and Markdown entries, while `bad-crc.zip` has deliberately changed CRC fields. Runtime-generated adversarial archives use the separate [ZIP fixture builder](../attachment-fixtures.mjs); it is never imported by product code.

`over-pages.pdf` has 201 text pages. `over-pixels.png` has 16,004,000 pixels. `sample.jpg` is the flat-color JPEG counterpart. `encrypted.pdf` contains a synthetic encryption dictionary, and `strict-encrypted.zip` contains encrypted fixture text. These samples exercise rejection paths; they are not a real-document or encryption-interoperability corpus.
