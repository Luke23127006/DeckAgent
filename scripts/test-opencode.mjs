import { spawn } from 'node:child_process'

// Explicit commands keep cloud calls out of the default, credential-free suite.
const mode = process.argv[2]
if (mode !== 'cli' && mode !== 'live') throw new Error('Choose cli or live')
if (mode === 'live' && !process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required; no live tests ran')
const files =
  mode === 'live'
    ? ['tests/opencode-integration.test.mjs']
    : [
        'tests/opencode-agent.test.mjs',
        'tests/opencode-process.test.mjs',
        'tests/opencode-client-contract.test.mjs',
        'tests/opencode-tool-isolation.test.mjs',
        'tests/opencode-browser.test.mjs',
      ]
const child = spawn(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  windowsHide: true,
  env: { ...process.env, [mode === 'live' ? 'DECKAGENT_OPENCODE_POC' : 'DECKAGENT_OPENCODE_CLI_TESTS']: '1' },
})
child.on('error', () => {
  console.error('OpenCode tests could not start')
  process.exitCode = 1
})
child.on('exit', code => {
  process.exitCode = code ?? 1
})
