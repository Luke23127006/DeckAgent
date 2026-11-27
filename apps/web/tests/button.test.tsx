// What this file checks: cn merges conflicting Tailwind classes, and Button renders the semantic variant classes.
// Environment: Vitest with jsdom and Testing Library. There is no network, no HTTP fake and no fake clock.
// How to run: corepack pnpm@11.28.5 test:web
// Expected result: the one test passes. The class literals come from the Button contract in docs/build/refactor/web-react/plan/task-04-configure-vite-tailwind-and-shadcn.md.
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
