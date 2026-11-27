import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const MOCK_MODULE = /(?:^|\/)mocks\//
const MSW_MODULE = /(?:^|\/)node_modules\/.*\/msw\//

const toPosix = (value: string) => value.replaceAll('\\', '/')

const isForbiddenModule = (id: string) => {
  const path = toPosix(id)
  return MOCK_MODULE.test(path) || MSW_MODULE.test(path)
}

export function forbidMocksInBuild(): Plugin {
  const forbiddenIds = new Set<string>()
  return {
    name: 'deckagent-forbid-mocks-in-build',
    apply: 'build',
    moduleParsed(moduleInfo) {
      if (isForbiddenModule(moduleInfo.id)) forbiddenIds.add(toPosix(moduleInfo.id))
    },
    generateBundle(_options, bundle) {
      const ids = [...forbiddenIds]
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        ids.push(...output.moduleIds, ...Object.keys(output.modules))
      }
      for (const id of ids) {
        if (isForbiddenModule(id)) {
          this.error(`The build includes the forbidden mock module "${id}". Remove the import from production code.`)
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), forbidMocksInBuild()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
})
