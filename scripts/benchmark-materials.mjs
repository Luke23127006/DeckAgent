import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, relative, isAbsolute, sep } from 'node:path'
import { parseArgs } from 'node:util'
import { MaterialStore } from '../apps/local-web/lib/types/materials/store.js'
import { documentFixtures } from '../tests/fixtures/material-documents.mjs'

const { values } = parseArgs({ options: { output: { type: 'string' } } })
const destination = values.output ? relative(resolve('.local-only'), resolve(values.output)) : ''
if (!destination || destination === '..' || destination.startsWith(`..${sep}`) || isAbsolute(destination))
  throw new Error('Choose an output file under .local-only')
const root = await mkdtemp(join(tmpdir(), 'deckagent-material-benchmark-'))
const store = await MaterialStore.create(root, { maxFileBytes: 20 * 1024 * 1024, maxAttachments: 10 })
const cases = []
const stream = async function* (bytes) {
  for (let offset = 0; offset < bytes.length; offset += 64 * 1024) yield bytes.subarray(offset, offset + 64 * 1024)
}
async function measure(label, name, bytes) {
  let peakRss = process.memoryUsage().rss
  const timer = setInterval(() => {
    peakRss = Math.max(peakRss, process.memoryUsage().rss)
  }, 5)
  const started = performance.now()
  try {
    const result = await store.upload('benchmark', name, stream(bytes), new AbortController().signal)
    cases.push({
      label,
      bytes: bytes.length,
      status: result.status,
      reason: result.reason ?? null,
      elapsedMs: Math.round(performance.now() - started),
      peakRssBytes: peakRss,
    })
    return result
  } finally {
    clearInterval(timer)
  }
}
try {
  for (const [name, bytes] of Object.entries(documentFixtures())) await measure(`minimal-${name}`, name, bytes)
  for (const size of [64 * 1024, 1024 * 1024, 20 * 1024 * 1024])
    await measure(`text-${size}`, 'notes.txt', Buffer.alloc(size, 65))
  const ten = []
  for (let i = 0; i < 10; i++)
    ten.push(await measure(`ten-files-${i + 1}`, `file${i}.txt`, Buffer.alloc(64 * 1024, 65)))
  const accepted = store.capture(
    { sessionId: 'benchmark', input: '', attachmentIds: ten.map(file => file.materialId) },
    'ten-request',
  )
  const record = {
    date: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    limits: store.limits,
    cases,
    tenNewFilesAccepted: accepted.length === 10,
    verdict: 'MEASUREMENTS ONLY; no owner product-limit approval',
    limitations: [
      'Synthetic/minimal fixtures, not a representative production corpus.',
      'RSS samples include this Node process and its workers, not a hard memory or OS sandbox guarantee.',
      '20 MiB text is rejected by the separate 1 MiB extracted-text safety bound.',
      'No cloud/model/context cost measurement.',
      'No release default is chosen from these results.',
    ],
  }
  await writeFile(values.output, JSON.stringify(record, null, 2) + '\n')
  console.log(
    JSON.stringify({ cases: cases.length, tenNewFilesAccepted: record.tenNewFilesAccepted, output: values.output }),
  )
} finally {
  await store.close()
  await rm(root, { recursive: true, force: true })
}
