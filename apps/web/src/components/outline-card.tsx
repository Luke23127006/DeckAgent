import type { BriefRecord, OutlineProposal } from '@deckagent/host-contracts'
import { Fragment, useState } from 'react'
import { useOutlineImage } from '../hooks/use-outline-image.ts'
import { deckText } from '../text.ts'
import { BriefDetails, briefFieldLabel, SourceReferences } from './brief-details.tsx'

type OutlineSlide = OutlineProposal['slides'][number]
type ContentBlock = NonNullable<OutlineSlide['blocks']>[number]
type WebImageBlock = Extract<ContentBlock, { readonly kind: 'web-image' }>
type ImageReview = NonNullable<OutlineProposal['imageReview']>[number]

const text = deckText.outline
const imageText = deckText.images

/** What a user can do with the current Outline. A proposal that is not current is read-only. */
export interface OutlineActions {
  readonly busy: boolean
  readonly confirm: (proposal: OutlineProposal) => void
  /** Selects a revision of the current Outline, and adds `request` to the draft when it is given. */
  readonly revise: (request?: string) => void
}

function missingImages(proposal: OutlineProposal): number {
  return proposal.imageReview?.filter(need => need.required && need.status !== 'prepared').length ?? 0
}

function confirmationBlocked(proposal: OutlineProposal): boolean {
  return (proposal.layoutIssues?.length ?? 0) > 0 || missingImages(proposal) > 0
}

function actionsDisabled(proposal: OutlineProposal, actions: OutlineActions): boolean {
  return actions.busy || proposal.status !== 'current'
}

function imageFailure(code?: string): string {
  return imageText.failures[code ?? ''] ?? imageText.failure
}

function statusLabel(proposal: OutlineProposal): string {
  if (proposal.status === 'confirmed') return text.confirmed
  if (proposal.status === 'cancelled') return text.cancelled
  if (proposal.status !== 'current') return text.superseded
  if (proposal.layoutIssues?.length) return text.layoutBlocked
  const missing = missingImages(proposal)
  return missing ? text.imagesBlocked(missing) : text.waiting
}

function layoutIssueText(issue: NonNullable<OutlineProposal['layoutIssues']>[number]): string {
  const field = issue.path.endsWith('.title')
    ? text.layoutFields.title
    : issue.path.endsWith('.caption')
      ? text.layoutFields.caption
      : text.layoutFields.content
  return issue.actual !== undefined && issue.limit !== undefined
    ? text.layoutLimit(issue.slideIndex + 1, field, issue.actual, issue.limit)
    : text.layoutMismatch(issue.slideIndex + 1)
}

function ImageAudit(props: { readonly attempts: NonNullable<ImageReview['attempts']> }) {
  return (
    <details>
      <summary>{imageText.audit(props.attempts.length)}</summary>
      {props.attempts.map((attempt, index) => (
        <Fragment key={index}>
          <p>{imageFailure(attempt.code)}</p>
          {attempt.checks.map((check, at) => (
            <p key={at}>
              {imageText.check(new URL(check.sourceUrl).hostname, imageFailure(check.code), check.httpStatus)}
            </p>
          ))}
        </Fragment>
      ))}
    </details>
  )
}

