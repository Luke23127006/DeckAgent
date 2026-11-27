import type { ApiClientConfig } from '../api/client.ts'
import { getApiClientConfig } from '../api/client.ts'

/** Reads the Origin and token that `main.tsx` stored before the first request. */
export function useHostConnection(): ApiClientConfig {
  return getApiClientConfig()
}
