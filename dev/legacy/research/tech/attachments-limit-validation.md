# Attachment limit validation

## Purpose

Choose safe numeric attachment limits without changing the accepted file types of the ideal product.

## Trial values (not approved product limits)

- Trial attachment count: 10 new attachments in one request.
- Trial file size: 20 MiB per file.
- Accepted types to test: TXT, MD, PDF, DOCX, PNG, JPEG and PPTX.
- A project-folder reference is not an attachment. Its read limit requires a separate safety measurement.

## Required evidence

- Test an individual file just below, at and just above the trial size.
- Test 9, 10 and 11 attachments in one request.
- Test every accepted type, including a valid PPTX.
- Test invalid, protected, damaged and decompression-heavy documents.
- Measure preparation, parsing, memory use and failure behavior on supported hardware.
- Verify that a rejected file keeps the draft request intact.
- Verify that reference reading checks resources at the time of use.

## Result

Not run. No numeric limit is approved by this document.

## Next decision

After technical evidence exists, propose exact values for BR-001 V-2 and V-3. Put any separate read-resource limits in their own appropriate rule or technical limit record.
