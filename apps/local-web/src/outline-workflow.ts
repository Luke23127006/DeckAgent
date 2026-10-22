import type { AgentRequest } from '@deckagent/host-api'
import type { DeckSnapshot, OutlineProposal, OutlineSnapshot } from '@deckagent/deck'

/** Conservative, whole-message commands only; positive text plus a revision never confirms. */
export function outlineCommand(input: string): 'confirm' | 'cancel' | undefined {
  const text = input.trim().replace(/[.!。]+$/, '').trim().toLocaleLowerCase().normalize('NFC')
  if (['confirm', 'confirm outline', 'confirm the outline', 'xác nhận', 'xác nhận dàn ý', 'xác nhận đề cương', 'tạo slide theo dàn ý'].includes(text)) return 'confirm'
  if (['cancel outline', 'cancel the outline', 'hủy dàn ý', 'huỷ dàn ý', 'hủy đề cương'].includes(text)) return 'cancel'
  return undefined
}

export function reviewAction(request: AgentRequest, state: OutlineSnapshot) {
  const current = state.proposals.find(p => p.outlineId === state.currentId)
  const command = request.outlineAction?.type ?? outlineCommand(request.input)
  const target = request.outlineAction ?? request.outlineTarget ?? current
  return { command, target, current }
}

export function presentationInstructions(deck: DeckSnapshot, outline: OutlineProposal | undefined, reviewing: boolean, requestId: string): string {
  if (deck.outlineId) return `Host-confirmed slide plan: ${JSON.stringify(deck)}\nHost-assigned draft paths: ${JSON.stringify(Object.fromEntries(deck.slides.map(slide => [slide.slideId, `draft-${requestId}-${slide.slideId}.html`])))}\nConfirmed content plan: ${JSON.stringify(outline ?? null)}\nCreate each planned slide in order from its confirmed content, title and stable ID. Use write_file with the Host-assigned workspace-relative draft path for that slide, then pass that same path to publish_slide only after write_file succeeds. Each request has different draft paths because the workspace is shared by all chats and existing files cannot be overwritten. Write directly at the workspace root; parent directories are not created by the tool. If a write fails, do not repeat identical arguments or publish an older file; explain the failure. No automatic work continues after this response ends. Use the snapshot expectedRevision and a unique publicationId. Never change the number/order of slides. No scripts, links, embeds, images, fonts or network resources. Publish each finished slide immediately; a draft is not publication. Only report the draft ready after all planned slides have successful receipts. Final response: summarize each slide, assumptions, placeholders, content beyond user material and what was not checked. Never invent verification or citations. On failure, state which slides remain unfinished.`
  return `No Host-confirmed outline exists. Do not build or publish presentation slides. ${reviewing ? 'You are reviewing a presentation outline. Only read_file and propose_outline are available.' : 'You can answer ordinary chat/file requests. If asked for a presentation, first propose its outline using propose_outline; never generate slides before Host confirmation.'}\n${outline ? `Current outline for scoped revisions: ${JSON.stringify(outline)}` : 'There is no current outline.'}\nCall propose_outline with exactly one argument named proposal. Its value is a serialized JSON STRING containing {overview,slides:[{title,content}]}. Escape the inner JSON quotes when writing the tool arguments. Use this example envelope with content from the actual user request:\nExample propose_outline arguments: ${JSON.stringify({ proposal: JSON.stringify({ overview: 'A concise overview', slides: [{ title: 'Opening', content: 'Explain the purpose, key content, assumptions and unresolved points.' }] }) })}\nThe example values are illustrative; preserve the requested slide count and language. Plan each slide in detail: purpose, argument, facts/figures, assumptions, placeholders and unresolved points. Respect the user slide count and language. Revise only what was requested; retain other content. Submit one complete proposal, then finish the response and wait. The Host will make it current only after this request succeeds. Confirm/cancel are separate user requests handled by Host. You cannot confirm. Positive text with requested changes is revision, and ambiguous intent needs clarification. If the user wants to proceed, ask for the explicit Confirm outline action; never claim confirmation yourself.`
}
