import type { ProviderSettings, ProviderTemplate } from '@deckagent/host-contracts'
import { button, element } from '../../dom.ts'

export interface SettingsDomActions {
  loadCatalog(): void
  addCatalog(): void
  addManualModel(): void
  removeProvider(): void
  next(): void
  previous(): void
  requestClose(): void
  submit(event: SubmitEvent): void
}

function localizedField(ariaLabel: string, visibleLabel: string, input: HTMLElement): HTMLLabelElement {
  const label = element('label')
  label.append(element('span', visibleLabel), input)
  input.setAttribute('aria-label', ariaLabel)
  return label
}

function createShell() {
  const dialog = element('dialog', undefined, 'settings-dialog')
  const title = element('h2', 'Cài đặt Provider')
  const message = element('p')
  message.setAttribute('role', 'status')
  const chooser = element('select')
  const providerList = element('section', undefined, 'provider-list')
  providerList.setAttribute('aria-label', 'Provider đã cấu hình')
  // Rows that start a new provider. They live in the popup's left column beside the saved providers.
  const addList = element('div', undefined, 'provider-add')
  const pageTitle = element('h3', '', 'settings-pagetitle')
  const kind = element('select')
  return { dialog, title, message, chooser, providerList, addList, pageTitle, kind }
}

function createInputs() {
  const id = element('input')
  id.required = true
  id.pattern = '[A-Za-z0-9_.\\-]+'
  id.maxLength = 100
  id.placeholder = 'river-ai'
  const providerIdField = localizedField('Provider ID', 'Provider ID', id)
  const idHint = element('small', 'ID không có dấu cách, ví dụ river-ai. Tên hiển thị bên dưới có thể là River AI.')
  idHint.id = 'provider-id-help'
  id.setAttribute('aria-describedby', idHint.id)
  providerIdField.append(idHint)
  const name = element('input')
  name.required = true
  name.maxLength = 100
  const protocol = element('select')
  // BR-005 V-4: the API protocols of a custom model API.
  for (const [value, label] of [
    ['chat-completions', 'OpenAI Chat Completions'],
    ['responses', 'OpenAI Responses'],
    ['anthropic-messages', 'Anthropic Messages'],
    ['gemini', 'Google Gemini'],
  ] as const)
    protocol.append(new Option(label, value))
  const url = element('input')
  url.type = 'url'
  url.required = true
  const key = element('input')
  key.type = 'password'
  key.autocomplete = 'new-password'
  key.maxLength = 4096
  const removeKey = element('input')
  removeKey.type = 'checkbox'
  const models = element('textarea')
  models.rows = 4
  models.placeholder = 'Nhập model ID, mỗi dòng một ID'
  const available = element('select')
  available.multiple = true
  available.size = 5
  return { id, providerIdField, name, protocol, url, key, removeKey, models, available }
}

function createButtons(actions: SettingsDomActions) {
  const loadCatalog = button('Lấy model catalog', actions.loadCatalog)
  const addCatalog = button('Thêm model đã chọn', actions.addCatalog)
  const save = element('button', 'Save provider')
  save.type = 'submit'
  const remove = button('Xóa cấu hình', actions.removeProvider)
  const close = button('', actions.requestClose)
  close.className = 'settings-back'
  close.title = 'Đóng cài đặt'
  close.setAttribute('aria-label', 'Đóng cài đặt')
  const cancel = button('Hủy', actions.requestClose)
  return { loadCatalog, addCatalog, save, remove, close, cancel }
}

function createDraftDom(actions: SettingsDomActions) {
  const modelChips = element('div', undefined, 'model-chips')
  const manual = element('input')
  manual.placeholder = 'Model ID, kể cả ID không có trong catalog'
  manual.setAttribute('aria-label', 'Thêm bằng model ID')
  const addManual = button('Thêm', actions.addManualModel)
  const manualRow = element('div', undefined, 'manual-model-row')
  manualRow.append(manual, addManual)
  const advanced = element('details', undefined, 'model-raw-editor')
  return { modelChips, manual, addManual, manualRow, advanced }
}

