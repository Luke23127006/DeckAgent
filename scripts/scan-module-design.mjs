import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

export const AREA_ORDER = Object.freeze([
  'apps/web/src/browser/',
  'apps/web/src/features/',
  'packages/presentation/deck/',
  'apps/web/src/integrations/',
  'packages/session/persistence/',
  'packages/host/api/',
  'packages/host/contracts/',
  'apps/web/src/',
  'packages/tools/filesystem/',
  'packages/presentation/html/',
  'packages/workspace/registry/',
  'packages/presentation/design/',
  'packages/presentation/document/',
  'packages/presentation/pptx/',
])

const AREA_PREFIX_ORDER = [
  'apps/web/src/browser/',
  'apps/web/src/features/',
  'apps/web/src/integrations/',
  'apps/web/src/',
  'packages/presentation/deck/',
  'packages/session/persistence/',
  'packages/host/api/',
  'packages/host/contracts/',
  'packages/tools/filesystem/',
  'packages/presentation/html/',
  'packages/workspace/registry/',
  'packages/presentation/design/',
  'packages/presentation/document/',
  'packages/presentation/pptx/',
]

const EXCLUDED_PRODUCTION_SEGMENTS = new Set(['lib', 'tests', 'node_modules'])

const EXCLUDED_TEST_SEGMENTS = new Set(['lib', 'dist', 'node_modules'])

const TEST_GROUP_ORDER = ['e2e/', 'apps/web/tests/', 'packages/**/tests/', 'tests/']

const LONG_FUNCTION_THRESHOLD = 80

const LARGE_FILE_THRESHOLD = 400

const SMALL_FILE_THRESHOLD = 30

const WIDE_EXPORT_THRESHOLD = 10

const toPosix = value => value.replaceAll('\\', '/')

const compareText = (left, right) => (left < right ? -1 : left > right ? 1 : 0)

const countLines = sourceText => {
  const normalized = sourceText.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
  return normalized === '' ? 0 : normalized.replace(/\n$/, '').split('\n').length
}

const lineOf = (sourceFile, node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1

const endLineOf = (sourceFile, node) => sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1

const hasExportModifier = node =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false)

const countBindingNames = name => {
  if (ts.isIdentifier(name)) return 1
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    let count = 0
    for (const element of name.elements) {
      if (ts.isBindingElement(element)) count += countBindingNames(element.name)
    }
    return count
  }
  return 1
}

const countStatementExports = statement => {
  if (ts.isExportAssignment(statement)) return 1
  if (ts.isExportDeclaration(statement)) {
    if (statement.exportClause !== undefined && ts.isNamedExports(statement.exportClause)) {
      return statement.exportClause.elements.length
    }
    return 1
  }
  if (!hasExportModifier(statement)) return 0
  if (ts.isVariableStatement(statement)) {
    let count = 0
    for (const declaration of statement.declarationList.declarations) {
      count += countBindingNames(declaration.name)
    }
    return count
  }
  if (
    ts.isFunctionDeclaration(statement) ||
    ts.isClassDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isEnumDeclaration(statement) ||
    ts.isModuleDeclaration(statement)
  ) {
    return 1
  }
  return 0
}

const propertyNameText = (name, sourceFile) => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name) || ts.isPrivateIdentifier(name)) {
    return name.text
  }
  return name.getText(sourceFile)
}

