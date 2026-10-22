import type { ProviderSettings, ProviderTemplate } from '@deckagent/host-api'
import type { ManagementClient } from './management-client.ts'
import { button, element, field } from './dom.ts'

export function settingsPanel(client: ManagementClient, changed: () => Promise<void>) {
  const dialog = element('dialog', undefined, 'settings-dialog')
  const title = element('h2', 'Models & providers')
  const message = element('p')
  message.setAttribute('role', 'status')
  const chooser = element('select')
  const providerList = element('section', undefined, 'provider-list')
  providerList.setAttribute('aria-label', 'Configured providers')
  const kind = element('select')
  const form = element('form')
  const fields = element('fieldset')
  const id = element('input')
  id.required = true
  id.pattern = '[A-Za-z0-9_.-]+'
  id.maxLength = 100
  const name = element('input')
  name.required = true
  name.maxLength = 100
  const protocol = element('select')
  for (const value of ['chat-completions', 'anthropic-messages', 'gemini']) protocol.append(new Option(value, value))
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
  models.placeholder = 'One model ID per line'
  const available = element('select')
  available.multiple = true
  available.size = 5
  const loadCatalog = button('Load model catalog', () => {
    const providerId = chooser.value
    if (!providerId) return
    perform(async () => {
      const catalog = await client.catalog(providerId)
      available.replaceChildren(...catalog.map(id => new Option(id, id)))
      message.textContent = catalog.length
        ? 'Choose models to add, or enter a model ID by hand. Catalog entries are not an access or compatibility guarantee.'
        : 'The catalog is empty. You can enter model IDs by hand.'
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
      !confirm('Delete this provider configuration? Chats keep their history and will need another model.')
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
  function showUnexpected() {
    message.textContent = 'Unable to update settings.'
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
    remove.disabled = !value
    loadCatalog.disabled = !value
    available.replaceChildren()
    message.textContent = value?.hasKey
      ? value.keyAvailable ? 'A key is saved. Leave the key field blank to keep it.' : 'The saved key is unavailable for this Windows user. Enter the key again.'
      : 'No saved key. Enter the key if this provider requires one.'
    for (const card of providerList.querySelectorAll<HTMLButtonElement>('button[data-provider]'))
      card.setAttribute('aria-pressed', String(card.dataset.provider === value?.id))
  }
  kind.addEventListener('change', () => {
    if (!chooser.value) fill()
  })
  chooser.addEventListener('change', () => {
    const value = providers.find(provider => provider.id === chooser.value)
    kind.value = builtIns.some(template => template.id === value?.id) ? value!.id : ''
    kind.disabled = !!value
    fill(value)
  })
  async function refresh(selectedId = '') {
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
    chooser.replaceChildren(new Option('Add provider', ''))
    for (const provider of providers) chooser.append(new Option(provider.displayName, provider.id))
    providerList.replaceChildren(element('h3', 'Your providers'))
    if (!providers.length) providerList.append(element('p', 'No providers configured. Add a connection below.'))
    for (const provider of providers) {
      const card = button('', () => {
        if (busy) return
        chooser.value = provider.id
        chooser.dispatchEvent(new Event('change'))
      })
      card.dataset.provider = provider.id
      card.append(element('strong', provider.displayName),
        element('small', `${builtIns.some(template => template.id === provider.id) ? 'Built-in' : 'Custom API'} · ${provider.keyAvailable ? 'Key available' : provider.hasKey ? 'Saved key unavailable' : 'No saved key'}`),
        element('span', provider.models.length ? provider.models.join(' · ') : 'No models added'))
      providerList.append(card)
    }
    chooser.value = selectedId
    chooser.dispatchEvent(new Event('change'))
    if (!settings.persistentKeys)
      message.textContent = 'Saving keys requires Windows. Existing environment connections remain available.'
  }
  async function perform(action: () => Promise<void>) {
    if (busy) return
    busy = true
    fields.disabled = true
    save.disabled = true
    chooser.disabled = true
    for (const card of providerList.querySelectorAll<HTMLButtonElement>('button')) card.disabled = true
    remove.disabled = true
    try {
      await action()
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      message.textContent =
        code === 'PROVIDER_BUSY'
          ? 'This provider is in use. Wait for its request to finish before deleting it.'
          : code === 'NEW_ENDPOINT_REQUIRES_KEY'
            ? 'Enter a key for the new endpoint, or explicitly remove the saved key.'
            : code === 'PROVIDER_NAME_EXISTS'
              ? 'Choose a unique display name.'
              : 'Could not save settings. Check the fields and local Host permissions.'
    } finally {
      busy = false
      fields.disabled = false
      save.disabled = false
      chooser.disabled = false
      for (const card of providerList.querySelectorAll<HTMLButtonElement>('button')) card.disabled = false
      remove.disabled = !chooser.value
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
      ...(removeKey.checked ? { key: '' } : credential ? { key: credential } : {}),
    }
    perform(async () => {
      await client.save(id.value, value)
      await refresh(id.value)
      await changed()
      message.textContent = 'Provider saved. Choose its model in your chat.'
    }).catch(showUnexpected)
  })
  const close = button('Close settings', () => {
    key.value = ''
    dialog.close()
  })
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
  fields.append(connection, credentials, modelSection, save, remove)
  form.append(fields)
  dialog.append(title, providerList, field('Provider configuration', chooser), message, form, close)
  dialog.addEventListener('close', () => {
    key.value = ''
  })
  document.body.append(dialog)
  return {
    open: async () => {
      await refresh()
      dialog.showModal()
    },
  }
}
