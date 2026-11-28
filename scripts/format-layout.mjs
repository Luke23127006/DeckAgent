import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const TARGET_PREFIXES = ['apps/', 'packages/', 'scripts/', 'tests/']

const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs', '.cjs']

const EXCLUDED_SEGMENTS = new Set(['node_modules', 'lib', 'dist', 'coverage'])

const toPosix = value => value.replaceAll('\\', '/')

export const isLayoutTarget = relativePath => {
  const normalized = toPosix(relativePath)
  if (!TARGET_PREFIXES.some(prefix => normalized.startsWith(prefix))) return false
  if (normalized.endsWith('.d.ts')) return false
  if (!TARGET_EXTENSIONS.some(extension => normalized.endsWith(extension))) return false
  return !normalized.split('/').some(segment => EXCLUDED_SEGMENTS.has(segment))
}

const scriptKindOf = filePath => {
  if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs')) return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

const lineOfPosition = (sourceFile, position) => sourceFile.getLineAndCharacterOfPosition(position).line + 1

const endLineOf = (sourceFile, node) => lineOfPosition(sourceFile, node.getEnd())

const isImportStatement = node => ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)

const propertyNameText = name => {
  if (name === undefined) return undefined
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name) || ts.isPrivateIdentifier(name)) {
    return name.text
  }
  return undefined
}

const isOverloadPair = (previous, next) => {
  if (ts.isFunctionDeclaration(previous) && ts.isFunctionDeclaration(next)) {
    return (
      previous.body === undefined &&
      previous.name !== undefined &&
      next.name !== undefined &&
      previous.name.text === next.name.text
    )
  }
  if (ts.isMethodDeclaration(previous) && ts.isMethodDeclaration(next)) {
    const previousName = propertyNameText(previous.name)
    return previous.body === undefined && previousName !== undefined && previousName === propertyNameText(next.name)
  }
  return false
}

const leadingCommentPosition = (sourceFile, node) => {
  const fullStart = node.getFullStart()
  const ranges = ts.getLeadingCommentRanges(sourceFile.text, fullStart)
  const firstRange = ranges?.[0]
  if (firstRange === undefined) return undefined
  const prefix = sourceFile.text.slice(fullStart, firstRange.pos)
  return prefix.includes('\n') || prefix.includes('\r') ? firstRange.pos : undefined
}

const startLineOf = (sourceFile, node) => {
  const commentPosition = leadingCommentPosition(sourceFile, node)
  return lineOfPosition(sourceFile, commentPosition ?? node.getStart(sourceFile))
}

const spanLinesOf = (sourceFile, node) =>
  lineOfPosition(sourceFile, node.getEnd()) - lineOfPosition(sourceFile, node.getStart(sourceFile)) + 1

const addFinding = (findings, line, rule) => {
  if (findings.get(line) === 'layout-after-imports') return
  findings.set(line, rule)
}

const collectTopLevelFindings = (sourceFile, findings) => {
  const statements = sourceFile.statements
  let lastImportIndex = -1
  for (let index = 0; index < statements.length; index += 1) {
    if (!isImportStatement(statements[index])) break
    lastImportIndex = index
  }

  for (let index = 1; index < statements.length; index += 1) {
    const previous = statements[index - 1]
    const next = statements[index]
    const previousIsImport = isImportStatement(previous)
    const nextIsImport = isImportStatement(next)
    if (previousIsImport && nextIsImport) continue
    const isAfterImports = previousIsImport && index - 1 === lastImportIndex
    if (!isAfterImports) {
      if (spanLinesOf(sourceFile, previous) === 1 && spanLinesOf(sourceFile, next) === 1) continue
      if (isOverloadPair(previous, next)) continue
    }
    const startLine = startLineOf(sourceFile, next)
    if (startLine !== endLineOf(sourceFile, previous) + 1) continue
    addFinding(findings, startLine, isAfterImports ? 'layout-after-imports' : 'layout-between-declarations')
  }
}

