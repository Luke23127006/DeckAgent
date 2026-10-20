import { build } from 'tsdown';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// tsc emits checked JavaScript and declarations first. Bundle only this workspace;
// external package imports keep Cordis and Loader service identities shared.
const packages = [];
for (const root of ['vendor', 'packages/testing', 'packages/agent', 'packages/llm', 'packages/session', 'apps']) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory()) packages.push(`${root}/${entry.name}`);
  }
}
for (const cwd of packages) {
  const manifest = JSON.parse(await readFile(`${cwd}/package.json`, 'utf8'));
  const config = {
    cwd: resolve(cwd), config: false,
    entry: ['lib/types/index.js'], outDir: 'lib', format: ['esm'],
    platform: 'node', target: 'es2024', fixedExtension: false,
    dts: false, clean: false,
  };
  if (manifest.name === '@deepseek-ai/schemastery') {
    config.format = ['esm', 'cjs'];
    config.outExtensions = ({ format }) => ({ js: format === 'es' ? '.mjs' : '.cjs' });
  }
  if (manifest.name === '@deckagent/foundation-fixture') config.entry.push('lib/types/consumer.js');
  if (manifest.name === '@deckagent/foundation') {
    config.entry.push('lib/types/cli.js');
  }
  if (manifest.name === '@deckagent/agent-runtime-cli') config.entry.push('lib/types/chat.js');
  await build(config);
}
