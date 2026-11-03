import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { materialBrowser, eventually } from './fixtures/material-browser.mjs'

test('missing reference explains the project-folder lookup failure without claiming file corruption', {
  timeout: 45000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-reference-feedback-'))
  const source = join(root, 'source')
  await mkdir(source)
  await writeFile(join(source, 'exists.txt'), 'FIXTURE_ONLY')
  let modelCalls = 0
  const app = await startLocalWeb({
    dataDir: join(root, 'data'),
    materials: { maxFileBytes: 1024, maxAttachments: 2 },
    selection: { provider: 'fixture', model: 'reference' },
    model: {
      async *stream() {
        modelCalls++
        yield { type: 'finish', reason: 'stop' }
      },
    },
  })
  const response = await fetch(`${app.origin}/api/workspaces`, {
    method: 'POST',
    headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ projectFolder: source }),
  })
  assert.equal(response.status, 201)
  const workspace = await response.json()
  const teardown = []
  t.after(async () => {
    for (const fn of teardown) await fn()
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  const { evaluate } = await materialBrowser(
    { after: fn => teardown.push(fn) },
    root,
    `${app.origin}/#token=${app.token}`,
  )
  await eventually(
    () =>
      evaluate(
        `document.querySelector('[aria-label="Workspace"]')?.options.length>1 && !document.querySelector('[aria-label="Workspace"]').disabled`,
      ),
    'Workspace navigation unavailable',
  )
  await evaluate(
    `document.querySelector('[aria-label="Workspace"]').value=${JSON.stringify(workspace.id)}; document.querySelector('[aria-label="Workspace"]').dispatchEvent(new Event('change')); document.querySelector('[data-action="new-chat"]').click(); true`,
  )
  await eventually(
    () =>
      evaluate(
        `!document.querySelector('.materials-preparation').hidden && !document.querySelector('[aria-label="Tham chiếu file hoặc thư mục"]').disabled && document.querySelector('[aria-current=true]')!==null`,
      ),
    'Reference intake unavailable',
  )
  const reference = async name =>
    evaluate(
      `document.querySelector('[aria-label="Tham chiếu file hoặc thư mục"]').value=${JSON.stringify(name)}; [...document.querySelectorAll('.materials-preparation button')].find(button=>button.textContent==='Thêm tham chiếu').click(); true`,
    )
  await reference('missing.txt')
  await eventually(
    () => evaluate(`!!document.querySelector('.materials-preparation [data-status=rejected]')`),
    'Missing reference was not rejected',
  )
  const text = await evaluate(`document.querySelector('.materials-preparation [data-status=rejected]').textContent`)
  assert.match(text, /project folder/i)
  assert.equal(text.includes('bị hỏng'), false)
  await evaluate(
    `[...document.querySelectorAll('.materials-preparation [data-status=rejected] button')].find(button=>button.textContent==='Gỡ').click(); true`,
  )
  await eventually(
    () => evaluate(`!document.querySelector('.materials-preparation [data-status=rejected]')`),
    'Reference removal failed',
  )
  await reference('exists.txt')
  await eventually(
    () => evaluate(`!!document.querySelector('.materials-preparation [data-status=ready]')`),
    'Existing reference should be ready before approval',
  )
  assert.equal(modelCalls, 0, 'Naming references must not start model work')
})

