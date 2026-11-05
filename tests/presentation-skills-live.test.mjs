import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import test from 'node:test'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
const exec = promisify(execFile)
test(process.env.DECKAGENT_SKILLS_EDIT_ONLY === '1'
  ? 'focused standalone Skill live edit on seeded deck'
  : 'real standalone OpenCode discovers product Skill and creates/confirms/edits through stdio MCP', {
  skip: process.env.DECKAGENT_SKILLS_LIVE !== '1',
  timeout: 600000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY required')
  const profile = await mkdtemp(join(tmpdir(), 'deckagent-skill-live-')),
    deck = new DeckService(join(profile, 'decks.sqlite'))
  t.after(async () => {
    deck.close()
    await rm(profile, { recursive: true, force: true, maxRetries: 8 })
  })
  const host = resolve('apps/local-web/lib/external-host.js'),
    operator = resolve('apps/local-web/lib/external-cli.js')
  const run = async (version, slides, prompt) => {
    let result
    try {
      result = await exec(
        process.execPath,
        [
          host,
          '--profile',
          profile,
          '--session',
          'chat',
          '--version',
          String(version),
          '--slides',
          slides.join(','),
          '--opencode',
          resolve('.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe'),
          '--prompt',
          prompt,
        ],
        { env: process.env, windowsHide: true, maxBuffer: 4000000, timeout: 210000 },
      )
    } catch (error) {
      const partial = String(error.stdout ?? '')
        .split('\n')
        .filter(Boolean)
        .flatMap(line => {
          try {
            const e = JSON.parse(line)
            return e.type === 'tool_use'
              ? [
                  {
                    name: /^[a-z_]+$/.test(e.part?.tool) ? e.part.tool : 'other',
                    status: e.part?.state?.status === 'completed' ? 'completed' : 'other',
                  },
                ]
              : []
          } catch {
            return []
          }
        })
      console.log(
        'FAILED_HOST_METADATA',
        JSON.stringify({
          stage: String(error.stderr ?? '').match(/EXTERNAL_STAGE_[A-Z_]+/)?.[0] ?? 'UNKNOWN',
          tools: partial,
        }),
      )
      throw Error('Standalone host failed; no raw provider/config output logged')
    }
    const events = result.stdout
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line)),
      tools = events
        .filter(e => e.type === 'tool_use')
        .map(e => ({ name: e.part?.tool, status: e.part?.state?.status }))
    console.log('EXTERNAL_SKILL_TOOLS', JSON.stringify(tools))
    assert.ok(
      tools.some(e => e.name === 'skill' && e.status === 'completed'),
      'Product Skill must actually load in native host',
    )
    assert.ok(
      tools.every(e => e.name === 'skill' || e.name.startsWith('deckagent_')),
      'No other native tool execution',
    )
    return tools
  }
  if (process.env.DECKAGENT_SKILLS_EDIT_ONLY === '1')
    deck.proposeOutline('chat', {
      requestId: 'fixture',
      responseIndex: 0,
      draft: {
        overview: 'Recycling',
        slides: [
          { title: 'One', content: 'Why' },
          { title: 'Two', content: 'Actions' },
        ],
      },
    })
  else
    await run(
      0,
      [],
      'Use deckagent-presentation. Propose exactly two Vietnamese slides about recycling: Why recycle; Three immediate actions. Requirements are complete. Propose the outline now and wait for operator confirmation.',
    )
  assert.equal(deck.snapshot('chat').version, 0)
  const proposal = deck.outlineSnapshot('chat').proposals.find(p => p.status === 'current')
  assert.ok(proposal)
  await exec(
    process.execPath,
    [
      operator,
      '--profile',
      profile,
      '--session',
      'chat',
      '--action',
      'confirm',
      '--outline',
      proposal.outlineId,
      '--version',
      String(proposal.version),
    ],
    { windowsHide: true },
  )
  const ids = proposal.slides.map(s => s.slideId)
  if (process.env.DECKAGENT_SKILLS_EDIT_ONLY === '1')
    for (const [index, id] of ids.entries())
      deck.publish('chat', {
        outlineId: proposal.outlineId,
        slideId: id,
        expectedRevision: 0,
        publicationId: 'seed-' + index,
        html: '<h1>Heading</h1><p>KEEP</p>',
      })
  else
    await run(
      1,
      ids,
      'Use deckagent-presentation. The operator confirmed the outline and authorized both slides. Read presentation_state and publish both slides now, simple static HTML without images. Finish only after both publish receipts.',
    )
  const snapshot = deck.snapshot('chat')
  assert.ok(snapshot.slides.every(s => s.revision > 0))
  const first = deck.content('chat', ids[0], snapshot.slides[0].revision),
    second = deck.editableSlide('chat', ids[1])
  const result = await run(
    snapshot.version,
    [ids[1]],
    'Use deckagent-presentation. Edit only the second slide: change its heading to exactly TEST_SKILL_8 using read_slide and patch_slide. Keep every other slide unchanged.',
  )
  assert.ok(result.some(e => e.name === 'deckagent_patch_slide' && e.status === 'completed'))
  assert.deepEqual(deck.content('chat', ids[0], first.revision), first)
  assert.equal(deck.snapshot('chat').slides[0].revision, first.revision)
  const edited = deck.content('chat', ids[1], deck.snapshot('chat').slides[1].revision)
  assert.ok(edited.html.includes('TEST_SKILL_8'))
  assert.ok(deck.snapshot('chat').slides[1].revision > second.revision)
})
