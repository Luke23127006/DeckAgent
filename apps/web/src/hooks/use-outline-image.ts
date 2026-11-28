import { useEffect, useState } from 'react'
import { readOutlineImage } from '../api/deck.ts'

export interface OutlineImage {
  readonly url?: string
  readonly failed: boolean
}

/**
 * Reads the prepared image of one image need when `enabled` first becomes true, as a blob URL. The URL is revoked on
 * unmount, so a closed chat keeps no image in memory.
 */
export function useOutlineImage(
  sessionId: string | undefined,
  outlineId: string,
  needId: string,
  enabled: boolean,
): OutlineImage {
  const [started, setStarted] = useState(false)
  const [image, setImage] = useState<OutlineImage>({ failed: false })
  if (enabled && !started && sessionId !== undefined) setStarted(true)

  useEffect(() => {
    if (!started || sessionId === undefined) return
    let url: string | undefined
    let current = true
    readOutlineImage(sessionId, outlineId, needId).then(
      blob => {
        if (!current) return
        url = URL.createObjectURL(blob)
        setImage({ url, failed: false })
      },
      () => {
        if (current) setImage({ failed: true })
      },
    )
    return () => {
      current = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [started, sessionId, outlineId, needId])

  return image
}
