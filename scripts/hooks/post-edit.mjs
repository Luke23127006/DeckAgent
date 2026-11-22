import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkMarkdown, isDocsTarget } from '../check-docs.mjs'

const passed = { exitCode: 0, stderr: '' }

export const runPostEdit = (input, options) => {
  const filePath = input?.tool_input?.file_path
  if (!filePath) return passed
  const relativePath = path.relative(options.cwd, filePath).replaceAll('\\', '/')
  if (!isDocsTarget(relativePath)) return passed
  if (!existsSync(filePath)) return passed
  const io = {
    exists: file => existsSync(path.resolve(options.cwd, file)),
    readFile: file => readFileSync(path.resolve(options.cwd, file), 'utf8'),
  }
  const failures = checkMarkdown(relativePath, readFileSync(filePath, 'utf8'), io)
  if (failures.length === 0) return passed
  const stderr =
    failures.map(failure => `${relativePath}:${failure.line} ${failure.rule} ${failure.message}`).join('\n') + '\n'
  return { exitCode: 2, stderr }
}

const main = () => {
  const input = JSON.parse(readFileSync(0, 'utf8'))
  const result = runPostEdit(input, { cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd() })
  process.stderr.write(result.stderr)
  process.exit(result.exitCode)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
