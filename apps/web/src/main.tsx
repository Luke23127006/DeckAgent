import '@/styles/app.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { configureApiClient, readTokenFromHash } from '@/api/client'
import { AppRoutes } from '@/routes'
import { installSettingsNavigation } from '@/hooks/use-settings-navigation'

const token = readTokenFromHash(window.location.hash)
configureApiClient({ origin: window.location.origin, token })
installSettingsNavigation()
const queryClient = new QueryClient()
const root = document.getElementById('root')
if (!root) throw new Error('ROOT_MISSING')

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
