import type { ProviderSettings, ProviderTemplate } from '@deckagent/host-contracts'
import { ManagementError } from '../../transport/index.ts'
import type { ManagementClient } from '../../transport/index.ts'
import { button, element } from '../../dom.ts'
import { saveFailure } from './provider-errors.ts'
import { createSettingsDom } from './settings-dom.ts'
import type { SettingsDom } from './settings-dom.ts'
import { createModelDraftController } from './provider-model-draft.ts'
import type { ModelDraftController } from './provider-model-draft.ts'

interface PanelState {
  client: ManagementClient
  changed: () => Promise<void>
  workspace: HTMLElement
  returned: () => void
  dom: SettingsDom
  draft: ModelDraftController
  providers: readonly ProviderSettings[]
  providersVersion: number
  builtIns: readonly ProviderTemplate[]
  busy: boolean
  opening: boolean
  baseline: string
  selectedId: string
  selectedKind: string
  wizard: boolean
  step: number
}

export function settingsPanel(
  client: ManagementClient,
  changed: () => Promise<void>,
  workspace: HTMLElement,
  returned: () => void,
) {
  let panel: PanelState
  const dom = createSettingsDom({
    loadCatalog: () => panel.draft.loadCatalog(),
    addCatalog: () => panel.draft.addCatalog(),
    addManualModel: () => panel.draft.addManualModel(),
    removeProvider: () => {
      removeProvider(panel)
    },
    next: () => nextStep(panel),
    previous: () => previousStep(panel),
    requestClose: () => {
      requestClose(panel)
    },
    submit: event => submitProvider(panel, event),
  })
  panel = {
    client,
    changed,
    workspace,
    returned,
    dom,
    draft: createModelDraftController(
      dom.draftNodes,
      client,
      action => perform(panel, action),
      () => showUnexpected(panel),
    ),
    providers: [],
    providersVersion: 0,
    builtIns: [],
    busy: false,
    opening: false,
    baseline: '',
    selectedId: '',
    selectedKind: '',
    wizard: false,
    step: 1,
  }
  dom.kind.addEventListener('change', () => changeKind(panel))
  dom.chooser.addEventListener('change', () => changeChooser(panel))
  attachDialog(panel)
  return panelApi(panel)
}

function snapshot(panel: PanelState): string {
  const { dom } = panel
  return JSON.stringify([
    dom.id.value,
    dom.name.value,
    dom.protocol.value,
    dom.url.value,
    dom.key.value,
    dom.removeKey.checked,
    dom.models.value,
    dom.manual.value,
  ])
}

function canDiscard(panel: PanelState): boolean {
  return (
    !panel.busy &&
    (snapshot(panel) === panel.baseline ||
      confirm('Bỏ các thay đổi chưa lưu? Cấu hình đã lưu và nội dung chat vẫn được giữ.'))
  )
}

function showUnexpected(panel: PanelState) {
  panel.dom.message.textContent = 'Không cập nhật được cài đặt.'
}

function fill(panel: PanelState, value?: ProviderSettings) {
  panel.dom.fillForm(value, panel.builtIns, panel.wizard)
  panel.baseline = snapshot(panel)
  panel.draft.renderModels()
}

function renderStep(panel: PanelState) {
  const { dom } = panel
  dom.showStep(panel.wizard, panel.step)
  fill(
    panel,
    panel.providers.find(provider => provider.id === dom.chooser.value),
  )
  dom.lockConnection(panel.wizard && panel.step !== 2)
}

function changeKind(panel: PanelState) {
  const { dom } = panel
  if (!canDiscard(panel)) {
    dom.kind.value = panel.selectedKind
    return
  }
  panel.selectedKind = dom.kind.value
  dom.chooser.value = `new:${dom.kind.value || 'custom'}`
  panel.selectedId = dom.chooser.value
  fill(panel)
}

function changeChooser(panel: PanelState) {
  const { dom } = panel
  if (!canDiscard(panel)) {
    dom.chooser.value = panel.selectedId
    return
  }
  panel.selectedId = dom.chooser.value
  const value = panel.providers.find(provider => provider.id === dom.chooser.value)
  dom.kind.value = value
    ? panel.builtIns.some(template => template.id === value.id)
      ? value.id
      : ''
    : dom.chooser.value.startsWith('new:') && dom.chooser.value !== 'new:custom'
      ? dom.chooser.value.slice(4)
      : ''
  dom.kind.disabled = !!value
  panel.selectedKind = dom.kind.value
  fill(panel, value)
}

