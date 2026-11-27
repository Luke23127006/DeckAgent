import { useLayoutEffect, useRef } from 'react'

/**
 * Places a node of the legacy deck screens. The wrapper takes no box of its own, so the parent layout sees the node.
 * Phase 6 replaces the deck screens and removes this component.
 */
export function LegacyNode(props: { readonly node: HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null)
  const { node } = props
  useLayoutEffect(() => {
    const host = ref.current
    if (!host) return
    if (node.parentElement !== host) host.replaceChildren(node)
  })
  return <div ref={ref} className="contents" />
}