const resolveFunctionName = (node, sourceFile) => {
  if (ts.isMethodDeclaration(node)) {
    const methodName = propertyNameText(node.name, sourceFile)
    const parent = node.parent
    if ((ts.isClassDeclaration(parent) || ts.isClassExpression(parent)) && parent.name !== undefined) {
      return `${parent.name.text}.${methodName}`
    }
    if (
      ts.isObjectLiteralExpression(parent) &&
      parent.parent !== undefined &&
      ts.isVariableDeclaration(parent.parent) &&
      ts.isIdentifier(parent.parent.name)
    ) {
      return `${parent.parent.name.text}.${methodName}`
    }
    return methodName
  }
  if (ts.isFunctionDeclaration(node)) {
    return node.name === undefined ? '<anonymous>' : node.name.text
  }
  if (ts.isFunctionExpression(node) && node.name !== undefined) {
    return node.name.text
  }
  const parent = node.parent
  if (parent !== undefined) {
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text
    }
    if (ts.isPropertyDeclaration(parent)) {
      const propName = propertyNameText(parent.name, sourceFile)
      const owner = parent.parent
      if ((ts.isClassDeclaration(owner) || ts.isClassExpression(owner)) && owner.name !== undefined) {
        return `${owner.name.text}.${propName}`
      }
      return propName
    }
    if (ts.isPropertyAssignment(parent)) {
      return propertyNameText(parent.name, sourceFile)
    }
  }
  return '<anonymous>'
}

const isConstAssertion = node =>
  ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName) && node.type.typeName.text === 'const'

const isServiceDeclaration = node =>
  (ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isVariableDeclaration(node)) &&
  node.name !== undefined &&
  ts.isIdentifier(node.name) &&
  node.name.text.endsWith('Service')

export const classifyArea = relativePath => {
  const normalized = toPosix(relativePath)
  if (!normalized.endsWith('.ts') && !normalized.endsWith('.tsx')) return null
  const segments = normalized.split('/')
  if (segments.some(segment => EXCLUDED_PRODUCTION_SEGMENTS.has(segment))) return null
  for (const prefix of AREA_PREFIX_ORDER) {
    if (normalized.startsWith(prefix)) return prefix
  }
  return null
}

export const analyzeSourceFile = (relativePath, sourceText) => {
  const normalizedPath = toPosix(relativePath)
  const sourceFile = ts.createSourceFile(normalizedPath, sourceText, ts.ScriptTarget.Latest, true)
  const lines = countLines(sourceText)
  const isBarrel =
    sourceFile.statements.length > 0 &&
    sourceFile.statements.every(
      statement => ts.isExportDeclaration(statement) && statement.moduleSpecifier !== undefined,
    )

  let exportCount = 0
  for (const statement of sourceFile.statements) {
    exportCount += countStatementExports(statement)
  }

  const longFunctions = []
  const typeAssertions = []
  const serviceSymbols = []

  const visit = node => {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node)) &&
      node.body !== undefined
    ) {
      const startLine = lineOf(sourceFile, node)
      const endLine = endLineOf(sourceFile, node)
      const spanLines = endLine - startLine + 1
      if (spanLines > LONG_FUNCTION_THRESHOLD) {
        longFunctions.push({
          name: resolveFunctionName(node, sourceFile),
          line: startLine,
          lines: spanLines,
        })
      }
    }

    if ((ts.isAsExpression(node) && !isConstAssertion(node)) || ts.isTypeAssertionExpression(node)) {
      typeAssertions.push({
        line: lineOf(sourceFile, node),
        text: node.getText(sourceFile).replace(/\s+/g, ' ').trim(),
      })
    }

    if (isServiceDeclaration(node)) {
      serviceSymbols.push({
        name: node.name.text,
        line: lineOf(sourceFile, node),
      })
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return {
    path: normalizedPath,
    area: classifyArea(normalizedPath),
    lines,
    isBarrel,
    exportCount,
    longFunctions,
    typeAssertions,
    serviceSymbols,
  }
}

