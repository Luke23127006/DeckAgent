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
