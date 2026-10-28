import type { PermissionPreset } from '@deckagent/host-api'
import type { ManagementClient } from './management-client.ts'
import { element, field, button } from './dom.ts'

export function permissionPicker(client: ManagementClient) {
  const node = element('details', undefined, 'permission-picker')
  const summary = element('summary', 'Quyền của Chat')
  const select = element('select')
  select.append(
    new Option('Workspace Access', 'workspace-access'),
    new Option('Provided Materials Only', 'provided-materials-only'),
  )
  const note = element(
    'p',
    'Workspace Access: đọc thư mục dự án. Provided Materials Only: chỉ dữ liệu được cung cấp. Đọc ngoài phạm vi phải hỏi trước; không đọc Chat khác hoặc sửa file gốc. Thay đổi áp dụng cho yêu cầu tiếp theo.',
  )
  const status = element('p')
  status.setAttribute('role', 'status')
  const grants = element('div')
  node.append(summary, field('Chat permission', select), note, grants, status)
  let current = '',
    generation = 0,
    busy = false,
    signature = ''
  async function refresh() {
    const id = current,
      expected = generation
    if (!id || busy) return
    try {
      const value = await client.permissions(id)
      if (current !== id || expected !== generation || busy) return
      select.value = value.preset
      const next = JSON.stringify(value.grants)
      if (signature === next) return
      signature = next
      grants.replaceChildren(element('strong', 'Quyền đọc đã cấp trong Chat'))
      for (const grant of value.grants.filter(item => !item.revokedAt))
        grants.append(
          element('p', grant.target),
          button('Thu hồi', () => {
            if (busy) return
            busy = true
            client
              .revokeGrant(id, grant.grantId)
              .then(() => {
                if (current === id) status.textContent = 'Đã thu hồi cho các yêu cầu tiếp theo.'
              })
              .catch(() => {
                if (current === id) status.textContent = 'Không thu hồi được. Hãy thử lại.'
              })
              .finally(() => {
                busy = false
                void refresh()
              })
          }),
        )
    } catch {
      if (current === id && generation === expected) status.textContent = 'Không tải được quyền của Chat.'
    }
  }
  select.addEventListener('change', () => {
    const id = current
    if (!id || busy) return
    busy = true
    select.disabled = true
    client
      .savePermission(id, select.value as PermissionPreset)
      .then(() => {
        if (current === id) status.textContent = 'Đã lưu quyền cho yêu cầu tiếp theo.'
      })
      .catch(() => {
        if (current === id) status.textContent = 'Không lưu được quyền. Hãy thử lại.'
      })
      .finally(() => {
        busy = false
        select.disabled = !current
        void refresh()
      })
  })
  return {
    node,
    refresh,
    update(id: string | undefined) {
      select.disabled = !id || busy
      if (current === (id ?? '')) return
      current = id ?? ''
      generation++
      signature = ''
      status.textContent = ''
      grants.replaceChildren()
      void refresh()
    },
  }
}
