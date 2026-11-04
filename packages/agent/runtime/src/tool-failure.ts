/** Only fixed, repository-authored diagnostics cross the tool exception boundary. */
export const TOOL_RECOVERY_TEXT = {
  SLIDE_EDIT_INVALID: 'The structured slide edit is invalid. Read the current slide editor metadata; use its exact baseHash, nodeId and expectedRevision, plain text and supported numeric/layout fields only. No edit was saved.',
  SLIDE_EDIT_UNSUPPORTED: 'This HTML block cannot be patched safely. Preserve the saved slide. Select another supported plain-text block or explain the limitation; never silently convert it.',
  MATERIAL_UNAVAILABLE: 'This material is unavailable or changed since it was selected. No replacement content was read. Ask the user to select it again; never infer its contents or bypass the Host permission boundary.',
  MATERIAL_READ_LIMIT: 'The material exceeds an extraction resource limit or cannot be read safely. Explain the limitation and ask for a smaller readable source. Do not claim full extraction.',
  PERMISSION_DENIED: 'The user refused this file read. The file was not read. Do not ask for or retry the same refused access in this request. Continue using allowed material and explain any remaining limitation.',
  PERMISSION_BOUNDARY: 'This target is private application or Chat data, or an unsafe linked path. It cannot be accessed by this request and no approval can grant access. Use material explicitly provided to this Chat instead.',
  SLIDE_UNSAFE_HTML: 'Slide HTML was rejected. Do not use meta (including charset or viewport), script, iframe, frame, frameset, object, embed, base, link, form, a or area tags; no src/href/action/formaction/srcdoc or event-handler attributes. Create a new draft path with corrected static HTML/CSS and publish that new path. Do not repeat the rejected draft.',
  SLIDE_SCOPE_DENIED: 'This slide is outside the Host-authorized request scope. Do not publish it or broaden the scope.',
  SLIDE_REVISION_CONFLICT: 'The slide revision or publication receipt changed. Read the current slide before another attempt; do not repeat conflicting publication arguments.',
  SLIDE_IDENTITY_INVALID: 'The outline or slide does not match the confirmed deck. Use the Host-provided outline and slide IDs; do not invent IDs.',
} as const

/** Tools opt into a closed code set; no caller-authored message is ever forwarded. */
export class ToolFailure extends Error {
  constructor(readonly code: keyof typeof TOOL_RECOVERY_TEXT) {
    super('Tool could not complete')
  }
}
