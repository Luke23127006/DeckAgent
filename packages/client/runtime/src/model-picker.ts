import type { WebSettings } from '@deckagent/host-api'
import { button, element } from './dom.ts'

/** One accessible view over the existing selection control; choosing never submits a request. */
export function modelPicker(select: HTMLSelectElement, manage: () => void, add: () => void) {
  const node = element('div', undefined, 'model-picker')
  const trigger = button('Chọn model ⌃', () => toggle(panel.hidden !== false))
  trigger.setAttribute('aria-label', 'Chọn model')
  trigger.setAttribute('aria-haspopup', 'dialog')
  trigger.setAttribute('aria-expanded', 'false')
  const panel = element('div', undefined, 'model-popover')
  panel.id = 'model-popover'
  panel.hidden = true
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'Provider và model')
  trigger.setAttribute('aria-controls', panel.id)
  const tabs = element('div', undefined, 'model-tabs')
  tabs.setAttribute('role', 'tablist')
  tabs.setAttribute('aria-label', 'Provider')
  const options = element('div', undefined, 'model-options')
  options.id = 'model-options'
  options.setAttribute('role', 'tabpanel')
  const manageButton = button('⚙', () => { toggle(false); manage() })
  manageButton.className = 'model-manage'
  manageButton.setAttribute('aria-label', 'Cài đặt model')
  manageButton.title = 'Cài đặt model'
  const addButton = button('+', () => { toggle(false); add() })
  addButton.setAttribute('aria-label', 'Thêm provider')
  addButton.title = 'Thêm provider'
  const top = element('header')
  top.append(tabs, addButton, manageButton)
  const note = element('p', 'Yêu cầu đang chạy giữ model cũ. Lựa chọn mới áp dụng cho yêu cầu kế tiếp.', 'model-note')
  note.hidden = true
  panel.append(top, note, options)
  select.hidden = true
  // Native select remains the validated selection adapter, outside the keyboard/accessibility tree.
  node.append(select, trigger, panel)
  let providers: WebSettings['providers'] = []
  let active = ''
  let signature = ''

  function toggle(open: boolean) {
    panel.hidden = !open
    trigger.setAttribute('aria-expanded', String(open))
    if (open) {
      render()
      const box = trigger.getBoundingClientRect()
      panel.style.width = `${Math.min(310, innerWidth - 24)}px`
      panel.style.left = `${Math.max(12, Math.min(box.right - Math.min(310, innerWidth - 24), innerWidth - 322))}px`
      panel.style.bottom = `${innerHeight - box.top + 8}px`
      options.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus()
    } else trigger.focus()
  }
  function render() {
    if (!providers.some(provider => provider.id === active)) active = providers[0]?.id ?? ''
    tabs.replaceChildren()
    for (const provider of providers) {
      const tab = button(provider.displayName, () => {
        active = provider.id
        render()
        tabs.querySelector<HTMLButtonElement>('[aria-selected=true]')?.focus()
      })
      tab.id = `model-tab-${provider.id}`
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-controls', options.id)
      tab.setAttribute('aria-selected', String(provider.id === active))
      tab.tabIndex = provider.id === active ? 0 : -1
      tabs.append(tab)
    }
    options.setAttribute('aria-labelledby', `model-tab-${active}`)
    options.replaceChildren()
    for (const model of providers.find(provider => provider.id === active)?.models ?? []) {
      const value = JSON.stringify({ provider: active, model })
      const option = button(model, () => {
        if (select.disabled) return
        select.value = value
        select.dispatchEvent(new Event('change'))
        toggle(false)
      })
      option.disabled = select.disabled
      option.setAttribute('aria-pressed', String(select.value === value))
      option.title = model
      options.append(option)
    }
    if (!options.children.length) options.append(element('p', providers.length
      ? 'Provider này chưa có model. Mở Cài đặt để thêm model ID.' : 'Chưa có provider. Bấm + để thêm cấu hình.'))
  }
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && event.target instanceof Node && !node.contains(event.target)) {
      panel.hidden = true
      trigger.setAttribute('aria-expanded', 'false')
    }
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); toggle(false) }
  })
  node.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopPropagation(); toggle(false) }
    if (event.key === 'ArrowDown' && event.target === trigger) {
      event.preventDefault(); toggle(true); options.querySelector<HTMLButtonElement>('button')?.focus()
    } else if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) && !panel.hidden) {
      const inTabs = tabs.contains(document.activeElement)
      const items = [...(inTabs ? tabs : options).querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
      const index = items.indexOf(document.activeElement as HTMLButtonElement)
      if (index < 0) return
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
        : (index + (event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1) + items.length) % items.length
      if (inTabs) items[next]?.click()
      else items[next]?.focus()
    }
  })
  window.addEventListener('resize', () => { if (!panel.hidden) toggle(false) })
  return { node, close: () => { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false') },
    update(settings: WebSettings, running: boolean) {
      providers = settings.providers
      trigger.disabled = select.disabled
      trigger.textContent = select.selectedOptions[0]?.value && select.value !== '__settings'
        ? `${select.selectedOptions[0]!.textContent} ⌃` : providers.some(provider => provider.models.length) ? 'Chọn model ⌃' : 'Chưa có model ⌃'
      note.hidden = !running
      const next = JSON.stringify([providers, select.value, select.disabled])
      if (signature !== next) {
        signature = next
        const selected = providers.find(provider => provider.models.some(model => select.value === JSON.stringify({ provider: provider.id, model })))
        active = selected?.id ?? active
        render()
      }
    } }
}
