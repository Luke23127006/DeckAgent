import assert from 'node:assert/strict'

export const proposal = { overview: 'A presentation about recycling', slides: [
  { title: 'Why recycle', content: 'Explain material reuse. Assume a general audience. No numeric claims.' },
  { title: 'Next actions', content: 'Separate materials and check local collection rules. Rules are not verified.' },
] }

export function workflowModel(beforePublish = async () => {}) {
  return { async *stream(request) {
    const last = request.messages.at(-1)
    const system = request.messages[0].content
    if (!request.tools.some(tool => tool.name === 'publish_slide')) {
      assert.ok(request.tools.some(tool => tool.name === 'propose_outline'))
      assert.equal(request.tools.some(tool => tool.name === 'write_file'), false)
      if (last.role === 'user') {
        yield { type: 'tool-call', call: { id: `proposal-${request.messages.length}`, name: 'propose_outline',
          arguments: { proposal: JSON.stringify(proposal) } } }
        yield { type: 'finish', reason: 'tool-calls' }
      } else {
        assert.equal(last.isError, false)
        yield { type: 'text-delta', text: 'Review this outline. No slide has been built. Confirm or request a revision.' }
        yield { type: 'finish', reason: 'stop' }
      }
      return
    }
    const plan = JSON.parse(system.split('Host-confirmed slide plan: ')[1].split('\n')[0])
    const published = request.messages.filter(m => m.role === 'tool' && m.name === 'publish_slide' && !m.isError).length
    const slide = plan.slides[published]
    if (!slide) {
      yield { type: 'text-delta', text: 'Draft ready: Why recycle explains reuse; Next actions lists collection steps. Assumption: general audience. No placeholders. Local rules were not checked. Advice beyond the material is general knowledge.' }
      yield { type: 'finish', reason: 'stop' }
    } else {
      if (last.name === 'write_file') await beforePublish(slide.slideId, request.signal)
      yield { type: 'tool-call', call: last.name === 'write_file'
        ? { id: `publish-${slide.slideId}`, name: 'publish_slide', arguments: {
          outlineId: plan.outlineId, slideId: slide.slideId, expectedRevision: 0, publicationId: `first-${slide.slideId}`, path: `${slide.slideId}.html` } }
        : { id: `write-${slide.slideId}`, name: 'write_file', arguments: {
          path: `${slide.slideId}.html`, content: `<style>h1{color:green}</style><h1>${slide.title}</h1>` } } }
      yield { type: 'finish', reason: 'tool-calls' }
    }
  } }
}
