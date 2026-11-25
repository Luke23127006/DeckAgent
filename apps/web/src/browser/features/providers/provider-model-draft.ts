import type { ManagementClient } from '../../transport/index.ts'
import { button, element } from '../../dom.ts'
export interface ModelDraftNodes {
  models: HTMLTextAreaElement
  available: HTMLSelectElement
  modelChips: HTMLElement
  manual: HTMLInputElement
  addCatalog: HTMLButtonElement
  message: HTMLElement
  chooser: HTMLSelectElement
}
export interface ModelDraftController {
  renderModels(): void
  addManualModel(): void
  addCatalog(): void
  loadCatalog(): void
  values(): string[]
}
function parseModelList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean)
}

function mergeModels(current: string, added: readonly string[]): string {
  return [...new Set([...parseModelList(current), ...added])].join('\n')
}
function renderModels(nodes: ModelDraftNodes) {
  nodes.modelChips.replaceChildren()
  for (const model of parseModelList(nodes.models.value)) {
    const chip = element('span', undefined, 'model-chip')
    const remove = button('', () => {
      nodes.models.value = nodes.models.value
        .split(/\r?\n/)
        .filter(value => value.trim() !== model)
        .join('\n')
      renderModels(nodes)
      nodes.manual.focus()
    })
    remove.setAttribute('aria-label', `Gỡ model ${model}`)
    chip.append(element('span', model), remove)
    nodes.modelChips.append(chip)
  }
}

function addManualModel(nodes: ModelDraftNodes) {
  const value = nodes.manual.value.trim()
  if (!value) return
  nodes.models.value = mergeModels(nodes.models.value, [value])
  nodes.manual.value = ''
  renderModels(nodes)
}

function addCatalog(nodes: ModelDraftNodes) {
  const added = [...nodes.available.selectedOptions].map(option => option.value)
  nodes.models.value = mergeModels(nodes.models.value, added)
  renderModels(nodes)
}
function loadCatalog(
  nodes: ModelDraftNodes,
  client: ManagementClient,
  perform: (action: () => Promise<void>) => Promise<void>,
  showUnexpected: () => void,
) {
  const providerId = nodes.chooser.value
  if (!providerId) return
  perform(async () => {
    const catalog = await client.catalog(providerId)
    nodes.available.replaceChildren(...catalog.map(id => new Option(id, id)))
    if (nodes.available.parentElement) nodes.available.parentElement.hidden = !catalog.length
    nodes.addCatalog.hidden = !catalog.length
    nodes.message.textContent = catalog.length
      ? 'Chọn model để thêm hoặc nhập model ID bằng tay. Catalog không bảo đảm quyền truy cập hoặc tương thích.'
      : 'Catalog trống. Bạn có thể nhập model ID bằng tay.'
  }).catch(showUnexpected)
}
export function createModelDraftController(
  nodes: ModelDraftNodes,
  client: ManagementClient,
  perform: (action: () => Promise<void>) => Promise<void>,
  showUnexpected: () => void,
): ModelDraftController {
  const controller: ModelDraftController = {
    renderModels: () => renderModels(nodes),
    addManualModel: () => addManualModel(nodes),
    addCatalog: () => addCatalog(nodes),
    loadCatalog: () => loadCatalog(nodes, client, perform, showUnexpected),
    values: () => parseModelList(nodes.models.value),
  }
  nodes.models.addEventListener('input', () => renderModels(nodes))
  nodes.manual.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      controller.addManualModel()
    }
  })
  return controller
}
