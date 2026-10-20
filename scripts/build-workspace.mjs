import { build } from 'tsdown';
import { spawnSync } from 'node:child_process';
import { openSync, closeSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Discover workspace packages through pnpm, the single source of truth for the
// globs declared in pnpm-workspace.yaml. This avoids hard-coding directories and
// avoids re-implementing YAML or glob parsing: pnpm lists exactly the projects it
// manages, so unrelated directories are never picked up. Stdout is captured to a
// file (not a pipe) so discovery also works in sandboxes that block pipe I/O.
function discoverWorkspacePackages() {
  const outFile = join(tmpdir(), `deckagent-workspace-${process.pid}.json`);
  const fd = openSync(outFile, 'w');
  try {
    const result = spawnSync(
      'pnpm', ['list', '--recursive', '--depth', '-1', '--json'],
      { shell: true, stdio: ['ignore', fd, 'inherit'] },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`pnpm list exited with code ${result.status}`);
    return JSON.parse(readFileSync(outFile, 'utf8'));
  } finally {
    closeSync(fd);
    rmSync(outFile, { force: true });
  }
}

// tsc -b emits checked JavaScript and declarations first. tsdown then bundles each
// package's lib/types entry. Bundle only this workspace; external package imports
// keep Cordis and Loader service identities shared. The extra entry points below
// are build-time conventions not declared by the manifests (apps are private with
// no exports), so they are listed explicitly rather than derived from a manifest.
const extraEntries = {
  '@deckagent/cordis-fixture': ['lib/types/consumer.js'],
  '@deckagent/cordis-smoke': ['lib/types/cli.js'],
  '@deckagent/agent-runtime-cli': ['lib/types/chat.js'],
};

const packages = discoverWorkspacePackages()
  .filter((pkg) => pkg.name !== 'deckagent-tooling') // exclude the root project
  .sort((a, b) => a.path.localeCompare(b.path));      // deterministic build order

for (const pkg of packages) {
  const config = {
    cwd: resolve(pkg.path), config: false,
    entry: ['lib/types/index.js'], outDir: 'lib', format: ['esm'],
    platform: 'node', target: 'es2024', fixedExtension: false,
    dts: false, clean: false,
  };
  if (pkg.name === '@deepseek-ai/schemastery') {
    config.format = ['esm', 'cjs'];
    config.outExtensions = ({ format }) => ({ js: format === 'es' ? '.mjs' : '.cjs' });
  }
  if (extraEntries[pkg.name]) config.entry.push(...extraEntries[pkg.name]);
  await build(config);
}