const classifyTestGroup = normalizedPath => {
  if (normalizedPath.startsWith('e2e/')) return 'e2e/'
  if (normalizedPath.startsWith('apps/web/tests/')) return 'apps/web/tests/'
  if (normalizedPath.startsWith('tests/')) return 'tests/'
  if (/^packages\/[^/]+\/[^/]+\/tests\//.test(normalizedPath)) return 'packages/**/tests/'
  return 'other/'
}

export const analyzeTestFile = (relativePath, sourceText) => {
  const normalizedPath = toPosix(relativePath)
  const normalizedSource = sourceText.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
  const firstNonEmpty = normalizedSource
    .split('\n')
    .map(line => line.trim())
    .find(line => line !== '')
  const hasTopHeader = firstNonEmpty !== undefined && (firstNonEmpty.startsWith('//') || firstNonEmpty.startsWith('/*'))

  const sourceFile = ts.createSourceFile(normalizedPath, sourceText, ts.ScriptTarget.Latest, true)
  const fixedTimeouts = []
  const scriptsLibImports = []

  const addScriptsLibSpecifier = node => {
    if (ts.isStringLiteral(node) && node.text.includes('scripts/lib/')) {
      scriptsLibImports.push(node.text)
    }
  }

  const visit = node => {
    if (ts.isImportDeclaration(node)) {
      addScriptsLibSpecifier(node.moduleSpecifier)
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
      addScriptsLibSpecifier(node.moduleSpecifier)
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const [argument] = node.arguments
        if (argument !== undefined) addScriptsLibSpecifier(argument)
      } else {
        const callee = node.expression
        const isSetTimeout =
          (ts.isIdentifier(callee) && callee.text === 'setTimeout') ||
          (ts.isPropertyAccessExpression(callee) &&
            callee.name.text === 'setTimeout' &&
            ts.isIdentifier(callee.expression) &&
            (callee.expression.text === 'globalThis' || callee.expression.text === 'window'))
        if (isSetTimeout) fixedTimeouts.push(lineOf(sourceFile, node))
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return {
    path: normalizedPath,
    group: classifyTestGroup(normalizedPath),
    lines: countLines(sourceText),
    hasTopHeader,
    fixedTimeouts,
    scriptsLibImports,
  }
}

export const computeCoChangePairs = (commits, options = {}) => {
  const { maxFilesPerCommit = 20, minCount = 3 } = options
  const pairCounts = new Map()

  for (const commit of commits) {
    const uniqueFiles = [...new Set(commit.map(toPosix))].toSorted(compareText)
    if (uniqueFiles.length < 2 || uniqueFiles.length > maxFilesPerCommit) continue
    for (let leftIndex = 0; leftIndex < uniqueFiles.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < uniqueFiles.length; rightIndex += 1) {
        const key = `${uniqueFiles[leftIndex]}\0${uniqueFiles[rightIndex]}`
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
      }
    }
  }

  const pairs = []
  for (const [key, count] of pairCounts.entries()) {
    if (count < minCount) continue
    const [left, right] = key.split('\0')
    pairs.push({ files: [left, right], count })
  }

  return pairs.toSorted(
    (left, right) =>
      right.count - left.count ||
      compareText(left.files[0], right.files[0]) ||
      compareText(left.files[1], right.files[1]),
  )
}

const renderTable = (headers, rows) => {
  if (rows.length === 0) return 'None.\n'
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ]
  return `${lines.join('\n')}\n`
}

export const formatScanReport = result => {
  const sections = ['# Module Design Quantitative Scan\n']

  sections.push('## Area Summary\n')
  sections.push(
    renderTable(
      ['Area', 'Files', 'Lines', '>400L', 'Fn >80L', '<30L Non-Barrel', 'Type Assertions', '*Service', 'Max Exports'],
      result.areas.map(area => [
        area.area,
        String(area.files),
        String(area.lines),
        String(area.filesOver400),
        String(area.functionsOver80),
        String(area.smallNonBarrelFiles),
        String(area.typeAssertions),
        String(area.serviceSymbols),
        String(area.maxExports),
      ]),
    ),
  )

  const largeFiles = result.files
    .filter(file => file.lines > LARGE_FILE_THRESHOLD)
    .toSorted((left, right) => right.lines - left.lines || compareText(left.path, right.path))
  sections.push('## Files Over 400 Lines\n')
  sections.push(
    renderTable(
      ['Path', 'Area', 'Lines', 'Exports', 'Type Assertions'],
      largeFiles.map(file => [
        file.path,
        file.area ?? 'unknown',
        String(file.lines),
        String(file.exportCount),
        String(file.typeAssertions.length),
      ]),
    ),
  )

  const longFunctions = result.files
    .flatMap(file =>
      file.longFunctions.map(fn => ({
        path: file.path,
        line: fn.line,
        name: fn.name,
        lines: fn.lines,
      })),
    )
    .toSorted((left, right) => right.lines - left.lines || compareText(left.path, right.path) || left.line - right.line)
  sections.push('## Functions Over 80 Lines\n')
  sections.push(
    renderTable(
      ['Path', 'Line', 'Function', 'Lines'],
      longFunctions.map(fn => [fn.path, String(fn.line), fn.name, String(fn.lines)]),
    ),
  )

  const smallNonBarrelFiles = result.files
    .filter(file => !file.isBarrel && file.lines < SMALL_FILE_THRESHOLD)
    .toSorted((left, right) => left.lines - right.lines || compareText(left.path, right.path))
  sections.push('## Non-Barrel Files Under 30 Lines\n')
  sections.push(
    renderTable(
      ['Path', 'Area', 'Lines', 'Exports'],
      smallNonBarrelFiles.map(file => [
        file.path,
        file.area ?? 'unknown',
        String(file.lines),
        String(file.exportCount),
      ]),
    ),
  )

  const wideExportFiles = result.files
    .filter(file => file.exportCount >= WIDE_EXPORT_THRESHOLD)
    .toSorted((left, right) => right.exportCount - left.exportCount || compareText(left.path, right.path))
  sections.push('## Wide-Export Files (>= 10 Exports)\n')
  sections.push(
    renderTable(
      ['Path', 'Area', 'Exports', 'Lines'],
      wideExportFiles.map(file => [file.path, file.area ?? 'unknown', String(file.exportCount), String(file.lines)]),
    ),
  )

  const serviceSymbols = result.files
    .flatMap(file =>
      file.serviceSymbols.map(symbol => ({
        path: file.path,
        line: symbol.line,
        name: symbol.name,
      })),
    )
    .toSorted((left, right) => compareText(left.path, right.path) || left.line - right.line)
  sections.push('## Service Symbols\n')
  sections.push(
    renderTable(
      ['Path', 'Line', 'Symbol'],
      serviceSymbols.map(symbol => [symbol.path, String(symbol.line), symbol.name]),
    ),
  )

  const testGroups = new Map()
  for (const testFile of result.tests) {
    const current = testGroups.get(testFile.group) ?? {
      group: testFile.group,
      files: 0,
      lines: 0,
      missingHeader: 0,
      withFixedTimeout: 0,
      withScriptsLibImport: 0,
    }
    current.files += 1
    current.lines += testFile.lines
    if (!testFile.hasTopHeader) current.missingHeader += 1
    if (testFile.fixedTimeouts.length > 0) current.withFixedTimeout += 1
    if (testFile.scriptsLibImports.length > 0) current.withScriptsLibImport += 1
    testGroups.set(testFile.group, current)
  }

  const orderedGroups = [...testGroups.values()].toSorted((left, right) => {
    const leftOrder = TEST_GROUP_ORDER.indexOf(left.group)
    const rightOrder = TEST_GROUP_ORDER.indexOf(right.group)
    if (leftOrder !== -1 && rightOrder !== -1) return leftOrder - rightOrder
    if (leftOrder !== -1) return -1
    if (rightOrder !== -1) return 1
    return compareText(left.group, right.group)
  })

  sections.push('## Testware Summary\n')
  sections.push(
    renderTable(
      ['Group', 'Files', 'Lines', 'Missing Header', 'Fixed setTimeout Files', 'scripts/lib Importers'],
      orderedGroups.map(group => [
        group.group,
        String(group.files),
        String(group.lines),
        String(group.missingHeader),
        String(group.withFixedTimeout),
        String(group.withScriptsLibImport),
      ]),
    ),
  )

  const flaggedTests = result.tests
    .filter(
      testFile => !testFile.hasTopHeader || testFile.fixedTimeouts.length > 0 || testFile.scriptsLibImports.length > 0,
    )
    .toSorted((left, right) => compareText(left.path, right.path))
  sections.push('### Flagged Test Files\n')
  sections.push(
    renderTable(
      ['Path', 'Group', 'Lines', 'Has Header', 'setTimeout Lines', 'scripts/lib Imports'],
      flaggedTests.map(testFile => [
        testFile.path,
        testFile.group,
        String(testFile.lines),
        testFile.hasTopHeader ? 'yes' : 'no',
        testFile.fixedTimeouts.length > 0 ? testFile.fixedTimeouts.join(', ') : '-',
        testFile.scriptsLibImports.length > 0 ? testFile.scriptsLibImports.join(', ') : '-',
      ]),
    ),
  )

  sections.push('## Co-Change Clusters\n')
  sections.push(
    renderTable(
      ['Pair', 'Shared Commits'],
      result.coChanges.map(pair => [`${pair.files[0]} <-> ${pair.files[1]}`, String(pair.count)]),
    ),
  )

  return `${sections.join('\n')}`
}

const isTestTarget = filePath => {
  const normalized = toPosix(filePath)
  if (!/^(?:apps|packages|e2e|tests)\//.test(normalized)) return false
  if (!/\.test\.(?:mjs|ts)$/.test(normalized)) return false
  return !normalized.split('/').some(segment => EXCLUDED_TEST_SEGMENTS.has(segment))
}

const listRepositoryFiles = () =>
  execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
    .split('\n')
    .map(entry => toPosix(entry.trim()))
    .filter(entry => entry !== '' && existsSync(entry))

const readRecentProductionCommits = () => {
  const rawLog = execFileSync(
    'git',
    ['-c', 'core.quotePath=false', 'log', '--no-merges', '-n', '200', '--name-only', '--pretty=format:---COMMIT---'],
    {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    },
  )
  return rawLog
    .split('---COMMIT---')
    .map(chunk =>
      chunk
        .split('\n')
        .map(line => toPosix(line.trim()))
        .filter(line => line !== '' && classifyArea(line) !== null),
    )
    .filter(files => files.length > 0)
}

const summarizeAreas = files => {
  const grouped = new Map(AREA_ORDER.map(area => [area, []]))
  for (const file of files) {
    if (file.area !== null && grouped.has(file.area)) {
      grouped.get(file.area).push(file)
    }
  }
  return AREA_ORDER.map(area => {
    const areaFiles = grouped.get(area)
    let lines = 0
    let filesOver400 = 0
    let functionsOver80 = 0
    let smallNonBarrelFiles = 0
    let typeAssertions = 0
    let serviceSymbols = 0
    let maxExports = 0
    for (const file of areaFiles) {
      lines += file.lines
      if (file.lines > LARGE_FILE_THRESHOLD) filesOver400 += 1
      functionsOver80 += file.longFunctions.length
      if (!file.isBarrel && file.lines < SMALL_FILE_THRESHOLD) smallNonBarrelFiles += 1
      typeAssertions += file.typeAssertions.length
      serviceSymbols += file.serviceSymbols.length
      if (file.exportCount > maxExports) maxExports = file.exportCount
    }
    return {
      area,
      files: areaFiles.length,
      lines,
      filesOver400,
      functionsOver80,
      smallNonBarrelFiles,
      typeAssertions,
      serviceSymbols,
      maxExports,
    }
  })
}

const run = () => {
  const repositoryFiles = listRepositoryFiles()
  const productionFiles = repositoryFiles
    .filter(filePath => classifyArea(filePath) !== null)
    .toSorted(compareText)
    .map(filePath => analyzeSourceFile(filePath, readFileSync(filePath, 'utf8')))

  const testFiles = repositoryFiles
    .filter(isTestTarget)
    .toSorted(compareText)
    .map(filePath => analyzeTestFile(filePath, readFileSync(filePath, 'utf8')))

  const areas = summarizeAreas(productionFiles)
  const coChanges = computeCoChangePairs(readRecentProductionCommits(), {
    maxFilesPerCommit: 20,
    minCount: 3,
  })
  const result = { areas, files: productionFiles, tests: testFiles, coChanges }

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return
  }
  process.stdout.write(formatScanReport(result))
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) run()