function createSections(
  shell: ReturnType<typeof createShell>,
  inputs: ReturnType<typeof createInputs>,
  buttons: ReturnType<typeof createButtons>,
  draft: ReturnType<typeof createDraftDom>,
) {
  const connectionHeading = element('h3', 'Kết nối')
  const connection = element('section', undefined, 'settings-section')
  connection.append(
    connectionHeading,
    inputs.providerIdField,
    localizedField('Display name', 'Tên hiển thị', inputs.name),
    localizedField('API protocol', 'API protocol', inputs.protocol),
    localizedField('Base URL', 'Base URL', inputs.url),
  )
  const credentials = element('section', undefined, 'settings-section')
  credentials.append(
    element('h3', 'API key'),
    element('p', 'Sau khi lưu, không hiện lại bất kỳ phần nào của key. Để trống để giữ key đã lưu.'),
    localizedField('API key', 'Key', inputs.key),
    localizedField('Remove saved key', 'Gỡ key đã lưu', inputs.removeKey),
  )
  const modelHeading = element('h3', '3 · Thêm model')
  const modelSection = element('section', undefined, 'settings-section')
  draft.advanced.append(
    element('summary', 'Sửa danh sách model ID'),
    localizedField('Added model IDs', 'Danh sách model ID', inputs.models),
  )
  // Catalog and manual entry share the same draft; nothing persists until Save.
  modelSection.replaceChildren(
    modelHeading,
    element('p', 'Catalog không bảo đảm quyền truy cập hoặc tương thích. Bạn có thể thêm model ID bằng tay.'),
    draft.modelChips,
    draft.manualRow,
    buttons.loadCatalog,
    localizedField('Model catalog', 'Model catalog', inputs.available),
    buttons.addCatalog,
    draft.advanced,
  )
  const savedProviders = element('details', undefined, 'saved-providers')
  savedProviders.append(element('summary', 'Cấu hình đã lưu'), shell.providerList)
  const providerStep = element('section', undefined, 'provider-step')
  providerStep.append(
    element('h3', '1 · Chọn provider'),
    element('p', 'Key lấy từ tài khoản của bạn với provider. Yêu cầu dùng cấu hình này sẽ được gửi tới provider đó.'),
    localizedField('Provider configuration', 'Provider', shell.chooser),
    localizedField('Provider type', 'Loại provider', shell.kind),
    savedProviders,
  )
  return { connection, connectionHeading, credentials, modelSection, modelHeading, providerStep, savedProviders }
}

function createNavigation(actions: SettingsDomActions) {
  const footer = element('footer', undefined, 'settings-footer')
  const next = button('Tiếp tục →', actions.next)
  const previous = button('← Quay lại', actions.previous)
  const finish = button('Xong', actions.requestClose)
  const nav = element('div', undefined, 'settings-nav')
  nav.setAttribute('role', 'group')
  nav.setAttribute('aria-label', 'Provider')
  return { footer, next, previous, finish, nav }
}

function createRefs(actions: SettingsDomActions) {
  const shell = createShell()
  const inputs = createInputs()
  const buttons = createButtons(actions)
  const draft = createDraftDom(actions)
  const sections = createSections(shell, inputs, buttons, draft)
  const navigation = createNavigation(actions)
  const form = element('form')
  const fields = element('fieldset')
  form.id = 'provider-settings-form'
  form.addEventListener('submit', actions.submit)
  buttons.save.setAttribute('form', 'provider-settings-form')
  fields.append(sections.providerStep, sections.connection, sections.credentials, sections.modelSection)
  form.append(fields)
  navigation.nav.append(shell.providerList, shell.addList)
  navigation.footer.append(
    buttons.remove,
    navigation.previous,
    navigation.next,
    navigation.finish,
    buttons.cancel,
    buttons.save,
  )
  const header = element('header', undefined, 'settings-header')
  header.append(shell.title, buttons.close)
  const body = element('div', undefined, 'settings-body')
  body.append(shell.pageTitle, shell.message, form)
  // Popup layout: saved providers and "add" rows on the left, the selected provider's form and actions on the right.
  const main = element('div', undefined, 'settings-main')
  main.append(body, navigation.footer)
  const layout = element('div', undefined, 'settings-layout')
  layout.append(navigation.nav, main)
  shell.dialog.append(header, layout)
  const draftNodes = {
    models: inputs.models,
    available: inputs.available,
    modelChips: draft.modelChips,
    manual: draft.manual,
    addCatalog: buttons.addCatalog,
    message: shell.message,
    chooser: shell.chooser,
  }
  return { ...shell, ...inputs, ...buttons, ...draft, ...sections, ...navigation, form, fields, draftNodes }
}

function setBusy(refs: SettingsRefs, busy: boolean, hasSavedProvider: boolean) {
  refs.fields.disabled = busy
  refs.save.disabled = busy
  refs.chooser.disabled = busy
  for (const card of refs.dialog.querySelectorAll<HTMLButtonElement>('.provider-list button, .provider-add button'))
    card.disabled = busy
  refs.remove.disabled = busy || !hasSavedProvider
  refs.close.disabled = busy
  refs.cancel.disabled = busy
  refs.next.disabled = busy
}

