import type { BriefRecord, BriefSourceRef } from '@deckagent/host-contracts'
import { deckText } from '../text.ts'

const text = deckText.brief

export function briefFieldLabel(field: string): string {
  return text.fields[field] ?? field
}

/** The saved source references of a Brief or of a planned slide. */
export function SourceReferences(props: { readonly refs: readonly BriefSourceRef[] }) {
  return (
    <details>
      <summary>{text.sourceReferences(props.refs.length)}</summary>
      {props.refs.map(ref => (
        <p key={`${ref.kind}/${ref.sourceId}/${ref.version}`}>
          {text.sourceReference(text.sourceKinds[ref.kind], ref.sourceId, ref.version)}
        </p>
      ))}
    </details>
  )
}

function imageText(images: BriefRecord['draft']['images']): string {
  if (images.mode !== 'public-research') return text.imageModes[images.mode]
  return images.provider ? text.webImages(images.provider) : text.webImagesUnknown
}

/** The rows of a reviewed Brief. Storage fields are not the main reading surface. */
export function BriefRows(props: { readonly brief: BriefRecord }) {
  const { draft, design } = props.brief
  const selectedSources = [
    ...(draft.sources.material ? [text.material] : []),
    ...(draft.sources.modelKnowledge ? [text.modelKnowledge] : []),
    ...(draft.sources.publicResearch ? [text.publicResearch] : []),
  ]
  const values = Object.entries(draft).filter(
    (entry): entry is [string, string | number] => typeof entry[1] === 'string' || typeof entry[1] === 'number',
  )
  return (
    <>
      {draft.presenterNotes && <p>{text.presenterNotes}</p>}
      {values.map(([key, value]) => (
        <p key={`field:${key}`}>{text.field(briefFieldLabel(key), value)}</p>
      ))}
      {draft.requirements.map((requirement, index) => (
        <p key={`requirement:${index}`}>{text.requirement(requirement)}</p>
      ))}
      {draft.assumptions.map((assumption, index) => (
        <p key={`assumption:${index}`}>{text.assumption(assumption)}</p>
      ))}
      {draft.answers.map((answer, index) => (
        <p key={`answer:${index}`}>{text.field(briefFieldLabel(answer.topic), answer.value)}</p>
      ))}
      <p>{text.allowedSources(selectedSources.join(', '))}</p>
      <p>{text.images(imageText(draft.images))}</p>
      {!!draft.sources.refs.length && <SourceReferences refs={draft.sources.refs} />}
      {design && (
        <>
          <p>
            {text.design(
              text.templateNames[design.template.id] ?? design.template.id,
              text.designSystemNames[design.designSystem.id] ?? design.designSystem.id,
            )}
          </p>
          <details>
            <summary>{text.technical}</summary>
            <p>
              {text.versions(
                design.template.id,
                String(design.template.version),
                design.designSystem.id,
                String(design.designSystem.version),
              )}
            </p>
            {Object.entries(design.theme).map(([role, value]) => (
              <p key={role}>{text.field(role, String(value))}</p>
            ))}
          </details>
        </>
      )}
      {draft.images.unmetRequirements.map((need, index) => (
        <p key={`unmet:${index}`}>{text.unmetImage(need)}</p>
      ))}
    </>
  )
}

/** A reviewed Brief in a closed `details`. */
export function BriefDetails(props: { readonly brief: BriefRecord; readonly title?: string }) {
  return (
    <details>
      <summary>{props.title ?? text.boundTitle(props.brief.version)}</summary>
      <BriefRows brief={props.brief} />
    </details>
  )
}
