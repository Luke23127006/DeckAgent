import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { ConfirmationClient } from '../apps/web/lib/browser/index.js'
import * as design from '../packages/presentation/design/lib/index.js'

const longBullet =
  'Rừng và đại dương đều là những môi trường tự nhiên quan trọng, nuôi dưỡng sự sống và giữ cân bằng cho Trái Đất.'

test('confirmation preserves a layout rejection instead of reporting a connection failure', async t => {
  const server = createServer((req, res) => {
    req.resume()
    res.writeHead(409, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        error: {
          code: 'DESIGN_LAYOUT_INCOMPATIBLE',
          message: 'Request could not be completed',
        },
      }),
    )
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(
    () =>
      new Promise(resolve => {
        server.closeAllConnections()
        server.close(resolve)
      }),
  )
  const client = new ConfirmationClient(`http://127.0.0.1:${server.address().port}`, 'fixture')
  await assert.rejects(client.confirm('chat', {}), { message: 'DESIGN_LAYOUT_INCOMPATIBLE' })
})

test('layout review identifies the 111-character image-pair bullet and keeps legacy fallback valid', () => {
  assert.equal([...longBullet].length, 111)
  const slides = [
    {
      title: 'Rừng và đại dương',
      blocks: [
        { kind: 'web-image', query: 'forest', caption: 'Rừng', required: true },
        { kind: 'web-image', query: 'ocean', caption: 'Đại dương', required: true },
        { kind: 'bullets', items: [longBullet] },
      ],
    },
  ]
  assert.deepEqual(design.reviewLayouts(slides, { id: 'html-basic', version: 2 }), [])
  const issues = design.reviewLayouts(slides, { id: 'html-basic', version: 3 })
  assert.equal(issues.length, 1)
  assert.equal(issues[0].path, 'slides[0].blocks[2].items[0]')
  assert.equal(issues[0].actual, 111)
  assert.equal(issues[0].limit, 90)
  assert.equal(issues[0].layoutId, 'image-pair')
  const revised = structuredClone(slides)
  revised[0].blocks[2].items[0] = 'Rừng và đại dương nuôi dưỡng sự sống, góp phần giữ cân bằng môi trường.'
  assert.deepEqual(design.reviewLayouts(revised, { id: 'html-basic', version: 3 }), [])
})

test('layout review counts Unicode characters at the boundary and reports structural incompatibility without content leaks', () => {
  const template = { id: 'html-basic', version: 3 }
  const pair = {
    title: 'Pair',
    blocks: [
      { kind: 'web-image', query: 'forest' },
      { kind: 'web-image', query: 'ocean' },
      { kind: 'bullets', items: ['🌳'.repeat(90)] },
    ],
  }
  assert.deepEqual(design.reviewLayouts([pair], template), [])
  pair.blocks[2].items[0] += '🌳'
  const issue = design.reviewLayouts([pair], template)[0]
  assert.equal(issue.actual, 91)
  assert.equal(issue.limit, 90)
  assert.ok(!JSON.stringify(issue).includes('🌳'))
  const invalidShape = { title: 'Unsupported', blocks: [...pair.blocks, { kind: 'web-image', query: 'mountain' }] }
  assert.equal(design.reviewLayouts([invalidShape], template)[0].path, 'slides[0].blocks')
  assert.equal(
    design.reviewLayouts(
      Array.from({ length: 40 }, () => invalidShape),
      template,
    ).length,
    32,
  )
})
