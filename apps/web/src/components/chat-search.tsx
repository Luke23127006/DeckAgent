import { useEffect, useRef } from 'react'
import { chatListText } from '../text.ts'

/** The search field of the chat list. Typing waits 200 ms before a search; Enter searches at once (FR-134). */
export function ChatSearch(props: { readonly onWords: (words: string) => void }) {
  const { onWords } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    // A native listener also gets an `input` event that does not bubble, as a script sends it.
    const onInput = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => onWords(input.value.trim()), 200)
    }
    input.addEventListener('input', onInput)
    return () => {
      clearTimeout(timer.current)
      input.removeEventListener('input', onInput)
    }
  }, [onWords])
  return (
    <form
      className="chat-search my-1 flex gap-1"
      role="search"
      onSubmit={event => {
        event.preventDefault()
        clearTimeout(timer.current)
        onWords(inputRef.current?.value.trim() ?? '')
      }}
    >
      <input
        ref={inputRef}
        className="min-w-0 flex-1 p-1.5!"
        type="search"
        placeholder={chatListText.searchPlaceholder}
        aria-label={chatListText.searchLabel}
      />
    </form>
  )
}