/** The review of one web image of a planned slide. The prepared image loads when the slide opens. */
function ImageReviewFigure(props: {
  readonly review: ImageReview
  readonly block: WebImageBlock
  readonly proposal: OutlineProposal
  readonly slideIndex: number
  readonly blockIndex: number
  readonly slideTitle: string
  readonly open: boolean
  readonly actions: OutlineActions
}) {
  const { review, block, proposal, actions } = props
  const prepared = review.status === 'prepared'
  const image = useOutlineImage(proposal.brief?.sessionId, proposal.outlineId, review.needId, prepared && props.open)
  const credit = review.credit
  return (
    <figure className="outline-image-review">
      {prepared && proposal.brief && !image.failed && (
        <img alt={review.selection?.description || block.intent?.subject || block.query} src={image.url} />
      )}
      <figcaption>
        {prepared
          ? imageText.prepared
          : `${imageFailure(review.failure)}${review.required ? imageText.requiredNote : imageText.optionalNote}`}
      </figcaption>
      {review.selection && (
        <>
          <p>{imageText.reason(review.selection.reason)}</p>
          <p>{imageText.unverified}</p>
        </>
      )}
      {credit && (
        <>
          <p>{imageText.credit(credit.author, credit.license)}</p>
          <a href={credit.url} target="_blank" rel="noopener noreferrer">
            {imageText.source}
          </a>
          {credit.licenseUrl.startsWith('https://') && (
            <>
              {' · '}
              <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">
                {imageText.license}
              </a>
            </>
          )}
        </>
      )}
      {!!review.attempts?.length && <ImageAudit attempts={review.attempts} />}
      {image.failed && <p>{imageText.unreadable}</p>}
      <button
        type="button"
        disabled={actionsDisabled(proposal, actions)}
        onClick={() =>
          actions.revise(imageText.replaceRequest(props.slideIndex + 1, props.slideTitle, props.blockIndex + 1))
        }
      >
        {imageText.replace}
      </button>
    </figure>
  )
}

function blockText(block: ContentBlock): string[] {
  if ('text' in block) return [block.text]
  if (block.kind === 'bullets') return [...block.items]
  if (block.kind === 'columns') return block.columns.flatMap(column => [...column.bullets])
  if (block.kind === 'metrics') return block.items.map(item => text.metric(item.value, item.label))
  return [block.caption ?? '']
}

