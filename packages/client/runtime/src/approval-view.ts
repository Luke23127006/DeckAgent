import type { StepApproval, ApprovalDecision } from '@deckagent/host-api'
import { element, button } from './dom.ts'

export function approvalView(answer: (approval: StepApproval, decision: ApprovalDecision) => Promise<void>) {
  const node = element('section', undefined, 'step-approval')
  node.setAttribute('aria-label', 'Step approval')
  node.setAttribute('role', 'region')
  node.hidden = true
  let signature = ''
  let busy = false
  return {
    node,
    update(approval?: StepApproval) {
      const next = JSON.stringify(approval)
      if (signature === next) return
      signature = next
      node.hidden = !approval
      node.replaceChildren()
      if (!approval) return
      const status = element('p', 'Đang chờ bạn cho phép đọc file. Chưa đọc nội dung file.')
      const choose = (decision: ApprovalDecision) => {
        if (busy || signature !== next) return
        busy = true
        for (const control of node.querySelectorAll('button')) control.disabled = true
        answer(approval, decision)
          .catch(() => {
            if (signature === next)
              status.textContent = 'Không gửi được lựa chọn hoặc yêu cầu đã thay đổi. Hãy mở lại Chat để kiểm tra.'
          })
          .finally(() => {
            busy = false
            if (signature === next) for (const control of node.querySelectorAll('button')) control.disabled = false
          })
      }
      node.append(
        element('strong', 'Cho phép đọc file?'),
        element('pre', approval.target),
        element('p', approval.reason),
        status,
        button('Từ chối', () => choose('deny')),
        button('Cho phép một lần', () => choose('once')),
      )
      if (approval.continuing)
        node.append(
          button('Cho phép đọc file này trong Chat', () => choose('scope')),
          element('small', `Chỉ file ${approval.target}, chỉ Chat này, đến khi bạn thu hồi.`),
        )
    },
  }
}
