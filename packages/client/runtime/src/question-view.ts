import type { RequestReply, UserQuestion } from '@deckagent/host-api'
import { button, element } from './dom.ts'

/** Suggested replies use their own payload and never read or clear the composer's draft. */
export function questionView(answer: (value: RequestReply['answer'], question: UserQuestion) => void) {
  const node = element('section', undefined, 'clarification-question')
  node.setAttribute('aria-label', 'Câu hỏi đang chờ trả lời')
  node.hidden = true
  let signature = ''
  return {
    node,
    update(question: UserQuestion | undefined, busy: boolean) {
      node.hidden = !question
      if (!question) {
        signature = ''
        node.replaceChildren()
        return
      }
      const nextSignature = JSON.stringify([question.questionId, question.version])
      if (signature !== nextSignature) {
        signature = nextSignature
        const choices = element('div', undefined, 'clarification-options')
        question.options.forEach((label, index) => {
          choices.append(button(label, () => answer({ type: 'option', index }, question)))
        })
        if (question.allowSkip) choices.append(button('Bỏ qua', () => answer({ type: 'skip' }, question)))
        node.replaceChildren(
          element('strong', question.prompt),
          choices,
          element('small', 'Chọn một gợi ý hoặc nhập câu trả lời bên dưới. Yêu cầu đang chờ bạn; bạn có thể dừng.'),
        )
      }
      for (const item of node.querySelectorAll('button')) item.disabled = busy
    },
  }
}
