/** This self-contained, read-only probe runs inside the offline render-check browser. */
export function inspectControlledLayout(): { code: string; path: string; expected: string } | undefined {
  if (!document.head.querySelector('meta[name="deckagent-layout-policy"][content="html-layout-v3"]')) return
  const root = document.querySelector<HTMLElement>('section.da3-slide')
  const issue = (element: Element | null, expected: string) => ({
    code: 'ARTIFACT_LAYOUT_GEOMETRY',
    path: element?.closest('[data-node-id]')
      ? `document.${element.closest('[data-node-id]')!.getAttribute('data-node-id')}`
      : 'nativeSource.layout',
    expected,
  })
  if (!root) return issue(null, 'The controlled slide root is required.')
  const title = root.querySelector('h1'),
    content = root.querySelector('.da3-composition')
  if (!title) return issue(root, 'The title occupies its own region above the composition.')
  if (content && title.getBoundingClientRect().bottom + 8 > content.getBoundingClientRect().top)
    return issue(title, 'The title must remain above, without overlapping the content region.')
  for (const image of root.querySelectorAll('img')) {
    const rect = image.getBoundingClientRect(),
      caption = image.closest('figure')?.querySelector('figcaption')
    const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight)
    if (rect.width < 320 || rect.height < 180 || image.naturalWidth * scale < 120 || image.naturalHeight * scale < 120)
      return issue(
        image,
        `A meaningful image region is required; measured ${Math.round(rect.width)}x${Math.round(rect.height)}.`,
      )
    if (caption && caption.getBoundingClientRect().top < rect.bottom - 1)
      return issue(image, 'The caption must remain below its image region.')
  }
  const pair = root.querySelector('.da3-pair'),
    columns = root.querySelector('.da3-column-grid')
  if (pair) {
    const frames = [...pair.querySelectorAll('img')].map(image => image.getBoundingClientRect())
    if (frames.length !== 2 || Math.abs(frames[0]!.height - frames[1]!.height) > 2)
      return issue(pair, 'Both image frames must keep the same height when captions have different lengths.')
  }
  for (const group of [pair, columns]) {
    if (!group) continue
    const children = [...group.children],
      left = children[0]?.getBoundingClientRect(),
      right = children[1]?.getBoundingClientRect()
    if (
      !left ||
      !right ||
      left.right + 16 > right.left ||
      Math.abs(left.width - right.width) > 2 ||
      Math.abs(left.top - right.top) > 2
    )
      return issue(group, 'The two regions must be equal in width, separate and aligned side by side.')
  }
}
