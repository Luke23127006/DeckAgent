import { Worker } from 'node:worker_threads'

export interface Extraction {
  readonly mediaType: string
  readonly text: string
  readonly warnings: readonly string[]
  readonly image?: boolean
}

/** Workers bound JS heap and execution time; this is not an OS sandbox. */
export async function extractMaterial(name: string, bytes: Uint8Array, signal: AbortSignal): Promise<Extraction> {
  signal.throwIfAborted()
  const worker = new Worker(new URL('./parser-worker.js', import.meta.url), {
    workerData: { name, bytes },
    env: {},
    resourceLimits: { maxOldGenerationSizeMb: 96 },
    stdout: true,
    stderr: true,
  })
  // Parser diagnostics can contain private document data. Never forward them.
  worker.stdout.resume()
  worker.stderr.resume()
  let timer: ReturnType<typeof setTimeout> | undefined
  let stop: (() => void) | undefined
  try {
    return await new Promise<Extraction>((resolve, reject) => {
      const fail = () => reject(new Error(signal.aborted ? 'MATERIAL_CANCELLED' : 'MATERIAL_PARSE_FAILED'))
      stop = fail
      signal.addEventListener('abort', fail, { once: true })
      timer = setTimeout(() => reject(new Error('MATERIAL_PARSE_TIMEOUT')), 15000)
      worker.once('error', fail)
      worker.once('exit', () => reject(new Error('MATERIAL_PARSE_FAILED')))
      worker.once('message', (result: { value?: Extraction; error?: string }) => {
        if (result.value) resolve(result.value)
        else reject(new Error(result.error ?? 'MATERIAL_PARSE_FAILED'))
      })
      if (signal.aborted) fail()
    })
  } finally {
    clearTimeout(timer)
    if (stop) signal.removeEventListener('abort', stop)
    await worker.terminate()
  }
}
