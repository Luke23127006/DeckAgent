import { spawn } from 'node:child_process'

// Explicit commands keep cloud calls out of the default, credential-free suite.
const mode = process.argv[2]
if (!['cli', 'live', 'parity', 'parity-live'].includes(mode)) throw new Error('Choose cli, live, parity or parity-live')
if (mode === 'live' && !process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required; no live tests ran')
if (
  mode === 'parity-live' &&
  !(
    process.env.GEMINI_API_KEY ||
    (process.env.OPENAI_API_KEY && (process.env.DECKAGENT_CHAT_MODEL || process.env.DECKAGENT_RESPONSES_MODEL)) ||
    (process.env.ANTHROPIC_API_KEY && process.env.DECKAGENT_ANTHROPIC_MODEL)
  )
)
  throw new Error('No live credential/model pair is configured; parity remains NOT VERIFIED.')
const files =
  mode === 'parity-live'
    ? ['tests/opencode-parity-live.test.mjs']
    : mode === 'parity'
      ? [
          'tests/opencode-provider-parity.test.mjs',
          'tests/opencode-session-parity.test.mjs',
          'tests/opencode-provider-ui.test.mjs',
        ]
      : mode === 'live'
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
  env: {
    ...process.env,
    [mode === 'parity-live'
      ? 'DECKAGENT_OPENCODE_PARITY_LIVE'
      : mode === 'live'
        ? 'DECKAGENT_OPENCODE_POC'
        : 'DECKAGENT_OPENCODE_CLI_TESTS']: '1',
  },
})
child.on('error', () => {
  console.error('OpenCode tests could not start')
  process.exitCode = 1
})
child.on('exit', code => {
  process.exitCode = code ?? 1
})
