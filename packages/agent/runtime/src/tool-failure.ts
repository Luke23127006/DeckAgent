/** Only fixed, repository-authored diagnostics cross the tool exception boundary. */
export const TOOL_RECOVERY_TEXT = {
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
