import { createHash } from 'node:crypto'
import type { BoundOutlineDraft, ImageNeed, OutlineProposal } from './contracts.ts'

/** Identity includes context and policy; a query alone never identifies a slide image. */
export function outlineImageNeeds(outline: BoundOutlineDraft | OutlineProposal): readonly ImageNeed[] {
  return outline.slides.flatMap((slide, slideIndex) =>
    (slide.blocks ?? []).flatMap((block, blockIndex) => {
      if (block.kind !== 'web-image') return []
      const context = {
        policy: 'web-images-v2',
        slideIndex,
        blockIndex,
        title: slide.title,
        content: slide.content,
        contextBlocks: (slide.blocks ?? []).filter(b => b.kind !== 'web-image' && b.kind !== 'image'),
        query: block.query,
        caption: block.caption ?? '',
        provider: block.provider ?? 'tavily',
        replace: block.replace === true,
        intent: block.intent ?? {
          subject: block.query,
          role: block.caption ?? slide.title,
          mustInclude: [],
          mustAvoid: [],
          aspect: 'any' as const,
        },
      }
      return [
        {
          ...context,
          needId: `need-${createHash('sha256').update(JSON.stringify(context)).digest('hex')}`,
          required: block.required !== false,
          replace: block.replace === true,
        },
      ]
    }),
  )
}