function fillForm(
  refs: SettingsRefs,
  value: ProviderSettings | undefined,
  builtIns: readonly ProviderTemplate[],
  wizard: boolean,
) {
  const template = builtIns.find(template => template.id === (value?.id ?? refs.kind.value))
  refs.id.value = value?.id ?? template?.id ?? ''
  refs.id.disabled = !!value || !!template
  refs.name.value = value?.displayName ?? template?.displayName ?? ''
  refs.protocol.value = value?.protocol ?? template?.protocol ?? 'chat-completions'
  refs.protocol.disabled = !!value || !!template
  refs.url.value = value?.baseUrl ?? template?.baseUrl ?? ''
  refs.url.disabled = !!template
  refs.key.value = ''
  refs.removeKey.checked = false
  refs.removeKey.disabled = !!template
  refs.key.required = !!template && !value?.keyAvailable
  refs.models.value = value?.models.join('\n') ?? ''
  refs.manual.value = ''
  refs.remove.disabled = !value
  refs.remove.hidden = wizard || !value
  refs.loadCatalog.disabled = !value
  refs.available.replaceChildren()
  if (refs.available.parentElement) refs.available.parentElement.hidden = true
  refs.addCatalog.hidden = true
  for (const input of [refs.id, refs.protocol, refs.url])
    if (input.parentElement) input.parentElement.hidden = !!template
  if (refs.kind.parentElement) refs.kind.parentElement.hidden = true
  if (refs.removeKey.parentElement) refs.removeKey.parentElement.hidden = !!template
  refs.message.textContent = value?.hasKey
    ? value.keyAvailable
      ? 'Đã lưu key. Để trống ô key để giữ nguyên.'
      : 'Key đã lưu không dùng được với tài khoản Windows này. Hãy nhập lại key.'
    : 'Chưa lưu key. Nhập key nếu provider yêu cầu.'
  for (const card of refs.providerList.querySelectorAll<HTMLButtonElement>('button[data-provider]'))
    card.setAttribute('aria-pressed', String(card.dataset.provider === value?.id))
  for (const row of refs.addList.querySelectorAll<HTMLButtonElement>('button[data-offer]'))
    row.setAttribute('aria-pressed', String(!value && refs.chooser.value === `new:${row.dataset.offer}`))
  refs.pageTitle.textContent = value?.displayName ?? `Thêm ${template?.displayName ?? 'Custom model API'}`
}

function showStep(refs: SettingsRefs, wizard: boolean, step: number) {
  refs.dialog.classList.toggle('settings-wizard', wizard)
  refs.title.textContent = wizard ? `Thêm provider · ${step}/3` : 'Cài đặt model'
  // The popup picks providers from its left column; the step-1 chooser stays in the DOM because the rows drive it.
  refs.providerStep.hidden = !wizard || step !== 1
  refs.pageTitle.hidden = wizard
  refs.connectionHeading.textContent = wizard ? '2 · Thông tin kết nối và tên' : 'Kết nối'
  refs.modelHeading.textContent = wizard ? '3 · Thêm model' : 'Model'
  if (wizard && refs.providerList.parentElement !== refs.savedProviders) refs.savedProviders.append(refs.providerList)
  else if (!wizard && refs.providerList.parentElement !== refs.nav) refs.nav.prepend(refs.providerList)
  refs.connection.hidden = wizard && step !== 2
  refs.credentials.hidden = wizard && step !== 2
  refs.modelSection.hidden = wizard && step !== 3
  refs.next.hidden = !wizard || step !== 1
  refs.previous.hidden = !wizard || step !== 2
  refs.finish.hidden = !wizard || step !== 3
  refs.save.hidden = wizard && step === 1
  refs.remove.hidden = wizard
  refs.save.textContent = wizard && step === 2 ? 'Lưu kết nối →' : 'Lưu'
  // Validation concerns the visible step. Step 3 uses the connection just saved.
  refs.connection.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select').forEach(input => {
    input.disabled = false
  })
}

function lockConnection(refs: SettingsRefs, locked: boolean) {
  if (locked)
    refs.connection.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select').forEach(input => {
      input.disabled = true
    })
  refs.key.disabled = locked
}

export function createSettingsDom(actions: SettingsDomActions) {
  const refs = createRefs(actions)
  return {
    ...refs,
    setBusy: (busy: boolean, hasSavedProvider: boolean) => setBusy(refs, busy, hasSavedProvider),
    fillForm: (value: ProviderSettings | undefined, builtIns: readonly ProviderTemplate[], wizard: boolean) =>
      fillForm(refs, value, builtIns, wizard),
    showStep: (wizard: boolean, step: number) => showStep(refs, wizard, step),
    lockConnection: (locked: boolean) => lockConnection(refs, locked),
  }
}

type SettingsRefs = ReturnType<typeof createRefs>
export type SettingsDom = ReturnType<typeof createSettingsDom>
