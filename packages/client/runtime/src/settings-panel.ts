import type { ModelDescriptor, ProviderSettings, ProviderTemplate } from '@deckagent/host-api'
import type { ManagementClient } from './management-client.ts'
import { button, element, field } from './dom.ts'

export function settingsPanel(client: ManagementClient, changed: () => Promise<void>, workspace: HTMLElement, returned: () => void) {
  const dialog = element('dialog', undefined, 'settings-dialog')
  const title = element('h2', 'Cài đặt Provider')
  const message = element('p')
  message.setAttribute('role', 'status')
  const chooser = element('select')
  const providerList = element('section', undefined, 'provider-list')
  providerList.setAttribute('aria-label', 'Configured providers')
  const kind = element('select')
  const form = element('form')
  const defaultPermission = element('select')
  defaultPermission.append(new Option('Workspace Access', 'workspace-access'), new Option('Provided Materials Only', 'provided-materials-only'))
  const permissionStatus = element('p')
  permissionStatus.setAttribute('role', 'status')
  const defaultSection = element('section', undefined, 'permission-default')
  defaultSection.append(field('Default permission for new Chats', defaultPermission),
    button('Lưu quyền mặc định', () => {
      defaultPermission.disabled = true
      client.defaultPermission(defaultPermission.value === 'provided-materials-only' ? 'provided-materials-only' : 'workspace-access')
        .then(() => { permissionStatus.textContent = 'Đã lưu. Chỉ áp dụng cho Chat mới.' })
        .catch(() => { permissionStatus.textContent = 'Không lưu được quyền mặc định.' })
        .finally(() => { defaultPermission.disabled = false })
    }), permissionStatus)
  const fields = element('fieldset')
  const id = element('input')
  id.required = true
  id.pattern = '[A-Za-z0-9_.-]+'
  id.maxLength = 100
  const name = element('input')
  name.required = true
  name.maxLength = 100
  const protocol = element('select')
  for (const value of ['chat-completions', 'responses', 'anthropic-messages', 'gemini']) protocol.append(new Option(value, value))
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
  const metadataModel = element('select')
  const metadataName = element('input')
  const contextWindow = element('input')
  contextWindow.type = 'number'; contextWindow.min = '1'; contextWindow.step = '1'
  const maxOutput = element('input')
  maxOutput.type = 'number'; maxOutput.min = '1'; maxOutput.step = '1'
  const inputModalities = element('input')
  inputModalities.placeholder = 'text, image, audio, video'
  const reasoningOptions = element('textarea')
  reasoningOptions.rows = 3
  reasoningOptions.placeholder = 'Label=api_value, one per line'
  const metadataFields = element('section', undefined, 'model-metadata')
  metadataFields.append(element('h4', 'Model settings'), field('Model ID', metadataModel), field('Display name', metadataName),
    field('Context window', contextWindow), field('Max output tokens', maxOutput),
    field('Input modalities', inputModalities), field('Reasoning levels (label=API value)', reasoningOptions))
  const available = element('select')
  available.multiple = true
  available.size = 5
  const loadCatalog = button('Load model catalog', () => {
    const providerId = chooser.value
    if (!providerId) return
    perform(async () => {
      const catalog = await client.catalog(providerId)
      available.replaceChildren(...catalog.map(id => new Option(id, id)))
      if (available.parentElement) available.parentElement.hidden = !catalog.length
      addCatalog.hidden = !catalog.length
      message.textContent = catalog.length
        ? 'Chọn model để thêm hoặc nhập model ID bằng tay. Catalog không bảo đảm quyền truy cập hoặc tương thích.'
        : 'Catalog trống. Bạn có thể nhập model ID bằng tay.'
    }).catch(showUnexpected)
  })
  const addCatalog = button('Add selected models', () => {
    const added = [...available.selectedOptions].map(option => option.value)
    models.value = [
      ...new Set([
        ...models.value
          .split(/\r?\n/)
          .map(value => value.trim())
          .filter(Boolean),
        ...added,
      ]),
    ].join('\n')
  })
  const save = element('button', 'Save provider')
  save.type = 'submit'
  const remove = button('Delete provider', () => {
    if (
      !chooser.value ||
      !confirm('Xóa cấu hình provider này? Chat vẫn giữ lịch sử và sẽ cần chọn model khác.')
    )
      return
    perform(async () => {
      await client.remove(chooser.value)
      await refresh()
      await changed()
    }).catch(showUnexpected)
  })
  let providers: readonly ProviderSettings[] = []
  let builtIns: readonly ProviderTemplate[] = []
  let busy = false
  let opening = false
  let baseline = ''
  let selectedId = ''
  let selectedKind = ''
  let wizard = false
  let step = 1
  let metadataDraft: ModelDescriptor[] = []
  const snapshot = () => JSON.stringify([id.value, name.value, protocol.value, url.value, key.value, removeKey.checked, models.value, manual.value, metadataDraft,
    metadataName.value, contextWindow.value, maxOutput.value, inputModalities.value, reasoningOptions.value])
  const canDiscard = () => !busy && (snapshot() === baseline || confirm('Bỏ các thay đổi chưa lưu? Cấu hình đã lưu và nội dung chat vẫn được giữ.'))
  function showUnexpected() {
    message.textContent = 'Không cập nhật được cài đặt.'
  }
  function fill(value?: ProviderSettings) {
    const template = builtIns.find(template => template.id === (value?.id ?? kind.value))
    id.value = value?.id ?? template?.id ?? ''
    id.disabled = !!value || !!template
    name.value = value?.displayName ?? template?.displayName ?? ''
    protocol.value = value?.protocol ?? template?.protocol ?? 'chat-completions'
    protocol.disabled = !!value || !!template
    url.value = value?.baseUrl ?? template?.baseUrl ?? ''
    url.disabled = !!template
    key.value = ''
    removeKey.checked = false
    removeKey.disabled = !!template
    key.required = !!template && !value?.keyAvailable
    models.value = value?.models.join('\n') ?? ''
    metadataDraft = [...structuredClone(value?.modelMetadata ?? [])]
    refreshMetadataModels()
    manual.value = ''
    remove.disabled = !value
    remove.hidden = wizard || !value
    loadCatalog.disabled = !value
    available.replaceChildren()
    if (available.parentElement) available.parentElement.hidden = true
    addCatalog.hidden = true
    for (const input of [id, protocol, url]) if (input.parentElement) input.parentElement.hidden = !!template
    if (kind.parentElement) kind.parentElement.hidden = true
    if (removeKey.parentElement) removeKey.parentElement.hidden = !!template
    message.textContent = value?.hasKey
      ? value.keyAvailable ? 'Đã lưu key. Để trống ô key để giữ nguyên.' : 'Key đã lưu không dùng được với tài khoản Windows này. Hãy nhập lại key.'
      : 'Chưa lưu key. Nhập key nếu provider yêu cầu.'
    for (const card of providerList.querySelectorAll<HTMLButtonElement>('button[data-provider]'))
      card.setAttribute('aria-pressed', String(card.dataset.provider === value?.id))
    baseline = snapshot()
    renderModels()
  }
  kind.addEventListener('change', () => {
    if (!canDiscard()) { kind.value = selectedKind; return }
    selectedKind = kind.value
    chooser.value = `new:${kind.value || 'custom'}`
    selectedId = chooser.value
    fill()
  })
  chooser.addEventListener('change', () => {
    if (!canDiscard()) { chooser.value = selectedId; return }
    selectedId = chooser.value
    const value = providers.find(provider => provider.id === chooser.value)
    kind.value = value ? builtIns.some(template => template.id === value.id) ? value.id : ''
      : chooser.value.startsWith('new:') && chooser.value !== 'new:custom' ? chooser.value.slice(4) : ''
    kind.disabled = !!value
    selectedKind = kind.value
    fill(value)
  })
  async function refresh(selectedId = '') {
    defaultPermission.value = await client.defaultPermission()
    const settings = await client.settings()
    providers = settings.providers
    builtIns = settings.builtIns
    kind.replaceChildren(
      ...builtIns.map(template => {
        const option = new Option(template.displayName, template.id)
        option.disabled = providers.some(provider => provider.id === template.id)
        return option
      }),
      new Option('Custom model API', ''),
    )
    kind.value = ''
    kind.disabled = false
    const saved = element('optgroup')
    saved.label = 'Cấu hình đã lưu'
    for (const provider of providers) saved.append(new Option(provider.displayName, provider.id))
    const offered = element('optgroup')
    offered.label = 'Thêm cấu hình'
    for (const template of builtIns) if (!providers.some(provider => provider.id === template.id))
      offered.append(new Option(template.displayName, `new:${template.id}`))
    offered.append(new Option('Custom model API', 'new:custom'))
    chooser.replaceChildren(saved, offered)
    providerList.replaceChildren(element('h3', 'Your providers'))
    if (!providers.length) providerList.append(element('p', 'Chưa có provider. Thêm kết nối bên dưới.'))
    for (const provider of providers) {
      const card = button('', () => {
        if (busy) return
        chooser.value = provider.id
        chooser.dispatchEvent(new Event('change'))
      })
      card.dataset.provider = provider.id
      card.append(element('strong', provider.displayName),
        element('small', `${builtIns.some(template => template.id === provider.id) ? 'Built-in' : 'Custom API'} · ${provider.keyAvailable ? 'Có key' : provider.hasKey ? 'Key đã lưu không dùng được' : 'Chưa có key'}`),
        element('span', provider.models.length ? provider.models.join(' · ') : 'Chưa thêm model'))
      providerList.append(card)
    }
    chooser.value = selectedId || 'new:custom'
    const value = providers.find(provider => provider.id === selectedId)
    kind.value = builtIns.some(template => template.id === value?.id) ? value!.id : ''
    kind.disabled = !!value
    selectedKind = kind.value
    fill(value)
    if (!settings.persistentKeys)
      message.textContent = 'Lưu key cần Windows. Kết nối đã có từ biến môi trường vẫn dùng được.'
  }
  async function perform(action: () => Promise<void>) {
    if (busy) return
    busy = true
    fields.disabled = true
    save.disabled = true
    chooser.disabled = true
    for (const card of providerList.querySelectorAll<HTMLButtonElement>('button')) card.disabled = true
    remove.disabled = true
    close.disabled = true
    cancel.disabled = true
    next.disabled = true
    try {
      await action()
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      message.textContent =
        code === 'PROVIDER_BUSY'
          ? 'Provider đang được sử dụng. Đợi yêu cầu kết thúc trước khi xóa.'
          : code === 'NEW_ENDPOINT_REQUIRES_KEY'
            ? 'Nhập key cho endpoint mới hoặc chọn gỡ key đã lưu.'
            : code === 'PROVIDER_NAME_EXISTS'
              ? 'Hãy chọn tên hiển thị không trùng.'
              : code === 'INVALID_MODEL_METADATA'
                ? 'Kiểm tra model settings: số phải dương, max output không vượt context window, modality là text/image/audio/video và reasoning dùng Label=api_value duy nhất.'
              : 'Không lưu được cài đặt. Kiểm tra các trường và quyền của Host.'
    } finally {
      busy = false
      fields.disabled = false
      save.disabled = false
      chooser.disabled = false
      for (const card of providerList.querySelectorAll<HTMLButtonElement>('button')) card.disabled = false
      remove.disabled = !providers.some(provider => provider.id === chooser.value)
      close.disabled = false
      cancel.disabled = false
      next.disabled = false
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault()
    const credential = key.value
    key.value = ''
    const value = {
      displayName: name.value,
      protocol: protocol.value,
      baseUrl: url.value,
      models: models.value
        .split(/\r?\n/)
        .map(value => value.trim())
        .filter(Boolean),
      modelMetadata: metadataDraft.filter(item => models.value.split(/\r?\n/).map(value => value.trim()).includes(item.model))
        .map(item => protocol.value === 'responses' ? item : { provider: item.provider, model: item.model,
          ...(item.displayName ? { displayName: item.displayName } : {}),
          ...(item.contextWindow ? { contextWindow: item.contextWindow } : {}),
          ...(item.maxOutputTokens ? { maxOutputTokens: item.maxOutputTokens } : {}),
          ...(item.inputModalities ? { inputModalities: item.inputModalities } : {}),
        }),
      ...(removeKey.checked ? { key: '' } : credential ? { key: credential } : {}),
    }
    perform(async () => {
      await client.save(id.value, value)
      await refresh(id.value)
      selectedId = chooser.value
      await changed()
      message.textContent = 'Đã lưu cấu hình. Bạn có thể chọn model trong chat.'
      if (wizard && step === 2) { step = 3; renderStep() }
      else if (wizard && step === 3) message.textContent = 'Đã lưu model. Bấm Xong để quay lại chat; model chưa được tự chọn.'
    }).catch(showUnexpected)
  })
  function requestClose() {
    if (!dialog.open) return true
    if (!canDiscard()) return false
    key.value = ''
    dialog.close()
    delete workspace.dataset.view
    return true
  }
  const close = button('◀', requestClose)
  close.className = 'settings-back'
  close.title = 'Quay lại chat'
  close.setAttribute('aria-label', 'Quay lại chat')
  const cancel = button('Hủy', requestClose)
  const connection = element('section', undefined, 'settings-section')
  connection.append(element('h3', 'Connection'),
    field('Provider type', kind),
    field('Provider ID', id),
    field('Display name', name),
    field('API protocol', protocol),
    field('Base URL', url),
  )
  const credentials = element('section', undefined, 'settings-section')
  credentials.append(element('h3', 'API key'), element('p', 'Saved keys are never displayed. Leave blank to keep the saved key.'),
    field('API key', key), field('Remove saved key', removeKey))
  const modelSection = element('section', undefined, 'settings-section')
  modelSection.append(element('h3', 'Models'), element('p', 'Enter exact model IDs, one per line. Removing an ID affects future requests; chat history is kept.'),
    field('Added model IDs', models),
    loadCatalog,
    field('Model catalog', available),
    addCatalog,
  )
  const modelChips = element('div', undefined, 'model-chips')
  const manual = element('input')
  manual.placeholder = 'Model ID, kể cả ID không có trong catalog'
  manual.setAttribute('aria-label', 'Thêm bằng model ID')
  const addManual = button('Thêm', () => {
    const value = manual.value.trim()
    if (!value) return
    models.value = [...new Set([...models.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean), value])].join('\n')
    manual.value = ''
    renderModels()
  })
  manual.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); addManual.click() }
  })
  function renderModels() {
    modelChips.replaceChildren()
    for (const model of models.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean)) {
      const chip = element('span', undefined, 'model-chip')
      const remove = button('×', () => {
        models.value = models.value.split(/\r?\n/).filter(value => value.trim() !== model).join('\n')
        renderModels()
        manual.focus()
      })
      remove.setAttribute('aria-label', `Gỡ model ${model}`)
      chip.append(element('span', model), remove)
      modelChips.append(chip)
    }
    refreshMetadataModels()
  }
  function refreshMetadataModels() {
    const selected = metadataModel.value
    const ids = [...new Set(models.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean))]
    metadataModel.replaceChildren(...ids.map(value => new Option(value, value)))
    metadataModel.value = ids.includes(selected) ? selected : ids[0] ?? ''
    metadataFields.hidden = !ids.length
    showMetadata()
  }
  function showMetadata() {
    const entry = metadataDraft.find(item => item.model === metadataModel.value)
    metadataName.value = entry?.displayName ?? ''
    contextWindow.value = entry?.contextWindow?.toString() ?? ''
    maxOutput.value = entry?.maxOutputTokens?.toString() ?? ''
    inputModalities.value = entry?.inputModalities?.join(', ') ?? ''
    reasoningOptions.value = entry?.reasoningOptions?.map(option => `${option.label}=${option.apiValue}`).join('\n') ?? ''
    reasoningOptions.disabled = protocol.value !== 'responses'
    reasoningOptions.parentElement!.hidden = protocol.value !== 'responses'
  }
  metadataModel.addEventListener('change', showMetadata)
  protocol.addEventListener('change', showMetadata)
  const saveMetadataDraft = () => {
    if (!metadataModel.value) return
    const descriptor: ModelDescriptor = { provider: id.value, model: metadataModel.value,
      ...(metadataName.value.trim() ? { displayName: metadataName.value.trim() } : {}),
      ...(contextWindow.value ? { contextWindow: Number(contextWindow.value) } : {}),
      ...(maxOutput.value ? { maxOutputTokens: Number(maxOutput.value) } : {}),
      ...(inputModalities.value.trim() ? { inputModalities: inputModalities.value.split(',').map(value => value.trim()) as ('text' | 'image' | 'audio' | 'video')[] } : {}),
      ...(protocol.value === 'responses' && reasoningOptions.value.trim() ? { reasoningOptions: reasoningOptions.value.split(/\r?\n/).map(line => {
        const separator = line.indexOf('=')
        return separator < 0 ? { label: line.trim(), apiValue: '' }
          : { label: line.slice(0, separator).trim(), apiValue: line.slice(separator + 1).trim() }
      }) } : {}),
    }
    metadataDraft = metadataDraft.filter(item => item.model !== descriptor.model)
    if (Object.keys(descriptor).length > 2) metadataDraft.push(descriptor)
  }
  for (const input of [metadataName, contextWindow, maxOutput, inputModalities, reasoningOptions]) input.addEventListener('input', saveMetadataDraft)
  models.addEventListener('input', renderModels)
  addCatalog.addEventListener('click', renderModels)
  const manualRow = element('div', undefined, 'manual-model-row')
  manualRow.append(manual, addManual)
  const advanced = element('details', undefined, 'model-raw-editor')
  advanced.append(element('summary', 'Sửa danh sách model ID'), field('Added model IDs', models))
  // Catalog and manual entry share the same draft; nothing persists until Save.
  modelSection.replaceChildren(element('h3', '3 · Thêm model'),
    element('p', 'Catalog không bảo đảm quyền truy cập hoặc tương thích. Bạn có thể thêm model ID bằng tay.'),
    modelChips, manualRow, loadCatalog, field('Model catalog', available), addCatalog, metadataFields, advanced)
  const savedProviders = element('details', undefined, 'saved-providers')
  savedProviders.append(element('summary', 'Cấu hình đã lưu'), providerList)
  const providerStep = element('section', undefined, 'provider-step')
  providerStep.append(element('h3', '1 · Chọn provider'),
    element('p', 'Key lấy từ tài khoản của bạn với provider. Yêu cầu dùng cấu hình này sẽ được gửi tới provider đó.'),
    field('Provider configuration', chooser), field('Provider type', kind), savedProviders)
  connection.querySelector('h3')!.textContent = '2 · Thông tin kết nối và tên'
  // Provider selection belongs to step 1, not to the connection form.
  for (const label of [...connection.querySelectorAll('label')]) if (label.querySelector('span')?.textContent === 'Provider type') label.remove()
  const footer = element('footer', undefined, 'settings-footer')
  const next = button('Tiếp tục →', () => {
    if (step === 1) { step = 2; renderStep(); name.focus() }
  })
  const previous = button('← Quay lại', () => { if (canDiscard()) { step = 1; renderStep() } })
  const finish = button('Xong', requestClose)
  footer.append(remove, previous, next, finish, cancel, save)
  save.setAttribute('form', 'provider-settings-form')
  form.id = 'provider-settings-form'
  fields.append(providerStep, connection, credentials, modelSection)
  form.append(fields)
  const header = element('header', undefined, 'settings-header')
  header.append(close, title)
  const body = element('div', undefined, 'settings-body')
  body.append(message, defaultSection, form)
  dialog.append(header, body, footer)
  dialog.addEventListener('cancel', event => { event.preventDefault(); requestClose() })
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !wizard) { event.preventDefault(); requestClose() }
  })
  dialog.addEventListener('close', () => {
    key.value = ''
    delete workspace.dataset.view
    returned()
  })
  workspace.append(dialog)
  function renderStep() {
    dialog.classList.toggle('settings-wizard', wizard)
    title.textContent = wizard ? `Thêm provider · ${step}/3` : 'Cài đặt Provider'
    providerStep.hidden = wizard && step !== 1
    connection.hidden = wizard && step !== 2
    credentials.hidden = wizard && step !== 2
    modelSection.hidden = wizard && step !== 3
    next.hidden = !wizard || step !== 1
    previous.hidden = !wizard || step !== 2
    finish.hidden = !wizard || step !== 3
    save.hidden = wizard && step === 1
    remove.hidden = wizard
    save.textContent = wizard && step === 2 ? 'Lưu kết nối →' : 'Lưu'
    // Validation concerns the visible step. Step 3 uses the connection just saved.
    connection.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select').forEach(input => { input.disabled = false })
    fill(providers.find(provider => provider.id === chooser.value))
    if (wizard && step !== 2) connection.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select').forEach(input => { input.disabled = true })
    key.disabled = wizard && step !== 2
  }
  // Keep stable English field identities for existing automation; translate visible labels.
  const labels: Readonly<Record<string, string>> = { 'Provider configuration': 'Provider', 'Provider type': 'Loại provider',
    'Provider ID': 'Provider ID', 'Display name': 'Tên hiển thị', 'API protocol': 'API protocol', 'Base URL': 'Base URL',
    'API key': 'Key', 'Remove saved key': 'Gỡ key đã lưu', 'Added model IDs': 'Danh sách model ID', 'Model catalog': 'Model catalog' }
  for (const label of dialog.querySelectorAll('label')) {
    const span = label.querySelector('span')
    if (span && labels[span.textContent ?? '']) span.textContent = labels[span.textContent ?? '']!
  }
  credentials.querySelector('p')!.textContent = 'Sau khi lưu, không hiện lại bất kỳ phần nào của key. Để trống để giữ key đã lưu.'
  loadCatalog.textContent = 'Lấy model catalog'
  addCatalog.textContent = 'Thêm model đã chọn'
  remove.textContent = 'Xóa cấu hình'
  return {
    leave: requestClose,
    open: async (quick = false) => {
      if (dialog.open || opening) return
      opening = true
      try {
        wizard = quick
        step = 1
        await refresh()
        selectedId = chooser.value
        renderStep()
        if (wizard) dialog.showModal()
        else { workspace.dataset.view = 'settings'; dialog.show() }
        close.focus()
      } finally { opening = false }
    },
  }
}