test('browser retains ready/rejected material drafts on reload and sends an attachment-only request', {
  timeout: 60000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-material-browser-'))
  const app = await startLocalWeb({
    dataDir: join(root, 'data'),
    materials: { maxFileBytes: 2048, maxAttachments: 3 },
    selection: { provider: 'fixture', model: 'material' },
    model: {
      async *stream(request) {
        if (request.messages.at(-1).role === 'user') {
          const id = /"materialId":"([\w-]+)"/.exec(request.messages.find(m => m.role === 'system')?.content)?.[1]
          yield { type: 'tool-call', call: { id: 'read', name: 'read_material', arguments: { materialId: id } } }
          yield { type: 'finish', reason: 'tool-calls' }
        } else {
          yield { type: 'text-delta', text: 'MATERIAL_BROWSER_OK' }
          yield { type: 'finish', reason: 'stop' }
        }
      },
    },
  })
  // Register cleanup after browser teardown so Windows releases the profile first.
  const cleanup = t.after.bind(t)
  const teardown = []
  const browser = await materialBrowser({ after: fn => teardown.push(fn) }, root, `${app.origin}/#token=${app.token}`)
  cleanup(async () => {
    for (const fn of teardown) await fn()
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  const { evaluate, call } = browser
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.composer select')?.options.length>1 && !document.querySelector('.composer select').disabled`,
      ),
    'Composer unavailable',
  )
  await evaluate(
    `document.querySelector('.composer select').selectedIndex=1; document.querySelector('.composer select').dispatchEvent(new Event('change')); true`,
  )
  await eventually(
    () => evaluate(`!document.querySelector('[aria-label="Đính kèm tài liệu"]').disabled`),
    'Material intake unavailable',
  )
  const add = async (name, text) =>
    evaluate(
      `(() => { const input=document.querySelector('.materials-preparation input[type=file]'); const data=new DataTransfer(); data.items.add(new File([${JSON.stringify(text)}],${JSON.stringify(name)})); input.files=data.files; input.dispatchEvent(new Event('change')); return true })()`,
    )
  await evaluate(
    `window.materialOriginalFetch=window.fetch; window.fetch=(...args)=>String(args[0]).endsWith('/attachments')?new Promise(()=>{}):window.materialOriginalFetch(...args); true`,
  )
  await add('interrupted.txt', 'not sent')
  await eventually(
    () => evaluate(`!!document.querySelector('.materials-preparation [data-status=preparing]')`),
    'Preparing placeholder missing',
  )
  await call('Page.reload')
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.materials-preparation [data-status=rejected]')?.textContent.includes('interrupted.txt')`,
      ),
    'Interrupted upload was silently lost',
  )
  assert.equal(await evaluate(`document.querySelector('.composer [aria-label="Send request"]').disabled`), true)
  await evaluate(
    `[...document.querySelectorAll('.materials-preparation [data-status=rejected] button')].find(button=>button.textContent==='Gỡ').click(); true`,
  )
  await eventually(
    () => evaluate(`!document.querySelector('.materials-preparation [data-status=rejected]')`),
    'Interrupted placeholder cannot be removed',
  )
  await add('notes.txt', 'BROWSER_SOURCE_FACT')
  await eventually(
    () => evaluate(`!!document.querySelector('.materials-preparation [data-status=ready]')`),
    'Attachment not ready',
  )
  await evaluate(
    `Object.keys(sessionStorage).filter(key=>key.startsWith('deckagent-material-draft:')).forEach(key=>sessionStorage.removeItem(key)); true`,
  )
  await call('Page.reload')
  await eventually(
    () => evaluate(`document.querySelector('.materials-preparation')?.textContent.includes('notes.txt')`),
    'Material draft lost after reload',
  )
  await add('broken.png', 'not PNG')
  await eventually(
    () => evaluate(`!!document.querySelector('.materials-preparation [data-status=rejected]')`),
    'Corrupt image not rejected',
  )
  assert.equal(await evaluate(`document.querySelector('.composer [aria-label="Send request"]').disabled`), true)
  await evaluate(
    `document.querySelector('.composer textarea').value='DRAFT_KEPT'; document.querySelector('.composer textarea').dispatchEvent(new Event('input')); true`,
  )
  await call('Page.reload')
  await eventually(
    () => evaluate(`!!document.querySelector('.materials-preparation [data-status=rejected]')`),
    'Rejected chip lost after reload',
  )
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'DRAFT_KEPT')
  await evaluate(
    `[...document.querySelectorAll('.materials-preparation [data-status=rejected] button')].find(button=>button.textContent==='Gỡ').click(); true`,
  )
  await eventually(
    () =>
      evaluate(
        `!document.querySelector('.materials-preparation [data-status=rejected]') && !document.querySelector('.composer [aria-label="Send request"]').disabled`,
      ),
    'Removal did not unblock request',
  )
  await evaluate(
    `document.querySelector('.composer textarea').value=''; document.querySelector('.composer textarea').dispatchEvent(new Event('input')); document.querySelector('.composer').requestSubmit(); true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('.messages')?.textContent.includes('MATERIAL_BROWSER_OK')`),
    'Attachment-only request did not finish',
  )
  assert.equal(await evaluate(`document.querySelector('.materials-preparation [data-material-id]')===null`), true)
  assert.equal(await evaluate(`document.querySelector('.messages').textContent.includes('notes.txt')`), true)
})