function SlideBlocks(props: {
  readonly slide: OutlineSlide
  readonly slideIndex: number
  readonly proposal: OutlineProposal
  readonly open: boolean
  readonly actions: OutlineActions
}) {
  const { slide, slideIndex, proposal } = props
  const blocks = slide.blocks ?? []
  const words = blocks.flatMap(blockText)
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
  // The legacy content paragraph shows only when the structured blocks do not already hold the same text.
  const showContent =
    !words.length || ![...words, words.join('\n')].some(value => normalize(value) === normalize(slide.content))
  return (
    <div aria-label={text.content}>
      {showContent && <p>{slide.content}</p>}
      {blocks.map((block, blockIndex) => {
        const key = `block:${blockIndex}`
        if ('text' in block) return <p key={key}>{block.text}</p>
        if (block.kind === 'bullets')
          return (
            <ul key={key}>
              {block.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )
        if (block.kind === 'columns')
          return block.columns.map((column, columnIndex) => (
            <ul key={`${key}:${columnIndex}`}>
              {column.bullets.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ))
        if (block.kind === 'metrics')
          return block.items.map((item, index) => <p key={`${key}:${index}`}>{text.metric(item.value, item.label)}</p>)
        if (block.kind === 'image') return <p key={key}>{text.attachedImage(block.caption)}</p>
        const review = proposal.imageReview?.find(
          need => need.slideIndex === slideIndex && need.blockIndex === blockIndex,
        )
        return (
          <Fragment key={key}>
            <p>{text.webImage(block.query, block.required !== false)}</p>
            {review && (
              <ImageReviewFigure
                review={review}
                block={block}
                proposal={proposal}
                slideIndex={slideIndex}
                blockIndex={blockIndex}
                slideTitle={slide.title}
                open={props.open}
                actions={props.actions}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

function ProposalChanges(props: { readonly proposal: OutlineProposal; readonly brief: BriefRecord }) {
  const { proposal, brief } = props
  const changes = proposal.changes
  const kinds = [
    [text.changeKinds.added, changes?.added ?? []],
    [text.changeKinds.removed, changes?.removed ?? []],
    [text.changeKinds.changed, changes?.changed ?? []],
  ] as const
  return (
    <>
      <p>{text.summary(proposal.slides.length, brief.version)}</p>
      {(proposal.revisionSuggestions ?? []).map((item, index) => (
        <p key={index}>{text.suggestion(item)}</p>
      ))}
      {changes && (
        <>
          <p>
            {text.changes(
              changes.added.length,
              changes.removed.length,
              changes.changed.length,
              changes.orderChanged,
              changes.briefFields.map(briefFieldLabel).join(', '),
            )}
          </p>
          <details>
            <summary>{text.allChanges}</summary>
            {kinds.flatMap(([kind, ids]) =>
              ids.map(id => (
                <p key={`${kind}:${id}`}>
                  {text.change(kind, proposal.slides.find(slide => slide.slideId === id)?.title ?? id)}
                </p>
              )),
            )}
            <p>{text.overviewChanges(changes.overviewChanged, changes.suggestionsChanged)}</p>
          </details>
        </>
      )}
      <BriefDetails brief={brief} />
    </>
  )
}

/**
 * One Outline proposal inside its assistant message. All content is text: model output never becomes DOM. The open
 * state of each planned slide survives a refresh of the same proposal.
 */
export function OutlineCard(props: { readonly proposal: OutlineProposal; readonly actions: OutlineActions }) {
  const { proposal, actions } = props
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set())
  const issues = proposal.layoutIssues ?? []
  const setAll = (value: boolean) => setOpen(value ? new Set(proposal.slides.map((_, index) => index)) : new Set())
  return (
    <section
      className="outline-proposal"
      id={`outline-${proposal.outlineId}`}
      data-outline-id={proposal.outlineId}
      data-status={proposal.status}
      aria-label={text.label}
    >
      <h3>{text.heading}</h3>
      <p className="outline-status">{statusLabel(proposal)}</p>
      <div className="outline-layout-blockers" role="status" hidden={!issues.length}>
        {issues.map((issue, index) => (
          <p key={index}>{layoutIssueText(issue)}</p>
        ))}
      </div>
      <p className="outline-overview">{proposal.overview}</p>
      <div className="outline-viewing">
        <button type="button" onClick={() => setAll(true)}>
          {text.expand}
        </button>
        <button type="button" onClick={() => setAll(false)}>
          {text.collapse}
        </button>
      </div>
      {proposal.slides.map((slide, index) => (
        <details
          key={slide.slideId}
          className="planned-slide"
          open={open.has(index)}
          onToggle={event => {
            const isOpen = event.currentTarget.open
            setOpen(previous => {
              if (previous.has(index) === isOpen) return previous
              const next = new Set(previous)
              if (isOpen) next.add(index)
              else next.delete(index)
              return next
            })
          }}
        >
          <summary>{text.slideTitle(index + 1, slide.title)}</summary>
          <SlideBlocks slide={slide} slideIndex={index} proposal={proposal} open={open.has(index)} actions={actions} />
          {!!slide.sources?.length && <SourceReferences refs={slide.sources} />}
        </details>
      ))}
      {proposal.brief && <ProposalChanges proposal={proposal} brief={proposal.brief} />}
    </section>
  )
}

/** The actions of the current Outline, above the composer. */
export function OutlineDock(props: {
  readonly proposal: OutlineProposal | undefined
  readonly actions: OutlineActions
}) {
  const { proposal, actions } = props
  if (!proposal || proposal.status !== 'current') return <section className="outline-dock" hidden />
  const disabled = actionsDisabled(proposal, actions)
  return (
    <section className="outline-dock" data-outline-id={proposal.outlineId}>
      <div className="outline-actions">
        <strong>{text.target(proposal.version, proposal.slides.length, proposal.brief?.version)}</strong>
        <p>{text.noSlidesYet}</p>
        <button
          type="button"
          disabled={disabled || confirmationBlocked(proposal)}
          onClick={() => actions.confirm(proposal)}
        >
          {text.confirm}
        </button>
        <button type="button" disabled={disabled} onClick={() => actions.revise()}>
          {text.revise}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const card = document.getElementById(`outline-${proposal.outlineId}`)
            if (!card) return
            card.scrollIntoView({ block: 'center' })
            card.tabIndex = -1
            card.focus({ preventScroll: true })
          }}
        >
          {text.view}
        </button>
        {/* An Outline without a Brief is the earliest proposal kind. Its cancellation has no Host route. */}
        {!proposal.brief && (
          <button type="button" disabled={disabled}>
            {text.cancel}
          </button>
        )}
        <p>{text.orType}</p>
      </div>
    </section>
  )
}
