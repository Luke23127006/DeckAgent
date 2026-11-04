import { spawn } from 'node:child_process'

// Explicit commands keep cloud calls out of the default, credential-free suite.
const mode = process.argv[2]
if (
  ![
    'cli',
    'live',
    'parity',
    'parity-live',
    'baseline',
    'baseline-live',
    'materials',
    'materials-live',
    'context',
    'context-live',
    'direct-editing',
    'direct-editing-live',
  ].includes(mode)
)
  throw new Error(
    'Choose cli, live, parity, parity-live, baseline, baseline-live, materials, materials-live, context, context-live, direct-editing or direct-editing-live',
  )
if (mode === 'context-live' && !process.env.GEMINI_API_KEY)
  throw new Error('GEMINI_API_KEY required; context live remains NOT VERIFIED')
if (mode === 'direct-editing-live' && !process.env.GEMINI_API_KEY)
  throw new Error('GEMINI_API_KEY required; direct editing live remains NOT VERIFIED')
if (mode === 'materials-live' && !process.env.GEMINI_API_KEY)
  throw new Error('GEMINI_API_KEY required; no material live tests ran')
if (mode === 'baseline-live' && !process.env.GEMINI_API_KEY)
  throw new Error('GEMINI_API_KEY required; baseline live remains NOT VERIFIED')
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
  mode === 'direct-editing-live'
    ? ['tests/direct-editing-live.test.mjs']
    : mode === 'direct-editing'
      ? ['tests/direct-editing-opencode.test.mjs']
      : mode === 'context-live'
        ? ['tests/context-live.test.mjs']
        : mode === 'context'
          ? ['tests/opencode-context.test.mjs', 'tests/context-browser.test.mjs']
          : mode === 'materials-live'
            ? ['tests/materials-live.test.mjs', 'tests/materials-images-live.test.mjs']
            : mode === 'materials'
              ? ['tests/materials-opencode.test.mjs']
              : mode === 'baseline-live'
                ? ['tests/opencode-baseline-live.test.mjs']
                : mode === 'baseline'
                  ? [
                      'tests/opencode-baseline.test.mjs',
                      'tests/opencode-baseline-security.test.mjs',
                      'tests/opencode-browser.test.mjs',
                    ]
                  : mode === 'parity-live'
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
const child = spawn(
  process.execPath,
  ['--test', ...(mode === 'materials-live' ? ['--test-concurrency=1'] : []), ...files],
  {
    stdio: 'inherit',
    windowsHide: true,
    env: {
      ...process.env,
      [mode === 'direct-editing-live'
        ? 'DECKAGENT_DIRECT_EDIT_LIVE'
        : mode === 'context-live'
          ? 'DECKAGENT_CONTEXT_LIVE'
          : mode === 'materials-live'
            ? 'DECKAGENT_MATERIALS_LIVE'
            : mode === 'baseline-live'
              ? 'DECKAGENT_OPENCODE_BASELINE_LIVE'
              : mode === 'parity-live'
                ? 'DECKAGENT_OPENCODE_PARITY_LIVE'
                : mode === 'live'
                  ? 'DECKAGENT_OPENCODE_POC'
                  : 'DECKAGENT_OPENCODE_CLI_TESTS']: '1',
    },
  },
)
child.on('error', () => {
  console.error('OpenCode tests could not start')
  process.exitCode = 1
})
child.on('exit', code => {
  process.exitCode = code ?? 1
})
