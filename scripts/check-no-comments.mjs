import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const scriptKindFor = fileName =>
  fileName.endsWith('.json')
    ? ts.ScriptKind.JSON
    : fileName.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : fileName.endsWith('.ts') || fileName.endsWith('.mts') || fileName.endsWith('.cts')
        ? ts.ScriptKind.TS
        : ts.ScriptKind.JS

export const findComments = (fileName, text) => {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKindFor(fileName))
  const ranges = new Map()
  const add = found => {
    for (const range of found ?? []) ranges.set(range.pos, range)
  }
  const visit = node => {
    add(ts.getLeadingCommentRanges(text, node.getFullStart()))
    add(ts.getTrailingCommentRanges(text, node.getEnd()))
    for (const child of node.getChildren(source)) visit(child)
  }
  visit(source)
  return [...ranges.values()]
    .toSorted((a, b) => a.pos - b.pos)
    .map(range => ({
      line: source.getLineAndCharacterOfPosition(range.pos).line + 1,
      kind: range.kind === ts.SyntaxKind.SingleLineCommentTrivia ? 'line' : 'block',
      text: text.slice(range.pos, range.end),
    }))
}

const SOURCE_PATTERN = /\.(ts|tsx|mts|cts|js|mjs|cjs)$/
const CONFIG_PATTERN = /^tsconfig[^/]*\.json$/
const SOURCE_ROOTS = ['apps/', 'packages/', 'scripts/', 'tests/']
const EXCLUDED_PARTS = ['/lib/', '/dist/', 'node_modules/']

export const isCommentTarget = relativePath => {
  const inSourceRoot = SOURCE_ROOTS.some(root => relativePath.startsWith(root)) && SOURCE_PATTERN.test(relativePath)
  const isConfig = CONFIG_PATTERN.test(relativePath.split('/').at(-1))
  const isExcluded = EXCLUDED_PARTS.some(part => relativePath.includes(part))
  return (inSourceRoot || isConfig) && !isExcluded
}

const groupOf = relativePath => {
  const parts = relativePath.split('/')
  return parts[0] === 'apps' || parts[0] === 'packages' ? parts.slice(0, 2).join('/') : parts[0]
}

const summary = (label, comments, files) => `${label}: ${comments} comment(s) in ${files} file(s)`

const run = () => {
  const output = execFileSync(
    'git',
    ['-c', 'core.quotePath=false', 'ls-files', '--cached', '--others', '--exclude-standard'],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    },
  )
  const targets = output
    .split('\n')
    .map(entry => entry.trim())
    .filter(entry => entry !== '' && isCommentTarget(entry) && existsSync(entry))
  const found = targets
    .map(target => ({ path: target, comments: findComments(target, readFileSync(target, 'utf8')) }))
    .filter(entry => entry.comments.length > 0)
  const total = found.reduce((sum, entry) => sum + entry.comments.length, 0)
  if (process.argv.includes('--report')) {
    const groups = new Map()
    for (const entry of found) {
      const group = groups.get(groupOf(entry.path)) ?? { comments: 0, files: 0 }
      group.comments += entry.comments.length
      group.files += 1
      groups.set(groupOf(entry.path), group)
    }
    for (const [name, group] of [...groups].toSorted(([a], [b]) => a.localeCompare(b))) {
      console.log(summary(name, group.comments, group.files))
    }
    console.log(summary('total', total, found.length))
    process.exit(0)
  }
  for (const entry of found) {
    for (const comment of entry.comments) {
      console.log(
        `${entry.path}:${comment.line} ${comment.kind} Comments are not allowed. Put the meaning in a name, a type, a test or an ADR. See docs/conventions/code.md.`,
      )
    }
  }
  console.log(summary('total', total, found.length))
  process.exit(total > 0 ? 1 : 0)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run()