async function refresh(panel: PanelState, selectedId = '') {
  const { dom, client } = panel
  const settings = await client.settings()
  panel.providers = settings.providers
  panel.providersVersion = settings.providersVersion
  panel.builtIns = settings.builtIns
  dom.kind.replaceChildren(
    ...panel.builtIns.map(template => {
      const option = new Option(template.displayName, template.id)
      option.disabled = panel.providers.some(provider => provider.id === template.id)
      return option
    }),
    new Option('Custom model API', ''),
  )
  dom.kind.value = ''
  dom.kind.disabled = false
  const saved = element('optgroup')
  saved.label = 'Cấu hình đã lưu'
  for (const provider of panel.providers) saved.append(new Option(provider.displayName, provider.id))
  const offered = element('optgroup')
  offered.label = 'Thêm cấu hình'
  for (const template of panel.builtIns)
    if (!panel.providers.some(provider => provider.id === template.id))
      offered.append(new Option(template.displayName, `new:${template.id}`))
  offered.append(new Option('Custom model API', 'new:custom'))
  dom.chooser.replaceChildren(saved, offered)
  renderProviderList(panel)
  dom.chooser.value = selectedId || 'new:custom'
  const value = panel.providers.find(provider => provider.id === selectedId)
  const isBuiltIn = value !== undefined && panel.builtIns.some(template => template.id === value.id)
  dom.kind.value = isBuiltIn ? value.id : ''
  dom.kind.disabled = !!value
  panel.selectedKind = dom.kind.value
  fill(panel, value)
  if (!settings.persistentKeys)
    dom.message.textContent =
      'Máy này chưa có nơi lưu key được bảo vệ mà DeckAgent hỗ trợ (hiện chỉ Windows), nên không lưu được key. Custom model API không cần key vẫn dùng được.'
}

function renderProviderList(panel: PanelState) {
  const { dom } = panel
  dom.providerList.replaceChildren(element('h3', 'Provider đã lưu'))
  if (!panel.providers.length) dom.providerList.append(element('p', 'Chưa có provider. Thêm kết nối bên dưới.'))
  for (const provider of panel.providers) {
    const card = button('', () => {
      if (panel.busy) return
      dom.chooser.value = provider.id
      dom.chooser.dispatchEvent(new Event('change'))
    })
    card.dataset.provider = provider.id
    card.append(
      element('strong', provider.displayName),
      element(
        'small',
        `${panel.builtIns.some(template => template.id === provider.id) ? 'Built-in' : 'Custom API'} · ${provider.keyAvailable ? 'Có key' : provider.hasKey ? 'Key đã lưu không dùng được' : 'Chưa có key'}`,
      ),
      element('span', provider.models.length ? provider.models.join(' · ') : 'Chưa thêm model'),
    )
    dom.providerList.append(card)
  }
  dom.addList.replaceChildren(element('h3', 'Thêm provider'))
  const offers: readonly (readonly [string, string])[] = [
    ...panel.builtIns
      .filter(template => !panel.providers.some(provider => provider.id === template.id))
      .map(template => [template.id, template.displayName] as const),
    ['custom', 'Custom model API'],
  ]
  for (const [offer, label] of offers) {
    const row = button('', () => {
      if (panel.busy) return
      dom.chooser.value = `new:${offer}`
      dom.chooser.dispatchEvent(new Event('change'))
    })
    row.dataset.offer = offer
    row.append(element('strong', label))
    dom.addList.append(row)
  }
}

async function perform(panel: PanelState, action: () => Promise<void>) {
  if (panel.busy) return
  panel.busy = true
  panel.dom.setBusy(true, false)
  try {
    await action()
  } catch (error) {
    if (error instanceof ManagementError && error.message === 'PROVIDERS_STALE')
      await refresh(panel, panel.dom.chooser.value).catch(() => {})
    panel.dom.message.textContent = saveFailure(error)
  } finally {
    panel.busy = false
    panel.dom.setBusy(
      false,
      panel.providers.some(provider => provider.id === panel.dom.chooser.value),
    )
  }
}