const collectMemberFindings = (sourceFile, findings) => {
  const visit = node => {
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      const members = node.members.filter(member => !ts.isSemicolonClassElement(member))
      for (let index = 1; index < members.length; index += 1) {
        const previous = members[index - 1]
        const next = members[index]
        if (spanLinesOf(sourceFile, previous) === 1 && spanLinesOf(sourceFile, next) === 1) continue
        if (isOverloadPair(previous, next)) continue
        const startLine = startLineOf(sourceFile, next)
        if (startLine !== endLineOf(sourceFile, previous) + 1) continue
        addFinding(findings, startLine, 'layout-between-members')
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

export const formatLayout = (filePath, sourceText) => {
  const normalizedPath = toPosix(filePath)
  const sourceFile = ts.createSourceFile(
    normalizedPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKindOf(normalizedPath),
  )
  const findings = new Map()
  collectTopLevelFindings(sourceFile, findings)
  collectMemberFindings(sourceFile, findings)

  const lineNumbers = [...findings.keys()].toSorted((left, right) => left - right)
  const lineEnding = sourceText.includes('\r\n') ? '\r\n' : '\n'
  const outputLines = []
  for (const [index, line] of sourceText.split(/\r\n|\n/).entries()) {
    if (findings.has(index + 1)) outputLines.push('')
    outputLines.push(line)
  }

  return {
    text: outputLines.join(lineEnding),
    findings: lineNumbers.map(line => ({ line, rule: findings.get(line) })),
  }
}

const DENSE_MIN_STATEMENTS = 6

const DENSE_MIN_LINES = 12

const ANONYMOUS_NAME = '<anonymous>'

const functionBodyOf = node => {
  const isFunction =
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  if (!isFunction) return undefined
  return ts.isBlock(node.body) ? node.body : undefined
}

const functionNameOf = node => {
  if (ts.isFunctionDeclaration(node)) return node.name?.text ?? ANONYMOUS_NAME
  if (ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
    return propertyNameText(node.name) ?? ANONYMOUS_NAME
  }
  if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    const parent = node.parent
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text
  }
  return ANONYMOUS_NAME
}

const hasBlankLineBetweenStatements = (sourceFile, statements) => {
  for (let index = 1; index < statements.length; index += 1) {
    const previous = statements[index - 1]
    const next = statements[index]
    if (startLineOf(sourceFile, next) > endLineOf(sourceFile, previous) + 1) return true
  }
  return false
}

export const listDenseBodies = (filePath, sourceText) => {
  const normalizedPath = toPosix(filePath)
  const sourceFile = ts.createSourceFile(
    normalizedPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKindOf(normalizedPath),
  )
  const bodies = []
  const visit = node => {
    const body = functionBodyOf(node)
    if (
      body !== undefined &&
      body.statements.length >= DENSE_MIN_STATEMENTS &&
      spanLinesOf(sourceFile, body) >= DENSE_MIN_LINES &&
      !hasBlankLineBetweenStatements(sourceFile, body.statements)
    ) {
      bodies.push({
        line: lineOfPosition(sourceFile, node.getStart(sourceFile)),
        name: functionNameOf(node),
        statements: body.statements.length,
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  return bodies.toSorted((left, right) => left.line - right.line)
}

const DEFAULT_FOLDERS = TARGET_PREFIXES.map(prefix => prefix.slice(0, -1))

const isTargetFileName = fileName => {
  if (fileName.endsWith('.d.ts')) return false
  return TARGET_EXTENSIONS.some(extension => fileName.endsWith(extension))
}

const collectFolderFiles = (folderPath, files) => {
  const entries = readdirSync(folderPath, { withFileTypes: true }).toSorted((left, right) =>
    left.name.localeCompare(right.name),
  )
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name)
    if (entry.isDirectory()) {
      if (!EXCLUDED_SEGMENTS.has(entry.name)) collectFolderFiles(entryPath, files)
      continue
    }
    if (entry.isFile() && isTargetFileName(entry.name)) files.push(entryPath)
  }
}

const collectFiles = targets => {
  const files = []
  for (const target of targets) {
    const absolutePath = path.resolve(target)
    const stats = statSync(absolutePath, { throwIfNoEntry: false })
    if (stats === undefined) continue
    if (stats.isDirectory()) {
      collectFolderFiles(absolutePath, files)
      continue
    }
    if (stats.isFile()) files.push(absolutePath)
  }
  return files
}

const relativePathOf = absolutePath => toPosix(path.relative(process.cwd(), absolutePath))

const runCheck = files => {
  let findings = 0
  for (const file of files) {
    const relativePath = relativePathOf(file)
    const result = formatLayout(relativePath, readFileSync(file, 'utf8'))
    for (const finding of result.findings) {
      process.stdout.write(`${relativePath}:${finding.line} ${finding.rule} Add one blank line before this line.\n`)
    }
    findings += result.findings.length
  }
  process.stdout.write(`format-layout: ${findings} finding(s)\n`)
  return findings === 0 ? 0 : 1
}

const runWrite = files => {
  let changed = 0
  for (const file of files) {
    const sourceText = readFileSync(file, 'utf8')
    const result = formatLayout(relativePathOf(file), sourceText)
    if (result.text === sourceText) continue
    writeFileSync(file, result.text)
    changed += 1
  }
  process.stdout.write(`format-layout: ${changed} file(s) changed\n`)
  return 0
}

const runDense = files => {
  let count = 0
  for (const file of files) {
    const relativePath = relativePathOf(file)
    for (const body of listDenseBodies(relativePath, readFileSync(file, 'utf8'))) {
      process.stdout.write(`${relativePath}:${body.line} ${body.name} ${body.statements} statements\n`)
      count += 1
    }
  }
  process.stdout.write(`format-layout: ${count} dense function bodies\n`)
  return 0
}

const main = () => {
  const [mode, ...targets] = process.argv.slice(2)
  if (mode !== '--check' && mode !== '--write' && mode !== '--dense') {
    process.stderr.write('format-layout: use --check, --write or --dense.\n')
    process.exit(2)
  }
  const files = collectFiles(targets.length === 0 ? DEFAULT_FOLDERS : targets)
  const exitCode = mode === '--check' ? runCheck(files) : mode === '--write' ? runWrite(files) : runDense(files)
  process.exit(exitCode)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
