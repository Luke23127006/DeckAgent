import type { ConversationMessage, RunContribution } from '../../runs/ports.ts'
import type { ChatHistoryMessage } from './chats.service.ts'

export function createConversationContribution(
  readMessages: (id: string) => Promise<readonly ChatHistoryMessage[]>,
): RunContribution {
  return {
    name: 'conversation',
    async contribute(context) {
      if (context.owner.kind !== 'chat') return {}
      const messages: ConversationMessage[] = []
      for (const message of await readMessages(context.owner.id)) {
        if (message.role !== 'user' && message.role !== 'assistant') continue
        messages.push({
          role: message.role,
          content: message.content,
          ...(message.role === 'assistant' && message.interrupted ? { unfinished: true } : {}),
          ...(message.role === 'user' && message.attachments?.length
            ? { attachments: message.attachments.map(item => ({ attachmentId: item.attachmentId, name: item.name })) }
            : {}),
        })
      }
      return { resources: [{ kind: 'conversation', messages }] }
    },
  }
}
