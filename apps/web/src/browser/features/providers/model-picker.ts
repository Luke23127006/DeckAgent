import type { WebSettings } from '@deckagent/host-contracts'
import { button, element } from '../../dom.ts'

interface PickerDom {
  node: HTMLDivElement
  trigger: HTMLButtonElement
  panel: HTMLDivElement
  tabs: HTMLDivElement
  options: HTMLDivElement
  manageButton: HTMLButtonElement
  addButton: HTMLButtonElement
  note: HTMLParagraphElement
}

interface PickerHooks {
  chooseTab(id: string): void
  chooseModel(value: string): void
}

function createPickerDom(select: HTMLSelectElement): PickerDom {
  const node = element('div', undefined, 'model-picker')
  const trigger = element('button', 'Chọn model')
  trigger.type = 'button'
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
  const manageButton = element('button', '')
  manageButton.type = 'button'
  manageButton.className = 'model-manage'
  manageButton.setAttribute('aria-label', 'Cài đặt model')
  manageButton.title = 'Cài đặt model'
  const addButton = element('button', '+')
  addButton.type = 'button'
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
  return { node, trigger, panel, tabs, options, manageButton, addButton, note }
}

function renderPickerOptions(
  picker: PickerDom,
  providers: WebSettings['providers'],
  active: string,
  select: HTMLSelectElement,
  hooks: PickerHooks,
): string {
  const current = providers.some(provider => provider.id === active) ? active : (providers[0]?.id ?? '')
  picker.tabs.replaceChildren()
  for (const provider of providers) {
    const tab = button(provider.displayName, () => hooks.chooseTab(provider.id))
    tab.id = `model-tab-${provider.id}`
    tab.setAttribute('role', 'tab')
    tab.setAttribute('aria-controls', picker.options.id)
    tab.setAttribute('aria-selected', String(provider.id === current))
    tab.tabIndex = provider.id === current ? 0 : -1
    picker.tabs.append(tab)
  }
  picker.options.setAttribute('aria-labelledby', `model-tab-${current}`)
  picker.options.replaceChildren()
  for (const model of providers.find(provider => provider.id === current)?.models ?? []) {
    const value = JSON.stringify({ provider: current, model })
    const option = button(model, () => hooks.chooseModel(value))
    option.disabled = select.disabled
    option.setAttribute('aria-pressed', String(select.value === value))
    option.title = model
    picker.options.append(option)
  }
  if (!picker.options.children.length)
    picker.options.append(
      element(
        'p',
        providers.length
          ? 'Provider này chưa có model. Mở Cài đặt để thêm model ID.'
          : 'Chưa có provider. Bấm + để thêm cấu hình.',
      ),
    )
  return current
}

function closePicker(picker: PickerDom) {
  picker.panel.hidden = true
  picker.trigger.setAttribute('aria-expanded', 'false')
}

function togglePicker(picker: PickerDom, open: boolean, render: () => void) {
  picker.panel.hidden = !open
  picker.trigger.setAttribute('aria-expanded', String(open))
  if (!open) {
    picker.trigger.focus()
    return
  }
  render()
  const box = picker.trigger.getBoundingClientRect()
  picker.panel.style.width = `${Math.min(310, innerWidth - 24)}px`
  picker.panel.style.left = `${Math.max(12, Math.min(box.right - Math.min(310, innerWidth - 24), innerWidth - 322))}px`
  picker.panel.style.bottom = `${innerHeight - box.top + 8}px`
  picker.options.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus()
}

function attachPickerEvents(picker: PickerDom, render: () => void, manage: () => void, add: () => void) {
  picker.trigger.addEventListener('click', () => togglePicker(picker, picker.panel.hidden !== false, render))
  picker.manageButton.addEventListener('click', () => {
    togglePicker(picker, false, render)
    manage()
  })
  picker.addButton.addEventListener('click', () => {
    togglePicker(picker, false, render)
    add()
  })
  document.addEventListener('pointerdown', event => {
    if (!picker.panel.hidden && event.target instanceof Node && !picker.node.contains(event.target)) closePicker(picker)
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !picker.panel.hidden) {
      event.preventDefault()
      togglePicker(picker, false, render)
    }
  })
  picker.node.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !picker.panel.hidden) {
      event.preventDefault()
      event.stopPropagation()
      togglePicker(picker, false, render)
    }
    if (event.key === 'ArrowDown' && event.target === picker.trigger) {
      event.preventDefault()
      togglePicker(picker, true, render)
      picker.options.querySelector<HTMLButtonElement>('button')?.focus()
    } else if (
      ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) &&
      !picker.panel.hidden
    ) {
      const inTabs = picker.tabs.contains(document.activeElement)
      const items = [
        ...(inTabs ? picker.tabs : picker.options).querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
      ]
      const activeEl = document.activeElement
      if (!(activeEl instanceof HTMLButtonElement)) return
      const index = items.indexOf(activeEl)
      if (index < 0) return
      event.preventDefault()
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (index + (event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1) + items.length) % items.length
      if (inTabs) items[next]?.click()
      else items[next]?.focus()
    }
  })
  window.addEventListener('resize', () => {
    if (!picker.panel.hidden) togglePicker(picker, false, render)
  })
}

/** One accessible view over the existing selection control; choosing never submits a request. */
export function modelPicker(select: HTMLSelectElement, manage: () => void, add: () => void) {
  const picker = createPickerDom(select)
  let providers: WebSettings['providers'] = []
  let active = ''
  let signature = ''
  function render() {
    active = renderPickerOptions(picker, providers, active, select, {
      chooseTab: id => {
        active = id
        render()
        picker.tabs.querySelector<HTMLButtonElement>('[aria-selected=true]')?.focus()
      },
      chooseModel: value => {
        if (select.disabled) return
        select.value = value
        select.dispatchEvent(new Event('change'))
        togglePicker(picker, false, render)
      },
    })
  }
  attachPickerEvents(picker, render, manage, add)
  return {
    node: picker.node,
    close: () => closePicker(picker),
    update(settings: WebSettings, running: boolean) {
      providers = settings.providers
      picker.trigger.disabled = select.disabled
      const selectedOption = select.selectedOptions[0]
      picker.trigger.textContent =
        selectedOption?.value && select.value !== '__settings'
          ? (selectedOption.textContent ?? '')
          : providers.some(provider => provider.models.length)
            ? 'Chọn model'
            : 'Chưa có model'
      picker.note.hidden = !running
      const next = JSON.stringify([providers, select.value, select.disabled])
      if (signature !== next) {
        signature = next
        const selected = providers.find(provider =>
          provider.models.some(model => select.value === JSON.stringify({ provider: provider.id, model })),
        )
        active = selected?.id ?? active
        render()
      }
    },
  }
}
