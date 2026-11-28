import type { OutlineProposal } from '@deckagent/host-contracts'
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { DeckScreens } from '../hooks/use-deck-screens.ts'
import { deckText } from '../text.ts'
import { BriefRows } from './brief-details.tsx'

const text = deckText.workflow

/**
 * The Brief workflow above the conversation: the mode, the source and image choices, the questions of the interview and
 * the current Brief. The choices are uncontrolled: a request reads them when it is sent. The selects use native
 * `change` listeners, because a script event that does not bubble does not reach the root listener of React.
 */
export function DeckWorkflow(props: {
  readonly deck: DeckScreens
  readonly proposal: OutlineProposal | undefined
  readonly busy: boolean
  readonly researchAvailable: boolean
  readonly onChoose: (answer: string) => void
  readonly onSkip: () => void
}) {
  const { deck, proposal, busy } = props
  const mode = useRef<HTMLSelectElement>(null)
  const action = useRef<HTMLSelectElement>(null)
  const interview = deck.interview
  const locked = deck.locked
  const active = deck.active
  const disabled = busy || locked || !interview
  const researchChecked = deck.researchChosen()

  useEffect(() => {
    const modeNode = mode.current
    const actionNode = action.current
    if (!modeNode || !actionNode) return

    const onMode = () => deck.setMode(modeNode.value === 'deck')
    const onAction = () => deck.chooseAction()
    modeNode.addEventListener('change', onMode)
    actionNode.addEventListener('change', onAction)

    return () => {
      modeNode.removeEventListener('change', onMode)
      actionNode.removeEventListener('change', onAction)
    }
  }, [deck])

  useLayoutEffect(() => {
    if (mode.current) mode.current.value = active ? 'deck' : 'chat'
  })

  const showChoices = active && !locked
  const showQuestions = active && !proposal && !locked
  const brief = interview?.brief.current
  const summary = locked ? text.lockedSummary : brief ? text.currentSummary(brief.version) : text.summary
  return (
    <section className="deck-workflow" aria-label={text.label}>
      <select
        ref={node => {
          mode.current = node
          deck.attach('mode', node)
        }}
        aria-label={text.mode}
        disabled={busy || !interview}
      >
        <option value="chat">{text.chatMode}</option>
        <option value="deck">{text.deckMode}</option>
      </select>
      <label hidden={!showChoices}>
        <input
          ref={node => {
            deck.attach('material', node)
          }}
          type="checkbox"
          disabled={disabled}
        />
        {text.material}
      </label>
      <label hidden={!showChoices}>
        <input
          ref={node => {
            deck.attach('knowledge', node)
          }}
          type="checkbox"
          disabled={disabled}
        />
        {text.knowledge}
      </label>
      <label hidden={!showChoices} title={text.researchTitle}>
        <input
          ref={node => {
            deck.attach('research', node)
          }}
          type="checkbox"
          disabled={disabled || (!props.researchAvailable && !researchChecked)}
        />
        {text.research}
      </label>
      <select
        ref={node => {
          deck.attach('format', node)
        }}
        aria-label={text.format}
        hidden={!showChoices}
        disabled={disabled}
      >
        {text.formatOptions.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        ref={node => {
          deck.attach('images', node)
        }}
        aria-label={text.images}
        title={text.imagesTitle}
        hidden={!showChoices}
        disabled={disabled}
      >
        {text.imageOptions.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        ref={node => {
          action.current = node
          deck.attach('action', node)
        }}
        aria-label={text.action}
        hidden={!showChoices || !proposal}
        disabled={disabled}
      >
        {text.actionOptions.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div aria-label={text.questions} hidden={!showQuestions}>
        {showChoices &&
          interview?.state.questions.map(question => (
            <div key={question.topic}>
              <p>{question.prompt}</p>
              {question.suggestions.map(suggestion => (
                <button key={suggestion} type="button" disabled={disabled} onClick={() => props.onChoose(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          ))}
      </div>
      <div aria-label={text.blockers} hidden={!showChoices || !interview?.state.blockers.length}>
        {showChoices &&
          interview?.state.blockers.map(blocker => <p key={`${blocker.code}:${blocker.message}`}>{blocker.message}</p>)}
      </div>
      <button type="button" hidden={!showQuestions} disabled={disabled} onClick={props.onSkip}>
        {text.skip}
      </button>
      <details hidden={!active}>
        <summary>{summary}</summary>
        {brief && <BriefRows brief={brief} />}
      </details>
    </section>
  )
}
