/** Minimal owned layout slots; extensions mount DOM nodes without owning the shell. */
export class LayoutSlots {
  private readonly occupied = new Set<string>()
  constructor(private readonly root: HTMLElement) {}

  mount(name: 'request' | 'status' | 'history', element: HTMLElement): () => void {
    const slot = this.root.querySelector(`[data-slot="${name}"]`)
    if (!slot || this.occupied.has(name)) throw new Error('SLOT_UNAVAILABLE')
    this.occupied.add(name)
    slot.append(element)
    return () => {
      element.remove()
      this.occupied.delete(name)
    }
  }
}
