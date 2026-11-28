# Task 4: Configure Vite, Tailwind, shadcn/ui and DESIGN.md

Read this file to learn the steps of Task 4, which configures Vite, Tailwind, shadcn/ui primitives and sample slides.

**Type:** Code

**Read first:**
- [Revision 2 Global Constraints](README.md#revision-2-global-constraints) and [Task protocol](README.md#task-protocol) in `README.md`
- `apps/web/src/index.ts` (the CSS exports and `sampleAssets`)
- `apps/web/DESIGN.md`
- `apps/web/tsconfig.json` and `apps/web/components.json`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Create: `apps/web/index.html`, `apps/web/vite.config.ts`, `apps/web/public/samples/1.html`, `apps/web/public/samples/2.html`, `apps/web/public/samples/3.html`, `apps/web/src/styles/app.css`, `apps/web/src/styles/legacy.css`, `apps/web/src/components/ui/cn.ts`, `apps/web/src/components/ui/button.tsx`
- Change: `apps/web/tsconfig.json`, `apps/web/DESIGN.md`, `package.json` (add `"test:web"` script)
- Test: `apps/web/tests/button.test.tsx`, `tests/vite-build-mocks.test.mjs`

**Interfaces:**
- Produces: `forbidMocksInBuild(): Plugin` in `apps/web/vite.config.ts`, `cn(...inputs: ClassValue[]): string` in `apps/web/src/components/ui/cn.ts`, `Button` and `buttonVariants` in `apps/web/src/components/ui/button.tsx`.

**STOP when:** `vite build` or Vitest fails because of a missing dependency.

**Forbidden:** Do not delete `apps/web/src/index.ts` or change `scripts/build-workspace.mjs` in this task.

- [x] **Step 1: Write the failing tests**

Create `tests/vite-build-mocks.test.mjs` with a header comment that follows `docs/conventions/testware.md`:

```js
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { build } from '../apps/web/node_modules/vite/dist/node/index.js'
import { forbidMocksInBuild } from '../apps/web/vite.config.ts'

test('forbidMocksInBuild rejects chunks that include mocks or msw', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-vite-mocks-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  await mkdir(join(dir, 'mocks'), { recursive: true })
  await writeFile(join(dir, 'mocks', 'browser.js'), 'export const mockFlag = true\n')
  await writeFile(join(dir, 'entry.js'), "import { mockFlag } from './mocks/browser.js'\nconsole.log(mockFlag)\n")
  await assert.rejects(
    build({
      root: dir,
      logLevel: 'silent',
      plugins: [forbidMocksInBuild()],
      build: { write: false, rollupOptions: { input: join(dir, 'entry.js') } },
    }),
    /forbidden mock module/i,
  )
})
```

Create `apps/web/tests/button.test.tsx` with a header comment that follows `docs/conventions/testware.md`:

```tsx
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../src/components/ui/button.tsx'
import { cn } from '../src/components/ui/cn.ts'

describe('Button and cn', () => {
  it('merges Tailwind classes and renders semantic button variants', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    render(<Button variant="default">Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toBeInTheDocument()
    expect(button.className).toContain('bg-primary')
    expect(button.className).toContain('text-primary-foreground')
  })
})
```

- [x] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/vite-build-mocks.test.mjs`
Expected: FAIL. The output reports that `apps/web/vite.config.ts` does not exist.

Run: `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native tests/button.test.tsx`
Expected: FAIL. The output reports that `button.tsx` or `cn.ts` does not exist.

- [x] **Step 3: Create `apps/web/index.html`, `apps/web/vite.config.ts`, sample HTML files and `apps/web/tsconfig.json` updates**

1. Create `apps/web/index.html` with `lang="vi"`, `<script src="/theme.js"></script>`, `<div id="root"></div>`, and `<script type="module" src="/src/main.tsx"></script>`.
2. Create `apps/web/vite.config.ts`:
   - Export `forbidMocksInBuild(): Plugin` with `apply: 'build'`. In `generateBundle`, scan `output.moduleIds` of every chunk. Fail with `this.error(...)` when a normalized path matches `/(?:^|\/)mocks\//` or `/(?:^|\/)node_modules\/.*\/msw\//`. Use an English STE error message that contains `forbidden mock module`.
   - Export default `defineConfig` with `plugins: [react(), tailwindcss(), forbidMocksInBuild()]`, `resolve.alias: { '@': resolve(import.meta.dirname, 'src') }`, and `build.outDir: 'dist'`.
3. Create `apps/web/public/samples/1.html`, `2.html` and `3.html` with the exact HTML body strings of `sampleAssets` from `apps/web/src/index.ts`.
4. Update `apps/web/tsconfig.json`: add `"jsx": "react-jsx"`, `"lib": ["ES2024", "DOM", "DOM.Iterable"]`, `"types": ["node", "vite/client"]`, and `"paths": { "@/*": ["./src/*"] }`. Keep `"exclude": ["src/browser/**"]` for now.
5. Add `"test:web": "pnpm --filter @deckagent/local-web exec vitest run --configLoader native"` to `package.json` `scripts`.

- [x] **Step 4: Create Tailwind theme styles, `cn.ts`, `button.tsx` and update `apps/web/DESIGN.md`**

1. Create `apps/web/src/styles/app.css`:
   - Start with `@import "tailwindcss";` and `@custom-variant dark (&:where(.dark, .dark *));`.
   - Define `@theme inline` mapping `--color-background`, `--color-foreground`, `--color-card`, `--color-card-foreground`, `--color-popover`, `--color-popover-foreground`, `--color-primary`, `--color-primary-foreground`, `--color-secondary`, `--color-secondary-foreground`, `--color-muted`, `--color-muted-foreground`, `--color-accent`, `--color-accent-foreground`, `--color-destructive`, `--color-destructive-foreground`, `--color-border`, `--color-input`, `--color-ring`, `--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-border`, `--color-sidebar-accent`, `--color-sidebar-accent-foreground`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--font-sans` and `--font-mono`.
   - Define `:root` (light, `color-scheme: light`) and `.dark` (dark, `color-scheme: dark`) using the exact colors from `apps/web/DESIGN.md`. Keep `--primary: #0066cc` (dark `#0a6ede`), `--accent: rgba(0, 102, 204, 0.12)` (dark `rgba(107, 182, 255, 0.18)`), and `--legacy-accent: #0066cc` (dark `#6bb6ff`).
   - Add `@import "./legacy.css";`.
2. Create `apps/web/src/styles/legacy.css`:
   - Copy all CSS rules from `style`, `outlineStyle`, `deckResizeStyle`, `composerStyle`, `presentationStyle`, `activityStyle`, `motionStyle`, `attachmentStyle` and `researchStyle` of `apps/web/src/index.ts`.
   - Replace `:root[data-theme=dark]` and `@media(prefers-color-scheme:dark){:root:not([data-theme=light]){...}}` with `:root.dark`. Replace `var(--accent)` in legacy selectors with `var(--legacy-accent)`. Add `#root { height: 100%; }`.
   - Place legacy element rules inside `@layer base { ... }` and legacy class rules inside `@layer components { ... }` so Tailwind `@layer utilities` always wins.
3. Create `apps/web/src/components/ui/cn.ts` exporting `cn(...inputs: ClassValue[]): string` with `twMerge(clsx(inputs))`.
4. Create `apps/web/src/components/ui/button.tsx` exporting `buttonVariants` (using `class-variance-authority` with variants `default`, `secondary`, `outline`, `ghost`, `destructive` and sizes `default`, `sm`, `icon`) and `Button` (supporting `asChild` via `@radix-ui/react-slot` and semantic Tailwind theme classes).
5. Update `apps/web/DESIGN.md`: map the raw CSS tokens in `Overview` and `Colors` to the shadcn/ui CSS variables (`--background`, `--foreground`, `--primary`, `--card`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--sidebar`) under `:root` and `.dark`, and state that `.dark` class replaces `data-theme`.

- [x] **Step 5: Run tests and static checks**

Run: `node --test --test-reporter=tap tests/vite-build-mocks.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `corepack pnpm@11.28.5 test:web`
Expected: PASS. Exit code 0 and `button.test.tsx` passes.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
