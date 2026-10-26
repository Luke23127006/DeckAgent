// Exercise terminal-only startup with controlled streams; no production flag bypasses TTY checks.
process.stdin.isTTY = true;
process.stdout.isTTY = true;
process.stdout.columns = 100;
await import('../../apps/agent-runtime/lib/chat.js');