async function removeProvider(panel: PanelState) {
  const { dom, client } = panel
  if (!dom.chooser.value || !confirm('Xóa cấu hình provider này? Chat vẫn giữ lịch sử và sẽ cần chọn model khác.'))
    return
  await perform(panel, async () => {
    await client.remove(dom.chooser.value, panel.providersVersion)
    await refresh(panel)
    await panel.changed()
  }).catch(() => showUnexpected(panel))
}

function submitProvider(panel: PanelState, event: SubmitEvent) {
  event.preventDefault()
  const { dom, client } = panel
  panel.draft.addManualModel()
  const credential = dom.key.value
  dom.key.value = ''
  const value = {
    displayName: dom.name.value,
    protocol: dom.protocol.value,
    baseUrl: dom.url.value,
    models: panel.draft.values(),
    ...(dom.removeKey.checked ? { key: '' } : credential ? { key: credential } : {}),
    // A new configuration never replaces a saved one with the same provider ID (BR-008).
    ...(panel.providers.some(provider => provider.id === dom.id.value) ? {} : { new: true }),
  }
  perform(panel, async () => {
    await client.save(dom.id.value, value, panel.providersVersion)
    panel.baseline = snapshot(panel)
    try {
      await refresh(panel, dom.id.value)
      panel.selectedId = dom.chooser.value
      await panel.changed()
    } catch (error) {
      const code =
        error instanceof ManagementError
          ? error.message
          : error instanceof Error && error.message === 'INVALID_RESPONSE'
            ? 'INVALID_RESPONSE'
            : 'UI_REFRESH_FAILED'
      dom.message.textContent = `Host đã lưu cấu hình, nhưng chưa cập nhật được giao diện (${code}). Mở lại cài đặt để đọc kết quả đã lưu.`
      return
    }
    dom.message.textContent = value.models.length
      ? `Đã lưu ${value.models.length} model. Bạn có thể chọn model trong chat.`
      : 'Đã lưu kết nối, chưa thêm model. Nhập model ID hoặc lấy catalog, thêm model rồi lưu.'
    if (panel.wizard && panel.step === 2) {
      panel.step = 3
      renderStep(panel)
    } else if (panel.wizard && panel.step === 3 && value.models.length)
      dom.message.textContent = 'Đã lưu model. Bấm Xong để quay lại chat; model chưa được tự chọn.'
  }).catch(() => showUnexpected(panel))
}

function nextStep(panel: PanelState) {
  if (panel.step === 1) {
    panel.step = 2
    renderStep(panel)
    panel.dom.name.focus()
  }
}

function previousStep(panel: PanelState) {
  if (canDiscard(panel)) {
    panel.step = 1
    renderStep(panel)
  }
}

function requestClose(panel: PanelState): boolean {
  if (!panel.dom.dialog.open) return true
  if (!canDiscard(panel)) return false
  panel.dom.key.value = ''
  panel.dom.dialog.close()
  delete panel.workspace.dataset.view
  return true
}

function attachDialog(panel: PanelState) {
  const { dialog } = panel.dom
  // Escape and a click on the scrim both go through requestClose, so unsaved changes are still guarded.
  dialog.addEventListener('cancel', event => {
    event.preventDefault()
    requestClose(panel)
  })
  let pressedScrim = false
  dialog.addEventListener('pointerdown', event => {
    pressedScrim = event.target === dialog
  })
  dialog.addEventListener('click', event => {
    if (pressedScrim && event.target === dialog) requestClose(panel)
    pressedScrim = false
  })
  dialog.addEventListener('close', () => {
    panel.dom.key.value = ''
    delete panel.workspace.dataset.view
    panel.returned()
  })
  panel.workspace.append(dialog)
}

async function openPanel(panel: PanelState, quick: boolean) {
  if (panel.dom.dialog.open || panel.opening) return
  panel.opening = true
  try {
    panel.wizard = quick
    panel.step = 1
    await refresh(panel)
    panel.selectedId = panel.dom.chooser.value
    renderStep(panel)
    // Full settings is a popup too. The attribute only marks that settings is open.
    if (!panel.wizard) panel.workspace.dataset.view = 'settings'
    panel.dom.dialog.showModal()
    panel.dom.close.focus()
  } finally {
    panel.opening = false
  }
}

function panelApi(panel: PanelState) {
  return {
    leave: () => requestClose(panel),
    open: async (quick = false) => openPanel(panel, quick),
  }
}
