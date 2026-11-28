import type { BriefDraft, InterviewTopic } from './brief-contracts.ts'
import { validateBriefDraft } from './brief-store.ts'
import type { InterviewState } from './brief-contracts.ts'
import { DeckError } from './errors.ts'
import { listTemplates } from '@deckagent/design'

const questions: readonly [InterviewTopic, string, readonly string[]][] = [
  ['topic', 'What topic do you want to present?', []],
  ['audience', 'Who is the audience of the presentation?', ['Beginners', 'Experts']],
  ['duration', 'How long do you plan to present?', ['5 minutes', '10 minutes', '20 minutes']],
  ['purpose', 'What must the audience understand or do after the presentation?', ['Introduce', 'Explain', 'Propose']],
  [
    'sources',
    'Which sources do you permit?',
    ['Documents that you sent', 'General knowledge of the model', 'Search public sources (free only)'],
  ],
  ['language', 'Which language must the content use?', ['Vietnamese', 'English']],
  ['images', 'Which images does the presentation need?', ['No images', 'Use the attached images']],
  ['format', 'Which format do you want? HTML is available now, and you can see it directly in Preview.', ['HTML']],
  ['template', 'Which template do you want to use?', ['HTML Basic']],
  ['design-system', 'Which Design System do you want to use?', ['DeckAgent Neutral']],
]

export function interviewState(input: unknown, unavailableSources = false): InterviewState {
  const d = validateBriefDraft(input)
  const answered = (topic: InterviewTopic) => d.answers.some(a => a.topic === topic)
  const known: Record<InterviewTopic, boolean> = {
    topic: !!d.topic,
    audience: !!d.audience || answered('audience'),
    duration: !!d.durationMinutes || answered('duration'),
    purpose: !!d.purpose || answered('purpose'),
    sources: d.sources.refs.length > 0 || d.sources.modelKnowledge || d.sources.publicResearch,
    language: !!d.language || answered('language'),
    images: answered('images') || d.images.mode === 'attachments',
    format: d.generationFormat === 'html' && (!d.requestedFormat || d.requestedFormat === 'html'),
    template: !!d.template,
    'design-system': !!d.designSystem,
  }
  const blockers = [
    ...(!d.topic
      ? [{ code: 'TOPIC_REQUIRED', message: 'DeckAgent must know the topic before it makes an Outline.' }]
      : []),
    ...(!known.sources
      ? [
          {
            code: 'SOURCE_CHOICE_REQUIRED',
            message:
              'Select the sources. If you skip the question, DeckAgent gets no permission to use model knowledge or research.',
          },
        ]
      : []),
    ...(d.requestedFormat && d.requestedFormat !== 'html'
      ? [
          {
            code: 'FORMAT_UNAVAILABLE',
            message: `DeckAgent cannot make the ${d.requestedFormat} format. HTML is available now. Select the format again.`,
          },
        ]
      : []),
    ...(d.images.mode === 'unavailable' || (d.images.mode === 'attachments' && !d.images.attachmentIds.length)
      ? [
          {
            code: 'IMAGES_UNAVAILABLE',
            message:
              'DeckAgent can use only attached images now. Select what to do with the image request that is not met.',
          },
        ]
      : []),
    ...(unavailableSources
      ? [
          {
            code: 'SOURCE_UNAVAILABLE',
            message: 'A source is no longer available. Select the sources again, or add documents.',
          },
        ]
      : []),
  ]
  const missing = questions
    .filter(([topic]) => !known[topic])
    .map(([topic, prompt, suggestions]) => ({
      topic,
      prompt,
      suggestions,
      required: ['topic', 'sources', 'format'].includes(topic),
    }))
  return {
    questions: missing,
    blockers,
    readyForOutline: !missing.length && !blockers.length,
    skipAllowed: true,
    notice:
      'You can skip the remaining questions and add other requests. DeckAgent makes no slides before you confirm the Outline.',
  }
}

/** Skip records uncertainty, and never enables a source choice or replaces an unsupported request. */
export function skipInterview(input: unknown): BriefDraft {
  const draft = validateBriefDraft(input)
  const missing = interviewState(draft).questions
  const answers = [...draft.answers]
  const assumptions = [...draft.assumptions]
  for (const { topic } of missing) {
    if (
      ['topic', 'sources', 'format'].includes(topic) &&
      (topic !== 'format' || (draft.requestedFormat && draft.requestedFormat !== 'html'))
    )
      continue
    if (!answers.some(a => a.topic === topic)) answers.push({ topic, value: 'Skipped by user' })
    const note = `Interview ${topic} was skipped; no specific requirement was supplied.`
    if (!assumptions.includes(note)) assumptions.push(note)
  }
  let templateRef: { readonly id: string; readonly version: number } | undefined
  if (!draft.template) {
    const defaultTemplate = listTemplates('html')[0]
    if (!defaultTemplate) throw new DeckError('DECK_CONFIG')
    templateRef = { id: defaultTemplate.id, version: defaultTemplate.version }
  }
  return validateBriefDraft({
    ...draft,
    answers,
    assumptions,
    ...(!draft.generationFormat && (!draft.requestedFormat || draft.requestedFormat === 'html')
      ? { generationFormat: 'html' }
      : {}),
    ...(templateRef ? { template: templateRef } : {}),
    ...(!draft.designSystem ? { designSystem: { id: 'deckagent-neutral', version: 1 } } : {}),
  })
}
