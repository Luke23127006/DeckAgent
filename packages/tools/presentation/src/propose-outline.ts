import type { ToolRegistry } from '@deckagent/agent-runtime'
import { validateOutlineDraft } from '@deckagent/deck'
import type { OutlineDraft } from '@deckagent/deck'

/** Stages content for the Host to commit only after this request completes successfully. */
export function registerProposeOutline(registry: ToolRegistry, stage: (draft: OutlineDraft) => void): () => void {
  return registry.register({
    name: 'propose_outline',
    description: 'Propose the presentation content plan. Arguments have exactly one property: proposal, a STRING containing serialized JSON {overview:string,slides:[{title:string,content:string}]}. Escape the inner JSON quotes. Each content describes the argument, key facts, figures/placeholders and unresolved points. Host supplies IDs and confirmation. After success, finish your response and wait for user confirmation. Do not build slides.',
    parameters: { type: 'object', additionalProperties: false, properties: { proposal: { type: 'string' } }, required: ['proposal'] },
    async execute(args, { signal }) {
      signal.throwIfAborted()
      if (typeof args.proposal !== 'string' || Buffer.byteLength(args.proposal) > 128 * 1024) throw new Error('Invalid proposal')
      stage(validateOutlineDraft(JSON.parse(args.proposal)))
      return 'Outline staged. Finish the response and ask the user to review it. No slide is built or published; only Host can confirm.'
    },
  })
}
